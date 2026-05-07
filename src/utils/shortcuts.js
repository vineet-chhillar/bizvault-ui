export const getShortcuts = (user, hasPermission, PERMISSIONS) => [
  { key: "d", path: "/Item/Dashboard" },

  hasPermission(user, PERMISSIONS.VOUCHERS) && {
    key: "s",
    path: "/Item/InvoiceEditor",
  },

  hasPermission(user, PERMISSIONS.VOUCHERS) && {
    key: "p",
    path: "/Item/PurchaseInvoiceEditor",
  },

  hasPermission(user, PERMISSIONS.VOUCHERS) && {
    key: "v",
    path: "/Item/VoucherEditor",
  },

  hasPermission(user, PERMISSIONS.VOUCHERS) && {
    key: "a",
    path: "/Item/ChartOfAccounts",
  },

  hasPermission(user, PERMISSIONS.VOUCHERS) && {
    key: "e",
    path: "/Item/ExpenseVoucherEditor",
  },

  hasPermission(user, PERMISSIONS.MASTERS) && {
    key: "i",
    path: "/Item/CreateItem",
  },

  hasPermission(user, PERMISSIONS.REPORTS) && {
    key: "t",
    path: "/Reports/TrialBalance",
  },

  hasPermission(user, PERMISSIONS.REPORTS) && {
    key: "b",
    path: "/Reports/BalanceSheet",
  },
hasPermission(user, PERMISSIONS.VOUCHERS) && {
  key: "i",
  shift: true,   // 👈 important
  path: "/Item/IncomeVoucherEditor",
},
hasPermission(user, PERMISSIONS.MASTERS) && {
    key: "c",
    path: "/Item/CustomerPage",
  },
  hasPermission(user, PERMISSIONS.MASTERS) && {
    key: "u",
    path: "/Item/SupplierPage",
  },
].filter(Boolean);