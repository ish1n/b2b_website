import { createContext, useContext, useState, useCallback, useEffect, useMemo } from "react";
import { signInWithEmailAndPassword, signOut as firebaseSignOut, onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../firebase";
import { getDoc, doc, onSnapshot, collection, setDoc } from "firebase/firestore";
import { ORDER_CATEGORIES, ORDER_TYPES } from "../constants/orders";
import { normalizeOrder } from "../utils/orderNormalization";

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

  const [firestoreEdits, setFirestoreEdits] = useState([]);
  const [b2bOrders, setB2bOrders] = useState([]);
  const [websiteOrders, setWebsiteOrders] = useState([]);

  useEffect(() => {
    let unsubscribeEdits = () => { };
    let unsubscribeB2bOrders = () => { };
    let unsubscribeWebsiteOrders = () => { };

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      unsubscribeEdits();
      unsubscribeB2bOrders();
      unsubscribeWebsiteOrders();

      if (!firebaseUser) {
        setClient(null);
        setIsAdmin(false);
        setFirestoreEdits([]);
        setB2bOrders([]);
        setWebsiteOrders([]);
        sessionStorage.removeItem("hostelClient");
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, "b2b_managers", firebaseUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const clientData = { uid: firebaseUser.uid, ...userData };
          setClient(clientData);
          setIsAdmin(userData.role === "admin");
          sessionStorage.setItem("hostelClient", JSON.stringify(clientData));
        } else {
          console.warn("User profile not found in b2b_managers collection.");
        }
      } catch (error) {
        console.error("Auth initialization error:", error.message);
      }

      unsubscribeEdits = onSnapshot(
        collection(db, "b2b_admin_edits"),
        (snapshot) => setFirestoreEdits(snapshot.docs.map((docSnapshot) => normalizeOrder({ id: docSnapshot.id, ...docSnapshot.data() }, "admin"))),
        (error) => console.error("Orders sync error:", error.message),
      );

      unsubscribeB2bOrders = onSnapshot(
        collection(db, "b2b_orders"),
        (snapshot) => setB2bOrders(snapshot.docs.map((docSnapshot) => normalizeOrder({ id: docSnapshot.id, ...docSnapshot.data() }, "b2b"))),
        (error) => console.error("B2B Orders sync error:", error.message),
      );

      unsubscribeWebsiteOrders = onSnapshot(
        collection(db, "orders"),
        (snapshot) => {
          const liveWebsiteOrders = snapshot.docs
            .map((docSnapshot) => normalizeOrder({ id: docSnapshot.id, ...docSnapshot.data() }, "website"))
            .filter((order) => order.date >= new Date().toISOString().split("T")[0]);
          setWebsiteOrders(liveWebsiteOrders);
        },
        (error) => console.error("Website Orders sync error:", error.message),
      );
    });

    return () => {
      unsubscribeAuth();
      unsubscribeEdits();
      unsubscribeB2bOrders();
      unsubscribeWebsiteOrders();
    };
  }, []);


  const allOrdersMerged = useMemo(() => {
    const editedIds = new Set(firestoreEdits.map((order) => order.id));
    const cleanB2b = b2bOrders.filter((order) => !editedIds.has(order.id));
    const cleanWebsite = websiteOrders.filter((order) => !editedIds.has(order.id));

    return [...firestoreEdits, ...cleanB2b, ...cleanWebsite].filter((order) => !order.isDeleted);
  }, [b2bOrders, firestoreEdits, websiteOrders]);

  const orders = useMemo(() => {
    if (!client) return [];
    if (client.role === "admin") return allOrdersMerged;

    const allowedProperties = client.properties || client.partnernames || [];
    const normalizedAllowed = allowedProperties.map((property) => property.toLowerCase());

    return allOrdersMerged.filter((order) => {
      const propertyName = (order.property || "").toLowerCase();
      const linkedName = (order.linkedHostel || "").toLowerCase();
      return normalizedAllowed.includes(propertyName) || linkedName === normalizedAllowed[0];
    });
  }, [allOrdersMerged, client]);

  const addIssue = useCallback(async (newIssue) => {
    try {
      await setDoc(doc(db, "b2b_admin_edits", String(newIssue.id)), normalizeOrder({
        ...newIssue,
        category: ORDER_CATEGORIES.ISSUES,
        type: ORDER_TYPES.ISSUE,
      }, "admin"));
    } catch (error) {
      console.error("Error raising issue to Firestore:", error);
      setFirestoreEdits((current) => [...current.filter((issue) => issue.id !== newIssue.id), normalizeOrder(newIssue, "admin")]);
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
    } catch (error) {
      console.error("Login failed:", error);
      return { success: false, error: error.message || "Invalid email or password." };
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
