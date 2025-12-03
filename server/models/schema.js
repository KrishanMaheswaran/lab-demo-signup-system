// server/models/schema.js
// Overall in-memory schema for lab4 data.
// This is the data that lives in server/data/db.json

export const defaultDB = {
  // Courses: each lab / course the TA manages
  // id: number
  // term: "2024F", etc
  // code: "CS2208"
  // section: "001"
  // name: "Web Technologies"
  courses: [],

  // Members: students enrolled in a course
  // id: number
  // courseId: number (FK -> courses.id)
  // username: string  (matches login username / ID)
  // firstName: string
  // lastName: string
  members: [],

  // Sign-up sheets: assignment or lab sign-up sheets per course
  // id: number
  // courseId: number
  // assignmentName: string
  // description: string
  sheets: [],

  // Slots inside a sheet
  // id: number
  // sheetId: number
  // startTime: ISO string
  // endTime: ISO string
  // maxMembers: number
  // signupMemberIds: [memberId, ...]
  slots: [],

  // Grades per member per slot
  // id: number
  // slotId: number
  // memberId: number
  // baseMark: number
  // bonus: number
  // penalty: number
  // finalMark: number
  // comment: string
  // taUsername: string
  // gradedAt: ISO string
  grades: [],

  // Audit log for last change on a grade
  // id: number
  // gradeId: number
  // changedBy: string (TA/admin username)
  // changedAt: ISO string
  // summary: string
  audits: []
};
