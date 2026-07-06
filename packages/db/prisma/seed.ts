import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.$transaction(async (tx) => {
    const owner = await tx.employee.upsert({
      create: {
        email: "owner@example.com",
        fullName: "Owner",
        isOwner: true,
        passwordHash: "replace-with-real-hash"
      },
      update: {},
      where: {
        email: "owner@example.com"
      }
    });

    await tx.employee.upsert({
      create: {
        email: "hr@example.com",
        fullName: "HR Manager",
        isHr: true,
        managerId: owner.id,
        passwordHash: "replace-with-real-hash"
      },
      update: {},
      where: {
        email: "hr@example.com"
      }
    });
  });
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
