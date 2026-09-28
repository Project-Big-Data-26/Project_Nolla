const express = require("express");
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const swaggerJsDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const authRoutes = require("./routes/authRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const personalizationRoutes = require("./routes/personalizationRoutes");
const pretestRoutes = require("./routes/pretestRoutes");
const quizRoutes = require("./routes/quizRoutes");

const app = express();

app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use("/api/personalization", personalizationRoutes);
// --- AUTH ROUTES ---
app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/pretest", pretestRoutes);
app.use("/api/quiz", quizRoutes);

// --- SWAGGER SETUP ---
const swaggerOptions = {
  swaggerDefinition: {
    openapi: "3.0.0",
    info: {
      title: "E-Learning API",
      version: "1.0.0",
      description: "Dokumentasi API untuk Proyek Big Data E-Learning",
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    servers: [
      {
        url: "http://localhost:5000",
      },
    ],
  },
  apis: ["./routes/*.js"],
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// --- MONGODB CONNECTION ---
const mongoURI =
  process.env.MONGO_URI || "mongodb://localhost:27017/project_assessment";

mongoose
  .connect(mongoURI)
  .then(() => console.log("✅ MongoDB Terhubung!"))
  .catch((err) => console.log("❌ Error MongoDB:", err.message));

// --- BASIC ROUTE ---
app.get("/", (req, res) => {
  res.send("Server Backend Berjalan Mantap!");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server jalan di http://localhost:${PORT}`);
});
