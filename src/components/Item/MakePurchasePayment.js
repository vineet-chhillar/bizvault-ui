// EditPurchaseInvoice.js
import React, { useEffect, useState } from "react";
import "./Invoice.css";
import "./ItemForms.css";
import { getCreatedBy } from "../../utils/authHelper";
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
  const [dragOffset, setDragOffset] = React.useState({ x: 0, y: 0 });
const [isDragging, setIsDragging] = React.useState(false);
const modalRef = React.useRef(null);

const onMouseDown = (e) => {
  const rect = modalRef.current.getBoundingClientRect();
  setDragOffset({
    x: e.clientX - rect.left,
    y: e.clientY - rect.top
  });
  setIsDragging(true);
};
const paymentModeChangedByUser = React.useRef(false);
const [modal, setModal] = useState({
  show: false,
  message: "",
  type: "info",
  onConfirm: null,
  onClose: null
});
const onMouseMove = (e) => {
  if (!isDragging) return;

  modalRef.current.style.left = `${e.clientX - dragOffset.x}px`;
  modalRef.current.style.top = `${e.clientY - dragOffset.y}px`;
};

const onMouseUp = () => {
  setIsDragging(false);
};

React.useEffect(() => {
  window.addEventListener("mousemove", onMouseMove);
  window.addEventListener("mouseup", onMouseUp);

  return () => {
    window.removeEventListener("mousemove", onMouseMove);
    window.removeEventListener("mouseup", onMouseUp);
  };
}, [isDragging, dragOffset]);

  const [invoiceId, setInvoiceId] = useState("");
  const [invoiceList, setInvoiceList] = useState([]);
const [detailsModal, setDetailsModal] = useState({ open: false, index: null });
const [paymentMode, setPaymentMode] = useState("Credit");
const [paidAmount, setPaidAmount] = useState(0);
const [paidVia, setPaidVia] = useState("Cash"); // NEW

const [showPaymentModal, setShowPaymentModal] = useState(false);

const [paymentForm, setPaymentForm] = useState({
  PaymentDate: new Date().toISOString().slice(0, 10),
  PaymentMode: "Cash",
  Amount: 0,
  Notes: ""
});



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
const [originalPaidAmount, setOriginalPaidAmount] = useState(0);
const [isEditMode, setIsEditMode] = useState(false);
const [balanceAmount, setBalanceAmount] = useState(0);
const [originalPaymentMode, setOriginalPaymentMode] = useState(null);


useEffect(() => {
  if (!isEditMode) return;
  if (!paymentModeChangedByUser.current) return;

  if (paymentMode === "Credit") {
    // 🔥 YOUR REQUIRED BEHAVIOUR
    setPaidAmount(0);
    setBalanceAmount(totals.total);
    setPaidVia("");
  } else {
    // CASH / BANK
    setPaidAmount(totals.total);
    setBalanceAmount(0);
    setPaidVia(paymentMode);
  }

  paymentModeChangedByUser.current = false;
}, [paymentMode, totals.total, isEditMode]);



const hasPayments = originalPaidAmount > 0;
  // ---------- VALIDATION ----------
  
  

useEffect(() => {
  if (!isEditMode) return;

  if (paymentMode === "Credit") {
    setBalanceAmount(Math.max(0, totals.total - paidAmount));
  } else {
    setBalanceAmount(0);
  }
}, [paidAmount, totals.total, paymentMode, isEditMode]);







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

React.useEffect(() => {
  if (showPaymentModal && modalRef.current) {
    const modal = modalRef.current;
    modal.style.left = `${(window.innerWidth - modal.offsetWidth) / 2}px`;
    modal.style.top = `${(window.innerHeight - modal.offsetHeight) / 2}px`;
  }
}, [showPaymentModal]);

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
      setModal({
  show: true,
  message: "Select an invoice first.",
  type: "error"
});
return;
    }

    window.chrome.webview.postMessage({
      Action: "CanMakePurchasePayment",
      Payload: { PurchaseId: invoiceId }
    });
  };

  // ---------- SEND UPDATE REQUEST ----------
  

 

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
     
