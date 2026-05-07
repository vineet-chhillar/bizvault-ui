import "./ItemForms.css";
import "./ExpenseVoucherEditor.css";
import { getCreatedBy } from "../../utils/authHelper";

import React, { useEffect, useState } from "react";

const blankLine = () => ({
  AccountId: 0,
  AccountName: "",
  Amount: ""
  
});

export default function ExpenseVoucherEditor() {


  /* ---------------- HEADER ---------------- */
  const [date, setDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [paymentMode, setPaymentMode] = useState("Cash"); // CASH | BANK | CREDIT
  {/*const [paidVia, setPaidVia] = useState("");*/}
  const [notes, setNotes] = useState("");
const [showViewModal, setShowViewModal] = useState(false);

  /* ---------------- GRID ---------------- */
  const [lines, setLines] = useState([blankLine()]);
  const [accountList, setAccountList] = useState([]);
  const [activeRow, setActiveRow] = useState(null);
  const [saving, setSaving] = useState(false);
const [showPaymentModal, setShowPaymentModal] = useState(false);
const [viewExpense, setViewExpense] = useState(null);
const [cashBankAccounts, setCashBankAccounts] = useState([]);
const [expenseList, setExpenseList] = useState([]);
const [modal, setModal] = useState({
  show: false,
  message: "",
  type: "info",
  onConfirm: null,
  onClose: null
});




useEffect(() => {
  window.chrome?.webview?.postMessage({
    Action: "GetCashBankAccounts"
  });
}, []);

  /* ---------------- LOAD ACCOUNTS ---------------- */
  useEffect(() => {
    window.chrome?.webview?.postMessage({
      Action: "GetExpenseAccounts"
    });
  }, []);
  
useEffect(() => {
  window.chrome?.webview?.postMessage({
    Action: "GetExpenseVouchers"
  });
}, []);

  /* ---------------- MESSAGE HANDLER ---------------- */
  useEffect(() => {
    const handler = (e) => {
      let msg = e.data;
      if (typeof msg === "string") msg = JSON.parse(msg);

      if (msg.action === "GetExpenseAccountsResponse") {
        setAccountList(msg.data || []);
      }

      if (msg.action === "SaveExpenseVoucherResponse") {
        setSaving(false);

  if (!msg.success) {

  // 🔴 Backend validation errors
  if (msg.validationErrors) {

    const errorText = Object.values(msg.validationErrors)
      .join("\n");

    setModal({
      show: true,
      message: errorText,
      type: "error"
    });

    return;
  }

  // 🔴 System / unexpected errors
  setModal({
    show: true,
    message: msg.message || "Failed to save expense",
    type: "error"
  });

  return;
}

setModal({
  show: true,
  message: `Expense saved\nVoucher No: ${msg.VoucherNo}`,
  type: "success",
  onClose: () => {
    setLines([blankLine()]);
    setNotes("");
    window.chrome.webview.postMessage({
      Action: "GetExpenseVouchers"
    });
  }
});
      }
      if (msg.action === "SaveExpensePaymentResponse") {
  if (!msg.success) {
  setModal({
    show: true,
    message: msg.message || "Payment failed",
    type: "error"
  });
  return;
}

setModal({
  show: true,
  message: "Expense payment saved",
  type: "success",
  onClose: () => {
    resetPaymentForm(viewExpense);
    window.chrome.webview.postMessage({
      Action: "GetExpenseVouchers"
    });
  }
});
}

if (msg.action === "ReverseExpenseVoucherResponse") {
  if (!msg.success) {
  setModal({
    show: true,
    message: msg.message || "Reversal failed",
    type: "error"
  });
  return;
}

setModal({
  show: true,
  message: "Expense reversed successfully",
  type: "success",
  onClose: () => {
    setViewExpense(null);
    window.chrome.webview.postMessage({
      Action: "GetExpenseVouchers"
    });
  }
});
}
if (msg.action === "GetCashBankAccountsResponse") {
  setCashBankAccounts(msg.data || []);
}
if (msg.action === "GetExpenseVouchersResponse") {
  setExpenseList(msg.data || []);
}
if (msg.action === "LoadExpenseVoucherResponse") {
  if (!msg.success) {
    setModal({
  show: true,
  message: msg.message || "Failed to load expense",
  type: "error"
});
    return;
  }

  setViewExpense(msg.data);
  setShowViewModal(true);   // ✅ THIS WAS MISSING
}


    };

    window.chrome.webview.addEventListener("message", handler);
    return () =>
      window.chrome.webview.removeEventListener("message", handler);
  }, []);
const getUnpaidAmount = (exp) => {
  if (!exp) return 0;
   return Number(exp.TotalAmount) - Number(exp.PaidAmount || 0);
};

const [paymentForm, setPaymentForm] = useState({
  PaymentDate: new Date().toISOString().split("T")[0],
  PaidViaAccountId: "",
  Amount: 0,
  Notes: ""
});


const resetPaymentForm = (expense) => {
  setPaymentForm({
    PaymentDate: new Date().toISOString().split("T")[0],
    PaidViaAccountId: "",
    Amount: getUnpaidAmount(expense),
    Notes: ""
  });
};
  /* ---------------- LINE UPDATE ---------------- */
  const updateLine = (i, field, value) => {
    setLines(prev => {
      const copy = [...prev];
      copy[i] = { ...copy[i], [field]: value };
      return copy;
    });
  };


  const addRow = () => setLines(p => [...p, blankLine()]);
  const removeRow = (i) =>
    setLines(p => p.filter((_, idx) => idx !== i));

  /* ---------------- TOTAL ---------------- */
  const totalAmount = lines.reduce(
    (s, l) => s + Number(l.Amount || 0),
    0
  );

  /* ---------------- SAVE ---------------- */
  const handleSave = () => {
    if (saving) return;

   if (!date) {
  setModal({ show: true, message: "Please select date", type: "error" });
  return;
}

    {/*if (paymentMode !== "Credit" && !paidVia) {
      alert("Please select payment account");
      return;
    }*/}

    const validLines = lines.filter(
      l => l.AccountId && Number(l.Amount) > 0
    );

    if (validLines.length === 0) {
  setModal({ show: true, message: "Please add at least one expense", type: "error" });
  return;
}

    const accIds = validLines.map(l => l.AccountId);
    if (new Set(accIds).size !== accIds.length) {
  setModal({ show: true, message: "Same expense account cannot be entered twice", type: "error" });
  return;
}

    setSaving(true);

    //const user = JSON.parse(localStorage.getItem("user"));

    window.chrome.webview.postMessage({
      Action: "SaveExpenseVoucher",
      Payload: {
        Date: date,
        PaymentMode: paymentMode,
        TotalAmount: totalAmount,          // ✅ ADD THIS
        Notes: notes,
        CreatedBy: getCreatedBy(),
        Items: validLines.map(l => ({
          AccountId: l.AccountId,
          Amount: Number(l.Amount)
          
        }))
      }
    });
  };
{/*PaidVia: paymentMode === "Credit" ? null : paidVia,*/}
  return (
    <>
    <div className="form-container">
      <div className="form-inner">

        <h2 className="form-title">💸 Expense Voucher</h2>

        {/* ---------------- HEADER ---------------- */}
        <div className="form-row">
          <div className="form-group">
            <label>Date *</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>

          <div className="form-group">
            <label>Payment Mode</label>
            <select value={paymentMode} onChange={e => setPaymentMode(e.target.value)}>
              <option value="Cash">Cash</option>
              <option value="Bank">Bank</option>
              <option value="Credit">Credit</option>
            </select>
          </div>

         {/*} {paymentMode !== "Credit" && (
  <div className="form-group">
    <label>Paid Via *</label>
    <select
      value={paidVia}
      onChange={e => setPaidVia(e.target.value)}
    >
      <option value="">Select Cash / Bank</option>
      {cashBankAccounts.map(acc => (
        <option key={acc.AccountId} value={acc.AccountId}>
          {acc.AccountName}
        </option>
      ))}
    </select>
  </div> 
)}*/}


<div className="form-group full" style={{ width: "100%" }}>
            <label>Notes</label>
            <input value={notes}  style={{ width: "100%" }} onChange={e => setNotes(e.target.value)} />
          </div>
        </div>

        

        {/* ---------------- GRID ---------------- */}
       <div className="table-container compact">
  <div className="table-box">
    <table className="data-table compact-center">
            <thead>
              <tr>
                <th>Expense Account</th>
                <th>Amount</th>
                
                
              </tr>
            </thead>

            <tbody>
              {lines.map((l, i) => (
                <tr key={i}>
                  <td style={{ position: "relative" }}>
                    <div className="cell-box">
                    <input
                      value={l.AccountName}
                      placeholder="Search expense"
                      onChange={e => {
                        updateLine(i, "AccountName", e.target.value);
                        setActiveRow(i);
                      }}
                      onFocus={() => setActiveRow(i)}
                    />
</div>
                   {activeRow === i && (
  <div className="suggestions-box">
    {accountList
      .filter(a => {
        if (!l.AccountName?.trim()) return true;

        return a.AccountName
          .toLowerCase()
          .includes(l.AccountName.toLowerCase());
      })
      .slice(0, 10)
      .map(a => (
        <div
          key={a.AccountId}
          className="suggestion-row"
          onMouseDown={() => {
            setLines(prev => {
              const copy = [...prev];

              copy[i] = {
                ...copy[i],
                AccountId: a.AccountId,
                AccountName: a.AccountName
              };

              return copy;
            });

            setActiveRow(null);
          }}
        >
          {a.AccountName}
        </div>
      ))}
  </div>
)}
                  </td>
                 
                  <td>
                     <div className="cell-box">
                    <input
                      type="number"
                      value={l.Amount}
                      onChange={e => updateLine(i, "Amount", e.target.value)}
                      className={
                        l.AccountId && Number(l.Amount) <= 0 ? "error-input" : ""
                      }
                    />
                    
                    </div>
                  </td>

                  

                  <td>
                    {lines.length > 1 && (
                      <button
                        className="invaction-btn invaction-delete"
                        onClick={() => removeRow(i)}
                      >
                        ✕
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

{/* ---------------- FOOTER ---------------- */}
     


        <div className="table-footer">
  <button className="btn-submit small" onClick={addRow}>
    ➕ Add Row
  </button>

  <div className="cell-box">
    <label>Total Amount</label>
    <input value={totalAmount.toFixed(2)} readOnly />
  </div>
</div>


        </div>
        </div>

        

        <div className="form-actions">
          <button className="btn-submit" onClick={handleSave}>
            💾 Save Expense
          </button>
        </div>

        
{showPaymentModal && (
  <div className="modal-overlay">
    <div className="modal-card">

      <div className="modal-header">
        <h3>Pay Expense</h3>
        <button onClick={() => setShowPaymentModal(false)}>✕</button>
      </div>

      <div className="modal-body">

        <div className="form-grid">

          <div className="form-group">
            <label>Payment Date</label>
            <input
              type="date"
              value={paymentForm.PaymentDate}
              onChange={e =>
                setPaymentForm(p => ({ ...p, PaymentDate: e.target.value }))
              }
            />
          </div>

          <div className="form-group">
            <label>Paid Via *</label>
            <select
              value={paymentForm.PaidViaAccountId}
              onChange={e =>
                setPaymentForm(p => ({ ...p, PaidViaAccountId: e.target.value }))
              }
            >
              <option value="">Select</option>
              {cashBankAccounts.map(a => (
                <option key={a.AccountId} value={a.AccountId}>
                  {a.AccountName}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Amount *</label>
            <input
              type="number"
              value={paymentForm.Amount}
              onChange={e =>
                setPaymentForm(p => ({ ...p, Amount: e.target.value }))
              }
            />
          </div>

          <div className="form-group">
            <label>Notes</label>
            <input
              value={paymentForm.Notes}
              onChange={e =>
                setPaymentForm(p => ({ ...p, Notes: e.target.value }))
              }
            />
          </div>

        </div>

      </div>

      <div className="modal-footer">
        <button
          className="btn-submit"
          onClick={() => {
            // 🔴 FRONTEND VALIDATIONS
           if (!paymentForm.PaidViaAccountId) {
  setModal({ show: true, message: "Select payment account", type: "error" });
  return;
}
            if (Number(paymentForm.Amount) <= 0) {
  setModal({ show: true, message: "Amount must be greater than zero", type: "error" });
  return;
}
          if (Number(paymentForm.Amount) > getUnpaidAmount(viewExpense)) {
  setModal({ show: true, message: "Payment cannot exceed unpaid amount", type: "error" });
  return;
}

            //const user = JSON.parse(localStorage.getItem("user"));
if (!viewExpense) {
  setModal({ show: true, message: "No expense selected", type: "error" });
  return;
}

            window.chrome.webview.postMessage({
              Action: "SaveExpensePayment",
              Payload: {
                ExpenseVoucherId: viewExpense.ExpenseVoucherId,
                PaymentDate: paymentForm.PaymentDate,
                PaidViaAccountId: paymentForm.PaidViaAccountId,
                Amount: Number(paymentForm.Amount),
                Notes: paymentForm.Notes,
                CreatedBy: getCreatedBy(),
              }
            });

            setShowPaymentModal(false);
          }}
        >
          💾 Save Payment
        </button>
      </div>

    </div>
  </div>
)}
{expenseList.length > 0 && (
  <div className="saved-summary">
    <h3>📌 Expense Vouchers</h3>

    <table className="data-table six-col">
      <thead>
        <tr>
          <th>No</th>
          <th>Date</th>
          <th>Notes</th>
          <th>Mode</th>
          <th>Total</th>
          <th>Paid</th>
          <th>Action</th>
        </tr>
      </thead>

      <tbody>
        {expenseList.map(e => (
          <tr key={e.ExpenseVoucherId}>
            <td>{e.VoucherNo}</td>
            <td>{e.Date}</td>
            <td>{e.Notes}</td>
            <td>{e.PaymentMode}</td>
            <td>{e.TotalAmount}</td>
            <td>
  {(e.PaymentMode === "Cash" || e.PaymentMode === "Bank")
    ? "N/A"
    : e.PaidAmount}
</td>

            <td>
              <div className="action-buttons">

                {/* VIEW */}
                <button
  className="btn-view compact"
  onClick={() => {
    window.chrome.webview.postMessage({
      Action: "LoadExpenseVoucher",
      Payload: { ExpenseVoucherId: e.ExpenseVoucherId }
    });
  }}
>
  👁 View
             </button>
                
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)}
{viewExpense && (
    <div className="summary-center">
  <div className="saved-summary compact">
    <h3>📄 Expense Voucher – {viewExpense.VoucherNo}</h3>

   <div className="summary-row">
  <strong>Date:</strong> {viewExpense.Date}
  <strong className="ml-20">Payment Mode:</strong> {viewExpense.PaymentMode}
</div>

   

    {viewExpense?.Items?.length > 0 && (
 <div className="table-container compact center">
  <table className="data-table two-col">
    <thead>
      <tr>
        <th>Expense</th>
        <th>Amount</th>
      </tr>
    </thead>
    <tbody>
      {viewExpense.Items.map((it, i) => (
        <tr key={i}>
          <td>{it.AccountName}</td>
          <td>{it.Amount}</td>
        </tr>
      ))}
    </tbody>
  </table>
</div>

)}


    <div className="summary-total">
      <strong>Total:</strong> ₹ {viewExpense.TotalAmount}
    </div>

    <div className="form-actions">

      {/* PAY */}
     {viewExpense &&
 viewExpense.PaymentMode === "Credit" &&
 getUnpaidAmount(viewExpense) > 0 && (
 <button
  className="btn-submit small"
  onClick={() => {
    if (!viewExpense) return;

    resetPaymentForm(viewExpense);   // 🔥 inject unpaid amount
    setShowPaymentModal(true);
  }}
>
  💳 Pay Expense
</button>

)}

      {/* REVERSE */}
     {viewExpense &&
 getUnpaidAmount(viewExpense) === viewExpense.TotalAmount && (
        <button
          className="btn-submit small"
          onClick={() =>
  setModal({
    show: true,
    message: "This will create an opposite accounting entry. Continue?",
    type: "confirm",
    onConfirm: () => {
      window.chrome.webview.postMessage({
        Action: "ReverseExpenseVoucher",
        Payload: {
          ExpenseVoucherId: viewExpense.ExpenseVoucherId,
          ReversedBy: getCreatedBy()
        }
      });
    }
  })
}
        >
          🔄 Reverse Expense
        </button>
        
      )}
    </div>
  </div>
  </div>
)}

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
  </div>
)}
    </>
  );
}
