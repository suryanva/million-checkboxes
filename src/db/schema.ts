import { pgTable, uuid, varchar, text, timestamp, boolean, customType } from 'drizzle-orm/pg-core';

// Custom type for PostgreSQL BYTEA to store the 125KB grid snapshot (1M bits)
const bytea = customType<{ data: Buffer; driverData: Buffer }>({
  dataType() {
    return 'bytea';
  },
  toDriver(val: Buffer): Buffer {
    return val;
  },
  fromDriver(val: Buffer): Buffer {
    return val;
  },
});

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),

  // Basic Info
  email: varchar('email', { length: 322 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  avatarUrl: text('avatar_url'),

  // Local Auth Fields (Nullable for OIDC users)
  password: varchar('password', { length: 66 }),
  salt: text('salt'),
  isVerified: boolean('is_verified').default(false),

  // Google OIDC Fields (Nullable for Local users)
  googleId: varchar('google_id', { length: 255 }).unique(),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const gridSnapshots = pgTable('grid_snapshots', {
  id: uuid('id').defaultRandom().primaryKey(),

  // The 'gridState' will store the entire 1 Million checkbox states as a binary blob
  gridState: bytea('grid_state').notNull(),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});