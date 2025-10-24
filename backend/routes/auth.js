const express = require('express');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();
// -- asdasd -- //
// --- Multer Setup for File Uploads ---
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ storage: storage });

const signToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET || 'your-super-secret-jwt-key-12345', { expiresIn: '24h' });

// --- Nodemailer transporter ---
const transporter = nodemailer.createTransport({
  service: 'gmail', // or your SMTP provider
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// -------------------
// Signup
// -------------------
router.post('/signup', async (req, res) => {
  try {
    const { username, email, password } = req.body || {};
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'username, email, and password are required' });
    }

    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing) return res.status(400).json({ message: 'User already exists' });

    const user = await User.create({ username, email, password });
    const token = signToken(user._id);

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: { id: user._id, username: user.username, email: user.email, profilePicUrl: user.profilePicUrl },
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// -------------------
// Login
// -------------------
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ message: 'email and password are required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const ok = await user.comparePassword(password);
    if (!ok) return res.status(400).json({ message: 'Invalid credentials' });

    const token = signToken(user._id);
    res.json({ token, user: { id: user._id, username: user.username, email: user.email, profilePicUrl: user.profilePicUrl } });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// -------------------
// Profile
// -------------------
router.get('/profile', authMiddleware, async (req, res) => {
  res.json({ user: { id: req.user._id, username: req.user.username, email: req.user.email, profilePicUrl: req.user.profilePicUrl } });
});

router.put('/profile', authMiddleware, upload.single('newProfilePic'), async (req, res) => {
  try {
    const { username } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (username) user.username = username;
    if (req.file) user.profilePicUrl = `/${req.file.path.replace(/\\/g, '/')}`;

    const updatedUser = await user.save();
    res.json({
      message: 'Profile updated successfully',
      user: { id: updatedUser._id, username: updatedUser.username, email: updatedUser.email, profilePicUrl: updatedUser.profilePicUrl }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// -------------------
// Change Password
// -------------------
router.post('/change-password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ message: 'Current and new passwords are required.' });

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) return res.status(401).json({ message: 'Incorrect current password.' });

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password changed successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// -------------------
// Forgot Password
// -------------------
const cooldowns = {}; // Temporary storage (resets when server restarts)
const COOLDOWN_MS = 2 * 60 * 1000; // 2 minutes

router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email is required.' });

  try {
    const now = Date.now();
    if (cooldowns[email] && now - cooldowns[email] < COOLDOWN_MS) {
      const secondsLeft = Math.ceil((COOLDOWN_MS - (now - cooldowns[email])) / 1000);
      return res.status(429).json({
        message: `Please wait ${secondsLeft}s before requesting another password reset.`,
      });
    }
    cooldowns[email] = now;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found.' });

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = Date.now() + 3600000;
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetTokenExpiry;
    await user.save();

    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

    // ✨ Polished email format ✨
    await transporter.sendMail({
      from: `"LearnEase Support" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: '🔐 Reset Your LearnEase Password',
      html: `
        <div style="font-family: Arial, sans-serif; background-color: #f4f6f8; padding: 30px;">
          <div style="max-width: 600px; background: white; margin: auto; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); overflow: hidden;">
            <div style="background-color: #4f46e5; color: white; padding: 20px; text-align: center;">
              <h1 style="margin: 0; font-size: 22px;">LearnEase</h1>
            </div>

            <div style="padding: 30px;">
              <p style="font-size: 16px; color: #333;">Hi there,</p>
              <p style="font-size: 15px; color: #333;">
                We received a request to reset your password. Click the button below to set a new password:
              </p>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" 
                   style="background-color: #4f46e5; color: white; padding: 12px 24px; border-radius: 5px; text-decoration: none; font-size: 16px;">
                  Reset Password
                </a>
              </div>

              <p style="font-size: 14px; color: #666;">
                This link will expire in <strong>1 hour</strong>. If you didn’t request a password reset, please ignore this email.
              </p>

              <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
              <p style="font-size: 12px; color: #999; text-align: center;">
                © ${new Date().getFullYear()} LearnEase. All rights reserved.<br>
                This is an automated message — please do not reply.
              </p>
            </div>
          </div>
        </div>
      `,
    });

    res.json({ message: 'Password reset email sent successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});


// -------------------
// Reset Password
// -------------------
router.post('/reset-password/:token', async (req, res) => {
  const { token } = req.params;
  const { newPassword } = req.body;

  if (!newPassword) return res.status(400).json({ message: 'New password is required.' });

  try {
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });
    if (!user) return res.status(400).json({ message: 'Invalid or expired token.' });

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: 'Password reset successful.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
