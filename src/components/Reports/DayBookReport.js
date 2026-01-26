import React, { useEffect, useState } from "react";
import "./Reports.css";
export default function DayBookReport() {
  const [from, setFrom] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [to, setTo] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [rows, setRows] = useState([]);
  const [loaded, setLoaded] = useState(false);
let pageSerialNo = 1;

  useEffect(() => {
    const handler = (e) => {
      const msg = e.data;

      if (msg.action === "GetDayBookResponse") {
        if (msg.Status === "Success") {
          setRows(msg.Data || []);
          setLoaded(true);
        } else {
          alert("Failed to load Day Book");
        }
      }

      if (msg.action === "generateDayBookPdfResult") {
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

  // ------------------------
  // LOAD DAY BOOK
  // ------------------------
  const load = () => {
    window.chrome.webview.postMessage({
      action: "GetDayBook",
      payload: { From: from, To: to },
    });
  };

  // ------------------------
  // EXPORT PDF (optional)
  // ------------------------
  const exportPdf = () => {
    if (!loaded) {
      alert("Load report first");
      return;
    }
    window.chrome.webview.postMessage({
      action: "exportDayBookPdf",
      payload: { From: from, To: to },
    });
  };

  const totalDebit = rows.reduce(
    (s, r) => s + Number(r.Debit || 0),
    0
  );
  const totalCredit = rows.reduce(
    (s, r) => s + Number(r.Credit || 0),
    0
  );
const groupedByVoucher = rows.reduce((acc, row) => {
  const key = `${row.VoucherType || "UNKNOWN"}|${row.VoucherId}`;

  if (!acc[key]) {
    acc[key] = {
      voucherType: row.VoucherType || "UNKNOWN",
      voucherId: row.VoucherId,
      rows: []
    };
  }

  acc[key].rows.push(row);
  return acc;
}, {});





  return (
    <div className="form-container">
      <h2 className="form-title">Day Book</h2>

      {/* FILTER AREA */}
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
            <button className="btn-submit small" type="button" onClick={load}>
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

      {/* REPORT SECTION */}
      {loaded && (
        <div className="table-container" style={{ marginTop: "20px" }}>
          <h3 className="table-title">
            Day Book — {from} to {to}
          </h3>

          <table className="daybookdata-table">
            <thead>
              <tr>
                <th>S.No</th>
                <th>Date</th>
                <th>Voucher Type</th>
                <th>Description</th>
                <th>Account</th>
                <th style={{ textAlign: "right" }}>Debit</th>
                <th style={{ textAlign: "right" }}>Credit</th>
                
              </tr>
            </thead>

           <tbody>
  {rows.length === 0 && (
    <tr>
      <td colSpan={6} style={{ textAlign: "center" }}>
        No records found
      </td>
    </tr>
  )}

 {Object.values(groupedByVoucher).map((group, gi) => {
  const { voucherType, voucherId, rows } = group;

  const currentSerial = pageSerialNo++; // 👈 ONE per voucher

  const voucherDebit = rows.reduce(
    (s, r) => s + Number(r.Debit || 0),
    0
  );

  const voucherCredit = rows.reduce(
    (s, r) => s + Number(r.Credit || 0),
    0
  );

  return (
    <React.Fragment key={gi}>
      {/* Voucher Lines */}
      {rows.map((r, li) => (
        <tr key={`${gi}-${li}`}>
          {li === 0 && (
            <>
              {/* ✅ SERIAL NO (rowSpan) */}
              <td rowSpan={rows.length}>{currentSerial}</td>

              <td rowSpan={rows.length}>{r.EntryDate}</td>

              <td rowSpan={rows.length}>
                {voucherType}/{voucherId}
              </td>

              <td rowSpan={rows.length}>
                {r.Description}
              </td>
            </>
          )}

          <td>{r.AccountName}</td>

          <td style={{ textAlign: "right" }}>
            {Number(r.Debit || 0).toFixed(2)}
          </td>

          <td style={{ textAlign: "right" }}>
            {Number(r.Credit || 0).toFixed(2)}
          </td>
        </tr>
      ))}

      {/* Voucher Subtotal Row */}
      <tr style={{ background: "#fafafa", fontWeight: 600 }}>
        <td colSpan={5} style={{ textAlign: "right" }}>
          Voucher Total :
        </td>
        <td style={{ textAlign: "right" }}>
          {voucherDebit.toFixed(2)}
        </td>
        <td style={{ textAlign: "right" }}>
          {voucherCredit.toFixed(2)}
        </td>
      </tr>
    </React.Fragment>
  );
})}


</tbody>




            <tfoot>
  <tr>
    <th colSpan={5}>TOTAL</th>
    <th style={{ textAlign: "right" }}>
      {totalDebit.toFixed(2)}
    </th>
    <th style={{ textAlign: "right" }}>
      {totalCredit.toFixed(2)}
    </th>
  </tr>
</tfoot>

          </table>
        </div>
      )}
    </div>
  );
}
