import { useState, useEffect, useMemo, useCallback } from "react";
import { collection, onSnapshot, addDoc, deleteDoc, doc, updateDoc, Timestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../firebase";
import {
  DollarSign, TrendingUp, CalendarDays, Plus, X, Upload, Trash2, Eye,
  FileText, Loader2, ImageIcon, PieChart as PieChartIcon, BarChart3, Download
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";

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
  "Out of the box": "#EC4899",
  "Vendor payment": "#3B82F6",
  Other: "#8B5CF6",
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
    const unsub = onSnapshot(
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
    return () => unsub();
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
    if (!window.confirm(`Delete ₹${exp.amount} to "${exp.payee}"?`)) return;
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
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 bg-emerald-500 text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-pulse">
          <FileText size={16} /> {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">CEO Expense Tracker</h2>
          <p className="text-xs text-slate-400 mt-0.5">Track and manage all business expenses</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)} className="px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white text-slate-600 focus:ring-2 focus:ring-indigo-300 outline-none">
          {MONTHS.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
        <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)} className="px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white text-slate-600 focus:ring-2 focus:ring-indigo-300 outline-none">
          <option value="All">All Categories</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard icon={<DollarSign size={20} />} label="Total Payments" value={`₹${kpis.total.toLocaleString()}`} sub={`${kpis.count} expense${kpis.count !== 1 ? "s" : ""}`} color="indigo" />
        <KpiCard icon={<TrendingUp size={20} />} label="Top Category" value={kpis.topCat} sub="Highest spending" color="amber" />
        <KpiCard icon={<CalendarDays size={20} />} label="This Month" value={`₹${kpis.monthTotal.toLocaleString()}`} sub={new Date().toLocaleString("default", { month: "long", year: "numeric" })} color="emerald" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Area chart — span 3 */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 size={16} className="text-indigo-500" />
            <h3 className="text-sm font-bold text-slate-700">Expenses Over Time</h3>
          </div>
          {areaData.length === 0 ? (
            <p className="text-xs text-slate-400 py-10 text-center">No expense data to display</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={areaData}>
                <defs>
                  <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#94a3b8" }} />
                <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} tickFormatter={(v) => `₹${v}`} />
                <Tooltip formatter={(v) => [`₹${v.toLocaleString()}`, "Amount"]} contentStyle={{ borderRadius: 12, fontSize: 12, border: "1px solid #e2e8f0" }} />
                <Area type="monotone" dataKey="amount" stroke="#6366F1" fill="url(#expGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Donut chart — span 2 */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <PieChartIcon size={16} className="text-amber-500" />
            <h3 className="text-sm font-bold text-slate-700">By Category</h3>
          </div>
          {pieData.length === 0 ? (
            <p className="text-xs text-slate-400 py-10 text-center">No data</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="value" nameKey="name" label={({ name, percent }) => `${name.split(" ")[0]} ${(percent * 100).toFixed(0)}%`} labelLine={false} style={{ fontSize: 9 }}>
                  {pieData.map((entry) => (
                    <Cell key={entry.name} fill={CAT_COLORS[entry.name] || "#94a3b8"} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => `₹${v.toLocaleString()}`} contentStyle={{ borderRadius: 12, fontSize: 12, border: "1px solid #e2e8f0" }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-700">Expense Ledger</h3>
          <div className="flex items-center gap-2">
            {filtered.length > 0 && (
              <button onClick={() => {
                const headers = ["Date", "Payee", "Description", "Category", "Amount"];
                const rows = filtered.map(e => [e.date, e.payee, e.description, e.category, e.amount]);
                const csv = [headers, ...rows].map(r => r.map(c => `"${String(c || '').replace(/"/g, '""')}"`).join(",")).join("\n");
                const blob = new Blob([csv], { type: "text/csv" });
                const url = URL.createObjectURL(blob);
                const localDateObj = new Date(Date.now() - new Date().getTimezoneOffset() * 60000);
                const a = document.createElement("a"); a.href = url; a.download = `expenses_${localDateObj.toISOString().split("T")[0]}.csv`; a.click();
                URL.revokeObjectURL(url);
              }} className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition">
                <Download size={14} /> Export CSV
              </button>
            )}
            <button onClick={openNew} className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-sm">
              <Plus size={14} /> Record Expense
            </button>
          </div>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-400"><Loader2 size={28} className="animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <FileText size={40} className="mb-2" />
            <p className="font-semibold text-slate-500">No expenses found</p>
            <p className="text-xs mt-1">Click "+ Record Expense" to add one</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[780px]">
              <thead>
                <tr className="bg-slate-50">
                  <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3 rounded-tl-xl">Date</th>
                  <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3">Payee</th>
                  <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3">Description</th>
                  <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3">Category</th>
                  <th className="text-right text-xs font-semibold text-slate-500 px-4 py-3">Amount</th>
                  <th className="text-center text-xs font-semibold text-slate-500 px-4 py-3">Receipt</th>
                  <th className="text-right text-xs font-semibold text-slate-500 px-4 py-3 rounded-tr-xl">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((e) => (
                  <tr key={e.id} className="border-b border-slate-50 hover:bg-indigo-50/30 transition-colors">
                    <td className="px-4 py-3 text-sm text-slate-600">{e.date}</td>
                    <td className="px-4 py-3 text-sm font-medium text-slate-800">{e.payee}</td>
                    <td className="px-4 py-3 text-sm text-slate-600 max-w-[200px] truncate" title={e.description}>{e.description}</td>
                    <td className="px-4 py-3">
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ backgroundColor: (CAT_COLORS[e.category] || "#94a3b8") + "15", color: CAT_COLORS[e.category] || "#94a3b8" }}>
                        {e.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-bold text-slate-800 text-right">₹{(e.amount || 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-center">
                      {e.receiptUrl ? (
                        <button onClick={() => setLightboxUrl(e.receiptUrl)} className="p-1.5 text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors">
                          <Eye size={16} />
                        </button>
                      ) : (
                        <span className="text-xs text-slate-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right space-x-1">
                      <button onClick={() => openEdit(e)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                        <FileText size={14} />
                      </button>
                      <button onClick={() => handleDelete(e)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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

      {/* ─── Expense Form Modal ─── */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800">{editingId ? "Edit Expense" : "Record New Expense"}</h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors"><X size={18} /></button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              {/* Amount */}
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Amount (₹) *</label>
                <input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0.00" className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:ring-2 focus:ring-indigo-300 outline-none transition ${errors.amount ? "border-red-400 bg-red-50" : "border-slate-200"}`} />
                {errors.amount && <p className="text-xs text-red-500 mt-1">{errors.amount}</p>}
              </div>

              {/* Date */}
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Date *</label>
                <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:ring-2 focus:ring-indigo-300 outline-none transition ${errors.date ? "border-red-400 bg-red-50" : "border-slate-200"}`} />
                {errors.date && <p className="text-xs text-red-500 mt-1">{errors.date}</p>}
              </div>

              {/* Payee */}
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Payee (To Whom) *</label>
                <input type="text" value={form.payee} onChange={(e) => setForm({ ...form, payee: e.target.value })} placeholder="e.g. Vendor XYZ" className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:ring-2 focus:ring-indigo-300 outline-none transition ${errors.payee ? "border-red-400 bg-red-50" : "border-slate-200"}`} />
                {errors.payee && <p className="text-xs text-red-500 mt-1">{errors.payee}</p>}
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Reason / Description *</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} placeholder="Why was this expense made?" className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:ring-2 focus:ring-indigo-300 outline-none transition resize-none ${errors.description ? "border-red-400 bg-red-50" : "border-slate-200"}`} />
                {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description}</p>}
              </div>

              {/* Category */}
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Category *</label>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:ring-2 focus:ring-indigo-300 outline-none transition ${errors.category ? "border-red-400 bg-red-50" : "border-slate-200"}`}>
                  <option value="">Select category...</option>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                {errors.category && <p className="text-xs text-red-500 mt-1">{errors.category}</p>}
              </div>

              {/* File upload */}
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Receipt Photo (optional)</label>
                <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/30 transition-all">
                  {form.file ? (
                    <div className="flex items-center gap-2 text-sm text-indigo-600 font-medium">
                      <ImageIcon size={18} />
                      {form.file.name}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center text-slate-400">
                      <Upload size={22} className="mb-1" />
                      <span className="text-xs">Click or drag to upload</span>
                    </div>
                  )}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => setForm({ ...form, file: e.target.files?.[0] || null })} />
                </label>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 p-6 border-t border-slate-100">
              <button onClick={() => setShowModal(false)} className="px-5 py-2.5 text-sm font-semibold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition">Cancel</button>
              <button onClick={handleSubmit} disabled={submitting} className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md">
                {submitting ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                {submitting ? "Saving…" : editingId ? "Update" : "Save Expense"}
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
