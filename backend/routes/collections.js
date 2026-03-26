const express = require('express');
const router = express.Router();
const { getPool, sql } = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');

// GET /api/collections/agent-accounts - for agent collection screen
router.get('/agent-accounts', authenticate, authorize('AGENT'), async (req, res) => {
  try {
    const { areaID, search } = req.query;
    const pool = await getPool();
    let q = `SELECT a.AccountID, a.AccountNumber, a.LoanType, a.DueAmount, a.BalanceAmount,
      a.DuesPaid, a.DuesCrossed, a.Status,
      c.DisplayName AS CustomerName, c.MobileNumber,
      ar.AreaName, ar.AreaID,
      ISNULL((SELECT SUM(Amount) FROM Collections col
        WHERE col.AccountID=a.AccountID
        AND CAST(col.CollectionDate AS DATE)=CAST(GETDATE() AS DATE)
        AND col.IsVerified=0),0) AS TodayCollected,
      (SELECT TOP 1 IsVerified FROM Collections col2
        WHERE col2.AccountID=a.AccountID
        AND CAST(col2.CollectionDate AS DATE)=CAST(GETDATE() AS DATE)
        ORDER BY col2.CollectionDate DESC) AS TodayVerified
      FROM Accounts a
      INNER JOIN Customers c ON a.CustomerID=c.CustomerID
      INNER JOIN Areas ar ON a.AreaID=ar.AreaID
      WHERE a.AssignedAgentID=@uid AND a.Status='Active'`;
    const r = pool.request().input('uid', sql.Int, req.user.userID);
    if (areaID) { q += ' AND a.AreaID=@areaID'; r.input('areaID', sql.Int, areaID); }
    if (search) { q += ' AND (c.DisplayName LIKE @s OR a.AccountNumber LIKE @s OR c.MobileNumber LIKE @s)'; r.input('s', sql.NVarChar, '%'+search+'%'); }
    q += ' ORDER BY ar.AreaName, c.DisplayName';
    const result = await r.query(q);
    res.json({ success: true, data: result.recordset });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// POST /api/collections - save collection
router.post('/', authenticate, authorize('AGENT'), async (req, res) => {
  try {
    const { accountID, amount, noCollectionReason, latitude, longitude, notes } = req.body;
    if (!accountID) return res.status(400).json({ success: false, message: 'Account ID required' });
    if ((amount === 0 || !amount) && !noCollectionReason)
      return res.status(400).json({ success: false, message: 'Reason required when amount is 0' });

    const pool = await getPool();
    const acc = await pool.request().input('id', sql.Int, accountID)
      .query('SELECT CustomerID, BalanceAmount FROM Accounts WHERE AccountID=@id');
    if (!acc.recordset.length) return res.status(404).json({ success: false, message: 'Account not found' });

    const { CustomerID, BalanceAmount } = acc.recordset[0];
    const collAmt = parseFloat(amount) || 0;

    await pool.request()
      .input('aid', sql.Int, accountID)
      .input('cid', sql.Int, CustomerID)
      .input('agid', sql.Int, req.user.userID)
      .input('amt', sql.Decimal(18,2), collAmt)
      .input('reason', sql.NVarChar, noCollectionReason || null)
      .input('lat', sql.NVarChar, latitude || null)
      .input('lng', sql.NVarChar, longitude || null)
      .input('notes', sql.NVarChar, notes || null)
      .query(`INSERT INTO Collections(AccountID,CustomerID,AgentID,Amount,NoCollectionReason,Latitude,Longitude,Notes)
        VALUES(@aid,@cid,@agid,@amt,@reason,@lat,@lng,@notes)`);

    if (collAmt > 0) {
      await pool.request()
        .input('amt', sql.Decimal(18,2), collAmt)
        .input('id', sql.Int, accountID)
        .query('UPDATE Accounts SET TotalCollected=TotalCollected+@amt, BalanceAmount=BalanceAmount-@amt, DuesPaid=DuesPaid+1 WHERE AccountID=@id');
    }
    res.json({ success: true, message: 'Collection saved' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// GET /api/collections/pending-verify
router.get('/pending-verify', authenticate, authorize('ADMIN','MANAGER','AREAMANAGER'), async (req, res) => {
  try {
    const pool = await getPool();
    const role = req.user.role;
    let q = `SELECT u.UserID AS AgentID, u.FullName AS AgentName,
      COUNT(c.CollectionID) AS TotalEntries,
      SUM(c.Amount) AS TotalAmount,
      CAST(c.CollectionDate AS DATE) AS CollDate
      FROM Collections c INNER JOIN Users u ON c.AgentID=u.UserID
      WHERE c.IsVerified=0`;
    const r = pool.request();
    if (role === 'AREAMANAGER') {
      q += ' AND u.ReportingTo=@uid';
      r.input('uid', sql.Int, req.user.userID);
    }
    q += ' GROUP BY u.UserID, u.FullName, CAST(c.CollectionDate AS DATE) ORDER BY CollDate DESC, TotalAmount DESC';
    const result = await r.query(q);
    res.json({ success: true, data: result.recordset });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// POST /api/collections/verify
router.post('/verify', authenticate, authorize('ADMIN','MANAGER','AREAMANAGER'), async (req, res) => {
  try {
    const { agentID, date } = req.body;
    const pool = await getPool();
const result = await pool.request()
  .input('AgentID', sql.Int, agentID)                       // matches SP
  .input('VerifiedBy', sql.Int, req.user.userID)           // matches SP exactly
  .input('Date', sql.Date, date ? new Date(date) : null)  // optional
  .execute('sp_VerifyAgentCollections');
    const r = result.recordset[0];
    if (r.Success) res.json({ success: true, amount: r.Amount, message: `Verified. ₹${r.Amount} added to wallet.` });
    else res.status(500).json({ success: false, message: 'Verification failed' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// GET /api/collections/ledger - agent ledger
router.get('/ledger', authenticate, authorize('AGENT'), async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().input('uid', sql.Int, req.user.userID)
      .query(`SELECT col.CollectionID, a.AccountNumber, c.DisplayName AS CustomerName,
        col.Amount, col.NoCollectionReason, col.IsVerified, col.CollectionDate,
        v.FullName AS VerifiedByName, col.VerifiedDate
        FROM Collections col
        INNER JOIN Accounts a ON col.AccountID=a.AccountID
        INNER JOIN Customers c ON col.CustomerID=c.CustomerID
        LEFT JOIN Users v ON col.VerifiedBy=v.UserID
        WHERE col.AgentID=@uid ORDER BY col.CollectionDate DESC`);
    res.json({ success: true, data: result.recordset });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
