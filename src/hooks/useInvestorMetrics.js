import { useEffect, useState } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase";

const DEFAULT_MONTHLY_REVENUE = [
  { month: "Nov 2024", b2cRevenue: 5062, b2bRevenue: 0 },
  { month: "Dec 2024", b2cRevenue: 4544, b2bRevenue: 0 },
  { month: "Jan 2025", b2cRevenue: 2756, b2bRevenue: 0 },
  { month: "Feb 2025", b2cRevenue: 4115, b2bRevenue: 0 },
  { month: "Mar 2025", b2cRevenue: 3696, b2bRevenue: 0 },
  { month: "Apr 2025", b2cRevenue: 11390, b2bRevenue: 0 },
  { month: "May 2025", b2cRevenue: 2270, b2bRevenue: 1485 },
  { month: "Jun 2025", b2cRevenue: 2089, b2bRevenue: 0 },
  { month: "Jul 2025", b2cRevenue: 1621, b2bRevenue: 28050 },
  { month: "Aug 2025", b2cRevenue: 2573, b2bRevenue: 119570 },
  { month: "Sep 2025", b2cRevenue: 159, b2bRevenue: 105875 },
  { month: "Oct 2025", b2cRevenue: 408, b2bRevenue: 56599 },
  { month: "Nov 2025", b2cRevenue: 5000, b2bRevenue: 68491 },
  { month: "Dec 2025", b2cRevenue: 10346, b2bRevenue: 49620 },
  { month: "Jan 2026", b2cRevenue: 5038, b2bRevenue: 54123 },
  { month: "Feb 2026", b2cRevenue: 18233, b2bRevenue: 147510 },
  { month: "Mar 2026", b2cRevenue: 15585, b2bRevenue: 104112 },
];

const DEFAULT_REVENUE_STREAMS = {
  b2c: [
    "Wash & Iron",
    "Wash & Fold",
    "Dry Cleaning (clothes, shoes, bags, handbags & more)",
  ],
  b2b: [
    "Wash & Fold",
    "Wash & Iron",
    "Dry Cleaning",
  ],
};

const DEFAULT_METRICS = {
  totalRevenue: 343361,
  totalB2cRevenue: 38856,
  totalB2bRevenue: 304505,
  b2cShare: 11.3,
  b2bShare: 88.7,
  monthlyAverage: 114453.67,
  arrr: 1373444,
  gmv: 910536,
  qoqGrowthPct: 80.3,
  b2cMarginPct: 67,
  b2bMarginPct: 55,
  reportTitle: "Andes Net Profits & Monthly Revenue",
  reportUpdatedOn: "05 Apr 2026",
  summaryPeriod: "Jan-Mar 2026",
  growthComparisonPeriod: "Q4 2025 to Q1 2026",
  ebitdaBreakdown: {
    monthLabel: "Feb 2026",
    revenue: 165743,
    variableCost: 76824,
    fixedCost: 93000,
    ebitda: -4081,
  },
  revenueStreams: DEFAULT_REVENUE_STREAMS,
  monthlyRevenue: DEFAULT_MONTHLY_REVENUE,
};

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeRevenueStreams(streams) {
  const source = streams && typeof streams === "object" ? streams : {};

  const normalizeList = (value, fallback) => {
    if (Array.isArray(value)) {
      const cleaned = value.map((item) => `${item}`.trim()).filter(Boolean);
      return cleaned.length > 0 ? cleaned : fallback;
    }

    if (typeof value === "string") {
      const cleaned = value
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean);

      return cleaned.length > 0 ? cleaned : fallback;
    }

    return fallback;
  };

  return {
    b2c: normalizeList(source.b2c, DEFAULT_REVENUE_STREAMS.b2c),
    b2b: normalizeList(source.b2b, DEFAULT_REVENUE_STREAMS.b2b),
  };
}

function normalizeMonthlyRevenue(monthlyRevenue) {
  const source = Array.isArray(monthlyRevenue) && monthlyRevenue.length > 0
    ? monthlyRevenue
    : DEFAULT_MONTHLY_REVENUE;

  return source.map((point, index) => {
    const fallback = DEFAULT_MONTHLY_REVENUE[index] || DEFAULT_MONTHLY_REVENUE[DEFAULT_MONTHLY_REVENUE.length - 1];
    const b2cRevenue = toNumber(point?.b2cRevenue, fallback.b2cRevenue);
    const b2bRevenue = toNumber(point?.b2bRevenue, fallback.b2bRevenue);
    const totalRevenue = b2cRevenue + b2bRevenue;
    const b2cShare = totalRevenue > 0 ? Number(((b2cRevenue / totalRevenue) * 100).toFixed(2)) : 0;
    const b2bShare = totalRevenue > 0 ? Number(((b2bRevenue / totalRevenue) * 100).toFixed(2)) : 0;

    return {
      month: point?.month || fallback.month,
      b2cRevenue,
      b2bRevenue,
      totalRevenue,
      b2cShare,
      b2bShare,
    };
  });
}

