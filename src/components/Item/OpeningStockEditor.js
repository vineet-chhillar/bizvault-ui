
import "./ItemForms.css";
import React, { useEffect, useState } from "react";
const blankLine = () => ({
  ItemId: 0,
  ItemName: "",
  BatchNo: "",
  Qty: "",
  Rate: "",
  Value: 0
});

export default function OpeningStockEditor() {

  /* ---------------- HEADER STATE ---------------- */
  const [asOnDate, setAsOnDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [notes, setNotes] = useState("");
const [itemList, setItemList] = useState([]);
const [openingStock, setOpeningStock] = useState(null);   // header
const [openingStockItems, setOpeningStockItems] = useState([]); // rows

  /* ---------------- GRID STATE ---------------- */
  const [lines, setLines] = useState([blankLine()]);
  const [activeRow, setActiveRow] = useState(null);
//const [itemSuggestions, setItemSuggestions] = useState([]);
const [isLocked, setIsLocked] = useState(false);
const hasValidRows = lines.some(
  l => l.ItemId && Number(l.Qty) > 0
);

  /* ---------------- TOTALS ---------------- */
  const totals = lines.reduce(
    (a, l) => {
      a.qty += Number(l.Qty || 0);
      a.val += Number(l.Value || 0);
      return a;
    },
    { qty: 0, val: 0 }
  );

  /* ---------------- LINE UPDATE ---------------- */
  const updateLine = (i, field, value) => {
    setLines(prev => {
      const copy = [...prev];
      copy[i] = { ...copy[i], [field]: value };

      if (field === "Qty" || field === "Rate") {
        const q = Number(copy[i].Qty || 0);
        const r = Number(copy[i].Rate || 0);
        copy[i].Value = +(q * r).toFixed(2);
      }
      return copy;
    });
  };

  const addRow = () => setLines(p => [...p, blankLine()]);
  const removeRow = (i) =>
    setLines(p => p.filter((_, idx) => idx !== i));
useEffect(() => {
  window.chrome?.webview?.postMessage({
    Action: "GetItemsForPurchaseInvoice"   // reuse SAME backend action
  });
}, []);

  /* ---------------- SAVE (STEP 2) ---------------- */
  const handleSave = () => {
  
  const hasValidRows = lines.some(
  l => l.ItemId && Number(l.Qty) > 0 && Number(l.Rate) > 0
);
const validLines = lines.filter(
  l => l.ItemId && Number(l.Qty) > 0 && Number(l.Rate) > 0
);

if (validLines.length === 0) {
  alert("Please add at least one valid item");
  return;
}
if (!asOnDate) {
  alert("Please select As On Date");
  return;
}
if (new Date(asOnDate) > new Date()) {
  alert("As On Date cannot be in the future");
  return;
}
const itemIds = validLines.map(l => l.ItemId);
const hasDuplicate = new Set(itemIds).size !== itemIds.length;

if (hasDuplicate) {
  alert("Same item cannot be entered twice in opening stock");
  return;
}


    if (!hasValidRows) return;
const user = JSON.parse(localStorage.getItem("user"));
  const payload = {
    AsOnDate: asOnDate,
    Notes: notes,
    CreatedBy: user.email, 
    Items: validLines
      .filter(l => l.ItemId && Number(l.Qty) > 0)
      .map(l => ({
        ItemId: l.ItemId,
        BatchNo: l.BatchNo || null,
        Qty: Number(l.Qty),
        Rate: Number(l.Rate)
      }))
  };

  window.chrome?.webview?.postMessage({
    Action: "SaveOpeningStock",
    Payload: payload
  });
};

useEffect(() => {
  window.chrome?.webview?.postMessage({
    Action: "GetOpeningStock"
  });
}, []);


useEffect(() => {
  if (!window.chrome?.webview) return;

  const handler = (event) => {
    let msg = event.data;
    if (typeof msg === "string") msg = JSON.parse(msg);
if (msg?.Type === "GetItemsForPurchaseInvoice" && msg.Status === "Success") {
  setItemList(msg.Data || []);
}

if (msg.action === "GetOpeningStockResponse") {
  if (msg.exists) {
    setOpeningStock(msg.header);
    setOpeningStockItems(msg.items || []);
    setIsLocked(true);   // 🔒 lock editor if already exists
  }
}


    if (msg.action === "SaveOpeningStockResponse") {
      if (msg.success) {
        alert(msg.message);
        setIsLocked(true); // disable UI
        setNotes("");
         setLines([blankLine()]);
         
    // 🔥 REFRESH SAVED DATA
    window.chrome.webview.postMessage({
      Action: "GetOpeningStock"
    });
      } else {
        alert("❌ " + msg.message);
      }
    }
  };

  window.chrome.webview.addEventListener("message", handler);
  return () => window.chrome.webview.removeEventListener("message", handler);
}, []);
useEffect(() => {
  const close = () => {
    setActiveRow(null);
    //setItemSuggestions([]);
  };
  document.addEventListener("click", close);
  return () => document.removeEventListener("click", close);
}, []);

useEffect(() => {
  if (!window.chrome?.webview) return;

  const handler = (event) => {
    let msg = event.data;
    if (typeof msg === "string") {
      try { msg = JSON.parse(msg); } catch { return; }
    }

   
  };

  window.chrome.webview.addEventListener("message", handler);
  return () => window.chrome.webview.removeEventListener("message", handler);
}, []);

  return (
    <div className="form-container">

      <div className="form-inner">
        <h2 className="form-title">📦 Opening Stock</h2>

        {/* ---------- HEADER FORM ---------- */}
        <div className="form-row">

          <div className="form-group">
            <label>As On Date *</label>
            <input
              type="date"
              value={asOnDate}
              onChange={e => setAsOnDate(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Notes</label>
            <input
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Optional note for opening stock"
            />
          </div>

        </div>

        {/* ---------- ITEM GRID ---------- */}
         <div className="table-container" style={{ marginTop: 20 }}>
          <h3 className="table-title">Opening Stock Items</h3>
            <div className="table-wrapper">

          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Item</th>
                <th>Batch</th>
                <th>Qty</th>
                <th>Rate</th>
                <th>Value</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {lines.map((l, i) => (
                <tr key={i}>
                  <td>{i + 1}</td>

                  <td style={{ position: "relative" }}>
  <div className="cell-box">
    <input
      value={l.ItemName}
      disabled={isLocked}
      placeholder="Search item"
      onChange={e => {
        updateLine(i, "ItemName", e.target.value);
        setActiveRow(i);
      }}
      onFocus={() => setActiveRow(i)}
      onBlur={() => setTimeout(() => setActiveRow(null), 150)}
    />
  </div>

  {activeRow === i && l.ItemName.trim() !== "" && (
    <div className="suggestions-box">
      {itemList
        .filter(it =>
          (it.Name || "").toLowerCase().includes(l.ItemName.toLowerCase()) ||
          (it.ItemCode || "").toLowerCase().includes(l.ItemName.toLowerCase())
        )
        .slice(0, 10)
        .map(it => (
          <div
            key={it.Id}
            className="suggestion-row"
            onMouseDown={() => {
              setLines(prev => {
                const copy = [...prev];
                copy[i] = {
                  ...copy[i],
                  ItemId: it.Id,
                  ItemName: it.Name,
                  Rate: it.CostPrice || "",
                  Qty: copy[i].Qty || 1,
                  Value: (copy[i].Qty || 1) * (it.CostPrice || 0)
                };
                return copy;
              });
              setActiveRow(null);
            }}
          >
            <div className="suggestion-line">
              <span className="item-name">{it.Name}</span>
              <span className="item-code">[{it.ItemCode}]</span>
            </div>
          </div>
        ))}
    </div>
  )}
</td>



                  <td>
                     <div className="cell-box">
                    <input
                      value={l.BatchNo}
                      disabled={isLocked}
                      onChange={e =>
                        updateLine(i, "BatchNo", e.target.value)
                      }
                    />
                    </div>
                  </td>

              <td>
                 <div className="cell-box">
  <input
    type="number"
    value={l.Qty}
    disabled={isLocked}
    onChange={e =>
      updateLine(i, "Qty", e.target.value)
    }
    className={
      l.ItemName && Number(l.Qty) <= 0 ? "error-input" : ""
    }
  />
  </div>
  {l.ItemName && Number(l.Qty) <= 0 && (
    <div className="error">Qty must be greater than 0</div>
  )}
</td>


                  <td>
                    <div className="cell-box">
                    <input
                      type="number"
                      value={l.Rate}
                      disabled={isLocked}
                      onChange={e =>
                        updateLine(i, "Rate", e.target.value)
                      }
                      className={
  l.ItemName && Number(l.Rate) <= 0 ? "error-input" : ""
}
                    />
                    </div>
                    {l.ItemName && Number(l.Rate) <= 0 && (
  <div className="error">Rate must be greater than 0</div>
)}

                  </td>

                  <td>
                    <div className="cell-box">
                    <input value={l.Value} readOnly />
                    </div>
                  </td>

                  <td>
                    {lines.length > 1 && (
                      <button
                        className="invaction-btn invaction-delete"
                        onClick={() => removeRow(i)}
                      >
                        ✕
                      </button>
                    )}
                  </td>
                </tr>
                
              ))}
              
            </tbody>
            
          </table>
</div>
          <button
            type="button"
            className="btn-submit small"
            style={{ marginTop: 10 }}
            onClick={addRow}
          >
            ➕ Add Item
          </button>
        </div>

        {/* ---------- TOTALS ---------- */}
        <div className="form-row" style={{ marginTop: 20 }}>
          <div className="form-group">
            <label>Total Quantity</label>
            <input value={totals.qty} readOnly />
          </div>

          <div className="form-group">
            <label>Total Value</label>
            <input value={totals.val.toFixed(2)} readOnly />
          </div>
        </div>

        {/* ---------- ACTIONS ---------- */}
        <div className="inventory-btns">
        <button
  className="btn-submit small"
  onClick={handleSave}
  disabled={!hasValidRows || isLocked}
>
  💾 Save Opening Stock
</button>

        </div>

        <p style={{ color: "#a00", marginTop: 10 }}>
          ⚠ Opening stock can be entered only once and cannot be edited later.
        </p>

      </div>
      {/* ================= SAVED OPENING STOCK VIEW ================= */}
{openingStock && (
  <div className="table-container" style={{ marginTop: 30 }}>
    <h3 className="table-title">📄 Saved Opening Stock</h3>

    <div className="form-row" style={{ marginBottom: 10 }}>
      <div className="form-group">
        <label>As On Date</label>
        <input value={openingStock.AsOnDate} readOnly />
      </div>

      <div className="form-group">
        <label>Notes</label>
        <input value={openingStock.Notes || ""} readOnly />
      </div>
    </div>

    <table className="data-table">
      <thead>
        <tr>
          <th>#</th>
          <th>Item</th>
          <th>Batch</th>
          <th>Qty</th>
          <th>Rate</th>
          <th>Value</th>
        </tr>
      </thead>

      <tbody>
        {openingStockItems.map((it, i) => (
          <tr key={i}>
            <td>{i + 1}</td>
            <td>{it.ItemName}</td>
            <td>{it.BatchNo || "-"}</td>
            <td>{it.Qty}</td>
            <td>{it.Rate}</td>
            <td>{Number(it.Value).toFixed(2)}</td>
          </tr>
        ))}
      </tbody>
    </table>

    <div className="form-row" style={{ marginTop: 15 }}>
      <div className="form-group">
        <label>Total Quantity</label>
        <input value={openingStock.TotalQty} readOnly />
      </div>

      <div className="form-group">
        <label>Total Value</label>
        <input value={Number(openingStock.TotalValue).toFixed(2)} readOnly />
      </div>
    </div>
  </div>
)}

    </div>
  );
}
