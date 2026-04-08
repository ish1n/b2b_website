import { useState, useEffect } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase";


// Default metrics shape must match what InvestorMetrics.jsx expects.
const DEFAULT_METRICS = {
    reportTitle: "Andes Investor Report — Jan–Mar 2026",
    reportUpdatedOn: "April 2026",
    summaryPeriod: "Jan–Mar 2026",
    growthComparisonPeriod: "Q4 2025 vs Q1 2026",

    // Snapshot KPIs
    totalRevenue: 5400000,
    qoqGrowthPct: 32.5,
    arrr: 21600000,
    gmv: 64500000,

    // Revenue mix (Jan–Mar 2026)
    b2bShare: 68,
    b2cShare: 32,
    totalB2bRevenue: 3672000,
    totalB2cRevenue: 1728000,

    // Margin
    b2cMarginPct: 67,
    b2bMarginPct: 54.6,

    // EBITDA snapshot (Feb 2026)
    ebitdaBreakdown: {
        monthLabel: "Feb 2026",
        revenue: 1820000,
        variableCost: 820000,
        fixedCost: 680000,
        ebitda: 320000,
    },

    // Revenue streams
    revenueStreams: {
        b2c: [
            "Wash & Fold",
            "Dry Cleaning",
            "Express Delivery",
        ],
        b2b: [
            "MIT Hostel",
            "Hostel 99",
            "IBIS Hotel",
            "Airbnb Partner",
            "Corporate Bulk",
        ],
    },

    // Monthly trend (Nov 2024 – Mar 2026)
    monthlyRevenue: [
        { month: "Nov 2024", b2cRevenue: 320000,  b2bRevenue: 580000,  totalRevenue: 900000,  b2cShare: 35.6, b2bShare: 64.4 },
        { month: "Dec 2024", b2cRevenue: 340000,  b2bRevenue: 620000,  totalRevenue: 960000,  b2cShare: 35.4, b2bShare: 64.6 },
        { month: "Jan 2025", b2cRevenue: 360000,  b2bRevenue: 660000,  totalRevenue: 1020000, b2cShare: 35.3, b2bShare: 64.7 },
        { month: "Feb 2025", b2cRevenue: 380000,  b2bRevenue: 700000,  totalRevenue: 1080000, b2cShare: 35.2, b2bShare: 64.8 },
        { month: "Mar 2025", b2cRevenue: 400000,  b2bRevenue: 740000,  totalRevenue: 1140000, b2cShare: 35.1, b2bShare: 64.9 },
        { month: "Apr 2025", b2cRevenue: 420000,  b2bRevenue: 780000,  totalRevenue: 1200000, b2cShare: 35.0, b2bShare: 65.0 },
        { month: "May 2025", b2cRevenue: 450000,  b2bRevenue: 830000,  totalRevenue: 1280000, b2cShare: 35.2, b2bShare: 64.8 },
        { month: "Jun 2025", b2cRevenue: 480000,  b2bRevenue: 880000,  totalRevenue: 1360000, b2cShare: 35.3, b2bShare: 64.7 },
        { month: "Jul 2025", b2cRevenue: 500000,  b2bRevenue: 920000,  totalRevenue: 1420000, b2cShare: 35.2, b2bShare: 64.8 },
        { month: "Aug 2025", b2cRevenue: 520000,  b2bRevenue: 960000,  totalRevenue: 1480000, b2cShare: 35.1, b2bShare: 64.9 },
        { month: "Sep 2025", b2cRevenue: 540000,  b2bRevenue: 1000000, totalRevenue: 1540000, b2cShare: 35.1, b2bShare: 64.9 },
        { month: "Oct 2025", b2cRevenue: 560000,  b2bRevenue: 1060000, totalRevenue: 1620000, b2cShare: 34.6, b2bShare: 65.4 },
        { month: "Nov 2025", b2cRevenue: 580000,  b2bRevenue: 1080000, totalRevenue: 1660000, b2cShare: 35.0, b2bShare: 65.0 },
        { month: "Dec 2025", b2cRevenue: 600000,  b2bRevenue: 1200000, totalRevenue: 1800000, b2cShare: 33.3, b2bShare: 66.7 },
        { month: "Jan 2026", b2cRevenue: 540000,  b2bRevenue: 1160000, totalRevenue: 1700000, b2cShare: 31.8, b2bShare: 68.2 },
        { month: "Feb 2026", b2cRevenue: 580000,  b2bRevenue: 1240000, totalRevenue: 1820000, b2cShare: 31.9, b2bShare: 68.1 },
        { month: "Mar 2026", b2cRevenue: 608000,  b2bRevenue: 1272000, totalRevenue: 1880000, b2cShare: 32.3, b2bShare: 67.7 },
    ],
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
                    const data = docSnap.data();
                    // Deep-merge with defaults so stale/old Firebase docs
                    // don't crash the UI when nested fields are missing.
                    const merged = {
                        ...DEFAULT_METRICS,
                        ...data,
                        ebitdaBreakdown: {
                            ...DEFAULT_METRICS.ebitdaBreakdown,
                            ...(data.ebitdaBreakdown || {}),
                        },
                        revenueStreams: {
                            ...DEFAULT_METRICS.revenueStreams,
                            ...(data.revenueStreams || {}),
                        },
                        monthlyRevenue: Array.isArray(data.monthlyRevenue) && data.monthlyRevenue.length > 0
                            ? data.monthlyRevenue
                            : DEFAULT_METRICS.monthlyRevenue,
                    };
                    setMetrics(merged);
                } else {
                    // No document yet — write the default shape and use it.
                    await setDoc(docRef, DEFAULT_METRICS);
                    setMetrics(DEFAULT_METRICS);
                }
            } catch (error) {
                console.error("Error fetching investor metrics:", error);
                // Keep DEFAULT_METRICS as fallback on network errors.
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