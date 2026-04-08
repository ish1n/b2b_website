import { useState, useEffect } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase";


// The UI will format them into ₹ Cr / ₹ L automatically.
const DEFAULT_METRICS = {
    revenue: 18200000,    // 1.82 Cr
    gmv: 64500000,
    arrr: 29600000,       // 2.96 Cr
    marginPct: 46.8,
    ebitda: 4120000,
    cac: 184,
    clv: 24800,
    valuation: 180000000,
    targetRaise: 40000000,
    instrument: "Priced Seed Extension",
    liabilities: 4200000,
    founderEquity: 80,
    seedInvestors: 20,
    // Chart Data remains an array of raw values
    chartData: [
        { month: "Jan", revenue: 2200000, cashBurn: 1800000 },
        { month: "Feb", revenue: 2550000, cashBurn: 1920000 },
        { month: "Mar", revenue: 2860000, cashBurn: 2010000 },
        { month: "Apr", revenue: 3190000, cashBurn: 2140000 },
        { month: "May", revenue: 3520000, cashBurn: 2230000 },
    ]
};

export function useInvestorMetrics() {
    const [metrics, setMetrics] = useState(DEFAULT_METRICS);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const docRef = doc(db, "company_config", "investor_dashboard");

    useEffect(() => {
        async function fetchMetrics() {
            try {
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setMetrics(docSnap.data());
                } else {
                    await setDoc(docRef, DEFAULT_METRICS);
                }
            } catch (error) {
                console.error("Error fetching investor metrics:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchMetrics();
    }, []);

    const saveMetrics = async (newMetrics) => {
        setIsSaving(true);
        try {
            await setDoc(docRef, newMetrics, { merge: true });
            setMetrics(newMetrics);
            return true;
        } catch (error) {
            console.error("Error saving investor metrics:", error);
            return false;
        } finally {
            setIsSaving(false);
        }
    };

    return { metrics, loading, isSaving, saveMetrics };
}