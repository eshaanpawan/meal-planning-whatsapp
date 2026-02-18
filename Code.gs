// ============================================================
// MEAL PLANNING SYSTEM - Complete Google Apps Script
// ============================================================
// Setup: Paste this into your Google Sheet's Apps Script editor
// It will auto-create all sheets and populate the meal database
// ============================================================

// ===================== CONFIGURATION ========================
const CONFIG = {
  // Green API WhatsApp settings (get from https://console.green-api.com)
  GREEN_API_INSTANCE_ID: 'YOUR_INSTANCE_ID',       // Get from https://console.green-api.com
  GREEN_API_TOKEN: 'YOUR_API_TOKEN',                 // Get from https://console.green-api.com
  GREEN_API_URL: 'https://api.green-api.com',
  WHATSAPP_GROUP_ID: 'YOUR_GROUP_ID@g.us',           // Use 'Find My WhatsApp Group ID' from menu

  MEMBERS: ['Devansh', 'Puneeth', 'Ron', 'Eshaan'],
  TOTAL_PEOPLE: 4,
  NON_VEG_TARGET: { min: 5, max: 6 }, // per week
  DAILY_BOILED_EGGS: { total: 10, Devansh: 4, Puneeth: 2, Ron: 2, Eshaan: 2 },
  DEVANSH_SALAD: 'gajar, kheera, tamatar',
  TIMEZONE: 'Asia/Kolkata'
};

// ===================== SETUP ================================
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('Meal Planner')
    .addItem('Initial Setup (Run Once)', 'initialSetup')
    .addSeparator()
    .addItem('Step 1: Generate Draft Plan', 'generateDraftPlan')
    .addItem('Step 2: Finalize Plan', 'finalizePlan')
    .addSeparator()
    .addItem('Recalculate Grocery List', 'calculateGroceryList')
    .addSeparator()
    .addItem('Send Today Lunch Now', 'sendTodayLunchNow')
    .addItem('Send Today Dinner Now', 'sendTodayDinnerNow')
    .addSeparator()
    .addItem('Send Test WhatsApp Message', 'sendTestMessage')
    .addItem('Find My WhatsApp Group ID', 'listWhatsAppGroups')
    .addSeparator()
    .addItem('Setup Weekly Triggers', 'setupTriggers')
    .addItem('Remove All Triggers', 'removeAllTriggers')
    .addToUi();
}

function initialSetup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // Create sheets
  createMealDBSheet(ss);
  createDraftPlanSheet(ss);
  createWeeklyPlanSheet(ss);
  createGroceryListSheet(ss);
  createAttendanceLogSheet(ss);

  // Populate meal DB
  populateMealDB(ss);

  // Generate first draft
  generateDraftPlan();

  SpreadsheetApp.getUi().alert('Setup complete! All sheets created.\n\nNow review the "Draft Plan" sheet, swap any dishes you don\'t like, then click:\nMeal Planner > Step 2: Finalize Plan');
}

// ===================== SHEET CREATORS =======================

function createDraftPlanSheet(ss) {
  let sheet = ss.getSheetByName('Draft Plan');
  if (!sheet) {
    sheet = ss.insertSheet('Draft Plan');
  } else {
    sheet.clear();
  }

  const headers = ['Date', 'Day', 'Lunch', 'Dinner'];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length)
    .setBackground('#4a148c')
    .setFontColor('white')
    .setFontWeight('bold')
    .setFontSize(11);
  sheet.setFrozenRows(1);

  // Column widths - keep it clean and simple
  sheet.setColumnWidth(1, 120);  // Date
  sheet.setColumnWidth(2, 100);  // Day
  sheet.setColumnWidth(3, 280);  // Lunch
  sheet.setColumnWidth(4, 280);  // Dinner

  // Instructions row
  sheet.getRange(8, 1, 1, 4).merge();
  sheet.getRange(8, 1).setValue('How to use: Swap any dish using the dropdown. Then go to Meal Planner > Step 2: Finalize Plan')
    .setFontStyle('italic')
    .setFontColor('#666666');

  return sheet;
}

function createMealDBSheet(ss) {
  let sheet = ss.getSheetByName('Meal DB');
  if (!sheet) {
    sheet = ss.insertSheet('Meal DB');
  } else {
    sheet.clear();
  }

  const headers = ['ID', 'Dish Name', 'Hindi Name', 'Category', 'Meal Type', 'Cuisine', 'Ingredients', 'Hindi Instructions', 'YouTube Link', 'Complexity', 'Last Served', 'Active'];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length)
    .setBackground('#1a73e8')
    .setFontColor('white')
    .setFontWeight('bold');
  sheet.setFrozenRows(1);

  // Set column widths
  sheet.setColumnWidth(1, 40);   // ID
  sheet.setColumnWidth(2, 200);  // Dish Name
  sheet.setColumnWidth(3, 200);  // Hindi Name
  sheet.setColumnWidth(4, 80);   // Category
  sheet.setColumnWidth(5, 80);   // Meal Type
  sheet.setColumnWidth(6, 100);  // Cuisine
  sheet.setColumnWidth(7, 300);  // Ingredients
  sheet.setColumnWidth(8, 400);  // Hindi Instructions
  sheet.setColumnWidth(9, 300);  // YouTube Link
  sheet.setColumnWidth(10, 80);  // Complexity
  sheet.setColumnWidth(11, 100); // Last Served
  sheet.setColumnWidth(12, 60);  // Active

  // Data validation for Category
  const categoryRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['veg', 'non-veg', 'egg'], true)
    .build();

  // Data validation for Meal Type
  const mealTypeRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['lunch', 'dinner', 'both'], true)
    .build();

  // Data validation for Active
  const activeRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['YES', 'NO'], true)
    .build();

  // Apply validations to rows 2-100
  sheet.getRange(2, 4, 99, 1).setDataValidation(categoryRule);
  sheet.getRange(2, 5, 99, 1).setDataValidation(mealTypeRule);
  sheet.getRange(2, 12, 99, 1).setDataValidation(activeRule);

  return sheet;
}

function createWeeklyPlanSheet(ss) {
  let sheet = ss.getSheetByName('Weekly Plan');
  if (!sheet) {
    sheet = ss.insertSheet('Weekly Plan');
  } else {
    sheet.clear();
  }

  const headers = [
    'Date', 'Day', 'Meal', 'Dish', 'YouTube Link',
    'Devansh', 'Puneeth', 'Ron', 'Eshaan', 'Headcount', 'Status'
  ];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length)
    .setBackground('#0d652d')
    .setFontColor('white')
    .setFontWeight('bold');
  sheet.setFrozenRows(1);

  // Column widths
  sheet.setColumnWidth(1, 100);  // Date
  sheet.setColumnWidth(2, 80);   // Day
  sheet.setColumnWidth(3, 60);   // Meal
  sheet.setColumnWidth(4, 250);  // Dish
  sheet.setColumnWidth(5, 300);  // YouTube Link
  sheet.setColumnWidth(6, 80);   // Devansh
  sheet.setColumnWidth(7, 80);   // Puneeth
  sheet.setColumnWidth(8, 60);   // Ron
  sheet.setColumnWidth(9, 70);   // Eshaan
  sheet.setColumnWidth(10, 80);  // Headcount
  sheet.setColumnWidth(11, 80);  // Status

  // Data validation for member attendance (columns 6-9)
  const attendanceRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['IN', 'OUT'], true)
    .build();

  for (let col = 6; col <= 9; col++) {
    sheet.getRange(2, col, 14, 1).setDataValidation(attendanceRule);
  }

  return sheet;
}

function createGroceryListSheet(ss) {
  let sheet = ss.getSheetByName('Grocery List');
  if (!sheet) {
    sheet = ss.insertSheet('Grocery List');
  } else {
    sheet.clear();
  }

  const headers = ['Item', 'Quantity', 'Category', 'For Dishes', 'Purchased'];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length)
    .setBackground('#e37400')
    .setFontColor('white')
    .setFontWeight('bold');
  sheet.setFrozenRows(1);

  sheet.setColumnWidth(1, 150);
  sheet.setColumnWidth(2, 100);
  sheet.setColumnWidth(3, 120);
  sheet.setColumnWidth(4, 300);
  sheet.setColumnWidth(5, 80);

  // Checkbox for purchased
  const checkboxRule = SpreadsheetApp.newDataValidation()
    .requireCheckbox()
    .build();
  sheet.getRange(2, 5, 100, 1).setDataValidation(checkboxRule);

  return sheet;
}

function createAttendanceLogSheet(ss) {
  let sheet = ss.getSheetByName('Attendance Log');
  if (!sheet) {
    sheet = ss.insertSheet('Attendance Log');
  } else {
    sheet.clear();
  }

  const headers = ['Date', 'Meal', 'Member', 'Status', 'Opted Out At', 'Actually Ate'];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length)
    .setBackground('#7b1fa2')
    .setFontColor('white')
    .setFontWeight('bold');
  sheet.setFrozenRows(1);

  return sheet;
}

// ===================== MEAL DATABASE ========================
function populateMealDB(ss) {
  const sheet = ss.getSheetByName('Meal DB');
  const meals = getMealData();

  const rows = meals.map((meal, idx) => [
    idx + 1,
    meal.name,
    meal.hindi_name,
    meal.category,
    meal.meal_type,
    meal.cuisine,
    meal.ingredients.join(', '),
    meal.hindi_instructions,
    '',  // YouTube Link - fill manually
    meal.prep_complexity,
    '',
    'YES'
  ]);

  sheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);

  // Color code categories
  for (let i = 0; i < rows.length; i++) {
    const row = i + 2;
    const category = rows[i][3];
    if (category === 'non-veg') {
      sheet.getRange(row, 4).setBackground('#fce4ec');
    } else if (category === 'veg') {
      sheet.getRange(row, 4).setBackground('#e8f5e9');
    } else if (category === 'egg') {
      sheet.getRange(row, 4).setBackground('#fff3e0');
    }
  }
}

