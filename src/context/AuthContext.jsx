import { createContext, useContext, useState, useCallback } from "react";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { db, auth } from "../firebase";
import { hardcodedOrders, hardcodedManagers } from "../data/mockOrders";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [partner, setPartner] = useState(null);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [allManagers, setAllManagers] = useState([]);

    // Helper: parse order documents into a flat array
    const parseOrders = (docs) => {
        const fetchedOrders = [];
        docs.forEach(d => {
            const data = d.data();
            const tenant = data.partnerName || "Unknown";

            let dateObj = new Date();
            if (data.createdAt && typeof data.createdAt.toDate === 'function') {
                dateObj = data.createdAt.toDate();
            } else if (data.createdAt) {
                dateObj = new Date(data.createdAt);
            }
            const month = dateObj.getMonth() + 1;
            const day = dateObj.getDate();

            if (data.roomOrders && data.roomOrders.length > 0) {
                data.roomOrders.forEach((ro, idx) => {
                    fetchedOrders.push({
                        id: `${d.id}-${idx}`,
                        tenant,
                        date: dateObj.toISOString().split('T')[0],
                        month,
                        day,
                        amount: Number(ro.amount || 0),
                        service: `Room ${ro.roomNo || '?'} - ${ro.customerName || 'Resident'}`,
                        items: parseInt(ro.clothesCount, 10) || 1,
                        status: data.status || "Confirmed"
                    });
                });
            } else {
                fetchedOrders.push({
                    id: d.id,
                    tenant,
                    date: dateObj.toISOString().split('T')[0],
                    month,
                    day,
                    amount: Number(data.amount || 0),
                    service: data.details || "Bulk Base Order",
                    items: 1,
                    status: data.status || "Confirmed"
                });
            }
        });
        return fetchedOrders;
    };

    const getFriendlyName = (managerData) => {
        return managerData.name
            || managerData.displayName
            || (managerData.email
                ? managerData.email.split('@')[0].charAt(0).toUpperCase() + managerData.email.split('@')[0].slice(1)
                : "Manager");
    };

    const login = useCallback(async (email, password) => {
        setLoading(true);
        try {
            // 1. Authenticate with Firebase Auth
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // --- ADMIN HARDCODING INTERCEPT ---
            // If Firebase succeeds and the email matches the CEO, inject hardcoded data
            if (email.toLowerCase() === "ceo@andes.co.in") {
                setIsAdmin(true);

                // Set the admin profile
                setPartner({
                    name: "Andes Admin",
                    location: "Admin Dashboard",
                    id: user.uid
                });

                // Load the hardcoded managers (filtering out the admin themselves)
                // This populates the "B2B Clients Overview" table in AdminDashboard
                const clientsList = hardcodedManagers.filter(m => m.role !== "admin");
                setAllManagers(clientsList);

                // Inject the hardcoded orders mapped from the CSVs
                setOrders(hardcodedOrders);

                return { success: true, isAdmin: true };
            }
            // --- END ADMIN INTERCEPT ---

            // 2. Find the manager in b2b_managers using their Auth UID
            const managerRef = doc(db, "b2b_managers", user.uid);
            const managerSnap = await getDoc(managerRef);

            if (!managerSnap.exists()) {
                await signOut(auth);
                throw new Error("No B2B manager profile found. Ensure your Firestore Document ID matches your Auth UID.");
            }

            const managerData = { id: managerSnap.id, ...managerSnap.data() };
            const friendlyName = getFriendlyName(managerData);

            // 3. Check if user is an Admin (Firestore fallback for other admins)
            if (managerData.role === "admin") {
                setIsAdmin(true);

                // Fetch ALL orders
                const allOrdersSnap = await getDocs(collection(db, "b2b_orders"));
                const allOrders = parseOrders(allOrdersSnap.docs);

                // Fetch ALL managers (for the clients table)
                const managersSnap = await getDocs(collection(db, "b2b_managers"));
                const managers = managersSnap.docs
                    .filter(d => d.data().role !== "admin")
                    .map(d => ({
                        id: d.id,
                        ...d.data(),
                        name: d.data().name || d.data().displayName || (d.data().email ? d.data().email.split('@')[0] : "Unknown")
                    }));

                setAllManagers(managers);
                setPartner({ name: friendlyName, location: "Admin Dashboard", id: managerData.id });
                setOrders(allOrders);
                return { success: true, isAdmin: true };
            }

            // 4. Regular Manager flow
            setIsAdmin(false);
            setAllManagers([]);
            const partners = managerData.partnernames || [];

            if (partners.length === 0) {
                setPartner({ name: friendlyName, location: "Manager Dashboard", id: managerData.id });
                setOrders([]);
                return { success: true, isAdmin: false };
            }

            // Fetch orders for assigned partners (chunked for Firestore 'in' limit)
            let fetchedOrders = [];
            for (let i = 0; i < partners.length; i += 10) {
                const chunk = partners.slice(i, i + 10);
                const oq = query(collection(db, "b2b_orders"), where("partnerName", "in", chunk));
                const oSnap = await getDocs(oq);
                fetchedOrders = fetchedOrders.concat(parseOrders(oSnap.docs));
            }

            setPartner({ name: friendlyName, location: "Manager Dashboard", id: managerData.id });
            setOrders(fetchedOrders);
            return { success: true, isAdmin: false };
        } catch (err) {
            let errorMsg = err.message;
            if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
                errorMsg = "Incorrect email or password.";
            }
            return { success: false, error: errorMsg };
        } finally {
            setLoading(false);
        }
    }, []);

    const logout = useCallback(async () => {
        try {
            await signOut(auth);
            setPartner(null);
            setOrders([]);
            setIsAdmin(false);
            setAllManagers([]);
        } catch (err) {
            console.error(err);
        }
    }, []);

    return (
        <AuthContext.Provider value={{ partner, orders, loading, isAdmin, allManagers, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}