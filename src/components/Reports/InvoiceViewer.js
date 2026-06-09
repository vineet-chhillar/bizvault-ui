import React from "react";

export default function InvoiceViewer({
  invoice,
  invoiceType = "SALE",
  onClose,
  onPrint
}) {
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
    <div className="form-container">

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "15px"
        }}
      >
        <h2 className="form-title">
          {invoiceType === "SALE"
            ? "Sales Invoice"
            : "Purchase Invoice"}
        </h2>

        <div>
          <button
            className="btn-submit small"
            onClick={onPrint}
          >
            Print PDF
          </button>

          <button
            className="btn-submit small"
            style={{ marginLeft: "8px" }}
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>

      {/* Header */}

      <div className="table-container">
        <table className="data-table">
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

      <div
        className="table-container"
        style={{ marginTop: "15px" }}
      >
        <h3 className="table-title">
          {invoiceType === "SALE"
            ? "Customer Details"
            : "Supplier Details"}
        </h3>

        <table className="data-table">
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

      <div
        className="table-container"
        style={{ marginTop: "15px" }}
      >
        <h3 className="table-title">
          Items
        </h3>

        <table className="data-table">
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
        <div
          className="table-container"
          style={{ marginTop: "15px" }}
        >
          <h3 className="table-title">
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

              <table
                className="data-table"
                style={{
                  marginTop: "10px"
                }}
              >
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
  <div
    className="table-container"
    style={{ marginTop: "15px" }}
  >
    <h3 className="table-title">
      Return Summary
    </h3>

    <table className="data-table">
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

      <div
        className="table-container"
        style={{
          marginTop: "15px",
          marginBottom: "30px"
        }}
      >
        <h3 className="table-title">
          Totals
        </h3>

        <table className="data-table">
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
  );
}