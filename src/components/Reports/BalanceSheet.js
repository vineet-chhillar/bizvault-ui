import React, { useState, useEffect } from "react";

export default function BalanceSheet() {
  // Financial year start (1 April)
  
   const today = new Date();

  const fyStartYear =
  today.getMonth() >= 3
    ? today.getFullYear()
    : today.getFullYear() - 1;

const fyStartDate = new Date(fyStartYear, 3, 1);

const [from, setFrom] = useState(
  `${fyStartDate.getFullYear()}-${String(
    fyStartDate.getMonth() + 1
  ).padStart(2, "0")}-${String(
    fyStartDate.getDate()
  ).padStart(2, "0")}`
);
  const [modal, setModal] = useState({
  show: false,
  message: "",
  onClose: null
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







  const [to, setTo] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [loaded, setLoaded] = useState(false);
const exportPdf = () => {
    if (!loaded) {

  setModal({
    show: true,
    message: "Load report first.",
    onClose: null
  });

  return;
}
    window.chrome.webview.postMessage({
      action: "exportBalanceSheetPdf",
      payload: { From: from, To: to },
    });
  };
  const exportExcel = () => {
  if (!loaded) {

  setModal({
    show: true,
    message: "Load report first.",
    onClose: null
  });

  return;
}
showToast("Opening Excel…");
  window.chrome.webview.postMessage({
    action: "exportBalanceSheetExcel",
    payload: { From: from, To: to },
  });
};

  const [report, setReport] = useState(null);

  useEffect(() => {
    
    const handler = (e) => {
      console.log("📩 BalanceSheet message:", e.data);

      
      const msg = e.data;
      if (msg.action === "getBalanceSheetResult") {

    // 🔴 Handle backend error
    if (!msg.success) {

        setModal({
            show: true,
            message:
                msg.Message || "Failed to load balance sheet.",
            onClose: null
        });

        setReport(null);
        setLoaded(false);

        return;
    }

    // ✅ Success
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
          setModal({
            show: true,
            message: "PDF generation failed.",
            onClose: null
          });
        }
      }
if (msg.action === "exportBalanceSheetExcelResponse" && msg.success) {
  console.log("Excel exported at:", msg.path);
  hideToast();
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
    <>
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
  onClick={exportExcel}
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
   {modal.show && (
  <div className="modal-overlay">
    <div className="modal-box">
      <p>{modal.message}</p>

      <div className="modal-actions">
        <button
          className="modal-btn ok"
          onClick={() => {
            modal.onClose?.();

            setModal({
              show: false,
              message: "",
              onClose: null
            });
          }}
        >
          OK
        </button>
      </div>
    </div>
  </div>
)}
    </>
  );
}
