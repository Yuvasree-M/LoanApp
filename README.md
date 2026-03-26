# Loan Management System
## React + Node.js + MS SQL Server

---

## 🚀 SETUP INSTRUCTIONS

### STEP 1: Database Setup
1. Open **SQL Server Management Studio (SSMS)**
2. Open file: `database/schema.sql`
3. Run the entire script (F5)
4. Database `LoanDB` will be created with default data
5. **Default Login:** `admin` / `admin123`

---

### STEP 2: Backend Setup
```bash
cd backend
npm install
```

Edit `.env` file with your SQL Server details:
```
DB_SERVER=localhost          # Your SQL Server name (e.g., DESKTOP-ABC\SQLEXPRESS)
DB_DATABASE=LoanDB
DB_USER=sa                   # OR use Windows auth (remove user/password)
DB_PASSWORD=YourPassword123!
DB_PORT=1433
DB_ENCRYPT=false
DB_TRUST_CERT=true
JWT_SECRET=LoanMgmt$ecret2026!
PORT=5000
NODE_ENV=development
```

Start backend:
```bash
npm run dev
```
Backend runs at: **http://localhost:5000**

---

### STEP 3: Frontend Setup
```bash
cd frontend
npm install
npm start
```
Frontend runs at: **http://localhost:3000**

---

## 👥 DEFAULT LOGIN
| Username | Password | Role |
|----------|----------|------|
| admin    | admin123 | ADMIN |

---

## 🏗 PROJECT STRUCTURE
```
LoanManagementSystem/
├── database/
│   └── schema.sql              ← Run this first in SSMS
│
├── backend/                    ← Node.js + Express API
│   ├── config/db.js            ← MS SQL connection
│   ├── middleware/auth.js      ← JWT authentication
│   ├── routes/
│   │   ├── auth.js             ← Login + OTP verify
│   │   ├── users.js            ← User CRUD (Admin)
│   │   ├── areas.js            ← Area management
│   │   ├── customers.js        ← Customer CRUD + approval
│   │   ├── accounts.js         ← Loan account creation
│   │   ├── collections.js      ← Agent collections + verify
│   │   ├── dashboard.js        ← Role-wise stats
│   │   ├── wallet.js           ← Wallet management
│   │   ├── reports.js          ← Reports API
│   │   ├── settings.js         ← System settings
│   │   └── expenses.js         ← Office expenses
│   ├── server.js               ← Main server
│   └── .env                    ← Configuration ← EDIT THIS
│
└── frontend/                   ← React 18 App
    └── src/
        ├── App.jsx              ← Routes + Role protection
        ├── index.css            ← Design system
        ├── context/
        │   └── AuthContext.jsx  ← Login state
        ├── utils/api.js         ← Axios + JWT interceptor
        ├── components/layout/
        │   └── Layout.jsx       ← Sidebar + Topbar
        └── pages/
            ├── Login.jsx        ← Login + OTP
            ├── Dashboard.jsx    ← Role-wise dashboard
            ├── admin/           ← Users, Areas, Wallet, Expenses, Settings
            ├── manager/         ← Customers, Accounts, Verify, Wallet
            ├── agent/           ← My Accounts, Collection entry, Ledger
            └── reports/         ← Collection, Aging, Efficiency reports
```

---

## 🔐 ROLE ACCESS MATRIX
| Feature | Admin | Manager | Area Manager | Agent | Office Staff |
|---------|-------|---------|-------------|-------|-------------|
| User Management | ✅ | ❌ | ❌ | ❌ | ❌ |
| Area Management | ✅ | ❌ | ❌ | ❌ | ❌ |
| Add Customer | ✅ | ✅ | ✅ | ✅ | ❌ |
| Approve Customer | ✅ | ✅ | ✅ | ❌ | ❌ |
| Create Loan Account | ✅ | ✅ | ✅ | ❌ | ❌ |
| Collection Entry | ❌ | ❌ | ❌ | ✅ | ❌ |
| Verify Collections | ✅ | ✅ | ✅ | ❌ | ❌ |
| Wallet Management | Main | Manager | Area | ❌ | ❌ |
| Audit & Transfer | ✅ | ❌ | ❌ | ❌ | ❌ |
| Reports | All | Region | Area | Own | View Only |
| System Settings | ✅ | ❌ | ❌ | ❌ | ❌ |

---

## 📊 DATABASE TABLES
- **Users** — All roles with OTP support
- **Areas** — Collection zones
- **UserAreaMapping** — Role-Area assignments
- **Customers** — Customer master with approval workflow
- **Accounts** — Loan accounts (Daily/Weekly/Monthly)
- **Collections** — Agent collection entries with GPS
- **Wallets** — Main/Manager/Area wallets
- **WalletTransactions** — Full audit trail
- **Audits** — Admin audit records
- **OfficeExpenses** — Expense management
- **SystemSettings** — Configurable limits

---

## 🔗 API ENDPOINTS
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/login | Login + OTP |
| POST | /api/auth/verify-otp | OTP verification |
| GET | /api/users | List users (Admin) |
| POST | /api/users | Create user |
| GET | /api/areas | List areas |
| GET | /api/customers | List customers |
| POST | /api/customers | Add customer |
| PUT | /api/customers/:id/approve | Approve customer |
| GET | /api/accounts | List accounts |
| POST | /api/accounts | Create loan |
| GET | /api/collections/agent-accounts | Agent's accounts |
| POST | /api/collections | Save collection |
| POST | /api/collections/verify | Verify collections |
| GET | /api/dashboard | Role-wise stats |
| GET | /api/wallet/my | Own wallet |
| GET | /api/reports/collections | Collection report |
| GET | /api/reports/aging | Aging due report |
| GET | /api/reports/agent-efficiency | Efficiency report |

---

## 📱 SMS OTP Integration
In `backend/routes/auth.js`, find the comment:
```javascript
// TODO: Send OTP via SMS API here
console.log(`OTP for ${username}: ${otp}`);
```
Replace with your SMS provider (Twilio, AWS SNS, MSG91, etc.)

In DEV mode, OTP is shown on the login screen automatically.

---

## ⚙️ Windows Authentication (SQL Server)
If using Windows Auth instead of SQL login, update `.env`:
```
DB_USER=
DB_PASSWORD=
```
And update `config/db.js` to use `trustedConnection: true`

---

Built with ❤️ using React 18, Node.js, Express, MS SQL Server
