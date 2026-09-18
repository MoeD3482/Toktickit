import { afterEach, describe, expect, it } from "vitest";
import request from "supertest";
import { randomUUID } from "crypto";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";
import { hashPassword } from "../../src/auth/password.js";
import { clearSessionsForTests } from "../../src/auth/session.js";

const createdUserEmails: string[] = [];

async function createTestUser(options?: {
  isActive?: boolean;
  passwordState?: "ChangeRequired" | "Active";
}) {
  const prisma = getPrisma();
  const email = `auth-${randomUUID()}@example.com`;
  createdUserEmails.push(email);

  return prisma.user.create({
    data: {
      displayName: "Auth Test User",
      email,
      passwordHash: await hashPassword("CurrentPass123"),
      roles: ["Requester"],
      isActive: options?.isActive ?? true,
      passwordState: options?.passwordState ?? "Active",
    },
  });
}

describe("Lab 3 authentication API", () => {
  afterEach(async () => {
    clearSessionsForTests();

    const prisma = getPrisma();

    if (createdUserEmails.length > 0) {
      await prisma.user.deleteMany({
        where: {
          email: {
            in: createdUserEmails,
          },
        },
      });

      createdUserEmails.length = 0;
    }
  });

  it("signs in an active user and does not expose the password hash", async () => {
    const user = await createTestUser({
      passwordState: "ChangeRequired",
    });

    const agent = request.agent(app);

    const response = await agent
      .post("/api/v1/auth/login")
      .send({
        email: user.email,
        password: "CurrentPass123",
      });

    expect(response.status).toBe(200);
    expect(response.headers["set-cookie"]).toBeDefined();
    expect(response.body.data.user).toEqual(
      expect.objectContaining({
        id: user.id,
        email: user.email,
        roles: ["Requester"],
        isActive: true,
        passwordState: "ChangeRequired",
      })
    );
    expect(response.body.data.user.passwordHash).toBeUndefined();

    const meResponse = await agent.get("/api/v1/auth/me");

    expect(meResponse.status).toBe(200);
    expect(meResponse.body.data.user.id).toBe(user.id);
    expect(meResponse.body.data.user.passwordHash).toBeUndefined();
  });

  it("rejects invalid credentials with a safe generic error", async () => {
    const user = await createTestUser();

    const response = await request(app)
      .post("/api/v1/auth/login")
      .send({
        email: user.email,
        password: "WrongPass123",
      });

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("INVALID_CREDENTIALS");
    expect(response.body.error.message).toBe(
      "Email or password is incorrect."
    );
    expect(response.body.error.message).not.toContain(user.email);
  });

  it("rejects inactive users with the same safe login error", async () => {
    const user = await createTestUser({
      isActive: false,
    });

    const response = await request(app)
      .post("/api/v1/auth/login")
      .send({
        email: user.email,
        password: "CurrentPass123",
      });

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("INVALID_CREDENTIALS");
  });

  it("requires authentication for current-user and change-password endpoints", async () => {
    const meResponse = await request(app).get("/api/v1/auth/me");
    const passwordResponse = await request(app)
      .post("/api/v1/auth/change-password")
      .send({});

    expect(meResponse.status).toBe(401);
    expect(meResponse.body.error.code).toBe(
      "AUTHENTICATION_REQUIRED"
    );
    expect(passwordResponse.status).toBe(401);
    expect(passwordResponse.body.error.code).toBe(
      "AUTHENTICATION_REQUIRED"
    );
  });

  it("changes a temporary password and clears the change-required state", async () => {
    const user = await createTestUser({
      passwordState: "ChangeRequired",
    });

    const agent = request.agent(app);

    await agent.post("/api/v1/auth/login").send({
      email: user.email,
      password: "CurrentPass123",
    });

    const response = await agent
      .post("/api/v1/auth/change-password")
      .send({
        currentPassword: "CurrentPass123",
        newPassword: "NewPass123",
        confirmPassword: "NewPass123",
      });

    expect(response.status).toBe(200);
    expect(response.body.data.user.passwordState).toBe("Active");
    expect(response.body.data.user.passwordHash).toBeUndefined();

    const savedUser = await getPrisma().user.findUniqueOrThrow({
      where: {
        id: user.id,
      },
    });

    expect(savedUser.passwordHash).not.toBe(user.passwordHash);
    expect(savedUser.passwordHash).toMatch(/^scrypt:/);
    expect(savedUser.passwordState).toBe("Active");
  });

  it("validates password confirmation and password strength", async () => {
    const user = await createTestUser({
      passwordState: "ChangeRequired",
    });

    const agent = request.agent(app);

    await agent.post("/api/v1/auth/login").send({
      email: user.email,
      password: "CurrentPass123",
    });

    const response = await agent
      .post("/api/v1/auth/change-password")
      .send({
        currentPassword: "CurrentPass123",
        newPassword: "short",
        confirmPassword: "different",
      });

    expect(response.status).toBe(422);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
    expect(
      response.body.error.fieldErrors.some(
        (error: { field: string }) =>
          error.field === "confirmPassword"
      )
    ).toBe(true);
    expect(
      response.body.error.fieldErrors.some(
        (error: { field: string }) => error.field === "newPassword"
      )
    ).toBe(true);
  });

  it("logs out and invalidates the authenticated session", async () => {
    const user = await createTestUser();
    const agent = request.agent(app);

    await agent.post("/api/v1/auth/login").send({
      email: user.email,
      password: "CurrentPass123",
    });

    const logoutResponse = await agent.post("/api/v1/auth/logout");

    expect(logoutResponse.status).toBe(204);

    const meResponse = await agent.get("/api/v1/auth/me");

    expect(meResponse.status).toBe(401);
    expect(meResponse.body.error.code).toBe(
      "AUTHENTICATION_REQUIRED"
    );
  });
});
