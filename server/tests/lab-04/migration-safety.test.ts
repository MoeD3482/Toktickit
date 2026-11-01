import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const migrations = resolve(process.cwd(), "prisma", "migrations");

function migration(name: string) {
  return readFileSync(
    resolve(migrations, name, "migration.sql"),
    "utf8",
  );
}

const destructiveSql =
  /\b(DROP\s+TABLE|DROP\s+COLUMN|TRUNCATE(?:\s+TABLE)?|DELETE\s+FROM)\b/i;

describe("Lab 4 migration safety", () => {
  it("creates ActionTaken and preserves existing Ticket and User tables", () => {
    const sql = migration("20261029071100_add_action_taken_model");

    expect(sql).toMatch(/CREATE TABLE "ActionTaken"/);
    expect(sql).toMatch(/REFERENCES "Ticket"\("id"\)/);
    expect(sql).toMatch(/REFERENCES "User"\("id"\)/);
    expect(sql).toMatch(/ON DELETE RESTRICT/);
    expect(sql).not.toMatch(destructiveSql);
  });

  it("adds Open without replacing existing TicketStatus values", () => {
    const sql = migration("20261031000000_add_open_ticket_status");

    expect(sql).toMatch(/ALTER TYPE "TicketStatus" ADD VALUE 'Open'/);
    expect(sql).not.toMatch(destructiveSql);
  });

  it("adds nullable idempotency fields and a unique index without deleting actions", () => {
    const sql = migration(
      "20261031010000_add_action_taken_idempotency_forward",
    );

    expect(sql).toMatch(/ADD COLUMN\s+"idempotencyKey" TEXT/);
    expect(sql).toMatch(/ADD COLUMN\s+"requestFingerprint" TEXT/);
    expect(sql).toMatch(/CREATE UNIQUE INDEX "ActionTaken_idempotencyKey_key"/);
    expect(sql).not.toMatch(destructiveSql);
  });
});
