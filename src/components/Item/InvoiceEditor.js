// InvoiceEditor.js (simplified)
import React, { useState, useEffect, useRef  } from "react";
import "./Invoice.css";
import "./ItemForms.css";
import validateInvoiceForm from "../../utils/validateInvoiceForm";
import { getCreatedBy } from "../../utils/authHelper";


import { validateString, validateDecimal, validatePositiveDecimal, validateInteger,validateDropdown,isValidInvoiceDate} from "../../utils/validators";


const blankLine = () => ({
  ItemId: 0,
  ItemName: "",
  HsnCode: "",
  BatchNo: "",
  Qty: 1,
  Unit: "pcs",
  Rate: 0,
  Discount: 0,
  NetRate: 0,        // ✅ NEW
  NetAmount: 0,      // ✅ NEW
  GstPercent: 0,
  GstValue: 0,

  CgstPercent: 0,
  SgstPercent: 0,
  IgstPercent: 0,

  CgstValue: 0,
  SgstValue: 0,
  IgstValue: 0,

  //Amount: 0,
  TaxAmount: 0,
  Notes:"",
  Balance: null,
  BalanceBatchWise:null,
  RateBatchWise:null,
  PaidAmount:0

});


export default function InvoiceEditor({ user }) {
const [invoiceId, setInvoiceId] = useState(0);
  const [company, setCompany] = useState(null);
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().slice(0,10));
  const [customer, setCustomer] = useState({
  CustomerId: 0,
  CustomerName: "",
  Mobile: "",
  BillingState: "",
  BillingAddress: ""
});

const [customerDraft, setCustomerDraft] = useState({
  CustomerName: "",
  Mobile: ""
});
const [isSaved, setIsSaved] = useState(false);
const [notes, setNotes] = useState("");

const isValidMobile = (val) =>
  /^[6-9]\d{9}$/.test(val.trim());

//const validateCustomerDraft = () => {
 const validateCustomerDraft = () => {

  // ✅ Existing customer selected → OK
  if (customer.CustomerId && customer.CustomerId > 0) {
  if (!customer.BillingState || !customer.BillingState.trim()) {
    //setCustomerErrors({
      //BillingState: "Customer State is required"
    //});
    return false;
  }
  return true;
}

  const name = customerDraft.CustomerName.trim();
  const mobile = customerDraft.Mobile.trim();

  // ❌ Both empty → not allowed
  if (!name && !mobile) {
    setValidationErrors(prev => ({
  ...prev,
  CustomerName: "Enter Customer Name or Mobile"
  
}));
    return false;
  }

  // ❌ State is mandatory
  if (!customer.BillingState || !customer.BillingState.trim()) {
        setValidationErrors(prev => ({
  ...prev,
   BillingState: "Customer State is required"
}));
    return false;
  }

  // ❌ If mobile entered → validate format
  if (mobile && !isValidMobile(mobile)) {
       setValidationErrors(prev => ({
  ...prev,
   Mobile: "Enter valid 10-digit mobile number starting with 6-9"
}));
    return false;
  }

  // ✅ All good
  setValidationErrors(prev => {
  const updated = { ...prev };
  delete updated["CustomerName"];
  delete updated["Mobile"];
  delete updated["BillingState"];
  return updated;
});
  return true;
};
const pdfPathRef = useRef("");
const [validationErrors, setValidationErrors] = useState({});
const [invoiceNum, setInvoiceNum] = useState("");
const [invoiceFY, setInvoiceFY] = useState("");

const [modalMessage, setModalMessage] = useState("");
const [showErrorModal, setShowErrorModal] = useState(false);
const [downloadPath, setDownloadPath] = useState("");
const [pdfPath, setPdfPath] = useState("");
const [showPdfModal, setShowPdfModal] = useState(false);
const [invoiceShowDate, setInvoiceShowDate] = useState(
  new Date().toISOString().slice(0, 10)
);
const [invoiceNumbers, setInvoiceNumbers] = useState([]);
const [selectedInvoiceNo, setSelectedInvoiceNo] = useState("");
const [selectedInvoiceId, setSelectedInvoiceId] = useState("");

const [customerSearch, setCustomerSearch] = useState("");
const [customerList, setCustomerList] = useState([]);
const [showSuggestions, setShowSuggestions] = useState(false);
const [itemList, setItemList] = useState([]);       // will hold ItemForInvoice[]
const [itemSearchIndex, setItemSearchIndex] = useState(null); // which row is showing suggestions

const [paymentMode, setPaymentMode] = useState("Cash");
const [paidVia, setPaidVia] = useState("Cash");
const [itemSearchText, setItemSearchText] = useState({});
const [modal, setModal] = useState({
  show: false,
  message: "",
  type: "info",
  onConfirm: null,
  onClose: null
});
const INDIAN_STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh",
  "Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka",
  "Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram",
  "Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana",
  "Tripura","Uttar Pradesh","Uttarakhand","West Bengal","Delhi","Jammu & Kashmir",
  "Ladakh","Puducherry","Andaman & Nicobar","Chandigarh","Dadra & Nagar Haveli",
  "Daman & Diu","Lakshadweep"
];

