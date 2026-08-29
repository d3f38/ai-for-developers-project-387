import { Router } from "express";
import * as store from "../store.js";

const router = Router();

router.get("/event-types", (_req, res) => {
  res.json(store.getAllEventTypes());
});

router.post("/event-types", (req, res) => {
  const { name, description, durationMinutes } = req.body;
  if (!name || durationMinutes == null) {
    res.status(400).json({ code: 400, message: "name and durationMinutes are required" });
    return;
  }
  const et = store.createEventType({ name, description: description ?? "", durationMinutes });
  res.json(et);
});

router.get("/event-types/:id", (req, res) => {
  const id = Number(req.params.id);
  const et = store.getEventType(id);
  if (!et) {
    res.status(404).json({ code: 404, message: "Event type not found" });
    return;
  }
  res.json(et);
});

router.put("/event-types/:id", (req, res) => {
  const id = Number(req.params.id);
  const { name, description, durationMinutes } = req.body;
  if (!name || durationMinutes == null) {
    res.status(400).json({ code: 400, message: "name and durationMinutes are required" });
    return;
  }
  const updated = store.updateEventType(id, { name, description: description ?? "", durationMinutes });
  if (!updated) {
    res.status(404).json({ code: 404, message: "Event type not found" });
    return;
  }
  res.json(updated);
});

router.delete("/event-types/:id", (req, res) => {
  const id = Number(req.params.id);
  const result = store.deleteEventType(id);
  if (!result.success) {
    res.status(409).json({ code: 409, message: result.reason ?? "Cannot delete" });
    return;
  }
  res.status(204).send();
});

router.get("/bookings", (_req, res) => {
  res.json(store.getAllBookings());
});

export default router;
