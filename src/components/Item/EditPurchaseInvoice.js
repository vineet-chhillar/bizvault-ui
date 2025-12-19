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
  showDetails: false
});

export default function EditPurchaseInvoice({ user }) {
  const [invoiceId, setInvoiceId] = useState("");
  const [invoiceList, setInvoiceList] = useState([]);
const [detailsModal, setDetailsModal] = useState({ open: false, index: null });
const [paymentMode, setPaymentMode] = useState("CREDIT");
const [paidAmount, setPaidAmount] = useState(0);
const [paidVia, setPaidVia] = useState("CASH"); // NEW

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
const balanceAmount = Math.max(0, totals.total - paidAmount);
  // ---------- VALIDATION ----------
  function validateUpdate(data) {
    let errors = [];

    if (paymentMode === "CREDIT" && !data.SupplierId) {
  errors.push("Supplier is required for credit purchase.");
}

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
useEffect(() => {
  if (paymentMode !== "CREDIT") {
    setPaidAmount(totals.total);
    setPaidVia(paymentMode); // CASH or BANK
  } else {
    // CREDIT
    if (paidAmount === 0) {
      setPaidVia("CASH"); // default, harmless
    }
  }
}, [paymentMode, totals.total]);


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
const addLine = () => setLines(prev => [...prev, blankLine()]);
    const removeLine = (i) => {
  setLines(prev => {
    if (prev.length === 1) {
      alert("At least one item is required in the invoice.");
      return prev; // do NOT delete
    }

    return prev.filter((_, j) => j !== i);
  });
};
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
      InvoiceNum: invoiceNum,
      InvoiceDate: purchaseDate,
      TotalAmount: totals.total,
      TotalTax: totals.tax,
      RoundOff: totals.roundOff,
      SubTotal: totals.subTotal,
      Notes: notes,
      CreatedBy: user?.email || "system",
      PaymentMode: paymentMode,
PaidAmount: paidAmount,
BalanceAmount: balanceAmount,
PaidVia:paidVia,
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
      PaymentMode: paymentMode,
PaidAmount: paidAmount,
BalanceAmount: balanceAmount,
PaidVia:paidVia,
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
setPaymentMode(data.PaymentMode || "CREDIT");
setPaidAmount(Number(data.PaidAmount) || 0);
setPaidVia(data.PaidVia || "CASH");

        setSupplierId(data.SupplierId);
        setPurchaseDate(data.InvoiceDate);
        setInvoiceNo(data.InvoiceNo);
        setInvoiceNum(data.InvoiceNum);
        setNotes(data.Notes || "");
        setLines((data.Items || []).map(item => ({
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

  showDetails: false
})));

      }

      // --------------- SUPPLIER INFO ---------------
      if (msg.action === "GetSupplierByIdResponse") {
        if (msg.success) setSupplierInfo(msg.data);
      }

      // --------------- UPDATE RESPONSE ---------------
      if (msg.action === "UpdatePurchaseInvoiceResponse") {
        if (msg.success) {
          alert("Invoice updated successfully. New PurchaseId = " + msg.newPurchaseId);

    

    // Refresh dropdown for today's date
    setInvoiceNo("");
    setPurchaseDate("");
setLines([ blankLine() ]);
    setNotes("");
    setPaidAmount(0);

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
    <label>Payment Mode</label>
    <select
      value={paymentMode}
      onChange={e => setPaymentMode(e.target.value)}
    >
      <option value="CASH">Cash</option>
      <option value="BANK">Bank</option>
      <option value="CREDIT">Credit</option>
    </select>
  </div>
<div className="form-group">
    <label>Paid Amount</label>
    <input
      type="number"
      min="0"
      max={totals.total}
      value={paidAmount}
      disabled={paymentMode !== "CREDIT"}
      onChange={e => {
        const v = Number(e.target.value) || 0;
        setPaidAmount(Math.min(v, totals.total));
      }}
    />
  </div>

  <div className="form-group">
    <label>Balance Amount</label>
    <input
      type="number"
      readOnly
      value={Number(balanceAmount).toFixed(2)}
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
            <th style={{ width: "70px" }}>Qty</th>
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
        <input
          value={l.ItemName}
          onChange={e => updateLine(i, "ItemName", e.target.value)}
        />
        </div>
      </td>
      <td><div className="cell-box"><input value={l.BatchNo} readOnly /></div></td>
      <td><div className="cell-box"><input value={l.HsnCode} readOnly /></div></td>

      <td>
        <div className="cell-box">
        <input value={l.Qty} onChange={e => updateLine(i, "Qty", e.target.value)} />
      </div>
      </td>

      <td>
        <div className="cell-box">
        <input value={l.Rate} onChange={e => updateLine(i, "Rate", e.target.value)} />
        </div>
      </td>

      <td>
        <div className="cell-box">
        <input value={l.DiscountPercent} onChange={e => updateLine(i, "DiscountPercent", e.target.value)} />
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


 <td style={{ width:"90px" }}>
            
            <button
    className="invaction-btn invaction-add"
   onClick={() => setDetailsModal({ open: true, index: i })}
        >
          {l.showDetails ? "Hide" : ""}
             
            
        <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="invaction-icon"
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
    {/*Add Inventory*/}
  </button>
              <button
              className="invaction-btn invaction-modify"
              onClick={() => removeLine(i)}
            >
              X
            </button>
          </td>


      {/*<td>
        <button
          onClick={() => setDetailsModal({ open: true, index: i })}
        >
          {l.showDetails ? "Hide" : "Details"}
        </button>

      </td>*/}
    </tr>

   {detailsModal.open && (
  <div className="modal-overlay">
    <div className="modal-box big-modal">

      <h3>Item Details</h3>

      <div className="details-modal-body">
        {(() => {
          const l = lines[detailsModal.index];
          if (!l) return null;

          return (
            <div className="details-grid">

                {/* Top summary bar */}
                {/*<div className="item-info-bar">
                  <div><strong>Item:</strong> {l.ItemName || "-"}</div>
                  <div><strong>Batch:</strong> {l.BatchNo || "-"}</div>
                </div>*/}

                {/* ROWS START */}
                <div className="detail-row">
                  <label>Sales Price</label>
                  <input type="number" value={l.SalesPrice || ""} 
                         onChange={(e)=>updateLine(detailsModal.index, "SalesPrice", e.target.value)} />
                </div>

                <div className="detail-row">
                  <label>MRP</label>
                  <input type="number" value={l.Mrp || ""} 
                         onChange={(e)=>updateLine(detailsModal.index, "Mrp", e.target.value)} />
                </div>

                <div className="detail-row">
                  <label>Description</label>
                  <input type="text" value={l.Description || ""} 
                         onChange={(e)=>updateLine(detailsModal.index, "Description", e.target.value)} />
                </div>

                <div className="detail-row">
                  <label>MFG Date</label>
                  <input type="date" value={l.MfgDate ? l.MfgDate.slice(0,10) : ""} 
                         onChange={(e)=>updateLine(detailsModal.index, "MfgDate", e.target.value)} />
                </div>

                <div className="detail-row">
                  <label>EXP Date</label>
                  <input type="date" value={l.ExpDate ? l.ExpDate.slice(0,10) : ""} 
                         onChange={(e)=>updateLine(detailsModal.index, "ExpDate", e.target.value)} />
                </div>

                <div className="detail-row">
                  <label>Model No</label>
                  <input type="text" value={l.ModelNo || ""} 
                         onChange={(e)=>updateLine(detailsModal.index, "ModelNo", e.target.value)} />
                </div>

                <div className="detail-row">
                  <label>Brand</label>
                  <input type="text" value={l.Brand || ""} 
                         onChange={(e)=>updateLine(detailsModal.index, "Brand", e.target.value)} />
                </div>

                <div className="detail-row">
                  <label>Size</label>
                  <input type="text" value={l.Size || ""} 
                         onChange={(e)=>updateLine(detailsModal.index, "Size", e.target.value)} />
                </div>

                <div className="detail-row">
                  <label>Color</label>
                  <input type="text" value={l.Color || ""} 
                         onChange={(e)=>updateLine(detailsModal.index, "Color", e.target.value)} />
                </div>

                <div className="detail-row">
                  <label>Weight</label>
                  <input type="number" value={l.Weight || ""} 
                         onChange={(e)=>updateLine(detailsModal.index, "Weight", e.target.value)} />
                </div>

                <div className="detail-row">
                  <label>Dimension</label>
                  <input type="text" value={l.Dimension || ""} 
                         onChange={(e)=>updateLine(detailsModal.index, "Dimension", e.target.value)} />
                </div>

            </div>
          );
        })()}
      </div>

     <div className="modal-actions">

  <button
    className="btn-submit"
    onClick={() => {
      setLines(prev => [...prev]);   // force rerender
      setDetailsModal({ open: false, index: null });
    }}
  >
    Save & Proceed
  </button>

  <button
    className="btn-cancel"
    onClick={() => setDetailsModal({ open: false, index: null })}
  >
    Close
  </button>

</div>



    </div>
  </div>
)}




  </React.Fragment>
))}

        </tbody>
      </table>

      {/* NOTES */}
      <div className="form-row">
         <div className="form-group" style={{ width: "100%" }}>
    <label>Purchase Invoice Notes</label>
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
  <button className="btn-submit small" onClick={addLine}>Add Item</button>
      <button className="btn-submit" onClick={saveUpdate}>
        Update Invoice
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
