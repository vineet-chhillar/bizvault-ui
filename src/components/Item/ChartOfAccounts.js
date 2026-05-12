import React, { useEffect, useState } from "react";
import { getCreatedBy } from "../../utils/authHelper";

export default function ChartOfAccounts() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({
  AccountId: 0,
  AccountName: "",
  AccountType: "Asset",
  ParentAccountId: 0,
  NormalSide: "Debit",
  OpeningBalanceType: "DR",
  OpeningBalance: 0,
  IsGroup: false,

  // 🔹 AUDIT FIELDS
  CreatedBy: null,
  UpdatedBy: null
  
});
const [allAccounts, setAllAccounts] = useState([]);
const [searchText, setSearchText] = useState("");
const filteredRows = rows.filter(r =>
  (r.AccountName || "")
    .toLowerCase()
    .includes(searchText.toLowerCase())
);
const [errors, setErrors] = useState({});
const [modal, setModal] = useState({
  show: false,
  message: "",
  type: "info", // success | error | confirm
  onConfirm: null
});
const [isEditing, setIsEditing] = useState(false);
function validateForm() {
  let err = {};

  if (!form.AccountName?.trim()) {
    err.AccountName = "Account Name is required";
  }

  if (!form.IsGroup && form.OpeningBalance < 0) {
    err.OpeningBalance = "Opening balance cannot be negative";
  }

  return err;
}

const hasChildren = (accountId) =>
  rows.some(r => r.ParentAccountId === accountId);

useEffect(() => {
  if (!isEditing) {
    setForm(f => ({
      ...f,
      IsGroup: f.ParentAccountId === 0
    }));
  }
}, [form.ParentAccountId, isEditing]);

useEffect(() => {
  let normalSide = "Debit";

  if (
    form.AccountType === "Liability" ||
    form.AccountType === "Income"
  ) {
    normalSide = "Credit";
  }

  setForm(f => ({
    ...f,
    NormalSide: normalSide
  }));
}, [form.AccountType]);

useEffect(() => {
  setForm(f => ({
    ...f,
    OpeningBalanceType: f.NormalSide === "Debit" ? "DR" : "CR"
  }));
}, [form.NormalSide]);


  
const onParentChange = (id) => {
  setForm({
    ...form,
    ParentAccountId: id,
    IsGroup: false // child must be ledger by default
  });
};
const getFullPath = (accountId) => {
  let path = [];

  let current = allAccounts.find(
    a => a.AccountId === accountId
  );

  while (current) {
    path.unshift(current.AccountName);

    if (current.ParentAccountId === 0) break;

    current = allAccounts.find(
      a => a.AccountId === current.ParentAccountId
    );
  }

  return path.join(" > ");
};
  // Load initial data
  useEffect(() => {
    window.chrome.webview.postMessage({ action: "fetchCoA" });

    const handler = (e) => {
      const msg = e.data;

      if (msg.action === "fetchCoAResult") {
        setRows(msg.rows);
         setAllAccounts(msg.rows);
      }

      if (
  msg.action === "createAccountResult" ||
  msg.action === "updateAccountResult" ||
  msg.action === "deleteAccountResult"
) {
  if (!msg.success) {
  setModal({
    show: true,
    message: msg.message || "Operation failed",
    type: "error"
  });
  return;
}

  // ✅ SHOW SUCCESS MESSAGE
  let successMsg = "Operation completed successfully";

  if (msg.action === "createAccountResult")
    successMsg = "✅ Account created successfully";
  else if (msg.action === "updateAccountResult")
    successMsg = "✅ Account updated successfully";
  else if (msg.action === "deleteAccountResult")
    successMsg = "✅ Account deleted successfully";

  setModal({
  show: true,
  message: successMsg,
  type: "success"
});

  // 🔄 Refresh chart of accounts
  window.chrome.webview.postMessage({ action: "fetchCoA" });
  // 🔁 Reset form
  setForm({
  AccountId: 0,
  AccountName: "",
  AccountType: "Asset",
  ParentAccountId: 0,
  NormalSide: "Debit",
  OpeningBalanceType: "DR",
  OpeningBalance: 0,
  IsGroup: true   ,
   CreatedBy: null,
  UpdatedBy: null     // 👈 MUST ADD
});

  setIsEditing(false);
}

    };

    window.chrome.webview.addEventListener("message", handler);
    return () =>
      window.chrome.webview.removeEventListener("message", handler);
  }, []);

