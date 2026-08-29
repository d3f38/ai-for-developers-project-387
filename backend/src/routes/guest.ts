import { Router } from "express";
import * as store from "../store.js";

const router = Router();

router.get("/event-types", (_req, res) => {
  res.json(store.getAllEventTypes());
});

router.get("/slots", (req, res) => {
  const eventTypeId = Number(req.query.eventTypeId);
  const eventType = store.getEventType(eventTypeId);

  if (!eventType) {
    res.status(404).json({ code: 404, message: "Event type not found" });
    return;
  }

  const now = new Date();
  const dateFrom = req.query.dateFrom
    ? new Date(req.query.dateFrom as string)
    : now;
  const dateTo = req.query.dateTo
    ? new Date(req.query.dateTo as string)
    : new Date(dateFrom.getTime() + 14 * 24 * 60 * 60_000);

  dateFrom.setHours(0, 0, 0, 0);
  dateTo.setHours(23, 59, 59, 999);

  const slots: { startTime: string; endTime: string; available: boolean }[] = [];
  const slotMs = eventType.durationMinutes * 60_000;
  const cursor = new Date(dateFrom);

  while (cursor.getTime() + slotMs <= dateTo.getTime()) {
    const start = cursor.toISOString();
    const end = new Date(cursor.getTime() + slotMs).toISOString();
    const available = !store.isSlotOccupied(start, eventType.durationMinutes);
    slots.push({ startTime: start, endTime: end, available });
    cursor.setTime(cursor.getTime() + slotMs);
  }

  res.json(slots);
});

router.get("/bookings", (req, res) => {
  const email = req.query.email as string | undefined;
  if (!email) {
    res.status(400).json({ code: 400, message: "email query parameter is required" });
    return;
  }
  res.json(store.getBookingsByEmail(email));
});

router.post("/bookings", (req, res) => {
  const { eventTypeId, guestName, guestEmail, startTime } = req.body;

  if (!eventTypeId || !guestName || !startTime) {
    res.status(400).json({
      code: 400,
      message: "eventTypeId, guestName and startTime are required",
    });
    return;
  }

  const eventType = store.getEventType(eventTypeId);
  if (!eventType) {
    res.status(404).json({ code: 404, message: "Event type not found" });
    return;
  }

  const start = new Date(startTime);
  const now = new Date();
  const maxDate = new Date(now.getTime() + 14 * 24 * 60 * 60_000);
  if (start < now || start > maxDate) {
    res.status(400).json({
      code: 400,
      message: "Slot must be within the next 14 days",
    });
    return;
  }

  if (store.isSlotOccupied(startTime, eventType.durationMinutes)) {
    res.status(409).json({
      code: 409,
      message: "This slot is already occupied",
    });
    return;
  }

  const booking = store.createBooking({
    eventTypeId,
    guestName,
    guestEmail,
    startTime,
  });

  if (!booking) {
    res.status(409).json({
      code: 409,
      message: "This slot is already occupied",
    });
    return;
  }

  res.json(booking);
});

export default router;
