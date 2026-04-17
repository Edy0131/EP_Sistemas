import React, { useState } from 'react';
import { Icon } from './Icon';
import { PRODUCT_DEFAULTS } from '../data/constants';
import * as XLSX from 'xlsx';

const COLUMN_MAP = {
    name: ['nome', 'produto', 'descrição', 'description', 'item', 'name'],
    category: ['categoria', 'grupo', 'seção', 'category', 'classificação'],
    price: ['preço', 'valor', 'venda', 'price', 'unitario', 'valor_venda'],
    stock: ['estoque', 'quantidade', 'saldo', 'stock', 'qtd', 'quantity'],
    minStock: ['mínimo', 'estoque_mínimo', 'min_stock', 'minimo'],
    unit: ['unidade', 'un', 'medida', 'unit'],
    ncm: ['ncm', 'classificação_fiscal'],
    codInterno: ['codigo', 'código', 'cod_interno', 'cod interno', 'codigo interno', 'código interno', 'cod. interno', 'cód interno', 'cód. interno', 'referencia', 'ref', 'id_externo']
};

const BulkProductImport = ({ onBulkImport }) => {
    const [importedData, setImportedData] = useState(null);
    const [loading, setLoading] = useState(false);

    const autoMapColumns = (rawHeaders) => {
        const mapping = {};
        rawHeaders.forEach(header => {
            const cleanHeader = header.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, " ").trim().replace(/\s+/g, " ");
            for (const [key, aliases] of Object.entries(COLUMN_MAP)) {
                if (aliases.some(alias => cleanHeader.includes(alias))) {
                    mapping[key] = header;
                    break;
                }
            }
        });
        return mapping;
    };

    const processData = (rawData) => {
        if (rawData.length === 0) return [];
        const headers = Object.keys(rawData[0]);
        const mapping = autoMapColumns(headers);
        
        return rawData.map(row => {
            const mappedRow = {};
            for (const [key, csvHeader] of Object.entries(mapping)) {
                mappedRow[key] = row[csvHeader];
            }
            return mappedRow;
        });
    };

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setLoading(true);
        const reader = new FileReader();
        
        reader.onload = (event) => {
            try {
                const data = new Uint8Array(event.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet);
                
                const processed = processData(jsonData);
                setImportedData(processed);
            } catch (err) {
                alert("Erro ao ler arquivo: " + err.message);
            } finally {
                setLoading(false);
            }
        };

        if (file.name.endsWith('.csv') || file.name.endsWith('.json')) {
            const textReader = new FileReader();
            textReader.onload = (event) => {
                try {
                    let data = [];
                    if (file.name.endsWith('.json')) {
                        data = JSON.parse(event.target.result);
                    } else {
                        const workbook = XLSX.read(event.target.result, { type: 'string' });
                        data = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
                    }
                    setImportedData(processData(data));
                } catch (err) { alert("Erro: " + err.message); }
                finally { setLoading(false); }
            };
            textReader.readAsText(file);
        } else {
            reader.readAsArrayBuffer(file);
        }
    };

    const confirmBulk = () => {
        if (!importedData) return;
        if (typeof onBulkImport === 'function') onBulkImport(importedData);
        setImportedData(null);
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Carga em Lote</h1>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.3em] mt-1">Importação massiva de inventário</p>
                </div>
            </div>

            <div className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm overflow-hidden relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[100px] rounded-full -mr-32 -mt-32 pointer-events-none"></div>
                
                <div className="relative z-10">
                    <div className="flex items-center gap-6 mb-10">
                        <div className="p-5 bg-emerald-600 rounded-3xl shadow-xl shadow-emerald-100">
                            <Icon name="upload" size={32} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">Processador de Planilhas</h2>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Suporte para Excel (.xlsx), CSV e JSON</p>
                        </div>
                    </div>

                    {!importedData ? (
                        <div className="space-y-8">
                            <div className="p-6 bg-blue-50/50 border border-blue-100 rounded-3xl flex gap-5 text-blue-800">
                                <div className="p-3 bg-white rounded-2xl shadow-sm self-start">
                                    <Icon name="info" size={24} className="text-blue-600" />
                                </div>
                                <div>
                                    <p className="font-black text-[10px] uppercase tracking-widest mb-2">Tecnologia de Mapeamento Inteligente</p>
                                    <p className="text-sm font-medium leading-relaxed opacity-80">
                                        Nosso sistema identifica automaticamente as colunas do seu arquivo. 
                                        Você não precisa seguir um modelo rígido; reconhecemos <b>Nome, Preço, Estoque e NCM</b> independente da nomenclatura.
                                    </p>
                                </div>
                            </div>

                            <div className={`border-2 border-dashed rounded-[32px] p-20 text-center transition-all cursor-pointer group relative ${loading ? 'bg-slate-50 border-blue-300' : 'border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/30'}`}>
                                <input type="file" accept=".csv,.json,.xlsx,.xls,.xlsm" onChange={handleFileSelect} className="absolute inset-0 opacity-0 cursor-pointer" disabled={loading} />
                                <div className="flex flex-col items-center gap-5">
                                    {loading ? (
                                        <div className="relative">
                                            <div className="w-16 h-16 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
                                            <Icon name="loader" size={24} className="absolute inset-0 m-auto text-blue-600" />
                                        </div>
                                    ) : (
                                        <div className="p-6 bg-slate-50 rounded-full group-hover:scale-110 group-hover:bg-white transition-all duration-500 shadow-sm group-hover:shadow-md">
                                            <Icon name="upload" size={48} className="text-slate-300 group-hover:text-emerald-500" />
                                        </div>
                                    )}
                                    <div>
                                        <p className="text-lg font-black text-slate-700 uppercase tracking-tight">{loading ? 'Analisando Estrutura...' : 'Solte seu arquivo aqui'}</p>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">Ou clique para navegar nas pastas</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-8 animate-in zoom-in-95 duration-500">
                            <div className="bg-emerald-50/50 p-8 rounded-[32px] border border-emerald-100 text-center relative overflow-hidden">
                                <div className="relative z-10">
                                    <div className="inline-flex p-4 bg-white rounded-2xl shadow-sm text-emerald-600 mb-4">
                                        <Icon name="check" size={32} />
                                    </div>
                                    <p className="text-2xl font-black text-emerald-900 tracking-tight uppercase">{importedData.length} Registros Identificados</p>
                                    <p className="text-[10px] text-emerald-600 font-black uppercase tracking-widest mt-2">Dados processados e prontos para integração</p>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <button 
                                    onClick={() => setImportedData(null)} 
                                    className="flex-1 py-5 border border-slate-200 rounded-2xl font-black text-[10px] text-slate-400 uppercase tracking-widest hover:bg-slate-50 hover:text-slate-600 transition-all"
                                >
                                    Descartar e Voltar
                                </button>
                                <button 
                                    onClick={confirmBulk} 
                                    className="flex-1 py-5 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 flex items-center justify-center gap-3"
                                >
                                    <Icon name="check" size={18} /> Confirmar Integração Massiva
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BulkProductImport;