function getMealData() {
  return [
    { name: "Chole Masala + Paratha", hindi_name: "Chole Masala aur Paratha", category: "veg", meal_type: "lunch", cuisine: "north_indian", ingredients: ["chole 500g", "pyaaz 3", "tamatar 4", "adrak-lahsun paste", "chole masala", "atta 500g", "tel", "haldi", "mirch powder", "dhaniya powder"], hindi_instructions: "Chole raat ko bhigo dena. Pressure cooker mein 4 seeti lagao. Alag se kadhai mein tel garam karo, pyaaz bhuno golden hone tak, tamatar daalo, adrak-lahsun paste, chole masala, haldi, mirch powder. Chole daal do, 15 min pakao. Paratha atte se bana lo, ghee lagao.", prep_complexity: "medium" },
    { name: "Rajma Chawal", hindi_name: "Rajma Chawal", category: "veg", meal_type: "lunch", cuisine: "north_indian", ingredients: ["rajma 400g", "chawal 500g", "pyaaz 3", "tamatar 4", "adrak-lahsun paste", "rajma masala", "tel", "haldi", "mirch powder"], hindi_instructions: "Rajma raat ko bhigo dena. Pressure cooker mein 5-6 seeti. Kadhai mein tel garam karo, pyaaz bhuno, tamatar, adrak-lahsun paste daalo. Rajma masala, haldi, mirch powder daal ke rajma mix karo. 20 min dhimi aag pe pakao. Chawal alag se bana lo.", prep_complexity: "medium" },
    { name: "Methi Malai Paneer + Paratha", hindi_name: "Methi Malai Paneer aur Paratha", category: "veg", meal_type: "both", cuisine: "north_indian", ingredients: ["paneer 400g", "methi leaves 1 bunch", "cream 100ml", "pyaaz 2", "tamatar 2", "adrak-lahsun paste", "atta 500g", "tel", "haldi"], hindi_instructions: "Paneer cubes kaat lo. Methi ke patte dhoke kaato. Kadhai mein tel garam karo, pyaaz bhuno, tamatar, adrak-lahsun paste daalo. Methi patte daal ke 5 min pakao. Paneer daalo, cream daalo, namak, haldi. 10 min dhimi aag pe. Paratha bana lo.", prep_complexity: "medium" },
    { name: "Chicken Curry + Rice", hindi_name: "Chicken Curry aur Chawal", category: "non-veg", meal_type: "both", cuisine: "north_indian", ingredients: ["chicken 1kg", "pyaaz 4", "tamatar 4", "adrak-lahsun paste", "chicken masala", "chawal 500g", "tel", "haldi", "mirch powder", "dhaniya powder", "garam masala"], hindi_instructions: "Chicken dho ke rakh lo. Kadhai mein tel garam karo, pyaaz golden hone tak bhuno. Tamatar, adrak-lahsun paste daalo. Haldi, mirch, dhaniya powder, chicken masala daal ke 5 min pakao. Chicken daalo, namak, thoda paani. Dhak ke 25-30 min pakao. Garam masala daal ke serve karo chawal ke saath.", prep_complexity: "medium" },
    { name: "Dal Tadka + Roti", hindi_name: "Dal Tadka aur Roti", category: "veg", meal_type: "both", cuisine: "north_indian", ingredients: ["toor dal 300g", "pyaaz 2", "tamatar 2", "adrak-lahsun paste", "jeera", "rai", "curry patta", "atta 400g", "ghee", "haldi", "mirch powder"], hindi_instructions: "Dal dho ke pressure cooker mein 3-4 seeti, haldi daal ke. Alag se tadka lagao - ghee mein jeera, rai, curry patta, pyaaz, tamatar, adrak-lahsun, mirch powder. Dal mein tadka daalo, namak adjust karo. Roti bana lo.", prep_complexity: "easy" },
    { name: "Egg Bhurji + Paratha", hindi_name: "Egg Bhurji aur Paratha", category: "egg", meal_type: "both", cuisine: "north_indian", ingredients: ["eggs 12", "pyaaz 3", "tamatar 2", "hari mirch 4", "haldi", "atta 500g", "tel", "dhaniya patta"], hindi_instructions: "Ande tod ke bowl mein rakh lo, halka phento. Kadhai mein tel garam karo, pyaaz bhuno, tamatar, hari mirch daalo. Ande daalo, haldi, namak. Chammach se todte raho jab tak pak jaaye. Dhaniya patta daalo. Paratha bana ke serve karo.", prep_complexity: "easy" },
    { name: "Chicken Biryani", hindi_name: "Chicken Biryani", category: "non-veg", meal_type: "lunch", cuisine: "north_indian", ingredients: ["chicken 1kg", "basmati chawal 500g", "pyaaz 4", "dahi 200g", "adrak-lahsun paste", "biryani masala", "kesar", "elaichi", "tel", "ghee", "pudina", "dhaniya patta"], hindi_instructions: "Chicken marinate karo - dahi, adrak-lahsun paste, biryani masala, namak, 30 min rakh do. Chawal aadhe ubaal lo. Kadhai mein pyaaz golden bhuno. Marinated chicken pakao 20 min. Layer karo - chicken, chawal, pudina, dhaniya, kesar doodh. Dum pe 25 min pakao dhimi aag pe.", prep_complexity: "medium" },
    { name: "Kadhi Chawal + Baingan Bharta", hindi_name: "Kadhi Chawal aur Baingan Bharta", category: "veg", meal_type: "lunch", cuisine: "north_indian", ingredients: ["dahi 400g", "besan 50g", "baingan 2 bada", "pyaaz 3", "tamatar 2", "hari mirch", "chawal 500g", "tel", "haldi", "jeera", "rai"], hindi_instructions: "Kadhi: Dahi mein besan ghol lo, paani milao. Tel garam karo, jeera rai ka tadka, pyaaz bhuno, dahi mixture daalo, haldi, namak. 20 min ubalne do. Bharta: Baingan gas pe seedha bhuno, chheelo, mash karo. Pyaaz tamatar bhuno, baingan mix karo. Chawal bana lo.", prep_complexity: "medium" },
    { name: "Mutton Curry + Roti", hindi_name: "Mutton Curry aur Roti", category: "non-veg", meal_type: "dinner", cuisine: "north_indian", ingredients: ["mutton 1kg", "pyaaz 4", "tamatar 4", "adrak-lahsun paste", "dahi 100g", "garam masala", "atta 400g", "tel", "haldi", "mirch powder", "dhaniya powder"], hindi_instructions: "Mutton dho ke rakh lo. Pressure cooker mein tel garam karo, pyaaz golden bhuno. Adrak-lahsun paste, tamatar daalo. Haldi, mirch, dhaniya powder, dahi mix karo. Mutton daalo, bhuno 10 min. Paani daalo, pressure cook 6-7 seeti. Garam masala. Roti bana lo.", prep_complexity: "medium" },
    { name: "Chicken Tikka Roll", hindi_name: "Chicken Tikka Roll", category: "non-veg", meal_type: "dinner", cuisine: "north_indian", ingredients: ["chicken breast 500g", "dahi 150g", "tikka masala", "pyaaz 2", "nimbu 2", "atta 400g", "tel", "chaat masala", "hari chutney"], hindi_instructions: "Chicken pieces kaat lo, marinate karo - dahi, tikka masala, nimbu, namak, tel. 30 min rakh do. Tawa pe pakao brown hone tak. Paratha bana lo, hari chutney lagao, chicken rakho, pyaaz, nimbu, chaat masala daal ke roll karo.", prep_complexity: "medium" },
    { name: "Palak Paneer + Roti", hindi_name: "Palak Paneer aur Roti", category: "veg", meal_type: "both", cuisine: "north_indian", ingredients: ["palak 2 bunch", "paneer 300g", "pyaaz 2", "tamatar 2", "adrak-lahsun paste", "cream 50ml", "atta 400g", "tel", "haldi", "garam masala"], hindi_instructions: "Palak ubaal ke blend karo. Kadhai mein tel, pyaaz bhuno, tamatar, adrak-lahsun paste. Palak puree daalo, haldi, namak. Paneer cubes daalo, cream, garam masala. 10 min pakao. Roti bana lo.", prep_complexity: "easy" },
    { name: "Dosa + Sambhar + Chutney", hindi_name: "Dosa Sambhar Chutney", category: "veg", meal_type: "both", cuisine: "south_indian", ingredients: ["dosa batter 500g", "toor dal 200g", "mixed vegetables 300g", "sambhar powder", "nariyal 1", "imli", "rai", "curry patta", "tel"], hindi_instructions: "Sambhar: Dal pressure cook 3 seeti. Vegetables ubaal lo. Dal mein vegetables, sambhar powder, imli ka paani, namak. Tadka - tel mein rai, curry patta. Chutney: Nariyal, hari mirch, namak blend karo. Dosa: Tawa garam karo, batter failao, tel lagao, crispy hone do.", prep_complexity: "medium" },
    { name: "Egg Curry + Rice", hindi_name: "Egg Curry aur Chawal", category: "egg", meal_type: "both", cuisine: "north_indian", ingredients: ["eggs 12", "pyaaz 3", "tamatar 4", "adrak-lahsun paste", "chawal 500g", "tel", "haldi", "mirch powder", "dhaniya powder", "garam masala"], hindi_instructions: "Ande ubaal ke chheel lo. Kadhai mein tel, pyaaz golden bhuno. Tamatar, adrak-lahsun paste. Haldi, mirch, dhaniya powder. Gravy bana lo. Ande daalo, garam masala. 10 min pakao. Chawal bana ke serve karo.", prep_complexity: "easy" },
    { name: "Paneer Butter Masala + Naan", hindi_name: "Paneer Butter Masala aur Naan", category: "veg", meal_type: "dinner", cuisine: "north_indian", ingredients: ["paneer 400g", "tamatar 6", "cashew 10", "butter 50g", "cream 100ml", "pyaaz 2", "adrak-lahsun paste", "maida 400g", "dahi 100g", "haldi", "mirch powder", "garam masala"], hindi_instructions: "Tamatar, cashew, pyaaz ubaal ke blend karo. Kadhai mein butter, adrak-lahsun bhuno, gravy daalo. Haldi, mirch, namak. 10 min pakao. Paneer cubes, cream, garam masala. Naan: maida, dahi, baking powder se dough, tawa pe bana lo.", prep_complexity: "medium" },
    { name: "Chicken Keema + Paratha", hindi_name: "Chicken Keema aur Paratha", category: "non-veg", meal_type: "both", cuisine: "north_indian", ingredients: ["chicken keema 500g", "pyaaz 3", "tamatar 3", "adrak-lahsun paste", "hari mirch 4", "matar 100g", "atta 500g", "tel", "haldi", "garam masala"], hindi_instructions: "Kadhai mein tel, pyaaz golden bhuno. Adrak-lahsun, hari mirch. Keema daalo, bhuno 10 min. Tamatar, haldi, namak. Matar daal do. 15 min pakao. Garam masala. Paratha bana lo.", prep_complexity: "easy" },
    { name: "Aloo Gobi + Dal + Roti", hindi_name: "Aloo Gobi, Dal aur Roti", category: "veg", meal_type: "lunch", cuisine: "north_indian", ingredients: ["aloo 4", "gobi 1", "toor dal 200g", "pyaaz 3", "tamatar 3", "adrak-lahsun paste", "jeera", "atta 400g", "tel", "haldi", "mirch powder", "dhaniya powder"], hindi_instructions: "Aloo Gobi: Kaat lo. Tel, jeera, pyaaz bhuno, tamatar. Aloo gobi, haldi, mirch, dhaniya, namak. Dhak ke 15-20 min. Dal: Pressure cook, tadka lagao. Roti bana lo.", prep_complexity: "easy" },
    { name: "Fish Curry + Rice", hindi_name: "Fish Curry aur Chawal", category: "non-veg", meal_type: "both", cuisine: "south_indian", ingredients: ["fish 500g", "nariyal doodh 200ml", "pyaaz 2", "tamatar 2", "adrak-lahsun paste", "haldi", "mirch powder", "chawal 500g", "curry patta", "tel"], hindi_instructions: "Fish dho ke haldi namak lagao, 10 min rakh do. Tel garam karo, curry patta, pyaaz bhuno. Tamatar, adrak-lahsun. Nariyal doodh daalo, ubalne do. Fish daalo, dhimi aag 15 min. Chawal bana lo.", prep_complexity: "medium" },
    { name: "Butter Chicken + Jeera Rice", hindi_name: "Butter Chicken aur Jeera Rice", category: "non-veg", meal_type: "dinner", cuisine: "north_indian", ingredients: ["chicken 1kg", "tamatar 6", "cashew 10", "butter 50g", "cream 100ml", "dahi 100g", "adrak-lahsun paste", "chawal 500g", "jeera", "tel", "haldi", "mirch powder", "garam masala", "kasuri methi"], hindi_instructions: "Chicken marinate - dahi, adrak-lahsun, haldi, mirch, 30 min. Tawa pe pakao. Gravy: tamatar, cashew blend karo. Butter, adrak-lahsun, gravy, mirch, namak. Chicken, cream, kasuri methi, garam masala. Jeera Rice: ghee mein jeera, chawal pakao.", prep_complexity: "medium" },
    { name: "Idli + Sambhar + Chutney", hindi_name: "Idli Sambhar Chutney", category: "veg", meal_type: "both", cuisine: "south_indian", ingredients: ["idli batter 500g", "toor dal 200g", "mixed vegetables 300g", "sambhar powder", "nariyal 1", "rai", "curry patta", "tel"], hindi_instructions: "Idli: Batter idli stand mein, cooker mein steam 10-12 min bina seeti ke. Sambhar: Dal cook karo, vegetables, sambhar powder, imli paani, tadka. Chutney: Nariyal, hari mirch blend.", prep_complexity: "easy" },
    { name: "Bhindi Masala + Dal + Roti", hindi_name: "Bhindi Masala, Dal aur Roti", category: "veg", meal_type: "lunch", cuisine: "north_indian", ingredients: ["bhindi 500g", "pyaaz 3", "tamatar 2", "toor dal 200g", "atta 400g", "tel", "haldi", "mirch powder", "dhaniya powder", "jeera", "amchur"], hindi_instructions: "Bhindi dho ke sukha ke kaat lo. Tel mein bhindi 10 min bhuno. Alag kadhai pyaaz, tamatar, bhindi, haldi, mirch, dhaniya, amchur. Dal pressure cook, tadka lagao. Roti bana lo.", prep_complexity: "easy" },
    { name: "Chicken Fried Rice + Manchurian", hindi_name: "Chicken Fried Rice aur Manchurian", category: "non-veg", meal_type: "dinner", cuisine: "chinese", ingredients: ["chicken 500g", "chawal 500g", "gobi 1 small", "pyaaz 3", "shimla mirch 2", "soy sauce", "vinegar", "maida", "adrak-lahsun paste", "hari pyaaz", "tel", "cornflour"], hindi_instructions: "Fried Rice: Chawal bana ke thanda karo. Chicken soy sauce mein marinate. Tel mein chicken bhuno, nikal lo. Vegetables bhuno, chawal, soy sauce, vinegar, chicken mix karo. Manchurian: Gobi balls (maida, cornflour) deep fry. Gravy - pyaaz, soy sauce, vinegar, cornflour. Balls daalo.", prep_complexity: "medium" },
    { name: "Matar Paneer + Pulao", hindi_name: "Matar Paneer aur Pulao", category: "veg", meal_type: "lunch", cuisine: "north_indian", ingredients: ["paneer 300g", "matar 200g", "pyaaz 2", "tamatar 3", "adrak-lahsun paste", "basmati chawal 500g", "whole garam masala", "tel", "haldi", "mirch powder", "garam masala"], hindi_instructions: "Matar Paneer: Tel, pyaaz bhuno, tamatar, adrak-lahsun. Haldi, mirch. Matar 10 min. Paneer cubes, garam masala. Pulao: Ghee mein whole masala (elaichi, laung, dalchini), chawal, paani, namak. Dum pe pakao.", prep_complexity: "medium" },
    { name: "Tandoori Chicken + Rumali Roti", hindi_name: "Tandoori Chicken aur Rumali Roti", category: "non-veg", meal_type: "dinner", cuisine: "north_indian", ingredients: ["chicken 1kg", "dahi 200g", "tandoori masala", "nimbu 2", "adrak-lahsun paste", "maida 300g", "tel", "haldi", "kashmiri mirch"], hindi_instructions: "Chicken pe cuts lagao. Marinate - dahi, tandoori masala, adrak-lahsun, nimbu, kashmiri mirch, haldi, namak, tel. 2 ghante. Oven 200C pe 30-35 min ya tawa pe. Rumali Roti: maida dough, patla bel ke tawa pe bana lo.", prep_complexity: "medium" },
    { name: "Dal Makhani + Jeera Rice", hindi_name: "Dal Makhani aur Jeera Rice", category: "veg", meal_type: "dinner", cuisine: "north_indian", ingredients: ["urad dal 250g", "rajma 50g", "butter 50g", "cream 100ml", "tamatar 4", "pyaaz 2", "adrak-lahsun paste", "chawal 500g", "jeera", "haldi", "mirch powder", "garam masala"], hindi_instructions: "Dal rajma raat ko bhigo do. Pressure cook 5-6 seeti. Butter, pyaaz, tamatar, adrak-lahsun. Dal, haldi, mirch, namak. Dhimi aag 30 min, butter cream. Garam masala. Jeera rice bana lo.", prep_complexity: "medium" },
    { name: "Omelette + Toast + Salad", hindi_name: "Omelette Toast aur Salad", category: "egg", meal_type: "dinner", cuisine: "continental", ingredients: ["eggs 12", "bread 1 packet", "pyaaz 2", "tamatar 2", "shimla mirch 1", "cheese slices 4", "butter", "kheera 2", "gajar 2"], hindi_instructions: "Ande phento, pyaaz tamatar shimla mirch hari mirch namak. Tawa pe butter, anda mixture, cheese, fold karo. Bread toast butter laga ke. Salad: kheera gajar tamatar nimbu namak kali mirch.", prep_complexity: "easy" },
    { name: "Chana Dal + Lauki Sabzi + Roti", hindi_name: "Chana Dal, Lauki Sabzi aur Roti", category: "veg", meal_type: "lunch", cuisine: "north_indian", ingredients: ["chana dal 300g", "lauki 1", "pyaaz 3", "tamatar 3", "adrak-lahsun paste", "jeera", "atta 400g", "tel", "haldi", "mirch powder"], hindi_instructions: "Chana Dal: Pressure cook 3-4 seeti haldi ke saath. Tadka - ghee, jeera, pyaaz, tamatar, adrak-lahsun. Lauki: Chheel ke kaat lo. Tel, jeera, pyaaz, tamatar, lauki. Haldi namak mirch. Dhak ke 15 min. Roti bana lo.", prep_complexity: "easy" },
    { name: "Prawn Masala + Rice", hindi_name: "Prawn Masala aur Chawal", category: "non-veg", meal_type: "dinner", cuisine: "south_indian", ingredients: ["prawns 500g", "pyaaz 3", "tamatar 3", "nariyal doodh 100ml", "adrak-lahsun paste", "chawal 500g", "curry patta", "tel", "haldi", "mirch powder"], hindi_instructions: "Prawns saaf karke haldi namak lagao. Tel, curry patta, pyaaz golden bhuno. Tamatar, adrak-lahsun, mirch. Prawns 5 min bhuno. Nariyal doodh, namak. 10 min dhimi aag. Chawal bana lo.", prep_complexity: "medium" },
    { name: "Mix Veg + Dal + Roti", hindi_name: "Mix Veg, Dal aur Roti", category: "veg", meal_type: "lunch", cuisine: "north_indian", ingredients: ["aloo 2", "gajar 2", "beans 100g", "matar 100g", "gobi 200g", "toor dal 200g", "pyaaz 2", "tamatar 2", "atta 400g", "tel", "haldi", "mirch powder", "garam masala"], hindi_instructions: "Mix Veg: Sabziyaan kaat lo. Tel, jeera, pyaaz, tamatar. Sabziyaan, haldi, mirch, namak, paani. Dhak ke 15-20 min. Garam masala. Dal: pressure cook, tadka. Roti bana lo.", prep_complexity: "easy" },
    { name: "Mutton Biryani", hindi_name: "Mutton Biryani", category: "non-veg", meal_type: "lunch", cuisine: "north_indian", ingredients: ["mutton 1kg", "basmati chawal 500g", "pyaaz 5", "dahi 200g", "adrak-lahsun paste", "biryani masala", "kesar", "elaichi", "tel", "ghee", "pudina", "dhaniya patta"], hindi_instructions: "Mutton marinate - dahi, adrak-lahsun, biryani masala, namak. 1 ghanta. Pressure cook 4-5 seeti. Chawal aadhe ubaal lo. Pyaaz golden bhuno. Layer - mutton gravy, chawal, pyaaz, pudina, dhaniya, kesar doodh. Dum 30 min dhimi aag.", prep_complexity: "medium" },
    { name: "Paneer Bhurji + Paratha", hindi_name: "Paneer Bhurji aur Paratha", category: "veg", meal_type: "both", cuisine: "north_indian", ingredients: ["paneer 400g", "pyaaz 3", "tamatar 3", "hari mirch 4", "shimla mirch 1", "atta 500g", "tel", "haldi", "dhaniya patta"], hindi_instructions: "Paneer crumble karo. Tel, pyaaz bhuno, hari mirch, shimla mirch, tamatar. Paneer, haldi, namak. 5-7 min bhuno. Dhaniya patta. Paratha ghee laga ke.", prep_complexity: "easy" },
    { name: "Grilled Chicken + Salad + Soup", hindi_name: "Grilled Chicken, Salad aur Soup", category: "non-veg", meal_type: "dinner", cuisine: "continental", ingredients: ["chicken breast 600g", "olive oil", "nimbu 2", "kali mirch", "mixed herbs", "kheera 2", "tamatar 2", "lettuce", "chicken stock", "mixed vegetables 200g"], hindi_instructions: "Chicken pe olive oil, nimbu, namak, kali mirch, herbs lagao. 30 min marinate. Tawa pe grill 6-7 min dono taraf. Salad: kheera tamatar lettuce nimbu namak olive oil. Soup: paani, vegetables, stock, namak kali mirch 15 min ubaal lo.", prep_complexity: "easy" },
    { name: "Shahi Paneer + Naan", hindi_name: "Shahi Paneer aur Naan", category: "veg", meal_type: "dinner", cuisine: "north_indian", ingredients: ["paneer 400g", "tamatar 4", "pyaaz 2", "cashew 15", "cream 100ml", "adrak-lahsun paste", "maida 300g", "dahi 100g", "haldi", "mirch powder", "garam masala"], hindi_instructions: "Pyaaz tamatar cashew ubaal ke blend karo. Tel, adrak-lahsun, gravy. Haldi, mirch, namak. 10 min. Paneer cubes, cream, garam masala. Naan: maida dahi baking powder namak dough, tawa pe bana lo.", prep_complexity: "medium" },
    { name: "Chicken Pepper Fry + Parotta", hindi_name: "Chicken Pepper Fry aur Parotta", category: "non-veg", meal_type: "dinner", cuisine: "south_indian", ingredients: ["chicken 750g", "pyaaz 3", "curry patta 10", "kali mirch crushed", "adrak-lahsun paste", "maida 400g", "tel", "haldi", "soy sauce"], hindi_instructions: "Chicken mein haldi namak lagao. Tel mein chicken bhuno 10 min, nikal lo. Tel mein curry patta pyaaz bhuno, adrak-lahsun. Chicken, kali mirch, soy sauce, namak. Sukha bhuno 10 min. Parotta: maida tel paani dough, layer bana ke tawa pe ghee se sekho.", prep_complexity: "medium" },
    { name: "Moong Dal Cheela + Chutney", hindi_name: "Moong Dal Cheela aur Chutney", category: "veg", meal_type: "dinner", cuisine: "north_indian", ingredients: ["moong dal 300g", "pyaaz 2", "hari mirch 4", "adrak", "nariyal 1", "pudina", "dhaniya patta", "tel"], hindi_instructions: "Moong dal 4 ghante bhigo ke pees lo. Pyaaz hari mirch adrak namak mix karo. Tawa pe tel, batter failao dosa jaisa, dono taraf seko. Chutney: nariyal pudina dhaniya hari mirch namak blend.", prep_complexity: "easy" },
    { name: "Keema Matar + Roti", hindi_name: "Keema Matar aur Roti", category: "non-veg", meal_type: "both", cuisine: "north_indian", ingredients: ["mutton keema 500g", "matar 200g", "pyaaz 3", "tamatar 3", "adrak-lahsun paste", "atta 400g", "tel", "haldi", "mirch powder", "garam masala"], hindi_instructions: "Tel, pyaaz golden bhuno. Adrak-lahsun, tamatar. Keema 15 min bhuno. Haldi, mirch, namak. Matar, thoda paani, 15 min. Garam masala. Roti bana lo.", prep_complexity: "medium" }
  ];
}

