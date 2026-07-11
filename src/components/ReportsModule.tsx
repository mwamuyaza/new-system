import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Download, 
  Users, 
  DollarSign, 
  TrendingUp, 
  Activity,
  CheckCircle, 
  FileSpreadsheet,
  Search,
  Calendar,
  Award,
  Filter,
  Check,
  Building
} from 'lucide-react';
import axios from 'axios';

interface ReportsModuleProps {
  token: string | null;
  startDate?: string;
  endDate?: string;
  onDateRangeChange?: (start: string, end: string) => void;
}

interface ClassItem {
  id: number;
  className: string;
  section: string;
  academicYear: string;
}

interface SubjectItem {
  id: number;
  subjectName: string;
  subjectCode: string;
  classId: number;
}

export default function ReportsModule({ token, startDate, endDate, onDateRangeChange }: ReportsModuleProps) {
  const headers = { Authorization: `Bearer ${token}` };

  const [reportType, setReportType] = useState<'enrollment' | 'fees' | 'salaries' | 'grades'>('enrollment');
  
  // Dynamic filter states
  const [academicYear, setAcademicYear] = useState<string>('2024');
  const [classId, setClassId] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [examType, setExamType] = useState<string>('');
  const [subjectId, setSubjectId] = useState<string>('');
  const [month, setMonth] = useState<string>('');
  const [year, setYear] = useState<string>('2024');

  // Metadata arrays for filter select choices
  const [classesList, setClassesList] = useState<ClassItem[]>([]);
  const [subjectsList, setSubjectsList] = useState<SubjectItem[]>([]);

  // Query response states
  const [reportData, setReportData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [printPreviewActive, setPrintPreviewActive] = useState<boolean>(false);

  // Load classes and subjects for filter selection on mount
  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const classRes = await axios.get('/api/classes', { headers });
        setClassesList(classRes.data);
        
        const subjectsRes = await axios.get('/api/subjects', { headers });
        setSubjectsList(subjectsRes.data);
      } catch (err) {
        console.error("Failed to fetch filtration metadata", err);
      }
    };
    fetchMeta();
  }, []);

  // Automatic query run whenever reportType changes (to ensure screen isn't blank)
  useEffect(() => {
    // Reset filters to defaults on report type change
    setClassId('');
    setStatus('');
    setExamType('');
    setSubjectId('');
    setMonth('');
    if (reportType === 'salaries') {
      setYear('2024');
    } else {
      setAcademicYear('2024');
    }
    
    // Slight delay to allow state clearing
    const timer = setTimeout(() => {
      generateReport();
    }, 50);
    return () => clearTimeout(timer);
  }, [reportType]);

  // Trigger update when dynamic props date range changes
  useEffect(() => {
    generateReport();
  }, [startDate, endDate]);

  const generateReport = async () => {
    setLoading(true);
    try {
      let queryType = reportType;
      let url = `/api/admin/reports?type=${queryType}`;

      if (queryType === 'enrollment') {
        if (academicYear) url += `&academicYear=${academicYear}`;
        if (classId) url += `&classId=${classId}`;
        if (status) url += `&status=${status}`;
      } else if (queryType === 'fees') {
        if (academicYear) url += `&academicYear=${academicYear}`;
        if (classId) url += `&classId=${classId}`;
      } else if (queryType === 'salaries') {
        if (month) url += `&month=${month}`;
        if (year) url += `&year=${year}`;
      } else if (queryType === 'grades') {
        if (classId) url += `&classId=${classId}`;
        if (subjectId) url += `&subjectId=${subjectId}`;
        if (examType) url += `&examType=${examType}`;
        if (academicYear) url += `&academicYear=${academicYear}`;
      }

      if (startDate) {
        url += `&startDate=${startDate}`;
      }
      if (endDate) {
        url += `&endDate=${endDate}`;
      }

      const res = await axios.get(url, { headers });
      setReportData(res.data);
    } catch (err) {
      console.error("Error generating targeted statistics:", err);
    } finally {
      setLoading(false);
    }
  };

  // Safe XML Excel Spreadsheet Exporter
  const handleExportExcel = () => {
    if (!reportData || reportData.length === 0) return;
    
    let headerHtml = '';
    let rowHtml = '';
    let title = '';

    if (reportType === 'enrollment') {
      title = 'Student Enrollment Register';
      headerHtml = `
        <tr>
          <th style="background-color: #2563eb; color: #ffffff; font-weight: bold; padding: 10px; border: 1px solid #94a3b8;">Student ID</th>
          <th style="background-color: #2563eb; color: #ffffff; font-weight: bold; padding: 10px; border: 1px solid #94a3b8;">First Name</th>
          <th style="background-color: #2563eb; color: #ffffff; font-weight: bold; padding: 10px; border: 1px solid #94a3b8;">Last Name</th>
          <th style="background-color: #2563eb; color: #ffffff; font-weight: bold; padding: 10px; border: 1px solid #94a3b8;">Email</th>
          <th style="background-color: #2563eb; color: #ffffff; font-weight: bold; padding: 10px; border: 1px solid #94a3b8;">Phone</th>
          <th style="background-color: #2563eb; color: #ffffff; font-weight: bold; padding: 10px; border: 1px solid #94a3b8;">Assigned Class</th>
          <th style="background-color: #2563eb; color: #ffffff; font-weight: bold; padding: 10px; border: 1px solid #94a3b8;">Enroll Date</th>
          <th style="background-color: #2563eb; color: #ffffff; font-weight: bold; padding: 10px; border: 1px solid #94a3b8;">Status</th>
        </tr>
      `;
      reportData.forEach(item => {
        rowHtml += `
          <tr>
            <td style="padding: 8px; border: 1px solid #cbd5e1;">${item.studentId}</td>
            <td style="padding: 8px; border: 1px solid #cbd5e1;">${item.firstName}</td>
            <td style="padding: 8px; border: 1px solid #cbd5e1;">${item.lastName}</td>
            <td style="padding: 8px; border: 1px solid #cbd5e1;">${item.email}</td>
            <td style="padding: 8px; border: 1px solid #cbd5e1;">${item.phone || 'N/A'}</td>
            <td style="padding: 8px; border: 1px solid #cbd5e1;">${item.className}</td>
            <td style="padding: 8px; border: 1px solid #cbd5e1;">${item.enrollmentDate}</td>
            <td style="padding: 8px; border: 1px solid #cbd5e1; font-weight: bold; color: ${item.status === 'ACTIVE' ? '#15803d' : '#b91c1c'};">${item.status}</td>
          </tr>
        `;
      });
    } else if (reportType === 'fees') {
      title = 'Tuition Fees Ledger';
      headerHtml = `
        <tr>
          <th style="background-color: #0f766e; color: #ffffff; font-weight: bold; padding: 10px; border: 1px solid #94a3b8;">Receipt No</th>
          <th style="background-color: #0f766e; color: #ffffff; font-weight: bold; padding: 10px; border: 1px solid #94a3b8;">Student Name</th>
          <th style="background-color: #0f766e; color: #ffffff; font-weight: bold; padding: 10px; border: 1px solid #94a3b8;">Student ID</th>
          <th style="background-color: #0f766e; color: #ffffff; font-weight: bold; padding: 10px; border: 1px solid #94a3b8;">Class Level</th>
          <th style="background-color: #0f766e; color: #ffffff; font-weight: bold; padding: 10px; border: 1px solid #94a3b8;">Academic Term</th>
          <th style="background-color: #0f766e; color: #ffffff; font-weight: bold; padding: 10px; border: 1px solid #94a3b8;">Txn Reference</th>
          <th style="background-color: #0f766e; color: #ffffff; font-weight: bold; padding: 10px; border: 1px solid #94a3b8;">Method</th>
          <th style="background-color: #0f766e; color: #ffffff; font-weight: bold; padding: 10px; border: 1px solid #94a3b8;">Total Tuition Due</th>
          <th style="background-color: #0f766e; color: #ffffff; font-weight: bold; padding: 10px; border: 1px solid #94a3b8;">Amount Settled</th>
        </tr>
      `;
      reportData.forEach(item => {
        rowHtml += `
          <tr>
            <td style="padding: 8px; border: 1px solid #cbd5e1;">${item.receiptNo}</td>
            <td style="padding: 8px; border: 1px solid #cbd5e1;">${item.studentName}</td>
            <td style="padding: 8px; border: 1px solid #cbd5e1;">${item.studentId}</td>
            <td style="padding: 8px; border: 1px solid #cbd5e1;">${item.className}</td>
            <td style="padding: 8px; border: 1px solid #cbd5e1;">${item.academicYear}</td>
            <td style="padding: 8px; border: 1px solid #cbd5e1;">${item.transactionId}</td>
            <td style="padding: 8px; border: 1px solid #cbd5e1;">${item.paymentMethod}</td>
            <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: right;">$${item.totalFees.toFixed(2)}</td>
            <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: right; font-weight: bold; color: #15803d;">$${item.amountPaid.toFixed(2)}</td>
          </tr>
        `;
      });
      const total = reportData.reduce((sum, item) => sum + item.amountPaid, 0);
      rowHtml += `
        <tr>
          <td colspan="8" style="text-align: right; font-weight: bold; padding: 10px; background-color: #f1f5f9; border: 1px solid #94a3b8;">Aggregate Collections Total:</td>
          <td style="font-weight: bold; text-align: right; padding: 10px; background-color: #e2e8f0; border: 1px solid #94a3b8; color: #0f766e;">$${total.toFixed(2)}</td>
        </tr>
      `;
    } else if (reportType === 'salaries') {
      title = 'Corporate Staff Payroll Ledger';
      headerHtml = `
        <tr>
          <th style="background-color: #0369a1; color: #ffffff; font-weight: bold; padding: 10px; border: 1px solid #94a3b8;">Staff ID</th>
          <th style="background-color: #0369a1; color: #ffffff; font-weight: bold; padding: 10px; border: 1px solid #94a3b8;">Full Name</th>
          <th style="background-color: #0369a1; color: #ffffff; font-weight: bold; padding: 10px; border: 1px solid #94a3b8;">Department</th>
          <th style="background-color: #0369a1; color: #ffffff; font-weight: bold; padding: 10px; border: 1px solid #94a3b8;">Month Code</th>
          <th style="background-color: #0369a1; color: #ffffff; font-weight: bold; padding: 10px; border: 1px solid #94a3b8;">Calendar Year</th>
          <th style="background-color: #0369a1; color: #ffffff; font-weight: bold; padding: 10px; border: 1px solid #94a3b8;">Settled Date</th>
          <th style="background-color: #0369a1; color: #ffffff; font-weight: bold; padding: 10px; border: 1px solid #94a3b8;">Method</th>
          <th style="background-color: #0369a1; color: #ffffff; font-weight: bold; padding: 10px; border: 1px solid #94a3b8;">Allowances</th>
          <th style="background-color: #0369a1; color: #ffffff; font-weight: bold; padding: 10px; border: 1px solid #94a3b8;">Deductions</th>
          <th style="background-color: #0369a1; color: #ffffff; font-weight: bold; padding: 10px; border: 1px solid #94a3b8;">Disbursed Net Salary</th>
        </tr>
      `;
      reportData.forEach(item => {
        rowHtml += `
          <tr>
            <td style="padding: 8px; border: 1px solid #cbd5e1;">${item.staffIdCode}</td>
            <td style="padding: 8px; border: 1px solid #cbd5e1;">${item.staffName}</td>
            <td style="padding: 8px; border: 1px solid #cbd5e1;">${item.department}</td>
            <td style="padding: 8px; border: 1px solid #cbd5e1;">M${item.month}</td>
            <td style="padding: 8px; border: 1px solid #cbd5e1;">${item.year}</td>
            <td style="padding: 8px; border: 1px solid #cbd5e1;">${item.paymentDate || 'Pending'}</td>
            <td style="padding: 8px; border: 1px solid #cbd5e1;">${item.paymentMethod}</td>
            <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: right;">$${item.allowances.toFixed(2)}</td>
            <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: right; color: #b91c1c;">$${item.deductions.toFixed(2)}</td>
            <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: right; font-weight: bold;">$${item.amount.toFixed(2)}</td>
          </tr>
        `;
      });
      const total = reportData.reduce((sum, item) => sum + item.amount, 0);
      rowHtml += `
        <tr>
          <td colspan="9" style="text-align: right; font-weight: bold; padding: 10px; background-color: #f1f5f9; border: 1px solid #94a3b8;">Total Salary Expenditures:</td>
          <td style="font-weight: bold; text-align: right; padding: 10px; background-color: #e2e8f0; border: 1px solid #94a3b8; color: #0369a1;">$${total.toFixed(2)}</td>
        </tr>
      `;
    } else if (reportType === 'grades') {
      title = 'Student Marks Performance Ledger';
      headerHtml = `
        <tr>
          <th style="background-color: #4338ca; color: #ffffff; font-weight: bold; padding: 10px; border: 1px solid #94a3b8;">Student ID</th>
          <th style="background-color: #4338ca; color: #ffffff; font-weight: bold; padding: 10px; border: 1px solid #94a3b8;">Student Name</th>
          <th style="background-color: #4338ca; color: #ffffff; font-weight: bold; padding: 10px; border: 1px solid #94a3b8;">Subject Course</th>
          <th style="background-color: #4338ca; color: #ffffff; font-weight: bold; padding: 10px; border: 1px solid #94a3b8;">Course Code</th>
          <th style="background-color: #4338ca; color: #ffffff; font-weight: bold; padding: 10px; border: 1px solid #94a3b8;">Class Level</th>
          <th style="background-color: #4338ca; color: #ffffff; font-weight: bold; padding: 10px; border: 1px solid #94a3b8;">Assessment</th>
          <th style="background-color: #4338ca; color: #ffffff; font-weight: bold; padding: 10px; border: 1px solid #94a3b8;">Term Year</th>
          <th style="background-color: #4338ca; color: #ffffff; font-weight: bold; padding: 10px; border: 1px solid #94a3b8;">Marks Yield</th>
          <th style="background-color: #4338ca; color: #ffffff; font-weight: bold; padding: 10px; border: 1px solid #94a3b8;">Max Cap</th>
          <th style="background-color: #4338ca; color: #ffffff; font-weight: bold; padding: 10px; border: 1px solid #94a3b8;">Grade Yield</th>
        </tr>
      `;
      reportData.forEach(item => {
        rowHtml += `
          <tr>
            <td style="padding: 8px; border: 1px solid #cbd5e1;">${item.studentIdCode}</td>
            <td style="padding: 8px; border: 1px solid #cbd5e1;">${item.studentName}</td>
            <td style="padding: 8px; border: 1px solid #cbd5e1;">${item.subjectName}</td>
            <td style="padding: 8px; border: 1px solid #cbd5e1;">${item.subjectCode}</td>
            <td style="padding: 8px; border: 1px solid #cbd5e1;">${item.className}</td>
            <td style="padding: 8px; border: 1px solid #cbd5e1;">${item.examType}</td>
            <td style="padding: 8px; border: 1px solid #cbd5e1;">${item.academicYear}</td>
            <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: center;">${item.marksObtained}</td>
            <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: center;">${item.totalMarks}</td>
            <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: center; font-weight: bold; color: ${item.grade.toUpperCase().startsWith('F') ? '#b91c1c' : '#4338ca'};">${item.grade}</td>
          </tr>
        `;
      });
    }

    const excelTemplate = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:Name>${title}</x:Name>
              <x:WorksheetOptions>
                <x:DisplayGridlines/>
              </x:WorksheetOptions>
            </x:ExcelWorksheet>
          </x:ExcelWorksheets>
        </x:ExcelWorkbook>
      </xml>
      <![endif]-->
      <meta charset="utf-8" />
      </head>
      <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px;">
        <h2 style="color: #1e3a8a; font-family: sans-serif; margin-bottom: 2px;">University Administration Center</h2>
        <p style="color: #64748b; font-family: sans-serif; font-size: 13px; margin-top: 0; margin-bottom: 24px;">Generated Report Ledger: ${title} | Date: ${new Date().toLocaleDateString()}</p>
        <table border="1" style="border-collapse: collapse; font-family: sans-serif; font-size: 13px;">
          <thead>
            ${headerHtml}
          </thead>
          <tbody>
            ${rowHtml}
          </tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([excelTemplate], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const blobUrl = URL.createObjectURL(blob);
    
    const downloadAnchor = document.createElement('a');
    downloadAnchor.href = blobUrl;
    downloadAnchor.download = `academic_${reportType}_report_${new Date().toISOString().split('T')[0]}.xls`;
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    
    document.body.removeChild(downloadAnchor);
    URL.revokeObjectURL(blobUrl);
  };

  const handlePrintPDF = () => {
    setPrintPreviewActive(true);
    // Delay to allow modal DOM rendering, then trigger standard browser print
    setTimeout(() => {
      window.print();
    }, 450);
  };

  // Helper calculation metrics values for statistics boards
  const getCalculatedMetrics = () => {
    if (!reportData || reportData.length === 0) {
      return { label1: 'Count', value1: 0, label2: 'Subtotal / Status', value2: '-' };
    }

    if (reportType === 'enrollment') {
      const activeCount = reportData.filter(d => d.status === 'ACTIVE').length;
      return {
        label1: 'Total Registered Students',
        value1: reportData.length,
        label2: 'Active Status Ratio',
        value2: `${activeCount} Active / ${reportData.length - activeCount} Inactive`
      };
    }
    
    if (reportType === 'fees') {
      const totalAmountFees = reportData.reduce((acc, p) => acc + p.amountPaid, 0);
      return {
        label1: 'Statements count',
        value1: reportData.length,
        label2: 'Aggregate Receipts Sum',
        value2: `$${totalAmountFees.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      };
    }

    if (reportType === 'salaries') {
      const totalSalaryPaid = reportData.reduce((acc, p) => acc + p.amount, 0);
      return {
        label1: 'Payroll Count',
        value1: reportData.length,
        label2: 'Aggregated Monthly Spent',
        value2: `$${totalSalaryPaid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      };
    }

    if (reportType === 'grades') {
      const averageMarks = reportData.reduce((acc, g) => acc + (g.marksObtained / g.totalMarks) * 100, 0) / reportData.length;
      const failures = reportData.filter(g => g.grade.trim().toUpperCase() === 'F').length;
      return {
        label1: 'Scorecards Graded',
        value1: reportData.length,
        label2: 'Average Score Metric',
        value2: `${averageMarks.toFixed(1)}% (${failures} Failing grades)`
      };
    }

    return { label1: 'Count', value1: 0, label2: 'State', value2: '-' };
  };

  const currentMetrics = getCalculatedMetrics();

  return (
    <div className="space-y-6 animate-fade-in font-sans text-slate-700">
      
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-6 border-b border-slate-200 gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800">Operational Report Center</h2>
          <p className="text-xs text-slate-500 mt-1">Configure criteria, filter registers, preview live tables, and export styled spreadsheets or official PDF prints.</p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0">
          <button 
            onClick={() => setReportType('enrollment')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-tight transition-all cursor-pointer ${reportType === 'enrollment' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Enrollment
          </button>
          <button 
            onClick={() => setReportType('fees')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-tight transition-all cursor-pointer ${reportType === 'fees' ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Fee Collection
          </button>
          <button 
            onClick={() => setReportType('salaries')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-tight transition-all cursor-pointer ${reportType === 'salaries' ? 'bg-white text-sky-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Staff Payroll
          </button>
          <button 
            onClick={() => setReportType('grades')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-tight transition-all cursor-pointer ${reportType === 'grades' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Academic Performance
          </button>
        </div>
      </div>

      {/* Criteria Filter Console Card */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-4 h-4 text-slate-400" />
          <h3 className="font-bold text-slate-850 text-xs uppercase tracking-wider">Report criteria filtration controls</h3>
        </div>

        {/* Academic & Financial Date Period Picker */}
        <div className="mb-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-500" />
              <div>
                <h4 className="font-bold text-xs text-slate-700 uppercase tracking-tight">Academic & Financial Custom Periods</h4>
                <p className="text-[10px] text-slate-400 font-medium">Filter reports and dashboard charts using custom ranges or standard institutional presets.</p>
              </div>
            </div>
            
            {/* Custom inputs */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                <span>From</span>
                <input 
                  type="date"
                  value={startDate || ''}
                  onChange={(e) => onDateRangeChange?.(e.target.value, endDate || '')}
                  className="p-1 px-3 border border-slate-200 rounded-lg bg-white text-slate-700 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                <span>To</span>
                <input 
                  type="date"
                  value={endDate || ''}
                  onChange={(e) => onDateRangeChange?.(startDate || '', e.target.value)}
                  className="p-1 px-3 border border-slate-200 rounded-lg bg-white text-slate-700 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              {(startDate || endDate) && (
                <button
                  type="button"
                  onClick={() => onDateRangeChange?.('', '')}
                  className="px-2 py-1 text-[10px] text-rose-500 hover:text-rose-600 hover:bg-rose-50 font-bold uppercase rounded border border-rose-100 transition-colors cursor-pointer"
                >
                  Clear Period
                </button>
              )}
            </div>
          </div>

          {/* Quick preset chips */}
          <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-3 border-t border-slate-200/60">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">Period Presets:</span>
            {[
              { label: 'Term 1 (Spring 2024)', start: '2024-01-01', end: '2024-04-30' },
              { label: 'Term 2 (Summer 2024)', start: '2024-05-01', end: '2024-08-31' },
              { label: 'Term 3 (Fall 2024)', start: '2024-09-01', end: '2024-12-31' },
              { label: 'Fiscal Q1 2024', start: '2024-01-01', end: '2024-03-31' },
              { label: 'Fiscal Q2 2024', start: '2024-04-01', end: '2024-06-30' },
              { label: 'Fiscal Q3 2024', start: '2024-07-01', end: '2024-09-30' },
              { label: 'Fiscal Q4 2024', start: '2024-10-01', end: '2024-12-31' },
              { label: 'Academic Year 2024', start: '2024-01-01', end: '2024-12-31' },
              { label: 'Academic Year 2025', start: '2025-01-01', end: '2025-12-31' }
            ].map(preset => {
              const isActive = startDate === preset.start && endDate === preset.end;
              return (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => onDateRangeChange?.(preset.start, preset.end)}
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white border border-blue-600 shadow-xs'
                      : 'bg-white text-slate-500 hover:text-slate-800 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          
          {/* Dynamic Filters depending on Category selection */}
          {reportType === 'enrollment' && (
            <>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Academic Year</label>
                <select 
                  value={academicYear} 
                  onChange={(e) => setAcademicYear(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:ring-1 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="">All Years</option>
                  <option value="2023">2023</option>
                  <option value="2024">2024</option>
                  <option value="2025">2025</option>
                  <option value="2026">2026</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Status Code</label>
                <select 
                  value={status} 
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:ring-1 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="">All Statuses</option>
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Class Level Assignment</label>
                <select 
                  value={classId} 
                  onChange={(e) => setClassId(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:ring-1 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="">All Classes</option>
                  {classesList.map(item => (
                    <option key={item.id} value={item.id}>{item.className} ({item.section}) - Term {item.academicYear}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          {reportType === 'fees' && (
            <>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Academic Year</label>
                <select 
                  value={academicYear} 
                  onChange={(e) => setAcademicYear(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:ring-1 focus:ring-teal-500 focus:outline-none"
                >
                  <option value="">All Years</option>
                  <option value="2023">2023</option>
                  <option value="2024">2024</option>
                  <option value="2025">2025</option>
                  <option value="2026">2026</option>
                </select>
              </div>

              <div className="sm:col-span-3">
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Class Level Enrollment</label>
                <select 
                  value={classId} 
                  onChange={(e) => setClassId(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:ring-1 focus:ring-teal-500 focus:outline-none"
                >
                  <option value="">All Classes</option>
                  {classesList.map(item => (
                    <option key={item.id} value={item.id}>{item.className} ({item.section}) - Term {item.academicYear}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          {reportType === 'salaries' && (
            <>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Disbursement Month</label>
                <select 
                  value={month} 
                  onChange={(e) => setMonth(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:ring-1 focus:ring-sky-500 focus:outline-none"
                >
                  <option value="">All Months</option>
                  <option value="1">January (M1)</option>
                  <option value="2">February (M2)</option>
                  <option value="3">March (M3)</option>
                  <option value="4">April (M4)</option>
                  <option value="5">May (M5)</option>
                  <option value="6">June (M6)</option>
                  <option value="7">July (M7)</option>
                  <option value="8">August (M8)</option>
                  <option value="9">September (M9)</option>
                  <option value="10">October (M10)</option>
                  <option value="11">November (M11)</option>
                  <option value="12">December (M12)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Disbursement Year</label>
                <select 
                  value={year} 
                  onChange={(e) => setYear(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:ring-1 focus:ring-sky-500 focus:outline-none"
                >
                  <option value="">All Years</option>
                  <option value="2023">2023</option>
                  <option value="2024">2024</option>
                  <option value="2025">2025</option>
                  <option value="2026">2026</option>
                </select>
              </div>

              <div className="sm:col-span-2 flex items-end">
                <div className="text-[10px] text-slate-400 bg-slate-50 p-3 rounded-lg border border-slate-200 w-full">
                  Exports settled compensation indices, tax deductions, basic payments status trackers, and gross salary counts.
                </div>
              </div>
            </>
          )}

          {reportType === 'grades' && (
            <>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Assessment Code</label>
                <select 
                  value={examType} 
                  onChange={(e) => setExamType(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="">All Assessments</option>
                  <option value="MID_TERM">Mid Term Exam</option>
                  <option value="FINAL_TERM">Final Term Exam</option>
                  <option value="ASSIGNMENT">Assignment</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Course Academic Year</label>
                <select 
                  value={academicYear} 
                  onChange={(e) => setAcademicYear(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="">All Years</option>
                  <option value="2023">2023</option>
                  <option value="2024">2024</option>
                  <option value="2025">2025</option>
                  <option value="2026">2026</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Classroom Assign</label>
                <select 
                  value={classId} 
                  onChange={(e) => setClassId(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="">All Classes</option>
                  {classesList.map(item => (
                    <option key={item.id} value={item.id}>{item.className} ({item.section})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Subject Module</label>
                <select 
                  value={subjectId} 
                  onChange={(e) => setSubjectId(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="">All Subjects</option>
                  {subjectsList
                     .filter(s => !classId || s.classId === parseInt(classId, 10))
                     .map(item => (
                       <option key={item.id} value={item.id}>{item.subjectName} ({item.subjectCode})</option>
                  ))}
                </select>
              </div>
            </>
          )}

        </div>

        {/* Console Actions Block */}
        <div className="flex justify-between items-center mt-6 pt-5 border-t border-slate-100">
          <div className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded bg-blue-500"></span>
            Records are query-synchronized live from the relational database system
          </div>
          <button 
            onClick={generateReport}
            className="px-5 py-2 hover:bg-slate-800 bg-slate-900 border border-slate-950 text-white font-semibold text-xs rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
          >
            <Search className="w-3.5 h-3.5" />
            Generate Live Report
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center p-20 gap-3 bg-white rounded-xl border border-slate-200">
          <div className="w-10 h-10 border-4 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 text-xs font-semibold">Generating live administration spreadsheet...</p>
        </div>
      ) : (
        <>
          {/* Aggregated Quick Metrics Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center gap-4">
              <div className="p-2.5 bg-white border border-slate-200 rounded-lg text-slate-700 shrink-0">
                <FileText className="w-5 h-5 text-slate-600" />
              </div>
              <div>
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">{currentMetrics.label1}</p>
                <h4 className="text-xl font-bold text-slate-800 mt-0.5">{currentMetrics.value1} Rows</h4>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center gap-4">
              <div className="p-2.5 bg-white border border-slate-200 rounded-lg text-slate-700 shrink-0">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">{currentMetrics.label2}</p>
                <h4 className="text-lg font-bold text-slate-800 mt-0.5">{currentMetrics.value2}</h4>
              </div>
            </div>
          </div>

          {/* Report Live Grid Preview */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-250 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Report Data Preview</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">{reportData.length} records retrieved matching filtration filters</p>
              </div>

              {reportData.length > 0 && (
                <div className="flex gap-2">
                  <button
                    onClick={handleExportExcel}
                    className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
                  >
                    <FileSpreadsheet className="w-4 h-4" /> Export Excel
                  </button>
                  <button
                    onClick={handlePrintPDF}
                    className="px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer sign-up-btn transition-colors shadow-xs"
                  >
                    <Download className="w-4 h-4" /> Print / Save PDF
                  </button>
                </div>
              )}
            </div>

            <div className="overflow-x-auto max-h-[420px]">
              {reportData.length === 0 ? (
                <div className="p-20 text-center">
                  <p className="text-slate-400 text-xs font-medium">No matching database reports found. Click Generate Live Report with selected filters.</p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase text-[10px] tracking-wider font-semibold">
                      {reportType === 'enrollment' && (
                        <>
                          <th className="p-3">Student ID</th>
                          <th className="p-3">Full Name</th>
                          <th className="p-3">Email Address</th>
                          <th className="p-3">Phone</th>
                          <th className="p-3">Assigned Class</th>
                          <th className="p-3">Enroll. Date</th>
                          <th className="p-3">Status</th>
                        </>
                      )}
                      {reportType === 'fees' && (
                        <>
                          <th className="p-3">Receipt No</th>
                          <th className="p-3">Student name</th>
                          <th className="p-3">Classroom level</th>
                          <th className="p-3">Term Code</th>
                          <th className="p-3">Transaction reference ID</th>
                          <th className="p-3">Method</th>
                          <th className="p-3 text-right">Amount Paid</th>
                        </>
                      )}
                      {reportType === 'salaries' && (
                        <>
                          <th className="p-3">Staff ID</th>
                          <th className="p-3">Full Name</th>
                          <th className="p-3">Department</th>
                          <th className="p-3 text-center">Pay Term period</th>
                          <th className="p-3">Date settled</th>
                          <th className="p-3">Method</th>
                          <th className="p-3 text-right">Allowances</th>
                          <th className="p-3 text-right">Deductions</th>
                          <th className="p-3 text-right">Net amount</th>
                        </>
                      )}
                      {reportType === 'grades' && (
                        <>
                          <th className="p-3">Student ID</th>
                          <th className="p-3">FullName</th>
                          <th className="p-3">Course Subject</th>
                          <th className="p-3">Course Level</th>
                          <th className="p-3 text-center">Assessment Code</th>
                          <th className="p-3 text-center text-bold">Marks Yield</th>
                          <th className="p-3 text-center">Grade Yield</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {reportData.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50 text-slate-700">
                        {reportType === 'enrollment' && (
                          <>
                            <td className="p-3 font-mono font-bold text-[11px] text-slate-800">{item.studentId}</td>
                            <td className="p-3 font-semibold text-slate-800">{item.firstName} {item.lastName}</td>
                            <td className="p-3 font-medium text-slate-500">{item.email}</td>
                            <td className="p-3 text-slate-500">{item.phone || 'N/A'}</td>
                            <td className="p-3 text-slate-600 font-semibold">{item.className}</td>
                            <td className="p-3 text-slate-500">{item.enrollmentDate}</td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${item.status === 'ACTIVE' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                                {item.status}
                              </span>
                            </td>
                          </>
                        )}
                        {reportType === 'fees' && (
                          <>
                            <td className="p-3 font-mono font-bold text-slate-700">{item.receiptNo}</td>
                            <td className="p-3 font-semibold text-slate-800">{item.studentName} <span className="block text-[10px] text-slate-400 font-mono font-normal">ID: {item.studentId}</span></td>
                            <td className="p-3 text-slate-600">{item.className}</td>
                            <td className="p-3 text-slate-500 font-mono font-medium">{item.academicYear}</td>
                            <td className="p-3 font-mono text-[11px] text-slate-400">{item.transactionId}</td>
                            <td className="p-3 font-mono uppercase text-[10px] font-bold text-slate-500">{item.paymentMethod}</td>
                            <td className="p-3 text-right font-mono font-bold text-teal-600">${item.amountPaid.toFixed(2)}</td>
                          </>
                        )}
                        {reportType === 'salaries' && (
                          <>
                            <td className="p-3 font-mono font-bold">{item.staffIdCode}</td>
                            <td className="p-3 font-semibold text-slate-800">{item.staffName}</td>
                            <td className="p-3 text-slate-600 font-medium">{item.department}</td>
                            <td className="p-3 text-center text-slate-500 font-mono text-[11px] font-semibold">{item.month} / {item.year}</td>
                            <td className="p-3 text-slate-500">{item.paymentDate}</td>
                            <td className="p-3 font-mono uppercase text-[10px] font-bold text-slate-500">{item.paymentMethod}</td>
                            <td className="p-3 text-right text-slate-500 font-mono">${item.allowances.toFixed(2)}</td>
                            <td className="p-3 text-right text-red-500 font-mono">-${item.deductions.toFixed(2)}</td>
                            <td className="p-3 text-right font-mono font-bold text-sky-600">${item.amount.toFixed(2)}</td>
                          </>
                        )}
                        {reportType === 'grades' && (
                          <>
                            <td className="p-3 font-mono font-semibold text-slate-500">{item.studentIdCode}</td>
                            <td className="p-3 font-semibold text-slate-800">{item.studentName}</td>
                            <td className="p-3 text-slate-700 font-semibold">{item.subjectName} <span className="text-[10px] text-slate-400 font-mono block font-normal">{item.subjectCode}</span></td>
                            <td className="p-3 text-slate-500">{item.className}</td>
                            <td className="p-3 text-center font-mono text-[10px] font-bold bg-slate-50 border border-slate-100 rounded px-1">{item.examType}</td>
                            <td className="p-3 text-center font-mono font-bold text-slate-850 bg-slate-50">{item.marksObtained} / {item.totalMarks}</td>
                            <td className="p-3 text-center">
                              <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${item.grade.toUpperCase().startsWith('F') ? 'bg-red-50 text-red-700' : 'bg-indigo-50 text-indigo-700'}`}>
                                {item.grade}
                              </span>
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}

      {/* Pristine Document Printable Cover popup */}
      {printPreviewActive && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto print:absolute print:inset-0 print:bg-white print:p-0 print:z-0">
          <div className="bg-white rounded-xl max-w-4xl w-full p-8 shadow-2xl relative border border-slate-200 flex flex-col gap-6 print:border-none print:shadow-none print:p-0">
            
            {/* Control buttons header (hidden when print trigger activates) */}
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 print:hidden">
              <div>
                <h4 className="font-bold text-slate-800 text-sm">Print Layout Preview</h4>
                <p className="text-[11px] text-slate-400">PDF standard paper size layout. Ready for printing or download.</p>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  Confirm Print
                </button>
                <button 
                  onClick={() => setPrintPreviewActive(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  Close Preview
                </button>
              </div>
            </div>

            {/* Official Report Container */}
            <div id="print-area" className="space-y-6 font-sans text-slate-800">
              <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4">
                <div>
                  <h1 className="text-xl font-bold uppercase tracking-tight text-slate-900">University Administration Center</h1>
                  <p className="text-xs text-slate-500 font-semibold">Institutional Registry & Accounting Division</p>
                  <p className="text-[10px] text-slate-400 font-mono mt-1">Ref ID: REPT-{(reportType).toUpperCase()}-{new Date().getFullYear()}</p>
                </div>
                <div className="text-right">
                  <h3 className="text-xs font-bold text-slate-900 uppercase">Official Ledger Statement</h3>
                  <p className="text-xs text-slate-500 mt-1">Date: {new Date().toLocaleDateString()}</p>
                  <p className="text-[10px] text-slate-400 font-mono">Status: Verified</p>
                </div>
              </div>

              {/* Summary Indicators */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Report Category</span>
                  <h4 className="text-sm font-bold text-slate-800 capitalize mt-0.5">{reportType} Ledger Report</h4>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Record summary tally</span>
                  <p className="text-xs font-semibold text-slate-800 mt-0.5">{currentMetrics.value1} Rows retrieve indicators ({currentMetrics.value2})</p>
                </div>
              </div>

              {/* Data Table */}
              <div className="border border-slate-350 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-300 text-slate-800 uppercase font-bold text-[9px] tracking-wider">
                      {reportType === 'enrollment' && (
                        <>
                          <th className="p-2.5">Student ID</th>
                          <th className="p-2.5">Full Name</th>
                          <th className="p-2.5">Email Address</th>
                          <th className="p-2.5">Assigned Class</th>
                          <th className="p-2.5">Enroll. Date</th>
                          <th className="p-2.5">Status</th>
                        </>
                      )}
                      {reportType === 'fees' && (
                        <>
                          <th className="p-2.5">Receipt No</th>
                          <th className="p-2.5">Student Name</th>
                          <th className="p-2.5">Student ID</th>
                          <th className="p-2.5">Class level</th>
                          <th className="p-2.5">Academic Term</th>
                          <th className="p-2.5 text-right">Amount Paid</th>
                        </>
                      )}
                      {reportType === 'salaries' && (
                        <>
                          <th className="p-2.5">Staff ID</th>
                          <th className="p-2.5">Full Name</th>
                          <th className="p-2.5">Department</th>
                          <th className="p-2.5 text-center">Period</th>
                          <th className="p-2.5">Date settled</th>
                          <th className="p-2.5 text-right font-bold text-slate-900">Net salary</th>
                        </>
                      )}
                      {reportType === 'grades' && (
                        <>
                          <th className="p-2.5">Student ID</th>
                          <th className="p-2.5">FullName</th>
                          <th className="p-2.5">Course Subject</th>
                          <th className="p-2.5">Class level</th>
                          <th className="p-2.5 text-center text-bold font-bold">Marks Yield</th>
                          <th className="p-2.5 text-center">Grade Yield</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {reportData.map((item) => (
                      <tr key={item.id} className="text-slate-800">
                        {reportType === 'enrollment' && (
                          <>
                            <td className="p-2.5 font-mono font-bold text-[11px]">{item.studentId}</td>
                            <td className="p-2.5 font-semibold">{item.firstName} {item.lastName}</td>
                            <td className="p-2.5 text-slate-600">{item.email}</td>
                            <td className="p-2.5 text-slate-600">{item.className}</td>
                            <td className="p-2.5 text-slate-500">{item.enrollmentDate}</td>
                            <td className="p-2.5 font-bold text-[10px] text-emerald-700">{item.status}</td>
                          </>
                        )}
                        {reportType === 'fees' && (
                          <>
                            <td className="p-2.5 font-mono font-bold">{item.receiptNo}</td>
                            <td className="p-2.5 font-semibold text-slate-800">{item.studentName}</td>
                            <td className="p-2.5 font-mono text-[10px]">{item.studentId}</td>
                            <td className="p-2.5 text-slate-600">{item.className}</td>
                            <td className="p-2.5 text-slate-500 font-mono">{item.academicYear}</td>
                            <td className="p-2.5 text-right font-mono font-bold text-slate-900">${item.amountPaid.toFixed(2)}</td>
                          </>
                        )}
                        {reportType === 'salaries' && (
                          <>
                            <td className="p-2.5 font-mono font-bold">{item.staffIdCode}</td>
                            <td className="p-2.5 font-semibold">{item.staffName}</td>
                            <td className="p-2.5 text-slate-600">{item.department}</td>
                            <td className="p-2.5 text-center text-slate-500 font-mono">{item.month}/{item.year}</td>
                            <td className="p-2.5 text-slate-500">{item.paymentDate}</td>
                            <td className="p-2.5 text-right font-mono font-bold">${item.amount.toFixed(2)}</td>
                          </>
                        )}
                        {reportType === 'grades' && (
                          <>
                            <td className="p-2.5 font-mono font-semibold text-slate-500">{item.studentIdCode}</td>
                            <td className="p-2.5 font-semibold">{item.studentName}</td>
                            <td className="p-2.5 font-semibold text-slate-700">{item.subjectName} ({item.subjectCode})</td>
                            <td className="p-2.5 text-slate-500">{item.className}</td>
                            <td className="p-2.5 text-center font-mono font-bold bg-slate-50">{item.marksObtained} / {item.totalMarks}</td>
                            <td className="p-2.5 text-center font-bold text-indigo-700">{item.grade}</td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Signoff Verification Footer Box for PDFs */}
              <div className="grid grid-cols-2 gap-8 pt-12">
                <div className="text-center pt-8 border-t border-slate-300">
                  <p className="text-[11px] text-slate-500 font-semibold font-mono">Academic Registrar Division</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Official Stamp Sign-off</p>
                </div>
                <div className="text-center pt-8 border-t border-slate-300">
                  <p className="text-[11px] text-slate-500 font-semibold font-mono">Finance Comptroller Office</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Verify Ledger Balance</p>
                </div>
              </div>

              <div className="text-center text-[9px] text-slate-400 pt-6">
                This document is a computer-generated official register record. No manual seal alteration constitutes authorization validity.
              </div>
            </div>
            
          </div>
        </div>
      )}

    </div>
  );
}
