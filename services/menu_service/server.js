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
  .then(() => console.log(" Menu DB Connected"))
  .catch((err) => { console.error(" DB Error:", err.message); process.exit(1); });

const itemSchema = new mongoose.Schema(
  {
    name:        { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: "" },
    price:       { type: Number, required: true, min: 0 },
    category:    { type: String, enum: ["starter","main","dessert","drink"], default: "main" },
    available:   { type: Boolean, default: true },
  },
  { timestamps: true }
);
const Item = mongoose.model("Item", itemSchema);

const authMiddleware = (req, res, next) => {
  const h = req.headers.authorization;
  if (!h || !h.startsWith("Bearer "))
    return res.status(401).json({ error: "Unauthorized: No token provided" });
  try { req.user = jwt.verify(h.split(" ")[1], process.env.JWT_SECRET); next(); }
  catch { return res.status(403).json({ error: "Forbidden: Invalid or expired token" }); }
};

app.get("/health", (req, res) =>
  res.json({ status: "UP", service: "menu-service", timestamp: new Date() })
);

app.get("/menu", async (req, res) => {
  try { res.json(await Item.find({ available: true })); }
  catch (err) { res.status(500).json({ error: "Internal server error" }); }
});

app.get("/menu/:id", async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ error: "Menu item not found" });
    res.json(item);
  } catch (err) { res.status(500).json({ error: "Internal server error" }); }
});

app.post("/menu", authMiddleware, async (req, res) => {
  try {
    const { name, price, description, category } = req.body;
    if (!name || price === undefined)
      return res.status(400).json({ error: "name and price are required" });
    const item = await new Item({ name, price, description, category }).save();
    res.status(201).json(item);
  } catch (err) { res.status(500).json({ error: "Internal server error" }); }
});

app.put("/menu/:id", authMiddleware, async (req, res) => {
  try {
    const item = await Item.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!item) return res.status(404).json({ error: "Menu item not found" });
    res.json(item);
  } catch (err) { res.status(500).json({ error: "Internal server error" }); }
});

app.delete("/menu/:id", authMiddleware, async (req, res) => {
  try {
    const item = await Item.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ error: "Menu item not found" });
    res.json({ message: "Menu item deleted" });
  } catch (err) { res.status(500).json({ error: "Internal server error" }); }
});

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDoc));

const PORT = process.env.PORT || 4001;
app.listen(PORT, "0.0.0.0", () => console.log(` Menu Service running on port ${PORT}`));
module.exports = app;
