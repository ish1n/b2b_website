import { createContext, useContext, useState, useCallback } from "react";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { db, auth } from "../firebase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [partner, setPartner] = useState(null);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);

    const login = useCallback(async (email, password) => {
        setLoading(true);
        try {
            // 1. Authenticate with Firebase Auth
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // 2. Securely find the manager in b2b_managers using their Auth UID
            const managerRef = doc(db, "b2b_managers", user.uid);
            const managerSnap = await getDoc(managerRef);

            if (!managerSnap.exists()) {
                await signOut(auth);
                throw new Error("No B2B manager profile found. Ensure your Firestore Document ID matches your Auth UID.");
            }

            const managerData = { id: managerSnap.id, ...managerSnap.data() };
            const partners = managerData.partnernames || [];

            if (partners.length === 0) {
                setPartner({ name: managerData.email, location: "Manager Dashboard", id: managerData.id });
                setOrders([]);
                return { success: true };
            }

            // 3. Fetch all orders for all hostels in the partnernames array
            // Chunk array in case it exceeds 10 items (Firestore limit for 'in' queries)
            let fetchedOrders = [];
            for (let i = 0; i < partners.length; i += 10) {
                const chunk = partners.slice(i, i + 10);
                const oq = query(collection(db, "b2b_orders"), where("partnerName", "in", chunk));
                const oSnap = await getDocs(oq);

                oSnap.docs.forEach(d => {
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
                                tenant: tenant,
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
                            tenant: tenant,
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
            }

            setPartner({ name: managerData.email, location: "Manager Dashboard", id: managerData.id });
            setOrders(fetchedOrders);
            return { success: true };
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
        } catch (err) {
            console.error(err);
        }
    }, []);

    return (
        <AuthContext.Provider value={{ partner, orders, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
