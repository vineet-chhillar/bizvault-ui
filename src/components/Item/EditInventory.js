import React, { useState, useEffect, useRef } from "react";
import "./ItemForms.css";
import "./EditInventory.css";
import ItemNavBar from "./ItemNavBar";
const EditInventory = () => {
  const [inventory, setInventory] = useState([]);
  const [selectedItemId, setSelectedItemId] = useState("");
  const [formData, setFormData] = useState(null);
  const [errors, setErrors] = useState({});
  const [items, setItems] = useState([]);
  const [selectedItemName, setSelectedItemName] = useState("");
  const [selectedBatchNo, setSelectedBatchno] = useState("");
  const selectedItemIdRef = useRef();



  // ✅ Handle incoming messages from C#
  useEffect(() => {
    const handleMessage = (event) => {
      let data = event.data;
      try {
        if (typeof data === "string") data = JSON.parse(data);
      } catch {}

      // Response for inventory search
      if (data.action === "searchInventoryResponse") {
        console.log("Inventory data from backend:", data.items); // ✅ Add this line
        setInventory(data.items || []);
      }

     // ✅ Response for update
if (data.action === "updateInventoryResponse") {
    if (data.success) {
       alert(data.message || "✅ Inventory updated successfully!");
        const itemToRefresh = selectedItemIdRef.current;
    console.log("🔁 Refreshing inventory for item:", itemToRefresh);
       if (itemToRefresh){
           handleSearch(itemToRefresh);
    }
  } else {
    alert("❌ Failed to update inventory. Please try again.");
  }
  setFormData(null);
  
}

    // ✅ Handle last inventory item
    if (data.action === "getLastInventoryItemResponse" && data.success && data.data) {
      const lastItem = data.data;
      setSelectedItemId(lastItem.Item_Id);
      setSelectedItemName(lastItem.ItemName);
      handleSearch(lastItem.Item_Id);
    }

    // Existing responses
    if (data.action === "searchInventoryResponse") {
      setInventory(data.items || []);
    }

    if (data.Type === "GetItemList" && data.Status === "Success") {
      setItems(data.Data || []);
    }




    };

    // Listen for C# messages + request item list
    if (window.chrome?.webview) {
      window.chrome.webview.addEventListener("message", handleMessage);

// ✅ Ask backend for last inventory item
    window.chrome.webview.postMessage({
      action: "getLastInventoryItem",
      payload: {}
    });

      window.chrome.webview.postMessage({
        Action: "GetItemList",
        Payload: {},
      });
    }

    return () => {
      window.chrome?.webview?.removeEventListener("message", handleMessage);
    };
  }, []);

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
    const itemName = e.target.options[e.target.selectedIndex].text; // 👈 get visible name
    setSelectedItemName(itemName); // 👈 store name
    setSelectedItemId(itemId);
    selectedItemIdRef.current = itemId; // ✅ persist it
    setInventory([]); // Clear previous results
    setFormData(null); // Clear previous results
    if (itemId) handleSearch(itemId);
  };

  // ✅ Handle input change in edit form
  const handleChange = (e) => {
  const { name, value } = e.target;

// Copy current state
  let updatedData = { ...formData, [name]: value };

  // Parse numeric fields safely
  const purchasePrice = parseFloat(updatedData.purchasePrice) || 0;
  const discountPercent = parseFloat(updatedData.discountPercent) || 0;
  const quantity = parseFloat(updatedData.quantity) || 0;

  // Calculate new values if relevant fields change
  const netpurchasePrice = purchasePrice - (purchasePrice * discountPercent) / 100;
  const amount = quantity * netpurchasePrice;

  // Always keep computed fields updated
  updatedData.netpurchasePrice = netpurchasePrice.toFixed(2);
  updatedData.amount = amount.toFixed(2);

  // Set the final updated state
  setFormData(updatedData);

  setFormData((prev) => ({ ...prev, [name]: value }));
  setErrors((prev) => ({ ...prev, [name]: "" })); // ✅ clear field-level error
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

  const qty = parseFloat(formData.quantity);
  if (isNaN(qty) || qty <= 0)
    newErrors.quantity = "Quantity must be greater than 0.";

  const purchase = parseFloat(formData.purchasePrice);
  if (isNaN(purchase) || purchase <= 0)
    newErrors.purchasePrice = "Purchase price must be greater than 0.";

  const sales = parseFloat(formData.salesPrice);
  if (isNaN(sales) || sales <= 0)
    newErrors.salesPrice = "Sales price must be greater than 0.";

  const mrp = parseFloat(formData.mrp);
  if (isNaN(mrp) || mrp <= 0)
    newErrors.mrp = "MRP must be greater than 0.";

  if (formData.mfgDate && formData.expDate) {
    const mfg = new Date(formData.mfgDate);
    const exp = new Date(formData.expDate);
    if (exp < mfg)
      newErrors.expDate = "Expiry cannot be before manufacturing date.";
  }

  setErrors(newErrors);
  console.log("Validation Errors:", newErrors);
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
        hsnCode: formData.hsnCode,
        batchNo: formData.batchNo,
        refno: formData.refno,
        date: formData.date,
        quantity: parseInt(formData.quantity),
        purchasePrice: parseFloat(formData.purchasePrice),

        discountPercent: parseFloat(formData.discountPercent),
        netpurchasePrice: parseFloat(formData.netpurchasePrice),
        amount: parseFloat(formData.amount),

        salesPrice: parseFloat(formData.salesPrice),
        mrp: parseFloat(formData.mrp),
        goodsOrServices: formData.goodsOrServices,
        description: formData.description,
        mfgdate: formData.mfgdate,
        expdate: formData.expdate,
        modelno: formData.modelno,
        brand: formData.brand,
        size: formData.size,
        color: formData.color,
        weight: formData.weight,
        dimension: formData.dimension,
        invbatchno: selectedBatchNo,
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
      

      <div className="item-nav-wrapper">
            <ItemNavBar />
      </div>

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
            <h3 className="inventory-title">📋 Inventory for {selectedItemName}</h3>
          </div>

          <table className="inventory-table">
            <thead>
              <tr>
                <th>HSN/SAC</th>
                <th>Batch No</th>
                <th>Ref/Invoice No</th>
                <th>Date</th>
                <th>Qty</th>
                <th>Purchase Price</th>

                <th>Discount Percent</th>
                <th>Net Purchase Price</th>
                <th>Amount</th>

                <th>Sales Price</th>
                <th>MRP</th>
                
                <th>Goods/Services</th>
                <th>Description</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {inventory.map((inv) => (
                <tr key={inv.Id || inv.id}>
                  <td>{inv.HsnCode || inv.hsnCode}</td>
                  <td>{inv.BatchNo || inv.batchNo}</td>
                  <td>{inv.refno || inv.refno}</td>
                  <td>{(inv.Date || inv.date || "").split("T")[0].split(" ")[0]}</td>
                  <td>{inv.Quantity || inv.quantity}</td>
                  <td>{inv.purchasePrice || inv.purchasePrice}</td>

                  <td>{inv.DiscountPercent || inv.discountPercent}</td>
                  <td>{inv.netpurchasePrice || inv.NetPurchasePrice}</td>
                  <td>{inv.Amount || inv.amount}</td>

                  <td>{inv.SalesPrice || inv.salesPrice}</td>
                  <td>{inv.Mrp || inv.mrp}</td>
                  <td>{inv.GoodsOrServices || inv.goodsOrServices}</td>
                  <td>{inv.Description || inv.description}</td>
                  
                  <td>
                     <button
  className="invaction-btn invaction-modify"
onClick={() => {
  const normalized = Object.fromEntries(
    Object.entries(inv).map(([key, value]) => {
      const lowerKey = key.charAt(0).toLowerCase() + key.slice(1);

      // ✅ Fix date format for input[type=date]
      if (
        ["mfgdate", "expdate","date"].includes(lowerKey) &&
        typeof value === "string"
      ) {
        // Handle both "2025-11-08 00:00:00" and "2025-11-08T00:00:00"
        if (value.includes("T")) value = value.split("T")[0];
        else if (value.includes(" ")) value = value.split(" ")[0];
      }

      return [lowerKey, value];
    })
  );

  console.log("Editing normalized record:", normalized);
  setFormData(normalized); // ✅ use fixed data
  setSelectedBatchno(inv.BatchNo || inv.batchNo);
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
          <h3 className="inventory-title">🏷️ Edit Inventory Record For Batch : {selectedBatchNo}</h3>

          <div className="form-row-horizontal">
            <div className="form-group">
              <label>HSN Code</label>
              <input
                type="text"
                name="hsnCode"
                value={formData.hsnCode || formData.hsnCode || ""}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Batch No</label>
              <input
                type="text"
                name="batchNo"
                value={formData.batchNo || formData.batchNo || ""}
                onChange={handleChange}
              />
            </div>


            <div className="form-group">
              <label>Ref/Invoice No</label>
              <input
                type="text"
                name="refno"
                value={formData.refno || formData.refno || ""}
                onChange={handleChange}
              />
            </div>



              <div className="form-group">
              <label>Date</label>
              <input
                type="date"
                name="date"
                value={formData.date || formData.date || ""}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Quantity</label>
              <input
                type="number"
                name="quantity"
                value={formData.quantity || formData.quantity || ""}
                onChange={handleChange}
              />
              {errors.Quantity && <p className="error-text">{errors.Quantity}</p>}
            </div>

            <div className="form-group">
              <label>Purchase Price</label>
              <input
                type="number"
                name="purchasePrice"
                value={formData.purchasePrice || formData.purchasePrice || ""}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Discount Percent</label>
              <input
                type="number"
                name="discountPercent"
                value={formData.discountPercent || formData.discountPercent || ""}
                onChange={handleChange}
              />
            </div>

             <div className="form-group">
              <label> Net Purchase Price</label>
              <input
                type="number"
                name="netPurchasePrice"
                value={formData.netpurchasePrice || formData.netpurchasePrice || ""}
                onChange={handleChange}
                readonly={true}
              />
            </div>

            <div className="form-group">
              <label>Amount</label>
              <input
                type="number"
                name="amount"
                value={formData.amount || formData.amount || ""}
                onChange={handleChange}
                readonly={true}
              />
            </div>


            <div className="form-group">
              <label>Sales Price</label>
              <input
                type="number"
                name="salesPrice"
                value={formData.salesPrice || formData.salesPrice || ""}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>MRP</label>
              <input
                type="number"
                name="mrp"
                value={formData.mrp || formData.mrp || ""}
                onChange={handleChange}
              />
            </div>

<div className="form-group">
  <label>Goods/Services</label>
  <select
    name="goodsOrServices"
    value={formData.goodsOrServices}
    onChange={handleChange}
    required
  >
    <option value="Goods">Goods</option>
    <option value="Services">Services</option>
  </select>
</div>

<div className="form-group">
              <label>Description</label>
              <input
                type="text"
                name="description"
                value={formData.description || formData.description || ""}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Mfg Date</label>
              <input
                type="date"
                name="mfgdate"
                value={formData.mfgdate || ""}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Exp Date</label>
              <input
                type="date"
                name="expdate"
                value={formData.expdate || ""}
                onChange={handleChange}
              />
            </div>

           

            <div className="form-group">
              <label>Model No</label>
              <input
                type="text"
                name="modelno"
                value={formData.modelno || formData.modelno || ""}
                onChange={handleChange}
              />
            </div>
             <div className="form-group">
              <label>Brand</label>
              <input
                type="text"
                name="brand"
                value={formData.brand || formData.brand || ""}
                onChange={handleChange}
              />
            </div>

             <div className="form-group">
              <label>Size</label>
              <input
                type="text"
                name="size"
                value={formData.size || formData.size || ""}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label>Color</label>
              <input
                type="text"
                name="color"
                value={formData.color || formData.color || ""}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Weight</label>
              <input
                type="text"
                name="weight"
                value={formData.weight || formData.weight || ""}
                onChange={handleChange}
              />
            </div>

             <div className="form-group">
              <label>Dimension</label>
              <input
                type="text"
                name="dimension"
                value={formData.dimension || formData.dimension || ""}
                onChange={handleChange}
              />
            </div>



          </div>

          <div className="form-actions">
            <div className="inventory-btns">
              <button
              type="button"
                className="btn-submit small"
                onClick={handleSave}
                
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
