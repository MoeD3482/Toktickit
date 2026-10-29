import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";

const TEST_REQUESTER_PREFIX = "lab2-test-requester-";

interface RequesterResponse {
  id: string;
  displayName: string;
  email: string;
}

describe("GET /api/v1/development-requesters", () => {
  it("returns the four seeded active Development Requesters", async () => {
    const res = await request(app).get(
      "/api/v1/development-requesters",
    );

    expect(res.status).toBe(200);

    const requesters =
      res.body.data as RequesterResponse[];

    // Dedicated automated-test accounts are separate from seeded users.
    const seededRequesters = requesters.filter(
      (requester) =>
        !requester.email.startsWith(TEST_REQUESTER_PREFIX),
    );

    expect(seededRequesters).toHaveLength(4);

    expect(
      requesters.every(
        (requester) =>
          requester.id &&
          requester.displayName &&
          requester.email,
      ),
    ).toBe(true);

    expect(
      requesters.some(
        (requester) =>
          requester.displayName === "Inactive Requester",
      ),
    ).toBe(false);
  });
});
