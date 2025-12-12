import React, { useState, useEffect } from "react";
import "./ItemForms.css";
import ItemNavBar from "./ItemNavBar";
import { validateItemForm } from "../../utils/validateItemForm";

const EditItem = () => {
  const [items, setItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState(null);

  const [categories, setCategories] = useState([]);
  const [units, setUnits] = useState([]);

  const [errors, setErrors] = useState({});

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
  const getCategoryById = (id) => {
    if (window.chrome?.webview) {
      window.chrome.webview.postMessage({
        Action: "GetCategoryById",
        Payload: { Id: parseInt(id) },
      });
    }
  };

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
      if (data.Type === "GetCategoryById" && data.Status === "Success") {
        const c = data.Data;

        setFormData((prev) => ({
          ...prev,
          CategoryId: c.Id,
          HsnCode: c.DefaultHsn,
          GstId: c.DefaultGstId,
          GstPercent: c.DefaultGstPercent,
        }));
      }

      // Update response
      if (data.action === "updateItem") {
        alert(data.message);
        if (data.success) {
          setFormData(null);
          handleSearch(searchQuery);
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
    };

    // Add listener
    if (window.chrome?.webview) {
      window.chrome.webview.addEventListener("message", handleMessage);

      // Fetch masters
      window.chrome.webview.postMessage({ Action: "GetCategoryList", Payload: {} });
      window.chrome.webview.postMessage({ Action: "GetAllUnitsList", Payload: {} });

      // Load items
      handleSearch("");
    }

    return () => {
      window.chrome?.webview?.removeEventListener("message", handleMessage);
    };
  }, []);

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
          hsncode: formData.HsnCode,
          name: formData.Name,
          itemcode: formData.ItemCode,
          categoryid: formData.CategoryId,
          date: formData.Date,
          description: formData.Description,
          unitid: formData.UnitId,
          gstid: formData.GstId,
          reorderlevel: Number(formData.ReorderLevel),
        },
      });
    }
  };

  // -----------------------------------------------------------
  // Delete item
  // -----------------------------------------------------------
  const deleteItem = (itemId) => {
    if (!window.chrome?.webview) return;

    window.chrome.webview.postMessage({
      action: "deleteItem",
      Payload: { Item_Id: itemId },
    });
  };

  // -----------------------------------------------------------
  // UI Rendering
  // -----------------------------------------------------------
  return (
    <div className="inventory-form">
      <div className="item-nav-wrapper">
        <ItemNavBar />
      </div>

      {/* Search + table */}
      <div className="table-container">
        <div className="table-header">
          <h3 className="table-title">📋 Items List</h3>

          <input
            type="text"
            placeholder="🔍 Search items..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="search-box"
          />
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Item Code</th>
              <th>HSN</th>
              <th>Category</th>
              <th>Date</th>
              <th>Description</th>
              <th>Unit</th>
              <th>GST %</th>
              <th>Reorder</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {items.length > 0 ? (
              items.map((i) => (
                <tr key={i.Id}>
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
                    {/* Edit */}
                    <button
                      className="invaction-btn invaction-modify"
                      onClick={() =>
                        setFormData({
                          ...i,
                          CategoryId: String(i.CategoryId),
                          UnitId: String(i.UnitId),
                          GstId: String(i.GstId),
                          GstPercent: i.GstPercent,
                          Date: formatDateForInput(i.Date),
                          ReorderLevel: i.ReorderLevel || "",
                        })
                      }
                    >
                      ✏️
                    </button>

                    {/* Delete */}
                    <button
                      className="invaction-btn invaction-delete"
                      onClick={() =>
                        window.confirm(`Delete "${i.Name}"?`) &&
                        deleteItem(i.Id)
                      }
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="10" style={{ textAlign: "center" }}>
                  No matching items.
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
              <input
                name="HsnCode"
                value={formData.HsnCode || ""}
                readOnly
              />
            </div>

            {/* Category */}
            <div className="form-group">
              <label>Category</label>
              <select
                name="CategoryId"
                value={formData.CategoryId || ""}
                onChange={(e) => {
                  handleChange(e);
                  getCategoryById(e.target.value);
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
  );
};

export default EditItem;
