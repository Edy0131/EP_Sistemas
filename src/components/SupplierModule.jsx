import React, { useState } from 'react';
import { Icon } from './Icon';

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

const SupplierForm = ({ supplier, onSave, onCancel }) => {
    const [formData, setFormData] = useState(supplier || {
        name: '', cnpj: '', ie: '', email: '', phone: '', address: '', number: '', city: '', uf: '', cep: '', category: 'Geral', observation: ''
    });
    const [loading, setLoading] = useState(false);

    const handleCnpjSearch = async () => {
        const cleanDoc = formData.cnpj.replace(/\D/g, '');
        if (cleanDoc.length !== 14) {
            alert("A busca automática está disponível apenas para CNPJ (14 dígitos).");
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanDoc}`);
            if (!response.ok) throw new Error('Não foi possível localizar este CNPJ');
            const data = await response.json();
            
            setFormData(prev => ({
                ...prev,
                name: data.razao_social || data.nome_fantasia || prev.name,
                address: data.logradouro || '',
                number: data.numero || '',
                city: data.municipio || '',
                uf: data.uf || '',
                cep: data.cep || '',
                email: data.email || prev.email,
                phone: data.ddd_telefone_1 || prev.phone,
                observation: `Busca automática realizada em ${new Date().toLocaleDateString('pt-BR')}. Situação: ${data.descricao_situacao_cadastral}`
            }));
        } catch (err) {
            alert("Erro: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                    <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">{supplier ? 'Editar Fornecedor' : 'Novo Cadastro de Fornecedor'}</h2>
                    <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 transition"><Icon name="x" size={24} /></button>
                </div>
                <form onSubmit={(e) => { e.preventDefault(); onSave(formData); }} className="p-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-2">
                            <FormInput label="Razão Social / Nome" value={formData.name} onChange={v => setFormData({...formData, name: v})} placeholder="Nome completo ou Razão Social" required />
                        </div>
                        <div className="relative">
                            <FormInput label="CNPJ / CPF" value={formData.cnpj} onChange={v => setFormData({...formData, cnpj: v})} placeholder="00.000.000/0000-00" required />
                            {formData.cnpj.replace(/\D/g, '').length === 14 && (
                                <button 
                                    type="button"
                                    onClick={handleCnpjSearch}
                                    disabled={loading}
                                    className="absolute right-2 top-[26px] bg-indigo-100 text-indigo-600 p-1.5 rounded-lg hover:bg-indigo-200 transition-colors"
                                    title="Buscar dados do CNPJ"
                                >
                                    {loading ? <Icon name="loader" size={16} className="animate-spin" /> : <Icon name="search" size={16} />}
                                </button>
                            )}
                        </div>
                        <FormInput label="Inscrição Estadual / RG" value={formData.ie} onChange={v => setFormData({...formData, ie: v})} />
                        <FormInput label="E-mail Comercial" value={formData.email} onChange={v => setFormData({...formData, email: v})} />
                        <FormInput label="Telefone / WhatsApp" value={formData.phone} onChange={v => setFormData({...formData, phone: v})} />
                        <div className="md:col-span-2"><FormInput label="Endereço" value={formData.address} onChange={v => setFormData({...formData, address: v})} /></div>
                        <FormInput label="Número" value={formData.number} onChange={v => setFormData({...formData, number: v})} />
                        <FormInput label="CEP" value={formData.cep} onChange={v => setFormData({...formData, cep: v})} />
                        <FormInput label="Cidade" value={formData.city} onChange={v => setFormData({...formData, city: v})} />
                        <FormInput label="Estado (UF)" value={formData.uf} onChange={v => setFormData({...formData, uf: v})} />
                        <FormInput label="Categoria de Fornecimento" value={formData.category} onChange={v => setFormData({...formData, category: v})} />
                        <div className="md:col-span-3"><FormInput label="Observações Técnicas" value={formData.observation} onChange={v => setFormData({...formData, observation: v})} /></div>
                    </div>
                    <div className="mt-10 flex gap-4">
                        <button type="button" onClick={onCancel} className="flex-1 py-3.5 border border-slate-300 text-slate-600 rounded-xl font-black hover:bg-slate-50 transition uppercase tracking-widest text-xs">Cancelar</button>
                        <button type="submit" className="flex-1 py-3.5 bg-blue-600 text-white rounded-xl font-black hover:bg-blue-700 transition shadow-xl shadow-blue-100 uppercase tracking-widest text-xs">Salvar Fornecedor</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const SupplierModule = ({ suppliers, onAddSupplier, onDeleteSupplier }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState(null);
    const [search, setSearch] = useState('');

    const filteredSuppliers = suppliers.filter(s => 
        s.name.toLowerCase().includes(search.toLowerCase()) || 
        s.cnpj.includes(search)
    );

    const handleSave = (supplierData) => {
        if (editingSupplier) {
            onAddSupplier({ ...supplierData, id: editingSupplier.id }, true);
        } else {
            onAddSupplier({ ...supplierData, id: Date.now() });
        }
        setIsModalOpen(false);
        setEditingSupplier(null);
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Fornecedores</h1>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.3em] mt-1">Gestão de parceiros comerciais</p>
                </div>
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-all shadow-md shadow-blue-100 flex items-center gap-2"
                >
                    <Icon name="plus" size={16} /> Novo Parceiro
                </button>
            </div>

            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-50 bg-slate-50/30">
                    <div className="relative max-w-md">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Icon name="search" size={16} className="text-slate-400" />
                        </div>
                        <input 
                            type="text" 
                            className="block w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all uppercase tracking-widest"
                            placeholder="Buscar por nome ou CNPJ..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-100">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Razão Social / Identificação</th>
                                <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Localização</th>
                                <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Comunicação</th>
                                <th className="px-8 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Categoria</th>
                                <th className="px-8 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Comandos</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 bg-white">
                            {filteredSuppliers.length === 0 ? (
                                <tr><td colSpan="5" className="px-8 py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-[10px]">Nenhum parceiro localizado no sistema.</td></tr>
                            ) : (
                                filteredSuppliers.map((s, i) => (
                                    <tr key={i} className="hover:bg-blue-50/30 transition-colors group">
                                        <td className="px-8 py-5">
                                            <p className="font-black text-slate-900 text-sm uppercase tracking-tight group-hover:text-blue-600 transition-colors">{s.name}</p>
                                            <p className="text-[9px] text-slate-400 font-bold data-mono mt-1 uppercase">Doc: {s.cnpj}</p>
                                        </td>
                                        <td className="px-8 py-5">
                                            <p className="text-xs font-black text-slate-700 uppercase tracking-tight">{s.city} - {s.uf}</p>
                                            <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">I.E.: {s.ie || 'Isento'}</p>
                                        </td>
                                        <td className="px-8 py-5">
                                            <p className="text-xs font-bold text-slate-600">{s.email || 'N/A'}</p>
                                            <p className="text-[10px] font-black text-blue-600 data-mono mt-1 uppercase">{s.phone || 'Sem contato'}</p>
                                        </td>
                                        <td className="px-8 py-5 text-center">
                                            <span className="px-3 py-1 bg-slate-100 text-slate-500 border border-slate-200 rounded-lg text-[9px] font-black uppercase tracking-tighter">
                                                {s.category}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                                                <button onClick={() => { setEditingSupplier(s); setIsModalOpen(true); }} className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"><Icon name="edit-2" size={16} /></button>
                                                <button onClick={() => onDeleteSupplier(s.id)} className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"><Icon name="trash-2" size={16} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen && (
                <SupplierForm 
                    supplier={editingSupplier} 
                    onSave={handleSave} 
                    onCancel={() => { setIsModalOpen(false); setEditingSupplier(null); }} 
                />
            )}
        </div>
    );
};

export default SupplierModule;