const blockInvalidNumberKeys = (e) => {
  const allowed = ["Backspace", "Tab", "ArrowLeft", "ArrowRight", "Delete", "."];
  if (!allowed.includes(e.key) && !/^[0-9]$/.test(e.key)) {
    e.preventDefault();
  }
};





const isInterState = () => {
  const seller = company?.State?.toLowerCase().trim();
  const buyer = customer?.BillingState?.toLowerCase().trim();

  // If buyer has selected a state manually (new customer)
  if (buyer) {
    return seller !== buyer;
  }

  // If buyer state missing → default to intrastate
  return false;
};


  const [lines, setLines] = useState([ blankLine() ]);
  const [invoiceNo, setInvoiceNo] = useState(""); // fetched from server when saving
  const [totals, setTotals] = useState({ subTotal:0, totalTax:0, total:0, roundOff:0 });

const [paidAmount, setPaidAmount] = useState(0);
const balanceAmount = Math.max(0, totals.total - paidAmount);


  function fetchInvoiceNumbers(date) {
    
    window.chrome.webview.postMessage({
        action: "getInvoiceNumbersByDate",
        payload : {
        date: date
        }
    });
  }
  function handlePrint(invoiceNo) {
    window.chrome.webview.postMessage({
        action: "PrintInvoice",
        Payload: {
            InvoiceNo: selectedInvoiceId
        }
    });
}

  {/*function fetchInvoiceDetails(id) {
    window.chrome.webview.postMessage({
        action: "getInvoiceDetails",
        Payload : {
        invoiceId: id
        }
    });
}*/}

useEffect(() => {
  if (!invoiceShowDate) return;

  fetchInvoiceNumbers(invoiceShowDate);
}, [invoiceShowDate]);



useEffect(() => {
  window.chrome.webview.postMessage({ action: "GetNextInvoiceNumberFromCompanyProfile" });
}, []);

useEffect(() => {
  if (window.chrome?.webview) {
    window.chrome.webview.postMessage({ Action: "GetCompanyProfile" });
  }

}, []);



useEffect(() => {
  if (window.chrome?.webview) {
    window.chrome.webview.postMessage({ Action: "GetCustomers" });
  }
}, []);
useEffect(() => {
  if (window.chrome?.webview) {
    // ask backend to send items
    window.chrome.webview.postMessage({ Action: "GetItemsForInvoice" });
  }
}, []);

useEffect(() => {
  if (paymentMode !== "Credit") {
    // CASH / BANK → fully paid
    setPaidAmount(totals.total);
  } else {
    // CREDIT → default unpaid
    setPaidAmount(0);
  }
}, [paymentMode, totals.total]);


  useEffect(() => recalc(), [lines]);

  const recalc = () => {
    let sub = 0, tax = 0;
    lines.forEach(l => {

      const amt = Number(l.NetAmount) || 0;
const t = Number(l.GstValue) || 0;

sub += amt;
tax += t;

    });
    const total = sub + tax;
    const roundOff = Math.round(total) - total;
    setTotals({ subTotal: sub, totalTax: tax, total: total + roundOff, roundOff });
  };

 // helper to recompute one line given seller & buyer states
