import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const leadsFilePath = path.join(process.cwd(), 'leads.json');
    let leads = [];

    if (fs.existsSync(leadsFilePath)) {
      const fileContent = fs.readFileSync(leadsFilePath, 'utf8');
      leads = JSON.parse(fileContent || '[]');
    }

    return NextResponse.json({ leads });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to read leads.';
    console.error('Leads API Error:', err);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

