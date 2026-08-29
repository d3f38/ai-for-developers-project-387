import { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "@/api/client";
import type { EventType, Slot } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { ArrowLeft, Check, Clock, ChevronLeft, ChevronRight } from "lucide-react";

function formatTime(slot: string): string {
  const d = new Date(slot);
  return d.toLocaleString("en-US", { hour: "2-digit", minute: "2-digit" });
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function monthStart(year: number, month: number) {
  return new Date(year, month, 1);
}

function monthEnd(year: number, month: number) {
  return new Date(year, month + 1, 0);
}

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function toISODate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function GuestBooking() {
  const { eventTypeId } = useParams<{ eventTypeId: string }>();
  const navigate = useNavigate();

  const [eventType, setEventType] = useState<EventType | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const today = useMemo(() => new Date(), []);
  const [calendarMonth, setCalendarMonth] = useState(today.getMonth());
  const [calendarYear, setCalendarYear] = useState(today.getFullYear());

  const [availableDates, setAvailableDates] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!eventTypeId) return;
    const id = Number(eventTypeId);
    api
      .getPublicEventTypes()
      .then((types) => {
        const t = types.find((x) => x.id === id);
        if (!t) throw new Error("Event type not found");
        setEventType(t);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [eventTypeId]);

  useEffect(() => {
    if (!eventTypeId) return;
    const from = toISODate(monthStart(calendarYear, calendarMonth));
    const to = toISODate(monthEnd(calendarYear, calendarMonth));
    api
      .getAvailableSlots(Number(eventTypeId), from, to)
      .then((s) => {
        const dates = new Set<string>();
        s.filter((sl) => sl.available).forEach((sl) => {
          dates.add(toISODate(new Date(sl.startTime)));
        });
        setAvailableDates(dates);
      })
      .catch(() => {});
  }, [eventTypeId, calendarYear, calendarMonth]);

  const fetchSlotsForDate = useCallback(
    (date: string) => {
      if (!eventTypeId) return;
      setSelectedDate(date);
      setSelectedSlot(null);
      setLoadingSlots(true);
        api
          .getAvailableSlots(Number(eventTypeId), date, date)
          .then((s) => setSlots(s))
          .catch(() => setSlots([]))
          .finally(() => setLoadingSlots(false));
    },
    [eventTypeId],
  );

  const calendarDays = useMemo(() => {
    const start = monthStart(calendarYear, calendarMonth);
    const end = monthEnd(calendarYear, calendarMonth);
    const days: (Date | null)[] = [];

    let firstDow = start.getDay();
    if (firstDow === 0) firstDow = 7;
    for (let i = 1; i < firstDow; i++) days.push(null);

    for (let d = 1; d <= end.getDate(); d++) {
      days.push(new Date(calendarYear, calendarMonth, d));
    }
    return days;
  }, [calendarYear, calendarMonth]);

  const monthLabel = useMemo(() => {
    return new Date(calendarYear, calendarMonth).toLocaleString("en-US", {
      month: "long",
      year: "numeric",
    });
  }, [calendarYear, calendarMonth]);

  const prevMonth = () => {
    if (calendarMonth === 0) {
      setCalendarMonth(11);
      setCalendarYear((y) => y - 1);
    } else {
      setCalendarMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (calendarMonth === 11) {
      setCalendarMonth(0);
      setCalendarYear((y) => y + 1);
    } else {
      setCalendarMonth((m) => m + 1);
    }
  };

  const handleSubmit = async () => {
    if (!selectedSlot || !name.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await api.createBooking({
        eventTypeId: Number(eventTypeId),
        guestName: name.trim(),
        guestEmail: email.trim() || undefined,
        startTime: selectedSlot,
      });
      setSuccess(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Booking failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <p className="p-8 text-center text-muted-foreground">Loading...</p>;
  if (error) return <p className="p-8 text-center text-destructive">Error: {error}</p>;

  if (success) {
    return (
      <div className="max-w-lg mx-auto px-6 py-16 text-center">
        <div className="mx-auto w-12 h-12 rounded-full bg-foreground flex items-center justify-center mb-6">
          <Check className="h-6 w-6 text-background" />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight mb-3">
          Booking confirmed!
        </h1>
        <p className="text-muted-foreground mb-2">
          You are booked for {eventType?.name}
        </p>
        <p className="text-sm text-muted-foreground mb-8">
          {selectedSlot && formatDate(selectedSlot)} at {selectedSlot && formatTime(selectedSlot)}
        </p>
        <div className="flex gap-3 justify-center">
          <Button variant="outline" onClick={() => navigate("/")}>
            Back to event types
          </Button>
          <Button
            onClick={() => {
              setSuccess(false);
              setSelectedSlot(null);
              setSelectedDate(null);
              setSlots([]);
              setName("");
              setEmail("");
            }}
          >
            Book another
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <Button
        variant="ghost"
        className="mb-6 -ml-3 text-muted-foreground hover:text-foreground"
        onClick={() => navigate("/")}
      >
        <ArrowLeft className="h-4 w-4 mr-1.5" />
        Back
      </Button>

      {eventType && (
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight mb-2">
            {eventType.name}
          </h1>
          {eventType.description && (
            <p className="text-base text-muted-foreground mb-3">
              {eventType.description}
            </p>
          )}
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            {eventType.durationMinutes} min
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Calendar column */}
        <div>
          {/* Month header */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={prevMonth}
              className="p-1.5 rounded-md hover:bg-muted transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <h2 className="text-lg font-semibold">{monthLabel}</h2>
            <button
              onClick={nextMonth}
              className="p-1.5 rounded-md hover:bg-muted transition-colors"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          {/* Day names */}
          <div className="grid grid-cols-7 mb-2">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
              <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">
                {d}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 rounded-lg border border-border overflow-hidden">
            {calendarDays.map((date, i) => {
              if (!date) {
                return <div key={`empty-${i}`} className="aspect-square bg-muted/50" />;
              }

              const isToday = sameDay(date, today);
              const iso = toISODate(date);
              const hasSlots = availableDates.has(iso);
              const isSelected = selectedDate === iso;
              const isPast = date < new Date(today.getFullYear(), today.getMonth(), today.getDate());

              return (
                <button
                  key={iso}
                  disabled={!hasSlots || isPast}
                  onClick={() => fetchSlotsForDate(iso)}
                  className={`aspect-square flex flex-col items-center justify-center text-sm font-medium transition-all border-r border-b border-border ${
                    isSelected
                      ? "bg-foreground text-background"
                      : isToday && !isSelected
                        ? "bg-muted"
                        : "bg-card hover:bg-muted"
                  } ${!hasSlots || isPast ? "text-muted-foreground/30 cursor-default" : "text-foreground cursor-pointer"}`}
                >
                  <span>{date.getDate()}</span>
                  {hasSlots && !isPast && !isSelected && (
                    <span className="w-1 h-1 rounded-full bg-foreground mt-0.5" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Slots + form column */}
        <div>
          {!selectedDate && (
            <div className="rounded-lg border border-border bg-card p-8 text-center">
              <p className="text-muted-foreground">Select a date to see available time slots</p>
            </div>
          )}

          {selectedDate && (
            <>
              <h2 className="text-base font-semibold mb-3">
                {formatDate(selectedDate)}
              </h2>

              {loadingSlots ? (
                <p className="text-muted-foreground text-sm">Loading slots...</p>
              ) : slots.length === 0 ? (
                <div className="rounded-lg border border-border bg-card p-6 text-center mb-6">
                  <p className="text-sm text-muted-foreground">No available slots on this date</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-1.5 mb-6">
                  {slots.map((s) => {
                    const isBooked = !s.available;
                    return (
                      <button
                        key={s.startTime}
                        disabled={isBooked}
                        onClick={() => setSelectedSlot(s.startTime)}
                        className={`rounded-md border py-1.5 px-2 text-xs font-medium transition-all duration-200 ${
                          isBooked
                            ? "border-muted bg-muted/50 text-muted-foreground/40 line-through cursor-default"
                            : selectedSlot === s.startTime
                              ? "border-foreground bg-foreground text-background"
                              : "border-border hover:border-foreground/30 bg-card text-foreground"
                        }`}
                      >
                        {formatTime(s.startTime)}
                      </button>
                    );
                  })}
                </div>
              )}

              {selectedSlot && (
                <Card>
                  <CardHeader>
                    <CardTitle>Your details</CardTitle>
                    <CardDescription>
                      {formatDate(selectedDate)} at {formatTime(selectedSlot)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Your name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email (optional)</Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your@email.com"
                      />
                    </div>
                    {error && <p className="text-sm text-destructive">{error}</p>}
                    <Button
                      className="w-full"
                      size="lg"
                      disabled={!name.trim() || submitting}
                      onClick={handleSubmit}
                    >
                      {submitting ? "Booking..." : "Confirm booking"}
                    </Button>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
