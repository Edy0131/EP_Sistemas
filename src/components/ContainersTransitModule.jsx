import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import { Icon } from './Icon';
import { ClassicCheckbox, ClassicInput, ClassicSelect, ClassicSection, ClassicTh, ClassicTd } from './ClassicUI';

const STORAGE_KEY = 'sistestoque_containers_transito';
const STORAGE_RATES_KEY = 'sistestoque_containers_taxas';
const STORAGE_RATES_META_KEY = 'sistestoque_containers_taxas_meta';

const COLUMN_MAP = {
    status: ['status', 'situacao', 'situação'],
    pedido: ['pedido', 'pedido link', 'pedido_link', 'ordem', 'operacao', 'operação'],
    local: ['local'],
    previsao: ['previsao', 'previsão', 'eta', 'data previsao', 'data previsão'],
    containers: ['container', 'containers', 'ctn', 'qtd container', 'qtd containers'],
    fobUSD: ['fob', 'fob*', 'fob usd', 'usd'],
    mercadoriaBRL: ['mercadoria', 'mercadoria brl', 'mercadoria r$', 'mercadoria (r$)'],
    percNacionalizacao: ['% nacionalizacao', '% nacionalização', 'percentual nacionalizacao', 'percentual nacionalização'],
    nacionalizacaoBRL: ['nacionalizacao sem o fob', 'nacionalização sem o fob', 'nacionalizacao', 'nacionalização'],
    totalBRL: ['total', 'total brl', 'total r$', 'total (r$)']
};

const normalizeHeader = (value) => {
    if (value === null || value === undefined) return '';
    return String(value)
        .toLowerCase()
        .trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, ' ')
        .trim()
        .replace(/\s+/g, ' ');
};

const parseNumberSmart = (value) => {
    if (value === null || value === undefined || value === '') return undefined;
    if (typeof value === 'number') return Number.isFinite(value) ? value : undefined;
    const raw = String(value).trim();
    if (!raw) return undefined;
    const cleaned = raw.replace(/[^\d,.\-]/g, '');
    if (!cleaned) return undefined;
    const normalized = cleaned.includes(',')
        ? cleaned.replace(/\./g, '').replace(',', '.')
        : cleaned.replace(/,/g, '');
    const parsed = Number.parseFloat(normalized);
    return Number.isFinite(parsed) ? parsed : undefined;
};

const parseContainers = (value) => {
    if (value === null || value === undefined || value === '') return 0;
    if (typeof value === 'number') return Math.max(0, Math.round(value));
    const raw = String(value).trim();
    const match = raw.match(/(\d+)/);
    return match ? Math.max(0, Number(match[1]) || 0) : 0;
};

const toISODate = (value) => {
    if (!value) return '';
    if (value instanceof Date) {
        if (Number.isNaN(value.getTime())) return '';
        return value.toISOString().split('T')[0];
    }
    const raw = String(value).trim();
    if (!raw) return '';
    const d = new Date(raw);
    if (!Number.isNaN(d.getTime())) return d.toISOString().split('T')[0];
    const m = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (m) return `${m[3]}-${m[2]}-${m[1]}`;
    return '';
};

const autoMapColumns = (rawHeaders) => {
    const mapping = {};
    rawHeaders.forEach((header) => {
        const cleanHeader = normalizeHeader(header);
        for (const [key, aliases] of Object.entries(COLUMN_MAP)) {
            if (aliases.some(alias => cleanHeader.includes(normalizeHeader(alias)))) {
                mapping[key] = header;
                break;
            }
        }
    });
    return mapping;
};

const defaultRates = { rmbBrl: 0.76, usdRmb: 6.9119, usdBrl: 5.252, percNacionalizacao: 120 };

const computeDerived = (op, rates) => {
    const usdBrl = Number(rates?.usdBrl) || 0;
    const perc = Number(op?.percNacionalizacao ?? rates?.percNacionalizacao) || 0;

    const fobUSD = Number(op?.fobUSD) || 0;
    const mercadoriaBRL = op?.mercadoriaBRL !== undefined && op?.mercadoriaBRL !== null
        ? Number(op.mercadoriaBRL) || 0
        : (usdBrl > 0 ? fobUSD * usdBrl : 0);

    const nacionalizacaoBRL = op?.nacionalizacaoBRL !== undefined && op?.nacionalizacaoBRL !== null
        ? Number(op.nacionalizacaoBRL) || 0
        : mercadoriaBRL * (perc / 100);

    const totalBRL = op?.totalBRL !== undefined && op?.totalBRL !== null
        ? Number(op.totalBRL) || 0
        : mercadoriaBRL + nacionalizacaoBRL;

    return { mercadoriaBRL, nacionalizacaoBRL, totalBRL, perc };
};

const statusOptions = [
    'AGUARDAR',
    'EM TRÂNSITO',
    'CHEGOU',
    'FINALIZADO'
];

const panelMenuItems = [
    'Relatórios',
    'Importar XML',
    'Dados para NF-e',
    'Despesas',
    'Conferência',
    'NF-e Emissão',
    'Faturar',
    'Visualizar D.I.',
    'Importar DUIMP'
];

const statusPillClass = (status) => {
    const s = String(status || '').toUpperCase();
    if (s.includes('AGUARD')) return 'bg-red-100 text-red-700 border-red-200';
    if (s.includes('TRÂNS') || s.includes('TRANS')) return 'bg-slate-100 text-slate-700 border-slate-200';
    if (s.includes('CHEG')) return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    if (s.includes('FINAL')) return 'bg-blue-100 text-blue-700 border-blue-200';
    return 'bg-slate-100 text-slate-700 border-slate-200';
};

