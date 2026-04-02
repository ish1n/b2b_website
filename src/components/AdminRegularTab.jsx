// src/components/AdminRegularTab.jsx
import { useMemo, useState } from "react";
import { FiPlus, FiX, FiCheck, FiSmartphone, FiMessageSquare, FiShoppingBag, FiPhone, FiUser, FiEdit2, FiTrash2, FiInbox, FiCheckCircle, FiCalendar, FiChevronRight } from "react-icons/fi";
import EmptyState from "./EmptyState";
import { BiRupee } from "react-icons/bi";
import AdminOrderModal from "./AdminOrderModal";

const CHANNELS = ["All", "App", "Website", "WhatsApp", "Outlet", "Call", "Student"];
const CHANNEL_ICONS = { App: FiSmartphone, Website: FiShoppingBag, WhatsApp: FiMessageSquare, Outlet: FiShoppingBag, Call: FiPhone, Student: FiUser };
const CHANNEL_COLORS = { App: "#1976D2", Website: "#6366F1", WhatsApp: "#25D366", Outlet: "#D97706", Call: "#7C3AED", Student: "#059669" };

// Added "Shoe Cleaning" and "Other"
const SERVICE_TYPES = ["Wash & Fold", "Wash & Iron", "Wash & Fold + Iron", "Dry Clean", "Shoe Cleaning", "Other"];
const RATE_MAP = { "Wash & Fold": 55, "Wash & Iron": 90, "Wash & Fold + Iron": 120, "Dry Clean": 150, "Shoe Cleaning": 0, "Other": 0 };

const STATUS_BADGE = {
  Delivered: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  Confirmed: 'bg-blue-50 text-blue-700 border-blue-100',
  Pending: 'bg-amber-50 text-amber-700 border-amber-100',
};

