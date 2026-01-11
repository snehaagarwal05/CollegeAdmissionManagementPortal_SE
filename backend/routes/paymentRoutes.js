const express = require("express");
const router = express.Router();
const generateReceipt = require("../utils/receiptGenerator");

router.post("/pay", (req, res) => {
  console.log("✅ /api/payment/pay HIT");
  console.log("Body received:", req.body);

  const receiptData = {
    receiptNo: "REC" + Math.floor(Math.random() * 100000),
    studentName: "Sneha Das",
    applicationId: req.body.applicationId || "APP2026",
    course: "B.Tech Computer Science",
    amount: req.body.amount || 100,
  };

  const receiptFile = generateReceipt(receiptData);

  res.json({
    success: true,
    receiptFile,
  });
});

module.exports = router;
