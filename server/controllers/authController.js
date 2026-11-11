import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { get, run } from '../database/db.js';
import { JWT_SECRET } from '../util/authConfig.js';

export const setupStatus = async (req, res) => {
  try {
    const admin = await get('SELECT id FROM admin LIMIT 1');
    res.json({ needsSetup: !admin });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to check initial account setup' });
  }
};

export const setupFirstAdmin = async (req, res) => {
  const remoteAddress = req.socket.remoteAddress;
  if (!['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(remoteAddress)) {
    return res.status(403).json({ message: 'Initial account setup is only available on this computer' });
  }

  const { username, password } = req.body;
  if (typeof username !== 'string' || !username.trim() || username.trim().length > 50) {
    return res.status(400).json({ message: 'Username must be between 1 and 50 characters' });
  }
  if (typeof password !== 'string' || password.length < 12) {
    return res.status(400).json({ message: 'Password must be at least 12 characters' });
  }

  try {
    await run('BEGIN IMMEDIATE');
    const existingAdmin = await get('SELECT id FROM admin LIMIT 1');
    if (existingAdmin) {
      await run('ROLLBACK');
      return res.status(409).json({ message: 'An admin account is already configured' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    await run('INSERT INTO admin (username, password) VALUES (?, ?)', [username.trim(), hashedPassword]);
    await run('COMMIT');
    return res.status(201).json({ message: 'Admin account created. You can now sign in.' });
  } catch (error) {
    try {
      await run('ROLLBACK');
    } catch (rollbackError) {
      console.error('Failed to roll back admin setup:', rollbackError);
    }
    console.error(error);
    return res.status(500).json({ message: 'Failed to create admin account' });
  }
};

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
      secure: false,
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
