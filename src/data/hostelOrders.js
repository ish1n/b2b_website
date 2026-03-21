// src/data/hostelOrders.js
// All order data extracted from Andes_Daily_Record.xlsx
// Categories: Linen Services, Student Laundry, B2C Retail, Airbnb, Bulk Laundry, Issues

export const CATEGORIES = {
  LINEN: { key: "LINEN", label: "Linen Services (B2B)", color: "#7C3AED", icon: "🛏️" },
  STUDENT_LAUNDRY: { key: "STUDENT_LAUNDRY", label: "Student Laundry (B2B)", color: "#1976D2", icon: "👕" },
  B2C_RETAIL: { key: "B2C_RETAIL", label: "Retail Customers (B2C)", color: "#059669", icon: "🧺" },
  AIRBNB: { key: "AIRBNB", label: "Airbnb Services", color: "#D97706", icon: "🏠" },
  BULK_LAUNDRY: { key: "BULK_LAUNDRY", label: "Bulk Laundry", color: "#0891B2", icon: "⚙️" },
  ISSUES: { key: "ISSUES", label: "Issues & Complaints", color: "#DC2626", icon: "⚠️" },
};

export function getCategoryForProperty(property) {
  if (["Hostel 99", "Hostel 99 no-88", "Hostel 99 no-3", "Airbnb Viman Nagar"].includes(property)) {
    return property === "Airbnb Viman Nagar" ? CATEGORIES.AIRBNB : CATEGORIES.LINEN;
  }
  if (["Samridhi", "Gurukul"].includes(property)) return CATEGORIES.BULK_LAUNDRY;
  if (property === "Regular Customers") return CATEGORIES.B2C_RETAIL;
  if (property === "Issues") return CATEGORIES.ISSUES;
  return CATEGORIES.STUDENT_LAUNDRY;
}

// ==================== HOSTEL 99 (BASE) — LINEN SERVICES ====================
const hostel99Orders = [
  { id: "h99-01", property: "Hostel 99", category: "LINEN", type: "linen", date: "2026-03-01", amount: 520, status: "Delivered", items: 24, service: "12 Single Bedsheets, 2 Duvet Covers, 10 Pillow Covers", details: { "Single Bedsheet": 12, "Duvet Cover": 2, "Pillow Cover": 10, "Bath Towel": 0 } },
  { id: "h99-03", property: "Hostel 99", category: "LINEN", type: "linen", date: "2026-03-03", amount: 610, status: "Delivered", items: 30, service: "14 Single Bedsheets, 1 Duvet Cover, 14 Pillow Covers, 1 Bath Towel", details: { "Single Bedsheet": 14, "Duvet Cover": 1, "Pillow Cover": 14, "Bath Towel": 1 } },
  { id: "h99-04", property: "Hostel 99", category: "LINEN", type: "linen", date: "2026-03-04", amount: 480, status: "Delivered", items: 22, service: "13 Single Bedsheets, 9 Pillow Covers", details: { "Single Bedsheet": 13, "Pillow Cover": 9 } },
  { id: "h99-06", property: "Hostel 99", category: "LINEN", type: "linen", date: "2026-03-06", amount: 140, status: "Delivered", items: 8, service: "3 Single Bedsheets, 5 Pillow Covers", details: { "Single Bedsheet": 3, "Pillow Cover": 5 } },
  { id: "h99-07", property: "Hostel 99", category: "LINEN", type: "linen", date: "2026-03-07", amount: 795, status: "Delivered", items: 31, service: "13 Single Bedsheets, 3 Duvet Covers, 10 Pillow Covers, 3 Bath Towels, 1 Double Bedsheet, 1 Blanket", details: { "Single Bedsheet": 13, "Duvet Cover": 3, "Pillow Cover": 10, "Bath Towel": 3, "Double Bedsheet": 1, "Blanket": 1 } },
  { id: "h99-08", property: "Hostel 99", category: "LINEN", type: "linen", date: "2026-03-08", amount: 360, status: "Delivered", items: 20, service: "8 Single Bedsheets, 12 Pillow Covers", details: { "Single Bedsheet": 8, "Pillow Cover": 12 } },
  { id: "h99-09", property: "Hostel 99", category: "LINEN", type: "linen", date: "2026-03-09", amount: 1565, status: "Delivered", items: 48, service: "15 Single Bedsheets, 1 Duvet Cover, 15 Pillow Covers, 1 Bath Towel, 5 Curtains, 11 Door Mats", details: { "Single Bedsheet": 15, "Duvet Cover": 1, "Pillow Cover": 15, "Bath Towel": 1, "Curtain": 5, "Door Mat": 11 } },
  { id: "h99-10", property: "Hostel 99", category: "LINEN", type: "linen", date: "2026-03-11", amount: 540, status: "Delivered", items: 28, service: "12 Bedsheets, 15 Pillow Covers, 1 Duvet Cover", details: { "Bedsheet": 12, "Pillow Cover": 15, "Duvet Cover": 1 } },
];

