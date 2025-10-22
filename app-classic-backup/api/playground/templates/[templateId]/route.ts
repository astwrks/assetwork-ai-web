import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db/prisma';

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

    const { templateId } = await params;
    const template = await prisma.templates.findUnique({
      where: { id: templateId },
    });

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

    const { templateId } = await params;
    const template = await prisma.templates.findUnique({
      where: { id: templateId },
    });

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
    const updateData: any = {
      updatedAt: new Date(),
    };

    // Add fields if provided
    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.category !== undefined) updateData.category = body.category;
    if (body.tags !== undefined) updateData.tags = body.tags;
    if (body.structure !== undefined) updateData.structure = body.structure;
    if (body.basePrompt !== undefined) updateData.basePrompt = body.basePrompt;
    if (body.isPublic !== undefined) updateData.isPublic = body.isPublic;
    if (body.isPremium !== undefined) updateData.isPremium = body.isPremium;
    if (body.tier !== undefined) updateData.tier = body.tier.toUpperCase();
    if (body.icon !== undefined) updateData.icon = body.icon;
    if (body.previewImageUrl !== undefined) updateData.previewImageUrl = body.previewImageUrl;

    const updatedTemplate = await prisma.templates.update({
      where: { id: templateId },
      data: updateData,
    });

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

    const { templateId } = await params;
    const template = await prisma.templates.findUnique({
      where: { id: templateId },
    });

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

    await prisma.templates.delete({
      where: { id: templateId },
    });

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
