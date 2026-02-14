const request = require("supertest");
const app = require("../app");
const User = require("../models/User");

describe("Auth Endpoints", () => {
  beforeEach(async () => {
    await User.deleteMany({});
  });

  it("should register a new user", async () => {
    const res = await request(app).post("/api/users").send({
      name: "Test User",
      email: "test@example.com",
      password: "password123",
    });

    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty("token");
    expect(res.body.email).toEqual("test@example.com");
  });

  it("should login an existing user", async () => {
    await User.create({
      name: "Test User",
      email: "test@example.com",
      password: "password123",
    });

    const res = await request(app).post("/api/users/login").send({
      email: "test@example.com",
      password: "password123",
    });

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty("token");
  });

  it("should not login with incorrect password", async () => {
    await User.create({
      name: "Test User",
      email: "test@example.com",
      password: "password123",
    });

    const res = await request(app).post("/api/users/login").send({
      email: "test@example.com",
      password: "wrongpassword",
    });

    expect(res.statusCode).toEqual(401);
  });
});
