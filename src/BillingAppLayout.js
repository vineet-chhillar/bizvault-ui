import React, { useState, useEffect } from "react";
import CreateItem from "./components/Item/CreateItem";
import EditItem from "./components/Item/EditItem";
import CompanySetup from "./components/Item/CompanySetup";
import PurchaseInvoiceEditor from "./components/Item/PurchaseInvoiceEditor";
import EditPurchaseInvoice from "./components/Item/EditPurchaseInvoice";
import EditSalesInvoice from "./components/Item/EditSalesInvoice";
import InvoiceEditor from "./components/Item/InvoiceEditor";

import Dashboard from "./components/Item/Dashboard";
import SupplierPage from "./components/Item/SupplierPage";
import CustomerPage from "./components/Item/CustomerPage";

import VoucherEditor from "./components/Item/VoucherEditor";

import ExpenseVoucherEditor from "./components/Item/ExpenseVoucherEditor";
import IncomeVoucherEditor from "./components/Item/IncomeVoucherEditor";


import OpeningStockEditor from "./components/Item/OpeningStockEditor";
import StockAdjustmentEditor from "./components/Item/StockAdjustmentEditor";


import ChartOfAccounts from "./components/Item/ChartOfAccounts";
import SalesReturnNew from "./components/Item/SalesReturnNew";
import PurchaseReturn from "./components/Item/PurchaseReturn";

import TrialBalance from "./components/Reports/TrialBalance";
import DayBookReport from "./components/Reports/DayBookReport";
import VoucherReport from "./components/Reports/VoucherReport";
import CashBookReport from "./components/Reports/CashBookReport";
import BankBookReport from "./components/Reports/BankBookReport";
import LedgerReport from "./components/Reports/LedgerReport";
import OutstandingReport from "./components/Reports/OutstandingReport";
import ProfitLossReport from "./components/Reports/ProfitLossReport";
import BalanceSheet from "./components/Reports/BalanceSheet";
import StockValuationFIFO from "./components/Reports/StockValuationFIFO";
import StockSummary from "./components/Reports/StockSummary";
import UserMenu from "./components/Item/UserMenu"; // adjust path if needed

import { Navigate } from "react-router-dom";
import ChangePasswordModal from "./components/Item/ChangePasswordModal";
import CreateUserModal from "./components/Item/CreateUserModal";
import UserList from "./components/Admin/UserList";
import AccessSettings from "./utils/AccessSettings";
import { hasPermission } from "./utils/Permissions";
import { PERMISSIONS } from "./utils/PermissionKeys";


import {
  BrowserRouter as Router,
  Routes,
  Route,
  NavLink,
  useLocation,
} from "react-router-dom";
import "./App.css";
import "./BillingAppLayout.css";
import logo from "./assets/brandlogo1.png"; // <-- add this at the top
import {
  FaHome,
  FaChartBar,
  FaFileInvoice,
  FaCog,
  FaBell,
  FaUserShield,
  FaMoneyBillWave,
  FaShoppingCart,
  FaChartLine,
  FaWallet,
  FaTruck,
  FaUser,
  FaBoxes,
  FaCubes,
  FaKey,
  FaUserPlus,
  FaSignOutAlt
} from "react-icons/fa";



/* Hook: derive title from route */
{/*function usePageTitle() {
  const location = useLocation();
  const [title, setTitle] = useState("Home");
   useEffect(() => {
    const map = {
      "/": "Home",
      "Item/Dashboard": "Dashboard",
      "/chartofaccounts": "Accounts",
      "/supplier": "Supplier",
      "/customer": "Customer",
      "/sales": "Sales",
      "/purchase": "Purchase",
      "/inventory": "Inventory",
      "/item": "Item",
      "/Reports": "Reports",
    };
    setTitle(map[location.pathname] || "BizVault");
  }, [location]);

  return title;
}*/}

