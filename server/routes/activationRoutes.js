import express from 'express';
import pkg from 'node-machine-id';
const { machineIdSync } = pkg;
import crypto from 'crypto';
import { get, run } from '../database/db.js';

const router = express.Router();
const SECRET = 'STOCK_MASTER_SECRET_2024';

router.get('/status', async (req, res) => {
  try {
    const hardwareId = machineIdSync();
    const expectedKey = crypto.createHmac('sha256', SECRET).update(hardwareId).digest('hex');
    
    const row = await get('SELECT * FROM activation ORDER BY id DESC LIMIT 1');
    
    if (row && row.activationKey === expectedKey) {
      return res.json({ isActivated: true, hardwareId });
    }
    
    return res.json({ isActivated: false, hardwareId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error checking activation' });
  }
});

router.post('/activate', async (req, res) => {
  try {
    const { key } = req.body;
    const hardwareId = machineIdSync();
    const expectedKey = crypto.createHmac('sha256', SECRET).update(hardwareId).digest('hex');
    
    if (key === expectedKey) {
      await run('INSERT INTO activation (activationKey, machineId) VALUES (?, ?)', [key, hardwareId]);
      return res.json({ success: true, message: 'Successfully activated!' });
    } else {
      return res.status(400).json({ success: false, message: 'Invalid activation key' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error during activation' });
  }
});

export default router;
