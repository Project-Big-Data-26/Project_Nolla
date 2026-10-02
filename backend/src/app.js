const express = require('express');
const cors = require('cors');
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const questionRoutes = require('./routes/questions');
const aiRoutes = require('./routes/ai');
const verificationRoutes = require('./routes/verification');
const psychometricRoutes = require('./routes/psychometrics');
const responseRoutes = require('./routes/responses');

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));

const swaggerDocs = swaggerJsDoc({
  definition: {
    openapi: '3.0.3',
    info: { title: 'Nalar Assessment API', version: '1.0.0', description: 'Assessment, expertise verification, AI orchestration, and psychometric contracts.' },
  },
  apis: ['./src/routes/*.js'],
});
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));
app.get('/api/v1/health', (_req, res) => res.json({ status: 'ok', service: 'assessment-backend' }));
app.use('/api/v1/questions', questionRoutes);
app.use('/api/v1/ai', aiRoutes);
app.use('/api/v1/verifications', verificationRoutes);
app.use('/api/v1/psychometrics', psychometricRoutes);
app.use('/api/v1/responses', responseRoutes);
app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(error.status || 500).json({ error: error.code || 'internal_error', message: error.message || 'Internal server error' });
});

module.exports = app;
