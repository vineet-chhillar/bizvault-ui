import React, { useEffect, useState } from "react";
import "./SupplierPage.css";
import { getCreatedBy } from "../../utils/authHelper";

const emptySupplier = {
  SupplierId: 0,
  SupplierName: "",
  ContactPerson: "",
  Mobile: "",
  Email: "",
  GSTIN: "",
  Address: "",
  City: "",
  Pincode: "",
  OpeningBalance: 0,
  Balance: 0,
  CreatedBy: "",
  CreatedAt: "",
  UpdatedBy: "",
  UpdatedAt: "",
  State: ""  // ← NEW
};


function SupplierPage() {
  const [suppliers, setSuppliers] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(false);

  const [supplier, setSupplier] = useState(null); // null = no form open
  const [saving, setSaving] = useState(false);
const INDIAN_STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh",
  "Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka",
  "Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram",
  "Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana",
  "Tripura","Uttar Pradesh","Uttarakhand","West Bengal","Delhi",
  "Jammu & Kashmir","Ladakh","Puducherry","Andaman & Nicobar",
  "Chandigarh","Dadra & Nagar Haveli","Daman & Diu","Lakshadweep"
];
const [errors, setErrors] = useState({});
const [originalState, setOriginalState] = useState("");
const [modal, setModal] = useState({
  show: false,
  message: "",
  type: "info",
  onConfirm: null,
  onClose: null
});
  // =====================================================
  // LOAD SUPPLIERS
  // =====================================================
  const loadSuppliers = (kw = "") => {
    if (!window.chrome?.webview) return;

    setLoading(true);
    const handler = (event) => {
      const msg = event.data;
      if (!msg || msg.action !== "searchSuppliers") return;
      window.chrome.webview.removeEventListener("message", handler);

      if (msg.success) setSuppliers(msg.data || []);
      else console.error(msg.error);
      setLoading(false);
    };

    window.chrome.webview.addEventListener("message", handler);
    window.chrome.webview.postMessage({
      Action: "searchSuppliers",
      Payload: { Keyword: kw || "" },
    });
  };

  useEffect(() => {
    loadSuppliers("");
  }, []);

  // =====================================================
  // LOAD FOR EDIT
  // =====================================================
  const loadSupplierForEdit = (id) => {
    if (!window.chrome?.webview) return;

    if (!id || id === 0) {
      // NEW supplier
      setSupplier({ ...emptySupplier });
      return;
    }

    const handler = (event) => {
      const msg = event.data;
      if (!msg || msg.action !== "loadSupplier") return;
      window.chrome.webview.removeEventListener("message", handler);

      if (msg.success && msg.data) 
      {
        setSupplier(msg.data);
      setOriginalState(msg.data.State || "");
      }
      else alert(msg.error || "Supplier not found");
    };

    window.chrome.webview.addEventListener("message", handler);
    window.chrome.webview.postMessage({
      Action: "loadSupplier",
      Payload: { SupplierId: id },
    });
  };
