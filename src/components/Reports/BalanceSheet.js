import React, { useState, useEffect } from "react";

export default function BalanceSheet() {
  // Financial year start (1 April)
  const [from, setFrom] = useState(() => {
    const today = new Date();
    const fyStart =
      today.getMonth() >= 3
        ? new Date(today.getFullYear(), 3, 1)
        : new Date(today.getFullYear() - 1, 3, 1);
    return fyStart.toISOString().slice(0, 10);
  });
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







  const [to, setTo] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [loaded, setLoaded] = useState(false);
const exportPdf = () => {
    if (!loaded) {
      alert("Load report first");
      return;
    }
    window.chrome.webview.postMessage({
      action: "exportBalanceSheetPdf",
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
    action: "exportBalanceSheetExcel",
    payload: { From: from, To: to },
  });
};

  const [report, setReport] = useState(null);

  useEffect(() => {
    
    const handler = (e) => {
      console.log("📩 BalanceSheet message:", e.data);

      
      const msg = e.data;
      if (msg.action === "getBalanceSheetResult") {
        setReport(msg.report);
         setLoaded(true);
      }
       if (msg.action === "generateBalanceSheetPdfResult") {
        if (msg.success) {
          window.chrome.webview.postMessage({
            action: "openFile",
            data: { path: msg.path },
          });
        } else {
          alert("PDF generation failed");
        }
      }
if (msg.action === "exportBalanceSheetExcelResponse" && msg.success) {
  console.log("Excel exported at:", msg.path);
  hideToast();
}
    };

    window.chrome.webview.addEventListener("message", handler);
    return () =>
      window.chrome.webview.removeEventListener("message", handler);
  }, []);

  const load = () => {
    window.chrome.webview.postMessage({
      action: "getBalanceSheet",
      payload: { From: from, To: to }
    });
  };

  return (
    <div className="form-container">
      <h2 className="form-title">Balance Sheet</h2>

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

      {/* BALANCE SHEET DATA */}
      {report && (
        <>
          {/* ASSETS */}
          <div className="table-container" style={{ marginTop: 20 }}>
            <h3 className="table-title">Assets</h3>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: "70%" }}>Account</th>
                  <th style={{ width: "30%", textAlign: "right" }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {report.Assets.Rows.map((r, i) => (
                  <tr key={i}>
                    <td>{r.AccountName}</td>
                    <td style={{ textAlign: "right" }}>
                      {r.Debit.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <th>Total</th>
                  <th style={{ textAlign: "right" }}>
                    {report.Assets.Total.toFixed(2)}
                  </th>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* LIABILITIES */}
          <div className="table-container" style={{ marginTop: 20 }}>
            <h3 className="table-title">Liabilities</h3>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: "70%" }}>Account</th>
                  <th style={{ width: "30%", textAlign: "right" }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {report.Liabilities.Rows.map((r, i) => (
                  <tr key={i}>
                    <td>{r.AccountName}</td>
                    <td style={{ textAlign: "right" }}>
                      {r.Credit.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <th>Total</th>
                  <th style={{ textAlign: "right" }}>
                    {report.Liabilities.Total.toFixed(2)}
                  </th>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* CAPITAL */}
          <div className="table-container" style={{ marginTop: 20 }}>
            <h3 className="table-title">Capital</h3>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: "70%" }}>Account</th>
                  <th style={{ width: "30%", textAlign: "right" }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {report.Capital.Rows.map((r, i) => (
                  <tr key={i}>
                    <td>{r.AccountName}</td>
                    <td style={{ textAlign: "right" }}>
                      {r.Credit.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <th>Total</th>
                  <th style={{ textAlign: "right" }}>
                    {report.Capital.Total.toFixed(2)}
                  </th>
                </tr>
              </tfoot>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
