const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getPool, sql } = require('../config/db');
const { authenticate } = require('../middleware/auth');

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password)
      return res.status(400).json({ success: false, message: 'Username and password required' });

    const pool = await getPool();
    const result = await pool.request()
      .input('username', sql.NVarChar, username)
      .query('SELECT UserID, FullName, Role, Status, PasswordHash FROM Users WHERE Username=@username');

    if (!result.recordset.length)
      return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const user = result.recordset[0];

    if (user.Status === 'Blocked')
      return res.status(403).json({ success: false, message: 'Account blocked. Contact admin.' });
    if (user.Status === 'Hold')
      return res.status(403).json({ success: false, message: 'Account on hold. Contact admin.' });

    // ✅ Compare password using bcrypt
    const isMatch = bcrypt.compareSync(password, user.PasswordHash);
    if (!isMatch)
      return res.status(401).json({ success: false, message: 'Invalid credentials' });

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 min expiry

    await pool.request()
      .input('otp', sql.NVarChar, otp)
      .input('expiry', sql.DateTime, otpExpiry)
      .input('id', sql.Int, user.UserID)
      .query('UPDATE Users SET OTPCode=@otp, OTPExpiry=@expiry, LastLoginDate=GETDATE() WHERE UserID=@id');

    // TODO: Send OTP via SMS
    console.log(`OTP for ${username}: ${otp}`);

    res.json({
      success: true,
      message: 'OTP sent to registered mobile',
      tempToken: jwt.sign(
        { userID: user.UserID, username, step: 'otp' },
        process.env.JWT_SECRET,
        { expiresIn: '10m' }
      ),
      devOTP: process.env.NODE_ENV === 'development' ? otp : undefined
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/auth/verify-otp
router.post('/verify-otp', async (req, res) => {
  try {
    const { tempToken, otp } = req.body;
    const decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
    if (decoded.step !== 'otp')
      return res.status(400).json({ success: false, message: 'Invalid token' });

    const pool = await getPool();
    const result = await pool.request()
      .input('id', sql.Int, decoded.userID)
      .query('SELECT UserID, FullName, Role, Username, OTPCode, OTPExpiry FROM Users WHERE UserID=@id');

    const user = result.recordset[0];

    if (!user.OTPCode || new Date() > new Date(user.OTPExpiry))
      return res.status(400).json({ success: false, message: 'OTP expired' });
    if (otp !== user.OTPCode)
      return res.status(400).json({ success: false, message: 'Invalid OTP' });

    // Clear OTP after successful verification
    await pool.request()
      .input('id', sql.Int, user.UserID)
      .query('UPDATE Users SET OTPCode=NULL, OTPExpiry=NULL WHERE UserID=@id');

    const token = jwt.sign(
      { userID: user.UserID, username: user.Username, role: user.Role, fullName: user.FullName },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    res.json({
      success: true,
      token,
      user: { id: user.UserID, username: user.Username, role: user.Role, fullName: user.FullName }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('id', sql.Int, req.user.userID)
      .query('SELECT UserID, FullName, Role, Username, MobileNumber, Status FROM Users WHERE UserID=@id');
    res.json({ success: true, user: result.recordset[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;