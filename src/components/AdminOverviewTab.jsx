import { useMemo, useState } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import { getCategoryForProperty, CATEGORIES } from "../data/hostelOrders";
import { FiArrowRight, FiX } from "react-icons/fi";
import ExportCSV from "./ExportCSV";
import OrderTable from "./OrderTable";

const AVATAR_COLORS = ['#1976D2','#7C3AED','#059669','#DC2626','#D97706','#0891B2','#BE185D'];

const ChartTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border-l-4 border-[#1976D2] shadow-lg rounded-xl p-3" style={{ fontFamily: 'Poppins, sans-serif' }}>
        <p className="text-[#1976D2] font-semibold text-xs mb-1">Mar {label}</p>
        <p className="text-gray-800 font-bold text-sm">₹{payload[0].value.toLocaleString()}</p>
      </div>
    );
  }
  return null;
};

export default function AdminOverviewTab({ orders, clients, daysInRange }) {
  const [selectedClient, setSelectedClient] = useState(null);

  const regularOrders = useMemo(() => orders.filter(o => o.category !== "ISSUES"), [orders]);

  const dailyRevenue = useMemo(() =>
    daysInRange.map(day => {
      const dayOrders = regularOrders.filter(o => {
        const d = o.date ? parseInt(o.date.split("-")[2], 10) : o.day;
        return d === day;
      });
      return { day, revenue: dayOrders.reduce((s, o) => s + (o.amount || 0), 0) };
    }), [regularOrders, daysInRange]);

  const categoryBreakdown = useMemo(() => {
    const map = {};
    regularOrders.forEach(o => {
      const cat = getCategoryForProperty(o.property || o.tenant);
      if (!map[cat.key]) map[cat.key] = { label: cat.label, color: cat.color, orders: 0, revenue: 0 };
      map[cat.key].orders++;
      map[cat.key].revenue += (o.amount || 0);
    });
    return Object.values(map).sort((a, b) => b.revenue - a.revenue);
  }, [regularOrders]);

  const clientRows = useMemo(() =>
    clients.map((mgr, idx) => {
      const props = mgr.properties || [];
      const cOrders = orders.filter(o => props.includes(o.property));
      const rev = cOrders.reduce((s, o) => s + (o.amount || 0), 0);
      const kg = cOrders.reduce((s, o) => s + (o.weight || 0), 0);
      const issues = orders.filter(o => o.category === "ISSUES").length;
      let last = null;
      cOrders.forEach(o => { if (o.date) { const d = new Date(o.date); if (!last || d > last) last = d; } });
      const hostelType = cOrders.length > 0 && cOrders[0].type === "linen" ? "Linen" : cOrders.length > 0 && cOrders[0].type === "student" ? "Student" : "Other";
      return { ...mgr, idx, rev, kg, orders: cOrders.length, issues: 0, last, hostelType };
    }).filter(c => c.orders > 0).sort((a, b) => b.rev - a.rev),
    [clients, orders]);

  return (
    <div className="space-y-6">
      {/* Revenue Chart + Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-base font-bold text-gray-900 mb-1">Revenue Trend</h2>
          <p className="text-xs text-gray-400 mb-5">Daily revenue across all tenants</p>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={dailyRevenue} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1976D2" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#1976D2" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f5" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
              <Tooltip content={<ChartTooltip />} cursor={{ stroke: '#1976D2', strokeDasharray: '4 4' }} />
              <Area type="monotone" dataKey="revenue" stroke="#1976D2" strokeWidth={2.5} fill="url(#revGrad)" dot={{ r: 4, fill: '#1976D2', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-base font-bold text-gray-900 mb-4">Revenue by Category</h2>
          <div className="space-y-4">
            {categoryBreakdown.map(cat => (
              <div key={cat.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                  <span className="text-xs font-medium text-gray-600">{cat.label}</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-gray-800">₹{cat.revenue.toLocaleString()}</span>
                  <span className="text-[10px] text-gray-400 ml-1.5">({cat.orders})</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Unified B2B Client Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-base font-bold text-gray-900 mb-1">B2B Client Performance</h2>
        <p className="text-xs text-gray-400 mb-5">All registered hostels and their metrics</p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px]">
            <thead>
              <tr className="bg-[#f8fcff]">
                <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3 rounded-tl-xl">Hostel</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Type</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Orders</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">KG</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Revenue</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Avg/Order</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Last Order</th>
                <th className="text-right text-xs font-semibold text-gray-500 px-4 py-3 rounded-tr-xl">Action</th>
              </tr>
            </thead>
            <tbody>
              {clientRows.map((c, i) => (
                <tr key={c.id} className="border-b border-gray-50 hover:bg-blue-50/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ backgroundColor: AVATAR_COLORS[i % AVATAR_COLORS.length] }}>
                        {c.name?.charAt(0)}
                      </div>
                      <span className="text-sm font-semibold text-gray-800">{c.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${c.hostelType === 'Linen' ? 'bg-purple-50 text-purple-600' : c.hostelType === 'Student' ? 'bg-blue-50 text-blue-600' : 'bg-gray-50 text-gray-500'}`}>
                      {c.hostelType}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-gray-700">{c.orders}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{c.kg > 0 ? c.kg.toFixed(1) : '—'}</td>
                  <td className="px-4 py-3 text-sm font-bold text-gray-800">₹{c.rev.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{c.orders > 0 ? `₹${(c.rev / c.orders).toFixed(0)}` : '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{c.last ? new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(c.last) : '—'}</td>
                  <td className="px-4 py-3 text-right">
                    <button 
                      onClick={() => setSelectedClient(c)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#E8EAF6] text-[#0D47A1] text-xs font-semibold hover:bg-indigo-100 transition-all">
                      View <FiArrowRight size={12} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Details Modal */}
      {selectedClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setSelectedClient(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden" style={{ fontFamily: 'Poppins, sans-serif' }}>
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
                <FiX size={20} />
              </button>
            </div>
            <div className="bg-gray-50 p-4 border-b border-gray-100 grid grid-cols-4 gap-4 flex-shrink-0">
               <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm text-center">
                 <p className="text-xs text-gray-400 font-medium">Total Orders</p>
                 <p className="text-lg font-bold text-gray-800">{selectedClient.orders}</p>
               </div>
               <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm text-center">
                 <p className="text-xs text-gray-400 font-medium">KG Processed</p>
                 <p className="text-lg font-bold text-gray-800">{selectedClient.kg.toFixed(1)}</p>
               </div>
               <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm text-center">
                 <p className="text-xs text-gray-400 font-medium">Total Revenue</p>
                 <p className="text-lg font-bold text-[#1976D2]">₹{selectedClient.rev.toLocaleString()}</p>
               </div>
               <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm text-center">
                 <p className="text-xs text-gray-400 font-medium">Avg per Order</p>
                 <p className="text-lg font-bold text-gray-800">{selectedClient.orders > 0 ? `₹${(selectedClient.rev / selectedClient.orders).toFixed(0)}` : '—'}</p>
               </div>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <OrderTable 
                orders={orders.filter(o => (selectedClient.properties || []).includes(o.property || o.tenant))} 
                showTenant={selectedClient.properties?.length > 1} 
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
