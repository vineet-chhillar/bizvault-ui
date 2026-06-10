import React, { useEffect, useState } from "react";
import "./InvoiceReport.css";
export default function InvoiceViewer({
  invoice,
  invoiceType = "SALE",
  onClose
}) {
  useEffect(() => {
  const handleMessage = (event) => {
    const msg = event.data;

    if (
      msg.action === "PrintInvoiceResponse" ||
      msg.action === "PrintPurchaseInvoiceResponse"
    ) {
      if (msg.success) {

        const path = msg.pdfPath;
        const mode = msg.mode || "PREVIEW";

        if (mode === "PRINT") {

          window.chrome.webview.postMessage({
            Action: "OpenPdfExternal",
            Payload: { Path: path }
          });

        } else {

          const url =
            "data:application/pdf;base64," +
            msg.pdfBase64;

          setPdfPath(url);
          setDownloadPath(path);
          setShowPdfModal(true);
        }

      } else {

        setModal({
          show: true,
          message: msg.message || "Print failed",
          type: "error"
        });

      }
    }
  };

  window.chrome.webview.addEventListener(
    "message",
    handleMessage
  );

  return () => {
    window.chrome.webview.removeEventListener(
      "message",
      handleMessage
    );
  };
}, []);
  const [showPdfModal, setShowPdfModal] = useState(false);
const [pdfPath, setPdfPath] = useState("");
const [downloadPath, setDownloadPath] = useState("");
const [modal, setModal] = useState({
  show: false,
  message: "",
  type: "info",
  onConfirm: null,
  onClose: null
});
  if (!invoice) return null;

  const partyName =
    invoiceType === "SALE"
      ? invoice.CustomerName
      : invoice.SupplierName;

  const partyPhone =
    invoiceType === "SALE"
      ? invoice.CustomerPhone
      : invoice.SupplierPhone;

  const partyState =
    invoiceType === "SALE"
      ? invoice.CustomerState
      : invoice.SupplierState;

  const partyAddress =
    invoiceType === "SALE"
      ? invoice.CustomerAddress
      : invoice.SupplierAddress;

  const returns =
    invoiceType === "SALE"
      ? invoice.SalesReturns || []
      : invoice.PurchaseReturns || [];
const totalReturnedAmount = returns.reduce(
  (sum, r) => sum + Number(r.TotalAmount || 0),
  0
);
const handlePrint = () => {
  if (invoiceType === "SALE") {
    window.chrome.webview.postMessage({
      Action: "PrintInvoice",
      Payload: {
        InvoiceId: invoice.Id,
        Mode: "PREVIEW"
      }
    });
  } else {
    window.chrome.webview.postMessage({
      Action: "PrintPurchaseInvoice",
      Payload: {
        PurchaseId: invoice.PurchaseId,
        Mode: "PREVIEW"
      }
    });
  }
};



const totalReturnedQty = returns.reduce(
  (sum, r) =>
    sum +
    (r.Items || []).reduce(
      (itemSum, item) =>
        itemSum + Number(item.Qty || 0),
      0
    ),
  0
);

const netInvoiceValue =
  Number(invoice.TotalAmount || 0) -
  totalReturnedAmount;
  return (
    <>
    <div className="form-container">

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "5px",
          alignItems: "center"
        }}
      >
        <div className="invoice-title-wrapper">
  <span className="invoice-title-icon">
    {invoiceType === "SALE" ? "🧾" : "📦"}
  </span>

  <h2 className="invoice-main-title">
    {invoiceType === "SALE"
      ? "Sales Invoice"
      : "Purchase Invoice"}
  </h2>
</div>

        <div
  style={{
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "10px"
    
  }}
>
 <button
  className="btn-submit small"
  onClick={handlePrint}
>
  Print PDF
</button>

  <button
    className="btn-submit small"
    onClick={onClose}
  >
    Close
  </button>
</div>
      </div>

      {/* Header */}

     <div className="invoice-section">
      <h3 className="invoice-section-title">
    Invoice Details
