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
  Rate: "",
  Discount: 0,

  GstPercent: 0,
  GstValue: 0,

  CgstPercent: 0,
  SgstPercent: 0,
  IgstPercent: 0,

  CgstValue: 0,
  SgstValue: 0,
  IgstValue: 0,

  Amount: 0,
  TaxAmount: 0
});

export default function PurchaseInvoiceEditor({ user }) {

  // ========= STATE =========
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().slice(0,10));
  const [supplierList, setSupplierList] = useState([]);
  const [supplierId, setSupplierId] = useState("");
  const [supplierInfo, setSupplierInfo] = useState(null);

  const [itemList, setItemList] = useState([]);
  const [itemSearchIndex, setItemSearchIndex] = useState(null);
  const [lines, setLines] = useState([ blankLine() ]);

  const [totals, setTotals] = useState({
    subTotal: 0,
    tax: 0,
    total: 0,
    roundOff: 0
  });

  const [invoiceId, setInvoiceId] = useState(null);
  const [invoiceNumbers, setInvoiceNumbers] = useState([]);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState("");

  const [pdfPath, setPdfPath] = useState("");
  const [downloadPath, setDownloadPath] = useState("");
  const [showPdfModal, setShowPdfModal] = useState(false);

  const [company, setCompany] = useState(null);


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


  // ========= RECALC TOTALS =========
  useEffect(() => recalc(), [lines]);

  const isInterState = () => {
    const seller = company?.State?.toLowerCase().trim();
    const buyer  = supplierInfo?.State?.toLowerCase().trim();

    if (!seller || !buyer) return false;
    return seller !== buyer;
  };


  const recalc = () => {
    let sub = 0, tax = 0;
    lines.forEach(l => {
      const amt = (Number(l.Qty) || 0) * (Number(l.Rate) || 0);
      const t = amt * (Number(l.GstPercent) || 0) / 100;
      sub += amt;
      tax += t;
    });
    const total = sub + tax;
    const round = Math.round(total) - total;
    setTotals({ subTotal: sub, tax: tax, total: total + round, roundOff: round });
  };


  // ========= UPDATE LINE =========
  const updateLine = (i, key, val) => {
    const copy = [...lines];
    copy[i][key] = val;

    const qty = Number(copy[i].Qty) || 0;
    const rate = Number(copy[i].Rate) || 0;
    const discountPct = Number(copy[i].Discount) || 0;
    const gstPct = Number(copy[i].GstPercent) || 0;

    // base
    const base = qty * rate;
    const discount = (base * discountPct) / 100;
    const amount = base - discount;

    copy[i].Amount = amount;

    const gstValue = +(amount * gstPct / 100).toFixed(2);
    copy[i].GstValue = gstValue;
    copy[i].TaxAmount = gstValue;

    // GST Split
    if (gstPct > 0) {
      if (isInterState()) {
        copy[i].IgstPercent = gstPct;
        copy[i].IgstValue = gstValue;

        copy[i].CgstPercent = 0;
        copy[i].SgstPercent = 0;
        copy[i].CgstValue = 0;
        copy[i].SgstValue = 0;

      } else {

        let halfPct = gstPct / 2;
        let halfVal = +(gstValue / 2).toFixed(2);
        let remainder = +(gstValue - (halfVal * 2)).toFixed(2);

        copy[i].CgstPercent = halfPct;
        copy[i].SgstPercent = halfPct;
        copy[i].IgstPercent = 0;

        copy[i].CgstValue = +(halfVal + remainder).toFixed(2);
        copy[i].SgstValue = halfVal;
        copy[i].IgstValue = 0;
      }
    }

    setLines(copy);
  };


  const addLine = () => setLines(prev => [...prev, blankLine()]);
  const removeLine = (i) => setLines(prev => prev.filter((_,j)=>j!==i));


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
      GstPercent: Number(l.GstPercent),
      GstValue: Number(l.GstValue),

      CgstPercent: Number(l.CgstPercent),
      CgstValue: Number(l.CgstValue),
      SgstPercent: Number(l.SgstPercent),
      SgstValue: Number(l.SgstValue),
      IgstPercent: Number(l.IgstPercent),
      IgstValue: Number(l.IgstValue),

      LineSubTotal: Number(l.Amount),
      LineTotal: Number(l.Amount) + Number(l.GstValue)
    }));

    window.chrome.webview.postMessage({
      Action: "SavePurchaseInvoice",
      Payload: {
        SupplierId: supplierInfo.SupplierId,
        PurchaseDate: purchaseDate,
        SubTotal: totals.subTotal,
        TotalTax: totals.tax,
        TotalAmount: totals.total,
        RoundOff: totals.roundOff,
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
        console.log("Items received:", msg.Data);
        setItemList(msg.Data || []);
    } else {
        console.warn("GetItemsForPurchaseInvoice failed:", msg.Message);
    }
}
// Auto batch number response  GetNextBatchNumForItemResponse
if (msg.action === "GetNextBatchNumResponse") {
  if (msg.success) {
    const lineIndex = msg.LineIndex ?? msg.lineIndex;
    const batchNum = msg.batchNum;

    setLines(prev => {
      const copy = [...prev];
      if (copy[lineIndex]) {
        copy[lineIndex].BatchNo = "BATCH-" + batchNum; // format as you like
      }
      return copy;
    });
  }
}


      // Save response
      if (msg.action === "SavePurchaseInvoiceResponse") {
        if (msg.success) {
          alert("Purchase Invoice Saved Successfully");
          setInvoiceId(msg.purchaseId);
          setLines([ blankLine() ]);
        } else {
          alert("Error: " + msg.message);
        }
      }
      if (msg.action === "GetSupplierByIdResponse") {
    if (msg.success) {
        setSupplierInfo(msg.data);
    } else {
        alert("Failed to load supplier details");
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

        } else {
          alert("Print failed: " + msg.message);
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
  onChange={(e) => {
    fetchInvoiceNumbers(e.target.value);
  }}
/>

<select
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
    <label>Purchase Date</label>
    <input 
      type="date"
      value={purchaseDate}
      onChange={e => setPurchaseDate(e.target.value)}
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

      <th style={{ width: "70px" }}>GST %</th>
      <th style={{ width: "90px" }}>GST Amt</th>

      <th style={{ width: "70px" }}>CGST %</th>
      <th style={{ width: "90px" }}>CGST Amt</th>

      <th style={{ width: "70px" }}>SGST %</th>
      <th style={{ width: "90px" }}>SGST Amt</th>

      <th style={{ width: "70px" }}>IGST %</th>
      <th style={{ width: "90px" }}>IGST Amt</th>

      <th style={{ width: "110px" }}>Total</th>
      <th style={{ width: "40px" }}></th>
    </tr>
  </thead>

  <tbody>
    {lines.map((l,i)=>(
      <tr key={i}>

        {/* ITEM NAME */}
        <td style={{ width:"220px", position:"relative" }}>
          <div className="cell-box">
            <input
  value={l.ItemName}
  onChange={(e) => {
    updateLine(i, "ItemName", e.target.value);
    setItemSearchIndex(i);          // open suggestions while typing
  }}
  onFocus={() => setItemSearchIndex(i)}   // open suggestions on focus
  onBlur={() => {
    // small timeout so onMouseDown selection still runs before hiding
    setTimeout(() => setItemSearchIndex(null), 150);
  }}
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

            // NEW: BatchNo empty by default for fresh purchase entry
            window.chrome.webview.postMessage({
        Action: "GetNextBatchNum",
        Payload: { ItemId: it.Id, LineIndex: i }
    });

            // NEW: Rate is NOT provided by backend — user must enter
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
            <input value={l.BatchNo} 
                   onChange={e=>updateLine(i,"BatchNo",e.target.value)} />
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
            {Number(l.Amount + l.GstValue).toFixed(2)}
          </div>
        </td>

        <td style={{ width:"40px" }}>
          <button
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


{/* ================= BUTTONS ================= */}
<div className="button-row">
  <button className="btn-submit small" onClick={addLine}>Add Item</button>
  <button className="btn-submit small" onClick={saveInvoice}>Save Invoice</button>
  <button className="btn-submit small" onClick={printInvoice}>Print Invoice</button>
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
