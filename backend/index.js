const mongoose = require('mongoose');
require('dotenv').config();
const app = require('./src/app');

const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/project_assessment';
mongoose.connect(mongoURI)
  .then(() => console.log('MongoDB connected'))
  .catch((error) => console.warn('MongoDB unavailable; demo/read-only endpoints remain usable:', error.message));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Assessment API listening on port ${PORT}`));
