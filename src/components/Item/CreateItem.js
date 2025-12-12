import React, { useState, useEffect, useLayoutEffect } from "react";
import "./ItemForms.css";
import ItemNavBar from "./ItemNavBar";

import { User } from "lucide-react";

import { validateItemForm } from "../../utils/validateItemForm";



export default function CreateItem() {
{/*}  const now = new Date();
const formatted =
  now.getFullYear() + "-" +
  String(now.getMonth() + 1).padStart(2, "0") + "-" +
  String(now.getDate()).padStart(2, "0") + " " +
  String(now.getHours()).padStart(2, "0") + ":" +
  String(now.getMinutes()).padStart(2, "0") + ":" +
  String(now.getSeconds()).padStart(2, "0");
  */}


  const [itemData, setItemData] = useState({
    name: "",
    itemcode: "",
    hsncode:"",
    categoryid: "",
    categoryname:"",
    date: new Date().toISOString().split("T")[0],
    description: "",
    unitid: "",
    unitname: "",
    gstid: "",
    gstpercent: "",
    createdby: "",
    createdat: "",
     reorderlevel: "",  // ⭐ NEW FIELD
  });

  const [errors, setErrors] = useState({});
  const [items, setItems] = useState([]);
  

  
  
  

 


{/*const [categoryId, setCategoryId] = useState("");*/}
  const [category, setCategory] = useState(null);
const [categories, setCategories] = useState([]);



  const [unit, setUnit] = useState(null);
const [units, setUnits] = useState([]);


 










useLayoutEffect(() => {
  // Check height + overflow for parent containers
  const containers = document.querySelectorAll(".app-container, .main-layout, .main-content, .form-container, .inventory-form");
  containers.forEach((el) => {
    const styles = window.getComputedStyle(el);
    console.log("📦", el.className, {
      height: el.clientHeight,
      overflow: styles.overflow,
      overflowY: styles.overflowY,
    });
  });
}, []);


useEffect(() => {
  if (window.chrome?.webview) {
    const handler = (event) => {
      let msg = event.data;
      console.log("📩 Message from C#: ", msg);

      // Parse JSON if it’s a string
      if (typeof msg === "string") {
        try {
          msg = JSON.parse(msg);
        } catch {
          console.warn("Non-JSON string message:", msg);
          return;
        }
      }

      // Handle messages by Type
      if (msg.Type === "AddItem") {
        if (msg.Status === "Success") {
          alert("✅ " + msg.Message);
          fetchItems(); // ✅ Reload items from DB
        } else {
          alert("❌ " + msg.Message);
        }
      }

       if (msg.Type === "deleteItemResponse") {
         if (msg.Status === "Success") {
          alert("✅ " + msg.Message);
          fetchItems(); // ✅ Reload items from DB
        } else {
          alert("❌ " + msg.Message);
        }

       }

      if (msg.Type === "GetItems" && msg.Status === "Success") {
        setItems(msg.Data);
      }
    };

    window.chrome.webview.addEventListener("message", handler);
    fetchItems(); // Load on startup
    return () => window.chrome.webview.removeEventListener("message", handler);
  }
}, []);

  // 🔄 Fetch items from SQLite via C#
  const fetchItems = () => {
    if (window.chrome?.webview) {
      window.chrome.webview.postMessage({ Action: "GetItems" });
    }
  };


   // ✍️ Handle form changes
  {/*const handleChange = (e) => {
    setItemData({ ...itemData, [e.target.name]: e.target.value });
  };*/}

  // ✅ Handle field changes
const handleChange = (e) => {
  const { name, value } = e.target;

  setItemData((prev) => ({
    ...prev,
    [name]:
      name === "categoryid" || name === "unitid" || name === "gstid"
        ? parseInt(value)
        : value,
  }));
};


  // 💾 Handle item submission → send to C#
  const handleSubmit = (e) => {
    e.preventDefault();

     const itemErrors = validateItemForm(itemData);

if (itemErrors.length > 0) {
  const map = {};
  itemErrors.forEach(e => (map[e.field] = e.message));
  setErrors(map);
  return;
}

    console.log(itemData.name,itemData.itemcode,itemData.hsncode,itemData.categoryname,
      itemData.description,itemData.gstpercent,itemData.unitname,itemData.date);

  const dateFromCalendar = itemData.date; // e.g., "2025-11-27"

const now = new Date();
const timePart =
  String(now.getHours()).padStart(2, "0") + ":" +
  String(now.getMinutes()).padStart(2, "0") + ":" +
  String(now.getSeconds()).padStart(2, "0");

// Merge date + time → "2025-11-27 14:32:10"
const finalDateTime = `${dateFromCalendar} ${timePart}`;


    const user = JSON.parse(localStorage.getItem("user"));
    {/*console.log("Logged in user:", user.email);*/}

    const payload = {
      Name: itemData.name,
      ItemCode: itemData.itemcode,
      HsnCode:itemData.hsncode,
      CategoryId: itemData.categoryid,
      CategoryName: itemData.categoryname,
      Date: finalDateTime,
      Description: itemData.description,
       UnitId: parseInt(itemData.unitid),
       UnitName: itemData.unitname,
       GstId: parseInt(itemData.gstid),
       GstPercent: itemData.gstpercent,
      CreatedBy: user.email, 
      CreatedAt: new Date().toISOString(),
       ReorderLevel: Number(itemData.reorderlevel),   // ⭐ NEW FIELD TO SEND
    };

    if (window.chrome?.webview) {
      window.chrome.webview.postMessage({ Action: "AddItem", Payload: payload });
      console.log("📤 Sent to C#: ", payload);
    } else {
      console.warn("⚠️ WebView2 bridge not available");
    }

    setItemData({
      name: "",
      itemcode: "",
      hsncode:"",
      categoryid: "",
      date: new Date().toISOString().split("T")[0],
      description: "",
      unitid: "",
      gstid: "",
      createdby: "",
      createdat: "",
      reorderlevel: "",   // ⭐ RESET THIS TOO
    });
  };

  

  


//---------------------category

// ✅ Function to call C# method
  const getCategoryById = (id) => {
    if (window.chrome?.webview) {
      const payload = { Id: parseInt(id) };

      window.chrome.webview.postMessage({
        Action: "GetCategoryById",
        Payload: payload,
      });

      console.log("📤 Sent to C#: GetCategoryById", payload);
    } else {
      console.warn("⚠️ WebView bridge not available");
    }
  };
  // ✅ Listen for C# response
  useEffect(() => {
    const handler = (event) => {
      try {
        let msg = event.data;
        if (typeof msg === "string") msg = JSON.parse(msg);

        if (msg.Type === "GetCategoryById" && msg.Status === "Success") {
  const c = msg.Data;  // Shortcut

  setCategory(c);

  setItemData(prev => ({
    ...prev,
    categoryid: c.Id,
    categoryname: c.CategoryName,
    hsncode: c.DefaultHsn,             // ⬅ Auto-fill HSN
    gstid: c.DefaultGstId,             // ⬅ Auto-fill GST ID
    gstpercent: c.DefaultGstPercent    // ⬅ Auto-fill GST percent
  }));
}
      } catch (err) {
        console.error("Error parsing message:", err);
      }
    };

    window.chrome?.webview?.addEventListener("message", handler);
    return () => window.chrome?.webview?.removeEventListener("message", handler);
  }, []);

// ✅ Fetch categories from C# on load
  useEffect(() => {
    if (window.chrome?.webview) {
      window.chrome.webview.postMessage({
        Action: "GetCategoryList",
        Payload: {},
      });
    }

    const handler = (event) => {
      try {
        let msg = event.data;
        if (typeof msg === "string") msg = JSON.parse(msg);

        if (msg.Type === "GetCategoryList" && msg.Status === "Success") {
           console.log("📩 Received category:", msg.Data);
          setCategories(msg.Data || []);
        }
      } catch (err) {
        console.error("Error parsing message:", err);
      }
    };

    window.chrome?.webview?.addEventListener("message", handler);
    return () => window.chrome?.webview?.removeEventListener("message", handler);
  }, []);
//------------------units
// ✅ Fetch units from C# on load
  useEffect(() => {
    if (window.chrome?.webview) {
      window.chrome.webview.postMessage({
        Action: "GetAllUnitsList",
        Payload: {},
      });
    }

    const handler = (event) => {
      try {
        let msg = event.data;
        if (typeof msg === "string") msg = JSON.parse(msg);

        if (msg.Type === "GetAllUnits" && msg.Status === "Success") {
           console.log("📩 Received Units:", msg.Data);
          setUnits(msg.Data || []);
        }
      } catch (err) {
        console.error("Error parsing message:", err);
      }
    };

    window.chrome?.webview?.addEventListener("message", handler);
    return () => window.chrome?.webview?.removeEventListener("message", handler);
  }, []);

// ✅ Function to call C# method
  const GetUnitNameById = (id) => {
    if (window.chrome?.webview) {
      const payload = { Id: parseInt(id) };

      window.chrome.webview.postMessage({
        Action: "GetUnitNameByIdResponse",
        Payload: payload,
      });

      console.log("📤 Sent to C#: GetUnitNameById", payload);
    } else {
      console.warn("⚠️ WebView bridge not available");
    }
  };
  // ✅ Listen for C# response
  useEffect(() => {
    const handler = (event) => {
      try {
        let msg = event.data;
        if (typeof msg === "string") msg = JSON.parse(msg);

        if (msg.Type === "GetUnitNameById" && msg.Status === "Success") {
          console.log("📩 Received Units:", msg.Data);
          setUnit(msg.Data);
        }
      } catch (err) {
        console.error("Error parsing message:", err);
      }
    };

    window.chrome?.webview?.addEventListener("message", handler);
    return () => window.chrome?.webview?.removeEventListener("message", handler);
  }, []);
//---------------------------------------gst
// ✅ Fetch units from C# on load
 

// ✅ Function to call C# method
  
  // ✅ Listen for C# response


// ✅ Function to call C# DeleteItemIfNoInventory
  const deleteItem = (itemId) => {
    window.chrome.webview.postMessage({
      action: "deleteItem",
      Payload: { Item_Id: itemId }
      
    });
  };



  return (
    <div className="form-container">
      {/*<h2 className="form-title">Create New Item/Inventory</h2>*/}
      <div className="item-nav-wrapper">
      <ItemNavBar />
</div>
      {/* --- BASIC ITEM FORM --- */}
      <div className="form-inner">
      <form className="form-body" onSubmit={handleSubmit}>
        <div className="form-row">
        

        {/* CATEGORY */}
<div className="form-group">
  <label>Category</label>
  <select
  name="categoryid"
  value={itemData.categoryid}
  onChange={(e) => {
    handleChange(e);
    getCategoryById(e.target.value); // ⬅ Fetch defaults from C#
  }}
>
    <option value="">-- Select Category --</option>
    {categories.map((cat) => (
      <option key={cat.Id} value={String(cat.Id)}>
        {cat.CategoryName}
      </option>
    ))}
  </select>
  {errors.categoryid && <div className="error">{errors.categoryid}</div>}
</div>

        {/* ITEM NAME */}
<div className="form-group">
  <label>Item Name</label>
  <input
    name="name"
    value={itemData.name}
    onChange={handleChange}
    placeholder="Enter item name"
    className={errors.name ? "error-input" : ""}
  />
  {errors.name && <div className="error">{errors.name}</div>}
</div>

{/* ITEM CODE */}
<div className="form-group">
  <label>Item Code</label>
  <input
    name="itemcode"
    value={itemData.itemcode}
    onChange={handleChange}
    placeholder="Enter item code"
    className={errors.itemcode ? "error-input" : ""}
  />
  {errors.itemcode && <div className="error">{errors.itemcode}</div>}
</div>


{/* HSN CODE */}
<div className="form-group">
  <label>HSN Code</label>
  <input
    name="hsncode"
    value={itemData.hsncode}
    readOnly
    className="readonly-input"
    placeholder="Auto-filled from category"
  />
</div>



{/* DATE */}
<div className="form-group">
  <label>Date</label>
  <input
    type="date"
    name="date"
    value={itemData.date}
    onChange={handleChange}
    placeholder="Enter Date"
    className={errors.date ? "error-input" : ""}
  />
  {errors.date && <div className="error">{errors.date}</div>}
</div>

{/* DESCRIPTION */}
<div className="form-group">
  <label>Description</label>
  <input
    name="description"
    value={itemData.description}
    onChange={handleChange}
    placeholder="Enter description"
    className={errors.description ? "error-input" : ""}
  />
  {errors.description && <div className="error">{errors.description}</div>}
</div>

{/* UNIT */}
<div className="form-group">
  <label>Unit</label>
  <select
    name="unitid"
    value={itemData.unitid}
    onChange={handleChange}
    className={errors.unitid ? "error-input" : ""}
  >
    <option value="">-- Select Unit --</option>
    {units.map((u) => (
      <option key={u.Id} value={String(u.Id)}>
        {u.UnitName}
      </option>
    ))}
  </select>
  {errors.unitid && <div className="error">{errors.unitid}</div>}
</div>

{/* GST */}
{/* GST (Read-only) */}
<div className="form-group">
  <label>GST (%)</label>
  <input
    name="gstpercent"
    value={itemData.gstpercent}
    readOnly
    className="readonly-input"
    placeholder="Auto-filled from category"
  />
</div>


{/* REORDER LEVEL */}
<div className="form-group">
  <label>Reorder Level</label>
  <input 
    type="number"
    name="reorderlevel"
    value={itemData.reorderlevel}
    onChange={handleChange}
    placeholder="Enter reorder level"
    className={errors.reorderlevel ? "error-input" : ""}
  />
  {errors.reorderlevel && <div className="error">{errors.reorderlevel}</div>}
</div>






        </div>
        <div className="inventory-btns">
        <button type="submit" className="btn-submit small">
          Save Item
        </button>
        </div>
      </form>
</div>
      {/* --- EXISTING ITEMS LIST --- */}
      {items.length > 0 && (
        <div className="table-container">
          <h3 className="table-title">📋 Existing Items</h3>
          <table className="data-table">
            <thead>
              <tr>
                <th>Item Name</th>
                <th>Item Code</th>
                <th>HSN/SAC Code</th>
                <th>Category</th>
                <th>Date</th>
                <th>Description</th>
                <th>Unit</th>
                <th>GST %</th>
                <th>Reorder Level</th>
                <th>Add/View Inventory</th>
                
              </tr>
            </thead>
            <tbody>
              {items.map((i) => (
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
  
 
 
  
     
<button
            className="invaction-btn invaction-delete"
            onClick={() => {
              if (
                window.confirm(
                  `Are you sure you want to delete "${i.Name}"?`
                )
              ) {
                deleteItem(i.Id);
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


      





    </div>
  );
}
