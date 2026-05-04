import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-molecule-black flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="text-8xl font-light text-molecule-gold/20 mb-4">404</div>
        <h1 className="text-2xl font-light text-molecule-white mb-4">Page not found</h1>
        <p className="text-molecule-muted text-sm leading-relaxed mb-8">
          The page you&apos;re looking for doesn&apos;t exist. It may have been moved or
          the URL might be incorrect.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/"
            className="bg-molecule-gold text-molecule-black px-6 py-3 text-sm font-semibold uppercase tracking-[0.12em] hover:bg-molecule-gold-light transition-colors duration-200"
          >
            Back to Home
          </Link>
          <Link
            href="/dashboard"
            className="border border-molecule-gold text-molecule-gold px-6 py-3 text-sm font-semibold uppercase tracking-[0.12em] hover:bg-molecule-gold hover:text-molecule-black transition-all duration-200"
          >
            Open Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
