require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const swaggerUi = require("swagger-ui-express");
const swaggerDoc = require("./swagger.json");

const app = express();
app.use(express.json());

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Payment DB Connected"))
  .catch((err) => { console.error("❌ DB Error:", err.message); process.exit(1); });

const paymentSchema = new mongoose.Schema(
  {
    orderId: { type: String, required: true },
    userId:  { type: String, required: true },
    amount:  { type: Number, required: true, min: 0 },
    status:  { type: String, enum: ["PENDING","PAID","FAILED","REFUNDED"], default: "PENDING" },
    method:  { type: String, enum: ["CARD","WALLET","CASH"], default: "CARD" },
  },
  { timestamps: true }
);
const Payment = mongoose.model("Payment", paymentSchema);

const authMiddleware = (req, res, next) => {
  const h = req.headers.authorization;
  if (!h || !h.startsWith("Bearer "))
    return res.status(401).json({ error: "Unauthorized: No token provided" });
  try { req.user = jwt.verify(h.split(" ")[1], process.env.JWT_SECRET); next(); }
  catch { return res.status(403).json({ error: "Forbidden: Invalid or expired token" }); }
};

app.get("/health", (req, res) =>
  res.json({ status: "UP", service: "payment-service", timestamp: new Date() })
);

app.post("/payments", authMiddleware, async (req, res) => {
  try {
    const { orderId, amount, userId, method = "CARD" } = req.body;
    if (!orderId || amount === undefined || !userId)
      return res.status(400).json({ error: "orderId, amount and userId are required" });
    const isSuccess = Math.random() > 0.05; // 95% success rate
    const payment = await new Payment({ orderId, userId, amount, method, status: isSuccess ? "PAID" : "FAILED" }).save();
    if (!isSuccess) return res.status(402).json({ error: "Payment declined", payment });
    res.status(201).json(payment);
  } catch (err) { res.status(500).json({ error: "Internal server error" }); }
});

app.get("/payments/order/:orderId", authMiddleware, async (req, res) => {
  try {
    const p = await Payment.findOne({ orderId: req.params.orderId });
    if (!p) return res.status(404).json({ error: "Payment not found" });
    res.json(p);
  } catch (err) { res.status(500).json({ error: "Internal server error" }); }
});

app.get("/payments/:id", authMiddleware, async (req, res) => {
  try {
    const p = await Payment.findById(req.params.id);
    if (!p) return res.status(404).json({ error: "Payment not found" });
    res.json(p);
  } catch (err) { res.status(500).json({ error: "Internal server error" }); }
});

app.get("/payments", authMiddleware, async (req, res) => {
  try { res.json(await Payment.find({ userId: req.user.id })); }
  catch (err) { res.status(500).json({ error: "Internal server error" }); }
});

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDoc));

const PORT = process.env.PORT || 4003;
app.listen(PORT, "0.0.0.0", () => console.log(`🚀 Payment Service running on port ${PORT}`));
module.exports = app;
