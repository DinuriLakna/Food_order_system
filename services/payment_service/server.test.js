const request = require("supertest");
const jwt = require("jsonwebtoken");
const payments = [];
let id = 1;
const MockPayment = class {
  constructor(data) { Object.assign(this, data); this._id = String(id++); }
  async save() { payments.push(this); return this; }
  static async find({ userId } = {}) { return userId ? payments.filter(p => p.userId === userId) : payments; }
  static async findById(id) { return payments.find(p => p._id === id) || null; }
  static async findOne({ orderId } = {}) { return payments.find(p => p.orderId === orderId) || null; }
};
jest.mock("mongoose", () => ({ connect: jest.fn().mockResolvedValue(true), Schema: class { constructor() { return {}; } }, model: jest.fn().mockReturnValue(MockPayment) }));
jest.mock("./swagger.json", () => ({}), { virtual: true });
jest.mock("swagger-ui-express", () => ({ serve: [], setup: jest.fn(() => (req, res, next) => next()) }));
jest.spyOn(Math, "random").mockReturnValue(0.99);
process.env.MONGO_URI = "mongodb://localhost/test";
process.env.JWT_SECRET = "testsecret";
const app = require("./server");
const tok = () => jwt.sign({ id: "u1" }, "testsecret", { expiresIn: "1h" });

describe("Payment Service", () => {
  it("GET /health returns UP", async () => { const r = await request(app).get("/health"); expect(r.status).toBe(200); expect(r.body.status).toBe("UP"); });
  it("POST /payments 401 without token", async () => { const r = await request(app).post("/payments").send({ orderId:"o1", amount:10, userId:"u1" }); expect(r.status).toBe(401); });
  it("POST /payments 400 on missing fields", async () => { const r = await request(app).post("/payments").set("Authorization",`Bearer ${tok()}`).send({ orderId:"o1" }); expect(r.status).toBe(400); });
  it("POST /payments 201 PAID", async () => { const r = await request(app).post("/payments").set("Authorization",`Bearer ${tok()}`).send({ orderId:"order-abc", amount:25.98, userId:"u1" }); expect(r.status).toBe(201); expect(r.body.status).toBe("PAID"); });
  it("GET /payments 401 without token", async () => { const r = await request(app).get("/payments"); expect(r.status).toBe(401); });
  it("GET /payments/:id 404 unknown", async () => { const r = await request(app).get("/payments/999").set("Authorization",`Bearer ${tok()}`); expect(r.status).toBe(404); });
  it("GET /payments/order/:orderId 404 unknown", async () => { const r = await request(app).get("/payments/order/unknown").set("Authorization",`Bearer ${tok()}`); expect(r.status).toBe(404); });
});
