import React, { useState } from 'react';
import { Building2, Lock, User } from 'lucide-react';
import { Button } from './ui';

interface LoginProps {
  onLogin: (username: string) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim().length < 3) {
      setError('아이디는 3자 이상 입력해주세요.');
      return;
    }
    if (password.trim().length < 4) {
      setError('비밀번호는 4자 이상 입력해주세요.');
      return;
    }
    // 가상 로그인 처리 (실제 백엔드 검증 없음)
    onLogin(username.trim());
  };

  return (
    <div className="min-h-screen bg-chaebol-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1538481199705-c710c4e965fc?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center mix-blend-luminosity"></div>
      <div className="absolute inset-0 bg-gradient-to-t from-chaebol-900 via-chaebol-900/80 to-transparent"></div>

      <div className="relative z-10 w-full max-w-md bg-slate-800/90 backdrop-blur-md p-8 rounded-2xl border border-slate-700 shadow-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-900/50 text-blue-400 mb-4 border border-blue-500/30">
            <Building2 size={32} />
          </div>
          <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-chaebol-gold tracking-tighter">
            서울 코포레이션
          </h1>
          <p className="text-slate-400 mt-2 text-sm">최고의 재벌이 되기 위한 첫 걸음</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="p-3 bg-red-900/50 border border-red-500/50 rounded-lg text-red-200 text-sm text-center">
              {error}
            </div>
          )}
          
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-300 ml-1">아이디</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <User size={18} />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                placeholder="아이디를 입력하세요 (3자 이상)"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-300 ml-1">비밀번호</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <Lock size={18} />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                placeholder="비밀번호를 입력하세요 (4자 이상)"
              />
            </div>
          </div>

          <Button variant="primary" className="w-full py-3 text-lg mt-4 shadow-lg shadow-blue-900/20">
            게임 접속하기
          </Button>
        </form>
      </div>
    </div>
  );
};
