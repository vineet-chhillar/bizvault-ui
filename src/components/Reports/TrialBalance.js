import React, { useEffect, useState } from "react";

export default function TrialBalance() {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    window.chrome.webview.postMessage({ action: "getTrialBalance" });

    const handler = (e) => {
      const msg = e.data;
      if (msg.action === "getTrialBalanceResult") {
        setRows(msg.rows);
      }
    };

    window.chrome.webview.addEventListener("message", handler);
    return () =>
      window.chrome.webview.removeEventListener("message", handler);
  }, []);

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
      {/* Title */}
      <h2 className="form-title">Trial Balance</h2>

      <div className="table-container">
        <h3 className="table-title">Account Balances</h3>

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
      </div>
    </div>
  );
}
