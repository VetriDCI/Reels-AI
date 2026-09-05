import prisma from './config/database.js';

/**
 * Make schema deployment safe for existing databases.
 * The phone number is intentionally unique, but older databases may already
 * contain duplicate phone numbers. Prisma refuses to add the unique constraint
 * until those duplicates are resolved.
 *
 * We keep the oldest account's number and clear duplicate values (NULL), so no
 * account is deleted and the unique constraint can be created safely.
 */
async function main() {
  try {
    await prisma.$executeRawUnsafe(`
      DO $$
      DECLARE
        phone_column_exists boolean;
      BEGIN
        SELECT EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'User'
            AND column_name = 'phoneNumber'
        ) INTO phone_column_exists;

        IF phone_column_exists THEN
          EXECUTE $sql$
            WITH ranked AS (
              SELECT
                id,
                ROW_NUMBER() OVER (
                  PARTITION BY "phoneNumber"
                  ORDER BY "createdAt" ASC, id ASC
                ) AS row_number
              FROM "User"
              WHERE "phoneNumber" IS NOT NULL
            )
            UPDATE "User" AS u
            SET "phoneNumber" = NULL
            FROM ranked AS r
            WHERE u.id = r.id
              AND r.row_number > 1
          $sql$;
        END IF;
      END $$;
    `);

    console.log('Database preflight completed. Existing duplicate phone numbers were handled safely.');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error('Database preflight failed:', error);
  process.exit(1);
});
