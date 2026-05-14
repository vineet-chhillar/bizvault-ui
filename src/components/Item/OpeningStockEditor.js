
import "./ItemForms.css";
import { getCreatedBy } from "../../utils/authHelper";
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
const [modal, setModal] = useState({
  show: false,
  message: "",
  type: "info",
  onClose: null
});
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

  const validLines = lines.filter(
    l =>
      l.ItemId &&
      Number(l.Qty) > 0 &&
      Number(l.Rate) >= 0
  );

  // =========================
  // QUICK UX VALIDATIONS
  // =========================

  if (!asOnDate) {
    setModal({
      show: true,
      message: "Please select As On Date",
      type: "error"
    });

    return;
  }

  if (new Date(asOnDate) > new Date()) {
    setModal({
      show: true,
      message: "As On Date cannot be in the future",
      type: "error"
    });

    return;
  }

  if (validLines.length === 0) {
    setModal({
      show: true,
      message: "Please add at least one valid item",
      type: "error"
    });

    return;
  }

  // =========================
  // DUPLICATE ITEM + BATCH CHECK
  // =========================

  const duplicateCheck = validLines.map(l =>
    `${l.ItemId}_${(l.BatchNo || "OPENINGSTOCK").trim()}`
  );

  const hasDuplicate =
    new Set(duplicateCheck).size !== duplicateCheck.length;

  if (hasDuplicate) {
    setModal({
      show: true,
      message:
        "Same item and batch cannot be entered twice.",
      type: "error"
    });

    return;
  }

  // =========================
  // BUILD PAYLOAD
  // =========================

  const payload = {
    AsOnDate: asOnDate,
    Notes: notes,
    CreatedBy: getCreatedBy(),

    Items: validLines.map(l => ({
      ItemId: l.ItemId,

      BatchNo:
        l.BatchNo?.trim()
          ? l.BatchNo.trim()
          : "OPENINGSTOCK",

      Qty: Number(l.Qty),

      Rate: Number(l.Rate)
    }))
  };

  // =========================
  // SAVE
  // =========================

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

  // =========================
  // SUCCESS
  // =========================

  if (msg.success) {

    setModal({
      show: true,
      message: msg.message || "Opening stock saved",
      type: "success",

      onClose: () => {

        setIsLocked(true);

        setNotes("");

        setLines([blankLine()]);

        window.chrome.webview.postMessage({
          Action: "GetOpeningStock"
        });
      }
    });

    return;
  }

  // =========================
  // BACKEND VALIDATION ERRORS
  // =========================

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

  // =========================
  // SYSTEM / BUSINESS ERRORS
  // =========================

  setModal({
    show: true,
    message:
      msg.message ||
      "Failed to save opening stock",

    type: "error"
  });
}
  };

  window.chrome.webview.addEventListener("message", handler);
  return () => window.chrome.webview.removeEventListener("message", handler);
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
    <>
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
                <th>Purchase Rate</th>
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

    // reset selected item while typing
    updateLine(i, "ItemId", 0);

    setActiveRow(i);
  }}

  onFocus={() => setActiveRow(i)}
/>
  </div>

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

        .slice(0, 10)

        .map(it => (

          <div
            key={`${it.Id}_${i}`}
            className="suggestion-row"

            onClick={() => {

              setLines(prev => {

                const copy = [...prev];

                copy[i] = {
                  ...copy[i],
                  ItemId: it.Id,
                  ItemName: it.Name,
                  Rate: it.CostPrice || "",
                  Qty: copy[i].Qty || 1,
                  Value:
                    (copy[i].Qty || 1) *
                    (it.CostPrice || 0)
                };

                return copy;
              });

              setActiveRow(null);
            }}
          >

            <div className="suggestion-line">

              <span className="item-name">
                {it.Name}
              </span>

              <span className="item-code">
                [{it.ItemCode}]
              </span>

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
  placeholder="Auto: OPENINGSTOCK if blank"
  onChange={e => updateLine(i, "BatchNo", e.target.value)}
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
          <th>Purchase Rate</th>
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
    {modal.show && (
  <div className="modal-overlay">
    <div className="modal-box">
      <p>{modal.message}</p>

      <div className="modal-actions">
        <button
          className="modal-btn ok"
          onClick={() => {
            modal.onClose?.();
            setModal({ show: false });
          }}
        >
          OK
        </button>
      </div>
    </div>
  </div>
)}
    </>
  );
}
