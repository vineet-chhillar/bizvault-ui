import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function OutstandingReport() {
  const [rows, setRows] = useState([]);
  const [balanceType, setBalanceType] = useState("ALL");
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e) => {
      const msg = e.data;

      if (msg.action === "getOutstandingReportResult") {
        setRows(msg.rows || []);
      }

      if (msg.action === "generateOutstandingPdfResult") {
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
      action: "getOutstandingReport",
      payload: { BalanceType: balanceType },
    });
  };

  // 🔹 EXPORT PDF
  const exportPdf = () => {
    if (rows.length === 0) {
      alert("Load report first");
      return;
    }

    window.chrome.webview.postMessage({
      action: "exportOutstandingReportPdf",
      payload: { BalanceType: balanceType },
    });
  };

  const openAccountStatement = (accountId) => {
    navigate(`/Reports/LedgerReport?accountId=${accountId}&source=outstanding`);
  };

  const totalDebit = rows.reduce(
    (s, r) => s + Number(r.TotalDebit || 0),
    0
  );

  const totalCredit = rows.reduce(
    (s, r) => s + Number(r.TotalCredit || 0),
    0
  );

  const totalBalance = rows.reduce(
    (s, r) => s + Number(r.Balance || 0),
    0
  );

  return (
    <div className="form-container">
      <h2 className="form-title">Outstanding Report</h2>

      {/* FILTERS */}
      <div className="form-inner">
        <div className="form-row-horizontal">
          <div className="form-group">
            <label>Balance Type</label>
            <select
              value={balanceType}
              onChange={(e) => setBalanceType(e.target.value)}
            >
              <option value="ALL">All</option>
              <option value="RECEIVABLE">Receivable</option>
              <option value="PAYABLE">Payable</option>
            </select>
          </div>

          <div className="inventory-btns">
            <button className="btn-submit small" onClick={load}>
              Load
            </button>

            {/* 🔹 EXPORT PDF BUTTON */}
            <button
              className="btn-submit small"
              type="button"
              onClick={exportPdf}
            >
              Export PDF
            </button>
          </div>
        </div>
      </div>

      {/* TABLE */}
      <div className="table-container" style={{ marginTop: 20 }}>
        <table className="outstandingdata-table">
          <thead>
            <tr>
              <th style={{ width: 50 }}>S.No</th> {/* 🔹 NEW */}
              <th>Account</th>
              <th style={{ textAlign: "right" }}>Debit</th>
              <th style={{ textAlign: "right" }}>Credit</th>
              <th style={{ textAlign: "right" }}>Balance</th>
            </tr>
          </thead>

          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} style={{ textAlign: "center" }}>
                  No outstanding balances
                </td>
              </tr>
            )}

            {rows.map((r, i) => (
              <tr
                key={r.AccountId}
                style={{ cursor: "pointer" }}
                onClick={() => openAccountStatement(r.AccountId)}
                title="Click to view Account Statement"
              >
                {/* 🔹 SERIAL NO */}
                <td>{i + 1}</td>

                <td style={{ fontWeight: 600 }}>
                  {r.AccountName}
                </td>

                <td style={{ textAlign: "right" }}>
                  {Number(r.TotalDebit).toFixed(2)}
                </td>

                <td style={{ textAlign: "right" }}>
                  {Number(r.TotalCredit).toFixed(2)}
                </td>

                <td
                  style={{
                    textAlign: "right",
                    fontWeight: 700,
                    color: r.Balance < 0 ? "#c0392b" : "#27ae60",
                  }}
                >
                  {Math.abs(r.Balance).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>

          <tfoot>
            <tr>
              <th colSpan={2}>TOTAL</th>
              <th style={{ textAlign: "right" }}>
                {totalDebit.toFixed(2)}
              </th>
              <th style={{ textAlign: "right" }}>
                {totalCredit.toFixed(2)}
              </th>
              <th style={{ textAlign: "right", fontWeight: 700 }}>
                {Math.abs(totalBalance).toFixed(2)}
              </th>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
