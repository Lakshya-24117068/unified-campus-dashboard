// Mock data standing in for academic handbook PDFs, course catalogues, and
// the academic calendar. In production this would be extracted from PDFs
// (e.g. with pdf-parse) and a student information system API.

function addDays(dateStr, days) {
  const d = new Date(dateStr + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

const TODAY = new Date().toISOString().slice(0, 10);

export const courses = [
  {
    code: "CS301",
    name: "Data Structures and Algorithms",
    credits: 4,
    instructor: "Dr. A. Sharma",
    schedule: [
      { day: "Monday", time: "09:00 - 10:00", room: "CS-101" },
      { day: "Wednesday", time: "09:00 - 10:00", room: "CS-101" },
      { day: "Friday", time: "11:00 - 12:00", room: "CS-Lab-2" }
    ],
    syllabusHighlights: [
      "Arrays, Linked Lists, Trees, Graphs",
      "Sorting and Searching algorithms",
      "Dynamic Programming",
      "Graph algorithms (Dijkstra, BFS/DFS, MST)"
    ]
  },
  {
    code: "CS305",
    name: "Database Management Systems",
    credits: 3,
    instructor: "Dr. P. Iyer",
    schedule: [
      { day: "Tuesday", time: "10:00 - 11:00", room: "CS-104" },
      { day: "Thursday", time: "10:00 - 11:00", room: "CS-104" }
    ],
    syllabusHighlights: [
      "Relational model & normalization",
      "SQL & transactions",
      "Indexing and query optimization",
      "NoSQL overview"
    ]
  },
  {
    code: "CS412",
    name: "Machine Learning",
    credits: 4,
    instructor: "Dr. R. Nair",
    schedule: [
      { day: "Monday", time: "14:00 - 15:30", room: "CS-Lab-1" },
      { day: "Thursday", time: "14:00 - 15:30", room: "CS-Lab-1" }
    ],
    syllabusHighlights: [
      "Supervised & unsupervised learning",
      "Neural networks fundamentals",
      "Model evaluation & regularization",
      "Intro to deep learning frameworks"
    ]
  },
  {
    code: "MA210",
    name: "Probability and Statistics",
    credits: 3,
    instructor: "Dr. S. Menon",
    schedule: [
      { day: "Tuesday", time: "09:00 - 10:00", room: "MA-201" },
      { day: "Friday", time: "09:00 - 10:00", room: "MA-201" }
    ],
    syllabusHighlights: ["Random variables", "Distributions", "Hypothesis testing", "Regression basics"]
  }
];

export const academicCalendar = [
  {
    id: "CAL-001",
    title: "Mid-Semester Exams Begin",
    date: addDays(TODAY, 7),
    category: "Exam",
    description: "Mid-semester examinations for all UG/PG programs begin. Check individual timetables on the portal."
  },
  {
    id: "CAL-002",
    title: "Last Date to Submit Course Withdrawal Form",
    date: addDays(TODAY, 3),
    category: "Deadline",
    description: "Students wishing to withdraw from an elective must submit Form AC-7 to the academic office."
  },
  {
    id: "CAL-003",
    title: "CS412 Assignment 2 Due",
    date: addDays(TODAY, 2),
    category: "Assignment",
    description: "Machine Learning Assignment 2 (Logistic Regression from scratch) due on the LMS by 23:59."
  },
  {
    id: "CAL-004",
    title: "Semester Fee Payment Deadline",
    date: addDays(TODAY, 10),
    category: "Deadline",
    description: "Late fee of ₹500/day applies after this date. Pay via the student portal."
  },
  {
    id: "CAL-005",
    title: "Spring Break",
    date: addDays(TODAY, 14),
    category: "Holiday",
    description: "Campus closed for Spring Break. Resumes the following Monday."
  },
  {
    id: "CAL-006",
    title: "DBMS Lab Practical Exam",
    date: addDays(TODAY, 5),
    category: "Exam",
    description: "CS305 practical exam in CS-104. Bring your lab record and ID card."
  }
];

const policies = {
  attendance: {
    title: "Attendance Policy",
    summary:
      "A minimum of 75% attendance is required in each course to be eligible to sit for the end-semester " +
      "examination. Students with 65-74% attendance may apply for condonation with valid medical documentation " +
      "via Form AC-3. Below 65% attendance results in automatic detention from the exam for that course.",
    formRequired: "AC-3 (Condonation Request)"
  },
  grading: {
    title: "Grading Policy",
    summary:
      "Final grades combine continuous assessment (40%) and end-semester examination (60%). The grading scale " +
      "is: A (90-100), B (75-89), C (60-74), D (50-59), F (below 50). A minimum overall grade of D is required " +
      "to pass a course; courses graded F must be repeated.",
    formRequired: null
  },
  reExamination: {
    title: "Re-examination / Supplementary Exam Policy",
    summary:
      "Students who receive an F grade, or who miss the end-semester exam with prior approved leave, may apply " +
      "for the supplementary examination held approximately 4 weeks after results are published. Application " +
      "must be submitted via Form AC-9 along with the prescribed fee before the published deadline.",
    formRequired: "AC-9 (Supplementary Exam Application)"
  },
  leaveOfAbsence: {
    title: "Leave of Absence Policy",
    summary:
      "Students requiring an extended leave of absence (more than 7 consecutive days) must submit Form AC-5, " +
      "co-signed by their faculty advisor and the head of department, to the Dean of Academic Affairs at least " +
      "5 working days in advance, except in documented medical emergencies.",
    formRequired: "AC-5 (Leave of Absence Request)"
  }
};

export function getCourses() {
  return courses;
}

export function getCourseByCode(code) {
  if (!code) return null;
  return courses.find((c) => c.code.toLowerCase() === code.toLowerCase()) || null;
}

export function searchCourses(query) {
  const q = (query || "").trim().toLowerCase();
  if (!q) return courses;
  return courses.filter(
    (c) =>
      c.code.toLowerCase().includes(q) ||
      c.name.toLowerCase().includes(q) ||
      c.instructor.toLowerCase().includes(q)
  );
}

export function getUpcomingDeadlines(limit) {
  const sorted = [...academicCalendar]
    .filter((e) => e.date >= TODAY)
    .sort((a, b) => a.date.localeCompare(b.date));
  return limit ? sorted.slice(0, limit) : sorted;
}

export function searchCalendar(query) {
  const q = (query || "").trim().toLowerCase();
  if (!q) return academicCalendar;
  return academicCalendar.filter(
    (e) =>
      e.title.toLowerCase().includes(q) ||
      e.category.toLowerCase().includes(q) ||
      e.description.toLowerCase().includes(q)
  );
}

export function getPolicy(topic) {
  if (!topic) return policies;
  const key = Object.keys(policies).find(
    (k) => k.toLowerCase() === topic.toLowerCase() || policies[k].title.toLowerCase().includes(topic.toLowerCase())
  );
  return key ? { [key]: policies[key] } : null;
}

export function getAllPolicies() {
  return policies;
}

export { TODAY };
