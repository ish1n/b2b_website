// src/data/mockOrders.js
// Hardcoded order data for March 1–10, 2026
// Categories: B2B Student Laundry, B2B Linen Services, B2C Retail, Airbnb, Issues

// ---------- CATEGORY DEFINITIONS ----------
export const ORDER_CATEGORIES = {
    STUDENT_LAUNDRY: {
        label: "Student Laundry (B2B)",
        color: "#1976D2",
        tenants: ["Tulsi", "Adarsha", "Meera", "Kirti", "Aardhana", "Aakansha", "Tara", "Samshrushti"]
    },
    LINEN_SERVICES: {
        label: "Linen Services (B2B)",
        color: "#7C3AED",
        tenants: ["Hostel 99", "Hostel 99 no-88", "Hostel 99 no-3"]
    },
    B2C_RETAIL: {
        label: "Retail Customers (B2C)",
        color: "#059669",
        tenants: ["Regular Customers"]
    },
    AIRBNB: {
        label: "Airbnb Services",
        color: "#D97706",
        tenants: ["Airbnb Viman Nagar"]
    },
    ISSUES: {
        label: "Issues & Complaints",
        color: "#DC2626",
        tenants: ["Issues & Complaints"]
    }
};

export function getCategoryForTenant(tenant) {
    for (const [key, cat] of Object.entries(ORDER_CATEGORIES)) {
        if (cat.tenants.includes(tenant)) return { key, ...cat };
    }
    return { key: "UNKNOWN", label: "Other", color: "#6B7280", tenants: [] };
}

