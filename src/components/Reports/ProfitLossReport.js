import React, { useState, useEffect } from "react";

export default function ProfitLossReport() {
  const [from, setFrom] = useState("2025-04-01");
  const [to, setTo] = useState(new Date().toISOString().slice(0, 10));
  const [report, setReport] = useState(null);
  const [loaded, setLoaded] = useState(false);
const exportPdf = () => {
    if (!loaded) {
      alert("Load report first");
      return;
    }
    window.chrome.webview.postMessage({
      action: "exportProfitLossPdf",
      payload: { From: from, To: to },
    });
  };
  const exportExcel = () => {
    if (!loaded) {
      alert("Load report first");
      return;
    }
    showToast("Exporting Excel...");
    window.chrome.webview.postMessage({
      action: "exportProfitLossExcel",
      payload: { From: from, To: to },
    });
  };
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
  useEffect(() => {
    const handler = (e) => {
      const msg = e.data;
      if (msg.action === "getProfitLossResult") {
        setReport(msg.report);
        setLoaded(true);
      }
      if (msg.action === "generateProfitLossPdfResult") {
        if (msg.success) {
          window.chrome.webview.postMessage({
            action: "openFile",
            data: { path: msg.path },
          });
        } else {
          alert("PDF generation failed");
        }
      }
      
      if (msg.action === "exportProfitLossExcelResponse" && msg.success) {
  hideToast();
}

    };

    window.chrome.webview.addEventListener("message", handler);
    return () =>
      window.chrome.webview.removeEventListener("message", handler);
  }, []);

  const load = () => {
    window.chrome.webview.postMessage({
      action: "getProfitLoss",
      payload: { From: from, To: to }
    });
  };

  return (
    <div className="form-container">
      <h2 className="form-title">Profit & Loss Statement</h2>

      {/* FILTER ROW */}
      <div className="form-inner">
        <div className="form-row-horizontal">

          <div className="form-group">
            <label>From</label>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>

          <div className="form-group">
            <label>To</label>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>

          <div className="inventory-btns">
            <button className="btn-submit small" type="button" onClick={load}>
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

      {report && (
        <>
          {/* INCOME SECTION */}
          <div className="table-container" style={{ marginTop: "20px" }}>
            <h3 className="table-title">Income</h3>

            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: "60%" }}>Account</th>
                  <th style={{ width: "20%" }}>Debit</th>
                  <th style={{ width: "20%" }}>Credit</th>
                </tr>
              </thead>

              <tbody>
                {report.Income.map((r, i) => (
                  <tr key={i}>
                    <td>{r.AccountName}</td>
                    <td style={{ textAlign: "right" }}>{r.Debit.toFixed(2)}</td>
                    <td style={{ textAlign: "right" }}>{r.Credit.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* EXPENSE SECTION */}
          <div className="table-container" style={{ marginTop: "20px" }}>
            <h3 className="table-title">Expenses</h3>

            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: "60%" }}>Account</th>
                  <th style={{ width: "20%" }}>Debit</th>
                  <th style={{ width: "20%" }}>Credit</th>
                </tr>
              </thead>

              <tbody>
                {report.Expenses.map((r, i) => (
                  <tr key={i}>
                    <td>{r.AccountName}</td>
                    <td style={{ textAlign: "right" }}>{r.Debit.toFixed(2)}</td>
                    <td style={{ textAlign: "right" }}>{r.Credit.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* NET PROFIT / LOSS */}
          <div className="table-container" style={{ marginTop: "20px", textAlign: "center", padding: "15px" }}>
            <h2 className="table-title">
              {report.NetProfit > 0 && (
                <>Net Profit: {report.NetProfit.toFixed(2)}</>
              )}
              {report.NetLoss > 0 && (
                <>Net Loss: {report.NetLoss.toFixed(2)}</>
              )}
            </h2>
          </div>
        </>
      )}
    </div>
  );
}
