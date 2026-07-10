import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { get } from '../database/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey_change_in_production';

export const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    const admin = await get('SELECT * FROM admin WHERE username = ?', [username]);
    if (!admin) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Token without expiration
    const token = jwt.sign({ id: admin.id, username: admin.username }, JWT_SECRET);

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 50 * 365 * 24 * 60 * 60 * 1000 // 10 years (essentially no expiry)
    });

    res.json({ message: 'Logged in successfully', user: { username: admin.username } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

export const logout = (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out successfully' });
};

export const checkAuth = (req, res) => {
  // If this controller is reached, authMiddleware has already verified the token
  res.json({ message: 'Authenticated', user: req.user });
};
