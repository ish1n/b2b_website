import { useMemo, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { FiChevronDown, FiChevronRight } from "react-icons/fi";
import { BiRupee } from "react-icons/bi";

const STUDENT_HOSTELS = ["Tulsi", "Adarsha", "Meera", "Aardhana", "Aakansha", "Kirti", "Tara", "Samshrushti"];
const LINEN_HOSTELS = ["Hostel 99", "Hostel 99 no-88", "Hostel 99 no-3"];
const HOTEL_PROPERTIES = ["Airbnb Viman Nagar"];
const HOSTEL_COLORS = { "Tulsi": "#1976D2", "Adarsha": "#7C3AED", "Meera": "#059669", "Aardhana": "#D97706", "Aakansha": "#0891B2", "Kirti": "#BE185D", "Tara": "#DC2626", "Samshrushti": "#4338CA", "Hostel 99": "#7C3AED", "Hostel 99 no-88": "#059669", "Hostel 99 no-3": "#D97706", "Airbnb Viman Nagar": "#D97706" };

const BarTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white shadow-lg rounded-xl p-3 border border-gray-100" style={{ fontFamily: 'Poppins' }}>
        <p className="text-gray-800 font-semibold text-xs mb-1">Mar {label}</p>
        {payload.map((p, i) => (
          <p key={i} className="text-xs" style={{ color: p.color }}>{p.name}: {p.value} KG</p>
        ))}
      </div>
    );
  }
  return null;
};

function SummaryCard({ name, color, orders, kg, clothes, students, avgKgPerStudent }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
        <h3 className="text-sm font-bold text-gray-800">{name}</h3>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div><span className="text-gray-400">Orders</span><p className="font-bold text-gray-700">{orders}</p></div>
        <div><span className="text-gray-400">KG</span><p className="font-bold text-gray-700">{kg.toFixed(1)}</p></div>
        {clothes !== undefined && <div><span className="text-gray-400">Clothes</span><p className="font-bold text-gray-700">{clothes}</p></div>}
        {students !== undefined && students > 0 && <div><span className="text-gray-400">Students</span><p className="font-bold text-gray-700">{students}</p></div>}
        {avgKgPerStudent !== undefined && avgKgPerStudent > 0 && <div className="col-span-2"><span className="text-gray-400">Avg KG/Student</span><p className="font-bold text-[#1976D2]">{avgKgPerStudent.toFixed(2)}</p></div>}
      </div>
    </div>
  );
}

