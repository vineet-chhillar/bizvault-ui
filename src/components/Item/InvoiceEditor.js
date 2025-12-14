// InvoiceEditor.js (simplified)
import React, { useState, useEffect } from "react";
import "./Invoice.css";
import "./ItemForms.css";
import validateInvoiceForm from "../../utils/validateInvoiceForm";



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
  Balance: null,
  BalanceBatchWise:null
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

const [customerErrors, setCustomerErrors] = useState({});
const isValidMobile = (val) =>
  /^[6-9]\d{9}$/.test(val.trim());

const validateCustomerDraft = () => {
  const errors = {};

  if (!customerDraft.CustomerName.trim()) {
    errors.CustomerName = "Customer name is required";
  }

  if (
    customerDraft.Mobile.trim() &&
    !isValidMobile(customerDraft.Mobile)
  ) {
    errors.Mobile = "Enter valid 10-digit mobile number";
  }

  setCustomerErrors(errors);
  return Object.keys(errors).length === 0;
};

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
const [selectedItemBalance, setSelectedItemBalance] = useState(null);
const [selectedBatchBalance, setSelectedBatchBalance] = useState(null);
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
  window.chrome.webview.postMessage({ Action: "GetNextSalesInvoiceNum" });
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

if (copy[idx].BalanceBatchWise != null && Number(val) > Number(copy[idx].BalanceBatchWise)) {
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
console.log("📤 Sending invoice save payload:");
if (!customer.CustomerId) {
  const ok = validateCustomerDraft();
  if (!ok) return;
}

console.log("📤 Sending invoice save payload:");

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
    setModalMessage(errors.map(e => e.message).join("\n"));
    setShowErrorModal(true);

    return;
  }

  // Clear old errors
  setValidationErrors({});
  
  // Fix bug: Customer object
  const Customer = customer.CustomerId
  ? {
      CustomerId: customer.CustomerId
    }
  : {
      CustomerId: 0,
      CustomerName: customerDraft.CustomerName.trim(),
      Mobile: customerDraft.Mobile.trim(),
      BillingState: company?.State || ""
    };


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


    AvailableStock: Number(selectedItemBalance) || 0,
    BalanceBatchWise: Number(selectedBatchBalance) || 0,

}));


  const payload = {
    Action: "CreateInvoice",
    Payload: {
       InvoiceNum: Number(invoiceNum),
    InvoiceNo: invoiceNo,
      InvoiceDate: invoiceDate,
       Customer: Customer,
      CompanyId: company?.Id ?? 1,

      SubTotal: totals.subTotal,
      TotalTax: totals.totalTax,
      TotalAmount: totals.total,
      RoundOff: totals.roundOff,  
//AvailableStock:selectedItemBalance,
//BalanceBatchWise:selectedBatchBalance,
ItemName:Items.ItemName,
      Items: Items,
      CreatedBy: user?.email
    }
  };



  if (window.chrome?.webview) {
    window.chrome.webview.postMessage(payload);
  }
  setSelectedItemBalance(null);
  setSelectedBatchBalance(null);
};


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
  if (msg.success) {

    // Show nice message
    alert(
      "Invoice Saved Successfully!\n" +
      "Invoice No: " + msg.invoiceNo + "\n"
      
    );setInvoiceId(msg.invoiceId);  // <-- ADD THIS
    resetInvoiceForm();
    // OPTIONAL → reset invoice form after save
    // resetInvoiceForm();
window.chrome.webview.postMessage({ Action: "GetNextSalesInvoiceNum" });
  } else {
    alert("Save failed: " + msg.message);
  }
}
if (msg.action === "GetNextSalesInvoiceNumResponse") {
     setInvoiceNum(msg.nextNum);
    setInvoiceFY(msg.fy);
    setInvoiceNo(msg.invoiceNo)
}


      if (msg.action === "GetCustomersResponse") {
  setCustomerList(msg.customers || []);
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

    // 1) Hide the old alert + OpenPdf call
    // alert("PDF Saved at:\n" + msg.pdfPath);

    // 2) Open PDF modal
  // Convert Windows path -> file:/// URL
      const fileName = msg.pdfPath.split("\\").pop(); // extract 'invoice-INV-24.pdf'
    const url = "https://invoices.local/" + fileName;

    setPdfPath(url);
     setDownloadPath(msg.pdfPath);  // <-- store original Windows path
    setShowPdfModal(true);

  } else {
    alert("Print failed: " + msg.message);
  }
}


