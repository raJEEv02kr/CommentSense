const express = require("express");
const cors = require("cors");

const analyzeComment = require("./api");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("CommentSense API is running");
});

app.get("/v1/health", (req, res) => {
  res.json({
    status: "ok",
    service: "CommentSense API",
    timestamp: new Date().toISOString()
  });
});

app.post("/v1/analyze", (req, res) => {

  const {
    text,
    platform = "unknown",
    content_type = "comment",
    language = "en"
  } = req.body;

  if (!text || typeof text !== "string") {
    return res.status(400).json({
      error: "Invalid input",
      message: "Text must be a non-empty string"
    });
  }

  try {

    const result = analyzeComment({
      text,
      platform,
      content_type,
      language
    });

    res.json(result);

  } catch (err) {
    res.status(500).json({
      error: "Analysis failed",
      message: err.message
    });
  }

});

app.use((req, res) => {
  res.status(404).json({
    error: "Endpoint not found"
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`CommentSense API running on port ${PORT}`);
});