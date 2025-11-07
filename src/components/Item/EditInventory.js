import React, { useState, useEffect } from "react";
import "./ItemForms.css";
import "./EditInventory.css";

const EditInventory = () => {
  const [inventory, setInventory] = useState([]);
  const [selectedItemId, setSelectedItemId] = useState("");
  const [formData, setFormData] = useState(null);
  const [errors, setErrors] = useState({});
  const [items, setItems] = useState([]);

  // ✅ Handle incoming messages from C#
  useEffect(() => {
    const handleMessage = (event) => {
      let data = event.data;
      try {
        if (typeof data === "string") data = JSON.parse(data);
      } catch {}

      // Response for inventory search
      if (data.action === "searchInventoryResponse") {
        setInventory(data.items || []);
      }

      // Response for update
      if (data.action === "updateInventory") {
        alert(data.message);
        if (data.success) {
          setFormData(null);
          if (selectedItemId) handleSearch(selectedItemId);
        }
      }

      // Response for item list
      if (data.Type === "GetItemList" && data.Status === "Success") {
        setItems(data.Data || []);
      }
    };

    // Listen for C# messages + request item list
    if (window.chrome?.webview) {
      window.chrome.webview.addEventListener("message", handleMessage);
      window.chrome.webview.postMessage({
        Action: "GetItemList",
        Payload: {},
      });
    }

    return () => {
      window.chrome?.webview?.removeEventListener("message", handleMessage);
    };
  }, [selectedItemId]);

  // ✅ Search inventory for selected item
  const handleSearch = (itemId) => {
    if (!itemId) return;
    window.chrome?.webview?.postMessage({
      action: "searchInventory",
      payload: { query: itemId },
    });
  };

  // ✅ When item selected from dropdown
  const handleItemSelect = (e) => {
    const itemId = e.target.value;
    setSelectedItemId(itemId);
    setInventory([]); // Clear previous results
    if (itemId) handleSearch(itemId);
  };

  // ✅ Handle input change in edit form
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    validateField(name, value);
  };

  // ✅ Field validation logic
  const validateField = (name, value) => {
    let message = "";
    switch (name) {
      case "Quantity":
        if (!value || value <= 0) message = "Quantity must be greater than 0.";
        break;
      case "PurchasePrice":
      case "SalesPrice":
      case "Mrp":
        if (!value || value <= 0) message = "Price must be greater than 0.";
        break;
      case "ExpDate":
        if (formData?.MfgDate && value < formData.MfgDate)
          message = "Expiry date cannot be before manufacturing date.";
        break;
      default:
        break;
    }
    setErrors((prev) => ({ ...prev, [name]: message }));
  };

  // ✅ Validate whole form
  const validateForm = () => {
    const newErrors = {};
    if (!formData.Quantity || formData.Quantity <= 0)
      newErrors.Quantity = "Quantity must be greater than 0.";
    if (!formData.PurchasePrice || formData.PurchasePrice <= 0)
      newErrors.PurchasePrice = "Purchase price must be greater than 0.";
    if (!formData.SalesPrice || formData.SalesPrice <= 0)
      newErrors.SalesPrice = "Sales price must be greater than 0.";
    if (!formData.Mrp || formData.Mrp <= 0)
      newErrors.Mrp = "MRP must be greater than 0.";
    if (formData.MfgDate && formData.ExpDate && formData.ExpDate < formData.MfgDate)
      newErrors.ExpDate = "Expiry cannot be before manufacturing date.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ✅ Save edited record
  const handleSave = (e) => {
    e.preventDefault();
    if (!validateForm()) {
      alert("Please correct validation errors before saving.");
      return;
    }

    window.chrome?.webview?.postMessage({
      action: "updateInventory",
      payload: {
        id: formData.Id,
        item_id: parseInt(formData.Item_Id || selectedItemId),
        hsnCode: formData.HsnCode,
        batchNo: formData.BatchNo,
        date: formData.Date,
        quantity: parseInt(formData.Quantity),
        purchasePrice: parseFloat(formData.PurchasePrice),
        salesPrice: parseFloat(formData.SalesPrice),
        mrp: parseFloat(formData.Mrp),
        goodsOrServices: formData.GoodsOrServices,
        description: formData.Description,
        mfgDate: formData.MfgDate,
        expDate: formData.ExpDate,
        modelNo: formData.ModelNo,
        brand: formData.Brand,
        size: formData.Size,
        color: formData.Color,
        weight: parseFloat(formData.Weight),
        dimension: formData.Dimension,
      },
    });
  };

  // ✅ Delete inventory record
  const deleteInventory = (id) => {
    if (window.confirm("Delete this inventory record?")) {
      window.chrome?.webview?.postMessage({
        action: "deleteInventory",
        payload: { id },
      });
      if (selectedItemId) handleSearch(selectedItemId);
    }
  };

  const isFormValid = Object.values(errors).every((e) => !e);

  return (
    <div className="inventory-form">
      {/* STEP 1: Item Selector */}
      <div className="dropdown-section">


        <label htmlFor="itemSelector" className="table-title" >
          🧾 Select Item to View Inventory
        </label>


        <select
          id="itemSelector"
          value={selectedItemId}
          onChange={handleItemSelect}
           className="item-select"
        >
          <option value="">-- Select Item --</option>
          {items.map((it) => (
            <option key={it.Id || it.id} value={it.Id || it.id}>
              {it.Name || it.name}
            </option>
          ))}
        </select>
      </div>

      {/* STEP 2: Inventory Table (visible only after selecting item) */}
      {selectedItemId && inventory.length > 0 && (
        <div className="inventory-container">
          <div className="inventory-header">
            <h3 className="inventory-title">📋 Inventory for Selected Item</h3>
          </div>

          <table className="inventory-table">
            <thead>
              <tr>
                <th>HSN/SAC</th>
                <th>Batch No</th>
                <th>Qty</th>
                <th>Purchase Price</th>
                <th>Sales Price</th>
                <th>MRP</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {inventory.map((inv) => (
                <tr key={inv.Id || inv.id}>
                  <td>{inv.HsnCode || inv.hsnCode}</td>
                  <td>{inv.BatchNo || inv.batchNo}</td>
                  <td>{inv.Quantity || inv.quantity}</td>
                  <td>{inv.PurchasePrice || inv.purchasePrice}</td>
                  <td>{inv.SalesPrice || inv.salesPrice}</td>
                  <td>{inv.Mrp || inv.mrp}</td>
                  <td>{inv.Date || inv.date}</td>
                  <td>
                     <button
  className="invaction-btn invaction-modify"
   onClick={() => setFormData(inv)}
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
            onClick={() => {
              if (
                window.confirm(
                  `Are you sure you want to delete Batch "${inv.batchNo}"?`
                )
              ) {
                deleteInventory(inv.Id || inv.id)
              }
            }}
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
        </div>
      )}

      {/* STEP 3: Edit Form */}
      {formData && (
        <div className="inventory-body">
          <h3 className="inventory-title">🏷️ Edit Inventory Record</h3>

          <div className="form-row-horizontal">
            <div className="form-group">
              <label>HSN Code</label>
              <input
                type="text"
                name="HsnCode"
                value={formData.HsnCode || formData.hsnCode || ""}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Batch No</label>
              <input
                type="text"
                name="BatchNo"
                value={formData.BatchNo || formData.batchNo || ""}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Quantity</label>
              <input
                type="number"
                name="Quantity"
                value={formData.Quantity || formData.quantity || ""}
                onChange={handleChange}
              />
              {errors.Quantity && <p className="error-text">{errors.Quantity}</p>}
            </div>

            <div className="form-group">
              <label>Purchase Price</label>
              <input
                type="number"
                name="PurchasePrice"
                value={formData.PurchasePrice || formData.purchasePrice || ""}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Sales Price</label>
              <input
                type="number"
                name="SalesPrice"
                value={formData.SalesPrice || formData.salesPrice || ""}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>MRP</label>
              <input
                type="number"
                name="Mrp"
                value={formData.Mrp || formData.mrp || ""}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Mfg Date</label>
              <input
                type="date"
                name="MfgDate"
                value={formData.MfgDate || formData.mfgDate || ""}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Exp Date</label>
              <input
                type="date"
                name="ExpDate"
                value={formData.ExpDate || formData.expDate || ""}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Brand</label>
              <input
                type="text"
                name="Brand"
                value={formData.Brand || formData.brand || ""}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Model No</label>
              <input
                type="text"
                name="ModelNo"
                value={formData.ModelNo || formData.modelNo || ""}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-actions">
            <div className="inventory-btns">
              <button
                className="btn-submit small"
                onClick={handleSave}
                disabled={!formData || !isFormValid}
              >
                💾 Save Changes
              </button>
              <button
                className="btn-submit small"
                onClick={() => setFormData(null)}
              >
                ❌ Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditInventory;
