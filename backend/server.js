const express = require("express");
const cors = require("cors");
const path = require("path");
const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
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

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.set("trust proxy", 1); // Reverse proxy arkasındaysa gerçek IP'yi almak için

app.use(
  cors({
    origin: "*", // Canlı ortamda kendi domaininizle değiştirin
    allowedHeaders: ["authorization", "content-type"],
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS", "PUT"],
  })
);

app.get("/health", (req, res) => res.json({ ok: true }));
app.get("/", (req, res) => res.json({ message: "TeamFlow API is running" }));

// Genel API Rate Limiting (Brute force koruması)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 dakika
  max: 100, // IP başına 15 dakikada en fazla 100 istek
  message: { message: "Çok fazla istek gönderdiniz. Lütfen daha sonra tekrar deneyin." }
});
app.use(apiLimiter);
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

app.listen(port, "0.0.0.0", () => {
  console.log(`API listening on http://0.0.0.0:${port}`);
});

// Trigger nodemon restart
