export const ORDER_CATEGORIES = {
  STUDENT_LAUNDRY: "STUDENT_LAUNDRY",
  LINEN: "LINEN",
  B2C_RETAIL: "B2C_RETAIL",
  AIRBNB: "AIRBNB",
  ISSUES: "ISSUES",
};

export const ORDER_TYPES = {
  STUDENT: "student",
  LINEN: "linen",
  REGULAR: "regular",
  AIRBNB: "airbnb",
  ISSUE: "issue",
};

export const ORDER_STATUSES = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  PROCESSING: "Processing",
  DELIVERED: "Delivered",
  RESOLVED: "Resolved",
};

export const ORDER_CHANNELS = {
  APP: "App",
  WEBSITE: "Website",
  WHATSAPP: "WhatsApp",
  OUTLET: "Outlet",
  CALL: "Call",
  STUDENT: "Student",
};

export function normalizeOrderStatus(status) {
  const normalized = String(status || "").trim().toLowerCase();

  if (["completed", "delivered"].includes(normalized)) return ORDER_STATUSES.DELIVERED;
  if (["processing", "active", "in progress"].includes(normalized)) return ORDER_STATUSES.PROCESSING;
  if (["paid", "shipped", "confirmed"].includes(normalized)) return ORDER_STATUSES.CONFIRMED;
  if (normalized === "resolved") return ORDER_STATUSES.RESOLVED;
  return status || ORDER_STATUSES.PENDING;
}

export function getOrderTypeLabel(type) {
  if (type === ORDER_TYPES.LINEN) return "Linen";
  if (type === ORDER_TYPES.STUDENT) return "Student";
  if (type === ORDER_TYPES.REGULAR) return "Retail";
  if (type === ORDER_TYPES.AIRBNB) return "Hotel";
  return "Other";
}
