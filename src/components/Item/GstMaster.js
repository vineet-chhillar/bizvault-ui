import React, { useState, useEffect } from "react";
import "./ItemForms.css";
import { getCreatedBy } from "../../utils/authHelper";

export default function GstMaster() {
  const initialFormState = {
  id: 0,
  gstPercent: "",
  isActive: 1,   // 🔥 number, not boolean
  createdBy: "",
  updatedBy: ""
};


  const [form, setForm] = useState(initialFormState);
  const [errors, setErrors] = useState({});
  const [gstList, setGstList] = useState([]);

  // 🔁 Reset to page-load state
  const resetForm = () => {
    setForm(initialFormState);
    setErrors({});
  };

  // ✍️ Handle input change
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  // 💾 Save GST (Create / Update)
  const handleSubmit = (e) => {
    e.preventDefault();
    setErrors({});

    const user = getCreatedBy();

    const payload = {
      gst: {
        ...form,
        createdBy: form.id === 0 ? user : undefined,
        updatedBy: form.id !== 0 ? user : undefined
      }
    };

    window.chrome?.webview?.postMessage({
      Action: "saveGst",
      Payload: payload
    });
  };

  // 🔍 Load GST list
  const loadGstList = () => {
    window.chrome?.webview?.postMessage({
      Action: "searchGst",
      Payload: { keyword: "" }
    });
  };

  // ✏️ Edit GST
 const editGst = (gst) => {
  setForm({
    id: gst.Id,
    gstPercent: gst.GstPercent,
    isActive: gst.IsActive, // already 0 or 1
    createdBy: "",
    updatedBy: ""
  });
};


  // 📩 WebView message listener
  useEffect(() => {
    const handler = (event) => {
      let msg = event.data;
      if (typeof msg === "string") msg = JSON.parse(msg);

      // ✅ Save response
      if (msg.action === "saveGstResult") {
        if (msg.success) {
          alert("✅ GST saved successfully");
          resetForm();
          loadGstList();
        } else {
          setErrors(msg.errors || {});
        }
      }

      // ✅ Search response
      if (msg.action === "searchGstResult" && msg.success) {
        setGstList(msg.data || []);
      }
    };

    window.chrome?.webview?.addEventListener("message", handler);
    loadGstList();

    return () =>
      window.chrome?.webview?.removeEventListener("message", handler);
  }, []);

  return (
    <div className="form-container">

      {/* 🔮 CENTERED PURPLE HEADER */}
      <div className="item-nav-wrapper gst-header">
        <div className="gst-header-center">
          <span className="gst-icon">💸</span>
          <h2 className="gst-title">GST Master</h2>
          <span
            className="gst-help"
            title="Goods and Services Tax percentage"
          >
            ℹ️
          </span>
        </div>
      </div>

      {/* FORM */}
      <div className="form-inner">
        <form className="form-body" onSubmit={handleSubmit}>
          <div className="form-row">

            {/* GST PERCENT */}
            <div className="form-group">
              <label>GST (%)</label>
              <input
                name="gstPercent"
                value={form.gstPercent}
                onChange={handleChange}
                placeholder="e.g. 5, 12, 18, 28"
                className={errors.GstPercent ? "error-input" : ""}
              />
              {errors.GstPercent && (
                <div className="error">{errors.GstPercent}</div>
              )}
            </div>

            {/* ACTIVE */}
            <div className="form-group checkbox-group">
              <label>
               <input
  type="checkbox"
  checked={form.isActive === 1}
  onChange={(e) =>
    setForm(prev => ({
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
              {form.id === 0 ? "Save GST" : "Update GST"}
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
      {gstList.length > 0 && (
        <div className="table-container">
          <h3 className="table-title">📋 GST Master</h3>
          <table className="data-table">
            <thead>
              <tr>
                <th>GST %</th>
                <th>Status</th>
                <th>Edit</th>
              </tr>
            </thead>
            <tbody>
              {gstList.map((g) => (
                <tr key={g.Id}>
                  <td>{g.GstPercent}</td>
                  <td>{g.IsActive === 1 ? "Active" : "Inactive"}</td>

                  <td>
                    <button
                      className="invaction-btn small"
                      onClick={() => editGst(g)}
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
