import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient({
  log: ['query', 'error', 'warn'],
});

async function main() {
  console.log('🔧 Creating test user...');

  const testEmail = 'test@example.com';
  const testPassword = 'password123';

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: testEmail },
  });

  if (existingUser) {
    console.log('✅ Test user already exists!');
    console.log('\n📧 Login credentials:');
    console.log('Email:', testEmail);
    console.log('Password:', testPassword);
    return;
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(testPassword, 10);

  // Create user
  const user = await prisma.user.create({
    data: {
      email: testEmail,
      name: 'Test User',
      password: hashedPassword,
      emailVerified: new Date(),
      plan: 'free',
      aiCredits: 1000,
    },
  });

  console.log('✅ Test user created successfully!');
  console.log('\n📧 Login credentials:');
  console.log('Email:', testEmail);
  console.log('Password:', testPassword);
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
