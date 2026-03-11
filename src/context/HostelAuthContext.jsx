// src/context/HostelAuthContext.jsx
// Standalone auth context for client logins — no Firebase.
import { createContext, useContext, useState, useCallback } from "react";
import { authenticateUser } from "../data/hostelAuth";
import { allHostelOrders } from "../data/hostelOrders";

const HostelAuthContext = createContext(null);

export function HostelAuthProvider({ children }) {
  const [client, setClient] = useState(() => {
    const saved = sessionStorage.getItem("hostelClient");
    return saved ? JSON.parse(saved) : null;
  });

  const [isAdmin, setIsAdmin] = useState(() => {
    const saved = sessionStorage.getItem("hostelClient");
    if (!saved) return false;
    return JSON.parse(saved).role === "admin";
  });

  const orders = client?.properties
    ? allHostelOrders.filter((o) => client.properties.includes(o.property))
    : client?.role === "admin"
    ? allHostelOrders
    : [];

  const login = useCallback((email, password) => {
    const result = authenticateUser(email, password);
    if (result.success) {
      const clientData = {
        ...result.client,
        role: result.role,
      };
      setClient(clientData);
      setIsAdmin(result.role === "admin");
      sessionStorage.setItem("hostelClient", JSON.stringify(clientData));
    }
    return result;
  }, []);

  const logout = useCallback(() => {
    setClient(null);
    setIsAdmin(false);
    sessionStorage.removeItem("hostelClient");
  }, []);

  return (
    <HostelAuthContext.Provider value={{ client, orders, isAdmin, login, logout }}>
      {children}
    </HostelAuthContext.Provider>
  );
}

export function useHostelAuth() {
  const ctx = useContext(HostelAuthContext);
  if (!ctx) throw new Error("useHostelAuth must be inside HostelAuthProvider");
  return ctx;
}
