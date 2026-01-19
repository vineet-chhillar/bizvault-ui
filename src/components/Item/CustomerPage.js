import React, { useEffect, useState } from "react";
import "./SupplierPage.css"; // keep same css
import { getCreatedBy } from "../../utils/authHelper";

const emptyCustomer = {
  CustomerId: 0,
  CustomerName: "",
  ContactPerson: "",
  Mobile: "",
  Email: "",
  GSTIN: "",
  
  BillingAddress: "",
  BillingCity: "",
  BillingPincode: "",
  BillingState: "",

  ShippingAddress: "",
  ShippingCity: "",
  ShippingPincode: "",
  ShippingState: "",

  OpeningBalance: 0,
  Balance: 0,
  CreditDays: 0,
  CreditLimit: 0,
  CreatedBy: "",
  CreatedAt: "",
  UpdatedBy: "",
  UpdatedAt: ""
};

function CustomerPage() {
  const [customers, setCustomers] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(false);

  const [customer, setCustomer] = useState(null);
  const [saving, setSaving] = useState(false);

  const INDIAN_STATES = [
    "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh",
    "Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka",
    "Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram",
    "Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana",
    "Tripura","Uttar Pradesh","Uttarakhand","West Bengal","Delhi",
    "Jammu & Kashmir","Ladakh","Puducherry","Andaman & Nicobar",
    "Chandigarh","Dadra & Nagar Haveli","Daman & Diu","Lakshadweep"
  ];

  // LOAD CUSTOMERS
  const loadCustomers = (kw = "") => {
  if (!window.chrome?.webview) return;

  setLoading(true);

  const handler = (event) => {
    const msg = event.data;

    if (!msg || msg.action !== "searchCustomersResult") return;

    window.chrome.webview.removeEventListener("message", handler);

    if (msg.success) setCustomers(msg.data || []);
    else console.error(msg.error);

    setLoading(false);
  };

  window.chrome.webview.addEventListener("message", handler);

  window.chrome.webview.postMessage({
    Action: "searchCustomers",
    Payload: { Keyword: kw || "" },
  });
};


  useEffect(() => {
    loadCustomers("");
  }, []);

  // LOAD FOR EDIT
  const loadCustomerForEdit = (id) => {
    if (!window.chrome?.webview) return;

    if (!id || id === 0) {
      setCustomer({ ...emptyCustomer });
      return;
    }

    const handler = (event) => {
      const msg = event.data;
      if (!msg || msg.action !== "loadCustomer") return;
      window.chrome.webview.removeEventListener("message", handler);

      if (msg.success && msg.data) setCustomer(msg.data);
      else alert(msg.error || "Customer not found");
    };

    window.chrome.webview.addEventListener("message", handler);
    window.chrome.webview.postMessage({
      Action: "loadCustomer",
      Payload: { CustomerId: id },
    });
  };

  // DELETE
  const handleDelete = (c) => {
    if (!window.chrome?.webview) return;
    if (!window.confirm(`Delete customer "${c.CustomerName}"?`)) return;

    const handler = (event) => {
      const msg = event.data;
      if (!msg || msg.action !== "deleteCustomer") return;

      window.chrome.webview.removeEventListener("message", handler);

      if (msg.success) {
        alert(msg.message || "Deleted successfully");
        loadCustomers(keyword);
      } else {
        alert(msg.error || "Delete failed");
      }
    };

    window.chrome.webview.addEventListener("message", handler);
    window.chrome.webview.postMessage({
      Action: "deleteCustomer",
      Payload: { CustomerId: c.CustomerId },
    });
  };

  // SAVE
  const handleSave = () => {
  if (!window.chrome?.webview) return;

  if (!customer.CustomerName.trim()) {
    alert("Customer Name is required");
    return;
  }

  if (!customer.BillingState || customer.BillingState.trim() === "") {
    alert("Billing State is required");
    return;
  }

  setSaving(true);

  const handler = (event) => {
    const msg = event.data;
    if (!msg || msg.action !== "saveCustomer") return;
    window.chrome.webview.removeEventListener("message", handler);

    setSaving(false);

    if (msg.success) {
      alert(msg.message || "Saved successfully");

      // Refresh full table
      loadCustomers("");

      // Clear search box
      setKeyword("");

      // Close form OR keep it open
      // If you want to close form, uncomment:
      // setCustomer(null);
      
    } else {
      alert(msg.error || "Save failed");
    }
  };

  window.chrome.webview.addEventListener("message", handler);
 const user = getCreatedBy();

const payload = {
  ...customer
};

if (customer.CustomerId === 0) {
  // 🔹 CREATE
  payload.CreatedBy = user;
  payload.UpdatedBy = null;
} else {
  // 🔹 UPDATE
  payload.CreatedBy = customer.CreatedBy; // preserve
  payload.UpdatedBy = user;
}


window.chrome.webview.postMessage({
  Action: "saveCustomer",
  Payload: payload,
});

};



  const handleChange = (field, value) =>
    setCustomer((p) => ({ ...p, [field]: value }));

  return (
    <div className="page suppliers-page">

      <div className="page-header card-header">
        <div className="header-icon-title">
          <h2>Customers</h2>
        </div>
      </div>

      <div className="supplier-left-panel">
        <div className="toolbar">
          <input
            className="search-box"
            type="text"
            placeholder="Search by name, mobile, GSTIN..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && loadCustomers(keyword)}
          />
          <button className="btn-submit search" onClick={() => loadCustomers(keyword)}>
            Search
          </button>
        </div>

        <button
          className="btn-submit small fullwidth"
          onClick={() => loadCustomerForEdit(0)}
        >
          + New Customer
        </button>
      </div>

      {loading && <div>Loading...</div>}

      <table className="data-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Mobile</th>
            <th>Email</th>
            <th>GSTIN</th>
            <th>Billing City</th>
            <th>Billing State</th>
            <th>Opening Balance</th>
            <th>Balance</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {!loading && customers.length === 0 && (
            <tr>
              <td colSpan={7} style={{ textAlign: "center" }}>No customers found</td>
            </tr>
          )}

          {customers.map((c) => (
            <tr key={c.CustomerId}>
              <td>{c.CustomerName}</td>
              <td>{c.Mobile}</td>
              <td>{c.Email}</td>
              <td>{c.GSTIN}</td>
              <td>{c.BillingCity}</td>
              <td>{c.BillingState}</td>
              <td>{c.OpeningBalance}</td>
              <td>{c.Balance}</td>
              <td>
                <button className="invaction-btn invaction-modify"
                        onClick={() => loadCustomerForEdit(c.CustomerId)}>
                  Edit
                </button>
                <button className="invaction-btn invaction-delete"
                        onClick={() => handleDelete(c)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {customer && (
        <div className="inventory-form">
          <h3>{customer.CustomerId === 0 ? "New Customer" :
            `Edit Customer — ${customer.CustomerName}`}</h3>

          <div className="form-body">

            <div className="form-group wide">
              <label>Customer Name *</label>
              <input
                type="text"
                value={customer.CustomerName}
                onChange={(e) => handleChange("CustomerName", e.target.value)}
              />
            </div>

            <div className="form-group wide">
              <label>Contact Person</label>
              <input
                type="text"
                value={customer.ContactPerson}
                onChange={(e) => handleChange("ContactPerson", e.target.value)}
              />
            </div>

            <div className="form-group small">
              <label>Mobile</label>
              <input
                type="text"
                value={customer.Mobile}
                onChange={(e) => handleChange("Mobile", e.target.value)}
              />
            </div>

            <div className="form-group wide">
              <label>Email</label>
              <input
                type="text"
                value={customer.Email}
                onChange={(e) => handleChange("Email", e.target.value)}
              />
            </div>

            <div className="form-group small">
              <label>GSTIN</label>
              <input
                type="text"
                value={customer.GSTIN}
                onChange={(e) => handleChange("GSTIN", e.target.value)}
              />
            </div>

            <div className="form-group address">
              <label>Billing Address</label>
              <textarea
                value={customer.BillingAddress}
                onChange={(e) => handleChange("BillingAddress", e.target.value)}
              />
            </div>

            <div className="form-group mid">
              <label>Billing City</label>
              <input
                type="text"
                value={customer.BillingCity}
                onChange={(e) => handleChange("BillingCity", e.target.value)}
              />
            </div>

            <div className="form-group mid">
              <label>Billing State *</label>
              <select
                value={customer.BillingState}
                onChange={(e) => handleChange("BillingState", e.target.value)}
              >
                <option value="">-- Select State --</option>
                {INDIAN_STATES.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div className="form-group small">
              <label>Billing Pincode</label>
              <input
                type="text"
                value={customer.BillingPincode}
                onChange={(e) => handleChange("BillingPincode", e.target.value)}
              />
            </div>

            <div className="form-group address">
              <label>Shipping Address</label>
              <textarea
                value={customer.ShippingAddress}
                onChange={(e) => handleChange("ShippingAddress", e.target.value)}
              />
            </div>

            <div className="form-group mid">
              <label>Shipping City</label>
              <input
                type="text"
                value={customer.ShippingCity}
                onChange={(e) => handleChange("ShippingCity", e.target.value)}
              />
            </div>

            <div className="form-group mid">
              <label>Shipping State</label>
              <select
                value={customer.ShippingState}
                onChange={(e) => handleChange("ShippingState", e.target.value)}
              >
                <option value="">-- Select State --</option>
                {INDIAN_STATES.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div className="form-group small">
              <label>Shipping Pincode</label>
              <input
                type="text"
                value={customer.ShippingPincode}
                onChange={(e) => handleChange("ShippingPincode", e.target.value)}
              />
            </div>

            <div className="form-group small">
              <label>Credit Days</label>
              <input
                type="number"
                value={customer.CreditDays}
                onChange={(e) => handleChange("CreditDays", parseInt(e.target.value) || 0)}
              />
            </div>

            <div className="form-group small">
              <label>Credit Limit</label>
              <input
                type="number"
                value={customer.CreditLimit}
                onChange={(e) => handleChange("CreditLimit", parseFloat(e.target.value) || 0)}
              />
            </div>

            {customer.CustomerId === 0 && (
              <div className="form-group small">
                <label>Opening Balance</label>
                <input
                  type="number"
                  value={customer.OpeningBalance}
                  onChange={(e) =>
                    handleChange("OpeningBalance", parseFloat(e.target.value) || 0)}
                />
              </div>
            )}

            <div className="form-group small">
              <label>Balance</label>
              <input type="number" value={customer.Balance || 0} readOnly />
            </div>

          </div>

          <div className="inventory-btns">
            <button
              type="submit"
              className="btn-submit small"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? "Saving..." : "Save"}
            </button>

            <button
              type="button"
              className="btn-submit small"
              onClick={() => setCustomer(null)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

export default CustomerPage;
