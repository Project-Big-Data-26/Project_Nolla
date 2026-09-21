const mongoose = require("mongoose");
const app = require("./app");

const mongoURI =
  process.env.MONGO_URI || "mongodb://localhost:27017/project_assessment";

mongoose
  .connect(mongoURI)
  .then(() => console.log("✅ MongoDB Terhubung!"))
  .catch((err) => console.log("❌ Error MongoDB:", err.message));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server jalan di http://localhost:${PORT}`);
});