import express, { json } from "express";
import cors from "cors";

import workRoutes from "./routes/work.routes.js";

import visitRoutes from "./routes/visit.routes.js";
import uploadRoutes from "./routes/upload.routes.js";

import clientRoutes from "./routes/clientRoutes.js";

import plantRoutes from "./routes/plantRoutes.js";

import technicianRoutes from "./routes/technician.routes.js";
const app = express();

app.use(cors());

app.use(json());

app.use("/api/work", workRoutes);
app.use("/api/visits", visitRoutes);
app.use(
  "/api/uploads",
  uploadRoutes
);

app.use(
  "/api/clients",
  clientRoutes
);

app.use(
  "/api/plants",
  plantRoutes
);

app.use("/api/technicians", technicianRoutes);

export default app;