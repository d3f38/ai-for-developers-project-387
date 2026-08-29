import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/api/client";
import type { Booking } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { ArrowLeft, Search, Calendar, Clock, User } from "lucide-react";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    weekday: "short",
    month: "long",
    day: "numeric",
  });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function MyBookings() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [bookings, setBookings] = useState<Booking[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!email.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const result = await api.getGuestBookings(email.trim());
      setBookings(result);
      setSearched(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Search failed");
      setBookings(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <Button
        variant="ghost"
        className="mb-6 -ml-3 text-muted-foreground hover:text-foreground"
        onClick={() => navigate("/")}
      >
        <ArrowLeft className="h-4 w-4 mr-1.5" />
        Back
      </Button>

      <h1 className="text-3xl font-extrabold tracking-tight mb-8">
        My Bookings
      </h1>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Find your bookings
          </CardTitle>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
          <Button onClick={handleSearch} disabled={!email.trim() || loading}>
            {loading ? "Searching..." : "Search"}
          </Button>
        </CardContent>
      </Card>

      {error && <p className="text-destructive mb-4">{error}</p>}

      {searched && (
        <>
          {!bookings || bookings.length === 0 ? (
            <div className="rounded-lg border border-border bg-card p-8 text-center">
              <p className="text-muted-foreground">
                No bookings found for this email
              </p>
            </div>
          ) : (
            <div>
              <p className="text-sm text-muted-foreground mb-4">
                Found {bookings.length} booking{bookings.length !== 1 ? "s" : ""}
              </p>
              <div className="space-y-3">
                {bookings.map((b) => (
                  <div
                    key={b.id}
                    className="rounded-lg border border-border bg-card px-5 py-4"
                  >
                    <h3 className="font-semibold text-base mb-2">
                      {b.eventTypeName}
                    </h3>
                    <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                      <p className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDate(b.startTime)}
                      </p>
                      <p className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        {formatTime(b.startTime)} — {formatTime(b.endTime)}
                      </p>
                      <p className="flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5" />
                        {b.guestName}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
