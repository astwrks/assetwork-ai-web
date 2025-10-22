import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { type, sectionTitle, sectionContent, position } = await request.json();

    let prompt = '';

    if (type === 'edit') {
      // Generate edit suggestions based on section content
      prompt = `You are helping a user edit a financial report section. Based on the section below, generate 5 concise, actionable suggestions for how they might want to modify it.

Section Title: ${sectionTitle}
Section Content (preview): ${sectionContent}

Generate suggestions that are:
1. Specific and actionable (e.g., "Add Q3 2024 revenue data" not "Update data")
2. Varied in nature (data updates, visualization changes, formatting, analysis depth, comparisons)
3. Relevant to financial reporting
4. 5-12 words each

Return ONLY a JSON array of 5 suggestion strings, nothing else. Format: ["suggestion 1", "suggestion 2", ...]`;
    } else {
      // Generate suggestions for adding new sections
      prompt = `You are helping a user add a new section to their financial report at position ${position || 'end'}.

Generate 5 concise, specific suggestions for what kind of financial section they might want to add.

Generate suggestions that are:
1. Specific and descriptive (e.g., "Add quarterly revenue comparison bar chart" not "Add chart")
2. Varied (charts, tables, metrics, analysis, forecasts)
3. Relevant to financial reporting
4. 6-15 words each

Return ONLY a JSON array of 5 suggestion strings, nothing else. Format: ["suggestion 1", "suggestion 2", ...]`;
    }

    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 500,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const content = message.content[0];
    if (content.type === 'text') {
      try {
        // Parse the JSON array from the response
        const suggestions = JSON.parse(content.text);

        if (Array.isArray(suggestions) && suggestions.length > 0) {
          return NextResponse.json({
            suggestions: suggestions.slice(0, 5), // Ensure max 5 suggestions
          });
        }
      } catch (parseError) {
        console.error('Error parsing suggestions:', parseError);
      }
    }

    // Fallback suggestions if parsing fails
    const fallbackSuggestions = type === 'edit'
      ? [
          'Add the latest quarter data',
          'Change visualization to bar chart',
          'Highlight key numbers in bold',
          'Include percentage changes',
          'Add trend indicators',
        ]
      : [
          'Add bar chart comparing revenue trends',
          'Create table showing top 5 expenses',
          'Show key financial metrics dashboard',
          'Add year-over-year growth comparison',
          'Include cash flow analysis section',
        ];

    return NextResponse.json({ suggestions: fallbackSuggestions });
  } catch (error) {
    console.error('Error generating suggestions:', error);

    // Return fallback suggestions on error
    const fallbackSuggestions = [
      'Add the latest quarter data',
      'Update visualization style',
      'Include comparison metrics',
      'Add trend analysis',
      'Highlight key insights',
    ];

    return NextResponse.json({ suggestions: fallbackSuggestions });
  }
}
