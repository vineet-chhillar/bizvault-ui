import React, { useEffect, useState, useRef } from "react";
import "./CompanySetup.css";


/* ================= INLINE TOAST COMPONENT ================= */
const Toast = ({ id, message, type = "info", onClose, duration = 4000 }) => {
  React.useEffect(() => {
    const t = setTimeout(() => onClose(id), duration);
    return () => clearTimeout(t);
  }, [id, onClose, duration]);

  return (
    <div className={`toast toast-${type}`}>
      <div className="toast-body">
        <div className="toast-message">{message}</div>
        <button className="toast-close" onClick={() => onClose(id)}>✕</button>
      </div>
    </div>
  );
};
/* ================= INLINE UTILITIES ================= */
const INDIAN_STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh",
  "Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka",
  "Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram",
  "Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana",
  "Tripura","Uttar Pradesh","Uttarakhand","West Bengal",
  "Andaman and Nicobar Islands","Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu","Delhi",
  "Jammu and Kashmir","Ladakh","Lakshadweep","Puducherry"
];

const isValidGSTIN = (gst) =>
  /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test((gst || "").toUpperCase());

const isValidPAN = (pan) =>
  /^[A-Z]{5}[0-9]{4}[A-Z]$/.test((pan || "").toUpperCase());

const formatIndianPhone = (v) => {
  const d = (v || "").replace(/\D/g, "").slice(0, 10);
  return d.length <= 5 ? d : d.slice(0,5) + " " + d.slice(5);
};


