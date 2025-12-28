import "./ItemForms.css";
import React, { useEffect, useState } from "react";

const blankLine = () => ({
  ItemId: 0,
  ItemName: "",
  BatchNo: "",
  CurrentQty: 0,
  AdjustQty: "",
  Rate: 0,
  ValueImpact: 0
});

export default function StockAdjustmentEditor() {

  const [date, setDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [type, setType] = useState("INCREASE");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");

  const [lines, setLines] = useState([blankLine()]);
  const [itemList, setItemList] = useState([]);
  const [activeRow, setActiveRow] = useState(null);

  // ------------------------------------------------
  // LOAD ITEMS
  // ------------------------------------------------
  useEffect(() => {
    window.chrome?.webview?.postMessage({
      Action: "GetItemsForPurchaseInvoice"
    });
  }, []);

  // ------------------------------------------------
  // MESSAGE HANDLER
  // ------------------------------------------------
  useEffect(() => {
    const handler = (e) => {
      let msg = e.data;
      if (typeof msg === "string") msg = JSON.parse(msg);

      if (msg?.Type === "GetItemsForPurchaseInvoice" && msg.Status === "Success") {
        setItemList(msg.Data || []);
      }
      if (msg.action === "GetCurrentStockForAdjustmentResponse") {
  setLines(prev =>
    prev.map(l =>
      l.ItemId === msg.ItemId
        ? {
            ...l,
            CurrentQty: Number(msg.CurrentQty),
            Rate: Number(msg.Rate)
          }
        : l
    )
  );
}

    };

    window.chrome.webview.addEventListener("message", handler);
    return () => window.chrome.webview.removeEventListener("message", handler);
  }, []);

  // ------------------------------------------------
  // UPDATE LINE
  // ------------------------------------------------
  const updateLine = (i, field, value) => {
    setLines(prev => {
      const copy = [...prev];
      const l = { ...copy[i], [field]: value };

      const qty = Number(l.AdjustQty || 0);
      const rate = Number(l.Rate || 0);

      l.ValueImpact = +(qty * rate).toFixed(2);

      copy[i] = l;
      return copy;
    });
  };

  const addRow = () => setLines(p => [...p, blankLine()]);
  const removeRow = (i) => setLines(p => p.filter((_, idx) => idx !== i));
const handleSave = () => {
  const invalid = lines.some(
    l =>
      !l.ItemId ||
      !l.AdjustQty ||
      Number(l.AdjustQty) <= 0 ||
      (type === "DECREASE" && Number(l.AdjustQty) > Number(l.CurrentQty))
  );

  if (invalid) {
    alert("Fix validation errors before saving");
    return;
  }

  const user = JSON.parse(localStorage.getItem("user"));

  window.chrome.webview.postMessage({
    Action: "SaveStockAdjustment",
    Payload: {
      Date: date,
      AdjustmentType: type,
      Reason: reason,
      Notes: notes,
      CreatedBy: user.email,
      Items: lines.map(l => ({
        ItemId: l.ItemId,
        BatchNo: l.BatchNo || null,
        AdjustQty: Number(l.AdjustQty),
        Rate: Number(l.Rate)
      }))
    }
  });
};

  return (
    <div className="form-container">
      <div className="form-inner">

        <h2 className="form-title">📊 Stock Adjustment</h2>

        {/* HEADER */}
        <div className="form-row">
          <div className="form-group">
            <label>Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>

          <div className="form-group">
            <label>Adjustment Type</label>
            <select value={type} onChange={e => setType(e.target.value)}>
              <option value="INCREASE">Increase</option>
              <option value="DECREASE">Decrease</option>
            </select>
          </div>

          <div className="form-group">
            <label>Reason</label>
            <select value={reason} onChange={e => setReason(e.target.value)}>
              <option value="">Select</option>
              <option>Damage</option>
              <option>Theft / Loss</option>
              <option>Physical Count Difference</option>
              <option>Manual Correction</option>
              <option>Other</option>
            </select>
          </div>
        </div>

        {/* NOTES */}
        <div className="form-row">
          <div className="form-group" style={{ width: "100%" }}>
            <label>Notes</label>
            <input value={notes} onChange={e => setNotes(e.target.value)} />
          </div>
        </div>

        {/* GRID */}
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Batch</th>
                <th>Current Qty</th>
                <th>Adjust Qty</th>
                <th>Rate</th>
                <th>Value Impact</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {lines.map((l, i) => (
                <tr key={i}>
                  <td style={{ position: "relative" }}>
  <div className="cell-box">
    <input
      value={l.ItemName}
      placeholder="Search item"
      onChange={e => {
        updateLine(i, "ItemName", e.target.value);
        setActiveRow(i);
      }}
      onFocus={() => setActiveRow(i)}
      onBlur={() => setTimeout(() => setActiveRow(null), 150)}
    />
  </div>

  {/* SUGGESTIONS */}
  {activeRow === i && l.ItemName.trim() !== "" && (
    <div className="suggestions-box">
      {itemList
        .filter(it =>
          (it.Name || "")
            .toLowerCase()
            .includes(l.ItemName.toLowerCase()) ||
          (it.ItemCode || "")
            .toLowerCase()
            .includes(l.ItemName.toLowerCase())
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
                  BatchNo: "",       // optional for now
                  AdjustQty: "",
                  ValueImpact: 0
                };
                return copy;
              });

              // 🔥 THIS IS WHERE IT BELONGS
              window.chrome.webview.postMessage({
                Action: "GetCurrentStockForAdjustment",
                Payload: { ItemId: it.Id, RowIndex: i }
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

                  <td>{l.BatchNo}</td>
                  <td>{l.CurrentQty}</td>
                  <td>
  <div className="cell-box">
    <input
      type="number"
      value={l.AdjustQty}
      onChange={e => updateLine(i, "AdjustQty", e.target.value)}
      className={
        type === "DECREASE" &&
        Number(l.AdjustQty) > Number(l.CurrentQty)
          ? "error-input"
          : ""
      }
    />
  </div>

  {/* 🔴 INLINE VALIDATION MESSAGE */}
  {type === "DECREASE" &&
    Number(l.AdjustQty) > Number(l.CurrentQty) && (
      <div className="error">Insufficient stock</div>
    )}
</td>

                  <td>{l.Rate}</td>
                  <td>{l.ValueImpact.toFixed(2)}</td>
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

          <button className="btn-submit small" onClick={addRow}>
            ➕ Add Item
          </button>
        </div>

      </div>
    </div>
  );
}
