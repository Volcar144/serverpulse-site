import "dotenv/config";
import { db } from "./db";

const seedUsers = [
  { email: "alice@prisma.io", username: "alice", name: "Alice" },
  { email: "bob@prisma.io", username: "bob", name: "Bob" },
  { email: "carol@prisma.io", username: "carol", name: "Carol" },
];

let createdCount = 0;

try {
  for (const user of seedUsers) {
    const existingUser = await db.orm.User.where({ email: user.email }).first();
    if (!existingUser) {
      createdCount += await db.orm.User.createCount([user]);
    }
  }

  console.log(`Seeded ${createdCount} user${createdCount === 1 ? "" : "s"}.`);
} finally {
  await db.runtime().close();
}
