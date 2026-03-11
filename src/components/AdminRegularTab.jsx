import { useMemo, useState } from "react";
import { FiPlus, FiX, FiCheck, FiSmartphone, FiMessageSquare, FiShoppingBag, FiPhone, FiUser, FiEdit2, FiTrash2 } from "react-icons/fi";

const CHANNELS = ["All", "App", "WhatsApp", "Outlet", "Mobile", "Student"];
const CHANNEL_ICONS = { App: FiSmartphone, WhatsApp: FiMessageSquare, Outlet: FiShoppingBag, Mobile: FiPhone, Student: FiUser };
const CHANNEL_COLORS = { App: "#1976D2", WhatsApp: "#25D366", Outlet: "#D97706", Mobile: "#7C3AED", Student: "#059669" };
const SERVICE_TYPES = ["Wash & Fold", "Wash & Iron", "Wash & Fold + Iron", "Dry Clean", "Other"];
const RATE_MAP = { "Wash & Fold": 49, "Wash & Iron": 90, "Wash & Fold + Iron": 120, "Dry Clean": 150, "Other": 0 };

const STATUS_BADGE = {
  Delivered: 'bg-green-100 text-green-600',
  Confirmed: 'bg-blue-100 text-[#1976D2]',
  Pending: 'bg-orange-100 text-orange-600',
};

