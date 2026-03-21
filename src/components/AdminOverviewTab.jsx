import { useMemo, useState } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import { getCategoryForProperty, CATEGORIES } from "../data/hostelOrders";
import { FiArrowRight, FiX, FiFilter, FiChevronDown, FiTrendingUp } from "react-icons/fi";
import { BiRupee } from "react-icons/bi";
import ExportCSV from "./ExportCSV";
import OrderTable from "./OrderTable";
import AdminOrderModal from "./AdminOrderModal";
const AVATAR_COLORS = ['#1976D2', '#7C3AED', '#059669', '#DC2626', '#D97706', '#0891B2', '#BE185D'];

const ChartTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/90 backdrop-blur-sm border border-gray-100 shadow-xl rounded-xl p-3" style={{ fontFamily: 'DM Sans, sans-serif' }}>
        <p className="text-gray-400 font-bold text-[10px] uppercase tracking-wider mb-1">Mar {label}</p>
        <div className="flex items-center gap-0.5 text-gray-900 font-black text-base">
          <BiRupee size={16} />
          <span>{payload[0].value.toLocaleString()}</span>
        </div>
      </div>
    );
  }
  return null;
};

export default function AdminOverviewTab({ orders, clients, daysInRange }) {
  const [selectedClient, setSelectedClient] = useState(null);
  const [filterType, setFilterType] = useState("All"); // All, Linen, Student
  const [sortConfig, setSortConfig] = useState({ key: 'rev', direction: 'desc' }); // rev, orders, kg
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);

  // New Client Modal states
  const [modalFilterStatus, setModalFilterStatus] = useState("All");
  const [modalFilterProperty, setModalFilterProperty] = useState("All");
  const [selectedModalOrder, setSelectedModalOrder] = useState(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);

  const handleOpenClientModal = (client) => {
    setSelectedClient(client);
    setModalFilterStatus("All");
    setModalFilterProperty("All");
  };

  const regularOrders = useMemo(() => orders.filter(o => o.category !== "ISSUES"), [orders]);

  const dailyRevenue = useMemo(() =>
    daysInRange.map(day => {
      const dayOrders = regularOrders.filter(o => {
        const d = o.date ? parseInt(o.date.split("-")[2], 10) : o.day;
        return d === day;
      });
      return { day, revenue: dayOrders.reduce((s, o) => s + (o.amount || 0), 0) };
    }), [regularOrders, daysInRange]);

  const totalRevenue = useMemo(() => regularOrders.reduce((s, o) => s + (o.amount || 0), 0), [regularOrders]);

  const categoryBreakdown = useMemo(() => {
    const map = {};
    regularOrders.forEach(o => {
      const cat = getCategoryForProperty(o.property || o.tenant);
      if (!map[cat.key]) map[cat.key] = { label: cat.label, color: cat.color, orders: 0, revenue: 0 };
      map[cat.key].orders++;
      map[cat.key].revenue += (o.amount || 0);
    });
    return Object.values(map).map(cat => ({
      ...cat,
      share: totalRevenue > 0 ? (cat.revenue / totalRevenue) * 100 : 0
    })).sort((a, b) => b.revenue - a.revenue);
  }, [regularOrders, totalRevenue]);

  const clientRows = useMemo(() => {
    let rows = clients.map((mgr, idx) => {
      const props = mgr.properties || mgr.partnernames || [];
      const cOrders = orders.filter(o => props.includes(o.property));
      const rev = cOrders.reduce((s, o) => s + (o.amount || 0), 0);
      const kg = cOrders.reduce((s, o) => s + (o.weight || 0), 0);
      const issues = orders.filter(o => o.category === "ISSUES").length;
      const clothes = cOrders.reduce((s, o) => s + (o.items || 0), 0);
      let last = null;
      cOrders.forEach(o => { if (o.date) { const d = new Date(o.date); if (!last || d > last) last = d; } });
      const hostelType = mgr.id === "client-regular" ? "Retail" : cOrders.length > 0 && (cOrders[0].type === "linen" || cOrders[0].category === "LINEN") ? "Linen" : cOrders.length > 0 && cOrders[0].type === "student" ? "Student" : "Other";
      return { ...mgr, idx, rev, kg, clothes, orders: cOrders.length, issues: 0, last, hostelType };
    }).filter(c => c.orders > 0);

    // Filter
    if (filterType !== "All") {
      rows = rows.filter(r => r.hostelType === filterType);
    }

    // Sort
    rows.sort((a, b) => {
      const aVal = a[sortConfig.key] || 0;
      const bVal = b[sortConfig.key] || 0;
      return sortConfig.direction === 'desc' ? bVal - aVal : aVal - bVal;
    });

    return rows;
  }, [clients, orders, filterType, sortConfig]);

  return (
    <div className="space-y-6" style={{ fontFamily: 'DM Sans, sans-serif' }}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm p-6 pb-2 min-w-0">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-[15px] font-bold text-[#0F172A]">Revenue Trend</h2>
              <p className="text-[12px] font-medium text-[#94A3B8]">Daily revenue performance</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={window.innerWidth < 640 ? 220 : 300} debounce={100} minWidth={1} minHeight={1} >
            <AreaChart data={dailyRevenue} margin={{ top: 10, right: 10, left: window.innerWidth < 640 ? -25 : -10, bottom: 0 }}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis 
                dataKey="day" 
                tick={{ fontSize: 10, fill: '#94A3B8', fontWeight: 500 }} 
                axisLine={false} 
                tickLine={false} 
                dy={10} 
                interval={window.innerWidth < 640 ? 2 : 0}
              />
              <YAxis 
                tick={{ fontSize: 10, fill: '#94A3B8', fontWeight: 500 }} 
                axisLine={false} 
                tickLine={false} 
                tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`}
                width={window.innerWidth < 640 ? 35 : 50}
              />
              <Tooltip content={<ChartTooltip />} cursor={{ stroke: '#3B82F6', strokeWidth: 1.5, strokeDasharray: '4 4' }} />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#3B82F6"
                strokeWidth={3}
                fill="url(#revGrad)"
                dot={{ r: 4, fill: '#3B82F6', strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 6, strokeWidth: 0 }}
                animationDuration={2000}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 pb-10 overflow-y-auto">
          <h2 className="text-[15px] font-bold text-[#0F172A] mb-1">Revenue by Category</h2>
          <p className="text-[12px] font-medium text-[#94A3B8] mb-6">Share of total revenue</p>
          <div className="space-y-7">
            {categoryBreakdown.map(cat => (
              <div key={cat.label} className="group">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                    <span className="text-[13px] font-bold text-[#475569]">{cat.label}</span>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center justify-end gap-0.5 text-[13px] font-extrabold text-[#0F172A]">
                      <BiRupee size={12} />
                      <span>{cat.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>
                <div className="w-full h-1.5 bg-gray-50 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-1000 ease-out"
                    style={{ backgroundColor: cat.color, width: `${cat.share}%` }}
                  />
                </div>
                <div className="mt-1 flex justify-between">
                  <span className="text-[10px] text-[#94A3B8] font-bold uppercase tracking-wider">{cat.orders} Orders</span>
                  <span className="text-[10px] font-bold" style={{ color: cat.color }}>{cat.share.toFixed(1)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-gray-50 flex flex-wrap items-center justify-between gap-4 bg-white">
          <div>
            <h2 className="text-[15px] font-bold text-[#0F172A] mb-0.5">B2B Client Performance</h2>
            <p className="text-[12px] font-medium text-[#94A3B8]">Detailed metrics per registered partner</p>
          </div>
          <div className="flex items-center gap-2">
            {/* Filter Dropdown */}
            <div className="relative">
              <button
                onClick={() => { setShowFilterMenu(!showFilterMenu); setShowSortMenu(false); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-[12px] font-bold transition-colors ${filterType !== 'All' ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-white border-gray-200 text-[#475569] hover:bg-gray-50'}`}>
                <FiFilter size={14} /> {filterType === 'All' ? 'Filter' : filterType}
              </button>
              {showFilterMenu && (
                <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-100 rounded-xl shadow-xl z-20 overflow-hidden py-1">
                  {["All", "Linen", "Student", "Retail"].map(f => (
                    <button key={f} onClick={() => { setFilterType(f); setShowFilterMenu(false); }}
                      className={`w-full text-left px-4 py-2 text-[12px] font-bold transition-colors ${filterType === f ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50'}`}>
                      {f} {f === "All" ? "Sectors" : "Properties"}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Sort Dropdown */}
            <div className="relative">
              <button
                onClick={() => { setShowSortMenu(!showSortMenu); setShowFilterMenu(false); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-[12px] font-bold transition-colors ${sortConfig.key !== 'rev' || sortConfig.direction !== 'desc' ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-white border-gray-200 text-[#475569] hover:bg-gray-50'}`}>
                Sort <FiChevronDown size={14} className={`transition-transform ${showSortMenu ? 'rotate-180' : ''}`} />
              </button>
              {showSortMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-xl z-20 overflow-hidden py-1">
                  {[
                    { key: 'rev', label: 'Revenue (High-Low)', dir: 'desc' },
                    { key: 'rev', label: 'Revenue (Low-High)', dir: 'asc' },
                    { key: 'orders', label: 'Order Velocity', dir: 'desc' },
                    { key: 'kg', label: 'KG Processed', dir: 'desc' },
                  ].map(s => (
                    <button key={`${s.key}-${s.dir}`} onClick={() => { setSortConfig({ key: s.key, direction: s.dir }); setShowSortMenu(false); }}
                      className={`w-full text-left px-4 py-2 text-[12px] font-bold transition-colors ${sortConfig.key === s.key && sortConfig.direction === s.dir ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50'}`}>
                      {s.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full min-w-[850px]">
            <thead className="bg-[#F8FAFC]">
              <tr>
                <th className="text-left text-[11px] font-black text-[#64748B] px-6 py-4 uppercase tracking-[0.1em]">Hostel / Partner</th>
                <th className="text-left text-[11px] font-black text-[#64748B] px-6 py-4 uppercase tracking-[0.1em]">Type</th>
                <th className="text-right text-[11px] font-black text-[#64748B] px-6 py-4 uppercase tracking-[0.1em]">Orders</th>
                <th className="text-right text-[11px] font-black text-[#64748B] px-6 py-4 uppercase tracking-[0.1em]">KG Processed</th>
                <th className="text-right text-[11px] font-black text-[#64748B] px-6 py-4 uppercase tracking-[0.1em]">Total Revenue</th>
                <th className="text-right text-[11px] font-black text-[#64748B] px-6 py-4 uppercase tracking-[0.1em]">Avg Order</th>
                <th className="text-center text-[11px] font-black text-[#64748B] px-6 py-4 uppercase tracking-[0.1em]">Last Activity</th>
                <th className="text-right text-[11px] font-black text-[#64748B] px-6 py-4 uppercase tracking-[0.1em]">Analytics</th>
              </tr>
            </thead>
            <tbody>
              {clientRows.map((c, i) => (
                <tr key={c.id} className="border-b border-gray-50 hover:bg-[#F8FAFC] transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-[13px] font-extrabold flex-shrink-0 shadow-sm" style={{ backgroundColor: AVATAR_COLORS[i % AVATAR_COLORS.length] }}>
                        {c.name?.charAt(0)}
                      </div>
                      <span className="text-[13.5px] font-bold text-[#0F172A]">{c.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-[0.05em] ${c.hostelType === 'Linen' ? 'bg-purple-100 text-purple-700' :
                        c.hostelType === 'Student' ? 'bg-blue-100 text-blue-700' :
                          c.hostelType === 'Retail' ? 'bg-emerald-100 text-emerald-700' :
                            'bg-slate-100 text-slate-700'
                      }`}>
                      {c.hostelType}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-[13.5px] font-extrabold text-[#475569] text-right">{c.orders}</td>
                  <td className="px-6 py-4 text-[13px] font-bold text-[#64748B] text-right">{c.kg > 0 ? c.kg.toFixed(1) : '—'}</td>
                  <td className="px-6 py-4 text-[13.5px] font-black text-[#0F172A] text-right">
                    <div className="flex items-center justify-end gap-0.5">
                      <BiRupee size={14} />
                      <span>{c.rev.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-[13px] font-bold text-[#64748B] text-right">
                    {c.orders > 0 ? (
                      <div className="flex items-center justify-end gap-0.5">
                        <BiRupee size={12} />
                        <span>{(c.rev / c.orders).toFixed(0)}</span>
                      </div>
                    ) : '—'}
                  </td>
                  <td className="px-6 py-4 text-[13px] font-medium text-[#94A3B8] text-center">{c.last ? new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(c.last) : '—'}</td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleOpenClientModal(c)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-[#475569] text-[12px] font-bold hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all opacity-100">
                      View <FiArrowRight size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card Layout */}
        <div className="md:hidden divide-y divide-gray-50">
          {clientRows.map((c, i) => (
            <div 
              key={c.id}
              onClick={() => setSelectedClient(c)}
              className="p-4 active:bg-gray-50 transition-colors cursor-pointer"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-black shadow-sm"
                    style={{ backgroundColor: AVATAR_COLORS[i % AVATAR_COLORS.length] }}
                  >
                    {c.name?.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-[#0F172A]">{c.name}</h4>
                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider ${
                      c.hostelType === 'Linen' ? 'bg-purple-50 text-purple-600' :
                      c.hostelType === 'Student' ? 'bg-blue-50 text-blue-600' :
                      'bg-emerald-50 text-emerald-600'
                    }`}>
                      {c.hostelType}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center justify-end gap-0.5 text-sm font-black text-[#0F172A]">
                    <BiRupee size={12} className="text-slate-400" />
                    <span>{c.rev.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                  </div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{c.orders} Orders</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-gray-100/50">
                <div className="bg-slate-50/50 p-2 rounded-lg border border-slate-100/50">
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">Processed</span>
                  <span className="text-[11px] font-black text-slate-700">{c.kg > 0 ? c.kg.toFixed(1) : '0'} KG</span>
                </div>
                <div className="bg-slate-50/50 p-2 rounded-lg border border-slate-100/50">
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">Avg Order</span>
                  <div className="flex items-center gap-0.5 text-[11px] font-black text-slate-700">
                    <BiRupee size={10} className="text-slate-400" />
                    <span>{(c.rev / (c.orders || 1)).toFixed(0)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* View Details Modal */}
      {selectedClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSelectedClient(null)} />
          <div className="relative bg-white sm:rounded-2xl shadow-2xl w-full h-full sm:h-auto sm:max-w-5xl sm:max-h-[90vh] flex flex-col overflow-hidden animate-slide-up sm:animate-fade-in" style={{ fontFamily: 'DM Sans, sans-serif' }}>
            <div className="flex items-center justify-between p-6 border-b border-gray-100 flex-shrink-0">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{selectedClient.name}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${selectedClient.hostelType === 'Linen' ? 'bg-purple-50 text-purple-600' : selectedClient.hostelType === 'Student' ? 'bg-blue-50 text-blue-600' : 'bg-gray-50 text-gray-500'}`}>
                    {selectedClient.hostelType}
                  </span>
                  <p className="text-sm text-gray-500">Detailed Order History</p>
                </div>
              </div>
              <button onClick={() => setSelectedClient(null)} className="p-2 text-gray-400 hover:text-[#DC2626] hover:bg-red-50 rounded-xl transition-colors">
                <FiX size={24} />
              </button>
            </div>
            <div className="bg-gray-50 p-4 border-b border-gray-100 grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4 flex-shrink-0">
              <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm text-center">
                <p className="text-xs text-gray-400 font-medium">Total Orders</p>
                <p className="text-lg font-bold text-gray-800">{selectedClient.orders}</p>
              </div>
              <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm text-center">
                <p className="text-xs text-gray-400 font-medium">KG Processed</p>
                <p className="text-lg font-bold text-gray-800">{selectedClient.kg.toFixed(1)}</p>
              </div>
              <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm text-center">
                <p className="text-xs text-gray-400 font-medium">Total Clothes</p>
                <p className="text-lg font-bold text-gray-800">{selectedClient.clothes || 0}</p>
              </div>
              <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm text-center">
                <p className="text-xs text-gray-400 font-medium">Total Revenue</p>
                <div className="flex items-center justify-center gap-0.5 text-lg font-bold text-[#1976D2]">
                  <BiRupee size={18} />
                  <span>{selectedClient.rev.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              </div>
              <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm text-center">
                <p className="text-xs text-gray-400 font-medium">Avg per Order</p>
                <div className="flex items-center justify-center gap-0.5 text-lg font-bold text-gray-800">
                  <BiRupee size={16} />
                  <span>{selectedClient.orders > 0 ? (selectedClient.rev / selectedClient.orders).toFixed(0) : '—'}</span>
                </div>
              </div>
            </div>
            
            {/* Modal Filter Bar */}
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-100 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 flex-shrink-0">
              <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-hide">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-1 sm:mr-2">Status</span>
                <div className="flex gap-2">
                  {["All", "Pending", "Processing", "Delivered"].map(status => (
                    <button 
                      key={status}
                      onClick={() => setModalFilterStatus(status)}
                      className={`px-3 py-1.5 rounded-full text-[10px] sm:text-[11px] font-bold whitespace-nowrap transition-all ${modalFilterStatus === status ? 'bg-slate-800 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>
              {(selectedClient.properties || selectedClient.partnernames || []).length > 1 && (
                <div className="flex items-center justify-between sm:justify-end gap-2 border-t sm:border-t-0 pt-3 sm:pt-0">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-1">Filter Property</span>
                  <select 
                    value={modalFilterProperty} 
                    onChange={(e) => setModalFilterProperty(e.target.value)}
                    className="bg-slate-50 border border-slate-200 text-slate-700 text-[11px] sm:text-[12px] font-bold rounded-lg px-3 py-2 sm:py-1.5 outline-none focus:border-blue-500 min-w-[140px]"
                  >
                    <option value="All">All Properties</option>
                    {(selectedClient.properties || selectedClient.partnernames).map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <OrderTable
                orders={orders.filter(o => {
                  const props = selectedClient.properties || selectedClient.partnernames || [];
                  if (!props.includes(o.property || o.tenant)) return false;
                  if (modalFilterStatus !== "All") {
                    const os = (o.status || "Pending").toLowerCase();
                    const fs = modalFilterStatus.toLowerCase();
                    if (fs === "delivered" && !os.includes("delivered") && !os.includes("completed")) return false;
                    if (fs === "processing" && !os.includes("process") && !os.includes("active")) return false;
                    if (fs === "pending" && !os.includes("pending")) return false;
                  }
                  if (modalFilterProperty !== "All" && (o.property || o.tenant) !== modalFilterProperty) return false;
                  return true;
                })}
                showTenant={(selectedClient.properties || selectedClient.partnernames || [])?.length > 1}
                onRowClick={(order) => { setSelectedModalOrder(order); setIsOrderModalOpen(true); }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Deep Drill-Down Order Modal */}
      <AdminOrderModal 
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        order={selectedModalOrder}
      />
    </div>
  );
}
