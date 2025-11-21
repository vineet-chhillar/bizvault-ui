// ----------------------------------------------
// VALIDATOR: STRING
// ----------------------------------------------
export function validateString(value, fieldName) {
    if (!value || value.toString().trim() === "") {
        return {
            valid: false,
            message: `${fieldName} cannot be empty.`
        };
    }
    return { valid: true };
}

// ----------------------------------------------
// VALIDATOR: DROPDOWN (must select a value)
// ----------------------------------------------
export function validateDropdown(value, fieldName) {
    if (!value || value.toString().trim() === "") {
        return {
            valid: false,
            message: `Please select ${fieldName}.`
        };
    }
    return { valid: true };
}

// ----------------------------------------------
// VALIDATOR: NUMBER (decimal allowed)
// ----------------------------------------------
export function validateDecimal(value, fieldName) {
    // blank or null
    if (value === null || value === undefined || value === "") {
        return { valid: false, message: `${fieldName} cannot be empty.` };
    }

    const num = Number(value);

    if (isNaN(num)) {
        return { valid: false, message: `${fieldName} must be a valid number.` };
    }

    return { valid: true };
}

// ----------------------------------------------
// VALIDATOR: NUMBER (positive decimal)
// ----------------------------------------------
export function validatePositiveDecimal(value, fieldName) {
    const decimalCheck = validateDecimal(value, fieldName);
    if (!decimalCheck.valid) return decimalCheck;

    const num = Number(value);
    if (num <= 0) {
        return { valid: false, message: `${fieldName} must be greater than 0.` };
    }

    return { valid: true };
}

// ----------------------------------------------
// VALIDATOR: INTEGER ONLY
// ----------------------------------------------
export function validateInteger(value, fieldName) {
    if (!/^\d+$/.test(value)) {
        return { valid: false, message: `${fieldName} must be a whole number.` };
    }
    return { valid: true };
}

// ----------------------------------------------
// VALIDATOR: DATE (supports YYYY-MM-DD & MM/DD/YYYY)
// ----------------------------------------------
export function isValidInvoiceDate(dateString) {
    let d;

    // Case 1: YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        const [y, m, dd] = dateString.split("-").map(Number);
        d = new Date(y, m - 1, dd);
    }
    // Case 2: MM/DD/YYYY
    else if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) {
        const [m, dd, y] = dateString.split("/").map(Number);
        d = new Date(y, m - 1, dd);
    }
    else {
        return { valid: false, message: "Date must be YYYY-MM-DD or MM/DD/YYYY." };
    }

    if (isNaN(d.getTime())) {
        return { valid: false, message: "Invalid calendar date." };
    }

    const today = new Date();
    today.setHours(0,0,0,0);

    if (d > today) {
        return { valid: false, message: "Invoice date cannot be in the future." };
    }

    return { valid: true };
}
