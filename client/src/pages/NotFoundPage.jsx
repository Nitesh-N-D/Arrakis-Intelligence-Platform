import { useEffect } from "react";
import { Link } from "react-router-dom";
import Card from "../components/ui/Card";

export default function NotFoundPage() {
  useEffect(() => {
    document.title = "Page Not Found | Arrakis Intelligence Platform";
  }, []);

  return (
    <div className="min-h-screen px-6 py-10">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-3xl items-center">
        <Card className="w-full text-center">
          <div className="text-xs uppercase tracking-[0.34em] text-white/45">Navigation fault</div>
          <h1 className="mt-4 font-display text-5xl text-white">This path has drifted into the desert</h1>
          <p className="mt-4 text-sm leading-7 text-white/62">
            The page you requested does not exist or the route has moved.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              className="focus-ring inline-flex items-center justify-center rounded-button bg-gradient-to-r from-orange-500 via-amber-400 to-yellow-400 px-4 py-3 text-sm font-semibold text-black"
              to="/"
            >
              Return to dashboard
            </Link>
            <Link
              className="focus-ring inline-flex items-center justify-center rounded-button border border-border-subtle bg-white/5 px-4 py-3 text-sm font-semibold text-white"
              to="/login"
            >
              Go to login
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
