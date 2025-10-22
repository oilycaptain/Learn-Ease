const express = require('express');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// --- Multer Setup for File Uploads ---
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Files will be saved in the 'uploads' directory in your backend root
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    // Create a unique filename to prevent overwrites
    cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ storage: storage });

const signToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET || 'your-super-secret-jwt-key-12345', { expiresIn: '24h' });

// POST /api/auth/signup
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
      // Also return the profilePicUrl on signup
      user: { id: user._id, username: user.username, email: user.email, profilePicUrl: user.profilePicUrl },
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ message: 'email and password are required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const ok = await user.comparePassword(password);
    if (!ok) return res.status(400).json({ message: 'Invalid credentials' });

    const token = signToken(user._id);
    // Also return the profilePicUrl on login
    res.json({ token, user: { id: user._id, username: user.username, email: user.email, profilePicUrl: user.profilePicUrl } });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/auth/profile
router.get('/profile', authMiddleware, async (req, res) => {
  // Also return the profilePicUrl when fetching the profile
  res.json({ user: { id: req.user._id, username: req.user.username, email: req.user.email, profilePicUrl: req.user.profilePicUrl } });
});


// PUT /api/auth/profile
router.put('/profile', authMiddleware, upload.single('newProfilePic'), async (req, res) => {
    try {
        const { username } = req.body;
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (username) {
            user.username = username;
        }

        if (req.file) {
            const profilePicUrl = `/${req.file.path.replace(/\\/g, '/')}`;
            user.profilePicUrl = profilePicUrl;
        }

        const updatedUser = await user.save();

        res.json({
            message: 'Profile updated successfully',
            user: {
                id: updatedUser._id,
                username: updatedUser.username,
                email: updatedUser.email,
                profilePicUrl: updatedUser.profilePicUrl
            }
        });

    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// --- NEW: POST /api/auth/change-password ---
router.post('/change-password', authMiddleware, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: 'Current and new passwords are required.' });
        }

        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(401).json({ message: 'Incorrect current password.' });
        }

        user.password = newPassword;
        await user.save(); // The pre-save hook in User.js will hash the new password

        res.json({ message: 'Password changed successfully.' });

    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});


module.exports = router;

