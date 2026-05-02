import { createContext, useContext, useState, useCallback, useEffect, useMemo } from "react";
import { signInWithEmailAndPassword, signOut as firebaseSignOut, onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../firebase";
import { getDoc, doc, onSnapshot, collection, setDoc, query, where } from "firebase/firestore";
import { ORDER_CATEGORIES, ORDER_TYPES, ORDER_STATUSES } from "../constants/orders";
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
  const [cartOrders, setCartOrders] = useState([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  useEffect(() => {
    let unsubscribeEdits = () => { };
    let unsubscribeB2bOrders = () => { };
    let unsubscribeWebsiteOrders = () => { };
    let unsubscribeCartDetails = () => { };
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      unsubscribeEdits();
      unsubscribeB2bOrders();
      unsubscribeWebsiteOrders();
      unsubscribeCartDetails();

      if (!firebaseUser) {
        setClient(null);
        setIsAdmin(false);
        setFirestoreEdits([]);
        setB2bOrders([]);
        setWebsiteOrders([]);
        setCartOrders([]);
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

      let loadedCount = 0;
      const checkAllLoaded = () => {
        loadedCount++;
        if (loadedCount >= 4) setIsDataLoaded(true);
      };

      unsubscribeEdits = onSnapshot(
        collection(db, "b2b_admin_edits"),
        (snapshot) => {
          setFirestoreEdits(snapshot.docs.map((docSnapshot) => normalizeOrder({ id: docSnapshot.id, ...docSnapshot.data() }, "admin")));
          checkAllLoaded();
        },
        (error) => {
          console.error("Orders sync error:", error.message);
          checkAllLoaded();
        },
      );

      unsubscribeB2bOrders = onSnapshot(
        collection(db, "b2b_orders"),
        (snapshot) => {
          setB2bOrders(snapshot.docs.map((docSnapshot) => normalizeOrder({ id: docSnapshot.id, ...docSnapshot.data() }, "b2b")));
          checkAllLoaded();
        },
        (error) => {
          console.error("B2B Orders sync error:", error.message);
          checkAllLoaded();
        },
      );

      unsubscribeWebsiteOrders = onSnapshot(
        collection(db, "orders"),
        (snapshot) => {
          setWebsiteOrders(
            snapshot.docs.map((docSnapshot) =>
              normalizeOrder({ id: docSnapshot.id, ...docSnapshot.data() }, "website")
            )
          );
          checkAllLoaded();
        },
        (error) => {
          console.error("Website Orders sync error:", error.message);
          checkAllLoaded();
        },
      );

      unsubscribeCartDetails = onSnapshot(
        collection(db, "cartdetails"),
        (snapshot) => {
          setCartOrders(
            snapshot.docs.map((docSnapshot) =>
              normalizeOrder({ id: docSnapshot.id, ...docSnapshot.data() }, "cartdetails")
            )
          );
          checkAllLoaded();
        },
        (error) => {
          console.error("Cartdetails sync error:", error.message);
          checkAllLoaded();
        },
      );
    });

    return () => {
      unsubscribeAuth();
      unsubscribeEdits();
      unsubscribeB2bOrders();
      unsubscribeWebsiteOrders();
      unsubscribeCartDetails();
    };
  }, []);


  const allOrdersMerged = useMemo(() => {
    // Partition 1: Build a map of "Primary" records (Admin edits & B2B logged orders)
    // In our new architecture:
    // - b2b_admin_edits stores Regular Orders & Issues
    // - b2b_orders stores Hostels & Hotels & Airbnb
    const primaryRecordsMap = new Map();

    // 1. Base Data: Cartdetails
    cartOrders.forEach(order => {
      if (order.status === ORDER_STATUSES.CANCELLED) return;
      primaryRecordsMap.set(order.id, order);
    });

    // 2. Base Data: Website Orders
    websiteOrders.forEach((order) => {
      if (order.status === ORDER_STATUSES.CANCELLED) return;
      const existing = primaryRecordsMap.get(order.id);
      if (existing) {
        primaryRecordsMap.set(order.id, { ...existing, ...order });
      } else {
        primaryRecordsMap.set(order.id, order);
      }
    });

    // 3. Base Data: B2B Orders
    b2bOrders.forEach(order => {
      const existing = primaryRecordsMap.get(order.id);
      if (existing) {
        primaryRecordsMap.set(order.id, { ...existing, ...order });
      } else {
        primaryRecordsMap.set(order.id, order);
      }
    });
    
    // 4. Overrides: Admin Edits (Regular/Issues)
    firestoreEdits.forEach(order => {
      const existing = primaryRecordsMap.get(order.id);
      if (existing) {
        const merged = { ...existing, ...order };
        if (!order.deliveryDate && existing.deliveryDate) merged.deliveryDate = existing.deliveryDate;
        if (!order.customerNumber && existing.customerNumber) merged.customerNumber = existing.customerNumber;
        if (!order.channel && existing.channel) merged.channel = existing.channel;
        primaryRecordsMap.set(order.id, merged);
      } else {
        primaryRecordsMap.set(order.id, order);
      }
    });

    const merged = [...primaryRecordsMap.values()];
    return merged.filter((order) => !order.isDeleted);
  }, [cartOrders, b2bOrders, firestoreEdits, websiteOrders]);

  const orders = useMemo(() => {
    if (!client) return [];
    if (client.role === "admin") return allOrdersMerged;

    const allowedProperties = client.properties || client.partnernames || [];
    const normalizedAllowed = allowedProperties.map((property) => property.toLowerCase());

    return allOrdersMerged.filter((order) => {
      const propertyName = (order.property || "").toLowerCase();
      const linkedName = (order.linkedHostel || "").toLowerCase();
      // Check if any of the manager's allowed properties match the order's property (partial match allowed)
      return normalizedAllowed.some(allowed => propertyName.includes(allowed) || linkedName.includes(allowed));
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
    <HostelAuthContext.Provider value={{ client, orders, isAdmin, login, logout, setAuthenticatedUser, addIssue, isDataLoaded }}>
      {children}
    </HostelAuthContext.Provider>
  );
}

export function useHostelAuth() {
  const ctx = useContext(HostelAuthContext);
  if (!ctx) throw new Error("useHostelAuth must be inside HostelAuthProvider");
  return ctx;
}
