import {
  validateString,
  validatePositiveDecimal,
  validateDecimal,
  validateDropdown,
  isValidInvoiceDate
} from "./validators";

export default function validateInventoryEditForm(formData) {
  const errors = [];
  const pushErr = (field, message) => errors.push({ field, message });

  // ------------------------------
  // 1. HSN Code
  // ------------------------------
  let r = validateString(formData.hsnCode, "HSN/SAC Code");
  if (!r.valid) pushErr("hsnCode", r.message);

  // ------------------------------
  // 2. Batch No
  // ------------------------------
  r = validateString(formData.batchNo, "Batch Number");
  if (!r.valid) pushErr("batchNo", r.message);

  // ------------------------------
  // 3. Ref/Invoice No
  // ------------------------------
  r = validateString(formData.refno, "Reference/Invoice Number");
  if (!r.valid) pushErr("refno", r.message);

  // ------------------------------
  // 4. Date
  // ------------------------------
  r = isValidInvoiceDate(formData.date);
  if (!r.valid) pushErr("date", r.message);

  // ------------------------------
  // 5. Quantity
  // ------------------------------
  r = validatePositiveDecimal(formData.quantity, "Quantity");
  if (!r.valid) pushErr("quantity", r.message);

  // ------------------------------
  // 6. Purchase Price
  // ------------------------------
  r = validatePositiveDecimal(formData.purchasePrice, "Purchase Price");
  if (!r.valid) pushErr("purchasePrice", r.message);

  // ------------------------------
  // 7. Discount (0–100)
  // ------------------------------
  if (formData.discountPercent !== "" && formData.discountPercent !== null) {
    const val = Number(formData.discountPercent);
    if (isNaN(val) || val < 0 || val > 100) {
      pushErr("discountPercent", "Discount percent must be between 0 and 100.");
    }
  }

  // ------------------------------
  // 8. Net Purchase Price
  // ------------------------------
  if (formData.netpurchasePrice) {
    r = validateDecimal(formData.netpurchasePrice, "Net Purchase Price");
    if (!r.valid) pushErr("netpurchasePrice", r.message);
  }

  // ------------------------------
  // 9. Amount
  // ------------------------------
  if (formData.amount) {
    r = validateDecimal(formData.amount, "Amount");
    if (!r.valid) pushErr("amount", r.message);
  }

  // ------------------------------
  // 10. Sales Price
  // ------------------------------
  if (formData.salesPrice) {
    r = validatePositiveDecimal(formData.salesPrice, "Sales Price");
    if (!r.valid) pushErr("salesPrice", r.message);
  }

  // ------------------------------
  // 11. MRP
  // ------------------------------
  if (formData.mrp) {
    r = validatePositiveDecimal(formData.mrp, "MRP");
    if (!r.valid) pushErr("mrp", r.message);
  }

  // ------------------------------
  // 12. Goods/Services
  // ------------------------------
  r = validateDropdown(formData.goodsOrServices, "Goods/Services");
  if (!r.valid) pushErr("goodsOrServices", r.message);

  // ------------------------------
  // 13. Description
  // ------------------------------
  if (formData.description && formData.description.length > 300) {
    pushErr("description", "Description cannot exceed 300 characters.");
  }

  // ------------------------------
  // 14. Optional Dates: Mfg, Exp
  // ------------------------------
  if (formData.mfgdate) {
    r = isValidInvoiceDate(formData.mfgdate);
    if (!r.valid) pushErr("mfgdate", r.message);
  }

  if (formData.expdate) {
    r = isValidInvoiceDate(formData.expdate);
    if (!r.valid) pushErr("expdate", r.message);
  }

  // Optional text fields
  const optionalTextFields = ["modelno", "brand", "size", "color", "weight", "dimension"];
  optionalTextFields.forEach(field => {
    if (formData[field]) {
      const rr = validateString(formData[field], field);
      if (!rr.valid) pushErr(field, rr.message);
    }
  });

  return errors;
}