const recomputeLineForState = (line, sellerState, buyerState) => {
  console.log("📤 states are:", sellerState,buyerState);
  const qty = Number(line.Qty) || 0;
  const rate = Number(line.Rate) || 0;
  const discountPct = Number(line.Discount) || 0;
  const gstPct = Number(line.GstPercent) || 0;


  const base = qty * rate;
const discountAmt = (base * discountPct) / 100;
const netAmount = +(base - discountAmt).toFixed(2);
const netRate = qty > 0 ? +(netAmount / qty).toFixed(2) : 0;




  const gstValue = +(netAmount * gstPct / 100).toFixed(2);

  const seller = (sellerState || "").toString().trim().toLowerCase();
  const buyer = (buyerState || "").toString().trim().toLowerCase();
  const inter = seller && buyer ? (seller !== buyer) : false;

  const updated = { ...line };
  updated.NetRate = netRate;
updated.NetAmount = netAmount;

 updated.LineTotal = +(netAmount + gstValue).toFixed(2);
  updated.GstValue = gstValue;
  updated.TaxAmount = gstValue;
//updated.Amount = netAmount+gstValue; // optional
  if (gstPct > 0) {
    if (inter) {
      // IGST only
      updated.IgstPercent = gstPct;
      updated.IgstValue = gstValue;

      updated.CgstPercent = 0;
      updated.SgstPercent = 0;
      updated.CgstValue = 0;
      updated.SgstValue = 0;
    } else {
      // CGST + SGST
      const halfPct = gstPct / 2;
      const halfVal = +(gstValue / 2).toFixed(2);
      const remainder = +(gstValue - (halfVal * 2)).toFixed(2);

      updated.CgstPercent = halfPct;
      updated.SgstPercent = halfPct;
      updated.IgstPercent = 0;

      updated.CgstValue = +(halfVal + remainder).toFixed(2);
      updated.SgstValue = halfVal;
      updated.IgstValue = 0;
    }
  } else {
    // no GST
    updated.GstValue = 0;
    updated.CgstPercent = 0; updated.SgstPercent = 0; updated.IgstPercent = 0;
    updated.CgstValue = 0;   updated.SgstValue = 0;   updated.IgstValue = 0;
  }

  return updated;
};




  const updateLine = (idx, key, val) => {
    // 🔴 CLEAR ERROR FOR THIS FIELD
setValidationErrors(prev => {
  const updated = { ...prev };
  delete updated[`${key}_${idx}`];
  return updated;
});
  const copy = [...lines];
  copy[idx][key] = val;

  const qty = Number(copy[idx].Qty) || 0;
const rate = Number(copy[idx].Rate) || 0;
const discountPct = Number(copy[idx].Discount) || 0;
const gstPct = Number(copy[idx].GstPercent) || 0;

// 1️⃣ Base
const base = qty * rate;

// 2️⃣ Discount
const discountAmt = (base * discountPct) / 100;

// 3️⃣ Net Amount (after discount, before tax)
const netAmount = +(base - discountAmt).toFixed(2);

// 4️⃣ Net Rate (per unit)
const netRate = qty > 0 ? +(netAmount / qty).toFixed(2) : 0;

// 5️⃣ Save explicitly
copy[idx].NetRate = netRate;
copy[idx].NetAmount = netAmount;

// (optional – backward compatibility)
//copy[idx].Amount = netAmount;


// 6️⃣ GST
const gstValue = +(netAmount * gstPct / 100).toFixed(2);
copy[idx].GstValue = gstValue;
copy[idx].TaxAmount = gstValue;
copy[idx].LineTotal = +(netAmount + gstValue).toFixed(2);

  // 5️⃣ GST Split based on INTERSTATE or INTRASTATE
  if (gstPct > 0) {
    if (isInterState()) {
      // IGST ONLY
      copy[idx].IgstPercent = gstPct;
      copy[idx].IgstValue   = gstValue;

      copy[idx].CgstPercent = 0;
      copy[idx].SgstPercent = 0;
      copy[idx].CgstValue   = 0;
      copy[idx].SgstValue   = 0;

    } else {
      // CGST + SGST
      const halfPct = gstPct / 2;
      const halfVal = +(gstValue / 2).toFixed(2);

      // rounding adjust → add remainder to CGST
      const remainder = +(gstValue - (halfVal * 2)).toFixed(2);

      copy[idx].CgstPercent = halfPct;
      copy[idx].SgstPercent = halfPct;
      copy[idx].IgstPercent = 0;

      copy[idx].CgstValue = +(halfVal + remainder).toFixed(2);
      copy[idx].SgstValue = halfVal;
      copy[idx].IgstValue = 0;
    }
  }

  // 6️⃣ If no GST at all
  else {
    copy[idx].GstValue = 0;

    copy[idx].CgstPercent = 0;
    copy[idx].SgstPercent = 0;
    copy[idx].IgstPercent = 0;

    copy[idx].CgstValue = 0;
    copy[idx].SgstValue = 0;
    copy[idx].IgstValue = 0;
  }
if (copy[idx].AvailableStock != null && Number(val) > Number(copy[idx].AvailableStock)) {
    setValidationErrors(prev => ({
        ...prev,
        [`AvailableStock_${idx}`]: `Line ${idx+1}: Qty exceeds total stock (${copy[idx].AvailableStock})`
    }));
} else {
    setValidationErrors(prev => {
        const p = { ...prev };
        delete p[`AvailableStock_${idx}`];
        return p;
    });
}

if (
    key === "Qty" &&
    copy[idx].BalanceBatchWise != null &&
    Number(copy[idx].Qty) > Number(copy[idx].BalanceBatchWise)
) {
    setValidationErrors(prev => ({
        ...prev,
        [`BatchStock_${idx}`]: `Line ${idx+1}: Qty exceeds batch stock (${copy[idx].BalanceBatchWise})`
    }));
} else {
    setValidationErrors(prev => {
        const p = { ...prev };
        delete p[`BatchStock_${idx}`];
        return p;
    });
}

  setLines(copy);
};




  const addLine = () => setLines(prev => [...prev, blankLine()]);
  const removeLine = (i) => setLines(prev => prev.filter((_,j)=>j!==i));

  const handleSave = async () => {


// 🔴 CUSTOMER VALIDATION BASED ON PAYMENT MODE
//if (paymentMode === "Credit") {
  // CREDIT → customer is mandatory
  // 🔴 CUSTOMER IS MANDATORY FOR ALL PAYMENT MODES
if (!customer.CustomerId) {
  const ok = validateCustomerDraft();
  if (!ok) return;
}

//}
// CASH / BANK → customer optional (no validation)


console.log("📤 Sending invoice save payload:");
if (!paymentMode) {
  setModal({
  show: true,
  message: "Please select payment mode",
  type: "error"
});
return;
}

  const errors = validateInvoiceForm(lines, customer, invoiceDate, totals);



  if (errors.length > 0) {
    // Convert array → object for quick lookup
    const errObj = {};
    errors.forEach(e => {
      errObj[e.field] = e.message;
    });

    setValidationErrors(errObj);

    // Scroll to first invalid field
    const firstField = Object.keys(errObj)[0];
    if (firstField) {
      const el = document.getElementById(firstField);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.focus();
      }
    }

    // Show modal
    //setModalMessage(errors.map(e => e.message).join("\n"));
    //setShowErrorModal(true);

    return;
  }

  // Clear old errors
  setValidationErrors({});
  
  // Fix bug: Customer object
  let Customer = null;