export function normalizeInvestorMetrics(rawMetrics = {}) {
  const merged = {
    ...DEFAULT_METRICS,
    ...rawMetrics,
    ebitdaBreakdown: {
      ...DEFAULT_METRICS.ebitdaBreakdown,
      ...(rawMetrics.ebitdaBreakdown || {}),
    },
    revenueStreams: normalizeRevenueStreams(rawMetrics.revenueStreams),
  };

  const monthlyRevenue = normalizeMonthlyRevenue(rawMetrics.monthlyRevenue);
  const ebitdaRevenue = toNumber(merged.ebitdaBreakdown.revenue, DEFAULT_METRICS.ebitdaBreakdown.revenue);
  const ebitdaVariableCost = toNumber(merged.ebitdaBreakdown.variableCost, DEFAULT_METRICS.ebitdaBreakdown.variableCost);
  const ebitdaFixedCost = toNumber(merged.ebitdaBreakdown.fixedCost, DEFAULT_METRICS.ebitdaBreakdown.fixedCost);

  return {
    reportTitle: merged.reportTitle || DEFAULT_METRICS.reportTitle,
    reportUpdatedOn: merged.reportUpdatedOn || DEFAULT_METRICS.reportUpdatedOn,
    summaryPeriod: merged.summaryPeriod || DEFAULT_METRICS.summaryPeriod,
    growthComparisonPeriod: merged.growthComparisonPeriod || DEFAULT_METRICS.growthComparisonPeriod,
    totalRevenue: toNumber(merged.totalRevenue, DEFAULT_METRICS.totalRevenue),
    totalB2cRevenue: toNumber(merged.totalB2cRevenue, DEFAULT_METRICS.totalB2cRevenue),
    totalB2bRevenue: toNumber(merged.totalB2bRevenue, DEFAULT_METRICS.totalB2bRevenue),
    b2cShare: toNumber(merged.b2cShare, DEFAULT_METRICS.b2cShare),
    b2bShare: toNumber(merged.b2bShare, DEFAULT_METRICS.b2bShare),
    monthlyAverage: toNumber(merged.monthlyAverage, DEFAULT_METRICS.monthlyAverage),
    arrr: toNumber(merged.arrr, DEFAULT_METRICS.arrr),
    gmv: toNumber(merged.gmv, DEFAULT_METRICS.gmv),
    qoqGrowthPct: toNumber(merged.qoqGrowthPct, DEFAULT_METRICS.qoqGrowthPct),
    b2cMarginPct: toNumber(merged.b2cMarginPct, DEFAULT_METRICS.b2cMarginPct),
    b2bMarginPct: toNumber(merged.b2bMarginPct, DEFAULT_METRICS.b2bMarginPct),
    ebitdaBreakdown: {
      monthLabel: merged.ebitdaBreakdown.monthLabel || DEFAULT_METRICS.ebitdaBreakdown.monthLabel,
      revenue: ebitdaRevenue,
      variableCost: ebitdaVariableCost,
      fixedCost: ebitdaFixedCost,
      ebitda: Math.round(ebitdaRevenue - ebitdaVariableCost - ebitdaFixedCost),
    },
    revenueStreams: normalizeRevenueStreams(merged.revenueStreams),
    monthlyRevenue,
  };
}

export function useInvestorMetrics() {
  const [metrics, setMetrics] = useState(() => normalizeInvestorMetrics(DEFAULT_METRICS));
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const docRef = doc(db, "company_config", "investor_dashboard");

  useEffect(() => {
    async function fetchMetrics() {
      try {
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setMetrics(normalizeInvestorMetrics(docSnap.data()));
        } else {
          const normalizedDefaults = normalizeInvestorMetrics(DEFAULT_METRICS);
          await setDoc(docRef, normalizedDefaults);
          setMetrics(normalizedDefaults);
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
      const normalizedMetrics = normalizeInvestorMetrics(newMetrics);
      await setDoc(docRef, normalizedMetrics);
      setMetrics(normalizedMetrics);
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
