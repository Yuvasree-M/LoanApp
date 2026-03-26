const express = require('express');
const router = express.Router();
const { getPool, sql } = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/my', authenticate, async (req, res) => {
  try {
    const pool = await getPool();
    const w = await pool.request().input('uid', sql.Int, req.user.userID)
      .query('SELECT * FROM Wallets WHERE UserID=@uid');
    const tx = await pool.request().input('uid', sql.Int, req.user.userID)
      .query(`SELECT wt.*, u1.FullName AS FromName, u2.FullName AS ToName
        FROM WalletTransactions wt
        INNER JOIN Wallets w ON wt.WalletID=w.WalletID
        LEFT JOIN Users u1 ON wt.FromUserID=u1.UserID
        LEFT JOIN Users u2 ON wt.ToUserID=u2.UserID
        WHERE w.UserID=@uid ORDER BY wt.TransactionDate DESC`);
    res.json({ success: true, wallet: w.recordset[0], transactions: tx.recordset });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.get('/all', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT w.WalletID, w.WalletType, w.Balance, w.LastUpdated, u.FullName, u.Role
      FROM Wallets w INNER JOIN Users u ON w.UserID=u.UserID
      ORDER BY w.WalletType, u.FullName`);
    res.json({ success: true, data: result.recordset });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/audit-transfer', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const { managerID } = req.body;
    const pool = await getPool();
    const result = await pool.request()
      .input('mgr', sql.Int, managerID)
      .input('admin', sql.Int, req.user.userID)
      .execute('sp_AdminAuditTransfer');
    const r = result.recordset[0];
    if (r.Success) res.json({ success: true, amount: r.Amount, message: `₹${r.Amount} transferred to Main Wallet` });
    else res.status(500).json({ success: false, message: 'Transfer failed' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
