import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// POST /api/playground/reports/:threadId/compress-context
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ threadId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { threadId } = await params;
    const { currentContent } = await request.json();

    if (!currentContent) {
      return NextResponse.json(
        { error: 'currentContent is required' },
        { status: 400 }
      );
    }

    // Find thread and verify ownership
    const thread = await prisma.threads.findUnique({
      where: { id: threadId },
    });

    if (!thread) {
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 });
    }

    if (thread.userId !== session.user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Use Claude to compress the content
    const compressionPrompt = `You are an expert at compressing and summarizing report content while preserving all critical information.

Your task is to compress the following report while maintaining:
1. All key findings, insights, and recommendations
2. Important data points and metrics
3. Critical analysis and conclusions
4. Structural organization and flow

Remove:
1. Redundant explanations
2. Verbose sections that can be condensed
3. Repetitive data
4. Unnecessary formatting details

Provide the compressed version in the same markdown format as the input.

Here is the report to compress:

${currentContent}

Compressed version:`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: compressionPrompt,
        },
      ],
    });

    const compressedContent =
      message.content[0].type === 'text' ? message.content[0].text : '';

    // Estimate token counts (rough estimate: 1 token ≈ 4 characters)
    const originalTokens = Math.ceil(currentContent.length / 4);
    const newTokenCount = Math.ceil(compressedContent.length / 4);

    return NextResponse.json(
      {
        compressedContent,
        originalTokens,
        newTokenCount,
        compressionRatio: Math.round(
          ((originalTokens - newTokenCount) / originalTokens) * 100
        ),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error compressing report context:', error);
    return NextResponse.json(
      { error: 'Failed to compress context' },
      { status: 500 }
    );
  }
}
