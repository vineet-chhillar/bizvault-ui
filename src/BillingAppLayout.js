import React, { useState, useEffect } from "react";
import CreateItem from "./components/Item/CreateItem";
import EditInventory from "./components/Item/EditInventory";
import EditItem from "./components/Item/EditItem";

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
      "/dashboard": "Dashboard",
      "/reports": "Reports",
      "/accounts": "Accounts",
      "/supplier": "Supplier",
      "/customer": "Customer",
      "/sales": "Sales",
      "/purchase": "Purchase",
      "/invoice": "Invoice",
      "/inventory": "Inventory",
      "/item": "Item",
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
            <NavLink
  to="/Home"
  onClick={() => isMobile && setMobileOpen(false)}
  className={({ isActive }) =>
    "nav-link" + (isActive ? " active" : "")
  }
>
  <span className="icon"><FaHome /></span>
  <span className="label">Home</span>
</NavLink>

            <NavLink
              to="/dashboard"
              onClick={() => isMobile && setMobileOpen(false)}
              className={({ isActive }) =>
                "nav-link" + (isActive ? " active" : "")
              }
            >
              <span className="icon"><FaChartBar /></span>
              <span className="label">Dashboard</span>
            </NavLink>

            <NavLink
              to="/reports"
              onClick={() => isMobile && setMobileOpen(false)}
              className={({ isActive }) =>
                "nav-link" + (isActive ? " active" : "")
              }
            >
              <span className="icon"><FaChartLine /></span>
              <span className="label">Reports</span>
            </NavLink>

            <NavLink
              to="/accounts"
              onClick={() => isMobile && setMobileOpen(false)}
              className={({ isActive }) =>
                "nav-link" + (isActive ? " active" : "")
              }
            >
              <span className="icon"><FaWallet /></span>
              <span className="label">Accounts</span>
            </NavLink>

            <NavLink
              to="/supplier"
              onClick={() => isMobile && setMobileOpen(false)}
              className={({ isActive }) =>
                "nav-link" + (isActive ? " active" : "")
              }
            >
              <span className="icon"><FaTruck /></span>
              <span className="label">Supplier</span>
            </NavLink>

            <NavLink
              to="/customer"
              onClick={() => isMobile && setMobileOpen(false)}
              className={({ isActive }) =>
                "nav-link" + (isActive ? " active" : "")
              }
            >
              <span className="icon">👤</span>
              <span className="label">Customer</span>
            </NavLink>

            <NavLink
              to="/sales"
              onClick={() => isMobile && setMobileOpen(false)}
              className={({ isActive }) =>
                "nav-link" + (isActive ? " active" : "")
              }
            >
              <span className="icon"><FaMoneyBillWave /></span>
              <span className="label">Sales</span>
            </NavLink>

            <NavLink
              to="/purchase"
              onClick={() => isMobile && setMobileOpen(false)}
              className={({ isActive }) =>
                "nav-link" + (isActive ? " active" : "")
              }
            >
              <span className="icon"> <FaShoppingCart /> </span>
              <span className="label">Purchase</span>
            </NavLink>

            <NavLink
              to="/invoice"
              onClick={() => isMobile && setMobileOpen(false)}
              className={({ isActive }) =>
                "nav-link" + (isActive ? " active" : "")
              }
            >
              <span className="icon"><FaFileInvoice /></span>
              <span className="label">Invoice</span>
            </NavLink>

            <NavLink
              to="/inventory"
              onClick={() => isMobile && setMobileOpen(false)}
              className={({ isActive }) =>
                "nav-link" + (isActive ? " active" : "")
              }
            >
              <span className="icon"><FaBoxes /></span>
              <span className="label">Inventory</span>
            </NavLink>

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
      Create Item/Inventory
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
    <NavLink
      to="/item/EditInventory"
      onClick={() => isMobile && setMobileOpen(false)}
      className={({ isActive }) =>
        "nav-tab-link" + (isActive ? " active" : "")
      }
    >
     View/Edit Inventory
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
  <Route path="/Item/EditInventory" element={<EditInventory />} />
  <Route path="/Item/EditItem" element={<EditItem />} />
</Routes>
          {/*<main className="main-content">
          
            <Routes>
              <Route path="/" element={<h2>Welcome to Home</h2>} />
              <Route path="/dashboard" element={<h2>Dashboard Overview</h2>} />
              <Route path="/reports" element={<h2>Reports Section</h2>} />
              <Route path="/accounts" element={<h2>Accounts Details</h2>} />
              <Route path="/supplier" element={<h2>Supplier Management</h2>} />
              <Route path="/customer" element={<h2>Customer Records</h2>} />
              <Route path="/sales" element={<h2>Sales Module</h2>} />
              <Route path="/purchase" element={<h2>Purchase Records</h2>} />
              <Route path="/invoice" element={<h2>Invoice Generation</h2>} />
              <Route path="/inventory" element={<h2>Inventory Control</h2>} />
              <Route path="/item" element={<h2>Item Details</h2>} />
            </Routes>
          </main>*/}
        </div>
      </div>
    </Router>
  );

}
