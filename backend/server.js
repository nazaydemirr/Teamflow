const express = require("express");
const cors = require("cors");
const path = require("path");
const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");
require("dotenv").config();

const authRoutes = require("./routes/auth_routes");
const profileRoutes = require("./routes/profile_routes");
const opportunityRoutes = require("./routes/opportunity_routes");
const teamRoutes = require("./routes/team_routes");
const applicationRoutes = require("./routes/application_routes");
const chatRoutes = require("./routes/chat_routes");
const notificationRoutes = require("./routes/notification_routes");
const progressRoutes = require("./routes/progress_routes");
const matchmakingRoutes = require("./routes/matchmaking_routes");
const { sendError } = require("./utils/response");

const app = express();

app.use(
  cors({
    origin: "*",
    allowedHeaders: ["authorization", "content-type"],
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  })
);
app.use(express.json());

const port = Number(process.env.PORT || 8080);

const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: { title: "TeamFlow API", version: "1.0.0" },
    servers: [{ url: `http://localhost:${port}` }],
    components: {
      securitySchemes: {
        bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
      },
    },
  },
  apis: ["./routes/*.js"],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get("/health", (req, res) => res.json({ ok: true }));

// Mount routes
app.use("/auth", authRoutes);
app.use("/me", profileRoutes);
app.use("/opportunities", opportunityRoutes);
app.use("/teams", teamRoutes);
app.use("/applications", applicationRoutes);
app.use("/chats", chatRoutes);
app.use("/notifications", notificationRoutes);
app.use("/progress", progressRoutes);
app.use("/matchmaking", matchmakingRoutes);

app.use((req, res) => {
  sendError(res, 404, "NOT_FOUND", "Route not found", { method: req.method, path: req.path });
});

app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});

// Trigger nodemon restart
