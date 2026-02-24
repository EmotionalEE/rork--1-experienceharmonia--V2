import { Hono } from "hono";
import { handle } from "hono/netlify";
import { trpcServer } from "@hono/trpc-server";
import { cors } from "hono/cors";
import { appRouter } from "../../backend/trpc/app-router";
import { createContext } from "../../backend/trpc/create-context";
import { userStore } from "../../backend/lib/user-store";

userStore
  .initialize()
  .then(() => {
    console.log("[Netlify Function] UserStore initialized");
  })
  .catch((error) => {
    console.error("[Netlify Function] Failed to initialize UserStore:", error);
  });

const app = new Hono();

app.use("*", cors());

const trpcMiddleware = trpcServer({
  endpoint: "/api/trpc",
  router: appRouter,
  createContext,
});

app.use("/api/trpc/*", trpcMiddleware);
app.use("/trpc/*", trpcMiddleware);
app.use("/.netlify/functions/api/trpc/*", trpcMiddleware);

app.get("/api", (c) => {
  return c.json({ status: "ok", message: "API function is running" });
});

export const handler = handle(app);
