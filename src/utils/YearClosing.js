import React, { useEffect, useState } from "react";
import "../components/Item/ItemForms.css";

const YearClosing = () => {

  const [companyInfo, setCompanyInfo] = useState(null);

  const [loading, setLoading] = useState(false);

  const [confirmed, setConfirmed] = useState(false);

  const [modal, setModal] = useState({
    show: false,
    message: ""
  });

  const [confirmDialog, setConfirmDialog] = useState(false);

  // =====================================================
  // WebView Message Listener
  // =====================================================

  useEffect(() => {

    const handler = (event) => {

      const msg =
        typeof event.data === "string"
          ? JSON.parse(event.data)
          : event.data;

      // ------------------------------------------
      // Financial Year Details
      // ------------------------------------------

      if (msg.action === "getFinancialYearInfoResult") {

        setLoading(false);

        if (!msg.success) {

          setModal({
            show: true,
            message:
              msg.message ||
              "Unable to load financial year information."
          });

          return;
        }

        setCompanyInfo(msg.data);
      }

      // ------------------------------------------
      // Year Closing Result
      // ------------------------------------------

      if (msg.action === "performYearClosingResult") {

        setLoading(false);

        setConfirmDialog(false);

        if (!msg.success) {

          setModal({
            show: true,
            message:
              msg.message ||
              "Financial year closing failed."
          });

          return;
        }

        setModal({
          show: true,
          message:
            "Financial year closed successfully."
        });

        loadFinancialYearInfo();

        setConfirmed(false);
      }

    };

    window.chrome?.webview?.addEventListener(
      "message",
      handler
    );

    loadFinancialYearInfo();

    return () => {

      window.chrome?.webview?.removeEventListener(
        "message",
        handler
      );

    };

  }, []);

  // =====================================================
  // Load Company Financial Year Information
  // =====================================================

  const loadFinancialYearInfo = () => {

    if (!window.chrome?.webview)
      return;

    setLoading(true);

    window.chrome.webview.postMessage({
      Action: "GetFinancialYearInfo"
    });

  };

  // =====================================================
  // Close Button Click
  // =====================================================

  const handleCloseYear = () => {

    if (!confirmed)
      return;

    setConfirmDialog(true);

  };

  // =====================================================
  // Execute Year Closing
  // =====================================================

  const executeYearClosing = () => {

    if (!window.chrome?.webview)
      return;

    setLoading(true);

    window.chrome.webview.postMessage({
      Action: "PerformYearClosing"
    });

  };
    return (

    <div className="form-container">

      <div className="form-inner">

        <h2 className="form-title">
          Financial Year Closing
        </h2>

        {/* ================================================= */}
        {/* Financial Year Information */}
        {/* ================================================= */}

        <div className="table-container">

          <h3 className="table-title">
            Financial Year Information
          </h3>

          <table className="data-table">

            <tbody>

              <tr>
                <td><b>Current Financial Year</b></td>
                <td>
                  {companyInfo?.CurrentFinancialYearStart}
                  {" "}
                  to
                  {" "}
                  {companyInfo?.CurrentFinancialYearEnd}
                </td>
              </tr>

              <tr>
                <td><b>Next Financial Year</b></td>
                <td>
                  {companyInfo?.NextFinancialYearStart}
                  {" "}
                  to
                  {" "}
                  {companyInfo?.NextFinancialYearEnd}
                </td>
              </tr>

              <tr>
                <td><b>Last Year Closed On</b></td>
                <td>
                  {
                    companyInfo?.LastYearClosedOn ||
                    "Never"
                  }
                </td>
              </tr>

            </tbody>

          </table>

        </div>

        {/* ================================================= */}
        {/* Voucher Numbers */}
        {/* ================================================= */}

        <div className="table-container">

          <h3 className="table-title">
            Current Voucher Numbers
          </h3>

          <table className="data-table">

            <thead>

              <tr>
                <th>Voucher Type</th>
                <th>Current Number</th>
              </tr>

            </thead>

            <tbody>

              <tr>
                <td>Sales Invoice</td>
                <td>{companyInfo?.CurrentInvoiceNo}</td>
              </tr>

              

              <tr>
                <td>Receipt Voucher</td>
                <td>{companyInfo?.CurrentReceiptVoucherNo}</td>
              </tr>

              <tr>
                <td>Payment Voucher</td>
                <td>{companyInfo?.CurrentPaymentVoucherNo}</td>
              </tr>

              <tr>
                <td>Journal Voucher</td>
                <td>{companyInfo?.CurrentJournalVoucherNo}</td>
              </tr>

              <tr>
                <td>Contra Voucher</td>
                <td>{companyInfo?.CurrentContraVoucherNo}</td>
              </tr>

              <tr>
                <td>Income Voucher</td>
                <td>{companyInfo?.CurrentIncomeVoucherNo}</td>
              </tr>

              <tr>
                <td>Expense Voucher</td>
                <td>{companyInfo?.CurrentExpenseVoucherNo}</td>
              </tr>

            </tbody>

          </table>

        </div>

        {/* ================================================= */}
        {/* Notes */}
        {/* ================================================= */}

        <div className="inventory-form">

          <h3 className="table-title">
            Notes
          </h3>

          <ul
            style={{
              marginTop: "12px",
              lineHeight: "1.9"
            }}
          >

            <li>
              This process will activate the next financial year.
            </li>

            <li>
              All voucher numbering will be reset to their configured starting numbers.
            </li>

            <li>
              Existing invoices, vouchers, stock, ledgers and reports will remain unchanged.
            </li>

            <li>
              Previous financial year reports will continue to be available using date filters.
            </li>

            <li>
              Transactions cannot be entered for the previous financial year after closing.
            </li>

            <li>
              It is strongly recommended to take a complete database backup before proceeding.
            </li>

            <li>
              This operation cannot be automatically undone.
            </li>

          </ul>

        </div>

        {/* ================================================= */}
        {/* Confirmation */}
        {/* ================================================= */}

        <div
          className="inventory-form"
          style={{ marginTop: "15px" }}
        >

          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              cursor: "pointer",
              fontWeight: "600"
            }}
          >

            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) =>
                setConfirmed(e.target.checked)
              }
            />

            I have read the above instructions and wish to continue.

          </label>

        </div>

        {/* ================================================= */}
        {/* Buttons */}
        {/* ================================================= */}

        <div className="inventory-btns">

          <button
            className="btn-submit small"
            disabled={!confirmed || loading}
            onClick={handleCloseYear}
          >
            {
              loading
                ? "Processing..."
                : "Close Financial Year"
            }
          </button>

        </div>

      </div>

      {/* ================================================= */}
      {/* Confirmation Dialog */}
      {/* ================================================= */}

      {
        confirmDialog && (

          <div className="modal-overlay">

            <div className="modal-box">

              <h3>
                Financial Year Closing
              </h3>

              <p
                style={{
                  marginTop: "20px",
                  lineHeight: "1.8"
                }}
              >

                Current Financial Year

                <br /><br />

                <b>
                  {companyInfo?.CurrentFinancialYearStart}
                  {" "}
                  to
                  {" "}
                  {companyInfo?.CurrentFinancialYearEnd}
                </b>

                <br /><br />

                will be closed.

                <br /><br />

                Next Financial Year

                <br /><br />

                <b>
                  {companyInfo?.NextFinancialYearStart}
                  {" "}
                  to
                  {" "}
                  {companyInfo?.NextFinancialYearEnd}
                </b>

                <br /><br />

                will become active.

                <br /><br />

                Voucher numbering will be reset.

                <br /><br />

                Do you want to continue?

              </p>

              <div className="modal-actions">

                <button
                  className="modal-btn ok"
                  onClick={executeYearClosing}
                >
                  Yes
                </button>

                <button
                  className="modal-btn cancel"
                  onClick={() =>
                    setConfirmDialog(false)
                  }
                >
                  No
                </button>

              </div>

            </div>

          </div>

        )
      }

      {/* ================================================= */}
      {/* Message Modal */}
      {/* ================================================= */}

      {
        modal.show && (

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

        )
      }

    </div>

  );

};

export default YearClosing;