import React, { useState, useEffect } from "react";
import "./ItemForms.css";
//import  validateInventoryForm  from "../../utils/validateInvoiceForm";
import validateInventoryEditForm from "../../utils/validateInventoryEditForm";

export default function AddInventoryDetails({ selectedItem, selectedItemName,onSave, onCancel,selectedItemForDetails,itemDetails }) {
 

  const [inventoryData, setInventoryData] = useState({
    item_id: "",
    hsnCode: "",
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



    console.log("validateInventoryEditForm:", validateInventoryEditForm);
  //const validationErrors = validateInventoryForm(inventoryData, showOptional);
  const validationErrors = validateInventoryEditForm(inventoryData);

  if (validationErrors.length > 0) {
    const errorMap = {};
    validationErrors.forEach(err => {
      errorMap[err.field] = err.message;
    });
    setErrors(errorMap);
    return;
  }

  setErrors({});

console.log("✅ handleSave() called for:", e.Item_Id);
console.log(selectedItem.id);
 const user = JSON.parse(localStorage.getItem("user"));




  // ✅ Duplicate check — prevent same BatchNo for the same Item
  const exists =
    Array.isArray(itemDetails) &&
    itemDetails.some(
      (inv) =>
        String(inv.BatchNo || inv.batchNo).trim().toLowerCase() ===
          String(inventoryData.batchNo).trim().toLowerCase() &&
        parseInt(inv.Item_Id || inv.item_Id || inv.item_id) ===
          parseInt(selectedItem.id)
    );

  if (exists) {
    alert("⚠️ This batch number already exists for the selected item!");
    return;
  }




    if (window.chrome?.webview) {
      const payload = {
        Item_Id: selectedItem.id, // or selectedItem.Item_Id if from DB
        HsnCode: inventoryData.hsnCode,
        BatchNo: inventoryData.batchNo,
        refno: inventoryData.refno,
        Date: new Date().toISOString().split("T")[0], // "2024-10-25"
        
        Quantity: parseFloat(inventoryData.quantity) || 0,
        PurchasePrice: parseFloat(inventoryData.purchasePrice) || 0,

        DiscountPercent: parseFloat(inventoryData.discountPercent) || 0,
        NetPurchasePrice: parseFloat(inventoryData.netPurchasePrice) || 0,
        Amount: parseFloat(inventoryData.amount) || 0,

        SalesPrice: parseFloat(inventoryData.salesPrice) || 0,
        Mrp: parseFloat(inventoryData.mrp) || 0,
        GoodsOrServices: inventoryData.goodsOrServices,
        Description: inventoryData.description,
        MfgDate: inventoryData.mfgdate,
        ExpDate: inventoryData.expdate,
        ModelNo: inventoryData.modelno,
        Brand: inventoryData.brand,
        Size: inventoryData.size,
        Color: inventoryData.color,
        Weight: parseFloat(inventoryData.weight) || 0,
        Dimension: inventoryData.dimension,
        CreatedBy: user.email, 
        CreatedAt: new Date().toISOString(),
      };

      console.log("📤 Sending Inventory to C#:", payload);




      window.chrome.webview.postMessage({
        Action: "AddItemDetails",
        Payload: payload,
      });
    } 
    else {
      console.warn("⚠️ WebView2 not available — running in browser?");
    }
    // ✅ Dispatch event so CreateItem refreshes
  document.dispatchEvent(new CustomEvent("InventoryUpdated", { detail: { itemId: selectedItem.id } }));
  };

  return (
    <div className="inventory-form">
      <h3 className="inventory-title">
        🏷️ Add Inventory Details for: <span>{selectedItemName}</span>
      </h3>

      <form className="inventory-body" onSubmit={handleSave}>
        <div className="form-row">
          
          {/* HSN/SAC Code */}
<div className="form-group">
  <label>HSN/SAC Code</label>
  <input
    name="hsnCode"
    value={inventoryData.hsnCode}
    onChange={handleChange}
    placeholder="Enter HSN/SAC code"
    className={errors.hsnCode ? "error-input" : ""}
  />
  {errors.hsnCode && <div className="error">{errors.hsnCode}</div>}
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
