export default function LoadingSpinner({ fullscreen = false }) {
    if (fullscreen) {
        return (
            <div className="min-h-screen bg-brand-50 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-brand-100 border-t-brand-DEFAULT rounded-full animate-spin" />
                    <p className="text-brand-DEFAULT font-poppins font-medium text-sm">Loading...</p>
                </div>
            </div>
        );
    }
    return (
        <div className="flex items-center justify-center py-16">
            <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-4 border-brand-100 border-t-[#1976D2] rounded-full animate-spin" />
                <p className="text-[#1976D2] font-medium text-sm" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    Loading...
                </p>
            </div>
        </div>
    );
}
