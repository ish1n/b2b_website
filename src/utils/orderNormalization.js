import { ORDER_CATEGORIES, ORDER_CHANNELS, ORDER_STATUSES, ORDER_TYPES, normalizeOrderStatus } from "../constants/orders";
import { getCategoryForProperty } from "../data/hostelOrders";
import { getTodayString } from "./dateUtils";

// --- ADDED ALIASES HERE TO FIX CASE SENSITIVITY AND DUPLICATES ---
const CANONICAL_PROPERTY_NAMES = {
  aakansha: "Aakansha",
  akansha: "Aakansha",
  "aakansha hostel": "Aakansha",
  adarsha: "Adarsha",
  "adarsha hostel": "Adarsha",
  aardhana: "Aardhana",
  ardhana: "Aardhana",
  "aardhana hostel": "Aardhana",
  kirti: "Kirti",
  "kirti hostel": "Kirti",
  meera: "Meera",
  "meera hostel": "Meera",
  samridhi: "Samridhi",
  "samridhi hostel": "Samridhi",
  samshrushti: "Samshrushti",
  "samshrushti hostel": "Samshrushti",
  tara: "Tara",
  "tara hostel": "Tara",
  tulsi: "Tulsi",
  "tulsi hostel": "Tulsi",       // Maps "tulsi hostel" -> "Tulsi"
  "tulsi boys hostel": "Tulsi",  // Maps "tulsi boys hostel" -> "Tulsi"
  hostel99: "Hostel 99",
  "hostel 99": "Hostel 99",
  "hostel99 koregaon park": "Hostel99 koregaon park",
  "hostel99 yerwada 1": "Hostel99 Yerwada 1",
  "hostel99 yerwada 2": "Hostel99 Yerwada 2",
  "hostel 99 no-88": "Hostel 99 no-88",
  "hostel 99 no-3": "Hostel 99 no-3",
  "regular customers": "Regular Customers",
  issues: "Issues",
  "airbnb viman nagar": "Airbnb Viman Nagar",
  "airbnb viman nagar ": "Airbnb Viman Nagar",
  "airbnb viman nagar, pune": "Airbnb Viman Nagar",
};

// getTodayString imported from ./dateUtils

function normalizeDate(raw) {
  if (!raw) return getTodayString();
  if (typeof raw === "string") return raw;
  if (raw?.toDate) return raw.toDate().toISOString().split("T")[0];
  return getTodayString();
}

function normalizeNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function normalizePropertyName(value) {
  const trimmed = String(value || "").trim();
  if (!trimmed) return "Unknown Property";

  // This converts whatever the user typed to lowercase (e.g. "Tulsi Hostel" -> "tulsi hostel")
  const collapsed = trimmed.replace(/\s+/g, " ").toLowerCase();
  const alphanumeric = collapsed.replace(/[^a-z0-9 ]/g, "").trim();

  // If "tulsi hostel" is found in our dictionary above, it returns exactly "Tulsi"
  return CANONICAL_PROPERTY_NAMES[collapsed]
    || CANONICAL_PROPERTY_NAMES[alphanumeric]
    || trimmed.split(" ").map((part) => part ? part.charAt(0).toUpperCase() + part.slice(1).toLowerCase() : part).join(" ");
}

function normalizeDetails(rawOrder) {
  if (rawOrder.details && typeof rawOrder.details === "object" && !Array.isArray(rawOrder.details)) {
    return rawOrder.details;
  }

  if (rawOrder.partnerItems && typeof rawOrder.partnerItems === "object") {
    return rawOrder.partnerItems;
  }

  return {};
}

function inferCategoryFromProperty(property) {
  const normalizedProperty = String(property || "").trim().toLowerCase();

  if (!normalizedProperty) return ORDER_CATEGORIES.STUDENT_LAUNDRY;
  if (normalizedProperty === "regular customers") return ORDER_CATEGORIES.B2C_RETAIL;
  if (normalizedProperty === "issues") return ORDER_CATEGORIES.ISSUES;
  if (normalizedProperty.includes("airbnb") || normalizedProperty.includes("hotel")) return ORDER_CATEGORIES.AIRBNB;

  return getCategoryForProperty(property)?.key || ORDER_CATEGORIES.STUDENT_LAUNDRY;
}

