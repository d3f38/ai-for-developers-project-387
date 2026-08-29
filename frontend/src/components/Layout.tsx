import { Link, Outlet, useLocation } from "react-router-dom";
import { Calendar, User } from "lucide-react";

export default function Layout() {
  const location = useLocation();
  const isOwner = location.pathname.startsWith("/admin");

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-50 border-b border-border/60 bg-white/80 backdrop-blur-md">
        <div className="max-w-5xl mx-auto flex items-center justify-between px-6 h-16">
          <Link to="/" className="flex items-center gap-2 text-base font-bold text-foreground hover:opacity-80 transition-opacity">
            <Calendar className="h-5 w-5" />
            <span>Calendar Booking</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              to="/my-bookings"
              className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">My Bookings</span>
            </Link>
            <div className="w-px h-5 bg-border" />
            <Link
              to="/"
              className={`text-sm font-medium px-3 py-1.5 rounded-md transition-colors ${
                !isOwner && location.pathname === "/"
                  ? "bg-secondary text-secondary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Guest
            </Link>
            <Link
              to="/admin"
              className={`text-sm font-medium px-3 py-1.5 rounded-md transition-colors ${
                isOwner
                  ? "bg-secondary text-secondary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Owner
            </Link>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