function LinenSummaryCard({ name, color, orders, details }) {
  const totals = {};
  orders.forEach(o => {
    if (o.details) Object.entries(o.details).forEach(([k, v]) => { totals[k] = (totals[k] || 0) + (v || 0); });
  });
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
        <h3 className="text-sm font-bold text-gray-800">{name}</h3>
        <span className="ml-auto text-[10px] text-gray-400 font-medium">{orders.length} pickups</span>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        {Object.entries(totals).filter(([, v]) => v > 0).map(([k, v]) => (
          <div key={k}><span className="text-gray-400">{k}</span><p className="font-bold text-gray-700">{v}</p></div>
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
  const hotelOrders = useMemo(() => orders.filter(o => o.type === "airbnb"), [orders]);

  // Student hostel summaries
  const studentSummaries = useMemo(() =>
    STUDENT_HOSTELS.map(name => {
      const ho = studentOrders.filter(o => o.property === name);
      const kg = ho.reduce((s, o) => s + (o.weight || 0), 0);
      const clothes = ho.reduce((s, o) => s + (o.items || 0), 0);
      const students = ho.reduce((s, o) => s + (o.studentCount || 0), 0);
      return { name, orders: ho.length, kg, clothes, students, avgKgPerStudent: students > 0 ? kg / students : 0, color: HOSTEL_COLORS[name] || "#6B7280" };
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
    LINEN_HOSTELS.map(name => ({
      name, orders: linenOrders.filter(o => o.property === name),
      color: HOSTEL_COLORS[name] || "#6B7280"
    })).filter(h => h.orders.length > 0), [linenOrders]);

  // Hotel summaries
  const hotelSummaries = useMemo(() =>
    HOTEL_PROPERTIES.map(name => ({
      name, orders: hotelOrders.filter(o => o.property === name),
      color: HOSTEL_COLORS[name] || "#6B7280"
    })).filter(h => h.orders.length > 0), [hotelOrders]);

  const activeHostels = view === "student" ? STUDENT_HOSTELS : view === "linen" ? LINEN_HOSTELS : view === "hotel" ? HOTEL_PROPERTIES : [...STUDENT_HOSTELS, ...LINEN_HOSTELS, ...HOTEL_PROPERTIES];

  return (
    <div className="space-y-6">
      {/* Toggle */}
      <div className="flex gap-2">
        {[
          { key: "student", label: "Student Laundry" },
          { key: "linen", label: "Linen Hostels" },
          { key: "hotel", label: "Hotels & Airbnbs" },
          { key: "all", label: "All" },
        ].map(t => (
          <button key={t.key} onClick={() => setView(t.key)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${view === t.key ? 'bg-[#1976D2] text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Student Laundry Section */}
      {(view === "student" || view === "all") && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {studentSummaries.map(s => <SummaryCard key={s.name} {...s} />)}
          </div>

          {/* KG Chart */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-base font-bold text-gray-900 mb-1">Daily KG by Hostel</h2>
            <p className="text-xs text-gray-400 mb-4">Student laundry weight processed per day</p>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={studentChartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f5" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <Tooltip content={<BarTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                {studentSummaries.map(s => (
                  <Bar key={s.name} dataKey={s.name} stackId="a" fill={s.color} radius={[2, 2, 0, 0]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Student Detail Table */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-base font-bold text-gray-900 mb-4">Student Laundry Detail</h2>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr className="bg-[#f8fcff]">
                    <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3 rounded-tl-xl">Date</th>
                    <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Hostel</th>
                    <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Students</th>
                    <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Clothes</th>
                    <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">KG</th>
                    <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Amount</th>
                    <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3 rounded-tr-xl">Avg KG/Student</th>
                  </tr>
                </thead>
                <tbody>
                  {studentOrders.sort((a, b) => new Date(a.date) - new Date(b.date)).map(o => (
                    <tr key={o.id} className="border-b border-gray-50 hover:bg-blue-50/30 transition-colors">
                      <td className="px-4 py-3 text-sm text-gray-600">{o.date}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-800">{o.property}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{o.studentCount || '—'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{o.items}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-700">{o.weight?.toFixed(1) || '—'}</td>
                      <td className="px-4 py-3 text-sm font-bold text-gray-800">₹{o.amount?.toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm text-[#1976D2] font-medium">{o.studentCount > 0 ? (o.weight / o.studentCount).toFixed(2) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Linen Section */}
      {(view === "linen" || view === "all") && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <button onClick={() => setLinenExpanded(!linenExpanded)} className="w-full flex items-center justify-between p-6 hover:bg-gray-50/50 transition-colors">
            <div className="flex items-center gap-3">
              {linenExpanded ? <FiChevronDown size={18} className="text-gray-400" /> : <FiChevronRight size={18} className="text-gray-400" />}
              <div className="text-left">
                <h2 className="text-base font-bold text-gray-900">Hostel 99 Group — Linen Services</h2>
                <p className="text-xs text-gray-400">3 properties · Bedsheets, Pillow Covers, Duvets, Towels</p>
              </div>
            </div>
            <span className="bg-purple-50 text-purple-600 text-xs font-bold px-3 py-1 rounded-full">{linenOrders.length} pickups</span>
          </button>

          {linenExpanded && (
            <div className="px-6 pb-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {linenSummaries.map(s => <LinenSummaryCard key={s.name} name={s.name} color={s.color} orders={s.orders} />)}
              </div>

              {/* Linen Detail Table */}
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px]">
                  <thead>
                    <tr className="bg-[#f8fcff]">
                      <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3 rounded-tl-xl">Date</th>
                      <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Hostel</th>
                      <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Single Bedsheet</th>
                      <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Pillow Cover</th>
                      <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Duvet Cover</th>
                      <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Bath Towel</th>
                      <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3 rounded-tr-xl">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {linenOrders.sort((a, b) => new Date(a.date) - new Date(b.date)).map(o => (
                      <tr key={o.id} className="border-b border-gray-50 hover:bg-purple-50/30 transition-colors">
                        <td className="px-4 py-3 text-sm text-gray-600">{o.date}</td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-800">{o.property}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{o.details?.["Single Bedsheet"] || 0}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{o.details?.["Pillow Cover"] || 0}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{o.details?.["Duvet Cover"] || 0}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{o.details?.["Bath Towel"] || 0}</td>
                        <td className="px-4 py-3 text-sm font-bold text-gray-800">₹{o.amount?.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Hotel Section */}
      {(view === "hotel" || view === "all") && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-base font-bold text-gray-900 mb-4">Hotels & Airbnbs</h2>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {hotelSummaries.map(s => <LinenSummaryCard key={s.name} name={s.name} color={s.color} orders={s.orders} />)}
            </div>

            {/* Hotel Detail Table */}
            <div className="overflow-x-auto mt-4">
              <table className="w-full min-w-[700px]">
                <thead>
                  <tr className="bg-[#f8fcff]">
                    <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3 rounded-tl-xl">Date</th>
                    <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Property</th>
                    <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Bedsheet</th>
                    <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Pillow Cover</th>
                    <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Duvet Cover</th>
                    <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Towels</th>
                    <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3 rounded-tr-xl">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {hotelOrders.sort((a, b) => new Date(a.date) - new Date(b.date)).map(o => (
                    <tr key={o.id} className="border-b border-gray-50 hover:bg-orange-50/30 transition-colors">
                      <td className="px-4 py-3 text-sm text-gray-600">{o.date}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-800">{o.property}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{o.details?.["Bedsheet"] || o.details?.["Single Bedsheet"] || 0}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{o.details?.["Pillow Cover"] || 0}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{o.details?.["Duvet Cover"] || 0}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{(o.details?.["Bath Towel"] || 0) + (o.details?.["Hand Towel"] || 0)}</td>
                      <td className="px-4 py-3 text-sm font-bold text-gray-800">₹{o.amount?.toLocaleString()}</td>
                    </tr>
                  ))}
                  {hotelOrders.length === 0 && (
                    <tr>
                      <td colSpan="7" className="px-4 py-6 text-center text-sm text-gray-400">No hotel or Airbnb orders in this period.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