// ===================== DRAFT PLAN (Step 1) ===================

function generateDraftPlan() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const dbSheet = ss.getSheetByName('Meal DB');
  const draftSheet = ss.getSheetByName('Draft Plan');

  if (!dbSheet || !draftSheet) {
    SpreadsheetApp.getUi().alert('Please run Initial Setup first!');
    return;
  }

  // Get active meals from DB
  const dbData = dbSheet.getDataRange().getValues();
  const meals = [];
  const allDishNames = [];
  for (let i = 1; i < dbData.length; i++) {
    if (dbData[i][11] === 'YES') {
      meals.push({
        name: dbData[i][1],
        category: dbData[i][3],
        meal_type: dbData[i][4],
        last_served: dbData[i][10]
      });
      allDishNames.push(dbData[i][1]);
    }
  }

  // Filter by meal type
  const lunchMeals = meals.filter(m => m.meal_type === 'lunch' || m.meal_type === 'both');
  const dinnerMeals = meals.filter(m => m.meal_type === 'dinner' || m.meal_type === 'both');

  // Sort by last served (oldest first)
  const sortByLastServed = (a, b) => {
    if (!a.last_served && !b.last_served) return Math.random() - 0.5;
    if (!a.last_served) return -1;
    if (!b.last_served) return 1;
    return new Date(a.last_served) - new Date(b.last_served);
  };
  lunchMeals.sort(sortByLastServed);
  dinnerMeals.sort(sortByLastServed);

  // Get this week's Monday (Mon-Sat), or next Monday (if Sunday)
  const today = new Date();
  const monday = new Date(today);
  const dayOfWeek = today.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  if (dayOfWeek === 0) {
    // Sunday: generate for next week
    monday.setDate(today.getDate() + 1);
  } else {
    // Mon-Sat: go back to this week's Monday
    monday.setDate(today.getDate() - (dayOfWeek - 1));
  }

  // Balance non-veg
  const targetNonVeg = CONFIG.NON_VEG_TARGET.min + Math.floor(Math.random() * (CONFIG.NON_VEG_TARGET.max - CONFIG.NON_VEG_TARGET.min + 1));
  const allSlots = [];
  for (let i = 0; i < 6; i++) {
    allSlots.push({ day: i, meal: 'lunch' });
    allSlots.push({ day: i, meal: 'dinner' });
  }
  const shuffled = allSlots.sort(() => Math.random() - 0.5);
  const nonVegSlots = new Set();
  for (let i = 0; i < targetNonVeg && i < shuffled.length; i++) {
    nonVegSlots.add(`${shuffled[i].day}-${shuffled[i].meal}`);
  }

  // Generate draft rows
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const draftRows = [];
  const usedDishes = new Set();

  for (let i = 0; i < 6; i++) {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    const dateStr = Utilities.formatDate(date, CONFIG.TIMEZONE, 'dd-MMM-yyyy');

    const lunch = pickMeal(lunchMeals, usedDishes, nonVegSlots.has(`${i}-lunch`));
    const dinner = pickMeal(dinnerMeals, usedDishes, nonVegSlots.has(`${i}-dinner`));

    draftRows.push([dateStr, days[i], lunch.name, dinner.name]);
  }

  // Clear old draft (rows 2-7) and write new one
  draftSheet.getRange(2, 1, 6, 4).clear();
  draftSheet.getRange(2, 1, draftRows.length, 4).setValues(draftRows);

  // Add dropdown validation for Lunch and Dinner columns using ALL dish names
  const dishRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(allDishNames, true)
    .build();
  draftSheet.getRange(2, 3, 6, 1).setDataValidation(dishRule); // Lunch column
  draftSheet.getRange(2, 4, 6, 1).setDataValidation(dishRule); // Dinner column

  // Color code non-veg rows for visibility
  for (let i = 0; i < draftRows.length; i++) {
    const row = i + 2;
    const lunchDish = meals.find(m => m.name === draftRows[i][2]);
    const dinnerDish = meals.find(m => m.name === draftRows[i][3]);

    // Lunch cell color
    if (lunchDish && (lunchDish.category === 'non-veg')) {
      draftSheet.getRange(row, 3).setBackground('#fce4ec');
    } else if (lunchDish && lunchDish.category === 'egg') {
      draftSheet.getRange(row, 3).setBackground('#fff3e0');
    } else {
      draftSheet.getRange(row, 3).setBackground('#e8f5e9');
    }

    // Dinner cell color
    if (dinnerDish && (dinnerDish.category === 'non-veg')) {
      draftSheet.getRange(row, 4).setBackground('#fce4ec');
    } else if (dinnerDish && dinnerDish.category === 'egg') {
      draftSheet.getRange(row, 4).setBackground('#fff3e0');
    } else {
      draftSheet.getRange(row, 4).setBackground('#e8f5e9');
    }
  }

  // Make it the active sheet so user sees it immediately
  ss.setActiveSheet(draftSheet);

  SpreadsheetApp.getUi().alert(
    'Draft plan generated!\n\n' +
    'Green = Veg | Pink = Non-veg | Orange = Egg\n\n' +
    'Swap any dish using the dropdown.\n' +
    'When done, click: Meal Planner > Step 2: Finalize Plan'
  );
}

