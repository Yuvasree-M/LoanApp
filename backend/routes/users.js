const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { getPool, sql } = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');

// GET /api/users - List all users
router.get('/', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const { role, search } = req.query;
    const pool = await getPool();
    let query = `
      SELECT u.UserID, u.FullName, u.Username, u.MobileNumber, u.Role, u.Status, u.CreatedDate,
        ISNULL(r.FullName,'') AS ReportingName,
        ISNULL((
          SELECT STRING_AGG(a.AreaName, ', ')
          FROM UserAreaMapping uam INNER JOIN Areas a ON uam.AreaID=a.AreaID
          WHERE uam.UserID=u.UserID AND uam.Status='Active'
        ),'') AS Areas
      FROM Users u LEFT JOIN Users r ON u.ReportingTo=r.UserID
      WHERE 1=1
      ${role ? "AND u.Role=@role" : ""}
      ${search ? "AND (u.FullName LIKE @s OR u.Username LIKE @s OR u.MobileNumber LIKE @s)" : ""}
      ORDER BY u.CreatedDate DESC`;
    const req2 = pool.request();
    if (role) req2.input('role', sql.NVarChar, role);
    if (search) req2.input('s', sql.NVarChar, '%'+search+'%');
    const result = await req2.query(query);
    res.json({ success: true, data: result.recordset });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// POST /api/users - Create user
router.post('/', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const { fullName, mobileNumber, username, password, role, status, reportingTo, areas } = req.body;
    if (!fullName || !mobileNumber || !username || !password || !role)
      return res.status(400).json({ success: false, message: 'Required fields missing' });

    const pool = await getPool();
    const exists = await pool.request().input('u', sql.NVarChar, username)
      .query('SELECT COUNT(*) AS cnt FROM Users WHERE Username=@u');
    if (exists.recordset[0].cnt > 0)
      return res.status(400).json({ success: false, message: 'Username already exists' });

    const hash = bcrypt.hashSync(password, 10);
    const result = await pool.request()
      .input('fn', sql.NVarChar, fullName)
      .input('mob', sql.NVarChar, mobileNumber)
      .input('u', sql.NVarChar, username)
      .input('pwd', sql.NVarChar, hash)
      .input('role', sql.NVarChar, role)
      .input('status', sql.NVarChar, status || 'Active')
      .input('rt', sql.Int, reportingTo || null)
      .input('cb', sql.Int, req.user.userID)
      .query(`INSERT INTO Users(FullName,MobileNumber,Username,PasswordHash,Role,Status,ReportingTo,CreatedBy)
              OUTPUT INSERTED.UserID
              VALUES(@fn,@mob,@u,@pwd,@role,@status,@rt,@cb)`);

    const newUserID = result.recordset[0].UserID;

    // Create wallet for Manager/AreaManager
    if (role === 'MANAGER' || role === 'AREAMANAGER') {
      await pool.request()
        .input('uid', sql.Int, newUserID)
        .input('wt', sql.NVarChar, role === 'MANAGER' ? 'Manager' : 'Area')
        .query('INSERT INTO Wallets(UserID,WalletType) VALUES(@uid,@wt)');
    }

    // Assign areas
    if (areas && areas.length) {
      for (const areaID of areas) {
        await pool.request()
          .input('uid', sql.Int, newUserID)
          .input('aid', sql.Int, areaID)
          .input('ab', sql.Int, req.user.userID)
          .query('INSERT INTO UserAreaMapping(UserID,AreaID,AssignedBy) VALUES(@uid,@aid,@ab)');
      }
    }

    res.json({ success: true, message: 'User created', userID: newUserID });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// PUT /api/users/:id - Update user
router.put('/:id', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const { fullName, mobileNumber, username, password, role, status, reportingTo, areas } = req.body;
    const uid = parseInt(req.params.id);
    const pool = await getPool();

    let pwdClause = '';
    const req2 = pool.request()
      .input('fn', sql.NVarChar, fullName)
      .input('mob', sql.NVarChar, mobileNumber)
      .input('u', sql.NVarChar, username)
      .input('role', sql.NVarChar, role)
      .input('status', sql.NVarChar, status)
      .input('rt', sql.Int, reportingTo || null)
      .input('id', sql.Int, uid);

    if (password) {
      pwdClause = ',PasswordHash=@pwd';
      req2.input('pwd', sql.NVarChar, bcrypt.hashSync(password, 10));
    }

    await req2.query(
      `UPDATE Users SET FullName=@fn,MobileNumber=@mob,Username=@u,Role=@role,Status=@status,ReportingTo=@rt${pwdClause} WHERE UserID=@id`
    );

    // Re-assign areas
    await pool.request().input('uid', sql.Int, uid)
      .query("UPDATE UserAreaMapping SET Status='Inactive' WHERE UserID=@uid");
    if (areas && areas.length) {
      for (const areaID of areas) {
        const ex = await pool.request().input('uid', sql.Int, uid).input('aid', sql.Int, areaID)
          .query('SELECT COUNT(*) AS cnt FROM UserAreaMapping WHERE UserID=@uid AND AreaID=@aid');
        if (ex.recordset[0].cnt > 0) {
          await pool.request().input('uid', sql.Int, uid).input('aid', sql.Int, areaID)
            .query("UPDATE UserAreaMapping SET Status='Active' WHERE UserID=@uid AND AreaID=@aid");
        } else {
          await pool.request().input('uid', sql.Int, uid).input('aid', sql.Int, areaID).input('ab', sql.Int, req.user.userID)
            .query('INSERT INTO UserAreaMapping(UserID,AreaID,AssignedBy) VALUES(@uid,@aid,@ab)');
        }
      }
    }
    res.json({ success: true, message: 'User updated' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// GET /api/users/areas - users with areas for agent dropdown
router.get('/by-role/:role', authenticate, async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('role', sql.NVarChar, req.params.role)
      .query("SELECT UserID, FullName FROM Users WHERE Role=@role AND Status='Active' ORDER BY FullName");
    res.json({ success: true, data: result.recordset });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// GET /api/users/manager-areas/:managerID
router.get('/manager-areas/:managerID', authenticate, async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('uid', sql.Int, req.params.managerID)
      .query(`SELECT a.AreaID, a.AreaName,
        (SELECT COUNT(*) FROM Accounts WHERE AreaID=a.AreaID AND Status='Active') AS AccountCount
        FROM UserAreaMapping uam INNER JOIN Areas a ON uam.AreaID=a.AreaID
        WHERE uam.UserID=@uid AND uam.Status='Active' AND a.Status='Active' ORDER BY a.AreaName`);
    res.json({ success: true, data: result.recordset });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
