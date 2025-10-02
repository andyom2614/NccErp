# Google Sheets API Setup Guide

## Step 1: Enable Google Sheets API

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/
   - Sign in with your Google account

2. **Create or Select a Project**
   - If you don't have a project, click "Create Project"
   - Name it something like "NCC-ERP-WhatsApp"
   - If you already have a project, select it

3. **Enable Google Sheets API**
   - In the left sidebar, go to "APIs & Services" → "Library"
   - Search for "Google Sheets API"
   - Click on it and press "Enable"

## Step 2: Create API Credentials

1. **Create API Key**
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "API Key"
   - Copy the generated API key
   - **Important**: Restrict the API key to Google Sheets API only for security

2. **Add API Key to Environment**
   - Open your `.env` file
   - Replace `your_google_api_key_here` with your actual API key:
   ```
   VITE_GOOGLE_SHEETS_API_KEY=AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

## Step 3: Prepare Your Spreadsheet

1. **Make Spreadsheet Public**
   - Open your Google Sheets: https://docs.google.com/spreadsheets/d/1YsUkgoJMQvmcSENjWoP30jl_qbpv8JYJTigIjyi15S0/edit
   - Click the "Share" button (top-right)
   - Click "Change to anyone with the link"
   - Set permission to "Viewer"
   - Click "Done"

2. **Verify Spreadsheet Format**
   Your spreadsheet should have these columns in order:
   ```
   A: Name          B: Rank        C: Email                D: WhatsApp Number
   Lt. Rajesh Kumar Lieutenant     rajesh@college1.edu     +91-9876543210
   Capt. Priya Singh Captain       priya@college2.edu      +91-9876543211
   Maj. Arjun Patel  Major         arjun@college3.edu      +91-9876543212
   ```

## Step 4: Test the Integration

1. **Restart Development Server**
   ```bash
   npm run dev
   ```

2. **Test Connection**
   - Log in as Admin
   - Go to "Test API Connection" in the sidebar
   - Click "Test Connection"
   - Verify you can see your ANO contacts

## Step 5: Create Camp Notification

1. **Go to Camp Notifications** (as Clerk/CO)
2. **Create a new notification** with:
   - Camp Title: Test Camp
   - Reporting Date & Time
   - Venue: Test Venue
   - Assign vacancies to colleges
   - Send To: "ANOs Only"
3. **Submit** - WhatsApp messages should be sent automatically

## Troubleshooting

### Common Issues:

**"Google Sheets API access denied"**
- Check if API is enabled in Google Cloud Console
- Verify API key is correct in .env file
- Make sure spreadsheet is publicly accessible

**"No data found in Google Sheets"**
- Check spreadsheet URL and ID
- Verify spreadsheet has data in correct format
- Check if first row is treated as header

**"Missing configuration"**
- Restart development server after adding .env variables
- Verify all environment variables are set correctly

### API Key Security:

1. **Restrict your API Key**
   - In Google Cloud Console, go to Credentials
   - Click on your API key
   - Under "API restrictions", select "Restrict key"
   - Choose "Google Sheets API" only

2. **HTTP referrers** (for production):
   - Add your domain to "Website restrictions"
   - Example: `https://yourdomain.com/*`

## Expected Data Flow

1. **Clerk creates camp notification** with "ANOs Only" selected
2. **System gets college IDs** with assigned vacancies  
3. **System fetches ANO emails** from college assignments in Firestore
4. **System calls Google Sheets API** to get ANO contact details
5. **System matches emails** from Firestore with Google Sheets data
6. **System sends WhatsApp messages** via Twilio to matched ANOs

## Spreadsheet Requirements

- **Column A (Name)**: Full name with rank (e.g., "Lt. Rajesh Kumar")
- **Column B (Rank)**: Military rank only (e.g., "Lieutenant") 
- **Column C (Email)**: Must match exactly with user emails in Firestore
- **Column D (WhatsApp Number)**: Include country code (e.g., "+91-9876543210")

## Testing Checklist

- [ ] Google Cloud project created
- [ ] Google Sheets API enabled
- [ ] API key generated and added to .env
- [ ] Spreadsheet made public
- [ ] Spreadsheet format correct
- [ ] Test API connection successful
- [ ] Twilio WhatsApp sandbox joined
- [ ] Test camp notification created
- [ ] WhatsApp message received

## Production Considerations

1. **Use Service Account** instead of API key for production
2. **Implement caching** to reduce API calls
3. **Add rate limiting** to prevent API quota exhaustion
4. **Set up monitoring** for failed API calls
5. **Backup ANO data** in case spreadsheet is unavailable