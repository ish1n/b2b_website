import { useState, useEffect, useMemo, useCallback } from "react";
import { collection, onSnapshot, addDoc, deleteDoc, doc, updateDoc, Timestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage, auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  DollarSign, TrendingUp, CalendarDays, Plus, X, Upload, Trash2, Eye,
  FileText, Loader2, ImageIcon, PieChart as PieChartIcon, BarChart3, Download
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";
import { BiRupee } from "react-icons/bi";

/* ─── constants ─── */
const CATEGORIES = [
  "Purchase things for dark store",
  "Setup cost",
  "Workers payment",
  "Out of the box",
  "Vendor payment",
  "Other",
];

const CAT_COLORS = {
  "Purchase things for dark store": "#6366F1",
  "Setup cost": "#F59E0B",
  "Workers payment": "#10B981",
  "Out of the box": "#F43F5E",
  "Vendor payment": "#3B82F6",
  Other: "#64748B",
};

const MONTHS = [
  "All", "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const emptyForm = {
  amount: "", payee: "", description: "", category: "", date: "", file: null,
};

/* ─── Component ─── */
export default function AdminExpensesTab() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState("");
  const [lightboxUrl, setLightboxUrl] = useState(null);
  const [monthFilter, setMonthFilter] = useState("All");
  const [catFilter, setCatFilter] = useState("All");

  /* ─── Firestore listener ─── */
  useEffect(() => {
    let unsubSnapshot = () => {};
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      unsubSnapshot();
      if (user) {
        unsubSnapshot = onSnapshot(
          collection(db, "b2b_expenses"),
          (snap) => {
            const data = snap.docs.map((d) => {
              const raw = d.data();
              let dateStr = "";
              if (raw.date) {
                dateStr = typeof raw.date === "string"
                  ? raw.date
                  : raw.date.toDate
                    ? new Date(raw.date.toDate().getTime() - raw.date.toDate().getTimezoneOffset() * 60000).toISOString().split("T")[0]
                    : "";
              }
              return { id: d.id, ...raw, date: dateStr };
            });
            data.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
            setExpenses(data);
            setLoading(false);
          },
          (err) => {
            console.error("Expenses listener error", err);
            setLoading(false);
          }
        );
      } else {
        setExpenses([]);
        setLoading(false);
      }
    });
    return () => { unsubAuth(); unsubSnapshot(); };
  }, []);

  /* ─── Filtering ─── */
  const filtered = useMemo(() => {
    let list = expenses;
    if (monthFilter !== "All") {
      const mIdx = MONTHS.indexOf(monthFilter); // 1‑based
      list = list.filter((e) => {
        if (!e.date) return false;
        return new Date(e.date).getMonth() + 1 === mIdx;
      });
    }
    if (catFilter !== "All") {
      list = list.filter((e) => e.category === catFilter);
    }
    return list;
  }, [expenses, monthFilter, catFilter]);

  /* ─── KPIs ─── */
  const kpis = useMemo(() => {
    const total = filtered.reduce((s, e) => s + (e.amount || 0), 0);
    const now = new Date();
    const thisMonth = expenses.filter((e) => {
      if (!e.date) return false;
      const d = new Date(e.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const monthTotal = thisMonth.reduce((s, e) => s + (e.amount || 0), 0);
    const catMap = {};
    filtered.forEach((e) => {
      catMap[e.category] = (catMap[e.category] || 0) + (e.amount || 0);
    });
    let topCat = "—";
    let topVal = 0;
    Object.entries(catMap).forEach(([c, v]) => { if (v > topVal) { topCat = c; topVal = v; } });
    return { total, monthTotal, topCat, count: filtered.length };
  }, [filtered, expenses]);

  /* ─── Chart data ─── */
  const areaData = useMemo(() => {
    const map = {};
    filtered.forEach((e) => {
      if (!e.date) return;
      map[e.date] = (map[e.date] || 0) + (e.amount || 0);
    });
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, amount]) => ({ date, amount }));
  }, [filtered]);

  const pieData = useMemo(() => {
    const map = {};
    filtered.forEach((e) => {
      map[e.category] = (map[e.category] || 0) + (e.amount || 0);
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [filtered]);

  /* ─── Form helpers ─── */
  const openNew = () => {
    setEditingId(null);
    setForm({ ...emptyForm, date: new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split("T")[0] });
    setErrors({});
    setShowModal(true);
  };

  const openEdit = (exp) => {
    setEditingId(exp.id);
    setForm({
      amount: exp.amount || "",
      payee: exp.payee || "",
      description: exp.description || "",
      category: exp.category || "",
      date: exp.date || "",
      file: null,
    });
    setErrors({});
    setShowModal(true);
  };

  const validate = () => {
    const e = {};
    if (!form.amount || isNaN(Number(form.amount)) || Number(form.amount) <= 0) e.amount = "Enter a valid amount";
    if (!form.payee.trim()) e.payee = "Payee is required";
    if (!form.description.trim()) e.description = "Description is required";
    if (!form.category) e.category = "Select a category";
    if (!form.date) e.date = "Date is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = useCallback(async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      let receiptUrl = "";
      if (form.file) {
        const fileRef = ref(storage, `expense_receipts/${Date.now()}_${form.file.name}`);
        await uploadBytes(fileRef, form.file);
        receiptUrl = await getDownloadURL(fileRef);
      }

      const payload = {
        amount: parseFloat(form.amount),
        payee: form.payee.trim(),
        description: form.description.trim(),
        category: form.category,
        date: form.date,
        ...(receiptUrl ? { receiptUrl } : {}),
        updatedAt: Timestamp.now(),
      };

      if (editingId) {
        await updateDoc(doc(db, "b2b_expenses", editingId), payload);
        showToast("Expense updated!");
      } else {
        payload.createdAt = Timestamp.now();
        await addDoc(collection(db, "b2b_expenses"), payload);
        showToast("Expense recorded!");
      }

      setShowModal(false);
      setForm({ ...emptyForm });
      setEditingId(null);
    } catch (err) {
      console.error("Submit error:", err);
      alert("Failed to save expense. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }, [form, editingId]);

  const handleDelete = async (exp) => {
    if (!window.confirm(`Delete payment to "${exp.payee}"?`)) return;
    try {
      await deleteDoc(doc(db, "b2b_expenses", exp.id));
      showToast("Expense deleted");
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  /* ─── Render ─── */
  return (
    <div className="space-y-8 pb-12" style={{ fontFamily: 'DM Sans, sans-serif' }}>
      {/* Toast */}
      {toast && (
        <div className="fixed top-6 right-6 z-[100] bg-[#0F172A] text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-slide-left border border-slate-700/50 backdrop-blur-md">
          <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
            <FileText size={14} />
          </div>
          <span className="text-[13px] font-black tracking-tight">{toast}</span>
        </div>
      )}

      {/* Control Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex bg-white/50 backdrop-blur-sm p-1.5 rounded-xl border border-gray-100 shadow-sm gap-1 overflow-x-auto no-scrollbar max-w-full">
           <div className="flex items-center px-3 border-r border-gray-100 mr-2">
              <CalendarDays size={16} className="text-slate-400" />
           </div>
           <select value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)} 
             className="bg-transparent border-none text-[12px] font-bold text-slate-700 focus:ring-0 cursor-pointer pr-8">
             {MONTHS.map((m) => <option key={m} value={m}>{m} Period</option>)}
           </select>
           <div className="h-4 w-px bg-gray-200 mx-2 self-center" />
           <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)} 
             className="bg-transparent border-none text-[12px] font-bold text-slate-700 focus:ring-0 cursor-pointer pr-8">
             <option value="All">All Categories</option>
             {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
           </select>
        </div>
        <button onClick={openNew} 
          className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-6 py-3 bg-blue-600 text-white text-[13px] font-black rounded-xl hover:bg-blue-700 transition-all shadow-lg active:scale-95 uppercase tracking-widest">
          <Plus size={18} /> Record Expense
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="group bg-white rounded-xl border-t-4 border-t-blue-500 border-x border-b border-gray-100 p-6 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <DollarSign size={20} />
            </div>
            <div className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Total Payments</div>
          </div>
          <div className="flex items-center gap-1 text-[28px] font-black text-[#0F172A] tracking-tight">
            <BiRupee size={24} className="mb-1" />
            <span>{kpis.total.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[12px] font-bold text-slate-400">{kpis.count} individual entries</span>
          </div>
        </div>

        <div className="group bg-white rounded-xl border-t-4 border-t-amber-500 border-x border-b border-gray-100 p-6 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <TrendingUp size={20} />
            </div>
            <div className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Top Outflow</div>
          </div>
          <p className="text-[20px] font-black text-[#0F172A] tracking-tight truncate mb-1">{kpis.topCat}</p>
          <div className="flex items-center gap-2 mt-auto">
             <span className="text-[12px] font-bold text-amber-600">Highest Category Spending</span>
          </div>
        </div>

        <div className="group bg-white rounded-xl border-t-4 border-t-emerald-500 border-x border-b border-gray-100 p-6 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CalendarDays size={20} />
            </div>
            <div className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Current Month</div>
          </div>
          <div className="flex items-center gap-1 text-[28px] font-black text-[#0F172A] tracking-tight">
            <BiRupee size={24} className="mb-1" />
            <span>{kpis.monthTotal.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-2 mt-1">
             <span className="text-[12px] font-bold text-emerald-600 uppercase tracking-wider">{new Date().toLocaleString("default", { month: "long" })} Run Rate</span>
          </div>
        </div>
      </div>

      {/* Visual Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 bg-white rounded-xl border border-gray-100 shadow-sm p-6 min-w-0">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-[15px] font-black text-[#0F172A] tracking-tight flex items-center gap-2">
              <BarChart3 size={18} className="text-blue-500" /> Expense Velocity
            </h3>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Day-by-Day Analysis</div>
          </div>
          {areaData.length === 0 ? (
            <div className="h-[280px] flex flex-col items-center justify-center text-slate-300">
               <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mb-3"><BarChart3 size={24}/></div>
               <p className="text-[13px] font-bold">No historical data found</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280} debounce={100}>
              <AreaChart data={areaData}>
                <defs>
                  <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: "#94a3b8" }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: "#94a3b8" }} tickFormatter={(v) => `₹${v}`} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                  labelStyle={{ fontWeight: 800, color: '#0F172A', marginBottom: '4px', fontSize: '12px' }}
                  itemStyle={{ fontWeight: 700, fontSize: '12px' }}
                  formatter={(v) => [`₹${v.toLocaleString()}`, "Payment Amount"]} 
                />
                <Area type="monotone" dataKey="amount" stroke="#3B82F6" fill="url(#expGrad)" strokeWidth={3} animationDuration={1500} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm p-6 min-w-0">
           <div className="flex items-center justify-between mb-8">
            <h3 className="text-[15px] font-black text-[#0F172A] tracking-tight flex items-center gap-2">
              <PieChartIcon size={18} className="text-amber-500" /> Sector Allocation
            </h3>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Top spending</div>
          </div>
          {pieData.length === 0 ? (
            <div className="h-[280px] flex items-center justify-center text-slate-300 font-bold">Waiting for input...</div>
          ) : (
            <ResponsiveContainer width="100%" height={280} debounce={100}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={65} outerRadius={95} paddingAngle={4} dataKey="value" nameKey="name" cornerRadius={6}>
                  {pieData.map((entry) => (
                    <Cell key={entry.name} fill={CAT_COLORS[entry.name] || "#94a3b8"} stroke="none" />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                  itemStyle={{ fontWeight: 800, fontSize: '12px' }}
                  formatter={(v) => `₹${v.toLocaleString()}`} 
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Transaction Ledger */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-slate-50/20">
          <div>
            <h2 className="text-[15px] font-black text-[#0F172A] tracking-tight mb-0.5">Corporate Expense Ledger</h2>
            <p className="text-[12px] font-medium text-slate-400 uppercase tracking-widest">{filtered.length} total entries</p>
          </div>
          {filtered.length > 0 && (
             <button onClick={() => {
                const headers = ["Date", "Payee", "Description", "Category", "Amount"];
                const rows = filtered.map(e => [e.date, e.payee, e.description, e.category, e.amount]);
                const csv = [headers, ...rows].map(r => r.map(c => `"${String(c || '').replace(/"/g, '""')}"`).join(",")).join("\n");
                const blob = new Blob([csv], { type: "text/csv" });
                const url = URL.createObjectURL(blob);
                const localDateObj = new Date(Date.now() - new Date().getTimezoneOffset() * 60000);
                const a = document.createElement("a"); a.href = url; a.download = `corporate_expenses_${localDateObj.toISOString().split("T")[0]}.csv`; a.click();
                URL.revokeObjectURL(url);
              }} className="flex items-center gap-2 px-4 py-2 bg-white text-[12px] font-black text-slate-600 border border-gray-200 rounded-xl hover:bg-slate-50 transition shadow-sm active:scale-95 uppercase tracking-wider">
                <Download size={14} /> Download CSV
             </button>
          )}
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead className="bg-[#F8FAFC]">
              <tr>
                <th className="text-left text-[11px] font-black text-[#64748B] px-6 py-4 uppercase tracking-[0.1em]">Entry Date</th>
                <th className="text-left text-[11px] font-black text-[#64748B] px-6 py-4 uppercase tracking-[0.1em]">Beneficiary (Payee)</th>
                <th className="text-left text-[11px] font-black text-[#64748B] px-6 py-4 uppercase tracking-[0.1em]">Classification</th>
                <th className="text-left text-[11px] font-black text-[#64748B] px-6 py-4 uppercase tracking-[0.1em]">Justification</th>
                <th className="text-right text-[11px] font-black text-[#64748B] px-6 py-4 uppercase tracking-[0.1em]">Amount (INR)</th>
                <th className="text-center text-[11px] font-black text-[#64748B] px-6 py-4 uppercase tracking-[0.1em]">Invoice</th>
                <th className="text-right text-[11px] font-black text-[#64748B] px-6 py-4 uppercase tracking-[0.1em]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-20 text-center text-slate-300">
                    <Loader2 size={32} className="animate-spin mx-auto mb-4" />
                    <p className="text-[13px] font-bold">Synchronizing with Cloud...</p>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-20">
                     <div className="flex flex-col items-center justify-center">
                        <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-4 text-slate-200"><FileText size={32}/></div>
                        <p className="text-[15px] font-black text-slate-400">Ledger is empty for this period</p>
                        <p className="text-[12px] font-medium text-slate-300 mt-1 uppercase tracking-widest">Awaiting financial entry points</p>
                     </div>
                  </td>
                </tr>
              ) : filtered.map((e) => (
                <tr key={e.id} className="border-b border-gray-50 hover:bg-[#F8FAFC] transition-colors group">
                  <td className="px-6 py-4 text-[13px] font-bold text-slate-500">{e.date}</td>
                  <td className="px-6 py-4">
                     <p className="text-[14px] font-black text-[#0F172A] tracking-tight">{e.payee}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider" style={{ backgroundColor: (CAT_COLORS[e.category] || "#94a3b8") + "15", color: CAT_COLORS[e.category] || "#94a3b8" }}>
                      {e.category}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                     <p className="text-[13px] font-medium text-slate-600 italic truncate max-w-[250px]" title={e.description}>{e.description}</p>
                  </td>
                   <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-0.5 text-[15px] font-black text-[#0F172A] tracking-tight">
                      <BiRupee size={14} className="mb-0.5" />
                      <span>{e.amount?.toLocaleString()}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {e.receiptUrl ? (
                      <button onClick={() => setLightboxUrl(e.receiptUrl)} className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto hover:bg-indigo-100 transition-colors">
                        <Eye size={16} />
                      </button>
                    ) : (
                      <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">missing</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEdit(e)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all">
                        <FileText size={16} />
                      </button>
                      <button onClick={() => handleDelete(e)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Receipt Lightbox ─── */}
      {lightboxUrl && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={() => setLightboxUrl(null)}>
          <div className="relative max-w-2xl w-full bg-white rounded-2xl overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setLightboxUrl(null)} className="absolute top-3 right-3 p-2 bg-white/80 rounded-full hover:bg-white transition shadow"><X size={18} /></button>
            <img src={lightboxUrl} alt="Receipt" className="w-full max-h-[80vh] object-contain" />
          </div>
        </div>
      )}

      {/* Side Panel Redesign */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-end p-0 sm:p-4">
          <div className="absolute inset-0 bg-[#0F172A]/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative w-full max-w-lg h-full sm:h-auto sm:max-h-[90vh] bg-white sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-slide-left">
            <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
              <div>
                <h2 className="text-[18px] font-black text-[#0F172A] tracking-tight">{editingId ? 'Modify Ledger Entry' : 'New Capital Outflow'}</h2>
                <p className="text-[12px] font-medium text-slate-400 uppercase tracking-widest mt-0.5">Corporate Financial Management</p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                <X size={26} />
              </button>
            </div>
            
            <div className="p-8 space-y-6 overflow-y-auto">
              <div className="grid grid-cols-2 gap-5">
                <div className="col-span-2">
                   <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">Final Expenditure (INR) *</label>
                   <div className="relative">
                     <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-[18px]">
                       <BiRupee size={22} />
                     </div>
                     <input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })}
                       className={`w-full pl-12 pr-4 py-4 rounded-xl text-[24px] font-black focus:outline-none border transition-all ${form.amount ? 'bg-blue-50/50 border-blue-200 text-blue-700' : 'bg-slate-50 border-slate-200 text-slate-700'}`} placeholder="0.00" />
                   </div>
                   {errors.amount && <p className="text-[10px] font-bold text-red-500 mt-1 uppercase tracking-wider">{errors.amount}</p>}
                </div>

                <div className="col-span-2">
                  <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">Transaction Recipient *</label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"><FileText size={18} /></div>
                    <input type="text" value={form.payee} onChange={(e) => setForm({ ...form, payee: e.target.value })}
                      className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-[14px] font-bold text-slate-700 focus:bg-white focus:border-blue-500 focus:outline-none transition-all uppercase placeholder:normal-case" placeholder="Vendor, Employee, or Entity" />
                  </div>
                  {errors.payee && <p className="text-[10px] font-bold text-red-500 mt-1 uppercase tracking-wider">{errors.payee}</p>}
                </div>

                <div className="col-span-1">
                  <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">Effective Date</label>
                  <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-[14px] font-bold text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none" />
                </div>

                <div className="col-span-1">
                  <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">Expense Category</label>
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-[14px] font-black text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none appearance-none">
                    <option value="">Select Class</option>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">Purpose / Justification</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[13px] font-bold text-slate-700 focus:bg-white focus:border-blue-500 focus:outline-none resize-none transition-all" placeholder="Explain the business need for this payment..." />
                {errors.description && <p className="text-[10px] font-bold text-red-500 mt-1 uppercase tracking-wider">{errors.description}</p>}
              </div>

              <div className="pt-4 border-t border-slate-50">
                 <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-3">Evidential Documentation</label>
                 <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-200 rounded-2xl cursor-pointer hover:border-blue-400 hover:bg-blue-50/20 transition-all group">
                   {form.file ? (
                     <div className="flex flex-col items-center gap-2">
                        <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center"><ImageIcon size={24}/></div>
                        <span className="text-[13px] font-black text-slate-700">{form.file.name}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Click to swap file</span>
                     </div>
                   ) : (
                     <div className="flex flex-col items-center text-slate-400 group-hover:text-blue-500">
                        <Upload size={28} className="mb-2" />
                        <span className="text-[12px] font-black uppercase tracking-widest">Link digital receipt</span>
                        <span className="text-[10px] font-medium text-slate-300 mt-0.5">JPG, PNG or PDF formats supported</span>
                     </div>
                   )}
                   <input type="file" accept="image/*" className="hidden" onChange={(e) => setForm({ ...form, file: e.target.files?.[0] || null })} />
                 </label>
              </div>
            </div>

            <div className="p-8 border-t border-slate-50 bg-slate-50/20 flex gap-4 mt-auto">
               <button onClick={() => setShowModal(false)} className="flex-1 py-4 bg-slate-100 text-slate-500 font-black text-[13px] rounded-xl hover:bg-slate-200 transition-all uppercase tracking-widest">Cancel</button>
               <button onClick={handleSubmit} disabled={submitting}
                className="flex-[2] py-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-30 disabled:cursor-not-allowed text-white font-black text-[13px] rounded-xl transition-all shadow-xl active:scale-95 uppercase tracking-widest flex items-center justify-center gap-2">
                {submitting ? <Loader2 size={18} className="animate-spin" /> : editingId ? 'Update Record' : 'Commit to Ledger'}
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── KPI Card sub-component ─── */
function KpiCard({ icon, label, value, sub, color }) {
  const colorMap = {
    indigo: { bg: "bg-indigo-50", ring: "ring-indigo-100", icon: "text-indigo-500" },
    amber: { bg: "bg-amber-50", ring: "ring-amber-100", icon: "text-amber-500" },
    emerald: { bg: "bg-emerald-50", ring: "ring-emerald-100", icon: "text-emerald-500" },
  };
  const c = colorMap[color] || colorMap.indigo;
  return (
    <div className={`bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-start gap-4 ring-1 ${c.ring}`}>
      <div className={`${c.bg} p-2.5 rounded-xl`}>
        <span className={c.icon}>{icon}</span>
      </div>
      <div className="min-w-0">
        <p className="text-xs text-slate-400 font-medium">{label}</p>
        <p className="text-lg font-bold text-slate-800 truncate">{value}</p>
        <p className="text-[10px] text-slate-400">{sub}</p>
      </div>
    </div>
  );
}