if (msg.action === "GetCompanyProfileResponse") {
  setCompany(msg.profile);
}



if (msg.action === "GetItemBalanceResponse") {
  const idx = msg.lineIndex;
  const bal = msg.balance;
setSelectedItemBalance(msg.balance);

  setLines(prev => {
    const copy = [...prev];
    if (copy[idx]) copy[idx].Balance = bal;
    return copy;
  });
}

if (msg.action === "GetItemBalanceBatchWiseResponse") {
  const idx = msg.lineIndex;
  const balbatchwise = msg.balance;
setSelectedBatchBalance(msg.balance);
console.log("📥 Batch-wise balance for line", idx, "is", balbatchwise);
  setLines(prev => {
    const copy = [...prev];
    if (copy[idx]) copy[idx].BalanceBatchWise = balbatchwise;
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


  setCustomerSearch("");

  setLines([ blankLine() ]);
  
  setTotals({ subTotal:0, totalTax:0, total:0, roundOff:0 });

  setInvoiceNo(""); // you have invoiceNo state if needed
};




  return (
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
       setSelectedInvoiceId(e.target.value);
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
      window.chrome.webview.postMessage({
        Action: "PrintInvoice",
        Payload: { InvoiceId: selectedInvoiceId }
      });
    }}
  >
    View/Print Invoice
  </button>
  </div>


</div>

      {/* ================= CUSTOMER SECTION ================= */}
<div className="customer-section">
  <label>Customer</label>

  <select
  id="CustomerId"
  className={!customer.CustomerId ? "inv-error" : ""}
  value={customer.CustomerId || ""}
  onChange={(e) => {
    const selectedId = Number(e.target.value);

    if (!selectedId || selectedId === 0 || isNaN(selectedId)) {
      setCustomer({
        CustomerId: 0,
        CustomerName: "",
        Mobile: "",
        BillingAddress: "",
        BillingState: company?.State || ""
      });
      return;
    }

    const selectedCustomer = customerList.find(c => c.CustomerId === selectedId);

    if (selectedCustomer) {
      setCustomer({
        CustomerId: selectedCustomer.CustomerId,
        CustomerName: selectedCustomer.CustomerName,
        Mobile: selectedCustomer.Mobile,
        BillingAddress: selectedCustomer.BillingAddress,
        BillingState: selectedCustomer.BillingState
      });

      const sellerState = company?.State || "";
      const buyerState = selectedCustomer.BillingState || "";

      setLines(prev =>
        prev.map(l => recomputeLineForState(l, sellerState, buyerState))
      );
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
      onChange={e =>
        setCustomerDraft(d => ({ ...d, CustomerName: e.target.value }))
      }
    />
    {customerErrors.CustomerName && (
      <div className="field-error">{customerErrors.CustomerName}</div>
    )}

    <input
      type="text"
      placeholder="Mobile"
      value={customerDraft.Mobile}
      onChange={e =>
        setCustomerDraft(d => ({ ...d, Mobile: e.target.value }))
      }
    />
    {customerErrors.Mobile && (
      <div className="field-error">{customerErrors.Mobile}</div>
    )}

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
      onChange={(e) => setInvoiceDate(e.target.value)} 
    />
  </div>

<div className="form-group">
  <label className="invoice-no-label">Invoice No</label>
  <input 
    type="text"
    value={invoiceNo}
    readOnly
    style={{ background: "#f1ecff", width:"150px" }}
  />
</div>

  <div className="item-stock-display">
    {selectedItemBalance !== null && (
      <div className="stock-line">
        Total Available Stock: <b>{selectedItemBalance}</b>
      </div>
    )}

    {selectedBatchBalance !== null && (
      <div className="stock-line">
        Batch Stock: <b>{selectedBatchBalance}</b>
      </div>
    )}
  </div>
</div>


      </div>
      </div>

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

    <th>GST %</th>
    <th>GST Amt</th>

    <th>CGST %</th>
    <th>CGST Amt</th>

    <th>SGST %</th>
    <th>SGST Amt</th>

    <th>IGST %</th>
    <th>IGST Amt</th>

    <th>Total</th>
    <th></th>
  </tr>
</thead>


        <tbody>
          {lines.map((l,i)=>(
            <tr key={i}>

              <td style={{ position: "relative" }}>
  <div className="cell-box">
  <input 
  id={`ItemName_${i}`}
  className={validationErrors[`ItemName_${i}`] ? "inv-error" : ""}
    value={l.ItemName}
    onChange={(e) => {
      updateLine(i, "ItemName", e.target.value);
      setItemSearchIndex(i);
    }}
    onFocus={() => setItemSearchIndex(i)}
    placeholder="Search item by name or code"
  /></div>

  {itemSearchIndex === i && l.ItemName.trim() !== "" && (
    <div className="suggestions-box" style={{ width: "320px" }}>
      {itemList
        .filter(it =>
          (it.Name || "").toLowerCase().includes(l.ItemName.toLowerCase()) ||
          (it.ItemCode || "").toLowerCase().includes(l.ItemName.toLowerCase())
        )
        .slice(0, 12)
        .map(it => (
          <div
            key={it.Id}
            className="suggestion-row"
            onMouseDown={() => {
              // Auto-fill invoice line with backend ItemForInvoice fields
              updateLine(i, "ItemId", it.Id);
              updateLine(i, "ItemName", it.Name);
              updateLine(i, "HsnCode", it.HsnCode || it.ItemCode || "");
              updateLine(i, "BatchNo", it.BatchNo || "");
              updateLine(i, "GstPercent", Number(it.GstPercent) || 0);
              updateLine(i, "Rate", Number(it.SalesPrice) || 0);
              updateLine(i, "Unit", it.UnitName || "pcs");

              setItemSearchIndex(null); // close dropdown
               // 🔥 NEW — Fetch item balance
 
window.chrome.webview.postMessage({
  Action: "GetItemBalance",
  Payload: {
    ItemId: it.Id,
    LineIndex: i
  }
});

  // 🔥 NEW — Fetch item balance (correct payload format)
window.chrome.webview.postMessage({
  Action: "GetItemBalanceBatchWise",
  Payload: {
    ItemId: it.Id,
    BatchNo: it.BatchNo || "",
    LineIndex: i
  }
});

            }}
          >
            <div className="suggestion-line">
  <span className="item-name">{it.Name}</span>
  {it.BatchNo && <span className="item-batch"> Batch No :  {it.BatchNo}</span>}
  {it.SalesPrice && <span className="item-price"> Sales Price : ₹{Number(it.SalesPrice).toFixed(2)}</span>}
</div>

          </div>
        ))}
    </div>
  )}
</td>

              <td> <div className="cell-box" ><input
               id={`BatchNo_${i}`}
  className={validationErrors[`BatchNo_${i}`] ? "inv-error" : ""}
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
  className={validationErrors[`Qty_${i}`] ? "inv-error" : ""}
  onKeyDown={(e) => blockInvalidNumberKeys(e)}
      value={l.Qty}
      onChange={e => updateLine(i, "Qty", e.target.value)}
    />

    
  </div>
</td>

              <td> <div className="cell-box"><input
              id={`Rate_${i}`}
  className={validationErrors[`Rate_${i}`] ? "inv-error" : ""}
  onKeyDown={(e) => blockInvalidNumberKeys(e)}
              value={l.Rate} onChange={e=>updateLine(i,'Rate',e.target.value)} /></div></td>
              {/* DISCOUNT */}
<td>
  <div className="cell-box">
    <input
    id={`Discount_${i}`}
  className={validationErrors[`Discount_${i}`] ? "inv-error" : ""}
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


              <td> <div className="cell-box"><input
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
                
                </div></td>
                 
                  <td>
                  
                     <button
  className="invaction-btn invaction-modify"
 onClick={() => {
    if (window.confirm("Are you sure you want to remove this row?")) {
      removeLine(i);
    }
  }}
>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="invaction-icon small-icon"
  >
    {/* Pencil/Edit Icon */}
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
  </svg>

  {/* Modify Inventory */}
</button>
                  </td>

            </tr>
          ))}
        </tbody>
      </table>
<div className="button-row-wrapper">
     <div className="button-row">
      <div className="inventory-btns">
  <button className="btn-submit small" onClick={addLine}>Add Item</button>
  <button
  disabled={
  !customer.CustomerId &&
  !customerDraft.CustomerName.trim()
}

  className="btn-submit small"
  onClick={handleSave}
>
  Save Invoice
</button>

  <button 
    className="btn-submit small"
    onClick={() => {
      window.chrome.webview.postMessage({
        Action: "PrintInvoice",
        Payload: { InvoiceId: invoiceId }
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
        onClick={() =>
          document
            .querySelector(".pdf-modal-box iframe")
            .contentWindow.print()
        }
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
    
    
  );
}