// Existing customer selected
if (customer.CustomerId && customer.CustomerId > 0) {
  Customer = { 
    CustomerId: customer.CustomerId,
    BillingState: customer.BillingState || ""
  };
}
// New customer (typed manually)
else {
  Customer = {
    CustomerId: 0,
    CustomerName: customerDraft.CustomerName.trim(),
    Mobile: customerDraft.Mobile.trim(),
    BillingState: customer.BillingState || company?.State || ""
  };
}




  // Prepare clean line items payload
const Items = lines.map(l => ({
    ItemId: l.ItemId,
    ItemName: l.ItemName,
    BatchNo: l.BatchNo,
    HsnCode: l.HsnCode,
    Qty: Number(l.Qty) || 0,
    Rate: Number(l.Rate) || 0,
    DiscountPercent: Number(l.Discount) || 0,
 NetRate: Number(l.NetRate) || 0,        // ✅
  NetAmount: Number(l.NetAmount) || 0,    // ✅
    GstPercent: Number(l.GstPercent) || 0,
    GstValue: Number(l.GstValue) || 0,

    CgstPercent: Number(l.CgstPercent) || 0,
    CgstValue: Number(l.CgstValue) || 0,

    SgstPercent: Number(l.SgstPercent) || 0,
    SgstValue: Number(l.SgstValue) || 0,

    IgstPercent: Number(l.IgstPercent) || 0,
    IgstValue: Number(l.IgstValue) || 0,

 LineSubTotal: Number(l.NetAmount) || 0,
LineTotal: Number(l.LineTotal) || 0,
Notes: l.Notes || "",

   AvailableStock: Number(l.Balance) || 0,
BalanceBatchWise: Number(l.BalanceBatchWise) || 0,
BalanceBatchRate: Number(l.RateBatchWise) || 0,

}));

console.log(getCreatedBy);
  const payload = {
    Action: "CreateInvoice",
    Payload: {
       InvoiceNum: Number(invoiceNum),
    InvoiceNo: invoiceNo,
      InvoiceDate: invoiceDate,
       Customer: Customer,
      CompanyId: company?.Id ?? 1,
PaymentMode: paymentMode,   // ✅ ADD THIS
PaidAmount: paidAmount,
BalanceAmount: balanceAmount,
      SubTotal: totals.subTotal,
      TotalTax: totals.totalTax,
      TotalAmount: totals.total,
      RoundOff: totals.roundOff,  
      PaidVia: paidVia,
//AvailableStock:selectedItemBalance,
//BalanceBatchWise:selectedBatchBalance,
ItemName:Items.ItemName,
      Items: Items,
      CreatedBy: getCreatedBy(),
      Notes: notes
    }
  };



  if (window.chrome?.webview) {
    window.chrome.webview.postMessage(payload);
  }
  
};

useEffect(() => {
  if (paymentMode !== "Credit") {
    setCustomerDraft({ CustomerName: "", Mobile: "" });
    //setCustomerErrors({});
  }
}, [paymentMode]);