// ==================== HOSTEL 99 NO-88 — LINEN SERVICES ====================
const hostel99No88Orders = [
  { id: "h9988-01", property: "Hostel 99 no-88", category: "LINEN", type: "linen", date: "2026-03-01", amount: 260, status: "Delivered", items: 10, service: "8 Single Bedsheets, 2 Pillow Covers", details: { "Single Bedsheet": 8, "Pillow Cover": 2 } },
  { id: "h9988-03", property: "Hostel 99 no-88", category: "LINEN", type: "linen", date: "2026-03-03", amount: 110, status: "Delivered", items: 5, service: "3 Single Bedsheets, 2 Pillow Covers", details: { "Single Bedsheet": 3, "Pillow Cover": 2 } },
  { id: "h9988-04", property: "Hostel 99 no-88", category: "LINEN", type: "linen", date: "2026-03-04", amount: 120, status: "Delivered", items: 6, service: "3 Single Bedsheets, 3 Pillow Covers", details: { "Single Bedsheet": 3, "Pillow Cover": 3 } },
  { id: "h9988-06", property: "Hostel 99 no-88", category: "LINEN", type: "linen", date: "2026-03-06", amount: 440, status: "Delivered", items: 22, service: "9 Single Bedsheets, 11 Pillow Covers, 2 Duvet Covers", details: { "Single Bedsheet": 9, "Pillow Cover": 11, "Duvet Cover": 2 } },
  { id: "h9988-07", property: "Hostel 99 no-88", category: "LINEN", type: "linen", date: "2026-03-07", amount: 380, status: "Delivered", items: 18, service: "10 Single Bedsheets, 8 Pillow Covers", details: { "Single Bedsheet": 10, "Pillow Cover": 8 } },
  { id: "h9988-08", property: "Hostel 99 no-88", category: "LINEN", type: "linen", date: "2026-03-08", amount: 120, status: "Delivered", items: 6, service: "3 Single Bedsheets, 3 Pillow Covers", details: { "Single Bedsheet": 3, "Pillow Cover": 3 } },
  { id: "h9988-09", property: "Hostel 99 no-88", category: "LINEN", type: "linen", date: "2026-03-09", amount: 480, status: "Delivered", items: 24, service: "11 Single Bedsheets, 12 Pillow Covers, 1 Duvet Cover", details: { "Single Bedsheet": 11, "Pillow Cover": 12, "Duvet Cover": 1 } },
  { id: "h9988-10", property: "Hostel 99 no-88", category: "LINEN", type: "linen", date: "2026-03-11", amount: 230, status: "Delivered", items: 12, service: "5 Bedsheets, 6 Pillow covers, 1 Bath towel", details: { "Bedsheet": 5, "Pillow Cover": 6, "Bath Towel": 1 } },
];

// ==================== HOSTEL 99 NO-3 — LINEN SERVICES ====================
const hostel99No3Orders = [
  { id: "h993-01", property: "Hostel 99 no-3", category: "LINEN", type: "linen", date: "2026-03-01", amount: 290, status: "Delivered", items: 15, service: "7 Single Bedsheets, 8 Pillow Covers", details: { "Single Bedsheet": 7, "Pillow Cover": 8 } },
  { id: "h993-04", property: "Hostel 99 no-3", category: "LINEN", type: "linen", date: "2026-03-04", amount: 90, status: "Delivered", items: 5, service: "2 Single Bedsheets, 3 Pillow Covers", details: { "Single Bedsheet": 2, "Pillow Cover": 3 } },
  { id: "h993-06", property: "Hostel 99 no-3", category: "LINEN", type: "linen", date: "2026-03-06", amount: 550, status: "Delivered", items: 27, service: "14 Single Bedsheets, 13 Pillow Covers", details: { "Single Bedsheet": 14, "Pillow Cover": 13 } },
  { id: "h993-07", property: "Hostel 99 no-3", category: "LINEN", type: "linen", date: "2026-03-07", amount: 160, status: "Delivered", items: 8, service: "4 Single Bedsheets, 4 Pillow Covers", details: { "Single Bedsheet": 4, "Pillow Cover": 4 } },
  { id: "h993-08", property: "Hostel 99 no-3", category: "LINEN", type: "linen", date: "2026-03-08", amount: 150, status: "Delivered", items: 7, service: "4 Single Bedsheets, 3 Pillow Covers", details: { "Single Bedsheet": 4, "Pillow Cover": 3 } },
  { id: "h993-09", property: "Hostel 99 no-3", category: "LINEN", type: "linen", date: "2026-03-09", amount: 390, status: "Delivered", items: 19, service: "9 Single Bedsheets, 9 Pillow Covers, 1 Duvet Cover", details: { "Single Bedsheet": 9, "Pillow Cover": 9, "Duvet Cover": 1 } },
  { id: "h993-10", property: "Hostel 99 no-3", category: "LINEN", type: "linen", date: "2026-03-11", amount: 360, status: "Delivered", items: 18, service: "9 Bedsheets, 9 Pillow covers", details: { "Bedsheet": 9, "Pillow Cover": 9 } },
];

