# WhatsApp Integration Setup Guide

## Twilio WhatsApp Setup

### 1. Create Twilio Account
1. Go to [Twilio Console](https://console.twilio.com/)
2. Sign up for a free account or log in to existing account
3. Navigate to the Dashboard

### 2. Get Account Credentials
1. From your Twilio Dashboard, note down:
   - **Account SID** (starts with AC...)
   - **Auth Token** (click to reveal)

### 3. Set up WhatsApp Sandbox (For Development)
1. In Twilio Console, go to **Messaging** → **Try it out** → **Send a WhatsApp message**
2. Follow the sandbox setup instructions
3. Send the join message from your WhatsApp to the sandbox number
4. Note down the **WhatsApp Sandbox Number** (format: +1 415 523 8886)

### 4. Configure Environment Variables
1. Copy `.env.example` to `.env`
2. Fill in your Twilio credentials:
   ```
   VITE_TWILIO_ACCOUNT_SID=your_account_sid_here
   VITE_TWILIO_AUTH_TOKEN=your_auth_token_here  
   VITE_TWILIO_WHATSAPP_NUMBER=+14155238886
   ```

### 5. Production Setup (Later)
For production, you'll need to:
1. Apply for WhatsApp Business API approval
2. Get your own WhatsApp Business phone number
3. Update the environment variables with production credentials

## Spreadsheet Integration

Currently using mock data in `whatsappService.ts`. To integrate with Google Sheets:

### Option 1: Google Sheets API
1. Enable Google Sheets API in Google Cloud Console
2. Create service account credentials
3. Share your spreadsheet with the service account email
4. Update `getAnoDataFromSpreadsheet()` function to use Google Sheets API

### Option 2: CSV Upload
1. Export your spreadsheet as CSV
2. Create an upload interface in the admin panel
3. Parse and store ANO data in Firestore

## Expected Spreadsheet Format

Your spreadsheet should contain the following columns:
- **Name**: Full name of ANO (e.g., "Lt. Rajesh Kumar")
- **Rank**: Military rank (e.g., "Lieutenant", "Captain", "Major")
- **WhatsApp Number**: Phone number with country code (e.g., "+91-9876543210")
- **Email**: Email address (must match the email in user accounts)

## Message Template

The WhatsApp message will be formatted as:
```
🪖 NCC CAMP NOTIFICATION 🪖

Dear [Rank] [Name],

You have received a new camp notification:

📅 Camp: [Camp Title]
📝 Description: [Description]
📍 Venue: [Venue]
🗓️ Reporting Date: [Date]
⏰ Reporting Time: [Time]

👤 Sent by: [Creator Email]

Please check your NCC ERP portal for complete details.

Best Regards,
NCC ERP System
```

## Testing

1. Make sure you've joined the Twilio WhatsApp sandbox
2. Create a test camp notification with "ANOs Only" selected
3. Check your WhatsApp for the notification message

## Troubleshooting

### Common Issues:
1. **Environment variables not loaded**: Restart the development server after adding .env file
2. **WhatsApp not received**: Check if you've joined the sandbox and the phone number format is correct
3. **API errors**: Verify Twilio credentials and account status

### Error Messages:
- "Twilio configuration missing": Check your .env file
- "No ANO contacts found": Verify ANO data and email matching
- "Failed to send WhatsApp message": Check Twilio account balance and sandbox status