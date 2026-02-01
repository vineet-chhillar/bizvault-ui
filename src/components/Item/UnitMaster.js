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
          alert("✅ Unit saved successfully");
          resetForm();
          loadUnitList();
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
          <table className="data-table">
            <thead>
              <tr>
                <th>Unit Name</th>
                <th>Status</th>
                <th>Edit</th>
              </tr>
            </thead>
            <tbody>
              {unitList.map((u) => (
                <tr key={u.id ?? u.Id}>
                  <td>{u.unitName ?? u.UnitName}</td>
                  <td>{(u.isActive ?? u.IsActive) === 1 ? "Active" : "Inactive"}</td>
                  <td>
                    <button
                      className="invaction-btn small"
                      onClick={() => editUnit(u)}
                    >
                      ✏️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
}