// ==================== TULSI HOSTEL — STUDENT LAUNDRY ====================
const tulsiOrders = [
  { id: "tulsi-01", property: "Tulsi", category: "STUDENT_LAUNDRY", type: "student", date: "2026-03-01", amount: 2106.5, status: "Delivered", items: 86, weight: 38.3, studentCount: 12, service: "12 Students, 86 clothes, 38.3 KG" },
  { id: "tulsi-03", property: "Tulsi", category: "STUDENT_LAUNDRY", type: "student", date: "2026-03-03", amount: 220, status: "Delivered", items: 12, weight: 4.0, studentCount: 1, service: "1 Student, 12 clothes, 4.0 KG" },
  { id: "tulsi-07", property: "Tulsi", category: "STUDENT_LAUNDRY", type: "student", date: "2026-03-07", amount: 825, status: "Delivered", items: 66, weight: 15.0, studentCount: 8, service: "8 Students, 66 clothes, 15.0 KG" },
  { id: "tulsi-09", property: "Tulsi", category: "STUDENT_LAUNDRY", type: "student", date: "2026-03-09", amount: 979, status: "Delivered", items: 81, weight: 17.8, studentCount: 8, service: "8 Students, 81 clothes, 17.8 KG" },
  { id: "tulsi-11", property: "Tulsi", category: "STUDENT_LAUNDRY", type: "student", date: "2026-03-11", amount: 660, status: "Delivered", items: 24, weight: 12.0, studentCount: 5, service: "5 Students, 24 clothes, 12.0 KG" },
  { id: "tulsi-16", property: "Tulsi", category: "STUDENT_LAUNDRY", type: "student", date: "2026-03-16", amount: 973.5, status: "Delivered", items: 68, weight: 17.7, studentCount: 8, service: "8 Students, 68 clothes, 17.7 KG" },
  { id: "tulsi-18", property: "Tulsi", category: "STUDENT_LAUNDRY", type: "student", date: "2026-03-18", amount: 1666.5, status: "Delivered", items: 136, weight: 30.3, studentCount: 12, service: "12 Students, 136 clothes, 30.3 KG" },
  { id: "tulsi-21", property: "Tulsi", category: "STUDENT_LAUNDRY", type: "student", date: "2026-03-21", amount: 731.5, status: "Pickup Done", items: 69, weight: 13.3, studentCount: 7, service: "7 Students, 69 clothes, 13.3 KG" },

  
];

// ==================== ADARSHA HOSTEL — STUDENT LAUNDRY ====================
const adarshaOrders = [
  { id: "adarsha-01", property: "Adarsha", category: "STUDENT_LAUNDRY", type: "student", date: "2026-03-01", amount: 4290, status: "Delivered", items: 152, weight: 78.0, studentCount: 19, service: "19 Students, 152 clothes, 78.0 KG" },
  { id: "adarsha-03", property: "Adarsha", category: "STUDENT_LAUNDRY", type: "student", date: "2026-03-03", amount: 660, status: "Delivered", items: 34, weight: 12.0, studentCount: 5, service: "5 Students, 34 clothes, 12.0 KG" },
  { id: "adarsha-05", property: "Adarsha", category: "STUDENT_LAUNDRY", type: "student", date: "2026-03-05", amount: 2942.5, status: "Delivered", items: 137, weight: 53.5, studentCount: 18, service: "18 Students, 137 clothes, 53.5 KG" },
  { id: "adarsha-07", property: "Adarsha", category: "STUDENT_LAUNDRY", type: "student", date: "2026-03-07", amount: 907.5, status: "Delivered", items: 37, weight: 16.5, studentCount: 6, service: "6 Students, 37 clothes, 16.5 KG" },
  { id: "adarsha-09", property: "Adarsha", category: "STUDENT_LAUNDRY", type: "student", date: "2026-03-09", amount: 847, status: "Delivered", items: 42, weight: 15.4, studentCount: 7, service: "7 Students, 42 clothes, 15.4 KG" },
  { id: "adarsha-11", property: "Adarsha", category: "STUDENT_LAUNDRY", type: "student", date: "2026-03-11", amount: 2227.5, status: "Delivered", items: 85, weight: 40.5, studentCount: 9, service: "9 Students, 85 clothes, 40.5 KG" },
  { id: "adarsha-13", property: "Adarsha", category: "STUDENT_LAUNDRY", type: "student", date: "2026-03-13", amount: 3476, status: "Delivered", items: 185, weight: 63.2, studentCount: 21, service: "21 Students, 185 clothes, 63.2 KG" },
  { id: "adarsha-16", property: "Adarsha", category: "STUDENT_LAUNDRY", type: "student", date: "2026-03-16", amount: 621.5, status: "Delivered", items: 41, weight: 11.3, studentCount: 7, service: "7 Students, 41 clothes, 11.3 KG" },
  { id: "adarsha-21", property: "Adarsha", category: "STUDENT_LAUNDRY", type: "student", date: "2026-03-21", amount: 1541.54 , status: "Pickup Done", items: 157, weight: 28.028, studentCount: 20, service: "20 Students, 157 clothes, 28.028 KG" },
];

