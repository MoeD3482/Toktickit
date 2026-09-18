import { hashPassword } from "../src/auth/password.js";
import { getPrisma } from "../src/prisma.js";

const categories = [
  "Account and Access",
  "Hardware",
  "Software",
  "Network",
];

const relatedSystems = [
  "Email",
  "Campus Wi-Fi",
  "VPN",
  "LEB2 App",
  "Grade Submission App",
  "Printer",
  "Corporate Laptop",
];

const requesters = [
  {
    displayName: "Anan Chaiyasit",
    email: "anan.chaiyasit@example.com",
    isActive: true,
  },
  {
    displayName: "Narin Kittipong",
    email: "narin.kittipong@example.com",
    isActive: true,
  },
  {
    displayName: "Pimchanok Srisuk",
    email: "pimchanok.srisuk@example.com",
    isActive: true,
  },
  {
    displayName: "Thanawat Rattanakul",
    email: "thanawat.rattanakul@example.com",
    isActive: true,
  },
  {
    displayName: "Inactive Requester",
    email: "inactive.requester@example.com",
    isActive: false,
  },
];

const staffUsers = [
  {
    displayName: "Somchai IT Staff",
    email: "somchai.staff@example.com",
    roles: ["ITStaff"] as const,
    isActive: true,
  },
  {
    displayName: "Kanya Service Desk",
    email: "kanya.staff@example.com",
    roles: ["ITStaff"] as const,
    isActive: true,
  },
];

const administratorUsers = [
  {
    displayName: "TokTickIT Administrator",
    email: "admin@example.com",
    roles: ["Administrator"] as const,
    isActive: true,
  },
];

async function main() {
  const prisma = getPrisma();
  const temporaryPasswordHash = await hashPassword(
    "ChangeMe123!"
  );

  for (const name of categories) {
    await prisma.category.upsert({
      where: { name },
      update: { isActive: true },
      create: {
        name,
        isActive: true,
      },
    });
  }

  for (const name of relatedSystems) {
    await prisma.relatedSystem.upsert({
      where: { name },
      update: { isActive: true },
      create: {
        name,
        isActive: true,
      },
    });
  }

  for (const requester of requesters) {
    const developmentRequester =
      await prisma.developmentRequester.upsert({
        where: { email: requester.email },
        update: {
          displayName: requester.displayName,
          isActive: requester.isActive,
        },
        create: requester,
      });

    await prisma.user.upsert({
      where: { email: requester.email },
      update: {
        displayName: requester.displayName,
        passwordHash: temporaryPasswordHash,
        roles: ["Requester"],
        isActive: requester.isActive,
        passwordState: "ChangeRequired",
      },
      create: {
        id: developmentRequester.id,
        displayName: requester.displayName,
        email: requester.email,
        passwordHash: temporaryPasswordHash,
        roles: ["Requester"],
        isActive: requester.isActive,
        passwordState: "ChangeRequired",
      },
    });
  }

  for (const staffUser of staffUsers) {
    await prisma.user.upsert({
      where: { email: staffUser.email },
      update: {
        displayName: staffUser.displayName,
        passwordHash: temporaryPasswordHash,
        roles: [...staffUser.roles],
        isActive: staffUser.isActive,
        passwordState: "ChangeRequired",
      },
      create: {
        displayName: staffUser.displayName,
        email: staffUser.email,
        passwordHash: temporaryPasswordHash,
        roles: [...staffUser.roles],
        isActive: staffUser.isActive,
        passwordState: "ChangeRequired",
      },
    });
  }

  for (const administratorUser of administratorUsers) {
    await prisma.user.upsert({
      where: { email: administratorUser.email },
      update: {
        displayName: administratorUser.displayName,
        passwordHash: temporaryPasswordHash,
        roles: [...administratorUser.roles],
        isActive: administratorUser.isActive,
        passwordState: "ChangeRequired",
      },
      create: {
        displayName: administratorUser.displayName,
        email: administratorUser.email,
        passwordHash: temporaryPasswordHash,
        roles: [...administratorUser.roles],
        isActive: administratorUser.isActive,
        passwordState: "ChangeRequired",
      },
    });
  }

  console.log("Lab 3 seed data created successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await getPrisma().$disconnect();
  });
