import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { hashPassword } from '@/lib/auth/password';

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json();

    // Validate input
    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, message: 'All fields are required' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { success: false, message: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.users.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, message: 'Email already registered' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Generate unique ID
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create new user
    const user = await prisma.users.create({
      data: {
        id: userId,
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        aiCredits: 100, // Free credits for new users
        credits: 100,
        plan: 'FREE',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      select: {
        id: true,
        name: true,
        email: true,
        aiCredits: true,
        credits: true,
        plan: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Account created successfully',
        user
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Signup error:', error);

    // Return detailed error in development, generic in production
    const errorMessage = process.env.NODE_ENV === 'development'
      ? error instanceof Error ? error.message : 'Unknown error'
      : 'Failed to create account';

    return NextResponse.json(
      {
        success: false,
        message: errorMessage,
        ...(process.env.NODE_ENV === 'development' && {
          error: error instanceof Error ? error.stack : String(error)
        })
      },
      { status: 500 }
    );
  }
}