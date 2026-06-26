import { useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Wallet, Target,
  CreditCard, PiggyBank, ArrowRight, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useApi } from '../../hooks/useApi';
import { api } from '../../lib/api';
import { useSettingsStore } from '../../store/settingsStore';
import { formatCurrency, formatDate } from '../../lib/utils';
import SkeletonCard from '../../components/ui/SkeletonCard';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { data, loading, error, execute } = useApi(api.dashboard.getDashboard);
  const currency = useSettingsStore(state => state.settings?.currency ?? 'INR');

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  useEffect(() => {
    execute();
  }, [execute]);

  if (loading || !data) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-end mb-8">
          <div>
            <div className="h-8 w-64 bg-charcoal-700 rounded-lg animate-pulse mb-2"></div>
            <div className="h-4 w-48 bg-charcoal-700 rounded animate-pulse"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => <SkeletonCard key={i} className="h-32" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <SkeletonCard className="col-span-2 h-96" />
          <SkeletonCard className="col-span-1 h-96" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card p-8 text-center">
        <h2 className="text-xl font-semibold text-rose-500 mb-2">Error loading dashboard</h2>
        <p className="text-slate-400 mb-4">{error}</p>
        <button className="btn-primary" onClick={() => execute()}>Try Again</button>
      </div>
    );
  }

  const isCompletelyEmpty = data.totalAssets === 0 && data.totalLiabilities === 0 && (data.recentTransactions || []).length === 0;

  if (isCompletelyEmpty) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">
              {greeting}, <span className="text-gradient-blue">{user?.name?.split(' ')[0]}</span>
            </h1>
            <p className="text-slate-400 mt-1">Welcome to Zest. Let's get your finances organized.</p>
          </div>
        </div>
        <div className="card p-12 text-center max-w-2xl mx-auto border-dashed border-charcoal-600">
          <div className="h-20 w-20 bg-charcoal-700 rounded-full flex items-center justify-center mx-auto mb-6 shadow-glow">
            <Wallet size={32} className="text-slate-400" />
          </div>
          <h2 className="text-2xl font-semibold text-white mb-3">Ready to take control?</h2>
          <p className="text-slate-400 mb-8 max-w-md mx-auto leading-relaxed">Start by adding your first transaction or setting up a budget to track your spending and see insights.</p>
          <div className="flex justify-center gap-4">
            <Link to="/transactions" className="btn-primary">Add Transaction</Link>
            <Link to="/budgets" className="btn-secondary">Set up Budget</Link>
          </div>
        </div>
      </div>
    );
  }

  const StatCard = ({ title, value, icon: Icon, trend, trendValue }: any) => (
    <div className="card p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-400 mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-white num">{value}</h3>
        </div>
        <div className="p-3 bg-charcoal-700 rounded-xl">
          <Icon className="h-6 w-6 text-electric-400" />
        </div>
      </div>
      {trend && (
        <div className="mt-4 flex items-center text-sm">
          {trend === 'up' ? (
            <ArrowUpRight className="h-4 w-4 text-emerald-400 mr-1" />
          ) : (
            <ArrowDownRight className="h-4 w-4 text-rose-400 mr-1" />
          )}
          <span className={trend === 'up' ? 'text-emerald-400' : 'text-rose-400'}>
            {trendValue}
          </span>
          <span className="text-slate-500 ml-2">vs last month</span>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            {greeting}, <span className="text-gradient-blue">{user?.name?.split(' ')[0]}</span>
          </h1>
          <p className="text-slate-400 mt-1">Here's what's happening with your money today.</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-slate-400">{formatDate(new Date())}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Net Worth" 
          value={formatCurrency(data.netWorth)} 
          icon={Wallet} 
          trend={data.netWorthChange != null ? (data.netWorthChange >= 0 ? 'up' : 'down') : undefined}
trendValue={data.netWorthChange != null ? `${data.netWorthChange >= 0 ? '+' : ''}${data.netWorthChange.toFixed(1)}%` : undefined}
        />
        <StatCard 
          title="Monthly Income" 
          value={formatCurrency(data.monthlyIncome)} 
          icon={TrendingUp} 
        />
        <StatCard 
          title="Monthly Expenses" 
          value={formatCurrency(data.monthlyExpenses)} 
          icon={TrendingDown} 
        />
        <StatCard 
          title="Total Savings" 
          value={formatCurrency((data as any).totalSaved)} 
          icon={PiggyBank} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cash Flow Chart */}
        <div className="card p-6 col-span-1 lg:col-span-2">
          <h2 className="section-title mb-6">Cash Flow</h2>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.incomeVsExpenses || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2DFD9" vertical={false} />
                <XAxis dataKey="month" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis 
                  stroke="#64748b" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumSignificantDigits: 3 }).format(val)}
                />
                <Tooltip 
  cursor={{ fill: 'rgba(45,125,111,0.06)' }}
  contentStyle={{ backgroundColor: 'var(--charcoal-800)', borderColor: 'var(--charcoal-700)', borderRadius: '12px', color: 'var(--text-body)' }}
  formatter={(value: any) => formatCurrency(value)}
