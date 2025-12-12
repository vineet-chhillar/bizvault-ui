import React, { useState, useEffect } from "react";

export default function BalanceSheet() {
  const [asOf, setAsOf] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [report, setReport] = useState(null);

  useEffect(() => {
    const handler = (e) => {
      const msg = e.data;
      if (msg.action === "getBalanceSheetResult") setReport(msg.report);
    };

    window.chrome.webview.addEventListener("message", handler);
    return () =>
      window.chrome.webview.removeEventListener("message", handler);
  }, []);

  const load = () => {
    window.chrome.webview.postMessage({
      action: "getBalanceSheet",
      payload: { AsOf: asOf }
    });
  };

  return (
    <div className="form-container">
      <h2 className="form-title">Balance Sheet</h2>

      {/* FILTERS */}
      <div className="form-inner">
        <div className="form-row-horizontal">
          <div className="form-group">
            <label>As of Date</label>
            <input
              type="date"
              value={asOf}
              onChange={(e) => setAsOf(e.target.value)}
            />
          </div>

          <div className="inventory-btns">
            <button className="btn-submit small" onClick={load}>
              Load
            </button>
          </div>
        </div>
      </div>

      {/* BALANCE SHEET DATA */}
      {report && (
        <>
          {/* ASSETS */}
          <div className="table-container" style={{ marginTop: "20px" }}>
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
          <div className="table-container" style={{ marginTop: "20px" }}>
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
          <div className="table-container" style={{ marginTop: "20px" }}>
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
