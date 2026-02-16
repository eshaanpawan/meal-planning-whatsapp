# WhatsApp Setup — Green API (5 minutes)

## Step 1: Create Green API Account (1 min)
1. Go to https://console.green-api.com
2. Sign up with email
3. Free "Developer" plan works — 3 chats/month, unlimited messages

## Step 2: Create an Instance (1 min)
1. In the console, click "Create Instance"
2. Note down your:
   - **Instance ID** (e.g., `7103XXXXXX`)
   - **API Token** (long string)

## Step 3: Connect Your WhatsApp (1 min)
1. Click on your instance in the console
2. Click "QR" or scan QR code
3. Open WhatsApp on your phone > Settings > Linked Devices > Link a Device
4. Scan the QR code shown in the console
5. Wait for "Authorized" status

## Step 4: Get Your Group Chat ID (1 min)
1. First, create a WhatsApp group with your cook + housemates (if you haven't already)
2. In your Google Sheet, update the CONFIG with your Instance ID and Token:
   ```
   GREEN_API_INSTANCE_ID: '7103XXXXXX',
   GREEN_API_TOKEN: 'your-token-here',
   ```
3. Save the script, refresh the sheet
4. Click **Meal Planner > Find My WhatsApp Group ID**
5. It will show all your WhatsApp groups with their IDs
6. Copy the ID of your cook's group (looks like `120363XXXXXXXXXX@g.us`)

## Step 5: Update CONFIG (1 min)
In Apps Script, update the CONFIG:
```javascript
const CONFIG = {
  GREEN_API_INSTANCE_ID: '7103XXXXXX',      // Your instance ID
  GREEN_API_TOKEN: 'your-api-token-here',     // Your API token
  GREEN_API_URL: 'https://api.green-api.com', // Don't change
  WHATSAPP_GROUP_ID: '120363XXXXXXXXXX@g.us', // Your group ID
  // ... rest stays the same
};
```

## Step 6: Test It
1. Save the script
2. Click **Meal Planner > Send Test WhatsApp Message**
3. You should receive a test message in your WhatsApp group

## Done!
Now click **Meal Planner > Setup Weekly Triggers** to enable automatic daily messages.

## How It Works
- Uses your personal WhatsApp number (no business account needed)
- Messages go to your WhatsApp group directly
- Green API keeps your WhatsApp Web session active
- Free tier: 3 chats (your group counts as 1 chat), unlimited messages

## Troubleshooting
- **"Not authorized"**: Re-scan QR code in Green API console
- **No groups found**: Make sure WhatsApp is connected (check console status)
- **Message not received**: Check the group ID is correct (must end with @g.us)
- **Session disconnected**: Green API auto-reconnects, but check console if issues persist

## Cost
- Developer plan: FREE (3 chats/month = enough for 1 group)
- If you need more chats: Business plan at $12/month
