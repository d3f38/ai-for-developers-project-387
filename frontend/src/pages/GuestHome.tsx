import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/api/client";
import type { EventType } from "@/types";
import { Button } from "@/components/ui/button";
import { Clock } from "lucide-react";

export default function GuestHome() {
  const [types, setTypes] = useState<EventType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    api
      .getPublicEventTypes()
      .then(setTypes)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="p-8 text-center text-muted-foreground">Loading...</p>;
  if (error) return <p className="p-8 text-center text-destructive">Error: {error}</p>;

  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <div className="mb-10">
        <h1 className="text-4xl font-extrabold tracking-tight mb-3">
          Book a time
        </h1>
        <p className="text-lg text-muted-foreground">
          Choose an event type and pick a free slot
        </p>
      </div>

      {types.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-12 text-center">
          <p className="text-muted-foreground">No event types available yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {types.map((t) => (
            <div
              key={t.id}
              className="flex items-center justify-between rounded-lg border border-border bg-card px-6 py-5 hover:border-foreground/20 transition-colors"
            >
              <div>
                <h3 className="text-base font-semibold">{t.name}</h3>
                {t.description && (
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {t.description}
                  </p>
                )}
                <p className="flex items-center gap-1.5 text-sm text-muted-foreground mt-2">
                  <Clock className="h-3.5 w-3.5" />
                  {t.durationMinutes} min
                </p>
              </div>
              <Button onClick={() => navigate(`/book/${t.id}`)} size="lg">
                Select
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
