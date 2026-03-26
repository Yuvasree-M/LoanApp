const express = require('express');
const router = express.Router();
const { getPool, sql } = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query('SELECT SettingKey, SettingValue FROM SystemSettings ORDER BY SettingKey');
    res.json({ success: true, data: result.recordset });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.put('/', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const { settings } = req.body;
    const pool = await getPool();
    for (const s of settings) {
      await pool.request()
        .input('k', sql.NVarChar, s.settingKey)
        .input('v', sql.NVarChar, s.settingValue)
        .input('ub', sql.Int, req.user.userID)
        .query('UPDATE SystemSettings SET SettingValue=@v, UpdatedBy=@ub, UpdatedDate=GETDATE() WHERE SettingKey=@k');
    }
    res.json({ success: true, message: 'Settings saved' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