// ---------- HARDCODED ORDERS (Mar 1–10, 2026) ----------
export const hardcodedOrders = [
    // --- TULSI HOSTEL (Student Laundry) ---
    { id: "tulsi-1", tenant: "Tulsi", date: "2026-03-01", month: 3, day: 1, amount: 2106.5, items: 86, service: "12 Students, 38.3 KG", status: "Delivered" },
    { id: "tulsi-3", tenant: "Tulsi", date: "2026-03-03", month: 3, day: 3, amount: 220, items: 12, service: "1 Student, 4.0 KG", status: "Delivered" },
    { id: "tulsi-7", tenant: "Tulsi", date: "2026-03-07", month: 3, day: 7, amount: 825, items: 66, service: "8 Students, 15.0 KG", status: "Delivered" },
    { id: "tulsi-9", tenant: "Tulsi", date: "2026-03-09", month: 3, day: 9, amount: 979, items: 81, service: "8 Students, 17.8 KG", status: "Delivered" },

    // --- ADARSHA HOSTEL (Student Laundry) ---
    { id: "adarsha-1", tenant: "Adarsha", date: "2026-03-01", month: 3, day: 1, amount: 4290, items: 152, service: "19 Students, 78.0 KG", status: "Delivered" },
    { id: "adarsha-3", tenant: "Adarsha", date: "2026-03-03", month: 3, day: 3, amount: 660, items: 34, service: "5 Students, 12.0 KG", status: "Delivered" },
    { id: "adarsha-5", tenant: "Adarsha", date: "2026-03-05", month: 3, day: 5, amount: 2942.5, items: 137, service: "18 Students, 53.5 KG", status: "Delivered" },
    { id: "adarsha-7", tenant: "Adarsha", date: "2026-03-07", month: 3, day: 7, amount: 907.5, items: 37, service: "6 Students, 16.5 KG", status: "Delivered" },
    { id: "adarsha-9", tenant: "Adarsha", date: "2026-03-09", month: 3, day: 9, amount: 847, items: 42, service: "7 Students, 15.4 KG", status: "Delivered" },

    // --- HOSTEL 99 (Base) (Linen Services) ---
    { id: "h99-1", tenant: "Hostel 99", date: "2026-03-01", month: 3, day: 1, amount: 520, items: 24, service: "12 Single Bedsheets, 2 Duvet Covers, 10 Pillow Covers", status: "Delivered" },
    { id: "h99-3", tenant: "Hostel 99", date: "2026-03-03", month: 3, day: 3, amount: 590, items: 29, service: "14 Single Bedsheets, 1 Duvet Cover, 14 Pillow Covers, 1 Bath Towel", status: "Delivered" },
    { id: "h99-4", tenant: "Hostel 99", date: "2026-03-04", month: 3, day: 4, amount: 480, items: 22, service: "13 Single Bedsheets, 9 Pillow Covers", status: "Delivered" },
    { id: "h99-6", tenant: "Hostel 99", date: "2026-03-06", month: 3, day: 6, amount: 140, items: 8, service: "3 Single Bedsheets, 5 Pillow Covers", status: "Delivered" },
    { id: "h99-7", tenant: "Hostel 99", date: "2026-03-07", month: 3, day: 7, amount: 895, items: 31, service: "13 Single Bedsheets, 3 Duvet Covers, 10 Pillow Covers, 3 Bath towels, 1 Double Bedsheet, 1 Blanket", status: "Delivered" },

    // --- HOSTEL 99 (No-88) (Linen Services) ---
    { id: "h9988-1", tenant: "Hostel 99 no-88", date: "2026-03-01", month: 3, day: 1, amount: 260, items: 10, service: "8 Single Bedsheets, 2 Pillow Covers", status: "Delivered" },
    { id: "h9988-3", tenant: "Hostel 99 no-88", date: "2026-03-03", month: 3, day: 3, amount: 110, items: 5, service: "3 Single Bedsheets, 2 Pillow Covers", status: "Delivered" },
    { id: "h9988-4", tenant: "Hostel 99 no-88", date: "2026-03-04", month: 3, day: 4, amount: 120, items: 6, service: "3 Single Bedsheets, 3 Pillow Covers", status: "Delivered" },
    { id: "h9988-6", tenant: "Hostel 99 no-88", date: "2026-03-06", month: 3, day: 6, amount: 440, items: 22, service: "9 Single Bedsheets, 11 Pillow Covers, 2 Duvet Covers", status: "Delivered" },
    { id: "h9988-7", tenant: "Hostel 99 no-88", date: "2026-03-07", month: 3, day: 7, amount: 380, items: 18, service: "10 Single Bedsheets, 8 Pillow Covers", status: "Delivered" },
    { id: "h9988-8", tenant: "Hostel 99 no-88", date: "2026-03-08", month: 3, day: 8, amount: 120, items: 6, service: "3 Single Bedsheets, 3 Pillow Covers", status: "Delivered" },
    { id: "h9988-9", tenant: "Hostel 99 no-88", date: "2026-03-09", month: 3, day: 9, amount: 480, items: 24, service: "11 Single Bedsheets, 12 Pillow Covers, 1 Duvet Cover", status: "Delivered" },

    // --- HOSTEL 99 (No-3) (Linen Services) ---
    { id: "h993-1", tenant: "Hostel 99 no-3", date: "2026-03-01", month: 3, day: 1, amount: 290, items: 15, service: "7 Single Bedsheets, 8 Pillow Covers", status: "Delivered" },
    { id: "h993-4", tenant: "Hostel 99 no-3", date: "2026-03-04", month: 3, day: 4, amount: 90, items: 5, service: "2 Single Bedsheets, 3 Pillow Covers", status: "Delivered" },
    { id: "h993-6", tenant: "Hostel 99 no-3", date: "2026-03-06", month: 3, day: 6, amount: 550, items: 27, service: "14 Single Bedsheets, 13 Pillow Covers", status: "Delivered" },
    { id: "h993-7", tenant: "Hostel 99 no-3", date: "2026-03-07", month: 3, day: 7, amount: 160, items: 8, service: "4 Single Bedsheets, 4 Pillow Covers", status: "Delivered" },
    { id: "h993-8", tenant: "Hostel 99 no-3", date: "2026-03-08", month: 3, day: 8, amount: 150, items: 7, service: "4 Single Bedsheets, 3 Pillow Covers", status: "Delivered" },
    { id: "h993-9", tenant: "Hostel 99 no-3", date: "2026-03-09", month: 3, day: 9, amount: 390, items: 19, service: "9 Single Bedsheets, 9 Pillow Covers, 1 Duvet Cover", status: "Delivered" },

    // --- MEERA HOSTEL (Student Laundry) ---
    { id: "meera-1", tenant: "Meera", date: "2026-03-01", month: 3, day: 1, amount: 1210, items: 103, service: "11 Students, 22.0 KG", status: "Delivered" },
    { id: "meera-2", tenant: "Meera", date: "2026-03-02", month: 3, day: 2, amount: 440, items: 36, service: "5 Students, 8.0 KG", status: "Delivered" },
    { id: "meera-5", tenant: "Meera", date: "2026-03-05", month: 3, day: 5, amount: 423.5, items: 29, service: "4 Students, 7.7 KG", status: "Delivered" },
    { id: "meera-6", tenant: "Meera", date: "2026-03-06", month: 3, day: 6, amount: 1875.5, items: 164, service: "15 Students, 34.1 KG", status: "Delivered" },
    { id: "meera-7", tenant: "Meera", date: "2026-03-07", month: 3, day: 7, amount: 1054.9, items: 98, service: "10 Students, 19.1 KG", status: "Delivered" },
    { id: "meera-9", tenant: "Meera", date: "2026-03-09", month: 3, day: 9, amount: 830.5, items: 57, service: "9 Students, 15.1 KG", status: "Delivered" },

    // --- KIRTI HOSTEL (Student Laundry) ---
    { id: "kirti-2", tenant: "Kirti", date: "2026-03-02", month: 3, day: 2, amount: 280.5, items: 25, service: "5.1 KG", status: "Delivered" },
    { id: "kirti-5", tenant: "Kirti", date: "2026-03-05", month: 3, day: 5, amount: 408.65, items: 26, service: "7.43 KG", status: "Delivered" },
    { id: "kirti-8", tenant: "Kirti", date: "2026-03-08", month: 3, day: 8, amount: 759, items: 42, service: "13.8 KG", status: "Delivered" },
    { id: "kirti-10", tenant: "Kirti", date: "2026-03-10", month: 3, day: 10, amount: 803, items: 25, service: "14.6 KG", status: "Delivered" },

    // --- AARDHANA HOSTEL (Student Laundry) ---
    { id: "aardhana-1", tenant: "Aardhana", date: "2026-03-01", month: 3, day: 1, amount: 1122, items: 44, service: "5 Students, 20.4 KG", status: "Delivered" },
    { id: "aardhana-9", tenant: "Aardhana", date: "2026-03-09", month: 3, day: 9, amount: 221.93, items: 13, service: "3 Students, 4.035 KG", status: "Delivered" },

    // --- AAKANSHA HOSTEL (Student Laundry) ---
    { id: "aakansha-2", tenant: "Aakansha", date: "2026-03-02", month: 3, day: 2, amount: 428.18, items: 32, service: "7.785 KG", status: "Delivered" },
    { id: "aakansha-8", tenant: "Aakansha", date: "2026-03-08", month: 3, day: 8, amount: 1182.5, items: 44, service: "21.5 KG", status: "Delivered" },
    { id: "aakansha-10", tenant: "Aakansha", date: "2026-03-10", month: 3, day: 10, amount: 220, items: 8, service: "4 KG", status: "Delivered" },

    // --- TARA HOSTEL (Student Laundry) ---
    { id: "tara-2", tenant: "Tara", date: "2026-03-02", month: 3, day: 2, amount: 137.5, items: 4, service: "2.5 KG", status: "Delivered" },
    { id: "tara-5", tenant: "Tara", date: "2026-03-05", month: 3, day: 5, amount: 142.73, items: 11, service: "2.595 KG", status: "Delivered" },
    { id: "tara-6", tenant: "Tara", date: "2026-03-06", month: 3, day: 6, amount: 308, items: 26, service: "5.6 KG", status: "Delivered" },
    { id: "tara-8", tenant: "Tara", date: "2026-03-08", month: 3, day: 8, amount: 467.5, items: 23, service: "8.5 KG", status: "Delivered" },
    { id: "tara-10", tenant: "Tara", date: "2026-03-10", month: 3, day: 10, amount: 137.5, items: 5, service: "2.5 KG", status: "Delivered" },

    // --- SAMSHRUSHTI HOSTEL (Student Laundry) ---
    { id: "sam-2", tenant: "Samshrushti", date: "2026-03-02", month: 3, day: 2, amount: 93.5, items: 10, service: "1.7 KG", status: "Delivered" },
    { id: "sam-5", tenant: "Samshrushti", date: "2026-03-05", month: 3, day: 5, amount: 275, items: 20, service: "5 KG", status: "Delivered" },
    { id: "sam-8", tenant: "Samshrushti", date: "2026-03-08", month: 3, day: 8, amount: 1732.5, items: 105, service: "31.5 KG", status: "Delivered" },
    { id: "sam-10", tenant: "Samshrushti", date: "2026-03-10", month: 3, day: 10, amount: 445.5, items: 25, service: "8.1 KG", status: "Delivered" },

    // --- REGULAR CUSTOMERS (B2C) ---
    { id: "reg-1a", tenant: "Regular Customers", date: "2026-03-01", month: 3, day: 1, amount: 229.32, items: 1, service: "Akshat jain (9116606784) - Wash & Fold, Wash & Iron (5.2 KG)", status: "Delivered" },
    { id: "reg-1b", tenant: "Regular Customers", date: "2026-03-01", month: 3, day: 1, amount: 98.2, items: 1, service: "Jyotir (8116579098) - Wash & fold, 1 shirt iron (1.8 KG)", status: "Delivered" },
    { id: "reg-1c", tenant: "Regular Customers", date: "2026-03-01", month: 3, day: 1, amount: 98, items: 1, service: "Outlet order - Wash & fold (2 KG)", status: "Delivered" },
    { id: "reg-1d", tenant: "Regular Customers", date: "2026-03-01", month: 3, day: 1, amount: 73.5, items: 1, service: "Outlet order - Wash & fold (1.5 KG)", status: "Delivered" },
    { id: "reg-1e", tenant: "Regular Customers", date: "2026-03-01", month: 3, day: 1, amount: 102.7, items: 1, service: "Outlet order - 2 shirt+2 pant (1.3 KG)", status: "Delivered" },
    { id: "reg-1f", tenant: "Regular Customers", date: "2026-03-01", month: 3, day: 1, amount: 142, items: 1, service: "Akansha More (9309257354) - Wash and fold (2.9 KG)", status: "Delivered" },
    { id: "reg-2a", tenant: "Regular Customers", date: "2026-03-02", month: 3, day: 2, amount: 752.1, items: 1, service: "Sakshi (7020064154) - Wash and fold (10.9 KG)", status: "Delivered" },
    { id: "reg-7a", tenant: "Regular Customers", date: "2026-03-07", month: 3, day: 7, amount: 844, items: 1, service: "Hostel 99 no 88 customer - wash and iron (9.4 KG)", status: "Delivered" },
    { id: "reg-7b", tenant: "Regular Customers", date: "2026-03-07", month: 3, day: 7, amount: 637, items: 1, service: "Hostel 99 no 3 - wash and iron (7 KG)", status: "Delivered" },
    { id: "reg-8a", tenant: "Regular Customers", date: "2026-03-08", month: 3, day: 8, amount: 134, items: 1, service: "9172380373 - wash and iron (1.5 KG)", status: "Delivered" },

    // --- AIRBNB VIMAN NAGAR ---
    { id: "airbnb-7", tenant: "Airbnb Viman Nagar", date: "2026-03-07", month: 3, day: 7, amount: 320, items: 19, service: "4 Bedsheets, 8 Pillow Covers, 1 Duvet Cover, 3 Hand towels, 3 Bath towels", status: "Delivered" },

    // --- ISSUES & COMPLAINTS (Flagged) ---
    { id: "issue-1", tenant: "Issues & Complaints", date: "2026-03-06", month: 3, day: 6, amount: 0, items: 1, service: "Vaishnavi Bala (Room 204) — 9 clothes missing from the March 1 pickup order", status: "Pending", hasIssue: true, issueType: "Missing Items", reportedBy: "Rashi" },
    { id: "issue-2", tenant: "Issues & Complaints", date: "2026-03-06", month: 3, day: 6, amount: 0, items: 1, service: "Samshrushti Hostel — Sarees need to be returned; pickup scheduled for the next day", status: "Pending", hasIssue: true, issueType: "Return Pending", reportedBy: "Prajakta" },
    { id: "issue-3", tenant: "Issues & Complaints", date: "2026-03-07", month: 3, day: 7, amount: 0, items: 1, service: "Bags still pending for: Juhi, Saiyami, Mugdha, Inayat, Rijul, Anubhuti. Missing clothes: Palak (2), Prathana (1), Khushboo (1), Parija (3)", status: "Pending", hasIssue: true, issueType: "Bags Pending + Missing Items", reportedBy: "Operations" }
];