export default function CompanySetup({user}) {
  const alreadyShownRef = useRef(false);
  const noProfileToastShown = useRef(false);
  const profileLoadedToastShown = useRef(false);
  const [activeTab, setActiveTab] = useState("company");
  const [profile, setProfile] = useState({
    Id: 0,
    CompanyName: "",
    AddressLine1: "",
    AddressLine2: "",
    City: "",
    State: "",
    Pincode: "",
    Country: "India",
    GSTIN: "",
    PAN: "",
    Email: "",
    Phone: "",
    BankName: "",
    BankAccount: "",
    IFSC: "",
    BranchName: "",
    InvoicePrefix: "INV-",
    InvoiceStartNo: 1,
    CurrentInvoiceNo: 1,
    CreatedBy: "",
    LogoBase64: null
  });

  const [errors, setErrors] = useState({});
  const [toasts, setToasts] = useState([]);
  const toastId = useRef(0);

  /* ================= helper to show toasts ================= */
  const pushToast = (message, type = "info", duration = 4000) => {
    const id = ++toastId.current;
    setToasts((t) => [...t, { id, message, type, duration }]);
  };
  const removeToast = (id) => setToasts((t) => t.filter(x => x.id !== id));

  /* ================= LOAD COMPANY PROFILE ================= */
  useEffect(() => {
if (user?.email) {
    setProfile(prev => ({
      ...prev,
      CreatedBy: prev.CreatedBy || user.email   // prevents overwriting saved value
    }));
  }

    if (window.chrome?.webview) {
      const handler = (event) => {
        let msg = event.data;
        if (typeof msg === "string") {
          try { msg = JSON.parse(msg); } catch { return; }
        }

        if (msg.action === "GetCompanyProfileResponse") {

  if (msg.success && msg.profile) {

    // Load profile safely
    setProfile((prev) => ({
      ...prev,
      ...msg.profile,
      InvoiceStartNo: msg.profile.InvoiceStartNo ?? 1,
      CurrentInvoiceNo: msg.profile.CurrentInvoiceNo ?? 1,
      Country: msg.profile.Country ?? "India"
    }));

    if (!profileLoadedToastShown.current) {
  profileLoadedToastShown.current = true;
  pushToast("Company profile loaded", "success");
}
  } 
  else {
    // 🔥 Show this toast only once
    if (!noProfileToastShown.current) {
      noProfileToastShown.current = true;
      pushToast("No company profile found. Fill and save one.", "warning");
    }
  }
}


        if (msg.action === "SaveCompanyProfileResponse") {
          if (msg.success) {
            pushToast(msg.message || "Saved", "success");
            if (msg.profile) {
              setProfile((prev) => ({ ...prev, ...msg.profile }));
            }
          } else {
            pushToast(msg.message || "Save failed", "error");
          }
        }
      };

      window.chrome.webview.addEventListener("message", handler);
      window.chrome.webview.postMessage({ action: "GetCompanyProfile" });
      return () => window.chrome.webview.removeEventListener("message", handler);
    }
  }, [user]);

  /* ================= VALIDATION ================= */
  const validateField = (name, value) => {
    let e = "";
    if (name === "GSTIN" && value) {
      if (!isValidGSTIN(value)) e = "GSTIN looks invalid (expected 15 chars)";
    }
    if (name === "PAN" && value) {
      if (!isValidPAN(value)) e = "PAN looks invalid (expected 10 chars)";
    }
    if (name === "CompanyName" && !value.trim()) e = "Company name required";
    // you can add more validations here
    setErrors(prev => ({ ...prev, [name]: e }));
    return e === "";
  };

  /* ================= INPUT HANDLER ================= */
  const handleChange = (e) => {
    const { name, value: rawVal } = e.target;
    let value = rawVal;

    // Auto uppercase invoice prefix
    if (name === "InvoicePrefix") value = rawVal.toUpperCase();

    // phone formatting
    if (name === "Phone") value = formatIndianPhone(rawVal);

    // set & validate
    setProfile(prev => ({ ...prev, [name]: value }));
    validateField(name, value);
  };

  /* ================= LOGO HANDLING ================= */
  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result.split(",")[1];
      setProfile(prev => ({ ...prev, LogoBase64: base64 }));
    };
    reader.readAsDataURL(file);
  };
  const removeLogo = () => setProfile(prev => ({ ...prev, LogoBase64: null }));

  /* ================= SAVE ================= */
  const handleSave = () => {
    // simple validation
    const ok = validateField("CompanyName", profile.CompanyName)
      && (!profile.GSTIN || isValidGSTIN(profile.GSTIN))
      && (!profile.PAN || isValidPAN(profile.PAN));

    if (!ok) {
      pushToast("Please fix validation errors before saving", "error");
      return;
    }

    // send message
    if (window.chrome?.webview) {
      window.chrome.webview.postMessage({
        Action: "SaveCompanyProfile",
        Payload: {
          ...profile,
          InvoiceStartNo: Number(profile.InvoiceStartNo) || 1,
          CurrentInvoiceNo: Number(profile.CurrentInvoiceNo) || 1
        }
      });
    } else {
      pushToast("WebView2 bridge not available", "error");
    }
  };

  /* ================= RENDER ================= */
  return (
    <div className="company-setup-container">
      <h2 className="company-setup-title">🏢 Company Profile</h2>

      <div className="company-tabs">
        {["company","address","tax","bank","invoice","logo"].map(tab => (
          <button
            key={tab}
            className={`company-tab-btn ${activeTab===tab ? "active" : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {activeTab === "company" && (
        <div className="company-section">
          <div className="company-form-grid">
            <div className="company-form-group">
              <label>Company Name *</label>
              <input name="CompanyName" value={profile.CompanyName} onChange={handleChange} />
              {errors.CompanyName && <div className="error-text">{errors.CompanyName}</div>}
            </div>

            <div className="company-form-group">
  <label>Created By</label>

  <input
    name="CreatedBy"
    value={profile.CreatedBy}
    readOnly
    style={{ background: "#eee", cursor: "not-allowed" }}
  />
</div>


            <div className="company-form-group">
              <label>Email</label>
              <input name="Email" value={profile.Email} onChange={handleChange} />
            </div>

            <div className="company-form-group">
              <label>Phone</label>
              <input name="Phone" value={profile.Phone} onChange={handleChange} />
            </div>
          </div>
        </div>
      )}

      {activeTab === "address" && (
        <div className="company-section">
          <div className="company-form-grid">
            <div className="company-form-group">
              <label>Address Line 1</label>
              <input name="AddressLine1" value={profile.AddressLine1} onChange={handleChange} />
            </div>

            <div className="company-form-group">
              <label>Address Line 2</label>
              <input name="AddressLine2" value={profile.AddressLine2} onChange={handleChange} />
            </div>

            <div className="company-form-group">
              <label>Country</label>
              <select name="Country" value={profile.Country} onChange={handleChange}>
                <option>India</option>
                <option>Other</option>
              </select>
            </div>

            <div className="company-form-group">
              <label>State</label>
              {profile.Country === "India" ? (
                <select name="State" value={profile.State} onChange={handleChange}>
                  <option value="">-- Select State --</option>
                  {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              ) : (
                <input name="State" value={profile.State} onChange={handleChange} />
              )}
            </div>

            <div className="company-form-group">
              <label>City</label>
              <input name="City" value={profile.City} onChange={handleChange} />
            </div>

            <div className="company-form-group">
              <label>Pincode</label>
              <input name="Pincode" value={profile.Pincode} onChange={handleChange} />
            </div>
          </div>
        </div>
      )}

      {activeTab === "tax" && (
        <div className="company-section">
          <div className="company-form-grid">
            <div className="company-form-group">
              <label>GSTIN</label>
              <input name="GSTIN" value={profile.GSTIN} onChange={(e)=>{ handleChange(e); validateField("GSTIN", e.target.value); }} />
              {errors.GSTIN && <div className="error-text">{errors.GSTIN}</div>}
            </div>

            <div className="company-form-group">
              <label>PAN</label>
              <input name="PAN" value={profile.PAN} onChange={(e)=>{ handleChange(e); validateField("PAN", e.target.value); }} />
              {errors.PAN && <div className="error-text">{errors.PAN}</div>}
            </div>
          </div>
        </div>
      )}

      {activeTab === "bank" && (
        <div className="company-section">
          <div className="company-form-grid">
            <div className="company-form-group">
              <label>Bank Name</label>
              <input name="BankName" value={profile.BankName} onChange={handleChange} />
            </div>

            <div className="company-form-group">
              <label>Account Number</label>
              <input name="BankAccount" value={profile.BankAccount} onChange={handleChange} />
            </div>

            <div className="company-form-group">
              <label>IFSC</label>
              <input name="IFSC" value={profile.IFSC} onChange={handleChange} />
            </div>

            <div className="company-form-group">
              <label>Branch Name</label>
              <input name="BranchName" value={profile.BranchName} onChange={handleChange} />
            </div>
          </div>
        </div>
      )}

      {activeTab === "invoice" && (
        <div className="company-section">
          <div className="company-form-grid">
            <div className="company-form-group">
              <label>Invoice Prefix</label>
              <input name="InvoicePrefix" value={profile.InvoicePrefix} onChange={handleChange} />
            </div>

            <div className="company-form-group">
              <label>Invoice Start No</label>
              <input type="number" name="InvoiceStartNo" value={profile.InvoiceStartNo} onChange={handleChange} />
            </div>

            <div className="company-form-group">
              <label>Current Invoice No (readonly)</label>
              <input type="number" name="CurrentInvoiceNo" value={profile.CurrentInvoiceNo} readOnly />
            </div>
          </div>
        </div>
      )}

      {activeTab === "logo" && (
        <div className="company-section">
          <div className="company-logo-box">
            <label>Company Logo</label>
            <input type="file" accept="image/*" onChange={handleLogoUpload} />
            {profile.LogoBase64 ? (
              <>
                <img className="company-logo-preview" src={`data:image/png;base64,${profile.LogoBase64}`} alt="logo" />
                <button className="remove-logo-btn" onClick={removeLogo}>Remove</button>
              </>
            ) : (
              <div style={{color:"#666", marginTop:8}}>No logo uploaded</div>
            )}
          </div>
        </div>
      )}

      <div className="company-actions">
        <button className="company-btn" onClick={handleSave}>💾 Save Profile</button>
        <button className="company-btn" onClick={() => window.history.back()}>❌ Cancel</button>
      </div>

      {/* Toasts */}
      <div>
        {toasts.map(t => (
          <Toast key={t.id} id={t.id} message={t.message} type={t.type} duration={t.duration} onClose={removeToast} />
        ))}
      </div>
    </div>
  );
}
