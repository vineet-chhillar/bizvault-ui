// PurchaseInvoiceEditor.js
import React, { useState, useEffect } from "react";
import "./Invoice.css";
import "./ItemForms.css";

const blankLine = () => ({
  ItemId: 0,
  ItemName: "",
  HsnCode: "",
  Unit: "",
  BatchNo: "",
  Qty: 1,
  Rate: 0,
  Discount: 0,
  NetRate: 0,
   netamount: 0,
  GstPercent: 0,
  GstValue: 0,

  CgstPercent: 0,
  SgstPercent: 0,
  IgstPercent: 0,

  CgstValue: 0,
  SgstValue: 0,
  IgstValue: 0,

  Amount: 0,
  TaxAmount: 0,
  Notes:"",

  // OPTIONAL FIELDS
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

export default function PurchaseInvoiceEditor({ user }) {

  // ========= STATE =========
  const [notes, setNotes] = useState("");
const [backupLine, setBackupLine] = useState(null);

const [printDate, setPrintDate] = useState(
  new Date().toISOString().slice(0, 10)
);

  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().slice(0,10));
  const [supplierList, setSupplierList] = useState([]);
  const [supplierId, setSupplierId] = useState("");
  const [supplierInfo, setSupplierInfo] = useState(null);

  const [itemList, setItemList] = useState([]);
  const [itemSearchIndex, setItemSearchIndex] = useState(null);
  const [lines, setLines] = useState([ blankLine() ]);
// track which row has its details open (null = none)
const [activeDetailIndex, setActiveDetailIndex] = useState(null);
// style for floating panel (top, left, width)
const [detailStyle, setDetailStyle] = useState({ top: 0, left: 0, width: 0 });
// refs for each main row
const rowRefs = React.useRef([]);
rowRefs.current = lines.map((_, i) => rowRefs.current[i] ?? React.createRef());

  const [totals, setTotals] = useState({
    subTotal: 0,
    tax: 0,
    total: 0,
    roundOff: 0
  });

const [invoiceNum, setInvoiceNum] = useState("");
const [invoiceFY, setInvoiceFY] = useState("");
const [invoiceNo, setInvoiceNo] = useState("");

  const [invoiceId, setInvoiceId] = useState(null);
  const [invoiceNumbers, setInvoiceNumbers] = useState([]);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState("");

  const [pdfPath, setPdfPath] = useState("");
  const [downloadPath, setDownloadPath] = useState("");
  const [showPdfModal, setShowPdfModal] = useState(false);

  const [company, setCompany] = useState(null);

useEffect(() => {
  fetchInvoiceNumbers(printDate);
}, [printDate]);

useEffect(() => {
  window.chrome.webview.postMessage({ Action: "GetNextPurchaseInvoiceNum" });
}, []);
  // ========= LOAD COMPANY =========
  useEffect(() => {
    window.chrome?.webview?.postMessage({ Action: "GetCompanyProfile" });
  }, []);


  // ========= LOAD SUPPLIERS =========
  useEffect(() => {
    window.chrome?.webview?.postMessage({ Action: "GetAllSuppliers" });
  }, []);


  // ========= LOAD ITEMS FOR PURCHASE INVOICE =========
  useEffect(() => {
    window.chrome?.webview?.postMessage({ Action: "GetItemsForPurchaseInvoice" });
  }, []);


  


  // ========= TOGGLE DETAILS =========
const toggleItemDetails = (i) => {
  // if already open, close it
  if (activeDetailIndex === i) {
    setActiveDetailIndex(null);
    return;
  }

  // otherwise compute position of the row and open panel
  const trEl = rowRefs.current[i]?.current;
  if (!trEl) {
    console.warn("Row element not found for index", i);
    setActiveDetailIndex(i); // still open, fallback
    return;
  }

  const container = trEl.closest(".invoice-editor") || document.body;
  const trRect = trEl.getBoundingClientRect();
  const containerRect = container.getBoundingClientRect();

  // compute top/left relative to container
  const top = trRect.bottom - containerRect.top + 6; // small gap below row
  const left = trRect.left - containerRect.left;
  const width = trRect.width;

  setDetailStyle({ top, left, width });
  setActiveDetailIndex(i);
};




  // ========= UPDATE LINE =========
 const updateLine = (i, key, val) => {
  setLines(prev => {
    const copy = [...prev];
    const line = { ...copy[i], [key]: val };

    const qty = Number(line.Qty) || 0;
    const rate = Number(line.Rate) || 0;
    const discountPct = Number(line.Discount) || 0;
    const gstPct = Number(line.GstPercent) || 0;

    // ---------- N E T   R A T E ----------
    let netrate = rate - (rate * discountPct / 100);   // numeric
    netrate = +netrate.toFixed(2);
    line.NetRate = netrate;                            // <-- assign to line

    // ---------- N E T   A M O U N T ----------
    const netamount = qty * netrate;
    line.netamount = +netamount.toFixed(2);

    // (for backward compatibility with your existing Amount column)
    line.Amount = line.netamount;

    // ---------- GST ON NET ----------
    const gstValue = +(netamount * (gstPct / 100)).toFixed(2);
    line.GstValue = gstValue;
    line.TaxAmount = gstValue;

    // ---------- GST SPLIT ----------
   // ---------- GST SPLIT ----------
if (gstPct > 0) {
  if (isInterState()) {
    // IGST only
    line.IgstPercent = gstPct;
    line.IgstValue = gstValue;

    line.CgstPercent = 0;
    line.CgstValue = 0;
    line.SgstPercent = 0;
    line.SgstValue = 0;
  } else {
    // CGST + SGST (split exactly to match gstValue with rounding)
    const halfPct = gstPct / 2;
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


  // ========= RECALC TOTALS =========
  useEffect(() => recalc(), [lines]);

  const isInterState = () => {
    //console.log(company.State)
    //console.log(supplierInfo.State)
    const seller = company?.State?.toLowerCase().trim();
    const buyer  = supplierInfo?.State?.toLowerCase().trim();

    if (!seller || !buyer) return false;
    return seller !== buyer;
  };


 const recalc = () => {
  let sub = 0, tax = 0;
  lines.forEach(l => {
    const netamt = Number(l.netamount) || 0;         // use netamount (Qty * netrate)
    const g = Number(l.GstValue) || 0;               // gst already computed on netamount
    sub += netamt;
    tax += g;
  });
  const total = sub + tax;
  const round = Math.round(total) - total;
  setTotals({ subTotal: sub, tax: tax, total: total + round, roundOff: round });
};


  // ========= SAVE PURCHASE INVOICE =========
  const saveInvoice = () => {

    if (!supplierInfo) {
      alert("Select a supplier");
      return;
    }

    const Items = lines.map(l => ({
  ItemId: l.ItemId,
  ItemName: l.ItemName,
  HsnCode: l.HsnCode,
  BatchNo: l.BatchNo,

  Qty: Number(l.Qty),
  Rate: Number(l.Rate),
  DiscountPercent: Number(l.Discount),

  NetRate: Number(l.NetRate) || 0,
  NetAmount: Number(l.netamount) || 0,

  GstPercent: Number(l.GstPercent) || 0,
  GstValue: Number(l.GstValue) || 0,

  CgstPercent: Number(l.CgstPercent) || 0,
  CgstValue: Number(l.CgstValue) || 0,
  SgstPercent: Number(l.SgstPercent) || 0,
  SgstValue: Number(l.SgstValue) || 0,
  IgstPercent: Number(l.IgstPercent) || 0,
  IgstValue: Number(l.IgstValue) || 0,

  LineSubTotal: Number(l.netamount) || 0,
  LineTotal: (Number(l.netamount) || 0) + (Number(l.GstValue) || 0),

  SalesPrice: l.salesPrice,
  Mrp: l.mrp,
  Description: l.description,
  MfgDate: l.mfgdate,
  ExpDate: l.expdate,
  ModelNo: l.modelno,
  Brand: l.brand,
  Size: l.size,
  Color: l.color,
  Weight: l.weight,
  Dimension: l.dimension,
  Notes: l.Notes || ""
}));



    window.chrome.webview.postMessage({
      Action: "SavePurchaseInvoice",
      Payload: {
        SupplierId: supplierInfo.SupplierId,
       InvoiceNum: Number(invoiceNum),
    InvoiceNo: invoiceNo,
        InvoiceDate: purchaseDate,
        SubTotal: totals.subTotal,
        TotalTax: totals.tax,
        TotalAmount: totals.total,
        RoundOff: totals.roundOff,
        Notes: notes,
        Items,
        CreatedBy: user?.email
      }
    });
  };


  // ========= VIEW / PRINT =========
  const fetchInvoiceNumbers = (date) => {
    window.chrome.webview.postMessage({
      Action: "GetPurchaseInvoiceNumbersByDate",
      Payload: { Date: date }
    });
  };


 const printInvoice = () => {
  if (!selectedInvoiceId) {
    alert("Select an invoice first");
    return;
  }
  window.chrome.webview.postMessage({
    Action: "PrintPurchaseInvoice",
    Payload: { PurchaseId: selectedInvoiceId }
  });
};



  // ========= MESSAGE LISTENER =========
  useEffect(() => {

    const handler = (evt) => {
      let msg = evt.data;
      try { if (typeof msg === "string") msg = JSON.parse(msg); } catch {}

      if (!msg) return;
if (msg.action === "GetNextPurchaseInvoiceNumResponse") {
     setInvoiceNum(msg.nextNum);
    setInvoiceFY(msg.fy);
    setInvoiceNo(msg.invoiceNo)
}
      // Company
      if (msg.action === "GetCompanyProfileResponse") {
        setCompany(msg.profile);
      }

      // Suppliers
      if (msg.action === "GetAllSuppliers") {
        setSupplierList(msg.data || []);
      }

      // Items
      if (msg?.Type === "GetItemsForPurchaseInvoice") {
        if (msg.Status === "Success") {
          setItemList(msg.Data || []);
        }
      }

      // Auto Batch
      if (msg.action === "GetNextBatchNumResponse") {
        if (msg.success) {
          const lineIndex = msg.LineIndex ?? msg.lineIndex;
          const batchNum = msg.batchNum;

          setLines(prev => {
            const copy = [...prev];
            if (copy[lineIndex]) {
              copy[lineIndex].BatchNo = "BATCH-" + batchNum;
            }
            return copy;
          });
        }
      }


      // Save response
   if (msg.action === "SavePurchaseInvoiceResponse") {
  if (msg.success) {


    alert("Purchase Invoice : " + msg.invoiceNo + " Saved Successfully");
    
    // Auto-select invoice in dropdown
    setSelectedInvoiceId(msg.purchaseId);

    // Refresh dropdown for today's date
    fetchInvoiceNumbers(purchaseDate);

    setLines([ blankLine() ]);
    setNotes("");
 
window.chrome.webview.postMessage({ Action: "GetNextPurchaseInvoiceNum" });
  } 
  else {
    alert("Error: " + msg.message);
  }
}


      // Supplier details
  if (msg.action === "GetSupplierByIdResponse") {
  if (msg.success) {
    setSupplierInfo(msg.data);

    const supplierState = msg.data.State.trim().toLowerCase();
    const companyState = company?.State?.trim().toLowerCase();

    const interstate = supplierState !== companyState;

    // Recalculate GST split for ALL lines using NET AMOUNT (correct)
    setLines(prev =>
      prev.map(line => {
        const gstPct = Number(line.GstPercent) || 0;
        const netamount = Number(line.netamount) || 0;

        const gstValue = +(netamount * gstPct / 100).toFixed(2);

        let igstValue = 0,
          cgstValue = 0,
          sgstValue = 0;

        let igstPct = 0,
          cgstPct = 0,
          sgstPct = 0;

        if (gstPct > 0) {
          if (interstate) {
            // IGST
            igstPct = gstPct;
            igstValue = gstValue;
          } else {
            // CGST + SGST
            cgstPct = gstPct / 2;
            sgstPct = gstPct / 2;

            const cg = Number((gstValue / 2).toFixed(2));
            const sg = +(gstValue - cg).toFixed(2);

            cgstValue = cg;
            sgstValue = sg;
          }
        }

        return {
          ...line,

          GstValue: gstValue,
          TaxAmount: gstValue,

          IgstPercent: igstPct,
          IgstValue: igstValue,

          CgstPercent: cgstPct,
          CgstValue: cgstValue,

          SgstPercent: sgstPct,
          SgstValue: sgstValue
        };
      })
    );
  }
}



      // Invoice number list
      if (msg.action === "GetPurchaseInvoiceNumbersByDateResponse") {
        setInvoiceNumbers(msg.data || []);
      }

      // Print invoice
   if (msg.action === "PrintPurchaseInvoiceResponse") {
  if (msg.success) {
    const fileName = msg.pdfPath.split("\\").pop();
const url = "https://invoices.local/" + fileName;
setPdfPath(url);
    setDownloadPath(msg.pdfPath);
    setShowPdfModal(true);
  }
}

    };

    window.chrome.webview.addEventListener("message", handler);
    return () => window.chrome.webview.removeEventListener("message", handler);

  }, [company, supplierInfo]);


  // ========= UI =========
  return (
<div className="invoice-editor">

{/* ================= VIEW / PRINT ================= */}
<div className="top-sections">
<div className="print-section">

<input
  type="date"
  value={printDate}
  onChange={(e) => {
    setPrintDate(e.target.value);
    fetchInvoiceNumbers(e.target.value);   // load invoices for selected date
  }}
/>


<select
   value={selectedInvoiceId}
  onChange={(e) => setSelectedInvoiceId(e.target.value)}
>
  <option value="">Select Purchase Invoice</option>
  {invoiceNumbers.map(inv => (
    <option key={inv.Id} value={inv.Id}>{inv.PurchaseNo}</option>
  ))}
</select>

<button className="btn-submit small" onClick={printInvoice}>
  View / Print
</button>

</div>


{/* ================= SUPPLIER SECTION ================= */}
<div className="customer-section">
  <label>Supplier</label>

  <select
    value={supplierId}
    onChange={(e) => {  
      const id = e.target.value;
      setSupplierId(id);

      window.chrome.webview.postMessage({
        Action: "GetSupplierById",
        Payload: { SupplierId: id }
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
      <div><b>Mobile:</b> {supplierInfo.Mobile}</div>
      <div><b>GSTIN:</b> {supplierInfo.GSTIN}</div>
      <div><b>State:</b> {supplierInfo.State}</div>
      <div><b>Opening Bal:</b> ₹{supplierInfo.OpeningBalance}</div>
      <div><b>Balance:</b> ₹{supplierInfo.Balance}</div>
  </div>
)}

</div>
</div>


{/* ================= DATE ================= */}
<div className="form-row">
  <div className="form-group">
    <label>Purchase Invoice Date</label>
    <input 
      type="date"
      value={purchaseDate}
      onChange={e => setPurchaseDate(e.target.value)}
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
</div>

{/* ================= ITEM TABLE ================= */}
<table className="data-table" style={{ tableLayout: "fixed" }}>
  <thead>
    <tr>
      <th style={{ width: "200px" }}>Item</th>
      <th style={{ width: "110px" }}>Batch</th>
      <th style={{ width: "85px" }}>HSN</th>
      <th style={{ width: "70px" }}>Qty</th>
      <th style={{ width: "90px" }}>Purchase Rate</th>
      <th style={{ width: "70px" }}>Disc %</th>
      <th style={{ width: "100px" }}>Net Rate</th>
      <th style={{ width: "100px" }}>Net Amount</th>
      <th style={{ width: "70px" }}>GST %</th>
      <th style={{ width: "90px" }}>GST Amt</th>

      <th style={{ width: "70px" }}>CGST %</th>
      <th style={{ width: "90px" }}>CGST Amt</th>

      <th style={{ width: "70px" }}>SGST %</th>
      <th style={{ width: "90px" }}>SGST Amt</th>

      <th style={{ width: "70px" }}>IGST %</th>
      <th style={{ width: "90px" }}>IGST Amt</th>

      <th style={{ width: "110px" }}>Total</th>
      <th style={{ width: "90px" }}></th>
    </tr>
  </thead>

  <tbody>

    {lines.map((l,i)=>(
      <React.Fragment key={i}>

        {/* ================= MAIN ROW ================= */}
        <tr ref={rowRefs.current[i]}>

          {/* ITEM NAME */}
          <td style={{ width:"220px", position:"relative" }}>
            <div className="cell-box">
              <input
                value={l.ItemName}
                onChange={(e) => {
                  updateLine(i, "ItemName", e.target.value);
                  setItemSearchIndex(i);
                }}
                onFocus={() => setItemSearchIndex(i)}
                onBlur={() => setTimeout(() => setItemSearchIndex(null), 150)}
              />
            </div>

            {/* suggestions */}
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
                        updateLine(i, "ItemId", it.Id);
                        updateLine(i, "ItemName", it.Name);
                        updateLine(i, "HsnCode", it.HsnCode || "");
                        updateLine(i, "Unit", it.UnitName || "pcs");
                        updateLine(i, "GstPercent", Number(it.GstPercent) || 0);

                        window.chrome.webview.postMessage({
                          Action: "GetNextBatchNum",
                          Payload: { ItemId: it.Id, LineIndex: i }
                        });

                        updateLine(i, "Rate", "");
                        setItemSearchIndex(null);
                      }}
                    >
                      <div className="suggestion-line">
                        <span className="item-name">{it.Name}</span>
                        <span className="item-code">[{it.ItemCode}]</span>
                        {it.UnitName && (
                          <span className="item-unit">Unit: {it.UnitName}</span>
                        )}
                        <span className="item-gst">GST: {it.GstPercent}%</span>
                      </div>
                    </div>
                  ))}
              </div>
            )}

          </td>

          <td style={{ width:"90px" }}>
            <div className="cell-box">
              <input value={l.BatchNo} readOnly
                     onChange={e=>updateLine(i,"BatchNo",e.target.value)} 
                     style={{ background: "#eee" }} />
            </div>
          </td>

          <td style={{ width:"85px" }}>
            <div className="cell-box">
              <input value={l.HsnCode} readOnly style={{background:"#eee"}} />
            </div>
          </td>

          <td style={{ width:"70px" }}>
            <div className="cell-box">
              <input value={l.Qty}
                     onChange={e=>updateLine(i,"Qty",e.target.value)} />
            </div>
          </td>

          <td style={{ width:"90px" }}>
            <div className="cell-box">
              <input value={l.Rate}
                     onChange={e=>updateLine(i,"Rate",e.target.value)} />
            </div>
          </td>

          <td style={{ width:"70px" }}>
            <div className="cell-box">
              <input value={l.Discount}
                     onChange={e=>updateLine(i,"Discount",e.target.value)} />
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
    {Number(l.netamount).toFixed(2)}
  </div>
</td>

          <td style={{ width:"70px" }}>
            <div className="cell-box">
              <input value={l.GstPercent} readOnly style={{background:"#eee"}} />
            </div>
          </td>

          <td style={{ width:"90px" }}>
            <div className="cell-box">
              <input value={Number(l.GstValue).toFixed(2)} readOnly style={{background:"#eee"}} />
            </div>
          </td>

          <td style={{ width:"70px" }}>
            <div className="cell-box">
              <input value={l.CgstPercent} readOnly style={{background:"#eee"}} />
            </div>
          </td>

          <td style={{ width:"90px" }}>
            <div className="cell-box">
              <input value={Number(l.CgstValue).toFixed(2)} readOnly style={{background:"#eee"}} />
            </div>
          </td>

          <td style={{ width:"70px" }}>
            <div className="cell-box">
              <input value={l.SgstPercent} readOnly style={{background:"#eee"}} />
            </div>
          </td>

          <td style={{ width:"90px" }}>
            <div className="cell-box">
              <input value={Number(l.SgstValue).toFixed(2)} readOnly style={{background:"#eee"}} />
            </div>
          </td>

          <td style={{ width:"70px" }}>
            <div className="cell-box">
              <input value={l.IgstPercent} readOnly style={{background:"#eee"}} />
            </div>
          </td>

          <td style={{ width:"90px" }}>
            <div className="cell-box">
              <input value={Number(l.IgstValue).toFixed(2)} readOnly style={{background:"#eee"}} />
            </div>
          </td>

          <td style={{ width:"110px" }}>
            <div className="cell-box" style={{background:"#eee"}}>
              {Number(l.netamount + l.GstValue).toFixed(2)}

            </div>
          </td>

          {/* MORE + REMOVE */}
          <td style={{ width:"90px" }}>
            
            <button
    className="invaction-btn invaction-add"
  onClick={() => {
    setBackupLine({ ...lines[i] });   // store original line
    toggleItemDetails(i);             // open modal
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
      className="invaction-icon"
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
    {/*Add Inventory*/}
  </button>
            
            {/*<button
              className="invaction-btn"
              style={{ background: "#2980b9", color: "white", marginBottom: "4px" }}
              onClick={() => {
    setBackupLine({ ...lines[i] });   // store original line
    toggleItemDetails(i);             // open modal
}}
            >
              {l.showDetails ? "Hide" : "More"}
            </button>*/}

            <button
              className="invaction-btn invaction-modify"
              onClick={() => removeLine(i)}
            >
              X
            </button>
          </td>

        </tr>

        {/* ================= OPTIONAL DETAILS ROW ================= */}
        
        



      </React.Fragment>  
    ))}

  </tbody>
</table>
{/* FLOATING DETAILS PANEL */}
{activeDetailIndex !== null && (
  <div className="details-overlay">

    <div className="details-modal">

      <div className="details-modal-header">
        <strong>Add Additional Details For Item</strong>
       <div className="details-modal-actions">

  {/* SAVE changes */}
  <button
    className="save-btn"
    onClick={() => setActiveDetailIndex(null)}
  >
    Save & Proceed
  </button>

  {/* CANCEL changes */}
  <button
    className="cancel-btn"
    onClick={() => {
      setLines(prev => {
        const copy = [...prev];
        copy[activeDetailIndex] = { ...backupLine };   // restore original values
        return copy;
      });
      setActiveDetailIndex(null);   // close modal
    }}
  >
    Cancel
  </button>

</div>

      </div>

      <div className="details-modal-body">
        {(() => {
          const l = lines[activeDetailIndex];
          if (!l) return null;

          return (
            <div className="details-grid">
<div className="item-info-bar">
      <div><strong>Item:</strong> {l.ItemName || "-"}</div>
      <div><strong>Batch:</strong> {l.BatchNo || "-"}</div>
    </div>
              <div className="detail-row">
                <label>Sales Price</label>
                <input type="number" value={l.salesPrice || ""} onChange={(e)=>updateLine(activeDetailIndex, "salesPrice", e.target.value)} />
              </div>

              <div className="detail-row">
                <label>MRP</label>
                <input type="number" value={l.mrp || ""} onChange={(e)=>updateLine(activeDetailIndex, "mrp", e.target.value)} />
              </div>

              <div className="detail-row">
                <label>Description</label>
                <input type="text" value={l.description || ""} onChange={(e)=>updateLine(activeDetailIndex, "description", e.target.value)} />
              </div>

              <div className="detail-row">
                <label>MFG Date</label>
                <input type="date" value={l.mfgdate || ""} onChange={(e)=>updateLine(activeDetailIndex, "mfgdate", e.target.value)} />
              </div>

              <div className="detail-row">
                <label>EXP Date</label>
                <input type="date" value={l.expdate || ""} onChange={(e)=>updateLine(activeDetailIndex, "expdate", e.target.value)} />
              </div>

              <div className="detail-row">
                <label>Model No</label>
                <input type="text" value={l.modelno || ""} onChange={(e)=>updateLine(activeDetailIndex, "modelno", e.target.value)} />
              </div>

              <div className="detail-row">
                <label>Brand</label>
                <input type="text" value={l.brand || ""} onChange={(e)=>updateLine(activeDetailIndex, "brand", e.target.value)} />
              </div>

              <div className="detail-row">
                <label>Size</label>
                <input type="text" value={l.size || ""} onChange={(e)=>updateLine(activeDetailIndex, "size", e.target.value)} />
              </div>

              <div className="detail-row">
                <label>Color</label>
                <input type="text" value={l.color || ""} onChange={(e)=>updateLine(activeDetailIndex, "color", e.target.value)} />
              </div>

              <div className="detail-row">
                <label>Weight</label>
                <input type="number" value={l.weight || ""} onChange={(e)=>updateLine(activeDetailIndex, "weight", e.target.value)} />
              </div>

              <div className="detail-row">
                <label>Dimension</label>
                <input type="text" value={l.dimension || ""} onChange={(e)=>updateLine(activeDetailIndex, "dimension", e.target.value)} />
              </div>

            </div>
          );
        })()}
      </div>

    </div>
  </div>
)}

<div className="form-row">
  <div className="form-group" style={{ width: "100%" }}>
    <label>Purchase Invoice Notes</label>
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


{/* ================= BUTTONS ================= */}
<div className="button-row">
  <button className="btn-submit small" onClick={addLine}>Add Item</button>
  <button className="btn-submit small" onClick={saveInvoice}>Save Invoice</button>
  {/*<button className="btn-submit small" onClick={printInvoice}>Print Invoice</button>*/}
</div>


{/* ================= TOTALS ================= */}
<div className="invoice-totals">
  <div>Subtotal: {totals.subTotal.toFixed(2)}</div>
  <div>Total Tax: {totals.tax.toFixed(2)}</div>
  <div>Round Off: {totals.roundOff.toFixed(2)}</div>
  <div className="total-final">Grand Total: {totals.total.toFixed(2)}</div>
</div>


{/* ================= PDF MODAL ================= */}
{showPdfModal && (
  <div className="pdf-modal-overlay">
    <div className="pdf-modal-box">
      <div className="pdf-modal-header">
        <h3>Purchase Invoice PDF</h3>
        <p>Saved to: <b>{downloadPath}</b></p>
        <button onClick={() => setShowPdfModal(false)}>X</button>
      </div>

      <iframe
        src={pdfPath}
        style={{ width:"100%", height:"80vh", border:"none" }}
      ></iframe>

      <button
        className="pdf-print-btn"
        onClick={() =>
          document.querySelector(".pdf-modal-box iframe").contentWindow.print()
        }
      >
        Print
      </button>
    </div>
  </div>
)}

</div>
  );
}
