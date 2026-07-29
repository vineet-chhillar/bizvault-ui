export function validateCategoryForm(form) {
  const errors = {};

  if (!form.categoryName || form.categoryName.trim() === "") {
    errors.CategoryName = "Category name is required.";
  }

 

  return errors;
}
