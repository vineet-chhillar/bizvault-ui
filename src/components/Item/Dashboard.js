import React, { useEffect, useState } from "react";
import "./Dashboard.css";
import { useNavigate } from "react-router-dom";
import {  BarChart,  Bar,  XAxis,  YAxis,  Tooltip,  ResponsiveContainer,  LineChart,  Line,  CartesianGrid,  Legend} from "recharts";

{/*import dashboardIcon from "../../assets/dashboard-icon.png";*/}



export default function Dashboard({ user }) {
const [dashboard, setDashboard] = useState(null);
const [outstandingRows, setOutstandingRows] = useState([]);
const [profit, setProfit] = useState({
  Revenue: 0,
  Expenses: 0,
  NetProfit: 0
});
const [stockAlerts, setStockAlerts] = useState([]);
const navigate = useNavigate();
useEffect(() => {
  window.chrome?.webview?.postMessage({
    action: "GetDashboardOutstanding"
  });
}, []);

function toYMD(d) {
  const pad = (n) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

useEffect(() => {
  const now = new Date();
  const from = toYMD(new Date(now.getFullYear(), now.getMonth(), 1));
  const to = toYMD(now);

  window.chrome.webview.postMessage({
    Action: "getDashboardProfitLoss",
    Payload: { From: from, To: to }
  });
}, []);
useEffect(() => {
  window.chrome.webview.postMessage({
    Action: "getDashboardStockAlerts"
  });
}, []);
useEffect(() => {
  console.log("📦 Full dashboard payload:", dashboard);
}, [dashboard]);

useEffect(() => {
  window.chrome.webview.postMessage({
    action: "getDashboardSummary"
  });

  const handler = (e) => {
    const msg = e.data;
    if (msg.action === "getDashboardSummaryResult") {
      setDashboard(msg.data);
      console.log("📊 Chart data:", dashboard?.SalesPurchaseChart);

    }
    if (msg.action === "GetDashboardOutstandingResult") {
      setOutstandingRows(msg.data || []);
    }
    if (msg?.action === "getDashboardProfitLossResult") {
      setProfit(msg.data);
    }
    if (msg.action === "getDashboardStockAlertsResult") {
      setStockAlerts(msg.rows || []);
    }
  };

  window.chrome.webview.addEventListener("message", handler);
  return () =>
    window.chrome.webview.removeEventListener("message", handler);
}, []);





  return (
    <div className="form-container">

        
    {/*<div className="dashboard-title-row">
  <img
    src={dashboardIcon}
    alt="Dashboard"
    className="dashboard-icon"
  />
  <h2 className="form-title" style={{ margin: 0 }}>
    Dashboard
  </h2>
</div>*/}



      <p style={{ marginBottom: 16, color: "#480777ff" }}>
        Welcome {user?.name || "User"}, here’s a quick snapshot of your business
      </p>

      {/* 🔹 SUMMARY CARDS */}
      <div className="dashboard-grid">
        <SummaryCard title="Cash Balance" value={`₹ ${dashboard?.CashBalance.toFixed(2)}`} />
<SummaryCard title="Bank Balance" value={`₹ ${dashboard?.BankBalance.toFixed(2)}`} />
<SummaryCard title="Receivables" value={`₹ ${dashboard?.TotalReceivable.toFixed(2)}`} />
<SummaryCard title="Payables" value={`₹ ${dashboard?.TotalPayable.toFixed(2)}`} />
<SummaryCard title="Today Sales" value={`₹ ${dashboard?.TodaySales.toFixed(2)}`} />
<SummaryCard title="Today Purchase" value={`₹ ${dashboard?.TodayPurchase.toFixed(2)}`} />

      </div>

      {/* 🔹 SECOND ROW */}
      <div className="dashboard-row">

        {/* Outstanding */}
        <div className="dashboard-box">
  <h3 className="dashboard-box-title">Outstanding Highlights</h3>

  <table className="data-table small">
    <thead>
      <tr>
        <th>Party</th>
        <th style={{ textAlign: "right" }}>Amount</th>
      </tr>
    </thead>

    <tbody>
      {outstandingRows.length === 0 && (
        <tr>
          <td colSpan={2} style={{ textAlign: "center", color: "#888" }}>
            No outstanding balances
          </td>
        </tr>
      )}

      {outstandingRows.map(r => (
        <tr
          key={r.AccountId}
          style={{ cursor: "pointer" }}
          title="Click to view Account Statement"
          onClick={() =>
            window.chrome.webview.postMessage({
              Action: "OpenAccountStatement",
              Payload: { AccountId: r.AccountId }
            })
          }
        >
          <td>{r.AccountName}</td>

          <td
            style={{
              textAlign: "right",
              fontWeight: 600,
              color: r.Balance > 0 ? "#27ae60" : "#c0392b"
            }}
          >
            ₹{Math.abs(r.Balance).toFixed(2)}
          </td>
        </tr>
      ))}
    </tbody>
  </table>

  <div className="inventory-btns" style={{ marginTop: 8 }}>
    <button
      className="btn-submit small"
      onClick={() => navigate("/Reports/OutstandingReport")}
    >
      View Outstanding Report
    </button>
  </div>
</div>


        {/* Profit Snapshot */}
        <div className="dashboard-box">
  <h3 className="dashboard-box-title">
    Profit Snapshot (This Month)
  </h3>

  <table className="data-table small">
  <tbody>
    <tr>
      <td>Revenue</td>
      <td style={{ textAlign: "right", color: "#27ae60" }}>
        ₹{(profit?.Revenue ?? 0).toFixed(2)}
      </td>
    </tr>

    <tr>
      <td>Expenses</td>
      <td style={{ textAlign: "right", color: "#c0392b" }}>
        ₹{(profit?.Expenses ?? 0).toFixed(2)}
      </td>
    </tr>

    <tr style={{ fontWeight: 600 }}>
      <td>{profit?.NetProfit >= 0 ? "Net Profit" : "Net Loss"}</td>
      <td
        style={{
          textAlign: "right",
          color: profit?.NetProfit >= 0 ? "#27ae60" : "#c0392b"
        }}
      >
        ₹{Math.abs(profit?.NetProfit ?? 0).toFixed(2)}
      </td>
    </tr>
  </tbody>
</table>


  <div className="inventory-btns" style={{ marginTop: 8 }}>
    <button
    className="btn-submit small"
    onClick={() => navigate("/Reports/ProfitLossReport")}
  >
    View Profit & Loss
  </button>
  </div>
</div>


      </div>

      {/* 🔹 THIRD ROW */}
      <div className="dashboard-row">

        {/* Stock Alerts */}
        <div className="dashboard-box">
  <h3 className="dashboard-box-title">Stock Alerts</h3>

  <table className="data-table small">
    <thead>
      <tr>
        <th>Item</th>
        <th>Status</th>
      </tr>
    </thead>

    <tbody>
      {stockAlerts.length === 0 && (
        <tr>
          <td colSpan={2} style={{ textAlign: "center" }}>
            All stocks are healthy ✅
          </td>
        </tr>
      )}

      {stockAlerts.map((s) => (
        <tr key={s.ItemId}>
          <td>{s.ItemName}</td>
          <td
            style={{
              fontWeight: 600,
              color: s.Status === "OUT" ? "#c0392b" : "#d35400"
            }}
          >
            {s.Status === "OUT"
              ? "Out of Stock"
              : `Low Stock (${s.CurrentQty})`}
          </td>
        </tr>
      ))}
    </tbody>
  </table>

  <div className="inventory-btns" style={{ marginTop: 8 }}>
    <button
  className="btn-submit small"
  onClick={() => navigate("/Reports/StockSummary")}
>
  View Stock Summary
</button>

  </div>
</div>


        {/* Quick Actions */}
        <div className="dashboard-box">
  <h3 className="dashboard-box-title">Quick Actions</h3>

  <div className="quick-actions-list">
  <button className="btn-submit small"
  onClick={() => navigate("/Item/InvoiceEditor")}

  >
    ➕ Sales Invoice

  </button>
  <button className="btn-submit small"
  onClick={() => navigate("/Item/PurchaseInvoiceEditor")}
  >
    
    ➕ Purchase Invoice</button>
  <button className="btn-submit small"
  onClick={() => navigate("/Item/ExpenseVoucherEditor")}
  >💰 Expense</button>
  <button className="btn-submit small"
  onClick={() => navigate("/Item/VoucherEditor")}
  >💸 Voucher Entry</button>
</div>
</div>


      </div>

      {/* 🔹 CHARTS SECTION */}
{/* 🔹 CHARTS SECTION */}
<div className="dashboard-charts-row">

  <div className="dashboard-box">
  <h3 className="dashboard-box-title">
    Sales vs Purchase (This Month)
  </h3>

  <div className="chart-container">
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={dashboard?.SalesPurchaseChart || []}>
        <XAxis dataKey="Label" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="Sales" fill="#b150b9ff" />
        <Bar dataKey="Purchase" fill="#350655ff" />
      </BarChart>
    </ResponsiveContainer>
  </div>
</div>

  <div className="dashboard-box">
    <h3 className="dashboard-box-title">
      Cash & Bank Balance Trend (Last 7 Days)
    </h3>

    <div className="chart-container">
      
      <ResponsiveContainer width="100%" height={240}>
  <LineChart data={dashboard?.CashBankTrend || []}>
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis dataKey="Date" />
    <YAxis />
    <Tooltip />
    <Legend />
    <Line type="monotone" dataKey="Cash" stroke="#2e7d32" />
    <Line type="monotone" dataKey="Bank" stroke="#1565c0" />
  </LineChart>
</ResponsiveContainer>

    </div>
  </div>

</div>


    </div>



  );
}

/* 🔹 Summary Card */
function SummaryCard({ title, value }) {
  return (
    <div className="dashboard-card">
      <div className="dashboard-card-title">{title}</div>
      <div className="dashboard-card-value">{value}</div>
    </div>
  );
}
