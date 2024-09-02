require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors(
  {
      origin: ["https://login-xjgc.onrender.com"],
      methods: ["GET", "POST"],
  }
));
app.use(bodyParser.json());

const uri = process.env.MONGO_URI;

// MongoDB connection
mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });

const db = mongoose.connection;
db.once('open', () => {
  console.log('Connected to MongoDB');
});

// User schema and model
const userSchema = new mongoose.Schema({
  email: String,
  password: String,
});

const User = mongoose.model('User', userSchema);

// In-memory store for OTPs
const otpStore = {};

// NodeMailer setup 
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Check if email exists
app.post('/check-email', async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  res.json({ exists: !!user });
});

// Generate and send OTP
app.post('/send-otp', (req, res) => {
  const { email } = req.body;
  const otp = crypto.randomInt(100000, 999999).toString();
  otpStore[email] = otp;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Your OTP Code',
    text: `Your OTP code is ${otp}`
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return res.status(500).send('Error sending email');
    }
    res.status(200).send('OTP sent successfully');
  });
});

// Register route
app.post('/register', async (req, res) => {
  const { email, password, otp } = req.body;
  console.log("in register")
  if (otpStore[email] !== otp) {
    console.log(`Invalid OTP provided for email: ${email}`);
    return res.status(400).json({ message: 'Invalid OTP' });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log(`User with email: ${email} already exists`);
      return res.status(400).json({ message: 'User already exists' });
    }
    const newUser = new User({ email, password });
    await newUser.save();
    delete otpStore[email];
    res.json({ message: 'User registered successfully' });
  } catch (error) {
    console.log(`Error registering user with email: ${email}`, error);
    res.status(500).json({ message: 'Error registering user' });
  }
});

// Login route
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email, password });
  if (user) {
    // Generate a token for simplicity (in a real application, use JWT or another secure method)
    const token = crypto.randomBytes(16).toString('hex');
    res.json({ message: 'Login successful', token });
  } else {
    res.status(400).json({ message: 'Invalid email or password' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
