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
const profileRoutes = require("./routes/profileRoutes");
const quizRoutes = require("./routes/quizRoutes");
const learningResultsRoutes = require("./routes/learningResultsRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const { getQuestionImage } = require("./controllers/imageController");
const { requestContext } = require("./middleware/requestContext");
const { supportsTransactions } = require("./utils/transaction");

const app = express();

app.use(cors({ exposedHeaders: ["X-Request-Id"] }));
app.use(express.json());
app.use(cookieParser());
app.use(requestContext);
app.get("/image/:token", getQuestionImage);
app.use("/api/personalization", personalizationRoutes);
// --- AUTH ROUTES ---
app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/pretest", pretestRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/quiz", quizRoutes);
app.use("/api/learning-results", learningResultsRoutes);
app.use("/api/analytics", analyticsRoutes);

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
  process.env.MONGO_URI ||
  "mongodb://localhost:27017/project_assessment?directConnection=true";

mongoose
  .connect(mongoURI)
  .then(async () => {
    console.log("✅ MongoDB Terhubung!");
    if (!(await supportsTransactions())) {
      console.warn(
        "⚠️ MongoDB standalone: submit kuis/pretest berjalan tanpa transaksi. Gunakan replica set untuk konsistensi penuh.",
      );
    }
  })
  .catch((err) => console.log("❌ Error MongoDB:", err.message));

// --- BASIC ROUTE ---
app.get("/", (req, res) => {
  res.send("Server Backend Berjalan Mantap!");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server jalan di http://localhost:${PORT}`);
});