export default function AdminRegularTab({ orders, onAddOrder, onEditOrder, onDeleteOrder }) {
  const [channelFilter, setChannelFilter] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState("");
  const [selectedDrilldownOrder, setSelectedDrilldownOrder] = useState(null);
  const [isDrilldownOpen, setIsDrilldownOpen] = useState(false);

  // Updated state: services array replaces individual serviceType, weight, and clothes
  const defaultService = () => ({ id: Date.now(), type: "Wash & Fold", customName: "", weight: "", items: "", amount: "" });

  const [form, setForm] = useState({
    customerName: "", phone: "", channel: "App",
    services: [defaultService()],
    amount: "", pickupDate: "", deliveryDate: "", notes: "", status: "Confirmed", id: null
  });

  const openEditModal = (order) => {
    // Check if it's a new multi-service order or legacy format
    let loadedServices = [];
    if (order.servicesList && order.servicesList.length > 0) {
      loadedServices = order.servicesList;
    } else {
      const sType = order.service?.split(" —")[0] || "Wash & Fold";
      const isOther = !SERVICE_TYPES.includes(sType) && sType !== "Wash & Fold";
      loadedServices = [{
        id: Date.now(),
        type: isOther ? "Other" : sType,
        customName: isOther ? sType : "",
        weight: order.weight?.toString() || "",
        items: order.items?.toString() || "",
        amount: order.amount?.toString() || ""
      }];
    }

    setForm({
      id: order.id,
      customerName: order.customerName || "",
      phone: order.customerNumber || "",
      channel: order.channel || "App",
      services: loadedServices,
      amount: order.amount || "",
      pickupDate: order.date || "",
      deliveryDate: order.deliveryDate || "",
      notes: order.notes || "",
      status: order.status || "Confirmed"
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
    setForm({ ...form, [key]: val });
  };

  const updateService = (index, field, val) => {
    const newServices = [...form.services];
    const srv = { ...newServices[index], [field]: val };

    // Auto-calculate line amount if weight or type changes
    if (field === 'type' || field === 'weight') {
      const rate = RATE_MAP[srv.type] || 0;
      const w = parseFloat(srv.weight) || 0;
      if (rate > 0 && w > 0) {
        srv.amount = (rate * w).toFixed(0);
      } else if (field === 'type' && rate === 0) {
        srv.amount = ""; // Reset for custom types to allow manual entry
      }
    }

    newServices[index] = srv;

    // Auto-sum total amount
    const totalAmt = newServices.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
    setForm({ ...form, services: newServices, amount: totalAmt > 0 ? totalAmt.toString() : form.amount });
  };

  const addService = () => {
    setForm({ ...form, services: [...form.services, defaultService()] });
  };

  const removeService = (index) => {
    if (form.services.length <= 1) return;
    const newServices = form.services.filter((_, i) => i !== index);
    const totalAmt = newServices.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
    setForm({ ...form, services: newServices, amount: totalAmt > 0 ? totalAmt.toString() : "" });
  };

  const handleSubmit = () => {
    if (!form.customerName || !form.amount) return;

    const totalWeight = form.services.reduce((sum, srv) => sum + (parseFloat(srv.weight) || 0), 0);
    const totalItems = form.services.reduce((sum, srv) => sum + (parseInt(srv.items) || 0), 0);

    // Generate an intelligent summary string for quick viewing in tables
    const serviceSummary = form.services.map(srv => {
      const name = srv.type === 'Other' ? (srv.customName || 'Other') : srv.type;
      const metrics = [];
      if (srv.weight) metrics.push(`${srv.weight}kg`);
      if (srv.items) metrics.push(`${srv.items}pcs`);
      return `${name}${metrics.length ? ` (${metrics.join(', ')})` : ''}`;
    }).join(" + ");

    const newOrder = {
      id: form.id || `reg-new-${Date.now()}`,
      property: "Regular Customers",
      category: "B2C_RETAIL",
      type: "regular",
      channel: form.channel,
      date: form.pickupDate || new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split("T")[0],
      deliveryDate: form.deliveryDate || "",
      amount: parseFloat(form.amount) || 0,
      status: form.status,
      items: totalItems,
      weight: totalWeight,
      customerName: form.customerName,
      customerNumber: form.phone,
      service: serviceSummary || "Custom Service",
      servicesList: form.services, // Saved to Firebase natively here!
      notes: form.notes,
    };

    if (form.id) {
      onEditOrder(newOrder);
      setToast("Order updated successfully!");
    } else {
      onAddOrder(newOrder);
      setToast("Order added successfully!");
    }

    setShowModal(false);
    setForm({ customerName: "", phone: "", channel: "App", services: [defaultService()], amount: "", pickupDate: "", deliveryDate: "", notes: "", status: "Confirmed", id: null });
    setTimeout(() => setToast(""), 3000);
  };

  return (
    <div className="space-y-8" style={{ fontFamily: 'DM Sans, sans-serif' }}>
      {toast && (
        <div className="fixed top-6 right-6 z-[100] bg-[#0F172A] text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-slide-left border border-slate-700/50 backdrop-blur-md">
          <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
            <FiCheck size={14} />
          </div>
          <span className="text-[13px] font-bold tracking-tight">{toast}</span>
        </div>
      )}

      {/* Channel Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {CHANNELS.filter(c => c !== "All").map(ch => {
          const Icon = CHANNEL_ICONS[ch];
          const stats = channelStats[ch];
          const isActive = channelFilter === ch;
          return (
            <button key={ch} onClick={() => setChannelFilter(ch === channelFilter ? "All" : ch)}
              className={`group bg-white rounded-xl border p-3.5 sm:p-5 text-left transition-all duration-300 relative overflow-hidden ${isActive ? 'border-blue-500 shadow-md ring-1 ring-blue-500/20' : 'border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200'}`}>
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-colors ${isActive ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-400 group-hover:bg-slate-100'}`} style={!isActive ? { color: CHANNEL_COLORS[ch], backgroundColor: CHANNEL_COLORS[ch] + '10' } : {}}>
                  <Icon size={16} />
                </div>
                {isActive && <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />}
              </div>
              <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{ch}</p>
              <div className="flex items-baseline gap-1.5 sm:gap-2">
                <p className="text-lg sm:text-[20px] font-black text-[#0F172A] tracking-tight">{stats.count}</p>
                <p className="text-[10px] sm:text-[11px] font-bold text-slate-400">orders</p>
              </div>
              <div className="flex items-center gap-0.5 text-[11px] sm:text-[12px] font-black text-blue-600 mt-1">
                <BiRupee size={10} className="mb-0.5" />
                <span>{stats.revenue.toLocaleString()}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Navigation & Action Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex bg-white/50 backdrop-blur-sm p-1.5 rounded-xl border border-gray-100 shadow-sm gap-1">
          {CHANNELS.map(ch => (
            <button key={ch} onClick={() => setChannelFilter(ch)}
              className={`px-4 py-2 rounded-lg text-[12px] font-bold tracking-tight transition-all duration-300 ${channelFilter === ch ? 'bg-white text-blue-600 shadow-sm border border-gray-100' : 'text-slate-500 hover:text-slate-900 hover:bg-white/40'}`}>
              {ch}
            </button>
          ))}
        </div>
        <button onClick={() => { setForm({ customerName: "", phone: "", channel: "App", services: [defaultService()], amount: "", pickupDate: "", deliveryDate: "", notes: "", status: "Confirmed", id: null }); setShowModal(true); }}
          className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-6 py-3 bg-blue-600 text-white text-[13px] font-black rounded-xl hover:bg-blue-700 transition-all shadow-lg active:scale-95 uppercase tracking-widest">
          <FiPlus size={18} /> Log New Order
        </button>
      </div>

      {/* Order Log Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-gray-50 flex items-center justify-between">
          <div>
            <h2 className="text-[15px] font-black text-[#0F172A] tracking-tight mb-0.5">Retail Transaction Log</h2>
            <p className="text-[12px] font-medium text-slate-400 uppercase tracking-widest">{filtered.length} total orders found</p>
          </div>
        </div>

        {/* Desktop Order Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead className="bg-[#F8FAFC]">
              <tr>
                <th className="text-left text-[11px] font-black text-[#64748B] px-6 py-4 uppercase tracking-[0.1em]">Customer Identity</th>
                <th className="text-left text-[11px] font-black text-[#64748B] px-6 py-4 uppercase tracking-[0.1em]">Service Detail</th>
                <th className="text-right text-[11px] font-black text-[#64748B] px-6 py-4 uppercase tracking-[0.1em]">Stats (KG/PCS)</th>
                <th className="text-right text-[11px] font-black text-[#64748B] px-6 py-4 uppercase tracking-[0.1em]">Amount (₹)</th>
                <th className="text-left text-[11px] font-black text-[#64748B] px-6 py-4 uppercase tracking-[0.1em]">Pickup Date</th>
                <th className="text-left text-[11px] font-black text-[#64748B] px-6 py-4 uppercase tracking-[0.1em]">Delivery Date</th>
                <th className="text-center text-[11px] font-black text-[#64748B] px-6 py-4 uppercase tracking-[0.1em]">Status</th>
                <th className="text-right text-[11px] font-black text-[#64748B] px-6 py-4 uppercase tracking-[0.1em]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-6 py-12">
                    <EmptyState
                      icon={FiInbox}
                      title="No matching transactions"
                      message="Adjust your filters or start by logging a new customer order."
                    />
                  </td>
                </tr>
              ) : filtered.sort((a, b) => new Date(b.date) - new Date(a.date)).map(o => (
                <tr
                  key={o.id}
                  onClick={() => { setSelectedDrilldownOrder(o); setIsDrilldownOpen(true); }}
                  className="border-b border-gray-50 hover:bg-[#F8FAFC] transition-colors group cursor-pointer"
                >
                  <td className="px-6 py-4">
                    <p className="text-[14px] font-black text-[#0F172A] tracking-tight">{o.customerName || 'Anonymous'}</p>
                    <p className="text-[11px] font-medium text-slate-400">{o.customerNumber || 'no contact'}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-[13px] font-bold text-slate-700 truncate max-w-[200px]" title={o.service}>
                        {o.service?.split(" —")[0] || o.service}
                      </p>
                      <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 uppercase tracking-tighter">
                        {o.channel || 'direct'}
                      </span>
                    </div>
                    <p className="text-[11px] font-medium text-slate-400 italic truncate max-w-[150px]">{o.notes || 'No special notes'}</p>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <p className="text-[13px] font-black text-slate-800">{o.weight?.toFixed(1) || '0.0'} <span className="text-[10px] text-slate-400">kg</span></p>
                    <p className="text-[11px] font-bold text-slate-400">{o.items || '—'} pcs</p>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-0.5 text-[14px] font-black text-blue-600 tracking-tight">
                      <BiRupee size={13} className="mb-0.5" />
                      <span>{o.amount?.toLocaleString()}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-[13px] font-bold text-slate-500 whitespace-nowrap">{o.date}</td>
                  <td className="px-6 py-4 text-[13px] font-bold text-slate-500 whitespace-nowrap">{o.deliveryDate || 'Pending'}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${STATUS_BADGE[o.status] || 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                      {o.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1.5 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                      <button onClick={(e) => { e.stopPropagation(); openEditModal(o); }} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all">
                        <FiEdit2 size={15} />
                      </button>
                      {onDeleteOrder && (
                        <button onClick={(e) => { e.stopPropagation(); onDeleteOrder(o); }} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all">
                          <FiTrash2 size={15} />
                        </button>
                      )}
                      <FiChevronRight size={16} className="text-slate-400 ml-1" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card Layout */}
        <div className="md:hidden divide-y divide-gray-50 uppercase tracking-tight">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs italic uppercase">No matching transactions</div>
          ) : filtered.sort((a, b) => new Date(b.date) - new Date(a.date)).map(o => (
            <div
              key={o.id}
              onClick={() => { setSelectedDrilldownOrder(o); setIsDrilldownOpen(true); }}
              className="p-4 active:bg-slate-50 transition-colors cursor-pointer"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="text-sm font-black text-[#0F172A]">{o.customerName || 'Anonymous'}</h4>
                  <p className="text-[10px] font-bold text-slate-400">{o.customerNumber || 'NO CONTACT'}</p>
                </div>
                <div className="flex flex-col items-end">
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border mb-1.5 ${STATUS_BADGE[o.status] || 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                    {o.status}
                  </span>
                  <div className="flex items-center gap-0.5 text-sm font-black text-blue-600">
                    <BiRupee size={12} className="text-blue-400" />
                    <span>{o.amount?.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50/50 rounded-xl p-3 border border-slate-100/50 flex items-center justify-between mb-3">
                <div className="flex flex-col">
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Service</span>
                  <span className="text-[11px] font-bold text-slate-700 truncate max-w-[120px]">{o.service?.split(" —")[0] || o.service}</span>
                </div>
                <div className="text-right">
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">Metric</span>
                  <span className="text-[11px] font-black text-slate-700">{o.weight?.toFixed(1)} KG / {o.items} PCS</span>
                </div>
              </div>

              <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                <div className="flex items-center gap-1.5">
                  <FiCalendar size={12} />
                  <span>{o.date}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="uppercase text-[8px] tracking-widest">To:</span>
                  <span className={o.deliveryDate ? 'text-slate-600' : 'text-amber-500'}>{o.deliveryDate || 'TBD'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Order Modal - Redesigned */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-end p-0 sm:p-4">
          <div className="absolute inset-0 bg-[#0F172A]/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative w-full max-w-lg h-full sm:h-auto sm:max-h-[90vh] bg-white sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-slide-left">
            <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
              <div>
                <h2 className="text-[18px] font-black text-[#0F172A] tracking-tight">{form.id ? 'Modify Transaction' : 'Record New Sale'}</h2>
                <p className="text-[12px] font-medium text-slate-400 uppercase tracking-widest mt-0.5">Andes B2C Retail Management</p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                <FiX size={26} />
              </button>
            </div>

            <div className="p-8 space-y-6 overflow-y-auto">
              {/* Customer Details */}
              <div className="grid grid-cols-2 gap-5">
                <div className="col-span-2">
                  <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">Customer Identity *</label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"><FiUser size={18} /></div>
                    <input type="text" value={form.customerName} onChange={e => updateForm("customerName", e.target.value)}
                      className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-[14px] font-bold text-slate-700 focus:bg-white focus:border-blue-500 focus:outline-none transition-all" placeholder="Legal name or Alias" />
                  </div>
                </div>

                <div className="col-span-1">
                  <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">Contact Link</label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"><FiPhone size={16} /></div>
                    <input type="text" value={form.phone} onChange={e => updateForm("phone", e.target.value)}
                      className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-[14px] font-bold text-slate-700 focus:bg-white focus:border-blue-500 focus:outline-none transition-all" placeholder="Mobile info" />
                  </div>
                </div>

                <div className="col-span-1">
                  <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">Acquisition Channel</label>
                  <select value={form.channel} onChange={e => updateForm("channel", e.target.value)}
                    className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-[14px] font-black text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none appearance-none">
                    {CHANNELS.filter(c => c !== "All").map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              {/* Pickup and Delivery Dates Section */}
              <div className="grid grid-cols-3 gap-3 sm:gap-4 pt-4 border-t border-slate-50">
                <div>
                  <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">Pickup</label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"><FiCalendar size={14} /></div>
                    <input type="date" value={form.pickupDate} onChange={e => updateForm("pickupDate", e.target.value)}
                      className="w-full pl-10 pr-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[13px] font-bold text-slate-700 focus:bg-white focus:border-blue-500 focus:outline-none transition-all" />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">Delivery</label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"><FiCalendar size={14} /></div>
                    <input type="date" value={form.deliveryDate} onChange={e => updateForm("deliveryDate", e.target.value)}
                      className="w-full pl-10 pr-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[13px] font-bold text-slate-700 focus:bg-white focus:border-blue-500 focus:outline-none transition-all" />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">Status</label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"><FiCheckCircle size={14} /></div>
                    <select value={form.status} onChange={e => updateForm("status", e.target.value)}
                      className="w-full pl-10 pr-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[13px] font-bold text-slate-700 focus:bg-white focus:border-blue-500 focus:outline-none appearance-none transition-all">
                      <option value="Confirmed">Confirmed</option>
                      <option value="Pickup Done">Pickup Done</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Delivered">Delivered</option>
                      <option value="Pending">Pending</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Multi-Service Mapping Section */}
              <div className="pt-4 border-t border-slate-50">
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest">Service Breakdown</label>
                  <button type="button" onClick={addService} className="text-[11px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 bg-blue-50 px-2.5 py-1 rounded-md transition-colors border border-blue-100">
                    <FiPlus size={12} /> Add Service
                  </button>
                </div>

                <div className="space-y-3">
                  {form.services.map((srv, index) => (
                    <div key={srv.id} className="relative bg-slate-50/50 p-3 sm:p-4 rounded-2xl border border-slate-100 shadow-sm transition-all">
                      {form.services.length > 1 && (
                        <button type="button" onClick={() => removeService(index)} className="absolute -top-2.5 -right-2.5 bg-white border border-red-100 text-red-500 p-1.5 rounded-full hover:bg-red-50 hover:text-red-600 transition-colors shadow-sm">
                          <FiX size={14} />
                        </button>
                      )}
                      <div className="grid grid-cols-12 gap-2 sm:gap-3">
                        <div className="col-span-12">
                          <select value={srv.type} onChange={e => updateService(index, "type", e.target.value)}
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-[13px] font-bold text-slate-700 focus:border-blue-500 focus:outline-none">
                            {SERVICE_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                          {srv.type === "Other" && (
                            <input type="text" value={srv.customName} onChange={e => updateService(index, "customName", e.target.value)}
                              className="w-full mt-2 px-4 py-2.5 bg-white border border-blue-200 rounded-xl text-[13px] font-bold text-blue-800 placeholder:text-blue-300 focus:border-blue-500 focus:outline-none" placeholder="Type custom service name..." />
                          )}
                        </div>
                        <div className="col-span-4">
                          <input type="number" step="0.1" value={srv.weight} onChange={e => updateService(index, "weight", e.target.value)}
                            className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-[13px] font-bold text-slate-700 focus:border-blue-500 focus:outline-none" placeholder="Weight" />
                        </div>
                        <div className="col-span-4">
                          <input type="number" value={srv.items} onChange={e => updateService(index, "items", e.target.value)}
                            className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-[13px] font-bold text-slate-700 focus:border-blue-500 focus:outline-none" placeholder="Pcs" />
                        </div>
                        <div className="col-span-4 relative">
                          <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold"><BiRupee size={12} /></div>
                          <input type="number" value={srv.amount} onChange={e => updateService(index, "amount", e.target.value)}
                            className="w-full pl-6 pr-2 py-2.5 bg-white border border-slate-200 rounded-xl text-[13px] font-bold text-slate-700 focus:border-blue-500 focus:outline-none" placeholder="Amt" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">Final Bill Amount</label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                      <BiRupee size={16} />
                    </div>
                    <input type="number" value={form.amount} onChange={e => updateForm("amount", e.target.value)}
                      className={`w-full pl-10 pr-4 py-4 rounded-xl text-[18px] font-black focus:outline-none border transition-all ${form.amount ? 'bg-blue-50/50 border-blue-200 text-blue-700' : 'bg-slate-50 border-slate-200 text-slate-700'}`} placeholder="0" />
                  </div>
                </div>
                <div className="flex items-end pb-1.5">
                  <div className="text-[11px] font-medium text-slate-400 leading-tight">
                    Total amount is auto-calculated based on service lines, but can be manually overridden.
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">Instructional Notes</label>
                <textarea value={form.notes} onChange={e => updateForm("notes", e.target.value)} rows={2}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[13px] font-bold text-slate-700 focus:bg-white focus:border-blue-500 focus:outline-none resize-none transition-all" placeholder="Any special care instructions?" />
              </div>
            </div>

            <div className="p-8 border-t border-slate-50 bg-slate-50/20 flex gap-4 mt-auto">
              <button onClick={() => setShowModal(false)} className="flex-1 py-4 bg-slate-100 text-slate-500 font-black text-[13px] rounded-xl hover:bg-slate-200 transition-all uppercase tracking-widest">Cancel</button>
              <button onClick={handleSubmit} disabled={!form.customerName || !form.amount}
                className="flex-[2] py-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-30 disabled:cursor-not-allowed text-white font-black text-[13px] rounded-xl transition-all shadow-xl active:scale-95 uppercase tracking-widest">
                {form.id ? 'Validate & Update' : 'Commit Transaction'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deep Drill-Down Order Modal */}
      <AdminOrderModal
        isOpen={isDrilldownOpen}
        onClose={() => setIsDrilldownOpen(false)}
        order={selectedDrilldownOrder}
      />
    </div>
  );
}
