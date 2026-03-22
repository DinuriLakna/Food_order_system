const request = require("supertest");
const jwt = require("jsonwebtoken");
jest.mock("axios");
const axios = require("axios");
const orders = [];
let id = 1;
const MockOrder = class {
  constructor(data) { Object.assign(this, data); this._id = String(id++); this.status = data.status || "CREATED"; }
  async save() { orders.push(this); return this; }
  static async find({ userId } = {}) { return userId ? orders.filter(o => o.userId === userId) : orders; }
  static async findById(id) { return orders.find(o => o._id === id) || null; }
  static async findByIdAndUpdate(id, data, opts) { const o = orders.find(o => o._id === id); if (!o) return null; Object.assign(o, data); return o; }
};
jest.mock("mongoose", () => ({ connect: jest.fn().mockResolvedValue(true), Schema: class { constructor() { return {}; } }, model: jest.fn().mockReturnValue(MockOrder) }));
jest.mock("./swagger.json", () => ({}), { virtual: true });
jest.mock("swagger-ui-express", () => ({ serve: [], setup: jest.fn(() => (req, res, next) => next()) }));
process.env.MONGO_URI = "mongodb://localhost/test";
process.env.JWT_SECRET = "testsecret";
process.env.USER_SERVICE_URL = "http://user-service:4000";
process.env.MENU_SERVICE_URL = "http://menu-service:4001";
process.env.PAYMENT_SERVICE_URL = "http://payment-service:4003";
const app = require("./server");
const tok = () => jwt.sign({ id: "user123" }, "testsecret", { expiresIn: "1h" });

describe("Order Service", () => {
  beforeEach(() => jest.clearAllMocks());
  it("GET /health returns UP", async () => { const r = await request(app).get("/health"); expect(r.status).toBe(200); expect(r.body.status).toBe("UP"); });
  it("POST /orders 401 without token", async () => { const r = await request(app).post("/orders").send({ userId:"u1", itemId:"i1" }); expect(r.status).toBe(401); });
  it("POST /orders 400 missing itemId", async () => { const r = await request(app).post("/orders").set("Authorization",`Bearer ${tok()}`).send({ userId:"u1" }); expect(r.status).toBe(400); });
  it("POST /orders succeeds end to end", async () => {
    axios.get.mockResolvedValueOnce({ data: { _id:"user123", name:"Alice" } });
    axios.get.mockResolvedValueOnce({ data: { _id:"item1", name:"Pizza", price:10, available:true } });
    axios.post.mockResolvedValueOnce({ data: { _id:"pay1", status:"PAID" } });
    const r = await request(app).post("/orders").set("Authorization",`Bearer ${tok()}`).send({ userId:"user123", itemId:"item1", quantity:1 });
    expect(r.status).toBe(201);
    expect(r.body.order.status).toBe("CONFIRMED");
  });
  it("POST /orders 400 when item unavailable", async () => {
    axios.get.mockResolvedValueOnce({ data: { _id:"u1", name:"Alice" } });
    axios.get.mockResolvedValueOnce({ data: { _id:"i1", name:"Pizza", price:10, available:false } });
    const r = await request(app).post("/orders").set("Authorization",`Bearer ${tok()}`).send({ userId:"u1", itemId:"i1" });
    expect(r.status).toBe(400);
  });
  it("POST /orders 502 when payment fails", async () => {
    axios.get.mockResolvedValueOnce({ data: { _id:"u1", name:"Alice" } });
    axios.get.mockResolvedValueOnce({ data: { _id:"i1", name:"Pizza", price:10, available:true } });
    axios.post.mockRejectedValueOnce(new Error("payment down"));
    const r = await request(app).post("/orders").set("Authorization",`Bearer ${tok()}`).send({ userId:"u1", itemId:"i1" });
    expect(r.status).toBe(502);
  });
  it("GET /orders 401 without token", async () => { const r = await request(app).get("/orders"); expect(r.status).toBe(401); });
  it("GET /orders/:id 404 for unknown id", async () => { const r = await request(app).get("/orders/999").set("Authorization",`Bearer ${tok()}`); expect(r.status).toBe(404); });
});
