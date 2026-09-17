const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const app = express();
app.use(cors());
app.use(express.json());

// --- SWAGGER SETUP ---
const swaggerOptions = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'E-Learning API',
      version: '1.0.0',
      description: 'Dokumentasi API untuk Proyek Big Data E-Learning',
    },
    servers: [{ url: 'http://localhost:5000' }],
  },
  apis: ['./routes/*.js'], // Swagger akan membaca komentar di folder routes
};
const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// --- MONGODB CONNECTION ---
// Catatan: Pastikan kamu punya file .env dengan variabel MONGO_URI
const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/project_assessment';
mongoose.connect(mongoURI)
  .then(() => console.log('✅ MongoDB Terhubung!'))
  .catch(err => console.log('❌ Error MongoDB:', err.message));

// --- BASIC ROUTE ---
app.get('/', (req, res) => {
  res.send('Server Backend Berjalan Mantap!');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server jalan di http://localhost:${PORT}`));