/>
                <Legend iconType="circle" />
                <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} barSize={24} />
                <Bar dataKey="expenses" name="Expenses" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Spending */}
        <div className="card p-6 col-span-1">
          <h2 className="section-title mb-6">Spending Breakdown</h2>
          <div className="h-64 w-full">
            {(data.categorySpending || []).length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.categorySpending || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="amount"
                  >
                    {(data.categorySpending || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--charcoal-800)', borderColor: 'var(--charcoal-700)', borderRadius: '12px', color: 'var(--text-body)' }}
                    formatter={(value: any) => formatCurrency(value)}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500 text-sm">
                No spending data this month
              </div>
            )}
          </div>
          <div className="mt-4 space-y-3">
            {(data.categorySpending || []).slice(0, 4).map((cat, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full mr-3" style={{ backgroundColor: cat.color }}></div>
                  <span className="text-slate-300">{cat.category}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-medium text-white num">{formatCurrency(cat.amount)}</span>
                  <span className="text-slate-500 text-xs w-8 text-right">{cat.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <div className="card p-0 overflow-hidden col-span-1">
          <div className="p-6 border-b border-charcoal-700 flex justify-between items-center">
            <h2 className="section-title">Recent Transactions</h2>
            <Link to="/transactions" className="text-sm font-medium text-electric-400 hover:text-electric-300 flex items-center">
              View All <ArrowRight size={16} className="ml-1" />
            </Link>
          </div>
          <div className="divide-y divide-charcoal-700">
            {(data.recentTransactions || []).length > 0 ? (
              (data.recentTransactions || []).map((tx) => (
                <div key={tx.id} className="p-4 sm:px-6 hover:bg-charcoal-700/30 transition-colors flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-2.5 rounded-xl ${tx.type === 'INCOME' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                      {tx.type === 'INCOME' ? <TrendingUp size={20} /> : <CreditCard size={20} />}
                    </div>
                    <div>
                      <p className="font-medium text-slate-200">{tx.name}</p>
                      <p className="text-xs text-slate-500">{tx.category} • {formatDate(tx.date)}</p>
                    </div>
                  </div>
                  <div className={`font-semibold num ${tx.type === 'INCOME' ? 'text-emerald-400' : 'text-slate-200'}`}>
                    {tx.type === 'INCOME' ? '+' : '-'}{formatCurrency(tx.amount)}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-slate-500">No recent transactions.</div>
            )}
          </div>
        </div>

        {/* Budget Health */}
        <div className="card p-6 col-span-1">
          <div className="flex justify-between items-center mb-6">
            <h2 className="section-title">Budget Health</h2>
            <Link to="/budgets" className="text-sm font-medium text-electric-400 hover:text-electric-300 flex items-center">
              Manage <ArrowRight size={16} className="ml-1" />
            </Link>
          </div>
          <div className="space-y-6">
            {(data.budgetHealth || []).length > 0 ? (
              (data.budgetHealth || []).map((budget) => (
                <div key={budget.id}>
                  <div className="flex justify-between text-sm mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: budget.color ?? '#6B7280' }}>{budget.name?.charAt(0)}</div>
                      <span className="font-medium text-slate-200">{budget.name}</span>
                    </div>
                    <div className="num">
                      <span className={budget.percentage >= 100 ? 'text-rose-400 font-medium' : 'text-slate-300'}>
                        {formatCurrency(budget.spent)}
                      </span>
                      <span className="text-slate-500"> / {formatCurrency(budget.limit)}</span>
                    </div>
                  </div>
                  <div className="progress-track bg-charcoal-700 h-2.5">
                    <div 
                      className={`progress-bar ${budget.percentage >= 100 ? 'bg-rose-500' : budget.percentage >= 80 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                      style={{ width: `${Math.min(budget.percentage, 100)}%` }}
                    ></div>
                  </div>
                  {budget.percentage >= 90 && (
                    <p className="text-xs text-amber-400 mt-1.5 flex items-center gap-1">
                      <span className="text-amber-400">⚑</span> Nearing limit ({budget.percentage}%)
                    </p>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-slate-500">
                <Target className="h-12 w-12 mx-auto text-charcoal-600 mb-3" />
                <p>No budgets set up yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Upcoming Bills */}
        <div className="card p-0 overflow-hidden col-span-1">
          <div className="p-6 border-b border-charcoal-700 flex justify-between items-center">
            <h2 className="section-title">Upcoming Bills</h2>
            <Link to="/bills" className="text-sm font-medium text-electric-400 hover:text-electric-300 flex items-center">
              Manage <ArrowRight size={16} className="ml-1" />
            </Link>
          </div>
          <div className="divide-y divide-charcoal-700">
            {(data.upcomingBills || []).length > 0 ? (
              (data.upcomingBills || []).map((bill) => {
                const daysUntil = Math.ceil((new Date(bill.nextDueDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
                return (
                  <div key={bill.id} className="p-4 sm:px-6 hover:bg-charcoal-700/30 transition-colors flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm" style={{ backgroundColor: `${bill.color}20`, color: bill.color }}>
                        {bill.name?.charAt(0) ?? 'B'}
                      </div>
                      <div>
                        <p className="font-medium text-slate-200">{bill.name}</p>
                        <p className={`text-xs ${daysUntil <= 3 ? 'text-rose-400 font-medium' : 'text-slate-500'}`}>
                          {daysUntil === 0 ? 'Due today' : daysUntil === 1 ? 'Due tomorrow' : `Due in ${daysUntil} days`}
                        </p>
                      </div>
                    </div>
                    <div className="font-semibold text-slate-200 num">
                      {formatCurrency(bill.amount)}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center text-slate-500">No upcoming bills in the next 7 days.</div>
            )}
          </div>
        </div>

        {/* Savings Progress */}
        <div className="card p-6 col-span-1">
          <div className="flex justify-between items-center mb-6">
            <h2 className="section-title">Savings Goals</h2>
            <Link to="/savings" className="text-sm font-medium text-electric-400 hover:text-electric-300 flex items-center">
              View All <ArrowRight size={16} className="ml-1" />
            </Link>
          </div>
          <div className="space-y-6">
            {(data.savingsProgress || []).length > 0 ? (
              (data.savingsProgress || []).slice(0, 3).map((pot) => {
                const percentage = pot.targetAmount > 0 ? Math.min(Math.round((pot.currentAmount / pot.targetAmount) * 100), 100) : 0;
                return (
                  <div key={pot.id}>
                    <div className="flex justify-between text-sm mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: pot.color }}>{pot.name?.charAt(0)}</div>
                        <span className="font-medium text-slate-200">{pot.name}</span>
                      </div>
                      <div className="num">
                        <span className="text-slate-300 font-medium">{formatCurrency(pot.currentAmount)}</span>
                        <span className="text-slate-500"> / {formatCurrency(pot.targetAmount)}</span>
                      </div>
                    </div>
                    <div className="progress-track bg-charcoal-700 h-2.5">
                      <div 
                        className="progress-bar transition-all duration-1000"
                        style={{ width: `${percentage}%`, backgroundColor: pot.color }}
                      ></div>
                    </div>
                    <div className="mt-1.5 flex justify-between items-center text-xs text-slate-500">
                      <span>{percentage}% completed</span>
                      {pot.targetDate && (
                        <span>Target: {formatDate(pot.targetDate)}</span>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-slate-500">
                <PiggyBank className="h-12 w-12 mx-auto text-charcoal-600 mb-3" />
                <p>No active savings goals.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
