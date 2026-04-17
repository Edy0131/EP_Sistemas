import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Icon } from './Icon';
import * as XLSX from 'xlsx';

const COLUMN_MAP = {
    name: ['nome', 'produto', 'descricao', 'descrição', 'description', 'item', 'name'],
    category: ['categoria', 'grupo', 'seção', 'secao', 'category', 'classificacao', 'classificação'],
    price: ['preco', 'preço', 'valor', 'venda', 'price', 'unitario', 'unitário', 'valor_venda', 'preco_venda', 'preço_venda'],
    custo: ['custo', 'cost', 'preco_custo', 'preço_custo', 'valor_custo'],
    stock: ['estoque', 'quantidade', 'saldo', 'stock', 'qtd', 'quantity'],
    minStock: ['minimo', 'mínimo', 'estoque_minimo', 'estoque_mínimo', 'min_stock', 'qtd_minima', 'qtd_mínima'],
    unit: ['unidade', 'un', 'medida', 'unit'],
    ncm: ['ncm', 'classificacao_fiscal', 'classificação_fiscal'],
    codInterno: ['codigo', 'código', 'cod_interno', 'codigo_interno', 'código_interno', 'cod interno', 'codigo interno', 'código interno', 'cod. interno', 'cód interno', 'cód. interno', 'referencia', 'referência', 'ref', 'id_externo'],
    barras: ['barras', 'ean', 'gtin', 'codigo_barras', 'código_barras', 'barcode', 'sku'],
    fornecedor: ['fornecedor', 'supplier', 'vendor'],
    foto: ['foto', 'imagem', 'image', 'photo', 'url_foto', 'url_imagem', 'link_imagem', 'linkimagem', 'foto1', 'imagem1']
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
    if (value === null || value === undefined || value === '') return 0;
    if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
    const raw = String(value).trim();
    if (!raw) return 0;
    const cleaned = raw.replace(/[^\d,.\-]/g, '');
    if (!cleaned) return 0;
    const normalized = cleaned.includes(',')
        ? cleaned.replace(/\./g, '').replace(',', '.')
        : cleaned.replace(/,/g, '');
    const parsed = Number.parseFloat(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
};

const autoMapColumns = (rawHeaders) => {
    const mapping = {};
    rawHeaders.forEach((header) => {
        const cleanHeader = normalizeHeader(header);
        for (const [key, aliases] of Object.entries(COLUMN_MAP)) {
            if (aliases.some(alias => cleanHeader.includes(alias))) {
                mapping[key] = header;
                break;
            }
        }
    });
    return mapping;
};

const processImportedRows = (rawRows) => {
    if (!Array.isArray(rawRows) || rawRows.length === 0) return [];

    const headers = Object.keys(rawRows[0] || {});
    const mapping = autoMapColumns(headers);

    const mapped = rawRows.map((row) => {
        const out = {};
        for (const [key, header] of Object.entries(mapping)) {
            out[key] = row?.[header];
        }

        if (!out.name && row?.name) out.name = row.name;
        if (out.price !== undefined && out.venda === undefined) out.venda = out.price;
        if (out.barras !== undefined && out.barras !== '') out.barras = String(out.barras).trim();
        if (out.codInterno !== undefined && out.codInterno !== '') out.codInterno = String(out.codInterno).trim();

        if (out.stock !== undefined) out.stock = parseNumberSmart(out.stock);
        if (out.minStock !== undefined) out.minStock = parseNumberSmart(out.minStock);
        if (out.price !== undefined) out.price = parseNumberSmart(out.price);
        if (out.venda !== undefined) out.venda = parseNumberSmart(out.venda);
        if (out.custo !== undefined) out.custo = parseNumberSmart(out.custo);

        const fotos = ['', '', '', ''];
        Object.entries(row || {}).forEach(([k, v]) => {
            const clean = normalizeHeader(k).replace(/\s+/g, '');
            if (clean === 'foto1' || clean === 'imagem1') fotos[0] = v;
            if (clean === 'foto2' || clean === 'imagem2') fotos[1] = v;
            if (clean === 'foto3' || clean === 'imagem3') fotos[2] = v;
            if (clean === 'foto4' || clean === 'imagem4') fotos[3] = v;
        });
        const hasAnyFoto = fotos.some(f => f !== null && f !== undefined && String(f).trim() !== '');
        if (hasAnyFoto) {
            out.fotos = fotos.map(f => (f === null || f === undefined) ? '' : String(f).trim());
        } else if (out.foto !== undefined && out.foto !== null && String(out.foto).trim() !== '') {
            out.fotos = [String(out.foto).trim(), '', '', ''];
        }

        return out;
    });

    return mapped.filter(p => p.name && String(p.name).trim().length > 0);
};

const ProductList = ({ products, onEdit, onDelete, onDeleteMany, onBulkImport, trelloConfig }) => {
    const [search, setSearch] = useState('');
    const [filterSupplier, setFilterSupplier] = useState('Todos');
    const [importLoading, setImportLoading] = useState(false);
    const [trelloLoading, setTrelloLoading] = useState(false);
    const [selectedIds, setSelectedIds] = useState(() => new Set());
    const [scannerOpen, setScannerOpen] = useState(false);
    const [scannerError, setScannerError] = useState('');
    const [scannerMode, setScannerMode] = useState('idle');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const fileInputRef = useRef(null);
    const imageScanInputRef = useRef(null);
    const selectAllRef = useRef(null);
    const videoRef = useRef(null);
    const scannerStreamRef = useRef(null);
    const detectorTimerRef = useRef(null);

    const suppliers = Array.from(new Set(products.map(p => p.fornecedor || 'Nenhum')));

    const filteredProducts = products.filter(p => {
        const term = search.toLowerCase();
        const secondaryMatches = Array.isArray(p.secondaryBarcodes)
            ? p.secondaryBarcodes.some(code => String(code || '').toLowerCase().includes(term))
            : false;
        const matchesSearch = p.name.toLowerCase().includes(term) || 
                             (p.codInterno && p.codInterno.toLowerCase().includes(term)) ||
                             (p.barras && p.barras.toLowerCase().includes(term)) ||
                             (p.referencia && p.referencia.toLowerCase().includes(term)) ||
                             (p.prodForn && p.prodForn.toLowerCase().includes(term)) ||
                             secondaryMatches;
        const matchesSupplier = filterSupplier === 'Todos' || p.fornecedor === filterSupplier;
        return matchesSearch && matchesSupplier;
    });

    const totalItems = filteredProducts.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
    const safeCurrentPage = Math.min(currentPage, totalPages);

    const paginatedProducts = useMemo(() => {
        const start = (safeCurrentPage - 1) * itemsPerPage;
        return filteredProducts.slice(start, start + itemsPerPage);
    }, [filteredProducts, safeCurrentPage, itemsPerPage]);

    const pageNumbers = useMemo(() => {
        const maxButtons = 5;
        let start = Math.max(1, safeCurrentPage - 2);
        let end = Math.min(totalPages, start + maxButtons - 1);
        start = Math.max(1, end - maxButtons + 1);
        return Array.from({ length: end - start + 1 }, (_, idx) => start + idx);
    }, [safeCurrentPage, totalPages]);

    const visibleIds = useMemo(() => paginatedProducts.map(p => p.id), [paginatedProducts]);
    const allVisibleSelected = visibleIds.length > 0 && visibleIds.every(id => selectedIds.has(id));
    const someVisibleSelected = visibleIds.some(id => selectedIds.has(id));

    useEffect(() => {
        setCurrentPage(1);
    }, [search, filterSupplier, itemsPerPage]);

    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [currentPage, totalPages]);

    useEffect(() => {
        if (!selectAllRef.current) return;
        selectAllRef.current.indeterminate = someVisibleSelected && !allVisibleSelected;
    }, [someVisibleSelected, allVisibleSelected]);

    useEffect(() => {
        setSelectedIds((prev) => {
            if (prev.size === 0) return prev;
            const existing = new Set(products.map(p => p.id));
            const next = new Set(Array.from(prev).filter(id => existing.has(id)));
            return next.size === prev.size ? prev : next;
        });
    }, [products]);

    const stopScanner = () => {
        if (detectorTimerRef.current) {
            clearInterval(detectorTimerRef.current);
            detectorTimerRef.current = null;
        }
        if (scannerStreamRef.current) {
            scannerStreamRef.current.getTracks().forEach((track) => track.stop());
            scannerStreamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
        setScannerMode('idle');
    };

    const handleBarcodeDetected = (value) => {
        const normalized = String(value || '').trim();
        if (!normalized) return;
        setSearch(normalized);
        setScannerOpen(false);
        stopScanner();
    };

    const openScanner = async () => {
        setScannerError('');
        setScannerOpen(true);

        const hasCameraApi = !!navigator.mediaDevices?.getUserMedia;
        const hasBarcodeDetector = typeof window !== 'undefined' && 'BarcodeDetector' in window;
        const isSecureContextOk = window.isSecureContext || window.location.hostname === 'localhost';

        if (!hasCameraApi) {
            setScannerMode('upload-only');
            setScannerError('Este dispositivo não oferece acesso à câmera pelo navegador. Use imagem do código.');
            return;
        }

        if (!isSecureContextOk) {
            setScannerMode('upload-only');
            setScannerError('Para usar a câmera no celular, abra o sistema em HTTPS ou localhost. Você ainda pode usar uma imagem do código.');
            return;
        }

        if (!hasBarcodeDetector) {
            setScannerMode('upload-only');
            setScannerError('Leitor nativo de barras não suportado neste navegador. Use imagem do código.');
            return;
        }

        try {
            setScannerMode('camera');
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
            scannerStreamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play();
            }

            const detector = new window.BarcodeDetector({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'qr_code'] });
            detectorTimerRef.current = setInterval(async () => {
                if (!videoRef.current || videoRef.current.readyState < 2) return;
                try {
                    const barcodes = await detector.detect(videoRef.current);
                    if (Array.isArray(barcodes) && barcodes.length > 0) {
                        handleBarcodeDetected(barcodes[0]?.rawValue || '');
                    }
                } catch {
                    // mantém tentativa contínua
                }
            }, 500);
        } catch (err) {
            setScannerMode('upload-only');
            setScannerError(err?.message || 'Não foi possível acessar a câmera. Use imagem do código.');
            stopScanner();
            setScannerOpen(true);
            setScannerMode('upload-only');
        }
    };

    const handleImageScan = async (e) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;
        if (typeof window === 'undefined' || !('BarcodeDetector' in window)) {
            alert('Leitura por imagem não suportada neste navegador.');
            return;
        }

        try {
            const imageBitmap = await createImageBitmap(file);
            const detector = new window.BarcodeDetector({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'qr_code'] });
            const barcodes = await detector.detect(imageBitmap);
            if (Array.isArray(barcodes) && barcodes.length > 0) {
                handleBarcodeDetected(barcodes[0]?.rawValue || '');
                return;
            }
            alert('Nenhum código de barras foi encontrado na imagem.');
        } catch (err) {
            alert(err?.message || 'Não foi possível ler a imagem do código.');
        }
    };

    useEffect(() => () => stopScanner(), []);

    const handleFileSelect = (e) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;
        if (typeof onBulkImport !== 'function') {
            alert('Importação indisponível: o sistema não recebeu o handler de importação.');
            return;
        }

        const extension = file.name.toLowerCase();
        setImportLoading(true);

        const finish = () => setImportLoading(false);

        const handleRawRows = (rawRows) => {
            try {
                const processed = processImportedRows(rawRows);
                if (processed.length === 0) {
                    alert('Nenhum registro válido foi identificado na planilha.');
                    finish();
                    return;
                }
                onBulkImport(processed);
            } catch (err) {
                alert(`Erro ao processar planilha: ${err?.message || String(err)}`);
            } finally {
                finish();
            }
        };

        if (extension.endsWith('.csv') || extension.endsWith('.json')) {
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    if (extension.endsWith('.json')) {
                        const data = JSON.parse(event.target.result);
                        handleRawRows(Array.isArray(data) ? data : []);
                        return;
                    }
                    const workbook = XLSX.read(event.target.result, { type: 'string' });
                    const sheetName = workbook.SheetNames[0];
                    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
                    handleRawRows(rows);
                } catch (err) {
                    alert(`Erro ao ler arquivo: ${err?.message || String(err)}`);
                    finish();
                }
            };
            reader.readAsText(file);
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = new Uint8Array(event.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
                handleRawRows(rows);
            } catch (err) {
                alert(`Erro ao ler arquivo: ${err?.message || String(err)}`);
                finish();
            }
        };
        reader.readAsArrayBuffer(file);
    };

    const toggleSelectOne = (id) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const toggleSelectAllVisible = () => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (allVisibleSelected) {
                visibleIds.forEach(id => next.delete(id));
                return next;
            }
            visibleIds.forEach(id => next.add(id));
            return next;
        });
    };

    const handleDeleteSelected = () => {
        const ids = Array.from(selectedIds);
        if (ids.length === 0) return;
        if (typeof onDeleteMany !== 'function') {
            alert('Exclusão em lote indisponível: o sistema não recebeu o handler.');
            return;
        }
        if (confirm(`Deseja realmente apagar ${ids.length} registro(s) selecionado(s)?`)) {
            onDeleteMany(ids);
            setSelectedIds(new Set());
        }
    };

    const handleSendSelectedToTrello = async () => {
        const ids = Array.from(selectedIds);
        if (ids.length === 0) return;
        const key = trelloConfig?.key || '';
        const token = trelloConfig?.token || '';
        const listId = trelloConfig?.listId || '';
        if (!key || !token || !listId) {
            alert('Configure a integração com Trello em Configurações (chave, token e ID da lista).');
            return;
        }

        const selectedProducts = products.filter(p => selectedIds.has(p.id));
        if (selectedProducts.length === 0) return;

        if (!confirm(`Deseja criar ${selectedProducts.length} card(s) no Trello?`)) return;

        setTrelloLoading(true);
        try {
            for (const p of selectedProducts) {
                const cardName = `${p.codInterno ? `[${p.codInterno}] ` : ''}${p.name || 'Produto'}`;
                const descLines = [
                    `Código interno: ${p.codInterno || '-'}`,
                    `Código de barras: ${p.barras || '-'}`,
                    `Fornecedor: ${p.fornecedor || '-'}`,
                    `Categoria: ${p.category || '-'}`,
                    `NCM: ${p.ncm || '-'}`,
                    `Custo: R$ ${(p.custo || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                    `Venda: R$ ${(p.venda || p.price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                    `Estoque: ${p.stock ?? 0}`,
                    `Estoque mínimo: ${p.minStock ?? 0}`
                ];

                const params = new URLSearchParams();
                params.set('key', key);
                params.set('token', token);
                params.set('idList', listId);
                params.set('name', cardName);
                params.set('desc', descLines.join('\n'));

                const res = await fetch(`https://api.trello.com/1/cards?${params.toString()}`, {
                    method: 'POST'
                });
                if (!res.ok) {
                    throw new Error('Falha ao criar um card no Trello. Verifique as credenciais e a lista.');
                }
            }
            alert('Cards criados no Trello com sucesso.');
        } catch (err) {
            alert(err?.message || 'Erro ao enviar para o Trello.');
        } finally {
            setTrelloLoading(false);
        }
    };

    return (
        <div className="space-y-6 md:space-y-8 animate-in slide-in-from-bottom-4 duration-700 pb-10 md:pb-20">
            <div className="flex flex-col lg:flex-row justify-between lg:items-end gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tighter uppercase">Painel de Produtos</h1>
                    <p className="text-slate-400 text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] md:tracking-[0.3em] mt-1">Cadastro de produtos</p>
                </div>
                <div className="flex flex-wrap gap-2 md:gap-4">
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".csv,.json,.xlsx,.xls,.xlsm"
                        onChange={handleFileSelect}
                        className="hidden"
                        disabled={importLoading}
                    />
                    <button 
                        onClick={() => fileInputRef.current?.click()} 
                        className={`px-4 md:px-6 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 ${importLoading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-slate-50'}`}
                        disabled={importLoading}
                    >
                        <Icon name="upload" size={16} /> Importar Planilha
                    </button>
                    <button
                        onClick={handleDeleteSelected}
                        disabled={selectedIds.size === 0}
                        className={`px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 ${selectedIds.size === 0 ? 'bg-white border border-slate-200 text-slate-300 cursor-not-allowed' : 'bg-white border border-red-200 text-red-600 hover:bg-red-50'}`}
                    >
                        <Icon name="trash-2" size={16} /> Apagar Selecionados ({selectedIds.size})
                    </button>
                    <button
                        onClick={handleSendSelectedToTrello}
                        disabled={selectedIds.size === 0 || trelloLoading}
                        className={`px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 ${
                            selectedIds.size === 0 || trelloLoading
                                ? 'bg-white border border-slate-200 text-slate-300 cursor-not-allowed'
                                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                    >
                        <Icon name="layers" size={16} /> Enviar ao Trello
                    </button>
                    <button onClick={() => onEdit(null)} className="px-6 py-2.5 bg-slate-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-700 transition-all shadow-md shadow-slate-100 flex items-center gap-2">
                        <Icon name="plus" size={16} /> Novo Produto
                    </button>
                </div>
            </div>

            {scannerOpen && (
                <div className="fixed inset-0 z-[250] bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-md rounded-3xl border border-slate-200 shadow-2xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                            <div>
                                <h3 className="text-base font-black text-slate-900 uppercase tracking-widest">Leitor de Código</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Aponte a câmera para o código</p>
                            </div>
                            <button type="button" onClick={() => { setScannerOpen(false); stopScanner(); }} className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all">
                                <Icon name="x" size={18} />
                            </button>
                        </div>
                        <div className="p-4 space-y-4">
                            <input ref={imageScanInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageScan} />
                            <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-slate-950 flex items-center justify-center">
                                {scannerMode === 'camera' ? (
                                    <video ref={videoRef} className="w-full h-full object-cover" playsInline muted autoPlay />
                                ) : (
                                    <div className="px-6 text-center text-white/80 space-y-3">
                                        <Icon name="camera" size={36} className="mx-auto text-white/70" />
                                        <p className="text-sm font-bold">Use uma foto do código de barras</p>
                                        <p className="text-[11px] uppercase tracking-widest text-white/60">Compatível quando a câmera ao vivo estiver bloqueada</p>
                                    </div>
                                )}
                            </div>
                            {scannerError && (
                                <div className="p-3 rounded-xl bg-amber-50 border border-amber-100 text-amber-700 text-[10px] font-black uppercase tracking-widest">
                                    {scannerError}
                                </div>
                            )}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => imageScanInputRef.current?.click()}
                                    className="w-full px-4 py-3 bg-blue-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                                >
                                    <Icon name="upload" size={16} /> Ler por Imagem
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setScannerOpen(false); stopScanner(); }}
                                    className="w-full px-4 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all"
                                >
                                    Fechar Leitor
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-4 md:p-6 border-b border-slate-50 bg-slate-50/30 flex flex-col lg:flex-row gap-4 lg:items-center">
                    <div className="relative w-full lg:max-w-md lg:flex-1 flex gap-2">
                        <div className="relative flex-1">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Icon name="search" size={16} className="text-slate-400" />
                            </div>
                            <input 
                                type="text" 
                                className="block w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-slate-500/10 focus:border-slate-500 transition-all uppercase tracking-widest"
                                placeholder="Buscar por nome, código, barras ou referência..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <button
                            type="button"
                            onClick={openScanner}
                            className="px-4 py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl hover:bg-slate-50 transition-all flex items-center justify-center"
                            title="Ler código pela câmera"
                        >
                            <Icon name="camera" size={18} />
                        </button>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Filtrar:</label>
                        <select 
                            value={filterSupplier}
                            onChange={(e) => setFilterSupplier(e.target.value)}
                            className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-[10px] font-bold text-slate-600 uppercase tracking-widest focus:outline-none focus:ring-4 focus:ring-slate-500/10"
                        >
                            <option value="Todos">Todos Fornecedores</option>
                            {suppliers.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                </div>
                <div className="overflow-x-auto touch-pan-x">
                    <table className="min-w-full divide-y divide-slate-100">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="px-6 py-4 text-left">
                                    <input
                                        ref={selectAllRef}
                                        type="checkbox"
                                        checked={allVisibleSelected}
                                        onChange={toggleSelectAllVisible}
                                        className="w-4 h-4 rounded border-slate-300 text-slate-600 focus:ring-slate-500/20"
                                    />
                                </th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Imagem</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Cod. Interno</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Barras</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Descrição / Recurso</th>
                                <th className="hidden lg:table-cell px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">NCM</th>
                                <th className="hidden lg:table-cell px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Custo</th>
                                <th className="hidden lg:table-cell px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Venda</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Saldo Estoque</th>
                                <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 bg-white">
                            {paginatedProducts.length === 0 ? (
                                <tr>
                                    <td colSpan={10} className="px-6 py-10 text-center text-xs font-bold text-slate-400 uppercase tracking-widest">
                                        Nenhum produto encontrado
                                    </td>
                                </tr>
                            ) : (
                                paginatedProducts.map(p => (
                                    <tr key={p.id} onDoubleClick={() => onEdit(p)} className="hover:bg-slate-50 transition-colors group cursor-pointer">
                                        <td className="px-6 py-4">
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.has(p.id)}
                                                onChange={() => toggleSelectOne(p.id)}
                                                className="w-4 h-4 rounded border-slate-300 text-slate-600 focus:ring-slate-500/20"
                                            />
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="w-10 h-10 rounded-lg border border-slate-100 bg-slate-50 flex items-center justify-center overflow-hidden">
                                                {(Array.isArray(p.fotos) && p.fotos[0]) || p.foto ? (
                                                    <img src={(Array.isArray(p.fotos) && p.fotos[0]) || p.foto} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <Icon name="products" size={16} className="text-slate-300" />
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-[10px] font-black text-slate-400 data-mono">
                                            {p.codInterno || p.id}
                                        </td>
                                        <td className="px-6 py-5 text-[10px] font-bold text-slate-500 data-mono">
                                            {p.barras || '---'}
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="font-extrabold text-slate-900 text-sm tracking-tight group-hover:text-slate-600 transition-colors">
                                                {p.name}
                                                {p.premium && <span className="ml-2 px-1.5 py-0.5 bg-amber-100 text-amber-600 text-[8px] rounded-md font-black uppercase tracking-tighter">Premium</span>}
                                            </div>
                                            <div className="text-[10px] font-semibold text-slate-500 mt-1 flex flex-wrap gap-x-2 gap-y-1">
                                                <span>{p.category}</span>
                                                <span>•</span>
                                                <span>{p.fornecedor || 'Sem fornecedor'}</span>
                                                {(p.referencia || p.prodForn) ? (
                                                    <>
                                                        <span>•</span>
                                                        <span>Referência: {p.referencia || p.prodForn}</span>
                                                    </>
                                                ) : null}
                                            </div>
                                        </td>
                                        <td className="hidden lg:table-cell px-6 py-5 text-[10px] font-bold text-slate-500 data-mono">
                                            {p.ncm || '---'}
                                        </td>
                                        <td className="hidden lg:table-cell px-6 py-5 text-xs font-black text-slate-700 data-mono">
                                            R$ {(p.custo || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="hidden lg:table-cell px-6 py-5 text-xs font-black text-slate-900 data-mono">
                                            R$ {(p.venda || p.price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 bg-slate-100 h-1.5 rounded-full overflow-hidden border border-slate-200">
                                                    <div 
                                                        className={`h-full rounded-full transition-all duration-500 ${(Number(p.saldo ?? p.stock ?? 0) <= Number(p.minStock || 0)) ? 'bg-red-500' : 'bg-slate-500'}`}
                                                        style={{ width: `${Math.min(((Number(p.saldo ?? p.stock ?? 0) / (Math.max(Number(p.minStock || 0), 1) * 3)) * 100), 100)}%` }}
                                                    ></div>
                                                </div>
                                                <span className={`text-[10px] font-black data-mono ${(Number(p.saldo ?? p.stock ?? 0) <= Number(p.minStock || 0)) ? 'text-red-500' : 'text-slate-600'}`}>{Number(p.saldo ?? p.stock ?? 0)}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <div className="flex justify-end gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all md:transform md:translate-x-2 md:group-hover:translate-x-0">
                                                <button onClick={() => onEdit(p)} className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all"><Icon name="edit-2" size={16} /></button>
                                                <button onClick={() => onDelete(p.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"><Icon name="trash-2" size={16} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="px-4 md:px-6 py-4 border-t border-slate-100 bg-slate-50/30 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                    <div className="flex items-center gap-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                        <span>Total: {totalItems} itens</span>
                        <span>Página {safeCurrentPage} de {totalPages}</span>
                    </div>

                    <div className="flex items-center gap-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Itens por página:</label>
                        <select
                            value={itemsPerPage}
                            onChange={(e) => setItemsPerPage(Number(e.target.value))}
                            className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-[10px] font-bold text-slate-600 uppercase tracking-widest focus:outline-none focus:ring-4 focus:ring-slate-500/10"
                        >
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-1">
                        <button
                            type="button"
                            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                            disabled={safeCurrentPage <= 1}
                            className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border ${safeCurrentPage <= 1 ? 'bg-white border-slate-200 text-slate-300 cursor-not-allowed' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                        >
                            Anterior
                        </button>

                        {pageNumbers.map((page) => (
                            <button
                                key={page}
                                type="button"
                                onClick={() => setCurrentPage(page)}
                                className={`min-w-9 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border ${safeCurrentPage === page ? 'bg-slate-600 border-slate-600 text-white' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                            >
                                {page}
                            </button>
                        ))}

                        <button
                            type="button"
                            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                            disabled={safeCurrentPage >= totalPages}
                            className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border ${safeCurrentPage >= totalPages ? 'bg-white border-slate-200 text-slate-300 cursor-not-allowed' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                        >
                            Próxima
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductList;
