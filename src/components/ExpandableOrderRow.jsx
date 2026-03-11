import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CATEGORIES } from "../data/hostelOrders";
import { FiChevronUp, FiChevronDown, FiArrowRight, FiShoppingBag, FiUsers } from "react-icons/fi";
import { MdScale } from "react-icons/md";
import { BiRupee } from "react-icons/bi";

export default function ExpandableOrderRow({ order, showProperty = false }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const cat = CATEGORIES[order.category] || {};

  return (
    <>
      {/* Main row — no ID column */}
      <tr
        onClick={() => setOpen(!open)}
        className="cursor-pointer hover:bg-brand-50/60 transition-colors border-b border-gray-100 group"
      >
        <td className="px-4 py-3 text-sm font-medium text-gray-800">{order.date}</td>
        {showProperty && (
          <td className="px-4 py-3 text-sm text-gray-700">{order.property}</td>
        )}
        <td className="px-4 py-3">
          <span
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
            style={{ backgroundColor: cat.color + "18", color: cat.color }}
          >
            {cat.label}
          </span>
        </td>
        <td className="px-4 py-3">
          <div className="flex gap-2 items-center">
            {order.items ? (
              <span className="inline-flex items-center gap-1 bg-gray-50 border border-gray-200 text-gray-700 text-xs font-semibold px-2 py-1 rounded-md shadow-sm">
                <FiShoppingBag size={12} className="text-brand opacity-80" /> {order.items}
              </span>
            ) : <span className="text-gray-400 text-sm">—</span>}
          </div>
        </td>
        <td className="px-4 py-3">
          <div className="flex gap-2 items-center">
            {order.weight ? (
              <span className="inline-flex items-center gap-1 bg-gray-50 border border-gray-200 text-gray-700 text-xs font-semibold px-2 py-1 rounded-md shadow-sm">
                <MdScale size={13} className="text-orange-600 opacity-80" /> {order.weight}
              </span>
            ) : <span className="text-gray-400 text-sm">—</span>}
          </div>
        </td>
        <td className="px-4 py-3">
          <div className="flex gap-2 items-center">
            {order.studentCount ? (
              <span className="inline-flex items-center gap-1 bg-gray-50 border border-gray-200 text-gray-700 text-xs font-semibold px-2 py-1 rounded-md shadow-sm">
                <FiUsers size={13} className="text-indigo-600 opacity-80" /> {order.studentCount}
              </span>
            ) : <span className="text-gray-400 text-sm">—</span>}
          </div>
        </td>
        <td className="px-4 py-3">
          <span
            className={`inline-block text-xs font-bold px-2.5 py-1 rounded-full ${
              order.status === "Delivered"
                ? "bg-emerald-50 text-emerald-700"
                : order.status === "Pending"
                ? "bg-amber-50 text-amber-700"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            {order.status}
          </span>
        </td>
        <td className="px-4 py-3 text-gray-400 group-hover:text-brand transition-colors">
          {open ? <FiChevronUp size={18} /> : <FiChevronDown size={18} />}
        </td>
      </tr>

      {/* Expanded detail panel */}
      {open && (
        <tr className="bg-gradient-to-br from-brand-50/40 to-white">
          <td colSpan={showProperty ? 8 : 7} className="px-6 py-5">
            {/* Key metrics row */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 mb-4">
              <MetricCard label="Property" value={order.property} />
              <MetricCard label="Category" value={cat.label} />
              <MetricCard label="Status" value={order.status}
                badgeClass={
                  order.status === "Delivered" ? "text-emerald-700" :
                  order.status === "Pending" ? "text-amber-600" : "text-gray-600"
                }
              />
              {order.customerName ? <MetricCard label="Customer" value={order.customerName} /> : null}
              {order.customerNumber ? <MetricCard label="Phone" value={order.customerNumber} /> : null}
              {order.issueType ? <MetricCard label="Issue Type" value={order.issueType} /> : null}
              {order.reportedBy ? <MetricCard label="Reported By" value={order.reportedBy} /> : null}
              {order.solution ? <MetricCard label="Solution" value={order.solution} /> : null}
            </div>

            {/* Linen item breakdown */}
            {order.details && (
              <div className="mb-4">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Item Breakdown
                </p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(order.details).map(([item, qty]) => (
                    <span
                      key={item}
                      className="bg-white border border-brand-100 rounded-lg px-3 py-2 text-xs font-medium text-gray-700 shadow-sm flex items-center gap-2"
                    >
                      <span className="text-gray-500">{item}</span>
                      <span className="font-bold text-brand bg-brand-50 px-2 py-0.5 rounded-md">{qty}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/client/order/${order.id}`);
              }}
              className="text-sm font-semibold text-brand hover:text-brand-dark transition-colors inline-flex items-center gap-1"
            >
              View Full Details <FiArrowRight size={14} />
            </button>
          </td>
        </tr>
      )}
    </>
  );
}

function MetricCard({ label, value, highlight = false, badgeClass = "" }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 px-3 py-2.5 shadow-sm">
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{label}</p>
      <p className={`text-sm font-semibold mt-0.5 ${highlight ? "text-brand" : badgeClass || "text-gray-800"}`}>
        {value}
      </p>
    </div>
  );
}