// ===================== FINALIZE PLAN (Step 2) ================

function finalizePlan() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const draftSheet = ss.getSheetByName('Draft Plan');
  const dbSheet = ss.getSheetByName('Meal DB');
  const planSheet = ss.getSheetByName('Weekly Plan');

  if (!draftSheet || !dbSheet || !planSheet) {
    SpreadsheetApp.getUi().alert('Please run Initial Setup first!');
    return;
  }

  // Read draft plan
  const draftData = draftSheet.getRange(2, 1, 6, 4).getValues();

  // Build meal lookup from DB
  const dbData = dbSheet.getDataRange().getValues();
  const mealLookup = {};
  for (let i = 1; i < dbData.length; i++) {
    mealLookup[dbData[i][1]] = {
      name: dbData[i][1],
      hindi_name: dbData[i][2],
      category: dbData[i][3],
      ingredients: dbData[i][6],
      hindi_instructions: dbData[i][7],
      youtube_link: dbData[i][8],
      row: i + 1
    };
  }

  // Build the full weekly plan from draft
  const plan = [];
  for (let i = 0; i < draftData.length; i++) {
    const dateStr = Utilities.formatDate(new Date(draftData[i][0]), CONFIG.TIMEZONE, 'dd-MMM-yyyy');
    const day = draftData[i][1];
    const lunchName = draftData[i][2];
    const dinnerName = draftData[i][3];

    const lunch = mealLookup[lunchName] || { name: lunchName, youtube_link: '' };
    const dinner = mealLookup[dinnerName] || { name: dinnerName, youtube_link: '' };

    plan.push([dateStr, day, 'Lunch', lunchName, lunch.youtube_link || '', 'IN', 'IN', 'IN', 'IN', 4, '']);
    plan.push([dateStr, day, 'Dinner', dinnerName, dinner.youtube_link || '', 'IN', 'IN', 'IN', 'IN', 4, '']);
  }

  // Write to Weekly Plan sheet
  if (planSheet.getLastRow() > 1) {
    planSheet.getRange(2, 1, planSheet.getLastRow() - 1, 11).clear();
  }
  planSheet.getRange(2, 1, plan.length, plan[0].length).setValues(plan);

  // Color code rows
  for (let i = 0; i < plan.length; i++) {
    const row = i + 2;
    if (plan[i][2] === 'Lunch') {
      planSheet.getRange(row, 1, 1, 11).setBackground('#f3f8f3');
    } else {
      planSheet.getRange(row, 1, 1, 11).setBackground('#fff8f0');
    }
  }

  // Add headcount formula
  for (let i = 0; i < plan.length; i++) {
    const row = i + 2;
    planSheet.getRange(row, 10).setFormula(`=COUNTIF(F${row}:I${row},"IN")`);
  }

  // Add attendance validation
  const attendanceRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['IN', 'OUT'], true)
    .build();
  for (let col = 6; col <= 9; col++) {
    planSheet.getRange(2, col, plan.length, 1).setDataValidation(attendanceRule);
  }

  // Update last served dates in Meal DB
  const todayStr = Utilities.formatDate(new Date(), CONFIG.TIMEZONE, 'dd-MMM-yyyy');
  for (const row of plan) {
    const dishName = row[3];
    if (mealLookup[dishName]) {
      dbSheet.getRange(mealLookup[dishName].row, 11).setValue(todayStr);
    }
  }

  // Recalculate grocery list
  calculateGroceryList();

  // Switch to Weekly Plan sheet
  ss.setActiveSheet(planSheet);

  SpreadsheetApp.getUi().alert(
    'Plan finalized!\n\n' +
    'Weekly Plan, Grocery List updated.\n' +
    'Mark members as OUT if they won\'t eat.'
  );
}