export default function AdminRegularTab({ orders, onAddOrder, onEditOrder, onDeleteOrder }) {
  const [channelFilter, setChannelFilter] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState("");
  const [form, setForm] = useState({
    customerName: "", phone: "", channel: "App", serviceType: "Wash & Fold",
    weight: "", clothes: "", amount: "", pickupDate: "", deliveryDate: "", notes: "", id: null
  });

  const openEditModal = (order) => {
    setForm({
      id: order.id,
      customerName: order.customerName || "",
      phone: order.customerNumber || "",
      channel: order.channel || "App",
      serviceType: order.service?.split(" —")[0] || "Wash & Fold",
      weight: order.weight || "",
      clothes: order.items || "",
      amount: order.amount || "",
      pickupDate: order.date || "",
      deliveryDate: order.deliveryDate || "",
      notes: order.notes || ""
    });
    setShowModal(true);
  };

  const regularOrders = useMemo(() => orders.filter(o => o.type === "regular"), [orders]);
  const filtered = useMemo(() =>
    channelFilter === "All" ? regularOrders : regularOrders.filter(o => o.channel === channelFilter),
    [regularOrders, channelFilter]);

  const channelStats = useMemo(() => {
    const stats = {};
    CHANNELS.filter(c => c !== "All").forEach(c => { stats[c] = { count: 0, revenue: 0 }; });
    regularOrders.forEach(o => { if (stats[o.channel]) { stats[o.channel].count++; stats[o.channel].revenue += o.amount || 0; } });
    return stats;
  }, [regularOrders]);

  const updateForm = (key, val) => {
    const updated = { ...form, [key]: val };
    // Auto-suggest amount
    if ((key === "weight" || key === "serviceType") && updated.weight) {
      const rate = RATE_MAP[updated.serviceType] || 0;
      const w = parseFloat(updated.weight) || 0;
      if (rate > 0 && w > 0) updated.amount = (rate * w).toFixed(0);
    }
    setForm(updated);
  };

  const handleSubmit = () => {
    if (!form.customerName || !form.amount) return;
    const newOrder = {
      id: `reg-new-${Date.now()}`,
      property: "Regular Customers",
      category: "B2C_RETAIL",
      type: "regular",
      channel: form.channel,
      date: form.pickupDate || new Date().toISOString().split("T")[0],
      amount: parseFloat(form.amount) || 0,
      status: "Confirmed",
      items: parseInt(form.clothes) || 1,
      weight: parseFloat(form.weight) || 0,
      customerName: form.customerName,
      customerNumber: form.phone,
      service: `${form.serviceType}${form.weight ? ` — ${form.weight} KG` : ""}`,
      notes: form.notes,
    };
    
    if (form.id) {
      newOrder.id = form.id;
      onEditOrder(newOrder);
      setToast("Order updated successfully!");
    } else {
      onAddOrder(newOrder);
      setToast("Order added successfully!");
    }
    
    setShowModal(false);
    setForm({ customerName: "", phone: "", channel: "App", serviceType: "Wash & Fold", weight: "", clothes: "", amount: "", pickupDate: "", deliveryDate: "", notes: "", id: null });
    setTimeout(() => setToast(""), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 bg-green-500 text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-pulse">
          <FiCheck size={16} /> {toast}
        </div>
      )}

      {/* Channel Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {CHANNELS.filter(c => c !== "All").map(ch => {
          const Icon = CHANNEL_ICONS[ch];
          const stats = channelStats[ch];
          return (
            <button key={ch} onClick={() => setChannelFilter(ch === channelFilter ? "All" : ch)}
              className={`bg-white rounded-xl border shadow-sm p-4 text-left hover:shadow-md transition-all ${channelFilter === ch ? 'border-[#1976D2] ring-2 ring-blue-100' : 'border-gray-100'}`}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: CHANNEL_COLORS[ch] + '15' }}>
                  <Icon size={16} style={{ color: CHANNEL_COLORS[ch] }} />
                </div>
                <span className="text-xs font-bold text-gray-700">{ch}</span>
              </div>
              <p className="text-lg font-bold text-gray-900">{stats.count}</p>
              <p className="text-[10px] text-gray-400">₹{stats.revenue.toLocaleString()}</p>
            </button>
          );
        })}
      </div>

      {/* Filter pills + Add button */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          {CHANNELS.map(ch => (
            <button key={ch} onClick={() => setChannelFilter(ch)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${channelFilter === ch ? 'bg-[#1976D2] text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
              {ch}
            </button>
          ))}
        </div>
        <button onClick={() => { setForm({ customerName: "", phone: "", channel: "App", serviceType: "Wash & Fold", weight: "", clothes: "", amount: "", pickupDate: "", deliveryDate: "", notes: "", id: null }); setShowModal(true); }} className="flex items-center gap-1.5 px-4 py-2 bg-[#1976D2] text-white text-xs font-bold rounded-xl hover:bg-[#1565C0] transition-all shadow-sm">
          <FiPlus size={14} /> Add Order
        </button>
      </div>

      {/* Order Log Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <p className="text-xs text-gray-400 mb-4">{filtered.length} order{filtered.length !== 1 ? 's' : ''}</p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="bg-[#f8fcff]">
                <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3 rounded-tl-xl">Date</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Customer</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Phone</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Channel</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Service</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">KG</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Amount</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Status</th>
                <th className="text-right text-xs font-semibold text-gray-500 px-4 py-3 rounded-tr-xl">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.sort((a, b) => new Date(b.date) - new Date(a.date)).map(o => (
                <tr key={o.id} className="border-b border-gray-50 hover:bg-blue-50/30 transition-colors">
                  <td className="px-4 py-3 text-sm text-gray-600">{o.date}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-800">{o.customerName || '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{o.customerNumber || '—'}</td>
                  <td className="px-4 py-3">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase" style={{ backgroundColor: (CHANNEL_COLORS[o.channel] || '#6B7280') + '15', color: CHANNEL_COLORS[o.channel] || '#6B7280' }}>
                      {o.channel || '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 max-w-[200px] truncate">{o.service}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{o.weight?.toFixed(1) || '—'}</td>
                  <td className="px-4 py-3 text-sm font-bold text-gray-800">₹{o.amount?.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={`px-3 py-0.5 rounded-full text-xs font-semibold ${STATUS_BADGE[o.status] || 'bg-gray-100 text-gray-500'}`}>{o.status}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => openEditModal(o)} className="p-1.5 text-gray-400 hover:text-[#1976D2] hover:bg-blue-50 rounded-lg transition-colors">
                      <FiEdit2 size={14} />
                    </button>
                    {onDeleteOrder && (
                      <button onClick={() => onDeleteOrder(o)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors ml-1">
                        <FiTrash2 size={14} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Order Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-end">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative w-full max-w-md h-full bg-white shadow-2xl overflow-y-auto animate-slide-in" style={{ fontFamily: 'Poppins' }}>
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-lg font-bold text-gray-900">{form.id ? 'Edit Order' : 'Add New Order'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><FiX size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              {/* Customer Name */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Customer Name *</label>
                <input type="text" value={form.customerName} onChange={e => updateForm("customerName", e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-[#1976D2] focus:outline-none" placeholder="Enter name" />
              </div>
              {/* Phone */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Phone Number</label>
                <input type="text" value={form.phone} onChange={e => updateForm("phone", e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-[#1976D2] focus:outline-none" placeholder="Enter phone" />
              </div>
              {/* Channel */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Channel</label>
                <select value={form.channel} onChange={e => updateForm("channel", e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-[#1976D2] focus:outline-none bg-white">
                  {CHANNELS.filter(c => c !== "All").map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              {/* Service Type */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Service Type</label>
                <select value={form.serviceType} onChange={e => updateForm("serviceType", e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-[#1976D2] focus:outline-none bg-white">
                  {SERVICE_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              {/* Weight + Clothes */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Weight (KG)</label>
                  <input type="number" step="0.1" value={form.weight} onChange={e => updateForm("weight", e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-[#1976D2] focus:outline-none" placeholder="0.0" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Clothes (optional)</label>
                  <input type="number" value={form.clothes} onChange={e => updateForm("clothes", e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-[#1976D2] focus:outline-none" placeholder="0" />
                </div>
              </div>
              {/* Amount */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Amount (₹) *</label>
                <input type="number" value={form.amount} onChange={e => updateForm("amount", e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-[#1976D2] focus:outline-none" placeholder="Auto-calculated" />
                {form.weight && RATE_MAP[form.serviceType] > 0 && (
                  <p className="text-[10px] text-gray-400 mt-1">Auto: {form.weight} KG × ₹{RATE_MAP[form.serviceType]}/kg = ₹{(parseFloat(form.weight) * RATE_MAP[form.serviceType]).toFixed(0)}</p>
                )}
              </div>
              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Pickup Date</label>
                  <input type="date" value={form.pickupDate} onChange={e => updateForm("pickupDate", e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-[#1976D2] focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Delivery Date</label>
                  <input type="date" value={form.deliveryDate} onChange={e => updateForm("deliveryDate", e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-[#1976D2] focus:outline-none" />
                </div>
              </div>
              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Notes</label>
                <textarea value={form.notes} onChange={e => updateForm("notes", e.target.value)} rows={3}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-[#1976D2] focus:outline-none resize-none" placeholder="Optional notes..." />
              </div>
            </div>
            {/* Submit */}
            <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4">
              <button onClick={handleSubmit} disabled={!form.customerName || !form.amount}
                className="w-full py-3 bg-[#1976D2] hover:bg-[#1565C0] disabled:opacity-50 text-white font-bold text-sm rounded-xl transition-all">
                {form.id ? 'Save Changes' : 'Add Order'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
