import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient({
  log: ['query', 'error', 'warn'],
});

async function main() {
  console.log('🔧 Creating AssetWorks test user...');

  const testEmail = 'test@assetworks.ai';
  const testPassword = 'password123';

  // Check if user already exists
  const existingUser = await prisma.users.findUnique({
    where: { email: testEmail },
  });

  if (existingUser) {
    console.log('✅ Test user already exists!');
    console.log('\n📧 Login credentials:');
    console.log('Email:', testEmail);
    console.log('Password:', testPassword);
    console.log('\n🔗 Login at: http://localhost:3001/auth/signin');
    return;
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(testPassword, 10);

  // Generate unique ID
  const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Create user
  const user = await prisma.users.create({
    data: {
      id: userId,
      email: testEmail,
      name: 'AssetWorks Test User',
      password: hashedPassword,
      emailVerified: new Date(),
      plan: 'FREE',
      aiCredits: 1000,
      credits: 1000,
      isPublic: true,
      theme: 'SYSTEM',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  console.log('✅ Test user created successfully!');
  console.log('\n📧 Login credentials:');
  console.log('Email:', testEmail);
  console.log('Password:', testPassword);
  console.log('User ID:', user.id);
  console.log('\n🔗 Login at: http://localhost:3001/auth/signin');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