/* Top navbar (uses hook — must be inside Router) */
function TopNavbar({
  onToggle,
  isMobile,
  collapsed,
  onLogout,
  user,
  onChangePassword,
  onCreateUser,
  forceChangePassword
}) {

  {/*const title = usePageTitle();*/}
  // label for the header toggle button
  const buttonLabel = isMobile ? "☰" : collapsed ? "▶" : "◀";
console.log("USER AT MENU:", user);


  return (
    <header className="top-navbar">
      <button
        className="menu-toggle mobile-only"
        onClick={onToggle}
        aria-label="Toggle menu"
      >
        {buttonLabel}
      </button>

      <h1 className="app-title">{}</h1>

      <div className="navbar-actions">
        <button className="icon-btn" title="Notifications">
          <FaBell />
        </button>
        
        <button className="icon-btn" title="Settings">
          <FaCog />
        </button>
 
     <UserMenu
  user={user}
  onLogout={onLogout}
  onChangePassword={onChangePassword}
  onCreateUser={onCreateUser}
  forceChangePassword={forceChangePassword}
/>

      </div>
    </header>
  );
}

 export default function BillingAppLayout({ user, onLogout, sendToCSharp, lastAction, forceChangePassword,  clearForceChangePassword, clearLastAction }) {
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showCreateUser, setShowCreateUser] = useState(false);
const [changePasswordSuccess, setChangePasswordSuccess] = useState(false);
const [createUserSuccess, setCreateUserSuccess] = useState(false);
const refreshUsers = () => {
  sendToCSharp("GetUsers", {});
};

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isItemOpen, setIsItemOpen] = useState(false);
  const [isStockOpen, setIsStockOpen] = useState(false);
  const [isSalesOpen, setIsSalesOpen] = useState(true);
  const [isPurchaseOpen, setIsPurchaseOpen] = useState(false);
  const [isReportsOpen, setIsReportsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth <= 768 : false
  );
  useEffect(() => {
  if (forceChangePassword) {
    setShowChangePassword(true);
  }
}, [forceChangePassword]);
function ProtectedRoute({ allow, children }) {
  return allow ? children : <Navigate to="/" replace />;
}