const checkSupplierStateChange = (supplierId, newState, onSuccess) => {
  if (!window.chrome?.webview) return;

  const handler = (event) => {
    const msg = event.data;

    if (!msg || msg.action !== "canChangeSupplierStateResult") return;

    window.chrome.webview.removeEventListener("message", handler);

    if (!msg.canChange) {
      setModal({
        show: true,
        message: msg.message || "State cannot be changed"
      });
      return;
    }

    onSuccess(); // ✅ proceed
  };

  window.chrome.webview.addEventListener("message", handler);

  window.chrome.webview.postMessage({
    Action: "CanChangeSupplierState",
    Payload: {
      supplierId,
      newState
    }
  });
};
  // =====================================================
  // DELETE
  // =====================================================
  
  // =====================================================
  // SAVE
  // =====================================================
 const handleSave = () => {
  if (!window.chrome?.webview) return;

  let err = {};

  if (!supplier.SupplierName?.trim()) {
    err.SupplierName = "Supplier Name is required";
  }

  if (!supplier.State?.trim()) {
    err.State = "State is required";
  }

  if (supplier.Mobile && !/^\d{10}$/.test(supplier.Mobile)) {
    err.Mobile = "Mobile must be 10 digits";
  }

  if (supplier.GSTIN && supplier.GSTIN.length !== 15) {
    err.GSTIN = "GSTIN must be 15 characters";
  }

  if (Object.keys(err).length > 0) {
    setErrors(err);
    return;
  }

  // 🔥 STATE CHANGE CHECK (only when editing)
  if (
    supplier.SupplierId !== 0 &&
    originalState !== supplier.State
  ) {
    checkSupplierStateChange(
      supplier.SupplierId,
      supplier.State,
      () => {
        actuallySaveSupplier();
      }
    );
    return;
  }

  // ✅ Direct save
  actuallySaveSupplier();
};
const actuallySaveSupplier = () => {
  setSaving(true);

  const handler = (event) => {
    let msg = event.data;

    // 🔴 Parse JSON (important for WebView)
    if (typeof msg === "string") {
      try { msg = JSON.parse(msg); } catch { return; }
    }

    if (!msg || msg.action !== "saveSupplier") return;

    window.chrome.webview.removeEventListener("message", handler);
    setSaving(false);

    // 🔴 1. VALIDATION HANDLING (NEW)
    if (msg.validation && !msg.validation.isValid) {
      const errors = msg.validation.errors || {};
      setErrors(errors);

      // 🔥 Convert errors to readable message
      const message = Object.entries(errors)
        .map(([field, val]) => `${field}: ${val}`)
        .join("\n");

      setModal({
        show: true,
        message: message || msg.message || "Validation failed",
        type: "error"
      });

      return;
    }

    // ✅ 2. SUCCESS
    if (msg.success) {
      setErrors({});

      setModal({
        show: true,
        message: msg.message || "Saved successfully",
        type: "success",
        onClose: () => {
          loadSuppliers(keyword);

          setSupplier(null);
          setKeyword?.(""); // optional safety

          if (supplier.SupplierId === 0) {
            setSupplier({ ...emptySupplier });
          }
        }
      });

      return;
    }

    // ❌ 3. OTHER ERRORS (DB / exception)
    setModal({
      show: true,
      message: msg.message || "Save failed",
      type: "error"
    });
  };

  window.chrome.webview.addEventListener("message", handler);

  const user = getCreatedBy();

  const payload = {
    ...supplier
  };

  if (supplier.SupplierId === 0) {
    payload.CreatedBy = user;
    payload.UpdatedBy = null;
  } else {
    payload.CreatedBy = supplier.CreatedBy;
    payload.UpdatedBy = user;
  }

  window.chrome.webview.postMessage({
    Action: "saveSupplier",
    Payload: payload,
  });
};
  const handleChange = (field, value) =>
    setSupplier((p) => ({ ...p, [field]: value }));
const checkAndDeleteSupplier = (supplierId) => {
  const handler = (event) => {
    const msg = event.data;

    if (!msg || msg.action !== "canDeleteSupplierResult") return;

    window.chrome.webview.removeEventListener("message", handler);

    if (!msg.canDelete) {
      setModal({
        show: true,
        message: msg.message || "Supplier cannot be deleted"
      });
      return;
    }

    // ✅ allowed
    deleteSupplierNow(supplierId);
  };

  window.chrome.webview.addEventListener("message", handler);

  window.chrome.webview.postMessage({
    Action: "CanDeleteSupplier",
    Payload: { supplierId }
  });
};

