require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

const analyzeRoutes = require("./routes/analyze");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "../frontend")));

app.use("/api/analyze", analyzeRoutes);

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

app.listen(PORT, () => {
  console.log(`Medical Bill Fighter running at http://localhost:${PORT}`);
});
