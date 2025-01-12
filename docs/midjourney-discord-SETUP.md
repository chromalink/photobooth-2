# Midjourney Discord Integration Setup Guide

This guide walks through the complete setup process for integrating Midjourney through Discord's API.

## Prerequisites

1. **Midjourney Subscription**
   - Active Midjourney subscription (Basic $10/month plan is sufficient)
   - Midjourney bot already active in your Discord account

2. **Discord Server**
   - Your own Discord server (create one if needed)
   - Admin permissions on the server

## Step-by-Step Setup

### 1. Discord Server Setup

1. Create a new channel for Midjourney (or use existing):
   - Right-click in channels list → Create Channel
   - Name it something like "midjourney-api"
   - Keep it private if you want to limit access

2. Get Server and Channel IDs:
   - Enable Developer Mode in Discord (User Settings → App Settings → Advanced → Developer Mode)
   - Right-click server name → Copy Server ID
   - Right-click channel → Copy Channel ID
   - Save these IDs for later use in `.env.local`

### 2. Getting Your Discord User Token

1. **IMPORTANT**: User tokens provide full access to your Discord account. Handle with extreme care and never share them.

2. To get your user token:
   - Open Discord in your web browser
   - Press F12 to open Developer Tools
   - Go to the Network tab
   - In Discord, send a message or perform any action
   - Look for a request to Discord's API
   - Find the 'Authorization' header in the request
   - This is your user token

### 3. Environment Setup

1. Add these variables to `.env.local`:
   ```env
   DISCORD_SERVER_ID=your-server-id
   DISCORD_CHANNEL_ID=your-channel-id
   DISCORD_TOKEN=your-user-token  # Note: This is your user token, not a bot token
   ```

## Technical Implementation Details

Our implementation uses Discord's Interactions API to send slash commands to the Midjourney bot. Here's how it works:

1. **Command Structure**: 
   - We use type 2 (APPLICATION_COMMAND) interactions
   - The command targets Midjourney's application ID: '936929561302675456'
   - We dynamically fetch the latest command version to ensure compatibility

2. **Authentication**:
   - We use a user token instead of a bot token
   - This allows us to simulate a real user interaction with Midjourney
   - The token is sent in the Authorization header without any "Bot" prefix

3. **API Endpoints**:
   - Main endpoint: `https://discord.com/api/v10/interactions`
   - We also use the application commands search endpoint to get the latest command version

4. **Error Handling**:
   - The system automatically fetches the latest command version to prevent "outdated" errors
   - Detailed error logging helps diagnose any issues with the Discord API

## Security Notes

1. **CRITICAL**: Keep your user token secure
   - Never commit it to git
   - Reset your token if it ever gets exposed
   - Consider using environment-specific tokens for different deployments

2. **Access Control**:
   - Keep your Discord channel private if processing sensitive images
   - Monitor your Midjourney usage to stay within plan limits
   - Regularly audit who has access to your Discord server

## Troubleshooting

1. If you get "outdated" errors:
   - The system should automatically fetch the latest command version
   - Check the logs for any specific error messages
   - Verify that your user token has the necessary permissions

2. If commands fail to send:
   - Verify your user token is correct and not expired
   - Check that Midjourney bot is in your server and channel
   - Ensure your Discord account has permission to use Midjourney

3. If you get rate limit errors:
   - Implement appropriate rate limiting in your application
   - Consider upgrading your Midjourney subscription if needed
   - Add delay between consecutive requests

## Best Practices

1. **Error Handling**:
   - Implement robust error handling for API responses
   - Log relevant error information for debugging
   - Handle rate limits appropriately

2. **Security**:
   - Store tokens securely using environment variables
   - Implement proper access control in your application
   - Regular security audits of token usage

3. **Maintenance**:
   - Keep track of Discord API changes
   - Monitor Midjourney's status and updates
   - Regular testing of the integration
