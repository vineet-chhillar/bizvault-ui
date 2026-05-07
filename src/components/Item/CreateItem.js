import React, { useState, useEffect, useLayoutEffect } from "react";
import "./ItemForms.css";
import ItemNavBar from "./ItemNavBar";
import { getCreatedBy } from "../../utils/authHelper";
import { User } from "lucide-react";

import { validateItemForm } from "../../utils/validateItemForm";



export default function CreateItem() {
  const [itemData, setItemData] = useState({
    name: "",
    itemcode: "",
    hsncode:"",
    categoryid: "",
    categoryname:"",
    date: new Date().toISOString().split("T")[0],
    description: "",
     unitid: 7,
  unitname: "Number",
    gstid: "",
    gstpercent: "",
    createdby: "",
    createdat: "",
     reorderlevel: 5,  // ⭐ NEW FIELD
      isactive: true,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [errors, setErrors] = useState({});
  const [items, setItems] = useState([]);
  const [modal, setModal] = useState({
  show: false,
  message: "",
  onClose: null
});
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

  // 🔹 Frontend validation (non-blocking)
  const itemErrors = validateItemForm(itemData);
console.log("🔍 front Validation errors: ", itemErrors);
  if (itemErrors.length > 0) {
    const map = {};
    itemErrors.forEach(e => (map[e.field] = e.message));
    setErrors(map);
     return;
  }

  const now = new Date();
  const timePart =
    String(now.getHours()).padStart(2, "0") + ":" +
    String(now.getMinutes()).padStart(2, "0") + ":" +
    String(now.getSeconds()).padStart(2, "0");

  const finalDateTime = `${itemData.date} ${timePart}`;

  const payload = {
    Name: itemData.name?.trim(),
    ItemCode: itemData.itemcode?.trim(),
    HsnCode: itemData.hsncode,
    CategoryId: itemData.categoryid,
    CategoryName: itemData.categoryname,
    Date: finalDateTime,
    Description: itemData.description?.trim(),
    UnitId: parseInt(itemData.unitid),
    UnitName: itemData.unitname,
    GstId: parseInt(itemData.gstid),
    GstPercent: itemData.gstpercent,
    CreatedBy: getCreatedBy(),
    CreatedAt: new Date().toISOString(),
    ReorderLevel: Number(itemData.reorderlevel),
  };

  if (window.chrome?.webview) {
    window.chrome.webview.postMessage({
      Action: "AddItem",
      Payload: payload
    });
  }
};
useEffect(() => {
  fetchItems();
  const handler = (event) => {
    let msg = event.data;

    // Parse JSON safely
    if (typeof msg === "string") {
      try {
        msg = JSON.parse(msg);
      } catch {
        console.warn("Invalid JSON:", msg);
        return;
      }
    }

    console.log("📩 Unified Message:", msg);

    switch (msg.Type) {

      // 🔴 ADD ITEM RESULT
      case "AddItemResult":
        if (msg.Status === "ValidationFailed") {
          setErrors(msg.Data?.errors || {});
          return;
        }

        if (msg.Status === "Error") {
          setModal({
            show: true,
            message: msg.Message || "Something went wrong",
            type: "error"
          });
          return;
        }

        if (msg.Status === "Success") {
          setErrors({});

          setModal({
            show: true,
            message: msg.Message || "Item saved successfully",
            type: "success",
            onClose: () => {
              setItemData({
                name: "",
                itemcode: "",
                hsncode: "",
                categoryid: "",
                date: new Date().toISOString().split("T")[0],
                description: "",
                unitid: "",
                gstid: "",
                reorderlevel: "",
              });

              fetchItems();
            }
          });
        }
        break;

      // 🔴 GET ITEMS
      case "GetItems":
        if (msg.Status === "Success") {
          setItems(msg.Data || []);
        }
        break;

      // 🔴 CATEGORY DETAILS
      case "GetCategoryById":
        if (msg.Status === "Success") {
          const c = msg.Data;
          setCategory(c);

          setItemData(prev => ({
            ...prev,
            categoryid: c.Id,
            categoryname: c.CategoryName,
            hsncode: c.DefaultHsn,
            gstid: c.DefaultGstId,
            gstpercent: c.DefaultGstPercent
          }));
        }
        break;

      default:
        // Handle old lowercase actions (temporary compatibility)
        if (msg.action === "getActiveCategoryListResult" && msg.success) {
          setCategories(msg.data || []);
        }

        if (msg.action === "getActiveUnitListResult" && msg.success) {
          setUnits(msg.data || []);
        }
        break;
    }
  };

  window.chrome.webview.addEventListener("message", handler);

  return () => {
    window.chrome.webview.removeEventListener("message", handler);
  };
}, []);
  

  


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
  

// ✅ Fetch categories from C# on load
  useEffect(() => {
    if (window.chrome?.webview) {
      window.chrome.webview.postMessage({
  Action: "getActiveCategoryList",
  Payload: {},
});

    }

    const handler = (event) => {
      try {
        let msg = event.data;
        if (typeof msg === "string") msg = JSON.parse(msg);

        if (msg.action === "getActiveCategoryListResult" && msg.success) {
           console.log("📩 Received category:", msg.Data);
          setCategories(msg.data || []);
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
        Action: "getActiveUnitList",
        Payload: {},
      });
    }

    const handler = (event) => {
      try {
        let msg = event.data;
        if (typeof msg === "string") msg = JSON.parse(msg);

        if (msg.action === "getActiveUnitListResult" && msg.success) {
           console.log("📩 Received Units:", msg.data);
          setUnits(msg.data || []);
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
  {/*const deleteItem = (itemId) => {
    window.chrome.webview.postMessage({
      action: "deleteItem",
      Payload: { Item_Id: itemId }
      
    });
  };*/}
const filteredItems = items.filter((i) =>
  i.Name?.toLowerCase().includes(searchTerm.toLowerCase())
);


  return (
    <>
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
      <div className="table-container">
  <h3 className="table-title">📋 Existing Items</h3>

  {/* 🔍 ALWAYS visible */}
 
<div className="table-search-bar">
  <input
    type="text"
    placeholder="Search by item name..."
    value={searchTerm}
     onChange={(e) => setSearchTerm(e.target.value)}
    className="table-search-input"
  />
</div>
  <table className="data-itemtable">
    <thead>
      <tr>
        <th>#</th>
        <th>Item Name</th>
        <th>Item Code</th>
        <th>HSN/SAC Code</th>
        <th>Category</th>
        <th>Date</th>
        <th>Description</th>
        <th>Unit</th>
        <th>GST %</th>
        <th>Reorder Level</th>
        <th>Is Active</th>
      </tr>
    </thead>

    <tbody>
      {filteredItems.length > 0 ? (
        filteredItems.map((i, index) => (
          <tr key={i.Id}>
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
            <td>{Number(i.IsActive) === 1 ? "Active" : "Inactive"}</td>
          </tr>
        ))
      ) : (
        <tr>
          <td colSpan="11" style={{ textAlign: "center", padding: "15px", color: "#888" }}>
            {searchTerm
              ? "🔍 No matching items found"
              : "📭 No items available"}
          </td>
        </tr>
      )}
    </tbody>
  </table>
</div>


      





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
}