const express = require("express");
const multer = require("multer");
const pdfParse = require("pdf-parse");
const { analyzeBill, analyzeInsuranceDenial } = require("../services/claude");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.post("/bill", upload.single("file"), async (req, res) => {
  try {
    let billText = "";

    if (req.file) {
      if (req.file.mimetype === "application/pdf") {
        const data = await pdfParse(req.file.buffer);
        billText = data.text;
      } else {
        billText = req.file.buffer.toString("utf-8");
      }
    } else if (req.body.text) {
      billText = req.body.text;
    } else {
      return res.status(400).json({ error: "Please provide a bill file or text" });
    }

    if (billText.trim().length < 20) {
      return res.status(400).json({ error: "Bill content is too short to analyze" });
    }

    const result = await analyzeBill(billText);
    res.json({ success: true, data: result });
  } catch (err) {
    console.error("Bill analysis error:", err.message);
    res.status(500).json({ error: "Analysis failed. Please try again." });
  }
});

router.post("/denial", upload.single("file"), async (req, res) => {
  try {
    let denialText = "";

    if (req.file) {
      if (req.file.mimetype === "application/pdf") {
        const data = await pdfParse(req.file.buffer);
        denialText = data.text;
      } else {
        denialText = req.file.buffer.toString("utf-8");
      }
    } else if (req.body.text) {
      denialText = req.body.text;
    } else {
      return res.status(400).json({ error: "Please provide a denial letter file or text" });
    }

    const result = await analyzeInsuranceDenial(denialText);
    res.json({ success: true, data: result });
  } catch (err) {
    console.error("Denial analysis error:", err.message);
    res.status(500).json({ error: "Analysis failed. Please try again." });
  }
});

module.exports = router;
