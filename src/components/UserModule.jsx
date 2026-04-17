import React, { useState } from 'react';
import { Icon } from './Icon';
import { ROLES } from '../data/constants';

const FormInput = ({ label, type = "text", value, onChange, placeholder = "", required = false, className = "" }) => (
    <div className={`flex flex-col gap-1.5 ${className}`}>
        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</label>
        <input 
            type={type}
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium text-sm"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            required={required}
        />
    </div>
);

const UserForm = ({ user, onSave, onCancel }) => {
    const [formData, setFormData] = useState(user || {
        fullName: '', username: '', password: '', role: 'OPERATOR'
    });

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                    <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">{user ? 'Editar Usuário' : 'Novo Usuário'}</h2>
                    <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 transition"><Icon name="x" size={24} /></button>
                </div>
                <form onSubmit={(e) => { e.preventDefault(); onSave(formData); }} className="p-8 space-y-5">
                    <FormInput label="Nome Completo" value={formData.fullName} onChange={v => setFormData({...formData, fullName: v})} required />
                    <FormInput label="Nome de Usuário" value={formData.username} onChange={v => setFormData({...formData, username: v})} required />
                    <FormInput label="Senha" type="password" value={formData.password} onChange={v => setFormData({...formData, password: v})} required />
                    
                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Perfil de Acesso</label>
                        <select 
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium text-sm"
                            value={formData.role}
                            onChange={e => setFormData({...formData, role: e.target.value})}
                        >
                            <option value="ADMIN">Administrador (Acesso Total)</option>
                            <option value="MANAGER">Gerente (Gestão de Estoque/NF)</option>
                            <option value="OPERATOR">Operador (Consulta/Produtos)</option>
                        </select>
                    </div>

                    <div className="mt-8 flex gap-4 pt-4">
                        <button type="button" onClick={onCancel} className="flex-1 py-3.5 border border-slate-300 text-slate-600 rounded-xl font-black hover:bg-slate-50 transition uppercase tracking-widest text-[10px]">Cancelar</button>
                        <button type="submit" className="flex-1 py-3.5 bg-indigo-600 text-white rounded-xl font-black hover:bg-indigo-700 transition shadow-xl shadow-indigo-100 uppercase tracking-widest text-[10px]">Salvar Usuário</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const UserModule = ({ users, onSaveUser, onDeleteUser, currentUser }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);

    const handleSave = (userData) => {
        onSaveUser(userData);
        setIsModalOpen(false);
        setEditingUser(null);
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Controle de Acesso</h1>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.3em] mt-1">Gestão de usuários e permissões</p>
                </div>
                <button 
                    onClick={() => { setEditingUser(null); setIsModalOpen(true); }}
                    className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100 flex items-center gap-2"
                >
                    <Icon name="plus" size={16} /> Novo Operador
                </button>
            </div>

            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-100">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Identidade / Credencial</th>
                                <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Nível de Acesso</th>
                                <th className="px-8 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                <th className="px-8 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Comandos</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 bg-white">
                            {users.map((u, i) => (
                                <tr key={i} className="hover:bg-indigo-50/30 transition-colors group">
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-black text-sm shadow-sm group-hover:scale-110 transition-transform">
                                                {u.username.substring(0, 2).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-black text-slate-900 text-sm uppercase tracking-tight group-hover:text-indigo-600 transition-colors">{u.fullName}</p>
                                                <p className="text-[9px] text-slate-400 font-bold data-mono mt-1 uppercase">Login: @{u.username}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-tighter border ${
                                            u.role === 'ADMIN' ? 'bg-purple-50 text-purple-600 border-purple-100' : 
                                            u.role === 'MANAGER' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-slate-50 text-slate-500 border-slate-100'
                                        }`}>
                                            {ROLES[u.role].name}
                                        </span>
                                    </td>
                                    <td className="px-8 py-5 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]"></div>
                                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Ativo</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                                            <button 
                                                onClick={() => { setEditingUser(u); setIsModalOpen(true); }}
                                                className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                                            >
                                                <Icon name="edit-2" size={16} />
                                            </button>
                                            {u.id !== currentUser.id && (
                                                <button 
                                                    onClick={() => onDeleteUser(u.id)}
                                                    className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                                >
                                                    <Icon name="trash-2" size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen && (
                <UserForm 
                    user={editingUser} 
                    onSave={handleSave} 
                    onCancel={() => { setIsModalOpen(false); setEditingUser(null); }} 
                />
            )}
        </div>
    );
};

export default UserModule;
