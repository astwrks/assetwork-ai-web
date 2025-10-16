import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db/prisma';
import { randomUUID } from 'crypto';

// POST /api/playground/templates/[templateId]/use - Create a thread from template
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ templateId: string }> }
) {
  try {
    const { templateId } = await params;
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find the template
    const template = await prisma.templates.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    // Check if user has access
    const hasAccess =
      template.isPublic || template.userId === session.user.email;

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Access denied to this template' },
        { status: 403 }
      );
    }

    // TODO: Check if template is premium and user has subscription
    // For now, we'll allow all templates
    if (template.isPremium) {
      // This is where you'd check subscription status
      console.log('⚠️ Premium template access - subscription check needed');
      // const hasSubscription = await checkUserSubscription(session.user.email, template.tier);
      // if (!hasSubscription) {
      //   return NextResponse.json(
      //     { error: 'Premium subscription required', tier: template.tier },
      //     { status: 402 }
      //   );
      // }
    }

    const body = await request.json();
    const { customTitle } = body;

    // Create new thread from template
    const thread = await prisma.threads.create({
      data: {
        id: randomUUID(),
        userId: session.user.email,
        title: customTitle || `${template.name} - ${new Date().toLocaleDateString()}`,
        description: template.description || 'Report created from template',
        status: 'ACTIVE',
        isTemplate: false, // The thread is not a template, just created from one
        templateName: template.name,
        templateDescription: template.description,
        reportVersions: [],
        sharedWith: [],
        metadata: {
          sourceTemplateId: templateId,
          templateStructure: template.structure,
          basePrompt: template.basePrompt,
        },
        updatedAt: new Date(),
      },
    });

    // Increment template usage count
    await prisma.templates.update({
      where: { id: templateId },
      data: {
        usageCount: { increment: 1 },
      },
    });

    console.log(`✅ Thread created from template: ${template.name}`);

    return NextResponse.json(
      {
        thread,
        template: {
          name: template.name,
          icon: template.icon,
          structure: template.structure,
          basePrompt: template.basePrompt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating thread from template:', error);
    return NextResponse.json(
      { error: 'Failed to create thread from template' },
      { status: 500 }
    );
  }
}
