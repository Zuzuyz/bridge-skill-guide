import { registerUser, loginUser } from "./auth";
import { prisma } from "./db.server";

async function main() {
  const email = `test-${Date.now()}@skillbridge.local`;

  console.log("Creating test user...");

  const registeredUser = await registerUser(
    "Test Student",
    email,
    "password123",
    "student",
  );

  console.log("Registered:", registeredUser);

  console.log("Testing login...");

  const loggedInUser = await loginUser(
    email,
    "password123",
  );

  console.log("Logged in:", loggedInUser);

  const userInDatabase = await prisma.user.findUnique({
    where: { email },
    include: { studentProfile: true },
  });

  console.log("Database user:", userInDatabase);

  await prisma.user.delete({
    where: { email },
  });

  console.log("Test user deleted.");
  console.log("Authentication test successful!");
}

main()
  .catch((error) => {
    console.error("Authentication test failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });