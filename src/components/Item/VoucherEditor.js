import React, { useEffect, useState } from "react";
import "./Voucher.css";

import { useLocation } from "react-router-dom";

const blankLine = () => ({
  AccountId: null,
  AccountName: "",
  Debit: "",
  Credit: ""
});

export default function VoucherEditor() {
const location = useLocation();



  const today = new Date().toISOString().split("T")[0];
const [selectedVoucherId, setSelectedVoucherId] = useState("");

  const [voucherType, setVoucherType] = useState("JV");
  const [voucherNo, setVoucherNo] = useState("");
  const [voucherDate, setVoucherDate] = useState(today);
  const [referenceId, setReferenceId] = useState(null);
  const [narration, setNarration] = useState("");
  const [lines, setLines] = useState([blankLine(), blankLine()]);
  const [accountList, setAccountList] = useState([]);
const [journalEntryId, setJournalEntryId] = useState(null);
const [isReversalMode, setIsReversalMode] = useState(false);

const [reversalMode, setReversalMode] = useState(false);
const [reversalDate, setReversalDate] = useState(today);
const [voucherIdList, setVoucherIdList] = useState([]);
const [debitAccounts, setDebitAccounts] = useState([]);
const [creditAccounts, setCreditAccounts] = useState([]);

  // -----------------------------
  // Load accounts
  // -----------------------------
  useEffect(() => {
  window.chrome.webview.postMessage({
    Action: "GetAccountsForVoucher",
    Payload: {
      VoucherType: voucherType
    }
  });
}, [voucherType]);

useEffect(() => {
  setLines([blankLine(), blankLine()]);
}, [voucherType]);

  // -----------------------------
  // Generate Voucher No
  // -----------------------------
  useEffect(() => {
    window.chrome.webview.postMessage({
      Action: "GetNextVoucherNo",
      Payload: { VoucherType: voucherType }
    });
  }, [voucherType]);
useEffect(() => {
  window.chrome.webview.postMessage({
    Action: "GetAccountsForVoucherSide",
    Payload: { VoucherType: voucherType, Side: "Debit" }
  });

  window.chrome.webview.postMessage({
    Action: "GetAccountsForVoucherSide",
    Payload: { VoucherType: voucherType, Side: "Credit" }
  });
}, [voucherType]);

  // -----------------------------
  // Message handler
  // -----------------------------
{/*useEffect(() => {
  const params = new URLSearchParams(location.search);

  const isReverse = params.get("reverse") === "1";
  const id = Number(params.get("id"));

  if (isReverse && id) {
    setJournalEntryId(id);
    setIsReversalMode(true);

    window.chrome.webview.postMessage({
      Action: "LoadVoucherById",
      Payload: { JournalEntryId: id }
    });
  }
}, [location.search]);*/}

useEffect(() => {
  if (!reversalMode) return;

  window.chrome.webview.postMessage({
    Action: "GetVoucherIdsByDate",
    Payload: { Date: reversalDate }
  });
}, [reversalDate, reversalMode]);

useEffect(() => {
  const handler = (evt) => {
    let msg = evt.data;
    try { if (typeof msg === "string") msg = JSON.parse(msg); } catch {}

    if (msg.action === "GetAccountsForVoucherResponse") {
      setAccountList(msg.data || []);
    }

    if (msg.action === "GetNextVoucherNoResponse") {
      setVoucherNo(msg.voucherNo);
    }

    if (msg.action === "LoadVoucherByIdResponse") {
  const d = msg.data;
  if (!d) return;

  setVoucherType(d.VoucherType);
  setVoucherNo(d.VoucherNo);
  setVoucherDate(d.VoucherDate);
  setNarration(d.Narration);
  setLines(d.Lines || []);
  
}
if (msg.action === "GetAccountsForVoucherSideResponse") {
  if (msg.side === "Debit") setDebitAccounts(msg.data || []);
  if (msg.side === "Credit") setCreditAccounts(msg.data || []);
}


if (msg.action === "GetVoucherIdsByDateResponse") {
  setVoucherIdList(msg.data || []);
}


    if (msg.action === "SaveVoucherResponse") {
  if (msg.success) {
    alert("Voucher saved successfully");
    resetForm();
  } else {
    alert(msg.message || "Failed to save voucher");
  }
}

    if (msg.action === "ReverseVoucherResponse") {
      if (msg.success) {
        alert("Voucher reversed successfully");
        resetForm();
        setVoucherNo("");
         // ✅ Reset dropdown to index 0
  setSelectedVoucherId("");
      } else {
        alert(msg.message || "Reversal failed");
      }
    }
  };

  window.chrome.webview.addEventListener("message", handler);
  return () => window.chrome.webview.removeEventListener("message", handler);
}, []);


  const resetForm = () => {
    setLines([blankLine(), blankLine()]);
    setNarration("");
    setReferenceId(null);
  };

  // -----------------------------
  // Line update
  // -----------------------------
  const updateLine = (i, field, value) => {
    setLines(prev => {
      const copy = [...prev];
      copy[i][field] = value;

      if (field === "Debit" && value)
        copy[i].Credit = "";
      if (field === "Credit" && value)
        copy[i].Debit = "";

      return copy;
    });
  };

  const addRow = () => setLines([...lines, blankLine()]);

  // -----------------------------
  // Totals
  // -----------------------------
  const totalDebit = lines.reduce((s, l) => s + Number(l.Debit || 0), 0);
  const totalCredit = lines.reduce((s, l) => s + Number(l.Credit || 0), 0);

  // -----------------------------
  // Save
  // -----------------------------
  const saveVoucher = () => {
    if (totalDebit !== totalCredit || totalDebit <= 0) {
      alert("Debit and Credit must be equal");
      return;
    }

    window.chrome.webview.postMessage({
      Action: "SaveVoucher",
      Payload: {
        VoucherType: voucherType,
        VoucherNo: voucherNo,
        VoucherDate: voucherDate,
        Narration: narration,
        ReferenceId: referenceId,
        Lines: lines.filter(l => l.AccountId)
      }
    });
  };
const reverseVoucher = () => {
  if (!journalEntryId) {
    alert("Original voucher id not found");
    return;
  }

  if (!window.confirm("This will create a reversal entry. Continue?"))
    return;

  window.chrome.webview.postMessage({
    Action: "ReverseVoucher",
    Payload: {
      JournalEntryId: journalEntryId
    }
  });
};

  return (
    <div className="voucher-container">
     <div className="voucher-page-heading">
  <span className="heading-icon">🧾</span>
  {isReversalMode ? "Voucher Reversal" : "Voucher Entry"}
</div>
<div className="voucher-reversal-section">
  <h4>
    Reversal Mode
  </h4>
 <label className="chk-wrapper">
  <input
    type="checkbox"
    checked={reversalMode}
    onChange={(e) => {
      const checked = e.target.checked;
      setReversalMode(checked);
      setIsReversalMode(checked);
      setVoucherIdList([]);
      setJournalEntryId(null);
      setSelectedVoucherId("");
      resetForm();
    }}
  />
  <span className="chk-box"></span>
  {/*<span className="chk-label">Reversal Mode</span>*/}
</label>


  {reversalMode && (
    <>
      <div className="voucher-reversal-fields">
        <div>
          <label>Date</label>
          <input
            type="date"
            value={reversalDate}
            onChange={(e) => setReversalDate(e.target.value)}
          />
        </div>

        <div>
          <label>Voucher ID</label>
          <select
            value={selectedVoucherId}
            onChange={(e) => {
              const id = Number(e.target.value);
              setSelectedVoucherId(e.target.value);

              if (!id) return;

              setJournalEntryId(id);

              window.chrome.webview.postMessage({
                Action: "LoadVoucherById",
                Payload: { JournalEntryId: id }
              });
            }}
          >
            <option value="">-- Select --</option>
            {voucherIdList.map(v => (
              <option key={v.JournalEntryId} value={v.JournalEntryId}>
                {v.JournalEntryId}
              </option>
            ))}
          </select>
        </div>
      </div>

      {!journalEntryId && (
        <div className="voucher-reversal-info">
          Select a voucher to reverse
        </div>
      )}
    </>
  )}
</div>



   <div className="voucher-card">
  <h4>Voucher Details</h4>

  <div className="voucher-fields">
    <div className="voucher-field">
      <label>Voucher Type</label>
      <select
        value={voucherType}
        disabled={isReversalMode}
        onChange={e => setVoucherType(e.target.value)}
      >
        <option value="JV">Journal Voucher</option>
        <option value="PV">Payment Voucher</option>
        <option value="RV">Receipt Voucher</option>
        <option value="CV">Contra Voucher</option>
      </select>
    </div>

    <div className="voucher-field">
      <label>Voucher No</label>
      <input value={voucherNo} readOnly className="input-locked" />
    </div>

    <div className="voucher-field">
      <label>Date</label>
      <input
        type="date"
        value={voucherDate}
        disabled={isReversalMode}
        onChange={e => setVoucherDate(e.target.value)}
      />
    </div>
  </div>
</div>

<div className="voucher-grid-wrapper">
      <table className="voucher-grid">
        <thead>
          <tr>
            <th>Account</th>
            <th>Debit</th>
            <th>Credit</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((l, i) => (
            <tr key={i}>
              <td>
                  <div className="cell-box">
               <select
  value={l.AccountId ?? ""}
  onChange={e => updateLine(i, "AccountId", Number(e.target.value))}
>
  <option value="">--Select--</option>
  {(l.Debit > 0 ? debitAccounts : creditAccounts).map(a => (
    <option key={a.AccountId} value={a.AccountId}>
      {a.AccountName}
    </option>
  ))}
</select>

                </div>
              </td>
              <td>
                 <div className="cell-box">
               <input
  type="number"
  disabled={isReversalMode}
  value={l.Debit}
  onChange={e => updateLine(i, "Debit", e.target.value)}
/>
</div>
              </td>
              <td>
                 <div className="cell-box">
                <input type="number" disabled={isReversalMode} value={l.Credit} onChange={e => updateLine(i, "Credit", e.target.value)} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
</div>
   {!isReversalMode && (
  <div className="button-row-wrapper">
  <div className="button-row">
    <button
      type="button"
      className="btn-submit small"
      onClick={addRow}
    >
      + Add Row
    </button>
  </div>
</div>

)}



   <div className="voucher-card">
  <h4>Narration</h4>

  <div className="voucher-field">
    <textarea
      disabled={isReversalMode}
      value={narration}
      onChange={e => setNarration(e.target.value)}
      placeholder="Enter narration"
    />
  </div>
</div>



    <div className="voucher-card">
  <div className="voucher-total">
    Debit: ₹{totalDebit} | Credit: ₹{totalCredit}
  </div>
</div>


      {!isReversalMode && (
  <div className="button-row-wrapper">
  <div className="button-row">
    <button className="btn-submit small" onClick={saveVoucher}>
      Save Voucher
    </button>
  </div>
</div>

)}

{isReversalMode && (
  <div className="button-row-wrapper">
  <div className="button-row">
    <button
      className="btn-submit small"
      disabled={!journalEntryId}
      onClick={reverseVoucher}
    >
      Reverse Voucher
    </button>
  </div>
</div>

)}



    </div>
  );
}
