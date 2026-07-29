import React, { useState, useEffect } from "react";
import "./ItemForms.css";
import ItemNavBar from "./ItemNavBar";
import { validateItemForm } from "../../utils/validateItemForm";
import { getCreatedBy } from "../../utils/authHelper";
const EditItem = () => {
  const [items, setItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState(null);

  const [categories, setCategories] = useState([]);
  const [units, setUnits] = useState([]);
const [hsnList, setHsnList] = useState([]);
  const [errors, setErrors] = useState({});
const [searchTerm, setSearchTerm] = useState("");
  // -----------------------------------------------------------
  // Format date for <input type="date">
  // -----------------------------------------------------------
  function formatDateForInput(dateStr) {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (isNaN(d)) return "";
    return d.toISOString().split("T")[0];
  }

  // -----------------------------------------------------------
  // Auto-fill HSN + GST on selecting category
  // -----------------------------------------------------------
  
const [modal, setModal] = useState({
  show: false,
  message: "",
  type: "info",
  onClose: null
});
  // -----------------------------------------------------------
  // HANDLE INCOMING MESSAGES FROM C#
  // -----------------------------------------------------------
  useEffect(() => {
    const handleMessage = (event) => {
      let data = event.data;

      try {
        if (typeof data === "string") data = JSON.parse(data);
      } catch {
        return;
      }

      // Search results
      if (data.action === "searchItemsResponse") {
        setItems(data.items);
      }

      // Auto-fill on category selection
      

      // Update response
      // NEW ✅
if (data.Type === "UpdateItemResult") {

  // 🔴 Validation errors
  if (data.Status === "ValidationFailed") {
  const errors = data.Data?.Errors || {};
  setErrors(errors);

  // 🔥 Convert errors object → readable message
  const message = Object.values(errors).join("\n");

  setModal({
    show: true,
    message: message || data.Message || "Validation failed",
    type: "error"
  });

  return;
}

  // ❌ Backend error
  if (data.Status === "Error") {
    setModal({
      show: true,
      message: data.Message || "Something went wrong",
      type: "error"
    });
    return;
  }

  // ✅ Success
  if (data.Status === "Success") {
    setErrors({});

    setModal({
      show: true,
      message: data.Message,
      type: "success",
      onClose: () => {
        setFormData(null);
        handleSearch(searchQuery);
      }
    });
  }
}

      // Category master
      if (data.Type === "GetCategoryList" && data.Status === "Success") {
        setCategories(data.Data || []);
      }

      // Unit master
      if (data.Type === "GetAllUnits" && data.Status === "Success") {
        setUnits(data.Data || []);
      }
      if (data.action === "getActiveHsnListResult" && data.success) 
        {
            setHsnList(data.data || []);
        }

    };

    // Add listener
    if (window.chrome?.webview) {
      window.chrome.webview.addEventListener("message", handleMessage);

      // Fetch masters
      window.chrome.webview.postMessage({ Action: "GetCategoryList", Payload: {} });
      window.chrome.webview.postMessage({ Action: "GetAllUnitsList", Payload: {} });
      window.chrome.webview.postMessage({Action: "getActiveHsnList", Payload: {}});
      // Load items
      handleSearch("");
    }

    return () => {
      window.chrome?.webview?.removeEventListener("message", handleMessage);
    };
  }, []);
const handleHsnChange = (e) => {
  const value = e.target.value;

  if (!value) {
    setFormData(prev => ({
  ...prev,
  HsnId: id,
  HsnCode: hsn?.HsnCode || "",
  GstId: hsn?.GstId ?? "",
  GstPercent: hsn?.GstPercent ?? ""
}));

    return;
  }

  const id = parseInt(value, 10);
  const hsn = hsnList.find(h => h.Id === id);

  setFormData(prev => ({
    ...prev,
    HsnId: id,
    HsnCode: hsn?.HsnCode || "",
    GstId: hsn?.GstId || "",
    GstPercent: hsn?.GstPercent || ""
  }));

  setErrors(prev => {
    const copy = { ...prev };
    delete copy.HsnId;
    return copy;
  });
};
  // -----------------------------------------------------------
  // Search items
  // -----------------------------------------------------------
  const handleSearch = (query) => {
    setSearchQuery(query);

    if (window.chrome?.webview) {
      window.chrome.webview.postMessage({
        action: "searchItems",
        payload: { query },
      });
    }
  };

  // -----------------------------------------------------------
  // Handle edit form changes
  // -----------------------------------------------------------
  const handleChange = (e) => {
  const { name, value } = e.target;

  setFormData((prev) => ({
    ...prev,
    [name]:
      name === "ReorderLevel"
        ? Number(value)
        : name === "Date"
        ? formatDateForInput(value)
        : value,
  }));

  // 🔥 Clear field error
  setErrors((prev) => {
    const copy = { ...prev };
    delete copy[name];
    return copy;
  });
};

  // -----------------------------------------------------------
  // Save updated item
  // -----------------------------------------------------------
  const handleSave = (e) => {
    e.preventDefault();
    if (!formData) return;

    const itemErrors = validateItemForm(formData);

    if (itemErrors.length > 0) {
      const map = {};
      itemErrors.forEach((e) => (map[e.field] = e.message));
      setErrors(map);
      return;
    }

    if (window.chrome?.webview) {
      window.chrome.webview.postMessage({
        action: "updateItem",
        payload: {
          id: formData.Id,
          hsnid: formData.HsnId,
          name: formData.Name,
          itemcode: formData.ItemCode,
          categoryid: formData.CategoryId,
          date: formData.Date,
          description: formData.Description,
          unitid: formData.UnitId,
          gstid: Number(formData.GstId),
          reorderlevel: Number(formData.ReorderLevel),
          isactive: Number(formData.IsActive),   // 🔥 ADD THIS
          updatedby: getCreatedBy(),
        },
      });
    }
  };
const filteredItems = items.filter((i) =>
  i.Name?.toLowerCase().includes(searchTerm.toLowerCase())
);
  // -----------------------------------------------------------
  // Delete item
  // -----------------------------------------------------------
  

  // -----------------------------------------------------------
  // UI Rendering
  // -----------------------------------------------------------
  return (
    <>
    <div className="inventory-form">
      <div className="item-nav-wrapper">
        <ItemNavBar />
      </div>

      {/* Search + table */}
      <div className="table-container">
        <div className="table-header">
          <h3 className="table-title">📋 Items List</h3>

           

  <div className="table-search-bar">
  <input
    type="text"
    placeholder="Search by item name..."
    value={searchTerm}
     onChange={(e) => setSearchTerm(e.target.value)}
    className="table-search-input"
  />
</div>
        </div>

        <table className="data-itemedittable">
          <thead>
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>Item Code</th>
              <th>HSN</th>
              <th>Category</th>
              <th>Date</th>
              <th>Description</th>
              <th>Unit</th>
              <th>GST %</th>
              <th>Reorder</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
  {filteredItems.length > 0 ? (
    filteredItems.map((i, index) => (
      <tr key={i.Id}>
        {/* ✅ Serial Number */}
        <td>{index + 1}</td>

        <td>{i.Name}</td>
        <td>{i.ItemCode}</td>
        <td>{i.HsnCode}</td>
        <td>{i.CategoryName}</td>
        <td>{i.Date}</td>
        <td>{i.Description}</td>
        <td>{i.UnitName}</td>
        <td>{i.GstPercent}</td>
        <td>{i.ReorderLevel}</td>

        <td>
          <span
            className={Number(i.IsActive) === 1 ? "status-active" : "status-inactive"}
          >
            {Number(i.IsActive) === 1 ? "Active" : "Inactive"}
          </span>
        </td>

        <td>
          {/* Edit */}
          <button
            className="invaction-btn invaction-modify"
            onClick={() =>
              setFormData({
                ...i,
                 HsnId: Number(i.HsnId),
    IsActive: Number(i.IsActive),
    CategoryId: String(i.CategoryId),
    UnitId: String(i.UnitId),
    GstId: i.GstId,
    GstPercent: i.GstPercent,
    Date: formatDateForInput(i.Date),
    ReorderLevel: i.ReorderLevel ?? 0,
              })
            }
          >
            ✏️
          </button>
        </td>
      </tr>
    ))
  ) : (
    <tr>
      <td colSpan="12" style={{ textAlign: "center" }}>
        🔍 No matching items found
      </td>
    </tr>
  )}
</tbody>
        </table>
      </div>

      {/* Edit form */}
      {formData && (
        <div className="inventory-body">
          <h3 className="inventory-title">
            🏷️ Edit Item: <span>{formData.Name}</span>
          </h3>

          <div className="form-row-horizontal">
            {/* Name */}
            <div className="form-group">
              <label>Name</label>
              <input
                name="Name"
                value={formData.Name || ""}
                onChange={handleChange}
              />
            </div>

            {/* Code */}
            <div className="form-group">
              <label>Item Code</label>
              <input
                name="ItemCode"
                value={formData.ItemCode || ""}
                onChange={handleChange}
              />
            </div>

            {/* HSN */}
           <div className="form-group">
  <label>HSN</label>

  <select
    name="HsnId"
    value={formData.HsnId || ""}
    onChange={handleHsnChange}
    className={errors.HsnId ? "error-input" : ""}
  >
    <option value="">-- Select HSN --</option>

    {hsnList.map((h) => (
      <option key={h.Id} value={h.Id}>
        {h.HsnCode} - {h.Description}
      </option>
    ))}
  </select>

  {errors.HsnId && (
    <div className="error">{errors.HsnId}</div>
  )}
</div>
            {/* Category */}
            <div className="form-group">
              <label>Category</label>
              <select
                name="CategoryId"
                value={formData.CategoryId || ""}
                onChange={(e) => {
                  handleChange(e);
                  
                }}
              >
                <option value="">-- Select --</option>
                {categories.map((c) => (
                  <option key={c.Id} value={c.Id}>
                    {c.CategoryName}
                  </option>
                ))}
              </select>
            </div>

            {/* Date */}
            <div className="form-group">
              <label>Date</label>
              <input
                type="date"
                name="Date"
                value={formData.Date || ""}
                onChange={handleChange}
              />
            </div>

            {/* Description */}
            <div className="form-group">
              <label>Description</label>
              <input
                name="Description"
                value={formData.Description || ""}
                onChange={handleChange}
              />
            </div>

            {/* Unit */}
            <div className="form-group">
              <label>Unit</label>
              <select
                name="UnitId"
                value={formData.UnitId || ""}
                onChange={handleChange}
              >
                <option value="">-- Select --</option>
                {units.map((u) => (
                  <option key={u.Id} value={u.Id}>
                    {u.UnitName}
                  </option>
                ))}
              </select>
            </div>

            {/* GST - readonly */}
            <div className="form-group">
              <label>GST (%)</label>
              <input
                name="GstPercent"
                value={formData.GstPercent || ""}
                readOnly
                className="readonly-input"
                placeholder="Auto-filled from HSN"
              />
            </div>

            {/* Reorder */}
            <div className="form-group">
              <label>Reorder Level</label>
              <input
                type="number"
                name="ReorderLevel"
                value={formData.ReorderLevel || ""}
                onChange={handleChange}
              />
            </div>
{/* STATUS */}
<div className="form-group checkbox-group">
  <label>
    <input
      type="checkbox"
      checked={Number(formData.IsActive) === 1}
      onChange={(e) =>
        setFormData((prev) => ({
          ...prev,
          IsActive: e.target.checked ? 1 : 0,
        }))
      }
    />
    Active
  </label>
</div>


          </div>

          {/* Buttons */}
          <div className="inventory-btns" style={{ marginTop: "0" }}>
            <button className="btn-submit small" onClick={handleSave}>
              💾 Save
            </button>

            <button
              className="btn-submit small"
              onClick={() => setFormData(null)}
            >
              ❌ Cancel
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
};

export default EditItem;
