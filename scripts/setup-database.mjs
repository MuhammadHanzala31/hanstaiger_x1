import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error(
    "DATABASE_URL is missing.\n\n" +
      "1. Open Supabase → Project Settings → Database\n" +
      "2. Copy the URI connection string (use the service role password)\n" +
      "3. Add DATABASE_URL=... to .env\n" +
      "4. Run: npm run db:setup",
  );
  process.exit(1);
}

const client = new pg.Client({
  connectionString: databaseUrl,
  ssl: { rejectUnauthorized: false },
});

const sqlFiles = [
  ...readdirSync(join(root, "supabase/migrations"))
    .filter((name) => name.endsWith(".sql"))
    .sort()
    .map((name) => join(root, "supabase/migrations", name)),
  join(root, "supabase/seed.sql"),
];

try {
  await client.connect();
  for (const file of sqlFiles) {
    const sql = readFileSync(file, "utf8");
    console.log(`Running ${file.replace(root + "/", "")}...`);
    await client.query(sql);
  }
  console.log("Database setup complete.");
} catch (err) {
  console.error("Database setup failed:", err.message);
  process.exit(1);
} finally {
  await client.end();
}
