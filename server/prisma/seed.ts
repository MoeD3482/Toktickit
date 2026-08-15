import { getPrisma } from "../src/prisma.js";

// Issue 3 — seed the four supported categories.
// Running the seed multiple times must NOT create duplicates.

const categories = [
  "Account and Access",
  "Hardware",
  "Software",
  "Network",
];

async function main() {
  const prisma = getPrisma();

  for (const name of categories) {
    await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  console.log("Categories seeded successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await getPrisma().$disconnect();
  });