// ===================== WEEKLY PLAN GENERATOR (legacy - kept for triggers) =
function generateWeeklyPlan() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const dbSheet = ss.getSheetByName('Meal DB');
  const planSheet = ss.getSheetByName('Weekly Plan');

  if (!dbSheet || !planSheet) {
    SpreadsheetApp.getUi().alert('Please run Initial Setup first!');
    return;
  }

  // Get active meals from DB
  const dbData = dbSheet.getDataRange().getValues();
  const meals = [];
  for (let i = 1; i < dbData.length; i++) {
    if (dbData[i][11] === 'YES') {
      meals.push({
        id: dbData[i][0],
        name: dbData[i][1],
        hindi_name: dbData[i][2],
        category: dbData[i][3],
        meal_type: dbData[i][4],
        cuisine: dbData[i][5],
        ingredients: dbData[i][6],
        hindi_instructions: dbData[i][7],
        youtube_link: dbData[i][8],
        complexity: dbData[i][9],
        last_served: dbData[i][10],
        row: i + 1
      });
    }
  }

  // Get this week's Monday (Mon-Sat), or next Monday (if Sunday)
  const today = new Date();
  const monday = new Date(today);
  const dayOfWeek = today.getDay();
  if (dayOfWeek === 0) {
    monday.setDate(today.getDate() + 1);
  } else {
    monday.setDate(today.getDate() - (dayOfWeek - 1));
  }

  // Filter meals by type
  const lunchMeals = meals.filter(m => m.meal_type === 'lunch' || m.meal_type === 'both');
  const dinnerMeals = meals.filter(m => m.meal_type === 'dinner' || m.meal_type === 'both');

  // Sort by last served (oldest first) to ensure rotation
  const sortByLastServed = (a, b) => {
    if (!a.last_served && !b.last_served) return Math.random() - 0.5;
    if (!a.last_served) return -1;
    if (!b.last_served) return 1;
    return new Date(a.last_served) - new Date(b.last_served);
  };

  lunchMeals.sort(sortByLastServed);
  dinnerMeals.sort(sortByLastServed);

  // Generate plan - 6 days (Mon-Sat), balancing non-veg
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const plan = [];
  const usedDishes = new Set();
  let nonVegCount = 0;
  const targetNonVeg = CONFIG.NON_VEG_TARGET.min + Math.floor(Math.random() * (CONFIG.NON_VEG_TARGET.max - CONFIG.NON_VEG_TARGET.min + 1));

  // First pass: assign non-veg meals to random slots
  const nonVegSlots = new Set();
  const allSlots = [];
  for (let i = 0; i < 6; i++) {
    allSlots.push({ day: i, meal: 'lunch' });
    allSlots.push({ day: i, meal: 'dinner' });
  }

  // Shuffle and pick non-veg slots
  const shuffled = allSlots.sort(() => Math.random() - 0.5);
  for (let i = 0; i < targetNonVeg && i < shuffled.length; i++) {
    nonVegSlots.add(`${shuffled[i].day}-${shuffled[i].meal}`);
  }

  for (let i = 0; i < 6; i++) {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    const dateStr = Utilities.formatDate(date, CONFIG.TIMEZONE, 'dd-MMM-yyyy');

    // Pick lunch
    const lunchNonVeg = nonVegSlots.has(`${i}-lunch`);
    const lunch = pickMeal(lunchMeals, usedDishes, lunchNonVeg);

    // Pick dinner
    const dinnerNonVeg = nonVegSlots.has(`${i}-dinner`);
    const dinner = pickMeal(dinnerMeals, usedDishes, dinnerNonVeg);

    plan.push([dateStr, days[i], 'Lunch', lunch.name, lunch.youtube_link || '', 'IN', 'IN', 'IN', 'IN', 4, '']);
    plan.push([dateStr, days[i], 'Dinner', dinner.name, dinner.youtube_link || '', 'IN', 'IN', 'IN', 'IN', 4, '']);
  }

  // Clear old plan and write new one
  if (planSheet.getLastRow() > 1) {
    planSheet.getRange(2, 1, planSheet.getLastRow() - 1, 11).clear();
  }
  planSheet.getRange(2, 1, plan.length, plan[0].length).setValues(plan);

  // Color code rows
  for (let i = 0; i < plan.length; i++) {
    const row = i + 2;
    const meal = plan[i][2];
    if (meal === 'Lunch') {
      planSheet.getRange(row, 1, 1, 11).setBackground('#f3f8f3');
    } else {
      planSheet.getRange(row, 1, 1, 11).setBackground('#fff8f0');
    }
  }

  // Add headcount formula
  for (let i = 0; i < plan.length; i++) {
    const row = i + 2;
    planSheet.getRange(row, 10).setFormula(`=COUNTIF(F${row}:I${row},"IN")`);
  }

  // Update last served dates in Meal DB
  const todayStr = Utilities.formatDate(today, CONFIG.TIMEZONE, 'dd-MMM-yyyy');
  for (const dishName of usedDishes) {
    const meal = meals.find(m => m.name === dishName);
    if (meal) {
      dbSheet.getRange(meal.row, 11).setValue(todayStr);
    }
  }

  // Recalculate grocery list
  calculateGroceryList();

  // Add attendance validation
  const attendanceRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['IN', 'OUT'], true)
    .build();
  for (let col = 6; col <= 9; col++) {
    planSheet.getRange(2, col, plan.length, 1).setDataValidation(attendanceRule);
  }

  SpreadsheetApp.getUi().alert('Weekly plan generated! Review and edit if needed.');
}

