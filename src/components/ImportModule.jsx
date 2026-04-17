import React, { useState } from 'react';
import { Icon } from './Icon';
import { PRODUCT_DEFAULTS } from '../data/constants';
import * as XLSX from 'xlsx';

const InputField = ({ label, value, onChange, span = 1, labelSize = "10px", className = "" }) => (
    <div className={`flex flex-col gap-0.5 col-span-${span} ${className}`}>
        <label className={`text-slate-600 font-bold uppercase`} style={{ fontSize: labelSize }}>{label}</label>
        <input 
            type="text" 
            className="w-full border border-slate-300 rounded px-1.5 py-0.5 text-xs focus:ring-1 focus:ring-blue-400 outline-none"
            value={value}
            onChange={(e) => onChange && onChange(e.target.value)}
        />
    </div>
);

const ImportModule = ({ products, onSave, onBulkImport }) => {
    const [activeSubTab, setActiveSubTab] = useState('invoice');
    const [selectedId, setSelectedId] = useState(null);
    const [formData, setFormData] = useState({ ...PRODUCT_DEFAULTS });
    const [importSummary, setImportSummary] = useState('');
    const [invoicePreviewRows, setInvoicePreviewRows] = useState([]);

    const parseNumber = (value) => {
        if (value === null || value === undefined || value === '') return undefined;
        if (typeof value === 'number') return Number.isFinite(value) ? value : undefined;
        const raw = String(value).trim();
        if (!raw) return undefined;
        const cleaned = raw.replace(/[^\d,.-]/g, '');
        const normalized = cleaned.includes(',')
            ? cleaned.replace(/\./g, '').replace(',', '.')
            : cleaned.replace(/,/g, '');
        const parsed = Number.parseFloat(normalized);
        return Number.isFinite(parsed) ? parsed : undefined;
    };

    const pickField = (row, keys) => {
        for (const key of keys) {
            if (row[key] !== undefined && row[key] !== null && String(row[key]).trim() !== '') {
                return row[key];
            }
        }
        return '';
    };

    const handleSearch = (v, field) => {
        const updated = { ...formData, [field]: v };
        setFormData(updated);

        const found = products.find(p => p[field] === v && v !== '');
        if (found) {
            setSelectedId(found.id);
            setFormData(found);
        } else {
            setSelectedId(null);
        }
    };

    const handleUpdate = () => {
        if (!selectedId) {
            alert("Selecione um produto existente (COD INT ou Referência) para atualizar.");
            return;
        }
        onSave(formData);
        alert("Produto atualizado com sucesso no painel de importação!");
    };

    const handleClear = () => {
        setFormData({ ...PRODUCT_DEFAULTS });
        setSelectedId(null);
    };

    const handleSelectFromTable = (p) => {
        setSelectedId(p.id);
        setFormData(p);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleImportInvoiceFile = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!onBulkImport) {
            alert('Importação em lote indisponível.');
            return;
        }

        try {
            const buffer = await file.arrayBuffer();
            const workbook = XLSX.read(buffer, { type: 'array' });
            const firstSheet = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheet];
            const rows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

            if (!rows.length) {
                alert('Planilha vazia.');
                return;
            }

            const mapped = rows.map((row) => {
                const referencia = String(pickField(row, ['Referência', 'Referencia', 'reference', 'ref'])).trim();
                const barras = String(pickField(row, ['Codigo de barras', 'Código de barras', 'CODIGO_BARRAS', 'BARRAS', 'EAN', 'barcode', 'Código Barras'])).trim();
                const descricao = String(pickField(row, ['Description', 'Descrição', 'Nome', 'Produto', 'name', 'Descricao'])).trim();
                const tCtn = parseNumber(pickField(row, ['T.CTN', 'T CTN', 'CTN', 'cartons']));
                const pcsCtn = parseNumber(pickField(row, ['PCS/CTN', 'PCS CTN', 'Caixa Com', 'CX.C.', 'caixaCom']));
                const tPcs = parseNumber(pickField(row, ['T.PCS', 'T PCS', 'Quantidade', 'QTD', 'qty']));
                const unit = String(pickField(row, ['UNIT', 'UN', 'Unidade', 'unit'])).trim();
                const vUni = parseNumber(pickField(row, ['V.uni', 'V. Custo Fob', 'Custo', 'PRECO_CUSTO', 'compra', 'custo', 'cost']));
                const total = parseNumber(pickField(row, ['Total', 'TOTAL', 'valor total']));
                const cbmTotal = parseNumber(pickField(row, ['T.CBM', 'CBM/CTN', 'CBM', 'cbm']));
                const tGw = parseNumber(pickField(row, ['T.GW', 'GW', 'G.W.', 'Peso Bruto', 'pesoBruto']));
                const tNw = parseNumber(pickField(row, ['T.NW', 'NW', 'N.W.', 'Peso Líquido', 'pesoLiquido']));
                const pedido = String(pickField(row, ['Pedido', 'pedido', 'Order', 'PO'])).trim();
                const venda = parseNumber(pickField(row, ['Venda', 'PRECO_VENDA', 'Preço Venda', 'price', 'venda']));
                const fornecedor = String(pickField(row, ['Fornecedor', 'Supplier', 'entity'])).trim();
                const ncm = String(pickField(row, ['NCM', 'ncm'])).trim();

                return {
                    barras,
                    codInterno: String(pickField(row, ['COD INT', 'codInterno', 'Código Interno', 'COD_INTERNO'])).trim(),
                    referencia,
                    name: descricao,
                    description: descricao,
                    fornecedor,
                    ncm,
                    unit: unit || 'UN',
                    caixaCom: pcsCtn ? String(pcsCtn) : '',
                    stock: tPcs || 0,
                    moq: tPcs || 0,
                    compra: vUni || 0,
                    custo: vUni || 0,
                    venda: venda || (vUni ? vUni * 1.7 : 0),
                    price: venda || (vUni ? vUni * 1.7 : 0),
                    cbm: cbmTotal ? String(cbmTotal) : '',
                    pesoBruto: tGw || 0,
                    pesoLiquido: tNw || 0,
                    peso: tNw ? String(tNw) : '',
                    ultimaEntrada: new Date().toISOString().split('T')[0],
                    ultimoPedido: pedido,
                    observacao: pedido ? `Pedido: ${pedido}` : '',
                    tCtn: tCtn || 0,
                    totalInvoice: total || 0,
                };
            });

            setInvoicePreviewRows(mapped);
            const result = onBulkImport(mapped);
            setImportSummary(result?.mensagem || `Arquivo processado com ${mapped.length} linhas.`);
        } catch (error) {
            console.error('Erro ao importar invoice:', error);
            alert('Não foi possível importar o arquivo da invoice. Verifique o formato.');
        } finally {
            e.target.value = '';
        }
    };

    const handleDownloadInvoiceTemplate = () => {
        const headers = [
            'Referência',
            'Código Barras',
            'Descrição',
            'T.CTN',
            'PCS/CTN',
            'T.PCS',
            'UNIT',
            'V.uni',
            'Total',
            'T.CBM',
            'T.GW',
            'T.NW',
            'Pedido'
        ];

        const sampleRow = [
            'WB-1308',
            '7908314212436',
            'TACA DE VIDRO 300ML DIAMOND AMBAR',
            '462',
            '48',
            '22176',
            'PC',
            '0,24',
            '5322,24',
            '34,1837',
            '7761,6',
            '8223,6',
            'WG091-25'
        ];

        const ws = XLSX.utils.aoa_to_sheet([headers, sampleRow]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Invoice_Modelo');
        XLSX.writeFile(wb, 'modelo_importacao_invoice.xlsx');
    };

    const tabs = [
        { id: 'pedido', label: 'Pedido' },
        { id: 'invoice', label: 'Invoice' },
        { id: 'giro', label: 'Giro' },
        { id: 'entrada', label: 'Entrada' },
        { id: 'transito', label: 'Em Transito' },
        { id: 'detalhes', label: 'Detalhes' },
        { id: 'di', label: 'DI - Declaração de importação' },
        { id: 'dwa', label: 'DWA' },
    ];

    return (
        <div className="space-y-4 bg-[#f0f0f0] p-4 rounded-lg border border-slate-300 shadow-inner">
            {selectedId && (
                <div className="bg-blue-600 text-white px-4 py-1.5 rounded-t-lg text-[10px] font-black uppercase tracking-widest animate-pulse">
                    Editando: {formData.name} (ID: #{selectedId})
                </div>
            )}
            <div className="flex justify-between items-start gap-4">
                <div className="flex-1 bg-white p-4 rounded border border-slate-300 shadow-sm relative">
                    <span className="absolute -top-2.5 left-4 bg-[#f0f0f0] px-2 text-[10px] font-bold text-slate-600 uppercase">Cadastro Descrição</span>
                    <div className="grid grid-cols-7 gap-2 mb-4">
                        <InputField label="COD INT" value={formData.codInterno} onChange={v => handleSearch(v, 'codInterno')} />
                        <InputField label="Referência" value={formData.referencia} onChange={v => handleSearch(v, 'referencia')} />
                        <InputField label="Codigo de barras" value={formData.barras} onChange={v => setFormData({...formData, barras: v})} span={2} />
                        <InputField label="C.Fob" value={formData.compra} onChange={v => setFormData({...formData, compra: parseFloat(v) || 0})} />
                        <InputField label="Custo" value={formData.custo} onChange={v => setFormData({...formData, custo: parseFloat(v) || 0})} />
                        <InputField label="Venda" value={formData.venda} onChange={v => setFormData({...formData, venda: parseFloat(v) || 0})} />
                    </div>
                    <div className="grid grid-cols-7 gap-2 items-end">
                        <div className="col-span-1 flex flex-col gap-1">
                            <button onClick={handleUpdate} className="bg-red-600 text-white text-[10px] font-bold py-2 rounded hover:bg-red-700 uppercase shadow-sm">Atualizar</button>
                        </div>
                        <div className="col-span-1 flex flex-col gap-1">
                            <button onClick={handleClear} className="bg-[#ff00ff] text-white text-[10px] font-bold py-2 rounded hover:opacity-80 uppercase shadow-sm">Limpar</button>
                        </div>
                        <div className="col-span-1 flex flex-col gap-1">
                            <button onClick={() => onSave(formData)} className="bg-blue-700 text-white text-[10px] font-bold py-2 rounded hover:bg-blue-800 uppercase shadow-sm">Cadastro</button>
                        </div>
                        <InputField label="Margem" value={formData.margem} onChange={v => setFormData({...formData, margem: parseFloat(v) || 0})} />
                        <InputField label="NCM" value={formData.ncm} onChange={v => setFormData({...formData, ncm: v})} />
                        <InputField label="Deposito" value={formData.deposito} onChange={v => setFormData({...formData, deposito: v})} span={2} />
                    </div>
                </div>

                <div className="w-1/3 space-y-2">
                    <div className="bg-white p-3 rounded border border-slate-300 shadow-sm relative h-full">
                        <span className="absolute -top-2.5 left-4 bg-[#f0f0f0] px-2 text-[10px] font-bold text-slate-600 uppercase">Informações:</span>
                        <input className="w-full border border-slate-300 rounded px-2 py-1 text-xs mb-2" type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Nome do Produto" />
                        <div className="mt-1 relative border border-slate-300 p-2 rounded pt-3">
                            <span className="absolute -top-2 left-2 bg-white px-1 text-[9px] font-bold text-slate-500 uppercase">Marketing</span>
                            <InputField label="Link Foto" labelSize="9px" value={formData.linkImagem} onChange={v => setFormData({...formData, linkImagem: v})} />
                            <InputField label="Link da arte" labelSize="9px" className="mt-1" value={formData.linkArte} onChange={v => setFormData({...formData, linkArte: v})} />
                        </div>
                        <div className="mt-2 relative border border-slate-300 p-2 rounded pt-3">
                            <span className="absolute -top-2.5 left-2 bg-white px-1 text-[10px] font-bold text-slate-600 uppercase">Estoque</span>
                            <div className="grid grid-cols-3 gap-2">
                                <InputField label="Entrada" labelSize="9px" value={formData.ultimaEntrada} onChange={v => setFormData({...formData, ultimaEntrada: v})} />
                                <InputField label="Saida" labelSize="9px" />
                                <InputField label="Estoque" labelSize="9px" value={formData.stock} onChange={v => setFormData({...formData, stock: parseInt(v) || 0})} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded border border-slate-300 shadow-sm overflow-hidden">
                <div className="flex bg-[#e8e8e8] border-b border-slate-300 overflow-x-auto no-scrollbar">
                    {tabs.map(tab => (
                        <button 
                            key={tab.id}
                            onClick={() => setActiveSubTab(tab.id)}
                            className={`px-4 py-2 text-[10px] font-bold whitespace-nowrap border-r border-slate-300 transition-colors ${activeSubTab === tab.id ? 'bg-white' : 'hover:bg-slate-200 text-slate-600'}`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
                <div className="p-4 space-y-4">
                    {activeSubTab === 'invoice' && (
                        <div className="space-y-4">
                            <div className="border border-blue-200 p-3 rounded bg-blue-50 relative">
                                <span className="absolute -top-2 left-4 bg-blue-50 px-2 text-[9px] font-bold text-blue-600 uppercase">Importação de Invoice</span>
                                <div className="flex flex-wrap items-center gap-3">
                                    <label className="bg-blue-700 text-white text-[10px] font-bold px-4 py-2 rounded uppercase shadow-sm cursor-pointer hover:bg-blue-800">
                                        Selecionar planilha (.xlsx/.xls)
                                        <input type="file" accept=".xlsx,.xls" className="hidden" onChange={handleImportInvoiceFile} />
                                    </label>
                                    <button
                                        onClick={handleDownloadInvoiceTemplate}
                                        className="bg-white text-blue-700 border border-blue-200 text-[10px] font-bold px-4 py-2 rounded uppercase shadow-sm hover:bg-blue-100"
                                    >
                                        Baixar modelo
                                    </button>
                                    <p className="text-[10px] text-slate-600 font-semibold uppercase tracking-wide">Use colunas como Código de barras, Referência, Description, V. Custo Fob e Venda.</p>
                                </div>
                                {importSummary && (
                                    <p className="mt-2 text-[10px] font-bold text-emerald-700 uppercase tracking-wide">{importSummary}</p>
                                )}
                            </div>

                            {invoicePreviewRows.length > 0 && (
                                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                                    <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                        Prévia da Invoice ({invoicePreviewRows.length} itens)
                                    </div>
                                    <div className="overflow-x-auto max-h-[220px]">
                                        <table className="w-full text-[10px]">
                                            <thead className="bg-slate-100 text-slate-600 uppercase sticky top-0">
                                                <tr>
                                                    <th className="px-2 py-1 text-left">Ref</th>
                                                    <th className="px-2 py-1 text-left">Código Barras</th>
                                                    <th className="px-2 py-1 text-left">Descrição</th>
                                                    <th className="px-2 py-1 text-center">PCS/CTN</th>
                                                    <th className="px-2 py-1 text-center">T.PCS</th>
                                                    <th className="px-2 py-1 text-center">UN</th>
                                                    <th className="px-2 py-1 text-right">V.uni</th>
                                                    <th className="px-2 py-1 text-right">Total</th>
                                                    <th className="px-2 py-1 text-center">Pedido</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {invoicePreviewRows.slice(0, 80).map((row, index) => (
                                                    <tr key={`${row.barras}-${index}`} className="border-t border-slate-100">
                                                        <td className="px-2 py-1">{row.referencia || '-'}</td>
                                                        <td className="px-2 py-1 data-mono">{row.barras || '-'}</td>
                                                        <td className="px-2 py-1 truncate max-w-[280px]">{row.name || '-'}</td>
                                                        <td className="px-2 py-1 text-center">{row.caixaCom || '-'}</td>
                                                        <td className="px-2 py-1 text-center">{row.stock || 0}</td>
                                                        <td className="px-2 py-1 text-center">{row.unit || '-'}</td>
                                                        <td className="px-2 py-1 text-right">¥ {Number(row.compra || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                                        <td className="px-2 py-1 text-right">¥ {Number(row.totalInvoice || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                                        <td className="px-2 py-1 text-center">{row.ultimoPedido || '-'}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-4 gap-4">
                                <InputField label="Fornecedor" span={2} value={formData.fornecedor} onChange={v => setFormData({...formData, fornecedor: v})} />
                                <InputField label="Ultimo container" span={2} value={formData.container} onChange={v => setFormData({...formData, container: v})} />
                            </div>
                            <div className="grid grid-cols-3 gap-6">
                                <div className="space-y-3">
                                    <InputField label="INMETRO" value={formData.inmetro} onChange={v => setFormData({...formData, inmetro: v})} />
                                    <InputField label="Cor" value={formData.color} onChange={v => setFormData({...formData, color: v})} />
                                    <InputField label="Tamanho" value={formData.size} onChange={v => setFormData({...formData, size: v})} />
                                </div>
                                <div className="space-y-3">
                                    <div className="grid grid-cols-2 gap-2">
                                        <InputField label="M.O.Q" value={formData.moq} onChange={v => setFormData({...formData, moq: parseInt(v) || 0})} />
                                        <InputField label="Material/composição" value={formData.material} onChange={v => setFormData({...formData, material: v})} />
                                    </div>
                                    <InputField label="Remark" value={formData.observacao} onChange={v => setFormData({...formData, observacao: v})} />
                                </div>
                                <div className="space-y-3">
                                    <InputField label="Packing" value={formData.packing} onChange={v => setFormData({...formData, packing: v})} />
                                </div>
                            </div>
                            <div className="border border-slate-200 p-3 rounded bg-slate-50 relative mt-6">
                                <span className="absolute -top-2 left-4 bg-slate-50 px-2 text-[9px] font-bold text-slate-500 uppercase">Invoice</span>
                                <div className="grid grid-cols-6 gap-2 mb-3">
                                    <InputField label="Referência" labelSize="9px" value={formData.referencia} onChange={v => setFormData({...formData, referencia: v})} />
                                    <InputField label="Caixa Com" labelSize="9px" value={formData.caixaCom} onChange={v => setFormData({...formData, caixaCom: v})} />
                                    <InputField label="UN" labelSize="9px" value={formData.unit} onChange={v => setFormData({...formData, unit: v})} />
                                    <InputField label="V. Custo Fob" labelSize="9px" value={formData.compra} onChange={v => setFormData({...formData, compra: parseFloat(v) || 0})} />
                                    <InputField label="Description" labelSize="9px" span={2} value={formData.description} onChange={v => setFormData({...formData, description: v})} />
                                </div>
                                <div className="flex items-end gap-2">
                                    <div className="flex gap-1">
                                        <button onClick={handleUpdate} className="bg-red-600 text-white text-[9px] font-bold px-3 py-1.5 rounded uppercase shadow-sm">Atualizar</button>
                                        <button onClick={handleClear} className="bg-[#ff00ff] text-white text-[9px] font-bold px-3 py-1.5 rounded uppercase shadow-sm">Limpar</button>
                                    </div>
                                    <div className="grid grid-cols-4 gap-2 flex-1 ml-4">
                                        <InputField label="PESO" labelSize="9px" value={formData.peso} onChange={v => setFormData({...formData, peso: v})} />
                                        <InputField label="CBM/CTN" labelSize="9px" value={formData.cbm} onChange={v => setFormData({...formData, cbm: v})} />
                                        <InputField label="NW" labelSize="9px" value={formData.pesoLiquido} onChange={v => setFormData({...formData, pesoLiquido: v})} />
                                        <InputField label="GW" labelSize="9px" value={formData.pesoBruto} onChange={v => setFormData({...formData, pesoBruto: v})} />
                                    </div>
                                    <InputField label="Fazer embalagem?" labelSize="9px" value={formData.complementares} onChange={v => setFormData({...formData, complementares: v})} />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-white border border-slate-300 shadow-sm overflow-hidden rounded">
                <div className="overflow-x-auto max-h-[300px]">
                    <table className="w-full text-[10px] border-collapse">
                        <thead className="bg-[#e8e8e8] text-slate-700 uppercase font-bold sticky top-0 z-10 shadow-sm">
                            <tr>
                                <th className="border border-slate-300 px-2 py-1 text-left">Referência</th>
                                <th className="border border-slate-300 px-2 py-1 text-left">NCM</th>
                                <th className="border border-slate-300 px-2 py-1 text-left">Description</th>
                                <th className="border border-slate-300 px-2 py-1 text-center">CX.C.</th>
                                <th className="border border-slate-300 px-2 py-1 text-center">Tipo</th>
                                <th className="border border-slate-300 px-2 py-1 text-right">Valor</th>
                                <th className="border border-slate-300 px-2 py-1 text-left">Material</th>
                                <th className="border border-slate-300 px-2 py-1 text-left">Tamanho</th>
                                <th className="border border-slate-300 px-2 py-1 text-left">Cor</th>
                                <th className="border border-slate-300 px-2 py-1 text-center">Peso</th>
                                <th className="border border-slate-300 px-2 py-1 text-center">CBM</th>
                                <th className="border border-slate-300 px-2 py-1 text-center">G.W.</th>
                                <th className="border border-slate-300 px-2 py-1 text-center">N.W.</th>
                                <th className="border border-slate-300 px-2 py-1 text-center">M.O.Q</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.map(p => (
                                <tr 
                                    key={p.id} 
                                    onClick={() => handleSelectFromTable(p)}
                                    className={`hover:bg-blue-50 transition-colors cursor-pointer ${selectedId === p.id ? 'bg-blue-100 font-bold' : ''}`}
                                >
                                    <td className="border border-slate-200 px-2 py-1">{p.referencia || p.codInterno || 'N/A'}</td>
                                    <td className="border border-slate-200 px-2 py-1">{p.ncm}</td>
                                    <td className="border border-slate-200 px-2 py-1 truncate max-w-[150px]">{p.name}</td>
                                    <td className="border border-slate-200 px-2 py-1 text-center">{p.caixaCom}</td>
                                    <td className="border border-slate-200 px-2 py-1 text-center">{p.unit}</td>
                                    <td className="border border-slate-200 px-2 py-1 text-right">¥{p.compra?.toLocaleString('pt-BR')}</td>
                                    <td className="border border-slate-200 px-2 py-1">{p.material}</td>
                                    <td className="border border-slate-200 px-2 py-1">{p.size}</td>
                                    <td className="border border-slate-200 px-2 py-1">{p.color}</td>
                                    <td className="border border-slate-200 px-2 py-1 text-center">{p.peso}</td>
                                    <td className="border border-slate-200 px-2 py-1 text-center">{p.cbm}</td>
                                    <td className="border border-slate-200 px-2 py-1 text-center">{p.pesoBruto}</td>
                                    <td className="border border-slate-200 px-2 py-1 text-center">{p.pesoLiquido}</td>
                                    <td className="border border-slate-200 px-2 py-1 text-center">{p.moq}</td>
                                </tr>
                            ))}
                            {products.length === 0 && (
                                <tr><td colSpan="14" className="text-center py-8 text-slate-400">Nenhum produto cadastrado para exibir.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ImportModule;
