const request = require("supertest");
const app = require("../app");
const Product = require("../models/Product");
const User = require("../models/User");

describe("Product Endpoints", () => {
  let token;

  beforeEach(async () => {
    await Product.deleteMany({});
    await User.deleteMany({});

    // Create user and get token
    const userRes = await request(app).post("/api/users").send({
      name: "Test User",
      email: "test@example.com",
      password: "password123",
    });
    token = userRes.body.token;
  });

  it("should create a new product", async () => {
    const res = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Test Product",
        price: 100,
        currentStock: 10,
        taxRate: 0.18, // Added required field
      });

    if (res.statusCode !== 201) console.log(res.body);
    expect(res.statusCode).toEqual(201);
    expect(res.body.data.name).toEqual("Test Product");
    expect(res.body.data.currentStock).toEqual(10);
  });

  it("should get all products", async () => {
    await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Product 1", price: 50, taxRate: 0.18 });

    await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Product 2", price: 150, taxRate: 0.18 });

    const res = await request(app)
      .get("/api/products")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body)).toBeTruthy();
    expect(res.body.length).toBeGreaterThanOrEqual(2);
  });

  it("should update a product", async () => {
    const createRes = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Old Name", price: 50, taxRate: 0.18 });

    const productId = createRes.body.data._id;

    const res = await request(app)
      .put(`/api/products/${productId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "New Name",
        price: 75,
      });

    expect(res.statusCode).toEqual(200);
    expect(res.body.data.name).toEqual("New Name");
    expect(res.body.data.price).toEqual(75);
  });
});
