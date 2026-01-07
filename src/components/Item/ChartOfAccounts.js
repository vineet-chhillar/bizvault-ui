import React, { useEffect, useState } from "react";

export default function ChartOfAccounts() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({
  AccountId: 0,
  AccountName: "",
  AccountType: "Asset",
  NormalSide: "Debit",
  OpeningBalanceType: "DR", // 👈 ADD
  OpeningBalance: 0,
});
useEffect(() => {
  setForm(f => ({
    ...f,
    OpeningBalanceType: f.NormalSide === "Debit" ? "DR" : "CR"
  }));
}, [form.NormalSide]);


  const [isEditing, setIsEditing] = useState(false);

  // Load initial data
  useEffect(() => {
    window.chrome.webview.postMessage({ action: "fetchCoA" });

    const handler = (e) => {
      const msg = e.data;

      if (msg.action === "fetchCoAResult") {
        setRows(msg.rows);
      }

      if (
  msg.action === "createAccountResult" ||
  msg.action === "updateAccountResult" ||
  msg.action === "deleteAccountResult"
) {
  if (!msg.success) {
    alert(msg.message || "Operation failed");
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

  alert(successMsg);

  // 🔄 Refresh chart of accounts
  window.chrome.webview.postMessage({ action: "fetchCoA" });

  // 🔁 Reset form
  setForm({
  AccountId: 0,
  AccountName: "",
  AccountType: "Asset",
  ParentAccountId: 0,
  NormalSide: "Debit",
  OpeningBalanceType: "DR", // 👈 ADD
  OpeningBalance: 0,
});


  setIsEditing(false);
}

    };

    window.chrome.webview.addEventListener("message", handler);
    return () =>
      window.chrome.webview.removeEventListener("message", handler);
  }, []);

  const save = () => {
    if (isEditing) {
      window.chrome.webview.postMessage({
        action: "updateAccount",
        Payload: form,
      });
    } else {
      window.chrome.webview.postMessage({
        action: "createAccount",
        Payload: form,
      });
    }
  };

 const edit = (r) => {
  if (r.IsSystemAccount === 1) {
    alert("System account: only opening balance can be changed");
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
  disabled={isEditing && form.IsSystemAccount === 1}
  onChange={e => setForm({ ...form, AccountName: e.target.value })}
/>

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
                <option>Equity</option>
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
  <label>Opening Balance Type</label>
  <select
    value={form.OpeningBalanceType}
    onChange={e =>
      setForm({ ...form, OpeningBalanceType: e.target.value })
    }
    disabled={isEditing && form.IsSystemAccount === 1}
  >
    <option value="DR">Debit (DR)</option>
    <option value="CR">Credit (CR)</option>
  </select>
</div>



<div className="form-group">
  <label>Parent Account</label>
  <select
    value={form.ParentAccountId || 0}
    onChange={e =>
      setForm({ ...form, ParentAccountId: Number(e.target.value) })
    }
    disabled={isEditing && form.IsSystemAccount === 1}
  >
    <option value={0}>None</option>

    {rows
      .filter(a =>
        (a.ParentAccountId == null || a.ParentAccountId === 0) &&
        a.AccountId !== form.AccountId
      )
      .map(a => (
        <option key={a.AccountId} value={a.AccountId}>
          {a.AccountName}
        </option>
      ))}
  </select>
</div>






            <div className="form-group">
              <label>Opening Balance</label>
              <input
                type="number"
                value={form.OpeningBalance}
                onChange={(e) =>
                  setForm({
                    ...form,
                    OpeningBalance: parseFloat(e.target.value || 0),
                  })
                }
              />
            </div>
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

        <table className="account-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Side</th>
              <th>Opening Type</th> {/* 👈 ADD */}
              <th>Opening</th>
              <th style={{ width: "120px" }}>Actions</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((r) => (
              <tr key={r.AccountId}>
                <td>{r.AccountName}</td>
                <td>{r.AccountType}</td>
                <td>{r.NormalSide}</td>
                <td>{r.OpeningBalanceType}</td>
                 <td>{r.OpeningBalance}</td>

                <td style={{ textAlign: "center" }}>
                 
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
    {/* Pencil/Edit Icon */}
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
  </svg>

  {/* Modify Inventory */}
</button>


                        <button
            className="invaction-btn invaction-delete"
             disabled={r.IsSystemAccount === 1}
            onClick={() => {
              if (
                window.confirm(
                  `Are you sure you want to delete "${r.AccountName}"?`
                )
              ) {
                del(r.AccountId)}
              }
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
    </div>
  );
}
