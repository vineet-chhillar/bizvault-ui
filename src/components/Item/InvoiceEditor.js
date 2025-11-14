// InvoiceEditor.js (simplified)
import React, { useState, useEffect } from "react";

const blankLine = () => ({ ItemId:0, ItemName:"", HsnCode:"", BatchNo:"", Qty:1, Unit:"pcs", Rate:0, Amount:0, GstPercent:0, TaxAmount:0, Cgst:0, Sgst:0, Igst:0, Discount:0 });

export default function InvoiceEditor({ companyProfile, user }) {
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().slice(0,10));
  const [customer, setCustomer] = useState({
  Id: 0,
  Name: "",
  Phone: "",
  Address: ""
});
const [customerSearch, setCustomerSearch] = useState("");
const [customerList, setCustomerList] = useState([]);
const [showSuggestions, setShowSuggestions] = useState(false);
const [itemList, setItemList] = useState([]);       // will hold ItemForInvoice[]
const [itemSearchIndex, setItemSearchIndex] = useState(null); // which row is showing suggestions


  const [lines, setLines] = useState([ blankLine() ]);
  const [invoiceNo, setInvoiceNo] = useState(""); // fetched from server when saving
  const [totals, setTotals] = useState({ subTotal:0, totalTax:0, total:0, roundOff:0 });
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
      const amt = (Number(l.Qty) || 0) * (Number(l.Rate) || 0);
      const t = amt * (Number(l.GstPercent) || 0) / 100;
      sub += amt;
      tax += t;
    });
    const total = sub + tax;
    const roundOff = Math.round(total) - total;
    setTotals({ subTotal: sub, totalTax: tax, total: total + roundOff, roundOff });
  };

  const updateLine = (idx, key, val) => {
    const copy = [...lines];
    copy[idx][key] = val;
    // auto-calc amount + tax
    copy[idx].Amount = (Number(copy[idx].Qty)||0) * (Number(copy[idx].Rate)||0);
    copy[idx].TaxAmount = copy[idx].Amount * (Number(copy[idx].GstPercent)||0) / 100;
    const gst = Number(copy[idx].GstPercent)||0;
    if (gst > 0) {
      // simple split CGST/SGST if intrastate (example: equal halves)
      copy[idx].Cgst = copy[idx].TaxAmount/2;
      copy[idx].Sgst = copy[idx].TaxAmount/2;
      copy[idx].Igst = 0;
    } else {
      copy[idx].Cgst = copy[idx].Sgst = copy[idx].Igst = 0;
    }
    setLines(copy);
  };

  const addLine = () => setLines(prev => [...prev, blankLine()]);
  const removeLine = (i) => setLines(prev => prev.filter((_,j)=>j!==i));

  const handleSave = async () => {

  // customer object to save
  const Customer = {
    Id: customer.Id || 0,
    Name: customer.Name?.trim() || "",
    Phone: customer.Phone?.trim() || "",
    Address: customer.Address?.trim() || ""
  };

  const payload = {
    Action: "CreateInvoice",
    Payload: {
      InvoiceDate: invoiceDate,
      CompanyProfileId: companyProfile?.Id ?? 1,
      Customer: Customer,   // <-- send whole customer object
      SubTotal: totals.subTotal,
      TotalTax: totals.totalTax,
      TotalAmount: totals.total,
      RoundOff: totals.roundOff,
      CreatedBy: user?.email,
      Items: lines
    }
  };

  if (window.chrome?.webview) {
    window.chrome.webview.postMessage(payload);
  }
};


  // listen feedback
  useEffect(() => {
    const handler = (evt) => {
      let msg = evt.data;
      try { if (typeof msg === 'string') msg = JSON.parse(msg); } catch {}
      if (msg.action === "CreateInvoiceResponse") {
        if (msg.success) alert("Saved: " + msg.message);
        else alert("Save failed");
      }
      if (msg.action === "GetCustomersResponse") {
  setCustomerList(msg.customers || []);
}
if (msg?.Type === "GetItemsForInvoice") {
      if (msg.Status === "Success") {
        setItemList(msg.Data || []);
      } else {
        console.warn("GetItemsForInvoice failed:", msg.Message);
      }
    }
    };
    if (window.chrome?.webview) {
      window.chrome.webview.addEventListener("message", handler);
      return () => window.chrome.webview.removeEventListener("message", handler);
    }
  }, []);

  return (
    <div className="invoice-editor">
      
      <div className="customer-section">
  <label>Customer</label>

  <input
    type="text"
    value={customerSearch}
    onChange={(e) => {
      setCustomerSearch(e.target.value);
      setShowSuggestions(true);
    }}
    placeholder="Search customer by name or phone"
  />

  {showSuggestions && customerSearch.trim() !== "" && (
    <div className="suggestions-box">
      {customerList
        .filter(c =>
          (c.Name?.toLowerCase() || "").includes(customerSearch.toLowerCase()) ||
          (c.Phone || "").includes(customerSearch)
        )
        .slice(0, 10)
        .map(c => (
          <div
            key={c.Id}
            className="suggestion-row"
            onClick={() => {
              // select customer
              setCustomer({
                Id: c.Id,
                Name: c.Name,
                Phone: c.Phone,
                Address: c.Address
              });

              setCustomerSearch(c.Name); // show name in search box
              setShowSuggestions(false);
            }}
          >
            {c.Name} — {c.Phone}
          </div>
        ))
      }
    </div>
  )}

  {/* Optional fields (editable) */}
  <div className="customer-fields">
    <input
      type="text"
      value={customer.Name}
      onChange={(e) =>
        setCustomer(prev => ({ ...prev, Name: e.target.value }))
      }
      placeholder="Customer Name (optional)"
    />
    <input
      type="text"
      value={customer.Phone}
      onChange={(e) =>
        setCustomer(prev => ({ ...prev, Phone: e.target.value }))
      }
      placeholder="Phone (optional)"
    />
    <input
      type="text"
      value={customer.Address}
      onChange={(e) =>
        setCustomer(prev => ({ ...prev, Address: e.target.value }))
      }
      placeholder="Address (optional)"
    />
  </div>
</div>


      <div>
        <label>Invoice Date</label>
        <input type="date" value={invoiceDate} onChange={e=>setInvoiceDate(e.target.value)} />
      </div>

      <table className="data-table">
        <thead><tr><th>Item</th><th>Batch</th><th>Qty</th><th>Rate</th><th>GST%</th><th>Amount</th><th></th></tr></thead>
        <tbody>
          {lines.map((l,i)=>(
            <tr key={i}>

              <td style={{ position: "relative" }}>
  <input
    value={l.ItemName}
    onChange={(e) => {
      updateLine(i, "ItemName", e.target.value);
      setItemSearchIndex(i);
    }}
    onFocus={() => setItemSearchIndex(i)}
    placeholder="Search item by name or code"
  />

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
            }}
          >
            <div style={{ fontWeight: 600 }}>{it.Name}</div>
            <div style={{ fontSize: "12px", color: "#666" }}>
              {it.SalesPrice ? ` • ₹${Number(it.SalesPrice).toFixed(2)}` : ""}
              {it.ItemCode ? `Code: ${it.ItemCode}` : ""}
              {it.BatchNo ? ` • ${it.BatchNo}` : ""}
              {it.UnitName ? ` • ${it.UnitName}` : ""}
              
            </div>
          </div>
        ))}
    </div>
  )}
</td>

              <td><input value={l.BatchNo} onChange={e=>updateLine(i,'BatchNo',e.target.value)} /></td>
              <td><input value={l.Qty} onChange={e=>updateLine(i,'Qty',e.target.value)} /></td>
              <td><input value={l.Rate} onChange={e=>updateLine(i,'Rate',e.target.value)} /></td>
              <td><input value={l.GstPercent} onChange={e=>updateLine(i,'GstPercent',e.target.value)} /></td>
              <td>{Number(l.Amount||0).toFixed(2)}</td>
              <td><button onClick={()=>removeLine(i)}>Del</button></td>
            </tr>
          ))}
        </tbody>
      </table>

      <div>
        <button onClick={addLine}>Add Item</button>
        <button onClick={handleSave}>Save Invoice</button>
      </div>

      <div>
        <div>Subtotal: {totals.subTotal.toFixed(2)}</div>
        <div>Total Tax: {totals.totalTax.toFixed(2)}</div>
        <div>Round Off: {totals.roundOff.toFixed(2)}</div>
        <div>Total: {totals.total.toFixed(2)}</div>
      </div>
    </div>
  );
}
