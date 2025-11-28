import React, { useState, useEffect } from "react";
import "./SalesReturn.css";

export default function PurchaseReturn({ user }) {
  const [activeTab, setActiveTab] = useState("CREATE");

  const [showPdfModal, setShowPdfModal] = useState(false);
  const [downloadPath, setDownloadPath] = useState("");
  const [pdfPath, setPdfPath] = useState("");

  // ---------------- CREATE TAB ----------------
  const [purchaseDate, setPurchaseDate] = useState("");
  const [purchaseResults, setPurchaseResults] = useState([]);
  const [purchaseInfo, setPurchaseInfo] = useState(null);
  const [newReturnDate, setNewReturnDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [newNotes, setNewNotes] = useState("");
  const [newItems, setNewItems] = useState([]);
  const [newTotals, setNewTotals] = useState({
    sub: 0,
    tax: 0,
    total: 0,
    roundOff: 0,
  });
  const [newError, setNewError] = useState("");

  // ---------------- VIEW TAB ----------------
  const [prDate, setPrDate] = useState("");
  const [prResults, setPrResults] = useState([]);
  const [currentReturnId, setCurrentReturnId] = useState(null);
  const [viewReturnNo, setViewReturnNo] = useState("");
  const [viewReturnDate, setViewReturnDate] = useState("");
  const [viewNotes, setViewNotes] = useState("");
  const [viewPurchaseInfo, setViewPurchaseInfo] = useState(null);
  const [viewItems, setViewItems] = useState([]);
  const [viewTotals, setViewTotals] = useState({
    sub: 0,
    tax: 0,
    total: 0,
    roundOff: 0,
  });
  const [viewError, setViewError] = useState("");

  // ---------------- WEBVIEW LISTENER ----------------
  useEffect(() => {
    const handler = (event) => {
  let msg = event.data;

  if (!msg) return;

  if (typeof msg === "string") {
    try { msg = JSON.parse(msg); } catch { return; }
  }

  if (typeof msg !== "object") return;

  // SUPPORT BOTH action and Action
  const action = msg.action || msg.Action;
  if (!action) return;

  switch (action) {
    case "SearchPurchaseItemsByDateResponse":
  setPurchaseResults(msg.items || []);
  break;

    case "LoadPurchaseForReturnResponse":
      handlePurchaseLoadedForNewReturn(msg.item || msg.Item || msg.data);
      break;

   case "SavePurchaseReturnResponse":
{
  if (msg.success) {
    const rn = msg.data?.returnNo || msg.data?.ReturnNo;
    const rid = msg.data?.returnId || msg.data?.ReturnId;

    alert(`Purchase return saved successfully${rn ? " — " + rn : ""}.`);

    // Reset screen
    setNewItems([]);
    setPurchaseInfo(null);
    setNewNotes("");
    setNewReturnDate(new Date().toISOString().slice(0, 10));
    setNewTotals({ sub: 0, tax: 0, total: 0, roundOff: 0 });
    setPurchaseResults([]);

    // OPTIONAL: Show ReturnNo in UI instantly
    // setViewReturnNo(rn);
    // setViewReturnDate(new Date().toISOString().slice(0, 10));

  } else {
    alert("Failed to save purchase return: " + msg.error);
  }
  break;
}


    case "SearchPurchaseReturnsResponse":
      setPrResults(msg.returns || msg.Returns || msg.data || []);
      break;

    case "LoadPurchaseReturnDetailResponse":
      console.log("sdfdfgfgfg");
      handlePurchaseReturnLoadedForView(msg.returnData || msg.ReturnData || msg.data);
      break;

        case "PrintPurchaseReturnResponse":
          if (msg.success) {
            const fileName = msg.pdfPath.split("\\").pop();
            const url = "https://invoices.local/" + fileName;
            setPdfPath(url);
            setDownloadPath(msg.pdfPath);
            setShowPdfModal(true);
          } else {
            alert("Print failed: " + msg.message);
          }
          break;

        default:
          break;
      }
    };

    window.chrome.webview.addEventListener("message", handler);
    return () =>
      window.chrome.webview.removeEventListener("message", handler);
  }, []);

  // ---------------- TOTAL CALC ----------------
  const recalcNewTotals = (rows) => {
    let sub = 0;
    let tax = 0;
    rows.forEach((r) => {
      sub += r.lineSubTotal || 0;
      tax += r.gstValue || 0;
    });
    const raw = sub + tax;
    const total = Math.round(raw);
    const roundOff = total - raw;
    setNewTotals({ sub, tax, total, roundOff });
  };

  const recalcViewTotals = (rows) => {
    let sub = 0;
    let tax = 0;
    rows.forEach((r) => {
      sub += r.lineSubTotal || 0;
      tax += r.gstValue || 0;
    });
    const raw = sub + tax;
    const total = Math.round(raw);
    const roundOff = total - raw;
    setViewTotals({ sub, tax, total, roundOff });
  };

  // ---------------- CREATE MODE: LOAD PURCHASE ITEM ----------------
  const handlePurchaseLoadedForNewReturn = (item) => {
    if (!item) return;

    // purchaseInfo is the header (invoice/refno/supplier)
    setPurchaseInfo({
      id: item.ItemDetailsId,
      invoiceNo: item.InvoiceNo, // refno
      supplierId: item.SupplierId,
      supplierName: item.SupplierName,
    });

    setNewNotes("");
    setNewReturnDate(new Date().toISOString().slice(0, 10));

    const mapped = [
      {
        itemDetailsId: item.ItemDetailsId,
        itemId: item.ItemId,
        itemName: item.ItemName,
        batchNo: item.BatchNo,
        originalQty: item.Quantity || 0,
        returnedQty: item.AlreadyReturnedQty || 0,
        availableReturnQty:
          (item.Quantity || 0) - (item.AlreadyReturnedQty || 0),

        rate: item.PurchasePrice,
        discountPercent: item.DiscountPercent,
        gstPercent: item.GstPercent,

        // base numbers for calculations: use NetPurchasePrice as taxable unit
        taxableUnit: item.NetPurchasePrice || item.PurchasePrice || 0,
        gstUnit:
          (item.NetPurchasePrice || item.PurchasePrice || 0) *
          ((item.GstPercent || 0) / 100),

        returnQty: 0,
        lineSubTotal: 0,
        gstValue: 0,
        lineTotal: 0,
      },
    ];

    setNewItems(mapped);
    recalcNewTotals(mapped);
  };

  // ---------------- CREATE MODE: CHANGE QTY ----------------
  const handleNewQtyChange = (index, qtyInput) => {
    let qty = parseFloat(qtyInput) || 0;

    const rows = [...newItems];
    const r = rows[index];

    if (qty < 0) qty = 0;
    if (qty > r.availableReturnQty) qty = r.availableReturnQty;

    r.returnQty = qty;
    r.lineSubTotal = r.taxableUnit * qty;
    r.gstValue = r.gstUnit * qty;
    r.lineTotal = r.lineSubTotal + r.gstValue;

    setNewItems(rows);
    recalcNewTotals(rows);
  };

  // ---------------- CREATE MODE: SAVE ----------------
  const savePurchaseReturn = () => {
    if (!purchaseInfo) {
      setNewError("Select a purchase item first.");
      return;
    }
    const any = newItems.some((i) => i.returnQty > 0);
    if (!any) {
      setNewError("Enter quantity for at least one item.");
      return;
    }
    setNewError("");

   const x = newItems[0];  // single row

const dto = {
  ReturnId: 0,
  ReturnNo: "",      // backend will generate
  ReturnNum: 0,      // backend will generate
  ItemDetailsId: x.itemDetailsId,
  ItemId: x.itemId,
  SupplierId: purchaseInfo.supplierId,
  ReturnDate: newReturnDate,

  Qty: x.returnQty,
  Rate: x.rate,
  DiscountPercent: x.discountPercent,

  NetRate: x.taxableUnit,     // rate - discount
  BatchNo: x.batchNo,

  GstPercent: x.gstPercent,
  Amount: x.lineSubTotal,
  Cgst: x.gstValue / 2,
  Sgst: x.gstValue / 2,
  Igst: 0,
  TotalAmount: x.lineTotal,

  Remarks: newNotes,
  CreatedBy: user?.email
};



    window.chrome.webview.postMessage({
      Action: "SavePurchaseReturn",
      Payload: dto,
    });
  };

  // ---------------- VIEW MODE: LOAD PURCHASE RETURN ----------------
const handlePurchaseReturnLoadedForView = (data) => {
  if (!data) return;
console.log("data received in handlePurchaseReturnLoadedForView");
  setCurrentReturnId(data.Id);
  setViewReturnNo(data.ReturnNo);
  setViewReturnDate(data.ReturnDate?.slice(0, 10) || "");
  setViewNotes(data.Notes || "");

  setViewPurchaseInfo({
    invoiceNo: data.InvoiceNo || "",
    supplierName: data.SupplierName || ""
  });

  // Purchase Return is ALWAYS single-item, but backend returns Items[] for UI consistency
  //const items = data.Items || [];
  const rows = [
  {
    itemName: data.ItemName,
    batchNo: data.BatchNo,
    returnQty: data.Qty,
    rate: data.Rate,
    gstPercent: data.GstPercent,
    lineSubTotal: data.LineSubTotal,
    gstValue: data.GstValue,
    lineTotal: data.LineTotal
  }
];

setViewItems(rows);
recalcViewTotals(rows);
};


  // ---------------- SEARCH ACTIONS ----------------
  const searchPurchaseItemsForReturn = () => {
    if (!purchaseDate) {
      setNewError("Select purchase date.");
      return;
    }
    window.chrome.webview.postMessage({
      Action: "SearchPurchaseItemsByDate",
      Payload: { Date: purchaseDate },
    });
  };

  const searchPurchaseReturns = () => {
    if (!prDate) {
      setViewError("Select return date.");
      return;
    }
    window.chrome.webview.postMessage({
      Action: "SearchPurchaseReturns",
      Payload: { Date: prDate },
    });
  };

  const clickPurchaseRow = (inv) =>
    window.chrome.webview.postMessage({
      Action: "LoadPurchaseForReturn",
      Payload: { ItemDetailsId: inv.ItemDetailsId || inv.id || inv.ItemDetailsId },
    });

  const clickPurchaseReturnRow = (sr) =>
    window.chrome.webview.postMessage({
      Action: "LoadPurchaseReturnDetail",
      Payload: { ReturnId: sr.Id },
    });

  const printPurchaseReturn = () =>
    currentReturnId &&
    window.chrome.webview.postMessage({
      Action: "PrintPurchaseReturn",
      Payload: { ReturnId: currentReturnId },
    });

  // ==========================================================
  // ======================== UI ==============================
  // ==========================================================

  return (
    <div className="sales-return">
      <h2>Purchase Return</h2>

      <div className="sr-tabs">
        <button
          className={`btn-submit small ${activeTab === "CREATE" ? "active" : ""}`}
          onClick={() => setActiveTab("CREATE")}
        >
          Create Purchase Return
        </button>

        <button
          className={`btn-submit small ${activeTab === "VIEW" ? "active" : ""}`}
          onClick={() => setActiveTab("VIEW")}
        >
          View / Print Purchase Return
        </button>
      </div>

      {/* CREATE TAB */}
      {activeTab === "CREATE" && (
        <>
          {/* SEARCH BLOCK */}
          <div className="sr-search-block">
            <h3>Select Purchase Item (by Date)</h3>
            <div className="sr-filters">
              <div className="sr-date-box">
                <label>Purchase Date:</label>
                <input
                  type="date"
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                />
              </div>

              <button className="btn-submit small" onClick={searchPurchaseItemsForReturn}>
                Search
              </button>
            </div>

            <div className="sr-list-container">
              <table className="sr-list-table">
                <thead>
                  <tr>
                    <th>Ref/Invoice</th>
                    <th>Date</th>
                    <th>ItemName</th>
                    <th>Supplier</th>
                    <th>Qty</th>
                  </tr>
                </thead>
                <tbody>
                  {purchaseResults.length === 0 && (
                    <tr>
                      <td colSpan="4" style={{ textAlign: "center" }}>
                        No purchases found.
                      </td>
                    </tr>
                  )}
                  {purchaseResults.map((inv) => (
                    <tr key={inv.ItemDetailsId} onClick={() => clickPurchaseRow(inv)}>
                      <td>{inv.InvoiceNo}</td>
                      <td>{inv.PurchaseDate}</td>
                      <td>{inv.ItemName}</td>
                      <td>{inv.SupplierName}</td>
                      <td>{inv.Quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* HEADER */}
          <div className="sr-header-row">
            <div>
              {purchaseInfo && (
                <>
                  <div>
                    <strong>Ref/Invoice:</strong> {purchaseInfo.invoiceNo}
                  </div>
                  <div>
                    <strong>Supplier:</strong> {purchaseInfo.supplierName}
                  </div>
                </>
              )}
            </div>
            <div>
              <label>
                Return Date:
                <input
                  type="date"
                  value={newReturnDate}
                  onChange={(e) => setNewReturnDate(e.target.value)}
                />
              </label>
            </div>
          </div>

          {/* ITEMS TABLE */}
          <div className="sr-items-section">
            <table className="sr-items-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Batch</th>
                  <th>Available</th>
                  <th>Rate</th>
                  <th>GST%</th>
                  <th>Return Qty</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {newItems.length === 0 && (
                  <tr>
                    <td colSpan="7" style={{ textAlign: "center" }}>
                      No items loaded.
                    </td>
                  </tr>
                )}
                {newItems.map((row, i) => (
                  <tr key={i}>
                    <td>{row.itemName}</td>
                    <td>{row.batchNo}</td>
                    <td>{row.availableReturnQty}</td>
                    <td>{row.rate}</td>
                    <td>{row.gstPercent}</td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        max={row.availableReturnQty}
                        value={row.returnQty}
                        onChange={(e) => handleNewQtyChange(i, e.target.value)}
                      />
                    </td>
                    <td>{(row.lineTotal || 0).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {newError && <div className="error">{newError}</div>}

          {/* FOOTER */}
          <div className="sr-footer-row">
            <div className="sr-notes">
              <label>
                Notes:
                <textarea
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                />
              </label>
            </div>

            <div className="sr-totals-and-actions">
              <div className="sr-totals">
                <div>SubTotal: {newTotals.sub.toFixed(2)}</div>
                <div>Total Tax: {newTotals.tax.toFixed(2)}</div>
                <div>Round Off: {newTotals.roundOff.toFixed(2)}</div>
                <div>
                  <strong>Grand Total: {newTotals.total.toFixed(2)}</strong>
                </div>
              </div>

              <div>
                <button className="btn-submit small" onClick={savePurchaseReturn}>
                  Save Purchase Return
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* VIEW TAB */}
      {activeTab === "VIEW" && (
        <>
          <div className="sr-search-block">
            <h3>Select Purchase Return (by Date)</h3>
            <div className="sr-filters">
              <label>
                Return Date:
                <input
                  type="date"
                  value={prDate}
                  onChange={(e) => setPrDate(e.target.value)}
                />
              </label>
              <button className="btn-submit small" onClick={searchPurchaseReturns}>
                Search
              </button>
            </div>

            <div className="sr-list-container">
              <table className="sr-list-table">
                <thead>
                  <tr>
                    <th>Return No</th>
                    <th>Date</th>
                    <th>Ref/Invoice</th>
                    <th>Supplier</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {prResults.length === 0 && (
                    <tr>
                      <td colSpan="5" style={{ textAlign: "center" }}>
                        No purchase returns found.
                      </td>
                    </tr>
                  )}
                  {prResults.map((sr) => (
                    <tr key={sr.Id} onClick={() => clickPurchaseReturnRow(sr)}>
                      <td>{sr.ReturnNo}</td>
                      <td>{sr.ReturnDate}</td>
                      <td>{sr.InvoiceNo}</td>
                      <td>{sr.SupplierName}</td>
                      <td>{sr.TotalAmount?.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="sr-header-row">
            <div>
              {viewReturnNo && (
                <div>
                  <strong>Return No:</strong> {viewReturnNo}
                </div>
              )}
              {viewPurchaseInfo && (
                <>
                  <div>
                    <strong>Ref/Invoice:</strong> {viewPurchaseInfo.invoiceNo}
                  </div>
                  <div>
                    <strong>Supplier:</strong> {viewPurchaseInfo.supplierName}
                  </div>
                </>
              )}
            </div>

            <div>
              <label>
                Return Date:
                <input type="date" value={viewReturnDate} disabled />
              </label>
            </div>
          </div>

          <div className="sr-items-section">
            <table className="sr-items-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Batch</th>
                  <th>Qty</th>
                  <th>Rate</th>
                  <th>GST%</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {viewItems.length === 0 && (
                  <tr>
                    <td colSpan="6" style={{ textAlign: "center" }}>
                      No items.
                    </td>
                  </tr>
                )}
                {viewItems.map((row, i) => (
                  <tr key={i}>
                    <td>{row.itemName}</td>
                    <td>{row.batchNo}</td>
                    <td>{row.returnQty}</td>
                    <td>{row.rate}</td>
                    <td>{row.gstPercent}</td>
                    <td>{row.lineTotal.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {viewError && <div className="error">{viewError}</div>}

          <div className="sr-footer-row">
            <div className="sr-notes">
              <label>
                Notes:
                <textarea value={viewNotes} readOnly />
              </label>
            </div>

            <div className="sr-totals-and-actions">
              <div className="sr-totals">
                <div>SubTotal: {viewTotals.sub.toFixed(2)}</div>
                <div>Total Tax: {viewTotals.tax.toFixed(2)}</div>
                <div>Round Off: {viewTotals.roundOff.toFixed(2)}</div>
                <div>
                  <strong>Grand Total: {viewTotals.total.toFixed(2)}</strong>
                </div>
              </div>

              <div className="sr-actions">
                <button className="btn-submit small" onClick={printPurchaseReturn}>
                  Print
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {showPdfModal && (
        <div className="pdf-modal-overlay">
          <div className="pdf-modal-box">
            <div className="pdf-modal-header">
              <h3>Purchase Return PDF Preview</h3>
              <p>
                Saved to: <b>{downloadPath}</b>
              </p>
              <button className="btn-submit small" onClick={() => setShowPdfModal(false)}>
                X
              </button>
            </div>

            <iframe src={pdfPath} style={{ width: "100%", height: "80vh", border: "none" }}></iframe>

            <button
              className="btn-submit small"
              onClick={() => document.querySelector(".pdf-modal-box iframe").contentWindow.print()}
            >
              Print
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