useEffect(() => {
  if (lastAction === "ChangePasswordSuccess") {
    setShowChangePassword(false);
    clearForceChangePassword();
    alert("Password changed successfully");
    clearLastAction(); // ✅ VERY IMPORTANT
  }

  if (lastAction === "CreateUserSuccess") {
    setShowCreateUser(false);
    alert("User created successfully");
    clearLastAction(); // ✅ VERY IMPORTANT
  }
}, [lastAction]);


  useEffect(() => {
    const onResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (!mobile) setMobileOpen(false); // close mobile menu when switching to desktop
    };
    window.addEventListener("resize", onResize);
    onResize();
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const toggleSidebar = () => {
    if (isMobile) setMobileOpen((v) => !v);
    else setCollapsed((v) => !v);
  };

  const closeMobile = () => setMobileOpen(false);

  return (
    <Router>
      <div className="app-container">
        {/* dark overlay for mobile when menu open */}
        {mobileOpen && <div className="overlay" onClick={closeMobile} />}

        <aside
  className={`sidebar
    ${collapsed ? "collapsed" : ""}
    ${mobileOpen ? "mobile-open" : ""}
    ${forceChangePassword ? "disabled" : ""}
  `}
>

          <div className="sidebar-header">
              <div className="logo-container">
                <img src={logo} alt="DhanSutra Logo" className="app-logo" />
              </div>
              <button className="menu-toggle" onClick={toggleSidebar}>
  {collapsed ? "▶" : "◀"}
</button>
          </div>

          <nav className="nav-links">


         


              <NavLink
              to="Item/Dashboard"
              onClick={() => isMobile && setMobileOpen(false)}
              className={({ isActive }) =>
                "nav-link" + (isActive ? " active" : "")
              }
            >
              <span className="icon"><FaChartBar /></span>
              <span className="label">Dashboard</span>
            </NavLink>

{hasPermission(user, PERMISSIONS.USERS) && (
  <NavLink
    to="/Admin/UserList"
    onClick={() => isMobile && setMobileOpen(false)}
    className={({ isActive }) =>
            "nav-link" + (isActive ? " active" : "")
    }
  >
    <span className="icon">👤</span>
    <span className="label">Users</span>
  </NavLink>
)}


{hasPermission(user, PERMISSIONS.SETTINGS) && (
             <NavLink
              to="utils/AccessSettings"
              onClick={() => isMobile && setMobileOpen(false)}
              className={({ isActive }) =>
                "nav-link" + (isActive ? " active" : "")
              }
            >
              <span className="icon"><FaChartBar /></span>
              <span className="label">Access Settings</span>
            </NavLink>
)}

{hasPermission(user, PERMISSIONS.SETTINGS) && (
             <NavLink
              to="Item/CompanySetup"
              onClick={() => isMobile && setMobileOpen(false)}
              className={({ isActive }) =>
                "nav-link" + (isActive ? " active" : "")
              }
            >
              <span className="icon"><FaBoxes /></span>
              <span className="label">Company Profile</span>
            </NavLink>
)}

{hasPermission(user, PERMISSIONS.SETTINGS) && (
           <NavLink
              to="/Masters"
              onClick={() => isMobile && setMobileOpen(false)}
              className={({ isActive }) =>
                "nav-link" + (isActive ? " active" : "")
              }
            >
              <span className="icon"><FaMoneyBillWave /></span>
              <span className="label">Masters</span>
            </NavLink>
)}

{hasPermission(user, PERMISSIONS.VOUCHERS) && (
            <NavLink
              to="Item/ChartOfAccounts"
              onClick={() => isMobile && setMobileOpen(false)}
              className={({ isActive }) =>
                "nav-link" + (isActive ? " active" : "")
              }
            >
              <span className="icon"><FaWallet /></span>
              <span className="label">Accounts</span>
            </NavLink>
)}

            {hasPermission(user, PERMISSIONS.MASTERS) && (
            <NavLink
              to="Item/SupplierPage"
              onClick={() => isMobile && setMobileOpen(false)}
              className={({ isActive }) =>
                "nav-link" + (isActive ? " active" : "")
              }
            >
              <span className="icon"><FaTruck /></span>
              <span className="label">Supplier</span>
            </NavLink>
            )}
            

{hasPermission(user, PERMISSIONS.MASTERS) && (
            <NavLink
              to="Item/CustomerPage"
              onClick={() => isMobile && setMobileOpen(false)}
              className={({ isActive }) =>
                "nav-link" + (isActive ? " active" : "")
              }
            >
              <span className="icon">👤</span>
              <span className="label">Customer</span>
            </NavLink>
)}

{hasPermission(user, PERMISSIONS.VOUCHERS) && (
             <NavLink
              to="Item/VoucherEditor"
              onClick={() => isMobile && setMobileOpen(false)}
              className={({ isActive }) =>
                "nav-link" + (isActive ? " active" : "")
              }
            >
              <span className="icon">👤</span>
              <span className="label">Voucher Editor</span>
            </NavLink>
)}

{hasPermission(user, PERMISSIONS.VOUCHERS) && (
            <NavLink
              to="Item/IncomeVoucherEditor"
              onClick={() => isMobile && setMobileOpen(false)}
              className={({ isActive }) =>
                "nav-link" + (isActive ? " active" : "")
              }
            >
              <span className="icon">👤</span>
              <span className="label">Incomes</span>
            </NavLink>
)}

{hasPermission(user, PERMISSIONS.VOUCHERS) && (
            <NavLink
              to="Item/ExpenseVoucherEditor"
              onClick={() => isMobile && setMobileOpen(false)}
              className={({ isActive }) =>
                "nav-link" + (isActive ? " active" : "")
              }
            >
              <span className="icon">👤</span>
              <span className="label">Expenses</span>
            </NavLink>
)}
{/* Parent Link * for Opening Stock & Adjustments/}
<div className="nav-section">
  {/* Parent Link */}
  {hasPermission(user, PERMISSIONS.VOUCHERS) && (
  <div
    className="nav-link item-parent"
    onClick={() => setIsStockOpen(!isStockOpen)}
    style={{ cursor: "pointer" }}
  >
    <span className="icon"><FaCubes /></span>
    <span className="label">Opening Stock & Adjustments</span>
    <span className="arrow">{isStockOpen ? "▲" : "▼"}</span>
  </div>
  )}
  {/* Collapsible Children */}
  <div className={`nav-children-tabs ${isStockOpen ? "open" : ""}`}>
    <NavLink
      to="/item/OpeningStockEditor"
      onClick={() => isMobile && setMobileOpen(false)}
      className={({ isActive }) =>
        "nav-tab-link" + (isActive ? " active" : "")
      }
    >
      Opening Stock
    </NavLink>
<NavLink
      to="/item/StockAdjustmentEditor"
      onClick={() => isMobile && setMobileOpen(false)}
      className={({ isActive }) =>
        "nav-tab-link" + (isActive ? " active" : "")
      }
    >
      Stock Adjustment
    </NavLink>
      
  </div>
  
{/* ---Reports (Grouped Tab Style) --- */}
 {hasPermission(user, PERMISSIONS.REPORTS) && (
<div className="nav-section">
  {/* Parent Link */}
  <div
    className="nav-link item-parent"
    onClick={() => setIsReportsOpen(!isReportsOpen)}
    style={{ cursor: "pointer" }}
  >
    <span className="icon"><FaChartLine /></span>
    <span className="label">Reports</span>
    <span className="arrow">{isReportsOpen ? "▲" : "▼"}</span>
  </div>

  {/* Collapsible Children */}
  <div className={`nav-children-tabs ${isReportsOpen ? "open" : ""}`}>

<NavLink
      to="/Reports/DayBookReport"
      onClick={() => isMobile && setMobileOpen(false)}
      className={({ isActive }) =>
        "nav-tab-link" + (isActive ? " active" : "")
      }
    >
      Day Book
    </NavLink>

<NavLink
      to="/Reports/VoucherReport"
      onClick={() => isMobile && setMobileOpen(false)}
      className={({ isActive }) =>
        "nav-tab-link" + (isActive ? " active" : "")
      }
    >
      Voucher Report
    </NavLink>

    <NavLink
      to="/Reports/CashBookReport"
      onClick={() => isMobile && setMobileOpen(false)}
      className={({ isActive }) =>
        "nav-tab-link" + (isActive ? " active" : "")
      }
    >
      Cash Book Report
    </NavLink>

    <NavLink
      to="/Reports/BankBookReport"
      onClick={() => isMobile && setMobileOpen(false)}
      className={({ isActive }) =>
        "nav-tab-link" + (isActive ? " active" : "")
      }
    >
      Bank Book Report
    </NavLink>

    <NavLink
      to="/Reports/TrialBalance"
      onClick={() => isMobile && setMobileOpen(false)}
      className={({ isActive }) =>
        "nav-tab-link" + (isActive ? " active" : "")
      }
    >
      Trial Balance
    </NavLink>

    <NavLink
      to="/Reports/LedgerReport"
      onClick={() => isMobile && setMobileOpen(false)}
      className={({ isActive }) =>
        "nav-tab-link" + (isActive ? " active" : "")
      }
    >
      Account Statement Report
    </NavLink>

    <NavLink
      to="/Reports/OutstandingReport"
      onClick={() => isMobile && setMobileOpen(false)}
      className={({ isActive }) =>
        "nav-tab-link" + (isActive ? " active" : "")
      }
    >
      Outstanding Report
    </NavLink>

      <NavLink
      to="/Reports/ProfitLossReport"
      onClick={() => isMobile && setMobileOpen(false)}
      className={({ isActive }) =>
        "nav-tab-link" + (isActive ? " active" : "")
      }
    >
      Profit & Loss Report
    </NavLink>

    <NavLink
      to="/Reports/BalanceSheet"
      onClick={() => isMobile && setMobileOpen(false)}
      className={({ isActive }) =>
        "nav-tab-link" + (isActive ? " active" : "")
      }
    >
      Balance sheet
    </NavLink>

<NavLink
      to="/Reports/StockValuationFIFO"
      onClick={() => isMobile && setMobileOpen(false)}
      className={({ isActive }) =>
        "nav-tab-link" + (isActive ? " active" : "")
      }
    >
      Stock Valuation FIFO
    </NavLink>
    
    <NavLink
      to="/Reports/StockSummary"
      onClick={() => isMobile && setMobileOpen(false)}
      className={({ isActive }) =>
        "nav-tab-link" + (isActive ? " active" : "")
      }
    >
      Stock Summary
    </NavLink>

    
  </div>
</div>
 )}


{/* ---Purchase Invoice MENU (Grouped Tab Style) --- */}
{hasPermission(user, PERMISSIONS.VOUCHERS) && (
<div className="nav-section">
  {/* Parent Link */}
  <div
    className="nav-link item-parent"
    onClick={() => setIsPurchaseOpen(!isPurchaseOpen)}
    style={{ cursor: "pointer" }}
  >
    <span className="icon"><FaShoppingCart /></span>
    <span className="label">Purchase</span>
    <span className="arrow">{isPurchaseOpen ? "▲" : "▼"}</span>
  </div>

  {/* Collapsible Children */}
  <div className={`nav-children-tabs ${isPurchaseOpen ? "open" : ""}`}>
    <NavLink
      to="/item/PurchaseInvoiceEditor"
      onClick={() => isMobile && setMobileOpen(false)}
      className={({ isActive }) =>
        "nav-tab-link" + (isActive ? " active" : "")
      }
    >
      Create/View/Print Purchase Invoice
    </NavLink>

    <NavLink
      to="/item/EditPurchaseInvoice"
      onClick={() => isMobile && setMobileOpen(false)}
      className={({ isActive }) =>
        "nav-tab-link" + (isActive ? " active" : "")
      }
    >
      Edit Purchase Invoice
    </NavLink>

    
   


    <NavLink
      to="/item/PurchaseReturn"
      onClick={() => isMobile && setMobileOpen(false)}
      className={({ isActive }) =>
        "nav-tab-link" + (isActive ? " active" : "")
      }
    >
     Purchase Return
    </NavLink>

    
  </div>
</div>
)}




{/* ---Sales Invoice MENU (Grouped Tab Style) --- */}
{hasPermission(user, PERMISSIONS.VOUCHERS) && (
<div className="nav-section">
  {/* Parent Link */}
  <div
    className="nav-link item-parent"
    onClick={() => setIsSalesOpen(!isSalesOpen)}
    style={{ cursor: "pointer" }}
  >
    <span className="icon"><FaMoneyBillWave /></span>
    <span className="label">Sales</span>
    <span className="arrow">{isSalesOpen ? "▲" : "▼"}</span>
  </div>

  {/* Collapsible Children */}
  <div className={`nav-children-tabs ${isSalesOpen ? "open" : ""}`}>
        <NavLink
      to="/item/InvoiceEditor"
      onClick={() => isMobile && setMobileOpen(false)}
      className={({ isActive }) =>
        "nav-tab-link" + (isActive ? " active" : "")
      }
    >
      Create/View/Print Sales Invoice
    </NavLink>

<NavLink
      to="/item/EditSalesInvoice"
      onClick={() => isMobile && setMobileOpen(false)}
      className={({ isActive }) =>
        "nav-tab-link" + (isActive ? " active" : "")
      }
    >
      Edit Sales Invoice
    </NavLink>

   <NavLink
      to="/item/SalesReturnNew"
      onClick={() => isMobile && setMobileOpen(false)}
      className={({ isActive }) =>
        "nav-tab-link" + (isActive ? " active" : "")
      }
    >
      Sales Return
    </NavLink>



    
  </div>
</div>
)}
           
{/* --- ITEM MENU (Grouped Tab Style) --- */}
{hasPermission(user, PERMISSIONS.MASTERS) && (
<div className="nav-section">
  {/* Parent Link */}
  <div
    className="nav-link item-parent"
    onClick={() => setIsItemOpen(!isItemOpen)}
    style={{ cursor: "pointer" }}
  >
    <span className="icon"><FaCubes /></span>
    <span className="label">Item</span>
    <span className="arrow">{isItemOpen ? "▲" : "▼"}</span>
  </div>

  {/* Collapsible Children */}
  <div className={`nav-children-tabs ${isItemOpen ? "open" : ""}`}>
    <NavLink
      to="/item/CreateItem"
      onClick={() => isMobile && setMobileOpen(false)}
      className={({ isActive }) =>
        "nav-tab-link" + (isActive ? " active" : "")
      }
    >
      Create Item
    </NavLink>
<NavLink
      to="/item/EditItem"
      onClick={() => isMobile && setMobileOpen(false)}
      className={({ isActive }) =>
        "nav-tab-link" + (isActive ? " active" : "")
      }
    >
      View/Edit Item
    </NavLink>
   
    
  </div>
</div>
)}
          </nav>
        </aside>

        <div className="main-layout">
         <TopNavbar
  user={user}
  onLogout={onLogout}
  onChangePassword={() => setShowChangePassword(true)}
  onCreateUser={() => setShowCreateUser(true)}
   forceChangePassword={forceChangePassword}
/>





<Routes>
  {forceChangePassword ? (
    <Route
      path="*"
      element={
        <div style={{ padding: 20 }}>
          <h3>Password Change Required</h3>
          <p>Please change your password to continue.</p>
        </div>
      }
    />
  ) : (
    <>
  <Route path="/Item/CreateItem" element={
    <ProtectedRoute allow={hasPermission(user, PERMISSIONS.MASTERS)}>
    <CreateItem />
    </ProtectedRoute>
    }/>
  
  <Route path="/Item/EditItem" element={
    <ProtectedRoute allow={hasPermission(user, PERMISSIONS.MASTERS)}>
    <EditItem />
    </ProtectedRoute>
    } />
  

  <Route path="/Item/CompanySetup" element={
    <ProtectedRoute allow={hasPermission(user, PERMISSIONS.SETTINGS)}>
    <CompanySetup user={user} />
    </ProtectedRoute>
    } />
  
  <Route path="/Item/PurchaseInvoiceEditor" element={
    <ProtectedRoute allow={hasPermission(user, PERMISSIONS.VOUCHERS)}>
    <PurchaseInvoiceEditor user={user} />
    </ProtectedRoute>
    } />
  
  <Route path="/Item/EditPurchaseInvoice" element={
    <ProtectedRoute allow={hasPermission(user, PERMISSIONS.VOUCHERS)}>
    <EditPurchaseInvoice user={user} />
    </ProtectedRoute>
    } />
  
  <Route path="/Item/EditSalesInvoice" element={
    <ProtectedRoute allow={hasPermission(user, PERMISSIONS.VOUCHERS)}>
    <EditSalesInvoice user={user} />
    </ProtectedRoute>
    } />
  
  <Route path="/Item/InvoiceEditor" element={
    <ProtectedRoute allow={hasPermission(user, PERMISSIONS.VOUCHERS)}>
    <InvoiceEditor user={user} />
    </ProtectedRoute>
    } />
  

  <Route path="/Item/SalesReturnNew" element={
    <ProtectedRoute allow={hasPermission(user, PERMISSIONS.VOUCHERS)}>
    <SalesReturnNew user={user} />
    </ProtectedRoute>
    } />


  <Route path="/Item/PurchaseReturn" element={
    <ProtectedRoute allow={hasPermission(user, PERMISSIONS.VOUCHERS)}>
    <PurchaseReturn user={user} />
    </ProtectedRoute>
    } />
  

  <Route path="/Reports/DayBookReport" element={
    <ProtectedRoute allow={hasPermission(user, PERMISSIONS.REPORTS)}>
    <DayBookReport user={user} />
    </ProtectedRoute>
    } />
  
  <Route path="/Reports/VoucherReport" element={
    <ProtectedRoute allow={hasPermission(user, PERMISSIONS.REPORTS)}>
    <VoucherReport user={user} />
    </ProtectedRoute>
    } />
  
  <Route path="/Reports/CashBookReport" element={
    <ProtectedRoute allow={hasPermission(user, PERMISSIONS.REPORTS)}>
    <CashBookReport user={user} />
    </ProtectedRoute>
    } />

  <Route path="/Reports/BankBookReport" element={
    <ProtectedRoute allow={hasPermission(user, PERMISSIONS.REPORTS)}>
    <BankBookReport user={user} />
    </ProtectedRoute>
    } />

  <Route path="/Reports/TrialBalance" element={
    <ProtectedRoute allow={hasPermission(user, PERMISSIONS.REPORTS)}>
    <TrialBalance user={user} />
    </ProtectedRoute>
    } />
  
  <Route path="/Reports/LedgerReport" element={
    <ProtectedRoute allow={hasPermission(user, PERMISSIONS.REPORTS)}>
    <LedgerReport user={user} />
    </ProtectedRoute>
    } />


  <Route path="/Reports/OutstandingReport" element={
    <ProtectedRoute allow={hasPermission(user, PERMISSIONS.REPORTS)}>
    <OutstandingReport user={user} />
    </ProtectedRoute>
    } />

  <Route path="/Reports/ProfitLossReport" element={
    <ProtectedRoute allow={hasPermission(user, PERMISSIONS.REPORTS)}>
    <ProfitLossReport user={user} />
    </ProtectedRoute>
    } />
  
  <Route path="/Reports/BalanceSheet" element={
    <ProtectedRoute allow={hasPermission(user, PERMISSIONS.REPORTS)}>
    <BalanceSheet user={user} />
    </ProtectedRoute>
    } />

  <Route path="/Reports/StockValuationFIFO" element={
    <ProtectedRoute allow={hasPermission(user, PERMISSIONS.REPORTS)}>
    <StockValuationFIFO user={user} />
    </ProtectedRoute>
    } />

  <Route path="/Reports/StockSummary" element={
    <ProtectedRoute allow={hasPermission(user, PERMISSIONS.REPORTS)}>
    <StockSummary user={user} />
    </ProtectedRoute>
    } />

  <Route path="/Item/CustomerPage" element={
    <ProtectedRoute allow={hasPermission(user, PERMISSIONS.MASTERS)}>
    <CustomerPage user={user} />
    </ProtectedRoute>
    } />
  
  <Route path="/Item/VoucherEditor" element={
    <ProtectedRoute allow={hasPermission(user, PERMISSIONS.VOUCHERS)}>
    <VoucherEditor user={user} />
    </ProtectedRoute>
    } />

<Route path="/Item/IncomeVoucherEditor" element={
    <ProtectedRoute allow={hasPermission(user, PERMISSIONS.VOUCHERS)}>
    <IncomeVoucherEditor user={user} />
    </ProtectedRoute>
    } />

  <Route path="/Item/ExpenseVoucherEditor" element={
    <ProtectedRoute allow={hasPermission(user, PERMISSIONS.VOUCHERS)}>
    <ExpenseVoucherEditor user={user} />
    </ProtectedRoute>
    } />

  <Route path="/Item/OpeningStockEditor" element={
    <ProtectedRoute allow={hasPermission(user, PERMISSIONS.VOUCHERS)}>
    <OpeningStockEditor user={user} />
    </ProtectedRoute>
    } />

  <Route path="/Item/StockAdjustmentEditor" element={
    <ProtectedRoute allow={hasPermission(user, PERMISSIONS.VOUCHERS)}>
    <StockAdjustmentEditor user={user} />
    </ProtectedRoute>
    } />


  <Route path="/Item/ChartOfAccounts" element={
    <ProtectedRoute allow={hasPermission(user, PERMISSIONS.VOUCHERS)}>
    <ChartOfAccounts user={user} />
     </ProtectedRoute>
    } />
  
  
  <Route path="/Item/SupplierPage" element={
    <ProtectedRoute allow={hasPermission(user, PERMISSIONS.MASTERS)}>
    <SupplierPage user={user} />
    </ProtectedRoute>
    } />

  <Route path="/utils/AccessSettings" element={
    <ProtectedRoute allow={hasPermission(user, PERMISSIONS.SETTINGS)}>
    <AccessSettings user={user} />
    </ProtectedRoute>
    } />

  {/*<Route path="/"  element={<Navigate to="/Item/Dashboard" replace />}/>*/}

 <Route path="/Admin/UserList"  element={
  <ProtectedRoute allow={hasPermission(user, PERMISSIONS.USERS)}>
  <UserList user={user} sendToCSharp={sendToCSharp} />
    </ProtectedRoute>
  }
/>
 
 <Route path="/" element={<Navigate to="/Item/Dashboard" replace />} />
 <Route path="/Item/Dashboard" element={<Dashboard user={user} />} />

  



{/*}  {user.Role === "Admin" && (
  <Route
    path="/Admin/UserList"
    element={<ProtectedRoute allow={hasPermission(user, "users")}>
      <UserList user={user} sendToCSharp={sendToCSharp} />
    </ProtectedRoute>}
  />
)}*/}

</>
)}
  </Routes>

{showChangePassword && (
      <ChangePasswordModal
        user={user}
        sendToCSharp={sendToCSharp}
        onClose={() => setShowChangePassword(false)}
      />
    )}
    {showCreateUser && (
  <CreateUserModal
    sendToCSharp={sendToCSharp}
    onClose={() => setShowCreateUser(false)}
  />
)}
{forceChangePassword && (
  <div className="force-password-overlay">
    You must change your password to continue.
  </div>
)}



         
        </div>
      </div>
    </Router>
  );

}
