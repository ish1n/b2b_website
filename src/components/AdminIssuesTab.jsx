import { useMemo, useState } from "react";
import { FiCheckCircle, FiClock, FiAlertTriangle, FiPlus, FiX, FiCheck, FiEdit2, FiTrash2, FiInbox } from "react-icons/fi";
import { BiRupee } from "react-icons/bi";
import EmptyState from "./EmptyState";

const ISSUE_TYPES = ["Missing Items", "Damage", "Quality Issue", "Return Pending", "Weight Dispute", "Bags Pending"];
const SEVERITY_ORDER = { critical: 0, pending: 1 };
const RESOLVE_COLORS = { Unresolved: "bg-red-100 text-red-600", Checking: "bg-yellow-100 text-yellow-700", Resolved: "bg-green-100 text-green-600" };
const TYPE_COLORS = { "Missing Items": "#DC2626", "Damage": "#D97706", "Quality Issue": "#7C3AED", "Return Pending": "#0891B2", "Weight Dispute": "#BE185D", "Bags Pending": "#DC2626" };

export default function AdminIssuesTab({ orders, onAddIssue, onEditIssue, onDeleteIssue }) {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    id: null, date: "", issueType: "Missing Items", description: "",
    linkedHostel: "", assignedTo: "", severity: "pending", resolveStatus: "Unresolved", solution: ""
  });

  const openEditModal = (issue) => {
    setForm({
      id: issue.id,
      date: issue.date || "",
      issueType: issue.issueType || "Missing Items",
      description: issue.service || "",
      linkedHostel: issue.linkedHostel || "",
      assignedTo: issue.reportedBy || "",
      severity: issue.severity || "pending",
      resolveStatus: issue.resolveStatus || "Unresolved",
      solution: issue.solution || ""
    });
    setShowModal(true);
  };

  const issues = useMemo(() =>
    orders.filter(o => o.category === "ISSUES")
      .sort((a, b) => (SEVERITY_ORDER[a.severity] ?? 99) - (SEVERITY_ORDER[b.severity] ?? 99) || new Date(b.date) - new Date(a.date)),
    [orders]);

  const criticalCount = issues.filter(i => i.severity === "critical").length;
  const unresolvedCount = issues.filter(i => i.resolveStatus === "Unresolved").length;
  const checkingCount = issues.filter(i => i.resolveStatus === "Checking").length;

  const handleSubmit = () => {
    if (!form.description) return;
    const issueData = {
      property: "Issues",
      category: "ISSUES",
      type: "issue",
      date: form.date || new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split("T")[0],
      amount: 0,
      service: form.description,
      issueType: form.issueType,
      severity: form.severity,
      resolveStatus: form.resolveStatus,
      status: form.resolveStatus === "Resolved" ? "Resolved" : "Pending",
      reportedBy: form.assignedTo || "Admin",
      solution: form.solution,
      linkedHostel: form.linkedHostel,
    };

    if (form.id) {
      issueData.id = form.id;
      onEditIssue(issueData);
    } else {
      issueData.id = `issue-new-${Date.now()}`;
      onAddIssue(issueData);
    }

    setShowModal(false);
    setForm({ id: null, date: "", issueType: "Missing Items", description: "", linkedHostel: "", assignedTo: "", severity: "pending", resolveStatus: "Unresolved", solution: "" });
  };

  return (
    <div className="space-y-6" style={{ fontFamily: 'DM Sans, sans-serif' }}>
      {/* Summary Bar */}
      <div className="flex flex-wrap gap-4">
        {[
          { label: 'Critical', count: criticalCount, bg: 'bg-red-50', border: 'border-red-100', text: 'text-red-700', icon: FiAlertTriangle, iconColor: 'text-red-500' },
          { label: 'Checking', count: checkingCount, bg: 'bg-amber-50', border: 'border-amber-100', text: 'text-amber-700', icon: FiClock, iconColor: 'text-amber-600' },
          { label: 'Unresolved', count: unresolvedCount, bg: 'bg-orange-50', border: 'border-orange-100', text: 'text-orange-700', icon: FiAlertTriangle, iconColor: 'text-orange-500' },
          { label: 'Total', count: issues.length, bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-700', icon: FiInbox, iconColor: 'text-slate-400' },
        ].map((stat, idx) => (
          <div key={idx} className={`flex items-center gap-3 ${stat.bg} border ${stat.border} rounded-xl px-4 py-3 shadow-sm`}>
            <stat.icon className={stat.iconColor} size={16} />
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 leading-none mb-1">{stat.label}</p>
              <p className={`text-sm font-black ${stat.text} leading-none`}>{stat.count}</p>
            </div>
          </div>
        ))}
        <button onClick={() => { setForm({ id: null, date: "", issueType: "Missing Items", description: "", linkedHostel: "", assignedTo: "", severity: "pending", resolveStatus: "Unresolved", solution: "" }); setShowModal(true); }} className="ml-auto flex items-center gap-2 px-5 py-3 bg-red-600 text-white text-[12px] font-bold rounded-xl hover:bg-red-700 transition-all shadow-md active:scale-95">
          <FiPlus size={16} /> Report New Issue
        </button>
      </div>

      {/* Issue List */}
      <div className="space-y-4">
        {issues.map(issue => (
          <div key={issue.id} className={`bg-white rounded-xl border border-gray-100 shadow-sm p-5 transition-all hover:shadow-md group ${issue.severity === "critical" ? 'border-l-4 border-l-red-500' : ''}`}>
            <div className="flex flex-col sm:flex-row sm:items-start gap-4">
              <div className="flex flex-col gap-2 flex-shrink-0 min-w-[120px]">
                <span className="text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider text-center" style={{ backgroundColor: (TYPE_COLORS[issue.issueType] || '#6B7280') + '15', color: TYPE_COLORS[issue.issueType] || '#6B7280' }}>
                  {issue.issueType}
                </span>
                {issue.severity === "critical" && (
                  <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-red-600 text-white uppercase tracking-widest text-center shadow-sm">Critical</span>
                )}
              </div>
              <div className="flex-1">
                <p className="text-[13.5px] font-bold text-[#0F172A] leading-relaxed">{issue.service}</p>
                {issue.solution && (
                  <div className="mt-3 p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                    <p className="text-[12px] text-emerald-800 font-medium italic select-none">Resolution: {issue.solution}</p>
                  </div>
                )}
                <div className="mt-3 flex items-center gap-4 text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider">
                  <span>{issue.date}</span>
                  {issue.reportedBy && <span className="flex items-center gap-1.5"><div className="w-1 h-1 rounded-full bg-gray-300" /> reported by {issue.reportedBy}</span>}
                  {issue.linkedHostel && <span className="flex items-center gap-1.5 text-blue-500"><div className="w-1 h-1 rounded-full bg-blue-300" /> {issue.linkedHostel}</span>}
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className={`text-[10px] font-black px-3 py-1.5 rounded-full uppercase border ${issue.resolveStatus === 'Resolved' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                    issue.resolveStatus === 'Checking' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                      'bg-red-50 text-red-700 border-red-100'
                  }`}>
                  {issue.resolveStatus}
                </span>
                <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEditModal(issue)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                    <FiEdit2 size={14} />
                  </button>
                  {onDeleteIssue && (
                    <button onClick={() => onDeleteIssue(issue)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      <FiTrash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
        {issues.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden py-12">
            <EmptyState
              icon={FiCheckCircle}
              title="All systems clear"
              message="No outstanding issues or complaints for this period."
            />
          </div>
        )}
      </div>

      {/* Add Issue Modal - Simplified Styling */}
      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#0F172A]/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8 animate-slide-up">
            <div className="flex items-center justify-between mb-8 cursor-default">
              <div>
                <h2 className="text-lg font-black text-[#0F172A] tracking-tight">{form.id ? 'Modify Issue Report' : 'New Issue Report'}</h2>
                <p className="text-xs font-medium text-slate-400">Please provide accurate details for tracking</p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all">
                <FiX size={24} />
              </button>
            </div>

            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Date of Incident</label>
                  <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[13px] font-bold text-slate-700 focus:bg-white focus:border-red-500 focus:outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Category</label>
                  <select value={form.issueType} onChange={e => setForm({ ...form, issueType: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[13px] font-bold text-slate-700 focus:bg-white focus:border-red-500 focus:outline-none transition-all bg-no-repeat bg-right">
                    {ISSUE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Description of Issue</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={4}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[13px] font-bold text-slate-700 focus:bg-white focus:border-red-500 focus:outline-none resize-none transition-all" placeholder="Enter full details..." />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Linked Client</label>
                  <input type="text" value={form.linkedHostel} onChange={e => setForm({ ...form, linkedHostel: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[13px] font-bold text-slate-700 focus:bg-white focus:border-red-500 focus:outline-none transition-all" placeholder="Search client..." />
                </div>
                <div>
                  <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Reported By</label>
                  <input type="text" value={form.assignedTo} onChange={e => setForm({ ...form, assignedTo: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[13px] font-bold text-slate-700 focus:bg-white focus:border-red-500 focus:outline-none transition-all" placeholder="Enter name..." />
                </div>
              </div>

              {form.id && (
                <div className="pt-4 border-t border-slate-100 space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Severity Level</label>
                      <select value={form.severity} onChange={e => setForm({ ...form, severity: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[13px] font-black text-red-600 focus:bg-white focus:outline-none uppercase tracking-widest">
                        <option value="pending">Standard</option>
                        <option value="critical text-red-600">!! Critical !!</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Resolution Status</label>
                      <select value={form.resolveStatus} onChange={e => setForm({ ...form, resolveStatus: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[13px] font-bold text-slate-700 focus:bg-white focus:outline-none">
                        <option value="Unresolved">Unresolved</option>
                        <option value="Checking">Under Investigation</option>
                        <option value="Resolved">Resolved</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Final Solution Notes</label>
                    <textarea value={form.solution} onChange={e => setForm({ ...form, solution: e.target.value })} rows={2}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[13px] font-bold text-emerald-700 focus:bg-emerald-50 focus:border-emerald-500 focus:outline-none resize-none transition-all" placeholder="What was done to resolve this?" />
                  </div>
                </div>
              )}
            </div>

            <div className="mt-8 flex gap-3">
              <button onClick={() => setShowModal(false)} className="flex-1 py-3.5 bg-slate-100 text-slate-600 font-black text-[13px] rounded-xl hover:bg-slate-200 transition-all uppercase tracking-widest">Cancel</button>
              <button onClick={handleSubmit} disabled={!form.description}
                className="flex-[2] py-3.5 bg-red-600 hover:bg-red-700 disabled:opacity-30 disabled:cursor-not-allowed text-white font-black text-[13px] rounded-xl transition-all shadow-lg active:scale-95 uppercase tracking-widest">
                {form.id ? 'Update Record' : 'Submit for Review'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