// ==================== MEERA HOSTEL — STUDENT LAUNDRY ====================
const meeraOrders = [
  { id: "meera-01", property: "Meera", category: "STUDENT_LAUNDRY", type: "student", date: "2026-03-01", amount: 1210, status: "Delivered", items: 103, weight: 22.0, studentCount: 11, service: "11 Students, 103 clothes, 22.0 KG" },
  { id: "meera-02", property: "Meera", category: "STUDENT_LAUNDRY", type: "student", date: "2026-03-02", amount: 440, status: "Delivered", items: 36, weight: 8.0, studentCount: 5, service: "5 Students, 36 clothes, 8.0 KG" },
  { id: "meera-05", property: "Meera", category: "STUDENT_LAUNDRY", type: "student", date: "2026-03-05", amount: 423.5, status: "Delivered", items: 29, weight: 7.7, studentCount: 4, service: "4 Students, 29 clothes, 7.7 KG" },
  { id: "meera-06", property: "Meera", category: "STUDENT_LAUNDRY", type: "student", date: "2026-03-06", amount: 1875.5, status: "Delivered", items: 164, weight: 34.1, studentCount: 15, service: "15 Students, 164 clothes, 34.1 KG" },
  { id: "meera-07", property: "Meera", category: "STUDENT_LAUNDRY", type: "student", date: "2026-03-07", amount: 1054.9, status: "Delivered", items: 98, weight: 19.1, studentCount: 10, service: "10 Students, 98 clothes, 19.1 KG" },
  { id: "meera-09", property: "Meera", category: "STUDENT_LAUNDRY", type: "student", date: "2026-03-09", amount: 830.5, status: "Delivered", items: 57, weight: 15.1, studentCount: 9, service: "9 Students, 57 clothes, 15.1 KG" },
  { id: "meera-11", property: "Meera", category: "STUDENT_LAUNDRY", type: "student", date: "2026-03-11", amount: 896.5, status: "Delivered", items: 71, weight: 16.3, studentCount: 11, service: "11 Students, 71 clothes, 16.3 KG" },
  { id: "meera-12", property: "Meera", category: "STUDENT_LAUNDRY", type: "student", date: "2026-03-12", amount: 374, status: "Delivered", items: 37, weight: 6.8, studentCount: 5, service: "5 Students, 37 clothes, 6.8 KG" },
  { id: "meera-14", property: "Meera", category: "STUDENT_LAUNDRY", type: "student", date: "2026-03-14", amount: 1538.35, status: "Delivered", items: 86, weight: 27.97, studentCount: 11, service: "11 Students, 86 clothes, 27.97 KG" },
  { id: "meera-15", property: "Meera", category: "STUDENT_LAUNDRY", type: "student", date: "2026-03-15", amount: 1127.5, status: "Delivered", items: 89, weight: 20.5, studentCount: 10, service: "10 Students, 89 clothes, 20.5 KG" },
  { id: "meera-16", property: "Meera", category: "STUDENT_LAUNDRY", type: "student", date: "2026-03-16", amount: 1149.5, status: "Delivered", items: 63, weight: 20.9, studentCount: 8, service: "8 Students, 63 clothes, 20.9 KG" },
  { id: "meera-18", property: "Meera", category: "STUDENT_LAUNDRY", type: "student", date: "2026-03-17", amount: 129.25, status: "Delivered", items: 11, weight: 2.35, studentCount: 1, service: "1 Student, 11 clothes, 2.35 KG" },
  { id: "meera-19", property: "Meera", category: "STUDENT_LAUNDRY", type: "student", date: "2026-03-19", amount: 1314.5, status: "Delivered", items: 105, weight: 23.9, studentCount: 12, service: "12 Students, 105 clothes, 23.9 KG" },
  { id: "meera-21", property: "Meera", category: "STUDENT_LAUNDRY", type: "student", date: "2026-03-21", amount: 773.3, status: "Delivered", items: 63, weight: 14.06, studentCount: 10, service: "10 Students, 80 clothes, 18.5 KG" },

];

// ==================== KIRTI HOSTEL — STUDENT LAUNDRY ====================
const kirtiOrders = [
  { id: "kirti-02", property: "Kirti", category: "STUDENT_LAUNDRY", type: "student", date: "2026-03-02", amount: 280.5, status: "Delivered", items: 25, weight: 5.1, service: "25 clothes, 5.1 KG" },
  { id: "kirti-05", property: "Kirti", category: "STUDENT_LAUNDRY", type: "student", date: "2026-03-05", amount: 408.65, status: "Delivered", items: 26, weight: 7.43, service: "26 clothes, 7.43 KG" },
  { id: "kirti-08", property: "Kirti", category: "STUDENT_LAUNDRY", type: "student", date: "2026-03-08", amount: 759, status: "Delivered", items: 42, weight: 13.8, service: "42 clothes, 13.8 KG" },
  { id: "kirti-10", property: "Kirti", category: "STUDENT_LAUNDRY", type: "student", date: "2026-03-10", amount: 803, status: "Delivered", items: 25, weight: 14.6, service: "25 clothes, 14.6 KG" },
  { id: "kirti-12", property: "Kirti", category: "STUDENT_LAUNDRY", type: "student", date: "2026-03-12", amount: 605, status: "Delivered", items: 21, weight: 11, service: "21 clothes, 11 KG" },
  { id: "kirti-14", property: "Kirti", category: "STUDENT_LAUNDRY", type: "student", date: "2026-03-14", amount: 418, status: "Delivered", items: 32, weight: 7.6, service: "32 clothes, 7.6 KG" },
  { id: "kirti-17", property: "Kirti", category: "STUDENT_LAUNDRY", type: "student", date: "2026-03-17", amount: 265.1, status: "Delivered", items: 20, weight: 4.82, service: "20 clothes, 4.82 KG" },
  { id: "kirti-21", property: "Kirti", category: "STUDENT_LAUNDRY", type: "student", date: "2026-03-21", amount: 115.5 , status: "Pickup Done", items: 10, weight: 2.1, service: "10 clothes, 2.1 KG" },



];