function pickMeal(mealList, usedDishes, preferNonVeg) {
  let candidates;

  if (preferNonVeg) {
    candidates = mealList.filter(m => (m.category === 'non-veg' || m.category === 'egg') && !usedDishes.has(m.name));
  } else {
    candidates = mealList.filter(m => m.category === 'veg' && !usedDishes.has(m.name));
  }

  // Fallback if not enough candidates
  if (candidates.length === 0) {
    candidates = mealList.filter(m => !usedDishes.has(m.name));
  }

  // Still nothing? Reset
  if (candidates.length === 0) {
    candidates = mealList;
  }

  // Pick from top 3 (least recently served) with some randomness
  const topN = candidates.slice(0, Math.min(3, candidates.length));
  const picked = topN[Math.floor(Math.random() * topN.length)];
  usedDishes.add(picked.name);
  return picked;
}

function buildWhatsAppMessage(meal, dateStr, day, mealType, headcount, optOutList) {
  const hindiNumbers = { 1: 'ek', 2: 'do', 3: 'teen', 4: 'chaar' };
  const hindiCount = hindiNumbers[headcount] || headcount;
  let msg = `${mealType === 'Lunch' ? 'Kal dopahar ka khana' : 'Aaj raat ka khana'} - ${meal.hindi_name}`;
  msg += `, ${hindiCount} log khayenge`;
  if (optOutList && optOutList.length > 0) {
    msg += `, ${optOutList.join(', ')} nahi khayenge`;
  }
  return msg;
}

// ===================== GROCERY LIST =========================
function calculateGroceryList() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const planSheet = ss.getSheetByName('Weekly Plan');
  const grocerySheet = ss.getSheetByName('Grocery List');
  const dbSheet = ss.getSheetByName('Meal DB');

  if (!planSheet || !grocerySheet || !dbSheet) return;

  const planData = planSheet.getDataRange().getValues();
  const dbData = dbSheet.getDataRange().getValues();

  // Build dish -> ingredients map from DB
  const dishIngredients = {};
  for (let i = 1; i < dbData.length; i++) {
    dishIngredients[dbData[i][1]] = {
      ingredients: dbData[i][6].split(', '),
      name: dbData[i][1]
    };
  }

  // --- Parse ingredient string into { name, qty, unit } ---
  function parseIngredient(raw) {
    const str = raw.trim().toLowerCase();
    // Match patterns like "chicken 1kg", "pyaaz 3", "cream 100ml", "eggs 12", "gobi 1 small"
    const match = str.match(/^(.+?)\s+(\d+\.?\d*)\s*(kg|g|ml|l|bunch|packet|bada|small|slices)?$/);
    if (match) {
      return { name: match[1].trim(), qty: parseFloat(match[2]), unit: match[3] || 'pcs' };
    }
    // No quantity - treat as "needed" (spices, etc)
    return { name: str, qty: 0, unit: '' };
  }

  // --- Normalize ingredient names so "chicken breast" and "chicken" merge ---
  function normalizeIngredientName(name) {
    const aliases = {
      'chicken breast': 'chicken',
      'chicken keema': 'chicken keema',
      'mutton keema': 'mutton keema',
      'basmati chawal': 'chawal',
      'toor dal': 'toor dal',
      'urad dal': 'urad dal',
      'chana dal': 'chana dal',
      'moong dal': 'moong dal',
      'hari mirch': 'hari mirch',
      'shimla mirch': 'shimla mirch',
      'kashmiri mirch': 'kashmiri mirch',
      'kali mirch': 'kali mirch',
      'kali mirch crushed': 'kali mirch',
      'mirch powder': 'mirch powder',
      'dhaniya powder': 'dhaniya powder',
      'dhaniya patta': 'dhaniya patta',
      'adrak-lahsun paste': 'adrak-lahsun paste',
      'adrak': 'adrak',
      'hari pyaaz': 'hari pyaaz',
      'whole garam masala': 'whole garam masala',
      'garam masala': 'garam masala',
      'biryani masala': 'biryani masala',
      'chicken masala': 'chicken masala',
      'chole masala': 'chole masala',
      'rajma masala': 'rajma masala',
      'sambhar powder': 'sambhar powder',
      'tikka masala': 'tikka masala',
      'tandoori masala': 'tandoori masala',
      'chaat masala': 'chaat masala',
      'curry patta': 'curry patta',
      'kasuri methi': 'kasuri methi',
      'methi leaves': 'methi leaves',
      'mixed vegetables': 'mixed vegetables',
      'mixed herbs': 'mixed herbs',
      'cheese slices': 'cheese slices',
      'chicken stock': 'chicken stock',
      'olive oil': 'olive oil',
      'soy sauce': 'soy sauce',
      'nariyal doodh': 'nariyal doodh',
      'idli batter': 'idli batter',
      'dosa batter': 'dosa batter',
      'hari chutney': 'hari chutney',
      'baking powder': 'baking powder'
    };
    return aliases[name] || name;
  }

  // --- Categorize by normalized name ---
  const categories = {
    'chicken': 'Meat & Fish', 'mutton': 'Meat & Fish', 'keema': 'Meat & Fish', 'fish': 'Meat & Fish', 'prawns': 'Meat & Fish',
    'eggs': 'Eggs & Dairy', 'paneer': 'Eggs & Dairy', 'dahi': 'Eggs & Dairy', 'cream': 'Eggs & Dairy', 'butter': 'Eggs & Dairy', 'cheese': 'Eggs & Dairy', 'doodh': 'Eggs & Dairy',
    'chawal': 'Staples', 'atta': 'Staples', 'maida': 'Staples', 'bread': 'Staples', 'dal': 'Staples', 'rajma': 'Staples', 'chole': 'Staples', 'batter': 'Staples', 'besan': 'Staples',
    'pyaaz': 'Vegetables', 'tamatar': 'Vegetables', 'aloo': 'Vegetables', 'gobi': 'Vegetables', 'palak': 'Vegetables', 'bhindi': 'Vegetables', 'baingan': 'Vegetables',
    'matar': 'Vegetables', 'shimla': 'Vegetables', 'gajar': 'Vegetables', 'beans': 'Vegetables', 'lauki': 'Vegetables', 'methi': 'Vegetables', 'kheera': 'Vegetables', 'lettuce': 'Vegetables',
    'adrak': 'Spices & Masala', 'masala': 'Spices & Masala', 'haldi': 'Spices & Masala', 'mirch': 'Spices & Masala', 'jeera': 'Spices & Masala', 'rai': 'Spices & Masala',
    'dhaniya': 'Spices & Masala', 'garam': 'Spices & Masala', 'amchur': 'Spices & Masala', 'kasuri': 'Spices & Masala', 'elaichi': 'Spices & Masala', 'kesar': 'Spices & Masala',
    'tel': 'Oils & Others', 'ghee': 'Oils & Others', 'olive': 'Oils & Others', 'soy': 'Oils & Others', 'vinegar': 'Oils & Others', 'nimbu': 'Oils & Others',
    'nariyal': 'Others', 'pudina': 'Others', 'curry patta': 'Others', 'imli': 'Others', 'cashew': 'Others', 'herbs': 'Others', 'stock': 'Others', 'cornflour': 'Others', 'chutney': 'Others'
  };

  function getCategory(name) {
    const lower = name.toLowerCase();
    for (const [key, cat] of Object.entries(categories)) {
      if (lower.includes(key)) return cat;
    }
    return 'Others';
  }

  // --- Aggregate: parse all ingredients, group by normalized name, sum quantities ---
  // aggregated[normalizedName] = { qty: { unit: totalQty }, dishes: Set }
  const aggregated = {};

  for (let i = 1; i < planData.length; i++) {
    const dishName = planData[i][3];
    if (!dishIngredients[dishName]) continue;

    const ingredients = dishIngredients[dishName].ingredients;
    for (const raw of ingredients) {
      const parsed = parseIngredient(raw.trim());
      const normName = normalizeIngredientName(parsed.name);

      if (!aggregated[normName]) {
        aggregated[normName] = { quantities: {}, dishes: new Set() };
      }
      aggregated[normName].dishes.add(dishName);

      if (parsed.qty > 0) {
        const unit = parsed.unit || 'pcs';
        aggregated[normName].quantities[unit] = (aggregated[normName].quantities[unit] || 0) + parsed.qty;
      }
    }
  }

  // --- Build display quantity string ---
  function formatQuantity(quantities) {
    const parts = [];
    for (const [unit, qty] of Object.entries(quantities)) {
      if (unit === 'g' && qty >= 1000) {
        parts.push(`${(qty / 1000).toFixed(1)}kg`);
      } else if (unit === 'ml' && qty >= 1000) {
        parts.push(`${(qty / 1000).toFixed(1)}L`);
      } else if (unit === 'pcs') {
        parts.push(`${qty}`);
      } else {
        parts.push(`${qty}${unit}`);
      }
    }
    return parts.join(' + ') || 'as needed';
  }

  // --- Build final grocery rows ---
  const groceryRows = [];

  // Daily essentials first
  groceryRows.push(['Eggs (boiled - daily)', `${CONFIG.DAILY_BOILED_EGGS.total * 6} pcs`, 'Eggs & Dairy', 'Daily boiled eggs for everyone', false]);
  groceryRows.push(['Gajar (Devansh salad - daily)', '6 pcs', 'Vegetables', 'Devansh daily salad', false]);
  groceryRows.push(['Kheera (Devansh salad - daily)', '6 pcs', 'Vegetables', 'Devansh daily salad', false]);
  groceryRows.push(['Tamatar (Devansh salad - daily)', '6 pcs', 'Vegetables', 'Devansh daily salad', false]);

  // Sort aggregated ingredients by category then name
  const sortedItems = Object.entries(aggregated).sort((a, b) => {
    const catA = getCategory(a[0]);
    const catB = getCategory(b[0]);
    return catA.localeCompare(catB) || a[0].localeCompare(b[0]);
  });

  for (const [name, data] of sortedItems) {
    // Skip items already covered in daily essentials
    if (['gajar', 'kheera'].includes(name)) continue;

    const displayName = name.charAt(0).toUpperCase() + name.slice(1);
    const qty = formatQuantity(data.quantities);
    const category = getCategory(name);
    const dishes = [...data.dishes].join(', ');

    // If eggs appear in meals too, add to the daily egg count
    if (name === 'eggs') {
      const mealEggs = data.quantities['pcs'] || 0;
      const totalEggs = (CONFIG.DAILY_BOILED_EGGS.total * 6) + mealEggs;
      groceryRows[0] = ['Eggs (total)', `${totalEggs} pcs (${CONFIG.DAILY_BOILED_EGGS.total * 6} boiled + ${mealEggs} for meals)`, 'Eggs & Dairy', 'Daily boiled eggs + ' + dishes, false];
      continue;
    }

    // Merge tamatar from meals with daily salad tamatar
    if (name === 'tamatar') {
      const mealTamatar = data.quantities['pcs'] || 0;
      const total = 6 + mealTamatar;
      groceryRows[3] = ['Tamatar (total)', `${total} pcs (6 salad + ${mealTamatar} meals)`, 'Vegetables', 'Devansh salad + ' + dishes, false];
      continue;
    }

    groceryRows.push([displayName, qty, category, dishes, false]);
  }

  // Write to sheet
  if (grocerySheet.getLastRow() > 1) {
    grocerySheet.getRange(2, 1, grocerySheet.getLastRow() - 1, 5).clear();
  }
  if (groceryRows.length > 0) {
    grocerySheet.getRange(2, 1, groceryRows.length, 5).setValues(groceryRows);
  }

  // Add checkboxes
  const checkboxRule = SpreadsheetApp.newDataValidation().requireCheckbox().build();
  grocerySheet.getRange(2, 5, groceryRows.length, 1).setDataValidation(checkboxRule);
}

