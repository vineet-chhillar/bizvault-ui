import {
  validateString,
  validateDropdown,
  isValidInvoiceDate
} from "./validators";

export function validateItemForm(data) {
  const errors = [];

  // Normalize: accept both uppercase/lowercase versions
  const Name = data.Name || data.name;
  const ItemCode = data.ItemCode || data.itemcode;
  const HsnCode = data.HsnCode || data.hsncode;
  const CategoryId = data.CategoryId || data.categoryid;
  const DateValue = data.Date || data.date;
  const Description = data.Description || data.description;
  const UnitId = data.UnitId || data.unitid;
  const GstId = data.GstId || data.gstid;

  // 1. Name
  let r = validateString(Name, "Item Name");
  if (!r.valid) errors.push({ field: "name", message: r.message });

  // 2. Item Code
  r = validateString(ItemCode, "Item Code");
  if (!r.valid) errors.push({ field: "itemcode", message: r.message });


  // 2. Hsn Code
  r = validateString(HsnCode, "HSN/SAC Code");
  if (!r.valid) errors.push({ field: "hsncode", message: r.message });

  // 3. Category
  r = validateDropdown(CategoryId, "Category");
  if (!r.valid) errors.push({ field: "categoryid", message: r.message });

  // 4. Date
  r = isValidInvoiceDate(DateValue);
  if (!r.valid) errors.push({ field: "date", message: r.message });

  // 5. Description (optional limit)
  if (Description && Description.length > 300) {
    errors.push({ field: "description", message: "Description cannot exceed 300 characters." });
  }

  // 6. Unit
  r = validateDropdown(UnitId, "Unit");
  if (!r.valid) errors.push({ field: "unitid", message: r.message });

  // 7. GST
  r = validateDropdown(GstId, "GST");
  if (!r.valid) errors.push({ field: "gstid", message: r.message });

  return errors;
}
