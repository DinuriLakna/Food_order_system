const request = require("supertest");

jest.mock("mongoose", () => {
  const users = [];
  let id = 1;
  const MockUser = class {
    constructor(data) { Object.assign(this, data); this._id = String(id++); }
    async save() { users.push(this); return this; }
    static async findOne({ email } = {}) { return users.find(u => u.email === email) || null; }
    static async findById(id) { const u = users.find(u => u._id === id); if (!u) return null; return { ...u, select: () => u }; }
    static async find() { return users.map(u => ({ ...u, select: () => u })); }
  };
  return { connect: jest.fn().mockResolvedValue(true), Schema: class { constructor() { return {}; } }, model: jest.fn().mockReturnValue(MockUser) };
});

jest.mock("bcryptjs", () => ({
  hash: jest.fn().mockResolvedValue("hashed_pw"),
  compare: jest.fn().mockImplementation((plain, _) => Promise.resolve(plain === "Secret123!"))
}));
jest.mock("./swagger.json", () => ({}), { virtual: true });
jest.mock("swagger-ui-express", () => ({ serve: [], setup: jest.fn(() => (req, res, next) => next()) }));

process.env.MONGO_URI  = "mongodb://localhost/test";
process.env.JWT_SECRET = "testsecret";

const app = require("./server");

describe("User Service", () => {
  it("GET /health returns UP", async () => {
    const r = await request(app).get("/health");
    expect(r.status).toBe(200);
    expect(r.body.status).toBe("UP");
  });
  it("POST /register creates user", async () => {
    const r = await request(app).post("/register").send({ name:"Alice", email:"alice@test.com", password:"Secret123!" });
    expect(r.status).toBe(201);
    expect(r.body.email).toBe("alice@test.com");
  });
  it("POST /register 400 on missing fields", async () => {
    const r = await request(app).post("/register").send({ email:"a@b.com" });
    expect(r.status).toBe(400);
  });
  it("POST /login returns token", async () => {
    await request(app).post("/register").send({ name:"Bob", email:"bob@test.com", password:"Secret123!" });
    const r = await request(app).post("/login").send({ email:"bob@test.com", password:"Secret123!" });
    expect(r.status).toBe(200);
    expect(r.body).toHaveProperty("token");
  });
  it("POST /login 401 on wrong password", async () => {
    const r = await request(app).post("/login").send({ email:"nobody@test.com", password:"wrong" });
    expect(r.status).toBe(401);
  });
  it("GET /users 401 without token", async () => {
    const r = await request(app).get("/users");
    expect(r.status).toBe(401);
  });
  it("GET /users 403 with bad token", async () => {
    const r = await request(app).get("/users").set("Authorization","Bearer bad.token");
    expect(r.status).toBe(403);
  });
});
