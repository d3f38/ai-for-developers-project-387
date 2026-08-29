import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import cors from "cors";
import ownerRoutes from "./routes/owner.js";
import guestRoutes from "./routes/guest.js";
import { seedDemoData } from "./store.js";

const app = express();
const PORT = Number(process.env.PORT ?? 3000);
const HOST = process.env.HOST ?? "0.0.0.0";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
// В образе собранный фронтенд лежит рядом с dist/ — в /app/public.
// STATIC_DIR может быть относительным, поэтому приводим к абсолютному:
// res.sendFile ниже требует абсолютный путь.
const staticDir = path.resolve(
  process.env.STATIC_DIR ?? path.resolve(currentDir, "../public"),
);

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api", ownerRoutes);
app.use("/api/public", guestRoutes);

app.use(express.static(staticDir));

// SPA fallback: любой не-API маршрут отдаёт index.html для react-router.
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api")) return next();
  res.sendFile(path.join(staticDir, "index.html"), (err) => {
    if (err) next();
  });
});

if (process.env.SEED_DEMO_DATA !== "false") {
  seedDemoData();
}

app.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
});