</h3>
        <table className="invoice-table invoice-header-table">
          <tbody>

            <tr>
              <td>
                <b>Invoice No</b>
              </td>
              <td>{invoice.InvoiceNo}</td>

              <td>
                <b>Invoice Date</b>
              </td>
              <td>{invoice.InvoiceDate}</td>
            </tr>

            <tr>
              <td>
                <b>Payment Mode</b>
              </td>
              <td>
                {invoice.PaymentMode || "-"}
              </td>

              <td>
                <b>Total Amount</b>
              </td>
              <td>
                {Number(
                  invoice.TotalAmount || 0
                ).toFixed(2)}
              </td>
            </tr>

          </tbody>
        </table>
      </div>

      {/* Party Details */}

      <div className="invoice-section">
        <h3 className="invoice-section-title">
          {invoiceType === "SALE"
            ? "Customer Details"
            : "Supplier Details"}
        </h3>

       <table className="invoice-table invoice-party-table">
          <tbody>

            <tr>
              <td>
                <b>Name</b>
              </td>
              <td>{partyName}</td>

              <td>
                <b>Mobile</b>
              </td>
              <td>{partyPhone}</td>
            </tr>

            <tr>
              <td>
                <b>State</b>
              </td>
              <td>{partyState}</td>

              <td>
                <b>Address</b>
              </td>
              <td>{partyAddress}</td>
            </tr>

          </tbody>
        </table>
      </div>

      {/* Items */}

      <div className="invoice-section">
       <h3 className="invoice-section-title">
          Items
        </h3>

        <table className="invoice-table invoice-items-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Batch</th>
              <th>HSN</th>
              <th>Qty</th>
              <th>Rate</th>
              <th>GST%</th>
              <th>Amount</th>
            </tr>
          </thead>

          <tbody>
            {(invoice.Items || []).map(
              (item, idx) => (
                <tr key={idx}>
                  <td>{item.ItemName}</td>
                  <td>{item.BatchNo}</td>
                  <td>{item.HsnCode}</td>
                  <td>{item.Qty}</td>
                  <td>
                    {Number(
                      item.Rate || 0
                    ).toFixed(2)}
                  </td>
                  <td>
                    {Number(
                      item.GstPercent || 0
                    ).toFixed(2)}
                  </td>
                  <td>
                    {Number(
                      item.LineTotal || 0
                    ).toFixed(2)}
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>

      {/* Returns */}

      {returns.length > 0 && (
        <div className="invoice-section">
          <h3 className="invoice-section-title">
            {invoiceType === "SALE"
              ? "Sales Return History"
              : "Purchase Return History"}
          </h3>

          {returns.map((ret, idx) => (
            <div
              key={idx}
              style={{
                marginBottom: "20px",
                border: "1px solid #ddd",
                padding: "10px"
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent:
                    "space-between"
                }}
              >
                <strong>
                  {ret.ReturnNo}
                </strong>

                <strong>
                  {ret.ReturnDate}
                </strong>
              </div>

              <div
                style={{
                  marginTop: "5px"
                }}
              >
                Return Amount :
                {" "}
                {Number(
                  ret.TotalAmount || 0
                ).toFixed(2)}
              </div>

             <table className="invoice-table invoice-return-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Batch</th>
                    <th>Qty</th>
                    <th>Rate</th>
                    <th>Amount</th>
                  </tr>
                </thead>

                <tbody>
                  {(ret.Items || []).map(
                    (item, i) => (
                      <tr key={i}>
                        <td>
                          {item.ItemName}
                        </td>

                        <td>
                          {item.BatchNo}
                        </td>

                        <td>
                          {item.Qty}
                        </td>

                        <td>
                          {Number(
                            item.Rate || 0
                          ).toFixed(2)}
                        </td>

                        <td>
                          {Number(
                            item.LineTotal || 0
                          ).toFixed(2)}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
{returns.length > 0 && (
  <div className="invoice-section">
    <h3 className="invoice-section-title">
      Return Summary
    </h3>

    <table className="invoice-table invoice-summary-table">
      <tbody>

        <tr>
          <td>
            <b>
              {invoiceType === "SALE"
                ? "Sales Returns"
                : "Purchase Returns"}
            </b>
          </td>
          <td>
            {returns.length}
          </td>
        </tr>

        <tr>
          <td>
            <b>Total Returned Qty</b>
          </td>
          <td>
            {totalReturnedQty.toFixed(2)}
          </td>
        </tr>

        <tr>
          <td>
            <b>Total Returned Amount</b>
          </td>
          <td>
            ₹
            {totalReturnedAmount.toFixed(2)}
          </td>
        </tr>

        <tr>
          <td>
            <b>
              {invoiceType === "SALE"
                ? "Net Sales Value"
                : "Net Purchase Value"}
            </b>
          </td>
          <td>
            ₹
            {netInvoiceValue.toFixed(2)}
          </td>
        </tr>

      </tbody>
    </table>
  </div>
)}
      {/* Totals */}

      <div className="invoice-section">
        <h3 className="invoice-section-title">
          Totals
        </h3>

        <table className="invoice-table invoice-summary-table">
          <tbody>

            <tr>
              <td>
                <b>Sub Total</b>
              </td>
              <td>
                {Number(
                  invoice.SubTotal || 0
                ).toFixed(2)}
              </td>
            </tr>

            <tr>
              <td>
                <b>Total Tax</b>
              </td>
              <td>
                {Number(
                  invoice.TotalTax || 0
                ).toFixed(2)}
              </td>
            </tr>

            <tr>
              <td>
                <b>Round Off</b>
              </td>
              <td>
                {Number(
                  invoice.RoundOff || 0
                ).toFixed(2)}
              </td>
            </tr>

            <tr>
              <td>
                <b>Grand Total</b>
              </td>
              <td>
                {Number(
                  invoice.TotalAmount || 0
                ).toFixed(2)}
              </td>
            </tr>

          </tbody>
        </table>
      </div>

    </div>
    {showPdfModal && (
  <div className="pdf-modal-overlay">
    <div className="pdf-modal-box">

      <div className="pdf-modal-header">
        <h3>
  {invoiceType === "SALE"
    ? "Sales Invoice PDF Preview"
    : "Purchase Invoice PDF Preview"}
</h3>

        <p>
          Saved to: <b>{downloadPath}</b>
        </p>

        <button
          onClick={() =>
            setShowPdfModal(false)
          }
        >
          X
        </button>
      </div>

      <iframe
        src={pdfPath}
        style={{
          width: "100%",
          height: "80vh",
          border: "none"
        }}
      />

      <button
  className="pdf-print-btn"
  onClick={() =>
    window.chrome.webview.postMessage({
      Action: "OpenPdfExternal",
      Payload: {
        Path: downloadPath
      }
    })
  }
>
  Print
</button>

    </div>
  </div>
)}
    </>
  );
}