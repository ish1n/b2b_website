// src/data/hostelAuth.js
// Hardcoded credentials for all client/manager logins.
// No Firebase — pure client-side auth.

export const CLIENT_CREDENTIALS = [
  {
    id: "client-h99-group",
    name: "Hostel 99 Group",
    email: "managerhostel99@andes.co.in",
    password: "Hostel99Group@2026",
    properties: ["Hostel 99", "Hostel 99 no-88", "Hostel 99 no-3"],
    isGroup: true,
  },
  {
    id: "client-tulsi",
    name: "Tulsi Hostel",
    email: "tulsi@andes.co.in",
    password: "Tulsi@2026",
    properties: ["Tulsi"],
  },
  {
    id: "client-adarsha",
    name: "Adarsha Hostel",
    email: "adarsha@andes.co.in",
    password: "Adarsha@2026",
    properties: ["Adarsha"],
  },
  {
    id: "client-meera",
    name: "Meera Hostel",
    email: "meera@andes.co.in",
    password: "Meera@2026",
    properties: ["Meera"],
  },
  {
    id: "client-kirti",
    name: "Kirti Hostel",
    email: "kirti@andes.co.in",
    password: "Kirti@2026",
    properties: ["Kirti"],
  },
  {
    id: "client-aardhana",
    name: "Aardhana Hostel",
    email: "aardhana@andes.co.in",
    password: "Aardhana@2026",
    properties: ["Aardhana"],
  },
  {
    id: "client-aakansha",
    name: "Aakansha Hostel",
    email: "aakansha@andes.co.in",
    password: "Aakansha@2026",
    properties: ["Aakansha"],
  },
  {
    id: "client-tara",
    name: "Tara Hostel",
    email: "tara@andes.co.in",
    password: "Tara@2026",
    properties: ["Tara"],
  },
  {
    id: "client-samshrushti",
    name: "Samshrushti Hostel",
    email: "samshrushti@andes.co.in",
    password: "Samshrushti@2026",
    properties: ["Samshrushti"],
  },
  {
    id: "client-regular",
    name: "Regular Customers (B2C)",
    email: "regularcustomers@andes.co.in",
    password: "RegularCustomers@2026",
    properties: ["Regular Customers"],
  },
  {
    id: "client-airbnb",
    name: "Airbnb Viman Nagar",
    email: "airbnbvimannagar@andes.co.in",
    password: "AirbnbVimanNagar@2026",
    properties: ["Airbnb Viman Nagar"],
  },
  {
    id: "client-samridhi",
    name: "Samridhi",
    email: "samridhi@andes.co.in",
    password: "Samridhi@2026",
    properties: ["Samridhi"],
  },
  {
    id: "client-gurukul",
    name: "Gurukul",
    email: "gurukul@andes.co.in",
    password: "Gurukul@2026",
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
