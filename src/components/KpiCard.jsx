export default function KpiCard({ icon: Icon, value, label, sublabel, onClick, color = "brand", trend }) {
    const isClickable = !!onClick;
    return (
        <div
            onClick={onClick}
            className={`bg-white rounded-2xl border border-brand-100 shadow-sm p-6 flex items-start gap-4 transition-all duration-200
        ${isClickable ? 'cursor-pointer hover:shadow-lg hover:-translate-y-1 hover:border-[#1976D2]' : ''}
      `}
            style={{ fontFamily: 'Poppins, sans-serif' }}
        >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0
        ${color === 'brand' ? 'bg-blue-100' : color === 'orange' ? 'bg-orange-100' : 'bg-green-100'}
      `}>
                {Icon && (
                    <Icon
                        size={22}
                        className={color === 'brand' ? 'text-blue-600' : color === 'orange' ? 'text-orange-500' : 'text-green-600'}
                    />
                )}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-2xl font-bold text-gray-900 leading-tight">{value}</p>
                <p className="text-sm font-medium text-gray-500 mt-0.5">{label}</p>

                {trend ? (
                    <div className="mt-2">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold
                            ${trend.direction === 'up' ? 'bg-green-100 text-green-700' :
                                trend.direction === 'down' ? 'bg-red-100 text-red-700' :
                                    'bg-gray-100 text-gray-600'}`}>
                            {trend.text}
                        </span>
                    </div>
                ) : sublabel && (
                    <p className="text-xs text-gray-400 mt-1">{sublabel}</p>
                )}
            </div>
        </div>
    );
}
