import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectToDatabase } from '@/lib/db/mongodb';
import Template from '@/lib/db/models/Template';

// GET /api/playground/templates - Get all public templates
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const tier = searchParams.get('tier');
    const search = searchParams.get('search');

    // Build query
    const query: any = {
      $or: [
        { isPublic: true }, // Public templates
        { userId: session.user.email }, // User's own templates
      ],
    };

    if (category) {
      query.category = category;
    }

    if (tier) {
      query.tier = tier;
    }

    if (search) {
      query.$text = { $search: search };
    }

    // Fetch templates with sorting
    const templates = await Template.find(query)
      .sort({ usageCount: -1, rating: -1, createdAt: -1 })
      .limit(50);

    return NextResponse.json({ templates }, { status: 200 });
  } catch (error) {
    console.error('Error fetching templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    );
  }
}

// POST /api/playground/templates - Create a new template
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const body = await request.json();
    const {
      name,
      description,
      category,
      tags,
      structure,
      basePrompt,
      isPublic,
      isPremium,
      tier,
      icon,
      previewImageUrl,
    } = body;

    // Validate required fields
    if (!name || !structure || !Array.isArray(structure)) {
      return NextResponse.json(
        { error: 'Name and structure are required' },
        { status: 400 }
      );
    }

    // Create new template
    const template = new Template({
      userId: session.user.email,
      name: name.trim(),
      description: description?.trim(),
      category: category?.trim(),
      tags: tags || [],
      structure,
      basePrompt: basePrompt?.trim(),
      isPublic: isPublic || false,
      isPremium: isPremium || false,
      tier: tier || 'free',
      icon: icon?.trim(),
      previewImageUrl: previewImageUrl?.trim(),
      usageCount: 0,
      rating: 0,
      ratingCount: 0,
    });

    await template.save();

    return NextResponse.json({ template }, { status: 201 });
  } catch (error) {
    console.error('Error creating template:', error);
    return NextResponse.json(
      { error: 'Failed to create template' },
      { status: 500 }
    );
  }
}
