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
const [errors, setErrors] = useState({});
const [originalState, setOriginalState] = useState("");
const [modal, setModal] = useState({
  show: false,
  message: "",
  type: "info",
  onConfirm: null,
  onClose: null
});
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
    setErrors({}); // ✅ clear old validation
    if (!window.chrome?.webview) return;

    if (!id || id === 0) {
      setCustomer({ ...emptyCustomer });
      return;
    }

    const handler = (event) => {
      const msg = event.data;
      if (!msg || msg.action !== "loadCustomer") return;
      window.chrome.webview.removeEventListener("message", handler);

      if (msg.success && msg.data)
      {
        setCustomer(msg.data);
       setOriginalState(msg.data.BillingState || "");
      }
      else alert(msg.error || "Customer not found");
    };

    window.chrome.webview.addEventListener("message", handler);
    window.chrome.webview.postMessage({
      Action: "loadCustomer",
      Payload: { CustomerId: id },
    });
  };
const checkAndDeleteCustomer = (customerId) => {
  const handler = (event) => {
    const msg = event.data;

    if (!msg || msg.action !== "canDeleteCustomerResult") return;

    window.chrome.webview.removeEventListener("message", handler);

    if (!msg.canDelete) {
      setModal({
        show: true,
        message: msg.message || "Customer cannot be deleted"
      });
      return;
    }

    // ✅ Allowed → proceed
    deleteCustomerNow(customerId);
  };

  window.chrome.webview.addEventListener("message", handler);

  window.chrome.webview.postMessage({
    Action: "CanDeleteCustomer",
    Payload: { customerId }
  });
};
  // DELETE
  const deleteCustomerNow = (id) => {
  const handler = (event) => {
    const msg = event.data;
    if (!msg || msg.action !== "deleteCustomer") return;

    window.chrome.webview.removeEventListener("message", handler);

    if (msg.success) {
      setModal({
        show: true,
        message: msg.message || "Deleted successfully",
        onClose: () => {
  loadCustomers(keyword);

  setCustomer(null);   // ✅ close form if open
  setErrors({});       // ✅ clear errors
}
              // ✅ clear errors
      });
    } else {
      setModal({
        show: true,
        message: msg.error || "Delete failed"
      });
    }
  };

  window.chrome.webview.addEventListener("message", handler);

  window.chrome.webview.postMessage({
    Action: "deleteCustomer",
    Payload: { CustomerId: id }
  });
};
const checkCustomerStateChange = (customerId, newState, onSuccess) => {
  if (!window.chrome?.webview) return;

  const handler = (event) => {
    const msg = event.data;

    if (!msg || msg.action !== "canChangeCustomerStateResult") return;

    window.chrome.webview.removeEventListener("message", handler);

    if (!msg.canChange) {
      setModal({
        show: true,
        message: msg.message || "Billing State cannot be changed"
      });
      return;
    }

    // ✅ allowed → continue save
    onSuccess();
  };

  window.chrome.webview.addEventListener("message", handler);

  window.chrome.webview.postMessage({
    Action: "CanChangeCustomerState",
    Payload: {
      customerId,
      newState
    }
  });
};
  // SAVE
  const handleSave = () => {
  if (!window.chrome?.webview) return;

  let err = {};

  if (!customer.CustomerName?.trim()) {
    err.CustomerName = "Customer Name is required";
  }

  if (!customer.BillingState?.trim()) {
    err.BillingState = "Billing State is required";
  }

  if (customer.Mobile && !/^\d{10}$/.test(customer.Mobile)) {
  err.Mobile = "Mobile must be 10 digits";
  }

  if (customer.GSTIN && customer.GSTIN.length !== 15) {
    err.GSTIN = "GSTIN must be 15 characters";
  }

  if (Object.keys(err).length > 0) {
    setErrors(err);
    return;
  }

  // 🔥 STATE CHANGE CHECK (only for edit)
  if (
    customer.CustomerId !== 0 &&
    originalState !== customer.BillingState
  ) {
    checkCustomerStateChange(
      customer.CustomerId,
      customer.BillingState,
      () => {
        actuallySaveCustomer();
      }
    );
    return;
  }

  // ✅ Direct save
  actuallySaveCustomer();
};
const actuallySaveCustomer = () => {
  setSaving(true);

  const handler = (event) => {
    let msg = event.data;

    // 🔴 Parse if string (important for WebView)
    if (typeof msg === "string") {
      try { msg = JSON.parse(msg); } catch { return; }
    }

    if (!msg || msg.action !== "saveCustomer") return;

    window.chrome.webview.removeEventListener("message", handler);

    setSaving(false);

    // 🔴 1. HANDLE VALIDATION FIRST (NEW)
    if (msg.validation && !msg.validation.isValid) {
      const errors = msg.validation.errors || {};

      setErrors(errors);

      // 🔥 Convert errors to readable message
      const message = Object.entries(errors)
        .map(([field, val]) => `${field}: ${val}`)
        .join("\n");

      setModal({
        show: true,
        message: message || msg.message || "Validation failed",
        type: "error"
      });

      return;
    }

    // ✅ 2. SUCCESS
    if (msg.success) {
      setErrors({});

      setModal({
        show: true,
        message: msg.message || "Saved successfully",
        type: "success",
        onClose: () => {
          loadCustomers("");
          setCustomer(null);
          setKeyword("");

          if (customer.CustomerId === 0) {
            setCustomer({ ...emptyCustomer });
          }
        }
      });

      return;
    }

    // ❌ 3. OTHER ERRORS (DB / exception)
    setModal({
      show: true,
      message: msg.message || "Save failed",
      type: "error"
    });
  };

  window.chrome.webview.addEventListener("message", handler);

  const user = getCreatedBy();

  const payload = {
    ...customer
  };

  if (customer.CustomerId === 0) {
    payload.CreatedBy = user;
    payload.UpdatedBy = null;
  } else {
    payload.CreatedBy = customer.CreatedBy;
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
    <>
    <div className="page suppliers-page">

      <div className="page-header card-header">
        <div className="header-icon-title">
          <h2>Customers</h2>
        </div>
      </div>

      <div className="supplier-left-panel">
        <div className="toolbar">
          
          <div className="table-search-bar">
 <input
  type="text"
  placeholder="Search by name, mobile, GSTIN..."
  value={keyword}
  onChange={(e) => {
    const value = e.target.value;

    setKeyword(value);

    loadCustomers(value);
  }}
  className="table-search-input"
/>
</div>


          
        </div>

        <button
          className="btn-submit small fullwidth"
          onClick={() => loadCustomerForEdit(0)}
        >
          + New Customer
        </button>
      </div>

      {loading && <div>Loading...</div>}
<div className="customer-table-wrapper">
     <table className="data-customertable">
  <thead>
    <tr>
      <th>#</th> {/* ✅ Serial No */}
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
        <td colSpan={10} style={{ textAlign: "center" }}>
          No customers found
        </td>
      </tr>
    )}

    {customers.map((c, index) => (
      <tr key={c.CustomerId}>
        {/* ✅ Serial Number */}
        <td>{index + 1}</td>

        <td>{c.CustomerName}</td>
        <td>{c.Mobile}</td>
        <td>{c.Email}</td>
        <td>{c.GSTIN}</td>
        <td>{c.BillingCity}</td>
        <td>{c.BillingState}</td>
        <td>{c.OpeningBalance}</td>
        <td>{c.Balance}</td>

        <td>
          <div className="invaction-group">
          <button
            className="invaction-btn invaction-modify"
            onClick={() => loadCustomerForEdit(c.CustomerId)}
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
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
            </svg>
          </button>

          <button
            className="invaction-btn invaction-delete"
            onClick={() =>
              setModal({
                show: true,
                message: `Delete customer "${c.CustomerName}"?`,
                type: "confirm",
                onConfirm: () => checkAndDeleteCustomer(c.CustomerId)
              })
            }
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
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6m5 0V4a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v2" />
              <line x1="10" y1="11" x2="10" y2="17" />
              <line x1="14" y1="11" x2="14" y2="17" />
            </svg>
          </button>
          </div>
        </td>
      </tr>
    ))}
  </tbody>
