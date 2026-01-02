export const users = [
  { id: "s001", password: "pass1", role: "student", name: "Sneha Agarwal" },
  { id: "s002", password: "pass2", role: "student", name: "Sneha Das" },
  { id: "s003", password: "pass3", role: "student", name: "Arpayitri Bhattacharyya" },
  { id: "s004", password: "pass4", role: "student", name: "Sakshi Agarwal" },
  { id: "admin", password: "admin123", role: "admin", name: "Administrator" },
  { id: "faculty01", password: "faculty123", role: "facultyReviewer", name: "facultyReviewer" },
  { id: "office01", password: "office123", role: "admissionOfficer", name: "admissionOfficer" },
];

// Default progress structure per student
export const defaultProgress = {
  register: true,
  formFillUp: true,
  uploadDocuments: true,
  payment: true,
  documentVerified: false,
  interviewDate: "",
  entranceExamGiven: false,
  selected: false,
};
