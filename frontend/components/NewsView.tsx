import React from 'react';
import { NewsItem } from '../types';
import { getGameTimeInfo } from '../constants';
import { Card, Badge } from './ui';
import { Newspaper, TrendingUp, TrendingDown, Info, AlertTriangle } from 'lucide-react';

interface NewsViewProps {
  news: NewsItem[];
}

export const NewsView: React.FC<NewsViewProps> = ({ news }) => {
  return (
    <div className="space-y-6 h-full overflow-y-auto pr-2 custom-scrollbar">
      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2"><Newspaper className="text-blue-400"/> 오늘의 뉴스</h2>
      <div className="space-y-3">
        {news.slice().reverse().map(n => (
          <Card key={n.id} className="flex items-center gap-4">
            <div className="shrink-0 p-3 bg-slate-900 rounded-full">
              {n.type === 'good' && <TrendingUp className="text-red-400" size={24} />}
              {n.type === 'bad' && <TrendingDown className="text-blue-400" size={24} />}
              {n.type === 'info' && <Info className="text-slate-400" size={24} />}
              {n.type === 'urgent' && <AlertTriangle className="text-yellow-400" size={24} />}
            </div>
            <div className="flex-1">
              <p className="text-sm text-slate-400 mb-1">{getGameTimeInfo(n.tick).fullStr}</p>
              <p className="font-medium text-lg">{n.message}</p>
            </div>
            <Badge variant={n.type === 'good' ? 'success' : n.type === 'bad' ? 'warning' : 'info'}>
              {n.type === 'good' ? '호재' : n.type === 'bad' ? '악재' : n.type === 'urgent' ? '긴급' : '시황'}
            </Badge>
          </Card>
        ))}
      </div>
    </div>
  );
};
