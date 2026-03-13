import { useMemo } from "react";
import { FiChevronDown, FiChevronRight } from "react-icons/fi";
import { BiRupee } from "react-icons/bi";

const HOTEL_PROPERTIES = ["Airbnb Viman Nagar"];
const HOSTEL_COLORS = { "Airbnb Viman Nagar": "#D97706" };

function LinenSummaryCard({ name, color, orders, revenue }) {
  const totals = {};
  orders.forEach(o => {
    if (o.details) Object.entries(o.details).forEach(([k, v]) => { totals[k] = (totals[k] || 0) + (v || 0); });
  });
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
        <h3 className="text-sm font-bold text-gray-800">{name}</h3>
        <div className="ml-auto text-right">
          <span className="text-[10px] text-gray-400 font-medium block mb-0.5">{orders.length} pickups</span>
          {revenue !== undefined && (
            <span className="text-xs font-bold text-green-600 flex items-center justify-end gap-0.5"><BiRupee size={12} />{revenue.toLocaleString()}</span>
          )}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        {Object.entries(totals).filter(([, v]) => v > 0).map(([k, v]) => (
          <div key={k}><span className="text-gray-400">{k}</span><p className="font-bold text-gray-700">{v}</p></div>
        ))}
      </div>
    </div>
  );
}

export default function AdminHotelsTab({ orders }) {
  const hotelOrders = useMemo(() => orders.filter(o => o.type === "airbnb"), [orders]);

  // Hotel summaries
  // Hotel summaries
  const hotelSummaries = useMemo(() =>
    HOTEL_PROPERTIES.map(name => {
      const ho = hotelOrders.filter(o => o.property === name);
      const revenue = ho.reduce((s, o) => s + (o.amount || 0), 0); // Calculate revenue
      return {
        name, orders: ho, revenue,
        color: HOSTEL_COLORS[name] || "#6B7280"
      };
    }).filter(h => h.orders.length > 0), [hotelOrders]);
  return (
    <div className="space-y-6" style={{ fontFamily: 'DM Sans, sans-serif' }}>
      {/* Hotel Section */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-base font-bold text-gray-900 mb-4">Hotels & Airbnbs</h2>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {hotelSummaries.map(s => <LinenSummaryCard key={s.name} name={s.name} color={s.color} orders={s.orders} revenue={s.revenue} />)}          </div>

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
                    <td className="px-4 py-3 text-sm font-bold text-gray-800">
                      <div className="flex items-center gap-0.5">
                        <BiRupee size={12} className="mb-0.5" />
                        <span>{o.amount?.toLocaleString()}</span>
                      </div>
                    </td>
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
    </div>
  );
}
