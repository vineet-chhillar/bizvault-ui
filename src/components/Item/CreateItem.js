import React, { useState, useEffect, useLayoutEffect } from "react";
import "./ItemForms.css";
import ItemNavBar from "./ItemNavBar";
import AddInventoryDetails from "./AddInventoryDetails";
import BillingAppLayout from "../../BillingAppLayout";
import { User } from "lucide-react";
import EditItem from "./EditItem";
import { validateItemForm } from "../../utils/validateItemForm";



export default function CreateItem() {
  const [itemData, setItemData] = useState({
    name: "",
    itemcode: "",
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
  });

  const [errors, setErrors] = useState({});
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);

  const [itemDetails, setItemDetails] = useState([]);
  const [selectedItemForDetails, setSelectedItemForDetails] = useState(null);
  const [selectedItemName, setSelectedItemName] = useState("");

 


{/*const [categoryId, setCategoryId] = useState("");*/}
  const [category, setCategory] = useState(null);
const [categories, setCategories] = useState([]);


const [gst, setGst] = useState(null);
const [gstRates, setGstRates] = useState([]);

  const [unit, setUnit] = useState(null);
const [units, setUnits] = useState([]);


  const fetchItemDetails = (itemId) => {
  console.log("📤 Fetching inventory for item:", itemId);
  setSelectedItemForDetails(itemId);
  if (window.chrome?.webview) {
    window.chrome.webview.postMessage({
      Action: "GetItemDetails",
     Payload: { Item_Id: itemId } // ✅ send object with property name item_id
    });
  }
};


useEffect(() => {
  const handleInventoryUpdate = (e) => {
    const { itemId } = e.detail;
    fetchItemDetails(itemId);
  };

  document.addEventListener("InventoryUpdated", handleInventoryUpdate);
  return () => document.removeEventListener("InventoryUpdated", handleInventoryUpdate);
}, []);





useEffect(() => {
 if (window.chrome?.webview) {
    const handler = (event) => {
      let msg = event.data;

if (msg.Type === "GetItemDetails") {
  console.log("📦 Data received from C#:", msg);
  setItemDetails(msg.Data || []);
}


      try {
        msg = typeof msg === "string" ? JSON.parse(msg) : msg;
      } catch {}

      if (msg.Type === "GetItemDetails" && msg.Status === "Success") {
        setItemDetails(msg.Data || []);
      }
    };

    window.chrome.webview.addEventListener("message", handler);
        return () => {window.chrome.webview.removeEventListener("message", handler);

    }
  }
}, []);

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

    console.log(itemData.name,itemData.itemcode,itemData.categoryname,
      itemData.description,itemData.gstpercent,itemData.unitname,itemData.date);

  

    const user = JSON.parse(localStorage.getItem("user"));
    {/*console.log("Logged in user:", user.email);*/}

    const payload = {
      Name: itemData.name,
      ItemCode: itemData.itemcode,
      CategoryId: itemData.categoryid,
      CategoryName: itemData.categoryname,
      Date: itemData.date,
      Description: itemData.description,
       UnitId: parseInt(itemData.unitid),
       UnitName: itemData.unitname,
       GstId: parseInt(itemData.gstid),
       GstPercent: itemData.gstpercent,
      CreatedBy: user.email, 
      CreatedAt: new Date().toISOString(),
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
      categoryid: "",
      date: new Date().toISOString().split("T")[0],
      description: "",
      unitid: "",
      gstid: "",
      createdby: "",
      createdat: "",
    });
  };

  const handleAddInventoryClick = (item) => {
    console.log("🧾 Selected item for inventory:", item.Id || item.id);
    setSelectedItem({
    id: item.Id || item.id // normalize property name
    
  });
  };

  const handleInventorySave = (updatedItem) => {
  console.log("🧾 Selected item for inventory:", updatedItem.Id);
    const payload = {
    item_id: updatedItem.Id, // ✅ link to the Item table (foreign key)
    ...updatedItem.inventory
  };




console.log("📤 Sending AddItemDetails:", {
  Item_Id: updatedItem.Id,
  ...updatedItem.inventory
});

  if (window.chrome?.webview) {
    window.chrome.webview.postMessage({
      Action: "AddItemDetails",
      Payload: payload
    });
    console.log("📤 Sent AddItemDetails to C#:", payload);
  } else {
    console.warn("⚠️ WebView2 bridge not available");
  }

  setSelectedItem(null);
   
};

