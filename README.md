# SchoolConnect Bulk Messaging Platform

A simple messaging application that allows schools to send bulk WhatsApp and SMS messages to contacts imported from Excel files.

## Features

- Import contacts from Excel files (.xlsx, .xls, .csv)
- Send bulk messages via WhatsApp (using Meta's WhatsApp Business API)
- Send bulk messages via SMS (using Twilio)
- Message history tracking
- Contact management with filtering and searching
- Support for message templates

## Setup and Installation

### Running the Simple Version

1. Install Node.js and npm if you haven't already
2. Clone this repository
3. Install dependencies:
   ```
   npm install express node-fetch@2
   ```
4. Start the server:
   ```
   node server.js
   ```
5. Open your browser and navigate to `http://localhost:3000`

### Setting Up API Credentials

#### WhatsApp Business API (Meta)

1. Sign up for a Meta Developer account
2. Create a Meta app and add WhatsApp product
3. Get your Phone Number ID and API key
4. Enter these credentials in the Settings tab of the application

#### Twilio SMS API

1. Sign up for a Twilio account
2. Get your Account SID, Auth Token, and Twilio phone number
3. Enter these credentials in the Settings tab of the application

### Environment Variables (Optional)

You can set the following environment variables:

- `TWILIO_ACCOUNT_SID` - Your Twilio Account SID
- `TWILIO_AUTH_TOKEN` - Your Twilio Auth Token
- `TWILIO_PHONE_NUMBER` - Your Twilio Phone Number

## Using the Application

1. **Import Contacts**: 
   - Go to the "Send Messages" tab
   - Upload an Excel file with contact information
   - The application automatically detects columns for names and phone numbers

2. **Compose Message**: 
   - Enter your message text
   - Select WhatsApp or SMS as the delivery channel
   - Choose which contacts to send to

3. **Send Message**:
   - Click the Send button
   - Monitor sending progress
   - View delivery status in the History tab

## Troubleshooting

- **CORS Issues**: The application handles CORS by providing a server-side proxy for API calls
- **Phone Number Format**: Ensure phone numbers are in international format (e.g., +1234567890)
- **API Credentials**: Verify your API credentials in the Settings tab

## License

This project is available for personal and educational use.