const deleteSupplierNow = (supplierId) => {
  if (!window.chrome?.webview) return;

  const handler = (event) => {
    let msg = event.data;

    try {
      if (typeof msg === "string") msg = JSON.parse(msg);
    } catch {
      return;
    }

    if (!msg || msg.action !== "deleteSupplier") return;

    window.chrome.webview.removeEventListener("message", handler);

    if (msg.success) {
      setModal({
        show: true,
        message: msg.message || "Supplier deleted successfully",
        type: "success",
        onClose: () => {
          loadSuppliers(keyword);
        }
      });
    } else {
      setModal({
        show: true,
        message: msg.error || "Delete failed",
        type: "error"
      });
    }
  };

  window.chrome.webview.addEventListener("message", handler);

  window.chrome.webview.postMessage({
    Action: "deleteSupplier",
    Payload: { SupplierId: supplierId },
  });
};

  // =====================================================
  // UI
  // =====================================================
  return (
    <>
    <div className="page suppliers-page">
      {/* ---------- SUPPLIER SEARCH + LIST ALWAYS VISIBLE ---------- */}
      <div className="page-header card-header">
  <div className="header-icon-title">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="header-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
    <h2>Suppliers</h2>
  </div>
</div>


      <div className="supplier-left-panel">
  <div className="toolbar">
   

<div className="table-search-bar">
  <input
    type="text"
    placeholder="Search by name, mobile, GSTIN..."
    value={keyword}
  onChange={(e) => {
    const value = e.target.value;
    setKeyword(value);
    loadSuppliers(value);
  }}
    className="table-search-input"
  />
</div>

    


  </div>

  <button
    className="btn-submit small fullwidth"
    onClick={() => loadSupplierForEdit(0)}
  >
    + New Supplier
  </button>
</div>


      {loading && <div>Loading...</div>}
<div className="supplier-table-wrapper">
      <table className="data-suppliertable"> 
  <thead>
    <tr>
      <th>#</th> {/* ✅ Serial No */}
      <th>Name</th>
      <th>Contact Person</th>
      <th>Mobile</th>
      <th>Email</th>
      <th>GSTIN</th>
      <th>Address</th>
      <th>City</th>
      <th>State</th>
      <th>PinCode</th>
      <th>Opening Balance</th>
      <th>Balance</th>
      <th>Actions</th>
    </tr>
  </thead>

  <tbody>
    {!loading && suppliers.length === 0 && (
      <tr>
        <td colSpan={13} style={{ textAlign: "center" }}>
          No suppliers found
        </td>
      </tr>
    )}

    {suppliers.map((s, index) => (
      <tr key={s.SupplierId}>
        {/* ✅ Serial Number */}
        <td>{index + 1}</td>

        <td>{s.SupplierName}</td>
        <td>{s.ContactPerson}</td>
        <td>{s.Mobile}</td>
        <td>{s.Email}</td>
        <td>{s.GSTIN}</td>
        <td>{s.Address}</td>
        <td>{s.City}</td>
        <td>{s.State}</td>
        <td>{s.PinCode}</td>
        <td>{s.OpeningBalance}</td>
        <td>{s.Balance}</td>

        <td>
          {/* Edit */}
          <div className="invaction-group">
          <button
            className="invaction-btn invaction-modify"
            onClick={() => loadSupplierForEdit(s.SupplierId)}
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
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
            </svg>
          </button>

          {/* Delete */}
          <button
            className="invaction-btn invaction-delete"
            onClick={() =>
              setModal({
                show: true,
                message: `Delete supplier "${s.SupplierName}"?`,
                type: "confirm",
                onConfirm: () => checkAndDeleteSupplier(s.SupplierId)
              })
            }
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
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6m5 0V4a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v2" />
              <line x1="10" y1="11" x2="10" y2="17" />
              <line x1="14" y1="11" x2="14" y2="17" />
            </svg>
          </button>
          </div>
        </td>
      </tr>
    ))}
  </tbody>
</table>
</div>
      {/* ---------- EDIT FORM BELOW THE LIST (ONLY WHEN EDITING) ---------- */}
      
     {supplier && (
  <div className="inventory-form">
    <h4 className="inventory-title-supplier">
    {supplier.SupplierId === 0 ? "Enter New Supplier Details" : `Edit Supplier — ${supplier.SupplierName}` }
    </h4>

    <div className="form-body">

      <div className="form-group wide">
        <label>Supplier Name *</label>
        <input
  value={supplier.SupplierName}
  className={errors.SupplierName ? "input-error" : ""}
  onChange={(e) => {
    handleChange("SupplierName", e.target.value);

    if (errors.SupplierName) {
      setErrors(prev => ({ ...prev, SupplierName: null }));
    }
  }}
/>

{errors.SupplierName && (
  <div className="error-text">{errors.SupplierName}</div>
)}
      </div>

      <div className="form-group wide">
        <label>Contact Person</label>
        <input
          type="text"
          value={supplier.ContactPerson}
          onChange={(e) => handleChange("ContactPerson", e.target.value)}
        />
      </div>

      <div className="form-group small">
        <label>Mobile</label>
       <input
  value={supplier.Mobile}
  className={errors.Mobile ? "input-error" : ""}
  onChange={(e) => {
    handleChange("Mobile", e.target.value);

    if (errors.Mobile) {
      setErrors(prev => ({ ...prev, Mobile: null }));
    }
  }}
/>

{errors.Mobile && (
  <div className="error-text">{errors.Mobile}</div>
)}
      </div>

      <div className="form-group wide">
        <label>Email</label>
        <input
          type="text"
          value={supplier.Email}
          onChange={(e) => handleChange("Email", e.target.value)}
        />
      </div>

      <div className="form-group small">
        <label>GSTIN</label>
        <input
  value={supplier.GSTIN}
  className={errors.GSTIN ? "input-error" : ""}
  onChange={(e) => {
    handleChange("GSTIN", e.target.value);

    if (errors.GSTIN) {
      setErrors(prev => ({ ...prev, GSTIN: null }));
    }
  }}
/>

{errors.GSTIN && (
  <div className="error-text">{errors.GSTIN}</div>
)}
      </div>

      <div className="form-group address">
        <label>Address</label>
        <textarea
          value={supplier.Address}
          onChange={(e) => handleChange("Address", e.target.value)}
        />
      </div>

      <div className="form-group mid">
        <label>City</label>
        <input
          type="text"
          value={supplier.City}
          onChange={(e) => handleChange("City", e.target.value)}
        />
      </div>

    <div className="form-group mid">
  <label>State *</label>

  <select
    value={supplier.State}
    className={errors.State ? "input-error" : ""}
    onChange={(e) => {
      handleChange("State", e.target.value);

      if (errors.State) {
        setErrors(prev => ({ ...prev, State: null }));
      }
    }}
  >
    <option value="">-- Select State --</option>
    {INDIAN_STATES.map(s => (
      <option key={s} value={s}>{s}</option>
    ))}
  </select>

  {/* ✅ ADD THIS */}
  {errors.State && (
    <div className="error-text">{errors.State}</div>
  )}
</div>


      <div className="form-group small">
        <label>Pincode</label>
        <input
          type="text"
          value={supplier.Pincode}
          onChange={(e) => handleChange("Pincode", e.target.value)}
        />
      </div>

      {supplier.SupplierId === 0 && (
        <div className="form-group small">
          <label>Opening Balance</label>
          <input
            type="number"
            value={supplier.OpeningBalance}
            onChange={(e) =>
              handleChange(
                "OpeningBalance",
                e.target.value === "" ? 0 : parseFloat(e.target.value) || 0
              )
            }
          />
        </div>
      )}

      <div className="form-group small">
        <label>Balance</label>
        <input type="number" value={supplier.Balance || 0} readOnly />
      </div>
    </div>

    <div className="inventory-btns">
      <button
        type="submit"
        className="btn-submit small"
        onClick={handleSave}
        disabled={saving}
      >
        {saving ? "Saving..." : "Save"}
      </button>
      <button
        type="button"
        className="btn-submit small"
        onClick={() => {
  setSupplier(null);
  setErrors({});
}}
      >
        Cancel
      </button>
    </div>
  </div>
)}


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

export default SupplierPage;
