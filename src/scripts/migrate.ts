import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pool } from "../db/mysql";

async function main() {
  const sqlPath = resolve(process.cwd(), "sql/001_init_schema.sql");
  const sql = await readFile(sqlPath, "utf-8");
  const statements = sql
    .split(/;\s*\n/)
    .map((x) => x.trim())
    .filter((x) => x && !x.startsWith("--"));

  for (const statement of statements) {
    await pool.query(statement);
  }

  console.log(`迁移完成，共执行 ${statements.length} 条语句`);
  await pool.end();
}

main().catch(async (error) => {
  console.error("迁移失败", error);
  await pool.end();
  process.exit(1);
});
