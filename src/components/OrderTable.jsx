import { FiPackage, FiAlertTriangle } from "react-icons/fi";
import ExportCSV from "./ExportCSV";

const STATUS_BADGE = {
    Delivered: 'bg-green-100 text-green-600',
    Confirmed: 'bg-brand-100 text-[#1976D2]',
    Pending: 'bg-orange-100 text-[#FF6B35]',
};

export default function OrderTable({ orders = [], showTenant = true }) {
    if (orders.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400" style={{ fontFamily: 'Poppins, sans-serif' }}>
                <FiPackage size={48} className="bg-blue-50 text-[#1976D2] p-3 rounded-full mb-3" />
                <p className="font-semibold text-gray-500">No orders found</p>
                <p className="text-sm text-gray-400 mt-1">Try adjusting your filters</p>
            </div>
        );
    }

    return (
        <div style={{ fontFamily: 'Poppins, sans-serif' }}>
            <div className="flex justify-between items-center mb-4">
                <p className="text-xs text-gray-400">{orders.length} order{orders.length !== 1 ? 's' : ''}</p>
                <ExportCSV orders={orders} />
            </div>
            <div className="overflow-x-auto">
                <table className="w-full min-w-[800px]">
                    <thead>
                        <tr className="bg-[#f8fcff]">
                            <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3 rounded-tl-xl">Date</th>
                            <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Order ID</th>
                            {showTenant && <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Tenant</th>}
                            <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Order Details</th>
                            <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Items</th>
                            <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Amount</th>
                            <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3 rounded-tr-xl">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.map((order, i) => {
                            const isIssue = order.hasIssue || order.tenant === "Issues & Complaints";
                            return (
                                <tr
                                    key={order.id || i}
                                    className={`border-b transition-colors ${isIssue
                                        ? 'bg-red-50/60 border-red-100 hover:bg-red-50'
                                        : 'border-[#f8fcff] hover:bg-brand-50/30'
                                        }`}
                                >
                                    <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                                        {order.date || `${order.day}/${order.month}`}
                                    </td>
                                    <td className="px-4 py-3 text-sm font-semibold text-[#1976D2]">
                                        <div className="flex items-center gap-1.5">
                                            {isIssue && <FiAlertTriangle size={13} className="text-red-500 flex-shrink-0" />}
                                            {order.id}
                                        </div>
                                    </td>
                                    {showTenant && (
                                        <td className="px-4 py-3">
                                            <span className={`text-sm font-medium ${isIssue ? 'text-red-600' : 'text-gray-700'}`}>
                                                {order.tenant}
                                            </span>
                                        </td>
                                    )}
                                    <td className="px-4 py-3 text-sm text-gray-600 max-w-xs">
                                        <span className="block truncate" title={order.service}>{order.service}</span>
                                        {order.issueType && (
                                            <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-600 uppercase tracking-wide">
                                                <FiAlertTriangle size={10} /> {order.issueType}
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-600">{order.items}</td>
                                    <td className="px-4 py-3 text-sm font-bold text-gray-800">
                                        {order.amount > 0 ? `₹${order.amount.toLocaleString()}` : '—'}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`px-3 py-0.5 rounded-full text-xs font-semibold ${STATUS_BADGE[order.status] || 'bg-gray-100 text-gray-500'}`}>
                                            {order.status}
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}