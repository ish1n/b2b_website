import { FiX } from "react-icons/fi";
import { BiRupee } from "react-icons/bi";

export default function AdminOrderModal({ isOpen, onClose, order }) {
  if (!isOpen || !order) return null;

  // Render Status Badge
  const getStatusBadge = (status) => {
    const s = (status || "Pending").toLowerCase();
    if (s.includes("delivered") || s.includes("completed")) {
      return <span className="px-2.5 py-1 bg-green-100 text-green-700 text-[10px] font-black rounded-full uppercase tracking-wider">Delivered</span>;
    }
    if (s.includes("process") || s.includes("active")) {
      return <span className="px-2.5 py-1 bg-blue-100 text-blue-700 text-[10px] font-black rounded-full uppercase tracking-wider">Processing</span>;
    }
    return <span className="px-2.5 py-1 bg-amber-100 text-amber-700 text-[10px] font-black rounded-full uppercase tracking-wider">{status || "Pending"}</span>;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4" style={{ fontFamily: 'DM Sans, sans-serif' }}>
      {/* Blurred Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" 
        onClick={onClose} 
      />
      
      {/* Modal Content */}
      <div className="relative bg-white sm:rounded-2xl shadow-2xl w-full h-full sm:h-auto sm:max-w-md overflow-hidden animate-slide-up sm:animate-fade-in flex flex-col sm:max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-gray-100 bg-[#F8FAFC]">
          <div>
            <h2 className="text-[18px] font-black text-[#0F172A] tracking-tight">{order.customerName || order.property || order.tenant || 'Unknown Property'}</h2>
            <div className="flex items-center gap-2 mt-1.5">
              <p className="text-[12px] font-bold text-slate-500">{order.date}</p>
              <span className="w-1 h-1 rounded-full bg-slate-300"></span>
              {getStatusBadge(order.status)}
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 text-slate-400 hover:text-[#DC2626] hover:bg-red-50 rounded-xl transition-colors"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto">
          {order.type === 'student' ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Weight</p>
                  <p className="text-[18px] font-black text-[#0F172A]">{order.weight?.toFixed(1) || '0.0'} <span className="text-[12px] text-slate-500">kg</span></p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Students</p>
                  <p className="text-[18px] font-black text-[#0F172A]">{order.studentCount || '—'}</p>
                </div>
              </div>

              <div>
                <h3 className="text-[12px] font-black text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-100 pb-2">Service Details</h3>
                <div className="flex items-center justify-between py-2">
                  <span className="text-[14px] font-bold text-slate-600">Wash Type</span>
                  <span className="text-[14px] font-black text-[#0F172A]">Wash & Fold/Iron</span>
                </div>
                {order.items && (
                  <div className="flex items-center justify-between py-2 border-t border-slate-50">
                    <span className="text-[14px] font-bold text-slate-600">Total Clothes</span>
                    <span className="text-[14px] font-black text-[#0F172A]">{order.items} pcs</span>
                  </div>
                )}
              </div>
            </div>
          ) : order.type === 'regular' || order.category === 'B2C_RETAIL' ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Weight</p>
                  <p className="text-[18px] font-black text-[#0F172A]">{order.weight?.toFixed(1) || '0.0'} <span className="text-[12px] text-slate-500">kg</span></p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Clothes</p>
                  <p className="text-[18px] font-black text-[#0F172A]">{order.items || '—'} pcs</p>
                </div>
              </div>

              <div>
                <h3 className="text-[12px] font-black text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-100 pb-2">Service Details</h3>
                <div className="flex items-center justify-between py-2">
                  <span className="text-[14px] font-bold text-slate-600">Wash Type</span>
                  <span className="text-[14px] font-black text-[#0F172A]">{order.service?.split(" —")[0] || 'Wash & Fold'}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-t border-slate-50">
                  <span className="text-[14px] font-bold text-slate-600">Channel</span>
                  <span className="text-[14px] font-black text-[#0F172A]">{order.channel || 'Direct'}</span>
                </div>
                {order.customerNumber && (
                  <div className="flex items-center justify-between py-2 border-t border-slate-50">
                    <span className="text-[14px] font-bold text-slate-600">Contact Number</span>
                    <span className="text-[14px] font-black text-[#0F172A]">{order.customerNumber}</span>
                  </div>
                )}
                {order.notes && (
                  <div className="flex flex-col py-2 border-t border-slate-50">
                    <span className="text-[14px] font-bold text-slate-600 mb-1">Instructions / Notes</span>
                    <span className="text-[13px] font-medium text-slate-500 italic p-3 bg-slate-50 rounded-lg">{order.notes}</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                  <h3 className="text-[12px] font-black text-slate-400 uppercase tracking-widest">Item Breakdown</h3>
                  <span className="text-[12px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                    {Object.values(order.details || {}).reduce((s, v) => s + v, 0) || order.items || 0} Pieces Total
                  </span>
                </div>
                
                {order.details && Object.keys(order.details).length > 0 ? (
                  <div className="space-y-2">
                    {Object.entries(order.details).filter(([, v]) => v > 0).map(([item, qty]) => (
                      <div key={item} className="flex items-center justify-between py-2 px-3 bg-slate-50 rounded-lg">
                        <span className="text-[14px] font-bold text-slate-600">{item}</span>
                        <span className="text-[14px] font-black text-[#0F172A]">{qty}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[13px] font-medium text-slate-500 italic py-4 text-center">No detailed item breakdown available.</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 bg-[#F8FAFC]">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-black text-slate-500 uppercase tracking-widest">Total Billed</span>
            <div className="flex items-center gap-1 text-[24px] font-black text-[#1976D2]">
              <BiRupee size={24} className="mb-0.5" />
              <span>{order.amount?.toLocaleString() || '0'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
