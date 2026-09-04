import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";

describe("GET /api/v1/development-requesters", () => {
  it("returns only the four active Development Requesters", async () => {
    const res = await request(app).get("/api/v1/development-requesters");

    expect(res.status).toBe(200);

    expect(res.body.data).toHaveLength(4);

    expect(
      res.body.data.every(
        (requester: {
          id: string;
          displayName: string;
          email: string;
        }) =>
          requester.id &&
          requester.displayName &&
          requester.email
      )
    ).toBe(true);

    expect(
      res.body.data.some(
        (requester: { displayName: string }) =>
          requester.displayName === "Inactive Requester"
      )
    ).toBe(false);
  });
});