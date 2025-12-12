// EditSalesReturn.js
import React, { useEffect, useState } from "react";
import "./Invoice.css";
import "./ItemForms.css";

const blankLine = () => ({
  InvoiceItemId: 0,
  ItemId: 0,
  ItemName: "",
  HsnCode: "",
  BatchNo: "",
  Qty: 0,            // Return Qty
  AvailableQty: 0,   // (SoldQty - AlreadyReturnedQty)
  Rate: 0,
  DiscountPercent: 0,
  NetRate: 0,
  LineSubTotal: 0,
  GstPercent: 0,
  GstValue: 0,
  CgstPercent: 0,
  CgstValue: 0,
  SgstPercent: 0,
  SgstValue: 0,
  IgstPercent: 0,
  IgstValue: 0,
  LineTotal: 0,
  Notes: ""
});

export default function EditSalesReturn({ user }) {
  // ---------- STATE ----------
  const [invoiceId, setInvoiceId] = useState("");
  const [invoiceList, setInvoiceList] = useState([]);

  const [company, setCompany] = useState(null);

  const [customerId, setCustomerId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerState, setCustomerState] = useState("");

  const [invoiceDate, setInvoiceDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [invoiceNo, setInvoiceNo] = useState("");
  const [invoiceNum, setInvoiceNum] = useState();

  const [lines, setLines] = useState([blankLine()]);
  const [totals, setTotals] = useState({
    subTotal: 0,
    tax: 0,
    total: 0,
    roundOff: 0
  });

  const [notes, setNotes] = useState("");
  const [confirmModal, setConfirmModal] = useState(false);
  const [filterDate, setFilterDate] = useState(
    new Date().toISOString().slice(0, 10)
  );

  // ---------- VALIDATION ----------
  function validateReturn(data) {
    let errors = [];

    if (!data.InvoiceId) errors.push("Sales invoice is required.");
    if (!data.InvoiceDate) errors.push("Invoice date is required.");
    if (!data.InvoiceNo) errors.push("Invoice number missing.");
    if (!data.CustomerId) errors.push("Customer is required.");

    if (!data.Items || data.Items.length === 0) {
      errors.push("No items found for this invoice.");
      return errors;
    }

    // At least one item must have a positive Qty
    const anyPositive = data.Items.some(
      it => Number(it.Qty) > 0
    );
    if (!anyPositive) {
      errors.push("Enter return quantity for at least one item.");
    }

    data.Items.forEach((it, idx) => {
      const row = idx + 1;
      const returnQty = Number(it.Qty) || 0;
      const avail = Number(it.AvailableQty) || 0;

      if (returnQty < 0) {
        errors.push(`Line ${row}: Return qty cannot be negative.`);
      }

      if (returnQty > avail) {
        errors.push(
          `Line ${row}: Return qty (${returnQty}) cannot exceed available qty (${avail}).`
        );
      }
    });

    return errors;
  }

  // ---------- FETCH COMPANY + INVOICE LIST ----------
  useEffect(() => {
    // Company profile
    window.chrome?.webview?.postMessage({ Action: "GetCompanyProfile" });
  }, []);

  useEffect(() => {
    // Load all sales invoices for a date
    window.chrome.webview.postMessage({
      Action: "GetSalesInvoiceNumbersByDate",
      Payload: { Date: filterDate }
    });
  }, [filterDate]);

  // ---------- CALCULATIONS ----------
  const recalc = () => {
    let sub = 0,
      tax = 0;

    lines.forEach(l => {
      sub += Number(l.LineSubTotal || 0);
      tax += Number(l.GstValue || 0);
    });

    const totalBeforeRound = sub + tax;
    const round = Math.round(totalBeforeRound) - totalBeforeRound;

    setTotals({
      subTotal: sub,
      tax: tax,
      total: totalBeforeRound + round,
      roundOff: round
    });
  };

  useEffect(() => recalc(), [lines]);

  const isInterState = () => {
    const seller = company?.State?.toLowerCase().trim();
    const buyer = customerState?.toLowerCase().trim();

    if (!seller || !buyer) return false;
    return seller !== buyer;
  };

  // ---------- UPDATE LINE ----------
  const updateLine = (i, key, val) => {
    setLines(prev => {
      const copy = [...prev];
      const line = { ...copy[i], [key]: val };

      const qty = Number(line.Qty) || 0;   // Return Qty
      const rate = Number(line.Rate) || 0;
      const disc = Number(line.DiscountPercent) || 0;

      const netRate = +(rate - (rate * disc) / 100).toFixed(2);
      line.NetRate = netRate;

      const netAmount = +(qty * netRate).toFixed(2);
      line.LineSubTotal = netAmount;

      const gst = Number(line.GstPercent) || 0;
      const gstValue = +((netAmount * gst) / 100).toFixed(2);
      line.GstValue = gstValue;

      if (gst > 0) {
        if (isInterState()) {
          // IGST only
          line.IgstPercent = gst;
          line.IgstValue = gstValue;
          line.CgstPercent = 0;
          line.CgstValue = 0;
          line.SgstPercent = 0;
          line.SgstValue = 0;
        } else {
          // CGST + SGST
          const halfPct = gst / 2;
          line.CgstPercent = halfPct;
          line.SgstPercent = halfPct;
          line.IgstPercent = 0;

          const cg = Number((gstValue / 2).toFixed(2));
          const sg = +(gstValue - cg).toFixed(2);

          line.CgstValue = cg;
          line.SgstValue = sg;
          line.IgstValue = 0;
        }
      } else {
        line.IgstPercent = 0;
        line.IgstValue = 0;
        line.CgstPercent = 0;
        line.CgstValue = 0;
        line.SgstPercent = 0;
        line.SgstValue = 0;
      }

      line.LineTotal = netAmount + gstValue;

      copy[i] = line;
      return copy;
    });
  };

  // Re-split GST if company or customer changes (shouldn't in return, but safe)
  useEffect(() => {
    if (!company || !customerState) return;

    setLines(prev =>
      prev.map(line => {
        const gst = Number(line.GstPercent) || 0;
        const gstValue = +((line.LineSubTotal * gst) / 100).toFixed(2);

        if (gst <= 0) {
          return {
            ...line,
            IgstPercent: 0,
            IgstValue: 0,
            CgstPercent: 0,
            CgstValue: 0,
            SgstPercent: 0,
            SgstValue: 0,
            LineTotal: line.LineSubTotal
          };
        }

        if (isInterState()) {
          return {
            ...line,
            IgstPercent: gst,
            IgstValue: gstValue,
            CgstPercent: 0,
            CgstValue: 0,
            SgstPercent: 0,
            SgstValue: 0,
            LineTotal: line.LineSubTotal + gstValue
          };
        } else {
          const halfPct = gst / 2;
          const cg = +((gstValue / 2).toFixed(2));
          const sg = +(gstValue - cg).toFixed(2);

          return {
            ...line,
            IgstPercent: 0,
            IgstValue: 0,
            CgstPercent: halfPct,
            CgstValue: cg,
            SgstPercent: halfPct,
            SgstValue: sg,
            LineTotal: line.LineSubTotal + gstValue
          };
        }
      })
    );
  }, [company, customerState]);

  // ---------- LOAD SELECTED INVOICE ----------
  const loadInvoice = () => {
    if (!invoiceId) {
      alert("Select a sales invoice first.");
      return;
    }

    window.chrome.webview.postMessage({
      Action: "LoadSalesInvoice",
      Payload: { InvoiceId: invoiceId }
    });
  };

  // ---------- SAVE RETURN ----------
  const saveReturn = () => {
    const payload = {
      InvoiceId: invoiceId,
      CustomerId: customerId,
      InvoiceNo: invoiceNo,
      InvoiceNum: invoiceNum,
      InvoiceDate: invoiceDate,
      TotalAmount: totals.total,
      TotalTax: totals.tax,
      RoundOff: totals.roundOff,
      SubTotal: totals.subTotal,
      Notes: notes,
      CreatedBy: user?.email || "system",
      Items: lines
    };

    const errors = validateReturn(payload);
    if (errors.length > 0) {
      alert("Fix these issues:\n\n" + errors.join("\n"));
      return;
    }

    setConfirmModal(true);
  };

  const confirmSave = () => {
    setConfirmModal(false);

    const payload = {
      InvoiceId: invoiceId,
      CustomerId: customerId,
      InvoiceNo: invoiceNo,
      InvoiceNum: invoiceNum,
      InvoiceDate: invoiceDate,
      TotalAmount: totals.total,
      TotalTax: totals.tax,
      RoundOff: totals.roundOff,
      SubTotal: totals.subTotal,
      Notes: notes,
      CreatedBy: user?.email || "system",
      Items: lines
    };

    window.chrome.webview.postMessage({
      Action: "SaveSalesReturn",
      Payload: payload
    });
  };

  // ---------- MESSAGE LISTENER ----------
  useEffect(() => {
    const handler = evt => {
      let msg = evt.data;
      try {
        if (typeof msg === "string") msg = JSON.parse(msg);
      } catch {}

      if (!msg) return;

      // Company profile
      if (msg.action === "GetCompanyProfileResponse") {
        setCompany(msg.profile);
      }

      // Sales invoice dropdown
      if (msg.action === "GetSalesInvoiceNumbersByDateResponse") {
        // Expecting [{ Id, InvoiceNo }] etc.
        
        setInvoiceList(msg.data || []);
        console.log(invoiceList);
      }

      // Load Sales Invoice
      if (msg.action === "LoadSalesInvoiceResponse") {
        const data = msg.data;
        if (!data) {
          alert("Invoice not found.");
          return;
        }

        setInvoiceId(data.InvoiceId);
        setCustomerId(data.CustomerId);
        setCustomerName(data.CustomerName || "");
        setCustomerPhone(data.CustomerPhone || "");
        setCustomerState(data.CustomerState || "");
        setInvoiceDate(data.InvoiceDate);
        setInvoiceNo(data.InvoiceNo);
        setInvoiceNum(data.InvoiceNum);
        setNotes(data.Notes || "");

        // Items from InvoiceItems + AvailableQty
        setLines(
          (data.Items || []).map(item => ({
            InvoiceItemId: item.InvoiceItemId,
            ItemId: item.ItemId,
            ItemName: item.ItemName,
            HsnCode: item.HsnCode,
            BatchNo: item.BatchNo,
            Qty: 0, // default return qty 0
            AvailableQty: item.AvailableQty || 0, // (Qty - ReturnedQty) from backend
            Rate: item.Rate,
            DiscountPercent: item.DiscountPercent,
            NetRate: item.NetRate,
            GstPercent: item.GstPercent,
            GstValue: item.GstValue,
            CgstPercent: item.CgstPercent,
            CgstValue: item.CgstValue,
            SgstPercent: item.SgstPercent,
            SgstValue: item.SgstValue,
            IgstPercent: item.IgstPercent,
            IgstValue: item.IgstValue,
            LineSubTotal: item.LineSubTotal,
            LineTotal: item.LineTotal,
            Notes: ""
          }))
        );
      }

      // Save Sales Return result
      if (msg.action === "SaveSalesReturnResponse") {
        if (msg.success) {
          alert("Sales return saved. ReturnId = " + msg.returnId);
          
    // 🔥 CLEAR ALL STATES
    setInvoiceId("");
    setCustomerId("");
    setCustomerName("");
    setCustomerPhone("");
    setCustomerState("");
    setInvoiceDate(new Date().toISOString().slice(0, 10));
    setInvoiceNo("");
    setInvoiceNum("");
    setNotes("");

    setLines([blankLine()]);  // Reset table rows

    setTotals({
      subTotal: 0,
      tax: 0,
      total: 0,
      roundOff: 0
    });
        } else {
          alert("Failed to save sales return: " + msg.message);
        }
      }
    };

    window.chrome.webview.addEventListener("message", handler);
    return () =>
      window.chrome.webview.removeEventListener("message", handler);
  }, [invoiceId, customerId, lines]);

  // ---------- UI ----------
  return (
    <div className="invoice-editor">
      {/* INVOICE SELECTION */}
      <div className="top-section row-flex">
        <div className="print-section">
          <input
            type="date"
            value={filterDate}
            onChange={e => setFilterDate(e.target.value)}
          />

         <select
  value={invoiceId}
  onChange={e => setInvoiceId(e.target.value)}
>
  <option value="">Select Sales Invoice</option>
  {invoiceList.map(i => (
    <option key={i.InvoiceNum} value={i.InvoiceNum}>
      {i.InvoiceNo} - {i.CustomerName} - ₹{i.TotalAmount}
    </option>
  ))}
</select>

          <button className="btn-submit" onClick={loadInvoice}>
            Load Invoice
          </button>
        </div>

        {/* CUSTOMER SECTION (read-only, from invoice) */}
        <div className="customer-section">
          <label>Customer</label>
          <div className="customer-details-box">
            <div>
              <b>Name:</b> {customerName || "-"}
            </div>
            <div>
              <b>Phone:</b> {customerPhone || "-"}
            </div>
            <div>
              <b>State:</b> {customerState || "-"}
            </div>
          </div>
        </div>
      </div>

      {/* DATE + INVOICE NO */}
      <div className="form-row">
        <div className="form-group">
          <label>Invoice Date</label>
          <input
            type="date"
            readOnly
            value={invoiceDate}
            style={{ background: "#f1ecff", width: "150px" }}
            onChange={e => setInvoiceDate(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="invoice-no-label">Invoice No</label>
          <input
            type="text"
            value={invoiceNo}
            readOnly
            style={{ background: "#f1ecff", width: "150px" }}
          />
        </div>
      </div>

      {/* ITEM TABLE */}
      <table className="data-table" style={{ tableLayout: "fixed" }}>
        <thead>
          <tr>
            <th style={{ width: "200px" }}>Item</th>
            <th style={{ width: "110px" }}>Batch</th>
            <th style={{ width: "85px" }}>HSN</th>
            <th style={{ width: "90px" }}>Available Qty</th>
            <th style={{ width: "90px" }}>Return Qty</th>
            <th style={{ width: "90px" }}>Rate</th>
            <th style={{ width: "70px" }}>Disc%</th>
            <th style={{ width: "90px" }}>Net Rate</th>
            <th style={{ width: "100px" }}>Net Amt</th>
            <th style={{ width: "70px" }}>GST%</th>
            <th style={{ width: "90px" }}>GST Amt</th>
            <th style={{ width: "70px" }}>CGST%</th>
            <th style={{ width: "90px" }}>CGST Amt</th>
            <th style={{ width: "70px" }}>SGST%</th>
            <th style={{ width: "90px" }}>SGST Amt</th>
            <th style={{ width: "70px" }}>IGST%</th>
            <th style={{ width: "90px" }}>IGST Amt</th>
            <th style={{ width: "100px" }}>Total</th>
          </tr>
        </thead>

        <tbody>
          {lines.map((l, i) => (
            <tr key={i}>
              <td>
                <div className="cell-box">
                  <input readOnly value={l.ItemName} />
                </div>
              </td>

              <td>
                <div className="cell-box">
                  <input readOnly value={l.BatchNo} />
                </div>
              </td>

              <td>
                <div className="cell-box">
                  <input readOnly value={l.HsnCode} />
                </div>
              </td>

              {/* Available Qty (read only) */}
              <td>
                <div className="cell-box">
                  <input readOnly value={l.AvailableQty} />
                </div>
              </td>

              {/* Return Qty (editable) */}
              <td>
                <div className="cell-box">
                  <input
                    value={l.Qty}
                    onChange={e => updateLine(i, "Qty", e.target.value)}
                  />
                </div>
              </td>

              <td>
                <div className="cell-box">
                  <input readOnly value={l.Rate} />
                </div>
              </td>

              <td>
                <div className="cell-box">
                  <input readOnly value={l.DiscountPercent} />
                </div>
              </td>

              <td>
                <div className="cell-box">
                  <input readOnly value={l.NetRate} />
                </div>
              </td>

              <td>
                <div className="cell-box">
                  <input readOnly value={l.LineSubTotal} />
                </div>
              </td>

              <td>
                <div className="cell-box">
                  <input readOnly value={l.GstPercent} />
                </div>
              </td>

              <td>
                <div className="cell-box">
                  <input readOnly value={l.GstValue} />
                </div>
              </td>

              <td>
                <div className="cell-box">
                  <input readOnly value={l.CgstPercent} />
                </div>
              </td>

              <td>
                <div className="cell-box">
                  <input readOnly value={l.CgstValue} />
                </div>
              </td>

              <td>
                <div className="cell-box">
                  <input readOnly value={l.SgstPercent} />
                </div>
              </td>

              <td>
                <div className="cell-box">
                  <input readOnly value={l.SgstValue} />
                </div>
              </td>

              <td>
                <div className="cell-box">
                  <input readOnly value={l.IgstPercent} />
                </div>
              </td>

              <td>
                <div className="cell-box">
                  <input readOnly value={l.IgstValue} />
                </div>
              </td>

              <td>
                <div className="cell-box">
                  <input readOnly value={l.LineTotal} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* NOTES */}
      <div className="form-row">
        <div className="form-group" style={{ width: "100%" }}>
          <label>Sales Return Notes</label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={3}
            style={{
              width: "100%",
              padding: "8px",
              borderRadius: "6px",
              border: "1px solid #ccc",
              resize: "vertical",
              fontSize: "14px"
            }}
            placeholder="Enter additional notes or remarks (optional)"
          />
        </div>
      </div>

      {/* TOTALS */}
      <div className="invoice-totals">
        <div>Subtotal: {totals.subTotal.toFixed(2)}</div>
        <div>Total Tax: {totals.tax.toFixed(2)}</div>
        <div>Round Off: {totals.roundOff.toFixed(2)}</div>
        <div className="total-final">
          Grand Total: {totals.total.toFixed(2)}
        </div>
      </div>

      {/* SAVE BUTTON */}
      <div className="button-row">
        <button className="btn-submit" onClick={saveReturn}>
          Save Sales Return
        </button>
      </div>

      {/* CONFIRM MODAL */}
      {confirmModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h3>Confirm Sales Return</h3>
            <p>
              This will create a sales return against the selected invoice.
            </p>

            <button
              className="btn-cancel"
              onClick={() => setConfirmModal(false)}
            >
              Cancel
            </button>

            <button className="btn-submit" onClick={confirmSave}>
              Yes, Save Return
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
