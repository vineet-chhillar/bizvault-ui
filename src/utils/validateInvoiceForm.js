import {
  validateString,
  validatePositiveDecimal,
  validateDropdown,
  validateDecimal,
  isValidInvoiceDate
} from "./validators";

export default function validateInvoiceForm(lines, customer, invoiceDate, totals) {
  const errors = [];
  const pushErr = (field, message) => errors.push({ field, message });

  // -----------------------------
  // 1. Invoice Date
  // -----------------------------
  const dateCheck = isValidInvoiceDate(invoiceDate);
  if (!dateCheck.valid) pushErr("invoiceDate", dateCheck.message);

  

  // -----------------------------
  // 3. At least one line item
  // -----------------------------
  if (!lines || lines.length === 0) {
    pushErr("lineItems", "Please add at least one item.");
    return errors;
  }

  // -----------------------------
  // 4. Total Amount > 0
  // -----------------------------
  if (!totals || Number(totals.total) <= 0) {
    pushErr("invoiceTotal", "Invoice total cannot be 0.");
  }

  // -----------------------------
  // 5. Per-Line Validations
  // -----------------------------
  lines.forEach((l, index) => {
    const line = index + 1;

    // Item Name
    if (!l.ItemName || l.ItemName.trim() === "") {
      pushErr(`ItemName_${index}`, `Line ${line}: Item must be selected.`);
    }

    // ItemId
    if (!l.ItemId || Number(l.ItemId) <= 0) {
      pushErr(`ItemId_${index}`, `Line ${line}: Invalid Item selection.`);
    }

    // Batch
    if (!l.BatchNo || l.BatchNo.trim() === "") {
      pushErr(`BatchNo_${index}`, `Line ${line}: Batch cannot be empty.`);
    }

    // HSN
    if (!l.HsnCode || l.HsnCode.trim() === "") {
      pushErr(`HsnCode_${index}`, `Line ${line}: HSN code required.`);
    }

    // Qty
    const qtyCheck = validatePositiveDecimal(l.Qty, `Line ${line}: Quantity`);
    if (!qtyCheck.valid) pushErr(`Qty_${index}`, qtyCheck.message);

    // Stock (if available)
    if (l.AvailableStock != null && Number(l.Qty) > Number(l.AvailableStock)) {
      pushErr(
        `AvailableStock_${index}`,
        `Line ${line}: Qty cannot exceed available stock (${l.AvailableStock}).`
      );
    }

    // Batch-wise stock
    if (
      l.BalanceBatchWise != null &&
      Number(l.Qty) > Number(l.BalanceBatchWise)
    ) {
      pushErr(
        `BatchStock_${index}`,
        `Line ${line}: Qty cannot exceed batch stock (${l.BalanceBatchWise}).`
      );
    }

    // Rate
    const rateCheck = validatePositiveDecimal(l.Rate, `Line ${line}: Rate`);
    if (!rateCheck.valid) pushErr(`Rate_${index}`, rateCheck.message);

    // Discount 0-100%
    if (l.Discount != null) {
      const d = Number(l.Discount);
      if (isNaN(d) || d < 0 || d > 100) {
        pushErr(
          `Discount_${index}`,
          `Line ${line}: Discount must be between 0 and 100%.`
        );
      }
    }

    // GST percentage
    const gst = Number(l.GstPercent);
    if (isNaN(gst) || gst < 0 || gst > 28) {
      pushErr(
        `GstPercent_${index}`,
        `Line ${line}: GST % must be between 0 and 28.`
      );
    }
  });

  return errors;
}
