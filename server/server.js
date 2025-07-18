const express = require("express");
const setupSocket = require("./socket");
const cors = require("cors");
const path = require("path");
const auth = require("./middleware/auth");
const authRoutes = require("./routes/auth");
const adminRoutes = require("./routes/adminRoutes");
const facilitatorRoutes = require("./routes/facilitatorRoutes");
const studentRoutes = require("./routes/student");
const courseRoutes = require("./routes/course");
const notificationRoutes = require("./routes/notification");
const assistantConvoRoutes = require("./routes/assistantconvo");
const eventsRoutes = require("./routes/events");
const challengesRoutes = require("./routes/challenges");
const uploadRoutes = require("./routes/upload");
const adminServices = require("./services/adminServices");
const badgeRoutes = require("./routes/badges");
const webpush = require("web-push");
const { clg } = require("./routes/basics");
const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerOptions = require("./swagger");
const dbConnection = require("./configs/database");
const {
  port,
  jwt_secret,
  vapid_public_key,
  vapid_private_key,
  isProduction,
} = require("./configs/config");
const analyticsRoutes = require("./routes/analytics");
const contentRoutes = require("./routes/content");
const { Event } = require("./models/Event");

// Configure the environment
require("dotenv").config();

// Create Express application
const app = express();
const PORT = port || 8080;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure Web Push
if (vapid_public_key && vapid_private_key) {
  webpush.setVapidDetails(
    "mailto:test@example.com",
    vapid_public_key,
    vapid_private_key
  );
  app.set("webpush", webpush);
  console.log("Web Push configured successfully");
} else {
  console.warn("Web Push not configured. Missing VAPID keys.");
}

// Initialize swagger-jsdoc -> returns validated swagger spec in json format
const swaggerDocs = swaggerJsdoc(swaggerOptions);

// Serve Swagger UI at a specific endpoint
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

async function startServer() {
  try {
    // Connect to MongoDB with retry logic
    const { mongoose, mongoClient } = await dbConnection.connect();

    // Make the database accessible to our routes
    app.locals.db = mongoClient.db();

    // Initialize API documentation
    await adminServices.initializeDefaultDocumentation(app.locals.db);

    // API Routes
    app.use("/api/auth", authRoutes);
    app.use("/api/admin", adminRoutes);
    app.use("/api/facilitator", facilitatorRoutes);
    app.use("/api/students", studentRoutes);
    app.use("/api/courses", courseRoutes);
    app.use("/api/notifications", notificationRoutes);
    app.use("/api/upload", uploadRoutes);
    app.use("/api/assistant", assistantConvoRoutes);
    app.use("/api/challenges", challengesRoutes);
    app.use("/api/events", eventsRoutes);
    app.use("/api/badges", badgeRoutes);
    app.use("/api/analytics", analyticsRoutes);
    app.use("/api/content", contentRoutes);

    // Serve static files in production
    if (isProduction) {
      app.use(express.static(path.join(__dirname, "../build")));
      app.get("*", (req, res) => {
        res.sendFile(path.resolve(__dirname, "../build", "index.html"));
      });
    }

    // Start the server
    const server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Swagger UI available at http://localhost:${PORT}/api-docs`);
    });

    // Start websocket server
    const webSocketServer = setupSocket(server, app.locals.db);

    // Schedule event status updates every 5 minutes
    setInterval(async () => {
      try {
        await Event.updateAllEventStatuses();
        console.log("Event statuses updated");
      } catch (error) {
        console.error("Error updating event statuses:", error);
      }
    }, 5 * 60 * 1000); // 5 minutes

    // Initial event status update
    Event.updateAllEventStatuses().catch((error) => {
      console.error("Error in initial event status update:", error);
    });
  } catch (error) {
    console.error("Error starting server:", error);
    process.exit(1);
  }
}

// Handle process termination
process.on("SIGINT", async () => {
  try {
    await dbConnection.close();
    console.log("Server shutdown complete");
    process.exit(0);
  } catch (error) {
    console.error("Error during graceful shutdown:", error);
    process.exit(1);
  }
});

// Start the server
startServer();
