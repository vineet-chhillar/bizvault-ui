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

import { Navigate } from "react-router-dom";


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
  FaCubes
} from "react-icons/fa";



/* Hook: derive title from route */
function usePageTitle() {
  const location = useLocation();
  const [title, setTitle] = useState("Home");
 



  useEffect(() => {
    const map = {
      "/": "Home",
      "Item/Dashboard": "Dashboard",
      "/reports": "Reports",
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
}

/* Top navbar (uses hook — must be inside Router) */
function TopNavbar({ onToggle, isMobile, collapsed, onLogout, user }) {
  const title = usePageTitle();
  // label for the header toggle button
  const buttonLabel = isMobile ? "☰" : collapsed ? "▶" : "◀";

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
 
        <button className="icon-btn" onClick={onLogout} title="Logout"><FaUserShield></FaUserShield></button>
        


        {/*<div className="icon-btn" title="Profile">
           
          {/*<img
            src="https://cdn-icons-png.flaticon.com/512/149/149071.png"
            alt="User"
          />
          <span className="icon-btn"><FaUserShield /></span>
        </div>*/}
      </div>
    </header>
  );
}

 export default function BillingAppLayout({ user, onLogout }) {
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
          className={`sidebar ${collapsed ? "collapsed" : ""} ${
            mobileOpen ? "mobile-open" : ""
          }`}
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



            {/*<NavLink
  to="Item/Dashboard"
  onClick={() => isMobile && setMobileOpen(false)}
  className={({ isActive }) =>
    "nav-link" + (isActive ? " active" : "")
  }
>
  <span className="icon"><FaHome /></span>
  <span className="label">Home</span>
</NavLink>*/}

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

{/* Parent Link * for Opening Stock & Adjustments/}
<div className="nav-section">
  {/* Parent Link */}
  <div
    className="nav-link item-parent"
    onClick={() => setIsStockOpen(!isStockOpen)}
    style={{ cursor: "pointer" }}
  >
    <span className="icon"><FaCubes /></span>
    <span className="label">Opening Stock & Adjustments</span>
    <span className="arrow">{isStockOpen ? "▲" : "▼"}</span>
  </div>

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
           

            

           

            {/*<NavLink
              to="Item/InvoiceEditor"
              onClick={() => isMobile && setMobileOpen(false)}
              className={({ isActive }) =>
                "nav-link" + (isActive ? " active" : "")
              }
            >
              <span className="icon"><FaFileInvoice /></span>
              <span className="label">Invoice</span>
            </NavLink>*/}
{/* ---Reports (Grouped Tab Style) --- */}
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



{/* ---Purchase Invoice MENU (Grouped Tab Style) --- */}
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





{/* ---Sales Invoice MENU (Grouped Tab Style) --- */}
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




            {/*<NavLink
              to="/inventory"
              onClick={() => isMobile && setMobileOpen(false)}
              className={({ isActive }) =>
                "nav-link" + (isActive ? " active" : "")
              }
            >
              <span className="icon"><FaBoxes /></span>
              <span className="label">Inventory</span>
            </NavLink>*/}

            

            {/*<NavLink
              to="/item"
              onClick={() => isMobile && setMobileOpen(false)}
              className={({ isActive }) =>
                "nav-link" + (isActive ? " active" : "")
              }
            >
              <span className="icon"><FaCubes /></span>
              <span className="label">Item</span>
            </NavLink>*/}

{/* --- ITEM MENU (Grouped Tab Style) --- */}
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







          </nav>
        </aside>

        <div className="main-layout">
          <TopNavbar
  onToggle={toggleSidebar}
  isMobile={isMobile}
  collapsed={collapsed}
  onLogout={onLogout}
  user={user}
/>
<Routes>
  <Route path="/Item/CreateItem" element={<CreateItem />}/>
  
  <Route path="/Item/EditItem" element={<EditItem />} />
  <Route path="/Item/CompanySetup" element={<CompanySetup user={user} />} />
  <Route path="/Item/PurchaseInvoiceEditor" element={<PurchaseInvoiceEditor user={user} />} />
  <Route path="/Item/EditPurchaseInvoice" element={<EditPurchaseInvoice user={user} />} />
  <Route path="/Item/EditSalesInvoice" element={<EditSalesInvoice user={user} />} />
  <Route path="/Item/InvoiceEditor" element={<InvoiceEditor user={user} />} />
  <Route path="/Item/SalesReturnNew" element={<SalesReturnNew user={user} />} />
  <Route path="/Item/PurchaseReturn" element={<PurchaseReturn user={user} />} />
  
  <Route path="/Reports/DayBookReport" element={<DayBookReport user={user} />} />
  <Route path="/Reports/VoucherReport" element={<VoucherReport user={user} />} />
  <Route path="/Reports/CashBookReport" element={<CashBookReport user={user} />} />
  <Route path="/Reports/BankBookReport" element={<BankBookReport user={user} />} />
  <Route path="/Reports/TrialBalance" element={<TrialBalance user={user} />} />
  <Route path="/Reports/LedgerReport" element={<LedgerReport user={user} />} />
  <Route path="/Reports/OutstandingReport" element={<OutstandingReport user={user} />} />
  <Route path="/Reports/ProfitLossReport" element={<ProfitLossReport user={user} />} />
  <Route path="/Reports/BalanceSheet" element={<BalanceSheet user={user} />} />
  <Route path="/Reports/StockValuationFIFO" element={<StockValuationFIFO user={user} />} />
  <Route path="/Reports/StockSummary" element={<StockSummary user={user} />} />

  <Route path="/Item/CustomerPage" element={<CustomerPage user={user} />} />
  <Route path="/Item/VoucherEditor" element={<VoucherEditor user={user} />} />
  <Route path="/Item/ExpenseVoucherEditor" element={<ExpenseVoucherEditor user={user} />} />
  <Route path="/Item/OpeningStockEditor" element={<OpeningStockEditor user={user} />} />
  <Route path="/Item/StockAdjustmentEditor" element={<StockAdjustmentEditor user={user} />} />
  <Route path="/Item/ChartOfAccounts" element={<ChartOfAccounts user={user} />} />
  <Route path="/Item/SupplierPage" element={<SupplierPage user={user} />} />
  <Route path="/"  element={<Navigate to="/Item/Dashboard" replace />}/>
  <Route path="/Item/Dashboard" element={<Dashboard user={user} />} />
  </Routes>

         
        </div>
      </div>
    </Router>
  );

}