const ContainerEditor = ({ container, rates, onChange, onImportInvoice }) => {
    const [c, setC] = useState(container);

    const addManualInvoiceRow = () => {
        const nextRows = Array.isArray(c.invoiceRows) ? [...c.invoiceRows] : [];
        nextRows.push({
            referencia: '',
            barras: '',
            ncm: '',
            descricao: '',
            tCtn: 0,
            pcsCtn: 0,
            tPcs: 0,
            unit: 'UN',
            unitPrice: 0,
            total: 0,
            tCbm: 0,
            tGw: 0,
            tNw: 0,
            pedido: c.numero || ''
        });
        setC({ ...c, invoiceRows: nextRows });
    };

    const updateInvoiceRow = (index, field, value) => {
        const nextRows = Array.isArray(c.invoiceRows) ? [...c.invoiceRows] : [];
        const current = nextRows[index] || {};
        const next = { ...current, [field]: value };
        const qty = Number(next.tPcs || 0) || 0;
        const price = Number(next.unitPrice || 0) || 0;
        next.total = Number(next.total || 0) || (qty * price);
        nextRows[index] = next;
        const nextFob = nextRows.reduce((acc, row) => acc + (Number(row.total) || 0), 0);
        setC({ ...c, invoiceRows: nextRows, fobUSD: nextFob });
    };

    const removeInvoiceRow = (index) => {
        const nextRows = (Array.isArray(c.invoiceRows) ? c.invoiceRows : []).filter((_, itemIdx) => itemIdx !== index);
        const nextFob = nextRows.reduce((acc, row) => acc + (Number(row.total) || 0), 0);
        setC({ ...c, invoiceRows: nextRows, fobUSD: nextFob });
    };

    useEffect(() => {
        onChange && onChange(c);
    }, [c]); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <div className="border border-slate-300 rounded-md p-3 space-y-3 bg-slate-100">
            <div className="grid grid-cols-4 gap-4">
                <ClassicInput label="Container" value={c.numero || ''} onChange={v => setC({ ...c, numero: v })} />
                <ClassicInput label="Navio" value={c.navio || ''} onChange={v => setC({ ...c, navio: v })} />
                <ClassicInput label="BL / AWB" value={c.blAwb || ''} onChange={v => setC({ ...c, blAwb: v })} />
                <ClassicInput label="Origem" value={c.origem || ''} onChange={v => setC({ ...c, origem: v })} />
            </div>
            <div className="grid grid-cols-4 gap-4">
                <ClassicInput label="Porto" value={c.porto || ''} onChange={v => setC({ ...c, porto: v })} />
                <ClassicInput label="Data Embarque" type="date" value={c.dataEmbarque || ''} onChange={v => setC({ ...c, dataEmbarque: v })} />
                <ClassicInput label="ETA Porto" type="date" value={c.etaPorto || ''} onChange={v => setC({ ...c, etaPorto: v })} />
                <ClassicInput label="Chegada na Matriz" type="date" value={c.chegadaMatriz || ''} onChange={v => setC({ ...c, chegadaMatriz: v })} />
            </div>
            <div className="grid grid-cols-4 gap-4">
                <ClassicInput label="Lead Time (dias)" type="number" value={c.leadTime || 0} onChange={v => setC({ ...c, leadTime: Number(v) })} />
                <ClassicInput label="FOB (USD)" type="number" value={c.fobUSD || 0} onChange={v => setC({ ...c, fobUSD: Number(v) })} />
                <ClassicInput label="Frete (USD)" type="number" value={c.freteUSD || 0} onChange={v => setC({ ...c, freteUSD: Number(v) })} />
                <ClassicInput label="USD/BRL" type="number" value={rates?.usdBrl ?? 0} onChange={() => {}} readOnly />
            </div>
            <div className="grid grid-cols-4 gap-4">
                <ClassicInput label="Mercadoria (R$)" type="number" value={c.mercadoriaBRL ?? ''} onChange={v => setC({ ...c, mercadoriaBRL: v === '' ? undefined : Number(v) })} />
                <ClassicInput label="% Nacionalização" type="number" value={c.percNacionalizacao ?? ''} onChange={v => setC({ ...c, percNacionalizacao: v === '' ? undefined : Number(v) })} />
                <ClassicInput label="Nacionalização (R$)" type="number" value={c.nacionalizacaoBRL ?? ''} onChange={v => setC({ ...c, nacionalizacaoBRL: v === '' ? undefined : Number(v) })} />
                <ClassicInput label="Total (R$)" type="number" value={c.totalBRL ?? ''} onChange={v => setC({ ...c, totalBRL: v === '' ? undefined : Number(v) })} />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
                <button
                    type="button"
                    onClick={onImportInvoice}
                    className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 rounded text-[10px] font-black uppercase tracking-wide hover:bg-slate-50 transition-all flex items-center gap-2"
                >
                    <Icon name="upload" size={13} /> Importar Proforma/Invoice (Excel/CSV)
                </button>
                <button
                    type="button"
                    onClick={addManualInvoiceRow}
                    className="px-3 py-1.5 bg-slate-700 text-white rounded text-[10px] font-black uppercase tracking-wide hover:bg-slate-800 transition-all flex items-center gap-2"
                >
                    <Icon name="plus" size={13} /> Lançar Item Manual
                </button>
            </div>

            {Array.isArray(c.invoiceRows) && c.invoiceRows.length > 0 && (
                <div className="border border-slate-300 rounded-md overflow-hidden bg-white">
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-[10px]">
                            <thead className="bg-slate-300 border-b border-slate-400 uppercase text-slate-700 sticky top-0">
                                <tr>
                                    <th className="px-1.5 py-1.5 text-left font-bold">Ref</th>
                                    <th className="px-1.5 py-1.5 text-left font-bold">Código Barras</th>
                                    <th className="px-1.5 py-1.5 text-left font-bold">NCM</th>
                                    <th className="px-1.5 py-1.5 text-left font-bold">Descrição</th>
                                    <th className="px-1.5 py-1.5 text-center font-bold">T.CTN</th>
                                    <th className="px-1.5 py-1.5 text-center font-bold">PCS/CTN</th>
                                    <th className="px-1.5 py-1.5 text-center font-bold">T.PCS</th>
                                    <th className="px-1.5 py-1.5 text-center font-bold">UN</th>
                                    <th className="px-1.5 py-1.5 text-right font-bold">V.Uni</th>
                                    <th className="px-1.5 py-1.5 text-right font-bold">Total</th>
                                    <th className="px-1.5 py-1.5 text-center font-bold">CBM</th>
                                    <th className="px-1.5 py-1.5 text-center font-bold">GW</th>
                                    <th className="px-1.5 py-1.5 text-center font-bold">NW</th>
                                    <th className="px-1.5 py-1.5 text-center font-bold">Ped</th>
                                    <th className="px-1.5 py-1.5 text-right font-bold">X</th>
                                </tr>
                            </thead>
                            <tbody>
                                {c.invoiceRows.map((row, index) => (
                                    <tr key={`${index}-${row.referencia || 'item'}`} className={`border-t border-slate-200 hover:bg-slate-50 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}`}>
                                        <td className="px-1.5 py-1 text-left"><input value={row.referencia || ''} onChange={(e) => updateInvoiceRow(index, 'referencia', e.target.value)} className="w-16 border border-slate-200 rounded px-1.5 py-0.5 text-[9px]" /></td>
                                        <td className="px-1.5 py-1 text-left"><input value={row.barras || ''} onChange={(e) => updateInvoiceRow(index, 'barras', e.target.value)} className="w-24 border border-slate-200 rounded px-1.5 py-0.5 text-[9px]" /></td>
                                        <td className="px-1.5 py-1 text-left"><input value={row.ncm || ''} onChange={(e) => updateInvoiceRow(index, 'ncm', e.target.value)} className="w-20 border border-slate-200 rounded px-1.5 py-0.5 text-[9px]" /></td>
                                        <td className="px-1.5 py-1 text-left"><input value={row.descricao || ''} onChange={(e) => updateInvoiceRow(index, 'descricao', e.target.value)} className="w-32 border border-slate-200 rounded px-1.5 py-0.5 text-[9px]" /></td>
                                        <td className="px-1.5 py-1 text-center"><input type="number" value={row.tCtn || 0} onChange={(e) => updateInvoiceRow(index, 'tCtn', Number(e.target.value) || 0)} className="w-12 border border-slate-200 rounded px-1.5 py-0.5 text-center text-[9px]" /></td>
                                        <td className="px-1.5 py-1 text-center"><input type="number" value={row.pcsCtn || 0} onChange={(e) => updateInvoiceRow(index, 'pcsCtn', Number(e.target.value) || 0)} className="w-12 border border-slate-200 rounded px-1.5 py-0.5 text-center text-[9px]" /></td>
                                        <td className="px-1.5 py-1 text-center"><input type="number" value={row.tPcs || 0} onChange={(e) => updateInvoiceRow(index, 'tPcs', Number(e.target.value) || 0)} className="w-12 border border-slate-200 rounded px-1.5 py-0.5 text-center text-[9px]" /></td>
                                        <td className="px-1.5 py-1 text-center"><input value={row.unit || ''} onChange={(e) => updateInvoiceRow(index, 'unit', e.target.value)} className="w-10 border border-slate-200 rounded px-1.5 py-0.5 text-center text-[9px]" /></td>
                                        <td className="px-1.5 py-1 text-right"><input type="number" step="0.0001" value={row.unitPrice || 0} onChange={(e) => updateInvoiceRow(index, 'unitPrice', Number(e.target.value) || 0)} className="w-16 border border-slate-200 rounded px-1.5 py-0.5 text-right text-[9px]" /></td>
                                        <td className="px-1.5 py-1 text-right"><input type="number" step="0.01" value={row.total || 0} onChange={(e) => updateInvoiceRow(index, 'total', Number(e.target.value) || 0)} className="w-16 border border-slate-200 rounded px-1.5 py-0.5 text-right text-[9px]" /></td>
                                        <td className="px-1.5 py-1 text-center"><input type="number" step="0.0001" value={row.tCbm || 0} onChange={(e) => updateInvoiceRow(index, 'tCbm', Number(e.target.value) || 0)} className="w-12 border border-slate-200 rounded px-1.5 py-0.5 text-center text-[9px]" /></td>
                                        <td className="px-1.5 py-1 text-center"><input type="number" step="0.01" value={row.tGw || 0} onChange={(e) => updateInvoiceRow(index, 'tGw', Number(e.target.value) || 0)} className="w-12 border border-slate-200 rounded px-1.5 py-0.5 text-center text-[9px]" /></td>
                                        <td className="px-1.5 py-1 text-center"><input type="number" step="0.01" value={row.tNw || 0} onChange={(e) => updateInvoiceRow(index, 'tNw', Number(e.target.value) || 0)} className="w-12 border border-slate-200 rounded px-1.5 py-0.5 text-center text-[9px]" /></td>
                                        <td className="px-1.5 py-1 text-center"><input value={row.pedido || c.numero || ''} onChange={(e) => updateInvoiceRow(index, 'pedido', e.target.value)} className="w-12 border border-slate-200 rounded px-1.5 py-0.5 text-center text-[9px]" /></td>
                                        <td className="px-1.5 py-1 text-right">
                                            <button type="button" onClick={() => removeInvoiceRow(index)} className="p-0.5 text-red-500 hover:bg-red-50 rounded transition-all">
                                                <Icon name="trash-2" size={12} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

const OperationModal = ({ value, rates, onSave, onCancel }) => {
    const [form, setForm] = useState(value);
    const invoiceFileRef = useRef(null);

    const extractInvoiceRows = (rows) => {
        const headers = Object.keys(rows?.[0] || {});
        const findHeader = (aliases) => headers.find((h) => {
            const n = normalizeHeader(h);
            return aliases.some((a) => n.includes(normalizeHeader(a)));
        });

        const hRef = findHeader(['referencia', 'reference', 'ref']);
        const hBarras = findHeader(['codigo barras', 'cod de barr', 'ean', 'barcode', 'barras']);
        const hDesc = findHeader(['descricao', 'description', 'produto', 'item']);
        const hNcm = findHeader(['ncm']);
        const hTCtn = findHeader(['t ctn', 'total ctn', 'ctn']);
        const hPcsCtn = findHeader(['pcs ctn', 'caixa com']);
        const hTPcs = findHeader(['t pcs', 'quantidade', 'qty']);
        const hUnit = findHeader(['unit', 'un', 'unidade']);
        const hUnitPrice = findHeader(['v uni', 'unit price', 'v custo', 'custo']);
        const hTotal = findHeader(['t t price', 'total', 'valor total']);
        const hTCbm = findHeader(['t cbm', 'cbm']);
        const hTGw = findHeader(['t g w', 'gw', 'peso bruto']);
        const hTNw = findHeader(['t n w', 'nw', 'peso liquido']);
        const hPedido = findHeader(['pedido', 'order', 'po']);
        const hFoto = findHeader(['foto', 'imagem', 'image', 'photo']);

        return (rows || []).map((r) => {
            const tPcs = parseNumberSmart(hTPcs ? r[hTPcs] : 0) || 0;
            const unitPrice = parseNumberSmart(hUnitPrice ? r[hUnitPrice] : 0) || 0;
            const total = parseNumberSmart(hTotal ? r[hTotal] : 0) || (tPcs * unitPrice);
            return {
                referencia: hRef ? String(r[hRef] || '').trim() : '',
                barras: hBarras ? String(r[hBarras] || '').trim() : '',
                ncm: hNcm ? String(r[hNcm] || '').trim() : '',
                descricao: hDesc ? String(r[hDesc] || '').trim() : '',
                tCtn: parseNumberSmart(hTCtn ? r[hTCtn] : 0) || 0,
                pcsCtn: parseNumberSmart(hPcsCtn ? r[hPcsCtn] : 0) || 0,
                tPcs,
                unit: hUnit ? String(r[hUnit] || '').trim() : 'UN',
                unitPrice,
                total,
                tCbm: parseNumberSmart(hTCbm ? r[hTCbm] : 0) || 0,
                tGw: parseNumberSmart(hTGw ? r[hTGw] : 0) || 0,
                tNw: parseNumberSmart(hTNw ? r[hTNw] : 0) || 0,
                pedido: hPedido ? String(r[hPedido] || '').trim() : '',
                foto: hFoto ? String(r[hFoto] || '').trim() : ''
            };
        }).filter((row) => row.descricao || row.barras || row.referencia);
    };

    return (
        <div className="fixed inset-0 bg-slate-900/45 backdrop-blur-sm flex items-center justify-center p-3 z-[300]">
            <div className="bg-white w-full max-w-[1220px] rounded-2xl border border-slate-200 shadow-2xl overflow-hidden">
                <div className="px-5 py-3 bg-slate-700 border-b border-slate-800 flex justify-between items-center">
                    <div>
                        <h2 className="text-lg font-black text-white tracking-wide">D.I. - Declaração de Importação</h2>
                        <p className="text-[10px] text-slate-200 font-bold uppercase tracking-wider mt-0.5">Painel operacional de containers</p>
                    </div>
                    <button onClick={onCancel} className="hover:bg-white/10 p-2 rounded transition-all text-white/80 hover:text-white">
                        <Icon name="x" size={20} />
                    </button>
                </div>
                <div className="px-4 py-2 bg-slate-100 border-b border-slate-200 flex items-center gap-2 text-[11px] font-black text-slate-700">
                    <span className="px-3 py-1 bg-white border border-slate-300 rounded-sm">Informações</span>
                    <span className="px-3 py-1 bg-slate-50 border border-slate-200 rounded-sm text-slate-500">Adições</span>
                    <span className="px-3 py-1 bg-slate-50 border border-slate-200 rounded-sm text-slate-500">Mercadorias</span>
                    <span className="px-3 py-1 bg-slate-50 border border-slate-200 rounded-sm text-slate-500">Dados NF-e</span>
                    <span className="px-3 py-1 bg-slate-50 border border-slate-200 rounded-sm text-slate-500">Despesas</span>
                </div>
                <div className="p-4 md:p-5 space-y-4 bg-white">
                    <div className="grid grid-cols-4 gap-4">
                        <ClassicSelect label="Status" value={form.status} options={statusOptions} onChange={v => setForm({ ...form, status: v })} />
                        <ClassicInput label="Pedido / Link" value={form.pedido} onChange={v => setForm({ ...form, pedido: v })} />
                        <ClassicInput label="Local" value={form.local} onChange={v => setForm({ ...form, local: v })} />
                        <ClassicInput label="Previsão" type="date" value={form.previsao} onChange={v => setForm({ ...form, previsao: v })} />
                    </div>
                    <div className="grid grid-cols-4 gap-4">
                        <ClassicInput label="Containers (Qtd)" type="number" value={form.containers} onChange={v => setForm({ ...form, containers: Number(v) })} />
                        <ClassicInput label="FOB (USD)" type="number" value={form.fobUSD} onChange={v => setForm({ ...form, fobUSD: Number(v) })} />
                        <ClassicInput label="Mercadoria (R$)" type="number" value={form.mercadoriaBRL ?? ''} onChange={v => setForm({ ...form, mercadoriaBRL: v === '' ? undefined : Number(v) })} />
                        <ClassicInput label="Nacionalização (R$)" type="number" value={form.nacionalizacaoBRL ?? ''} onChange={v => setForm({ ...form, nacionalizacaoBRL: v === '' ? undefined : Number(v) })} />
                    </div>
                    <div className="grid grid-cols-4 gap-4">
                        <ClassicInput label="% Nacionalização" type="number" value={form.percNacionalizacao ?? ''} onChange={v => setForm({ ...form, percNacionalizacao: v === '' ? undefined : Number(v) })} />
                        <ClassicInput label="Total (R$)" type="number" value={form.totalBRL ?? ''} onChange={v => setForm({ ...form, totalBRL: v === '' ? undefined : Number(v) })} />
                        <div className="col-span-2">
                            <ClassicInput label="Observações" value={form.observacao || ''} onChange={v => setForm({ ...form, observacao: v })} />
                        </div>
                    </div>
                    <ClassicSection title="Containers da Operação">
                        <div className="space-y-4">
                            {(form.containersList || []).map((ctn, idx) => (
                                <div key={idx} className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Container #{idx + 1}</div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const next = [...(form.containersList || [])];
                                                    next.splice(idx, 1);
                                                    setForm({ ...form, containersList: next });
                                                }}
                                                className="px-3 py-1.5 bg-white border border-red-200 text-red-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-red-50 transition-all"
                                            >
                                                Remover
                                            </button>
                                        </div>
                                    </div>
                                    <ContainerEditor
                                        container={ctn}
                                        rates={{ usdBrl: Number(rates?.usdBrl) || 0 }}
                                        onChange={(updated) => {
                                            const next = [...(form.containersList || [])];
                                            next[idx] = updated;
                                            setForm({ ...form, containersList: next });
                                        }}
                                        onImportInvoice={() => {
                                            invoiceFileRef.current?.click();
                                            invoiceFileRef.current.__targetIndex = idx;
                                        }}
                                    />
                                </div>
                            ))}
                            <input
                                ref={invoiceFileRef}
                                type="file"
                                accept=".csv,.xlsx,.xls"
                                className="hidden"
                                onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    e.target.value = '';
                                    const idx = invoiceFileRef.current?.__targetIndex ?? -1;
                                    if (!file || idx < 0) return;
                                    try {
                                        let rows = [];
                                        const name = file.name.toLowerCase();
                                        if (name.endsWith('.csv')) {
                                            const txt = await file.text();
                                            const wb = XLSX.read(txt, { type: 'string' });
                                            const sheetName = wb.SheetNames[0];
                                            rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName]);
                                        } else {
                                            const data = new Uint8Array(await file.arrayBuffer());
                                            const wb = XLSX.read(data, { type: 'array' });
                                            const sheetName = wb.SheetNames[0];
                                            rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName]);
                                        }
                                        const parsedRows = extractInvoiceRows(rows);
                                        const total = parsedRows.reduce((acc, r) => acc + (Number(r.total) || 0), 0);
                                        const next = [...(form.containersList || [])];
                                        next[idx] = {
                                            ...(next[idx] || {}),
                                            fobUSD: total,
                                            invoiceRows: parsedRows,
                                            invoiceUpdatedAt: new Date().toISOString()
                                        };
                                        setForm({ ...form, containersList: next });
                                        alert(`Invoice importada: ${parsedRows.length} item(ns) e total ${total.toLocaleString('pt-BR')}`);
                                    } catch (err) {
                                        alert(`Erro ao importar invoice: ${err?.message || String(err)}`);
                                    }
                                }}
                            />
                            <button
                                type="button"
                                onClick={() => setForm({ ...form, containersList: [ ...(form.containersList || []), { numero: '', navio: '', porto: '', origem: '', leadTime: 0, fobUSD: 0, freteUSD: 0 } ] })}
                                className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2"
                            >
                                <Icon name="plus" size={14} /> Adicionar Container
                            </button>
                        </div>
                    </ClassicSection>
                </div>
                <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex justify-end gap-2">
                    <button onClick={onCancel} className="px-6 py-2 bg-white border border-slate-300 text-slate-700 rounded text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all">
                        Cancelar
                    </button>
                    <button
                        onClick={() => onSave(form)}
                        className="px-8 py-2 bg-slate-700 text-white rounded text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all"
                    >
                        Salvar
                    </button>
                </div>
            </div>
        </div>
    );
};

