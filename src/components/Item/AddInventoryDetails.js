import React, { useState, useEffect } from "react";
import "./ItemForms.css";
//import  validateInventoryForm  from "../../utils/validateInvoiceForm";
import validateInventoryEditForm from "../../utils/validateInventoryEditForm";

export default function AddInventoryDetails({ selectedItem, selectedItemName,onSave, onCancel,selectedItemForDetails,itemDetails }) {
 
const [suppliers, setSuppliers] = useState([]);
const [selectedSupplierId, setSelectedSupplierId] = useState(0);

{/*const now = new Date();
const formatted =
  now.getFullYear() + "-" +
  String(now.getMonth() + 1).padStart(2, "0") + "-" +
  String(now.getDate()).padStart(2, "0") + " " +
  String(now.getHours()).padStart(2, "0") + ":" +
  String(now.getMinutes()).padStart(2, "0") + ":" +
  String(now.getSeconds()).padStart(2, "0");*/}

  const [inventoryData, setInventoryData] = useState({
    item_id: "",
    supplierId:0,
    batchNo: "",
    refno:"",
   date: new Date().toISOString().split("T")[0],
    quantity: "",
    purchasePrice: "",

    discountPercent: "",
    netPurchasePrice: "",
    amount: "",


    salesPrice: "",
    mrp: "",
    goodsOrServices: "Goods",
    description: "",
    
    //mfgdate:  new Date().toISOString().split("T")[0],
    mfgdate:"",
    //expdate:  new Date().toISOString().split("T")[0],
    expdate:"",
    modelno: "",
    brand: "",
    size: "",
    color: "",
    weight: "",
    dimension: "",
    createdby: "",
    createdat: "",
  });

  const [showOptional, setShowOptional] = useState({
    mfgdate: false,
    expdate: false,
    modelno: false,
    brand: false,
    size: false,
    color: false,
    weight: false,
    dimension: false,

    
  });

const [errors, setErrors] = useState({});

useEffect(() => {
  if (!window.chrome?.webview) return;

  const handler = (event) => {
    let msg = event.data || event.detail;

    if (!msg) return;

    if (typeof msg === "string") {
      try { msg = JSON.parse(msg); } catch { return; }
    }

    if (msg.action === "GetAllSuppliers" && msg.success) {
      setSuppliers(msg.data);
    }
  };

  window.chrome.webview.addEventListener("message", handler);

  // 🔥 Now request suppliers (listener is active)
  window.chrome.webview.postMessage({ Action: "GetAllSuppliers" });

  return () =>
    window.chrome.webview.removeEventListener("message", handler);
}, []);




// ✅ Listen for confirmation messages from C#
  useEffect(() => {
  if (window.chrome?.webview) {
    const handler = (event) => {
      let msg = event.data;
      console.log("📩 Message from C#: ", msg);

      // Parse JSON if it's a string
      if (typeof msg === "string") {
        try {
          msg = JSON.parse(msg);
        } catch {
          console.warn("Non-JSON message from C#:", msg);
          return;
        }
      }
      // ✅ Handle AddItemDetails response
      if (msg.Type === "AddItemDetails") {
        if (msg.Status === "Success") {
          alert("✅ " + msg.Message);
         {/*} onSave(); // closes the form*/}
        } else {
          alert("❌ " + msg.Message);
        }
      }      
    };   


    window.chrome.webview.addEventListener("message", handler);
    return () => window.chrome.webview.removeEventListener("message", handler);
  }
}, [onSave]);



const handleChange = (e) => {
  const { name, value } = e.target;
  
  // Copy current state
  let updatedData = { ...inventoryData, [name]: value };

  // Parse numeric fields safely
  const purchasePrice = parseFloat(updatedData.purchasePrice) || 0;
  const discountPercent = parseFloat(updatedData.discountPercent) || 0;
  const quantity = parseFloat(updatedData.quantity) || 0;

  // Calculate new values if relevant fields change
  const netPurchasePrice = purchasePrice - (purchasePrice * discountPercent) / 100;
  const amount = quantity * netPurchasePrice;

  // Always keep computed fields updated
  updatedData.netPurchasePrice = netPurchasePrice.toFixed(2);
  updatedData.amount = amount.toFixed(2);

  //console.log(selectedSupplierId);
  //inventoryData.supplierId=selectedSupplierId;
  //console.log(inventoryData.supplierId);
  // Set the final updated state
  setInventoryData(updatedData);
};

  {/*const handleChange = (e) => {
    setInventoryData({ ...inventoryData, [e.target.name]: e.target.value });
    
  };*/}

  const handleToggleOptional = (field) => {
    setShowOptional({ ...showOptional, [field]: !showOptional[field] });
  };

  // ✅ Save inventory — send to C# instead of local state
  const handleSave = (e) => {
  e.preventDefault();

  // 🔥 1. Merge supplierId into form before validation (DO NOT setInventoryData here)
  const updatedData = {
    ...inventoryData,
    supplierId: Number(selectedSupplierId),
  };

  console.log("🔥 VALIDATION INPUT:", updatedData);

  // 🔥 2. Validate using updatedData
  const validationErrors = validateInventoryEditForm(updatedData);

  if (validationErrors.length > 0) {
    const errorMap = {};
    validationErrors.forEach(err => {
      errorMap[err.field] = err.message;
    });
    setErrors(errorMap);
    return;
  }

  // Clear errors
  setErrors({});

  console.log("✅ handleSave() for item:", selectedItem.id);

  const user = JSON.parse(localStorage.getItem("user"));

  // 🔥 3. Duplicate batch no check
  const exists =
    Array.isArray(itemDetails) &&
    itemDetails.some(
      (inv) =>
        String(inv.BatchNo || inv.batchNo).trim().toLowerCase() ===
          String(updatedData.batchNo).trim().toLowerCase() &&
        parseInt(inv.Item_Id || inv.item_Id || inv.item_id) ===
          parseInt(selectedItem.id)
    );

  if (exists) {
    alert("⚠️ This batch number already exists for the selected item!");
    return;
  }
const dateFromCalendar = updatedData.date; // e.g., "2025-11-27"

const now = new Date();
const timePart =
  String(now.getHours()).padStart(2, "0") + ":" +
  String(now.getMinutes()).padStart(2, "0") + ":" +
  String(now.getSeconds()).padStart(2, "0");

// Merge date + time → "2025-11-27 14:32:10"
const finalDateTime = `${dateFromCalendar} ${timePart}`;

  // 🔥 4. Build payload for C#
  const payload = {
    Item_Id: selectedItem.id,

    SupplierId: updatedData.supplierId,
    BatchNo: updatedData.batchNo,
    refno: updatedData.refno,
    //Date: new Date().toISOString().split("T")[0],
Date: finalDateTime,
    Quantity: parseFloat(updatedData.quantity) || 0,
    PurchasePrice: parseFloat(updatedData.purchasePrice) || 0,

    DiscountPercent: parseFloat(updatedData.discountPercent) || 0,
    NetPurchasePrice: parseFloat(updatedData.netPurchasePrice) || 0,
    Amount: parseFloat(updatedData.amount) || 0,

    SalesPrice: parseFloat(updatedData.salesPrice) || 0,
    Mrp: parseFloat(updatedData.mrp) || 0,

    GoodsOrServices: updatedData.goodsOrServices,
    Description: updatedData.description,
    MfgDate: updatedData.mfgdate,
    ExpDate: updatedData.expdate,
    ModelNo: updatedData.modelno,
    Brand: updatedData.brand,
    Size: updatedData.size,
    Color: updatedData.color,
    Weight: parseFloat(updatedData.weight) || 0,
    Dimension: updatedData.dimension,

    CreatedBy: user.email,
    CreatedAt: new Date().toISOString(),
  };

  console.log("📤 Sending Inventory to C#:", payload);

  // 🔥 5. Send to C#
  if (window.chrome?.webview) {
    window.chrome.webview.postMessage({
      Action: "AddItemDetails",
      Payload: payload,
    });
  } else {
    console.warn("⚠️ WebView2 not available — running in browser?");
  }

  // 🔥 6. Notify CreateItem screen to refresh inventory list
  document.dispatchEvent(
    new CustomEvent("InventoryUpdated", { detail: { itemId: selectedItem.id } })
  );
};


  return (
    <div className="inventory-form">
      <h3 className="inventory-title">
        🏷️ Add Inventory Details for: <span>{selectedItemName}</span>
      </h3>

      <form className="inventory-body" onSubmit={handleSave}>
        <div className="form-row">
    {/* Supplier */}      
<div className="form-group">
    <label>Supplier</label>
   <select
  value={selectedSupplierId}
  onChange={(e) => setSelectedSupplierId(Number(e.target.value))}
>
  <option value="0">Select Supplier</option>
  {suppliers.map((s) => (
    <option key={s.SupplierId} value={s.SupplierId}>
      {s.SupplierName}
    </option>
  ))}
</select>
 {errors.supplierId && (<div className="error">{errors.supplierId}</div>
  )}
</div>


         

{/* Batch No */}
<div className="form-group">
  <label>Batch No</label>
  <input
    name="batchNo"
    value={inventoryData.batchNo}
    onChange={handleChange}
    placeholder="Enter Batch Number"
    className={errors.batchNo ? "error-input" : ""}
  />
  {errors.batchNo && <div className="error">{errors.batchNo}</div>}
</div>

{/* Ref/Invoice No */}
<div className="form-group">
  <label>Ref/Invoice No</label>
  <input
    name="refno"
    value={inventoryData.refno}
    onChange={handleChange}
    placeholder="Enter Invoice Number"
    className={errors.refno ? "error-input" : ""}
  />
  {errors.refno && <div className="error">{errors.refno}</div>}
</div>

{/* Date */}
<div className="form-group">
  <label>Date</label>
  <input
    type="date"
    name="date"
    value={inventoryData.date}
    onChange={handleChange}
    placeholder="Enter Date"
    className={errors.date ? "error-input" : ""}
  />
  {errors.date && <div className="error">{errors.date}</div>}
</div>

{/* Quantity */}
<div className="form-group">
  <label>Quantity</label>
  <input
    name="quantity"
    type="number"
    value={inventoryData.quantity}
    onChange={handleChange}
    placeholder="Enter Quantity"
    className={errors.quantity ? "error-input" : ""}
  />
  {errors.quantity && <div className="error">{errors.quantity}</div>}
</div>

{/* Purchase Price */}
<div className="form-group">
  <label>Purchase Price</label>
  <input
    name="purchasePrice"
    type="number"
    value={inventoryData.purchasePrice}
    onChange={handleChange}
    placeholder="Enter Purchase Price"
    className={errors.purchasePrice ? "error-input" : ""}
  />
  {errors.purchasePrice && <div className="error">{errors.purchasePrice}</div>}
</div>

{/* Discount Percent */}
<div className="form-group">
  <label>Discount Percent</label>
  <input
    name="discountPercent"
    type="number"
    value={inventoryData.discountPercent}
    onChange={handleChange}
    placeholder="Enter Discount %"
    className={errors.discountPercent ? "error-input" : ""}
  />
  {errors.discountPercent && (
    <div className="error">{errors.discountPercent}</div>
  )}
</div>

{/* Net Purchase Price (readonly) */}
<div className="form-group">
  <label>Net Purchase Price</label>
  <input
    name="netPurchasePrice"
    type="number"
    value={inventoryData.netPurchasePrice}
    onChange={handleChange}
    placeholder="Net Purchase Price"
    readOnly
    className={errors.netPurchasePrice ? "error-input" : ""}
  />
  {errors.netPurchasePrice && (
    <div className="error">{errors.netPurchasePrice}</div>
  )}
</div>

{/* Amount (readonly) */}
<div className="form-group">
  <label>Amount</label>
  <input
    name="amount"
    type="number"
    value={inventoryData.amount}
    onChange={handleChange}
    placeholder="Total Amount"
    readOnly
    className={errors.amount ? "error-input" : ""}
  />
  {errors.amount && <div className="error">{errors.amount}</div>}
</div>

{/* Sales Price */}
<div className="form-group">
  <label>Sales Price</label>
  <input
    name="salesPrice"
    type="number"
    value={inventoryData.salesPrice}
    onChange={handleChange}
    placeholder="Enter Sales Price"
    className={errors.salesPrice ? "error-input" : ""}
  />
  {errors.salesPrice && <div className="error">{errors.salesPrice}</div>}
</div>

{/* MRP */}
<div className="form-group">
  <label>MRP</label>
  <input
    name="mrp"
    type="number"
    value={inventoryData.mrp}
    onChange={handleChange}
    placeholder="Enter MRP"
    className={errors.mrp ? "error-input" : ""}
  />
  {errors.mrp && <div className="error">{errors.mrp}</div>}
</div>

{/* Goods/Services */}
<div className="form-group">
  <label>Goods/Services</label>
  <select
    name="goodsOrServices"
    value={inventoryData.goodsOrServices}
    onChange={handleChange}
    className={errors.goodsOrServices ? "error-input" : ""}
  >
    <option value="">-- Select --</option>
    <option value="Goods">Goods</option>
    <option value="Services">Services</option>
  </select>
  {errors.goodsOrServices && (
    <div className="error">{errors.goodsOrServices}</div>
  )}
</div>

{/* Description */}
<div className="form-group">
  <label>Description</label>
  <input
    name="description"
    value={inventoryData.description}
    onChange={handleChange}
    placeholder="Enter Description"
    className={errors.description ? "error-input" : ""}
  />
  {errors.description && <div className="error">{errors.description}</div>}
</div>

        </div>

        {/* ✅ Optional Fields Section */}
        <div className="optional-fields">
          <div className="optional-toggles">
            <label>
              <input
                type="checkbox"
                checked={showOptional.mfgdate}
                onChange={() => handleToggleOptional("mfgdate")}
              />{" "}
              Add Mfg Date
            </label>

            <label>
              <input
                type="checkbox"
                checked={showOptional.expdate}
                onChange={() => handleToggleOptional("expdate")}
              />{" "}
              Add Exp date
            </label>
          


          
            <label>
              <input
                type="checkbox"
                checked={showOptional.modelno}
                onChange={() => handleToggleOptional("modelno")}
              />{" "}
              Add Model No
            </label>

            <label>
              <input
                type="checkbox"
                checked={showOptional.brand}
                onChange={() => handleToggleOptional("brand")}
              />{" "}
              Add Brand
            </label>
          

         
            <label>
              <input
                type="checkbox"
                checked={showOptional.size}
                onChange={() => handleToggleOptional("size")}
              />{" "}
              Add Size
            </label>

            <label>
              <input
                type="checkbox"
                checked={showOptional.color}
                onChange={() => handleToggleOptional("color")}
              />{" "}
              Add Color
            </label>
          



          
            <label>
              <input
                type="checkbox"
                checked={showOptional.weight}
                onChange={() => handleToggleOptional("weight")}
              />{" "}
              Add Weight
            </label>

            <label>
              <input
                type="checkbox"
                checked={showOptional.dimension}
                onChange={() => handleToggleOptional("dimension")}
              />{" "}
              Add Dimension
            </label>
          </div>

<div className="optional-fields-row">

{showOptional.mfgdate && (
            <div className="form-group">
              <label>Mfg Date</label>
              <input
                type="date"
                name="mfgdate"
                value={inventoryData.mfgdate}
                onChange={handleChange}
                placeholder="Enter Mfg Date (e.g. YYYY-MM-DD)"
              />
            </div>
          )}

{showOptional.expdate && (
            <div className="form-group">
              <label>Exp Date</label>
              <input
              type="date"
                name="expdate"
                value={inventoryData.expdate}
                onChange={handleChange}
                placeholder="Enter Exp Date (e.g. YYYY-MM-DD)"
              />
            </div>
          )}
{showOptional.modelno && (
            <div className="form-group">
              <label>Model No</label>
              <input
                name="modelno"
                value={inventoryData.modelno}
                onChange={handleChange}
                placeholder="Enter Model No"
              />
            </div>
          )}

{showOptional.brand && (
            <div className="form-group">
              <label>Brand</label>
              <input
                name="brand"
                value={inventoryData.brand}
                onChange={handleChange}
                placeholder="Enter Brand Name"
              />
            </div>
          )}



          {showOptional.size && (
            <div className="form-group">
              <label>Size</label>
              <input
                name="size"
                value={inventoryData.size}
                onChange={handleChange}
                placeholder="Enter Size (e.g. L, XL, 32)"
              />
            </div>
          )}

          {showOptional.color && (
            <div className="form-group">
              <label>Color</label>
              <input
                name="color"
                value={inventoryData.color}
                onChange={handleChange}
                placeholder="Enter Color (e.g. Red, Blue)"
              />
            </div>
          )}

{showOptional.weight && (
            <div className="form-group">
              <label>Weight</label>
              <input
                name="weight"
                value={inventoryData.weight}
                onChange={handleChange}
                placeholder="Enter Weight (e.g. mg/grm/kg/Quintol/Ton)"
              />
            </div>
          )}

          {showOptional.dimension && (
            <div className="form-group">
              <label>Dimension</label>
              <input
                name="dimension"
                value={inventoryData.dimension}
                onChange={handleChange}
                placeholder="Enter Dimension (e.g. Length x Breadth x Height)"
              />
            </div>
          )}

        </div>
       
</div>
       <div className="inventory-btns">
          <button type="submit" className="btn-submit small">
            Save Inventory
          </button>
          
          <button
            type="button"
            className="btn-submit small"
            onClick={onCancel}
          >
            Cancel
          </button>
        </div>  
      </form>
      
    </div>
  );
}