// ===================== TEXT TO SPEECH (Hindi Voice Notes) =====

// Convert Hindi text to audio using Google Translate TTS
function textToSpeechHindi(text) {
  const chunks = splitTextForTTS(text, 180);
  const audioBytes = [];

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const url = 'https://translate.google.com/translate_tts' +
      '?ie=UTF-8&tl=hi&client=tw-ob' +
      '&q=' + encodeURIComponent(chunk) +
      '&total=' + chunks.length +
      '&idx=' + i +
      '&textlen=' + chunk.length;

    try {
      const response = UrlFetchApp.fetch(url, {
        muteHttpExceptions: true,
        followRedirects: true
      });

      if (response.getResponseCode() === 200) {
        const bytes = response.getBlob().getBytes();
        for (let b = 0; b < bytes.length; b++) {
          audioBytes.push(bytes[b]);
        }
      } else {
        Logger.log('TTS chunk ' + i + ' failed: HTTP ' + response.getResponseCode());
        return null;
      }
    } catch (e) {
      Logger.log('TTS error: ' + e.toString());
      return null;
    }

    // Small delay between chunks to avoid rate limiting
    if (i < chunks.length - 1) {
      Utilities.sleep(500);
    }
  }

  if (audioBytes.length === 0) return null;
  return Utilities.newBlob(audioBytes, 'audio/mpeg', 'meal_message.mp3');
}

// Split long text into TTS-friendly chunks (max ~180 chars each)
function splitTextForTTS(text, maxLen) {
  const chunks = [];
  const parts = text.split('\n').filter(s => s.trim());
  let current = '';

  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    if (current && (current + ', ' + trimmed).length > maxLen) {
      chunks.push(current.trim());
      current = trimmed;
    } else {
      current = current ? current + ', ' + trimmed : trimmed;
    }
  }
  if (current.trim()) chunks.push(current.trim());

  // Handle chunks still longer than maxLen
  const result = [];
  for (const chunk of chunks) {
    if (chunk.length <= maxLen) {
      result.push(chunk);
    } else {
      let remaining = chunk;
      while (remaining.length > maxLen) {
        let splitIdx = remaining.lastIndexOf(',', maxLen);
        if (splitIdx < maxLen / 2) splitIdx = remaining.lastIndexOf(' ', maxLen);
        if (splitIdx < maxLen / 2) splitIdx = maxLen;
        result.push(remaining.substring(0, splitIdx).trim());
        remaining = remaining.substring(splitIdx + 1).trim();
      }
      if (remaining) result.push(remaining);
    }
  }

  return result.length > 0 ? result : [text.substring(0, maxLen)];
}

// Send audio file as voice note via Green API file upload
function sendVoiceNote(audioBlob) {
  if (!CONFIG.GREEN_API_INSTANCE_ID || !CONFIG.GREEN_API_TOKEN) {
    Logger.log('WhatsApp not configured');
    return false;
  }

  const url = `${CONFIG.GREEN_API_URL}/waInstance${CONFIG.GREEN_API_INSTANCE_ID}/sendFileByUpload/${CONFIG.GREEN_API_TOKEN}`;

  try {
    const response = UrlFetchApp.fetch(url, {
      method: 'post',
      payload: {
        chatId: CONFIG.WHATSAPP_GROUP_ID,
        file: audioBlob
      },
      muteHttpExceptions: true
    });

    const result = JSON.parse(response.getContentText());
    Logger.log('Voice note sent: ' + JSON.stringify(result));
    return response.getResponseCode() === 200;
  } catch (e) {
    Logger.log('Voice note error: ' + e.toString());
    return false;
  }
}

// Send meal as voice note + YouTube link as separate text message
function sendMealVoiceAndLink(voiceText, youtubeLink) {
  // Try voice note first, fallback to text if TTS fails
  const audioBlob = textToSpeechHindi(voiceText);
  if (audioBlob) {
    const sent = sendVoiceNote(audioBlob);
    if (!sent) {
      Logger.log('Voice note failed, falling back to text');
      sendWhatsAppMessage(voiceText);
    }
  } else {
    Logger.log('TTS failed, falling back to text');
    sendWhatsAppMessage(voiceText);
  }

  // Send YouTube link as a separate text message (if available)
  if (youtubeLink && youtubeLink.trim()) {
    Utilities.sleep(2000); // Small delay between messages
    sendWhatsAppMessage('Recipe ka YouTube link:\n' + youtubeLink);
  }
}

// ===================== WHATSAPP INTEGRATION (Green API) ======

function sendWhatsAppMessage(message) {
  if (!CONFIG.GREEN_API_INSTANCE_ID || !CONFIG.GREEN_API_TOKEN) {
    Logger.log('WhatsApp not configured. Message:\n' + message);
    return;
  }

  const url = `${CONFIG.GREEN_API_URL}/waInstance${CONFIG.GREEN_API_INSTANCE_ID}/sendMessage/${CONFIG.GREEN_API_TOKEN}`;

  const payload = {
    'chatId': CONFIG.WHATSAPP_GROUP_ID,
    'message': message
  };

  const options = {
    'method': 'post',
    'contentType': 'application/json',
    'payload': JSON.stringify(payload),
    'muteHttpExceptions': true
  };

  try {
    const response = UrlFetchApp.fetch(url, options);
    const result = JSON.parse(response.getContentText());
    Logger.log('WhatsApp sent: ' + JSON.stringify(result));
  } catch (e) {
    Logger.log('WhatsApp error: ' + e.toString());
  }
}

