import express from "express";
import { createServer } from "http";
import cors from "cors";
import { registerRoutes } from "../server/routes";

const app = express();
app.set("trust proxy", 1);

app.use(cors({
  origin: true,
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const server = createServer(app);
let routesRegistered = false;
let registerPromise: Promise<void> | null = null;

async function ensureRoutesRegistered() {
  if (routesRegistered) return;
  
  if (!registerPromise) {
    registerPromise = (async () => {
      try {
        await registerRoutes(server, app);
        routesRegistered = true;
      } catch (error) {
        registerPromise = null;
        throw error;
      }
    })();
  }
  
  await registerPromise;
}

export default async function handler(req: any, res: any) {
  try {
    await ensureRoutesRegistered();
    return app(req, res);
  } catch (error: any) {
    console.error("Serverless function error:", error);
    res.status(500).json({ 
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
}
