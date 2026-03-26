
-- ============================================================
-- LOAN MANAGEMENT SYSTEM - MS SQL SERVER SCHEMA
-- ============================================================
USE master
GO
IF EXISTS (SELECT name FROM sys.databases WHERE name = N'LoanDB')
    DROP DATABASE LoanDB
GO
CREATE DATABASE LoanDB
GO
USE LoanDB
GO

-- AREAS
CREATE TABLE Areas (
    AreaID      INT IDENTITY(1,1) PRIMARY KEY,
    AreaName    NVARCHAR(100) NOT NULL,
    AreaCode    NVARCHAR(20) NULL,
    Status      NVARCHAR(20) NOT NULL DEFAULT 'Active',
    CreatedDate DATETIME NOT NULL DEFAULT GETDATE(),
    CreatedBy   INT NULL
)
GO

-- USERS
CREATE TABLE Users (
    UserID        INT IDENTITY(1,1) PRIMARY KEY,
    FullName      NVARCHAR(150) NOT NULL,
    MobileNumber  NVARCHAR(15) NOT NULL,
    Username      NVARCHAR(50) NOT NULL UNIQUE,
    PasswordHash  NVARCHAR(256) NOT NULL,
    Role          NVARCHAR(30) NOT NULL,  -- ADMIN/MANAGER/AREAMANAGER/AGENT/OFFICESTAFF
    Status        NVARCHAR(20) NOT NULL DEFAULT 'Active',
    ReportingTo   INT NULL,
    CreatedDate   DATETIME NOT NULL DEFAULT GETDATE(),
    CreatedBy     INT NULL,
    LastLoginDate DATETIME NULL,
    OTPCode       NVARCHAR(10) NULL,
    OTPExpiry     DATETIME NULL,
    FOREIGN KEY (ReportingTo) REFERENCES Users(UserID)
)
GO

-- USER AREA MAPPING
CREATE TABLE UserAreaMapping (
    MappingID    INT IDENTITY(1,1) PRIMARY KEY,
    UserID       INT NOT NULL,
    AreaID       INT NOT NULL,
    AssignedDate DATETIME NOT NULL DEFAULT GETDATE(),
    AssignedBy   INT NULL,
    Status       NVARCHAR(20) NOT NULL DEFAULT 'Active',
    FOREIGN KEY (UserID) REFERENCES Users(UserID),
    FOREIGN KEY (AreaID) REFERENCES Areas(AreaID)
)
GO

-- CUSTOMERS
CREATE TABLE Customers (
    CustomerID       INT IDENTITY(1,1) PRIMARY KEY,
    FullName         NVARCHAR(150) NOT NULL,
    ShopName         NVARCHAR(150) NULL,
    NickName         NVARCHAR(100) NULL,
    DisplayName      NVARCHAR(150) NULL,
    MobileNumber     NVARCHAR(15) NOT NULL,
    AltMobileNumber  NVARCHAR(15) NULL,
    AadhaarNumber    NVARCHAR(20) NOT NULL UNIQUE,
    BusinessType     NVARCHAR(100) NULL,
    MaritalStatus    NVARCHAR(30) NULL,
    NumberOfChildren INT NULL,
    PresentAddress   NVARCHAR(500) NULL,
    PermanentAddress NVARCHAR(500) NULL,
    AreaID           INT NOT NULL,
    Latitude         NVARCHAR(50) NULL,
    Longitude        NVARCHAR(50) NULL,
    CustomerPhoto    NVARCHAR(500) NULL,
    IDProofPhoto     NVARCHAR(500) NULL,
    AadhaarXerox     BIT NOT NULL DEFAULT 0,
    PromissoryNote   BIT NOT NULL DEFAULT 0,
    Cheque           BIT NOT NULL DEFAULT 0,
    OtherDocuments   BIT NOT NULL DEFAULT 0,
    OtherDocComment  NVARCHAR(500) NULL,
    Reference        NVARCHAR(500) NULL,
    Status           NVARCHAR(20) NOT NULL DEFAULT 'Pending',
    CreatedBy        INT NOT NULL,
    CreatedDate      DATETIME NOT NULL DEFAULT GETDATE(),
    ApprovedBy       INT NULL,
    ApprovedDate     DATETIME NULL,
    FOREIGN KEY (AreaID) REFERENCES Areas(AreaID),
    FOREIGN KEY (CreatedBy) REFERENCES Users(UserID),
    FOREIGN KEY (ApprovedBy) REFERENCES Users(UserID)
)
GO

