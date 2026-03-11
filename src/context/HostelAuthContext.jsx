// src/context/HostelAuthContext.jsx
// Standalone auth context for client logins — Firebase Auth added for admin.
import { createContext, useContext, useState, useCallback } from "react";
import { signInWithEmailAndPassword, signOut as firebaseSignOut } from "firebase/auth";
import { auth } from "../firebase";
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

  const login = useCallback(async (email, password) => {
    const result = authenticateUser(email, password);
    if (result.success) {
      const clientData = {
        ...result.client,
        role: result.role,
      };
      setClient(clientData);
      setIsAdmin(result.role === "admin");
      sessionStorage.setItem("hostelClient", JSON.stringify(clientData));

      // If admin, also sign into Firebase Auth for Firestore security rules
      if (result.role === "admin") {
        try {
          await signInWithEmailAndPassword(auth, email, password);
        } catch (fbErr) {
          console.warn("Firebase Auth sign-in failed (rules will use open access):", fbErr.message);
        }
      }
    }
    return result;
  }, []);

  const setAuthenticatedUser = useCallback((clientData) => {
    setClient(clientData);
    setIsAdmin(clientData.role === "admin");
    sessionStorage.setItem("hostelClient", JSON.stringify(clientData));
  }, []);

  const logout = useCallback(async () => {
    setClient(null);
    setIsAdmin(false);
    sessionStorage.removeItem("hostelClient");
    try {
      await firebaseSignOut(auth);
    } catch (_) {
      // ignore — may not have been signed in via Firebase
    }
  }, []);

  return (
    <HostelAuthContext.Provider value={{ client, orders, isAdmin, login, logout, setAuthenticatedUser }}>
      {children}
    </HostelAuthContext.Provider>
  );
}

export function useHostelAuth() {
  const ctx = useContext(HostelAuthContext);
  if (!ctx) throw new Error("useHostelAuth must be inside HostelAuthProvider");
  return ctx;
}

