// src/pages/ClientDashboard.jsx
import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useHostelAuth } from "../context/HostelAuthContext";
import { CATEGORIES } from "../data/hostelOrders";
import ExpandableOrderRow from "../components/ExpandableOrderRow";
import {
  FiLogOut, FiFilter, FiCalendar, FiX, FiDownload,
  FiPackage, FiShoppingBag, FiTruck, FiUsers,
} from "react-icons/fi";
import { BiRupee } from "react-icons/bi";
import { MdScale } from "react-icons/md";
import BrandLogo from "../components/BrandLogo";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";

// ── CSV export helper ──
function exportCSV(rows, filename) {
  if (!rows.length) return;
  const headers = ["Order ID", "Date", "Property", "Category", "Clothes", "Weight", "Students", "Status", "Customer", "Phone"];
  const csvRows = [
    headers.join(","),
    ...rows.map((o) =>
      [
        o.id,
        o.date,
        `"${o.property}"`,
        o.category,
        o.items ?? "",
        o.weight ?? "",
        o.studentCount ?? "",
        o.status,
        `"${o.customerName || ""}"`,
        o.customerNumber || "",
      ].join(",")
    ),
  ];
  const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Category icon map (react-icons) ──
const CAT_ICONS = {
  LINEN: <FiShoppingBag />,
  STUDENT_LAUNDRY: <FiPackage />,
  B2C_RETAIL: <FiShoppingBag />,
  AIRBNB: <FiTruck />,
  BULK_LAUNDRY: <FiTruck />,
  ISSUES: <FiFilter />,
};

export default function ClientDashboard() {
  const { client, orders, logout } = useHostelAuth();
  const navigate = useNavigate();
  const isGroup = client?.isGroup && client.properties?.length > 1;

  // Filters
  const [propertyFilter, setPropertyFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Filtered orders
  const filtered = useMemo(() => {
    let list = orders;
    if (propertyFilter !== "all") list = list.filter((o) => o.property === propertyFilter);
    if (statusFilter !== "all") list = list.filter((o) => o.status === statusFilter);
    if (dateFrom) list = list.filter((o) => o.date >= dateFrom);
    if (dateTo) list = list.filter((o) => o.date <= dateTo);
    return list.sort((a, b) => b.date.localeCompare(a.date));
  }, [orders, propertyFilter, statusFilter, dateFrom, dateTo]);

  // KPIs
  const totalOrders = filtered.length;
  const totalItems = filtered.reduce((s, o) => s + (o.items || 0), 0);
  const totalWeight = filtered.reduce((s, o) => s + (o.weight || 0), 0);
  const uniqueStatuses = [...new Set(orders.map((o) => o.status))];

  // Category breakdown
  const categoryStats = useMemo(() => {
    const map = {};
    filtered.forEach((o) => {
      if (!map[o.category]) map[o.category] = { count: 0, items: 0 };
      map[o.category].count++;
      map[o.category].items += o.items || 0;
    });
    return Object.entries(map).map(([key, val]) => ({
      key,
      ...(CATEGORIES[key] || {}),
      ...val,
    }));
  }, [filtered]);

  const hasActiveFilters = propertyFilter !== "all" || statusFilter !== "all" || dateFrom || dateTo;

  const clearFilters = () => {
    setPropertyFilter("all");
    setStatusFilter("all");
    setDateFrom("");
    setDateTo("");
  };

  const handleExport = useCallback(() => {
    exportCSV(filtered, `${(client?.name || "orders").replace(/\s+/g, "_")}_orders.csv`);
  }, [filtered, client]);

  return (
    <div className="min-h-screen bg-slate-50" style={{ fontFamily: "Poppins, sans-serif" }}>
      {/* Top nav */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 py-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand flex items-center justify-center">
              <BrandLogo className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 leading-tight">{client?.name}</h1>
              <p className="text-xs text-gray-500">Order History Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleExport}
              className="inline-flex items-center gap-2 text-sm font-semibold text-brand hover:text-brand-dark border border-brand-200 bg-blue-50 px-4 py-2 rounded-xl transition-all hover:bg-blue-100"
            >
              <FiDownload size={15} /> Export CSV
            </button>
            <button
              onClick={() => { logout(); navigate("/login"); }}
              className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-red-500 transition-colors font-medium"
            >
              <FiLogOut size={16} /> Sign Out
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Orders", value: totalOrders, color: "#1976D2", bgColor: "bg-blue-50", Icon: FiPackage },
            { label: "Total Items", value: totalItems.toLocaleString(), color: "#7C3AED", bgColor: "bg-purple-50", Icon: FiShoppingBag },
            { label: "Total Weight", value: `${totalWeight.toFixed(1)} KG`, color: "#D97706", bgColor: "bg-orange-50", Icon: MdScale },
          ].map((kpi) => (
            <div
              key={kpi.label}
              className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 flex items-start gap-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
            >
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 p-3 ${kpi.bgColor}`}
              >
                <kpi.Icon size={22} style={{ color: kpi.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-3xl font-bold text-gray-900 leading-tight tracking-tight">{kpi.value}</p>
                <p className="text-sm font-medium text-gray-400 mt-1 uppercase tracking-wider">{kpi.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-brand transition-colors"
            >
              <FiFilter size={16} />
              Filters
              {hasActiveFilters && (
                <span className="bg-brand text-white text-xs px-2 py-0.5 rounded-full">Active</span>
              )}
            </button>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="text-xs text-red-500 hover:text-red-700 font-medium inline-flex items-center gap-1">
                <FiX size={12} /> Clear All
              </button>
            )}
          </div>

          {showFilters && (
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
              {isGroup && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Property</label>
                  <select
                    value={propertyFilter}
                    onChange={(e) => setPropertyFilter(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 text-sm px-3 py-2 focus:outline-none focus:border-brand"
                  >
                    <option value="all">All Properties</option>
                    {client.properties.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 text-sm px-3 py-2 focus:outline-none focus:border-brand"
                >
                  <option value="all">All Status</option>
                  {uniqueStatuses.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">From Date</label>
                <div className="relative">
                  <FiCalendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 text-sm pl-9 pr-3 py-2 focus:outline-none focus:border-brand" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">To Date</label>
                <div className="relative">
                  <FiCalendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 text-sm pl-9 pr-3 py-2 focus:outline-none focus:border-brand" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Category Breakdown */}
        {categoryStats.length > 0 && (
          <div>
            <h2 className="text-base font-bold text-gray-800 mb-3">Category Breakdown</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {categoryStats.map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => navigate(`/client/category/${cat.key}`)}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-left hover:shadow-md hover:border-brand-200 transition-all group"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
                      style={{ backgroundColor: cat.color }}
                    >
                      {CAT_ICONS[cat.key] || <FiPackage />}
                    </div>
                    <span className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors uppercase tracking-tight">
                      {cat.label}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div>
                      <p className="text-xs text-gray-400 font-medium">Orders</p>
                      <p className="text-lg font-bold" style={{ color: cat.color }}>{cat.count}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 font-medium">Items</p>
                      <p className="text-sm font-bold text-gray-700">{cat.items}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Orders Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-800">All Orders ({filtered.length})</h2>
            <button
              onClick={handleExport}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand hover:text-brand-dark transition-colors"
            >
              <FiDownload size={13} /> Export
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/80">
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                  {isGroup && (
                    <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Property</th>
                  )}
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center gap-1.5"><FiShoppingBag size={13} className="text-gray-400" /> Clothes</div>
                  </th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center gap-1.5"><MdScale size={13} className="text-gray-400" /> Weight (KG)</div>
                  </th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center gap-1.5"><FiUsers size={14} className="text-gray-400" /> Students</div>
                  </th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider w-10"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={isGroup ? 9 : 8} className="text-center py-16 text-gray-400 text-sm">
                      No orders found matching your filters.
                    </td>
                  </tr>
                ) : (
                  filtered.map((o) => (
                    <ExpandableOrderRow key={o.id} order={o} showProperty={isGroup} />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
