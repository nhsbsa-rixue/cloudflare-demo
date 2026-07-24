import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: [
    "./src/users/schema.ts",
    "./src/cases/schema.ts",
    "./src/auth-accounts/schema.ts",
  ],
  out: "./drizzle",
  dialect: "sqlite",
  dbCredentials: {
    url: "./demo-db.db",
  },
});