// ✅ Function to call C# method GetItemNameById(int id)
 async function getItemNameById(itemId) {
    return new Promise((resolve, reject) => {
      try {
        window.chrome.webview.postMessage({
          Action: "GetItemNameById",
          Payload: { id: itemId },
        });

        const handler = (event) => {
          const msg = event.data;
          if (msg.Action === "GetItemNameByIdResponse") {
            setSelectedItemName(msg.Result);
            window.chrome.webview.removeEventListener("message", handler);
            resolve(msg.Result);
          }
        };

        window.chrome.webview.addEventListener("message", handler);
      } catch (error) {
        reject(error);
      }
    });
}
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
          console.log("📩 Received category:", msg.Data);
          setCategory(msg.Data);
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
  useEffect(() => {
    if (window.chrome?.webview) {
      window.chrome.webview.postMessage({
        Action: "GetAllGstList",
        Payload: {},
      });
    }

    const handler = (event) => {
      try {
        let msg = event.data;
        if (typeof msg === "string") msg = JSON.parse(msg);

        if (msg.Type === "GetAllGst" && msg.Status === "Success") {
           console.log("📩 Received Gst:", msg.Data);
          setGstRates(msg.Data || []);
        }
      } catch (err) {
        console.error("Error parsing message:", err);
      }
    };

    window.chrome?.webview?.addEventListener("message", handler);
    return () => window.chrome?.webview?.removeEventListener("message", handler);
  }, []);

// ✅ Function to call C# method
  const GetGSTById = (id) => {
    if (window.chrome?.webview) {
      const payload = { Id: parseInt(id) };

      window.chrome.webview.postMessage({
        Action: "GetGSTByIdResponse",
        Payload: payload,
      });

      console.log("📤 Sent to C#: GetGSTByIdResponse", payload);
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

        if (msg.Type === "GetGSTById" && msg.Status === "Success") {
          console.log("📩 Received Gst:", msg.Data);
          setGst(msg.Data);
        }
      } catch (err) {
        console.error("Error parsing message:", err);
      }
    };

    window.chrome?.webview?.addEventListener("message", handler);
    return () => window.chrome?.webview?.removeEventListener("message", handler);
  }, []);

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

{/* CATEGORY */}
<div className="form-group">
  <label>Category</label>
  <select
    name="categoryid"
    value={itemData.categoryid}
    onChange={handleChange}
    className={errors.categoryid ? "error-input" : ""}
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
<div className="form-group">
  <label>GST (%)</label>
  <select
    name="gstid"
    value={itemData.gstid}
    onChange={handleChange}
    className={errors.gstid ? "error-input" : ""}
  >
    <option value="">-- Select GST --</option>
    {gstRates.map((g) => (
      <option key={g.Id} value={String(g.Id)}>
        {g.GstPercent}%
      </option>
    ))}
  </select>
  {errors.gstid && <div className="error">{errors.gstid}</div>}
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
                <th>Category</th>
                <th>Date</th>
                <th>Description</th>
                <th>Unit</th>
                <th>GST %</th>
                <th>Add/View Inventory</th>
                
              </tr>
            </thead>
            <tbody>
              {items.map((i) => (
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
    className="invaction-btn invaction-add"
    onClick={() => {
      handleAddInventoryClick(i);
      getItemNameById(i.Id);
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
      className="invaction-icon"
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
    {/*Add Inventory*/}
  </button>
 
 
  <button
    className="invaction-btn invaction-view"
    onClick={() => {
  fetchItemDetails(i.Id);
  getItemNameById(i.Id);
  setSelectedItem(null); // hides the AddInventoryDetails form
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
      className="invaction-icon"
    >
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>

   {/* View Inventory*/} 
  </button>
             
             <button
  className="invaction-btn invaction-modify"
  onClick={() => {
     if (window.confirm("Are you sure you want to modify this item?")) {
      {/*deleteItem(i.Id); // your delete function*/}
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


      

{/* --- EXISTING INVENTORY DETAILS SECTION --- */}
{itemDetails.length > 0 && (
  <div className="item-table-container">
    <h3 className="item-table-title">
      📦 Inventory Details for Item : {selectedItemName}
    </h3>

    <table className="item-table">
      <thead>
        <tr>
          <th>Item Name</th>
          <th>HSN/SAC Code</th>
          <th>Batch No</th>
          <th>Ref/Invoice No</th>
          <th>Date</th>
          <th>Quantity</th>
          <th>Purchase Price</th>

          <th>Discount Percent</th>
          <th>Net Purchase Price</th>
          <th>Amount</th>


          <th>Sales Price</th>
          <th>MRP</th>
          <th>Goods/Services</th>
          <th>Description</th>
          
        </tr>
      </thead>
      <tbody>
        {itemDetails.map((d) => (
          <tr key={d.id}>
            <td>{selectedItemName}</td>
    <td>{d.HsnCode}</td>
    <td>{d.BatchNo}</td>
    <td>{d.refno}</td>
    <td>{d.Date}</td>
    <td>{d.Quantity}</td>
    <td>{d.PurchasePrice}</td>

    <td>{d.DiscountPercent}</td>
    <td>{d.NetPurchasePrice}</td>
    <td>{d.Amount}</td>

    <td>{d.SalesPrice}</td>
    <td>{d.Mrp}</td>
    <td>{d.GoodsOrServices}</td>
    <td>{d.Description}</td>
            
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)}
{/* --- CONDITIONAL INVENTORY FORM --- */}
      {selectedItem && (
        <AddInventoryDetails 
          selectedItem={selectedItem}
          selectedItemName={selectedItemName}
          onSave={handleInventorySave}
          onCancel={() => setSelectedItem(null)}
          selectedItemForDetails={selectedItemForDetails}
          itemDetails={itemDetails}
        />
       
      )}


    </div>
  );
}
