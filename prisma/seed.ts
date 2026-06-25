import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  const adminPassword = await bcrypt.hash("admin123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@onitx.com" },
    update: {},
    create: {
      name: "Admin",
      email: "admin@onitx.com",
      password: adminPassword,
      role: Role.ADMIN,
    },
  });

  console.log(`Admin seeded: ${admin.email}`);
  console.log("Seeding complete.");
}

main()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
