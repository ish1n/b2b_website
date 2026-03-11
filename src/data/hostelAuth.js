// src/data/hostelAuth.js
// Hardcoded credentials for all client/manager logins.
// No Firebase — pure client-side auth.

export const CLIENT_CREDENTIALS = [
  {
    id: "client-h99-group",
    name: "Hostel 99 Group",
    email: "manager@hostel99group.com",
    password: "Hostel99Group@2024",
    properties: ["Hostel 99", "Hostel 99 no-88", "Hostel 99 no-3"],
    isGroup: true,
  },
  {
    id: "client-tulsi",
    name: "Tulsi Hostel",
    email: "manager@tulsi.com",
    password: "Tulsi@2024",
    properties: ["Tulsi"],
  },
  {
    id: "client-adarsha",
    name: "Adarsha Hostel",
    email: "manager@adarsha.com",
    password: "Adarsha@2024",
    properties: ["Adarsha"],
  },
  {
    id: "client-meera",
    name: "Meera Hostel",
    email: "manager@meera.com",
    password: "Meera@2024",
    properties: ["Meera"],
  },
  {
    id: "client-kirti",
    name: "Kirti Hostel",
    email: "manager@kirti.com",
    password: "Kirti@2024",
    properties: ["Kirti"],
  },
  {
    id: "client-aardhana",
    name: "Aardhana Hostel",
    email: "manager@aardhana.com",
    password: "Aardhana@2024",
    properties: ["Aardhana"],
  },
  {
    id: "client-aakansha",
    name: "Aakansha Hostel",
    email: "manager@aakansha.com",
    password: "Aakansha@2024",
    properties: ["Aakansha"],
  },
  {
    id: "client-tara",
    name: "Tara Hostel",
    email: "manager@tara.com",
    password: "Tara@2024",
    properties: ["Tara"],
  },
  {
    id: "client-samshrushti",
    name: "Samshrushti Hostel",
    email: "manager@samshrushti.com",
    password: "Samshrushti@2024",
    properties: ["Samshrushti"],
  },
  {
    id: "client-regular",
    name: "Regular Customers (B2C)",
    email: "manager@regularcustomers.com",
    password: "RegularCustomers@2024",
    properties: ["Regular Customers"],
  },
  {
    id: "client-airbnb",
    name: "Airbnb Viman Nagar",
    email: "manager@airbnbvimannagar.com",
    password: "AirbnbVimanNagar@2024",
    properties: ["Airbnb Viman Nagar"],
  },
  {
    id: "client-samridhi",
    name: "Samridhi",
    email: "manager@samridhi.com",
    password: "Samridhi@2024",
    properties: ["Samridhi"],
  },
  {
    id: "client-gurukul",
    name: "Gurukul",
    email: "manager@gurukul.com",
    password: "Gurukul@2024",
    properties: ["Gurukul"],
  },
];

// Admin credential (hardcoded, replaces Firebase admin too)
export const ADMIN_CREDENTIAL = {
  id: "admin-1",
  name: "Andes Admin",
  email: "ceo@andes.co.in",
  password: "aryan2026@#",
  role: "admin",
};

/**
 * Authenticate against hardcoded credentials.
 * Returns { success, role: "admin"|"client", client? } or { success: false, error }
 */
export function authenticateUser(email, password) {
  const normalizedEmail = email.trim().toLowerCase();

  // Check admin first
  if (normalizedEmail === ADMIN_CREDENTIAL.email && password === ADMIN_CREDENTIAL.password) {
    return { success: true, role: "admin", client: ADMIN_CREDENTIAL };
  }

  // Check client credentials
  const client = CLIENT_CREDENTIALS.find(
    (c) => c.email.toLowerCase() === normalizedEmail && c.password === password
  );

  if (client) {
    return { success: true, role: "client", client };
  }

  return { success: false, error: "Invalid email or password." };
}
