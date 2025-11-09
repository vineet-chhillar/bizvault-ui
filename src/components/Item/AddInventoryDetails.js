import React, { useState, useEffect } from "react";
import "./ItemForms.css";

export default function AddInventoryDetails({ selectedItem, selectedItemName,onSave, onCancel,selectedItemForDetails,itemDetails }) {
 

  const [inventoryData, setInventoryData] = useState({
    item_id: "",
    hsnCode: "",
    batchNo: "",
   date: new Date().toISOString().split("T")[0],
    quantity: "",
    purchasePrice: "",
    salesPrice: "",
    mrp: "",
    goodsOrServices: "Goods",
    description: "",
    
    mfgdate:  new Date().toISOString().split("T")[0],
    expdate:  new Date().toISOString().split("T")[0],
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
    setInventoryData({ ...inventoryData, [e.target.name]: e.target.value });
  };

  const handleToggleOptional = (field) => {
    setShowOptional({ ...showOptional, [field]: !showOptional[field] });
  };

  // ✅ Save inventory — send to C# instead of local state
  const handleSave = (e) => {
    e.preventDefault();
console.log("✅ handleSave() called for:", e.Item_Id);
console.log(selectedItem.id);
 const user = JSON.parse(localStorage.getItem("user"));


// ✅ Basic validation
  if (!inventoryData.batchNo) {
    alert("Please enter a Batch Number");
    return;
  }

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
        Date: new Date().toISOString().split("T")[0], // "2024-10-25"
        
        Quantity: parseFloat(inventoryData.quantity) || 0,
        PurchasePrice: parseFloat(inventoryData.purchasePrice) || 0,
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
          <div className="form-group">
            <label>HSN/SAC Code</label>
            <input
              name="hsnCode"
              value={inventoryData.hsnCode}
              onChange={handleChange}
              placeholder="Enter HSN/SAC code"
            />
          </div>

          <div className="form-group">
            <label>Batch No</label>
            <input
              name="batchNo"
              value={inventoryData.batchNo}
              onChange={handleChange}
              placeholder="Enter Batch Number"
            />
          </div>

          <div className="form-group">
            <label>Date</label>
            <input
            type="date"
              name="date"
              value={inventoryData.date}
              onChange={handleChange}
              placeholder="Enter Date"
              required
            />
          </div>


          <div className="form-group">
            <label>Quantity</label>
            <input
              name="quantity"
              type="number"
              value={inventoryData.quantity}
              onChange={handleChange}
              placeholder="Enter Quantity"
            />
          </div>

          <div className="form-group">
            <label>Purchase Price</label>
            <input
              name="purchasePrice"
              type="number"
              value={inventoryData.purchasePrice}
              onChange={handleChange}
              placeholder="Enter Purchase Price"
            />
          </div>

          <div className="form-group">
            <label>Sales Price</label>
            <input
              name="salesPrice"
              type="number"
              value={inventoryData.salesPrice}
              onChange={handleChange}
              placeholder="Enter Sales Price"
            />
          </div>

          <div className="form-group">
            <label>MRP</label>
            <input
              name="mrp"
              type="number"
              value={inventoryData.mrp}
              onChange={handleChange}
              placeholder="Enter MRP"
            />
          </div>

          


<div className="form-group">
  <label>Goods/Services</label>
  <select
    name="goodsOrServices"
    value={inventoryData.goodsOrServices}
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
              name="description"
              value={inventoryData.description}
              onChange={handleChange}
              placeholder="Enter Description"
            />
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
