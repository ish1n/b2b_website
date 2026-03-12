import { FiCalendar, FiDownload, FiDollarSign } from "react-icons/fi";
import { BiRupee } from "react-icons/bi";
import ExportCSV from "./ExportCSV";

export default function AdminTopBar({ title, dateFrom, setDateFrom, dateTo, setDateTo, onExpensesClick, isExpensesActive, orders }) {
    return (
        <header className="sticky top-0 z-40 bg-white border-b border-gray-200 h-16 flex items-center justify-between px-8 shadow-sm" style={{ fontFamily: 'DM Sans, sans-serif' }}>
            <h1 className="text-[18px] font-bold text-[#0F172A]">{title}</h1>

            <div className="flex items-center gap-4">
                {/* CEO Expenses */}
                <button
                    onClick={onExpensesClick}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[13.5px] font-bold transition-all border ${
                        isExpensesActive
                            ? 'bg-blue-50 text-blue-600 border-blue-200 shadow-sm'
                            : 'bg-amber-100 text-amber-900 border-amber-200 hover:bg-amber-200'
                    }`}
                >
                    <FiDollarSign size={16} />
                    CEO Expenses
                </button>

                {/* Date Picker */}
                <div className="flex items-center gap-3 bg-gray-50 rounded-lg px-3 py-2 border border-gray-200 shadow-sm">
                    <FiCalendar size={14} className="text-gray-400" />
                    <input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                        className="bg-transparent text-[13px] font-medium text-gray-700 outline-none border-none w-[115px]"
                    />
                    <span className="text-gray-300 text-xs">—</span>
                    <input
                        type="date"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                        className="bg-transparent text-[13px] font-medium text-gray-700 outline-none border-none w-[115px]"
                    />
                </div>

                {/* Export */}
                <ExportCSV orders={orders} className="!bg-blue-600 !text-white !p-2 !rounded-lg hover:!bg-blue-700 transition-colors shadow-sm" />
            </div>
        </header>
    );
}
