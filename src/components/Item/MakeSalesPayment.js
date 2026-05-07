// EditSalesInvoice.js
import React, { useEffect, useState } from "react";
import "./Invoice.css";
import "./ItemForms.css";
import { getCreatedBy } from "../../utils/authHelper";
const blankLine = () => ({
  InvoiceItemId: 0,
  ItemId: 0,
  ItemName: "",
  HsnCode: "",
  BatchNo: "",
  Qty: 0,
   TotalStock: 0,       // ✅ NEW
  BatchStock: 0,       // ✅ NEW
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
  LineTotal: 0,
  Notes: ""
});

export default function EditSalesInvoice({ user }) {

  // --------------------------------------------------
  // HEADER STATE
  // --------------------------------------------------
  const selectedInvoiceIdRef = React.useRef(null);

  const [invoiceId, setInvoiceId] = useState(null);
  const [invoiceList, setInvoiceList] = useState([]);
  const [filterDate, setFilterDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
const [company, setCompany] = useState(null);
const [selectedCustomer, setSelectedCustomer] = useState(null);
const [customerList, setCustomerList] = useState([]);
const [customerInfo, setCustomerInfo] = useState(null);
const [editLocked, setEditLocked] = useState(false); // for sales return lock

const paymentModeChangedByUser = React.useRef(false);
const [originalPaymentMode, setOriginalPaymentMode] = useState(null);
const [modal, setModal] = useState({
  show: false,
  message: "",
  type: "info",
  onConfirm: null,
  onClose: null
});

  const [invoiceNo, setInvoiceNo] = useState("");
  const [invoiceNum, setInvoiceNum] = useState("");
  const [invoiceDate, setInvoiceDate] = useState("");

  const [customerName, setCustomerName] = useState("");
  const [customerId, setCustomerId] = useState(null);

  const [paymentMode, setPaymentMode] = useState("Credit");
  const [paidAmount, setPaidAmount] = useState(0);
  const [originalPaidAmount, setOriginalPaidAmount] = useState(0);
  const [paidVia, setPaidVia] = useState("Cash");

  const [isEditMode, setIsEditMode] = useState(false);
  
  const [showPaymentModal, setShowPaymentModal] = useState(false);
const [selectedItemBalance, setSelectedItemBalance] = useState(null);
const [notes, setNotes] = useState("");

  const [paymentForm, setPaymentForm] = useState({
    PaymentDate: new Date().toISOString().slice(0, 10),
    PaymentMode: "Cash",
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
    paymentMode === "Credit"
      ? Math.max(0, totals.total - paidAmount)
      : 0;
function getBuyerState(customer) {
  return (
    customer?.BillingState ||
    customer?.CustomerState ||
    customer?.State ||
    ""
  );
}


function recomputeLineForState(line, sellerState, buyerState) {
  const qty = Number(line.Qty) || 0;
  const rate = Number(line.Rate) || 0;
  const discount = Number(line.DiscountPercent) || 0;
  const gst = Number(line.GstPercent) || 0;

  const gross = qty * rate;
  const discountAmt = (gross * discount) / 100;
  const taxable = gross - discountAmt;

  let cgst = 0, sgst = 0, igst = 0;
  let cgstVal = 0, sgstVal = 0, igstVal = 0;

  // ✅ ONLY decide GST type when BOTH states are known
  if (sellerState && buyerState) {
    if (sellerState === buyerState) {
      cgst = gst / 2;
      sgst = gst / 2;

      cgstVal = (taxable * cgst) / 100;
      sgstVal = (taxable * sgst) / 100;
    } else {
      igst = gst;
      igstVal = (taxable * igst) / 100;
    }
  }

  const tax = cgstVal + sgstVal + igstVal;

  return {
    ...line,

    NetRate: qty > 0 ? taxable / qty : 0,
    LineSubTotal: taxable,

    CgstPercent: cgst,
    SgstPercent: sgst,
    IgstPercent: igst,

    CgstValue: cgstVal,
    SgstValue: sgstVal,
    IgstValue: igstVal,

    GstValue: tax,
    LineTotal: taxable + tax
  };
}

const sellerState = company?.State || "";

const handleCustomerChange = (customerId) => {
  if (!customerId) {
    setCustomerId(null);
    setCustomerInfo(null);
    return;
  }

  setCustomerId(customerId);

  window.chrome.webview.postMessage({
    Action: "GetCustomerById",
    Payload: { CustomerId: customerId }
  });
  
};
useEffect(() => {
  if (!isEditMode) return;
  if (!paymentModeChangedByUser.current) return;

  if (paymentMode === "Credit") {
    // 🔥 switching TO credit
    if (originalPaymentMode === "Credit") {
      // was already credit → keep original paid
      setPaidAmount(originalPaidAmount || 0);
    } else {
      // was CASH/BANK → reset to 0
      setPaidAmount(0);
    }
  } else {
    // 🔥 switching TO CASH/BANK
    setPaidAmount(totals.total);
  }

  paymentModeChangedByUser.current = false;
}, [
  paymentMode,
  isEditMode,
  originalPaidAmount,
  originalPaymentMode,
  totals.total
]);



useEffect(() => {
  console.log("showPaymentModal =", showPaymentModal);
}, [showPaymentModal]);


useEffect(() => {
 window.chrome?.webview?.postMessage({ Action: "GetCompanyProfile" });
 },[]);


useEffect(() => {
  window.chrome.webview.postMessage({
    Action: "GetCustomers"
  });
}, []);

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
// 🔥 AUTO SYNC PAID AMOUNT WHEN TOTAL CHANGES
// 🔥 AUTO SYNC PAID ONLY WHEN TOTAL CHANGES (NOT MODE CHANGE)
useEffect(() => {
  if (!isEditMode) return;

  if (paymentMode !== "Credit") {
    setPaidAmount(totals.total);
  }
}, [totals.total]); // ❌ removed paymentMode

  // --------------------------------------------------
  // UPDATE LINE
  // --------------------------------------------------
 



  // --------------------------------------------------
  // LOAD INVOICE
  // --------------------------------------------------
  const loadInvoice = () => {
  if (invoiceId == null) {
    setModal({
  show: true,
  message: "Select an invoice first.",
  type: "error"
});
return;
  }

  const id = invoiceId; // 🔒 freeze value

  window.chrome.webview.postMessage({
    Action: "CanMakeSalesPayment",
    Payload: { InvoiceId: id }
  });
};




  // --------------------------------------------------
  // UPDATE INVOICE
  // --------------------------------------------------
 


  // --------------------------------------------------
  // MESSAGE HANDLER
  // --------------------------------------------------
  useEffect(() => {
    const handler = evt => {
      let msg = evt.data;
      try { if (typeof msg === "string") msg = JSON.parse(msg); } catch {}

      if (!msg) return;
// ---------- CAN EDIT SALES INVOICE ----------

if (msg.action === "GetCompanyProfileResponse") {
        setCompany(msg.profile);
        return;
      }
if (msg.action === "GetCustomersResult") {
  setCustomerList(msg.data || []);
  
}
if (msg.action === "GetCustomerByIdResult") {
  const c = msg.data;
  if (!c) return;


  const normalized = {
    ...c,
    State: c.BillingState || c.CustomerState || c.State
  };

setCustomerInfo(normalized);
setSelectedCustomer(normalized);


  const sellerState = company?.State || "";
  const buyerState = getBuyerState(c);

  setLines(prev =>
    prev.map(l =>
      recomputeLineForState(l, sellerState, buyerState)
    )
  );
}


      if (msg.action === "invoiceNumbersByDateResult") {
        setInvoiceList(msg.data || []);
      }
// ---------- CAN EDIT SALES INVOICE ----------
if (msg.action === "CanMakeSalesPaymentResponse") {

  if (!msg.CanPay) {
    setModal({
  show: true,
  message: msg.Reason,
  type: "error"
});
return;
  }

  const id = selectedInvoiceIdRef.current;

  if (!id) {
    console.error("InvoiceId lost");
    return;
  }

  window.chrome.webview.postMessage({
    Action: "LoadSalesInvoice",
    Payload: { InvoiceId: id }
  });
}




     if (msg.action === "LoadSalesInvoiceResponse") {
  const d = msg.data;
  if (!d) {
    setModal({
  show: true,
  message: "Invoice not found.",
  type: "error"
});
return;
  }


  setIsEditMode(true);

  setInvoiceNo(d.InvoiceNo);
  setInvoiceNum(d.InvoiceNum);
  setNotes(d.Notes || "");
  setInvoiceDate(d.InvoiceDate);

  setCustomerId(d.CustomerId);

  setPaymentMode(d.PaymentMode || "Credit");
  setPaidVia(d.PaidVia || "Cash");
  setPaymentMode(d.PaymentMode || "Credit");
setOriginalPaymentMode(d.PaymentMode || "Credit");

const paid = Number(d.PaidAmount) || 0;
setPaidAmount(paid);
setOriginalPaidAmount(paid);

// VERY IMPORTANT
paymentModeChangedByUser.current = false;

//  setPaidAmount(Number(d.PaidAmount) || 0);
  //setOriginalPaidAmount(Number(d.PaidAmount) || 0);

  // fetch customer info (IMPORTANT)
  window.chrome.webview.postMessage({
    Action: "GetCustomerById",
    Payload: { CustomerId: d.CustomerId }
  });

  const sellerState = company?.State || "";
 const buyerState = getBuyerState({
  BillingState: d.BillingState,
  CustomerState: d.CustomerState
});

  setLines(
  (d.Items || []).map(it => {
    const line = {
      ...blankLine(),
      ...it,
      Qty: Number(it.Qty) || Number(it.AvailableQty) || 0,
AvailableQty: Number(it.AvailableQty) || 0,

      Rate: Number(it.Rate) || 0,
      DiscountPercent: Number(it.DiscountPercent) || 0,
      GstPercent: Number(it.GstPercent) || 0
      
    };

    return recomputeLineForState(line, sellerState, buyerState);
  })
);
(d.Items || []).forEach((it, idx) => {
  if (!it.ItemId) return;

  window.chrome.webview.postMessage({
    Action: "GetItemBalance",
    Payload: { ItemId: it.ItemId, LineIndex: idx }
  });

  window.chrome.webview.postMessage({
    Action: "GetItemBalanceBatchWise",
    Payload: {
      ItemId: it.ItemId,
      BatchNo: it.BatchNo || "",
      LineIndex: idx
    }
  });
});

}

if (msg.action === "GetItemBalanceResponse") {
  const { lineIndex, balance } = msg;

  setLines(prev => {
    const copy = [...prev];
    if (copy[lineIndex]) {
      copy[lineIndex].TotalStock = Number(balance) || 0;
    }
    return copy;
  });
}

if (msg.action === "GetItemBalanceBatchWiseResponse") {
  const { lineIndex, balance } = msg;

  setLines(prev => {
    const copy = [...prev];
    if (copy[lineIndex]) {
      copy[lineIndex].BatchStock = Number(balance) || 0;
    }
    return copy;
  });
}



if (msg.action === "SaveSalesPaymentResponse") {
  if (!msg.success) {
  setModal({
    show: true,
    message: msg.message || "Payment failed",
    type: "error"
  });
  return;
}

setModal({
  show: true,
  message: "Payment added successfully",
  type: "success",
  onClose: () => {
    setPaidAmount(msg.newPaidAmount);
    setOriginalPaidAmount(msg.newPaidAmount);

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



      

    };

    window.chrome.webview.addEventListener("message", handler);
    return () => window.chrome.webview.removeEventListener("message", handler);
  }, []);
  // 🔥 RECOMPUTE GST WHEN COMPANY OR CUSTOMER STATE ARRIVES
useEffect(() => {
  if (!company || !selectedCustomer) return;

  const sellerState = company.State || "";
  const buyerState = getBuyerState(selectedCustomer);

  if (!sellerState || !buyerState) return;

  setLines(prev =>
    prev.map(l => recomputeLineForState(l, sellerState, buyerState))
  );
}, [company, selectedCustomer]);

// --------------------------------------------------
// HEADER CALCULATIONS
// --------------------------------------------------
{/*const totalAvailableQty = lines.reduce(
  (sum, l) => sum + Number(l.AvailableQty || 0),
  0
);*/}


  // --------------------------------------------------
  // UI
  // --------------------------------------------------
  return (
    <>
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
  value={invoiceId ?? ""}
  onChange={e => {
    const v = e.target.value ? Number(e.target.value) : null;
    setInvoiceId(v);
    selectedInvoiceIdRef.current = v; // 🔒 freeze value
  }}
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

        {/* CUSTOMER SECTION */}
<div className="customer-section">
  <label>Customer</label>

  <select
    value={customerId || ""}
    //disabled={isEditMode}   // 🔒 lock after load
    onChange={e => handleCustomerChange(Number(e.target.value))}

  >
    <option value="">Select Customer</option>
    {customerList.map(c => (
      <option key={c.CustomerId} value={c.CustomerId}>
        {c.CustomerName}
      </option>
    ))}
  </select>

  {customerInfo && (
    <div className="supplier-details-box">
      <div><b>Name:</b> {customerInfo.CustomerName}</div>
      <div><b>GSTIN:</b> {customerInfo.GSTIN || "-"}</div>
      <div><b>State:</b> {customerInfo.State}</div>
    </div>
  )}
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
        

      

        {/*<div className="form-group">
          <label>Available Qty</label>
         <input  readOnly value={totalAvailableQty} />
         </div>*/}

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
    disabled={paymentMode !== "Credit"}   // ✅ editable ONLY for CREDIT
    onChange={e => {
      const val = Number(e.target.value) || 0;

      // optional safety
      if (val > totals.total) return;

      setPaidAmount(val);                // ✅ user-controlled only
    }}
    className={paymentMode !== "Credit" ? "input-disabled" : ""}
    readOnly
  />
</div>

        <div className="form-group">
          <label>Balance</label>
          <input readOnly value={balanceAmount.toFixed(2)} />
        </div>

        <div className="form-group">
          {isEditMode &&
  originalPaymentMode === "Credit" &&
  paymentMode === "Credit" &&
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
            <tr key={i}>
              <td>
                
                <div className="cell-box item-cell">
  <input
    className="item-name-input"
    value={l.ItemName}
     readOnly
  />

  {(l.TotalStock > 0 || l.BatchStock > 0) && (
    <div className="stock-meta">
      <span>Total Stock: <b>{l.TotalStock}</b></span>
      {l.BatchNo && (
        <span className="batch-stock">
          Batch Stock: <b>{l.BatchStock}</b>
        </span>
      )}
    </div>
  )}
</div>

                </td>
              <td><div className="cell-box"><input value={l.BatchNo} readOnly /></div></td>
               <td><div className="cell-box"><input value={l.HsnCode} readOnly /></div></td>
              <td>
                <div className="cell-box">
                  <input
  type="number"
  value={l.Qty}
  disabled={l.ReturnedQty > 0}   // lock if return exists
  
/>

                </div>
                

              </td>
              
              <td><div className="cell-box"><input  value={l.Rate}   readOnly/></div></td>
              <td><div className="cell-box"><input  value={l.DiscountPercent}   readOnly/></div></td>

              <td><div className="cell-box"><input value={l.NetRate} readOnly /> </div></td>
              <td><div className="cell-box">{l.LineSubTotal.toFixed(2)} </div></td>
          
          {/*}    <td>
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
      


              <td><div className="cell-box">{l.LineTotal.toFixed(2)}</div></td>*/}


              <td>
             </td>
              
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
        <span className="value">{Number(l.GstValue || 0).toFixed(2)}</span>
      </div>

      <div className="tax-item">
        <span className="label">CGST</span>
        <span className="value">
          {l.CgstPercent}% ({Number(l.CgstValue || 0).toFixed(2)})
        </span>
      </div>

      <div className="tax-item">
        <span className="label">SGST</span>
        <span className="value">
          {l.SgstPercent}% ({Number(l.SgstValue || 0).toFixed(2)})
        </span>
      </div>

      <div className="tax-item">
        <span className="label">IGST</span>
        <span className="value">
          {l.IgstPercent}% ({Number(l.IgstValue || 0).toFixed(2)})
        </span>
      </div>

      <div className="tax-item total">
        <span className="label">Total</span>
        <span className="value">
          ₹{Number(l.LineTotal || 0).toFixed(2)}
        </span>
      </div>

    </div>

  </td>
</tr>
</React.Fragment>
          ))}
        </tbody>
      </table>

{/* NOTES */}
      <div className="form-row">
         <div className="form-group" style={{ width: "100%" }}>
    <label>Sales Invoice Notes</label>
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
        <div>Tax: {totals.tax.toFixed(2)}</div>
        <div>RoundOff: {totals.roundOff.toFixed(2)}</div>
        <div className="total-final">Total: {totals.total.toFixed(2)}</div>
      </div>

      {/* ACTION */}
      

      {/* CONFIRM MODAL */}
      
{showPaymentModal && (
  <div className="modal-overlay">
    <div className="modal-card draggable">

      {/* HEADER (DRAG HANDLE) */}
      <div className="modal-header draggable-header">
        <h3>Add Sales Payment</h3>
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
                setPaymentForm(p => ({
                  ...p,
                  PaymentDate: e.target.value
                }))
              }
            />
          </div>

          <div className="form-group">
            <label>Payment Mode</label>
            <select
              value={paymentForm.PaymentMode}
              onChange={e =>
                setPaymentForm(p => ({
                  ...p,
                  PaymentMode: e.target.value
                }))
              }
            >
              <option value="Cash">Cash</option>
              <option value="Bank">Bank</option>
              
            </select>
          </div>

          <div className="form-group">
            <label>Amount</label>
            <input
              type="number"
              min="1"
              max={balanceAmount}
              value={paymentForm.Amount}
              onChange={e =>
                setPaymentForm(p => ({
                  ...p,
                  Amount: Number(e.target.value) || 0
                }))
              }
            />
            <small className="hint">
              Balance: ₹{balanceAmount.toFixed(2)}
            </small>
          </div>

          <div className="form-group full-width">
            <label>Notes</label>
            <input
              type="text"
              value={paymentForm.Notes}
              onChange={e =>
                setPaymentForm(p => ({
                  ...p,
                  Notes: e.target.value
                }))
              }
              placeholder="Optional remarks"
            />
          </div>

        </div>
      </div>

      {/* FOOTER */}
      <div className="modal-footer">
        <button
          className="btn-cancel"
          onClick={() => setShowPaymentModal(false)}
        >
          Cancel
        </button>

        <button
          className="btn-submit"
          onClick={() => {
           if (paymentForm.Amount <= 0) {
  setModal({
    show: true,
    message: "Enter valid payment amount",
    type: "error"
  });
  return;
}

if (paymentForm.Amount > balanceAmount) {
  setModal({
    show: true,
    message: "Payment exceeds balance amount",
    type: "error"
  });
  return;
}
        

            // reset modal form
            setPaymentForm({
              PaymentDate: new Date().toISOString().slice(0, 10),
              PaymentMode: "Cash",
              Amount: 0,
              Notes: ""
            });

            window.chrome.webview.postMessage(
             {
  Action: "SaveSalesPayment",
  Payload: {
    InvoiceId: invoiceId,
    PaymentDate: paymentForm.PaymentDate,
   Amount: paymentForm.Amount,
      // 🔒 read-only
    PaymentMode: paymentForm.PaymentMode,
    Notes: paymentForm.Notes,
    CustomerAccountId: customerId,
    CreatedBy: getCreatedBy()
  }});
            
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
