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
  const [report, setReport] = useState(null);

  useEffect(() => {
    const handler = (e) => {
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
              onClick={exportPdf}
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
