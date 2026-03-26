const express = require('express');
const router = express.Router();
const { getPool, sql } = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT a.AreaID, a.AreaName, a.AreaCode, a.Status,
        (SELECT COUNT(*) FROM Accounts WHERE AreaID=a.AreaID AND Status='Active') AS AccountCount,
        (SELECT COUNT(DISTINCT uam.UserID) FROM UserAreaMapping uam
         INNER JOIN Users u ON uam.UserID=u.UserID
         WHERE uam.AreaID=a.AreaID AND u.Role='AGENT' AND uam.Status='Active') AS AgentCount
      FROM Areas a ORDER BY a.AreaName`);
    res.json({ success: true, data: result.recordset });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const { areaName, areaCode, status } = req.body;
    if (!areaName) return res.status(400).json({ success: false, message: 'Area name required' });
    const pool = await getPool();
    const r = await pool.request()
      .input('an', sql.NVarChar, areaName)
      .input('ac', sql.NVarChar, areaCode || '')
      .input('st', sql.NVarChar, status || 'Active')
      .input('cb', sql.Int, req.user.userID)
      .query('INSERT INTO Areas(AreaName,AreaCode,Status,CreatedBy) OUTPUT INSERTED.AreaID VALUES(@an,@ac,@st,@cb)');
    res.json({ success: true, areaID: r.recordset[0].AreaID, message: 'Area created' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.put('/:id', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const { areaName, areaCode, status } = req.body;
    const pool = await getPool();
    await pool.request()
      .input('an', sql.NVarChar, areaName)
      .input('ac', sql.NVarChar, areaCode || '')
      .input('st', sql.NVarChar, status)
      .input('id', sql.Int, req.params.id)
      .query('UPDATE Areas SET AreaName=@an,AreaCode=@ac,Status=@st WHERE AreaID=@id');
    res.json({ success: true, message: 'Area updated' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
