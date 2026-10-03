import request from "supertest";
import { randomUUID } from "node:crypto";
import {
  describe,
  expect,
  test,
  beforeEach,
  afterAll,
} from "vitest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";
import { hashPassword } from "../../src/auth/password.js";

const prisma = getPrisma();

type UserRole =
  | "Requester"
  | "ITStaff"
  | "Administrator";

const testEmailPrefix =
  "admin-users-test-";

async function createUser(options: {
  displayName: string;
  roles: UserRole[];
  isActive?: boolean;
}) {
  const email = `${testEmailPrefix}${randomUUID()}@example.com`;

  const user = await prisma.user.create({
    data: {
      displayName: options.displayName,
      email,
      passwordHash:
        await hashPassword("CurrentPass123"),
      roles: options.roles,
      isActive:
        options.isActive ?? true,
      passwordState: "Active",
    },
  });

  return user;
}

async function loginAs(
  email: string,
  password = "CurrentPass123"
) {
  const agent = request.agent(app);

  const response = await agent
    .post("/api/v1/auth/login")
    .send({
      email,
      password,
    });

  expect(response.status).toBe(200);

  return agent;
}

async function cleanupTestData() {
  const testUsers =
    await prisma.user.findMany({
      where: {
        email: {
          startsWith:
            testEmailPrefix,
        },
      },
      select: {
        id: true,
      },
    });

  const testUserIds =
    testUsers.map(
      (user) => user.id
    );

  await prisma.ticketAction.deleteMany({
    where: {
      actorUser: {
        email: {
          startsWith:
            testEmailPrefix,
        },
      },
    },
  });

  await prisma.internalNote.deleteMany({
    where: {
      author: {
        email: {
          startsWith:
            testEmailPrefix,
        },
      },
    },
  });

  await prisma.ticketComment.deleteMany({
    where: {
      author: {
        email: {
          startsWith:
            testEmailPrefix,
        },
      },
    },
  });

  await prisma.attachment.deleteMany({
    where: {
      OR: [
        {
          uploadedByUser: {
            email: {
              startsWith:
                testEmailPrefix,
            },
          },
        },
        {
          removedByUser: {
            email: {
              startsWith:
                testEmailPrefix,
            },
          },
        },
      ],
    },
  });

  if (testUserIds.length > 0) {
    await prisma.ticket.deleteMany({
      where: {
        OR: [
          {
            requesterUserId: {
              in: testUserIds,
            },
          },
          {
            assignedToUserId: {
              in: testUserIds,
            },
          },
        ],
      },
    });
  }

  await prisma.developmentRequester.deleteMany({
    where: {
      email: {
        startsWith:
          testEmailPrefix,
      },
    },
  });

  await prisma.user.deleteMany({
    where: {
      email: {
        startsWith:
          testEmailPrefix,
      },
    },
  });
}

beforeEach(async () => {
  await cleanupTestData();
});

afterAll(async () => {
  await cleanupTestData();
});

