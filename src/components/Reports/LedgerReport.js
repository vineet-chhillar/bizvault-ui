import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

export default function LedgerReport() {
  const [accounts, setAccounts] = useState([]);
  const [accountId, setAccountId] = useState(0);
  const [from, setFrom] = useState(() => new Date().toISOString().slice(0, 10));
  const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10));
  const [report, setReport] = useState(null);

  const [searchParams] = useSearchParams();
  const accountIdFromUrl = Number(searchParams.get("accountId"));
  const source = searchParams.get("source");
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
  // -----------------------------
  // Handle URL navigation
  // -----------------------------
  useEffect(() => {
    if (!accountIdFromUrl) return;

    if (source === "outstanding") {
      setFrom("2000-01-01");
      setTo(new Date().toISOString().slice(0, 10));
    }

    setAccountId(accountIdFromUrl);
  }, [accountIdFromUrl, source]);

  // -----------------------------
  // Initial load (CoA + handlers)
  // -----------------------------
  useEffect(() => {
    window.chrome.webview.postMessage({ action: "fetchCoA" });

    const handler = (e) => {
      const msg = e.data;

      if (msg.action === "fetchCoAResult") {
        setAccounts(msg.rows || []);
      }

      if (msg.action === "getLedgerReportResult") {
        setReport(msg.report);
        setLoaded(true);
      }
      if (msg.action === "exportLedgerExcelResponse" && msg.success) {
  hideToast();
}


      if (msg.action === "generateLedgerPdfResult") {
        if (msg.success) {
          window.chrome.webview.postMessage({
            action: "openFile",
            data: { path: msg.path },
          });
        } else {
          alert("PDF generation failed");
        }
      }
    };

    window.chrome.webview.addEventListener("message", handler);
    return () =>
      window.chrome.webview.removeEventListener("message", handler);
  }, []);

  // -----------------------------
  // Load report
  // -----------------------------
  const load = () => {
    if (!accountId) {
      alert("Select account");
      return;
    }

    window.chrome.webview.postMessage({
      action: "getLedgerReport",
      payload: {
        AccountId: accountId,
        From: from,
        To: to,
      },
    });
  };

  // -----------------------------
  // Export PDF
  // -----------------------------
  const exportPdf = () => {
    if (!loaded) {
      alert("Load report first");
      return;
    }
    window.chrome.webview.postMessage({
      action: "generateLedgerPdf",
      payload: { AccountId: accountId,From: from, To: to },
    });
  };
    const exportExcel = () => {
    if (!loaded) {
      alert("Load report first");
      return;
    }
    showToast("Exporting Excel...");
    window.chrome.webview.postMessage({
  action: "exportLedgerExcel",
  payload: {
    From: from,
    To: to,
    AccountId: accountId
  }
});

  };
  // -----------------------------
  // Helpers
  // -----------------------------
  const fmtDate = (d) =>
    new Date(d).toLocaleDateString("en-GB");

  return (
    <div className="form-container">
      <h2 className="form-title">Account Statement</h2>

      {/* FILTERS */}
      <div className="form-inner">
        <div className="form-row-horizontal">
          <div className="form-group">
            <label>Account</label>
            <select
              value={accountId}
              onChange={(e) => setAccountId(Number(e.target.value))}
            >
              <option value={0}>-- Select Account --</option>
              {accounts.map((a) => (
                <option key={a.AccountId} value={a.AccountId}>
                  {a.AccountName}
                </option>
              ))}
            </select>
          </div>

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
            <button className="btn-submit small" onClick={exportPdf}>
              Export PDF
            </button>
             <button className="btn-submit small" onClick={exportExcel}>
              Export Excel
            </button>
          </div>
        </div>
      </div>

      {/* REPORT */}
      {report && (
        <div className="table-container" style={{ marginTop: 20 }}>
          <h3 className="table-title">
            {report.AccountName} ({fmtDate(report.From)} → {fmtDate(report.To)})
          </h3>

          <p style={{ fontWeight: 600 }}>
            Opening Balance: {report.OpeningBalance.toFixed(2)}{" "}
            {report.OpeningSide}
          </p>

          <table className="ledgerdata-table">
            <thead>
              <tr>
                <th>S.No</th>
                <th>Date</th>
                <th>Narration</th>
                <th>Voucher</th>
                <th style={{ textAlign: "right" }}>Debit</th>
                <th style={{ textAlign: "right" }}>Credit</th>
                <th style={{ textAlign: "right" }}>Balance</th>
              </tr>
            </thead>

            <tbody>
              {report.Rows.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center" }}>
                    No entries
                  </td>
                </tr>
              )}

              {report.Rows.map((r, i) => (
                <tr key={r.LineId}>
                  <td>{i + 1}</td>
                  <td>{fmtDate(r.Date)}</td>
                  <td>{r.Narration}</td>
                  <td>
                    {r.VoucherType} #{r.VoucherId}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    {r.Debit.toFixed(2)}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    {r.Credit.toFixed(2)}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    {r.RunningBalance.toFixed(2)} {r.RunningSide}
                  </td>
                </tr>
              ))}
            </tbody>

            <tfoot>
              <tr>
                <th colSpan={4}>Closing Balance</th>
                <th colSpan={3} style={{ textAlign: "right" }}>
                  {report.ClosingBalance.toFixed(2)} {report.ClosingSide}
                </th>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}
