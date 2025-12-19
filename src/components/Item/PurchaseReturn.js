// EditPurchaseInvoice.js
import React, { useEffect, useState } from "react";
import "./Invoice.css";
import "./ItemForms.css";

const blankLine = () => ({
  ItemId: 0,
  ItemName: "",
  HsnCode: "",
  BatchNo: "",
  BatchNum:0,
  Qty: 1,
  Rate: "",
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
  LineSubTotal: 0,
  LineTotal: 0,
  Notes: "",
  SalesPrice: "",
  Mrp: "",
  Description: "",
  MfgDate: "",
  ExpDate: "",
  ModelNo: "",
  Brand: "",
  Size: "",
  Color: "",
  Weight: "",
  Dimension: "",
  showDetails: false,
  AvailableQty: 0
});

export default function EditPurchaseInvoice({ user }) {
  const [invoiceId, setInvoiceId] = useState("");
  const [invoiceList, setInvoiceList] = useState([]);
const [detailsModal, setDetailsModal] = useState({ open: false, index: null });
const [refundMode, setRefundMode] = useState("ADJUST"); // ADJUST | CASH | BANK
const [paidVia, setPaidVia] = useState("");             // CASH | BANK | ""

  const [company, setCompany] = useState(null);
  const [supplierList, setSupplierList] = useState([]);
  const [supplierId, setSupplierId] = useState("");
  const [supplierInfo, setSupplierInfo] = useState(null);

  const [purchaseDate, setPurchaseDate] = useState(
  new Date().toISOString().slice(0, 10)
);
  const [invoiceNo, setInvoiceNo] = useState("");
  const [invoiceNum, setInvoiceNum] = useState();

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
  if (!data.InvoiceNo)  errors.push("Invoice number missing.");
if (refundMode !== "ADJUST" && !paidVia) {
  errors.push("Refund mode requires Cash or Bank.");
}

  if (!data.Items || data.Items.length === 0) {
    errors.push("Add at least 1 item.");
    return errors;
  }

  const seen = new Set();
  data.Items.forEach((it, idx) => {

    if (!it.ItemId) errors.push(`Line ${idx + 1}: Item is required.`);

    if (Number(it.Qty) <= 0)
      errors.push(`Line ${idx + 1}: Qty must be > 0`);

    // 🚨 NEW VALIDATION 🚨
    if (Number(it.Qty) > Number(it.AvailableQty)) {
      errors.push(`Line ${idx + 1}: Qty cannot exceed available qty (${it.AvailableQty})`);
    }

  });

  return errors;
}


  // ---------- FETCH SUPPLIERS + ITEMS ----------
  useEffect(() => {
    window.chrome.webview.postMessage({ Action: "GetAllSuppliers" });
    window.chrome.webview.postMessage({ Action: "GetItemsForPurchaseInvoice" });
     window.chrome?.webview?.postMessage({ Action: "GetCompanyProfile" });
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
    //console.log(company.State)
    //console.log(supplierInfo.State)
    const seller = company?.State?.toLowerCase().trim();
    const buyer  = supplierInfo?.State?.toLowerCase().trim();

    if (!seller || !buyer) return false;
    return seller !== buyer;
  };

  // ---------- UPDATE LINE ----------
  const updateLine = (i, key, val) => {
    setLines(prev => {
      const copy = [...prev];
      const line = { ...copy[i], [key]: val };

      const qty = Number(line.Qty) || 0;
      const rate = Number(line.Rate) || 0;
      const disc = Number(line.DiscountPercent) || 0;

      const netrate = +(rate - (rate * disc / 100)).toFixed(2);
      line.NetRate = netrate;

      const netamount = +(qty * netrate).toFixed(2);
      
      line.LineSubTotal = netamount;

      const gst = Number(line.GstPercent) || 0;
      const gstValue = +(netamount * gst / 100).toFixed(2);
      line.GstValue = gstValue;

      // Correct split
      {/*if (gst > 0) {
        // At edit time: supplier/company may be available or not
        line.IgstPercent = gst;
        line.IgstValue = gstValue;
        line.CgstPercent = 0;
        line.CgstValue = 0;
        line.SgstPercent = 0;
        line.SgstValue = 0;
      }*/}
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
    // CGST + SGST (split exactly to match gstValue with rounding)
    const halfPct = gst / 2;
    line.CgstPercent = halfPct;
    line.SgstPercent = halfPct;
    line.IgstPercent = 0;

    const cg = Number((gstValue / 2).toFixed(2));   // first half rounded
    const sg = +(gstValue - cg).toFixed(2);         // remainder so cg+sg = gstValue

    line.CgstValue = cg;
    line.SgstValue = sg;
    line.IgstValue = 0;
  }
} else {
  // zero GST — clear all
  line.IgstPercent = 0;
  line.IgstValue   = 0;
  line.CgstPercent = 0;
  line.CgstValue   = 0;
  line.SgstPercent = 0;
  line.SgstValue   = 0;
}

      line.LineTotal = netamount + gstValue;

      copy[i] = line;
      return copy;
    });
  };
