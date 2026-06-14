// In-memory mock dataset standing in for the legacy library portal.
// Replace this module with real catalogue/ILS API calls in production.

export const books = [
  {
    id: "BK-1001",
    title: "Introduction to Algorithms",
    author: "Cormen, Leiserson, Rivest, Stein",
    isbn: "978-0262046305",
    category: "Computer Science",
    totalCopies: 4,
    availableCopies: 1,
    shelfLocation: "CS-204-A",
    dueDate: "2026-06-20"
  },
  {
    id: "BK-1002",
    title: "Clean Code",
    author: "Robert C. Martin",
    isbn: "978-0132350884",
    category: "Computer Science",
    totalCopies: 3,
    availableCopies: 3,
    shelfLocation: "CS-118-B",
    dueDate: null
  },
  {
    id: "BK-1003",
    title: "Operating System Concepts",
    author: "Silberschatz, Galvin, Gagne",
    isbn: "978-1119800361",
    category: "Computer Science",
    totalCopies: 5,
    availableCopies: 0,
    shelfLocation: "CS-210-C",
    dueDate: "2026-06-17"
  },
  {
    id: "BK-2001",
    title: "Linear Algebra and Its Applications",
    author: "David C. Lay",
    isbn: "978-0321982384",
    category: "Mathematics",
    totalCopies: 6,
    availableCopies: 2,
    shelfLocation: "MA-045-A",
    dueDate: "2026-06-25"
  },
  {
    id: "BK-2002",
    title: "Probability and Statistics for Engineers",
    author: "Ronald E. Walpole",
    isbn: "978-0321629111",
    category: "Mathematics",
    totalCopies: 4,
    availableCopies: 4,
    shelfLocation: "MA-052-D",
    dueDate: null
  },
  {
    id: "BK-3001",
    title: "Physics for Scientists and Engineers",
    author: "Serway & Jewett",
    isbn: "978-1337553278",
    category: "Physics",
    totalCopies: 5,
    availableCopies: 1,
    shelfLocation: "PH-301-A",
    dueDate: "2026-06-22"
  },
  {
    id: "BK-4001",
    title: "Deep Learning",
    author: "Ian Goodfellow, Yoshua Bengio, Aaron Courville",
    isbn: "978-0262035613",
    category: "Computer Science",
    totalCopies: 3,
    availableCopies: 0,
    shelfLocation: "CS-220-A",
    dueDate: "2026-06-16"
  },
  {
    id: "BK-4002",
    title: "Designing Data-Intensive Applications",
    author: "Martin Kleppmann",
    isbn: "978-1449373320",
    category: "Computer Science",
    totalCopies: 2,
    availableCopies: 2,
    shelfLocation: "CS-225-B",
    dueDate: null
  }
];

// Reading room / study hall seat availability, refreshed periodically by
// a sensor feed in a real deployment. Here it's a static snapshot plus a
// small deterministic "drift" function so repeated calls feel live.
const studyHalls = [
  { id: "HALL-A", name: "Central Reading Hall", floor: "Ground Floor", totalSeats: 120 },
  { id: "HALL-B", name: "Silent Study Zone", floor: "1st Floor", totalSeats: 60 },
  { id: "HALL-C", name: "Group Discussion Pods", floor: "2nd Floor", totalSeats: 40 },
  { id: "HALL-D", name: "24/7 Night Reading Room", floor: "Basement", totalSeats: 30 }
];

export function getSeatAvailability() {
  const now = new Date();
  const minuteSeed = now.getUTCHours() * 60 + now.getUTCMinutes();

  return studyHalls.map((hall, idx) => {
    // Deterministic pseudo-occupancy based on time of day, purely for demo purposes.
    const base = (minuteSeed * (idx + 3)) % hall.totalSeats;
    const occupied = Math.min(hall.totalSeats, Math.max(0, base));
    return {
      ...hall,
      occupiedSeats: occupied,
      availableSeats: hall.totalSeats - occupied,
      lastUpdated: now.toISOString()
    };
  });
}

export function searchBooks(query) {
  const q = (query || "").trim().toLowerCase();
  if (!q) return books;
  return books.filter((b) =>
    b.title.toLowerCase().includes(q) ||
    b.author.toLowerCase().includes(q) ||
    b.category.toLowerCase().includes(q) ||
    b.isbn.includes(q)
  );
}

export function getBookById(id) {
  return books.find((b) => b.id === id || b.isbn === id) || null;
}
