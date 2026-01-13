
import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, 
  PieChart, Pie, Legend 
} from 'recharts';
import { Transaction, SummaryData, Category, TransactionType } from './types';
import { INITIAL_DATA, CATEGORIES, CATEGORY_COLORS } from './constants';
import StatsCard from './components/StatsCard';
import TransactionForm from './components/TransactionForm';
import ReportView from './components/ReportView';
import { getFinancialInsights } from './services/geminiService';

type TabType = 'dashboard' | 'transactions' | 'reports';

const App: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('transactions');
    return saved ? JSON.parse(saved) : INITIAL_DATA;
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterType, setFilterType] = useState<TransactionType | 'all'>('all');
  const [filterCategory, setFilterCategory] = useState<Category | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  
  const [insights, setInsights] = useState<string>('');
  const [loadingInsights, setLoadingInsights] = useState(false);

  useEffect(() => {
    localStorage.setItem('transactions', JSON.stringify(transactions));
  }, [transactions]);

  const summary: SummaryData = useMemo(() => {
    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    return {
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense
    };
  }, [transactions]);

  const chartData = useMemo(() => {
    const categories: Record<string, number> = {};
    transactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        categories[t.category] = (categories[t.category] || 0) + t.amount;
      });
    return Object.entries(categories).map(([name, value]) => ({ name, value }));
  }, [transactions]);

  const monthlyData = useMemo(() => {
    const months: Record<string, { income: number; expense: number }> = {};
    transactions.forEach(t => {
      const date = new Date(t.date);
      const monthYear = date.toLocaleString('pt-BR', { month: 'short' });
      if (!months[monthYear]) months[monthYear] = { income: 0, expense: 0 };
      if (t.type === 'income') months[monthYear].income += t.amount;
      else months[monthYear].expense += t.amount;
    });
    return Object.entries(months).map(([name, data]) => ({ name, ...data }));
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    return transactions
      .filter(t => {
        const matchesType = filterType === 'all' || t.type === filterType;
        const matchesCategory = filterCategory === 'all' || t.category === filterCategory;
        const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesType && matchesCategory && matchesSearch;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, filterType, filterCategory, searchTerm]);

  const handleAddTransaction = (newTx: Omit<Transaction, 'id'>) => {
    const transactionWithId: Transaction = {
      ...newTx,
      id: Math.random().toString(36).substr(2, 9),
    };
    setTransactions(prev => [transactionWithId, ...prev]);
  };

  const handleDeleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const generateAIInsights = async () => {
    setLoadingInsights(true);
    const result = await getFinancialInsights(transactions);
    setInsights(result);
    setLoadingInsights(false);
  };

  return (
    <div className="min-h-screen pb-24 lg:pb-8">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 px-4 py-4 md:px-8 flex justify-between items-center shadow-sm">
        <div className="flex items-center space-x-2">
          <div className="bg-blue-600 p-2 rounded-lg">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          </div>
          <h1 className="text-xl font-bold text-slate-800 hidden sm:block">Finanças Pro</h1>
        </div>
        
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-medium flex items-center space-x-2 transition-all shadow-md active:scale-95"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
            <span className="hidden sm:inline">Adicionar Registro</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6 md:px-8">
        
        {/* Navigation Tabs */}
        <div className="flex bg-slate-100 p-1 rounded-xl mb-6 lg:mb-8 max-w-2xl mx-auto">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`flex-1 flex items-center justify-center space-x-2 py-3 rounded-lg font-medium transition-all ${activeTab === 'dashboard' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:bg-slate-200'}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
            <span className="text-xs sm:text-base">Resumo</span>
          </button>
          <button 
            onClick={() => setActiveTab('transactions')}
            className={`flex-1 flex items-center justify-center space-x-2 py-3 rounded-lg font-medium transition-all ${activeTab === 'transactions' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:bg-slate-200'}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
            <span className="text-xs sm:text-base">Registros</span>
          </button>
          <button 
            onClick={() => setActiveTab('reports')}
            className={`flex-1 flex items-center justify-center space-x-2 py-3 rounded-lg font-medium transition-all ${activeTab === 'reports' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:bg-slate-200'}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"></path></svg>
            <span className="text-xs sm:text-base">Relatórios</span>
          </button>
        </div>

        {activeTab === 'dashboard' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatsCard 
                title="Saldo Atual" 
                amount={summary.balance} 
                icon={<svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg>}
              />
              <StatsCard 
                title="Total de Entradas" 
                amount={summary.totalIncome} 
                type="income"
                icon={<svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 11l5-5m0 0l5 5m-5-5v12"></path></svg>}
              />
              <StatsCard 
                title="Total de Saídas" 
                amount={summary.totalExpense} 
                type="expense"
                icon={<svg className="w-6 h-6 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 13l-5 5m0 0l-5-5m5 5V6"></path></svg>}
              />
            </div>

            {/* AI Insights Card */}
            <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L14.4 9.6H22L15.8 14.4L18.2 22L12 17.2L5.8 22L8.2 14.4L2 9.6H9.6L12 2Z"></path></svg>
              </div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                    <h3 className="text-lg font-bold">Assistente de IA</h3>
                  </div>
                  {!insights && (
                    <button 
                      onClick={generateAIInsights}
                      disabled={loadingInsights}
                      className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm font-medium backdrop-blur-md transition-all"
                    >
                      {loadingInsights ? 'Analisando...' : 'Gerar Insights'}
                    </button>
                  )}
                </div>
                {loadingInsights ? (
                  <div className="flex space-x-2 items-center py-4">
                    <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-white rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-2 h-2 bg-white rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <span className="text-white/80 text-sm italic ml-2">Analisando seus hábitos financeiros...</span>
                  </div>
                ) : insights ? (
                  <div className="prose prose-invert max-w-none text-blue-50 text-sm space-y-2 whitespace-pre-wrap">
                    {insights}
                    <button 
                       onClick={() => setInsights('')}
                       className="mt-4 text-xs bg-white/10 hover:bg-white/20 px-2 py-1 rounded"
                    >
                       Limpar Análise
                    </button>
                  </div>
                ) : (
                  <p className="text-blue-100 text-sm">Clique no botão para que nossa IA analise seu perfil de gastos e ofereça dicas personalizadas.</p>
                )}
              </div>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-[400px]">
                <h3 className="text-lg font-bold text-slate-800 mb-6">Gastos por Categoria</h3>
                <ResponsiveContainer width="100%" height="90%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.name as Category] || '#ccc'} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)}
                    />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-[400px]">
                <h3 className="text-lg font-bold text-slate-800 mb-6">Fluxo Mensal (Entradas vs Saídas)</h3>
                <ResponsiveContainer width="100%" height="90%">
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                    <Tooltip 
                      contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}}
                      cursor={{fill: '#f8fafc'}}
                    />
                    <Bar dataKey="income" name="Entradas" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expense" name="Saídas" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'transactions' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            {/* Filters and Search */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4 items-center">
              <div className="relative w-full md:w-64">
                <input 
                  type="text" 
                  placeholder="Pesquisar..." 
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <svg className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
              </div>
              
              <div className="flex flex-wrap gap-2 w-full md:w-auto">
                <select 
                  className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as any)}
                >
                  <option value="all">Todos Tipos</option>
                  <option value="income">Entradas</option>
                  <option value="expense">Saídas</option>
                </select>

                <select 
                  className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value as any)}
                >
                  <option value="all">Todas Categorias</option>
                  {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
            </div>

            {/* Transactions Table/Gallery */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map((tx) => (
                  <div key={tx.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow group">
                    <div className="flex justify-between items-start mb-4">
                      <div className="p-2 rounded-xl bg-slate-50">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{tx.category}</span>
                      </div>
                      <button 
                        onClick={() => handleDeleteTransaction(tx.id)}
                        className="text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                      </button>
                    </div>
                    
                    <h4 className="text-slate-800 font-semibold mb-1 truncate">{tx.description}</h4>
                    <p className="text-slate-400 text-xs mb-4">
                      {new Date(tx.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </p>
                    
                    <div className="flex justify-between items-center">
                      <span className={`text-lg font-bold ${tx.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {tx.type === 'income' ? '+' : '-'} {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(tx.amount)}
                      </span>
                      <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${tx.type === 'income' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                        {tx.type === 'income' ? 'Entrada' : 'Saída'}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full py-12 flex flex-col items-center justify-center bg-white rounded-2xl border-2 border-dashed border-slate-200">
                  <div className="bg-slate-50 p-4 rounded-full mb-4">
                    <svg className="w-12 h-12 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path></svg>
                  </div>
                  <p className="text-slate-500 font-medium">Nenhum registro encontrado</p>
                  <p className="text-slate-400 text-sm">Tente ajustar seus filtros ou adicione uma nova transação.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'reports' && (
          <ReportView transactions={transactions} />
        )}
      </main>

      {/* Floating Action Button (Mobile) */}
      <div className="lg:hidden fixed bottom-6 right-6 z-40">
        <button 
          onClick={() => setIsModalOpen(true)}
          className="w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-2xl hover:scale-105 active:scale-95 transition-all"
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
        </button>
      </div>

      {/* Modals */}
      {isModalOpen && (
        <TransactionForm 
          onAdd={handleAddTransaction} 
          onClose={() => setIsModalOpen(false)} 
        />
      )}
    </div>
  );
};

export default App;