useEffect(() => {
  // if companyProfile does not exist yet, stop
  if (!company) return;

  // if companyProfile.State is still loading or empty, stop
  if (!company.State) return;

  const seller = company.State;
  const buyer  = customer.BillingState || "";

  setLines(prev =>
    prev.map(l => recomputeLineForState(l, seller, buyer))
  );

}, [company, company?.State, customer.BillingState]);

  // listen feedback
  useEffect(() => {
    const handler = (evt) => {
      let msg = evt.data;
      try { if (typeof msg === 'string') msg = JSON.parse(msg); } catch {}
    if (msg.action === "CreateInvoiceResponse") {

  // =========================
  // VALIDATION / ERROR
  // =========================

  if (!msg.success) {

    // 🔴 Backend validation errors
    if (msg.validationErrors) {

      const errorText = Object
        .values(msg.validationErrors)
        .join("\n");

      setModal({
        show: true,
        message: errorText,
        type: "error"
      });

      return;
    }

    // 🔴 System / business errors
    setModal({
      show: true,
      message:
        msg.message || "Save failed",
      type: "error"
    });

    return;
  }

  // =========================
  // SUCCESS
  // =========================

  setModal({
    show: true,

    message:
      `Invoice ${msg.invoiceNo} saved successfully`,

    type: "success",

    onClose: () => {

      setNotes("");

      resetInvoiceForm();

      setIsSaved(true);

      setSelectedInvoiceId("");

      setSelectedInvoiceNo("");

      window.chrome.webview.postMessage({
        Action: "GetCustomers"
      });

      window.chrome.webview.postMessage({
        action: "getInvoiceNumbersByDate",
        payload: {
          date: invoiceShowDate
        }
      });

      window.chrome.webview.postMessage({
        action:
          "GetNextInvoiceNumberFromCompanyProfile"
      });
    }
  });
}
if (msg.action === "GetNextInvoiceNumberFromCompanyProfileResponse") {
     setInvoiceNum(msg.nextNum);
    //setInvoiceFY(msg.fy);
    setInvoiceNo(msg.invoiceNo)
}


      if (msg.action === "GetCustomersResult") {
  setCustomerList(msg.data || []);
}
{/*if (msg.action === "SaveInvoiceResponse") {

  if (!msg.success) {
    setModalMessage(msg.errors.join("\n"));
    setShowErrorModal(true);
    return;
  }

  // SUCCESS
  alert("Invoice saved successfully!");
}*/}


if (msg.action === "PrintInvoiceResponse") {
  if (msg.success) {

    const path = msg.pdfPath;
    const mode = msg.mode || "PREVIEW";   // ✅ SAFE FALLBACK

    if (mode === "PRINT") {

      window.chrome.webview.postMessage({
        Action: "OpenPdfExternal",
        Payload: { Path: path }
      });

    } else {

      const url = "data:application/pdf;base64," + msg.pdfBase64;

      

      setPdfPath(url);
      setDownloadPath(path);
      setShowPdfModal(true);
    }

  } else {
   setModal({
  show: true,
  message: msg.message || "Print failed",
  type: "error"
});
  }
}


if (msg.action === "GetCompanyProfileResponse") {
  setCompany(msg.profile);
}



if (msg.action === "GetItemBalanceResponse") {
  const idx = msg.lineIndex;
  const bal = msg.balance;


  setLines(prev => {
    const copy = [...prev];
    if (copy[idx]) copy[idx].Balance = bal;
    return copy;
  });
}

if (msg.action === "GetItemBalanceBatchWiseResponse") {
  const idx = msg.lineIndex;
  const balbatchwise = msg.balance;

console.log("📥 Batch-wise balance for line", idx, "is", balbatchwise);
  setLines(prev => {
    const copy = [...prev];
    if (copy[idx]) copy[idx].BalanceBatchWise = balbatchwise;
    return copy;
  });
}

if (msg.action === "getPurchaseNetRateResult") {
  const idx = msg.lineIndex;
  const ratebatchwise = msg.netRate;

console.log("📥 Batch-wise Net Purchase Rate for line", idx, "is", ratebatchwise);
  setLines(prev => {
    const copy = [...prev];
    if (copy[idx]) copy[idx].RateBatchWise = ratebatchwise;
    return copy;
  });
}
 

if (msg?.Type === "GetItemsForInvoice") {
      if (msg.Status === "Success") {
        setItemList(msg.Data || []);
      } else {
        console.warn("GetItemsForInvoice failed:", msg.Message);
      }
    }
    if (msg.action === "invoiceNumbersByDateResult") {
        setInvoiceNumbers(msg.data); 
    }

    {/*if (msg.action === "invoiceDetailsResult") {
        // display the invoice
        setSelectedInvoiceNo(msg.data);
    }*/}

    };
    if (window.chrome?.webview) {
      window.chrome.webview.addEventListener("message", handler);
      return () => window.chrome.webview.removeEventListener("message", handler);
    }
  }, []);
 useEffect(() => {
  if (!company?.State) return;

  // Apply only on new invoice
  if (customer.CustomerId === 0 && !customer.BillingState) {
    setCustomer(prev => ({
      ...prev,
      BillingState: company.State
    }));
  }

}, [company, customerList]); // 👈 THIS IS IMPORTANT





