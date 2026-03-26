require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const { getPool } = require('./config/db.js'); // ✅ ADD THIS

const app = express();

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth',        require('./routes/auth'));
app.use('/api/users',       require('./routes/users'));
app.use('/api/areas',       require('./routes/areas'));
app.use('/api/customers',   require('./routes/customers'));
app.use('/api/accounts',    require('./routes/accounts'));
app.use('/api/collections', require('./routes/collections'));
app.use('/api/dashboard',   require('./routes/dashboard'));
app.use('/api/wallet',      require('./routes/wallet'));
app.use('/api/reports',     require('./routes/reports'));
app.use('/api/settings',    require('./routes/settings'));
app.use('/api/expenses',    require('./routes/expenses'));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'OK', time: new Date() }));

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;

// ✅ CONNECT DATABASE
getPool()
  .then(() => console.log("✅ Database connected successfully"))
  .catch(err => console.error("❌ DB Connection Failed:", err));

app.listen(PORT, () => 
  console.log(`🚀 Server running on http://localhost:${PORT}`)
);