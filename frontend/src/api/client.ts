const BASE = "/api";

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${url}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message ?? "API error");
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  // Owner
  getEventTypes() {
    return request<import("../types").EventType[]>("/event-types");
  },
  createEventType(data: import("../types").EventTypeUpsert) {
    return request<import("../types").EventType>("/event-types", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  getEventType(id: number) {
    return request<import("../types").EventType>(`/event-types/${id}`);
  },
  updateEventType(id: number, data: import("../types").EventTypeUpsert) {
    return request<import("../types").EventType>(`/event-types/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },
  deleteEventType(id: number) {
    return request<void>(`/event-types/${id}`, { method: "DELETE" });
  },
  getBookings() {
    return request<import("../types").Booking[]>("/bookings");
  },
  // Guest
  getPublicEventTypes() {
    return request<import("../types").EventType[]>("/public/event-types");
  },
  getAvailableSlots(
    eventTypeId: number,
    dateFrom?: string,
    dateTo?: string,
  ) {
    const params = new URLSearchParams({ eventTypeId: String(eventTypeId) });
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    return request<import("../types").Slot[]>(
      `/public/slots?${params.toString()}`,
    );
  },
  getGuestBookings(email: string) {
    return request<import("../types").Booking[]>(
      `/public/bookings?email=${encodeURIComponent(email)}`,
    );
  },
  createBooking(data: import("../types").BookingCreate) {
    return request<import("../types").Booking>("/public/bookings", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
};
