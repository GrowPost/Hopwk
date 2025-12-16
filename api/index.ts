import express from "express";
import { createServer } from "http";
import { registerRoutes } from "../server/routes";

const app = express();
const server = createServer(app);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

let routesRegistered = false;

export default async function handler(req: any, res: any) {
  if (!routesRegistered) {
    await registerRoutes(server, app);
    routesRegistered = true;
  }
  
  return app(req, res);
}