// Helper: Get all WhatsApp groups (run this once to find your group ID)
function listWhatsAppGroups() {
  if (!CONFIG.GREEN_API_INSTANCE_ID || !CONFIG.GREEN_API_TOKEN) {
    SpreadsheetApp.getUi().alert('Set GREEN_API_INSTANCE_ID and GREEN_API_TOKEN first!');
    return;
  }

  const url = `${CONFIG.GREEN_API_URL}/waInstance${CONFIG.GREEN_API_INSTANCE_ID}/getContacts/${CONFIG.GREEN_API_TOKEN}`;

  try {
    const response = UrlFetchApp.fetch(url, { 'muteHttpExceptions': true });
    const contacts = JSON.parse(response.getContentText());

    // Filter only groups
    const groups = contacts.filter(c => c.id.endsWith('@g.us'));
    let groupList = 'Your WhatsApp Groups:\n\n';
    groups.forEach(g => {
      groupList += `Name: ${g.name || 'Unnamed'}\nID: ${g.id}\n\n`;
    });

    Logger.log(groupList);
    SpreadsheetApp.getUi().alert(groupList || 'No groups found. Make sure your WhatsApp is connected in Green API console.');
  } catch (e) {
    SpreadsheetApp.getUi().alert('Error: ' + e.toString());
  }
}

// --- Scheduled: Send lunch message (night before at 10 PM) ---
function sendLunchMessage() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const planSheet = ss.getSheetByName('Weekly Plan');
  const dbSheet = ss.getSheetByName('Meal DB');
  const data = planSheet.getDataRange().getValues();
  const mealLookup = buildMealLookup(dbSheet);

  // Tomorrow's date
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = Utilities.formatDate(tomorrow, CONFIG.TIMEZONE, 'dd-MMM-yyyy');

  for (let i = 1; i < data.length; i++) {
    const rowDate = Utilities.formatDate(new Date(data[i][0]), CONFIG.TIMEZONE, 'dd-MMM-yyyy');
    if (rowDate === tomorrowStr && data[i][2] === 'Lunch') {
      const dish = data[i][3];
      const headcount = data[i][9];
      const meal = mealLookup[dish] || { hindi_name: dish, ingredients: '', youtube_link: data[i][4] };

      const members = CONFIG.MEMBERS;
      let optOutList = [];
      for (let m = 0; m < members.length; m++) {
        if (data[i][5 + m] === 'OUT') {
          optOutList.push(members[m]);
        }
      }

      const message = buildWhatsAppMessage(meal, tomorrowStr, data[i][1], 'Lunch', headcount, optOutList);
      const ytLink = meal.youtube_link || data[i][4] || '';
      sendMealVoiceAndLink(message, ytLink);
      break;
    }
  }
}

// --- Scheduled: Send dinner message (same day 1 PM) ---
function sendDinnerMessage() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const planSheet = ss.getSheetByName('Weekly Plan');
  const dbSheet = ss.getSheetByName('Meal DB');
  const data = planSheet.getDataRange().getValues();
  const mealLookup = buildMealLookup(dbSheet);

  const today = new Date();
  const todayStr = Utilities.formatDate(today, CONFIG.TIMEZONE, 'dd-MMM-yyyy');

  for (let i = 1; i < data.length; i++) {
    const rowDate = Utilities.formatDate(new Date(data[i][0]), CONFIG.TIMEZONE, 'dd-MMM-yyyy');
    if (rowDate === todayStr && data[i][2] === 'Dinner') {
      const dish = data[i][3];
      const headcount = data[i][9];
      const meal = mealLookup[dish] || { hindi_name: dish, ingredients: '', youtube_link: data[i][4] };

      const members = CONFIG.MEMBERS;
      let optOutList = [];
      for (let m = 0; m < members.length; m++) {
        if (data[i][5 + m] === 'OUT') {
          optOutList.push(members[m]);
        }
      }

      const message = buildWhatsAppMessage(meal, todayStr, data[i][1], 'Dinner', headcount, optOutList);
      const ytLink = meal.youtube_link || data[i][4] || '';
      sendMealVoiceAndLink(message, ytLink);
      break;
    }
  }
}

// Helper: build dish name -> meal data lookup from DB
function buildMealLookup(dbSheet) {
  const dbData = dbSheet.getDataRange().getValues();
  const lookup = {};
  for (let i = 1; i < dbData.length; i++) {
    lookup[dbData[i][1]] = {
      hindi_name: dbData[i][2],
      ingredients: dbData[i][6],
      youtube_link: dbData[i][8],
      hindi_instructions: dbData[i][7]
    };
  }
  return lookup;
}

// ===================== TRIGGERS SETUP =======================
function setupTriggers() {
  // Remove existing triggers first
  removeAllTriggers();

  // Sunday 8 AM - Generate draft plan (you finalize manually)
  ScriptApp.newTrigger('generateDraftPlan')
    .timeBased()
    .onWeekDay(ScriptApp.WeekDay.SUNDAY)
    .atHour(8)
    .create();

  // Daily 10 PM - Send next day's lunch
  ScriptApp.newTrigger('sendLunchMessage')
    .timeBased()
    .everyDays(1)
    .atHour(22)
    .create();

  // Daily 1 PM - Send today's dinner
  ScriptApp.newTrigger('sendDinnerMessage')
    .timeBased()
    .everyDays(1)
    .atHour(13)
    .create();

  SpreadsheetApp.getUi().alert(
    'Triggers set up!\n\n' +
    '- Sunday 8 AM: Auto-generate draft plan (you review & finalize)\n' +
    '- Daily 10 PM: Send next day lunch to WhatsApp\n' +
    '- Daily 1 PM: Send today dinner to WhatsApp'
  );
}

function removeAllTriggers() {
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => ScriptApp.deleteTrigger(trigger));
}

// ===================== UTILITY FUNCTIONS ====================

// Manual send: Today's lunch voice note
function sendTodayLunchNow() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const planSheet = ss.getSheetByName('Weekly Plan');
  const dbSheet = ss.getSheetByName('Meal DB');
  const data = planSheet.getDataRange().getValues();
  const mealLookup = buildMealLookup(dbSheet);

  const today = new Date();
  const todayStr = Utilities.formatDate(today, CONFIG.TIMEZONE, 'dd-MMM-yyyy');

  for (let i = 1; i < data.length; i++) {
    const rowDate = Utilities.formatDate(new Date(data[i][0]), CONFIG.TIMEZONE, 'dd-MMM-yyyy');
    if (rowDate === todayStr && data[i][2] === 'Lunch') {
      const dish = data[i][3];
      const headcount = data[i][9];
      const meal = mealLookup[dish] || { hindi_name: dish, ingredients: '', youtube_link: data[i][4] };

      let optOutList = [];
      for (let m = 0; m < CONFIG.MEMBERS.length; m++) {
        if (data[i][5 + m] === 'OUT') optOutList.push(CONFIG.MEMBERS[m]);
      }

      const message = buildWhatsAppMessage(meal, todayStr, data[i][1], 'Lunch', headcount, optOutList);
      const ytLink = meal.youtube_link || data[i][4] || '';
      sendMealVoiceAndLink(message, ytLink);
      SpreadsheetApp.getUi().alert('Lunch message sent for today: ' + dish);
      return;
    }
  }
  SpreadsheetApp.getUi().alert('No lunch found for today in the Weekly Plan.');
}

// Manual send: Today's dinner voice note
function sendTodayDinnerNow() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const planSheet = ss.getSheetByName('Weekly Plan');
  const dbSheet = ss.getSheetByName('Meal DB');
  const data = planSheet.getDataRange().getValues();
  const mealLookup = buildMealLookup(dbSheet);

  const today = new Date();
  const todayStr = Utilities.formatDate(today, CONFIG.TIMEZONE, 'dd-MMM-yyyy');

  for (let i = 1; i < data.length; i++) {
    const rowDate = Utilities.formatDate(new Date(data[i][0]), CONFIG.TIMEZONE, 'dd-MMM-yyyy');
    if (rowDate === todayStr && data[i][2] === 'Dinner') {
      const dish = data[i][3];
      const headcount = data[i][9];
      const meal = mealLookup[dish] || { hindi_name: dish, ingredients: '', youtube_link: data[i][4] };

      let optOutList = [];
      for (let m = 0; m < CONFIG.MEMBERS.length; m++) {
        if (data[i][5 + m] === 'OUT') optOutList.push(CONFIG.MEMBERS[m]);
      }

      const message = buildWhatsAppMessage(meal, todayStr, data[i][1], 'Dinner', headcount, optOutList);
      const ytLink = meal.youtube_link || data[i][4] || '';
      sendMealVoiceAndLink(message, ytLink);
      SpreadsheetApp.getUi().alert('Dinner message sent for today: ' + dish);
      return;
    }
  }
  SpreadsheetApp.getUi().alert('No dinner found for today in the Weekly Plan.');
}

function sendTestMessage() {
  const testMsg = 'Ye ek test hai Meal Planner se. Agar ye voice message aaya hai toh WhatsApp integration kaam kar raha hai.';

  // Send as voice note, fallback to text
  const audioBlob = textToSpeechHindi(testMsg);
  if (audioBlob && sendVoiceNote(audioBlob)) {
    SpreadsheetApp.getUi().alert('Test voice note sent! Check your WhatsApp group.');
  } else {
    // Fallback to text
    sendWhatsAppMessage(testMsg);
    SpreadsheetApp.getUi().alert('Voice note failed, sent as text instead. Check your WhatsApp group.\n\nIf voice notes keep failing, Google TTS might be blocked. The system will auto-fallback to text messages.');
  }
}

// On-edit trigger to update headcount when attendance changes
function onEdit(e) {
  const sheet = e.source.getActiveSheet();
  if (sheet.getName() !== 'Weekly Plan') return;

  const col = e.range.getColumn();
  const row = e.range.getRow();

  // Columns 6-9 are member attendance
  if (col >= 6 && col <= 9 && row >= 2) {
    // Headcount formula should auto-update, but force it
    const formula = `=COUNTIF(F${row}:I${row},"IN")`;
    sheet.getRange(row, 10).setFormula(formula);
  }
}
