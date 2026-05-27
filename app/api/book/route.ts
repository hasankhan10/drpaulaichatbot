import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

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

    const leadsFilePath = path.join(process.cwd(), 'leads.json');
    let currentLeads: Lead[] = [];

    // 1. Read existing leads
    if (fs.existsSync(leadsFilePath)) {
      try {
        const fileContent = fs.readFileSync(leadsFilePath, 'utf8');
        currentLeads = JSON.parse(fileContent || '[]');
      } catch (err) {
        console.error('Error reading leads.json:', err);
      }
    }

    const newLead: Lead = {
      name: name.trim(),
      age: age ? age.toString().trim() : 'N/A',
      number: number.trim(),
      concern: concern ? concern.trim() : 'N/A',
    };

    // 2. Prevent exact duplicate entries by checking mobile numbers
    const isDuplicate = currentLeads.some(
      (l) => l.number === newLead.number && l.name.toLowerCase() === newLead.name.toLowerCase()
    );

    if (!isDuplicate) {
      currentLeads.push(newLead);
      fs.writeFileSync(leadsFilePath, JSON.stringify(currentLeads, null, 2), 'utf8');
      console.log('Successfully recorded appointment lead via Inline Form:', newLead);

      // 3. Sync to Google Sheet in the background (non-blocking failsafe)
      const sheetsWebhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL;
      if (sheetsWebhookUrl) {
        fetch(sheetsWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newLead),
        })
          .then(async (response) => {
            if (!response.ok) {
              console.error('Google Sheet Webhook returned non-ok response:', response.status);
            } else {
              console.log('Successfully synchronized lead row to Google Sheet!');
            }
          })
          .catch((fetchErr) => {
            console.error('Failed to sync to Google Sheet webhook:', fetchErr);
          });
      }
    } else {
      console.log('Duplicate appointment lead ignored:', newLead.number);
    }

    return NextResponse.json({ success: true, lead: newLead });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'An error occurred while booking.';
    console.error('Booking API Error:', err);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
