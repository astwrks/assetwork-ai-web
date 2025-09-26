// api/proxy/widget-preview/route.ts - Proxy for widget preview URLs to avoid CORS
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const widgetUrl = searchParams.get('url');
  
  if (!widgetUrl) {
    return new Response('Missing widget URL parameter', { status: 400 });
  }

  try {
    console.log('🖼️ Proxying widget preview:', widgetUrl);
    
    // Validate that URL is from AssetWorks domain for security
    if (!widgetUrl.startsWith('https://widgets.assetworks.ai/')) {
      return new Response('Invalid widget URL domain', { status: 400 });
    }

    const response = await fetch(widgetUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'AssetWorks-Web-Client/1.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
      },
    });

    if (!response.ok) {
      console.error('🚫 Widget preview fetch failed:', response.status, response.statusText);
      return new Response(`Failed to fetch widget: ${response.status}`, { 
        status: response.status 
      });
    }

    const content = await response.text();
    
    console.log('✅ Widget preview proxied successfully');
    
    // Return HTML with proper headers for iframe display
    return new Response(content, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=300', // 5 minute cache
        'X-Frame-Options': 'SAMEORIGIN',
        'Access-Control-Allow-Origin': '*',
      },
    });

  } catch (error: any) {
    console.error('💥 Widget preview proxy error:', error.message);
    
    return new Response(
      `<html><body style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:system-ui;color:#666;text-align:center;">
        <div>
          <div style="font-size:24px;margin-bottom:8px;">⚠️</div>
          <div>Preview temporarily unavailable</div>
          <div style="font-size:12px;margin-top:4px;">Error loading widget content</div>
        </div>
      </body></html>`,
      { 
        status: 200,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
        }
      }
    );
  }
}