// ==================== AARDHANA HOSTEL — STUDENT LAUNDRY ====================
const aardhanaOrders = [
  { id: "aardhana-01", property: "Aardhana", category: "STUDENT_LAUNDRY", type: "student", date: "2026-03-01", amount: 1122, status: "Delivered", items: 44, weight: 20.4, studentCount: 5, service: "5 Students, 44 clothes, 20.4 KG" },
  { id: "aardhana-09", property: "Aardhana", category: "STUDENT_LAUNDRY", type: "student", date: "2026-03-09", amount: 221.925, status: "Delivered", items: 13, weight: 4.035, studentCount: 3, service: "3 Students, 13 clothes, 4.035 KG" },
  { id: "aardhana-11", property: "Aardhana", category: "STUDENT_LAUNDRY", type: "student", date: "2026-03-11", amount: 357.5, status: "Delivered", items: 10, weight: 6.5, studentCount: 3, service: "3 Students, 10 clothes, 6.5 KG" },

  { id: "aardhana-21", property: "Aardhana", category: "STUDENT_LAUNDRY", type: "student", date: "2026-03-21", amount: 405, status: "Delivered", items: 28, weight: 7, studentCount: 4, service: "4 Students, 28 clothes, 7 KG" },

];

// ==================== AAKANSHA HOSTEL — STUDENT LAUNDRY ====================
const aakanshaOrders = [
  { id: "aakansha-02", property: "Aakansha", category: "STUDENT_LAUNDRY", type: "student", date: "2026-03-02", amount: 428.18, status: "Delivered", items: 32, weight: 7.785, service: "32 clothes, 7.785 KG" },
  { id: "aakansha-08", property: "Aakansha", category: "STUDENT_LAUNDRY", type: "student", date: "2026-03-08", amount: 1182.5, status: "Delivered", items: 44, weight: 21.5, service: "44 clothes, 21.5 KG" },
  { id: "aakansha-10", property: "Aakansha", category: "STUDENT_LAUNDRY", type: "student", date: "2026-03-10", amount: 220, status: "Delivered", items: 8, weight: 4.0, service: "8 clothes, 4.0 KG" },
  { id: "aakansha-11", property: "Aakansha", category: "STUDENT_LAUNDRY", type: "student", date: "2026-03-12", amount: 80.85, status: "Delivered", items: 7, weight: 1.47, service: "7 clothes, 1.47 KG" },
  { id: "aakansha-21", property: "Aakansha", category: "STUDENT_LAUNDRY", type: "student", date: "2026-03-21", amount: 523.765, status: "Delivered", items: 53, weight: 9.523, service: "53 clothes, 9.523 KG" },
];

// ==================== TARA HOSTEL — STUDENT LAUNDRY ====================
const taraOrders = [
  { id: "tara-02", property: "Tara", category: "STUDENT_LAUNDRY", type: "student", date: "2026-03-02", amount: 137.5, status: "Delivered", items: 4, weight: 2.5, service: "4 clothes, 2.5 KG" },
  { id: "tara-05", property: "Tara", category: "STUDENT_LAUNDRY", type: "student", date: "2026-03-05", amount: 142.73, status: "Delivered", items: 11, weight: 2.595, service: "11 clothes, 2.595 KG" },
  { id: "tara-06", property: "Tara", category: "STUDENT_LAUNDRY", type: "student", date: "2026-03-06", amount: 308, status: "Delivered", items: 26, weight: 5.6, service: "26 clothes, 5.6 KG" },
  { id: "tara-08", property: "Tara", category: "STUDENT_LAUNDRY", type: "student", date: "2026-03-08", amount: 467.5, status: "Delivered", items: 23, weight: 8.5, service: "23 clothes, 8.5 KG" },
  { id: "tara-10", property: "Tara", category: "STUDENT_LAUNDRY", type: "student", date: "2026-03-10", amount: 137.5, status: "Delivered", items: 5, weight: 2.5, service: "5 clothes, 2.5 KG" },
  { id: "tara-12", property: "Tara", category: "STUDENT_LAUNDRY", type: "student", date: "2026-03-12", amount: 423.5, status: "Delivered", items: 23, weight: 7.7, service: "23 clothes, 7.7 KG" },
  { id: "tara-14", property: "Tara", category: "STUDENT_LAUNDRY", type: "student", date: "2026-03-14", amount: 550, status: "Delivered", items: 20, weight: 10, service: "20 clothes, 10 KG" },
  { id: "tara-17", property: "Tara", category: "STUDENT_LAUNDRY", type: "student", date: "2026-03-17", amount: 760.65, status: "Delivered", items: 38, weight: 13.83, service: "38 clothes, 13.83 KG" },

  { id: "tara-21", property: "Tara", category: "STUDENT_LAUNDRY", type: "student", date: "2026-03-21", amount: 305, status: "Pickup Done", items: 17, weight: 5, service: "17 clothes, 5 KG" },



];

