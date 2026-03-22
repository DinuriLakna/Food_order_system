const request = require("supertest");
const jwt = require("jsonwebtoken");

const items = [];
let id = 1;
const MockItem = class {
  constructor(data) { Object.assign(this, data); this._id = String(id++); this.available = data.available !== undefined ? data.available : true; }
  async save() { items.push(this); return this; }
  static async find({ available } = {}) { return available !== undefined ? items.filter(i => i.available === available) : items; }
  static async findById(id) { return items.find(i => i._id === id) || null; }
  static async findByIdAndUpdate(id, data) { const i = items.find(i => i._id === id); if (!i) return null; Object.assign(i, data); return i; }
  static async findByIdAndDelete(id) { const idx = items.findIndex(i => i._id === id); if (idx === -1) return null; return items.splice(idx,1)[0]; }
};
jest.mock("mongoose", () => ({ connect: jest.fn().mockResolvedValue(true), Schema: class { constructor() { return {}; } }, model: jest.fn().mockReturnValue(MockItem) }));
jest.mock("./swagger.json", () => ({}), { virtual: true });
jest.mock("swagger-ui-express", () => ({ serve: [], setup: jest.fn(() => (req, res, next) => next()) }));
process.env.MONGO_URI = "mongodb://localhost/test";
process.env.JWT_SECRET = "testsecret";
const app = require("./server");
const tok = () => jwt.sign({ id: "u1" }, "testsecret", { expiresIn: "1h" });

describe("Menu Service", () => {
  it("GET /health returns UP", async () => { const r = await request(app).get("/health"); expect(r.status).toBe(200); expect(r.body.status).toBe("UP"); });
  it("GET /menu returns array", async () => { const r = await request(app).get("/menu"); expect(r.status).toBe(200); expect(Array.isArray(r.body)).toBe(true); });
  it("POST /menu 401 without token", async () => { const r = await request(app).post("/menu").send({ name:"Pizza", price:10 }); expect(r.status).toBe(401); });
  it("POST /menu creates item with token", async () => { const r = await request(app).post("/menu").set("Authorization",`Bearer ${tok()}`).send({ name:"Pizza", price:12.99, category:"main" }); expect(r.status).toBe(201); expect(r.body.name).toBe("Pizza"); });
  it("POST /menu 400 missing price", async () => { const r = await request(app).post("/menu").set("Authorization",`Bearer ${tok()}`).send({ name:"Pizza" }); expect(r.status).toBe(400); });
  it("GET /menu/:id 404 for unknown id", async () => { const r = await request(app).get("/menu/999"); expect(r.status).toBe(404); });
  it("DELETE /menu/:id 401 without token", async () => { const r = await request(app).delete("/menu/1"); expect(r.status).toBe(401); });
});