function getTypeForCategory(category) {
  if (category === ORDER_CATEGORIES.LINEN) return ORDER_TYPES.LINEN;
  if (category === ORDER_CATEGORIES.B2C_RETAIL) return ORDER_TYPES.REGULAR;
  if (category === ORDER_CATEGORIES.AIRBNB) return ORDER_TYPES.AIRBNB;
  if (category === ORDER_CATEGORIES.ISSUES) return ORDER_TYPES.ISSUE;
  return ORDER_TYPES.STUDENT;
}

const CART_SERVICE_ALIASES = {
  "Wash & Fold_regular": "Wash & Fold",
  "Loafers/Sneakers_regular": "Loafers/Sneakers",
};

function normalizeCartServiceName(rawName) {
  if (!rawName) return "Regular Service";
  const alias = CART_SERVICE_ALIASES[rawName];
  if (alias) return alias;
  return rawName.replace(/_regular$/i, "").trim();
}

function mapCartSelectionSource(source) {
  if (!source) return ORDER_CHANNELS.APP;
  const normalized = String(source).toLowerCase();
  if (normalized.includes("map") || normalized.includes("tap") || normalized.includes("app")) return ORDER_CHANNELS.APP;
  if (normalized.includes("gps") || normalized.includes("auto")) return ORDER_CHANNELS.AUTO;
  if (normalized.includes("website")) return ORDER_CHANNELS.WEBSITE;
  if (normalized.includes("whatsapp")) return ORDER_CHANNELS.WHATSAPP;
  if (normalized.includes("call")) return ORDER_CHANNELS.CALL;
  if (normalized.includes("outlet")) return ORDER_CHANNELS.OUTLET;
  if (normalized.includes("student")) return ORDER_CHANNELS.STUDENT;
  return ORDER_CHANNELS.APP;
}

function buildCartServiceBreakdown(rawOrder) {
  const services = rawOrder.services || {};
  const perKgDetails = rawOrder.perKgDetails || rawOrder.perKg || {};
  const breakdownMap = new Map();

  Object.entries(services).forEach(([key, value]) => {
    const name = normalizeCartServiceName(key);
    const detail = perKgDetails[key] || perKgDetails[name] || {};
    breakdownMap.set(key, {
      id: key,
      name,
      quantity: normalizeNumber(value),
      weight: normalizeNumber(detail.weight),
      amount: normalizeNumber(detail.subtotal ?? detail.amount ?? 0),
    });
  });

  Object.entries(perKgDetails).forEach(([key, detail]) => {
    if (breakdownMap.has(key)) return;
    const name = normalizeCartServiceName(key);
    breakdownMap.set(key, {
      id: key,
      name,
      quantity: normalizeNumber(detail.count ?? detail.items),
      weight: normalizeNumber(detail.weight),
      amount: normalizeNumber(detail.subtotal ?? detail.amount ?? 0),
    });
  });

  return [...breakdownMap.values()].filter((item) => item.name && (item.quantity || item.weight || item.amount));
}

