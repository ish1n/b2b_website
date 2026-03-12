import { useMemo, useState } from "react";
import { FiPlus, FiX, FiCheck, FiSmartphone, FiMessageSquare, FiShoppingBag, FiPhone, FiUser, FiEdit2, FiTrash2, FiInbox, FiCheckCircle, FiClock, FiAlertTriangle } from "react-icons/fi";
import EmptyState from "./EmptyState";

const CHANNELS = ["All", "App", "WhatsApp", "Outlet", "Mobile", "Student"];
const CHANNEL_ICONS = { App: FiSmartphone, WhatsApp: FiMessageSquare, Outlet: FiShoppingBag, Mobile: FiPhone, Student: FiUser };
import { BiRupee } from "react-icons/bi";
const CHANNEL_COLORS = { App: "#1976D2", WhatsApp: "#25D366", Outlet: "#D97706", Mobile: "#7C3AED", Student: "#059669" };
const SERVICE_TYPES = ["Wash & Fold", "Wash & Iron", "Wash & Fold + Iron", "Dry Clean", "Other"];
const RATE_MAP = { "Wash & Fold": 49, "Wash & Iron": 90, "Wash & Fold + Iron": 120, "Dry Clean": 150, "Other": 0 };

const STATUS_BADGE = {
  Delivered: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  Confirmed: 'bg-blue-50 text-blue-700 border-blue-100',
  Pending: 'bg-amber-50 text-amber-700 border-amber-100',
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
      date: form.pickupDate || new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split("T")[0],
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
    <div className="space-y-8" style={{ fontFamily: 'DM Sans, sans-serif' }}>
      {/* Toast */}
      {toast && (
        <div className="fixed top-6 right-6 z-[100] bg-[#0F172A] text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-slide-left border border-slate-700/50 backdrop-blur-md">
          <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
            <FiCheck size={14} />
          </div>
          <span className="text-[13px] font-bold tracking-tight">{toast}</span>
        </div>
      )}

      {/* Channel Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {CHANNELS.filter(c => c !== "All").map(ch => {
          const Icon = CHANNEL_ICONS[ch];
          const stats = channelStats[ch];
          const isActive = channelFilter === ch;
          return (
            <button key={ch} onClick={() => setChannelFilter(ch === channelFilter ? "All" : ch)}
              className={`group bg-white rounded-xl border p-5 text-left transition-all duration-300 relative overflow-hidden ${isActive ? 'border-blue-500 shadow-md ring-1 ring-blue-500/20' : 'border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200'}`}>
              <div className="flex items-center justify-between mb-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${isActive ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-400 group-hover:bg-slate-100'}`} style={!isActive ? { color: CHANNEL_COLORS[ch], backgroundColor: CHANNEL_COLORS[ch] + '10' } : {}}>
                  <Icon size={18} />
                </div>
                {isActive && <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />}
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{ch}</p>
              <div className="flex items-baseline gap-2">
                <p className="text-[20px] font-black text-[#0F172A] tracking-tight">{stats.count}</p>
                <p className="text-[11px] font-bold text-slate-400">orders</p>
              </div>
              <div className="flex items-center gap-0.5 text-[12px] font-black text-blue-600 mt-1">
                <BiRupee size={12} className="mb-0.5" />
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
        <button onClick={() => { setForm({ customerName: "", phone: "", channel: "App", serviceType: "Wash & Fold", weight: "", clothes: "", amount: "", pickupDate: "", deliveryDate: "", notes: "", id: null }); setShowModal(true); }} 
          className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-6 py-3 bg-blue-600 text-white text-[13px] font-black rounded-xl hover:bg-blue-700 transition-all shadow-lg active:scale-95 uppercase tracking-widest">
          <FiPlus size={18} /> Log New Order
        </button>
      </div>

      {/* Order Log Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-50 flex items-center justify-between">
          <div>
            <h2 className="text-[15px] font-black text-[#0F172A] tracking-tight mb-0.5">Retail Transaction Log</h2>
            <p className="text-[12px] font-medium text-slate-400 uppercase tracking-widest">{filtered.length} total orders found</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead className="bg-[#F8FAFC]">
              <tr>
                <th className="text-left text-[11px] font-black text-[#64748B] px-6 py-4 uppercase tracking-[0.1em]">Date</th>
                <th className="text-left text-[11px] font-black text-[#64748B] px-6 py-4 uppercase tracking-[0.1em]">Customer Detail</th>
                <th className="text-left text-[11px] font-black text-[#64748B] px-6 py-4 uppercase tracking-[0.1em]">Channel</th>
                <th className="text-left text-[11px] font-black text-[#64748B] px-6 py-4 uppercase tracking-[0.1em]">Service Detail</th>
                <th className="text-right text-[11px] font-black text-[#64748B] px-6 py-4 uppercase tracking-[0.1em]">Stats</th>
                <th className="text-right text-[11px] font-black text-[#64748B] px-6 py-4 uppercase tracking-[0.1em]">Revenue</th>
                <th className="text-center text-[11px] font-black text-[#64748B] px-6 py-4 uppercase tracking-[0.1em]">Status</th>
                <th className="text-right text-[11px] font-black text-[#64748B] px-6 py-4 uppercase tracking-[0.1em]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12">
                    <EmptyState 
                      icon={FiInbox}
                      title="No matching transactions"
                      message="Adjust your filters or start by logging a new customer order."
                    />
                  </td>
                </tr>
              ) : filtered.sort((a, b) => new Date(b.date) - new Date(a.date)).map(o => (
                <tr key={o.id} className="border-b border-gray-50 hover:bg-[#F8FAFC] transition-colors group">
                  <td className="px-6 py-4 text-[13px] font-bold text-slate-500 whitespace-nowrap">{o.date}</td>
                  <td className="px-6 py-4">
                     <p className="text-[14px] font-black text-[#0F172A] tracking-tight">{o.customerName || 'Anonymous'}</p>
                     <p className="text-[11px] font-medium text-slate-400">{o.customerNumber || 'no contact'}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider" style={{ backgroundColor: (CHANNEL_COLORS[o.channel] || '#6B7280') + '15', color: CHANNEL_COLORS[o.channel] || '#6B7280' }}>
                      {o.channel || 'direct'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                     <p className="text-[13px] font-bold text-slate-700">{o.service?.split(" —")[0]}</p>
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
                  <td className="px-6 py-4 text-center">
                    <span className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${STATUS_BADGE[o.status] || 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                      {o.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEditModal(o)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all">
                        <FiEdit2 size={15} />
                      </button>
                      {onDeleteOrder && (
                        <button onClick={() => onDeleteOrder(o)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all">
                          <FiTrash2 size={15} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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

              <div className="pt-4 border-t border-slate-50">
                 <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-3">Service Profile & Metrics</label>
                 <div className="grid grid-cols-2 gap-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                    <div className="col-span-2">
                      <select value={form.serviceType} onChange={e => updateForm("serviceType", e.target.value)}
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-[14px] font-bold text-slate-700 focus:border-blue-500 focus:outline-none">
                        {SERVICE_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <input type="number" step="0.1" value={form.weight} onChange={e => updateForm("weight", e.target.value)}
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-[14px] font-bold text-slate-700 focus:border-blue-500 focus:outline-none" placeholder="Weight (KG)" />
                    </div>
                    <div>
                      <input type="number" value={form.clothes} onChange={e => updateForm("clothes", e.target.value)}
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-[14px] font-bold text-slate-700 focus:border-blue-500 focus:outline-none" placeholder="Item Count" />
                    </div>
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
                    {form.weight && RATE_MAP[form.serviceType] > 0 && (
                      <div className="text-[11px] font-bold text-slate-400 leading-tight">
                         Standard Pricing Rate:<br/>
                         <div className="flex items-center gap-0.5 text-blue-500">
                           <BiRupee size={10} />
                           <span>{RATE_MAP[form.serviceType]}/kg applied</span>
                         </div>
                      </div>
                    )}
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
    </div>
  );
}
