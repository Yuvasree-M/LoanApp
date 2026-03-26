const express = require('express');
const router = express.Router();
const { getPool, sql } = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');

// GET /api/customers
router.get('/', authenticate, async (req, res) => {
  try {
    const { search, status, areaID } = req.query;
    const role = req.user.role;
    const pool = await getPool();
    let q = `SELECT c.CustomerID, c.FullName, c.ShopName, c.NickName, c.DisplayName,
      c.MobileNumber, c.AadhaarNumber, c.Status, c.CreatedDate, a.AreaName,
      u.FullName AS CreatedByName
      FROM Customers c INNER JOIN Areas a ON c.AreaID=a.AreaID
      INNER JOIN Users u ON c.CreatedBy=u.UserID WHERE 1=1`;
    const r = pool.request();
    if (status) { q += ' AND c.Status=@status'; r.input('status', sql.NVarChar, status); }
    if (areaID) { q += ' AND c.AreaID=@areaID'; r.input('areaID', sql.Int, areaID); }
    if (search) { q += ' AND (c.DisplayName LIKE @s OR c.FullName LIKE @s OR c.MobileNumber LIKE @s OR c.AadhaarNumber LIKE @s)'; r.input('s', sql.NVarChar, '%'+search+'%'); }
 if (role === 'AREAMANAGER') {
  q += ` AND c.AreaID IN (SELECT AreaID FROM UserAreaMapping WHERE UserID=@uid AND Status='Active')`;
  r.input('uid', sql.Int, req.user.userID);
} else if (role === 'AGENT') {
  q += ` AND c.AreaID IN (SELECT AreaID FROM UserAreaMapping WHERE UserID=@uid AND Status='Active')`;
  r.input('uid', sql.Int, req.user.userID);
}
    q += ' ORDER BY c.CreatedDate DESC';
    const result = await r.query(q);
    res.json({ success: true, data: result.recordset });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// POST /api/customers
router.post('/', authenticate, async (req, res) => {
  try {
    const d = req.body;
    if (!d.fullName || !d.mobileNumber || !d.aadhaarNumber || !d.areaID)
      return res.status(400).json({ success: false, message: 'Required fields missing' });

    const pool = await getPool();
    // Duplicate checks
    const dupA = await pool.request().input('a', sql.NVarChar, d.aadhaarNumber)
      .query('SELECT COUNT(*) AS cnt FROM Customers WHERE AadhaarNumber=@a');
    if (dupA.recordset[0].cnt > 0)
      return res.status(400).json({ success: false, message: 'Customer with this Aadhaar already exists' });

    const dupM = await pool.request().input('m', sql.NVarChar, d.mobileNumber)
      .query('SELECT COUNT(*) AS cnt FROM Customers WHERE MobileNumber=@m');
    if (dupM.recordset[0].cnt > 0)
      return res.status(400).json({ success: false, message: 'Customer with this mobile already exists' });

    const r = await pool.request()
      .input('fn', sql.NVarChar, d.fullName)
      .input('sn', sql.NVarChar, d.shopName || null)
      .input('nn', sql.NVarChar, d.nickName || null)
      .input('mob', sql.NVarChar, d.mobileNumber)
      .input('amob', sql.NVarChar, d.altMobileNumber || null)
      .input('aad', sql.NVarChar, d.aadhaarNumber)
      .input('bt', sql.NVarChar, d.businessType || null)
      .input('ms', sql.NVarChar, d.maritalStatus || null)
      .input('nc', sql.Int, d.numberOfChildren || null)
      .input('pa', sql.NVarChar, d.presentAddress || null)
      .input('pra', sql.NVarChar, d.permanentAddress || null)
      .input('aid', sql.Int, d.areaID)
      .input('lat', sql.NVarChar, d.latitude || null)
      .input('lng', sql.NVarChar, d.longitude || null)
      .input('ax', sql.Bit, d.aadhaarXerox ? 1 : 0)
      .input('pn', sql.Bit, d.promissoryNote ? 1 : 0)
      .input('ch', sql.Bit, d.cheque ? 1 : 0)
      .input('od', sql.Bit, d.otherDocuments ? 1 : 0)
      .input('odc', sql.NVarChar, d.otherDocComment || null)
      .input('ref', sql.NVarChar, d.reference || null)
      .input('cb', sql.Int, req.user.userID)
      .query(`INSERT INTO Customers(FullName,ShopName,NickName,MobileNumber,AltMobileNumber,AadhaarNumber,
        BusinessType,MaritalStatus,NumberOfChildren,PresentAddress,PermanentAddress,AreaID,
        Latitude,Longitude,AadhaarXerox,PromissoryNote,Cheque,OtherDocuments,OtherDocComment,
        Reference,Status,CreatedBy)
        OUTPUT INSERTED.CustomerID
        VALUES(@fn,@sn,@nn,@mob,@amob,@aad,@bt,@ms,@nc,@pa,@pra,@aid,@lat,@lng,@ax,@pn,@ch,@od,@odc,@ref,'Pending',@cb)`);
    res.json({ success: true, customerID: r.recordset[0].CustomerID, message: 'Customer submitted for approval' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// PUT /api/customers/:id/approve
router.put('/:id/approve', authenticate, authorize('ADMIN','MANAGER','AREAMANAGER'), async (req, res) => {
  try {
    const { displayField } = req.body;
    const pool = await getPool();
    const cust = await pool.request().input('id', sql.Int, req.params.id)
      .query('SELECT FullName, ShopName, NickName FROM Customers WHERE CustomerID=@id');
    const c = cust.recordset[0];
    const displayName = displayField === 'ShopName' ? (c.ShopName || c.FullName)
      : displayField === 'NickName' ? (c.NickName || c.FullName) : c.FullName;
    await pool.request()
      .input('dn', sql.NVarChar, displayName)
      .input('ab', sql.Int, req.user.userID)
      .input('id', sql.Int, req.params.id)
      .query("UPDATE Customers SET Status='Active',DisplayName=@dn,ApprovedBy=@ab,ApprovedDate=GETDATE() WHERE CustomerID=@id");
    res.json({ success: true, message: 'Customer approved' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// PUT /api/customers/:id/reject
router.put('/:id/reject', authenticate, authorize('ADMIN','MANAGER','AREAMANAGER'), async (req, res) => {
  try {
    const pool = await getPool();
    await pool.request().input('id', sql.Int, req.params.id)
      .query("UPDATE Customers SET Status='Blocked' WHERE CustomerID=@id");
    res.json({ success: true, message: 'Customer rejected' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
