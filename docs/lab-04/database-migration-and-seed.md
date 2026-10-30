# Lab 4 Database Migration and Seed Strategy

## 1. Overview

This document describes the database foundation, migration strategy, seed data, idempotency, and recovery approach for Lab 4.

The main database addition is the `ActionTaken` model, which records IT staff actions performed on individual tickets.

The implementation is designed to preserve existing Lab 1–3 data and remain compatible with tickets that do not yet have any Actions Taken records.

## 2. Database Schema

### 2.1 ActionTaken Model

The `ActionTaken` model contains the following information:

- `id`: Unique identifier for an action.
- `ticketId`: Ticket associated with the action.
- `performedByUserId`: User who performed the action.
- `actionAt`: Date and time when the action was performed.
- `description`: Description of the work performed.
- `result`: Result of the action.
- `followUpRequired`: Indicates whether further follow-up is required.
- `followUpNote`: Additional follow-up instructions.
- `attachmentNotes`: Notes describing related attachments.
- `createdAt`: Record creation timestamp.
- `updatedAt`: Last update timestamp.

### 2.2 Relationships

- One Ticket can have multiple Actions Taken records.
- Each ActionTaken record belongs to exactly one Ticket.
- Each ActionTaken record has one associated User as its performer.
- A Ticket may have zero Actions Taken records.

The database uses foreign keys to maintain these relationships.

Indexes support queries by ticket and action date, as well as by the user who performed the action.

## 3. Migration Strategy

The migration is:

`20261029071100_add_action_taken_model`

The migration adds the ActionTaken table, indexes, and foreign-key relationships.

It is additive and does not intentionally delete or overwrite existing Ticket or User records.

Existing tickets remain valid even when they have no Actions Taken records.

No artificial historical Actions Taken records are created for existing tickets during migration.

### 3.1 Existing Data Compatibility

The migration maintains compatibility with existing Lab 1–3 data.

Existing Ticket records can continue to exist without Actions Taken records.

New Actions Taken records can be associated with existing Ticket and User records.

The database relationships enforce the required references.

## 4. Seed Data Strategy

The Lab 4 seed implementation is located at:

`server/prisma/seed.ts`

The seed uses Prisma `upsert` operations and deterministic identifiers for the Lab 4 fixture records.

It does not use `deleteMany`, database resets, or table deletion.

Only the records identified by the Lab 4 fixture identifiers are refreshed during seed execution. Unrelated records are not intentionally modified or deleted.

Existing user passwords and password states are preserved during updates to seeded users.

### 4.1 Ticket Fixtures

The seed creates seven representative tickets.

| Ticket | Status | Assignment | Actions Taken |
|---|---|---|---:|
| LAB4-SEED-001 | New | Unassigned | 0 |
| LAB4-SEED-002 | InProgress | Assigned | 1 |
| LAB4-SEED-003 | WaitingForRequester | Assigned | 2 |
| LAB4-SEED-004 | Resolved | Assigned | 1 |
| LAB4-SEED-005 | Closed | Assigned | 2 |
| LAB4-SEED-006 | Reopened | Assigned | 1 |
| LAB4-SEED-007 | Cancelled | Unassigned | 0 |

### 4.2 Actions Taken Fixtures

The seed creates seven Actions Taken records.

The fixtures cover:

- Tickets with no Actions Taken records.
- Tickets with exactly one Actions Taken record.
- Tickets with multiple Actions Taken records.
- Actions with follow-up required.
- Actions without follow-up required.
- Actions performed by different IT staff users.

### 4.3 Idempotency

The seed uses stable Ticket numbers, client request IDs, and ActionTaken IDs.

Repeated execution updates the matching fixture records rather than creating duplicate records.

The seed verification script is located at:

`server/prisma/verify-lab4-seed.ts`

## 5. Migration and Seed Verification

The following commands are used to verify the implementation.

From the server directory:

```powershell
npm run build
npm run prisma:seed
npx tsx prisma/verify-lab4-seed.ts
npx prisma migrate status
npm test
```

The seed should be executed more than once to verify that it does not create duplicate fixture records.

### 5.1 Seed Verification Results

The verification script checks the following:

| Verification | Expected Result |
|---|---:|
| Seeded Tickets | 7 |
| Seeded Actions Taken | 7 |
| Tickets with zero Actions Taken | 2 |
| Tickets with one Action Taken | 3 |
| Tickets with multiple Actions Taken | 2 |
| Assigned Tickets | 5 |
| Unassigned Tickets | 2 |
| Actions requiring follow-up | 2 |

The verification script reports success only when the expected scenarios are found.

### 5.2 Migration Status

The migration status command confirms whether the database schema is synchronized with the migration history.

The current verification reported:

- 8 migrations found.
- Database schema is up to date.

## 6. Recovery Strategy

Before applying database migrations in a production environment, create and verify a database backup.

If a migration fails:

1. Stop further deployment steps.
2. Inspect the migration logs and database migration state.
3. Determine whether the migration was partially or fully applied.
4. Restore from a verified backup or use a forward-fix migration where appropriate.
5. Verify the database schema and existing data before restarting the application.

Do not drop the ActionTaken table if it contains user-generated records.

Do not modify an already-applied migration to change its historical behavior. Use a new migration for subsequent schema changes.

Prisma migration resolution should only be used after the actual database state has been inspected and manually recovered where necessary.

## 7. Known Status Dependency

The current TicketStatus enum does not yet include `Open`.

The Lab 4 requirements include an `Open` status. This will require a schema and migration update in the Ticket lifecycle implementation under Issue #5.

The current seed therefore uses only statuses supported by the existing Prisma schema.

## 8. Compatibility

The migration and seed implementation must not break existing Lab 1–3 functionality.

Existing users, tickets, attachments, comments, and other historical records must remain available.

Existing tickets without Actions Taken records remain valid.
## 9. Current Database Integrity Verification

The migration verification script is located at:

`server/prisma/verify-action-taken-migration.ts`

Run it from the server directory:

```powershell
npx tsx prisma/verify-action-taken-migration.ts