const resetInvoiceForm = () => {
  setCustomer({
  CustomerId: 0,
  CustomerName: "",
  Mobile: "",
  BillingState: company?.State || "", // auto default again
  BillingAddress: ""
  });
  setCustomerDraft({
  CustomerName: "",
  Mobile: ""
});

//setCustomerErrors({});
//setIsSaved(false);

  setCustomerSearch("");

  setLines([ blankLine() ]);
  
  setTotals({ subTotal:0, totalTax:0, total:0, roundOff:0 });

  //setInvoiceNo(""); // you have invoiceNo state if needed
};




  return (
    <>
    <div className="invoice-editor">
      <div class="top-sections">
    <div class="print-section">
      
<input 
    type="date"
    value={invoiceShowDate}
    onChange={(e) => {
        setInvoiceShowDate(e.target.value);
        //fetchInvoiceNumbers(e.target.value);
    }}
/>
<select
    value={selectedInvoiceNo}
    onChange={(e) => {
       setSelectedInvoiceNo(e.target.value);
       setSelectedInvoiceId(Number(e.target.value));
        //fetchInvoiceDetails(e.target.value);
    }}
>
    <option value="">Select Invoice No</option>
    {invoiceNumbers.map(inv => (
        <option key={inv.Id} value={inv.Id}>
            {inv.InvoiceNo}
        </option>
    ))}
</select>


      
      <div className="inventory-btns">
<button 
type="button"
    className="btn-submit small"
   onClick={() => {

    
    const idToUse = selectedInvoiceId || invoiceId;

    if (!idToUse) {
      alert("Please save or select invoice first");
      return;
    }

    window.chrome.webview.postMessage({
      Action: "PrintInvoice",
      Payload: { 
        InvoiceId: idToUse,
        Mode: "PREVIEW"
      }
    });
  }}
  >
    View/Print Sales Invoice
  </button>
  </div>


</div>

      {/* ================= CUSTOMER SECTION ================= */}
<div className="customer-section">
  <label>Customer</label>

  <select
  id="CustomerId"
  //disabled={paymentMode !== "Credit"}
  value={customer.CustomerId || ""}
  onChange={(e) => {
  const selectedId = Number(e.target.value);

  // 🔴 CLEAR CUSTOMER VALIDATION ERRORS
  setValidationErrors(prev => {
    const updated = { ...prev };
    delete updated["CustomerName"];
    delete updated["Mobile"];
    delete updated["BillingState"];
    return updated;
  });

  if (!selectedId || selectedId === 0 || isNaN(selectedId)) {
    // New customer entry
    setCustomer({
      CustomerId: "",
      CustomerName: "",
      Mobile: "",
      BillingState: company?.State || "",
      BillingCity: "",
      GSTIN: "",
      Email: "",
      Address: ""
    });
  } else {
    // Existing customer selected
    const selected = customerList.find(c => c.CustomerId === selectedId);
    if (selected) {
      setCustomer({
        CustomerId: selected.CustomerId,
        CustomerName: selected.CustomerName,
        Mobile: selected.Mobile || "",
        BillingState: selected.BillingState || "",
        BillingCity: selected.BillingCity || "",
        GSTIN: selected.GSTIN || "",
        Email: selected.Email || "",
        Address: selected.Address || ""
      });
    }
  }
}}
>
  <option value="">-- Select Customer --</option>
  {customerList.map(c => (
    <option key={c.CustomerId} value={c.CustomerId}>
      {c.CustomerName} ({c.Mobile})
    </option>
  ))}
</select>


  {customer.CustomerId !== 0 && (
    <div className="supplier-details-box">
      <div><b>Name:</b> {customer.CustomerName}</div>
      <div><b>Mobile:</b> {customer.Mobile}</div>
      <div><b>Address:</b> {customer.BillingAddress}</div>
      <div><b>State:</b> {customer.BillingState}</div>
    </div>
  )}
  {customer.CustomerId === 0 && (
  <div className="customer-inline-box">

    <input
      type="text"
      placeholder="Customer Name *"
      value={customerDraft.CustomerName}
      onChange={e => {
  setCustomerDraft(d => ({ ...d, CustomerName: e.target.value }));

  setValidationErrors(prev => {
    const updated = { ...prev };
    delete updated["CustomerName"];
    return updated;
  });
}}
    />
   

    <input
      type="text"
      placeholder="Mobile"
      value={customerDraft.Mobile}
      onChange={e =>
        setCustomerDraft(d => ({ ...d, Mobile: e.target.value }))
      }
    />
    
<select
  value={customer.BillingState}
  onChange={(e) =>
    setCustomer(prev => ({
      ...prev,
      BillingState: e.target.value
    }))
  }
>
  <option value="">Select State *</option>
  {INDIAN_STATES.map(state => (
    <option key={state} value={state}>
      {state}
    </option>
  ))}
</select>


  </div>
)}


</div>

</div>


      <div className="form-row">
        <div className="form-group">

        <div className="invoice-date-row">
  <div className="invoice-date-section">
    <label>Sales Date</label>
    <input 
  type="date" 
  value={invoiceDate} 
  onChange={(e) => {
    setInvoiceDate(e.target.value);

    // 🔴 CLEAR DATE ERROR
    setValidationErrors(prev => {
      const updated = { ...prev };
      delete updated["InvoiceDate"];
      return updated;
    });
  }} 
/>
    <div className="form-group">
  <label>Payment Mode</label>
  <select
    value={paymentMode}
    onChange={(e) => setPaymentMode(e.target.value)}
  >
    <option value="Cash">Cash</option>
    <option value="Bank">Bank</option>
    <option value="Credit">Credit</option>
  </select>
</div>

  </div>

<div className="form-group">
  <label className="invoice-no-label">Invoice No</label>
  <input 
    type="text"
    value={invoiceNo}
    readOnly
    style={{ background: "#f1ecff", width:"200px" }}
  />
</div>

 
<div className="form-group">
  <label className="invoice-no-label">Paid Amount</label>
<input
className={paymentMode !== "Credit" ? "input-disabled" : ""}
  type="number"
  min="0"
  max={totals.total}
  value={paidAmount}
  disabled={paymentMode !== "Credit"}
  onChange={(e) => {
    const v = Number(e.target.value) || 0;
    setPaidAmount(Math.min(v, totals.total));
  }}
/>
</div>

{paymentMode === "Credit" && paidAmount > 0 && (
  <div className="form-group">
    <label>Paid Via</label>
    <select
      value={paidVia}
      onChange={e => setPaidVia(e.target.value)}
    >
      <option value="Cash">Cash</option>
      <option value="Bank">Bank</option>
    </select>
  </div>
)}



<div className="form-group">
  <label className="invoice-no-label">Balance amount</label>
<input
  type="number"
  value={balanceAmount.toFixed(2)}
  readOnly
/>
</div>

</div>


      </div>
      </div>
{/* 🔴 INLINE VALIDATION */}
{Object.keys(validationErrors).length > 0 && (
  <div className="validation-box">
    {Object.values(validationErrors).map((msg, i) => (
      <div key={i} className="error-text">
        • {msg}
      </div>
    ))}
  </div>
)}
      <table className="data-table">
       <thead>
  <tr>
    <th>Item</th>
    <th>Batch</th>
    <th>HSN</th>
    <th>Qty</th>
    <th>Sales Price</th>
    <th>Disc %</th>
<th>Net Rate</th>
      <th>Net Amount</th>

   {/*} <th>GST %</th>
    <th>GST Amt</th>

    <th>CGST %</th>
    <th>CGST Amt</th>

    <th>SGST %</th>
    <th>SGST Amt</th>

    <th>IGST %</th>
    <th>IGST Amt</th>

    <th>Total</th>*/}
    <th></th>
  </tr>
</thead>


        <tbody>
          {lines.map((l,i)=>(
            
            <React.Fragment key={i}>
            <tr key={i}>

              <td style={{ width: "500px", position: "relative" }}>

  <div className="cell-box">
    <input
      id={`ItemName_${i}`}
      value={l.ItemName || ""}
      onChange={(e) => {
        updateLine(i, "ItemName", e.target.value);
        setItemSearchIndex(i);
      }}
      onFocus={() => {
        setItemSearchIndex(i);
      }}
      onBlur={() =>
        setTimeout(() => setItemSearchIndex(null), 150)
      }
      placeholder="Search item by name or code"
    />
  </div>
  
  {itemSearchIndex === i && (


    <div
      className="suggestions-box"
      style={{ width: "520px" }}
    >

    {console.log("ITEM LIST LENGTH", itemList.length)}
      {(l.ItemName?.trim()
        ? itemList.filter(it => {

            const search = l.ItemName
              .trim()
              .toLowerCase();

            return (
              (it.Name || "")
                .toLowerCase()
                .includes(search) ||

              (it.ItemCode || "")
                .toLowerCase()
                .includes(search)
            );
          })
        : itemList
      )
        //.slice(0, 50)
        
        .map(it => (

          <div
            key={`${it.Id}_${it.BatchNo || ""}_${i}`}
            className="suggestion-row"
            onMouseDown={() => {

              updateLine(i, "ItemId", it.Id);
              updateLine(i, "ItemName", it.Name);
              updateLine(i, "HsnCode", it.HsnCode || it.ItemCode || "");
              updateLine(i, "BatchNo", it.BatchNo || "");
              updateLine(i, "GstPercent", Number(it.GstPercent) || 0);
              updateLine(i, "Rate", Number(it.SalesPrice) || 0);
              updateLine(i, "Unit", it.UnitName || "pcs");

              setItemSearchIndex(null);

              window.chrome.webview.postMessage({
                Action: "GetItemBalance",
                Payload: {
                  ItemId: it.Id,
                  LineIndex: i
                }
              });

              window.chrome.webview.postMessage({
                Action: "GetItemBalanceBatchWise",
                Payload: {
                  ItemId: it.Id,
                  BatchNo: it.BatchNo || "",
                  LineIndex: i
                }
              });

              window.chrome.webview.postMessage({
                Action: "getPurchaseNetRate",
                Payload: {
                  ItemId: it.Id,
                  BatchNo: it.BatchNo || "",
                  LineIndex: i
                }
              });

            }}
          >

            <div className="suggestion-line">

              <span className="item-name">
                {it.Name}
              </span>

              {it.BatchNo && (
                <span className="item-batch">
                  Batch No : {it.BatchNo}
                </span>
              )}

              {it.SalesPrice && (
                <span className="item-price">
                  Sales Price : ₹{Number(it.SalesPrice).toFixed(2)}
                </span>
              )}

            </div>

          </div>

        ))}

    </div>

  )}

</td>

              <td> <div className="cell-box" ><input
               id={`BatchNo_${i}`}
  
              value={l.BatchNo} readOnly 
              style={{ width: "100%", background: "#eee" }}
              onChange={e=>updateLine(i,'BatchNo',e.target.value)} /></div></td>
              <td> <div className="cell-box"><input value={l.HsnCode} readOnly
              style={{ width: "100%", background: "#eee" }}
              onChange={e=>updateLine(i,'HSNCode',e.target.value)} /></div></td>
              <td>
  <div className="cell-box">
    <input
    id={`Qty_${i}`}
  
  onKeyDown={(e) => blockInvalidNumberKeys(e)}
      value={l.Qty}
      onChange={e => updateLine(i, "Qty", e.target.value)}
    />

    
  </div>
</td>

              <td> <div className="cell-box"><input
              id={`Rate_${i}`}
  
  onKeyDown={(e) => blockInvalidNumberKeys(e)}
              value={l.Rate} onChange={e=>updateLine(i,'Rate',e.target.value)} /></div></td>
              {/* DISCOUNT */}
<td>
  <div className="cell-box">
    <input
    id={`Discount_${i}`}
  
  onKeyDown={(e) => blockInvalidNumberKeys(e)}
      value={l.Discount}
      onChange={(e) => updateLine(i, "Discount", e.target.value)}
      placeholder="Disc"
    />
  </div>
</td>

 <td style={{ width:"100px" }}>
  <div className="cell-box">
    <input
      value={l.NetRate ?? ""}
      readOnly
      style={{ background: "#eee" }}
    />
  </div>
</td>


          <td style={{ width:"100px" }}>
  <div className="cell-box" style={{ background:"#eee" }}>
    {Number(l.NetAmount).toFixed(2)}
  </div>
</td>


              {/*<td> <div className="cell-box"><input
               id={`GstPercent_${i}`}
  className={validationErrors[`GstPercent_${i}`] ? "inv-error" : ""}
    value={l.GstPercent}
    onChange={(e) => updateLine(i, "GstPercent", e.target.value)}
     readOnly
    style={{ width: "100%", background: "#eee" }}
    
  /></div></td>
            <td> <div className="cell-box"> <input
    value={Number(l.GstValue || 0).toFixed(2)}
    readOnly
    style={{ width: "100%", background: "#eee" }}
  /></div></td>


              <td> <div className="cell-box">
                <input
    value={l.SgstPercent}
    readOnly
    style={{ width: "100%", background: "#eee" }}
  />
                </div></td>
                <td> <div className="cell-box">
               <input
    value={Number(l.SgstValue || 0).toFixed(2)}
    readOnly
    style={{ width: "100%", background: "#eee" }}
  />
                </div></td>

              <td> <div className="cell-box">
               <input
    value={l.CgstPercent}
    readOnly
    style={{ width: "100%", background: "#eee" }}
  />
                </div></td>
                <td> <div className="cell-box">
              <input
    value={Number(l.CgstValue || 0).toFixed(2)}
    readOnly
    style={{ width: "100%", background: "#eee" }}
  />
                </div></td>
              <td> <div className="cell-box">
                <input
    value={l.IgstPercent}
    readOnly
    style={{ width: "100%", background: "#eee" }}
  />
                
                </div></td>
                <td> <div className="cell-box">
               <input
    value={Number(l.IgstValue || 0).toFixed(2)}
    readOnly
    style={{ width: "100%", background: "#eee" }}
  />
                
                </div></td>

              <td> <div className="cell-box" style={{ width: "100%", background: "#eee" }}>{Number(l.LineTotal||0).toFixed(2)}
                
                </div></td>*/}
              
                 
                  <td>
                  
                     <button
  className="invaction-btn invaction-modify"
 onClick={() => {
    setModal({
  show: true,
  message: "Remove this row?",
  type: "confirm",
  onConfirm: () => removeLine(i)
});
  }}
>X
  

  {/* Modify Inventory */}
</button>
                  </td>

            </tr> 


            <tr className="sub-row">
  <td colSpan="9">

    <div className="sub-row-content">

<div className="item-stock-display">

      <div className="stock-line">
        Total Available Stock:
        <b>{l.Balance ?? 0}</b>
      </div>

      <div className="stock-line">
        Batch Stock:
        <b>{l.BalanceBatchWise ?? 0}</b>
      </div>

      <div className="stock-line">
        Batch Net Rate:
        <b>{l.RateBatchWise ?? 0}</b>
      </div>

    </div>

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
          )     
        )         
          }
          
        </tbody>
      </table>

<div className="form-row">
  <div className="form-group" style={{ width: "100%" }}>
    <label>Sales Invoice Notes</label>
    <textarea
      value={notes}
      onChange={(e) => setNotes(e.target.value)}
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
      
<div className="button-row-wrapper">
     <div className="button-row">
      <div className="inventory-btns">
  <button className="btn-submit small" onClick={addLine}>Add Item</button>
 <button
  disabled={
    paymentMode === "Credit" &&
    !customer.CustomerId &&
    !customerDraft.CustomerName.trim()
  }
  className="btn-submit small"
  onClick={handleSave}
>
  Save Invoice
</button>




  <button 
  className={`btn-submit small ${!isSaved ? "disabled-btn" : ""}`}
  disabled={!isSaved}
 onClick={() => {
  if (!invoiceId) {
    setModal({
  show: true,
  message: "Please save or select invoice first",
  type: "error"
});
return;
  }

  window.chrome.webview.postMessage({
    Action: "PrintInvoice",
    Payload: { InvoiceId: invoiceId,Mode: "PRINT"  }
  });
}}
>
  Print Invoice
</button>
</div>
</div>
</div>

     <div className="invoice-totals">
  <div className="total-row">Subtotal: {totals.subTotal.toFixed(2)}</div>
  <div className="total-row">Total Tax: {totals.totalTax.toFixed(2)}</div>
  <div className="total-row">Round Off: {totals.roundOff.toFixed(2)}</div>
  <div className="total-row total-final">Total: {totals.total.toFixed(2)}</div>
</div>
{showPdfModal && (
  <div className="pdf-modal-overlay">
    <div className="pdf-modal-box">

      <div className="pdf-modal-header">
        <h3>Invoice PDF Preview</h3>

       <p>Saved to: <b>{downloadPath}</b></p>
        <button onClick={() => setShowPdfModal(false)}>X</button>
      </div>

      <iframe
        src={pdfPath}   // Must be file:///...
        style={{ width: "100%", height: "80vh", border: "none" }}
      ></iframe>

      <button
  className="pdf-print-btn"
  onClick={() => window.open(pdfPath, "_blank")}
>
  Print
</button>

    </div>
  </div>
)}
{showErrorModal && (
  <div className="error-modal-overlay">
    <div className="error-modal-box">
      <h3>Validation Errors</h3>

      <pre style={{ whiteSpace: "pre-wrap", color: "#a00" }}>
        {modalMessage}
      </pre>

      <button onClick={() => setShowErrorModal(false)}>
        OK
      </button>
    </div>
  </div>
)}


</div>
{modal.show && (
  <div className="modal-overlay">
    <div className="modal-box">
      <p style={{ whiteSpace: "pre-line" }}>{modal.message}</p>

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