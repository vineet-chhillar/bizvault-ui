import React, { useEffect, useState } from "react";

export default function StockSummary() {
  const [asOf, setAsOf] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [rows, setRows] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      const msg = e.data;

      if (msg.action === "StockSummaryResult") {
        setRows(msg.data || []);
        setLoaded(true);
      }

      if (msg.action === "generateStockSummaryPdfResult") {
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
      action: "GetStockSummary",
      payload: { AsOf: asOf },
    });
  };

  const exportPdf = () => {
    if (!loaded) {
      alert("Load stock summary first");
      return;
    }

    window.chrome.webview.postMessage({
      action: "exportStockSummaryPdf",
      payload: { AsOf: asOf },
    });
  };

  return (
    <div className="form-container">
      <h2 className="form-title">Stock Summary</h2>

      {/* FILTER BAR */}
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
              Load Summary
            </button>

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
      <div className="table-container" style={{ marginTop: "15px" }}>
        <h3 className="table-title">Stock Levels</h3>

        <table className="stocksummarydata-table">
          <thead>
            <tr>
              <th style={{ width: "40px" }}>S.No</th>
              <th>Item</th>
              <th style={{ textAlign: "right" }}>Qty</th>
              <th style={{ textAlign: "right" }}>FIFO Value</th>
              <th style={{ textAlign: "right" }}>Avg Cost</th>
              <th style={{ textAlign: "right" }}>Last Purchase</th>
              <th style={{ textAlign: "right" }}>Selling Price</th>
              <th style={{ textAlign: "right" }}>Margin %</th>
              <th style={{ textAlign: "right" }}>Reorder Level</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={10} style={{ textAlign: "center" }}>
                  No data
                </td>
              </tr>
            )}

            {rows.map((r, index) => (
              <tr
                key={r.ItemId}
                style={{
                  background:
                    r.Status === "Low Stock" ? "#ffe5e5" : "white",
                }}
              >
                <td>{index + 1}</td>
                <td>{r.ItemName}</td>
                <td style={{ textAlign: "right" }}>{r.Qty}</td>
                <td style={{ textAlign: "right" }}>
                  ₹{r.FifoValue.toFixed(2)}
                </td>
                <td style={{ textAlign: "right" }}>
                  ₹{r.AvgCost.toFixed(2)}
                </td>
                <td style={{ textAlign: "right" }}>
                  ₹{r.LastPurchasePrice.toFixed(2)}
                </td>
                <td style={{ textAlign: "right" }}>
                  ₹{r.SellingPrice.toFixed(2)}
                </td>
                <td style={{ textAlign: "right" }}>
                  {r.MarginPercent.toFixed(2)}%
                </td>
                <td style={{ textAlign: "right" }}>{r.ReorderLevel}</td>
                <td
                  style={{
                    fontWeight: 600,
                    color:
                      r.Status === "Low Stock" ? "#b30000" : "#4e1d7c",
                    textAlign: "center",
                  }}
                >
                  {r.Status}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
