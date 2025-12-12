import React, { useEffect, useState } from "react";

export default function LedgerReport() {
  const [accounts, setAccounts] = useState([]);
  const [accountId, setAccountId] = useState(0);
  const [from, setFrom] = useState(() => new Date().toISOString().slice(0, 10));
  const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10));
  const [report, setReport] = useState(null);

  useEffect(() => {
    window.chrome.webview.postMessage({ action: "fetchCoA" });

    const handler = (e) => {
      const msg = e.data;

      if (msg.action === "fetchCoAResult") setAccounts(msg.rows);
      if (msg.action === "getLedgerReportResult") setReport(msg.report);

      if (msg.action === "generateLedgerPdfResult") {
        if (msg.success) {
          window.chrome.webview.postMessage({
            action: "openFile",
            data: { path: msg.path },
          });
        } else {
          alert("PDF generation failed: " + (msg.message || "unknown"));
        }
      }
    };

    window.chrome.webview.addEventListener("message", handler);
    return () =>
      window.chrome.webview.removeEventListener("message", handler);
  }, []);

  const load = () => {
    if (!accountId) {
      alert("Select account");
      return;
    }
    window.chrome.webview.postMessage({
      action: "getLedgerReport",
      payload: { AccountId: accountId, From: from, To: to },
    });
  };

  const exportPdf = () => {
    if (!report) {
      alert("Load report first");
      return;
    }
    window.chrome.webview.postMessage({
      action: "generateLedgerPdf",
      payload: { AccountId: accountId, From: from, To: to },
    });
  };

  return (
    <div className="form-container">
      <h2 className="form-title">Ledger Report</h2>

      {/* FILTER AREA */}
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
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>

          <div className="inventory-btns">
            <button className="btn-submit small" type="button" onClick={load}>
              Load
            </button>
            <button className="btn-submit small" type="button" onClick={exportPdf}>
              Export PDF
            </button>
          </div>

        </div>
      </div>

      {/* REPORT SECTION */}
      {report && (
        <div className="table-container" style={{ marginTop: "20px" }}>
          <h3 className="table-title">
            {report.AccountName} — {report.From} to {report.To}
          </h3>

          <p style={{ fontWeight: "600", margin: "8px 0" }}>
            Opening Balance: {report.OpeningBalance.toFixed(2)}{" "}
            {report.OpeningSide}
          </p>

          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Narration</th>
                <th>Voucher</th>
                <th style={{ textAlign: "right" }}>Debit</th>
                <th style={{ textAlign: "right" }}>Credit</th>
                <th style={{ textAlign: "right" }}>Balance</th>
              </tr>
            </thead>

            <tbody>
              {report.Rows.map((r) => (
                <tr key={r.LineId}>
                  <td>{r.Date}</td>
                  <td>{r.Narration}</td>
                  <td>
                    {r.VoucherType}#{r.VoucherId}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    {r.Debit.toFixed(2)}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    {r.Credit.toFixed(2)}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    {r.RunningBalance.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>

            <tfoot>
              <tr>
                <th colSpan={3}>Closing</th>
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
