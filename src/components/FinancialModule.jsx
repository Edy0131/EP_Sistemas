import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { Icon } from './Icon';
import { ClassicInput, ClassicSelect, ClassicTh, ClassicTd } from './ClassicUI';
import PDFImportModule from './PDFImportModule';

const FinancialModule = ({ suppliers, records = [], setRecords }) => {
    const [activeTab, setActiveTab] = useState('payable');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isPDFModalOpen, setIsPDFModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    
    // Filtros
    const [filterDateStart, setFilterDateStart] = useState('');
    const [filterDateEnd, setFilterDateEnd] = useState('');
    const [filterEntity, setFilterEntity] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');


    const [formData, setFormData] = useState({
        type: 'payable',
        description: '',
        entity: '',
        value: '',
        dueDate: new Date().toISOString().split('T')[0],
        category: 'Geral',
        status: 'pending'
    });

    const handleSave = (e) => {
        e.preventDefault();
        let newRecords;
        if (editingId) {
            newRecords = records.map(r => r.id === editingId ? { ...formData, id: editingId, value: parseFloat(formData.value) || 0 } : r);
        } else {
            const newRecord = {
                ...formData,
                id: Date.now(),
                value: parseFloat(formData.value) || 0
            };
            newRecords = [...records, newRecord];
        }
        
        setRecords(newRecords);
        setIsModalOpen(false);
        setEditingId(null);
        resetForm();
    };

    const resetForm = () => {
        setFormData({
            type: activeTab,
            description: '',
            entity: '',
            value: '',
            dueDate: new Date().toISOString().split('T')[0],
            category: 'Geral',
            status: 'pending'
        });
    };

    const openEdit = (record) => {
        setFormData(record);
        setEditingId(record.id);
        setIsModalOpen(true);
    };

    const handleImportExcel = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            const bstr = evt.target.result;
            const wb = XLSX.read(bstr, { type: 'binary' });
            const wsname = wb.SheetNames[0];
            const ws = wb.Sheets[wsname];
            const data = XLSX.utils.sheet_to_json(ws);

            const importedRecords = data.map(row => ({
                id: Date.now() + Math.random(),
                type: activeTab,
                description: row.Descricao || row.Descrição || 'Importado via Excel',
                entity: row.Entidade || row.Fornecedor || row.Cliente || 'Desconhecido',
                value: parseFloat(row.Valor) || 0,
                dueDate: row.Vencimento || new Date().toISOString().split('T')[0],
                category: row.Categoria || 'Geral',
                status: 'pending'
            }));

            const newRecords = [...records, ...importedRecords];
            setRecords(newRecords);
            alert(`${importedRecords.length} lançamentos importados com sucesso!`);
        };
        reader.readAsBinaryString(file);
    };

    const handleImportPDFData = (data) => {
        setFormData({
            ...data,
            type: activeTab
        });
        setIsPDFModalOpen(false);
        setIsModalOpen(true);
    };

    const toggleStatus = (id) => {
        const newRecords = records.map(r => 
            r.id === id ? { ...r, status: r.status === 'paid' ? 'pending' : 'paid' } : r
        );
        setRecords(newRecords);
    };

    const deleteRecord = (id) => {
        if (confirm('Deseja excluir este lançamento?')) {
            const newRecords = records.filter(r => r.id !== id);
            setRecords(newRecords);
        }
    };

    const exportReport = () => {
        const dataToExport = filteredRecords.map(r => ({
            Vencimento: new Date(r.dueDate).toLocaleDateString('pt-BR'),
            Descrição: r.description,
            Entidade: r.entity,
            Categoria: r.category,
            Valor: r.value,
            Status: r.status === 'paid' ? 'Liquidado' : 'Pendente'
        }));

        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Relatorio_Financeiro");
        XLSX.writeFile(wb, `Relatorio_Financeiro_${activeTab}_${new Date().toLocaleDateString()}.xlsx`);
    };

    const filteredRecords = useMemo(() => {
        return records.filter(r => {
            if (r.type !== activeTab) return false;
            
            if (filterStatus !== 'all' && r.status !== filterStatus) return false;
            
            if (filterEntity && !r.entity.toLowerCase().includes(filterEntity.toLowerCase())) return false;
            
            if (filterDateStart && r.dueDate < filterDateStart) return false;
            if (filterDateEnd && r.dueDate > filterDateEnd) return false;
            
            return true;
        }).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    }, [records, activeTab, filterStatus, filterEntity, filterDateStart, filterDateEnd]);

    const totalValue = filteredRecords.reduce((acc, r) => acc + r.value, 0);
    const totalPaid = filteredRecords.filter(r => r.status === 'paid').reduce((acc, r) => acc + r.value, 0);
    const totalPending = totalValue - totalPaid;

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Gestão Financeira</h1>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.3em] mt-1">Controle de fluxo de caixa e obrigações</p>
                </div>
                <div className="flex gap-3">
                    <button 
                        onClick={() => setIsPDFModalOpen(true)}
                        className="px-6 py-2.5 bg-red-50 text-red-600 border border-red-100 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-red-100 transition-all flex items-center gap-2 shadow-sm"
                    >
                        <Icon name="file-text" size={16} /> Importar PDF
                    </button>
                    <label className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2 cursor-pointer shadow-sm">
                        <Icon name="upload" size={16} /> Importar Excel
                        <input type="file" accept=".xlsx,.xls" className="hidden" onChange={handleImportExcel} />
                    </label>
                    <button 
                        onClick={() => {
                            setEditingId(null);
                            resetForm();
                            setIsModalOpen(true);
                        }}
                        className="px-6 py-2.5 bg-slate-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-700 transition-all shadow-md shadow-slate-100 flex items-center gap-2"
                    >
                        <Icon name="plus" size={16} /> Novo Lançamento
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="p-4 bg-slate-50 text-slate-600 rounded-2xl">
                        <Icon name="dollar-sign" size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total {activeTab === 'payable' ? 'a Pagar' : 'a Receber'}</p>
                        <p className="text-xl font-black text-slate-900 data-mono">R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl">
                        <Icon name="check" size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{activeTab === 'payable' ? 'Total Pago' : 'Total Recebido'}</p>
                        <p className="text-xl font-black text-emerald-600 data-mono">R$ {totalPaid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="p-4 bg-amber-50 text-amber-600 rounded-2xl">
                        <Icon name="alert-triangle" size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pendente</p>
                        <p className="text-xl font-black text-amber-600 data-mono">R$ {totalPending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                </div>
            </div>

            {/* Filters Section */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Icon name="search" size={14} /> Filtros de Relatório
                    </h3>
                    <button onClick={exportReport} className="text-[9px] font-black text-blue-600 uppercase tracking-widest hover:underline flex items-center gap-1">
                        <Icon name="upload" size={12} /> Gerar Relatório Excel
                    </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <ClassicInput label="De Vencimento" type="date" value={filterDateStart} onChange={setFilterDateStart} />
                    <ClassicInput label="Até Vencimento" type="date" value={filterDateEnd} onChange={setFilterDateEnd} />
                    <ClassicInput label={activeTab === 'payable' ? 'Fornecedor' : 'Cliente'} value={filterEntity} onChange={setFilterEntity} />
                    <ClassicSelect
                        label="Situação"
                        value={filterStatus}
                        options={[
                            { value: 'all', label: 'Todos' },
                            { value: 'pending', label: 'Pendente' },
                            { value: 'paid', label: 'Pago' }
                        ]}
                        onChange={setFilterStatus}
                    />
                    <div className="flex items-end pb-1">
                        <button 
                            onClick={() => {
                                setFilterDateStart('');
                                setFilterDateEnd('');
                                setFilterEntity('');
                                setFilterStatus('all');
                            }}
                            className="w-full py-2 bg-slate-50 text-slate-400 rounded-xl text-[9px] font-black uppercase hover:bg-slate-100 transition-all border border-slate-100"
                        >
                            Limpar Filtros
                        </button>
                    </div>
                </div>
            </div>

            {/* Tabs & Table */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="flex border-b border-slate-100 px-6 bg-slate-50/30">
                    <button 
                        onClick={() => setActiveTab('payable')}
                        className={`px-6 py-4 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'payable' ? 'text-slate-600 border-b-2 border-slate-600 bg-white' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        Contas a Pagar
                    </button>
                    <button 
                        onClick={() => setActiveTab('receivable')}
                        className={`px-6 py-4 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'receivable' ? 'text-slate-600 border-b-2 border-slate-600 bg-white' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        Contas a Receber
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <ClassicTh>Vencimento</ClassicTh>
                               
                                <ClassicTh>Descrição / Lançamento</ClassicTh>
                                <ClassicTh>{activeTab === 'payable' ? 'Fornecedor' : 'Cliente'}</ClassicTh>
                                <ClassicTh>Categoria</ClassicTh>
                                <ClassicTh>Valor</ClassicTh>
                                <ClassicTh className="text-center">Status</ClassicTh>
                                <ClassicTh className="text-right">Comandos</ClassicTh>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 bg-white">
                            {filteredRecords.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-8 py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-[10px]">
                                        Nenhum lançamento encontrado para os filtros aplicados.
                                    </td>
                                </tr>
                            ) : (
                                filteredRecords.map((r) => (
                                    <tr key={r.id} className="hover:bg-blue-50/30 transition-colors group">
                                        <ClassicTd className="data-mono font-bold text-slate-500">
                                            {new Date(r.dueDate).toLocaleDateString('pt-BR')}
                                        </ClassicTd>
                                        <ClassicTd className="font-black text-slate-900 uppercase tracking-tight group-hover:text-blue-600 transition-colors">
                                            {r.description}
                                        </ClassicTd>
                                        <ClassicTd className="font-bold text-slate-600 uppercase text-[11px]">
                                            {r.entity}
                                        </ClassicTd>
                                        <ClassicTd>
                                            <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[9px] font-black uppercase">
                                                {r.category}
                                            </span>
                                        </ClassicTd>
                                        <ClassicTd className="font-black text-slate-900 data-mono">
                                            R$ {r.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </ClassicTd>
                                        <ClassicTd className="text-center">
                                            <button 
                                                onClick={() => toggleStatus(r.id)}
                                                className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-tighter border transition-all ${
                                                    r.status === 'paid' 
                                                    ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                                                    : 'bg-amber-50 text-amber-600 border-amber-100 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-100'
                                                }`}
                                            >
                                                {r.status === 'paid' ? 'Liquidado' : 'Pendente'}
                                            </button>
                                        </ClassicTd>
                                        <ClassicTd className="text-right">
                                            <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                                                <button onClick={() => openEdit(r)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                                                    <Icon name="edit-2" size={14} />
                                                </button>
                                                <button onClick={() => deleteRecord(r.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                                                    <Icon name="trash-2" size={14} />
                                                </button>
                                            </div>
                                        </ClassicTd>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal for New/Edit Entry */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-[300] animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-[500px] shadow-2xl rounded-3xl overflow-hidden flex flex-col border border-slate-200">
                        <div className="bg-white px-8 py-5 flex justify-between items-center border-b border-slate-100">
                            <div>
                                <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">{editingId ? 'Editar Lançamento' : 'Novo Lançamento'}</h2>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Entrada manual de movimentação</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="hover:bg-slate-100 p-2 rounded-xl transition-all text-slate-400 hover:text-slate-900">
                                <Icon name="x" size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="p-8 space-y-6">
                            <ClassicSelect 
                                label="Tipo de Lançamento" 
                                value={formData.type} 
                                options={[
                                    { value: 'payable', label: 'Contas a Pagar' },
                                    { value: 'receivable', label: 'Contas a Receber' }
                                ]} 
                                onChange={v => setFormData({...formData, type: v})} 
                            />
                            <ClassicInput 
                                label="Descrição" 
                                value={formData.description} 
                                onChange={v => setFormData({...formData, description: v})} 
                            />
                            <ClassicInput 
                                label={formData.type === 'payable' ? 'Fornecedor' : 'Cliente'} 
                                value={formData.entity} 
                                onChange={v => setFormData({...formData, entity: v})} 
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <ClassicInput 
                                    label="Valor (R$)" 
                                    type="number" 
                                    value={formData.value} 
                                    onChange={v => setFormData({...formData, value: v})} 
                                />
                                <ClassicInput 
                                    label="Vencimento" 
                                    type="date" 
                                    value={formData.dueDate} 
                                    onChange={v => setFormData({...formData, dueDate: v})} 
                                />
                            </div>
                            <ClassicSelect 
                                label="Categoria" 
                                value={formData.category} 
                                options={['Fob', 'Tecon','Mariha mercante', 'Intermodal', 'Frete Internacional', 'Impostos', 'Armazem','Bilenio','Nacionalização']} 
                                onChange={v => setFormData({...formData, category: v})} 
                            />

                            <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-slate-100">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-8 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all">
                                    Descartar
                                </button>
                                <button type="submit" className="px-10 py-3 bg-blue-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-100">
                                    {editingId ? 'Salvar Alterações' : 'Confirmar Lançamento'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isPDFModalOpen && (
                <PDFImportModule 
                    onImport={handleImportPDFData}
                    onCancel={() => setIsPDFModalOpen(false)}
                />
            )}
        </div>
    );
};

export default FinancialModule;
