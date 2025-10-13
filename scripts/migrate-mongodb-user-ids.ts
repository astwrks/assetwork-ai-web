/**
 * Complete MongoDB User ID Migration Script
 *
 * Migrates all user references from old MongoDB ObjectId format
 * to new PostgreSQL user ID format across all collections.
 *
 * Usage: MONGODB_URI=mongodb://localhost:27017/assetworks npx tsx scripts/migrate-mongodb-user-ids.ts
 */

import { connectToDatabase } from '../lib/db/mongodb.js';
import { PrismaClient } from '@prisma/client';
import mongoose from 'mongoose';
import ApiKey from '../lib/db/models/ApiKey.js';
import Thread from '../lib/db/models/Thread.js';
import PlaygroundSettings from '../lib/db/models/PlaygroundSettings.js';

const prisma = new PrismaClient();

interface UserMapping {
  email: string;
  mongoId: string;
  postgresId: string;
}

async function getUserMappings(): Promise<UserMapping[]> {
  console.log('📊 Building user mapping table...\n');

  await connectToDatabase();

  // Get all MongoDB users
  const mongoUsers = await mongoose.connection.db.collection('users').find().toArray();

  // Get all PostgreSQL users
  const postgresUsers = await prisma.users.findMany({
    select: { id: true, email: true },
  });

  const mappings: UserMapping[] = [];

  for (const mongoUser of mongoUsers) {
    const email = mongoUser.email.toLowerCase();
    const postgresUser = postgresUsers.find(u => u.email.toLowerCase() === email);

    if (postgresUser) {
      mappings.push({
        email,
        mongoId: mongoUser._id.toString(),
        postgresId: postgresUser.id,
      });

      console.log(`✅ Mapped: ${email}`);
      console.log(`   MongoDB ID: ${mongoUser._id}`);
      console.log(`   Postgres ID: ${postgresUser.id}\n`);
    } else {
      console.log(`⚠️  No PostgreSQL user found for: ${email}\n`);
    }
  }

  return mappings;
}

async function migrateApiKeys(mappings: UserMapping[]) {
  console.log('🔑 Migrating API Keys...\n');

  let totalUpdated = 0;

  for (const mapping of mappings) {
    const result = await ApiKey.updateMany(
      { userId: mapping.mongoId },
      { $set: { userId: mapping.postgresId } }
    );

    if (result.modifiedCount > 0) {
      console.log(`   ✅ ${mapping.email}: ${result.modifiedCount} key(s) updated`);
      totalUpdated += result.modifiedCount;
    }
  }

  console.log(`\n📊 Total API keys migrated: ${totalUpdated}\n`);
}

async function migrateThreads(mappings: UserMapping[]) {
  console.log('🧵 Migrating Threads...\n');

  let totalUpdated = 0;

  for (const mapping of mappings) {
    // Migrate threads where userId is email (already correct format)
    const emailResult = await Thread.updateMany(
      { userId: mapping.email },
      { $set: { userId: mapping.postgresId } }
    );

    // Also check for any threads with MongoDB ObjectId
    const mongoResult = await Thread.updateMany(
      { userId: mapping.mongoId },
      { $set: { userId: mapping.postgresId } }
    );

    const count = emailResult.modifiedCount + mongoResult.modifiedCount;

    if (count > 0) {
      console.log(`   ✅ ${mapping.email}: ${count} thread(s) updated`);
      totalUpdated += count;
    }
  }

  console.log(`\n📊 Total threads migrated: ${totalUpdated}\n`);
}

async function migratePlaygroundSettings(mappings: UserMapping[]) {
  console.log('⚙️  Migrating Playground Settings...\n');

  let totalUpdated = 0;

  for (const mapping of mappings) {
    // Migrate settings where userId is email (already correct format)
    const emailResult = await PlaygroundSettings.updateMany(
      { userId: mapping.email },
      { $set: { userId: mapping.postgresId } }
    );

    // Also check for any settings with MongoDB ObjectId
    const mongoResult = await PlaygroundSettings.updateMany(
      { userId: mapping.mongoId },
      { $set: { userId: mapping.postgresId } }
    );

    const count = emailResult.modifiedCount + mongoResult.modifiedCount;

    if (count > 0) {
      console.log(`   ✅ ${mapping.email}: ${count} setting(s) updated`);
      totalUpdated += count;
    }
  }

  console.log(`\n📊 Total settings migrated: ${totalUpdated}\n`);
}

async function migrateAccounts(mappings: UserMapping[]) {
  console.log('👤 Migrating Accounts...\n');

  let totalUpdated = 0;

  for (const mapping of mappings) {
    const result = await mongoose.connection.db.collection('accounts').updateMany(
      { userId: mapping.mongoId },
      { $set: { userId: mapping.postgresId } }
    );

    if (result.modifiedCount > 0) {
      console.log(`   ✅ ${mapping.email}: ${result.modifiedCount} account(s) updated`);
      totalUpdated += result.modifiedCount;
    }
  }

  console.log(`\n📊 Total accounts migrated: ${totalUpdated}\n`);
}

async function verifyMigration() {
  console.log('🔍 Verifying Migration...\n');

  // Check for any remaining old user IDs (24-character hex strings = MongoDB ObjectId)
  const collections = ['apikeys', 'threads', 'playgroundsettings', 'accounts'];

  let foundOldIds = false;

  for (const collName of collections) {
    const oldIds = await mongoose.connection.db.collection(collName).find({
      userId: { $regex: /^[0-9a-f]{24}$/i }
    }).toArray();

    if (oldIds.length > 0) {
      console.log(`⚠️  ${collName}: Found ${oldIds.length} document(s) with old MongoDB IDs`);
      foundOldIds = true;
    } else {
      console.log(`✅ ${collName}: All user IDs migrated`);
    }
  }

  console.log();

  if (foundOldIds) {
    console.log('⚠️  Migration incomplete! Some documents still have old IDs.\n');
    return false;
  } else {
    console.log('✅ Migration verification passed! All user IDs updated.\n');
    return true;
  }
}

async function main() {
  try {
    console.log('🚀 Starting MongoDB User ID Migration\n');
    console.log('=' .repeat(60));
    console.log();

    // Step 1: Build user mapping table
    const mappings = await getUserMappings();

    if (mappings.length === 0) {
      console.log('❌ No user mappings found. Exiting.\n');
      process.exit(1);
    }

    console.log('=' .repeat(60));
    console.log();

    // Step 2: Migrate API Keys
    await migrateApiKeys(mappings);

    // Step 3: Migrate Threads
    await migrateThreads(mappings);

    // Step 4: Migrate Playground Settings
    await migratePlaygroundSettings(mappings);

    // Step 5: Migrate Accounts
    await migrateAccounts(mappings);

    console.log('=' .repeat(60));
    console.log();

    // Step 6: Verify migration
    const success = await verifyMigration();

    console.log('=' .repeat(60));
    console.log();

    if (success) {
      console.log('✅ Migration completed successfully!\n');
      process.exit(0);
    } else {
      console.log('❌ Migration completed with warnings.\n');
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
