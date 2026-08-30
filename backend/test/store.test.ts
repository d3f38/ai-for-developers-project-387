import { beforeEach, describe, expect, it, vi } from "vitest";
import type * as Store from "../src/store.js";

let store: typeof Store;

beforeEach(async () => {
  vi.resetModules();
  store = await import("../src/store.js");
});

function seedEventType(durationMinutes: number) {
  return store.createEventType({
    name: "Event",
    description: "",
    durationMinutes,
  });
}

function seedBooking(startTime: string, durationMinutes: number) {
  seedEventType(durationMinutes);
  return store.createBooking({
    eventTypeId: 1,
    guestName: "Guest",
    startTime,
  })!;
}

describe("isSlotOccupied", () => {
  it("does not treat touching boundaries as occupied", () => {
    seedBooking("2030-01-15T10:00:00.000Z", 60);

    expect(store.isSlotOccupied("2030-01-15T09:00:00.000Z", 60)).toBe(false);
    expect(store.isSlotOccupied("2030-01-15T11:00:00.000Z", 60)).toBe(false);
  });

  it("detects a fully covered slot", () => {
    seedBooking("2030-01-15T10:00:00.000Z", 60);

    expect(store.isSlotOccupied("2030-01-15T10:15:00.000Z", 15)).toBe(true);
  });

  it("detects partial overlap on both sides", () => {
    seedBooking("2030-01-15T10:00:00.000Z", 60);

    expect(store.isSlotOccupied("2030-01-15T09:30:00.000Z", 60)).toBe(true);
    expect(store.isSlotOccupied("2030-01-15T10:30:00.000Z", 60)).toBe(true);
  });

  it("detects a slot nested inside a booking", () => {
    seedBooking("2030-01-15T09:00:00.000Z", 120);

    expect(store.isSlotOccupied("2030-01-15T09:30:00.000Z", 30)).toBe(true);
  });

  it("detects a slot that fully contains a booking", () => {
    seedBooking("2030-01-15T10:00:00.000Z", 30);

    expect(store.isSlotOccupied("2030-01-15T09:00:00.000Z", 120)).toBe(true);
  });

  it("reports an empty slot as free", () => {
    seedBooking("2030-01-15T10:00:00.000Z", 60);

    expect(store.isSlotOccupied("2030-01-15T12:00:00.000Z", 60)).toBe(false);
  });
});

describe("createBooking", () => {
  it("creates a booking with a computed endTime", () => {
    seedEventType(30);

    const booking = store.createBooking({
      eventTypeId: 1,
      guestName: "Alice",
      startTime: "2030-01-15T10:00:00.000Z",
    });

    expect(booking).not.toBeNull();
    expect(booking!.endTime).toBe("2030-01-15T10:30:00.000Z");
    expect(booking!.eventTypeName).toBe("Event");
  });

  it("returns null for an unknown event type", () => {
    expect(
      store.createBooking({
        eventTypeId: 999,
        guestName: "Alice",
        startTime: "2030-01-15T10:00:00.000Z",
      }),
    ).toBeNull();
  });

  it("rejects a booking that overlaps an existing one", () => {
    seedEventType(60);
    store.createBooking({
      eventTypeId: 1,
      guestName: "Alice",
      startTime: "2030-01-15T10:00:00.000Z",
    });

    const conflict = store.createBooking({
      eventTypeId: 1,
      guestName: "Bob",
      startTime: "2030-01-15T10:30:00.000Z",
    });

    expect(conflict).toBeNull();
  });

  it("allows adjacent non-overlapping bookings", () => {
    seedEventType(60);

    const first = store.createBooking({
      eventTypeId: 1,
      guestName: "Alice",
      startTime: "2030-01-15T10:00:00.000Z",
    });
    const second = store.createBooking({
      eventTypeId: 1,
      guestName: "Bob",
      startTime: "2030-01-15T11:00:00.000Z",
    });

    expect(first).not.toBeNull();
    expect(second).not.toBeNull();
  });
});

describe("deleteEventType", () => {
  it("deletes an event type without bookings", () => {
    seedEventType(30);

    const result = store.deleteEventType(1);

    expect(result.success).toBe(true);
    expect(store.getEventType(1)).toBeUndefined();
  });

  it("refuses to delete when a future booking exists", () => {
    seedBooking("2030-01-15T10:00:00.000Z", 30);

    const result = store.deleteEventType(1);

    expect(result.success).toBe(false);
    expect(result.reason).toContain("future");
    expect(store.getEventType(1)).toBeDefined();
  });

  it("deletes when only past bookings exist", () => {
    seedBooking("2020-01-15T10:00:00.000Z", 30);

    const result = store.deleteEventType(1);

    expect(result.success).toBe(true);
  });
});
