const express = require("express");
const cors = require("cors");
require("dotenv").config();

const swaggerJsDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const authRoutes = require("./routes/authRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);

const swaggerOptions = {
    swaggerDefinition: {
        openapi: "3.0.0",
        info: {
            title: "E-Learning API",
            version: "1.0.0",
            description: "Dokumentasi API untuk Proyek Big Data E-Learning",
        },
        servers: [{ url: "http://localhost:5000" }],
    },
    apis: ["./routes/*.js"],
};
const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

app.get("/", (req, res) => {
    res.send("Server Backend Berjalan Mantap!");
});

module.exports = app;