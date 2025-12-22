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
  AvailableQty: 0,
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

  // --------------------------------------------------
  // UPDATE LINE
  // --------------------------------------------------
 const updateLine = (index, field, value) => {
  setLines(prev => {
    
    const copy = [...prev];
    copy[index] = { ...copy[index], [field]: value };

    const sellerState = company?.State || "";
    const buyerState = getBuyerState(selectedCustomer);

//console.log("seller state is:", sellerState);
//console.log("buyer state is:",buyerState);

    copy[index] = recomputeLineForState(
      copy[index],
      sellerState,
      buyerState
    );

    return copy;
  });
};
const removeLine = (i) => {
  setLines(prev => {
    if (prev.length === 1) {
      alert("At least one item is required in the invoice.");
      return prev; // do NOT delete
    }

    return prev.filter((_, j) => j !== i);
  });
};

  // --------------------------------------------------
  // LOAD INVOICE
  // --------------------------------------------------
  const loadInvoice = () => {
  if (invoiceId == null) {
    alert("Select an invoice first.");
    return;
  }

  const id = invoiceId; // 🔒 freeze value

  window.chrome.webview.postMessage({
    Action: "CanEditSalesInvoice",
    Payload: { InvoiceId: id }
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

  setCustomerInfo(c);
  setSelectedCustomer(c);   // 🔥 REQUIRED


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
if (msg.action === "CanEditSalesInvoiceResponse") {
  if (!msg.Editable) {
    alert("This sales invoice cannot be edited because a sales return exists.");
    setEditLocked(true);
    return;
  }
 
  setEditLocked(false);

  const id = selectedInvoiceIdRef.current;

  if (!id) {
    console.error("❌ InvoiceId lost before LoadSalesInvoice");
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
    alert("Invoice not found.");
    return;
  }

  setIsEditMode(true);

  setInvoiceNo(d.InvoiceNo);
  setInvoiceNum(d.InvoiceNum);
  setInvoiceDate(d.InvoiceDate);

  setCustomerId(d.CustomerId);

  setPaymentMode(d.PaymentMode);
  setPaidVia(d.PaidVia || "CASH");
  setPaidAmount(Number(d.PaidAmount) || 0);
  setOriginalPaidAmount(Number(d.PaidAmount) || 0);

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
const totalAvailableQty = lines.reduce(
  (sum, l) => sum + (Number(l.Qty || 0) - Number(l.ReturnedQty || 0)),
  0
);

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
        

        
        <div className="form-group">
          <label>Available Qty</label>
         <input  readOnly value={totalAvailableQty} />
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
    value={paidAmount}
    disabled={paymentMode !== "CREDIT"}   // ✅ editable ONLY for CREDIT
    onChange={e => {
      const val = Number(e.target.value) || 0;

      // optional safety
      if (val > totals.total) return;

      setPaidAmount(val);                // ✅ user-controlled only
    }}
    className={paymentMode !== "CREDIT" ? "input-disabled" : ""}
  />
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
            <tr key={i}>
              <td>
                
                <div className="cell-box">
        <input value={l.ItemName} onChange={e => updateLine(i, "ItemName", e.target.value)}
        />
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
  onChange={e => updateLine(i, "Qty", e.target.value)}
/>

                </div>
                

              </td>
              
              <td><div className="cell-box"><input  value={l.Rate}  onChange={e => updateLine(i, "Rate", e.target.value)}/></div></td>
              <td><div className="cell-box"><input  value={l.DiscountPercent}  onChange={e => updateLine(i, "DiscountPercent", e.target.value)}/></div></td>

              <td><div className="cell-box"><input value={l.NetRate} readOnly /> </div></td>
              <td><div className="cell-box">{l.LineSubTotal.toFixed(2)}</div></td>
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
      


              <td><div className="cell-box">{l.LineTotal.toFixed(2)}</div></td>
              <td><button
              className="invaction-btn invaction-modify"
              onClick={() => removeLine(i)}
            >
              X
            </button>
             </td>
              
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
