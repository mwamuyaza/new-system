import { User, Student, Staff, Class, Subject, Classroom, ClassroomAssignment, Grade, SystemLog, FeeStructure } from '../types';

export interface FeePayment {
  id: number;
  studentId: number;
  amountPaid: number;
  paymentDate: string;
  paymentMethod: string;
  transactionId: string;
  receiptNo: string;
  remarks: string;
  academicYear: string;
}

export interface SalaryStructure {
  id: number;
  staffId: number;
  basicSalary: number;
  allowances: number;
  deductions: number;
  effectiveFrom: string;
}

export interface SalaryPayment {
  id: number;
  staffId: number;
  amount: number;
  paymentDate: string;
  month: number;
  year: number;
  paymentMethod: string;
  transactionId: string;
  status: string;
}

export interface StaffSubject {
  id: number;
  staffId: number;
  subjectId: number;
  academicYear: string;
}

export interface StudentEnrollment {
  id: number;
  studentId: number;
  classId: number;
  enrollmentDate: string;
  status: 'ACTIVE' | 'COMPLETED' | 'DROPPED';
}

export interface CourseNote {
  id: number;
  subjectId: number;
  title: string;
  description: string;
  fileUrl: string;
  uploadedBy: string;
  createdAt: string;
}

export interface Assessment {
  id: number;
  subjectId: number;
  type: 'QUIZ' | 'ASSIGNMENT';
  title: string;
  description: string;
  maxPoints: number;
  durationMinutes: number;
  deadline: string;
  questions?: Array<{
    id: number;
    text: string;
    options: string[];
    correctAnswerIndex: number;
  }>;
}

export interface StudentSubmission {
  id: number;
  assessmentId: number;
  studentId: number;
  submittedAnswers?: number[];
  submittedText?: string;
  score?: number;
  feedback?: string;
  submittedAt: string;
  status: 'SUBMITTED' | 'GRADED';
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  text: string;
  html: string;
}

export interface OutboxMessage {
  id: string;
  to: string;
  subject: string;
  body: string;
  sentAt: string;
  code?: string;
}

export interface MockDbState {
  users: User[];
  students: Student[];
  staff: Staff[];
  classes: Class[];
  subjects: Subject[];
  staffSubjects: StaffSubject[];
  studentEnrollments: StudentEnrollment[];
  feeStructures: FeeStructure[];
  feePayments: FeePayment[];
  salaryStructures: SalaryStructure[];
  salaryPayments: SalaryPayment[];
  classrooms: Classroom[];
  classroomAssignments: ClassroomAssignment[];
  grades: Grade[];
  attendance: any[];
  logs: SystemLog[];
  courseNotes: CourseNote[];
  quizzesAndAssignments: Assessment[];
  studentSubmissions: StudentSubmission[];
  emailTemplates: EmailTemplate[];
  outbox: OutboxMessage[];
  nextId: { [key: string]: number };
}
