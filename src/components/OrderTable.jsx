import { FiPackage } from "react-icons/fi";
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
                <p className="font-semibold text-gray-500">No orders for this day</p>
                <p className="text-sm text-gray-400 mt-1">Select a different day from the chart above</p>
            </div>
        );
    }

    return (
        <div style={{ fontFamily: 'Poppins, sans-serif' }}>
            <div className="flex justify-end mb-4">
                <ExportCSV orders={orders} />
            </div>
            <div className="overflow-x-auto">
                <table className="w-full min-w-[600px]">
                    <thead>
                        <tr className="bg-[#f8fcff]">
                            <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3 rounded-tl-xl">Order ID</th>
                            {showTenant && <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Tenant</th>}
                            <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Service</th>
                            <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Items</th>
                            <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Amount</th>
                            <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3 rounded-tr-xl">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.map((order, i) => (
                            <tr key={order.id || i} className="border-b border-[#f8fcff] hover:bg-brand-50/30 transition-colors">
                                <td className="px-4 py-3 text-sm font-semibold text-[#1976D2]">{order.id}</td>
                                {showTenant && <td className="px-4 py-3 text-sm text-gray-700">{order.tenant}</td>}
                                <td className="px-4 py-3 text-sm text-gray-600">{order.service}</td>
                                <td className="px-4 py-3 text-sm text-gray-600 text-center">{order.items}</td>
                                <td className="px-4 py-3 text-sm font-medium text-gray-800">₹{(order.amount || 0).toLocaleString()}</td>
                                <td className="px-4 py-3">
                                    <span className={`px-3 py-0.5 rounded-full text-xs font-semibold ${STATUS_BADGE[order.status] || 'bg-gray-100 text-gray-500'}`}>
                                        {order.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
