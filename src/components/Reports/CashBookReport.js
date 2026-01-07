import React, { useEffect, useState } from "react";

export default function VoucherReport() {
  const [from, setFrom] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [to, setTo] = useState(
    new Date().toISOString().slice(0, 10)
  );
  
  const [report, setReport] = useState({
  OpeningBalance: 0,
  ClosingBalance: 0,
  Rows: [],
});

const rows = report?.Rows || [];


{/*useEffect(() => {
  window.chrome.webview.postMessage({
    action: "getVoucherTypes",
  });

  const handler = (e) => {
    const msg = e.data;

    

    if (msg.action === "getCashBookResult") {
  setRows(msg.rows || []);
}

  };

  window.chrome.webview.addEventListener("message", handler);
  return () =>
    window.chrome.webview.removeEventListener("message", handler);
}, []);*/}

  useEffect(() => {
    const handler = (e) => {
      const msg = e.data;
  if (msg.action === "getCashBookResult") {
  setReport(msg.data || msg);

}

    };

    window.chrome.webview.addEventListener("message", handler);
    return () =>
      window.chrome.webview.removeEventListener("message", handler);
  }, []);

 const load = () => {
  window.chrome.webview.postMessage({
    action: "getCashBook",
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
  const voucherNo = row.VoucherNo && row.VoucherNo.trim() !== ""
    ? row.VoucherNo
    : null;

  // fallback grouping key
  const groupKey = voucherNo ?? `VID_${row.VoucherId || row.JournalId}`;

  if (!acc[groupKey]) acc[groupKey] = [];
  acc[groupKey].push(row);

  return acc;
}, {});
let runningBalance = report.OpeningBalance;

  return (
    <div className="form-container">
      <h2 className="form-title">Cash Book</h2>


      {/* FILTERS */}
      <div className="form-inner">
        <div className="form-row-horizontal">
          
          {/*<div className="form-group">
            <label>Voucher Type</label>
            <select
  value={voucherType}
  onChange={(e) => setVoucherType(e.target.value)}
>
  <option value="">-- All --</option>

  {voucherTypes.map((vt) => (
    <option key={vt} value={vt}>
  {vt.replace(/([A-Z])/g, " $1").trim()}
</option>

  ))}
</select>

          </div>*/}

          <div className="form-group">
            <label>From</label>
            <input type="date" value={from} onChange={e => setFrom(e.target.value)} />
          </div>

          <div className="form-group">
            <label>To</label>
            <input type="date" value={to} onChange={e => setTo(e.target.value)} />
          </div>

          <div className="inventory-btns">
            <button className="btn-submit small" onClick={load}>
              Load
            </button>
          </div>
        </div>
      </div>

      {/* TABLE */}
      <div className="table-container" style={{ marginTop: 20 }}>
        {report && (
  <p style={{ fontWeight: 600 }}>
    Opening Balance : {report.OpeningBalance.toFixed(2)}
  </p>
)}


        <table className="daybookdata-table">
          <thead>
  <tr>
    <th>Date</th>
    <th>Voucher Type</th>
    <th>Voucher No</th>
    <th>Description</th>
    <th>Account</th>
    <th style={{ textAlign: "right" }}>Debit</th>
    <th style={{ textAlign: "right" }}>Credit</th>
     <th style={{ textAlign: "right" }}>Balance</th> {/* NEW */}
  </tr>
</thead>



          <tbody>
  {rows.length === 0 && (
    <tr>
      <td colSpan={8} style={{ textAlign: "center" }}>
        No records
      </td>
    </tr>
  )}

  {Object.entries(groupedByVoucher).map(([groupKey, lines]) => {
    const voucherDebit = lines.reduce(
      (s, r) => s + Number(r.Debit || 0),
      0
    );
    const voucherCredit = lines.reduce(
      (s, r) => s + Number(r.Credit || 0),
      0
    );

    return (
      <React.Fragment key={groupKey}>
        {lines.map((r, li) => {
          runningBalance +=
            Number(r.Debit || 0) - Number(r.Credit || 0);

          return (
            <tr key={`${groupKey}-${li}`}>
              {li === 0 && (
                <>
                  <td rowSpan={lines.length}>{r.Date}</td>
                  <td rowSpan={lines.length}>{r.VoucherType}</td>
                  <td rowSpan={lines.length}>
                    {r.VoucherNo?.trim() || "—"}
                  </td>
                  <td rowSpan={lines.length}>{r.Description}</td>
                </>
              )}

              <td>{r.AccountName}</td>

              <td style={{ textAlign: "right" }}>
                {Number(r.Debit).toFixed(2)}
              </td>

              <td style={{ textAlign: "right" }}>
                {Number(r.Credit).toFixed(2)}
              </td>

              {/* RUNNING BALANCE */}
              <td style={{ textAlign: "right", fontWeight: 600 }}>
                {runningBalance.toFixed(2)}
              </td>
            </tr>
          );
        })}

        {/* Voucher subtotal (NO effect on running balance) */}
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
          <td /> {/* empty balance cell */}
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
    <th /> {/* balance column */}
  </tr>
</tfoot>



        </table>
        {report && (
  <p style={{ fontWeight: 600 }}>
    Closing Balance : {report.ClosingBalance.toFixed(2)}
  </p>
)}
      </div>
    </div>
  );
}
