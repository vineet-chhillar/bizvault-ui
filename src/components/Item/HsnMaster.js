import React, { useState, useEffect } from "react";
import "./SupplierPage.css";
import "./ItemForms.css";
import ItemNavBar from "./ItemNavBar"; // reuse nav
import { getCreatedBy } from "../../utils/authHelper";

export default function HsnMaster() {
  const [form, setForm] = useState({
    id: 0,
    hsnCode: "",
    description: "",
    isActive: true,
    createdBy: "",
    updatedBy: ""
  });
const resetForm = () => {
  setForm({
    id: 0,
    hsnCode: "",
    description: "",
    isActive: true,
    createdBy: "",
    updatedBy: ""
  });
  setErrors({});
};
const [modal, setModal] = useState({
  show: false,
  message: "",
  onClose: null
});
  const [errors, setErrors] = useState({});
  const [hsnList, setHsnList] = useState([]);
const [searchText, setSearchText] = useState("");
const filteredHsnList = hsnList.filter(h =>
  (h.HsnCode || "")
    .toLowerCase()
    .includes(searchText.toLowerCase())
);
  // 🔹 Handle input change
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  // 🔹 Submit (Create / Update)
  const handleSubmit = (e) => {
    e.preventDefault();
    setErrors({});

    const user = getCreatedBy();

    const payload = {
      hsn: {
        ...form,
        createdBy: form.id === 0 ? user : undefined,
        updatedBy: form.id !== 0 ? user : undefined
      }
    };

    window.chrome?.webview?.postMessage({
      Action: "saveHsn",
      Payload: payload
    });
  };

  // 🔹 Load list
  const loadHsnList = () => {
    window.chrome?.webview?.postMessage({
      Action: "searchHsn",
      Payload: { keyword: "" }
    });
  };

  // 🔹 Edit
  const editHsn = (hsn) => {
  setForm({
    id: hsn.Id,
    hsnCode: hsn.HsnCode,
    description: hsn.Description,
    isActive: hsn.IsActive,
    createdBy: "",
    updatedBy: ""
  });
  setErrors({});
};


  // 🔹 Message listener
  useEffect(() => {
    const handler = (event) => {
      let msg = event.data;
      if (typeof msg === "string") msg = JSON.parse(msg);

      // ✅ Save response
      if (msg.action === "saveHsnResult") {
        if (msg.success) {
          setModal({
  show: true,
  message: "HSN saved successfully",
  onClose: () => {
    resetForm();
    loadHsnList();
  }
});
          resetForm(); 
          loadHsnList();
        } else {
          setErrors(msg.errors || {});
        }
      }

      // ✅ Search response
      if (msg.action === "searchHsnResult" && msg.success) {
        setHsnList(msg.data || []);
      }
    };

    window.chrome?.webview?.addEventListener("message", handler);
    loadHsnList();

    return () =>
      window.chrome?.webview?.removeEventListener("message", handler);
  }, []);

  return (
    <>
    <div className="form-container">
     <div className="item-nav-wrapper hsn-header">
  <div className="hsn-header-center">
    <span className="hsn-icon">🧾</span>
    <h2 className="hsn-title">HSN Master</h2>
    <span
      className="hsn-help"
      title="Harmonized System of Nomenclature (6 digit code)"
    >
      ℹ️
    </span>
  </div>
</div>



      <div className="form-inner">
        <form className="form-body" onSubmit={handleSubmit}>
          <div className="form-row">

            {/* HSN CODE */}
            <div className="form-group">
              <label>HSN Code (6 digits)</label>
              <input
                name="hsnCode"
                value={form.hsnCode}
                onChange={handleChange}
                maxLength={6}
                className={errors.HsnCode ? "error-input" : ""}
                placeholder="Enter 6 digit HSN"
              />
              {errors.HsnCode && <div className="error">{errors.HsnCode}</div>}
            </div>

            {/* DESCRIPTION */}
            <div className="form-group">
              <label>Description</label>
              <input
                name="description"
                value={form.description}
                onChange={handleChange}
                className={errors.Description ? "error-input" : ""}
                placeholder="Enter description"
              />
              {errors.Description && (
                <div className="error">{errors.Description}</div>
              )}
            </div>

            {/* ACTIVE */}
            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  name="isActive"
                  checked={form.isActive}
                  onChange={handleChange}
                />
                Active
              </label>
            </div>

          </div>

         <div className="inventory-btns">
  <button type="submit" className="btn-submit small">
    {form.id === 0 ? "Save HSN" : "Update HSN"}
  </button>

  {form.id !== 0 && (
    <button
      type="button"
      className="btn-cancel small"
      onClick={resetForm}
    >
      Cancel
    </button>
  )}
</div>

        </form>
      </div>

      {/* LIST */}
      {hsnList.length > 0 && (
        <div className="table-container">
          <h3 className="table-title">📋 HSN Master</h3>
          <div className="table-search-bar">
  <input
    type="text"
    placeholder="Search by HSN Code..."
    value={searchText}
    onChange={(e) =>
      setSearchText(e.target.value)
    }
    className="table-search-input"
  />
</div>
          <table className="data-hsntable">
  <thead>
    <tr>
      <th>#</th> {/* ✅ Serial No */}
      <th>HSN Code</th>
      <th>Description</th>
      <th>Status</th>
      <th>Edit</th>
    </tr>
  </thead>

  <tbody>
    {filteredHsnList.map((h, index) => (
      <tr key={h.Id}>
        {/* ✅ Serial Number */}
        <td>{index + 1}</td>

        <td>{h.HsnCode}</td>
        <td>{h.Description}</td>
        <td>{h.IsActive ? "Active" : "Inactive"}</td>
        <td>
          <button
            className="invaction-btn invaction-modify"
            onClick={() => editHsn(h)}
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
        </td>
      </tr>
    ))}
  </tbody>
</table>
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
