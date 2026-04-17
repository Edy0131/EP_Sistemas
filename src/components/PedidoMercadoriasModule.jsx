import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import { Icon } from './Icon';
import { ClassicInput, ClassicSelect, ClassicSection, ClassicTh, ClassicTd } from './ClassicUI';

const STORAGE_KEY = 'sistestoque_pedidos_mercadorias';
const STORAGE_CONTAINERS_KEY = 'sistestoque_containers_transito';

const normalizeHeader = (value) => {
    if (value === null || value === undefined) return '';
    return String(value)
        .toLowerCase()
        .trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, ' ')
        .trim();
};

const PedidoMercadoriasModule = ({ products = [], suppliers = [], records = [], setRecords, containerRecords = [] }) => {

    const [form, setForm] = useState({
        numeroPedido: '',
        fornecedor: '',
        invoiceId: '',
        invoiceNumero: '',
        invoiceChave: '',
        referencia: '',
        codInterno: '',
        barras: '',
        descricao: '',
        size: '',
        unidade: 'UN',
        caixaCom: '',
        quantidade: 0,
        totalCtn: 0,
        pcsCtn: 0,
        tPcs: 0,
        valorUnitario: 0,
        cbm: '',
        pesoBruto: '',
        pesoLiquido: '',
        observacao: '',
        containerRef: '',
        previsaoEntrega: new Date().toISOString().split('T')[0],
        status: 'ABERTO',
        foto: ''
    });
    const photoInputRef = useRef(null);

    const supplierOptions = useMemo(() => {
        const names = Array.from(new Set((suppliers || []).map(s => s?.name).filter(Boolean)));
        return ['Selecione', ...names];
    }, [suppliers]);

    const invoiceOptions = useMemo(() => {
        const list = (containerRecords || []).map((op) => ({
            value: String(op?.id || ''),
            label: `${op?.pedido || 'SEM PEDIDO'} - ${op?.local || 'SEM LOCAL'} - ${op?.status || 'SEM STATUS'}`
        })).filter(opt => opt.value);
        return [{ value: '', label: 'Selecione' }, ...list];
    }, [containerRecords]);

    const statusOptions = ['ABERTO', 'APROVADO', 'EM TRÂNSITO', 'PARCIAL', 'FINALIZADO', 'CANCELADO'];

    const persist = (next) => {
        setRecords(next);
    };

    const clearForm = () => {
        setForm({
            numeroPedido: '',
            fornecedor: '',
            invoiceId: '',
            invoiceNumero: '',
            invoiceChave: '',
            referencia: '',
            codInterno: '',
            barras: '',
            descricao: '',
            size: '',
            unidade: 'UN',
            caixaCom: '',
            quantidade: 0,
            totalCtn: 0,
            pcsCtn: 0,
            tPcs: 0,
            valorUnitario: 0,
            cbm: '',
            pesoBruto: '',
            pesoLiquido: '',
            observacao: '',
            containerRef: '',
            previsaoEntrega: new Date().toISOString().split('T')[0],
            status: 'ABERTO',
            foto: ''
        });
    };

    const handleSearchProductByBarcode = (barcode) => {
        const b = String(barcode || '').trim();
        setForm((prev) => ({ ...prev, barras: b }));
        if (!b) return;
        const found = (products || []).find(p => String(p?.barras || '').trim() === b);
        if (!found) return;
        const fotoProduto = (Array.isArray(found.fotos) && found.fotos[0]) || found.foto || '';
        setForm((prev) => ({
            ...prev,
            barras: b,
            codInterno: found.codInterno || prev.codInterno,
            referencia: found.referencia || prev.referencia,
            descricao: found.name || prev.descricao,
            size: found.size || prev.size,
            unidade: found.unit || prev.unidade,
            caixaCom: found.caixaCom || prev.caixaCom,
            cbm: found.cbm || prev.cbm,
            pesoBruto: found.pesoBruto || prev.pesoBruto,
            pesoLiquido: found.pesoLiquido || prev.pesoLiquido,
            valorUnitario: Number(found.compra || 0) || prev.valorUnitario,
            fornecedor: found.fornecedor || prev.fornecedor,
            foto: fotoProduto || prev.foto
        }));
    };

    const handleSave = (e) => {
        e.preventDefault();
        const numero = String(form.numeroPedido || '').trim();
        if (!numero) {
            alert('Informe o número do pedido (definido por você).');
            return;
        }
        if (!String(form.invoiceId || '').trim()) {
            alert('Vincule o pedido a um container em trânsito (invoice logística) antes de salvar.');
            return;
        }
        const duplicated = records.some(r => String(r.numeroPedido || '').trim() === numero);
        if (duplicated) {
            alert('Já existe um pedido com esse número.');
            return;
        }

        const qty = Number(form.tPcs || form.quantidade) || 0;
        const unit = Number(form.valorUnitario) || 0;
        const total = qty * unit;
        const newItem = {
            ...form,
            numeroPedido: numero,
            id: Date.now() + Math.random(),
            quantidade: Number(form.quantidade || qty) || 0,
            tPcs: qty,
            pcsCtn: Number(form.pcsCtn || form.caixaCom || 0) || 0,
            totalCtn: Number(form.totalCtn || 0) || 0,
            valorUnitario: unit,
            valorTotal: total,
            createdAt: new Date().toISOString()
        };
        persist([newItem, ...records]);
        clearForm();
    };

    const handleDelete = (id) => {
        if (!confirm('Deseja excluir este pedido de mercadoria?')) return;
        persist(records.filter(r => r.id !== id));
    };

    const handlePickPhoto = (e) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            if (typeof reader.result === 'string') {
                setForm((prev) => ({ ...prev, foto: reader.result }));
            }
        };
        reader.readAsDataURL(file);
    };

    const exportPedidoExcel = (pedido) => {
        const rows = [[
            'Pedido', 'Container ID', 'Container/Invoice', 'Chave Vínculo', 'Fornecedor', 'Cód. Interno', 'Referência', 'Código Barras', 'Descrição', 'Size',
            'Total CTN', 'PCS/CTN', 'T.PCS', 'UN', 'Unit Price', 'T.T Price', 'T.CBM', 'T.G.W', 'T.N.W', 'Observação', 'Foto'
        ], [
            pedido.numeroPedido || '',
            pedido.invoiceId || '',
            pedido.invoiceNumero || '',
            pedido.invoiceChave || '',
            pedido.fornecedor || '',
            pedido.codInterno || '',
            pedido.referencia || '',
            pedido.barras || '',
            pedido.descricao || '',
            pedido.size || '',
            Number(pedido.totalCtn || 0),
            Number(pedido.pcsCtn || 0),
            Number(pedido.tPcs || 0),
            pedido.unidade || '',
            Number(pedido.valorUnitario || 0),
            Number(pedido.valorTotal || 0),
            pedido.cbm || '',
            pedido.pesoBruto || '',
            pedido.pesoLiquido || '',
            pedido.observacao || '',
            pedido.foto || ''
        ]];

        const ws = XLSX.utils.aoa_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Recibo_Pedido');
        XLSX.writeFile(wb, `recibo_pedido_${pedido.numeroPedido || 'sem_numero'}.xlsx`);
    };

    const exportPedidoPdf = (pedido) => {
        const html = `
            <html>
                <head>
                    <title>Recibo Pedido ${pedido.numeroPedido || ''}</title>
                    <style>
                        body { font-family: Arial, sans-serif; padding: 24px; }
                        h1 { margin: 0 0 12px; }
                        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 16px; margin-top: 12px; }
                        .label { font-size: 12px; color: #666; text-transform: uppercase; }
                        .value { font-size: 14px; font-weight: 700; margin-top: 2px; }
                        .photo { margin-top: 16px; }
                        img { max-width: 260px; max-height: 260px; border: 1px solid #ddd; border-radius: 8px; }
                    </style>
                </head>
                <body>
                    <h1>Recibo de Pedido de Mercadorias</h1>
                    <div class="grid">
                        <div><div class="label">Número Pedido</div><div class="value">${pedido.numeroPedido || '-'}</div></div>
                        <div><div class="label">Fornecedor</div><div class="value">${pedido.fornecedor || '-'}</div></div>
                        <div><div class="label">Container/Invoice</div><div class="value">${pedido.invoiceNumero || '-'} (${pedido.invoiceId || '-'})</div></div>
                        <div><div class="label">Item</div><div class="value">${pedido.descricao || '-'}</div></div>
                        <div><div class="label">Código Barras</div><div class="value">${pedido.barras || '-'}</div></div>
                        <div><div class="label">Quantidade</div><div class="value">${Number(pedido.quantidade || 0).toLocaleString('pt-BR')}</div></div>
                        <div><div class="label">Valor Unitário</div><div class="value">R$ ${Number(pedido.valorUnitario || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div></div>
                        <div><div class="label">Valor Total</div><div class="value">R$ ${Number(pedido.valorTotal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div></div>
                        <div><div class="label">Container</div><div class="value">${pedido.containerRef || '-'}</div></div>
                    </div>
                    <div class="photo">
                        <div class="label">Foto do item</div>
                        ${pedido.foto ? `<img src="${pedido.foto}" />` : '<div class="value">Sem foto</div>'}
                    </div>
                </body>
            </html>
        `;

        const w = window.open('', '_blank', 'width=1000,height=700');
        if (!w) {
            alert('Não foi possível abrir a janela de impressão do PDF.');
            return;
        }
        w.document.write(html);
        w.document.close();
        w.focus();
        setTimeout(() => w.print(), 300);
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Pedido de Mercadorias</h1>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.3em] mt-1">Gestão de pedidos e vínculo logístico</p>
                </div>
                <div className="px-4 py-2 bg-slate-100 border border-slate-200 rounded-full text-[10px] font-black text-slate-600 uppercase tracking-widest">
                    {records.length} Pedido(s)
                </div>
            </div>

            <ClassicSection title="Novo Pedido de Mercadoria">
                <form onSubmit={handleSave} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <ClassicInput label="Nº Pedido" value={form.numeroPedido} onChange={(v) => setForm({ ...form, numeroPedido: v })} />
                        <ClassicSelect
                            label="Invoice/Container em trânsito"
                            value={form.invoiceId}
                            onChange={(v) => {
                                const op = (containerRecords || []).find(i => String(i?.id || '') === String(v));
                                const invoiceRows = Array.isArray(op?.containersList)
                                    ? op.containersList.flatMap(c => Array.isArray(c?.invoiceRows) ? c.invoiceRows : [])
                                    : [];
                                const first = invoiceRows[0] || null;

                                const findValue = (row, aliases) => {
                                    if (!row) return '';
                                    const keys = Object.keys(row);
                                    const key = keys.find((k) => aliases.some((a) => normalizeHeader(k).includes(normalizeHeader(a))));
                                    return key ? row[key] : '';
                                };

                                const pickedRef = first ? (first.referencia || findValue(first, ['referencia', 'reference'])) : '';
                                const pickedBarras = first ? (first.barras || first.codBarras || findValue(first, ['codigo barras', 'cod barras', 'barcode', 'ean'])) : '';
                                const pickedDesc = first ? (first.descricao || findValue(first, ['descricao', 'description', 'item'])) : '';
                                const pickedUnit = first ? (first.unit || first.unidade || findValue(first, ['unit', 'un'])) : '';
                                const pickedPcsCtn = first ? (first.pcsCtn || findValue(first, ['pcs ctn', 'caixa com'])) : '';
                                const pickedTPcs = first ? (first.tPcs || findValue(first, ['t pcs', 'quantidade', 'qty'])) : '';
                                const pickedUnitPrice = first ? (first.unitPrice || first.valorUnitario || findValue(first, ['unit price', 'v uni', 'custo'])) : '';
                                const pickedTotal = first ? (first.total || first.valorTotal || findValue(first, ['total', 't t price'])) : '';
                                const pickedCbm = first ? (first.tCbm || first.cbm || findValue(first, ['t cbm', 'cbm'])) : '';
                                const pickedGw = first ? (first.tGw || first.pesoBruto || findValue(first, ['t g w', 'gw'])) : '';
                                const pickedNw = first ? (first.tNw || first.pesoLiquido || findValue(first, ['t n w', 'nw'])) : '';
                                const pickedFoto = first ? (first.foto || findValue(first, ['foto', 'imagem', 'image'])) : '';

                                setForm({
                                    ...form,
                                    invoiceId: v,
                                    invoiceNumero: op?.pedido || '',
                                    invoiceChave: op?.id ? `CTN-${op.id}` : '',
                                    containerRef: op?.pedido || form.containerRef,
                                    referencia: pickedRef || form.referencia,
                                    barras: String(pickedBarras || form.barras || '').trim(),
                                    descricao: pickedDesc || form.descricao,
                                    unidade: pickedUnit || form.unidade,
                                    caixaCom: String(pickedPcsCtn || form.caixaCom || ''),
                                    pcsCtn: Number(pickedPcsCtn || form.pcsCtn || 0) || 0,
                                    tPcs: Number(pickedTPcs || form.tPcs || 0) || 0,
                                    quantidade: Number(pickedTPcs || form.quantidade || 0) || 0,
                                    valorUnitario: Number(pickedUnitPrice || form.valorUnitario || 0) || 0,
                                    valorTotal: Number(pickedTotal || form.valorTotal || 0) || 0,
                                    cbm: String(pickedCbm || form.cbm || ''),
                                    pesoBruto: String(pickedGw || form.pesoBruto || ''),
                                    pesoLiquido: String(pickedNw || form.pesoLiquido || ''),
                                    foto: pickedFoto || form.foto,
                                    observacao: op?.pedido ? `Vinculado ao container/pedido ${op.pedido}` : form.observacao
                                });
                            }}
                            options={invoiceOptions}
                        />
                        <ClassicSelect label="Fornecedor" value={form.fornecedor} onChange={(v) => setForm({ ...form, fornecedor: v })} options={supplierOptions} />
                        <ClassicInput label="Container/Vínculo" value={form.containerRef} onChange={(v) => setForm({ ...form, containerRef: v })} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <ClassicInput label="Número Invoice" value={form.invoiceNumero} onChange={(v) => setForm({ ...form, invoiceNumero: v })} readOnly />
                        <ClassicInput label="Chave Invoice" value={form.invoiceChave} onChange={(v) => setForm({ ...form, invoiceChave: v })} readOnly />
                        <ClassicInput label="Previsão Entrega" type="date" value={form.previsaoEntrega} onChange={(v) => setForm({ ...form, previsaoEntrega: v })} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <ClassicInput label="Código de Barras" value={form.barras} onChange={handleSearchProductByBarcode} />
                        <ClassicInput label="Cód. Interno" value={form.codInterno} onChange={(v) => setForm({ ...form, codInterno: v })} />
                        <ClassicInput label="Referência" value={form.referencia} onChange={(v) => setForm({ ...form, referencia: v })} />
                        <ClassicInput label="Descrição" value={form.descricao} onChange={(v) => setForm({ ...form, descricao: v })} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                        <ClassicInput label="UN" value={form.unidade} onChange={(v) => setForm({ ...form, unidade: v })} />
                        <ClassicInput label="Caixa Com" value={form.caixaCom} onChange={(v) => setForm({ ...form, caixaCom: v, pcsCtn: Number(v) || 0 })} />
                        <ClassicInput label="Quantidade" type="number" value={form.quantidade} onChange={(v) => setForm({ ...form, quantidade: Number(v) || 0 })} />
                        <ClassicInput label="V. Unitário" type="number" value={form.valorUnitario} onChange={(v) => setForm({ ...form, valorUnitario: Number(v) || 0 })} />
                        <ClassicInput label="T.CBM" value={form.cbm} onChange={(v) => setForm({ ...form, cbm: v })} />
                        <ClassicSelect label="Status" value={form.status} onChange={(v) => setForm({ ...form, status: v })} options={statusOptions} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                        <ClassicInput label="Size" value={form.size} onChange={(v) => setForm({ ...form, size: v })} />
                        <ClassicInput label="Total CTN" type="number" value={form.totalCtn} onChange={(v) => setForm({ ...form, totalCtn: Number(v) || 0 })} />
                        <ClassicInput label="PCS/CTN" type="number" value={form.pcsCtn} onChange={(v) => setForm({ ...form, pcsCtn: Number(v) || 0, caixaCom: v })} />
                        <ClassicInput label="T.PCS" type="number" value={form.tPcs} onChange={(v) => setForm({ ...form, tPcs: Number(v) || 0, quantidade: Number(v) || 0 })} />
                        <ClassicInput label="T.G.W" value={form.pesoBruto} onChange={(v) => setForm({ ...form, pesoBruto: v })} />
                        <ClassicInput label="T.N.W" value={form.pesoLiquido} onChange={(v) => setForm({ ...form, pesoLiquido: v })} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <ClassicInput label="Observação" value={form.observacao} onChange={(v) => setForm({ ...form, observacao: v })} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
                        <div className="md:col-span-2">
                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">Foto do Item</label>
                            <div className="mt-1 flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => photoInputRef.current?.click()}
                                    className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2"
                                >
                                    <Icon name="upload" size={14} /> Enviar Foto
                                </button>
                                <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePickPhoto} />
                                {form.foto && (
                                    <img src={form.foto} alt="foto item" className="w-10 h-10 object-cover rounded-lg border border-slate-200" />
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={clearForm} className="px-8 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all">
                            Limpar
                        </button>
                        <button type="submit" className="px-10 py-3 bg-blue-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 flex items-center gap-2">
                            <Icon name="check" size={16} /> Salvar Pedido
                        </button>
                    </div>
                </form>
            </ClassicSection>

            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <ClassicTh>Pedido</ClassicTh>
                                <ClassicTh>Invoice</ClassicTh>
                                <ClassicTh>Fornecedor</ClassicTh>
                                <ClassicTh>Item</ClassicTh>
                                <ClassicTh>Barras</ClassicTh>
                                <ClassicTh>Total CTN</ClassicTh>
                                <ClassicTh>PCS/CTN</ClassicTh>
                                <ClassicTh>T.PCS</ClassicTh>
                                <ClassicTh>UN</ClassicTh>
                                <ClassicTh>V. Unit</ClassicTh>
                                <ClassicTh>T.T Price</ClassicTh>
                                <ClassicTh>Container</ClassicTh>
                                <ClassicTh>Foto</ClassicTh>
                                <ClassicTh>Status</ClassicTh>
                                <ClassicTh className="text-right">Ações</ClassicTh>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 bg-white">
                            {records.length === 0 ? (
                                <tr>
                                    <td colSpan="14" className="px-8 py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-[10px]">
                                        Nenhum pedido de mercadoria cadastrado.
                                    </td>
                                </tr>
                            ) : (
                                records.map((r) => (
                                    <tr key={r.id} className="hover:bg-blue-50/30 transition-colors group">
                                        <ClassicTd className="font-black text-slate-900">{r.numeroPedido || '-'}</ClassicTd>
                                        <ClassicTd className="font-black text-indigo-600">{r.invoiceNumero || '-'}</ClassicTd>
                                        <ClassicTd className="font-bold text-slate-600 uppercase">{r.fornecedor || '-'}</ClassicTd>
                                        <ClassicTd className="font-black text-slate-900 uppercase">{r.descricao || r.referencia || '-'}</ClassicTd>
                                        <ClassicTd className="data-mono">{r.barras || '-'}</ClassicTd>
                                        <ClassicTd className="font-black">{Number(r.totalCtn || 0).toLocaleString('pt-BR')}</ClassicTd>
                                        <ClassicTd className="font-black">{Number(r.pcsCtn || 0).toLocaleString('pt-BR')}</ClassicTd>
                                        <ClassicTd className="font-black">{Number(r.tPcs || r.quantidade || 0).toLocaleString('pt-BR')}</ClassicTd>
                                        <ClassicTd className="font-bold uppercase">{r.unidade || '-'}</ClassicTd>
                                        <ClassicTd className="data-mono">¥ {Number(r.valorUnitario || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</ClassicTd>
                                        <ClassicTd className="data-mono font-black text-blue-600">¥ {Number(r.valorTotal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</ClassicTd>
                                        <ClassicTd className="font-bold">{r.containerRef || '-'}</ClassicTd>
                                        <ClassicTd>
                                            {r.foto ? (
                                                <img src={r.foto} alt="foto pedido" className="w-10 h-10 object-cover rounded-lg border border-slate-200" />
                                            ) : (
                                                <span className="text-slate-300">-</span>
                                            )}
                                        </ClassicTd>
                                        <ClassicTd>
                                            <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] font-black uppercase">{r.status}</span>
                                        </ClassicTd>
                                        <ClassicTd className="text-right">
                                            <div className="flex justify-end gap-1">
                                                <button onClick={() => exportPedidoExcel(r)} className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all" title="Recibo Excel">
                                                    <Icon name="download" size={14} />
                                                </button>
                                                <button onClick={() => exportPedidoPdf(r)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="Recibo PDF">
                                                    <Icon name="file-text" size={14} />
                                                </button>
                                                <button onClick={() => handleDelete(r.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all" title="Excluir">
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
        </div>
    );
};

export default PedidoMercadoriasModule;
