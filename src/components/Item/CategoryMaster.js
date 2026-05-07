import React, { useState, useEffect } from "react";
import "./ItemForms.css";
import { getCreatedBy } from "../../utils/authHelper";
import { validateCategoryForm } from "../../utils/validateCategoryForm";

export default function CategoryMaster() {
  const initialFormState = {
    id: 0,
    categoryName: "",
    description: "",
    defaultHsnId: "",
    defaultGstId: "",
    isActive: 1,
    createdBy: "",
    updatedBy: ""
  };

  const [form, setForm] = useState(initialFormState);
  const [errors, setErrors] = useState({});
  const [categories, setCategories] = useState([]);
  const [hsnList, setHsnList] = useState([]);
  const [gstList, setGstList] = useState([]);
const [searchText, setSearchText] = useState("");
const filteredCategories = categories.filter(c =>
  (c.categoryName || c.CategoryName || "")
    .toLowerCase()
    .includes(searchText.toLowerCase())
);
  // 🔁 Reset to create mode
  const resetForm = () => {
    setForm(initialFormState);
    setErrors({});
  };
const [modal, setModal] = useState({
  show: false,
  message: ""
});
  // ✍️ Handle change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  // 💾 Save Category
  const handleSubmit = (e) => {
  e.preventDefault();

  const validationErrors = validateCategoryForm(form);
  if (Object.keys(validationErrors).length > 0) {
    setErrors(validationErrors);
    return;
  }

  setErrors({});

  const user = getCreatedBy();

  const payload = {
    category: {
      ...form,
      defaultHsnId: form.defaultHsnId
        ? parseInt(form.defaultHsnId)
        : null,
      defaultGstId: form.defaultGstId
        ? parseInt(form.defaultGstId)
        : null,
      createdBy: form.id === 0 ? user : undefined,
      updatedBy: form.id !== 0 ? user : undefined
    }
  };

  window.chrome?.webview?.postMessage({
    Action: "saveCategory",
    Payload: payload
  });
};


  // 🔍 Load list
  const loadCategories = () => {
    window.chrome?.webview?.postMessage({
      Action: "searchCategory",
      Payload: { keyword: "" }
    });
  };

  // ✏️ Edit
  const editCategory = (c) => {
    setForm({
      id: c.id ?? c.Id,
      categoryName: c.categoryName ?? c.CategoryName,
      description: c.description ?? c.Description ?? "",
      defaultHsnId: c.defaultHsnId ?? c.DefaultHsnId ?? "",
      defaultGstId: c.defaultGstId ?? c.DefaultGstId ?? "",
      isActive: c.isActive ?? c.IsActive,
      createdBy: "",
      updatedBy: ""
    });
    setErrors({});
  };

  // 📩 WebView listener
  useEffect(() => {
    const handler = (event) => {
      let msg = event.data;
      if (typeof msg === "string") msg = JSON.parse(msg);

      if (msg.action === "saveCategoryResult") {
        if (msg.success) {
         setModal({
  show: true,
  message: "Category saved successfully"
});
          resetForm();
          loadCategories();
        } else {
          setErrors(msg.errors || {});
        }
      }

      if (msg.action === "searchCategoryResult" && msg.success) {
        setCategories(msg.data || []);
      }

      if (msg.action === "getActiveHsnListResult" && msg.success) {
        setHsnList(msg.data || []);
      }

      if (msg.action === "getActiveGstListResult" && msg.success) {
        setGstList(msg.data || []);
      }
    };

    window.chrome?.webview?.addEventListener("message", handler);

    // initial loads
    loadCategories();
    window.chrome?.webview?.postMessage({ Action: "getActiveHsnList" });
    window.chrome?.webview?.postMessage({ Action: "getActiveGstList" });

    return () =>
      window.chrome?.webview?.removeEventListener("message", handler);
  }, []);

  return (
    <>
    <div className="form-container">

      {/* 🔮 CENTERED PURPLE HEADER */}
      <div className="item-nav-wrapper category-header">
        <div className="category-header-center">
          <span className="category-icon">🗂️</span>
          <h2 className="category-title">Category Master</h2>
          <span
            className="category-help"
            title="Category with default HSN and GST"
          >
            ℹ️
          </span>
        </div>
      </div>

      {/* FORM */}
      <div className="form-inner">
        <form className="form-body" onSubmit={handleSubmit}>
          <div className="form-row">

            {/* CATEGORY NAME */}
            <div className="form-group">
              <label>Category Name</label>
              <input
                name="categoryName"
                value={form.categoryName}
                onChange={handleChange}
                className={errors.CategoryName ? "error-input" : ""}
                placeholder="Enter category name"
              />
              {errors.CategoryName && (
                <div className="error">{errors.CategoryName}</div>
              )}
            </div>

            {/* DESCRIPTION */}
            <div className="form-group">
              <label>Description</label>
              <input
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Optional description"
              />
            </div>

            {/* DEFAULT HSN */}
            <div className="form-group">
              <label>Default HSN</label>
              <select
                name="defaultHsnId"
                value={form.defaultHsnId}
                onChange={handleChange}
              >
                <option value="">-- Select HSN --</option>
                {hsnList.map((h) => (
                  <option key={h.Id} value={h.Id}>
                    {h.HsnCode}
                  </option>
                ))}
              </select>
              {errors.DefaultHsnId && (
                <div className="error">{errors.DefaultHsnId}</div>
              )}
            </div>

            {/* DEFAULT GST */}
            <div className="form-group">
              <label>Default GST (%)</label>
              <select
                name="defaultGstId"
                value={form.defaultGstId}
                onChange={handleChange}
              >
                <option value="">-- Select GST --</option>
                {gstList.map((g) => (
                  <option key={g.Id} value={g.Id}>
                    {g.GstPercent}
                  </option>
                ))}
              </select>
              {errors.DefaultGstId && (
                <div className="error">{errors.DefaultGstId}</div>
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
              {form.id === 0 ? "Save Category" : "Update Category"}
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
      {categories.length > 0 && (
        <div className="table-container">
          <h3 className="table-title">📋 Category Master</h3>
          <div className="table-search-bar">
  <input
    type="text"
    placeholder="Search by category..."
    value={searchText}
    onChange={(e) =>
      setSearchText(e.target.value)
    }
    className="table-search-input"
  />
</div>
          <table className="data-categorytable">
  <thead>
    <tr>
      <th>#</th> {/* ✅ Serial No */}
      <th>Category</th>
      <th>HSN</th>
      <th>GST %</th>
      <th>Status</th>
      <th>Edit</th>
    </tr>
  </thead>

  <tbody>
    {filteredCategories.map((c, index) => (
      <tr key={c.id ?? c.Id}>
        {/* ✅ Serial Number */}
        <td>{index + 1}</td>

        <td>{c.categoryName ?? c.CategoryName}</td>
        <td>{c.DefaultHsnCode ?? "-"}</td>
        <td>{c.DefaultGstPercent ?? "-"}</td>
        <td>
          {(c.isActive ?? c.IsActive) === 1 ? "Active" : "Inactive"}
        </td>

        <td>
          <button
            className="invaction-btn invaction-modify"
            onClick={() => editCategory(c)}
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
          onClick={() => setModal({ show: false })}
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
