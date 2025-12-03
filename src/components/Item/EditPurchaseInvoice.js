// EditPurchaseInvoice.js
import React, { useEffect, useState } from "react";
import "./Invoice.css";
import "./ItemForms.css";

const blankLine = () => ({
  ItemId: 0,
  ItemName: "",
  HsnCode: "",
  BatchNo: "",
  Qty: 1,
  Rate: "",
  Discount: 0,
  NetRate: 0,
  NetAmount: 0,
  GstPercent: 0,
  GstValue: 0,
  CgstPercent: 0,
  CgstValue: 0,
  SgstPercent: 0,
  SgstValue: 0,
  IgstPercent: 0,
  IgstValue: 0,
  LineSubTotal: 0,
  LineTotal: 0,
  Notes: "",
  salesPrice: "",
  mrp: "",
  description: "",
  mfgdate: "",
  expdate: "",
  modelno: "",
  brand: "",
  size: "",
  color: "",
  weight: "",
  dimension: "",
  showDetails: false
});

export default function EditPurchaseInvoice({ user }) {
  const [invoiceId, setInvoiceId] = useState("");
  const [invoiceList, setInvoiceList] = useState([]);

  const [supplierList, setSupplierList] = useState([]);
  const [supplierId, setSupplierId] = useState("");
  const [supplierInfo, setSupplierInfo] = useState(null);

  const [purchaseDate, setPurchaseDate] = useState(
  new Date().toISOString().slice(0, 10)
);
  const [invoiceNo, setInvoiceNo] = useState("");

  const [itemList, setItemList] = useState([]);
  const [lines, setLines] = useState([blankLine()]);
  const [totals, setTotals] = useState({ subTotal: 0, tax: 0, total: 0, roundOff: 0 });

  const [notes, setNotes] = useState("");

  const [confirmModal, setConfirmModal] = useState(false);
const [filterDate, setFilterDate] = useState(
  new Date().toISOString().slice(0, 10)
);

  // ---------- VALIDATION ----------
  function validateUpdate(data) {
    let errors = [];

    if (!data.SupplierId) errors.push("Supplier is required.");
    if (!data.InvoiceDate) errors.push("Invoice date is required.");
    if (!data.InvoiceNo) errors.push("Invoice number missing.");

    if (!data.Items || data.Items.length === 0) {
      errors.push("Add at least 1 item.");
      return errors;
    }

    // duplicates (item + batch)
    const seen = new Set();
    data.Items.forEach((it, idx) => {
      const key = `${it.ItemId}_${it.BatchNo}`;
      if (seen.has(key))
        errors.push(`Duplicate Item + Batch at line ${idx + 1}`);
      seen.add(key);

      if (!it.ItemId) errors.push(`Line ${idx + 1}: Item is required.`);
      if (!it.Qty || it.Qty <= 0) errors.push(`Line ${idx + 1}: Qty must be > 0`);
    });

    return errors;
  }

  // ---------- FETCH SUPPLIERS + ITEMS ----------
  useEffect(() => {
    window.chrome.webview.postMessage({ Action: "GetAllSuppliers" });
    window.chrome.webview.postMessage({ Action: "GetItemsForPurchaseInvoice" });
  }, []);

  // ---------- LOAD INVOICE LIST ----------
 useEffect(() => {
  window.chrome.webview.postMessage({
    Action: "GetPurchaseInvoiceNumbersByDate",
    Payload: { Date: filterDate }
  });
}, [filterDate]);


  // ---------- CALCULATIONS ----------
  const recalc = () => {
    let sub = 0, tax = 0;
    lines.forEach(l => {
      sub += Number(l.NetAmount || 0);
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

  // ---------- UPDATE LINE ----------
  const updateLine = (i, key, val) => {
    setLines(prev => {
      const copy = [...prev];
      const line = { ...copy[i], [key]: val };

      const qty = Number(line.Qty) || 0;
      const rate = Number(line.Rate) || 0;
      const disc = Number(line.Discount) || 0;

      const netrate = +(rate - (rate * disc / 100)).toFixed(2);
      line.NetRate = netrate;

      const netamount = +(qty * netrate).toFixed(2);
      line.NetAmount = netamount;
      line.LineSubTotal = netamount;

      const gst = Number(line.GstPercent) || 0;
      const gstValue = +(netamount * gst / 100).toFixed(2);
      line.GstValue = gstValue;

      // Correct split
      if (gst > 0) {
        // At edit time: supplier/company may be available or not
        line.IgstPercent = gst;
        line.IgstValue = gstValue;
        line.CgstPercent = 0;
        line.CgstValue = 0;
        line.SgstPercent = 0;
        line.SgstValue = 0;
      }

      line.LineTotal = netamount + gstValue;

      copy[i] = line;
      return copy;
    });
  };

  // ---------- LOAD SELECTED INVOICE ----------
  const loadInvoice = () => {
    if (!invoiceId) {
      alert("Select an invoice first.");
      return;
    }

    window.chrome.webview.postMessage({
      Action: "CanEditPurchaseInvoice",
      Payload: { PurchaseId: invoiceId }
    });
  };

  // ---------- SEND UPDATE REQUEST ----------
  const saveUpdate = () => {
    const payload = {
      PurchaseId: invoiceId,
      SupplierId: supplierId,
      InvoiceNo: invoiceNo,
      InvoiceDate: purchaseDate,
      TotalAmount: totals.total,
      TotalTax: totals.tax,
      RoundOff: totals.roundOff,
      SubTotal: totals.subTotal,
      Notes: notes,
      CreatedBy: user?.email || "system",
      Items: lines
    };

    const errors = validateUpdate(payload);
    if (errors.length > 0) {
      alert("Fix these issues:\n\n" + errors.join("\n"));
      return;
    }

    setConfirmModal(true);
  };

  const confirmUpdate = () => {
    setConfirmModal(false);

    const payload = {
      PurchaseId: invoiceId,
      SupplierId: supplierId,
      InvoiceNo: invoiceNo,
      InvoiceDate: purchaseDate,
      TotalAmount: totals.total,
      TotalTax: totals.tax,
      RoundOff: totals.roundOff,
      SubTotal: totals.subTotal,
      Notes: notes,
      CreatedBy: user?.email,
      Items: lines
    };

    window.chrome.webview.postMessage({
      Action: "UpdatePurchaseInvoice",
      Payload: payload
    });
  };

  // ---------- MESSAGE LISTENER ----------
  useEffect(() => {
    const handler = evt => {
      let msg = evt.data;
      try { if (typeof msg === "string") msg = JSON.parse(msg); } catch { }

      if (!msg) return;

      if (msg.action === "GetAllSuppliers") {
        setSupplierList(msg.data || []);
      }

      if (msg.Type === "GetItemsForPurchaseInvoice") {
        if (msg.Status === "Success") setItemList(msg.Data || []);
      }

      if (msg.action === "GetPurchaseInvoiceNumbersByDateResponse") {
        setInvoiceList(msg.data || []);
      }

      // --------------- CAN EDIT RESPONSE ---------------
      if (msg.action === "CanEditPurchaseInvoiceResponse") {
        if (!msg.Editable) {
          alert("This invoice cannot be edited because some items were used in sales.");
          return;
        }

        // allowed → load invoice
        window.chrome.webview.postMessage({
          Action: "LoadPurchaseInvoice",
          Payload: { PurchaseId: invoiceId }
        });
      }

      // --------------- LOAD INVOICE ---------------
      if (msg.action === "LoadPurchaseInvoiceResponse") {
        const data = msg.data;
        if (!data) {
          alert("Invoice not found.");
          return;
        }

        setSupplierId(data.SupplierId);
        setPurchaseDate(data.InvoiceDate);
        setInvoiceNo(data.InvoiceNo);
        setNotes(data.Notes || "");
        setLines(data.Items || []);
      }

      // --------------- SUPPLIER INFO ---------------
      if (msg.action === "GetSupplierByIdResponse") {
        if (msg.success) setSupplierInfo(msg.data);
      }

      // --------------- UPDATE RESPONSE ---------------
      if (msg.action === "UpdatePurchaseInvoiceResponse") {
        if (msg.success) {
          alert("Invoice updated successfully. New PurchaseId = " + msg.newPurchaseId);
        } else {
          alert("Update failed: " + msg.message);
        }
      }
    };

    window.chrome.webview.addEventListener("message", handler);
    return () => window.chrome.webview.removeEventListener("message", handler);
  }, [invoiceId, supplierId, lines]);

  // ---------- UI ----------
  return (
    <div className="invoice-editor">

      {/* INVOICE SELECTION */}
      <div className="top-section">
        <input
    type="date"
    value={filterDate}
    onChange={(e) => setFilterDate(e.target.value)}
  />
        <select
          value={invoiceId}
          onChange={(e) => setInvoiceId(e.target.value)}
        >
          <option value="">Select Purchase Invoice</option>
          {invoiceList.map(i => (
            <option key={i.Id} value={i.Id}>{i.PurchaseNo}</option>
          ))}
        </select>

        <button className="btn-submit" onClick={loadInvoice}>
          Load Invoice
        </button>
      </div>

      {/* SUPPLIER SECTION */}
      <div className="customer-section">
        <label>Supplier</label>
        <select
          value={supplierId}
          onChange={(e) => {
            setSupplierId(e.target.value);
            window.chrome.webview.postMessage({
              Action: "GetSupplierById",
              Payload: { SupplierId: e.target.value }
            });
          }}
        >
          <option value="">Select Supplier</option>
          {supplierList.map(s => (
            <option key={s.SupplierId} value={s.SupplierId}>
              {s.SupplierName}
            </option>
          ))}
        </select>

        {supplierInfo && (
          <div className="supplier-details-box">
            <div><b>Name:</b> {supplierInfo.SupplierName}</div>
            <div><b>GSTIN:</b> {supplierInfo.GSTIN}</div>
            <div><b>State:</b> {supplierInfo.State}</div>
          </div>
        )}
      </div>

      {/* DATE + INVOICE NO */}
      <div className="form-row">
        <div className="form-group">
          <label>Purchase Date</label>
          <input type="date" value={purchaseDate} onChange={e => setPurchaseDate(e.target.value)} />
        </div>

        <div className="form-group">
          <label>Invoice No</label>
          <input type="text" value={invoiceNo} readOnly />
        </div>
      </div>

      {/* ITEM TABLE */}
      <table className="data-table">
        <thead>
          <tr>
            <th>Item</th>
            <th>Batch</th>
            <th>HSN</th>
            <th>Qty</th>
            <th>Rate</th>
            <th>Disc%</th>
            <th>Net Rate</th>
            <th>Net Amt</th>
            <th>GST%</th>
            <th>GST Amt</th>
            <th>Total</th>
          </tr>
        </thead>

        <tbody>
          {lines.map((l, i) => (
            <tr key={i}>
              <td>
                <input
                  value={l.ItemName}
                  onChange={e => updateLine(i, "ItemName", e.target.value)}
                />
              </td>
              <td><input value={l.BatchNo} readOnly /></td>
              <td><input value={l.HsnCode} readOnly /></td>

              <td>
                <input
                  value={l.Qty}
                  onChange={e => updateLine(i, "Qty", e.target.value)}
                />
              </td>

              <td>
                <input
                  value={l.Rate}
                  onChange={e => updateLine(i, "Rate", e.target.value)}
                />
              </td>

              <td>
                <input
                  value={l.Discount}
                  onChange={e => updateLine(i, "Discount", e.target.value)}
                />
              </td>

              <td><input value={l.NetRate} readOnly /></td>
              <td><input value={l.NetAmount} readOnly /></td>
              <td><input value={l.GstPercent} readOnly /></td>
              <td><input value={l.GstValue} readOnly /></td>
              <td><input value={l.LineTotal} readOnly /></td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* NOTES */}
      <div className="form-row">
        <label>Notes</label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={3}
        />
      </div>

      {/* TOTALS */}
      <div className="invoice-totals">
        <div>Subtotal: {totals.subTotal.toFixed(2)}</div>
        <div>Total Tax: {totals.tax.toFixed(2)}</div>
        <div>Round Off: {totals.roundOff.toFixed(2)}</div>
        <div className="total-final">Grand Total: {totals.total.toFixed(2)}</div>
      </div>

      {/* UPDATE BUTTON */}
      <button className="btn-submit" onClick={saveUpdate}>
        Update Invoice
      </button>

      {/* CONFIRM MODAL */}
      {confirmModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h3>Confirm Update</h3>
            <p>
              Updating this invoice will mark the original invoice as rejected
              and create a new updated one.
            </p>

            <button
              className="btn-cancel"
              onClick={() => setConfirmModal(false)}
            >
              Cancel
            </button>

            <button
              className="btn-submit"
              onClick={confirmUpdate}
            >
              Yes, Update Invoice
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
