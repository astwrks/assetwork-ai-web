import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testConnection() {
  try {
    console.log('🔗 Testing Neon PostgreSQL connection...\n');

    // Test 1: Database connection
    await prisma.$connect();
    console.log('✅ Successfully connected to Neon database');

    // Test 2: Query database info
    const result = await prisma.$queryRaw<any[]>`
      SELECT
        current_database() as database,
        current_schema() as schema,
        version() as version
    `;

    console.log('\n📊 Database Info:');
    console.log(`   Database: ${result[0].database}`);
    console.log(`   Schema: ${result[0].schema}`);
    console.log(`   Version: ${result[0].version.split(',')[0]}`);

    // Test 3: Check tables
    const tables = await prisma.$queryRaw<any[]>`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;

    console.log(`\n📋 Tables Created (${tables.length}):`);
    tables.forEach((table, index) => {
      console.log(`   ${index + 1}. ${table.table_name}`);
    });

    // Test 4: Create a test user
    console.log('\n🧪 Testing database operations...');

    const testUser = await prisma.user.create({
      data: {
        email: 'test@assetworks.ai',
        name: 'Test User',
        plan: 'FREE',
      },
    });

    console.log(`✅ Created test user: ${testUser.name} (${testUser.email})`);

    // Test 5: Query the user
    const foundUser = await prisma.user.findUnique({
      where: { email: 'test@assetworks.ai' },
    });

    console.log(`✅ Found user: ${foundUser?.name}`);

    // Test 6: Delete test user
    await prisma.user.delete({
      where: { id: testUser.id },
    });

    console.log(`✅ Cleaned up test user`);

    console.log('\n🎉 All tests passed! Neon database is ready to use.');

  } catch (error) {
    console.error('❌ Error testing connection:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
