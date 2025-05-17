# SendGrid Email Setup Guide

## Overview
This guide explains how to set up SendGrid for the email functionality on page 5 of the FACE AUDIT™ application.

## Steps to Configure SendGrid

### 1. Create a SendGrid Account
- Go to [SendGrid's website](https://sendgrid.com/) and sign up for an account if you don't have one already
- Verify your account and complete the setup process

### 2. Create an API Key
- In your SendGrid dashboard, navigate to Settings > API Keys
- Click "Create API Key"
- Name your key (e.g., "FACE AUDIT Email")
- Select "Full Access" or "Restricted Access" with at least "Mail Send" permissions
- Copy the generated API key (you'll only see it once!)

### 3. Verify a Sender Identity
- In your SendGrid dashboard, navigate to Settings > Sender Authentication
- Follow the steps to verify either a Single Sender or a Domain
- This email address will be used as the "from" address for all emails sent

### 4. Configure Environment Variables
- Create a `.env.local` file in the root directory of your project
- Add the following variables:

```
SENDGRID_API_KEY=your_api_key_here
SENDGRID_FROM_EMAIL=your_verified_email@example.com
```

### 5. Testing
- Restart your development server after adding the environment variables
- Go to page 5 (email page) and test the email functionality
- Check the console logs for any errors

## Troubleshooting
- If emails aren't being sent, check the console logs for error messages
- Verify that your SendGrid API key has the correct permissions
- Make sure your sender email is properly verified in SendGrid
- Check if your account is in a trial period with sending limitations

## Notes
- For production, consider using environment variables in your hosting platform instead of a local file
- SendGrid's free tier has limitations on the number of emails you can send per day
