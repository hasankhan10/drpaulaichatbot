import { NextRequest, NextResponse } from 'next/server';

interface Lead {
  name: string;
  age: string;
  number: string;
  concern: string;
}

export async function POST(req: NextRequest) {
  try {
    const { name, age, number, concern } = await req.json();

    // Validate critical inputs
    if (!name || !number) {
      return NextResponse.json(
        { error: 'Name and Mobile Number are required to book an appointment.' },
        { status: 400 }
      );
    }

    const newLead: Lead = {
      name: name.trim(),
      age: age ? age.toString().trim() : 'N/A',
      number: number.trim(),
      concern: concern ? concern.trim() : 'N/A',
    };

    const sheetsWebhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL;
    if (!sheetsWebhookUrl) {
      console.warn('Google Sheets Webhook URL is not configured in environment variables.');
      // Failsafe in case webhook is temporarily unset, still simulate successful form transition
      return NextResponse.json({ 
        success: true, 
        lead: newLead, 
        warning: 'Google Sheets webhook URL is not configured.' 
      });
    }

    // Forward the lead to Google Sheets webhook synchronously
    const response = await fetch(sheetsWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newLead),
    });

    if (!response.ok) {
      console.error('Google Sheet Webhook returned non-ok response:', response.status);
      return NextResponse.json(
        { error: 'Failed to synchronize booking data to our system. Please try again.' },
        { status: 502 }
      );
    }

    console.log('Successfully synchronized lead row to Google Sheet:', newLead);
    return NextResponse.json({ success: true, lead: newLead });

  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'An error occurred while booking.';
    console.error('Booking API Error:', err);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