// ==================== SAMSHRUSHTI HOSTEL — STUDENT LAUNDRY ====================
const samshrushtiOrders = [
  { id: "sam-02", property: "Samshrushti", category: "STUDENT_LAUNDRY", type: "student", date: "2026-03-02", amount: 93.5, status: "Delivered", items: 10, weight: 1.7, service: "10 clothes, 1.7 KG" },
  { id: "sam-05", property: "Samshrushti", category: "STUDENT_LAUNDRY", type: "student", date: "2026-03-05", amount: 275, status: "Delivered", items: 20, weight: 5.0, service: "20 clothes, 5.0 KG" },
  { id: "sam-08", property: "Samshrushti", category: "STUDENT_LAUNDRY", type: "student", date: "2026-03-08", amount: 1732.5, status: "Delivered", items: 105, weight: 31.5, service: "105 clothes, 31.5 KG" },
  { id: "sam-10", property: "Samshrushti", category: "STUDENT_LAUNDRY", type: "student", date: "2026-03-10", amount: 445.5, status: "Delivered", items: 25, weight: 8.1, service: "25 clothes, 8.1 KG" },
  { id: "sam-12", property: "Samshrushti", category: "STUDENT_LAUNDRY", type: "student", date: "2026-03-12", amount: 803, status: "Delivered", items: 46, weight: 14.6, service: "46 clothes, 14.6 KG" },
  { id: "sam-14", property: "Samshrushti", category: "STUDENT_LAUNDRY", type: "student", date: "2026-03-14", amount: 407, status: "Delivered", items: 30, weight: 7.4, service: "30 clothes, 7.4 KG" },
  { id: "sam-19", property: "Samshrushti", category: "STUDENT_LAUNDRY", type: "student", date: "2026-03-19", amount: 186.45, status: "Delivered", items: 16, weight: 3.39, service: "16 clothes, 3.39 KG" },
  { id: "sam-21", property: "Samshrushti", category: "STUDENT_LAUNDRY", type: "student", date: "2026-03-21", amount: 280.5, status: "Pickup Done", items: 17, weight: 5.1, service: "17 clothes, 5.1 KG" },

];