describe(
  "Lab 3 - Administrator User Management",
  () => {
    test(
      "API-ADMIN-01: Administrator can list active and inactive users with filters",
      async () => {
        const admin =
          await createUser({
            displayName:
              "Admin User",
            roles: [
              "Administrator",
            ],
          });

        const activeRequester =
          await createUser({
            displayName:
              "Active Requester",
            roles: [
              "Requester",
            ],
            isActive: true,
          });

        const inactiveStaff =
          await createUser({
            displayName:
              "Inactive Staff",
            roles: [
              "ITStaff",
            ],
            isActive: false,
          });

        const agent =
          await loginAs(
            admin.email
          );

        const activeResponse =
          await agent.get(
            "/api/v1/admin/users?isActive=true"
          );

        expect(
          activeResponse.status
        ).toBe(200);

        expect(
          activeResponse.body.data.some(
            (user: {
              id: string;
            }) =>
              user.id ===
              activeRequester.id
          )
        ).toBe(true);

        expect(
          activeResponse.body.data.some(
            (user: {
              id: string;
            }) =>
              user.id ===
              inactiveStaff.id
          )
        ).toBe(false);

        const inactiveResponse =
          await agent.get(
            "/api/v1/admin/users?isActive=false"
          );

        expect(
          inactiveResponse.status
        ).toBe(200);

        expect(
          inactiveResponse.body.data.some(
            (user: {
              id: string;
            }) =>
              user.id ===
              inactiveStaff.id
          )
        ).toBe(true);

        expect(
          activeResponse
            .body.data[0]
            .passwordHash
        ).toBeUndefined();
      }
    );

    test(
      "API-ADMIN-02: Administrator can create a user",
      async () => {
        const admin =
          await createUser({
            displayName:
              "Admin User",
            roles: [
              "Administrator",
            ],
          });

        const agent =
          await loginAs(
            admin.email
          );

        const response =
          await agent
            .post(
              "/api/v1/admin/users"
            )
            .send({
              displayName:
                "New IT Staff",
              email:
                `${testEmailPrefix}${randomUUID()}@example.com`,
              password:
                "TemporaryPass123",
              role: "ITStaff",
            });

        expect(
          response.status
        ).toBe(201);

        expect(
          response.body.data
            .displayName
        ).toBe(
          "New IT Staff"
        );

        expect(
          response.body.data
            .roles
        ).toEqual([
          "ITStaff",
        ]);

        expect(
          response.body.data
            .passwordHash
        ).toBeUndefined();

        const createdUser =
          await prisma.user.findUnique(
            {
              where: {
                id:
                  response.body
                    .data.id,
              },
            }
          );

        expect(
          createdUser
        ).not.toBeNull();

        expect(
          createdUser?.passwordHash
        ).not.toBe(
          "TemporaryPass123"
        );
      }
    );

    test(
      "API-ADMIN-03: Duplicate email is rejected",
      async () => {
        const admin =
          await createUser({
            displayName:
              "Admin User",
            roles: [
              "Administrator",
            ],
          });

        const existing =
          await createUser({
            displayName:
              "Existing User",
            roles: [
              "Requester",
            ],
          });

        const agent =
          await loginAs(
            admin.email
          );

        const response =
          await agent
            .post(
              "/api/v1/admin/users"
            )
            .send({
              displayName:
                "Duplicate User",
              email:
                existing.email,
              password:
                "TemporaryPass123",
              role: "Requester",
            });

        expect(
          response.status
        ).toBe(409);

        expect(
          response.body.error
            .code
        ).toBe(
          "DUPLICATE_EMAIL"
        );
      }
    );

    test(
      "API-ADMIN-04: Administrator can update profile, role and active state",
      async () => {
        const admin =
          await createUser({
            displayName:
              "Admin User",
            roles: [
              "Administrator",
            ],
          });

        const target =
          await createUser({
            displayName:
              "Target User",
            roles: [
              "Requester",
            ],
          });

        const agent =
          await loginAs(
            admin.email
          );

        const response =
          await agent
            .patch(
              `/api/v1/admin/users/${target.id}`
            )
            .send({
              displayName:
                "Updated User",
              email:
                target.email,
              role: "ITStaff",
              isActive: false,
            });

        expect(
          response.status
        ).toBe(200);

        expect(
          response.body.data
            .displayName
        ).toBe(
          "Updated User"
        );

        expect(
          response.body.data
            .roles
        ).toEqual([
          "ITStaff",
        ]);

        expect(
          response.body.data
            .isActive
        ).toBe(false);
      }
    );

    test(
  "API-ADMIN-05: Last active Administrator cannot be deactivated or deroled",
  async () => {
    const admin =
      await createUser({
        displayName:
          "Only Administrator",
        roles: [
          "Administrator",
        ],
      });

    const otherActiveAdmins =
      await prisma.user.findMany({
        where: {
          isActive: true,
          roles: {
            has: "Administrator",
          },
          NOT: {
            id: admin.id,
          },
        },
        select: {
          id: true,
        },
      });

    await prisma.user.updateMany({
      where: {
        id: {
          in: otherActiveAdmins.map(
            (user) => user.id
          ),
        },
      },
      data: {
        isActive: false,
      },
    });

    try {
      const agent =
        await loginAs(
          admin.email
        );

      const deactivateResponse =
        await agent
          .patch(
            `/api/v1/admin/users/${admin.id}`
          )
          .send({
            isActive: false,
          });

      expect(
        deactivateResponse.status
      ).toBe(409);

      expect(
        deactivateResponse.body
          .error.code
      ).toBe(
        "SELF_DEACTIVATION_FORBIDDEN"
      );

      const deroleResponse =
        await agent
          .patch(
            `/api/v1/admin/users/${admin.id}`
          )
          .send({
            role: "ITStaff",
          });

      expect(
        deroleResponse.status
      ).toBe(409);

      expect(
        deroleResponse.body
          .error.code
      ).toBe(
        "LAST_ACTIVE_ADMIN_FORBIDDEN"
      );
    } finally {
      await prisma.user.updateMany({
        where: {
          id: {
            in: otherActiveAdmins.map(
              (user) => user.id
            ),
          },
        },
        data: {
          isActive: true,
        },
      });
    }
  }
);

    test(
      "API-ADMIN-06: Deactivation keeps historical ticket references intact",
      async () => {
        const admin =
          await createUser({
            displayName:
              "Admin User",
            roles: [
              "Administrator",
            ],
          });

        const requester =
          await createUser({
            displayName:
              "Ticket Owner",
            roles: [
              "Requester",
            ],
          });

        const developmentRequester =
          await prisma.developmentRequester.create(
            {
              data: {
                id:
                  requester.id,
                displayName:
                  requester.displayName,
                email:
                  requester.email,
                isActive:
                  true,
              },
            }
          );

        const category =
          await prisma.category.findFirst();

        const relatedSystem =
          await prisma.relatedSystem.findFirst();

        expect(
          category
        ).not.toBeNull();

        expect(
          relatedSystem
        ).not.toBeNull();

        const ticket =
          await prisma.ticket.create(
            {
              data: {
                ticketNo:
                  `TKT-ADMIN-${randomUUID()}`,
                requesterId:
                  developmentRequester.id,
                requesterUserId:
                  requester.id,
                categoryId:
                  category!.id,
                relatedSystemId:
                  relatedSystem!.id,
                summary:
                  "Historical ticket",
                description:
                  "Historical ticket for deactivation test.",
                requestedPriority:
                  "Medium",
                status:
                  "New",
                clientRequestId:
                  `client-${randomUUID()}`,
              },
            }
          );

        const agent =
          await loginAs(
            admin.email
          );

        const response =
          await agent
            .patch(
              `/api/v1/admin/users/${requester.id}`
            )
            .send({
              isActive: false,
            });

        expect(
          response.status
        ).toBe(200);

        const savedTicket =
          await prisma.ticket.findUnique(
            {
              where: {
                id: ticket.id,
              },
            }
          );

        expect(
          savedTicket?.requesterUserId
        ).toBe(
          requester.id
        );

        expect(
          savedTicket?.requesterId
        ).toBe(
          developmentRequester.id
        );

        await prisma.ticket.delete({
          where: {
            id: ticket.id,
          },
        });
      }
    );

    test(
      "API-ADMIN-07: Non-administrator cannot access user management",
      async () => {
        const requester =
          await createUser({
            displayName:
              "Requester User",
            roles: [
              "Requester",
            ],
          });

        const agent =
          await loginAs(
            requester.email
          );

        const response =
          await agent.get(
            "/api/v1/admin/users"
          );

        expect(
          response.status
        ).toBe(403);

        expect(
          response.body.error
            .code
        ).toBe("FORBIDDEN");
      }
    );
  }
);