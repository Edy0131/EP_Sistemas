import React, { useState } from 'react';
import { Icon } from './Icon';

const Login = ({ onLogin, INITIAL_USERS, ROLES }) => {
    const [user, setUser] = useState('');
    const [pass, setPass] = useState('');
    const [error, setError] = useState('');

    const handleLogin = (e) => {
        e.preventDefault();
        const found = INITIAL_USERS.find(u => u.username === user && u.password === pass);
        if (found) {
            onLogin(found);
        } else {
            setError('ACESSO NEGADO: CREDENCIAIS INVÁLIDAS');
        }
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4 relative overflow-hidden font-sans">
            {/* Soft Background Elements */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-500/5 blur-[120px] rounded-full"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/5 blur-[120px] rounded-full"></div>
            </div>

            <div className="w-full max-w-[420px] relative z-10 animate-in fade-in zoom-in-95 duration-1000">
                <div className="bg-white rounded-[40px] border border-slate-100 overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.05)]">
                    <div className="p-12 text-center bg-slate-50/50 border-b border-slate-50">
                        <div className="inline-flex p-5 bg-blue-600 rounded-3xl shadow-xl shadow-blue-100 mb-8 transform -rotate-3 hover:rotate-0 transition-transform duration-500">
                            <Icon name="products" size={40} className="text-white" />
                        </div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none">EP Sistemas</h1>
                        <p className="text-blue-600 text-[10px] font-bold uppercase tracking-[0.3em] mt-3">Sistema de Gestão Empresarial</p>
                    </div>

                    <form onSubmit={handleLogin} className="p-12 space-y-6">
                        {error && (
                            <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-center animate-in shake duration-500">
                                {error}
                            </div>
                        )}
                        
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Identificação</label>
                            <div className="relative group">
                                <Icon name="users" size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors" />
                                <input 
                                    type="text" 
                                    className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/5 transition-all font-bold text-slate-700 text-sm"
                                    placeholder="Nome de usuário"
                                    value={user}
                                    onChange={e => setUser(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Senha de Acesso</label>
                            <div className="relative group">
                                <Icon name="logout" size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors" />
                                <input 
                                    type="password" 
                                    className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/5 transition-all font-bold text-slate-700 text-sm tracking-widest"
                                    placeholder="••••••••"
                                    value={pass}
                                    onChange={e => setPass(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <button 
                            type="submit"
                            className="w-full bg-blue-600 text-white font-black py-5 rounded-2xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 uppercase tracking-widest text-xs mt-4 active:scale-[0.98]"
                        >
                            Entrar no Sistema
                        </button>
                    </form>

                    <div className="px-12 pb-10 text-center">
                        <div className="flex items-center justify-center gap-2 text-slate-400">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]"></div>
                            <span className="text-[9px] font-bold uppercase tracking-widest">Conexão Segura Ativa</span>
                        </div>
                    </div>
                </div>
                
                <p className="text-center mt-10 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                    Edson Prestes Sistemas <span className="mx-2 opacity-30">|</span> v2.0.0 Leve
                </p>
            </div>
        </div>
    );
};

export default Login;
