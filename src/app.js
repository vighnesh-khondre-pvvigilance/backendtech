const express = require("express");
const cors = require("cors");

const workRoutes =
  require("./routes/work.routes");

const visitRoutes = require("./routes/visit.routes");
const uploadRoutes = require(
  "./routes/upload.routes"
);

const clientRoutes =
  require("./routes/clientRoutes");

const plantRoutes =
  require("./routes/plantRoutes");

const technicianRoutes = require("./routes/technician.routes");

const authRoutes = require("./routes/auth.routes");
const app = express();

app.use(cors());

app.use(express.json());

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

app.use("/auth", authRoutes);

module.exports = app;






// import express from "express";
// import cors from "cors";

// import authRoutes from "./routes/auth.routes.js";
// import technicianRoutes from "./routes/technician.routes.js";
// import workRoutes from "./routes/work.routes.js";
// import visitRoutes from "./routes/visit.routes.js";
// import uploadRoutes from "./routes/upload.routes.js";

// const app = express();

// app.use(cors());
// app.use(express.json());

// app.use("/auth", authRoutes);
// app.use("/technician", technicianRoutes);
// app.use("/work", workRoutes);
// app.use("/visit", visitRoutes);
// app.use("/upload", uploadRoutes);

// export default app;