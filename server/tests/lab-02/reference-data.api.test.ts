import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";

describe("Lab 2 reference data APIs", () => {
  it("returns the four active categories", async () => {
    const res = await request(app).get("/api/v1/categories");

    expect(res.status).toBe(200);

    expect(res.body.data).toEqual([
      { id: 1, name: "Account and Access" },
      { id: 2, name: "Hardware" },
      { id: 3, name: "Software" },
      { id: 4, name: "Network" },
    ]);
  });

  it("returns at least six active Related Systems", async () => {
    const res = await request(app).get("/api/v1/related-systems");

    expect(res.status).toBe(200);

    expect(res.body.data.length).toBeGreaterThanOrEqual(6);

    expect(
      res.body.data.some(
        (system: { name: string }) => system.name === "VPN"
      )
    ).toBe(true);
  });
});