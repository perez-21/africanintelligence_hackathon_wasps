const express = require("express");
const cors = require("cors");
const { MongoClient } = require("mongodb");
const path = require("path");
const auth = require("./middleware/auth");
const activityRoutes = require("./routes/activity");
const enrollmentRoutes = require("./routes/enrollment");
const authRoutes = require("./routes/auth");
const adminRoutes = require("./routes/adminRoutes");
const facilitatorRoutes = require("./routes/facilitatorRoutes");
const studentRoutes = require("./routes/learner");
const courseRoutes = require("./routes/course");
const forumRoutes = require("./routes/forum");
const notificationRoutes = require("./routes/notification");
const uploadRoutes = require("./routes/upload");
const leaderboardRoutes = require("./routes/leaderboard");
const adminServices = require("./services/adminServices");
const webpush = require("web-push");
const { clg } = require("./routes/basics");
const { setupSocket }  = require("./socket");
const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerOptions = require("./swagger");

// Configure the environment
require("dotenv").config();

// Create Express application
const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// Configure Web Push
if (process.env.PUBLIC_VAPID_KEY && process.env.PRIVATE_VAPID_KEY) {
  webpush.setVapidDetails(
    "mailto:test@example.com",
    process.env.PUBLIC_VAPID_KEY,
    process.env.PRIVATE_VAPID_KEY
  );
  app.set("webpush", webpush);
  console.log("Web Push configured successfully");
} else {
  console.warn("Web Push not configured. Missing VAPID keys.");
}

// Initialize swagger-jsdoc -> returns validated swagger spec in json format
const specs = swaggerJsdoc(swaggerOptions);

// Serve Swagger UI at a specific endpoint
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(specs, { explorer: true })
);

// Connect to MongoDB
const mongoURI = process.env.MONGODB_URI || "mongodb://localhost:27017/lms";

const client = new MongoClient(mongoURI);

async function startServer() {
  try {
    await client.connect();
    console.log("Connected to MongoDB");

    // Make the database accessible to our routes
    app.locals.db = client.db();

    // Initialize API documentation
    await adminServices.initializeDefaultDocumentation(app.locals.db);

    // API Routes
    app.use("/api/auth", authRoutes);
    app.use("/api/admin", adminRoutes);
    app.use("/api/facilitator", facilitatorRoutes);
    app.use("/api/learner", studentRoutes);
    app.use("/api/courses", courseRoutes);
    app.use("/api/forum", forumRoutes);
    app.use("/api/notifications", notificationRoutes);
    app.use("/api/upload", uploadRoutes);
    app.use("/api/activities", activityRoutes);
    app.use("/api/enrollments", enrollmentRoutes);
    app.use("/api/leaderboard", leaderboardRoutes);

    // Serve static files in production
    if (process.env.NODE_ENV === "production") {
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

    // setup socket
    setupSocket(server, app.locals.db);
  } catch (error) {
    console.error("Error starting server:", error);
    process.exit(1);
  }
}

// Handle process termination
process.on("SIGINT", async () => {
  try {
    await client.close();
    console.log("MongoDB connection closed");
    process.exit(0);
  } catch (error) {
    console.error("Error during graceful shutdown:", error);
    process.exit(1);
  }
});

// Start the server
startServer().catch(console.error);
