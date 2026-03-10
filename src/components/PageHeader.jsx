import { useNavigate } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";

export default function PageHeader({ title, subtitle, backTo }) {
    const navigate = useNavigate();
    return (
        <div className="mb-6 flex flex-col gap-1" style={{ fontFamily: 'Poppins, sans-serif' }}>
            {backTo !== undefined && (
                <button
                    onClick={() => backTo ? navigate(backTo) : navigate(-1)}
                    className="flex items-center gap-2 text-[#1976D2] text-sm font-medium hover:underline mb-2 w-fit"
                >
                    <FiArrowLeft size={16} />
                    Back
                </button>
            )}
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
        </div>
    );
}
