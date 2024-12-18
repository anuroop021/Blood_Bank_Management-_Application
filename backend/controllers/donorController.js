const { DonorModel, ScheduleModel } = require('../models/donorModel');
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

exports.scheduleAppointment = async (req, res) => {
  const { date, time, address } = req.body;

  try {
    const donor = await DonorModel.findById(req.session.donor._id);
    if (!donor) {
      return res.status(404).json({ message: "Donor not found." });
    }

    const newSchedule = new ScheduleModel({
      name: donor.username,
      bloodGroup: donor.bloodGroup,
      date: new Date(date),
      time,
      address,
    });

    await newSchedule.save();
    res.status(201).json({ message: "Appointment scheduled successfully." });
  } catch (error) {
    console.error("Error scheduling appointment:", error);
    return res.status(500).json({ message: "Error scheduling appointment." });
  }
};

exports.getDonorAppointments = async (req, res) => {
  try {
    const schedules = await ScheduleModel.find({ name: req.session.donor.username });
    if (!schedules.length) {
      return res.status(404).json({ message: "No appointments found." });
    }
    res.status(200).json(schedules);
  } catch (error) {
    console.error("Error fetching appointments:", error);
    return res.status(500).json({ message: "Error fetching appointments." });
  }
};

exports.getAllAppointments = async (req, res) => {
  try {
    const schedules = await ScheduleModel.find();
    res.status(200).json(schedules);
  } catch (error) {
    console.error("Error fetching all appointments:", error);
    return res.status(500).json({ message: "Error fetching all appointments." });
  }
};
