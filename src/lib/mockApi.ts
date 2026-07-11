import axios from 'axios';
import { getDb, saveDb, addLog, getStats, queueOutboxMessage } from './mockDb';
import { MockDbState } from './mockDbTypes';

// Custom simulation delay helper
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper to throw a standardized Axios mock error
const throwAxiosError = (status: number, message: string, data?: any) => {
  const error = new Error(`Request failed with status code ${status}`) as any;
  error.response = {
    data: data || { error: message },
    status,
    statusText: status === 401 ? 'Unauthorized' : 'Bad Request',
    headers: {},
    config: {}
  };
  throw error;
};

// Helper to extract query parameters from a URL
const parseQueryParams = (url: string): Record<string, string> => {
  try {
    const searchParams = new URL(url, 'http://localhost').searchParams;
    const params: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      params[key] = value;
    });
    return params;
  } catch {
    return {};
  }
};

// Helper to retrieve current authenticated user from Token header
const getAuthUserFromHeaders = (headers: any, db: MockDbState) => {
  const authHeader = headers?.Authorization || headers?.authorization;
  if (!authHeader || typeof authHeader !== 'string') {
    throwAxiosError(401, 'Authorization token is missing.');
  }
  const token = authHeader.replace('Bearer ', '').trim();
  if (!token.startsWith('mock_token_')) {
    throwAxiosError(401, 'Session signature is invalid or expired.');
  }
  const userId = parseInt(token.replace('mock_token_', ''), 10);
  const user = db.users.find(u => u.id === userId);
  if (!user) {
    throwAxiosError(401, 'User account was deleted or lockouts active.');
  }
  if (!user.isActive) {
    throwAxiosError(401, 'User account is locked or deactivated.');
  }
  return user;
};

