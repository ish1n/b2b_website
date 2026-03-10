import { FiDownload } from "react-icons/fi";

export default function ExportCSV({ orders, filenamePrefix = "Andes_Orders" }) {
    const handleExport = () => {
        if (!orders || orders.length === 0) return;

        // Headers: [Date, Time, Tenant, Description, Status, Amount]
        const headers = ["Date", "Time", "Tenant", "Description", "Status", "Amount"];

        const rows = orders.map(o => {
            let dateStr = "—";
            let timeStr = "—";

            if (o.timestamp) {
                const dateObj = new Date(o.timestamp.seconds ? o.timestamp.seconds * 1000 : o.timestamp);
                dateStr = dateObj.toLocaleDateString();
                timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            } else if (o.month && o.day) {
                dateStr = `${o.day}/${o.month}/${new Date().getFullYear()}`;
            }

            const description = o.service || "—";
            const amountStr = o.amount !== undefined ? o.amount.toString() : "0";

            return [
                dateStr,
                timeStr,
                o.tenant || "—",
                `"${description}"`, // Handle commas in description
                o.status || "—",
                amountStr
            ].join(",");
        });

        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
        const encodedUri = encodeURI(csvContent);

        const currentMonth = new Date().toLocaleString('default', { month: 'short' });
        const currentYear = new Date().getFullYear();
        const exportFilename = `${filenamePrefix}_${currentMonth}_${currentYear}.csv`;

        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", exportFilename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <button
            onClick={handleExport}
            disabled={!orders || orders.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        >
            <FiDownload size={16} className="text-[#1976D2]" />
            Export CSV
        </button>
    );
}
