// InvoiceEditor.js (simplified)
import React, { useState, useEffect } from "react";

const blankLine = () => ({ ItemId:0, ItemName:"", HsnCode:"", BatchNo:"", Qty:1, Unit:"pcs", Rate:0, Amount:0, GstPercent:0, TaxAmount:0, Cgst:0, Sgst:0, Igst:0, Discount:0 });

export default function InvoiceEditor({ companyProfile, user }) {
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().slice(0,10));
  const [customer, setCustomer] = useState({ Id:0, Name:"Walk-in Customer" });
  const [lines, setLines] = useState([ blankLine() ]);
  const [invoiceNo, setInvoiceNo] = useState(""); // fetched from server when saving
  const [totals, setTotals] = useState({ subTotal:0, totalTax:0, total:0, roundOff:0 });

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
    // get next invoice num from server (optional)
    // We'll ask server to produce next invoice & save atomically
    const payload = {
      Action: "CreateInvoice",
      Payload: {
        InvoiceDate: invoiceDate,
        CompanyProfileId: companyProfile?.Id ?? 1,
        CustomerId: customer.Id,
        CustomerName: customer.Name,
        CustomerPhone: customer.Phone,
        CustomerAddress: customer.Address || "",
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
    };
    if (window.chrome?.webview) {
      window.chrome.webview.addEventListener("message", handler);
      return () => window.chrome.webview.removeEventListener("message", handler);
    }
  }, []);

  return (
    <div className="invoice-editor">
      <div>
        <label>Invoice Date</label>
        <input type="date" value={invoiceDate} onChange={e=>setInvoiceDate(e.target.value)} />
      </div>

      <table className="data-table">
        <thead><tr><th>Item</th><th>Batch</th><th>Qty</th><th>Rate</th><th>GST%</th><th>Amount</th><th></th></tr></thead>
        <tbody>
          {lines.map((l,i)=>(
            <tr key={i}>
              <td><input value={l.ItemName} onChange={e=>updateLine(i,'ItemName',e.target.value)} /></td>
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
