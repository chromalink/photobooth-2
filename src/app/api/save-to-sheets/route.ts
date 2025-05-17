import { NextResponse } from 'next/server';
import { google } from 'googleapis';

// Configure Google Sheets API
const configureGoogleSheets = () => {
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  
  if (!privateKey || !process.env.GOOGLE_CLIENT_EMAIL || !process.env.GOOGLE_SHEETS_ID) {
    throw new Error('Google Sheets credentials missing in environment variables');
  }

  const auth = new google.auth.JWT(
    process.env.GOOGLE_CLIENT_EMAIL,
    undefined,
    privateKey,
    ['https://www.googleapis.com/auth/spreadsheets']
  );

  const sheets = google.sheets({ version: 'v4', auth });
  return { sheets, spreadsheetId: process.env.GOOGLE_SHEETS_ID };
};

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { fullName, email, category } = data;

    if (!fullName || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      );
    }

    // Configure Google Sheets
    const { sheets, spreadsheetId } = configureGoogleSheets();

    // Format data for Google Sheets - only name and email
    const values = [[fullName, email]];

    // Append data to the sheet
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Sheet1!A:B', // Assumes columns A=Name, B=Email
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving to Google Sheets:', error);
    return NextResponse.json(
      { error: 'Failed to save data to Google Sheets' },
      { status: 500 }
    );
  }
}
