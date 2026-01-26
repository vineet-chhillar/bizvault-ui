import React, { useEffect, useState } from "react";

export default function StockValuationFIFO() {
  const [from, setFrom] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().slice(0, 10);
  });
  const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10));

  const [rows, setRows] = useState([]);
  const [totals, setTotals] = useState({ closingStock: 0, cogs: 0 });
  const [loaded, setLoaded] = useState(false); // ✅

  useEffect(() => {
    const handler = (e) => {
      const msg = e.data;

      if (msg.action === "getFIFOValuationResult") {
        setRows(msg.data || []);
        setLoaded(true); // ✅
      }

      if (msg.action === "getFIFOTotalsResult") {
        setTotals({
          closingStock: msg.closingStock || 0,
          cogs: msg.cogs || 0
        });
      }

      if (msg.action === "generateStockValuationPdfResult") {
        if (msg.success) {
          window.chrome.webview.postMessage({
            action: "openFile",
            data: { path: msg.path }
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
    setLoaded(false);

    window.chrome.webview.postMessage({
      action: "getFIFOValuation",
      payload: { AsOf: to, From: from, To: to }
    });

    window.chrome.webview.postMessage({
      action: "getFIFOTotals",
      payload: { From: from, To: to }
    });
  };

  // ✅ EXPORT PDF
  const exportPdf = () => {
    if (!loaded) {
      alert("Load report first");
      return;
    }

    window.chrome.webview.postMessage({
      action: "exportStockValuationPdf",
      payload: { From: from, To: to }
    });
  };

  return (
    <div className="form-container">
      <h2 className="form-title">Stock Valuation (FIFO)</h2>

      {/* FILTER BAR */}
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
          </div>
        </div>
      </div>

      {/* TOTALS */}
      <div
        className="table-container"
        style={{ marginTop: "15px", padding: "12px", textAlign: "center" }}
      >
        <h3 className="table-title">Totals</h3>
        <p style={{ margin: 0, fontWeight: 600 }}>
          Closing Stock: ₹{totals.closingStock.toFixed(2)} &nbsp; | &nbsp;
          COGS: ₹{totals.cogs.toFixed(2)}
        </p>
      </div>

      {/* FIFO TABLE */}
      <div className="table-container" style={{ marginTop: "20px" }}>
        <h3 className="table-title">FIFO Movement Summary</h3>

        <table className="stocksummarydata-table">
          <thead>
            <tr>
              <th>S.No</th> {/* ✅ */}
              <th>Item</th>
              <th>Opening Qty</th>
              <th>Opening Value</th>
              <th>In Qty</th>
              <th>In Value</th>
              <th>Out Qty</th>
              <th>COGS</th>
              <th>Closing Qty</th>
              <th>Closing Value</th>
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

            {rows.map((r, i) => (
              <tr key={r.ItemId}>
                <td>{i + 1}</td> {/* ✅ SERIAL NO */}
                <td>{r.ItemName || "Item " + r.ItemId}</td>

                <td style={{ textAlign: "right" }}>{r.OpeningQty}</td>
                <td style={{ textAlign: "right" }}>
                  {(r.OpeningValue || 0).toFixed(2)}
                </td>

                <td style={{ textAlign: "right" }}>{r.InQty}</td>
                <td style={{ textAlign: "right" }}>
                  {(r.InValue || 0).toFixed(2)}
                </td>

                <td style={{ textAlign: "right" }}>{r.OutQty}</td>
                <td style={{ textAlign: "right" }}>
                  {(r.OutValue || 0).toFixed(2)}
                </td>

                <td style={{ textAlign: "right" }}>{r.ClosingQty}</td>
                <td style={{ textAlign: "right" }}>
                  {(r.ClosingValue || 0).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
