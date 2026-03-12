import { FiPackage, FiAlertTriangle, FiTrash2, FiInbox } from "react-icons/fi";
import { BiRupee } from "react-icons/bi";
import ExportCSV from "./ExportCSV";
import EmptyState from "./EmptyState";

const STATUS_BADGE = {
    Delivered: 'bg-green-100 text-green-600',
    Confirmed: 'bg-brand-100 text-[#1976D2]',
    Pending: 'bg-orange-100 text-[#FF6B35]',
};

export default function OrderTable({ orders = [], showTenant = true, onDelete }) {
    if (orders.length === 0) {
        return (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <EmptyState 
                    icon={FiPackage}
                    title="No orders found"
                    message="Try adjusting your filters or search terms to find what you're looking for."
                />
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden" style={{ fontFamily: 'DM Sans, sans-serif' }}>
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-50">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{orders.length} order{orders.length !== 1 ? 's' : ''}</p>
                <ExportCSV orders={orders} />
            </div>
            <div className="overflow-x-auto">
                <table className="w-full min-w-[800px]">
                    <thead>
                        <tr className="bg-gray-50/50">
                            <th className="text-left text-xs font-bold text-gray-500 px-6 py-4 uppercase tracking-wider">Date</th>
                            {showTenant && <th className="text-left text-xs font-bold text-gray-500 px-6 py-4 uppercase tracking-wider">Tenant</th>}
                            <th className="text-left text-xs font-bold text-gray-500 px-6 py-4 uppercase tracking-wider">Order Details</th>
                            <th className="text-right text-xs font-bold text-gray-500 px-6 py-4 uppercase tracking-wider">Clothes</th>
                            <th className="text-right text-xs font-bold text-gray-500 px-6 py-4 uppercase tracking-wider">Amount</th>
                            <th className="text-center text-xs font-bold text-gray-500 px-6 py-4 uppercase tracking-wider">Status</th>
                            {onDelete && <th className="text-right text-xs font-bold text-gray-500 px-6 py-4 uppercase tracking-wider">Action</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {orders.map((order, i) => {
                            const isIssue = order.hasIssue || order.category === "ISSUES" || order.tenant === "Issues & Complaints";
                            return (
                                <tr
                                    key={order.id || i}
                                    className={`border-b border-gray-50 transition-colors cursor-pointer ${isIssue
                                        ? 'bg-red-50/40 hover:bg-red-50/60'
                                        : 'hover:bg-gray-50/80'
                                        }`}
                                >
                                    <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                                        {order.date || `${order.day}/${order.month}`}
                                    </td>
                                    {showTenant && (
                                        <td className="px-6 py-4">
                                            <span className={`text-sm font-semibold ${isIssue ? 'text-red-600' : 'text-gray-900'}`}>
                                                {order.property || order.tenant}
                                            </span>
                                        </td>
                                    )}
                                    <td className="px-6 py-4 text-sm text-gray-600 max-w-xs">
                                        <span className="block truncate font-medium" title={order.service}>{order.service}</span>
                                        {order.issueType && (
                                            <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded text-[10px] font-bold bg-red-50 text-red-600 uppercase tracking-wider">
                                                <FiAlertTriangle size={10} /> {order.issueType}
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-sm font-semibold text-gray-700 text-right">{order.items}</td>
                                    <td className="px-6 py-4 text-sm font-bold text-gray-900 text-right">
                                        {order.amount > 0 ? (
                                            <div className="flex items-center justify-end gap-0.5">
                                                <BiRupee size={12} className="mb-0.5" />
                                                <span>{order.amount.toLocaleString()}</span>
                                            </div>
                                        ) : '—'}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                                            order.status === "Delivered" ? "bg-green-100 text-green-700" :
                                            order.status === "Pending" ? "bg-yellow-100 text-yellow-800" :
                                            order.status === "Confirmed" ? "bg-blue-100 text-blue-700" :
                                            "bg-red-100 text-red-700"
                                        }`}>
                                            {order.status}
                                        </span>
                                    </td>
                                    {onDelete && (
                                        <td className="px-6 py-4 text-right">
                                            <button onClick={() => onDelete(order)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all">
                                                <FiTrash2 size={16} />
                                            </button>
                                        </td>
                                    )}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}