import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center space-y-4 font-sans">
      <span className="material-icons-round text-6xl text-zinc-650 block">search_off</span>
      <h2 className="text-2xl font-bold text-white">404 - Page Not Found</h2>
      <p className="text-zinc-400 text-sm max-w-md">
        The requested music resource or page could not be located in our registry.
      </p>
      <Link
        href="/"
        className="inline-block bg-blue-500 hover:bg-blue-400 text-white font-bold px-5 py-2.5 rounded-xl text-xs transition-all shadow-md"
      >
        Return to Home
      </Link>
    </div>
  );
}
