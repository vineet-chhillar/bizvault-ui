import React, { useEffect, useState } from "react";
import "./Reports.css";
export default function TrialBalance() {
const [modal, setModal] = useState({
  show: false,
  message: "",
  onClose: null
});
  const today = new Date();

const fyStartYear =
  today.getMonth() >= 3
    ? today.getFullYear()
    : today.getFullYear() - 1;

const fyStartDate = new Date(fyStartYear, 3, 1);

const [from, setFrom] = useState(
  `${fyStartDate.getFullYear()}-${String(
    fyStartDate.getMonth() + 1
  ).padStart(2, "0")}-${String(
    fyStartDate.getDate()
  ).padStart(2, "0")}`
);

  const [to, setTo] = useState(
    new Date().toISOString().slice(0, 10)
  );
 
  const [rows, setRows] = useState([]);
  const [report, setReport] = useState(null);
  const [loaded, setLoaded] = useState(false);
const toastRef = React.useRef(null);
function showToast(message) {
  if (toastRef.current) return;

  const toast = document.createElement("div");
  toast.innerText = message;

  toast.style.position = "fixed";
  toast.style.top = "50%";
  toast.style.left = "50%";
  toast.style.transform = "translate(-50%, -50%)";
  toast.style.background = "#333";
  toast.style.color = "#fff";
  toast.style.padding = "14px 22px";
  toast.style.borderRadius = "8px";
  toast.style.zIndex = 9999;
  toast.style.fontSize = "15px";
  toast.style.boxShadow = "0 4px 12px rgba(0,0,0,0.3)";

  document.body.appendChild(toast);
  toastRef.current = toast;
}

function hideToast() {
  if (toastRef.current) {
    toastRef.current.remove();
    toastRef.current = null;
  }
}
const exportPdf = () => {
    if (!loaded) {
      setModal({
        show: true,
        message: "Load report first.",
        onClose: null
      });
      return;
    }
    window.chrome.webview.postMessage({
      action: "exportTrialBalancePdf",
      payload: { From: from, To: to },
    });
  };
  const exportExcel = () => {
    if (!loaded) {
      setModal({
        show: true,
        message: "Load report first.",
        onClose: null
      });
      return;
    }
    showToast("Opening Excel…");
   window.chrome.webview.postMessage({
  action: "exportTrialBalanceExcel",
  payload: { From: from, To: to }
});

  };
  useEffect(() => {
    const handler = (e) => {
      const msg = e.data;
  console.log(msg);
console.log(msg.rows);
console.log(Array.isArray(msg.rows));
      if (msg.action === "getTrialBalanceResult") {

    
    if (!msg.success) {

        setModal({
            show: true,
            message:
                msg.Message || "Failed to load trial balance.",
            onClose: null
        });

        setRows([]);
        setLoaded(false);

        return;
    }

    // ✅ Success
  
    setRows(msg.rows || []);
setReport(msg);
setLoaded(true);
}
      if (msg.action === "generateTrialBalancePdfResult") {
        if (msg.success) {
          window.chrome.webview.postMessage({
            action: "openFile",
            data: { path: msg.path },
          });
        } else {
          setModal({
            show: true,
            message: "PDF generation failed.",
            onClose: null
          });
        }
      }
      if (msg.action === "exportTrialBalanceExcelResponse" && msg.success) {
  hideToast();
}

    };

    window.chrome.webview.addEventListener("message", handler);
    return () =>
      window.chrome.webview.removeEventListener("message", handler);
  }, []);

  const load = () => {
    window.chrome.webview.postMessage({
      action: "getTrialBalance",
      payload: {
        From: from,
        To: to,
      },
    });
  };

 
const totalDebit = Number(report?.totalDebit || 0);

const totalCredit = Number(report?.totalCredit || 0);
  return (
    <>
    <div className="form-container">
      <h2 className="form-title">Trial Balance</h2>

      
      <div className="form-inner">
        <div className="form-row-horizontal">
          <div className="form-group">
            <label>From</label>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>To</label>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>

          <div className="inventory-btns">
            <button className="btn-submit small" onClick={load}>
              Load
            </button>
            <button
              className="btn-submit small"
              type="button"
              onClick={exportPdf}
            >
              Export PDF
            </button>
             <button
              className="btn-submit small"
              type="button"
              onClick={exportExcel}
            >
              Export Excel
            </button>
          </div>
        </div>
      </div>

      
      <div className="table-container" style={{ marginTop: 20 }}>
        {!loaded && (
          <p style={{ textAlign: "center" }}>Load report to view data</p>
        )}

        {loaded && (
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: "40%" }}>Account</th>
                <th style={{ width: "20%" }}>Debit (Dr)</th>
                <th style={{ width: "20%" }}>Credit (Cr)</th>
                <th style={{ width: "20%" }}>Closing</th>
              </tr>
            </thead>

            <tbody>
  {rows.length === 0 && (
    <tr>
      <td colSpan={4} style={{ textAlign: "center" }}>
        No records
      </td>
    </tr>
  )}

 {Array.isArray(rows) &&
  rows.map((r) => (
    <tr
      key={r.AccountId}
      style={{
        fontWeight: r.IsGroupAccount ? "bold" : "normal",
        background: r.IsGroupAccount ? "#f5f5f5" : "white"
      }}
    >
     <td>
  <div
    style={{
      display: "flex",
      alignItems: "center",
      paddingLeft: `${(r.Level || 0) * 30}px`
    }}
  >
    {(r.Level || 0) > 0 && (
      <span
        style={{
          color: "#999",
          marginRight: 6,
          whiteSpace: "pre"
        }}
      >
        {"│ ".repeat((r.Level || 0) - 1) + "└─"}
      </span>
    )}

    <span>{r.AccountName}</span>
  </div>
</td>

      <td style={{ textAlign: "right" }}>
        {r.TotalDebit.toFixed(2)}
      </td>

      <td style={{ textAlign: "right" }}>
        {r.TotalCredit.toFixed(2)}
      </td>

      <td style={{ textAlign: "center" }}>
        {r.ClosingBalance.toFixed(2)} {r.ClosingSide}
      </td>
    </tr>
  ))}
</tbody>
           <tfoot>
  <tr>
    <th>Total</th>

    <th style={{ textAlign: "right" }}>
      {totalDebit.toFixed(2)}
    </th>

    <th style={{ textAlign: "right" }}>
      {totalCredit.toFixed(2)}
    </th>

    <th></th>
  </tr>
</tfoot>
          </table>
        )}
      </div>
    </div>
    {modal.show && (
  <div className="modal-overlay">
    <div className="modal-box">
      <p>{modal.message}</p>

      <div className="modal-actions">
        <button
          className="modal-btn ok"
          onClick={() => {
            modal.onClose?.();

            setModal({
              show: false,
              message: "",
              onClose: null
            });
          }}
        >
          OK
        </button>
      </div>
    </div>
  </div>
)}
    </>
  );
}
