import { useMemo, useState } from "react";
import { FiCheckCircle, FiClock, FiAlertTriangle, FiPlus, FiX, FiCheck, FiEdit2, FiTrash2 } from "react-icons/fi";

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
      date: form.date || new Date().toISOString().split("T")[0],
      amount: 0,
      service: form.description,
      issueType: form.issueType,
      severity: form.severity,
      resolveStatus: form.resolveStatus,
      status: form.resolveStatus === "Resolved" ? "Delivered" : "Pending",
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
    <div className="space-y-6">
      {/* Summary Bar */}
      <div className="flex flex-wrap gap-4">
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <FiAlertTriangle className="text-red-500" size={16} />
          <span className="text-sm font-bold text-red-700">{criticalCount} Critical</span>
        </div>
        <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3">
          <FiClock className="text-yellow-600" size={16} />
          <span className="text-sm font-bold text-yellow-700">{checkingCount} Checking</span>
        </div>
        <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-xl px-4 py-3">
          <FiAlertTriangle className="text-orange-500" size={16} />
          <span className="text-sm font-bold text-orange-700">{unresolvedCount} Unresolved</span>
        </div>
        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
          <span className="text-sm font-bold text-gray-600">{issues.length} Total</span>
        </div>
        <button onClick={() => { setForm({ id: null, date: "", issueType: "Missing Items", description: "", linkedHostel: "", assignedTo: "", severity: "pending", resolveStatus: "Unresolved", solution: "" }); setShowModal(true); }} className="ml-auto flex items-center gap-1.5 px-4 py-2.5 bg-[#DC2626] text-white text-xs font-bold rounded-xl hover:bg-red-700 transition-all shadow-sm">
          <FiPlus size={14} /> Add Issue
        </button>
      </div>

      {/* Issue Cards */}
      <div className="space-y-3">
        {issues.map(issue => (
          <div key={issue.id} className={`bg-white rounded-xl border shadow-sm p-5 transition-all hover:shadow-md ${issue.severity === "critical" ? 'border-red-200 border-l-4 border-l-red-500' : 'border-gray-100'}`}>
            <div className="flex flex-col sm:flex-row sm:items-start gap-3">
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider" style={{ backgroundColor: (TYPE_COLORS[issue.issueType] || '#6B7280') + '15', color: TYPE_COLORS[issue.issueType] || '#6B7280' }}>
                  {issue.issueType}
                </span>
                {issue.severity === "critical" && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-600 uppercase">Critical</span>
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-800 leading-relaxed">{issue.service}</p>
                {issue.solution && <p className="text-xs text-gray-400 mt-1.5 italic">Solution: {issue.solution}</p>}
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="text-right">
                  <p className="text-xs text-gray-400">{issue.date}</p>
                  {issue.reportedBy && <p className="text-[10px] text-gray-400 mt-0.5">by {issue.reportedBy}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${RESOLVE_COLORS[issue.resolveStatus] || 'bg-gray-100 text-gray-500'}`}>
                    {issue.resolveStatus}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => openEditModal(issue)} className="p-1.5 text-gray-400 hover:text-[#1976D2] hover:bg-blue-50 rounded-lg transition-colors">
                    <FiEdit2 size={14} />
                  </button>
                  {onDeleteIssue && (
                    <button onClick={() => onDeleteIssue(issue)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      <FiTrash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
        {issues.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <FiCheckCircle size={40} className="mx-auto mb-3 text-green-300" />
            <p className="font-semibold">No issues found</p>
          </div>
        )}
      </div>

      {/* Add Issue Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 mx-4" style={{ fontFamily: 'Poppins' }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">{form.id ? 'Edit Issue' : 'Report New Issue'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><FiX size={20} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Date</label>
                <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-[#DC2626] focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Issue Type</label>
                <select value={form.issueType} onChange={e => setForm({ ...form, issueType: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-[#DC2626] focus:outline-none bg-white">
                  {ISSUE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Description *</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-[#DC2626] focus:outline-none resize-none" placeholder="Describe the issue..." />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Linked Hostel / Customer</label>
                <input type="text" value={form.linkedHostel} onChange={e => setForm({ ...form, linkedHostel: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-[#DC2626] focus:outline-none" placeholder="e.g. Meera Hostel" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Assigned To</label>
                <input type="text" value={form.assignedTo} onChange={e => setForm({ ...form, assignedTo: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-[#DC2626] focus:outline-none" placeholder="Reporter name" />
              </div>
              {form.id && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Severity</label>
                      <select value={form.severity} onChange={e => setForm({ ...form, severity: e.target.value })}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-[#DC2626] focus:outline-none bg-white">
                        <option value="pending">Pending</option>
                        <option value="critical">Critical</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Status</label>
                      <select value={form.resolveStatus} onChange={e => setForm({ ...form, resolveStatus: e.target.value })}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-[#DC2626] focus:outline-none bg-white">
                        <option value="Unresolved">Unresolved</option>
                        <option value="Checking">Checking</option>
                        <option value="Resolved">Resolved</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Solution / Updates</label>
                    <textarea value={form.solution} onChange={e => setForm({ ...form, solution: e.target.value })} rows={2}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-[#DC2626] focus:outline-none resize-none" placeholder="What was done to fix this?" />
                  </div>
                </>
              )}
            </div>
            <button onClick={handleSubmit} disabled={!form.description}
              className="w-full mt-5 py-3 bg-[#DC2626] hover:bg-red-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl transition-all">
              {form.id ? 'Save Changes' : 'Submit Issue'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
