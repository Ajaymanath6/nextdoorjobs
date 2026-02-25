/**
 * Check that DATABASE_URL is set and the DB is reachable.
 * Run: node scripts/check-db.js (or npm run db:check)
 * Does not print DATABASE_URL or any secrets.
 */
import { Pool } from "pg";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("Step 1 – DATABASE_URL: not set in .env.local or .env");
  process.exit(1);
}

// Only confirm it looks like a URL and has a host (don't print it)
const hasProtocol = /^postgres(ql)?:\/\//i.test(connectionString);
const hasHost = connectionString.includes("@") || connectionString.includes("host=");
if (!hasProtocol || !hasHost) {
  console.error("Step 1 – DATABASE_URL: must be a PostgreSQL URL (e.g. postgresql://user:pass@host:5432/db)");
  process.exit(1);
}

console.log("Step 1 – DATABASE_URL: set and looks valid (host/port not printed)");

const pool = new Pool({ connectionString, connectionTimeoutMillis: 60000 });

async function check() {
  try {
    const client = await pool.connect();
    await client.query("SELECT 1");
    client.release();
    await pool.end();
    console.log("Step 2 – DB reachable: yes");
    return true;
  } catch (err) {
    await pool.end().catch(() => {});
    console.error("Step 2 – DB reachable: no");
    console.error("  code:", err.code || "unknown");
    console.error("  message:", err.message);
    if (err.code === "ETIMEDOUT") {
      console.error("  tip: If using Neon, use the POOLED connection string from the dashboard (host ends with -pooler).");
      console.error("  tip: Warm the DB by loading the app in the browser, then run: npm run db:check && npm run db:seed-admin-owner");
      console.error("  tip: If DB only allows certain IPs (e.g. Vercel), run the seed from that environment.");
    }
    return false;
  }
}

check().then((ok) => process.exit(ok ? 0 : 1));
