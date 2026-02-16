# Meal Planning System - Setup Guide

## Step 1: Open Apps Script Editor (2 minutes)

1. Open your Google Sheet: https://docs.google.com/spreadsheets/d/1E-PbqnCHd65GkKB7Bnc6Fp1mEAHDFH5zJ1D22VBIquM
2. Go to **Extensions > Apps Script**
3. Delete any existing code in `Code.gs`
4. Copy-paste the ENTIRE contents of `Code.gs` from this folder
5. Click **Save** (Ctrl+S)
6. Close the Apps Script editor tab

## Step 2: Run Initial Setup (1 minute)

1. Go back to your Google Sheet
2. **Refresh the page** (F5) - wait for the "Meal Planner" menu to appear in the menu bar
3. Click **Meal Planner > Initial Setup (Run Once)**
4. It will ask for permissions - click **Advanced > Go to (project name) > Allow**
5. Wait for the setup to complete - it will create 5 sheets:
   - **Meal DB** - 35 dishes with Hindi instructions
   - **Weekly Plan** - Auto-generated Mon-Sat plan
   - **Grocery List** - Auto-calculated from the plan
   - **Waste Counter** - Tracks who wastes food
   - **Attendance Log** - Records opt-in/opt-out history

## Step 3: Review Your First Week (2 minutes)

1. Go to the **Weekly Plan** sheet
2. Check the dishes assigned for each day
3. **To swap a dish**: Just change the dish name in column D to any dish from the Meal DB
4. Member columns (Devansh/Puneeth/Ron/Eshaan) default to "IN"
5. Change to "OUT" if someone won't eat - headcount auto-updates

## Step 4: Setup WhatsApp Integration

See `WHATSAPP_SETUP.md` for detailed instructions.

Quick summary:
- Sign up for Twilio (free trial: $15 credit)
- Get WhatsApp sandbox number
- Add all members + cook to the sandbox
- Update CONFIG in Code.gs with your Twilio credentials

## Step 5: Enable Automation

1. Click **Meal Planner > Setup Weekly Triggers**
2. This sets up:
   - **Sunday 8 AM**: Auto-generates next week's meal plan
   - **Daily 10 PM**: Posts next day's lunch to WhatsApp group
   - **Daily 1 PM**: Posts today's dinner to WhatsApp group
   - **Daily 2:30 PM**: Posts "did everyone eat lunch?" check
   - **Daily 10:15 PM**: Posts "did everyone eat dinner?" check

## How It Works Weekly

### Sunday (your only 2-min effort)
- Plan auto-generates at 8 AM
- Open the Weekly Plan sheet on your phone
- Swap any dishes you don't like
- Done!

### Monday-Saturday (zero effort if everyone eats)
- 10 PM night before: Cook gets tomorrow's lunch in WhatsApp
- If someone won't eat lunch, they change their cell to "OUT" before morning
- 1 PM: Cook gets tonight's dinner in WhatsApp
- If someone won't eat dinner, they change their cell to "OUT"
- 2:30 PM: Bot asks "sab ne lunch khaya?"
- 10:15 PM: Bot asks "sab ne dinner khaya?"

### Logging waste
- When someone reports waste in WhatsApp, go to:
  - **Meal Planner > Log Waste Entry** in the sheet (we'll add this menu item)
  - OR the Waste Counter sheet updates automatically

## Adding New Dishes

1. Go to the **Meal DB** sheet
2. Add a new row at the bottom
3. Fill in: Name, Hindi Name, Category (veg/non-veg/egg), Meal Type (lunch/dinner/both), etc.
4. Set Active = YES
5. The dish will be included in future weekly plans

## Editing the Meal DB

- Set Active = NO to temporarily remove a dish from rotation
- Edit Hindi Instructions to adjust cooking notes for your cook
- The "Last Served" column auto-updates to prevent repeats
