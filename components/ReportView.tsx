
import React, { useMemo, useState } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Cell, Legend, PieChart, Pie 
} from 'recharts';
import { Transaction, Category, CategoryReportData } from '../types';
import { CATEGORY_COLORS } from '../constants';

interface ReportViewProps {
  transactions: Transaction[];
}

const ReportView: React.FC<ReportViewProps> = ({ transactions }) => {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const availableYears = useMemo(() => {
    const years = new Set(transactions.map(t => new Date(t.date).getFullYear()));
    if (years.size === 0) years.add(new Date().getFullYear());
    return Array.from(years).sort((a, b) => b - a);
  }, [transactions]);

  const yearData = useMemo(() => {
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const data = months.map(m => ({ name: m, income: 0, expense: 0, savings: 0 }));

    transactions.forEach(t => {
      const d = new Date(t.date);
      if (d.getFullYear() === selectedYear) {
        const mIdx = d.getMonth();
        if (t.type === 'income') data[mIdx].income += t.amount;
        else data[mIdx].expense += t.amount;
      }
    });

    return data.map(d => ({ ...d, savings: d.income - d.expense }));
  }, [transactions, selectedYear]);

  const categoryData: CategoryReportData[] = useMemo(() => {
    const totals: Record<string, number> = {};
    let totalExp = 0;

    transactions
      .filter(t => t.type === 'expense' && new Date(t.date).getFullYear() === selectedYear)
      .forEach(t => {
        totals[t.category] = (totals[t.category] || 0) + t.amount;
        totalExp += t.amount;
      });

    return Object.entries(totals)
      .map(([name, value]) => ({
        name,
        value,
        percentage: totalExp > 0 ? (value / totalExp) * 100 : 0
      }))
      .sort((a, b) => b.value - a.value);
  }, [transactions, selectedYear]);

  const summary = useMemo(() => {
    const income = yearData.reduce((acc, d) => acc + d.income, 0);
    const expense = yearData.reduce((acc, d) => acc + d.expense, 0);
    const savings = income - expense;
    const savingsRate = income > 0 ? (savings / income) * 100 : 0;

    return { income, expense, savings, savingsRate };
  }, [yearData]);

  const exportCSV = () => {
    const headers = ['Data', 'Descricao', 'Categoria', 'Tipo', 'Valor'];
    const rows = transactions
      .filter(t => new Date(t.date).getFullYear() === selectedYear)
      .map(t => [
        t.date,
        t.description.replace(/,/g, ''),
        t.category,
        t.type === 'income' ? 'Entrada' : 'Saida',
        t.amount.toFixed(2)
      ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `relatorio_financeiro_${selectedYear}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100 gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Relatório Anual</h2>
          <p className="text-sm text-slate-500">Visão detalhada do seu desempenho em {selectedYear}</p>
        </div>
        <div className="flex items-center space-x-3 w-full md:w-auto">
          <select 
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-medium text-slate-700 outline-none ring-blue-500 focus:ring-2 flex-1 md:flex-none"
          >
            {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button 
            onClick={exportCSV}
            className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
            <span>Exportar CSV</span>
          </button>
        </div>
      </div>

      {/* Annual Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Entradas Totais</p>
          <p className="text-2xl font-bold text-emerald-600">{formatCurrency(summary.income)}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Saídas Totais</p>
          <p className="text-2xl font-bold text-rose-600">{formatCurrency(summary.expense)}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Economia Líquida</p>
          <p className={`text-2xl font-bold ${summary.savings >= 0 ? 'text-blue-600' : 'text-rose-600'}`}>
            {formatCurrency(summary.savings)}
          </p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Taxa de Poupança</p>
          <div className="flex items-baseline space-x-2">
            <p className="text-2xl font-bold text-slate-800">{summary.savingsRate.toFixed(1)}%</p>
            <div className={`w-2 h-2 rounded-full ${summary.savingsRate > 20 ? 'bg-emerald-500' : summary.savingsRate > 0 ? 'bg-amber-500' : 'bg-rose-500'}`}></div>
          </div>
        </div>
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Trend Chart */}
        <div className="xl:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm h-[450px]">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <div className="w-1 h-6 bg-blue-600 rounded-full"></div>
            Tendência Mensal
          </h3>
          <ResponsiveContainer width="100%" height="85%">
            <AreaChart data={yearData}>
              <defs>
                <linearGradient id="colorInc" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} tickFormatter={(val) => `R$ ${val}`} />
              <Tooltip 
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                formatter={(val: number) => formatCurrency(val)}
              />
              <Legend verticalAlign="top" height={36}/>
              <Area name="Entradas" type="monotone" dataKey="income" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorInc)" />
              <Area name="Saídas" type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorExp)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Category Share */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm h-[450px]">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <div className="w-1 h-6 bg-indigo-600 rounded-full"></div>
            Gastos por Categoria
          </h3>
          {categoryData.length > 0 ? (
             <div className="space-y-4 overflow-y-auto h-[350px] pr-2">
                {categoryData.map((item, idx) => (
                  <div key={item.name} className="group">
                    <div className="flex justify-between items-end mb-1">
                      <span className="text-sm font-semibold text-slate-700">{item.name}</span>
                      <span className="text-xs font-bold text-slate-400 group-hover:text-slate-600 transition-colors">{formatCurrency(item.value)}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div 
                        className="h-2 rounded-full transition-all duration-1000 ease-out"
                        style={{ 
                          width: `${item.percentage}%`, 
                          backgroundColor: CATEGORY_COLORS[item.name as Category] || '#ccc' 
                        }}
                      ></div>
                    </div>
                    <div className="text-[10px] text-right text-slate-400 mt-1">{item.percentage.toFixed(1)}% do total</div>
                  </div>
                ))}
             </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 italic text-sm">
              <svg className="w-12 h-12 mb-2 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
              Nenhum dado para este ano
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportView;