const save = () => {
  const err = validateForm();

  if (Object.keys(err).length > 0) {
    setErrors(err);
    return;
  }

  const userId = getCreatedBy();

  const payload = { ...form };

  if (isEditing) {
    payload.UpdatedBy = userId;
    payload.CreatedBy = form.CreatedBy;
  } else {
    payload.CreatedBy = userId;
    payload.UpdatedBy = null;
  }

  window.chrome.webview.postMessage({
    action: isEditing ? "updateAccount" : "createAccount",
    Payload: payload
  });
};



const edit = (r) => {
  if (r.IsSystemAccount === 1) {
    setModal({
      show: true,
      message:
        "System account: only opening balance can be changed.",
      type: "info"
    });
  }

  setForm(r);
  setIsEditing(true);
};


  const del = (id) => {
    window.chrome.webview.postMessage({
      action: "deleteAccount",
      Payload: { AccountId: id },
    });
  };

  return (
    <>
    <div className="form-container">
      {/* Title */}
      <h2 className="form-title">Accounts</h2>

      {/* FORM SECTION — Uses your Dhansutra layout */}
      <div className="form-inner">
        <div className="form-body">
          <div className="form-row">

            <div className="form-group">
              <label>Account Name</label>
              <input
  value={form.AccountName}
  className={errors.AccountName ? "input-error" : ""}
  onChange={e => {
    setForm({ ...form, AccountName: e.target.value });

    if (errors.AccountName) {
      setErrors(prev => ({ ...prev, AccountName: null }));
    }
  }}
/>

{errors.AccountName && (
  <div className="error-text">{errors.AccountName}</div>
)}

            </div>

            <div className="form-group">
              <label>Account Type</label>
              <select
                value={form.AccountType}
                onChange={(e) =>
                  setForm({ ...form, AccountType: e.target.value })
                }
              >
                <option>Asset</option>
                <option>Liability</option>
                <option>Income</option>
                <option>Expense</option>
                
              </select>
            </div>

            <div className="form-group">
              <label>Normal Side</label>
              <select
                value={form.NormalSide}
                onChange={(e) =>
                  setForm({ ...form, NormalSide: e.target.value })
                }
              >
                <option>Debit</option>
                <option>Credit</option>
              </select>
            </div>

            



<div className="form-group">
  <label>Parent Account</label>
  <select
  value={form.ParentAccountId || 0}
  onChange={e =>
    setForm({
      ...form,
      ParentAccountId: Number(e.target.value)
    })
  }
>
  <option value={0}>None</option>

{rows
  .filter(a => a.AccountId !== form.AccountId)
  .map(a => (
    <option key={a.AccountId} value={a.AccountId}>
      {a.AccountName}
    </option>
  ))}
</select>

</div>

<div className="form-group">
  <label>Account Nature</label>
  <select
    value={form.IsGroup ? 1 : 0}
    onChange={e =>
      setForm({ ...form, IsGroup: e.target.value === "1" })
    }
  >
    <option value={0}>Ledger (Postable)</option>
    <option value={1}>Group (Non-postable)</option>
  </select>
</div>





<div className="form-group">
  <label>Opening Balance Type</label>
  <select
    value={form.OpeningBalanceType}
    onChange={e =>
      setForm({ ...form, OpeningBalanceType: e.target.value })
    }
    disabled={form.IsGroup || (isEditing && form.IsSystemAccount === 1)}
  >
    <option value="DR">Debit (DR)</option>
    <option value="CR">Credit (CR)</option>
  </select>
</div>

            <div className="form-group">
              <label>Opening Balance</label>
              <input
  type="number"
  value={form.OpeningBalance}
  className={errors.OpeningBalance ? "input-error" : ""}
  onChange={(e) => {
    setForm({
      ...form,
      OpeningBalance: parseFloat(e.target.value || 0),
    });

    if (errors.OpeningBalance) {
      setErrors(prev => ({ ...prev, OpeningBalance: null }));
    }
  }}
/>

{errors.OpeningBalance && (
  <div className="error-text">{errors.OpeningBalance}</div>
)}
            </div>
          </div>

 <div className="form-row">
{isEditing && (
  <>
    <div className="form-group">
      <label>Created By</label>
      <input value={form.CreatedBy ?? ""} disabled />
    </div>

    <div className="form-group">
      <label>Updated By</label>
      <input value={form.UpdatedBy ?? ""} disabled />
    </div>

    <div className="form-group">
      <label>Last Updated At</label>
      <input
        value={
          form.UpdatedAt
            ? new Date(form.UpdatedAt).toLocaleString()
            : ""
        }
        disabled
      />
    </div>
  </>
)}
</div>

          {/* Buttons */}
          <div className="inventory-btns">
            <button
              className="btn-submit small"
              type="submit"
              onClick={save}
            >
              {isEditing ? "Update" : "Create"}
            </button>

            {isEditing && (
              <button
                className="btn-submit small"
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setForm({
                    AccountId: 0,
                    AccountName: "",
                    AccountType: "Asset",
                    NormalSide: "Debit",
                    OpeningBalance: 0,
                  });
                }}
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>


      {/* TABLE SECTION — Uses your exact table container + data-table styling */}
      <div className="table-container">
        <h3 className="table-title">Account List</h3>
<div className="table-search-bar">
  <input
    type="text"
    placeholder="Search by account name..."
    value={searchText}
    onChange={(e) =>
      setSearchText(e.target.value)
    }
    className="table-search-input"
  />
</div>
        <table className="account-table">
  <thead>
    <tr>
      <th>#</th> {/* ✅ Serial No */}
      <th>Name</th>
      <th>Type</th>
      <th>Side</th>
      <th>IsGroup Account</th>
      <th>Is System Account</th>
      <th>Parent Account</th>
      <th>Opening Type</th>
      <th>Opening</th>
      <th style={{ width: "120px" }}>Actions</th>
    </tr>
  </thead>

  <tbody>
    {filteredRows.map((r, index) => (
      <tr key={r.AccountId}>
        {/* ✅ Serial Number */}
        <td>{index + 1}</td>

        <td>{getFullPath(r.AccountId)}</td>
        <td>{r.AccountType}</td>
        <td>{r.NormalSide}</td>
        <td>{r.IsGroup ? "Yes" : "No"}</td>
        <td>{r.IsSystemAccount === true ? "Yes" : "No"}</td>
         <td>
  {
    allAccounts.find(
      a => a.AccountId === r.ParentAccountId
    )?.AccountName || "-"
  }
</td>
        <td>{r.OpeningBalanceType}</td>
        <td>{r.OpeningBalance}</td>

        <td style={{ textAlign: "center" }}>
          {/* Edit */}
          <div className="invaction-group">
          <button
            className="invaction-btn invaction-modify"
            onClick={() => edit(r)}
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

          {/* Delete */}
          <button
            className="invaction-btn invaction-delete"
                       
            disabled={r.IsSystemAccount === 1}
            onClick={() =>
              setModal({
                show: true,
                message: `Delete "${r.AccountName}"?`,
                type: "confirm",
                onConfirm: () => del(r.AccountId)
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
    </div>
    {modal.show && (
  <div className="modal-overlay">
    <div className="modal-box">
      <p>{modal.message}</p>

      <div className="modal-actions">
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
            onClick={() => setModal({ show: false })}
          >
            OK
          </button>
        )}
      </div>
    </div>
  </div>
)}
  </>
  );
  
}
