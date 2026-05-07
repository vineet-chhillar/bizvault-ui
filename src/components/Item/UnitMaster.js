import React, { useState, useEffect } from "react";
import "./ItemForms.css";
import { getCreatedBy } from "../../utils/authHelper";

export default function UnitMaster() {
  const initialFormState = {
    id: 0,
    unitName: "",
    isActive: 1, // 1 = Active, 0 = Inactive
    createdBy: "",
    updatedBy: ""
  };
const [modal, setModal] = useState({
  show: false,
  message: "",
  onClose: null
});
  const [form, setForm] = useState(initialFormState);
  const [errors, setErrors] = useState({});
  const [unitList, setUnitList] = useState([]);

  // 🔁 Reset to page-load state
  const resetForm = () => {
    setForm(initialFormState);
    setErrors({});
  };

  // ✍️ Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  // 💾 Save Unit (Create / Update)
  const handleSubmit = (e) => {
    e.preventDefault();
    setErrors({});

    const user = getCreatedBy();

    const payload = {
      unit: {
        ...form,
        createdBy: form.id === 0 ? user : undefined,
        updatedBy: form.id !== 0 ? user : undefined
      }
    };

    window.chrome?.webview?.postMessage({
      Action: "saveUnit",
      Payload: payload
    });
  };

  // 🔍 Load Unit list
  const loadUnitList = () => {
    window.chrome?.webview?.postMessage({
      Action: "searchUnit",
      Payload: { keyword: "" }
    });
  };

  // ✏️ Edit Unit
  const editUnit = (u) => {
    setForm({
      id: u.id ?? u.Id,
      unitName: u.unitName ?? u.UnitName,
      isActive: u.isActive ?? u.IsActive,
      createdBy: "",
      updatedBy: ""
    });
    setErrors({});
  };

  // 📩 WebView message listener
  useEffect(() => {
    const handler = (event) => {
      let msg = event.data;
      if (typeof msg === "string") msg = JSON.parse(msg);

      // ✅ Save response
      if (msg.action === "saveUnitResult") {
        if (msg.success) {
          setModal({
  show: true,
  message: "Unit saved successfully",
  onClose: () => {
    resetForm();
    loadUnitList();
  }
});
        } else {
          setErrors(msg.errors || {});
        }
      }

      // ✅ Search response
      if (msg.action === "searchUnitResult" && msg.success) {
        setUnitList(msg.data || []);
      }
    };

    window.chrome?.webview?.addEventListener("message", handler);
    loadUnitList();

    return () =>
      window.chrome?.webview?.removeEventListener("message", handler);
  }, []);

  return (
    <>
    <div className="form-container">

      {/* 🔮 CENTERED PURPLE HEADER */}
      <div className="item-nav-wrapper unit-header">
        <div className="unit-header-center">
          <span className="unit-icon">📏</span>
          <h2 className="unit-title">Unit Master</h2>
          <span
            className="unit-help"
            title="Units of measurement (Kg, Nos, Litre, etc.)"
          >
            ℹ️
          </span>
        </div>
      </div>

      {/* FORM */}
      <div className="form-inner">
        <form className="form-body" onSubmit={handleSubmit}>
          <div className="form-row">

            {/* UNIT NAME */}
            <div className="form-group">
              <label>Unit Name</label>
              <input
                name="unitName"
                value={form.unitName}
                onChange={handleChange}
                placeholder="e.g. Kg, Nos, Litre"
                className={errors.UnitName ? "error-input" : ""}
              />
              {errors.UnitName && (
                <div className="error">{errors.UnitName}</div>
              )}
            </div>

            {/* ACTIVE */}
            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  checked={form.isActive === 1}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      isActive: e.target.checked ? 1 : 0
                    }))
                  }
                />
                Active
              </label>
            </div>

          </div>

          {/* BUTTONS */}
          <div className="inventory-btns">
            <button type="submit" className="btn-submit small">
              {form.id === 0 ? "Save Unit" : "Update Unit"}
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
      {unitList.length > 0 && (
        <div className="table-container">
          <h3 className="table-title">📋 Unit Master</h3>
          <table className="data-unittable">
  <thead>
    <tr>
      <th>#</th> {/* ✅ Serial No */}
      <th>Unit Name</th>
      <th>Status</th>
      <th>Edit</th>
    </tr>
  </thead>

  <tbody>
    {unitList.map((u, index) => (
      <tr key={u.id ?? u.Id}>
        {/* ✅ Serial Number */}
        <td>{index + 1}</td>

        <td>{u.unitName ?? u.UnitName}</td>
        <td>{(u.isActive ?? u.IsActive) === 1 ? "Active" : "Inactive"}</td>

        <td>
          <button
            className="invaction-btn invaction-modify"
            onClick={() => editUnit(u)}
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