</table>
</div>
      {customer && (
        <div className="inventory-form">
          <h4 className="inventory-title-supplier">
            {customer.CustomerId === 0 ? "Enter New Customer Details" :
            `Edit Customer — ${customer.CustomerName}`}
            </h4>

          <div className="form-body">

            <div className="form-group wide">
              <label>Customer Name *</label>
              <input
  value={customer.CustomerName}
  className={errors.CustomerName ? "error-input" : ""}
  onChange={(e) => {
    handleChange("CustomerName", e.target.value);
    if (errors.CustomerName) {
      setErrors(prev => ({ ...prev, CustomerName: null }));
    }
  }}
/>

{errors.CustomerName && (
  <div className="error-text">{errors.CustomerName}</div>
)}
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
  value={customer.Mobile}
  className={errors.Mobile ? "error-input" : ""}
  onChange={(e) => {
    handleChange("Mobile", e.target.value);

    if (errors.Mobile) {
      setErrors(prev => ({ ...prev, Mobile: null }));
    }
  }}
/>

{errors.Mobile && (
  <div className="error-text">{errors.Mobile}</div>
)}
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
  className={errors.BillingState ? "error-input" : ""}
  onChange={(e) => {
    handleChange("BillingState", e.target.value);
    if (errors.BillingState) {
      setErrors(prev => ({ ...prev, BillingState: null }));
    }
  }}
>
                <option value="">-- Select State --</option>
                {INDIAN_STATES.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              {errors.BillingState && (
  <div className="error-text">{errors.BillingState}</div>
)}
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
              onClick={() => {
  setCustomer(null);
  setErrors({});
}}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

    </div>
    {modal.show && (
  <div className="modal-overlay">
    <div className="modal-box">
      <p>{modal.message}</p>

      {modal.type === "confirm" ? (
        <>
          <button
            className="modal-btn confirm"
            onClick={() => {
              modal.onConfirm?.();
              setModal({ show: false });
            }}
          >
            Yes
          </button>

          <button
            className="modal-btn cancel"
            onClick={() => setModal({ show: false })}
          >
            No
          </button>
        </>
      ) : (
        <button
          className="modal-btn ok"
          onClick={() => {
            modal.onClose?.();
            setModal({ show: false });
          }}
        >
          OK
        </button>
      )}
    </div>
  </div>
)}
    </>
  );
}

export default CustomerPage;
