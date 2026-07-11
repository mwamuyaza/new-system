export interface User {
  id: number;
  username: string;
  email: string;
  role: 'ADMIN' | 'STAFF' | 'STUDENT';
  isActive: boolean;
  createdAt: string;
  isVerified?: boolean;
  verificationCode?: string;
  resetCode?: string;
  password?: string;
}


export interface Student {
  id: number;
  userId: number;
  studentId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  phone: string;
  address: string;
  enrollmentDate: string;
  status: 'ACTIVE' | 'GRADUATED' | 'SUSPENDED' | 'WITHDRAWN' | 'PENDING_APPROVAL';
  adminApproved?: boolean;
  lecturerApproved?: boolean;
  profilePic?: string;
  email: string;
  classesDetails?: Array<{
    id: number;
    className: string;
    section: string;
    academicYear: string;
    capacity: number;
    description: string;
    enrollmentStatus: string;
    enrollmentId: number;
  }>;
}

export interface Staff {
  id: number;
  userId: number;
  staffId: string;
  firstName: string;
  lastName: string;
  position: string;
  department: string;
  qualification: string;
  joiningDate: string;
  phone: string;
  email: string;
  address: string;
  status: 'ACTIVE' | 'ON_LEAVE' | 'TERMINATED' | 'PENDING_APPROVAL';
  profilePic?: string;
  salaryStructure?: {
    id: number;
    staffId: number;
    basicSalary: number;
    allowances: number;
    deductions: number;
    effectiveFrom: string;
  } | null;
  paymentsHistory?: Array<{
    id: number;
    staffId: number;
    amount: number;
    paymentDate: string;
    month: number;
    year: number;
    paymentMethod: string;
    transactionId: string;
    status: string;
  }>;
  subjectsAllocations?: Array<{
    id: number;
    subjectCode: string;
    subjectName: string;
    credits: number;
    description: string;
    classId: number | null;
    allocationId: number;
    academicYear: string;
  }>;
}

export interface Class {
  id: number;
  className: string;
  section: string;
  academicYear: string;
  capacity: number;
  description: string;
}

export interface Subject {
  id: number;
  subjectCode: string;
  subjectName: string;
  credits: number;
  description: string;
  classId: number | null;
}

export interface Classroom {
  id: number;
  roomNumber: string;
  building: string;
  capacity: number;
  hasProjector: boolean;
  hasAc: boolean;
}

export interface ClassroomAssignment {
  id: number;
  classroomId: number;
  classId: number;
  subjectId: number;
  staffId: number;
  dayOfWeek: 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY';
  startTime: string;
  endTime: string;
  academicYear: string;
  roomDetails?: Classroom | null;
  classDetails?: Class | null;
  subjectDetails?: Subject | null;
  staffDetails?: string;
}

export interface Grade {
  id: number;
  studentId: number;
  subjectId: number;
  marksObtained: number;
  totalMarks: number;
  grade: string;
  examType: 'MID_TERM' | 'FINAL_TERM' | 'QUIZ' | 'ASSIGNMENT';
  academicYear: string;
  studentDetails?: Student | null;
  subjectDetails?: Subject | null;
}

export interface SystemLog {
  id: number;
  userId: number;
  username: string;
  role: string;
  action: string;
  details: string;
  timestamp: string;
}

export interface FeeStructure {
  id: number;
  classId: number;
  academicYear: string;
  totalFees: number;
  admissionFee: number;
  tuitionFee: number;
  libraryFee: number;
  sportsFee: number;
  dueDate: string;
  lateFeePenalty: number;
}
