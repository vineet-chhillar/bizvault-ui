import React, { useState, useEffect } from "react";
import "./Reports.css";
import InvoiceViewer from "./InvoiceViewer";
export default function InvoiceReport() {
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
const [showViewer, setShowViewer] = useState(false);
const [viewerData, setViewerData] = useState(null);
  const [to, setTo] = useState(
    new Date().toISOString().slice(0, 10)
  );

  const [invoiceType, setInvoiceType] =
    useState("SALE");

  const [invoices, setInvoices] = useState([]);

  const [selectedInvoiceId, setSelectedInvoiceId] =
    useState("");

  const [modal, setModal] = useState({
    show: false,
    message: "",
    onClose: null
  });

 useEffect(() => {
  const handler = (e) => {
    const msg = e.data;

    if (msg.action === "getInvoiceNumbersByDateRangeResult") {
      setInvoices(msg.data || []);
    }

    if (msg.action === "GetPurchaseInvoiceNumbersByDateRange") {
      setInvoices(msg.data || []);
    }


if (msg.action === "LoadInvoiceForViewResult") {
  if (msg.success) {
    setViewerData(msg.data);
    setShowViewer(true);
  }
}

if (msg.action === "LoadPurchaseInvoiceForViewResult") {
  if (msg.success) {
    setViewerData(msg.data);
    setShowViewer(true);
  }
}
  };

  window.chrome.webview.addEventListener(
    "message",
    handler
  );

  return () =>
    window.chrome.webview.removeEventListener(
      "message",
      handler
    );
}, []);
useEffect(() => {
  console.log("Invoice Type Changed:", invoiceType);

  setSelectedInvoiceId("");

  if (!from || !to) return;

  if (invoiceType === "SALE") {
    console.log("Loading Sales Invoices");

    window.chrome.webview.postMessage({
      action: "getInvoiceNumbersByDateRange",
      payload: {
        fromDate: from,
        toDate: to
      }
    });
  } else {
    console.log("Loading Purchase Invoices");

    window.chrome.webview.postMessage({
      action: "GetPurchaseInvoiceNumbersByDateRange",
      payload: {
        fromDate: from,
        toDate: to
      }
    });
  }
}, [from, to, invoiceType]);

 

  const printInvoice = () => {
    if (!selectedInvoiceId) {
      setModal({
        show: true,
        message: "Please select an invoice.",
        onClose: null
      });
      return;
    }

    window.chrome.webview.postMessage({
      action:
        invoiceType === "SALE"
          ? "PrintInvoice"
          : "PrintPurchaseInvoice",
      payload: {
        InvoiceId:
          invoiceType === "SALE"
            ? Number(selectedInvoiceId)
            : undefined,

        PurchaseId:
          invoiceType === "PURCHASE"
            ? Number(selectedInvoiceId)
            : undefined,

        Mode: "PREVIEW"
      }
    });
  };

const viewInvoice = () => {
  if (!selectedInvoiceId) {
    setModal({
      show: true,
      message: "Please select an invoice.",
      onClose: null
    });
    return;
  }

  window.chrome.webview.postMessage({
    action:
      invoiceType === "SALE"
        ? "LoadInvoiceForView"
        : "LoadPurchaseInvoiceForView",

    payload: {
      InvoiceId:
        invoiceType === "SALE"
          ? Number(selectedInvoiceId)
          : 0,

      PurchaseId:
        invoiceType === "PURCHASE"
          ? Number(selectedInvoiceId)
          : 0
    }
  });
};
if (showViewer && viewerData) {
  return (
    <InvoiceViewer
      invoice={viewerData}
      invoiceType={invoiceType}
      onClose={() => {
        setShowViewer(false);
        setViewerData(null);
      }}
      
    />
  );
}
  return (
    <>
      <div className="form-container">
        <h2 className="form-title">
          Invoice Report
        </h2>

        <div className="form-inner">
          <div className="form-row-horizontal">

            <div className="form-group">
              <label>From</label>

              <input
                type="date"
                value={from}
                onChange={(e) =>
                  setFrom(e.target.value)
                }
              />
            </div>

            <div className="form-group">
              <label>To</label>

              <input
                type="date"
                value={to}
                onChange={(e) =>
                  setTo(e.target.value)
                }
              />
            </div>

            <div className="form-group">
              <label>Type</label>

              <div
                style={{
                  display: "flex",
                  gap: "15px",
                  marginTop: "8px"
                }}
              >
                <label>
                  <input
                    type="radio"
                    value="SALE"
                    checked={
                      invoiceType === "SALE"
                    }
                    onChange={(e) =>
                      setInvoiceType(
                        e.target.value
                      )
                    }
                  />
                  Sales
                </label>

                <label>
                  <input
                    type="radio"
                    value="PURCHASE"
                    checked={
                      invoiceType ===
                      "PURCHASE"
                    }
                    onChange={(e) =>
                      setInvoiceType(
                        e.target.value
                      )
                    }
                  />
                  Purchase
                </label>
              </div>
            </div>

            <div
              className="form-group"
              style={{ minWidth: "350px" }}
            >
              <label>Invoice</label>

              <select
  value={selectedInvoiceId}
  onChange={(e) =>
    setSelectedInvoiceId(e.target.value)
  }
>
  <option value="">
    Select Invoice
  </option>

  {invoices.map((x) => (
    <option
  key={x.Id}
  value={x.Id}
>
  {x.InvoiceNo}
  {" | "}
  {x.PartyName}
  {" | "}
  {x.InvoiceDate}
  {" | ₹"}
  {Number(x.TotalAmount || 0).toFixed(2)}
</option>
  ))}
</select>
            </div>

           <div className="inventory-btns">

  <button
    className="btn-submit small"
    type="button"
    onClick={viewInvoice}
  >
    View
  </button>

  

</div>

          </div>
        </div>
      </div>

      {modal.show && (
        <div className="modal-overlay">
          <div className="modal-box">
            <p>{modal.message}</p>

            <div className="modal-actions">
              <button
                className="modal-btn ok"
                onClick={() =>
                  setModal({
                    show: false,
                    message: "",
                    onClose: null
                  })
                }
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