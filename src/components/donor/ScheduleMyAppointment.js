import React, { Component } from 'react';
import axios from 'axios';
import { Navigate } from 'react-router-dom';
import '../../styles/donorStyles/ScheduleMyAppointment.css';

class ScheduleMyAppointment extends Component {
  constructor(props) {
    super(props);
    this.state = {
      date: '',
      time: '',
      address: '',
      errorMessage: '',
      successMessage: '',
      isLoggedIn: true,
    };
  }

  async componentDidMount() {
    try {
      const response = await axios.get('http://localhost:5000/api/donor/profile', {
        withCredentials: true, 
      });

      if (response.status === 200) {
        console.log('Session validated. User is logged in.');
        this.setState({ isLoggedIn: true });
      }
    } catch (error) {
      console.error('Session validation failed:', error.response?.data?.message || error.message);
      this.setState({
        isLoggedIn: false,
        errorMessage: 'Session expired. Please log in again.',
      });
    }
  }

  handleChange = (e) => {
    this.setState({ [e.target.name]: e.target.value });
  };

  handleSubmit = async (e) => {
    e.preventDefault();
    const { date, time, address } = this.state;

    try {
      const response = await axios.post(
        'http://localhost:5000/api/donor/appointment',
        { date, time, address },
        { withCredentials: true }
      );

      if (response.status === 201) {
        console.log('Appointment scheduled successfully:', response.data);
        this.setState({
          successMessage: 'Appointment scheduled successfully!',
          errorMessage: '',
        });
      }
    } catch (error) {
      console.error('Error scheduling appointment:', error.response?.data?.message || error.message);
      this.setState({
        errorMessage: error.response?.data?.message || 'Failed to schedule the appointment.',
        successMessage: '',
      });
    }
  };

  render() {
    const { date, time, address, errorMessage, successMessage, isLoggedIn } = this.state;

    if (!isLoggedIn) {
      console.log('User not logged in, redirecting to login.');
      return <Navigate replace to="/donor/DonorLogin" />;
    }

    return (
      <div className="schedule-appointment-container">
        <form className="schedule-appointment-form" onSubmit={this.handleSubmit}>
          <h2>Schedule an Appointment</h2>
          {errorMessage && <p className="error-message">{errorMessage}</p>}
          {successMessage && <p className="success-message">{successMessage}</p>}
          <label htmlFor="appointment-date">Date:</label>
          <input
            type="date"
            id="appointment-date"
            name="date"
            value={date}
            onChange={this.handleChange}
            required
          />
          <label htmlFor="appointment-time">Time:</label>
          <input
            type="time"
            id="appointment-time"
            name="time"
            value={time}
            onChange={this.handleChange}
            required
          />
          <label htmlFor="appointment-address">Address:</label>
          <input
            type="text"
            id="appointment-address"
            name="address"
            value={address}
            onChange={this.handleChange}
            required
          />
          <button type="submit">Schedule</button>
        </form>
      </div>
    );
  }
}

export default ScheduleMyAppointment;
