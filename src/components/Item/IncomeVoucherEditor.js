import "./ItemForms.css";
import "./ExpenseVoucherEditor.css";
import { getCreatedBy } from "../../utils/authHelper";

import React, { useEffect, useState } from "react";

const blankLine = () => ({
  AccountId: 0,
  AccountName: "",
  Amount: ""
});

export default function IncomeVoucherEditor() {
  /* ---------------- HEADER ---------------- */
  const [date, setDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [paymentMode, setPaymentMode] = useState("Cash");
  const [notes, setNotes] = useState("");

  /* ---------------- GRID ---------------- */
  const [lines, setLines] = useState([blankLine()]);
  const [accountList, setAccountList] = useState([]);
  const [activeRow, setActiveRow] = useState(null);
  const [saving, setSaving] = useState(false);

  /* ---------------- LIST / VIEW ---------------- */
  const [incomeList, setIncomeList] = useState([]);
  const [viewIncome, setViewIncome] = useState(null);

  /* ---------------- PAYMENT ---------------- */
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [cashBankAccounts, setCashBankAccounts] = useState([]);
  const [paymentForm, setPaymentForm] = useState({
    PaymentDate: new Date().toISOString().split("T")[0],
    ReceivedInAccountId: "",
    Amount: 0,
    Notes: ""
  });

  /* ---------------- LOAD DATA ---------------- */
  useEffect(() => {
    window.chrome.webview.postMessage({ Action: "GetIncomeAccounts" });
    window.chrome.webview.postMessage({ Action: "GetIncomeVouchers" });
    window.chrome.webview.postMessage({ Action: "GetCashBankAccounts" });
  }, []);

  /* ---------------- MESSAGE HANDLER ---------------- */
  useEffect(() => {
    const handler = (e) => {
      let msg = e.data;
      if (typeof msg === "string") msg = JSON.parse(msg);

      if (msg.action === "GetIncomeAccountsResponse")
        setAccountList(msg.data || []);

      if (msg.action === "GetIncomeVouchersResponse")
        setIncomeList(msg.data || []);

      if (msg.action === "SaveIncomeVoucherResponse") {
        setSaving(false);
        if (!msg.success) {
          alert(msg.Message);
          return;
        }
        alert(`✅ Income saved\nVoucher No: ${msg.VoucherNo}`);
        setLines([blankLine()]);
        setNotes("");
        window.chrome.webview.postMessage({ Action: "GetIncomeVouchers" });
      }

      if (msg.action === "LoadIncomeVoucherResponse") {
        if (!msg.success) {
          alert(msg.message);
          return;
        }
        setViewIncome(msg.data);
      }

      if (msg.action === "SaveIncomePaymentResponse") {
        if (!msg.success) {
          alert(msg.message);
          return;
        }
        alert("✅ Income payment received");
        setShowPaymentModal(false);
        window.chrome.webview.postMessage({ Action: "GetIncomeVouchers" });
      }

      if (msg.action === "ReverseIncomeVoucherResponse") {
        if (!msg.success) {
          alert(msg.message);
          return;
        }
        alert("✅ Income voucher reversed");
        setViewIncome(null);
        window.chrome.webview.postMessage({ Action: "GetIncomeVouchers" });
      }

      if (msg.action === "GetCashBankAccountsResponse") {
        setCashBankAccounts(msg.data || []);
      }
    };

    window.chrome.webview.addEventListener("message", handler);
    return () =>
      window.chrome.webview.removeEventListener("message", handler);
  }, []);

  /* ---------------- HELPERS ---------------- */
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

  const totalAmount = lines.reduce(
    (s, l) => s + Number(l.Amount || 0),
    0
  );

  const getUnpaidAmount = (inc) => {
    if (!inc) return 0;
    return Number(inc.TotalAmount) - Number(inc.PaidAmount || 0);
  };

  /* ---------------- SAVE INCOME ---------------- */
  const handleSave = () => {
    console.log(localStorage);
    if (saving) return;

    const validLines = lines.filter(
      l => l.AccountId && Number(l.Amount) > 0
    );

    if (validLines.length === 0) {
      alert("Add at least one income line");
      return;
    }

    setSaving(true);
    //const user = JSON.parse(localStorage.getItem("user"));

    window.chrome.webview.postMessage({
      Action: "SaveIncomeVoucher",
      Payload: {
        Date: date,
        PaymentMode: paymentMode,
        TotalAmount: totalAmount,
        Notes: notes,
        CreatedBy: getCreatedBy(),
        Items: validLines.map(l => ({
          AccountId: l.AccountId,
          Amount: Number(l.Amount)
        }))
      }
    });
  };

  /* ===================================================== */
  /* ======================= UI =========================== */
  /* ===================================================== */

  return (
    <div className="form-container">
      <h2 className="form-title">💰 Income Voucher</h2>

      {/* HEADER */}
      <div className="form-row">
        <div className="form-group">
          <label>Date</label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Payment Mode</label>
          <select
            value={paymentMode}
            onChange={e => setPaymentMode(e.target.value)}
          >
            <option value="Cash">Cash</option>
            <option value="Bank">Bank</option>
            <option value="Credit">Credit</option>
          </select>
        </div>

        <div className="form-group full" style={{ width: "100%" }}>
            <label>Notes</label>
            <input value={notes}  style={{ width: "100%" }} onChange={e => setNotes(e.target.value)} />
          </div>
      </div>

      {/* GRID */}
       <div className="table-container compact">
  <div className="table-box">
      <table className="data-table compact-center">
        <thead>
          <tr>
            <th>Income Account</th>
            <th>Amount</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {lines.map((l, i) => (
            <tr key={i}>
              <td style={{ position: "relative" }}>
                <div className="cell-box">
                <input
                  value={l.AccountName}
                  placeholder="Search income"
                  onChange={e => {
                    updateLine(i, "AccountName", e.target.value);
                    setActiveRow(i);
                  }}
                  onFocus={() => setActiveRow(i)}
                />
</div>
                {activeRow === i && l.AccountName && (
                  <div className="suggestions-box">
                    {accountList
                      .filter(a =>
                        a.AccountName.toLowerCase()
                          .includes(l.AccountName.toLowerCase())
                      )
                      .slice(0, 10)
                      .map(a => (
                        <div
                          key={a.AccountId}
                          className="suggestion-row"
                          onMouseDown={() => {
                            updateLine(i, "AccountId", a.AccountId);
                            updateLine(i, "AccountName", a.AccountName);
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
                  <button className="invaction-btn invaction-delete" onClick={() => removeRow(i)}>✕</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>


          <div className="table-footer">
      <button className="btn-submit small" onClick={addRow}>
        ➕ Add Row
      </button>

<div className="cell-box">
    <label>Total Amount</label>
    <input value={totalAmount.toFixed(2)} readOnly />
  </div>
</div>
</div></div>

      


      <div className="form-actions">
        <button className="btn-submit" onClick={handleSave}>
          💾 Save Income
        </button>
      </div>

      {/* ===================== INCOME LIST ===================== */}
      {incomeList.length > 0 && (
        <div className="saved-summary">
          <h3>📌 Income Vouchers</h3>

          <table className="data-table">
            <thead>
              <tr>
                <th>No</th>
                <th>Date</th>
                <th>Notes</th>
                <th>Mode</th>
                <th>Total</th>
                <th>Received Amount</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {incomeList.map(i => (
                <tr key={i.IncomeVoucherId}>
                  <td>{i.VoucherNo}</td>
                  <td>{i.Date}</td>
                  <td>{i.Notes}</td>
                  <td>{i.PaymentMode}</td>
                  <td>{i.TotalAmount}</td>
                  <td>
  {(i.PaymentMode === "Cash" || i.PaymentMode === "Bank")
    ? "N/A"
    : i.ReceivedAmount}
</td>
                  <td>
                    <button
                      className="btn-view compact"
                      onClick={() =>
                        window.chrome.webview.postMessage({
                          Action: "LoadIncomeVoucher",
                          Payload: { IncomeVoucherId: i.IncomeVoucherId }
                        })
                      }
                    >
                      👁 View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ===================== VIEW INCOME ===================== */}
      {viewIncome && (
         <div className="summary-center">
  <div className="saved-summary compact">
          <h3>📄 Income Voucher – {viewIncome.VoucherNo}</h3>

          <div className="summary-row">
            <strong>Date:</strong> {viewIncome.Date}
            <strong className="ml-20">Payment Mode:</strong> {viewIncome.PaymentMode}
          </div>


{viewIncome?.Items?.length > 0 && (
 <div className="table-container compact center">
  <table className="data-table two-col">
    <thead>
      <tr>
        <th>Income</th>
        <th>Amount</th>
      </tr>
    </thead>
    <tbody>
      {viewIncome.Items.map((it, i) => (
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
            <strong>Total:</strong> ₹ {viewIncome.TotalAmount}
          </div>

          <div className="form-actions">
            {/* 🔹 RECEIVE PAYMENT TRIGGER */}
            {viewIncome.PaymentMode === "Credit" &&
              getUnpaidAmount(viewIncome) > 0 && (
                <button
                  className="btn-submit small"
                  onClick={() => {
                    setPaymentForm(p => ({
                      ...p,
                      Amount: getUnpaidAmount(viewIncome)
                    }));
                    setShowPaymentModal(true);
                  }}
                >
                  💳 Receive Payment
                </button>
              )}

{/* REVERSE */}
     {viewIncome &&
 getUnpaidAmount(viewIncome) === viewIncome.TotalAmount && (
        <button
          className="btn-submit small"
          onClick={() => {
            if (!window.confirm(
              "This will create an opposite accounting entry. Continue?"
            )) return;
            //const user = JSON.parse(localStorage.getItem("user"));
            window.chrome.webview.postMessage({
              Action: "ReverseIncomeVoucher",
              Payload: {
                IncomeVoucherId: viewIncome.IncomeVoucherId,
                ReversedBy: getCreatedBy()
              }
            });
          }}
        >
          🔄 Reverse Income
        </button>
        
      )}

          </div>
        </div>
        </div>  
      )}

      {/* ===================== PAYMENT MODAL ===================== */}
      {showPaymentModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
        <h3>Receive Income</h3>
        <button onClick={() => setShowPaymentModal(false)}>✕</button>
      </div>

             <div className="modal-body">

        <div className="form-grid">

          <div className="form-group">
            <label>Date</label>
            <input
              type="date"
              value={paymentForm.PaymentDate}
              onChange={e =>
                setPaymentForm(p => ({ ...p, PaymentDate: e.target.value }))
              }
            />
</div>

    <div className="form-group">
            <label>Received In *</label>
            <select
              value={paymentForm.ReceivedInAccountId}
              onChange={e =>
                setPaymentForm(p => ({
                  ...p,
                  ReceivedInAccountId: e.target.value
                }))
              }
            >
              <option value="">Select Cash / Bank</option>
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
                  if (!paymentForm.ReceivedInAccountId) {
                    alert("Select cash/bank account");
                    return;
                  }

                  const user = JSON.parse(localStorage.getItem("user"));

                  window.chrome.webview.postMessage({
                    Action: "SaveIncomePayment",
                    Payload: {
                      IncomeVoucherId: viewIncome.IncomeVoucherId,
                      PaymentDate: paymentForm.PaymentDate,
                      ReceivedInAccountId:
                        paymentForm.ReceivedInAccountId,
                      Amount: Number(paymentForm.Amount),
                      Notes: paymentForm.Notes,
                      CreatedBy: getCreatedBy(),
                    }
                  });
                }}
              >
                💾 Save Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
