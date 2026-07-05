import React, { useState, useEffect } from "react";
import "./Reports.css";

export default function ReturnGainLossReport() {
const today = new Date();

const fyStartYear =
today.getMonth() >= 3
? today.getFullYear()
: today.getFullYear() - 1;

const fyStartDate = new Date(fyStartYear, 3, 1);
const [loaded, setLoaded] = useState(false);
const toastRef = React.useRef(null);
const [from, setFrom] = useState(
`${fyStartDate.getFullYear()}-${String(
      fyStartDate.getMonth() + 1
    ).padStart(2, "0")}-${String(
      fyStartDate.getDate()
    ).padStart(2, "0")}`
);

const [to, setTo] = useState(
new Date().toISOString().slice(0, 10)
);
function showToast(message) {
  if (toastRef.current) return;

  const toast = document.createElement("div");
  toast.innerText = message;

  toast.style.position = "fixed";
  toast.style.top = "50%";
  toast.style.left = "50%";
  toast.style.transform = "translate(-50%, -50%)";
  toast.style.background = "#333";
  toast.style.color = "#fff";
  toast.style.padding = "14px 22px";
  toast.style.borderRadius = "8px";
  toast.style.zIndex = 9999;
  toast.style.fontSize = "15px";
  toast.style.boxShadow = "0 4px 12px rgba(0,0,0,0.3)";

  document.body.appendChild(toast);
  toastRef.current = toast;
}

function hideToast() {
  if (toastRef.current) {
    toastRef.current.remove();
    toastRef.current = null;
  }
}
const [type, setType] = useState("BOTH");

const [rows, setRows] = useState([]);

const [summary, setSummary] = useState({
purchaseGain: 0,
purchaseLoss: 0,
salesGain: 0,
salesLoss: 0,
netGainLoss: 0
});

const [modal, setModal] = useState({
show: false,
message: ""
});
const exportPdf = () => {
    if (!loaded) {
        setModal({
            show: true,
            message: "Load report first."
        });
        return;
    }

    window.chrome.webview.postMessage({
        action: "exportReturnGainLossPdf",
        payload: {
            fromDate: from,
            toDate: to,
            type
        }
    });
};
const exportExcel = () => {
    if (!loaded) {
        setModal({
            show: true,
            message: "Load report first."
        });
        return;
    }

    showToast("Opening Excel...");

    window.chrome.webview.postMessage({
        action: "exportReturnGainLossExcel",
        payload: {
            fromDate: from,
            toDate: to,
            type
        }
    });
};

useEffect(() => {
const handler = (e) => {
const msg = e.data;


  if (msg.action ===  "LoadReturnGainLossReportResult"  ) 
    {
    if (msg.success) {
      setRows(msg.rows || []);

      setSummary(
        msg.summary || {
          purchaseGain: 0,
          purchaseLoss: 0,
          salesGain: 0,
          salesLoss: 0,
          netGainLoss: 0
        }
      );
       setLoaded(true);
    } 
    else {
      setLoaded(false);
      setModal({
        show: true,
        message:
          msg.message ||
          "Unable to load report."
      });
    }
  }
  if (msg.action === "generateReturnGainLossPdfResult") {
    if (msg.success) {
        window.chrome.webview.postMessage({
            action: "openFile",
            data: { path: msg.path }
        });
    } else {
        setModal({
            show: true,
            message: "PDF generation failed."
        });
    }
}
if (msg.action === "exportReturnGainLossExcelResponse") {
    hideToast();

    if (!msg.success) {
        setModal({
            show: true,
            message: msg.message || "Excel export failed."
        });
    }
}
};

window.chrome.webview.addEventListener(
  "message",
  handler
);

return () =>
  window.chrome.webview.removeEventListener(
    "message",
    handler
  );


}, []);

const loadReport = () => {
window.chrome.webview.postMessage({
action: "LoadReturnGainLossReport",
payload: {
fromDate: from,
toDate: to,
type
}
});
};
const totals = rows.reduce(
  (t, r) => {
    t.qty += Number(r.Qty || 0);
    t.gain += Number(r.GainAmount || 0);
    t.loss += Number(r.LossAmount || 0);

    return t;
  },
  {
    qty: 0,
    gain: 0,
    loss: 0
  }
);
return (
<> <div className="form-container"> <h2 className="form-title">
Return Gain / Loss Report </h2>

    <div className="form-inner">

      <div className="form-row-horizontal">

        <div className="form-group">
          <label>From</label>

          <input
            type="date"
            value={from}
            onChange={(e) =>
              setFrom(e.target.value)
            }
          />
        </div>

        <div className="form-group">
          <label>To</label>

          <input
            type="date"
            value={to}
            onChange={(e) =>
              setTo(e.target.value)
            }
          />
        </div>

        <div className="form-group">
          <label>Type</label>

          <select
            value={type}
            onChange={(e) =>
              setType(e.target.value)
            }
          >
            <option value="BOTH">
              Both
            </option>

            <option value="PURCHASE">
              Purchase Return
            </option>

            <option value="SALES">
              Sales Return
            </option>
          </select>
        </div>

        <div className="inventory-btns">
    <button
        className="btn-submit small"
        onClick={loadReport}
    >
        Load
    </button>

    <button
        className="btn-submit small"
        type="button"
        onClick={exportPdf}
    >
        Export PDF
    </button>

    <button
        className="btn-submit small"
        type="button"
        onClick={exportExcel}
    >
        Export Excel
    </button>
</div>

      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(5,1fr)",
          gap: "12px",
          marginTop: "20px"
        }}
      >
        <div className="summary-card">
          <div>
            Purchase Gain
          </div>

          <strong>
            ₹
            {Number(
              summary.purchaseGain
            ).toFixed(2)}
          </strong>
        </div>

        <div className="summary-card">
          <div>
            Purchase Loss
          </div>

          <strong>
            ₹
            {Number(
              summary.purchaseLoss
            ).toFixed(2)}
          </strong>
        </div>

        <div className="summary-card">
          <div>
            Sales Gain
          </div>

          <strong>
            ₹
            {Number(
              summary.salesGain
            ).toFixed(2)}
          </strong>
        </div>

        <div className="summary-card">
          <div>
            Sales Loss
          </div>

          <strong>
            ₹
            {Number(
              summary.salesLoss
            ).toFixed(2)}
          </strong>
        </div>

        <div className="summary-card">
          <div>
            Net Gain / Loss
          </div>

          <strong>
            ₹
            {Number(
              summary.netGainLoss
            ).toFixed(2)}
          </strong>
        </div>
      </div>

      <div
        style={{
          marginTop: "20px",
          overflowX: "auto"
        }}
      >
        <table className="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Type</th>
              <th>Return No</th>
              <th>Reference</th>
              <th>Party</th>
              <th>Item</th>
              <th>Qty</th>
              <th>
                Original Rate
              </th>
              <th>
                Return Rate
              </th>
              <th>
                Difference
              </th>
              <th>Gain</th>
              <th>Loss</th>
            </tr>
          </thead>

          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan="12"
                  style={{
                    textAlign:
                      "center"
                  }}
                >
                  No data found
                </td>
              </tr>
            ) : (
              rows.map(
                (r, index) => (
                  <tr key={index}>
                    <td>
                      {r.ReturnDate}
                    </td>

                    <td>
                      {
                        r.ReturnType
                      }
                    </td>

                    <td>
                      {r.ReturnNo}
                    </td>

                    <td>
                      {r.RefNo}
                    </td>

                    <td>
                      {
                        r.PartyName
                      }
                    </td>

                    <td>
                      {
                        r.ItemName
                      }
                    </td>

                    <td>
                      {Number(
                        r.Qty
                      ).toFixed(2)}
                    </td>

                    <td>
                      ₹
                      {Number(
                        r.OriginalRate
                      ).toFixed(2)}
                    </td>

                    <td>
                      ₹
                      {Number(
                        r.ReturnRate
                      ).toFixed(2)}
                    </td>

                    <td>
                      ₹
                      {Number(
                        r.Difference
                      ).toFixed(2)}
                    </td>

                    <td>
                      ₹
                      {Number(
                        r.GainAmount
                      ).toFixed(2)}
                    </td>

                    <td>
                      ₹
                      {Number(
                        r.LossAmount
                      ).toFixed(2)}
                    </td>
                  </tr>
                )
              )
            )}
            <tr
  style={{
    fontWeight: "bold",
    background: "#f3f3f3",
    borderTop: "2px solid #666"
  }}
>
  <td></td>
  <td></td>
  <td></td>
  <td></td>
  <td></td>

  <td>Total</td>

  <td style={{ textAlign: "right" }}>
    {totals.qty.toFixed(2)}
  </td>

  <td></td>
  <td></td>
  <td></td>

  <td style={{ textAlign: "right" }}>
    ₹{totals.gain.toFixed(2)}
  </td>

  <td style={{ textAlign: "right" }}>
    ₹{totals.loss.toFixed(2)}
  </td>
</tr>
          </tbody>
        </table>
      </div>

    </div>
  </div>

  {modal.show && (
    <div className="modal-overlay">
      <div className="modal-box">
        <p>{modal.message}</p>

        <div className="modal-actions">
          <button
            className="modal-btn ok"
            onClick={() =>
              setModal({
                show: false,
                message: ""
              })
            }
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