// Main Simulated Router
export const initializeMockApi = () => {
  axios.defaults.adapter = async (config) => {
    await delay(350); // realistic latency simulation

    const db = getDb();
    const { url = '', method = 'GET', data: rawData, headers } = config;
    const pathname = url.split('?')[0];
    const query = parseQueryParams(url);
    const body = rawData ? (typeof rawData === 'string' ? JSON.parse(rawData) : rawData) : null;

    console.log(`[MOCK API] ${method} ${url}`, body);

    try {
      // ----------------------------------------------------------------
      // 1. AUTHENTICATION & REGISTRATION
      // ----------------------------------------------------------------

      if (pathname === '/api/auth/login' && method.toUpperCase() === 'POST') {
        const { username, password } = body || {};
        const user = db.users.find(u => u.username.toLowerCase() === username.toLowerCase());
        
        if (!user || user.password !== password) {
          throwAxiosError(400, 'Invalid username or password credentials');
        }

        // Check verification code (e.g. unverified)
        if (user.verificationCode) {
          throwAxiosError(400, 'ACCOUNT_UNVERIFIED', {
            error: 'ACCOUNT_UNVERIFIED',
            username: user.username,
            email: user.email,
            _debugCode: user.verificationCode
          });
        }

        if (!user.isActive) {
          throwAxiosError(400, 'This user account is currently locked out by administrators.');
        }

        let profile: any = null;
        if (user.role === 'STUDENT') {
          profile = db.students.find(s => s.userId === user.id) || null;
        } else if (user.role === 'STAFF') {
          profile = db.staff.find(s => s.userId === user.id) || null;
        }

        return {
          data: {
            token: `mock_token_${user.id}`,
            user: { id: user.id, username: user.username, email: user.email, role: user.role, isActive: user.isActive },
            profile
          },
          status: 200,
          statusText: 'OK',
          headers: {},
          config
        };
      }

      if (pathname === '/api/auth/signup' && method.toUpperCase() === 'POST') {
        const { username, password, email, firstName, lastName, dateOfBirth, gender, phone, address, classId } = body || {};
        
        if (db.users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
          throwAxiosError(400, 'Username already exists.');
        }
        if (db.users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
          throwAxiosError(400, 'Email address is already in use.');
        }

        const nextUserId = db.nextId.users++;
        const nextStudentId = db.nextId.students++;
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

        const newUser = {
          id: nextUserId,
          username,
          email,
          role: 'STUDENT' as const,
          isActive: false, // unverified until OTP input
          createdAt: new Date().toISOString(),
          password,
          verificationCode
        };

        const newStudent = {
          id: nextStudentId,
          userId: nextUserId,
          studentId: `STU${nextStudentId.toString().padStart(3, '0')}`,
          firstName,
          lastName,
          dateOfBirth,
          gender,
          phone,
          address,
          enrollmentDate: new Date().toISOString().split('T')[0],
          status: 'PENDING_APPROVAL' as const,
          email
        };

        db.users.push(newUser);
        db.students.push(newStudent);

        // Auto enroll student if class selection exists
        if (classId) {
          db.studentEnrollments.push({
            id: db.nextId.studentEnrollments++,
            studentId: nextStudentId,
            classId: parseInt(classId, 10),
            enrollmentDate: new Date().toISOString().split('T')[0],
            status: 'ACTIVE'
          });
        }

        saveDb(db);

        // Queue student onboarding email with verification code
        const msg = `Hello ${firstName},\n\nWelcome to University Hub! Your 6-digit verification code is: ${verificationCode}\n\nPlease enter this code in the app to activate your account.`;
        queueOutboxMessage(email, 'Verify Your University Hub Account', msg, verificationCode);
        addLog(nextUserId, username, 'STUDENT', 'SIGNUP', `Student registered and verification code generated: ${verificationCode}`);

        return {
          data: {
            status: 'PENDING_VERIFICATION',
            username,
            email,
            _debugCode: verificationCode
          },
          status: 200,
          statusText: 'OK',
          headers: {},
          config
        };
      }

      if (pathname === '/api/auth/signup-staff' && method.toUpperCase() === 'POST') {
        const { email, firstName, lastName, phone, position, department, qualification, address } = body || {};
        
        if (db.users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
          throwAxiosError(400, 'Email is already in use by another account.');
        }

        const nextUserId = db.nextId.users++;
        const nextStaffId = db.nextId.staff++;
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        const genUsername = `${lastName.toLowerCase()}.staff`;
        const genPassword = `Staff@${Math.floor(100000 + Math.random() * 900000)}`;

        const newUser = {
          id: nextUserId,
          username: genUsername,
          email,
          role: 'STAFF' as const,
          isActive: false, // unverified until OTP input
          createdAt: new Date().toISOString(),
          password: genPassword,
          verificationCode
        };

        const newStaff = {
          id: nextStaffId,
          userId: nextUserId,
          staffId: `STF${nextStaffId.toString().padStart(3, '0')}`,
          firstName,
          lastName,
          position,
          department,
          qualification,
          joiningDate: new Date().toISOString().split('T')[0],
          phone,
          email,
          address,
          status: 'PENDING_APPROVAL' as const
        };

        db.users.push(newUser);
        db.staff.push(newStaff);
        saveDb(db);

        // Queue staff onboarding email
        const msg = `Hello Prof. ${firstName},\n\nWelcome to University Hub Faculty! Your login username (Surname) is: ${genUsername}\nYour temporary password is: ${genPassword}\nYour 6-digit verification code is: ${verificationCode}`;
        queueOutboxMessage(email, 'Verify Your University Hub Faculty Account', msg, verificationCode);
        addLog(nextUserId, genUsername, 'STAFF', 'FACULTY_SIGNUP', `Faculty requested registration. Generated temp pass: ${genPassword}, OTP: ${verificationCode}`);

        return {
          data: {
            status: 'PENDING_VERIFICATION',
            username: genUsername,
            email,
            _debugCode: verificationCode
          },
          status: 200,
          statusText: 'OK',
          headers: {},
          config
        };
      }

      if (pathname === '/api/auth/verify' && method.toUpperCase() === 'POST') {
        const { username, code } = body || {};
        const user = db.users.find(u => u.username.toLowerCase() === username.toLowerCase());
        
        if (!user) {
          throwAxiosError(400, 'User profile does not exist.');
        }

        if (user.verificationCode !== code) {
          throwAxiosError(400, 'The 6-digit verification code entered is invalid or expired.');
        }

        user.isActive = true;
        delete user.verificationCode;

        // Auto activate status in student/staff record
        if (user.role === 'STUDENT') {
          const student = db.students.find(s => s.userId === user.id);
          if (student) student.status = 'ACTIVE';
        } else if (user.role === 'STAFF') {
          const staff = db.staff.find(st => st.userId === user.id);
          if (staff) staff.status = 'ACTIVE';
        }

        saveDb(db);
        addLog(user.id, user.username, user.role, 'EMAIL_VERIFIED', 'Account verified successfully via sandbox SMS/Email OTP simulation.');

        let profile: any = null;
        if (user.role === 'STUDENT') {
          profile = db.students.find(s => s.userId === user.id) || null;
        } else if (user.role === 'STAFF') {
          profile = db.staff.find(s => s.userId === user.id) || null;
        }

        return {
          data: {
            token: `mock_token_${user.id}`,
            user: { id: user.id, username: user.username, email: user.email, role: user.role, isActive: user.isActive },
            profile
          },
          status: 200,
          statusText: 'OK',
          headers: {},
          config
        };
      }

      if (pathname === '/api/auth/resend-code' && method.toUpperCase() === 'POST') {
        const { username } = body || {};
        const user = db.users.find(u => u.username.toLowerCase() === username.toLowerCase());
        if (!user) throwAxiosError(400, 'User profile not found.');

        const code = Math.floor(100000 + Math.random() * 900000).toString();
        user.verificationCode = code;
        saveDb(db);

        queueOutboxMessage(user.email, 'Verify Your Account (Resend)', `Your code is ${code}`, code);

        return {
          data: { success: true, _debugCode: code },
          status: 200,
          statusText: 'OK',
          headers: {},
          config
        };
      }

      if (pathname === '/api/auth/forgot-password-request' && method.toUpperCase() === 'POST') {
        const { username, email } = body || {};
        const user = db.users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.email.toLowerCase() === email.toLowerCase());
        
        if (!user) {
          throwAxiosError(400, 'No account matching that username and email combination was discovered.');
        }

        const code = Math.floor(100000 + Math.random() * 900000).toString();
        user.resetCode = code;
        saveDb(db);

        queueOutboxMessage(email, 'Reset Your University Hub Credentials', `Your reset authorization code is: ${code}`, code);

        return {
          data: { success: true, _debugCode: code },
          status: 200,
          statusText: 'OK',
          headers: {},
          config
        };
      }

      if (pathname === '/api/auth/forgot-password' && method.toUpperCase() === 'POST') {
        const { username, code, newPassword } = body || {};
        const user = db.users.find(u => u.username.toLowerCase() === username.toLowerCase());
        
        if (!user) {
          throwAxiosError(400, 'Account not found.');
        }

        if (user.resetCode !== code) {
          throwAxiosError(400, 'The reset authorization code is incorrect or expired.');
        }

        user.password = newPassword;
        delete user.resetCode;
        saveDb(db);

        addLog(user.id, user.username, user.role, 'PASSWORD_RESET', 'User security credentials successfully updated via authorization code.');

        return {
          data: { success: true },
          status: 200,
          statusText: 'OK',
          headers: {},
          config
        };
      }

      if (pathname === '/api/auth/logout' && method.toUpperCase() === 'POST') {
        return {
          data: { success: true },
          status: 200,
          statusText: 'OK',
          headers: {},
          config
        };
      }

      if (pathname === '/api/auth/me' && method.toUpperCase() === 'GET') {
        const user = getAuthUserFromHeaders(headers, db);
        let profile: any = null;
        if (user.role === 'STUDENT') {
          profile = db.students.find(s => s.userId === user.id) || null;
        } else if (user.role === 'STAFF') {
          profile = db.staff.find(s => s.userId === user.id) || null;
        }

        return {
          data: { user, profile },
          status: 200,
          statusText: 'OK',
          headers: {},
          config
        };
      }

      // ----------------------------------------------------------------
      // 2. DASHBOARD & STATS
      // ----------------------------------------------------------------

      if (pathname === '/api/dashboard/stats' && method.toUpperCase() === 'GET') {
        const user = getAuthUserFromHeaders(headers, db);
        const { startDate, endDate } = query;
        const stats = getStats(startDate, endDate);

        return {
          data: stats,
          status: 200,
          statusText: 'OK',
          headers: {},
          config
        };
      }

      // ----------------------------------------------------------------
      // 3. CLASSES & SUBJECTS & CLASSROOMS
      // ----------------------------------------------------------------

      if (pathname === '/api/classes') {
        getAuthUserFromHeaders(headers, db);
        if (method.toUpperCase() === 'GET') {
          return { data: db.classes, status: 200, statusText: 'OK', headers: {}, config };
        }
        if (method.toUpperCase() === 'POST') {
          const id = db.nextId.classes++;
          const newClass = { id, ...body };
          db.classes.push(newClass);
          saveDb(db);
          return { data: newClass, status: 200, statusText: 'OK', headers: {}, config };
        }
      }

      if (pathname.startsWith('/api/classes/') && method.toUpperCase() === 'DELETE') {
        getAuthUserFromHeaders(headers, db);
        const classId = parseInt(pathname.replace('/api/classes/', ''), 10);
        db.classes = db.classes.filter(c => c.id !== classId);
        saveDb(db);
        return { data: { success: true }, status: 200, statusText: 'OK', headers: {}, config };
      }

      if (pathname === '/api/subjects') {
        getAuthUserFromHeaders(headers, db);
        if (method.toUpperCase() === 'GET') {
          return { data: db.subjects, status: 200, statusText: 'OK', headers: {}, config };
        }
        if (method.toUpperCase() === 'POST') {
          const id = db.nextId.subjects++;
          const newSub = { id, ...body };
          db.subjects.push(newSub);
          saveDb(db);
          return { data: newSub, status: 200, statusText: 'OK', headers: {}, config };
        }
      }

      if (pathname.startsWith('/api/subjects/') && method.toUpperCase() === 'DELETE') {
        getAuthUserFromHeaders(headers, db);
        const subId = parseInt(pathname.replace('/api/subjects/', ''), 10);
        db.subjects = db.subjects.filter(s => s.id !== subId);
        saveDb(db);
        return { data: { success: true }, status: 200, statusText: 'OK', headers: {}, config };
      }

      if (pathname === '/api/classrooms') {
        getAuthUserFromHeaders(headers, db);
        if (method.toUpperCase() === 'GET') {
          return { data: db.classrooms, status: 200, statusText: 'OK', headers: {}, config };
        }
        if (method.toUpperCase() === 'POST') {
          const id = db.nextId.classrooms++;
          const newRoom = { id, ...body };
          db.classrooms.push(newRoom);
          saveDb(db);
          return { data: newRoom, status: 200, statusText: 'OK', headers: {}, config };
        }
      }

      if (pathname.startsWith('/api/classrooms/') && method.toUpperCase() === 'DELETE') {
        getAuthUserFromHeaders(headers, db);
        const roomId = parseInt(pathname.replace('/api/classrooms/', ''), 10);
        db.classrooms = db.classrooms.filter(r => r.id !== roomId);
        saveDb(db);
        return { data: { success: true }, status: 200, statusText: 'OK', headers: {}, config };
      }

      if (pathname === '/api/classroom-assignments') {
        getAuthUserFromHeaders(headers, db);
        if (method.toUpperCase() === 'GET') {
          // Augment assignments
          const items = db.classroomAssignments.map(a => {
            const classroom = db.classrooms.find(r => r.id === a.classroomId);
            const classObj = db.classes.find(c => c.id === a.classId);
            const subject = db.subjects.find(s => s.id === a.subjectId);
            const staffMember = db.staff.find(st => st.id === a.staffId);
            
            return {
              ...a,
              roomDetails: classroom || null,
              classDetails: classObj || null,
              subjectDetails: subject || null,
              staffDetails: staffMember ? `Prof. ${staffMember.firstName} ${staffMember.lastName}` : 'Unassigned'
            };
          });
          return { data: items, status: 200, statusText: 'OK', headers: {}, config };
        }
        if (method.toUpperCase() === 'POST') {
          const id = db.nextId.classroomAssignments++;
          const newAssign = { id, ...body };
          db.classroomAssignments.push(newAssign);
          saveDb(db);
          return { data: newAssign, status: 200, statusText: 'OK', headers: {}, config };
        }
      }

      if (pathname.startsWith('/api/classroom-assignments/') && method.toUpperCase() === 'DELETE') {
        getAuthUserFromHeaders(headers, db);
        const assignId = parseInt(pathname.replace('/api/classroom-assignments/', ''), 10);
        db.classroomAssignments = db.classroomAssignments.filter(a => a.id !== assignId);
        saveDb(db);
        return { data: { success: true }, status: 200, statusText: 'OK', headers: {}, config };
      }

      // ----------------------------------------------------------------
      // 4. USER MANAGEMENT (ADMINS)
      // ----------------------------------------------------------------

      if (pathname === '/api/admin/users' && method.toUpperCase() === 'GET') {
        getAuthUserFromHeaders(headers, db);
        return { data: db.users, status: 200, statusText: 'OK', headers: {}, config };
      }

      if (pathname.startsWith('/api/admin/users/') && pathname.endsWith('/lockout') && method.toUpperCase() === 'POST') {
        const activeUser = getAuthUserFromHeaders(headers, db);
        const targetUserId = parseInt(pathname.split('/')[4], 10);
        const targetUser = db.users.find(u => u.id === targetUserId);
        
        if (!targetUser) throwAxiosError(404, 'User not found');
        if (targetUser.id === activeUser.id) throwAxiosError(400, 'Self-lockout is disabled.');

        targetUser.isActive = !targetUser.isActive;
        saveDb(db);
        addLog(activeUser.id, activeUser.username, activeUser.role, 'USER_LOCKOUT_TOGGLE', `Toggled lockout for ${targetUser.username}. New status active: ${targetUser.isActive}`);

        return { data: targetUser, status: 200, statusText: 'OK', headers: {}, config };
      }

      if (pathname.startsWith('/api/admin/users/') && pathname.endsWith('/reset-email') && method.toUpperCase() === 'POST') {
        const activeUser = getAuthUserFromHeaders(headers, db);
        const targetUserId = parseInt(pathname.split('/')[4], 10);
        const { email } = body || {};
        const targetUser = db.users.find(u => u.id === targetUserId);

        if (!targetUser) throwAxiosError(404, 'User not found');
        targetUser.email = email;
        
        // Also update emails on associated Profile record
        if (targetUser.role === 'STUDENT') {
          const student = db.students.find(s => s.userId === targetUser.id);
          if (student) student.email = email;
        } else if (targetUser.role === 'STAFF') {
          const staff = db.staff.find(st => st.userId === targetUser.id);
          if (staff) staff.email = email;
        }

        saveDb(db);
        addLog(activeUser.id, activeUser.username, activeUser.role, 'USER_EMAIL_UPDATE', `Updated email of ${targetUser.username} to ${email}`);

        return { data: targetUser, status: 200, statusText: 'OK', headers: {}, config };
      }

      // ----------------------------------------------------------------
      // 5. STUDENTS DIRECTORY
      // ----------------------------------------------------------------

      if (pathname === '/api/students') {
        getAuthUserFromHeaders(headers, db);
        if (method.toUpperCase() === 'GET') {
          const items = db.students.map(s => {
            const enrollments = db.studentEnrollments.filter(e => e.studentId === s.id);
            const classesDetails = enrollments.map(e => {
              const cls = db.classes.find(c => c.id === e.classId);
              return cls ? { ...cls, enrollmentStatus: e.status, enrollmentId: e.id } : null;
            }).filter(Boolean);

            return {
              ...s,
              classesDetails
            };
          });
          return { data: items, status: 200, statusText: 'OK', headers: {}, config };
        }
        if (method.toUpperCase() === 'POST') {
          const nextId = db.nextId.students++;
          const nextUserId = db.nextId.users++;
          
          // create a shadow user
          const shadowUser = {
            id: nextUserId,
            username: `${body.firstName.toLowerCase()}.${body.lastName.toLowerCase()}`,
            email: body.email,
            role: 'STUDENT' as const,
            isActive: true,
            createdAt: new Date().toISOString(),
            password: 'password'
          };
          db.users.push(shadowUser);

          const newStudent = { id: nextId, userId: nextUserId, ...body, status: 'ACTIVE' };
          db.students.push(newStudent);
          saveDb(db);
          return { data: newStudent, status: 200, statusText: 'OK', headers: {}, config };
        }
      }

      if (pathname.startsWith('/api/students/') && method.toUpperCase() === 'PUT') {
        getAuthUserFromHeaders(headers, db);
        const studentId = parseInt(pathname.replace('/api/students/', ''), 10);
        const studentIndex = db.students.findIndex(s => s.id === studentId);
        if (studentIndex === -1) throwAxiosError(404, 'Student profile not found');
        
        db.students[studentIndex] = { ...db.students[studentIndex], ...body };
        saveDb(db);
        return { data: db.students[studentIndex], status: 200, statusText: 'OK', headers: {}, config };
      }

      if (pathname.startsWith('/api/students/') && pathname.endsWith('/approve') && method.toUpperCase() === 'PUT') {
        const activeUser = getAuthUserFromHeaders(headers, db);
        const studentId = parseInt(pathname.split('/')[3], 10);
        const student = db.students.find(s => s.id === studentId);
        if (!student) throwAxiosError(404, 'Student not found');
        
        student.status = 'ACTIVE';
        student.adminApproved = true;
        
        // Ensure student shadow user is also active
        const shUser = db.users.find(u => u.id === student.userId);
        if (shUser) shUser.isActive = true;

        saveDb(db);
        addLog(activeUser.id, activeUser.username, activeUser.role, 'STUDENT_APPROVAL', `Approved admission for ${student.firstName} ${student.lastName}`);

        return { data: student, status: 200, statusText: 'OK', headers: {}, config };
      }

      if (pathname.startsWith('/api/students/') && method.toUpperCase() === 'DELETE') {
        getAuthUserFromHeaders(headers, db);
        const studentId = parseInt(pathname.replace('/api/students/', ''), 10);
        const student = db.students.find(s => s.id === studentId);
        if (student) {
          db.users = db.users.filter(u => u.id !== student.userId);
        }
        db.students = db.students.filter(s => s.id !== studentId);
        db.studentEnrollments = db.studentEnrollments.filter(e => e.studentId !== studentId);
        saveDb(db);
        return { data: { success: true }, status: 200, statusText: 'OK', headers: {}, config };
      }

      if (pathname === '/api/enrollment' && method.toUpperCase() === 'POST') {
        getAuthUserFromHeaders(headers, db);
        const { studentId, classId } = body || {};
        const newEnroll = {
          id: db.nextId.studentEnrollments++,
          studentId: parseInt(studentId, 10),
          classId: parseInt(classId, 10),
          enrollmentDate: new Date().toISOString().split('T')[0],
          status: 'ACTIVE' as const
        };
        db.studentEnrollments.push(newEnroll);
        saveDb(db);
        return { data: newEnroll, status: 200, statusText: 'OK', headers: {}, config };
      }

      // ----------------------------------------------------------------
      // 6. FACULTY & PAYROLL
      // ----------------------------------------------------------------

      if (pathname === '/api/staff') {
        getAuthUserFromHeaders(headers, db);
        if (method.toUpperCase() === 'GET') {
          const items = db.staff.map(st => {
            const salaryStructure = db.salaryStructures.find(ss => ss.staffId === st.id) || null;
            const paymentsHistory = db.salaryPayments.filter(sp => sp.staffId === st.id);
            const subjectsAllocations = db.staffSubjects
              .filter(ss => ss.staffId === st.id)
              .map(alloc => {
                const sub = db.subjects.find(s => s.id === alloc.subjectId);
                return sub ? { ...sub, allocationId: alloc.id, academicYear: alloc.academicYear } : null;
              })
              .filter(Boolean);

            return {
              ...st,
              salaryStructure,
              paymentsHistory,
              subjectsAllocations
            };
          });
          return { data: items, status: 200, statusText: 'OK', headers: {}, config };
        }
        if (method.toUpperCase() === 'POST') {
          const nextId = db.nextId.staff++;
          const nextUserId = db.nextId.users++;
          
          // create a shadow user
          const shadowUser = {
            id: nextUserId,
            username: `${body.firstName.toLowerCase()}.${body.lastName.toLowerCase()}`,
            email: body.email,
            role: 'STAFF' as const,
            isActive: true,
            createdAt: new Date().toISOString(),
            password: 'password'
          };
          db.users.push(shadowUser);

          const newStaff = { id: nextId, userId: nextUserId, ...body, status: 'ACTIVE' };
          db.staff.push(newStaff);
          saveDb(db);
          return { data: newStaff, status: 200, statusText: 'OK', headers: {}, config };
        }
      }

      if (pathname.startsWith('/api/staff/') && method.toUpperCase() === 'PUT') {
        getAuthUserFromHeaders(headers, db);
        const staffId = parseInt(pathname.replace('/api/staff/', ''), 10);
        const staffIndex = db.staff.findIndex(s => s.id === staffId);
        if (staffIndex === -1) throwAxiosError(404, 'Staff not found');
        
        db.staff[staffIndex] = { ...db.staff[staffIndex], ...body };
        saveDb(db);
        return { data: db.staff[staffIndex], status: 200, statusText: 'OK', headers: {}, config };
      }

      if (pathname.startsWith('/api/staff/') && method.toUpperCase() === 'DELETE') {
        getAuthUserFromHeaders(headers, db);
        const staffId = parseInt(pathname.replace('/api/staff/', ''), 10);
        const staff = db.staff.find(st => st.id === staffId);
        if (staff) {
          db.users = db.users.filter(u => u.id !== staff.userId);
        }
        db.staff = db.staff.filter(st => st.id !== staffId);
        db.staffSubjects = db.staffSubjects.filter(ss => ss.staffId !== staffId);
        saveDb(db);
        return { data: { success: true }, status: 200, statusText: 'OK', headers: {}, config };
      }

      if (pathname === '/api/staff-subjects' && method.toUpperCase() === 'POST') {
        getAuthUserFromHeaders(headers, db);
        const id = db.nextId.staffSubjects++;
        const newAlloc = { id, ...body };
        db.staffSubjects.push(newAlloc);
        saveDb(db);
        return { data: newAlloc, status: 200, statusText: 'OK', headers: {}, config };
      }

      if (pathname.startsWith('/api/staff-subjects/') && method.toUpperCase() === 'DELETE') {
        getAuthUserFromHeaders(headers, db);
        const allocationId = parseInt(pathname.replace('/api/staff-subjects/', ''), 10);
        db.staffSubjects = db.staffSubjects.filter(ss => ss.id !== allocationId);
        saveDb(db);
        return { data: { success: true }, status: 200, statusText: 'OK', headers: {}, config };
      }

      // ----------------------------------------------------------------
      // 7. STUDENT COURSE NOTES & ASSESSMENTS & SUBMISSIONS (PORTALS)
      // ----------------------------------------------------------------

      if (pathname === '/api/student/my-subjects' && method.toUpperCase() === 'GET') {
        const user = getAuthUserFromHeaders(headers, db);
        const student = db.students.find(s => s.userId === user.id);
        if (!student) return { data: [], status: 200, statusText: 'OK', headers: {}, config };
        
        // find active enrollment
        const enrollments = db.studentEnrollments.filter(e => e.studentId === student.id && e.status === 'ACTIVE');
        const classIds = enrollments.map(e => e.classId);
        
        const subjects = db.subjects.filter(s => s.classId !== null && classIds.includes(s.classId));
        return { data: subjects, status: 200, statusText: 'OK', headers: {}, config };
      }

      if (pathname === '/api/student/my-schedules' && method.toUpperCase() === 'GET') {
        const user = getAuthUserFromHeaders(headers, db);
        const student = db.students.find(s => s.userId === user.id);
        if (!student) return { data: [], status: 200, statusText: 'OK', headers: {}, config };
        
        const enrollments = db.studentEnrollments.filter(e => e.studentId === student.id && e.status === 'ACTIVE');
        const classIds = enrollments.map(e => e.classId);
        
        const scheds = db.classroomAssignments
          .filter(a => classIds.includes(a.classId))
          .map(a => ({
            ...a,
            roomDetails: db.classrooms.find(r => r.id === a.classroomId) || null,
            classDetails: db.classes.find(c => c.id === a.classId) || null,
            subjectDetails: db.subjects.find(s => s.id === a.subjectId) || null,
            staffDetails: (() => {
              const staffMember = db.staff.find(st => st.id === a.staffId);
              return staffMember ? `Prof. ${staffMember.firstName} ${staffMember.lastName}` : 'Unassigned';
            })()
          }));
        return { data: scheds, status: 200, statusText: 'OK', headers: {}, config };
      }

      if (pathname === '/api/student/my-attendance' && method.toUpperCase() === 'GET') {
        const user = getAuthUserFromHeaders(headers, db);
        const student = db.students.find(s => s.userId === user.id);
        if (!student) return { data: [], status: 200, statusText: 'OK', headers: {}, config };
        
        const records = db.attendance.filter(r => r.studentId === student.id);
        return { data: records, status: 200, statusText: 'OK', headers: {}, config };
      }

      if (pathname === '/api/student/notes' && method.toUpperCase() === 'GET') {
        const user = getAuthUserFromHeaders(headers, db);
        const student = db.students.find(s => s.userId === user.id);
        if (!student) return { data: [], status: 200, statusText: 'OK', headers: {}, config };
        
        const enrollments = db.studentEnrollments.filter(e => e.studentId === student.id && e.status === 'ACTIVE');
        const classIds = enrollments.map(e => e.classId);
        const subjectIds = db.subjects.filter(s => s.classId !== null && classIds.includes(s.classId)).map(s => s.id);

        const notes = db.courseNotes.filter(n => subjectIds.includes(n.subjectId));
        return { data: notes, status: 200, statusText: 'OK', headers: {}, config };
      }

      if (pathname === '/api/student/assessments' && method.toUpperCase() === 'GET') {
        const user = getAuthUserFromHeaders(headers, db);
        const student = db.students.find(s => s.userId === user.id);
        if (!student) return { data: [], status: 200, statusText: 'OK', headers: {}, config };
        
        const enrollments = db.studentEnrollments.filter(e => e.studentId === student.id && e.status === 'ACTIVE');
        const classIds = enrollments.map(e => e.classId);
        const subjectIds = db.subjects.filter(s => s.classId !== null && classIds.includes(s.classId)).map(s => s.id);

        const ass = db.quizzesAndAssignments.filter(a => subjectIds.includes(a.subjectId));
        return { data: ass, status: 200, statusText: 'OK', headers: {}, config };
      }

      if (pathname === '/api/student/submit-assessment' && method.toUpperCase() === 'POST') {
        const user = getAuthUserFromHeaders(headers, db);
        const student = db.students.find(s => s.userId === user.id);
        if (!student) throwAxiosError(403, 'Unauthorized student session.');

        const id = db.nextId.studentSubmissions++;
        const submission = {
          id,
          studentId: student.id,
          submittedAt: new Date().toISOString(),
          status: 'SUBMITTED' as const,
          ...body
        };
        db.studentSubmissions.push(submission);
        saveDb(db);

        addLog(user.id, user.username, 'STUDENT', 'ASSESSMENT_SUBMISSION', `Submitted answers for assessment ID ${body.assessmentId}`);

        return { data: submission, status: 200, statusText: 'OK', headers: {}, config };
      }

      // STAFF SPECIFIC PORTALS
      if (pathname === '/api/staff/my-subjects' && method.toUpperCase() === 'GET') {
        const user = getAuthUserFromHeaders(headers, db);
        const staff = db.staff.find(st => st.userId === user.id);
        if (!staff) return { data: [], status: 200, statusText: 'OK', headers: {}, config };

        const allocs = db.staffSubjects.filter(ss => ss.staffId === staff.id);
        const subjects = allocs.map(a => db.subjects.find(s => s.id === a.subjectId)).filter(Boolean);
        return { data: subjects, status: 200, statusText: 'OK', headers: {}, config };
      }

      if (pathname === '/api/staff/my-schedules' && method.toUpperCase() === 'GET') {
        const user = getAuthUserFromHeaders(headers, db);
        const staff = db.staff.find(st => st.userId === user.id);
        if (!staff) return { data: [], status: 200, statusText: 'OK', headers: {}, config };

        const scheds = db.classroomAssignments
          .filter(a => a.staffId === staff.id)
          .map(a => ({
            ...a,
            roomDetails: db.classrooms.find(r => r.id === a.classroomId) || null,
            classDetails: db.classes.find(c => c.id === a.classId) || null,
            subjectDetails: db.subjects.find(s => s.id === a.subjectId) || null,
            staffDetails: `Prof. ${staff.firstName} ${staff.lastName}`
          }));
        return { data: scheds, status: 200, statusText: 'OK', headers: {}, config };
      }

      if (pathname === '/api/staff/notes') {
        const user = getAuthUserFromHeaders(headers, db);
        const staff = db.staff.find(st => st.userId === user.id);
        if (!staff) throwAxiosError(403, 'Unauthorized staff session.');

        if (method.toUpperCase() === 'GET') {
          // staff notes
          return { data: db.courseNotes, status: 200, statusText: 'OK', headers: {}, config };
        }
        if (method.toUpperCase() === 'POST') {
          const id = db.nextId.courseNotes++;
          const newNote = {
            id,
            uploadedBy: `${staff.firstName} ${staff.lastName}`,
            createdAt: new Date().toISOString(),
            ...body
          };
          db.courseNotes.push(newNote);
          saveDb(db);
          addLog(user.id, user.username, 'STAFF', 'UPLOAD_NOTES', `Uploaded course notes: ${body.title}`);
          return { data: newNote, status: 200, statusText: 'OK', headers: {}, config };
        }
      }

      if (pathname === '/api/staff/assessments') {
        const user = getAuthUserFromHeaders(headers, db);
        const staff = db.staff.find(st => st.userId === user.id);
        if (!staff) throwAxiosError(403, 'Unauthorized staff session.');

        if (method.toUpperCase() === 'GET') {
          return { data: db.quizzesAndAssignments, status: 200, statusText: 'OK', headers: {}, config };
        }
        if (method.toUpperCase() === 'POST') {
          const id = db.nextId.quizzesAndAssignments++;
          const newAss = { id, ...body };
          db.quizzesAndAssignments.push(newAss);
          saveDb(db);
          addLog(user.id, user.username, 'STAFF', 'CREATE_ASSESSMENT', `Created ${body.type}: ${body.title}`);
          return { data: newAss, status: 200, statusText: 'OK', headers: {}, config };
        }
      }

      if (pathname === '/api/staff/submissions' && method.toUpperCase() === 'GET') {
        getAuthUserFromHeaders(headers, db);
        return { data: db.studentSubmissions, status: 200, statusText: 'OK', headers: {}, config };
      }

      if (pathname.startsWith('/api/staff/submissions/') && pathname.endsWith('/grade') && method.toUpperCase() === 'PUT') {
        const user = getAuthUserFromHeaders(headers, db);
        const submissionId = parseInt(pathname.split('/')[4], 10);
        const sub = db.studentSubmissions.find(s => s.id === submissionId);
        
        if (!sub) throwAxiosError(404, 'Submission not found');
        sub.score = body.score;
        sub.feedback = body.feedback;
        sub.status = 'GRADED';

        // Auto propagate to main grades table
        const assessment = db.quizzesAndAssignments.find(a => a.id === sub.assessmentId);
        const subId = assessment ? assessment.subjectId : 1;
        
        const marksObtained = body.score;
        const totalMarks = assessment ? assessment.maxPoints : 100;
        
        let letterGrade = 'F';
        const ratio = marksObtained / totalMarks;
        if (ratio >= 0.9) letterGrade = 'A+';
        else if (ratio >= 0.8) letterGrade = 'A';
        else if (ratio >= 0.7) letterGrade = 'B';
        else if (ratio >= 0.6) letterGrade = 'C';
        else if (ratio >= 0.5) letterGrade = 'D';

        db.grades.push({
          id: db.nextId.grades++,
          studentId: sub.studentId,
          subjectId: subId,
          marksObtained,
          totalMarks,
          grade: letterGrade,
          examType: assessment?.type || 'ASSIGNMENT',
          academicYear: '2024'
        });

        saveDb(db);
        addLog(user.id, user.username, 'STAFF', 'GRADE_SUBMISSION', `Graded submission ID ${submissionId}. Marks: ${marksObtained}/${totalMarks}`);

        return { data: sub, status: 200, statusText: 'OK', headers: {}, config };
      }

      if (pathname === '/api/staff/profile/update' && method.toUpperCase() === 'PUT') {
        const user = getAuthUserFromHeaders(headers, db);
        const staff = db.staff.find(st => st.userId === user.id);
        if (!staff) throwAxiosError(404, 'Staff record not found');

        Object.assign(staff, body);
        saveDb(db);
        return { data: staff, status: 200, statusText: 'OK', headers: {}, config };
      }

      // ----------------------------------------------------------------
      // 8. GRADES & ATTENDANCE
      // ----------------------------------------------------------------

      if (pathname === '/api/grades') {
        getAuthUserFromHeaders(headers, db);
        if (method.toUpperCase() === 'GET') {
          const items = db.grades.map(g => ({
            ...g,
            studentDetails: db.students.find(s => s.id === g.studentId) || null,
            subjectDetails: db.subjects.find(s => s.id === g.subjectId) || null
          }));
          return { data: items, status: 200, statusText: 'OK', headers: {}, config };
        }
        if (method.toUpperCase() === 'POST') {
          const id = db.nextId.grades++;
          
          let letterGrade = 'F';
          const ratio = body.marksObtained / body.totalMarks;
          if (ratio >= 0.9) letterGrade = 'A+';
          else if (ratio >= 0.8) letterGrade = 'A';
          else if (ratio >= 0.7) letterGrade = 'B';
          else if (ratio >= 0.6) letterGrade = 'C';
          else if (ratio >= 0.5) letterGrade = 'D';

          const newGrade = { id, grade: letterGrade, ...body };
          db.grades.push(newGrade);
          saveDb(db);
          return { data: newGrade, status: 200, statusText: 'OK', headers: {}, config };
        }
      }

      if (pathname === '/api/attendance') {
        getAuthUserFromHeaders(headers, db);
        if (method.toUpperCase() === 'GET') {
          const { subjectId, date } = query;
          let records = db.attendance;
          if (subjectId) {
            records = records.filter(r => r.subjectId === parseInt(subjectId, 10));
          }
          if (date) {
            records = records.filter(r => r.date === date);
          }
          return { data: records, status: 200, statusText: 'OK', headers: {}, config };
        }
        if (method.toUpperCase() === 'POST') {
          // Check if record already exists for student, subject, date, and updates or adds
          const existingIdx = db.attendance.findIndex(a => a.studentId === body.studentId && a.subjectId === body.subjectId && a.date === body.date);
          if (existingIdx !== -1) {
            db.attendance[existingIdx].status = body.status;
          } else {
            const id = db.nextId.attendance++;
            db.attendance.push({ id, ...body });
          }
          saveDb(db);
          return { data: { success: true }, status: 200, statusText: 'OK', headers: {}, config };
        }
      }

      // ----------------------------------------------------------------
      // 9. FINANCE: FEE PAYMENTS & SALARY OUTFLOWS
      // ----------------------------------------------------------------

      if (pathname.startsWith('/api/students/') && pathname.endsWith('/fees') && method.toUpperCase() === 'GET') {
        getAuthUserFromHeaders(headers, db);
        const studentId = parseInt(pathname.split('/')[3], 10);
        
        // Find fee structures for the class of student
        const enrollment = db.studentEnrollments.find(e => e.studentId === studentId && e.status === 'ACTIVE');
        const classId = enrollment ? enrollment.classId : 1;
        
        const feeStructure = db.feeStructures.find(f => f.classId === classId) || {
          id: 0,
          classId,
          academicYear: '2024',
          totalFees: 12000.00,
          admissionFee: 1500.00,
          tuitionFee: 9000.00,
          libraryFee: 1000.00,
          sportsFee: 500.00,
          dueDate: '2024-10-31',
          lateFeePenalty: 150.00
        };

        const paymentsHistory = db.feePayments.filter(p => p.studentId === studentId);
        const paidAmount = paymentsHistory.reduce((sum, p) => sum + p.amountPaid, 0);
        const balance = feeStructure.totalFees - paidAmount;

        return {
          data: {
            feeStructure,
            paymentsHistory,
            paidAmount,
            balance
          },
          status: 200,
          statusText: 'OK',
          headers: {},
          config
        };
      }

      if (pathname === '/api/payments/fee' && method.toUpperCase() === 'POST') {
        const user = getAuthUserFromHeaders(headers, db);
        const id = db.nextId.feePayments++;
        const newPayment = {
          id,
          paymentDate: new Date().toISOString().split('T')[0],
          receiptNo: `REC-2026-${id.toString().padStart(3, '0')}`,
          transactionId: body.transactionId || `TXN${Math.floor(100000000 + Math.random() * 900000000)}`,
          academicYear: '2024',
          ...body
        };
        db.feePayments.push(newPayment);
        saveDb(db);

        addLog(user.id, user.username, user.role, 'FEE_PAYMENT_SUBMITTED', `Registered fee payment of $${body.amountPaid} for Student ID ${body.studentId}`);

        return { data: newPayment, status: 200, statusText: 'OK', headers: {}, config };
      }

      if (pathname === '/api/payments/salary' && method.toUpperCase() === 'POST') {
        const user = getAuthUserFromHeaders(headers, db);
        const id = db.nextId.salaryPayments++;
        const newPay = {
          id,
          paymentDate: new Date().toISOString().split('T')[0],
          transactionId: `SAL${Math.floor(100000 + Math.random() * 900000)}`,
          status: 'PAID',
          ...body
        };
        db.salaryPayments.push(newPay);
        saveDb(db);

        addLog(user.id, user.username, user.role, 'SALARY_PAYMENT_SUBMITTED', `Paid salary of $${body.amount} to Faculty Member ID ${body.staffId}`);

        return { data: newPay, status: 200, statusText: 'OK', headers: {}, config };
      }

      if (pathname === '/api/fee-structure' && method.toUpperCase() === 'POST') {
        getAuthUserFromHeaders(headers, db);
        const id = db.nextId.feeStructures++;
        const totalFees = parseFloat(body.admissionFee) + parseFloat(body.tuitionFee) + parseFloat(body.libraryFee) + parseFloat(body.sportsFee);
        const newStruct = {
          id,
          classId: parseInt(body.classId, 10),
          academicYear: body.academicYear,
          totalFees,
          admissionFee: parseFloat(body.admissionFee),
          tuitionFee: parseFloat(body.tuitionFee),
          libraryFee: parseFloat(body.libraryFee),
          sportsFee: parseFloat(body.sportsFee),
          dueDate: body.dueDate,
          lateFeePenalty: parseFloat(body.lateFeePenalty)
        };

        // Replace or push
        db.feeStructures = db.feeStructures.filter(f => f.classId !== newStruct.classId);
        db.feeStructures.push(newStruct);
        saveDb(db);
        return { data: newStruct, status: 200, statusText: 'OK', headers: {}, config };
      }

      // MPESA STK SIMULATOR
      if (pathname === '/api/payments/mpesa/stkpush' && method.toUpperCase() === 'POST') {
        getAuthUserFromHeaders(headers, db);
        const checkoutRequestId = `ws_CO_Mesa_${Math.floor(100000000 + Math.random() * 900000000)}`;
        
        return {
          data: {
            ResponseCode: '0',
            ResponseDescription: 'Success. Request accepted for processing',
            MerchantRequestID: `mr_stk_${Math.floor(10000 + Math.random() * 90000)}`,
            CheckoutRequestID: checkoutRequestId,
            CustomerMessage: 'Success. Please input pin on your handset to authorize transaction.'
          },
          status: 200,
          statusText: 'OK',
          headers: {},
          config
        };
      }

      if (pathname.startsWith('/api/payments/mpesa/status/') && method.toUpperCase() === 'GET') {
        getAuthUserFromHeaders(headers, db);
        // Simulator auto-approves stk push payments
        return {
          data: {
            status: 'APPROVED',
            message: 'STK push transaction was completed and validated successfully.'
          },
          status: 200,
          statusText: 'OK',
          headers: {},
          config
        };
      }

      // ----------------------------------------------------------------
      // 10. SYSTEM AUDITS, EMAIL TEMPLATES, LOGS
      // ----------------------------------------------------------------

      if (pathname === '/api/logs' && method.toUpperCase() === 'GET') {
        getAuthUserFromHeaders(headers, db);
        return { data: db.logs, status: 200, statusText: 'OK', headers: {}, config };
      }

      if (pathname === '/api/admin/email-templates' && method.toUpperCase() === 'GET') {
        getAuthUserFromHeaders(headers, db);
        return { data: db.emailTemplates, status: 200, statusText: 'OK', headers: {}, config };
      }

      if (pathname.startsWith('/api/admin/email-templates/') && method.toUpperCase() === 'PUT') {
        getAuthUserFromHeaders(headers, db);
        const tempId = pathname.replace('/api/admin/email-templates/', '');
        const temp = db.emailTemplates.find(t => t.id === tempId);
        if (!temp) throwAxiosError(404, 'Email template not found');
        
        Object.assign(temp, body);
        saveDb(db);
        return { data: temp, status: 200, statusText: 'OK', headers: {}, config };
      }

      if (pathname === '/api/admin/email-templates/test-send' && method.toUpperCase() === 'POST') {
        getAuthUserFromHeaders(headers, db);
        const { templateId, testEmail } = body || {};
        const temp = db.emailTemplates.find(t => t.id === templateId);
        
        if (!temp) throwAxiosError(404, 'Template not found');
        queueOutboxMessage(testEmail, `[TEST] ${temp.subject}`, temp.text, 'TEST66');

        return { data: { success: true, message: `Simulated test email sent successfully to ${testEmail}. Check out the virtual sandbox outbox!` }, status: 200, statusText: 'OK', headers: {}, config };
      }

      // Catch-all route 404
      throwAxiosError(404, `Local API Route [${method} ${pathname}] is not registered in mock simulator.`);

    } catch (err: any) {
      console.error('[MOCK API ERROR]', err);
      if (err.response) {
        throw err;
      }
      throwAxiosError(500, err.message || 'Internal sandbox simulation failure.');
    }
  };
};
