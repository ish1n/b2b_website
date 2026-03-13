// src/context/HostelAuthContext.jsx
// Standalone auth context for client logins — Firebase Auth added for admin and anonymous auth for clients.
import { createContext, useContext, useState, useCallback, useEffect, useMemo } from "react";
import { signInWithEmailAndPassword, signInAnonymously, signOut as firebaseSignOut, onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../firebase";
import { getDoc, doc, onSnapshot, collection, setDoc } from "firebase/firestore";
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
    let unsubSnapshot = () => { };

    const unsubAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      unsubSnapshot(); 

      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, "b2b_managers", firebaseUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const clientData = {
              uid: firebaseUser.uid,
              ...userData
            };
            setClient(clientData);
            setIsAdmin(userData.role === "admin");
            sessionStorage.setItem("hostelClient", JSON.stringify(clientData));
          } else {
            console.warn("User profile not found in b2b_managers collection.");
          }
        } catch (err) {
          console.error("Auth initialization error:", err.message);
        }

        unsubSnapshot = onSnapshot(collection(db, "b2b_admin_edits"), (snapshot) => {
          const edits = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
          setFirestoreEdits(edits);
        }, (error) => {
          console.error("Orders sync error:", error.message);
        });
      } else {
        setClient(null);
        setIsAdmin(false);
        setFirestoreEdits([]);
        sessionStorage.removeItem("hostelClient");
      }
    });

    return () => {
      unsubAuth();
      unsubSnapshot();
    };
  }, []);

  // Merge static data with live Firestore edits
  const allOrdersMerged = useMemo(() => {
    const extraIds = new Set(firestoreEdits.map(o => o.id));
    // Remove base orders that have been edited in Firestore
    const cleanBase = allHostelOrders.filter(o => !extraIds.has(o.id));
    // Combine clean base with firestore edits, ignoring deleted records
    return [...cleanBase, ...firestoreEdits].filter(o => !o.isDeleted);
  }, [firestoreEdits]);

  // Filter for the specific logged-in client
  const orders = useMemo(() => {
    if (!client) return [];
    if (client.role === "admin") return allOrdersMerged;
    
    // Support both 'properties' (new) and 'partnernames' (existing) fields
    const allowedProperties = client.properties || client.partnernames || [];
    return allOrdersMerged.filter((o) => 
        allowedProperties.includes(o.property) || o.linkedHostel === allowedProperties[0]
    );
  }, [client, allOrdersMerged]);

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
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const userDoc = await getDoc(doc(db, "b2b_managers", userCredential.user.uid));
      
      if (!userDoc.exists()) {
          throw new Error("User record not found in b2b_managers collection.");
      }

      const userData = userDoc.data();
      const clientData = {
        uid: userCredential.user.uid,
        ...userData,
      };

      setClient(clientData);
      setIsAdmin(userData.role === "admin");
      sessionStorage.setItem("hostelClient", JSON.stringify(clientData));
      
      return { success: true, role: userData.role, client: clientData };
    } catch (err) {
      console.error("Login failed:", err);
      return { success: false, error: err.message || "Invalid email or password." };
    }
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