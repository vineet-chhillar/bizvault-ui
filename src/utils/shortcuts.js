export const getShortcuts = (user, hasPermission, PERMISSIONS) => [
  {
    key: "d",
    path: "/Item/Dashboard",
    label: "Dashboard",
  },

  hasPermission(user, PERMISSIONS.VOUCHERS) && {
    key: "s",
    path: "/Item/InvoiceEditor",
    label: "Sales Invoice",
  },

  hasPermission(user, PERMISSIONS.VOUCHERS) && {
    key: "p",
    path: "/Item/PurchaseInvoiceEditor",
    label: "Purchase Invoice",
  },

  hasPermission(user, PERMISSIONS.VOUCHERS) && {
    key: "v",
    path: "/Item/VoucherEditor",
    label: "Voucher Editor",
  },

  hasPermission(user, PERMISSIONS.VOUCHERS) && {
    key: "a",
    path: "/Item/ChartOfAccounts",
    label: "Chart of Accounts",
  },

  hasPermission(user, PERMISSIONS.VOUCHERS) && {
    key: "e",
    path: "/Item/ExpenseVoucherEditor",
    label: "Expense Voucher",
  },

  hasPermission(user, PERMISSIONS.MASTERS) && {
    key: "i",
    shift: true,
    path: "/Item/CreateItem",
    label: "Create Item",
  },

  hasPermission(user, PERMISSIONS.REPORTS) && {
    key: "t",
    path: "/Reports/TrialBalance",
    label: "Trial Balance",
  },

  hasPermission(user, PERMISSIONS.REPORTS) && {
    key: "b",
    path: "/Reports/BalanceSheet",
    label: "Balance Sheet",
  },

  hasPermission(user, PERMISSIONS.VOUCHERS) && {
    key: "i",
    path: "/Item/IncomeVoucherEditor",
    label: "Income Voucher",
  },

  hasPermission(user, PERMISSIONS.MASTERS) && {
    key: "c",
    path: "/Item/CustomerPage",
    label: "Customer Master",
  },

  hasPermission(user, PERMISSIONS.MASTERS) && {
    key: "u",
    path: "/Item/SupplierPage",
    label: "Supplier Master",
  },
].filter(Boolean);