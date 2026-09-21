const request = require("supertest");
const app = require("../app");

describe("Health check", () => {
    it("GET / should respond with 200", async () => {
        const res = await request(app).get("/");
        expect(res.status).toBe(200);
        expect(res.text).toBe("Server Backend Berjalan Mantap!");
    });
});