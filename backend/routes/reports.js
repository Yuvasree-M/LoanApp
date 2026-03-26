const express = require('express');
const router = express.Router();
const { getPool, sql } = require('../config/db');
const { authenticate } = require('../middleware/auth');

// GET /api/reports/collections
router.get('/collections', authenticate, async (req, res) => {
  try {
    const { startDate, endDate, agentID, areaID, loanType } = req.query;
    const pool = await getPool();
    let q = `SELECT
      c.DisplayName AS CustomerName, c.MobileNumber,
      a.AccountNumber, a.LoanType, ar.AreaName,
      u.FullName AS AgentName,
      col.Amount, col.CollectionDate, col.IsVerified, col.NoCollectionReason
      FROM Collections col
      INNER JOIN Accounts a ON col.AccountID=a.AccountID
      INNER JOIN Customers c ON col.CustomerID=c.CustomerID
      INNER JOIN Areas ar ON a.AreaID=ar.AreaID
      INNER JOIN Users u ON col.AgentID=u.UserID
      WHERE 1=1`;
    const r = pool.request();
    if (startDate) { q += ' AND col.CollectionDate >= @sd'; r.input('sd', sql.DateTime, new Date(startDate)); }
    if (endDate) { q += ' AND col.CollectionDate <= @ed'; r.input('ed', sql.DateTime, new Date(endDate)); }
    if (agentID) { q += ' AND col.AgentID=@agid'; r.input('agid', sql.Int, agentID); }
    if (areaID) { q += ' AND a.AreaID=@areaID'; r.input('areaID', sql.Int, areaID); }
    if (loanType) { q += ' AND a.LoanType=@lt'; r.input('lt', sql.NVarChar, loanType); }
    q += ' ORDER BY col.CollectionDate DESC';
    const result = await r.query(q);
    res.json({ success: true, data: result.recordset });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// GET /api/reports/aging - Aging due report
router.get('/aging', authenticate, async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT a.AccountNumber, a.LoanType,
        c.DisplayName AS CustomerName, c.MobileNumber, ar.AreaName,
        a.LoanAmount, a.BalanceAmount, a.DuesPaid, a.DuesCrossed,
        a.CompletionDate,
        DATEDIFF(day, a.CompletionDate, GETDATE()) AS DaysOverdue,
        CASE
          WHEN DATEDIFF(day, a.CompletionDate, GETDATE()) <= 0 THEN 'Current'
          WHEN DATEDIFF(day, a.CompletionDate, GETDATE()) <= 30 THEN '1-30 Days'
          WHEN DATEDIFF(day, a.CompletionDate, GETDATE()) <= 60 THEN '31-60 Days'
          WHEN DATEDIFF(day, a.CompletionDate, GETDATE()) <= 90 THEN '61-90 Days'
          ELSE '90+ Days'
        END AS AgingBucket
      FROM Accounts a
      INNER JOIN Customers c ON a.CustomerID=c.CustomerID
      INNER JOIN Areas ar ON a.AreaID=ar.AreaID
      WHERE a.Status='Active' AND a.BalanceAmount > 0
      ORDER BY DaysOverdue DESC`);
    res.json({ success: true, data: result.recordset });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// GET /api/reports/agent-efficiency
router.get('/agent-efficiency', authenticate, async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT u.FullName AS AgentName, u.MobileNumber,
        COUNT(DISTINCT a.AccountID) AS AssignedAccounts,
        COUNT(DISTINCT col.AccountID) AS CollectedToday,
        ISNULL(SUM(CASE WHEN CAST(col.CollectionDate AS DATE)=CAST(GETDATE() AS DATE) THEN col.Amount ELSE 0 END),0) AS TodayAmount,
        ISNULL(SUM(col.Amount),0) AS TotalCollected,
        COUNT(CASE WHEN col.IsVerified=1 THEN 1 END) AS VerifiedEntries,
        COUNT(CASE WHEN col.IsVerified=0 THEN 1 END) AS PendingEntries
      FROM Users u
      LEFT JOIN Accounts a ON a.AssignedAgentID=u.UserID AND a.Status='Active'
      LEFT JOIN Collections col ON col.AgentID=u.UserID
      WHERE u.Role='AGENT' AND u.Status='Active'
      GROUP BY u.UserID, u.FullName, u.MobileNumber
      ORDER BY TodayAmount DESC`);
    res.json({ success: true, data: result.recordset });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
