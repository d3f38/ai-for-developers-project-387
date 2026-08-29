import { expect, type APIRequestContext, type Page } from "@playwright/test";

export interface EventType {
  id: number;
  name: string;
  description: string;
  durationMinutes: number;
}

export interface Booking {
  id: number;
  eventTypeId: number;
  eventTypeName: string;
  guestName: string;
  guestEmail?: string;
  startTime: string;
  endTime: string;
}

/**
 * Хранилище бэкенда общее для всех типов событий: занятый слот блокирует это
 * время целиком. Поэтому каждый тест берёт свой день, чтобы прогоны не мешали
 * друг другу.
 */
export function dateInDays(days: number): Date {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

export function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function slotAt(date: Date, hourUTC: number): string {
  const d = new Date(date);
  d.setUTCHours(hourUTC, 0, 0, 0);
  return d.toISOString();
}

/** Подпись слота в UI: фронтенд рендерит время через toLocaleString("en-US"). */
export function slotLabel(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  });
}

export function monthLabel(date: Date): string {
  return date.toLocaleString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export async function createEventType(
  request: APIRequestContext,
  data: { name: string; description?: string; durationMinutes: number },
): Promise<EventType> {
  const res = await request.post("/api/event-types", {
    data: { description: "", ...data },
  });
  expect(res.status(), await res.text()).toBe(200);
  return res.json();
}

export async function createBooking(
  request: APIRequestContext,
  data: {
    eventTypeId: number;
    guestName: string;
    guestEmail?: string;
    startTime: string;
  },
) {
  return request.post("/api/public/bookings", { data });
}

/** Перелистывает календарь до нужного месяца и открывает день. */
export async function pickDate(page: Page, date: Date): Promise<void> {
  const wanted = monthLabel(date);
  const heading = page.locator("h2").first();
  // В шапке календаря ровно две кнопки — «предыдущий» и «следующий» месяц.
  const nextMonth = heading.locator("..").locator("button").last();

  for (let i = 0; i < 12; i++) {
    if ((await heading.innerText()) === wanted) break;
    await nextMonth.click();
  }
  await expect(heading).toHaveText(wanted);

  const day = page.getByRole("button", {
    name: String(date.getUTCDate()),
    exact: true,
  });
  await expect(day).toBeEnabled();
  await day.click();
}
