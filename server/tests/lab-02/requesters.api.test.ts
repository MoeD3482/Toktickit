
import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";

const AUTOMATED_TEST_REQUESTER_EMAILS = [
  "e2e-requester@toktickit.test",
];

const AUTOMATED_TEST_REQUESTER_PREFIXES = [
  "lab2-test-requester-",
];

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

    const seededRequesters = requesters.filter(
      (requester) =>
        !AUTOMATED_TEST_REQUESTER_EMAILS.includes(
          requester.email,
        ) &&
        !AUTOMATED_TEST_REQUESTER_PREFIXES.some(
          (prefix) => requester.email.startsWith(prefix),
        ),
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