-- ACCOUNTS (LOANS)
CREATE TABLE Accounts (
    AccountID       INT IDENTITY(1,1) PRIMARY KEY,
    AccountNumber   NVARCHAR(20) NOT NULL UNIQUE,
    CustomerID      INT NOT NULL,
    LoanType        NVARCHAR(20) NOT NULL,  -- Daily/Weekly/Monthly
    LoanAmount      DECIMAL(18,2) NOT NULL,
    GivenAmount     DECIMAL(18,2) NOT NULL,
    NumberOfDues    INT NOT NULL,
    DueAmount       DECIMAL(18,2) NOT NULL,
    StartDate       DATETIME NOT NULL,
    CompletionDate  DATETIME NOT NULL,
    TotalCollected  DECIMAL(18,2) NOT NULL DEFAULT 0,
    BalanceAmount   DECIMAL(18,2) NOT NULL,
    DuesPaid        INT NOT NULL DEFAULT 0,
    DuesCrossed     INT NOT NULL DEFAULT 0,
    AreaID          INT NOT NULL,
    AssignedAgentID INT NULL,
    Status          NVARCHAR(20) NOT NULL DEFAULT 'Active',
    CreatedBy       INT NOT NULL,
    CreatedDate     DATETIME NOT NULL DEFAULT GETDATE(),
    FOREIGN KEY (CustomerID) REFERENCES Customers(CustomerID),
    FOREIGN KEY (AreaID) REFERENCES Areas(AreaID),
    FOREIGN KEY (AssignedAgentID) REFERENCES Users(UserID),
    FOREIGN KEY (CreatedBy) REFERENCES Users(UserID)
)
GO

-- COLLECTIONS
CREATE TABLE Collections (
    CollectionID       INT IDENTITY(1,1) PRIMARY KEY,
    AccountID          INT NOT NULL,
    CustomerID         INT NOT NULL,
    AgentID            INT NOT NULL,
    CollectionDate     DATETIME NOT NULL DEFAULT GETDATE(),
    Amount             DECIMAL(18,2) NOT NULL DEFAULT 0,
    NoCollectionReason NVARCHAR(100) NULL,
    Latitude           NVARCHAR(50) NULL,
    Longitude          NVARCHAR(50) NULL,
    IsVerified         BIT NOT NULL DEFAULT 0,
    VerifiedBy         INT NULL,
    VerifiedDate       DATETIME NULL,
    TransferredTo      INT NULL,
    Notes              NVARCHAR(500) NULL,
    FOREIGN KEY (AccountID) REFERENCES Accounts(AccountID),
    FOREIGN KEY (CustomerID) REFERENCES Customers(CustomerID),
    FOREIGN KEY (AgentID) REFERENCES Users(UserID),
    FOREIGN KEY (VerifiedBy) REFERENCES Users(UserID)
)
GO

-- WALLETS
CREATE TABLE Wallets (
    WalletID    INT IDENTITY(1,1) PRIMARY KEY,
    UserID      INT NOT NULL UNIQUE,
    WalletType  NVARCHAR(30) NOT NULL,  -- Main/Manager/Area
    Balance     DECIMAL(18,2) NOT NULL DEFAULT 0,
    LastUpdated DATETIME NOT NULL DEFAULT GETDATE(),
    FOREIGN KEY (UserID) REFERENCES Users(UserID)
)
GO

