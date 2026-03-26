const express = require('express');
const router = express.Router();
const { getPool, sql } = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');

// GET /api/accounts
router.get('/', authenticate, async (req, res) => {
  try {
    const { search, loanType, status, areaID } = req.query;
    const role = req.user.role;
    const pool = await getPool();
    let q = `SELECT a.AccountID, a.AccountNumber, a.LoanType, a.LoanAmount, a.DueAmount,
      a.BalanceAmount, a.TotalCollected, a.DuesPaid, a.DuesCrossed, a.Status,
      a.StartDate, a.CompletionDate,
      c.DisplayName AS CustomerName, c.MobileNumber,
      ar.AreaName, u.FullName AS AgentName
      FROM Accounts a
      INNER JOIN Customers c ON a.CustomerID=c.CustomerID
      INNER JOIN Areas ar ON a.AreaID=ar.AreaID
      LEFT JOIN Users u ON a.AssignedAgentID=u.UserID
      WHERE 1=1`;
    const r = pool.request();
    if (loanType) { q += ' AND a.LoanType=@lt'; r.input('lt', sql.NVarChar, loanType); }
    if (status) { q += ' AND a.Status=@status'; r.input('status', sql.NVarChar, status); }
    if (areaID) { q += ' AND a.AreaID=@areaID'; r.input('areaID', sql.Int, areaID); }
    if (search) { q += ' AND (c.DisplayName LIKE @s OR a.AccountNumber LIKE @s OR c.MobileNumber LIKE @s)'; r.input('s', sql.NVarChar, '%'+search+'%'); }
   if (role === 'AREAMANAGER') {
  q += ` AND a.AreaID IN (SELECT AreaID FROM UserAreaMapping WHERE UserID=@uid AND Status='Active')`;
  r.input('uid', sql.Int, req.user.userID);
} else if (role === 'AGENT') {
  q += ' AND a.AssignedAgentID=@uid';
  r.input('uid', sql.Int, req.user.userID);
}
    q += ' ORDER BY a.CreatedDate DESC';
    const result = await r.query(q);
    res.json({ success: true, data: result.recordset });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// POST /api/accounts
router.post('/', authenticate, authorize('ADMIN','MANAGER','AREAMANAGER'), async (req, res) => {
  try {
    const d = req.body;
    if (!d.customerID || !d.loanType || !d.loanAmount || !d.givenAmount || !d.numberOfDues || !d.dueAmount || !d.startDate)
      return res.status(400).json({ success: false, message: 'Required fields missing' });

    const pool = await getPool();

    // Generate account number
    const out = new sql.Table();
const accResult = await pool.request()
  .input('LoanType', sql.NVarChar(20), d.loanType) // matches SP exactly
  .output('AccountNumber', sql.NVarChar(20))
  .execute('sp_GenerateAccountNumber');
const accountNumber = accResult.output.AccountNumber;

    // Calculate completion date
    const startDate = new Date(d.startDate);
    let completionDate = new Date(startDate);
    if (d.loanType === 'Daily') completionDate.setDate(completionDate.getDate() + d.numberOfDues);
    else if (d.loanType === 'Weekly') completionDate.setDate(completionDate.getDate() + (d.numberOfDues * 7));
    else completionDate.setMonth(completionDate.getMonth() + d.numberOfDues);

    const custArea = await pool.request().input('cid', sql.Int, d.customerID)
      .query('SELECT AreaID FROM Customers WHERE CustomerID=@cid');
    const areaID = custArea.recordset[0]?.AreaID;

    const r = await pool.request()
      .input('accno', sql.NVarChar, accountNumber)
      .input('cid', sql.Int, d.customerID)
      .input('lt', sql.NVarChar, d.loanType)
      .input('la', sql.Decimal(18,2), d.loanAmount)
      .input('ga', sql.Decimal(18,2), d.givenAmount)
      .input('nd', sql.Int, d.numberOfDues)
      .input('da', sql.Decimal(18,2), d.dueAmount)
      .input('sd', sql.DateTime, new Date(d.startDate))
      .input('cd', sql.DateTime, completionDate)
      .input('bal', sql.Decimal(18,2), d.loanAmount)
      .input('aid', sql.Int, areaID)
      .input('agid', sql.Int, d.assignedAgentID || null)
      .input('cb', sql.Int, req.user.userID)
      .query(`INSERT INTO Accounts(AccountNumber,CustomerID,LoanType,LoanAmount,GivenAmount,
        NumberOfDues,DueAmount,StartDate,CompletionDate,BalanceAmount,AreaID,AssignedAgentID,CreatedBy)
        OUTPUT INSERTED.AccountID
        VALUES(@accno,@cid,@lt,@la,@ga,@nd,@da,@sd,@cd,@bal,@aid,@agid,@cb)`);

    res.json({ success: true, accountID: r.recordset[0].AccountID, accountNumber, message: 'Account created' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// GET /api/accounts/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const pool = await getPool();
    const acc = await pool.request().input('id', sql.Int, req.params.id)
      .query(`SELECT a.*, c.DisplayName AS CustomerName, c.MobileNumber, c.AadhaarNumber,
        ar.AreaName, u.FullName AS AgentName
        FROM Accounts a INNER JOIN Customers c ON a.CustomerID=c.CustomerID
        INNER JOIN Areas ar ON a.AreaID=ar.AreaID LEFT JOIN Users u ON a.AssignedAgentID=u.UserID
        WHERE a.AccountID=@id`);
    const collections = await pool.request().input('id', sql.Int, req.params.id)
      .query(`SELECT col.*, u.FullName AS AgentName FROM Collections col
        INNER JOIN Users u ON col.AgentID=u.UserID WHERE col.AccountID=@id
        ORDER BY col.CollectionDate DESC`);
    res.json({ success: true, data: acc.recordset[0], collections: collections.recordset });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
