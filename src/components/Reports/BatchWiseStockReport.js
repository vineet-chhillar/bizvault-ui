
import React, { useEffect, useState, useRef } from "react";
import "./Reports.css";

export default function BatchWiseStockReport() {
  const [asOf, setAsOf] = useState(
    () => new Date().toISOString().slice(0, 10)
  );

  const [rows, setRows] = useState([]);
  const [loaded, setLoaded] = useState(false);

  const toastRef = useRef(null);

  const [modal, setModal] = useState({
    show: false,
    message: "",
    onClose: null
  });

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
useEffect(() => {
  return () => {
    hideToast();
  };
}, []);
  useEffect(() => {
    const handler = (e) => {
      const msg = e.data;

      if (msg.action === "BatchWiseStockResult") {

    if (msg.success === false) {

        setRows([]);
        setLoaded(false);

        setModal({
            show: true,
            message: msg.message || "Failed to load report.",
            onClose: null
        });

    } else {

        setRows(msg.data || []);
        setLoaded(true);

    }
}

      if (msg.action === "generateBatchWiseStockPdfResult") {
        if (msg.success) {
          window.chrome.webview.postMessage({
            action: "openFile",
            data: { path: msg.path }
          });
        } else {
          setModal({
            show: true,
           message: msg.message || "PDF generation failed.",
            onClose: null
          });
        }
      }

  if (msg.action === "exportBatchWiseStockExcelResponse") {
  hideToast();

  if (!msg.success) {
    setModal({
      show: true,
      message: msg.message || "Excel export failed.",
      onClose: null
    });
  }
}
    };

    window.chrome.webview.addEventListener("message", handler);

    return () =>
      window.chrome.webview.removeEventListener(
        "message",
        handler
      );
  }, []);

const load = () => {
  setLoaded(false);

  window.chrome.webview.postMessage({
    action: "GetBatchWiseStock",
    payload: {
      AsOf: asOf
    }
  });
};

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
      action: "exportBatchWiseStockPdf",
      payload: {
        AsOf: asOf
      }
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

    showToast("Exporting Excel...");

    window.chrome.webview.postMessage({
      action: "exportBatchWiseStockExcel",
      payload: {
        AsOf: asOf
      }
    });
  };

 const totalQty = rows.reduce(
  (sum, r) => sum + Number(r.Qty || 0),
  0
);

  const totalValue = rows.reduce(
    (sum, r) => sum + (r.Value || 0),
    0
  );

  return (
    <>
      <div className="form-container">
        <h2 className="form-title">
          Batch Wise Stock Report
        </h2>

        <div className="form-inner">
          <div className="form-row-horizontal">
            <div className="form-group">
              <label>As of Date</label>

              <input
                type="date"
                value={asOf}
                onChange={(e) =>
                  setAsOf(e.target.value)
                }
              />
            </div>

            <div className="inventory-btns">
              <button
                className="btn-submit small"
                onClick={load}
              >
                Load Report
              </button>

              <button
                className="btn-submit small"
                onClick={exportPdf}
              >
                Export PDF
              </button>

              <button
                className="btn-submit small"
                onClick={exportExcel}
              >
                Export Excel
              </button>
            </div>
          </div>
        </div>

        <div
          className="table-container"
          style={{ marginTop: "15px" }}
        >
          <h3 className="table-title">
  Batch Wise Stock ({rows.length} Batches)
</h3>

          <table className="stocksummarybatchdata-table">
            <thead>
              <tr>
                <th style={{ width: "50px" }}>
                  S.No
                </th>

                <th>Item</th>

                <th>Batch No</th>

                <th>Supplier</th>

                <th>Purchase Date</th>

                <th
                  style={{
                    textAlign: "right"
                  }}
                >
                  Qty
                </th>

                <th
                  style={{
                    textAlign: "right"
                  }}
                >
                  Rate
                </th>

                <th
                  style={{
                    textAlign: "right"
                  }}
                >
                  Value
                </th>
              </tr>
            </thead>

            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    style={{
                      textAlign: "center"
                    }}
                  >
                    No data
                  </td>
                </tr>
              )}

              {rows.map((r, index) => (
                <tr
                  key={`${r.ItemId}_${r.BatchNo}_${index}`}
                >
                  <td>{index + 1}</td>

                  <td>{r.ItemName}</td>

                  <td>{r.BatchNo}</td>

                  <td>{r.SupplierName}</td>

                  <td>
  {r.PurchaseDate
    ? new Date(r.PurchaseDate).toLocaleDateString()
    : ""}
</td>

                  <td
                    style={{
                      textAlign: "right"
                    }}
                  >
                    {r.Qty}
                  </td>

                  <td
                    style={{
                      textAlign: "right"
                    }}
                  >
                    ₹
                    {Number(
                      r.Rate || 0
                    ).toFixed(2)}
                  </td>

                  <td
                    style={{
                      textAlign: "right"
                    }}
                  >
                    ₹
                    {Number(
                      r.Value || 0
                    ).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>

            <tfoot>
              <tr
                style={{
                  fontWeight: "bold",
                  background: "#f4f4f4"
                }}
              >
                <td colSpan={5}>
                  TOTAL
                </td>

                <td
                  style={{
                    textAlign: "right"
                  }}
                >
                  {totalQty}
                </td>

                <td></td>

                <td
                  style={{
                    textAlign: "right"
                  }}
                >
                  ₹
                  {totalValue.toFixed(2)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
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

