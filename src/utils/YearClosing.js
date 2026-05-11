import React, { useEffect, useState } from "react";
import "../components/Item/ItemForms.css";

const YearClosing = () => {

  const today = new Date();

  const fyStartYear =
    today.getMonth() >= 3
      ? today.getFullYear()
      : today.getFullYear() - 1;

  const [from, setFrom] = useState(
    `${fyStartYear}-04-01`
  );

  const [to, setTo] = useState(
    `${fyStartYear + 1}-03-31`
  );

  const [preview, setPreview] = useState(null);

  const [loading, setLoading] = useState(false);

  const [modal, setModal] = useState({
    show: false,
    message: ""
  });

  // ---------------------------------------------------
  // WebView listener
  // ---------------------------------------------------
  useEffect(() => {

    const handler = (event) => {

  const msg =
    typeof event.data === "string"
      ? JSON.parse(event.data)
      : event.data;
      // ---------------------------------------
      // Preview response
      // ---------------------------------------
     if (msg.action === "getYearClosingPreviewResult") {

  setLoading(false);

  if (!msg.success) {

    let text = msg.message || "";

    if (
      msg.validationMessages &&
      msg.validationMessages.length > 0
    ) {
      text =
        msg.validationMessages.join("\n");
    }

    setModal({
      show: true,
      message: text
    });

    return;
  }

  setPreview(msg.preview);
}
if (msg.action === "performYearClosingResult") {

  setLoading(false);

  if (!msg.success) {

    let text = "";

    if (msg.errors) {

      text = Object.values(msg.errors)
        .join("\n");
    }

    setModal({
      show: true,
      message: text || "Year closing failed."
    });

    return;
  }

  setModal({
    show: true,
    message:
      "Financial year closed successfully."
  });

  setPreview(null);
}
    };

    window.chrome?.webview?.addEventListener(
      "message",
      handler
    );

    return () => {
      window.chrome?.webview?.removeEventListener(
        "message",
        handler
      );
    };

  }, []);

  // ---------------------------------------------------
  // Load Preview
  // ---------------------------------------------------
const loadPreview = () => {

  if (!window.chrome?.webview)
    return;

  setLoading(true);

  setPreview(null);

  window.chrome.webview.postMessage({
    Action: "getYearClosingPreview",
    Payload: {
      From: from,
      To: to
    }
  });
};

  // ---------------------------------------------------
  // Execute Closing
  // ---------------------------------------------------
  const executeClosing = () => {

  if (!window.chrome?.webview)
    return;

  setLoading(true);

  window.chrome.webview.postMessage({
    Action: "performYearClosing",
    Payload: {
      From: from,
      To: to
    }
  });
};
const groupedVoucherLines = [];

if (preview?.VoucherLines) {

  const map = {};

  preview.VoucherLines.forEach((line) => {

    const key = line.AccountName;

    if (!map[key]) {

      map[key] = {
        AccountName: line.AccountName,
        Debit: 0,
        Credit: 0
      };
    }

    map[key].Debit += line.Debit || 0;
    map[key].Credit += line.Credit || 0;
  });

  Object.values(map).forEach((x) =>
    groupedVoucherLines.push(x)
  );
}
  return (

    <div className="form-container">

      <div className="form-inner">

        <h2 className="form-title">
          Financial Year Closing
        </h2>

        {/* ========================================= */}
        {/* Date Selection */}
        {/* ========================================= */}

        <div className="inventory-form">

          <div className="form-row">

            <div className="form-group">
              <label>From Date</label>

              <input
                type="date"
                value={from}
                onChange={(e) =>
                  setFrom(e.target.value)
                }
              />
            </div>

            <div className="form-group">
              <label>To Date</label>

              <input
                type="date"
                value={to}
                onChange={(e) =>
                  setTo(e.target.value)
                }
              />
            </div>

          </div>

          <div className="inventory-btns">

            <button
              className="btn-submit small"
              onClick={loadPreview}
              disabled={loading}
            >
              {loading
                ? "Loading..."
                : "Load Preview"}
            </button>

          </div>

        </div>

        {/* ========================================= */}
        {/* Preview */}
        {/* ========================================= */}

        {preview && (

          <>

            {/* ===================================== */}
            {/* Summary */}
            {/* ===================================== */}

            <div className="table-container">

              <h3 className="table-title">
                Profit & Loss Summary
              </h3>

              <table className="data-table">

                <thead>
                  <tr>
                    <th>Particular</th>
                    <th>Amount</th>
                  </tr>
                </thead>

                <tbody>

                  <tr>
                    <td>Total Income</td>

                    <td
                      style={{
                        textAlign: "right"
                      }}
                    >
                      ₹ {preview.TotalIncome?.toFixed(2)}
                    </td>
                  </tr>

                  <tr>
                    <td>Total Expense</td>

                    <td
                      style={{
                        textAlign: "right"
                      }}
                    >
                      ₹ {preview.TotalExpense?.toFixed(2)}
                    </td>
                  </tr>

                  <tr>
                    <td>
  <b>
    {
      preview.NetProfit > 0
        ? "Net Profit"
        : "Net Loss"
    }
  </b>
</td>

                    <td
                      style={{
                        textAlign: "right",
                        fontWeight: "bold"
                      }}
                    >
                      ₹ {
                        (
                          preview.NetProfit ||
                          preview.NetLoss
                        )?.toFixed(2)
                      }
                    </td>
                  </tr>

                </tbody>

              </table>

            </div>

            {/* ===================================== */}
            {/* Closing Voucher */}
            {/* ===================================== */}

            <div className="table-container">

              <h3 className="table-title">
                Closing Voucher Preview
              </h3>

              <table className="data-table">

                <thead>
                  <tr>
                    <th>Account</th>
                    <th>Debit</th>
                    <th>Credit</th>
                  </tr>
                </thead>

                <tbody>

                  {groupedVoucherLines.map(
                    (l, i) => (

                      <tr key={i}>

                       <td
  style={{
    fontWeight:
      l.AccountName === "Profit & Loss A/c" ||
      l.AccountName === "Retained Earnings"
        ? "bold"
        : "normal"
  }}
>
  {l.AccountName}
</td>

                        <td
                          style={{
                            textAlign: "right"
                          }}
                        >
                          {
                            l.Debit > 0
                              ? l.Debit.toFixed(2)
                              : ""
                          }
                        </td>

                        <td
                          style={{
                            textAlign: "right"
                          }}
                        >
                          {
                            l.Credit > 0
                              ? l.Credit.toFixed(2)
                              : ""
                          }
                        </td>

                      </tr>
                    )
                  )}

                </tbody>

              </table>

            </div>
{preview.NumberingPreview && (

  <div className="table-container">

    <h3 className="table-title">
      Voucher Number Reset Preview
    </h3>

    <table className="data-table">

      <thead>
        <tr>
          <th>Voucher Type</th>
          <th>Current No</th>
          <th>Next FY No</th>
        </tr>
      </thead>

      <tbody>

        <tr>
          <td>Sales Invoice</td>
          <td>{preview.NumberingPreview.CurrentInvoiceNo}</td>
          <td>{preview.NumberingPreview.NextInvoiceNo}</td>
        </tr>

        <tr>
          <td>Income Voucher</td>
          <td>{preview.NumberingPreview.CurrentIncomeVoucherNo}</td>
          <td>{preview.NumberingPreview.NextIncomeVoucherNo}</td>
        </tr>

        <tr>
          <td>Expense Voucher</td>
          <td>{preview.NumberingPreview.CurrentExpenseVoucherNo}</td>
          <td>{preview.NumberingPreview.NextExpenseVoucherNo}</td>
        </tr>

        <tr>
          <td>Journal Voucher</td>
          <td>{preview.NumberingPreview.CurrentJournalVoucherNo}</td>
          <td>{preview.NumberingPreview.NextJournalVoucherNo}</td>
        </tr>

        <tr>
          <td>Payment Voucher</td>
          <td>{preview.NumberingPreview.CurrentPaymentVoucherNo}</td>
          <td>{preview.NumberingPreview.NextPaymentVoucherNo}</td>
        </tr>

        <tr>
          <td>Receipt Voucher</td>
          <td>{preview.NumberingPreview.CurrentReceiptVoucherNo}</td>
          <td>{preview.NumberingPreview.NextReceiptVoucherNo}</td>
        </tr>

        <tr>
          <td>Contra Voucher</td>
          <td>{preview.NumberingPreview.CurrentContraVoucherNo}</td>
          <td>{preview.NumberingPreview.NextContraVoucherNo}</td>
        </tr>

      </tbody>

    </table>

  </div>
)}
            {/* ===================================== */}
            {/* Instructions */}
            {/* ===================================== */}

            <div className="inventory-form">

              <h3 className="table-title">
                Important Instructions
              </h3>

              <ul
                style={{
                  marginTop: "12px",
                  lineHeight: "1.8"
                }}
              >
                <li>
                  Take database backup before
                  financial year closing.
                </li>

                <li>
                  Ensure all vouchers are entered
                  properly.
                </li>

                <li>
                  Do not close financial year while
                  multiple users are working.
                </li>

                <li>
                  Voucher numbering will reset after
                  closing.
                </li>

                <li>
                  Previous year reports will remain
                  accessible through date filters.
                </li>
              </ul>

            </div>

            {/* ===================================== */}
            {/* Execute */}
            {/* ===================================== */}

            <div className="inventory-btns">

              <button
  className="btn-submit small"
  onClick={executeClosing}
  disabled={loading}
>
  {
    loading
      ? "Processing..."
      : "Close Financial Year"
  }
</button>

            </div>

          </>
        )}

      </div>

      {/* ========================================= */}
      {/* Modal */}
      {/* ========================================= */}

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
                    message: ""
                  })
                }
              >
                OK
              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  );
};

export default YearClosing;