const ContainersTransitModule = ({
    operations = [],
    setOperations,
    rates = { ...defaultRates },
    setRates,
    rateMeta = { auto: true },
    setRateMeta
}) => {
    const [rateSync, setRateSync] = useState(() => ({ loading: false, error: '', lastUpdated: null }));
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('Todos');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [importing, setImporting] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(12);
    const fileInputRef = useRef(null);


    const fetchRealTimeRates = async () => {
        setRateSync((prev) => ({ ...prev, loading: true, error: '' }));
        try {
            const response = await fetch('https://economia.awesomeapi.com.br/last/USD-BRL,CNY-BRL,USD-CNY');
            const data = await response.json();

            const usdBrl = Number.parseFloat(data?.USDBRL?.bid);
            const cnyBrl = Number.parseFloat(data?.CNYBRL?.bid);
            const usdCny = Number.parseFloat(data?.USDCNY?.bid);

            setRates((prev) => ({
                ...prev,
                usdBrl: Number.isFinite(usdBrl) ? usdBrl : prev.usdBrl,
                rmbBrl: Number.isFinite(cnyBrl) ? cnyBrl : prev.rmbBrl,
                usdRmb: Number.isFinite(usdCny) ? usdCny : prev.usdRmb
            }));

            setRateSync({ loading: false, error: '', lastUpdated: new Date() });
        } catch (err) {
            setRateSync((prev) => ({
                ...prev,
                loading: false,
                error: err?.message || String(err)
            }));
        }
    };

    useEffect(() => {
        if (!rateMeta.auto) return;
        let alive = true;

        const run = async () => {
            if (!alive) return;
            await fetchRealTimeRates();
        };

        run();
        const interval = setInterval(run, 60000);
        return () => {
            alive = false;
            clearInterval(interval);
        };
    }, [rateMeta.auto]);

    const filtered = useMemo(() => {
        const s = search.trim().toLowerCase();
        return operations.filter((op) => {
            const matchesStatus = filterStatus === 'Todos' || String(op.status || '').toUpperCase() === String(filterStatus).toUpperCase();
            if (!s) return matchesStatus;
            const text = `${op.pedido || ''} ${op.local || ''} ${op.status || ''}`.toLowerCase();
            return matchesStatus && text.includes(s);
        });
    }, [operations, search, filterStatus]);

    const totals = useMemo(() => {
        let containers = 0;
        let fobUSD = 0;
        let mercadoria = 0;
        let nacionalizacao = 0;
        let total = 0;
        let itemCount = 0;
        let operacoes = 0;
        filtered.forEach((op) => {
            operacoes += 1;
            const list = Array.isArray(op.containersList) && op.containersList.length > 0 ? op.containersList : [op];
            list.forEach((row) => {
                const d = computeDerived(row, { ...rates, percNacionalizacao: row.percNacionalizacao ?? rates.percNacionalizacao });
                containers += Number(row.containers || 1) || 0;
                fobUSD += Number(row.fobUSD) || 0;
                mercadoria += d.mercadoriaBRL;
                nacionalizacao += d.nacionalizacaoBRL;
                total += d.totalBRL;
                const invoiceRows = Array.isArray(row.invoiceRows) ? row.invoiceRows : [];
                itemCount += invoiceRows.length;
            });
        });
        return { containers, fobUSD, mercadoria, nacionalizacao, total, itemCount, operacoes };
    }, [filtered, rates]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
    const safeCurrentPage = Math.min(currentPage, totalPages);
    const startIndex = (safeCurrentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pagedOperations = useMemo(() => filtered.slice(startIndex, endIndex), [filtered, startIndex, endIndex]);

    useEffect(() => {
        setCurrentPage(1);
    }, [search, filterStatus, itemsPerPage]);

    useEffect(() => {
        if (currentPage > totalPages) setCurrentPage(totalPages);
    }, [currentPage, totalPages]);

    const openNew = () => {
        setEditing({
            id: null,
            status: 'AGUARDAR',
            pedido: '',
            local: '',
            previsao: '',
            containers: 1,
            fobUSD: 0,
            mercadoriaBRL: undefined,
            nacionalizacaoBRL: undefined,
            percNacionalizacao: undefined,
            totalBRL: undefined,
            observacao: ''
        });
        setIsModalOpen(true);
    };

    const openEdit = (op) => {
        setEditing({ ...op });
        setIsModalOpen(true);
    };

    const saveOperation = (op) => {
        if (!op.pedido && !op.local) {
            alert('Informe pelo menos o Pedido/Link ou o Local.');
            return;
        }
        setOperations((prev) => {
            if (op.id) return prev.map(p => (p.id === op.id ? op : p));
            return [{ ...op, id: Date.now() + Math.random() }, ...prev];
        });
        setIsModalOpen(false);
        setEditing(null);
    };

    const deleteOperation = (id) => {
        if (!confirm('Deseja excluir esta operação?')) return;
        setOperations((prev) => prev.filter(p => p.id !== id));
    };

    const deleteAllOperations = () => {
        if (!operations.length) {
            alert('Não há operações para excluir.');
            return;
        }
        if (!confirm(`Deseja excluir todas as ${operations.length} operação(ões)?`)) return;
        setOperations([]);
    };

    const exportExcel = () => {
        const rows = filtered.map((op) => {
            const d = computeDerived(op, rates);
            return {
                STATUS: op.status || '',
                PEDIDO: op.pedido || '',
                LOCAL: op.local || '',
                PREVISAO: op.previsao || '',
                CONTAINERS: op.containers || 0,
                'FOB (USD)': Number(op.fobUSD) || 0,
                'USD/BRL': Number(rates.usdBrl) || 0,
                'MERCADORIA (R$)': d.mercadoriaBRL,
                '% NACIONALIZACAO': d.perc,
                'NACIONALIZACAO (R$)': d.nacionalizacaoBRL,
                'TOTAL (R$)': d.totalBRL
            };
        });
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(rows);
        XLSX.utils.book_append_sheet(wb, ws, 'Containers');
        XLSX.writeFile(wb, 'containers_em_transito.xlsx');
    };

    const handleImportFile = async (e) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;
        setImporting(true);
        try {
            let rawRows = [];
            const name = file.name.toLowerCase();
            if (name.endsWith('.json')) {
                const txt = await file.text();
                const parsed = JSON.parse(txt);
                rawRows = Array.isArray(parsed) ? parsed : [];
            } else if (name.endsWith('.csv')) {
                const txt = await file.text();
                const wb = XLSX.read(txt, { type: 'string' });
                const sheetName = wb.SheetNames[0];
                rawRows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName]);
            } else {
                const data = new Uint8Array(await file.arrayBuffer());
                const wb = XLSX.read(data, { type: 'array' });
                const sheetName = wb.SheetNames[0];
                rawRows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { cellDates: true });
            }

            if (!rawRows.length) {
                alert('Nenhum registro encontrado na planilha.');
                return;
            }

            const headers = Object.keys(rawRows[0] || {});
            const mapping = autoMapColumns(headers);
            const mapped = rawRows.map((row, idx) => {
                const out = {};
                Object.entries(mapping).forEach(([key, header]) => {
                    out[key] = row?.[header];
                });

                const status = String(out.status || '').trim().toUpperCase() || 'AGUARDAR';
                const pedido = String(out.pedido || '').trim();
                const local = String(out.local || '').trim();
                const previsao = toISODate(out.previsao);
                const containers = parseContainers(out.containers);
                const fobUSD = parseNumberSmart(out.fobUSD) ?? 0;
                const mercadoriaBRL = parseNumberSmart(out.mercadoriaBRL);
                const nacionalizacaoBRL = parseNumberSmart(out.nacionalizacaoBRL);
                const totalBRL = parseNumberSmart(out.totalBRL);
                const percNacionalizacao = parseNumberSmart(out.percNacionalizacao);

                const op = {
                    id: Date.now() + idx + Math.random(),
                    status,
                    pedido,
                    local,
                    previsao,
                    containers,
                    fobUSD,
                    mercadoriaBRL,
                    nacionalizacaoBRL,
                    totalBRL,
                    percNacionalizacao
                };

                const d = computeDerived(op, { ...rates, percNacionalizacao: rates.percNacionalizacao });
                const hasMercadoria = mercadoriaBRL !== undefined;
                const hasNacionalizacao = nacionalizacaoBRL !== undefined;
                const hasTotal = totalBRL !== undefined;

                return {
                    ...op,
                    mercadoriaBRL: hasMercadoria ? mercadoriaBRL : d.mercadoriaBRL,
                    nacionalizacaoBRL: hasNacionalizacao ? nacionalizacaoBRL : d.nacionalizacaoBRL,
                    totalBRL: hasTotal ? totalBRL : d.totalBRL,
                    percNacionalizacao: percNacionalizacao !== undefined ? percNacionalizacao : d.perc
                };
            }).filter(op => op.pedido || op.local);

            if (!mapped.length) {
                alert('Nenhuma linha válida foi identificada na planilha.');
                return;
            }

            setOperations((prev) => [...mapped, ...prev]);
            alert(`Importação concluída: ${mapped.length} operação(ões) adicionada(s).`);
        } catch (err) {
            alert(`Erro ao importar: ${err?.message || String(err)}`);
        } finally {
            setImporting(false);
        }
    };

    return (
        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-700 pb-20">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Containers em Trânsito</h1>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.3em] mt-1">Controle de operações de importação</p>
                </div>
                <div className="flex gap-4">
                    <input ref={fileInputRef} type="file" accept=".csv,.json,.xlsx,.xls,.xlsm" className="hidden" onChange={handleImportFile} disabled={importing} />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={importing}
                        className={`px-6 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 ${importing ? 'opacity-70 cursor-not-allowed' : 'hover:bg-slate-50'}`}
                    >
                        <Icon name="upload" size={16} /> Importar Planilha
                    </button>
                    <button
                        onClick={exportExcel}
                        className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2"
                    >
                        <Icon name="download" size={16} /> Exportar Excel
                    </button>
                    <button
                        onClick={openNew}
                        className="px-6 py-2.5 bg-slate-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-700 transition-all shadow-md shadow-slate-100 flex items-center gap-2"
                    >
                        <Icon name="plus" size={16} /> Nova Operação
                    </button>
                </div>
            </div>

            <ClassicSection title="Taxas e Parâmetros">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
                    <ClassicCheckbox
                        label="Cotação em tempo real (AwesomeAPI)"
                        checked={!!rateMeta.auto}
                        onChange={(checked) => setRateMeta({ ...rateMeta, auto: checked })}
                        span={2}
                    />
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={fetchRealTimeRates}
                            disabled={rateSync.loading}
                            className={`px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${rateSync.loading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-slate-50'}`}
                        >
                            Atualizar agora
                        </button>
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            {rateSync.loading
                                ? 'Atualizando...'
                                : rateSync.lastUpdated
                                    ? `Atualizado às ${new Date(rateSync.lastUpdated).toLocaleTimeString('pt-BR')}`
                                    : 'Sem atualização'}
                        </div>
                    </div>
                </div>
                {rateSync.error ? (
                    <div className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-5">
                        Falha ao buscar cotação: {rateSync.error}
                    </div>
                ) : null}
                <div className="grid grid-cols-4 gap-4">
                    <ClassicInput label="RMB/BRL" type="number" value={rates.rmbBrl} onChange={v => setRates({ ...rates, rmbBrl: Number(v) })} readOnly={!!rateMeta.auto} />
                    <ClassicInput label="USD/RMB" type="number" value={rates.usdRmb} onChange={v => setRates({ ...rates, usdRmb: Number(v) })} readOnly={!!rateMeta.auto} />
                    <ClassicInput label="USD/BRL" type="number" value={rates.usdBrl} onChange={v => setRates({ ...rates, usdBrl: Number(v) })} readOnly={!!rateMeta.auto} />
                    <ClassicInput label="% Nacionalização" type="number" value={rates.percNacionalizacao} onChange={v => setRates({ ...rates, percNacionalizacao: Number(v) })} />
                </div>
            </ClassicSection>

            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-4 py-2 bg-slate-700 border-b border-slate-800 flex items-center justify-between">
                    <div className="text-sm font-black text-white tracking-wide">D.I - Declaração de Importação</div>
                    <div className="text-xs font-black text-slate-200 flex items-center gap-3">
                        <span>Página {safeCurrentPage} de {totalPages}</span>
                        <span>-</span>
                        <span>Total: {filtered.length}</span>
                    </div>
                </div>
                <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-wrap gap-4 items-center">
                    <div className="relative">
                        <button
                            type="button"
                            onClick={() => setMenuOpen((prev) => !prev)}
                            className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-[11px] font-black text-slate-700 flex items-center gap-2"
                        >
                            <Icon name="layers" size={14} /> Menu
                            <Icon name="chevron-down" size={14} className={`${menuOpen ? 'rotate-180' : ''} transition-transform`} />
                        </button>
                        {menuOpen && (
                            <div className="absolute left-0 top-full mt-2 w-60 bg-white border border-slate-300 rounded-lg shadow-lg z-20">
                                {panelMenuItems.map((item) => (
                                    <button
                                        key={item}
                                        type="button"
                                        onClick={() => {
                                            setMenuOpen(false);
                                            if (item === 'Importar DUIMP') {
                                                alert('Fluxo de Importar DUIMP preparado para integração.');
                                            }
                                        }}
                                        className="w-full text-left px-4 py-2.5 text-[11px] font-bold text-slate-700 hover:bg-slate-50 border-b border-slate-100 last:border-b-0"
                                    >
                                        {item}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="relative max-w-md flex-1">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Icon name="search" size={16} className="text-slate-400" />
                        </div>
                        <input
                            type="text"
                            className="block w-full pl-11 pr-4 py-2.5 bg-white border border-slate-300 rounded text-xs font-bold text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500 transition-all uppercase tracking-wide"
                            placeholder="Buscar por pedido, local ou status..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Filtrar:</label>
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="bg-white border border-slate-300 rounded px-3 py-2 text-[10px] font-bold text-slate-700 uppercase tracking-wide focus:outline-none focus:ring-2 focus:ring-slate-500/20"
                        >
                            <option value="Todos">Todos</option>
                            {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <button
                            type="button"
                            onClick={deleteAllOperations}
                            className="px-3 py-2 bg-white border border-red-200 text-red-600 rounded text-[10px] font-black uppercase tracking-wide hover:bg-red-50 transition-all flex items-center gap-1"
                        >
                            <Icon name="trash-2" size={13} /> Excluir
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-100">
                        <thead>
                            <tr className="bg-slate-300 border-y border-slate-400">
                                <ClassicTh>Status</ClassicTh>
                                <ClassicTh>Container</ClassicTh>
                                <ClassicTh>Fornecedor</ClassicTh>
                                <ClassicTh>Origem</ClassicTh>
                                <ClassicTh>Data Embarque</ClassicTh>
                                <ClassicTh>ETA Porto</ClassicTh>
                                <ClassicTh>Porto</ClassicTh>
                                <ClassicTh>Navio</ClassicTh>
                                <ClassicTh>BL / AWB</ClassicTh>
                                <ClassicTh>Lead Time</ClassicTh>
                                <ClassicTh>FOB (USD)</ClassicTh>
                                <ClassicTh>Mercadoria (R$)</ClassicTh>
                                <ClassicTh>% Nac.</ClassicTh>
                                <ClassicTh>Nac. (R$)</ClassicTh>
                                <ClassicTh>Total (R$)</ClassicTh>
                                <ClassicTh className="text-right">Ações</ClassicTh>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 bg-white">
                            {pagedOperations.map((op) => {
                                const d = computeDerived(op, rates);
                                const hasSub = Array.isArray(op.containersList) && op.containersList.length > 0;
                                const displayContainers = hasSub ? op.containersList : [op];

                                return displayContainers.map((container, containerIdx) => {
                                    const cd = computeDerived(container, { ...rates, percNacionalizacao: container.percNacionalizacao ?? rates.percNacionalizacao });
                                    const firstInvoiceRows = Array.isArray(container.invoiceRows) ? container.invoiceRows : [];
                                    const thumb = firstInvoiceRows[0]?.foto || '';

                                    return (
                                        <tr 
                                            key={`${op.id}-${containerIdx}`} 
                                            onDoubleClick={() => openEdit(op)} 
                                            className={`hover:bg-slate-50 transition-colors group cursor-pointer ${containerIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}`}
                                        >
                                            {containerIdx === 0 ? (
                                                <ClassicTd rowSpan={displayContainers.length} className="font-bold">
                                                    <span className={`px-2 py-1 rounded-lg border text-[9px] font-black uppercase tracking-widest ${statusPillClass(op.status)}`}>
                                                        {op.status}
                                                    </span>
                                                </ClassicTd>
                                            ) : null}
                                            <ClassicTd className="font-black text-slate-900 data-mono">{container.numero || '—'}</ClassicTd>
                                            <ClassicTd className="font-bold text-slate-600">{op.pedido || '—'}</ClassicTd>
                                            <ClassicTd className="font-bold text-slate-600">{container.origem || '—'}</ClassicTd>
                                            <ClassicTd className="font-bold text-slate-600">{container.dataEmbarque ? new Date(container.dataEmbarque).toLocaleDateString('pt-BR') : '—'}</ClassicTd>
                                            <ClassicTd className="font-bold text-slate-600">{container.etaPorto ? new Date(container.etaPorto).toLocaleDateString('pt-BR') : '—'}</ClassicTd>
                                            <ClassicTd className="font-bold text-slate-600">{container.porto || '—'}</ClassicTd>
                                            <ClassicTd className="font-black text-slate-700 data-mono">{container.navio || '—'}</ClassicTd>
                                            <ClassicTd className="font-black text-slate-700 data-mono">{container.blAwb || '—'}</ClassicTd>
                                            <ClassicTd className="font-black text-slate-700 data-mono">{container.leadTime || 0} dias</ClassicTd>
                                            <ClassicTd className="font-black text-slate-700 data-mono">$ {(Number(container.fobUSD) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</ClassicTd>
                                            <ClassicTd className="font-black text-slate-900 data-mono">R$ {cd.mercadoriaBRL.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</ClassicTd>
                                            <ClassicTd className="font-black text-slate-700 data-mono">{cd.perc.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}%</ClassicTd>
                                            <ClassicTd className="font-black text-red-600 data-mono">R$ {cd.nacionalizacaoBRL.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</ClassicTd>
                                            <ClassicTd className="font-black text-slate-900 data-mono">R$ {cd.totalBRL.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</ClassicTd>
                                            {containerIdx === 0 ? (
                                                <ClassicTd className="text-right" rowSpan={displayContainers.length}>
                                                    <div className="flex justify-end items-center gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                                                        {thumb ? (
                                                            <img src={thumb} alt="invoice thumb" className="w-8 h-8 rounded object-cover border border-slate-200" title="Invoice vinculada com foto" />
                                                        ) : null}
                                                        <button onClick={() => openEdit(op)} className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all"><Icon name="edit-2" size={14} /></button>
                                                        <button onClick={() => deleteOperation(op.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"><Icon name="trash-2" size={14} /></button>
                                                    </div>
                                                </ClassicTd>
                                            ) : null}
                                        </tr>
                                    );
                                });
                            })}
                            <tr className="bg-emerald-50/30 border-t border-emerald-100">
                                <ClassicTd className="font-black text-slate-700 uppercase">Total</ClassicTd>
                                <ClassicTd className="font-black text-slate-700 data-mono">{totals.containers} CTN</ClassicTd>
                                <ClassicTd className="font-black text-slate-700">{totals.operacoes} op.</ClassicTd>
                                <ClassicTd className="font-black text-slate-600">{totals.itemCount} itens</ClassicTd>
                                <ClassicTd colSpan={6} />
                                <ClassicTd className="font-black text-slate-700 data-mono">$ {totals.fobUSD.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</ClassicTd>
                                <ClassicTd className="font-black text-slate-900 data-mono">R$ {totals.mercadoria.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</ClassicTd>
                                <ClassicTd />
                                <ClassicTd className="font-black text-red-600 data-mono">R$ {totals.nacionalizacao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</ClassicTd>
                                <ClassicTd className="font-black text-slate-900 data-mono">R$ {totals.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</ClassicTd>
                                <ClassicTd />
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
                    <div className="text-[11px] font-black text-slate-600">
                        Exibindo {filtered.length === 0 ? 0 : startIndex + 1} até {Math.min(endIndex, filtered.length)} de {filtered.length} registros
                    </div>
                    <div className="flex items-center gap-2">
                        <select
                            value={itemsPerPage}
                            onChange={(e) => setItemsPerPage(Number(e.target.value))}
                            className="bg-white border border-slate-300 rounded px-2 py-1.5 text-[10px] font-bold text-slate-700"
                        >
                            <option value={8}>8</option>
                            <option value={12}>12</option>
                            <option value={20}>20</option>
                            <option value={30}>30</option>
                        </select>
                        <button
                            type="button"
                            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                            disabled={safeCurrentPage <= 1}
                            className={`px-3 py-1.5 rounded text-[10px] font-black border ${safeCurrentPage <= 1 ? 'bg-white text-slate-300 border-slate-200 cursor-not-allowed' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'}`}
                        >
                            ◀
                        </button>
                        <button
                            type="button"
                            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                            disabled={safeCurrentPage >= totalPages}
                            className={`px-3 py-1.5 rounded text-[10px] font-black border ${safeCurrentPage >= totalPages ? 'bg-white text-slate-300 border-slate-200 cursor-not-allowed' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'}`}
                        >
                            ▶
                        </button>
                    </div>
                </div>
            </div>

            {isModalOpen && editing && (
                <OperationModal
                    value={editing}
                    rates={rates}
                    onSave={saveOperation}
                    onCancel={() => { setIsModalOpen(false); setEditing(null); }}
                />
            )}
        </div>
    );
};

export default ContainersTransitModule;
