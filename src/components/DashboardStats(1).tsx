import React from 'react';
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  AlertCircle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  CalendarDays
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend
} from 'recharts';

interface DashboardStatsProps {
  stats: {
    totalStudents: number;
    totalStaff: number;
    revenue: number;
    pendingFees: number;
    recentRevenue: Array<{ id: number; name: string; amount: number; date: string; method: string }>;
    recentSalaries: Array<{ id: number; name: string; amount: number; date: string; method: string; period: string }>;
    cashflowChart: Array<{ month: string; Revenue: number; Salaries: number }>;
    enrollmentByClass?: Array<{ className: string; count: number }>;
    performanceDistribution?: Array<{ grade: string; count: number }>;
  } | null;
  loading: boolean;
  username: string;
  role: string;
  startDate?: string;
  endDate?: string;
  onDateRangeChange?: (start: string, end: string) => void;
}

export default function DashboardStats({ 
  stats, 
  loading, 
  username, 
  role,
  startDate,
  endDate,
  onDateRangeChange
}: DashboardStatsProps) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <div className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 font-sans text-sm font-medium">Assembling metric systems...</p>
      </div>
    );
  }

  if (!stats) return null;

  // Formatting metrics to beautiful local currency labels
  const formatCurrency = (amt: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amt);
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      {/* Sleek Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-6 border-b border-slate-200">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800">Institutional Overview</h2>
          <p className="text-xs text-slate-500 mt-1">Welcome back, {username}. Operational and financial indices are updated in real-time.</p>
        </div>
        <div className="mt-4 md:mt-0 flex items-center gap-3">
          <div className="text-xs px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-full font-bold flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Portal Secured & Live
          </div>
        </div>
      </div>

      {/* Dynamic Time Period Filter Status Bar */}
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white rounded-lg border border-slate-200 text-slate-650 shrink-0">
            <CalendarDays className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h4 className="font-bold text-xs text-slate-700 uppercase tracking-tight">Active Academic & Financial Period</h4>
            <p className="text-xs text-slate-500 mt-0.5">
              {startDate || endDate ? (
                <span>Currently showing metrics filtered from <strong className="text-slate-850 font-bold">{startDate || 'inception'}</strong> to <strong className="text-slate-850 font-bold">{endDate || 'now'}</strong>.</span>
              ) : (
                <span>Showing lifetime aggregate data. Select an academic term or custom period to filter.</span>
              )}
            </p>
          </div>
        </div>

        {/* Date Filters Inputs & Quick Presets */}
        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
          <div className="flex items-center gap-1.5 text-xs w-full sm:w-auto">
            <span className="text-slate-405 font-medium shrink-0">From</span>
            <input 
              type="date"
              value={startDate || ''}
              onChange={(e) => onDateRangeChange?.(e.target.value, endDate || '')}
              className="p-1 px-2.5 border border-slate-200 rounded-lg bg-white text-slate-700 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none w-full sm:w-auto"
            />
          </div>
          <div className="flex items-center gap-1.5 text-xs w-full sm:w-auto">
            <span className="text-slate-405 font-medium shrink-0">To</span>
            <input 
              type="date"
              value={endDate || ''}
              onChange={(e) => onDateRangeChange?.(startDate || '', e.target.value)}
              className="p-1 px-2.5 border border-slate-200 rounded-lg bg-white text-slate-700 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none w-full sm:w-auto"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
            <select
              value={startDate && endDate ? `${startDate}_${endDate}` : ''}
              onChange={(e) => {
                if (e.target.value === '') {
                  onDateRangeChange?.('', '');
                } else {
                  const [start, end] = e.target.value.split('_');
                  onDateRangeChange?.(start, end);
                }
              }}
              className="p-1.5 px-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Presets...</option>
              <option value="2024-01-01_2024-04-30">Term 1 (Spring 2024)</option>
              <option value="2024-05-01_2024-08-31">Term 2 (Summer 2024)</option>
              <option value="2024-09-01_2024-12-31">Term 3 (Fall 2024)</option>
              <option value="2024-01-01_2024-03-31">Fiscal Q1 2024</option>
              <option value="2024-04-01_2024-06-30">Fiscal Q2 2024</option>
              <option value="2024-07-01_2024-09-30">Fiscal Q3 2024</option>
              <option value="2024-10-01_2024-12-31">Fiscal Q4 2024</option>
              <option value="2024-01-01_2024-12-31">Academic Year 2024</option>
              <option value="2025-01-01_2025-12-31">Academic Year 2025</option>
            </select>

            {(startDate || endDate) && (
              <button
                type="button"
                onClick={() => onDateRangeChange?.('', '')}
                className="px-2.5 py-1.5 text-[10px] text-rose-500 hover:text-rose-600 hover:bg-rose-50 font-bold uppercase rounded border border-rose-250 transition-colors cursor-pointer shrink-0"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Metrics bento grids */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Stat 1: Total Students */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Active Students</p>
            <h3 className="text-2xl font-bold text-slate-900">{stats.totalStudents}</h3>
            <p className="text-green-500 text-xs mt-2">+4.2% from last term</p>
          </div>
          <div className="w-10 h-10 rounded bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Stat 2: Total Faculty */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Faculty Members</p>
            <h3 className="text-2xl font-bold text-slate-900">{stats.totalStaff}</h3>
            <p className="text-slate-400 text-xs mt-2">24 pending recruitment</p>
          </div>
          <div className="w-10 h-10 rounded bg-slate-50 flex items-center justify-center text-slate-600 shrink-0">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Stat 3: Total Revenue */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Revenue (YTD)</p>
            <h3 className="text-2xl font-bold text-blue-600">{formatCurrency(stats.revenue)}</h3>
            <p className="text-green-500 text-xs mt-2">88% of target reached</p>
          </div>
          <div className="w-10 h-10 rounded bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        {/* Stat 4: Pending Fees */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Pending Fees</p>
            <h3 className="text-2xl font-bold text-orange-500">{formatCurrency(stats.pendingFees)}</h3>
            <p className="text-red-400 text-xs mt-2">152 accounts overdue</p>
          </div>
          <div className="w-10 h-10 rounded bg-orange-50 flex items-center justify-center text-orange-600 shrink-0">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Recharts Graphical Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cashflow Trends over Academic Quarters */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h4 className="font-bold text-slate-800">Financial Cashflow Analytics</h4>
              <p className="text-slate-400 text-xs mt-0.5">Quarterly fee collections vs faculty salary disbursements</p>
            </div>
            <div className="flex items-center gap-1 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded text-slate-500 text-xs font-mono">
              Academic Term 2024
            </div>
          </div>
          
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.cashflowChart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorSalaries" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: 'white', fontSize: 12 }}
                  labelStyle={{ fontWeight: 'bold', color: '#60a5fa' }}
                />
                <Legend iconSize={8} iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                <Area type="monotone" dataKey="Revenue" stroke="#2563eb" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" name="Fees Collected ($)" />
                <Area type="monotone" dataKey="Salaries" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#colorSalaries)" name="Payroll Output ($)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Dynamic breakdown ratios */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <h4 className="font-bold text-slate-800">Fee Liquidation Status</h4>
            <p className="text-slate-400 text-xs mt-0.5">Total liquid assets against outstanding debts</p>
          </div>

          <div className="my-6">
            <div className="w-full h-8 bg-slate-50 rounded-lg overflow-hidden flex p-1 border border-slate-200">
              <div 
                style={{ width: `${(stats.revenue / (stats.revenue + stats.pendingFees)) * 100}%` }}
                className="bg-blue-600 h-full rounded flex items-center justify-center text-[10px] font-bold text-white shadow-inner transition-all"
              >
                {Math.round((stats.revenue / (stats.revenue + stats.pendingFees)) * 100)}%
              </div>
              <div 
                style={{ width: `${(stats.pendingFees / (stats.revenue + stats.pendingFees)) * 100}%` }}
                className="bg-orange-500 h-full rounded flex items-center justify-center text-[10px] font-bold text-white transition-all"
              >
                {Math.round((stats.pendingFees / (stats.revenue + stats.pendingFees)) * 100)}%
              </div>
            </div>
          </div>

          <div className="space-y-2.5 pt-4 border-t border-slate-100 text-xs">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                <span className="text-slate-500 font-medium">Collected Pool</span>
              </div>
              <span className="font-mono font-bold text-slate-850">{formatCurrency(stats.revenue)}</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                <span className="text-slate-500 font-medium">Outstanding Pool</span>
              </div>
              <span className="font-mono font-bold text-slate-850">{formatCurrency(stats.pendingFees)}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-slate-100 text-xs text-slate-400 font-medium">
              <span>Goal Target Pool</span>
              <span className="font-mono">{formatCurrency(stats.revenue + stats.pendingFees)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Demographics & Academic Indicators */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Class Enrollment Breakdown */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h4 className="font-bold text-slate-800">Class Enrollment Density</h4>
              <p className="text-slate-400 text-xs mt-0.5">Active enrolled student count breakdown across institutional class levels</p>
            </div>
            <div className="flex items-center gap-1 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded text-slate-500 text-xs font-mono">
              Enrolls 2024
            </div>
          </div>
          
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.enrollmentByClass || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="className" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} allowDecimals={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: 'white', fontSize: 12 }}
                  labelStyle={{ fontWeight: 'bold', color: '#60a5fa' }}
                />
                <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} name="Active Students" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Academic Marks Performance Distributions */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h4 className="font-bold text-slate-800">Grade Distribution</h4>
              <p className="text-slate-400 text-xs mt-0.5">Academic marks scorecard frequency distribution</p>
            </div>
            <div className="flex items-center gap-1 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded text-slate-500 text-xs font-mono">
              Grades 2024
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.performanceDistribution || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="grade" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} allowDecimals={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: 'white', fontSize: 12 }}
                  labelStyle={{ fontWeight: 'bold', color: '#60a5fa' }}
                />
                <Bar dataKey="count" fill="#4f46e5" radius={[4, 4, 0, 0]} name="Tally count" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Ledger Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Tuition Fees Payments */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100">
            <h4 className="font-bold text-slate-800 text-sm">Recent Tuition Receipts</h4>
            <span className="text-[9px] font-mono uppercase bg-blue-50 text-blue-600 font-bold px-2 py-0.5 rounded border border-blue-100">Tuition Logs</span>
          </div>
          {stats.recentRevenue.length === 0 ? (
            <p className="text-slate-400 text-xs text-center py-6">No previous tuition invoices found</p>
          ) : (
            <div className="divide-y divide-slate-100 max-h-[220px] overflow-y-auto pr-1">
              {stats.recentRevenue.map((item) => (
                <div key={item.id} className="py-2.5 flex justify-between items-center text-xs font-sans">
                  <div>
                    <h5 className="font-semibold text-slate-800">{item.name}</h5>
                    <p className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                      <span>{item.date}</span>
                      <span>•</span>
                      <span className="font-mono text-[9px] uppercase font-bold text-slate-500">{item.method}</span>
                    </p>
                  </div>
                  <span className="font-mono font-bold text-blue-600">+{formatCurrency(item.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Staff Salary disbursements */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100">
            <h4 className="font-bold text-slate-800 text-sm">Recent Payroll Disbursements</h4>
            <span className="text-[9px] font-mono uppercase bg-emerald-50 text-emerald-600 font-bold px-2 py-0.5 rounded border border-emerald-100">Faculty Payroll</span>
          </div>
          {stats.recentSalaries.length === 0 ? (
            <p className="text-slate-400 text-xs text-center py-6">No previous payroll payments cleared</p>
          ) : (
            <div className="divide-y divide-slate-100 max-h-[220px] overflow-y-auto pr-1">
              {stats.recentSalaries.map((item) => (
                <div key={item.id} className="py-2.5 flex justify-between items-center text-xs font-sans">
                  <div>
                    <h5 className="font-semibold text-slate-800">{item.name}</h5>
                    <p className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                      <span>{item.period}</span>
                      <span>•</span>
                      <span>{item.date}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-slate-800">{formatCurrency(item.amount)}</span>
                    <span className="block text-[9px] text-emerald-600 font-bold uppercase mt-0.5">Disbursed</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
