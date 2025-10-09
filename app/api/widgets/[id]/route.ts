import { NextRequest, NextResponse } from 'next/server';
import { widgetStorageService } from '@/lib/services/widget-storage.service';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: widgetId } = await params;
  
  // For server-side, we'll return a placeholder response
  // In production, this would connect to a database
  const widget = widgetStorageService.getWidget(widgetId);
  
  if (!widget) {
    return NextResponse.json(
      { error: 'Widget not found' },
      { status: 404 }
    );
  }
  
  return NextResponse.json(widget);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: widgetId } = await params;
  const updates = await request.json();
  
  const updatedWidget = widgetStorageService.updateWidget(widgetId, updates);
  
  if (!updatedWidget) {
    return NextResponse.json(
      { error: 'Widget not found' },
      { status: 404 }
    );
  }
  
  return NextResponse.json(updatedWidget);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: widgetId } = await params;
  
  const deleted = widgetStorageService.deleteWidget(widgetId);
  
  if (!deleted) {
    return NextResponse.json(
      { error: 'Widget not found' },
      { status: 404 }
    );
  }
  
  return NextResponse.json({ success: true });
}