import React, { useState, useEffect } from "react";
import "./ItemForms.css";
import "./SupplierPage.css"; // for table styles
import { getCreatedBy } from "../../utils/authHelper";

export default function GstMaster() {
  const initialFormState = {
  id: 0,
  gstPercent: "",
  isActive: 1,   // 🔥 number, not boolean
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
          setModal({
  show: true,
  message: "GST saved successfully",
  onClose: () => {
    resetForm();
    loadGstList();
  }
});
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
    <>
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
          <table className="data-gsttable">
  <thead>
    <tr>
      <th>#</th> {/* ✅ Serial No */}
      <th>GST %</th>
      <th>Status</th>
      <th>Edit</th>
    </tr>
  </thead>

  <tbody>
    {gstList.map((g, index) => (
      <tr key={g.Id}>
        {/* ✅ Serial Number */}
        <td>{index + 1}</td>

        <td>{g.GstPercent}</td>
        <td>{g.IsActive === 1 ? "Active" : "Inactive"}</td>

        <td>
          <button
            className="invaction-btn invaction-modify"
            onClick={() => editGst(g)}
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
