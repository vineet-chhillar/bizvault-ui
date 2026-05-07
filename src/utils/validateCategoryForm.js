export function validateCategoryForm(form) {
  const errors = {};

  if (!form.categoryName || form.categoryName.trim() === "") {
    errors.CategoryName = "Category name is required.";
  }

  if (!form.defaultHsnId) {
    errors.DefaultHsnId = "HSN is required.";
  }

  if (!form.defaultGstId) {
    errors.DefaultGstId = "GST is required.";
  }

  return errors;
}
