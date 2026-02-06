import React, { useEffect, useState } from "react";

export default function TrialBalance() {
  const today = new Date();

const fyStartYear =
  today.getMonth() >= 3
    ? today.getFullYear()
    : today.getFullYear() - 1;

const [from, setFrom] = useState(
  new Date(fyStartYear, 3, 1).toISOString().slice(0, 10)
);

  const [to, setTo] = useState(
    new Date().toISOString().slice(0, 10)
  );

  const [rows, setRows] = useState([]);
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
      alert("Load report first");
      return;
    }
    window.chrome.webview.postMessage({
      action: "exportTrialBalancePdf",
      payload: { From: from, To: to },
    });
  };
  const exportExcel = () => {
    if (!loaded) {
      alert("Load report first");
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

      if (msg.action === "getTrialBalanceResult") {
        setRows(msg.rows || []);
        setLoaded(true);
      }
      if (msg.action === "generateTrialBalancePdfResult") {
        if (msg.success) {
          window.chrome.webview.postMessage({
            action: "openFile",
            data: { path: msg.path },
          });
        } else {
          alert("PDF generation failed");
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

  const totalDebit = rows.reduce((sum, r) => sum + r.TotalDebit, 0);
  const totalCredit = rows.reduce((sum, r) => sum + r.TotalCredit, 0);

  const totalClosingDr = rows
    .filter((r) => r.ClosingSide === "Dr")
    .reduce((s, r) => s + r.ClosingBalance, 0);

  const totalClosingCr = rows
    .filter((r) => r.ClosingSide === "Cr")
    .reduce((s, r) => s + r.ClosingBalance, 0);

  return (
    <div className="form-container">
      <h2 className="form-title">Trial Balance</h2>

      {/* FILTERS */}
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

      {/* TABLE */}
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

              {rows.map((r) => (
                <tr key={r.AccountId}>
                  <td>{r.AccountName}</td>
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
                <th style={{ textAlign: "center" }}>
                  Dr {totalClosingDr.toFixed(2)} / Cr{" "}
                  {totalClosingCr.toFixed(2)}
                </th>
              </tr>
            </tfoot>
          </table>
        )}
      </div>
    </div>
  );
}
