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

async function main() {
  const prisma = getPrisma();

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
    await prisma.developmentRequester.upsert({
      where: { email: requester.email },
      update: {
        displayName: requester.displayName,
        isActive: requester.isActive,
      },
      create: requester,
    });
  }

  console.log("Lab 2 seed data created successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await getPrisma().$disconnect();
  });