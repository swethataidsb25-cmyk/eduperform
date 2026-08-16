import { NextRequest, NextResponse } from 'next/server';
import { getChatCompletion } from '@/lib/ai/chatCompletion';
import { getStudentDataForAnalysis, buildAnalysisPrompt, saveAIReport } from '@/lib/services/aiAnalysisService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { studentIds } = body as { studentIds: string[] };

    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return NextResponse.json({ error: 'studentIds array is required' }, { status: 400 });
    }

    const results = [];
    let saved = 0;
    let errors = 0;

    for (const studentId of studentIds) {
      try {
        // Fetch student performance data
        const studentData = await getStudentDataForAnalysis(studentId);
        if (!studentData) {
          errors++;
          results.push({ studentId, error: 'Student not found' });
          continue;
        }

        // Build prompt and call OpenAI
        const prompt = buildAnalysisPrompt(studentData);

        const response = await getChatCompletion(
          'OPEN_AI',
          'gpt-4o-mini',
          [
            {
              role: 'system',
              content:
                'You are an expert educational data analyst. Always respond with valid JSON only.',
            },
            { role: 'user', content: prompt },
          ],
          {
            max_completion_tokens: 800,
            temperature: 0.3,
          }
        );

        const rawContent = response?.choices?.[0]?.message?.content ?? '';

        let parsed: {
          strengths: string;
          weaknesses: string;
          recommendations: string;
          riskLevel: 'low' | 'medium' | 'high';
        };

        try {
          // Strip markdown code fences if present
          const cleaned = rawContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
          parsed = JSON.parse(cleaned);
        } catch {
          errors++;
          results.push({ studentId, studentName: studentData.studentName, error: 'Failed to parse AI response' });
          continue;
        }

        // Save to ai_reports table
        const savedToDb = await saveAIReport(
          studentId,
          parsed.strengths ?? '',
          parsed.weaknesses ?? '',
          parsed.recommendations ?? ''
        );

        if (savedToDb) saved++;

        results.push({
          studentId,
          studentName: studentData.studentName,
          strengths: parsed.strengths,
          weaknesses: parsed.weaknesses,
          recommendations: parsed.recommendations,
          riskLevel: parsed.riskLevel,
          savedToDb,
        });
      } catch (err: any) {
        errors++;
        results.push({ studentId, error: err.message ?? 'Unknown error' });
      }
    }

    return NextResponse.json({
      processed: studentIds.length,
      saved,
      errors,
      results,
    });
  } catch (err: any) {
    console.error('analyze-students route error:', err);
    return NextResponse.json({ error: err.message ?? 'Internal server error' }, { status: 500 });
  }
}
