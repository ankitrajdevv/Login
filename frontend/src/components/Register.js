import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Login.css';

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [emailChecked, setEmailChecked] = useState(false);
  const navigate = useNavigate();

  const handleCheckEmail = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:5000/check-email', { email });
      if (response.data.exists) {
        setError('User already exists');
      } else {
        setEmailChecked(true);
        setError('');
      }
    } catch (error) {
      setError('Error checking email');
    }
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/send-otp', { email });
      setOtpSent(true);
      setError('');
    } catch (error) {
      setError('Error sending OTP');
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:5000/register', { email, password, otp });
      setError('');
      alert('Registration successful! You can now log in.');
      navigate('/login');
    } catch (error) {
      setError(error.response?.data?.message || 'Error registering user');
    }
  };

  return (
    <div className="login-container">
      <h1>User Registration</h1>
      {!emailChecked ? (
        <form onSubmit={handleCheckEmail}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button type="submit">Register</button>
        </form>
      ) : (
        <>
          <form onSubmit={handleSendOtp}>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button type="submit">Send OTP</button>
          </form>
          {otpSent && (
            <form onSubmit={handleRegister}>
              <input
                type="text"
                placeholder="OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
              />
              <button type="submit">Register</button>
            </form>
          )}
        </>
      )}
      <button
        type="button"
        className="switch-button"
        onClick={() => navigate('/login')}
      >
        Login
      </button>
      {error && <div className="error">{error}</div>}
    </div>
  );
};

export default Register;