// --------------- SAVE PAYMENT RESPONSE ---------------
if (msg.action === "SavePurchasePaymentResponse") {
  if (!msg.success) {
  setModal({
    show: true,
    message: msg.message || "Payment save failed",
    type: "error"
  });
  return;
}

setModal({
  show: true,
  message: "Payment added successfully",
  type: "success",
  onClose: () => {
    const amt = Number(msg.amount);

    setPaidAmount(prev => prev + amt);
    setOriginalPaidAmount(prev => prev + amt);
    setBalanceAmount(prev => Math.max(0, prev - amt));

    setShowPaymentModal(false);

    setPaymentForm({
      PaymentDate: new Date().toISOString().slice(0, 10),
      PaymentMode: "Cash",
      Amount: 0,
      Notes: ""
    });
  }
});
}
if (msg.action === "CanMakePurchasePaymentResponse") {
  if (!msg.CanPay) {
    setModal({
  show: true,
  message: msg.Reason,
  type: "error"
});
return;
    return;
  }

  window.chrome.webview.postMessage({
    Action: "LoadPurchaseInvoice",
    Payload: { PurchaseId: invoiceId }
  });
}

      // --------------- LOAD INVOICE ---------------
      if (msg.action === "LoadPurchaseInvoiceResponse") {
        const data = msg.data;
        if (!data) {
          setModal({
  show: true,
  message: "Invoice not found.",
  type: "error"
});
return;
        }
setPaymentMode(data.PaymentMode || "Credit");
// 🔒 ORIGINAL VALUES (DO NOT TOUCH AFTER THIS)
  setOriginalPaymentMode(data.PaymentMode || "Credit");
const paid = Number(data.PaidAmount) || 0;
const total = Number(data.TotalAmount) || totals.total;

setPaidAmount(paid);
setOriginalPaidAmount(paid);
// 🔥 set balance immediately
setBalanceAmount(
  (data.PaymentMode === "Credit")
    ? Math.max(0, total - paid)
    : 0
);
setIsEditMode(true);
setPaidVia(data.PaidVia || "");

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
  setModal({
    show: true,
    message: "Invoice updated successfully",
    type: "success",
    onClose: () => {
      setShowPaymentModal(false);

      setPaymentForm({
        PaymentDate: new Date().toISOString().slice(0, 10),
        PaymentMode: "Cash",
        Amount: 0,
        Notes: ""
      });

      setInvoiceNo("");
      setPurchaseDate("");
      setLines([blankLine()]);
      setNotes("");
      setPaidAmount(0);
    }
  });
} else {
  setModal({
    show: true,
    message: msg.message || "Update failed",
    type: "error"
  });
}
      }
    };

    window.chrome.webview.addEventListener("message", handler);
    return () => window.chrome.webview.removeEventListener("message", handler);
  }, [invoiceId, supplierId, lines]);

  // ---------- UI ----------
  return (
    <>
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
  onChange={e => {
    paymentModeChangedByUser.current = true;
    setPaymentMode(e.target.value);
  }}
>

      <option value="Cash">Cash</option>
      <option value="Bank">Bank</option>
      <option value="Credit">Credit</option>
    </select>
  </div>
<div className="form-group">
    <label>Paid Amount</label>
   <input
  type="number"
  value={paidAmount}
  readOnly
/>



    {/*<input
      type="number"
      min="0"
      max={totals.total}
      value={paidAmount}
      readOnly={paymentMode === "Credit" && isEditMode}
      disabled={paymentMode !== "Credit"}
      onChange={e => {
        const v = Number(e.target.value) || 0;
        setPaidAmount(Math.min(v, totals.total));
      }}
    />*/}
  </div>

  <div className="form-group">
    <label>Balance Amount</label>
    <input
      type="number"
      readOnly
      value={Number(balanceAmount).toFixed(2)}
    />
  </div>

<div className="form-group">

{isEditMode &&
 originalPaymentMode === "Credit" &&
 balanceAmount > 0 && (
  <button
    className="btn-submit"
    onClick={() => setShowPaymentModal(true)}
  >
    ➕ Add Payment
  </button>
)}



</div>


      </div>

      {/* ITEM TABLE */}
      <table className="data-table" style={{ tableLayout: "fixed" }}>
        <thead>
          <tr>
            <th style={{ width: "200px" }}>Item</th>
            <th style={{ width: "130px" }}>Batch</th>
            <th style={{ width: "100px" }}>HSN</th>
            <th style={{ width: "70px" }}>Qty</th>
            <th style={{ width: "90px" }}>Rate</th>
            <th style={{ width: "70px" }}>Disc%</th>
            <th style={{ width: "90px" }}>Net Rate</th>
            <th style={{ width: "100px" }}>Net Amt</th>

            {/*<th style={{ width: "70px" }}>GST%</th>
            <th style={{ width: "90px" }}>GST Amt</th>
              <th style={{ width: "70px" }}>CGST%</th>
            <th style={{ width: "90px" }}>CGST Amt</th>
             <th style={{ width: "70px" }}>SGST%</th>
            <th style={{ width: "90px" }}>SGST Amt</th>
             <th style={{ width: "70px" }}>IGST%</th>
            <th style={{ width: "90px" }}>IGST Amt</th>
            <th style={{ width: "100px" }}>Total</th>*/}
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
          onChange={e => updateLine(i, "ItemName", e.target.value)} readOnly 
        />
        </div>
      </td>
      <td><div className="cell-box"><input value={l.BatchNo} readOnly /></div></td>
      <td><div className="cell-box"><input value={l.HsnCode} readOnly /></div></td>

      <td>
        <div className="cell-box">
        <input value={l.Qty} onChange={e => updateLine(i, "Qty", e.target.value)} readOnly />
      </div>
      </td>

      <td>
        <div className="cell-box">
        <input value={l.Rate} onChange={e => updateLine(i, "Rate", e.target.value)} readOnly/>
        </div>
      </td>

      <td>
        <div className="cell-box">
        <input value={l.DiscountPercent} onChange={e => updateLine(i, "DiscountPercent", e.target.value)} readOnly />
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
      
      {/*<td>    
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
        </td>*/}


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
<tr className="sub-row">
  <td colSpan="9">

    <div className="sub-row-content">

      <div className="tax-item">
        <span className="label">GST</span>
        <span className="value">{l.GstPercent}%</span>
      </div>

      <div className="tax-item">
        <span className="label">GST Amt</span>
        <span className="value">{Number(l.GstValue).toFixed(2)}</span>
      </div>

      <div className="tax-item">
        <span className="label">CGST</span>
        <span className="value">
          {l.CgstPercent}% ({Number(l.CgstValue).toFixed(2)})
        </span>
      </div>

      <div className="tax-item">
        <span className="label">SGST</span>
        <span className="value">
          {l.SgstPercent}% ({Number(l.SgstValue).toFixed(2)})
        </span>
      </div>

      <div className="tax-item">
        <span className="label">IGST</span>
        <span className="value">
          {l.IgstPercent}% ({Number(l.IgstValue).toFixed(2)})
        </span>
      </div>

      <div className="tax-item total">
        <span className="label">Total</span>
        <span className="value">
          ₹{Number(l.LineTotal).toFixed(2)}
        </span>
      </div>

    </div>

  </td>
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
      

      {/* CONFIRM MODAL */}
      
{showPaymentModal && (
  <div className="modal-overlay">
    <div className="modal-card draggable" ref={modalRef}>

      {/* HEADER (DRAG HANDLE) */}
      <div
        className="modal-header draggable-header"
        onMouseDown={onMouseDown}
      >
        <h3>Add Purchase Payment</h3>
        <button
          className="modal-close"
          onClick={() => setShowPaymentModal(false)}
        >
          ✕
        </button>
      </div>

      {/* BODY */}
      <div className="modal-body">

        <div className="form-grid">

          <div className="form-group">
            <label>Payment Date</label>
            <input
              type="date"
              value={paymentForm.PaymentDate}
              onChange={e =>
                setPaymentForm(p => ({ ...p, PaymentDate: e.target.value }))
              }
            />
          </div>

          <div className="form-group">
            <label>Payment Mode</label>
            <select
              value={paymentForm.PaymentMode}
              onChange={e =>
                setPaymentForm(p => ({ ...p, PaymentMode: e.target.value }))
              }
            >
              <option value="Cash">Cash</option>
              <option value="Bank">Bank</option>
              
            </select>
          </div>

          <div className="form-group full">
            <label>Amount</label>
            <input
              type="number"
              min="1"
              max={balanceAmount}
              value={paymentForm.Amount}
              onChange={e => {
                const v = Number(e.target.value) || 0;
                setPaymentForm(p => ({
                  ...p,
                  Amount: Math.min(v, balanceAmount)
                }));
              }}
            />
            <small className="hint">
              Balance Available: ₹ {balanceAmount.toFixed(2)}
            </small>
          </div>

          <div className="form-group full">
            <label>Notes (optional)</label>
            <textarea
              rows={2}
              placeholder="Reference / remarks"
              value={paymentForm.Notes}
              onChange={e =>
                setPaymentForm(p => ({ ...p, Notes: e.target.value }))
              }
            />
          </div>

        </div>
      </div>

      {/* FOOTER */}
      <div className="modal-footer">
        <button
          className="btn-outline"
          onClick={() => setShowPaymentModal(false)}
        >
          Cancel
        </button>

        <button
          className="btn-primary"
          onClick={() => {
            if (paymentForm.Amount <= 0) {
  setModal({
    show: true,
    message: "Enter valid payment amount.",
    type: "error"
  });
  return;
}

if (paymentForm.Amount > balanceAmount) {
  setModal({
    show: true,
    message: "Payment exceeds balance.",
    type: "error"
  });
  return;
}
            window.chrome.webview.postMessage({
              Action: "SavePurchasePayment",
              Payload: {
                PurchaseId: invoiceId,
                PaymentDate: paymentForm.PaymentDate,
                Amount: paymentForm.Amount,
                PaymentMode: paymentForm.PaymentMode,
                Notes: paymentForm.Notes,
                CreatedBy: getCreatedBy(),
                SupplierAccountId: supplierId
              }
            });
          }}
        >
          Save Payment
        </button>
      </div>

    </div>
  </div>
)}


    </div>
    {modal.show && (
  <div className="modal-overlay">
    <div className="modal-box">
      <p>{modal.message}</p>

      <div className="modal-actions">
        {modal.type === "confirm" ? (
          <>
            <button
              className="modal-btn confirm"
              onClick={() => {
                modal.onConfirm?.();
                setModal({ show: false });
              }}
            >
              Yes
            </button>

            <button
              className="modal-btn cancel"
              onClick={() => setModal({ show: false })}
            >
              No
            </button>
          </>
        ) : (
          <button
            className="modal-btn ok"
            onClick={() => {
              modal.onClose?.();
              setModal({ show: false });
            }}
          >
            OK
          </button>
        )}
      </div>
    </div>
  </div>
)}
    </>
  );
}
