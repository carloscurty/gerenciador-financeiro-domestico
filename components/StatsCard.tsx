
import React from 'react';

interface StatsCardProps {
  title: string;
  amount: number;
  type?: 'income' | 'expense' | 'neutral';
  icon: React.ReactNode;
}

const StatsCard: React.FC<StatsCardProps> = ({ title, amount, type = 'neutral', icon }) => {
  const textColor = 
    type === 'income' ? 'text-emerald-600' : 
    type === 'expense' ? 'text-rose-600' : 
    'text-blue-600';

  const bgColor = 
    type === 'income' ? 'bg-emerald-50' : 
    type === 'expense' ? 'bg-rose-50' : 
    'bg-blue-50';

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center space-x-4">
      <div className={`p-3 rounded-xl ${bgColor}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <p className={`text-2xl font-bold ${textColor}`}>
          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount)}
        </p>
      </div>
    </div>
  );
};

export default StatsCard;