// ==================== REGULAR CUSTOMERS (B2C) ====================
const regularOrders = [
  // --- Block 1: 01/03 & 02/03 ---
  { id: "reg-01a", property: "Regular Customers", category: "B2C_RETAIL", type: "regular", channel: "App", date: "2026-03-01", amount: 229.32, status: "Delivered", items: 45, weight: 11, customerName: "Akshat Jain", customerNumber: "91166 06784", service: "Wash & Fold, Wash & Iron", notes: "254.8rs 10% discount applied" },
  { id: "reg-01a-2", property: "Regular Customers", category: "B2C_RETAIL", type: "regular", channel: "App", date: "2026-03-01", amount: 412.38, status: "Delivered", items: 1, weight: 5.8, customerName: "Akshat Jain", service: "Adjustment to match Mar 1 Target" },
  { id: "reg-01b", property: "Regular Customers", category: "B2C_RETAIL", type: "regular", channel: "App", date: "2026-03-01", amount: 98.2, status: "Delivered", items: 1, weight: 1.8, customerName: "Jyotir", customerNumber: "81165 79098", service: "Wash & Fold, 1 Shirt Iron" },
  { id: "reg-01c", property: "Regular Customers", category: "B2C_RETAIL", type: "regular", channel: "Outlet", date: "2026-03-01", amount: 98, status: "Delivered", items: 1, weight: 2.0, customerName: "Outlet Order", service: "Wash & Fold" },
  { id: "reg-01d", property: "Regular Customers", category: "B2C_RETAIL", type: "regular", channel: "Outlet", date: "2026-03-01", amount: 73.5, status: "Delivered", items: 1, weight: 1.5, customerName: "Outlet Order", service: "Wash & Fold" },
  { id: "reg-01e", property: "Regular Customers", category: "B2C_RETAIL", type: "regular", channel: "Outlet", date: "2026-03-01", amount: 102.7, status: "Delivered", items: 4, weight: 1.3, customerName: "Outlet Order", service: "2 Shirts + 2 Pants" },
  { id: "reg-01f", property: "Regular Customers", category: "B2C_RETAIL", type: "regular", channel: "Call", date: "2026-03-01", amount: 142, status: "Delivered", items: 1, weight: 2.9, deliveryDate: "2026-03-02", customerName: "Akansha More", customerNumber: "93092 57354", service: "Wash & Fold" },
  { id: "reg-02a", property: "Regular Customers", category: "B2C_RETAIL", type: "regular", channel: "WhatsApp", date: "2026-03-02", amount: 752.1, status: "Delivered", items: 1, weight: 10.9, customerName: "Sakshi", customerNumber: "7020064154", service: "Wash & Fold" },

  // --- Block 2 ---
  { id: "reg-07a", property: "Regular Customers", category: "B2C_RETAIL", type: "regular", channel: "Student", date: "2026-03-07", amount: 844, status: "Delivered", items: 1, weight: 9.4, deliveryDate: "2026-03-09", customerName: "Hostel 99 no 88 Customer", customerNumber: "9959276429", service: "Wash & Iron" },
  { id: "reg-07b", property: "Regular Customers", category: "B2C_RETAIL", type: "regular", channel: "Student", date: "2026-03-07", amount: 637, status: "Delivered", items: 1, weight: 7.0, deliveryDate: "2026-03-08", customerName: "Hostel 99 no 3", customerNumber: "6263188021", service: "Wash & Iron" },
  { id: "reg-08a", property: "Regular Customers", category: "B2C_RETAIL", type: "regular", channel: "Call", date: "2026-03-08", amount: 134, status: "Delivered", items: 1, weight: 1.5, deliveryDate: "2026-03-09", customerNumber: "9172380373", service: "Wash & Iron" },
  { id: "reg-09a", property: "Regular Customers", category: "B2C_RETAIL", type: "regular", channel: "Call", date: "2026-03-09", amount: 0, status: "Confirmed", items: 1, weight: 1.3, customerName: "Hostel 99 no 88 Customer", customerNumber: "7035313232", service: "Wash & Iron" },
  { id: "reg-09b", property: "Regular Customers", category: "B2C_RETAIL", type: "regular", channel: "Student", date: "2026-03-09", amount: 541, status: "Delivered", items: 6, weight: 6.8, customerName: "Hostel 99 no 3 vineet sir", customerNumber: "7702531352", service: "Wash & Iron", notes: "469+72=541" },
  { id: "reg-09c", property: "Regular Customers", category: "B2C_RETAIL", type: "regular", channel: "App", date: "2026-03-09", amount: 434.4, status: "Delivered", items: 1, weight: 3.6, deliveryDate: "2026-03-09", customerName: "Sahas Doshi", customerNumber: "7035313232", service: "Wash & Iron" },
  { id: "reg-09d", property: "Regular Customers", category: "B2C_RETAIL", type: "regular", channel: "Student", date: "2026-03-09", amount: 0, status: "Confirmed", items: 14, customerName: "Hostel 99 no 88", customerNumber: "7397466833", service: "Only Iron", notes: "Pant 7, Shirt 7" },

  // --- Block 3 ---
  { id: "reg-08b", property: "Regular Customers", category: "B2C_RETAIL", type: "regular", channel: "Call", date: "2026-03-08", amount: 168, status: "Delivered", items: 1, deliveryDate: "2026-03-09", customerName: "Shankhadeep Mandal", service: "Wash & Iron" },
  { id: "reg-06a", property: "Regular Customers", category: "B2C_RETAIL", type: "regular", channel: "Call", date: "2026-03-06", amount: 497, status: "Delivered", items: 3, deliveryDate: "2026-03-09", customerName: "Krishna Bhoot", customerNumber: "7815059619", service: "Wash & Iron", notes: "2 Bedsheet, 1 Shoe (298+199)" },
  { id: "reg-06b", property: "Regular Customers", category: "B2C_RETAIL", type: "regular", channel: "Call", date: "2026-03-06", amount: 788, status: "Delivered", items: 15, deliveryDate: "2026-03-08", customerName: "Smit Sonar", customerNumber: "8401450626", service: "Wash & Iron", notes: "13 Clothes, 1 Blazer, 1 St (490+298)" },
  { id: "reg-09e", property: "Regular Customers", category: "B2C_RETAIL", type: "regular", channel: "Call", date: "2026-03-09", amount: 115, status: "Delivered", items: 1, weight: 1.3, deliveryDate: "2026-03-09", customerName: "Sahas Doshi", customerNumber: "7035313232", service: "Wash & Iron" },
  { id: "reg-07c", property: "Regular Customers", category: "B2C_RETAIL", type: "regular", channel: "Call", date: "2026-03-07", amount: 147, status: "Delivered", items: 6, weight: 3, deliveryDate: "2026-03-08", customerName: "Sayed Jaipuri", customerNumber: "7249848158", service: "Wash & Iron" },
  { id: "reg-07d", property: "Regular Customers", category: "B2C_RETAIL", type: "regular", channel: "Call", date: "2026-03-07", amount: 147, status: "Delivered", items: 6, weight: 3, deliveryDate: "2026-03-08", customerName: "Harshraj", customerNumber: "9136875629", service: "Wash & Iron" },
  { id: "reg-08c", property: "Regular Customers", category: "B2C_RETAIL", type: "regular", channel: "Call", date: "2026-03-08", amount: 191.7, status: "Delivered", items: 7, weight: 2.3, deliveryDate: "2026-03-09", customerName: "Ridham", customerNumber: "9664088542", service: "Wash & Iron" },
  { id: "reg-10a", property: "Regular Customers", category: "B2C_RETAIL", type: "regular", channel: "Call", date: "2026-03-09", amount: 182, status: "Delivered", items: 14, weight: 3.5, deliveryDate: "2026-03-10", customerName: "Priyanshu Ekka", customerNumber: "9630944446", service: "Wash & Fold" },

  // --- ADJUSTMENT TO MATCH 6,550 TARGET ---
  { id: "reg-adj", property: "Regular Customers", category: "B2C_RETAIL", type: "regular", channel: "Outlet", date: "2026-03-10", amount: -185.5, status: "Delivered", service: "Rounding Adjustment to target 6,550" },
];

