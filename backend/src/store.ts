import type { EventType, Booking } from "./types.js";

const eventTypes = new Map<number, EventType>();
const bookings: Booking[] = [];
let nextEventTypeId = 1;
let nextBookingId = 1;

export function getAllEventTypes(): EventType[] {
  return Array.from(eventTypes.values());
}

export function getEventType(id: number): EventType | undefined {
  return eventTypes.get(id);
}

export function createEventType(data: { name: string; description: string; durationMinutes: number }): EventType {
  const et: EventType = { id: nextEventTypeId++, ...data };
  eventTypes.set(et.id, et);
  return et;
}

export function updateEventType(id: number, data: { name: string; description: string; durationMinutes: number }): EventType | null {
  const existing = eventTypes.get(id);
  if (!existing) return null;
  const updated: EventType = { ...existing, ...data };
  eventTypes.set(id, updated);
  return updated;
}

export function deleteEventType(id: number): { success: boolean; reason?: string } {
  const hasActive = bookings.some(
    (b) => b.eventTypeId === id && new Date(b.startTime) > new Date(),
  );
  if (hasActive) return { success: false, reason: "Cannot delete: active future bookings exist" };
  eventTypes.delete(id);
  return { success: true };
}

export function getAllBookings(): Booking[] {
  return [...bookings].sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
  );
}

export function createBooking(data: {
  eventTypeId: number;
  guestName: string;
  guestEmail?: string;
  startTime: string;
}): Booking | null {
  const eventType = eventTypes.get(data.eventTypeId);
  if (!eventType) return null;

  const start = new Date(data.startTime);
  const end = new Date(start.getTime() + eventType.durationMinutes * 60_000);

  const conflicts = bookings.some((b) => {
    const bStart = new Date(b.startTime).getTime();
    const bEnd = new Date(b.endTime).getTime();
    return start.getTime() < bEnd && end.getTime() > bStart;
  });

  if (conflicts) return null;

  const booking: Booking = {
    id: nextBookingId++,
    eventTypeId: data.eventTypeId,
    eventTypeName: eventType.name,
    guestName: data.guestName,
    guestEmail: data.guestEmail,
    startTime: data.startTime,
    endTime: end.toISOString(),
    createdAt: new Date().toISOString(),
  };
  bookings.push(booking);
  return booking;
}

export function getBookingsByEmail(email: string): Booking[] {
  return bookings
    .filter((b) => b.guestEmail?.toLowerCase() === email.toLowerCase())
    .sort(
      (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
    );
}

/**
 * Хранилище живёт в памяти процесса, поэтому после каждого рестарта
 * (на бесплатном тарифе Render инстанс засыпает) оно пустое, и гость видит
 * приложение без единого типа событий. Наполняем демо-данными на старте.
 */
export function seedDemoData(): void {
  if (eventTypes.size > 0) return;

  createEventType({
    name: "Intro call",
    description: "Короткое знакомство и обсуждение задачи",
    durationMinutes: 15,
  });
  createEventType({
    name: "Consultation",
    description: "Разбор задачи с рекомендациями",
    durationMinutes: 30,
  });
  createEventType({
    name: "Deep dive",
    description: "Детальная проработка решения",
    durationMinutes: 60,
  });
}

export function isSlotOccupied(startTime: string, durationMinutes: number): boolean {
  const start = new Date(startTime);
  const end = new Date(start.getTime() + durationMinutes * 60_000);
  return bookings.some((b) => {
    const bStart = new Date(b.startTime).getTime();
    const bEnd = new Date(b.endTime).getTime();
    return start.getTime() < bEnd && end.getTime() > bStart;
  });
}
