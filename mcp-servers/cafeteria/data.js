// Mock data standing in for the cafeteria's weekly PDF menu and live counter feed.
// In production, the PDF would be parsed on a schedule (e.g. with pdf-parse) and
// the crowd levels would come from a turnstile/IoT counter API.

export const messHalls = [
  { id: "MESS-1", name: "Main Mess Hall", location: "Block A, Ground Floor" },
  { id: "MESS-2", name: "North Campus Food Court", location: "Block D" },
  { id: "CAFE-1", name: "Brew & Books Cafe", location: "Library Annex" }
];

const weeklyMenu = {
  Monday: {
    breakfast: ["Idli & Sambar", "Bread Omelette", "Filter Coffee", "Fresh Fruit Bowl"],
    lunch: ["Veg Thali", "Chicken Curry", "Jeera Rice", "Curd", "Salad"],
    snacks: ["Samosa", "Tea/Coffee", "Banana Chips"],
    dinner: ["Chapati", "Paneer Butter Masala", "Dal Tadka", "Steamed Rice"]
  },
  Tuesday: {
    breakfast: ["Poha", "Boiled Eggs", "Tea/Coffee", "Toast & Jam"],
    lunch: ["Veg Biryani", "Raita", "Egg Curry", "Papad"],
    snacks: ["Vada Pav", "Lemon Tea", "Mixture"],
    dinner: ["Roti", "Mixed Veg Curry", "Rajma", "Rice", "Gulab Jamun"]
  },
  Wednesday: {
    breakfast: ["Dosa & Chutney", "Sprouts Salad", "Tea/Coffee"],
    lunch: ["Rajma Chawal", "Aloo Gobi", "Chicken 65", "Buttermilk"],
    snacks: ["Bhel Puri", "Coffee", "Cookies"],
    dinner: ["Naan", "Dal Makhani", "Veg Pulao", "Fruit Custard"]
  },
  Thursday: {
    breakfast: ["Upma", "Boiled Chana", "Tea/Coffee"],
    lunch: ["Chole Bhature", "Mixed Raita", "Fish Fry", "Salad"],
    snacks: ["Pakora", "Masala Chai", "Roasted Peanuts"],
    dinner: ["Chapati", "Kadai Paneer", "Sambar", "Rice", "Halwa"]
  },
  Friday: {
    breakfast: ["Paratha & Curd", "Pickle", "Tea/Coffee"],
    lunch: ["South Indian Thali", "Curd Rice", "Mutton Curry", "Papad"],
    snacks: ["Sandwich", "Cold Coffee", "Fruit Salad"],
    dinner: ["Pasta", "Garlic Bread", "Soup", "Brownie"]
  },
  Saturday: {
    breakfast: ["Chole Kulche", "Lassi", "Tea/Coffee"],
    lunch: ["Pulao", "Veg Kofta", "Egg Bhurji", "Salad"],
    snacks: ["Pani Puri", "Tea/Coffee", "Murukku"],
    dinner: ["Tandoori Roti", "Dal Fry", "Chicken Tikka", "Rice", "Ice Cream"]
  },
  Sunday: {
    breakfast: ["Masala Dosa", "Filter Coffee", "Fruit Bowl"],
    lunch: ["Special Sunday Thali", "Sweet (Kheer)", "Papad", "Curd"],
    snacks: ["Burger", "Milkshake", "Fries"],
    dinner: ["Veg Fried Rice", "Manchurian", "Soup", "Cake Slice"]
  }
};

const operatingHours = {
  "MESS-1": {
    breakfast: "07:30 - 09:30",
    lunch: "12:00 - 14:30",
    snacks: "16:30 - 18:00",
    dinner: "19:30 - 22:00"
  },
  "MESS-2": {
    breakfast: "08:00 - 10:00",
    lunch: "12:30 - 15:00",
    snacks: "16:00 - 18:30",
    dinner: "19:00 - 21:30"
  },
  "CAFE-1": {
    breakfast: "08:00 - 11:00",
    lunch: "11:00 - 16:00",
    snacks: "16:00 - 20:00",
    dinner: "20:00 - 22:30"
  }
};

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function getTodayName() {
  return DAY_NAMES[new Date().getDay()];
}

export function getMenu(day) {
  const dayName = day && weeklyMenu[day] ? day : getTodayName();
  return { day: dayName, menu: weeklyMenu[dayName] };
}

export function getFullWeekMenu() {
  return weeklyMenu;
}

export function getOperatingHours(messId) {
  if (messId) return { [messId]: operatingHours[messId] || null };
  return operatingHours;
}

export function getCurrentMealSlot() {
  const now = new Date();
  const minutes = now.getHours() * 60 + now.getMinutes();
  const slots = [
    { name: "breakfast", start: 7 * 60 + 30, end: 9 * 60 + 30 },
    { name: "lunch", start: 12 * 60, end: 14 * 60 + 30 },
    { name: "snacks", start: 16 * 60, end: 18 * 60 },
    { name: "dinner", start: 19 * 60, end: 22 * 60 }
  ];
  const active = slots.find((s) => minutes >= s.start && minutes <= s.end);
  return active ? active.name : "closed";
}

// Deterministic pseudo-live crowd levels (Low / Medium / High) based on time of day.
export function getCrowdLevels() {
  const now = new Date();
  const minute = now.getHours() * 60 + now.getMinutes();
  const currentSlot = getCurrentMealSlot();

  return messHalls.map((hall, idx) => {
    let level = "Low";
    if (currentSlot !== "closed") {
      const score = (minute + idx * 17) % 100;
      if (score > 70) level = "High";
      else if (score > 35) level = "Medium";
    }
    return {
      ...hall,
      currentSlot,
      crowdLevel: level,
      estimatedWaitMinutes: level === "High" ? 12 : level === "Medium" ? 5 : 0,
      lastUpdated: now.toISOString()
    };
  });
}
