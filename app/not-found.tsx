import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-2xl mb-4">
        🔍
      </div>
      <h1 className="text-2xl font-black text-slate-900 mb-2">Page Not Found</h1>
      <p className="text-xs text-slate-500 max-w-xs mb-6">
        The mystery destination or trail you are looking for does not exist or has moved.
      </p>
      <Link
        href="/discover"
        className="px-5 py-2.5 rounded-full bg-slate-900 text-white text-xs font-bold shadow-md hover:bg-slate-800 transition-all"
      >
        Return to Discovery
      </Link>
    </div>
  );
}