-- WALLET TRANSACTIONS
CREATE TABLE WalletTransactions (
    TransactionID   INT IDENTITY(1,1) PRIMARY KEY,
    WalletID        INT NOT NULL,
    TransactionType NVARCHAR(30) NOT NULL,
    Amount          DECIMAL(18,2) NOT NULL,
    FromUserID      INT NULL,
    ToUserID        INT NULL,
    Description     NVARCHAR(500) NULL,
    TransactionDate DATETIME NOT NULL DEFAULT GETDATE(),
    CreatedBy       INT NULL,
    FOREIGN KEY (WalletID) REFERENCES Wallets(WalletID)
)
GO

-- AUDITS
CREATE TABLE Audits (
    AuditID      INT IDENTITY(1,1) PRIMARY KEY,
    AuditType    NVARCHAR(30) NOT NULL,
    ManagerID    INT NOT NULL,
    AuditAmount  DECIMAL(18,2) NOT NULL,
    AuditDate    DATETIME NOT NULL DEFAULT GETDATE(),
    ApprovedBy   INT NULL,
    ApprovedDate DATETIME NULL,
    Status       NVARCHAR(20) NOT NULL DEFAULT 'Pending',
    Notes        NVARCHAR(500) NULL,
    FOREIGN KEY (ManagerID) REFERENCES Users(UserID),
    FOREIGN KEY (ApprovedBy) REFERENCES Users(UserID)
)
GO

-- OFFICE EXPENSES
CREATE TABLE OfficeExpenses (
    ExpenseID    INT IDENTITY(1,1) PRIMARY KEY,
    ExpenseType  NVARCHAR(50) NOT NULL,
    Amount       DECIMAL(18,2) NOT NULL,
    Description  NVARCHAR(500) NULL,
    ExpenseDate  DATETIME NOT NULL DEFAULT GETDATE(),
    CreatedBy    INT NOT NULL,
    ApprovedBy   INT NULL,
    ApprovedDate DATETIME NULL,
    Status       NVARCHAR(20) NOT NULL DEFAULT 'Pending',
    FOREIGN KEY (CreatedBy) REFERENCES Users(UserID),
    FOREIGN KEY (ApprovedBy) REFERENCES Users(UserID)
)
GO

-- SYSTEM SETTINGS
CREATE TABLE SystemSettings (
    SettingID    INT IDENTITY(1,1) PRIMARY KEY,
    SettingKey   NVARCHAR(100) NOT NULL UNIQUE,
    SettingValue NVARCHAR(500) NOT NULL,
    UpdatedBy    INT NULL,
    UpdatedDate  DATETIME NOT NULL DEFAULT GETDATE()
)
GO

-- INDEXES
CREATE INDEX IX_Users_Role ON Users(Role)
CREATE INDEX IX_Collections_AgentID ON Collections(AgentID)
CREATE INDEX IX_Collections_Date ON Collections(CollectionDate)
CREATE INDEX IX_Customers_Aadhaar ON Customers(AadhaarNumber)
CREATE INDEX IX_Accounts_CustomerID ON Accounts(CustomerID)
GO

-- STORED PROCEDURES
CREATE PROCEDURE sp_GenerateAccountNumber
    @LoanType NVARCHAR(20),
    @AccountNumber NVARCHAR(20) OUTPUT
AS
BEGIN
    DECLARE @Prefix NVARCHAR(3)
    DECLARE @LastNum INT
    SET @Prefix = CASE @LoanType WHEN 'Daily' THEN 'D-' WHEN 'Weekly' THEN 'W-' ELSE 'M-' END
    SELECT @LastNum = ISNULL(MAX(CAST(SUBSTRING(AccountNumber,3,LEN(AccountNumber)) AS INT)),0)
    FROM Accounts WHERE AccountNumber LIKE @Prefix+'%'
    SET @AccountNumber = @Prefix + RIGHT('000000'+CAST(@LastNum+1 AS NVARCHAR),6)
