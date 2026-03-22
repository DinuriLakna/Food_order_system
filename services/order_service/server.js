require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const axios = require("axios");
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
  .then(() => console.log("✅ Order DB Connected"))
  .catch((err) => { console.error("❌ DB Error:", err.message); process.exit(1); });

const orderSchema = new mongoose.Schema(
  {
    userId:     { type: String, required: true },
    itemId:     { type: String, required: true },
    quantity:   { type: Number, required: true, min: 1, default: 1 },
    totalPrice: { type: Number },
    status:     { type: String, enum: ["CREATED","CONFIRMED","CANCELLED"], default: "CREATED" },
    paymentId:  { type: String },
  },
  { timestamps: true }
);
const Order = mongoose.model("Order", orderSchema);

const authMiddleware = (req, res, next) => {
  const h = req.headers.authorization;
  if (!h || !h.startsWith("Bearer "))
    return res.status(401).json({ error: "Unauthorized: No token provided" });
  try { req.user = jwt.verify(h.split(" ")[1], process.env.JWT_SECRET); next(); }
  catch { return res.status(403).json({ error: "Forbidden: Invalid or expired token" }); }
};

app.get("/health", (req, res) =>
  res.json({ status: "UP", service: "order-service", timestamp: new Date() })
);

// Create Order — orchestrates: user-service → menu-service → payment-service
app.post("/orders", authMiddleware, async (req, res) => {
  try {
    const { userId, itemId, quantity = 1 } = req.body;
    if (!userId || !itemId)
      return res.status(400).json({ error: "userId and itemId are required" });

    const token = req.headers.authorization.split(" ")[1];
    const headers = { Authorization: `Bearer ${token}` };

    // Step 1: Validate user
    let user;
    try {
      const { data } = await axios.get(`${process.env.USER_SERVICE_URL}/users/${userId}`, { headers, timeout: 5000 });
      user = data;
    } catch {
      return res.status(404).json({ error: "User not found or user-service unavailable" });
    }

    // Step 2: Validate menu item and get price
    let menuItem;
    try {
      const { data } = await axios.get(`${process.env.MENU_SERVICE_URL}/menu/${itemId}`, { headers, timeout: 5000 });
      menuItem = data;
    } catch {
      return res.status(404).json({ error: "Menu item not found or menu-service unavailable" });
    }

    if (!menuItem.available)
      return res.status(400).json({ error: "Menu item is currently unavailable" });

    const totalPrice = menuItem.price * quantity;

    // Step 3: Save order
    const order = await new Order({ userId, itemId, quantity, totalPrice, status: "CREATED" }).save();

    // Step 4: Process payment
    let payment;
    try {
      const { data } = await axios.post(`${process.env.PAYMENT_SERVICE_URL}/payments`,
        { orderId: order._id, amount: totalPrice, userId },
        { headers, timeout: 5000 });
      payment = data;
    } catch {
      await Order.findByIdAndUpdate(order._id, { status: "CANCELLED" });
      return res.status(502).json({ error: "Payment failed. Order cancelled.", orderId: order._id });
    }

    // Step 5: Confirm order
    const confirmed = await Order.findByIdAndUpdate(
      order._id, { status: "CONFIRMED", paymentId: payment._id }, { new: true }
    );

    res.status(201).json({
      order: confirmed,
      user: { id: user._id, name: user.name },
      menuItem: { name: menuItem.name, price: menuItem.price },
      payment,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/orders", authMiddleware, async (req, res) => {
  try { res.json(await Order.find({ userId: req.user.id })); }
  catch (err) { res.status(500).json({ error: "Internal server error" }); }
});

app.get("/orders/:id", authMiddleware, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: "Order not found" });
    res.json(order);
  } catch (err) { res.status(500).json({ error: "Internal server error" }); }
});

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDoc));

const PORT = process.env.PORT || 4002;
app.listen(PORT, "0.0.0.0", () => console.log(`🚀 Order Service running on port ${PORT}`));
module.exports = app;
