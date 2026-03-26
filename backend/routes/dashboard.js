const express = require('express');
const router = express.Router();
const { getPool, sql } = require('../config/db');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, async (req, res) => {
  try {
    const { userID, role } = req.user;
    const pool = await getPool();
    const r = pool.request().input('uid', sql.Int, userID);

    let stats = {};

    if (role === 'ADMIN') {
      const s = await r.query(`
        SELECT
          (SELECT COUNT(*) FROM Customers WHERE Status='Active') AS TotalCustomers,
          (SELECT COUNT(*) FROM Accounts WHERE Status='Active') AS ActiveAccounts,
          (SELECT ISNULL(SUM(Amount),0) FROM Collections WHERE CAST(CollectionDate AS DATE)=CAST(GETDATE() AS DATE)) AS TodayCollection,
          (SELECT ISNULL(Balance,0) FROM Wallets WHERE WalletType='Main') AS MainWalletBalance,
          (SELECT COUNT(*) FROM Users WHERE Status='Active') AS TotalUsers,
          (SELECT COUNT(*) FROM Collections WHERE IsVerified=0) AS PendingVerifications,
          (SELECT COUNT(*) FROM Audits WHERE Status='Pending') AS PendingAudits,
          (SELECT COUNT(*) FROM Customers WHERE Status='Pending') AS PendingApprovals,
          (SELECT COUNT(*) FROM OfficeExpenses WHERE Status='Pending') AS PendingExpenses`);
      stats = s.recordset[0];
    } else if (role === 'MANAGER') {
      const s = await r.query(`
        SELECT
          (SELECT COUNT(*) FROM Accounts WHERE Status='Active') AS ActiveAccounts,
          (SELECT ISNULL(SUM(Amount),0) FROM Collections WHERE CAST(CollectionDate AS DATE)=CAST(GETDATE() AS DATE)) AS TodayCollection,
          (SELECT ISNULL(Balance,0) FROM Wallets WHERE UserID=${userID}) AS WalletBalance,
          (SELECT COUNT(*) FROM Collections WHERE IsVerified=0) AS PendingVerifications,
          (SELECT COUNT(*) FROM Customers WHERE Status='Pending') AS PendingApprovals`);
      stats = s.recordset[0];
    } else if (role === 'AREAMANAGER') {
      const s = await r.query(`
        SELECT
          (SELECT COUNT(*) FROM Accounts a
           INNER JOIN UserAreaMapping uam ON a.AreaID=uam.AreaID
           WHERE uam.UserID=${userID} AND a.Status='Active') AS ActiveAccounts,
          (SELECT ISNULL(SUM(c.Amount),0) FROM Collections c
           INNER JOIN Accounts a ON c.AccountID=a.AccountID
           INNER JOIN UserAreaMapping uam ON a.AreaID=uam.AreaID
           WHERE uam.UserID=${userID} AND CAST(c.CollectionDate AS DATE)=CAST(GETDATE() AS DATE)) AS TodayCollection,
          (SELECT ISNULL(Balance,0) FROM Wallets WHERE UserID=${userID}) AS WalletBalance,
          (SELECT COUNT(*) FROM Collections c INNER JOIN Users u ON c.AgentID=u.UserID
           WHERE u.ReportingTo=${userID} AND c.IsVerified=0) AS PendingVerifications,
          (SELECT COUNT(*) FROM Customers c2
           INNER JOIN UserAreaMapping uam2 ON c2.AreaID=uam2.AreaID
           WHERE uam2.UserID=${userID} AND c2.Status='Pending') AS PendingApprovals`);
      stats = s.recordset[0];
    } else if (role === 'AGENT') {
      const s = await r.query(`
        SELECT
          (SELECT COUNT(*) FROM Accounts WHERE AssignedAgentID=${userID} AND Status='Active') AS ActiveAccounts,
          (SELECT ISNULL(SUM(Amount),0) FROM Collections WHERE AgentID=${userID}
           AND CAST(CollectionDate AS DATE)=CAST(GETDATE() AS DATE)) AS TodayCollection,
          (SELECT ISNULL(SUM(Amount),0) FROM Collections WHERE AgentID=${userID} AND IsVerified=0) AS PendingAmount`);
      stats = s.recordset[0];
    }

    // Today's chart data
    const chartData = await pool.request().query(`
      SELECT CAST(CollectionDate AS DATE) AS [date], SUM(Amount) AS total
      FROM Collections WHERE CollectionDate >= DATEADD(day,-7,GETDATE())
      GROUP BY CAST(CollectionDate AS DATE) ORDER BY [date]`);

    res.json({ success: true, stats, chartData: chartData.recordset });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
