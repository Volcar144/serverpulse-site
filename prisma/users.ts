import "dotenv/config";
import { db } from "./db";

import type { DefaultModelRow } from "@prisma-next/sql-orm-client";

import type { Contract } from "./contract.d";

export { db };

type UserRow = DefaultModelRow<Contract, "User">;

function toStarterUser(user: Pick<UserRow, "id" | "email" | "username" | "name" | "createdAt">) {
  return {
    id: String(user.id),
    email: user.email,
    username: user.username ?? null,
    name: user.name ?? null,
    createdAt: user.createdAt,
  };
}

export async function listUsers(limit = 10) {

  const users = await db.orm.User.select("id", "email", "username", "name", "createdAt").take(limit).all();

  return users.map(toStarterUser);

}

export type StarterUser = Awaited<ReturnType<typeof listUsers>>[number];
