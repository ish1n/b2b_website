import { useMemo, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { FiChevronDown, FiChevronRight } from "react-icons/fi";
import { BiRupee } from "react-icons/bi";

const STUDENT_HOSTELS = ["Tulsi", "Adarsha", "Meera", "Aardhana", "Aakansha", "Kirti", "Tara", "Samshrushti"];
const LINEN_HOSTELS = ["Hostel 99", "Hostel 99 no-88", "Hostel 99 no-3"];
const HOSTEL_COLORS = { "Tulsi": "#1976D2", "Adarsha": "#7C3AED", "Meera": "#059669", "Aardhana": "#D97706", "Aakansha": "#0891B2", "Kirti": "#BE185D", "Tara": "#DC2626", "Samshrushti": "#4338CA", "Hostel 99": "#7C3AED", "Hostel 99 no-88": "#059669", "Hostel 99 no-3": "#D97706" };


const BarTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 backdrop-blur-md shadow-xl rounded-xl p-4 border border-gray-100" style={{ fontFamily: 'DM Sans, sans-serif' }}>
        <p className="text-[#0F172A] font-black text-[11px] uppercase tracking-wider mb-2 border-b border-gray-50 pb-1">March {label}</p>
        <div className="space-y-1.5">
          {payload.map((p, i) => (
            <div key={i} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: p.color }} />
                <span className="text-[12px] font-bold text-slate-500">{p.name}</span>
              </div>
              <span className="text-[12px] font-black text-[#0F172A]">{p.value.toFixed(1)} KG</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

function SummaryCard({ name, color, orders, kg, clothes, students, avgKgPerStudent, revenue }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-all group overflow-hidden relative">
      <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: color }} />
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
        <h3 className="text-[14px] font-black text-[#0F172A] tracking-tight">{name}</h3>
      </div>
      <div className="grid grid-cols-2 gap-y-3 gap-x-1">
        {revenue !== undefined && (
          <div className="col-span-2 pb-3 border-b border-slate-50 mb-1 flex items-center justify-between">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Total Revenue</p>
            <div className="flex items-center gap-0.5 text-[14px] font-black text-green-600">
              <BiRupee size={14} />
              <span>{revenue.toLocaleString()}</span>
            </div>
          </div>
        )}
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Orders</p>
          <p className="text-[13.5px] font-black text-slate-700">{orders}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Total KG</p>
          <p className="text-[13.5px] font-black text-slate-700">{kg.toFixed(1)}</p>
        </div>
        {clothes !== undefined && (
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Clothes</p>
            <p className="text-[13.5px] font-black text-slate-700">{clothes}</p>
          </div>
        )}
        {students !== undefined && students > 0 && (
          <div className="text-right">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Students</p>
            <p className="text-[13.5px] font-black text-slate-700">{students}</p>
          </div>
        )}
        {avgKgPerStudent !== undefined && avgKgPerStudent > 0 && (
          <div className="col-span-2 pt-2 border-t border-slate-50 mt-1 flex items-center justify-between">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Avg KG/Student</p>
            <div className="flex items-center gap-0.5">
              <p className="text-[13px] font-black text-blue-600">{avgKgPerStudent.toFixed(2)}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function LinenSummaryCard({ name, color, orders, revenue }) {
  const totals = {};
  orders.forEach(o => {
    if (o.details) {
      Object.entries(o.details).forEach(([k, v]) => {
        const normalizedKey = k === "Bedsheet" ? "Single Bedsheet" : k;
        totals[normalizedKey] = (totals[normalizedKey] || 0) + (v || 0);
      });
    }
  });
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-all group overflow-hidden relative">
      <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: color }} />
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
          <h3 className="text-[14px] font-black text-[#0F172A] tracking-tight">{name}</h3>
        </div>
        <div className="text-right">
          <span className="text-[10px] font-black text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full uppercase tracking-wider block mb-1">{orders.length} pickups</span>
          {revenue !== undefined && (
            <div className="flex items-center justify-end gap-0.5 text-[13px] font-black text-green-600">
              <BiRupee size={13} />
              <span>{revenue.toLocaleString()}</span>
            </div>
          )}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-y-3 gap-x-2">
        {Object.entries(totals).filter(([, v]) => v > 0).map(([k, v]) => (
          <div key={k}>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1 truncate">{k}</p>
            <p className="text-[13px] font-black text-slate-700">{v}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminHostelsTab({ orders, daysInRange }) {
  const [view, setView] = useState("student");
  const [linenExpanded, setLinenExpanded] = useState(true);

  const studentOrders = useMemo(() => orders.filter(o => o.type === "student"), [orders]);
  const linenOrders = useMemo(() => orders.filter(o => o.type === "linen"), [orders]);

  // Student hostel summaries
  const studentSummaries = useMemo(() =>
    STUDENT_HOSTELS.map(name => {
      const ho = studentOrders.filter(o => o.property === name);
      const kg = ho.reduce((s, o) => s + (o.weight || 0), 0);
      const clothes = ho.reduce((s, o) => s + (o.items || 0), 0);
      const students = ho.reduce((s, o) => s + (o.studentCount || 0), 0);
      const revenue = ho.reduce((s, o) => s + (o.amount || 0), 0);
      return { name, orders: ho.length, kg, clothes, students, revenue, avgKgPerStudent: students > 0 ? kg / students : 0, color: HOSTEL_COLORS[name] || "#6B7280" };
    }).filter(h => h.orders > 0), [studentOrders]);

  // Student KG chart by day
  const studentChartData = useMemo(() =>
    daysInRange.map(day => {
      const row = { day };
      STUDENT_HOSTELS.forEach(h => {
        row[h] = studentOrders.filter(o => o.property === h && parseInt(o.date?.split("-")[2], 10) === day).reduce((s, o) => s + (o.weight || 0), 0);
      });
      return row;
    }), [studentOrders, daysInRange]);

  // Linen hostel summaries
  const linenSummaries = useMemo(() =>
    LINEN_HOSTELS.map(name => {
      const ho = linenOrders.filter(o => o.property === name);
      const revenue = ho.reduce((s, o) => s + (o.amount || 0), 0);
      return {
        name, orders: ho, revenue,
        color: HOSTEL_COLORS[name] || "#6B7280"
      };
    }).filter(h => h.orders.length > 0), [linenOrders]);

  const unifiedOrders = useMemo(() => {
    return [...studentOrders, ...linenOrders].sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [studentOrders, linenOrders]);

  return (
    <div className="space-y-6" style={{ fontFamily: 'DM Sans, sans-serif' }}>
      {/* Toggle */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex bg-white/50 backdrop-blur-sm p-1.5 rounded-xl border border-gray-100 shadow-sm w-fit gap-1 text-[12px] font-bold">
          {[
            { key: "student", label: "Student Laundry" },
            { key: "linen", label: "Linen Hostels" },
            { key: "all", label: "All Sectors" },
          ].map(t => (
            <button key={t.key} onClick={() => setView(t.key)}
              className={`px-4 py-2 rounded-lg transition-all duration-300 ${view === t.key ? 'bg-white text-blue-600 shadow-sm border border-gray-100' : 'text-slate-500 hover:text-slate-900 hover:bg-white/40'}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Section */}
      <div className="space-y-4">
        {view === "all" ? (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[15px] font-black text-[#0F172A] tracking-tight uppercase tracking-widest">Unified Property Summary</h2>
              <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-lg">Combining {studentSummaries.length + linenSummaries.length} Properties</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {studentSummaries.map(s => <SummaryCard key={s.name} {...s} />)}
              {linenSummaries.map(s => <LinenSummaryCard key={s.name} name={s.name} color={s.color} orders={s.orders} revenue={s.revenue} />)}
            </div>
          </div>
        ) : view === "student" ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {studentSummaries.map(s => <SummaryCard key={s.name} {...s} />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {linenSummaries.map(s => <LinenSummaryCard key={s.name} name={s.name} color={s.color} orders={s.orders} revenue={s.revenue} />)}
          </div>
        )}
      </div>

      {/* KG Chart */}
      {(view === "student" || view === "all") && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 overflow-hidden min-w-0">
          <div className="mb-6">
            <h2 className="text-[15px] font-black text-[#0F172A] tracking-tight">Daily KG Distribution</h2>
            <p className="text-[12px] font-medium text-slate-400">Linen weight trends across student properties</p>
          </div>
          <ResponsiveContainer width="100%" height={280} debounce={100} minWidth={0}>
            <BarChart data={studentChartData} margin={{ top: 0, right: 10, left: -20, bottom: 0 }} barGap={0}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#94A3B8', fontWeight: 700 }} axisLine={false} tickLine={false} dy={10} />
              <YAxis tick={{ fontSize: 11, fill: '#94A3B8', fontWeight: 700 }} axisLine={false} tickLine={false} />
              <Tooltip content={<BarTooltip />} cursor={{ fill: '#F8FAFC' }} />
              <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }} />
              {studentSummaries.map(s => (
                <Bar key={s.name} dataKey={s.name} stackId="a" fill={s.color} radius={[3, 3, 0, 0]} maxBarSize={40} animationDuration={1500} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Transaction Log Section */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-[15px] font-black text-[#0F172A] tracking-tight mb-0.5">
              {view === "all" ? "Unified Hostel Transaction Log" : view === "student" ? "Student Laundry Pick-up Log" : "Linen Management Log"}
            </h2>
            <p className="text-[12px] font-medium text-slate-400">
              {view === "all" ? "Combined records for student and linen sectors" : "Individual property transactions"}
            </p>
          </div>


          {view === "all" && (
            <div className="flex gap-2">
              <span className="px-2 py-1 bg-blue-50 text-blue-600 text-[10px] font-black rounded uppercase">Students</span>
              <span className="px-2 py-1 bg-purple-50 text-purple-600 text-[10px] font-black rounded uppercase">Linen</span>
            </div>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead className="bg-[#F8FAFC]">
              <tr>
                <th className="text-left text-[11px] font-black text-[#64748B] px-6 py-4 uppercase tracking-[0.1em]">Date</th>
                <th className="text-left text-[11px] font-black text-[#64748B] px-6 py-4 uppercase tracking-[0.1em]">Property / Type</th>
                <th className="text-right text-[11px] font-black text-[#64748B] px-6 py-4 uppercase tracking-[0.1em]">Metric / Qty</th>
                <th className="text-center text-[11px] font-black text-[#64748B] px-6 py-4 uppercase tracking-[0.1em]">Details</th>
                <th className="text-right text-[11px] font-black text-[#64748B] px-6 py-4 uppercase tracking-[0.1em]">Billed Amount</th>
              </tr>
            </thead>
            <tbody>
              {(view === "all" ? unifiedOrders : view === "student" ? studentOrders : linenOrders)
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .map(o => (
                  <tr key={o.id} className="border-b border-gray-50 hover:bg-[#F8FAFC] transition-colors group">
                    <td className="px-6 py-4 text-[13px] font-bold text-slate-500">{o.date}</td>
                    <td className="px-6 py-4">
                      <p className="text-[13.5px] font-black text-[#0F172A]">{o.property}</p>
                      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase ${o.type === 'student' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
                        {o.type === 'student' ? 'Student' : 'Linen'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {o.type === 'student' ? (
                        <div>
                          <p className="text-[13.5px] font-black text-slate-800">{o.weight?.toFixed(1) || '0.0'} <span className="text-[10px] text-slate-400">kg</span></p>
                          <p className="text-[11px] font-bold text-slate-400">{o.studentCount || '—'} students</p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-[13.5px] font-black text-slate-800">
                            {Object.values(o.details || {}).reduce((s, v) => s + v, 0)} <span className="text-[10px] text-slate-400">pcs</span>
                          </p>
                          <p className="text-[11px] font-bold text-slate-400">Linen pickup</p>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex flex-wrap justify-center gap-2">
                        {o.type === 'student' ? (
                          <span className="text-[11px] font-bold text-slate-500 italic">Wash & Fold/Iron</span>
                        ) : (
                          Object.entries(o.details || {}).filter(([, v]) => v > 0).map(([k, v]) => (
                            <span 
                              key={k} 
                              className="text-[10px] font-bold bg-[#F1F5F9] text-slate-600 px-2 py-0.5 rounded whitespace-nowrap"
                            >
                              {k}: {v}
                            </span>
                          ))
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-[13.5px] font-black text-blue-600 text-right">
                      <div className="flex items-center justify-end gap-0.5">
                        <BiRupee size={12} className="mb-0.5" />
                        <span>{o.amount?.toLocaleString()}</span>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
