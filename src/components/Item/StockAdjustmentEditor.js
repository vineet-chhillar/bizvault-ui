import "./ItemForms.css";
import React, { useEffect, useState } from "react";
import { getCreatedBy } from "../../utils/authHelper";
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
const [selectedAdjustmentId, setSelectedAdjustmentId] = useState(null);

  const [date, setDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [type, setType] = useState("INCREASE");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");

  const [lines, setLines] = useState([blankLine()]);
  const [itemList, setItemList] = useState([]);
  const [activeRow, setActiveRow] = useState(null);
  const [saving, setSaving] = useState(false);
const [recentAdjustments, setRecentAdjustments] = useState([]);
const [viewAdjustment, setViewAdjustment] = useState(null);

const [modal, setModal] = useState({
  show: false,
  message: "",
  type: "info",
  onConfirm: null,
  onClose: null
});
const resetForm = () => {
  setDate(new Date().toISOString().split("T")[0]);
  setType("INCREASE");
  setReason("");
  setNotes("");
  setLines([blankLine()]);
  setActiveRow(null);
};
useEffect(() => {
  window.chrome.webview.postMessage({
    Action: "GetRecentStockAdjustments"
  });
}, []);

  // ------------------------------------------------
  // LOAD ITEMS
  // ------------------------------------------------
  useEffect(() => {
    window.chrome?.webview?.postMessage({
      Action: "GetItemsForStockAdjustment"
    });
  }, []);

  // ------------------------------------------------
  // MESSAGE HANDLER
  // ------------------------------------------------
  useEffect(() => {
    const handler = (e) => {
      let msg = e.data;
      if (typeof msg === "string") msg = JSON.parse(msg);

      if (msg?.Type === "GetItemsForStockAdjustment" && msg.Status === "Success") {
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
if (msg.action === "GetRecentStockAdjustmentsResponse") {
  setRecentAdjustments(msg.data || []);
}

if (msg.action === "SaveStockAdjustmentResponse") {

  // =========================
  // VALIDATION / ERROR
  // =========================

  if (!msg.success) {

    setSaving(false);

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
        msg.message ||
        "Failed to save stock adjustment",

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
      `Stock adjustment saved successfully\nAdjustment No: ${msg.AdjustmentNo}`,

    type: "success",

    onClose: () => {

      setSaving(false);

      resetForm();

      window.chrome.webview.postMessage({
        Action: "GetRecentStockAdjustments"
      });
    }
  });
}
if (msg.action === "LoadStockAdjustmentResponse") {
  if (!msg.success) {
    setModal({
  show: true,
  message: msg.message || "Failed to load stock adjustment",
  type: "error"
});
    return;
  }

  setViewAdjustment(msg.data);
}
if (msg.action === "ReverseStockAdjustmentResponse") {
  if (!msg.success) {
  setModal({
    show: true,
    message: msg.message || "Failed to reverse adjustment",
    type: "error"
  });
  return;
}

setModal({
  show: true,
  message: `Adjustment reversed successfully\nNew Adjustment No: ${msg.AdjustmentNo}`,
  type: "success",
  onClose: () => {
    window.chrome.webview.postMessage({
      Action: "GetRecentStockAdjustments"
    });
    setViewAdjustment(null);
  }
});
}

    };

    window.chrome.webview.addEventListener("message", handler);
    return () => window.chrome.webview.removeEventListener("message", handler);
  }, []);

  const invalid = lines.some(
    l =>
      !l.ItemId ||
      !l.AdjustQty ||
      Number(l.AdjustQty) <= 0 ||
      (type === "DECREASE" && Number(l.AdjustQty) > Number(l.CurrentQty))
  );

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
  
  const validLines = lines.filter(
  l => l.ItemId && Number(l.AdjustQty) > 0
);

if (validLines.length === 0) {
  setModal({ show: true, message: "Please add at least one item", type: "error" });
  return;
}

if (validLines.some(l => Number(l.Rate) <= 0)) {
  setModal({ show: true, message: "Rate must be greater than zero", type: "error" });
  return;
}

if (!date) {
  setModal({ show: true, message: "Please select a date", type: "error" });
  return;
}

if (invalid) {
  setModal({ show: true, message: "Fix validation errors before saving", type: "error" });
  return;
}

if (!reason) {
  setModal({ show: true, message: "Please select a reason", type: "error" });
  return;
}

  if (saving) return;

  
  

  setSaving(true); // ✅ move here

  const user = JSON.parse(localStorage.getItem("user"));

  window.chrome.webview.postMessage({
    Action: "SaveStockAdjustment",
    Payload: {
      Date: date,
      AdjustmentType: type,
      Reason: reason,
      Notes: notes,
      CreatedBy: getCreatedBy(),
      Items: validLines.map(l => ({
  ItemId: l.ItemId,
  BatchNo: l.BatchNo || null,
  AdjustQty: Number(l.AdjustQty),
  Rate: Number(l.Rate)
}))

    }
  });
};


  return (
    <>
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
  {activeRow === i && (
    <div className="suggestions-box">
      {itemList
        .filter(it => {

  const search = (l.ItemName || "")
    .trim()
    .toLowerCase();

  // ✅ Show all items when empty
  if (!search) return true;

  return (
    (it.Name || "")
      .toLowerCase()
      .includes(search) ||

    (it.ItemCode || "")
      .toLowerCase()
      .includes(search)
  );
})
        //.slice(0, 10)
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
{/* ACTION BUTTONS */}
<div className="form-actions">
  <button
    className="btn-submit"
    onClick={handleSave}
  >
    💾 Save Stock Adjustment
  </button>
</div>
{/* RECENT ADJUSTMENTS */}
{recentAdjustments.length > 0 && (
  <div className="saved-summary">
    <h3>📌Stock Adjustments</h3>

    <table className="data-table small">
      <thead>
        <tr>
          <th>No</th>
          <th>Date</th>
          <th>Type</th>
          <th>Reason</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        {recentAdjustments.map(a => (
          <tr key={a.AdjustmentId}>



            <td>{a.AdjustmentNo}</td>
            <td>{a.AdjustmentDate}</td>
            <td>{a.AdjustmentType}</td>
            <td>{a.Reason}</td>
        
        <td>
  <div className="action-buttons">

    {/* VIEW BUTTON */}
    <button
      className="btn-view compact"
      onClick={() => {
        setSelectedAdjustmentId(a.AdjustmentId);
        window.chrome.webview.postMessage({
          Action: "LoadStockAdjustment",
          Payload: { AdjustmentId: a.AdjustmentId }
        });
      }}
    >
      👁 View
    </button>

    {/* REVERSE BUTTON */}
    <button
      className="btn-danger compact"
      onClick={() => {
        setModal({
  show: true,
  message: "Reverse this stock adjustment?",
  type: "confirm",
  onConfirm: () => {
    window.chrome.webview.postMessage({
      Action: "ReverseStockAdjustment",
      Payload: {
        AdjustmentId: a.AdjustmentId,
        ReversedBy: getCreatedBy()
      }
    });
  }
});
      }}
    >
      🔄 Reverse
    </button>

  </div>
</td>
   
        

          </tr>
        ))}
      </tbody>
    </table>
  </div>
)}

{/* READONLY VIEW */}
{viewAdjustment && (
  <div className="saved-summary">
    <h3>📄 Stock Adjustment – {viewAdjustment.AdjustmentNo}</h3>

    <div className="summary-row"><strong>Date:</strong> {viewAdjustment.Date}</div>
    <div className="summary-row"><strong>Type:</strong> {viewAdjustment.Type}</div>
    <div className="summary-row"><strong>Reason:</strong> {viewAdjustment.Reason}</div>
    <div className="summary-row"><strong>Notes:</strong> {viewAdjustment.Notes}</div>

    <table className="data-table small">
      <thead>
        <tr>
          <th>Item</th>
          <th>Batch</th>
          <th>Qty</th>
          <th>Rate</th>
          <th>Impact</th>
        </tr>
      </thead>
      <tbody>
        {viewAdjustment.Items.map((it, i) => (
          <tr key={i}>
            <td>{it.ItemName}</td>
            <td>{it.BatchNo || "-"}</td>
            <td>{it.Qty}</td>
            <td>{it.Rate}</td>
            <td>{it.ValueImpact.toFixed(2)}</td>
            
          </tr>
        ))}
      </tbody>
    </table>

    <div className="summary-total">
      <strong>Total:</strong>{" "}
      ₹ {viewAdjustment.Items.reduce((s, i) => s + i.ValueImpact, 0).toFixed(2)}
    </div>
  </div>
)}

      </div>

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
