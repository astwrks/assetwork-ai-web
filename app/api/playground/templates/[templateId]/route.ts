import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectToDatabase } from '@/lib/db/mongodb';
import Template from '@/lib/db/models/Template';

// GET /api/playground/templates/[templateId] - Get template details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ templateId: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const { templateId } = await params;
    const template = await Template.findById(templateId);

    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    // Check if user has access to this template
    const hasAccess =
      template.isPublic || template.userId === session.user.email;

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    return NextResponse.json({ template }, { status: 200 });
  } catch (error) {
    console.error('Error fetching template:', error);
    return NextResponse.json(
      { error: 'Failed to fetch template' },
      { status: 500 }
    );
  }
}

// PUT /api/playground/templates/[templateId] - Update template
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ templateId: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const { templateId } = await params;
    const template = await Template.findById(templateId);

    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    // Only owner can update
    if (template.userId !== session.user.email) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const updates = {
      name: body.name,
      description: body.description,
      category: body.category,
      tags: body.tags,
      structure: body.structure,
      basePrompt: body.basePrompt,
      isPublic: body.isPublic,
      isPremium: body.isPremium,
      tier: body.tier,
      icon: body.icon,
      previewImageUrl: body.previewImageUrl,
    };

    // Remove undefined values
    Object.keys(updates).forEach(
      (key) => updates[key as keyof typeof updates] === undefined && delete updates[key as keyof typeof updates]
    );

    const updatedTemplate = await Template.findByIdAndUpdate(
      templateId,
      { $set: updates },
      { new: true, runValidators: true }
    );

    return NextResponse.json({ template: updatedTemplate }, { status: 200 });
  } catch (error) {
    console.error('Error updating template:', error);
    return NextResponse.json(
      { error: 'Failed to update template' },
      { status: 500 }
    );
  }
}

// DELETE /api/playground/templates/[templateId] - Delete template
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ templateId: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const { templateId } = await params;
    const template = await Template.findById(templateId);

    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    // Only owner can delete
    if (template.userId !== session.user.email) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    await Template.findByIdAndDelete(templateId);

    return NextResponse.json(
      { message: 'Template deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting template:', error);
    return NextResponse.json(
      { error: 'Failed to delete template' },
      { status: 500 }
    );
  }
}
