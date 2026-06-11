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

module.exports = app;