useEffect(() => {
  if (refundMode === "CASH") setPaidVia("CASH");
  else if (refundMode === "BANK") setPaidVia("BANK");
  else setPaidVia("");
}, [refundMode]);

// Whenever supplierInfo changes → recalc gst split for all rows
useEffect(() => {
  if (!supplierInfo || !company) return;

  setLines(prev => {
    return prev.map(line => {
      const gst = Number(line.GstPercent) || 0;
      const gstValue = +(line.LineSubTotal * gst / 100).toFixed(2);

      if (gst <= 0) {
        return {
          ...line,
          IgstPercent: 0, IgstValue: 0,
          CgstPercent: 0, CgstValue: 0,
          SgstPercent: 0, SgstValue: 0,
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
        // Split exactly and ensure correct rounding
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
    });
  });
}, [supplierInfo, company]);

  // ---------- LOAD SELECTED INVOICE ----------
  const loadInvoice = () => {
    if (!invoiceId) {
      alert("Select an invoice first.");
      return;
    }
 window.chrome.webview.postMessage({
          Action: "LoadPurchaseInvoice",
          Payload: { PurchaseId: invoiceId }
        });
    {/*window.chrome.webview.postMessage({
      Action: "CanEditPurchaseInvoice",
      Payload: { PurchaseId: invoiceId }
    });*/}
  };

  // ---------- SEND UPDATE REQUEST ----------
  const saveUpdate = () => {
    const payload = {
      PurchaseId: invoiceId,
      SupplierId: supplierId,
      InvoiceNo: invoiceNo,
      InvoiceNum: invoiceNum,
      InvoiceDate: purchaseDate,
      TotalAmount: totals.total,
      TotalTax: totals.tax,
      RoundOff: totals.roundOff,
      SubTotal: totals.subTotal,
      Notes: notes,
      CreatedBy: user?.email || "system",
        RefundMode: refundMode,   // ✅ ADD
  PaidVia: paidVia, 
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
      InvoiceNum: invoiceNum,
      InvoiceDate: purchaseDate,
      TotalAmount: totals.total,
      TotalTax: totals.tax,
      RoundOff: totals.roundOff,
      SubTotal: totals.subTotal,
      Notes: notes,
      CreatedBy: user?.email,
        RefundMode: refundMode,   // ✅ ADD
  PaidVia: paidVia,         // ✅ ADD
      Items: lines
    };

    window.chrome.webview.postMessage({
      Action: "SavePurchaseReturn",
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
 if (msg.action === "GetCompanyProfileResponse") {
        setCompany(msg.profile);
      }
      if (msg.Type === "GetItemsForPurchaseInvoice") {
        if (msg.Status === "Success") setItemList(msg.Data || []);
      }

      if (msg.action === "GetPurchaseInvoiceNumbersByDateResponse") {
        setInvoiceList(msg.data || []);
      }

      // --------------- CAN EDIT RESPONSE ---------------
    

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
        setInvoiceNum(data.InvoiceNum);
        setNotes(data.Notes || "");
        setLines((data.Items || []).map(item => ({
  PurchaseItemId: item.PurchaseItemId,          
  ItemId: item.ItemId,
  ItemName: item.ItemName,
  HsnCode: item.HsnCode,
  BatchNo: item.BatchNo,
  BatchNum: item.BatchNum,
  Qty: item.Qty,
  Rate: item.Rate,
  DiscountPercent: item.DiscountPercent,
  NetRate: item.NetRate,
  LineSubTotal: item.LineSubTotal,
  GstPercent: item.GstPercent,
  GstValue: item.GstValue,
  CgstPercent: item.CgstPercent,
  CgstValue: item.CgstValue,
  SgstPercent: item.SgstPercent,
  SgstValue: item.SgstValue,
  IgstPercent: item.IgstPercent,
  IgstValue: item.IgstValue,
  LineTotal: item.LineTotal,

  // NEW DETAILS FIELDS
  SalesPrice: item.SalesPrice || "",
  Mrp: item.Mrp || "",
  Description: item.Description || "",
  MfgDate: item.MfgDate || "",
  ExpDate: item.ExpDate || "",
  ModelNo: item.ModelNo || "",
  Brand: item.Brand || "",
  Size: item.Size || "",
  Color: item.Color || "",
  Weight: item.Weight || "",
  Dimension: item.Dimension || "",
AvailableQty: item.AvailableQty || 0,
  showDetails: false
})));

      }

      // --------------- SUPPLIER INFO ---------------
      if (msg.action === "GetSupplierByIdResponse") {
        if (msg.success) setSupplierInfo(msg.data);
      }

      // --------------- UPDATE RESPONSE ---------------
      if (msg.action === "SavePurchaseReturnResponse") {
  if (msg.success) {
    alert("Purchase return saved. ReturnId = " + msg.newReturnId);
    setLines([ blankLine() ]);
    setNotes("");
     setPurchaseDate("");   // blank
   setInvoiceNo("");      // blank
   setRefundMode("ADJUST");
setPaidVia("");

   setSupplierId("");
  } else {
    alert("Failed to save return: " + msg.message);
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
     <div className="top-section row-flex">
    <div className="print-section">
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
          disabled={true}
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
          readOnly
        </select>

        {supplierInfo && (
          <div className="supplier-details-box">
            <div><b>Name:</b> {supplierInfo.SupplierName}</div>
            <div><b>GSTIN:</b> {supplierInfo.GSTIN}</div>
            <div><b>State:</b> {supplierInfo.State}</div>
          </div>
        )}
      </div>
   </div>
      {/* DATE + INVOICE NO */}
      <div className="form-row">
        <div className="form-group">
          <label>Purchase Date</label>
          <input type="date" readOnly value={purchaseDate} style={{ background: "#f1ecff", width:"150px" }} onChange={e => setPurchaseDate(e.target.value)} />
        </div>

        <div className="form-group">
          <label className="invoice-no-label">Invoice No</label>
          <input type="text" value={invoiceNo} readOnly style={{ background: "#f1ecff", width:"150px" }} />
        </div>

<div className="form-group">
  <label>Refund Mode</label>
  <select
    value={refundMode}
    onChange={(e) => setRefundMode(e.target.value)}
  >
    <option value="ADJUST">Adjust Against Supplier Dues</option>
    <option value="CASH">Cash Refund</option>
    <option value="BANK">Bank Refund</option>
  </select>
</div>
{refundMode !== "ADJUST" && (
  <div className="form-group">
    <label>Refund Via</label>
    <input
      type="text"
      value={paidVia}
      readOnly
      style={{ background: "#f1ecff", width: "150px" }}
    />
  </div>
)}



      </div>

      {/* ITEM TABLE */}
      <table className="data-table" style={{ tableLayout: "fixed" }}>
        <thead>
          <tr>
            <th style={{ width: "200px" }}>Item</th>
            <th style={{ width: "110px" }}>Batch</th>
            <th style={{ width: "85px" }}>HSN</th>
            <th style={{ width: "70px" }}>Available Qty</th>
            <th style={{ width: "70px" }}>Return Qty</th>
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
            <th></th>
          </tr>
        </thead>

        <tbody>
          {lines.map((l, i) => (
  <React.Fragment key={i}>
    <tr>
      <td>
        <div className="cell-box">
        <input readOnly 
          value={l.ItemName}
          onChange={e => updateLine(i, "ItemName", e.target.value)}
        />
        </div>
      </td>
      <td><div className="cell-box"><input  value={l.BatchNo} readOnly /></div></td>
      <td><div className="cell-box"><input value={l.HsnCode} readOnly /></div></td>

      <td>
        <div className="cell-box">
        <input value={l.AvailableQty} readOnly onChange={e => updateLine(i, "Qty", e.target.value)} />
      </div>
      </td>

      <td>
        <div className="cell-box">
        <input value={l.Qty} onChange={e => updateLine(i, "Qty", e.target.value)} />
      </div>
      </td>

      <td>
        <div className="cell-box">
        <input value={l.Rate} readOnly  onChange={e => updateLine(i, "Rate", e.target.value)} />
        </div>
      </td>

      <td>
        <div className="cell-box">
        <input value={l.DiscountPercent} readOnly  onChange={e => updateLine(i, "DiscountPercent", e.target.value)} />
        </div>
      </td>

      <td>
        <div className="cell-box">
          <input value={l.NetRate} readOnly />
          </div>
          </td>
      <td>
        <div className="cell-box">
        <input value={l.LineSubTotal} readOnly />
        </div>
        </td>
      <td>
        <div className="cell-box">
        <input value={l.GstPercent} readOnly />
        </div>
        </td>
      <td>
        <div className="cell-box">
        <input value={l.GstValue} readOnly />
        </div>
        </td>
      <td>
        <div className="cell-box">
        <input value={l.CgstPercent} readOnly />
        </div>
        </td>
      <td>
        <div className="cell-box">
        <input value={l.CgstValue} readOnly />
        </div>
        </td>
      <td>
        <div className="cell-box">
        <input value={l.SgstPercent} readOnly />
        </div>
        </td>
      <td>
        <div className="cell-box">
        <input value={l.SgstValue} readOnly />
        </div>
        </td>
      <td>
        <div className="cell-box">
        <input value={l.IgstPercent} readOnly />
        </div>
        </td>
      <td>
        <div className="cell-box">
        <input value={l.IgstValue} readOnly />
        </div>
        </td>
      <td>
        <div className="cell-box">
        <input value={l.LineTotal} readOnly />
        </div>
        </td>


 

      {/*<td>
        <button
          onClick={() => setDetailsModal({ open: true, index: i })}
        >
          {l.showDetails ? "Hide" : "Details"}
        </button>

      </td>*/}
    </tr>

   

  </React.Fragment>
))}

        </tbody>
      </table>

      {/* NOTES */}
      <div className="form-row">
         <div className="form-group" style={{ width: "100%" }}>
    <label>Purchase Return Notes</label>
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
        fontSize: "14px",
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
        <div className="total-final">Grand Total: {totals.total.toFixed(2)}</div>
      </div>

      {/* UPDATE BUTTON */}
      <div className="button-row">
  
      <button className="btn-submit" onClick={saveUpdate}>
        Return Purchase
      </button>
      </div>

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
