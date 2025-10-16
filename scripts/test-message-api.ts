#!/usr/bin/env tsx

/**
 * Script to test message API directly
 */

import { prisma } from '../lib/db/prisma';
import { nanoid } from 'nanoid';

async function testMessageCreation() {
  try {
    console.log('🔧 Testing message creation...');

    // Get the test user
    const user = await prisma.users.findUnique({
      where: { email: 'test@assetworks.ai' },
      select: { id: true },
    });

    if (!user) {
      console.error('❌ Test user not found');
      return;
    }

    console.log('✅ Found user:', user.id);

    // Get or create a thread
    let thread = await prisma.threads.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });

    if (!thread) {
      console.log('📝 Creating new thread...');
      thread = await prisma.threads.create({
        data: {
          id: nanoid(),
          userId: user.id,
          title: 'Test Thread',
          description: 'Testing message creation',
          status: 'ACTIVE',
          metadata: {},
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
    }

    console.log('✅ Using thread:', thread.id);

    // Create a test message
    console.log('📨 Creating test message...');
    const message = await prisma.messages.create({
      data: {
        id: nanoid(),
        threads: {
          connect: { id: thread.id }
        },
        users: {
          connect: { id: user.id }
        },
        role: 'USER',
        content: 'Test message content',
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    console.log('✅ Message created successfully:', message.id);
    console.log('📊 Message details:', {
      id: message.id,
      threadId: message.threadId,
      role: message.role,
      content: message.content,
    });

  } catch (error) {
    console.error('❌ Error creating message:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
    }
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

testMessageCreation();