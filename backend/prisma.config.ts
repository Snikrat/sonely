import path from "path";
import { defineConfig } from "prisma/config";

const dbPath = path.resolve(process.cwd(), "prisma", "dev.db");

console.log("Prisma config DB path:", dbPath);

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: `file:${dbPath}`,
  },
});
