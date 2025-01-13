const { DonorModel, ScheduleModel, TimeSlotModel } = require('../models/donorModel');
const bcrypt = require('bcrypt');

exports.registerDonor = async (req, res) => {
  const { username, password, fname, lname, email, gender, age, phone, bloodGroup, address, idType, idNumber } = req.body;

  try {
    const existingDonor = await DonorModel.findOne({ username });
    if (existingDonor) {
      return res.status(400).json({ message: "Username already exists." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newDonor = new DonorModel({
      username,
      password: hashedPassword,
      fname,
      lname,
      email,
      gender,
      age,
      phone,
      bloodGroup,
      address,
      idType,
      idNumber
    });

    await newDonor.save();
    return res.status(201).json({ message: "Donor registered successfully." });
  } catch (error) {
    console.error("Error registering donor:", error);
    return res.status(500).json({ message: "Error registering donor." });
  }
};

exports.loginDonor = async (req, res) => {
  const { username, password } = req.body;

  try {
    const donor = await DonorModel.findOne({ username });
    if (!donor || !(await bcrypt.compare(password, donor.password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    req.session.donor = { _id: donor._id, username: donor.username };
    req.session.save((err) => {
      if (err) {
        console.error("Error saving session:", err);
        return res.status(500).json({ message: 'Error during session initialization.' });
      }
      res.status(200).json({ message: 'Login successful' });
    });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};


exports.logoutDonor = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: "Error logging out donor." });
    }
    res.clearCookie('connect.sid'); 
    res.status(200).json({ message: "Logout successful." });
  });
};

exports.getDonorProfile = async (req, res) => {
  try {
    if (!req.session.donor) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const donor = await DonorModel.findById(req.session.donor._id);
    if (!donor) {
      return res.status(404).json({ message: "Donor not found." });
    }

    res.status(200).json(donor);
  } catch (error) {
    console.error("Error fetching donor profile:", error);
    return res.status(500).json({ message: "Error fetching donor profile." });
  }
};

exports.updateDonorProfile = async (req, res) => {
  const { fname, lname, email, phone, bloodGroup, address } = req.body;

  try {
    const updatedDonor = await DonorModel.findByIdAndUpdate(
      req.session.donor._id,
      { fname, lname, email, phone, bloodGroup, address },
      { new: true }
    );

    if (!updatedDonor) {
      return res.status(404).json({ message: "Donor not found." });
    }

    res.status(200).json({ message: "Profile updated successfully.", donor: updatedDonor });
  } catch (error) {
    console.error("Error updating donor profile:", error);
    return res.status(500).json({ message: "Error updating donor profile." });
  }
};

exports.getAvailableTimeSlots = async (req, res) => {
  try {
    const { date } = req.query;
    const selectedDate = new Date(date);
    
    // Check if date is in the past
    if (selectedDate < new Date().setHours(0, 0, 0, 0)) {
      return res.status(400).json({ message: "Cannot book appointments for past dates" });
    }

    // Get all time slots for the selected date
    let timeSlots = await TimeSlotModel.find({ date: selectedDate });

    // If no slots exist for this date, create them
    if (timeSlots.length === 0) {
      const defaultSlots = ['9:00 AM-10:00 AM', '10:00 AM-11:00 AM', '11:00 AM-12:00 PM', '12:00 PM-1:00 AM', '2:00 PM-3:00 PM', '3:00 PM-4:00 PM', '4:00 PM-5:00 PM', '5:00 PM-6:00 PM', '6:00 PM-7:00 PM', '7:00 PM-8:00 PM']
        .map(slot => ({
          date: selectedDate,
          slot,
          bookedCount: 0
        }));
      
      timeSlots = await TimeSlotModel.insertMany(defaultSlots);
    }

    // Format slots for frontend
    const availableSlots = timeSlots.map(slot => ({
      slot: slot.slot,
      available: slot.bookedCount < 15,
      remainingSpots: 15 - slot.bookedCount
    }));

    res.status(200).json(availableSlots);
  } catch (error) {
    console.error("Error fetching time slots:", error);
    res.status(500).json({ message: "Error fetching available time slots" });
  }
};

exports.scheduleAppointment = async (req, res) => {
  const { date, timeSlot, address } = req.body;

  try {
    const selectedDate = new Date(date);
    
    // Validate date
    if (selectedDate < new Date().setHours(0, 0, 0, 0)) {
      return res.status(400).json({ message: "Cannot book appointments for past dates" });
    }

    // Find or create time slot
    let timeSlotDoc = await TimeSlotModel.findOne({ 
      date: selectedDate,
      slot: timeSlot
    });

    if (!timeSlotDoc) {
      timeSlotDoc = new TimeSlotModel({
        date: selectedDate,
        slot: timeSlot,
        bookedCount: 0
      });
    }

    // Check availability
    if (timeSlotDoc.bookedCount >= 15) {
      return res.status(400).json({ message: "This time slot is fully booked" });
    }

    // Get donor information
    const donor = await DonorModel.findById(req.session.donor._id);
    if (!donor) {
      return res.status(404).json({ message: "Donor not found" });
    }

    // Create appointment
    const newSchedule = new ScheduleModel({
      name: donor.username,
      bloodGroup: donor.bloodGroup,
      date: selectedDate,
      timeSlot,
      address
    });

    // Update slot count
    timeSlotDoc.bookedCount += 1;
    
    // Save both documents
    await Promise.all([
      newSchedule.save(),
      timeSlotDoc.save()
    ]);

    res.status(201).json({ message: "Appointment scheduled successfully" });
  } catch (error) {
    console.error("Error scheduling appointment:", error);
    return res.status(500).json({ message: "Error scheduling appointment" });
  }
};