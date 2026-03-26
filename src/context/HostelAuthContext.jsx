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

  // NEW: State to hold live orders from the Rider App (b2b_orders)
  const [b2bOrders, setB2bOrders] = useState([]);

  // NEW: State to hold website orders from the native 'orders' collection
  const [websiteOrders, setWebsiteOrders] = useState([]);

  // Listen to Firestore globally for the client to see updates in real-time
  useEffect(() => {
    let unsubSnapshot = () => { };
    let unsubB2bOrders = () => { }; // NEW: cleanup function for b2b_orders
    let unsubWebsiteOrders = () => { }; // NEW: cleanup function for orders (website)

    const unsubAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      unsubSnapshot();
      unsubB2bOrders();

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

        // Existing listener for Admin Edits & Issues
        unsubSnapshot = onSnapshot(collection(db, "b2b_admin_edits"), (snapshot) => {
          const edits = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
          setFirestoreEdits(edits);
        }, (error) => {
          console.error("Orders sync error:", error.message);
        });

        // NEW: Real-time listener for B2B/Airbnb Orders placed via form or Rider App
        unsubB2bOrders = onSnapshot(collection(db, "b2b_orders"), (snapshot) => {
          const liveOrders = snapshot.docs.map(d => {
            const data = d.data();

            // Defensively map fields so the dashboard table can read them even if Rider app created them
            let dateStr = new Date().toISOString().split("T")[0];
            if (data.date) {
              dateStr = data.date;
            } else if (data.createdAt && data.createdAt.toDate) {
              dateStr = data.createdAt.toDate().toISOString().split("T")[0];
            }

            let totalItems = data.items || 0;
            if (!data.items && data.partnerItems) {
              totalItems = Object.values(data.partnerItems).reduce((sum, val) => sum + Number(val), 0);
            }

            return {
              id: d.id,
              ...data,
              property: data.property || data.partnerName || data.location,
              date: dateStr,
              category: data.category || "AIRBNB",
              items: totalItems,
              status: data.status || data.orderStatus || "Pending" // Default to pending if missing
            };
          });
          setB2bOrders(liveOrders);
        }, (error) => {
          console.error("B2B Orders sync error:", error.message);
        });

        // NEW: Real-time listener for Website Orders
        // We filter by date >= today to satisfy the "future orders" requirement
        const todayStr = new Date().toISOString().split("T")[0];
        unsubWebsiteOrders = onSnapshot(collection(db, "orders"), (snapshot) => {
          const liveWebsiteOrders = snapshot.docs.map(d => {
            const data = d.data();
            
            // Defensively map fields
            let dateStr = todayStr;
            if (data.date) {
              dateStr = data.date;
            } else if (data.createdAt && data.createdAt.toDate) {
              dateStr = data.createdAt.toDate().toISOString().split("T")[0];
            }

            return {
              id: d.id,
              ...data,
              property: data.userName || data.customerName || "Website Customer",
              customerName: data.userName || data.customerName || "Website Customer",
              customerNumber: data.userPhone || data.phoneNumber || data.customerPhone || "no contact",
              date: dateStr,
              category: "B2C_RETAIL",
              type: "regular",
              channel: "Website",
              amount: data.totalPrice || data.amount || 0,
              items: data.totalItems || data.items?.length || 0,
              service: data.service || (Array.isArray(data.items) ? data.items.map(i => i.name || i.title).filter(Boolean).join(", ") : "") || "Web Store Order",
              itemsList: Array.isArray(data.items) ? data.items : [],
              address: data.deliveryAddress?.scAddress || data.address || data.shippingAddress || data.userAddress || null,
              status: (data.status === "paid" || data.status === "shipped" || data.status === "processing") ? "Confirmed" : 
                      (data.status === "completed" || data.status === "delivered") ? "Delivered" :
                      data.status || "Pending"
            };
          }).filter(o => o.date >= todayStr); // Ensure only future/current orders are shown as requested
          
          setWebsiteOrders(liveWebsiteOrders);
        }, (error) => {
          console.error("Website Orders sync error:", error.message);
        });

      } else {
        setClient(null);
        setIsAdmin(false);
        setFirestoreEdits([]);
        setB2bOrders([]);
        setWebsiteOrders([]);
        sessionStorage.removeItem("hostelClient");
      }
    });

    return () => {
      unsubAuth();
      unsubSnapshot();
      unsubB2bOrders(); 
      unsubWebsiteOrders(); // Cleanup on unmount
    };
  }, []);

  // Merge static data with live Firestore edits AND the new b2b_orders
  const allOrdersMerged = useMemo(() => {
    // Build a Set of IDs that admin has explicitly edited/created via the dashboard
    const editIds = new Set(firestoreEdits.map(o => o.id));

    // 1. Drop any static order whose ID already has an admin-edit override
    const cleanBase = allHostelOrders.filter(o => !editIds.has(o.id));

    // 2. Drop any b2b_orders (Rider App) or websiteOrders entry whose ID also exists in admin edits.
    //    This prevents the same order appearing twice when an admin edits a live order.
    const cleanB2b = b2bOrders.filter(o => !editIds.has(o.id));
    const cleanWeb = websiteOrders.filter(o => !editIds.has(o.id));

    // 3. Merge all sources; admin edits always win for the same ID.
    //    Finally filter out any soft-deleted records.
    return [...cleanBase, ...firestoreEdits, ...cleanB2b, ...cleanWeb].filter(o => !o.isDeleted);
  }, [firestoreEdits, b2bOrders, websiteOrders]);

  // Filter for the specific logged-in client
  const orders = useMemo(() => {
    if (!client) return [];
    if (client.role === "admin") return allOrdersMerged;

    // Support both 'properties' (new) and 'partnernames' (existing) fields
    const allowedProperties = client.properties || client.partnernames || [];

    // Make filter case-insensitive to ensure "Airbnb Viman Nagar" matches "Airbnb viman nagar"
    const normalizedAllowed = allowedProperties.map(p => p.toLowerCase());

    return allOrdersMerged.filter((o) => {
      const propName = (o.property || "").toLowerCase();
      const linkedName = (o.linkedHostel || "").toLowerCase();
      return normalizedAllowed.includes(propName) || linkedName === normalizedAllowed[0];
    });
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