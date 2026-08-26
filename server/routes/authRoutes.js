import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { JWT_SECRET, requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password, accountType = 'business', businessName = '' } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, error: 'Name, email, and password are required.' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ success: false, error: 'User with this email already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      accountType,
      businessName: accountType === 'business' ? (businessName || `${name}'s Business`) : '',
      onboardingComplete: false
    });

    const token = jwt.sign({ userId: user._id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        accountType: user.accountType,
        businessName: user.businessName,
        onboardingComplete: user.onboardingComplete
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid email or password.' });
    }

    const token = jwt.sign({ userId: user._id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        accountType: user.accountType,
        businessName: user.businessName,
        onboardingComplete: user.onboardingComplete
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/auth/me
router.get('/me', requireAuth, async (req, res) => {
  if (!req.user) {
    return res.json({ success: true, isDemo: true, user: null });
  }

  res.json({
    success: true,
    isDemo: false,
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      accountType: req.user.accountType,
      businessName: req.user.businessName,
      onboardingComplete: req.user.onboardingComplete
    }
  });
});

// POST /api/auth/onboarding-complete
router.post('/onboarding-complete', requireAuth, async (req, res) => {
  if (!req.user) {
    return res.json({ success: true, message: 'Demo onboarding complete' });
  }

  req.user.onboardingComplete = true;
  await req.user.save();

  res.json({
    success: true,
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      accountType: req.user.accountType,
      businessName: req.user.businessName,
      onboardingComplete: true
    }
  });
});

export default router;
