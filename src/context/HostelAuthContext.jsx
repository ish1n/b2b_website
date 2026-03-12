// src/context/HostelAuthContext.jsx
// Standalone auth context for client logins — Firebase Auth added for admin and anonymous auth for clients.
import { createContext, useContext, useState, useCallback, useEffect, useMemo } from "react";
import { signInWithEmailAndPassword, signInAnonymously, signOut as firebaseSignOut, onAuthStateChanged } from "firebase/auth";
import { collection, onSnapshot, setDoc, doc } from "firebase/firestore";
import { auth, db } from "../firebase";
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

  // State to manage real-time Firestore edits (issues, modified orders)
  const [firestoreEdits, setFirestoreEdits] = useState([]);

  // Listen to Firestore globally for the client to see updates in real-time
  useEffect(() => {
    if (!client) {
      setFirestoreEdits([]);
      return;
    }

    let unsubSnapshot = () => { };

    // WAIT for Firebase Auth to confirm the user is logged in (anonymously or admin) before listening
    const unsubAuth = onAuthStateChanged(auth, (firebaseUser) => {
      unsubSnapshot(); // Clean up any previous listener

      if (firebaseUser) {
        // Now that we have a valid Firebase token, we are allowed to read the database
        unsubSnapshot = onSnapshot(collection(db, "b2b_admin_edits"), (snapshot) => {
          const edits = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
          setFirestoreEdits(edits);
        }, (error) => {
          console.warn("Firestore listen error (might be offline or rule restricted):", error);
        });
      } else {
        setFirestoreEdits([]);
      }
    });

    return () => {
      unsubAuth();
      unsubSnapshot();
    };
  }, [client]);

  // Merge static data with live Firestore edits
  const allOrdersMerged = useMemo(() => {
    const extraIds = new Set(firestoreEdits.map(o => o.id));
    // Remove base orders that have been edited in Firestore
    const cleanBase = allHostelOrders.filter(o => !extraIds.has(o.id));
    // Combine clean base with firestore edits, ignoring deleted records
    return [...cleanBase, ...firestoreEdits].filter(o => !o.isDeleted);
  }, [firestoreEdits]);

  // Filter for the specific logged-in client
  const orders = client?.properties
    ? allOrdersMerged.filter((o) => client.properties.includes(o.property) || o.linkedHostel === client.properties[0])
    : client?.role === "admin"
      ? allOrdersMerged
      : [];

  // Function to raise a new issue and push it to Firestore
  const addIssue = useCallback(async (newIssue) => {
    try {
      await setDoc(doc(db, "b2b_admin_edits", String(newIssue.id)), newIssue);
    } catch (err) {
      console.error("Error raising issue to Firestore:", err);
      // Optimistic update in case of restrictive Firestore rules for unauthenticated clients
      setFirestoreEdits(prev => [...prev.filter(i => i.id !== newIssue.id), newIssue]);
    }
  }, []);

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

      // Handle Firebase Auth for database rules
      try {
        if (result.role === "admin") {
          // Admin gets real Firebase login
          await signInWithEmailAndPassword(auth, email, password);
        } else {
          // Clients get anonymous Firebase login so they have database read/write access
          await signInAnonymously(auth);
        }
      } catch (fbErr) {
        console.warn("Firebase Auth sign-in failed:", fbErr.message);
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
      // ignore
    }
  }, []);

  return (
    <HostelAuthContext.Provider value={{ client, orders, isAdmin, login, logout, setAuthenticatedUser, addIssue }}>
      {children}
    </HostelAuthContext.Provider>
  );
}

export function useHostelAuth() {
  const ctx = useContext(HostelAuthContext);
  if (!ctx) throw new Error("useHostelAuth must be inside HostelAuthProvider");
  return ctx;
}