END
GO

CREATE PROCEDURE sp_VerifyAgentCollections
    @AgentID INT, @VerifiedBy INT, @Date DATE = NULL
AS
BEGIN
    IF @Date IS NULL SET @Date = CAST(GETDATE() AS DATE)
    BEGIN TRANSACTION
    BEGIN TRY
        DECLARE @Total DECIMAL(18,2)
        SELECT @Total = ISNULL(SUM(Amount),0) FROM Collections
        WHERE AgentID=@AgentID AND CAST(CollectionDate AS DATE)=@Date AND IsVerified=0
        UPDATE Collections SET IsVerified=1,VerifiedBy=@VerifiedBy,VerifiedDate=GETDATE(),TransferredTo=@VerifiedBy
        WHERE AgentID=@AgentID AND CAST(CollectionDate AS DATE)=@Date AND IsVerified=0
        UPDATE Wallets SET Balance=Balance+@Total, LastUpdated=GETDATE() WHERE UserID=@VerifiedBy
        INSERT INTO WalletTransactions(WalletID,TransactionType,Amount,FromUserID,ToUserID,Description)
        SELECT WalletID,'Credit',@Total,@AgentID,@VerifiedBy,'Agent collection verified'
        FROM Wallets WHERE UserID=@VerifiedBy
        COMMIT TRANSACTION
        SELECT 1 AS Success, @Total AS Amount
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION
        SELECT 0 AS Success, 0 AS Amount
    END CATCH
END
GO

CREATE PROCEDURE sp_AdminAuditTransfer
    @ManagerID INT, @AdminID INT
AS
BEGIN
    BEGIN TRANSACTION
    BEGIN TRY
        DECLARE @Bal DECIMAL(18,2)
        SELECT @Bal = Balance FROM Wallets WHERE UserID=@ManagerID
        UPDATE Wallets SET Balance=0, LastUpdated=GETDATE() WHERE UserID=@ManagerID
        UPDATE Wallets SET Balance=Balance+@Bal, LastUpdated=GETDATE() WHERE UserID=@AdminID
        INSERT INTO WalletTransactions(WalletID,TransactionType,Amount,FromUserID,ToUserID,Description)
        SELECT WalletID,'Transfer',@Bal,@ManagerID,@AdminID,'Audit transfer to main wallet'
        FROM Wallets WHERE UserID=@AdminID
        INSERT INTO Audits(AuditType,ManagerID,AuditAmount,ApprovedBy,ApprovedDate,Status)
        VALUES('Manual',@ManagerID,@Bal,@AdminID,GETDATE(),'Approved')
        COMMIT TRANSACTION
        SELECT 1 AS Success, @Bal AS Amount
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION
        SELECT 0 AS Success, 0 AS Amount
    END CATCH
END
GO

-- DEFAULT DATA
INSERT INTO Users (FullName,MobileNumber,Username,PasswordHash,Role,Status)
VALUES ('System Admin','9999999999','admin',
'8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918','ADMIN','Active')
-- Default password: admin123 (SHA256)

INSERT INTO Areas (AreaName,AreaCode) VALUES
('North Street','NS001'),('Market Road','MR001'),('Bus Stand','BS001'),
('Perumanallur','PM001'),('Avinashi','AV001'),('Palladam','PD001')

INSERT INTO Wallets (UserID,WalletType,Balance) VALUES (1,'Main',0)

INSERT INTO SystemSettings (SettingKey,SettingValue) VALUES
('AppName','Loan Management System'),
('DailyLoanLimit','50000'),('WeeklyLoanLimit','200000'),
('MonthlyLoanLimit','500000'),('CustomerExposureLimit','100000'),
('ExpenseApprovalLimit','5000'),('OTPExpireMinutes','5')
GO

PRINT 'Database ready! Login: admin / admin123'
GO