export function normalizeOrder(rawOrder = {}, source = "unknown") {
  const property = normalizePropertyName(
    rawOrder.property ||
    rawOrder.partnerName ||
    rawOrder.location ||
    rawOrder.userName ||
    rawOrder.customerName ||
    "Unknown Property"
  );
  const inferredCategory = inferCategoryFromProperty(property);
  const inferredType = getTypeForCategory(inferredCategory);

  const itemsFromPartnerMap = rawOrder.partnerItems
    ? Object.values(rawOrder.partnerItems).reduce((sum, value) => sum + normalizeNumber(value), 0)
    : 0;

  const normalized = {
    id: String(rawOrder.id || rawOrder.orderId || `${source}-${Date.now()}`),
    ...rawOrder,
    property,
    date: normalizeDate(rawOrder.date || rawOrder.createdAt),
    amount: normalizeNumber(rawOrder.amount ?? rawOrder.totalPrice),
    items: normalizeNumber(rawOrder.items, itemsFromPartnerMap),
    weight: normalizeNumber(rawOrder.weight),
    studentCount: normalizeNumber(rawOrder.studentCount),
    category: rawOrder.category || inferredCategory,
    type: rawOrder.type || inferredType,
    status: normalizeOrderStatus(rawOrder.status || rawOrder.orderStatus),
    details: normalizeDetails(rawOrder),
    customerName: rawOrder.customerName || rawOrder.userName || "",
    customerNumber: rawOrder.customerNumber || rawOrder.userPhone || rawOrder.phoneNumber || rawOrder.customerPhone || "",
    channel: rawOrder.channel || (source === "website" ? ORDER_CHANNELS.WEBSITE : rawOrder.channel),
    service: rawOrder.service || "Order",
    source,
  };

  if (source === "website") {
    normalized.channel = ORDER_CHANNELS.WEBSITE;
    normalized.customerName = rawOrder.userName || rawOrder.customerName || "Website Customer";
    normalized.customerNumber = rawOrder.userPhone || rawOrder.phoneNumber || rawOrder.customerPhone || "no contact";
    normalized.service = rawOrder.service || (Array.isArray(rawOrder.items) ? rawOrder.items.map((item) => item.name || item.title).filter(Boolean).join(", ") : "") || "Web Store Order";
    normalized.items = normalizeNumber(rawOrder.totalItems, Array.isArray(rawOrder.items) ? rawOrder.items.length : normalized.items);
  }

  if (source === "cartdetails") {
    const breakdown = buildCartServiceBreakdown(rawOrder);
    const summaryParts = breakdown.map((item) => {
      const metrics = [
        item.quantity > 0 ? `${item.quantity} pcs` : "",
        item.weight > 0 ? `${item.weight} kg` : "",
      ].filter(Boolean).join(" • ");
      return `${item.name}${metrics ? ` (${metrics})` : ""}`;
    }).filter(Boolean);

    const cartCreatedDate = rawOrder.createdAt || (rawOrder.orderTimestamp ? new Date(Number(rawOrder.orderTimestamp)).toISOString().split("T")[0] : undefined);

    normalized.category = ORDER_CATEGORIES.B2C_RETAIL;
    normalized.type = ORDER_TYPES.REGULAR;
    normalized.property = "Regular Customers";
    normalized.channel = mapCartSelectionSource(rawOrder.selectionSource);
    normalized.serviceBreakdown = breakdown;
  normalized.serviceBreakdownSummary = summaryParts.join(", ");
  const firstService = breakdown[0]?.name || "Regular Service";
  normalized.service = breakdown.length <= 1 ? firstService : `${firstService} + ${breakdown.length - 1} more`;
  normalized.amount = normalizeNumber(rawOrder.totalCost ?? rawOrder.totalWithFee ?? rawOrder.originalTotalCost ?? rawOrder.originalAmount);
  const itemsFromBreakdown = breakdown.reduce((sum, item) => sum + (item.quantity || 0), 0);
    normalized.items = normalizeNumber(rawOrder.totalItems ?? rawOrder.clothesCount ?? itemsFromBreakdown);
    normalized.weight = normalizeNumber(rawOrder.clothesWeightKg ?? normalized.weight);
    normalized.status = normalizeOrderStatus(rawOrder.status || rawOrder.orderStatus || rawOrder.paymentStatus);
    if (cartCreatedDate) {
      normalized.date = normalizeDate(cartCreatedDate);
    }
  normalized.customerName = (rawOrder.userName || rawOrder.customerName || "Regular Customer").trim();
  normalized.customerNumber = rawOrder.userMobile || rawOrder.customerPhone || rawOrder.userPhone || "";
  normalized.details = normalized.details || rawOrder.breakdown || {};
  const addressCandidate = rawOrder.userEnteredAddress || rawOrder.location?.address || rawOrder.address || rawOrder.userAddress || "";
  normalized.address = addressCandidate ? addressCandidate.trim() : "";
  }

  if (source === "b2b") {
    normalized.category = rawOrder.category || inferredCategory;
    normalized.type = rawOrder.type || inferredType;
  }

  if (normalized.category === ORDER_CATEGORIES.ISSUES) {
    normalized.type = ORDER_TYPES.ISSUE;
  }

  return normalized;
}
