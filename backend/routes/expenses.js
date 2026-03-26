const express = require('express');
const router = express.Router();
const { getPool, sql } = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT e.*, u.FullName AS CreatedByName, a.FullName AS ApprovedByName
      FROM OfficeExpenses e INNER JOIN Users u ON e.CreatedBy=u.UserID
      LEFT JOIN Users a ON e.ApprovedBy=a.UserID ORDER BY e.ExpenseDate DESC`);
    res.json({ success: true, data: result.recordset });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/', authenticate, async (req, res) => {
  try {
    const { expenseType, amount, description } = req.body;
    if (!expenseType || !amount) return res.status(400).json({ success: false, message: 'Required fields missing' });
    const pool = await getPool();
    const limit = parseFloat(await (await pool.request()
      .query("SELECT SettingValue FROM SystemSettings WHERE SettingKey='ExpenseApprovalLimit'"))
      .recordset[0]?.SettingValue || '5000');
    const status = amount <= limit && req.user.role !== 'AGENT' ? 'Pending' : 'Pending';
    await pool.request()
      .input('et', sql.NVarChar, expenseType)
      .input('amt', sql.Decimal(18,2), amount)
      .input('desc', sql.NVarChar, description || null)
      .input('status', sql.NVarChar, status)
      .input('cb', sql.Int, req.user.userID)
      .query('INSERT INTO OfficeExpenses(ExpenseType,Amount,Description,Status,CreatedBy) VALUES(@et,@amt,@desc,@status,@cb)');
    res.json({ success: true, message: 'Expense submitted for approval' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.put('/:id/approve', authenticate, authorize('ADMIN','MANAGER'), async (req, res) => {
  try {
    const pool = await getPool();
    await pool.request().input('id', sql.Int, req.params.id).input('ab', sql.Int, req.user.userID)
      .query("UPDATE OfficeExpenses SET Status='Approved',ApprovedBy=@ab,ApprovedDate=GETDATE() WHERE ExpenseID=@id");
    res.json({ success: true, message: 'Expense approved' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.put('/:id/reject', authenticate, authorize('ADMIN','MANAGER'), async (req, res) => {
  try {
    const pool = await getPool();
    await pool.request().input('id', sql.Int, req.params.id).input('ab', sql.Int, req.user.userID)
      .query("UPDATE OfficeExpenses SET Status='Rejected',ApprovedBy=@ab,ApprovedDate=GETDATE() WHERE ExpenseID=@id");
    res.json({ success: true, message: 'Expense rejected' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
