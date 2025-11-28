import React, { useEffect, useState } from "react";
import "./SupplierPage.css";

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

      if (msg.success && msg.data) setSupplier(msg.data);
      else alert(msg.error || "Supplier not found");
    };

    window.chrome.webview.addEventListener("message", handler);
    window.chrome.webview.postMessage({
      Action: "loadSupplier",
      Payload: { SupplierId: id },
    });
  };

  // =====================================================
  // DELETE
  // =====================================================
  const handleDelete = (s) => {
    if (!window.chrome?.webview) return;
    if (!window.confirm(`Delete supplier "${s.SupplierName}"?`)) return;

    const handler = (event) => {
      const msg = event.data;
      if (!msg || msg.action !== "deleteSupplier") return;
      window.chrome.webview.removeEventListener("message", handler);

if (msg.success) {
  alert(msg.message || "Deleted successfully");
  loadSuppliers(keyword);
}

      if (msg.success) loadSuppliers(keyword);
      else alert(msg.error || "Delete failed");
    };

    window.chrome.webview.addEventListener("message", handler);
    window.chrome.webview.postMessage({
      Action: "deleteSupplier",
      Payload: { SupplierId: s.SupplierId },
    });
  };

  // =====================================================
  // SAVE
  // =====================================================
  const handleSave = () => {
    if (!window.chrome?.webview) return;
    // Required field
if (!supplier.SupplierName.trim()) {
  alert("Supplier Name is required");
  return;
}
if (!supplier.State || supplier.State.trim() === "") {
  alert("State is required");
  return;
}
// Optional mobile validation
if (supplier.Mobile && supplier.Mobile.trim() !== "") {
  if (supplier.Mobile.length !== 10 || !/^\d+$/.test(supplier.Mobile)) {
    alert("Mobile number must be 10 digits");
    return;
  }
}

// Optional GSTIN validation
if (supplier.GSTIN && supplier.GSTIN.trim() !== "") {
  if (supplier.GSTIN.length !== 15) {
    alert("GSTIN must be 15 characters");
    return;
  }
}

    setSaving(true);

    const handler = (event) => {
      const msg = event.data;
      if (!msg || msg.action !== "saveSupplier") return;
      window.chrome.webview.removeEventListener("message", handler);

      if (msg.success) {
  alert(msg.message || "Saved successfully");
  loadSuppliers(keyword);
}

      setSaving(false);

      if (msg.success) {
        loadSuppliers(keyword);
        // form should stay open after save
      } else {
        alert(msg.error || "Save failed");
      }
    };

    window.chrome.webview.addEventListener("message", handler);
    window.chrome.webview.postMessage({
      Action: "saveSupplier",
      Payload: supplier,
    });
  };

  const handleChange = (field, value) =>
    setSupplier((p) => ({ ...p, [field]: value }));

  // =====================================================
  // UI
  // =====================================================
  return (
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
    <input
    className="search-box"
      type="text"
      placeholder="Search by name, mobile, GSTIN..."
      value={keyword}
      onChange={(e) => setKeyword(e.target.value)}
      onKeyDown={(e) => e.key === "Enter" && loadSuppliers(keyword)}
    />
    <button className="btn-submit search" onClick={() => loadSuppliers(keyword)}>
      Search
    </button>
  </div>

  <button
    className="btn-submit small fullwidth"
    onClick={() => loadSupplierForEdit(0)}
  >
    + New Supplier
  </button>
</div>


      {loading && <div>Loading...</div>}

      <table className="data-table">
        <thead>
          <tr>
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
              <td colSpan={7} style={{ textAlign: "center" }}>
                No suppliers found
              </td>
            </tr>
          )}

          {suppliers.map((s) => (
            <tr key={s.SupplierId}>
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
    {/* Pencil/Edit Icon */}
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
  </svg>

  {/* Modify Inventory */}
</button>

<button
            className="invaction-btn invaction-delete"
            onClick={() => handleDelete(s)}
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
    {/* Trash/Delete Icon */}
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6m5 0V4a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v2" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
  </svg>

  {/* Delete Inventory */}
</button>

               
                
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ---------- EDIT FORM BELOW THE LIST (ONLY WHEN EDITING) ---------- */}
      
     {supplier && (
  <div className="inventory-form">
    <h3 className="inventory-title-supplier">
    {supplier.SupplierId === 0 ? "New Supplier" : `Edit Supplier — ${supplier.SupplierName}` }
    </h3>

    <div className="form-body">

      <div className="form-group wide">
        <label>Supplier Name *</label>
        <input
          type="text"
          value={supplier.SupplierName}
          onChange={(e) => handleChange("SupplierName", e.target.value)}
        />
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
          type="text"
          value={supplier.Mobile}
          onChange={(e) => handleChange("Mobile", e.target.value)}
        />
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
          type="text"
          value={supplier.GSTIN}
          onChange={(e) => handleChange("GSTIN", e.target.value)}
        />
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
    onChange={(e) => handleChange("State", e.target.value)}
    style={{
      borderColor: supplier.State ? "#ccc" : "red",
      padding: "6px"
    }}
  >
    <option value="">-- Select State --</option>
    {INDIAN_STATES.map(s => (
      <option key={s} value={s}>{s}</option>
    ))}
  </select>
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
        onClick={() => setSupplier(null)}
      >
        Cancel
      </button>
    </div>
  </div>
)}


    </div>
  );
}

export default SupplierPage;
