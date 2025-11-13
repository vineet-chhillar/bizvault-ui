import React, { useState, useEffect } from "react";
import "./ItemForms.css";
import ItemNavBar from "./ItemNavBar";

const EditItem = () => {
  const [items, setItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState(null);
const [category, setCategory] = useState(null);
const [categories, setCategories] = useState([]);


const [gst, setGst] = useState(null);
const [gstRates, setGstRates] = useState([]);

  const [unit, setUnit] = useState(null);
const [units, setUnits] = useState([]);


 // ✅ Handle incoming messages from C#
  useEffect(() => {
    const handleMessage = (event) => {
      let data = event.data;
      try {
        if (typeof data === "string") data = JSON.parse(data);
      } catch {
        // ignore parse errors for non-JSON messages
      }

      if (data.action === "searchItemsResponse") {
        setItems(data.items);
      }

      if (data.action === "updateItem") {
        alert(data.message);
        if (data.success) {
          setFormData(null);
          handleSearch(searchQuery);
        }
      }

      // ✅ Handle combined master responses
      if (data.Type === "GetCategoryList" && data.Status === "Success") {
        console.log("📩 Received Categories:", data.Data);
        setCategories(data.Data || []);
      }

      if (data.Type === "GetAllUnits" && data.Status === "Success") {
        console.log("📩 Received Units:", data.Data);
        setUnits(data.Data || []);
      }

      if (data.Type === "GetAllGst" && data.Status === "Success") {
        console.log("📩 Received GST Rates:", data.Data);
        setGstRates(data.Data || []);
      }
    };

    // ✅ Add listener
    if (window.chrome && window.chrome.webview) {
      window.chrome.webview.addEventListener("message", handleMessage);

      // ✅ Send all 3 master requests together
      window.chrome.webview.postMessage({
        Action: "GetCategoryList",
        Payload: {},
      });
      window.chrome.webview.postMessage({
        Action: "GetAllUnitsList",
        Payload: {},
      });
      window.chrome.webview.postMessage({
        Action: "GetAllGstList",
        Payload: {},
      });
    }

    handleSearch(""); // load items initially

    // ✅ Cleanup listener
    return () => {
      if (window.chrome && window.chrome.webview) {
        window.chrome.webview.removeEventListener("message", handleMessage);
      }
    };
  }, []);

  // ✅ Search request
  const handleSearch = (query) => {
    setSearchQuery(query);
    if (window.chrome && window.chrome.webview) {
      window.chrome.webview.postMessage({
        action: "searchItems",
        payload: { query: query },
      });
    }
  };

const handleChange = (e) => {
  const { name, value } = e.target;

  setFormData((prev) => ({
    ...prev,
    [name]: value   // KEEP AS STRING
  }));
};





  // ✅ Save updated item
  const handleSave = (e) => {
     e.preventDefault(); // prevents accidental page reload
    if (!formData) return;
// Optional simple validation
  if (!formData.Name?.trim() || !formData.ItemCode?.trim()) {
    alert("Please fill in Item Name and Item Code before saving.");
    return;
  }
console.log("📩 item id is:", formData.Id +","+formData.CategoryName+""+formData.categoryId);
    if (window.chrome && window.chrome.webview) {
      window.chrome.webview.postMessage({
        action: "updateItem",
        payload: {
          id: formData.Id,
          name: formData.Name,
          itemcode: formData.ItemCode,
          categoryid: formData.CategoryId,
          date: formData.Date,
          description: formData.Description,
          unitid: formData.UnitId,
          gstid: formData.GstId,
        },
      });
    }
  };
// ✅ Function to call C# DeleteItemIfNoInventory
  const deleteItem = (itemId) => {
    window.chrome.webview.postMessage({
      action: "deleteItem",
      Payload: { Item_Id: FormData.itemId }
      
    });
  };


  return (
<div className="inventory-form">


      <div className="item-nav-wrapper">
                  <ItemNavBar />
            </div>
     

      {/* 🔍 Search + Item Table */}
      <div className="table-container">
        <div className="table-header">
          
          <h3 className="table-title">📋 Items List</h3>
          <input
            type="text"
            placeholder="🔍 Search by name, code, or description..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="search-box"
          />
        </div>
        <form className="inventory-body" onSubmit={handleSave}></form>

        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Item Code</th>
              <th>Category</th>
              <th>Date</th>
              <th>Description</th>
              <th>Unit</th>
              <th>GST (%)</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.length > 0 ? (
              items.map((i) => (
                <tr key={i.Id}>
                  <td>{i.Name}</td>
                  <td>{i.ItemCode}</td>
                  <td>{i.CategoryName}</td>
                  <td>{i.Date}</td>
                  <td>{i.Description}</td>
                  <td>{i.UnitName}</td>
                  <td>{i.GstPercent}</td>
                  <td>
                    
                    
                    

            <button
  className="invaction-btn invaction-modify"
  onClick={() => {
  console.log("DEBUG: Item clicked:", i);
  setFormData({
    ...i,
    CategoryId: String(i.CategoryId),
    UnitId: String(i.UnitId),
    GstId: String(i.GstId),
  });
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
                  `Are you sure you want to delete "${i.Name}"?`
                )
              ) {
                deleteItem(i.itemId);
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
              ))
            ) : (
              <tr>
                <td colSpan="8" style={{ textAlign: "center" }}>
                  No matching items found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ✏️ Edit Form Below Table */}
       
      {formData && (
  <div className="inventory-body">
    <h3 className="inventory-title">
      🏷️ Edit Inventory Details For Item : <span>{formData.Name}</span>
    </h3>

    <div className="form-row-horizontal">
      {/* Name */}
      <div className="form-group">
        <label>Name</label>
        <input
          type="text"
          name="Name"
          value={formData.Name || ""}
          onChange={handleChange}
        />
      </div>

      {/* Item Code */}
      <div className="form-group">
        <label>Item Code</label>
        <input
          type="text"
          name="ItemCode"
          value={formData.ItemCode || ""}
          onChange={handleChange}
        />
      </div>

      {/* Category */}
      <div className="form-group">
        <label>Category</label>
      <select
  name="CategoryId"
  value={formData.CategoryId ? String(formData.CategoryId) : ""}
  onChange={handleChange}
  required
>
  <option value="">-- Select Category --</option>

  {categories.map((cat) => (
    <option key={cat.Id} value={String(cat.Id)}>
      {cat.CategoryName}
    </option>
  ))}
</select>

</div>

      {/* Date */}
      <div className="form-group">
        <label>Date</label>
        <input
          type="datetime-local"
          name="Date"
          value={formData.Date || ""}
          onChange={handleChange}
        />
      </div>

      {/* Description */}
      <div className="form-group">
        <label>Description</label>
        <input
          type="text"
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
  value={formData.UnitId ? String(formData.UnitId) : ""}
  onChange={handleChange}
  required
>
  <option value="">-- Select Unit --</option>

  {units.map((u) => (
    <option key={u.Id} value={String(u.Id)}>
      {u.UnitName}
    </option>
  ))}
</select>

</div>

      {/* GST */}
      <div className="form-group">
        <label>GST (%)</label>
        <select
  name="GstId"
  value={formData.GstId ? String(formData.GstId) : ""}
  onChange={handleChange}
  required
>
  <option value="">-- Select GST --</option>

  {gstRates.map((g) => (
    <option key={g.Id} value={String(g.Id)}>
      {g.GstPercent}%
    </option>
  ))}
</select>


      </div>
    </div>

    <div className="form-actions" style={{ marginTop: "0px" }}>
       <div className="inventory-btns">
      <button
        className="btn-submit small"
        onClick={handleSave}
        disabled={!formData}
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

export default EditItem;