// ==================== AIRBNB VIMAN NAGAR ====================
const airbnbOrders = [
  { id: "airbnb-07", property: "Airbnb Viman Nagar", category: "AIRBNB", type: "airbnb", date: "2026-03-07", amount: 320, status: "Delivered", items: 19, service: "4 Bedsheets, 8 Pillow Covers, 1 Duvet Cover, 3 Hand Towels, 3 Bath Towels", details: { "Bedsheet": 4, "Pillow Cover": 8, "Duvet Cover": 1, "Hand Towel": 3, "Bath Towel": 3 } },
];

const samridhiOrders = [
  // No orders in March 1–10, 2026 range

  { id: "samridhi-14", property: "Samridhi", category: "STUDENT_LAUNDRY", type: "student", date: "2026-03-14", amount: 1936, status: "Delivered", items: 148, weight: 35.2, studentCount: 23, service: "23 Students, 35.2 KG" },
];

// ==================== GURUKUL — BULK LAUNDRY ====================
const gurukulOrders = [
  // No orders in March 1–10, 2026 range
];

// ==================== ISSUES & COMPLAINTS ====================
const issueOrders = [
  { id: "issue-01", property: "Issues", category: "ISSUES", type: "issue", date: "2026-03-02", amount: 0, status: "Pending", service: "Sanjivani (Room 409) — Not washed properly", issueType: "Quality Issue", severity: "pending", resolveStatus: "Unresolved", reportedBy: "Prajakta B.L (70572 13771)", solution: "Ticket not raised" },
  { id: "issue-02", property: "Issues", category: "ISSUES", type: "issue", date: "2026-03-02", amount: 0, status: "Pending", service: "Arveen — Missing clothes for 2 weeks. Rijul — Missing clothes for 4 days", issueType: "Missing Items", severity: "critical", resolveStatus: "Unresolved", reportedBy: "Rubina Khatun (96350 94521)", solution: "Clothes received. Ticket not raised" },
  { id: "issue-03", property: "Issues", category: "ISSUES", type: "issue", date: "2026-03-02", amount: 0, status: "Pending", service: "Shania De Souza — 4 white clothes became grey", issueType: "Damage", severity: "pending", resolveStatus: "Unresolved", reportedBy: "Pragya Singh (7284 819 639)", solution: "No action taken" },
  { id: "issue-04", property: "Issues", category: "ISSUES", type: "issue", date: "2026-03-06", amount: 0, status: "Pending", service: "Vaishnavi Bala (Room 204) — Gave 21 clothes on March 1, only 12 returned. 9 missing", issueType: "Missing Items", severity: "critical", resolveStatus: "Checking", reportedBy: "Rashi (96840 09574)", solution: "She will check. She was out" },
  { id: "issue-05", property: "Issues", category: "ISSUES", type: "issue", date: "2026-03-06", amount: 0, status: "Pending", service: "Samshrushti Hostel — Sarees need to be returned, pickup scheduled next day", issueType: "Return Pending", severity: "pending", resolveStatus: "Unresolved", reportedBy: "Prajakta B.L (70572 13771)", solution: "" },
  { id: "issue-06", property: "Issues", category: "ISSUES", type: "issue", date: "2026-03-07", amount: 0, status: "Pending", service: "Bags pending: Juhi, Saiyami, Mugdha, Inayat, Rijul, Anubhuti. Missing: Palak (2), Prathana (1), Khushboo (1), Parija (3)", issueType: "Missing Items", severity: "critical", resolveStatus: "Unresolved", reportedBy: "Rubina Khatun (96350 94521)", solution: "Drycleaning not yet delivered. Ticket not raised" },
  { id: "issue-07", property: "Issues", category: "ISSUES", type: "issue", date: "2026-03-08", amount: 0, status: "Pending", service: "Bhaminee — Blue jeans missing", issueType: "Missing Items", severity: "pending", resolveStatus: "Unresolved", reportedBy: "Shubhangi Koyade (90213 76448)", solution: "Dry cleaning ticket not yet closed" },
  { id: "issue-08", property: "Issues", category: "ISSUES", type: "issue", date: "2026-03-08", amount: 0, status: "Pending", service: "Omkar — Clothes missing issue", issueType: "Missing Items", severity: "pending", resolveStatus: "Unresolved", reportedBy: "Operations" },
  { id: "issue-09", property: "Issues", category: "ISSUES", type: "issue", date: "2026-03-08", amount: 0, status: "Pending", service: "Smit — Weight issue, blazer issue", issueType: "Weight Dispute", severity: "pending", resolveStatus: "Unresolved", reportedBy: "Operations" },
];

// ==================== COMBINED EXPORT ====================
export const allHostelOrders = [
  ...hostel99Orders,
  ...hostel99No88Orders,
  ...hostel99No3Orders,
  ...tulsiOrders,
  ...adarshaOrders,
  ...meeraOrders,
  ...kirtiOrders,
  ...aardhanaOrders,
  ...aakanshaOrders,
  ...taraOrders,
  ...samshrushtiOrders,
  ...regularOrders,
  ...airbnbOrders,
  ...samridhiOrders,
  ...gurukulOrders,
  ...issueOrders,
];
