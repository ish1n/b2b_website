import { useEffect, useState } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase";

const DEFAULT_CHART_DATA = [
  { month: "Jan", revenue: 2200000, cashBurn: 1800000 },
  { month: "Feb", revenue: 2550000, cashBurn: 1920000 },
  { month: "Mar", revenue: 2860000, cashBurn: 2010000 },
  { month: "Apr", revenue: 3190000, cashBurn: 2140000 },
  { month: "May", revenue: 3520000, cashBurn: 2230000 },
];

const DEFAULT_METRICS = {
  revenue: 18200000,
  gmv: 64500000,
  arrr: 29600000,
  cogs: 9682400,
  opex: 4397600,
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
  chartData: DEFAULT_CHART_DATA,
};

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeChartData(chartData) {
  const source = Array.isArray(chartData) && chartData.length > 0 ? chartData : DEFAULT_CHART_DATA;

  return DEFAULT_CHART_DATA.map((fallbackPoint, index) => {
    const point = source[index] || {};
    return {
      month: point.month || fallbackPoint.month,
      revenue: toNumber(point.revenue, fallbackPoint.revenue),
      cashBurn: toNumber(point.cashBurn, fallbackPoint.cashBurn),
    };
  });
}

function deriveLegacyCosts(data) {
  const revenue = toNumber(data.revenue, DEFAULT_METRICS.revenue);
  const marginPct = toNumber(data.marginPct, DEFAULT_METRICS.marginPct);
  const ebitda = toNumber(data.ebitda, DEFAULT_METRICS.ebitda);
  const grossProfit = revenue * (marginPct / 100);

  return {
    cogs: Math.max(0, Math.round(revenue - grossProfit)),
    opex: Math.max(0, Math.round(grossProfit - ebitda)),
  };
}

export function normalizeInvestorMetrics(rawMetrics = {}) {
  const merged = { ...DEFAULT_METRICS, ...rawMetrics };
  const hasExplicitCosts = rawMetrics.cogs !== undefined || rawMetrics.opex !== undefined;
  const legacyCosts = hasExplicitCosts ? null : deriveLegacyCosts(merged);

  const revenue = toNumber(merged.revenue, DEFAULT_METRICS.revenue);
  const cogs = toNumber(hasExplicitCosts ? merged.cogs : legacyCosts.cogs, DEFAULT_METRICS.cogs);
  const opex = toNumber(hasExplicitCosts ? merged.opex : legacyCosts.opex, DEFAULT_METRICS.opex);
  const grossProfit = revenue - cogs;
  const marginPct = revenue > 0 ? Number(((grossProfit / revenue) * 100).toFixed(1)) : 0;
  const ebitda = Math.round(grossProfit - opex);

  return {
    ...merged,
    revenue,
    gmv: toNumber(merged.gmv, DEFAULT_METRICS.gmv),
    arrr: toNumber(merged.arrr, DEFAULT_METRICS.arrr),
    cogs,
    opex,
    marginPct,
    ebitda,
    cac: toNumber(merged.cac, DEFAULT_METRICS.cac),
    clv: toNumber(merged.clv, DEFAULT_METRICS.clv),
    valuation: toNumber(merged.valuation, DEFAULT_METRICS.valuation),
    targetRaise: toNumber(merged.targetRaise, DEFAULT_METRICS.targetRaise),
    instrument: merged.instrument || DEFAULT_METRICS.instrument,
    liabilities: toNumber(merged.liabilities, DEFAULT_METRICS.liabilities),
    founderEquity: toNumber(merged.founderEquity, DEFAULT_METRICS.founderEquity),
    seedInvestors: toNumber(merged.seedInvestors, DEFAULT_METRICS.seedInvestors),
    chartData: normalizeChartData(merged.chartData),
  };
}

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
          setMetrics(normalizeInvestorMetrics(docSnap.data()));
        } else {
          await setDoc(docRef, DEFAULT_METRICS);
          setMetrics(DEFAULT_METRICS);
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
      await setDoc(docRef, normalizedMetrics, { merge: true });
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
