import React, { useState, useEffect } from "react";
import "./SalesReturn.css";

export default function SalesReturn({user}) {
  const [activeTab, setActiveTab] = useState("CREATE");

  // ---------------- CREATE TAB ----------------
  const [invoiceDate, setInvoiceDate] = useState("");
  const [invoiceResults, setInvoiceResults] = useState([]);
  const [invoiceInfo, setInvoiceInfo] = useState(null);
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
  const [srDate, setSrDate] = useState("");
  const [srResults, setSrResults] = useState([]);
  const [currentReturnId, setCurrentReturnId] = useState(null);
  const [viewReturnNo, setViewReturnNo] = useState("");
  const [viewReturnDate, setViewReturnDate] = useState("");
  const [viewNotes, setViewNotes] = useState("");
  const [viewInvoiceInfo, setViewInvoiceInfo] = useState(null);
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
      const msg = event.data;
      if (!msg) return;

      switch (msg.action) {
        case "SearchInvoicesForReturnResponse":
          setInvoiceResults(msg.invoices || []);
          break;

        case "LoadInvoiceForReturnResponse":
          handleInvoiceLoadedForNewReturn(msg.invoice);
          break;

        case "SaveSalesReturnResponse":
          if (msg.success) alert("Sales return saved successfully.");
          else alert("Failed to save return.");
          break;

        case "SearchSalesReturnsResponse":
          setSrResults(msg.returns || []);
          break;

        case "LoadSalesReturnDetailResponse":
          handleSalesReturnLoadedForView(msg.returnData);
          break;

        case "PrintSalesReturnResponse":
          if (msg.success) alert("PDF generated:\n" + msg.pdfPath);
          else alert("Failed to print.");
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

  // ---------------- CREATE MODE: LOAD INVOICE ----------------
  const handleInvoiceLoadedForNewReturn = (invoice) => {
    if (!invoice) return;

    setInvoiceInfo({
      id: invoice.Id,
      invoiceNo: invoice.InvoiceNo,
      customerId: invoice.CustomerId,
      customerName: invoice.CustomerName,
    });

    setNewNotes("");
    setNewReturnDate(new Date().toISOString().slice(0, 10));

    const mapped = (invoice.Items || []).map((x) => {
      // GST formula (your option A)
      const taxableUnit = x.Rate * (1 - (x.DiscountPercent || 0) / 100);
      const gstUnit = taxableUnit * ((x.GstPercent || 0) / 100);

      return {
        invoiceItemId: x.InvoiceItemId,
        itemId: x.ItemId,
        itemName: x.Name, // backend uses Name
        batchNo: x.BatchNo,
        originalQty: x.OriginalQty,
        returnedQty: x.ReturnedQty,
        availableReturnQty: x.AvailableReturnQty,

        rate: x.Rate,
        discountPercent: x.DiscountPercent,
        gstPercent: x.GstPercent,

        // base numbers for calculations
        taxableUnit,
        gstUnit,

        returnQty: 0,
        lineSubTotal: 0,
        gstValue: 0,
        lineTotal: 0,
      };
    });

    setNewItems(mapped);
    recalcNewTotals(mapped);
  };

  // ---------------- CREATE MODE: CHANGE QTY ----------------
  const handleNewQtyChange = (index, qty) => {
    qty = parseFloat(qty) || 0;

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
  const saveSalesReturn = () => {
    if (!invoiceInfo) {
      setNewError("Select an invoice first.");
      return;
    }
    const any = newItems.some((i) => i.returnQty > 0);
    if (!any) {
      setNewError("Enter quantity for at least one item.");
      return;
    }
    setNewError("");

    const dto = {
      Id: 0,
      ReturnDate: newReturnDate,
      InvoiceId: invoiceInfo.id,
      InvoiceNo: invoiceInfo.invoiceNo,
      CustomerId: invoiceInfo.customerId,
      SubTotal: newTotals.sub,
      TotalTax: newTotals.tax,
      TotalAmount: newTotals.total,
      RoundOff: newTotals.roundOff,
      Notes: newNotes,
      CreatedBy: user?.email,
      CreatedAt: new Date().toISOString(),
      Items: newItems
        .filter((x) => x.returnQty > 0)
        .map((x) => ({
          InvoiceItemId: x.invoiceItemId,
          ItemId: x.itemId,
          BatchNo: x.batchNo,
          Qty: x.returnQty,
          Rate: x.rate,
          DiscountPercent: x.discountPercent,
          GstPercent: x.gstPercent,
          GstValue: x.gstValue,
          CgstPercent: x.gstPercent / 2,
          CgstValue: x.gstValue / 2,
          SgstPercent: x.gstPercent / 2,
          SgstValue: x.gstValue / 2,
          IgstPercent: 0,
          IgstValue: 0,
          LineSubTotal: x.lineSubTotal,
          LineTotal: x.lineTotal,
        })),
    };

    window.chrome.webview.postMessage({
      Action: "SaveSalesReturn",
      Payload: dto,
    });
  };

  // ---------------- VIEW MODE: LOAD SALES RETURN ----------------
  const handleSalesReturnLoadedForView = (data) => {
    setCurrentReturnId(data.Id);
    setViewReturnNo(data.ReturnNo);
    setViewReturnDate(data.ReturnDate?.slice(0, 10));
    setViewNotes(data.Notes);
    setViewInvoiceInfo({
      invoiceNo: data.InvoiceNo,
      customerName: data.CustomerName,
    });

    const rows = (data.Items || []).map((x) => ({
      itemName: x.ItemName,
      batchNo: x.BatchNo,
      returnQty: x.Qty,
      rate: x.Rate,
      gstPercent: x.GstPercent,
      lineSubTotal: x.LineSubTotal,
      gstValue: x.GstValue,
      lineTotal: x.LineTotal,
    }));

    setViewItems(rows);
    recalcViewTotals(rows);
  };

  // ---------------- SEARCH ACTIONS ----------------
  const searchInvoicesForReturn = () => {
    if (!invoiceDate) {
      setNewError("Select invoice date.");
      return;
    }
    window.chrome.webview.postMessage({
      Action: "SearchInvoicesForReturn",
      Payload: { Date: invoiceDate },
    });
  };

  const searchSalesReturns = () => {
    if (!srDate) {
      setViewError("Select return date.");
      return;
    }
    window.chrome.webview.postMessage({
      Action: "SearchSalesReturns",
      Payload: { Date: srDate },
    });
  };

  const clickInvoiceRow = (inv) =>
    window.chrome.webview.postMessage({
      Action: "LoadInvoiceForReturn",
      Payload: { InvoiceId: inv.Id },
    });

  const clickSalesReturnRow = (sr) =>
    window.chrome.webview.postMessage({
      Action: "LoadSalesReturnDetail",
      Payload: { ReturnId: sr.Id },
    });

  const printSalesReturn = () =>
    currentReturnId &&
    window.chrome.webview.postMessage({
      Action: "PrintSalesReturn",
      Payload: { ReturnId: currentReturnId },
    });

  // ==========================================================
  // ======================== UI ==============================
  // ==========================================================

  return (
    <div className="sales-return">
      <h2>Sales Return</h2>

      <div className="sr-tabs">
        <button
          className={activeTab === "CREATE" ? "active" : ""}
          onClick={() => setActiveTab("CREATE")}
        >
          Create Sales Return
        </button>
        <button
          className={activeTab === "VIEW" ? "active" : ""}
          onClick={() => setActiveTab("VIEW")}
        >
          View / Print Sales Return
        </button>
      </div>

      {/* CREATE TAB */}
      {activeTab === "CREATE" && (
        <>
          {/* SEARCH BLOCK */}
          <div className="sr-search-block">
            <h3>Select Invoice (by Date)</h3>
            <div className="sr-filters">
              <label>
                Invoice Date:
                <input
                  type="date"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                />
              </label>
              <button onClick={searchInvoicesForReturn}>Search</button>
            </div>

            <div className="sr-list-container">
              <table className="sr-list-table">
                <thead>
                  <tr>
                    <th>Invoice No</th>
                    <th>Date</th>
                    <th>Customer</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {invoiceResults.length === 0 && (
                    <tr>
                      <td colSpan="4" style={{ textAlign: "center" }}>
                        No invoices found.
                      </td>
                    </tr>
                  )}
                  {invoiceResults.map((inv) => (
                    <tr key={inv.Id} onClick={() => clickInvoiceRow(inv)}>
                      <td>{inv.InvoiceNo}</td>
                      <td>{inv.InvoiceDate}</td>
                      <td>{inv.CustomerName}</td>
                      <td>{inv.TotalAmount?.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* HEADER */}
          <div className="sr-header-row">
            <div>
              {invoiceInfo && (
                <>
                  <div>
                    <strong>Invoice No:</strong> {invoiceInfo.invoiceNo}
                  </div>
                  <div>
                    <strong>Customer:</strong> {invoiceInfo.customerName}
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
                        onChange={(e) =>
                          handleNewQtyChange(i, e.target.value)
                        }
                      />
                    </td>
                    <td>{row.lineTotal.toFixed(2)}</td>
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

              <div className="sr-actions">
                <button onClick={saveSalesReturn}>
                  Save Sales Return
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
            <h3>Select Sales Return (by Date)</h3>
            <div className="sr-filters">
              <label>
                Return Date:
                <input
                  type="date"
                  value={srDate}
                  onChange={(e) => setSrDate(e.target.value)}
                />
              </label>
              <button onClick={searchSalesReturns}>Search</button>
            </div>

            <div className="sr-list-container">
              <table className="sr-list-table">
                <thead>
                  <tr>
                    <th>Return No</th>
                    <th>Date</th>
                    <th>Invoice No</th>
                    <th>Customer</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {srResults.length === 0 && (
                    <tr>
                      <td colSpan="5" style={{ textAlign: "center" }}>
                        No sales returns found.
                      </td>
                    </tr>
                  )}
                  {srResults.map((sr) => (
                    <tr key={sr.Id} onClick={() => clickSalesReturnRow(sr)}>
                      <td>{sr.ReturnNo}</td>
                      <td>{sr.ReturnDate}</td>
                      <td>{sr.InvoiceNo}</td>
                      <td>{sr.CustomerName}</td>
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
              {viewInvoiceInfo && (
                <>
                  <div>
                    <strong>Invoice No:</strong> {viewInvoiceInfo.invoiceNo}
                  </div>
                  <div>
                    <strong>Customer:</strong> {viewInvoiceInfo.customerName}
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
                <button onClick={printSalesReturn}>Print</button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
