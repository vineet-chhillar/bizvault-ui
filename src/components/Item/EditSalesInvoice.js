// EditSalesInvoice.js
import React, { useEffect, useState } from "react";
import "./Invoice.css";
import "./ItemForms.css";

const blankLine = () => ({
  InvoiceItemId: 0,
  ItemId: 0,
  ItemName: "",
  HsnCode: "",
  BatchNo: "",
  Qty: 0,
  ReturnedQty: 0,

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

  LineTotal: 0
});

export default function EditSalesInvoice({ user }) {

  // --------------------------------------------------
  // HEADER STATE
  // --------------------------------------------------
  const [invoiceId, setInvoiceId] = useState("");
  const [invoiceList, setInvoiceList] = useState([]);
  const [filterDate, setFilterDate] = useState(
    new Date().toISOString().slice(0, 10)
  );

  const [invoiceNo, setInvoiceNo] = useState("");
  const [invoiceNum, setInvoiceNum] = useState("");
  const [invoiceDate, setInvoiceDate] = useState("");

  const [customerName, setCustomerName] = useState("");
  const [customerId, setCustomerId] = useState(null);

  const [paymentMode, setPaymentMode] = useState("CREDIT");
  const [paidAmount, setPaidAmount] = useState(0);
  const [originalPaidAmount, setOriginalPaidAmount] = useState(0);
  const [paidVia, setPaidVia] = useState("CASH");

  const [isEditMode, setIsEditMode] = useState(false);
  const [confirmModal, setConfirmModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const [paymentForm, setPaymentForm] = useState({
    PaymentDate: new Date().toISOString().slice(0, 10),
    PaymentMode: "CASH",
    Amount: 0,
    Notes: ""
  });

  // --------------------------------------------------
  // ITEMS + TOTALS
  // --------------------------------------------------
  const [lines, setLines] = useState([blankLine()]);
  const [totals, setTotals] = useState({
    subTotal: 0,
    tax: 0,
    total: 0,
    roundOff: 0
  });

  const balanceAmount =
    paymentMode === "CREDIT"
      ? Math.max(0, totals.total - originalPaidAmount)
      : 0;

  // --------------------------------------------------
  // LOAD INVOICE LIST
  // --------------------------------------------------
  useEffect(() => {
    window.chrome.webview.postMessage({
      Action: "GetInvoiceNumbersByDate",
      Payload: { date: filterDate }
    });
  }, [filterDate]);

  // --------------------------------------------------
  // TOTAL CALC
  // --------------------------------------------------
  useEffect(() => {
    let sub = 0, tax = 0;

    lines.forEach(l => {
      sub += Number(l.LineSubTotal || 0);
      tax += Number(l.GstValue || 0);
    });

    const totalBeforeRound = sub + tax;
    const round = Math.round(totalBeforeRound) - totalBeforeRound;

    setTotals({
      subTotal: sub,
      tax,
      total: totalBeforeRound + round,
      roundOff: round
    });
  }, [lines]);

  // --------------------------------------------------
  // UPDATE LINE
  // --------------------------------------------------
  const updateLine = (i, key, val) => {
    setLines(prev => {
      const copy = [...prev];
      const base = copy[i];
      const line = { ...base, [key]: val };

      if (key === "Qty") {
        const maxQty = base.Qty - base.ReturnedQty;
        line.Qty = Math.max(0, Math.min(Number(val), maxQty));
      }

      const qty = Number(line.Qty) || 0;
      const rate = Number(line.Rate) || 0;
      const disc = Number(line.DiscountPercent) || 0;

      line.NetRate = +(rate - (rate * disc / 100)).toFixed(2);
      line.LineSubTotal = +(qty * line.NetRate).toFixed(2);

      const gstVal = +(line.LineSubTotal * (line.GstPercent || 0) / 100).toFixed(2);
      line.GstValue = gstVal;
      line.LineTotal = line.LineSubTotal + gstVal;

      copy[i] = line;
      return copy;
    });
  };

  // --------------------------------------------------
  // LOAD INVOICE
  // --------------------------------------------------
  const loadInvoice = () => {
  if (!invoiceId) {
    alert("Select an invoice first.");
    return;
  }

  window.chrome.webview.postMessage({
    Action: "CanEditSalesInvoice",
    Payload: { InvoiceId: invoiceId }
  });
};


  // --------------------------------------------------
  // UPDATE INVOICE
  // --------------------------------------------------
  const updateInvoice = () => {
    window.chrome.webview.postMessage({
      Action: "UpdateSalesInvoice",
      Payload: {
        InvoiceId: invoiceId,
        InvoiceNo: invoiceNo,
        InvoiceNum: invoiceNum,
        InvoiceDate: invoiceDate,
        CustomerId: customerId,
        PaymentMode: paymentMode,
        PaidAmount: paidAmount,
        PaidVia: paidVia,
        SubTotal: totals.subTotal,
        TotalTax: totals.tax,
        RoundOff: totals.roundOff,
        TotalAmount: totals.total,
        CreatedBy: user?.email || "system",
        Items: lines
      }
    });
  };

  // --------------------------------------------------
  // MESSAGE HANDLER
  // --------------------------------------------------
  useEffect(() => {
    const handler = evt => {
      let msg = evt.data;
      try { if (typeof msg === "string") msg = JSON.parse(msg); } catch {}

      if (!msg) return;
// ---------- CAN EDIT SALES INVOICE ----------
if (msg.action === "CanEditSalesInvoiceResponse") {
  if (!msg.Editable) {
    alert(
      "This sales invoice cannot be edited because some quantity has been returned."
    );
    return;
  }

  // ✅ Use ID from response, NOT React state
  window.chrome.webview.postMessage({
    Action: "LoadSalesInvoice",
    Payload: { InvoiceId: msg.InvoiceId }
  });
}


      if (msg.action === "invoiceNumbersByDateResult") {
        setInvoiceList(msg.data || []);
      }
// ---------- CAN EDIT SALES INVOICE ----------
if (msg.action === "CanEditSalesInvoiceResponse") {
  if (!msg.Editable) {
    alert(
      "This sales invoice cannot be edited because some quantity has already been returned."
    );
    return;
  }

  // ✅ Allowed → load invoice (same pattern as purchase)
  window.chrome.webview.postMessage({
    Action: "LoadSalesInvoice",
    Payload: { InvoiceId: msg.InvoiceId }
  });
}

      if (msg.action === "LoadSalesInvoiceResponse") {
  const d = msg.data;
  if (!d) {
    alert("Invoice not found.");
    return;
  }

  setIsEditMode(true);

  setInvoiceNo(d.InvoiceNo);
  setInvoiceNum(d.InvoiceNum);
  setInvoiceDate(d.InvoiceDate);

  setCustomerId(d.CustomerId);
  setCustomerName(d.CustomerName);

  setPaymentMode(d.PaymentMode);
  setPaidVia(d.PaidVia || "CASH");
  setPaidAmount(Number(d.PaidAmount) || 0);
  setOriginalPaidAmount(Number(d.PaidAmount) || 0);

  setLines(
    (d.Items || []).map(it => ({
      ...blankLine(),
      ...it
    }))
  );
}


      if (msg.action === "UpdateSalesInvoiceResponse") {
        if (msg.success) {
          alert("Invoice updated successfully.");
          setIsEditMode(false);
          setLines([blankLine()]);
        } else {
          alert("Update failed: " + msg.message);
        }
      }
    };

    window.chrome.webview.addEventListener("message", handler);
    return () => window.chrome.webview.removeEventListener("message", handler);
  }, []);

  // --------------------------------------------------
  // UI
  // --------------------------------------------------
  return (
    <div className="invoice-editor">

      {/* TOP SECTION */}
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
              <option key={i.Id} value={i.Id}>{i.InvoiceNo}</option>
            ))}
          </select>

          <button className="btn-submit" onClick={loadInvoice}>
            Load Invoice
          </button>
        </div>

        <div className="customer-section">
          <label>Customer</label>
          <input
            value={customerName}
            readOnly
            style={{ background: "#f1ecff" }}
          />
        </div>
      </div>

      {/* HEADER ROW */}
      <div className="form-row">
        <div className="form-group">
          <label>Sales Date</label>
          <input type="date" readOnly value={invoiceDate} />
        </div>

        <div className="form-group">
          <label>Invoice No</label>
          <input readOnly value={invoiceNo} />
        </div>

        <div className="form-group">
          <label>Payment Mode</label>
          <select value={paymentMode} disabled>
            <option value="CASH">Cash</option>
            <option value="BANK">Bank</option>
            <option value="CREDIT">Credit</option>
          </select>
        </div>

        <div className="form-group">
          <label>Paid Amount</label>
          <input readOnly value={paidAmount} />
        </div>

        <div className="form-group">
          <label>Balance</label>
          <input readOnly value={balanceAmount.toFixed(2)} />
        </div>

        <div className="form-group">
          {paymentMode === "CREDIT" && isEditMode && balanceAmount > 0 && (
            <button className="btn-submit" onClick={() => setShowPaymentModal(true)}>
              ➕ Add Payment
            </button>
          )}
        </div>
      </div>

      {/* ITEM TABLE */}
      <table className="data-table">
        <thead>
          <tr>
            <th>Item</th>
            <th>Batch</th>
            <th>Qty</th>
            <th>Rate</th>
            <th>Disc%</th>
            <th>Net</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((l, i) => (
            <tr key={i}>
              <td><div className="cell-box">{l.ItemName}</div></td>
              <td><div className="cell-box">{l.BatchNo}</div></td>
              <td>
                <div className="cell-box">
                  <input
                    value={l.Qty}
                    disabled={l.ReturnedQty >= l.Qty}
                    onChange={e => updateLine(i, "Qty", e.target.value)}
                  />
                </div>
              </td>
              <td><div className="cell-box"><input value={l.Rate} readOnly /></div></td>
              <td><div className="cell-box"><input value={l.DiscountPercent} readOnly /></div></td>
              <td><div className="cell-box">{l.LineSubTotal.toFixed(2)}</div></td>
              <td><div className="cell-box">{l.LineTotal.toFixed(2)}</div></td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* TOTALS */}
      <div className="invoice-totals">
        <div>Subtotal: {totals.subTotal.toFixed(2)}</div>
        <div>Tax: {totals.tax.toFixed(2)}</div>
        <div>RoundOff: {totals.roundOff.toFixed(2)}</div>
        <div className="total-final">Total: {totals.total.toFixed(2)}</div>
      </div>

      {/* ACTION */}
      <div className="button-row">
        <button className="btn-submit" onClick={() => setConfirmModal(true)}>
          Update Invoice
        </button>
      </div>

      {/* CONFIRM MODAL */}
      {confirmModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h3>Confirm Update</h3>
            <p>
              Updating this invoice will cancel the original invoice and
              create a new updated one.
            </p>

            <button className="btn-cancel" onClick={() => setConfirmModal(false)}>
              Cancel
            </button>
            <button className="btn-submit" onClick={updateInvoice}>
              Yes, Update Invoice
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
