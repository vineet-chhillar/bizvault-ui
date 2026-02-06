import React, { useEffect, useState } from "react";
import "./Reports.css";
export default function CashBookReport() {
  const [from, setFrom] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [to, setTo] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [loaded, setLoaded] = useState(false);
  const [report, setReport] = useState({
  OpeningBalance: 0,
  ClosingBalance: 0,
  Rows: [],
});
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

const rows = report?.Rows || [];

const exportPdf = () => {
    if (!loaded) {
      alert("Load report first");
      return;
    }
    window.chrome.webview.postMessage({
      action: "exportCashBookPdf",
      payload: { From: from, To: to },
    });
  };
  const exportExcel = () => {
    if (!loaded) {
      alert("Load report first");
      return;
    }
    showToast("Exporting Excel...");
    window.chrome.webview.postMessage({
  action: "exportCashBookExcel",
  payload: { From: from, To: to }
});

  };
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
 setLoaded(true);
}
if (msg.action === "generateCashBookPdfResult") {
        if (msg.success) {
          window.chrome.webview.postMessage({
            action: "openFile",
            data: { path: msg.path },
          });
        } else {
          alert("PDF generation failed");
        }
      }
      if (msg.action === "exportCashBookExcelResponse" && msg.success) {
  hideToast();
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
  const voucherType = row.VoucherType || "UNKNOWN";
  const voucherId = row.VoucherId ?? row.JournalId;

  const key = `${voucherType}|${voucherId}`;

  if (!acc[key]) {
    acc[key] = {
      voucherType,
      voucherId,
      rows: []
    };
  }

  acc[key].rows.push(row);
  return acc;
}, {});

let runningBalance = report.OpeningBalance;
let pageSerialNo = 1;
  return (
    <div className="form-container">
      <h2 className="form-title">Cash Book</h2>


      
      <div className="form-inner">
        <div className="form-row-horizontal">
          
         

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
              onClick={exportExcel}
            >
              Export Excel
            </button>
          </div>
        </div>
      </div>

      
      <div className="table-container" style={{ marginTop: 20 }}>
        {report && (
  <p style={{ fontWeight: 600 }}>
    Opening Balance : {report.OpeningBalance.toFixed(2)}
  </p>
)}
       <table className="cashbookdata-table">
          <thead>
  <tr>
    <th>S.No</th>
    <th>Date</th>
    <th>Voucher Type</th>
    <th>Description</th>
    <th>Account</th>
    <th style={{ textAlign: "right" }}>Debit</th>
    <th style={{ textAlign: "right" }}>Credit</th>
     <th style={{ textAlign: "right" }}>Balance</th> 
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

  {Object.values(groupedByVoucher).map((group) => {
  const { voucherType, voucherId, rows: lines } = group;

  const currentSerial = pageSerialNo++; 

  const voucherDebit = lines.reduce(
    (s, r) => s + Number(r.Debit || 0),
    0
  );

  const voucherCredit = lines.reduce(
    (s, r) => s + Number(r.Credit || 0),
    0
  );


  return (
    <React.Fragment key={`${voucherType}-${voucherId}`}>
    {lines.map((r, li) => {
  if (r.AccountName === "Cash") {
    runningBalance += Number(r.Debit || 0) - Number(r.Credit || 0);
  }

  const cells = [];

  if (li === 0) {
    cells.push(
      <td key="sn" rowSpan={lines.length}>{currentSerial}</td>,
      <td key="date" rowSpan={lines.length}>{r.Date}</td>,
      <td key="vt" rowSpan={lines.length}>{voucherType}</td>,
      <td key="desc" rowSpan={lines.length}>{r.Description}</td>
    );
  }

  cells.push(
    <td key="acc">{r.AccountName}</td>,
    <td key="dr" style={{ textAlign: "right" }}>
      {Number(r.Debit || 0).toFixed(2)}
    </td>,
    <td key="cr" style={{ textAlign: "right" }}>
      {Number(r.Credit || 0).toFixed(2)}
    </td>,
    <td key="bal" style={{ textAlign: "right", fontWeight: 600 }}>
      {r.AccountName === "Cash" ? runningBalance.toFixed(2) : ""}
    </td>
  );

  return (
    <tr key={`${voucherType}-${voucherId}-${li}`}>
      {cells}
    </tr>
  );
})}

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
        <td />
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
    <th />
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
