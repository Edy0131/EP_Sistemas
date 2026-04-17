import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Icon } from './Icon';
import { 
    ClassicInput, 
    ClassicSelect, 
    ClassicCheckbox, 
    ClassicSection,
    ClassicTh,
    ClassicTd
} from './ClassicUI';

const NFeAddModal = ({ onSave, onCancel, suppliers }) => {
    const [formData, setFormData] = useState({
        chaveAcesso: '', situacao: '00 - Doc. Regular', protocolo: '',
        dataEntrada: new Date().toISOString().split('T')[0],
        dataEmissao: new Date().toISOString().split('T')[0],
        numeroNF: '', serieNF: '', tipoEntradaNF: '',
        lojaSaldo: '4', lojaEntrada: '4', localEstoque: '4', tipoDocumento: '25',
        fornecedorId: '', fornecedorNome: '', fornecedorDoc: '', fornecedorUF: '',
        comprador: '0', faturador: '0',
        totais: {
            vProdTot: 0, vFrete: 0, vSeg: 0, vDesc: 0, vIPI: 0, vNF: 0,
            vBC: 0, vICMS: 0, vBCST: 0, vICMSST: 0
        },
        dadosAdicionais: '', dadosFisco: ''
    });

    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-[200] animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-[1000px] shadow-2xl rounded-3xl overflow-hidden flex flex-col border border-slate-200">
                <div className="bg-white px-8 py-5 flex justify-between items-center border-b border-slate-100">
                    <div className="flex items-center gap-4">
                        <div className="bg-blue-600 p-2.5 rounded-2xl shadow-lg shadow-blue-100">
                            <Icon name="import-nfe" size={24} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">Entrada de Nota Fiscal</h2>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Processamento manual de documentos fiscais</p>
                        </div>
                    </div>
                    <button type="button" onClick={onCancel} className="hover:bg-slate-100 p-2 rounded-xl transition-all text-slate-400 hover:text-slate-900">
                        <Icon name="x" size={24} />
                    </button>
                </div>

                <form className="p-8 bg-[#f8fafc] overflow-y-auto max-h-[85vh] space-y-6 custom-scrollbar">
                    <div className="grid grid-cols-12 gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                        <div className="col-span-6"><ClassicInput label="Chave de Acesso (44 dígitos)" value={formData.chaveAcesso} onChange={v => setFormData({...formData, chaveAcesso: v})} /></div>
                        <div className="col-span-4"><ClassicSelect label="Situação do Documento" value={formData.situacao} options={['00 - Doc. Regular', '01 - Doc. Cancelado']} onChange={v => setFormData({...formData, situacao: v})} /></div>
                        <div className="col-span-2"><ClassicInput label="Protocolo" value={formData.protocolo} onChange={v => setFormData({...formData, protocolo: v})} /></div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <ClassicSection title="Identificação da NF-e">
                            <div className="grid grid-cols-2 gap-4">
                                <ClassicInput label="Data de Emissão" type="date" value={formData.dataEmissao} onChange={v => setFormData({...formData, dataEmissao: v})} />
                                <ClassicInput label="Data de Entrada" type="date" value={formData.dataEntrada} onChange={v => setFormData({...formData, dataEntrada: v})} />
                                <ClassicInput label="Número N.F." value={formData.numeroNF} onChange={v => setFormData({...formData, numeroNF: v})} />
                                <ClassicInput label="Série" value={formData.serieNF} onChange={v => setFormData({...formData, serieNF: v})} />
                            </div>
                        </ClassicSection>

                        <ClassicSection title="Fornecedor / Emitente">
                            <div className="space-y-4">
                                <ClassicInput label="Razão Social" value={formData.fornecedorNome} readOnly />
                                <div className="grid grid-cols-2 gap-4">
                                    <ClassicInput label="CNPJ / CPF" value={formData.fornecedorDoc} readOnly />
                                    <ClassicInput label="UF" value={formData.fornecedorUF} readOnly />
                                </div>
                            </div>
                        </ClassicSection>
                    </div>

                    <ClassicSection title="Valores Totais do Documento">
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            <ClassicInput label="Base ICMS" value={formData.totais.vBC} />
                            <ClassicInput label="Valor ICMS" value={formData.totais.vICMS} />
                            <ClassicInput label="Base ST" value={formData.totais.vBCST} />
                            <ClassicInput label="Valor ST" value={formData.totais.vICMSST} />
                            <ClassicInput label="Total Produtos" value={formData.totais.vProdTot} />
                            <ClassicInput label="Frete" value={formData.totais.vFrete} />
                            <ClassicInput label="Seguro" value={formData.totais.vSeg} />
                            <ClassicInput label="Desconto" value={formData.totais.vDesc} />
                            <ClassicInput label="IPI" value={formData.totais.vIPI} />
                            <div className="bg-blue-50 p-2 rounded-xl border border-blue-100">
                                <ClassicInput label="Valor Total NF" value={formData.totais.vNF} className="font-black text-blue-600" />
                            </div>
                        </div>
                    </ClassicSection>

                    <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-slate-200">
                        <button type="button" onClick={onCancel} className="px-8 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all">
                            Descartar
                        </button>
                        <button type="button" onClick={() => onSave(formData)} className="px-10 py-3 bg-blue-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 flex items-center gap-2">
                            <Icon name="check" size={16} /> Confirmar Entrada
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const NFeItemModal = ({ item, onSave, onCancel }) => {
    const [formData, setFormData] = useState(item || {
        xProd: '', cProd: '', NCM: '', uCom: '', qCom: 0, vUnCom: 0, vProd: 0,
        cfop: '', cst: '', vBC: 0, vICMS: 0, vIPI: 0,
        margemZero: 0, vendaFinal: 0, atacarejo: 0,
        caixaCom: '',
        fornecedorNome: '', fornecedorCNPJ: '', fornecedorId: null
    });

    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-[210] animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-[1000px] shadow-2xl rounded-3xl overflow-hidden flex flex-col border border-slate-200">
                <div className="bg-white px-8 py-5 flex justify-between items-center border-b border-slate-100">
                    <div className="flex items-center gap-4">
                        <div className="bg-emerald-600 p-2.5 rounded-2xl shadow-lg shadow-emerald-100">
                            <Icon name="edit-3" size={24} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">Auditoria de Item</h2>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Conciliação de dados da nota com o estoque</p>
                        </div>
                    </div>
                    <button type="button" onClick={onCancel} className="hover:bg-slate-100 p-2 rounded-xl transition-all text-slate-400 hover:text-slate-900">
                        <Icon name="x" size={24} />
                    </button>
                </div>

                <form className="p-8 bg-[#f8fafc] overflow-y-auto max-h-[85vh] space-y-6 custom-scrollbar">
                    <ClassicSection title="Dados do Produto">
                        <div className="grid grid-cols-12 gap-4">
                            <div className="col-span-8"><ClassicInput label="Nome na Nota Fiscal" value={formData.xProd} onChange={v => setFormData({...formData, xProd: v})} /></div>
                            <div className="col-span-4"><ClassicInput label="Código do Fornecedor" value={formData.cProd} onChange={v => setFormData({...formData, cProd: v})} /></div>
                            <div className="col-span-3"><ClassicInput label="NCM" value={formData.NCM} onChange={v => setFormData({...formData, NCM: v})} /></div>
                            <div className="col-span-3"><ClassicInput label="Unidade Comercial" value={formData.uCom} onChange={v => setFormData({...formData, uCom: v})} /></div>
                            <div className="col-span-3"><ClassicInput label="Quantidade" value={formData.qCom} type="number" onChange={v => setFormData({...formData, qCom: Number(v) || 0, vProd: (Number(v) || 0) * (Number(formData.vUnCom) || 0)})} /></div>
                            <div className="col-span-3"><ClassicInput label="Caixa Com" value={formData.caixaCom || ''} onChange={v => setFormData({...formData, caixaCom: v})} /></div>
                            <div className="col-span-6"><ClassicInput label="Fornecedor Vinculado" value={formData.fornecedorNome || ''} readOnly /></div>
                            <div className="col-span-3"><ClassicInput label="CNPJ Fornecedor" value={formData.fornecedorCNPJ || ''} readOnly /></div>
                            <div className="col-span-3"><ClassicInput label="ID Fornecedor" value={formData.fornecedorId || ''} readOnly /></div>
                        </div>
                    </ClassicSection>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <ClassicSection title="Impostos e Custos">
                            <div className="grid grid-cols-2 gap-4">
                                <ClassicInput label="CFOP" value={formData.cfop} onChange={v => setFormData({...formData, cfop: v})} />
                                <ClassicInput label="CST / CSOSN" value={formData.cst} onChange={v => setFormData({...formData, cst: v})} />
                                <ClassicInput label="Custo Unitário" value={formData.vUnCom} type="number" onChange={v => setFormData({...formData, vUnCom: Number(v) || 0, vProd: (Number(v) || 0) * (Number(formData.qCom) || 0)})} />
                                <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                                    <ClassicInput label="Valor Total Item" value={formData.vProd} readOnly className="font-bold" />
                                </div>
                            </div>
                        </ClassicSection>

                        <ClassicSection title="Faturamento e Margens">
                            <div className="grid grid-cols-3 gap-3">
                                <div className="bg-slate-100/50 p-3 rounded-2xl border border-slate-100">
                                    <span className="text-[9px] font-black text-slate-400 block mb-2 uppercase tracking-widest">Custo</span>
                                    <ClassicInput label="Margem Zero" value={formData.margemZero} />
                                </div>
                                <div className="bg-blue-50/50 p-3 rounded-2xl border border-blue-100">
                                    <span className="text-[9px] font-black text-blue-600 block mb-2 uppercase tracking-widest">Venda</span>
                                    <ClassicInput label="Final" value={formData.vendaFinal} />
                                </div>
                                <div className="bg-emerald-50/50 p-3 rounded-2xl border border-emerald-100">
                                    <span className="text-[9px] font-black text-emerald-600 block mb-2 uppercase tracking-widest">Atacado</span>
                                    <ClassicInput label="Atacarejo" value={formData.atacarejo} />
                                </div>
                            </div>
                        </ClassicSection>
                    </div>

                    <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-slate-200">
                        <button type="button" onClick={onCancel} className="px-8 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all">
                            Descartar
                        </button>
                        <button type="button" onClick={() => onSave(formData)} className="px-10 py-3 bg-emerald-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 flex items-center gap-2">
                            <Icon name="check" size={16} /> Aplicar Alterações
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const NFeEntryModule = ({ nfeHistory, products, suppliers, onImportStock, onAddSupplier, onExcluirEntrada, onEstornarEntrada, onAtualizarItemEntrada }) => {
    const [selectedEntry, setSelectedEntry] = useState(nfeHistory[0] || null);
    const [activeTab, setActiveTab] = useState('informacoes');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [importando, setImportando] = useState(false);
    const xmlInputRef = useRef(null);
    const invoiceInputRef = useRef(null);
    const [preview, setPreview] = useState(null);
    const [showPreview, setShowPreview] = useState(false);
    const [importOpts, setImportOpts] = useState({ atualizarEstoque: true, gerarFinanceiro: true });
    const [containerOps, setContainerOps] = useState([]);
    const [linkedOperationId, setLinkedOperationId] = useState('');

    const suppliersByCnpj = useMemo(() => {
        const map = new Map();
        (suppliers || []).forEach(s => {
            if (s?.cnpj) map.set(String(s.cnpj).trim(), s);
        });
        return map;
    }, [suppliers]);

    const normalizeBarcode = (value) => {
        const raw = String(value || '').trim();
        if (!raw) return '';
        const upper = raw.toUpperCase();
        if (upper.includes('SEM GTIN') || upper === 'SEM' || upper === 'NAO INFORMADO' || upper === 'NÃO INFORMADO') return '';
        return raw;
    };

    useEffect(() => {
        setSelectedEntry((prev) => {
            if (!Array.isArray(nfeHistory) || nfeHistory.length === 0) return null;
            if (!prev) return nfeHistory[0];
            const found = nfeHistory.find(n => String(n?.id || '') === String(prev?.id || ''));
            return found || nfeHistory[0];
        });
    }, [nfeHistory]);

    useEffect(() => {
        const loadContainers = () => {
            try {
                const raw = localStorage.getItem('sistestoque_containers_transito');
                const parsed = raw ? JSON.parse(raw) : [];
                setContainerOps(Array.isArray(parsed) ? parsed : []);
            } catch {
                setContainerOps([]);
            }
        };
        loadContainers();
        window.addEventListener('focus', loadContainers);
        return () => window.removeEventListener('focus', loadContainers);
    }, []);

    const formatarData = (value) => {
        if (!value) return '-';
        const d = new Date(value);
        if (Number.isNaN(d.getTime())) return '-';
        return d.toLocaleDateString('pt-BR');
    };

    const formatarDataHora = (value) => {
        if (!value) return '-';
        const d = new Date(value);
        if (Number.isNaN(d.getTime())) return '-';
        return d.toLocaleString('pt-BR');
    };

    const parseNFeXml = (xmlText) => {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, 'text/xml');

        if (xmlDoc.getElementsByTagName('parsererror').length > 0) {
            throw new Error('XML inválido ou malformado.');
        }

        const getText = (node, tag) => {
            if (!node) return '';
            const direct = node.getElementsByTagName(tag)?.[0]?.textContent;
            if (direct !== undefined && direct !== null) return direct;
            const byLocal = Array.from(node.getElementsByTagName('*')).find(el => el.localName === tag);
            return byLocal?.textContent || '';
        };
        const getAttr = (node, name) => node?.getAttribute?.(name) || '';
        const toNumber = (v) => {
            const n = Number(v);
            return Number.isFinite(n) ? n : 0;
        };
        const firstByLocalName = (root, name) => {
            const found = Array.from(root.getElementsByTagName('*')).find(el => el.localName === name);
            return found || null;
        };
        const firstChildByLocalName = (root, name) => {
            const found = Array.from(root.getElementsByTagName('*')).find(el => el.localName === name);
            return found || null;
        };
        const allByLocalName = (root, name) => Array.from(root.getElementsByTagName('*')).filter(el => el.localName === name);

        const infNFe = xmlDoc.getElementsByTagName('infNFe')[0] || firstByLocalName(xmlDoc, 'infNFe');
        const ide = xmlDoc.getElementsByTagName('ide')[0] || firstByLocalName(xmlDoc, 'ide');
        const nNF = getText(ide, 'nNF');
        const dhEmi = getText(ide, 'dhEmi') || getText(ide, 'dEmi');
        const dhSaiEnt = getText(ide, 'dhSaiEnt') || getText(ide, 'dSaiEnt');
        const natOp = getText(ide, 'natOp');
        const mod = getText(ide, 'mod');
        const serie = getText(ide, 'serie');
        const cUF = getText(ide, 'cUF');
        const tpNF = getText(ide, 'tpNF');
        const idDest = getText(ide, 'idDest');
        const tpAmb = getText(ide, 'tpAmb');
        const finNFe = getText(ide, 'finNFe');
        const verProc = getText(ide, 'verProc');

        const emit = xmlDoc.getElementsByTagName('emit')[0] || firstByLocalName(xmlDoc, 'emit');
        const emitNome = getText(emit, 'xNome');
        const emitCNPJ = getText(emit, 'CNPJ');
        const emitIE = getText(emit, 'IE');
        const emitCRT = getText(emit, 'CRT');
        const emitEnd = emit?.getElementsByTagName('enderEmit')[0] || (emit ? firstChildByLocalName(emit, 'enderEmit') : null);
        const emitUF = getText(emitEnd, 'UF');
        const emitMun = getText(emitEnd, 'xMun');

        const dest = xmlDoc.getElementsByTagName('dest')[0] || firstByLocalName(xmlDoc, 'dest');
        const destNome = getText(dest, 'xNome');
        const destCNPJ = getText(dest, 'CNPJ');
        const destCPF = getText(dest, 'CPF');
        const destIdEstrangeiro = getText(dest, 'idEstrangeiro');
        const destEmail = getText(dest, 'email');
        const destEnd = dest?.getElementsByTagName('enderDest')[0] || (dest ? firstChildByLocalName(dest, 'enderDest') : null);
        const destUF = getText(destEnd, 'UF');
        const destMun = getText(destEnd, 'xMun');
        const destPais = getText(destEnd, 'xPais');

        const protNFe = xmlDoc.getElementsByTagName('protNFe')[0] || firstByLocalName(xmlDoc, 'protNFe');
        const infProt = protNFe?.getElementsByTagName('infProt')?.[0] || (protNFe ? firstChildByLocalName(protNFe, 'infProt') : null);
        const chNFe = getText(infProt, 'chNFe');
        const nProt = getText(infProt, 'nProt');
        const cStat = getText(infProt, 'cStat');
        const xMotivo = getText(infProt, 'xMotivo');
        const dhRecbto = getText(infProt, 'dhRecbto');
        const digVal = getText(infProt, 'digVal');
        const infNFeId = getAttr(infNFe, 'Id');
        const chaveAcesso = (chNFe || infNFeId.replace(/^NFe/i, '')).trim();
        const situacao = cStat ? `${cStat} - ${xMotivo || ''}`.trim() : '';

        const infAdic = xmlDoc.getElementsByTagName('infAdic')[0] || firstByLocalName(xmlDoc, 'infAdic');
        const infCpl = getText(infAdic, 'infCpl');
        const infAdFisco = getText(infAdic, 'infAdFisco');

        const transp = xmlDoc.getElementsByTagName('transp')[0] || firstByLocalName(xmlDoc, 'transp');
        const modFrete = getText(transp, 'modFrete');
        const transporta = transp?.getElementsByTagName('transporta')?.[0];
        const transportaNome = getText(transporta, 'xNome');
        const transportaCNPJ = getText(transporta, 'CNPJ') || getText(transporta, 'CPF');
        const transportaIE = getText(transporta, 'IE');
        const transportaUF = getText(transporta, 'UF');
        const transportaMun = getText(transporta, 'xMun');
        const vols = Array.from(transp?.getElementsByTagName('vol') || []).map((vol) => ({
            qVol: toNumber(getText(vol, 'qVol')),
            esp: getText(vol, 'esp'),
            marca: getText(vol, 'marca'),
            nVol: getText(vol, 'nVol'),
            pesoL: toNumber(getText(vol, 'pesoL')),
            pesoB: toNumber(getText(vol, 'pesoB'))
        }));

        const pag = xmlDoc.getElementsByTagName('pag')[0] || firstByLocalName(xmlDoc, 'pag');
        const detPagList = Array.from(pag?.getElementsByTagName('detPag') || []).map((detPag) => ({
            indPag: getText(detPag, 'indPag'),
            tPag: getText(detPag, 'tPag'),
            vPag: toNumber(getText(detPag, 'vPag'))
        }));

        const infRespTec = xmlDoc.getElementsByTagName('infRespTec')[0] || firstByLocalName(xmlDoc, 'infRespTec');
        const respTec = {
            cnpj: getText(infRespTec, 'CNPJ'),
            contato: getText(infRespTec, 'xContato'),
            email: getText(infRespTec, 'email'),
            fone: getText(infRespTec, 'fone')
        };

        const total = xmlDoc.getElementsByTagName('total')[0] || firstByLocalName(xmlDoc, 'total');
        const icmsTot = total?.getElementsByTagName('ICMSTot')[0];
        const totais = {
            vProdTot: toNumber(getText(icmsTot, 'vProd')),
            vFrete: toNumber(getText(icmsTot, 'vFrete')),
            vSeg: toNumber(getText(icmsTot, 'vSeg')),
            vDesc: toNumber(getText(icmsTot, 'vDesc')),
            vIPI: toNumber(getText(icmsTot, 'vIPI')),
            vNF: toNumber(getText(icmsTot, 'vNF')),
            vBC: toNumber(getText(icmsTot, 'vBC')),
            vICMS: toNumber(getText(icmsTot, 'vICMS')),
            vBCST: toNumber(getText(icmsTot, 'vBCST')),
            vICMSST: toNumber(getText(icmsTot, 'vST')),
            vII: toNumber(getText(icmsTot, 'vII')),
            vPIS: toNumber(getText(icmsTot, 'vPIS')),
            vCOFINS: toNumber(getText(icmsTot, 'vCOFINS')),
            vOutro: toNumber(getText(icmsTot, 'vOutro'))
        };

        const parseFirstChildObject = (node) => {
            const elementChildren = Array.from(node?.children || []).filter(n => n?.nodeType === 1);
            const firstChild = elementChildren[0] || null;
            if (!firstChild) return null;
            const obj = { tipo: firstChild.tagName };
            Array.from(firstChild.children || []).forEach((ch) => {
                if (ch?.nodeType === 1) obj[ch.tagName] = ch.textContent;
            });
            return obj;
        };

        const detNodes = xmlDoc.getElementsByTagName('det');
        const detList = detNodes && detNodes.length > 0 ? Array.from(detNodes) : allByLocalName(xmlDoc, 'det');
        const items = detList.map((det) => {
            const prod = det.getElementsByTagName('prod')[0] || firstChildByLocalName(det, 'prod');
            const cProd = prod?.getElementsByTagName('cProd')[0]?.textContent || '';
            const xProd = prod?.getElementsByTagName('xProd')[0]?.textContent || '';
            const NCM = prod?.getElementsByTagName('NCM')[0]?.textContent || '';
            const CFOP = prod?.getElementsByTagName('CFOP')[0]?.textContent || '';
            const uCom = prod?.getElementsByTagName('uCom')[0]?.textContent || '';
            const qCom = toNumber(prod?.getElementsByTagName('qCom')[0]?.textContent || 0);
            const vUnCom = toNumber(prod?.getElementsByTagName('vUnCom')[0]?.textContent || 0);
            const vProd = toNumber(prod?.getElementsByTagName('vProd')[0]?.textContent || 0);
            const cEAN = normalizeBarcode(prod?.getElementsByTagName('cEAN')[0]?.textContent);
            const cEANTrib = normalizeBarcode(prod?.getElementsByTagName('cEANTrib')[0]?.textContent);
            const uTrib = getText(prod, 'uTrib');
            const qTrib = toNumber(getText(prod, 'qTrib'));
            const vUnTrib = toNumber(getText(prod, 'vUnTrib'));
            const vFrete = toNumber(getText(prod, 'vFrete'));
            const vSeg = toNumber(getText(prod, 'vSeg'));
            const vDesc = toNumber(getText(prod, 'vDesc'));
            const vOutro = toNumber(getText(prod, 'vOutro'));
            const imposto = det.getElementsByTagName('imposto')[0];
            const icms = imposto?.getElementsByTagName('ICMS')?.[0];
            const ipi = imposto?.getElementsByTagName('IPI')?.[0];
            const pis = imposto?.getElementsByTagName('PIS')?.[0];
            const cofins = imposto?.getElementsByTagName('COFINS')?.[0];
            const ii = imposto?.getElementsByTagName('II')?.[0];
            return { cProd, xProd, NCM, CFOP, uCom, qCom, vUnCom, vProd, cEAN, cEANTrib, uTrib, qTrib, vUnTrib, vFrete, vSeg, vDesc, vOutro, imposto: { icms: parseFirstChildObject(icms), ipi: parseFirstChildObject(ipi), pis: parseFirstChildObject(pis), cofins: parseFirstChildObject(cofins), ii: ii ? { vII: getText(ii, 'vII'), vBC: getText(ii, 'vBC'), vDespAdu: getText(ii, 'vDespAdu'), vIOF: getText(ii, 'vIOF') } : null } };
        });

        return {
            nNF,
            dhEmi,
            dhSaiEnt,
            natOp,
            mod,
            serie,
            cUF,
            tpNF,
            idDest,
            tpAmb,
            finNFe,
            verProc,
            chaveAcesso,
            protocolo: nProt,
            situacao,
            dhRecbto,
            digVal,
            emit: { nome: emitNome, cnpj: emitCNPJ, ie: emitIE, crt: emitCRT, uf: emitUF, mun: emitMun },
            dest: { nome: destNome, cnpj: destCNPJ, cpf: destCPF, idEstrangeiro: destIdEstrangeiro, email: destEmail, uf: destUF, mun: destMun, pais: destPais },
            transp: { modFrete, transportaNome, transportaCNPJ, transportaIE, transportaUF, transportaMun, volumes: vols },
            pag: { detPag: detPagList },
            infAdic: { infCpl, infAdFisco },
            respTec,
            totais,
            items
        };
    };

    const handleImportXmlFiles = async (e) => {
        const files = Array.from(e.target.files || []);
        e.target.value = '';
        if (files.length === 0) return;
        setImportando(true);
        try {
            const file = files[0];
            const xmlText = await file.text();
            const parsed = parseNFeXml(xmlText);
            setPreview({ ...parsed, arquivo: file.name, origem: 'xml' });
            setShowPreview(true);
        } catch (err) {
            alert(`Erro ao importar XML: ${err?.message || String(err)}`);
        } finally {
            setImportando(false);
        }
    };

    const parseNumber = (value) => {
        if (value === null || value === undefined || value === '') return 0;
        if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
        const raw = String(value).trim();
        if (!raw) return 0;
        const cleaned = raw.replace(/[^\d,.-]/g, '');
        const normalized = cleaned.includes(',')
            ? cleaned.replace(/\./g, '').replace(',', '.')
            : cleaned.replace(/,/g, '');
        const n = Number.parseFloat(normalized);
        return Number.isFinite(n) ? n : 0;
    };

    const pickField = (row, aliases) => {
        for (const key of aliases) {
            if (row?.[key] !== undefined && row?.[key] !== null && String(row[key]).trim() !== '') {
                return row[key];
            }
        }
        return '';
    };

    const handleImportInvoiceFiles = async (e) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;

        setImportando(true);
        try {
            const buffer = await file.arrayBuffer();
            const workbook = XLSX.read(buffer, { type: 'array' });
            const firstSheet = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheet];
            const rows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
            if (!rows.length) {
                alert('Planilha invoice vazia.');
                return;
            }

            const items = rows.map((row, idx) => {
                const cProd = String(pickField(row, ['Referência', 'Referencia', 'reference'])).trim() || `ITEM-${idx + 1}`;
                const cEAN = String(pickField(row, ['Código Barras', 'Codigo de barras', 'EAN', 'BARRAS'])).trim();
                const xProd = String(pickField(row, ['Descrição', 'Description', 'Descricao', 'Produto'])).trim();
                const qCom = parseNumber(pickField(row, ['T.PCS', 'Quantidade', 'QTD', 'qty']));
                const vUnCom = parseNumber(pickField(row, ['V.uni', 'V. Custo Fob', 'Custo']));
                const vProd = parseNumber(pickField(row, ['Total', 'TOTAL', 'valor total'])) || (qCom * vUnCom);
                const caixaCom = String(pickField(row, ['PCS/CTN', 'Caixa Com', 'CX.C.'])).trim();
                const pedido = String(pickField(row, ['Pedido', 'Order', 'PO'])).trim();
                return {
                    cProd,
                    cEAN,
                    cEANTrib: cEAN,
                    xProd,
                    NCM: String(pickField(row, ['NCM', 'ncm'])).trim(),
                    CFOP: '3102',
                    uCom: String(pickField(row, ['UNIT', 'UN', 'Unidade'])).trim() || 'UN',
                    qCom,
                    vUnCom,
                    vProd,
                    caixaCom,
                    pedido,
                    imposto: { icms: null, ipi: null, pis: null, cofins: null, ii: null }
                };
            }).filter(item => item.xProd);

            const total = items.reduce((acc, i) => acc + (Number(i.vProd) || 0), 0);
            const linked = containerOps.find((op) => String(op.id) === String(linkedOperationId));
            const fornecedorHint = linked?.pedido || linked?.local || 'INVOICE IMPORTADA';

            setPreview({
                origem: 'invoice',
                arquivo: file.name,
                nNF: `INV-${Date.now().toString().slice(-6)}`,
                dhEmi: new Date().toISOString(),
                serie: 'INV',
                mod: 'INVOICE',
                natOp: 'COMPRA IMPORTAÇÃO',
                emit: { nome: fornecedorHint, cnpj: '', ie: '', uf: '' },
                chaveAcesso: '',
                protocolo: '',
                situacao: 'INVOICE IMPORTADA',
                totais: {
                    vProdTot: total,
                    vFrete: 0,
                    vSeg: 0,
                    vDesc: 0,
                    vIPI: 0,
                    vNF: total,
                    vBC: 0,
                    vICMS: 0,
                    vBCST: 0,
                    vICMSST: 0,
                    vII: 0,
                    vPIS: 0,
                    vCOFINS: 0,
                    vOutro: 0
                },
                items,
                operationId: linkedOperationId || null,
                operationPedido: linked?.pedido || '',
                operationLocal: linked?.local || ''
            });
            setShowPreview(true);
        } catch (err) {
            alert(`Erro ao importar invoice: ${err?.message || String(err)}`);
        } finally {
            setImportando(false);
        }
    };

    const TabButton = ({ id, label }) => (
        <button 
            onClick={() => setActiveTab(id)}
            className={`px-6 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === id ? 'bg-white text-blue-600 border-b-2 border-blue-600' : 'bg-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
        >
            {label}
        </button>
    );

    return (
        <div className="flex flex-col h-full bg-[#f8fafc] gap-6 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Gestão de Entradas</h1>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.3em] mt-1">Controle de notas fiscais e mercadorias</p>
                </div>
                <div className="flex gap-3 items-end">
                    <div className="min-w-[260px]">
                        <ClassicSelect
                            label="Vínculo Container em Trânsito"
                            value={linkedOperationId}
                            options={[
                                { value: '', label: 'Sem vínculo' },
                                ...containerOps.map((op) => ({ value: String(op.id), label: `${op.pedido || 'Sem pedido'} - ${op.local || 'Sem local'}` }))
                            ]}
                            onChange={setLinkedOperationId}
                        />
                    </div>
                    <input
                        ref={xmlInputRef}
                        type="file"
                        accept=".xml"
                        multiple
                        className="hidden"
                        onChange={handleImportXmlFiles}
                        disabled={importando}
                    />
                    <input
                        ref={invoiceInputRef}
                        type="file"
                        accept=".xlsx,.xls"
                        className="hidden"
                        onChange={handleImportInvoiceFiles}
                        disabled={importando}
                    />
                    <button
                        onClick={() => xmlInputRef.current?.click()}
                        disabled={importando}
                        className={`px-6 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 ${importando ? 'opacity-70 cursor-not-allowed' : 'hover:bg-slate-50'}`}
                    >
                        <Icon name="upload" size={16} /> Importar XML
                    </button>
                    <button
                        onClick={() => invoiceInputRef.current?.click()}
                        disabled={importando}
                        className={`px-6 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 ${importando ? 'opacity-70 cursor-not-allowed' : 'hover:bg-slate-50'}`}
                    >
                        <Icon name="upload" size={16} /> Importar Invoice
                    </button>
                    <button
                        onClick={() => selectedEntry && typeof onEstornarEntrada === 'function' && onEstornarEntrada(selectedEntry.id)}
                        disabled={!selectedEntry || String(selectedEntry?.statusDocumento || '').toUpperCase() === 'ESTORNADA'}
                        className={`px-6 py-2.5 bg-white border rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 ${
                            !selectedEntry || String(selectedEntry?.statusDocumento || '').toUpperCase() === 'ESTORNADA'
                                ? 'border-slate-200 text-slate-300 cursor-not-allowed'
                                : 'border-amber-200 text-amber-700 hover:bg-amber-50'
                        }`}
                    >
                        <Icon name="rotate-ccw" size={16} /> Estornar Entrada
                    </button>
                    <button
                        onClick={() => selectedEntry && typeof onExcluirEntrada === 'function' && onExcluirEntrada(selectedEntry.id)}
                        disabled={!selectedEntry}
                        className={`px-6 py-2.5 bg-white border rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 ${
                            !selectedEntry ? 'border-slate-200 text-slate-300 cursor-not-allowed' : 'border-red-200 text-red-600 hover:bg-red-50'
                        }`}
                    >
                        <Icon name="trash-2" size={16} /> Excluir
                    </button>
                    <button 
                        onClick={() => setIsAddModalOpen(true)}
                        className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-all shadow-md shadow-blue-100 flex items-center gap-2"
                    >
                        <Icon name="plus" size={16} /> Nova Nota
                    </button>
                </div>
            </div>
            {showPreview && preview && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-[300]">
                    <div className="bg-white w-full max-w-[1100px] rounded-3xl border border-slate-200 shadow-2xl overflow-hidden">
                        <div className="px-8 py-5 border-b border-slate-100 flex justify-between items-center">
                            <div>
                                <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Prévia de Importação</h2>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Revise antes de confirmar</p>
                            </div>
                            <button onClick={() => setShowPreview(false)} className="hover:bg-slate-100 p-2 rounded-xl transition-all text-slate-400 hover:text-slate-900">
                                <Icon name="x" size={24} />
                            </button>
                        </div>
                        <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <ClassicInput label="Número N.F." value={preview.nNF} readOnly />
                                    <ClassicInput label="Emitente" value={preview.emit?.nome || ''} readOnly />
                                    <ClassicInput label="CNPJ Emitente" value={preview.emit?.cnpj || ''} readOnly />
                                    <ClassicInput label="Valor Total" value={`R$ ${preview.totais?.vNF?.toLocaleString('pt-BR')}`} readOnly />
                                </div>
                                <div className="space-y-2">
                                    <ClassicInput label="Chave de Acesso" value={preview.chaveAcesso || ''} readOnly />
                                    <ClassicInput label="Protocolo" value={preview.protocolo || ''} readOnly />
                                    <ClassicInput label="Situação" value={preview.situacao || ''} readOnly />
                                    <ClassicInput label="Data Emissão" value={formatarData(preview.dhEmi)} readOnly />
                                </div>
                            </div>
                            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Itens ({(preview.items || []).length})</span>
                                    <div className="flex items-center gap-4">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1 flex items-center gap-2">
                                            <input type="checkbox" checked={importOpts.atualizarEstoque} onChange={(e) => setImportOpts({...importOpts, atualizarEstoque: e.target.checked})} />
                                            Atualizar estoque
                                        </label>
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1 flex items-center gap-2">
                                            <input type="checkbox" checked={importOpts.gerarFinanceiro} onChange={(e) => setImportOpts({...importOpts, gerarFinanceiro: e.target.checked})} />
                                            Gerar contas a pagar
                                        </label>
                                    </div>
                                </div>
                                <div className="overflow-x-auto mt-3">
                                    <table className="min-w-full">
                                        <thead>
                                            <tr className="bg-white">
                                                <ClassicTh>Cód. Forn</ClassicTh>
                                                <ClassicTh>EAN/GTIN</ClassicTh>
                                                <ClassicTh>Descrição</ClassicTh>
                                                <ClassicTh>NCM</ClassicTh>
                                                <ClassicTh>CFOP</ClassicTh>
                                                <ClassicTh>Un</ClassicTh>
                                                <ClassicTh>Qtd</ClassicTh>
                                                <ClassicTh>V. Unit</ClassicTh>
                                                <ClassicTh>V. Total</ClassicTh>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {(preview.items || []).map((item, idx) => (
                                                <tr key={idx}>
                                                    <ClassicTd className="font-bold text-slate-400 data-mono">{item.cProd}</ClassicTd>
                                                    <ClassicTd className="text-slate-500 data-mono">{item.cEAN || item.cEANTrib || '—'}</ClassicTd>
                                                    <ClassicTd className="uppercase font-black text-slate-700">{item.xProd}</ClassicTd>
                                                    <ClassicTd className="text-slate-400">{item.NCM}</ClassicTd>
                                                    <ClassicTd className="text-slate-400">{item.CFOP}</ClassicTd>
                                                    <ClassicTd><span className="px-2 py-0.5 bg-slate-100 rounded text-[9px] font-black">{item.uCom}</span></ClassicTd>
                                                    <ClassicTd className="font-black text-slate-900">{item.qCom}</ClassicTd>
                                                    <ClassicTd className="font-bold text-slate-600">R$ {item.vUnCom.toLocaleString('pt-BR')}</ClassicTd>
                                                    <ClassicTd className="font-black text-blue-600">R$ {item.vProd.toLocaleString('pt-BR')}</ClassicTd>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                        <div className="px-8 py-4 border-t border-slate-100 flex justify-end gap-3">
                            <button onClick={() => setShowPreview(false)} className="px-8 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all">
                                Cancelar
                            </button>
                            <button
                                onClick={() => {
                                    if (!preview) return;
                                    if (typeof onImportStock !== 'function') {
                                        alert('Importação indisponível: o sistema não recebeu o handler de entrada.');
                                        return;
                                    }
                                    if (preview.emit?.cnpj && !suppliersByCnpj.has(String(preview.emit.cnpj).trim())) {
                                        if (typeof onAddSupplier === 'function') {
                                            onAddSupplier({
                                                id: Date.now() + Math.random(),
                                                name: preview.emit.nome,
                                                cnpj: preview.emit.cnpj,
                                                ie: preview.emit.ie,
                                                uf: preview.emit.uf,
                                                city: preview.emit.mun,
                                                category: 'Importado via XML'
                                            });
                                        }
                                    }
                                    const entries = (preview.items || []).map((item) => ({
                                        productId: null,
                                        productName: item.xProd,
                                        quantity: item.qCom,
                                        price: item.vUnCom,
                                        ncm: item.NCM,
                                        codInterno: item.cProd,
                                        barras: item.cEAN || item.cEANTrib || '',
                                        unit: item.uCom
                                    }));
                                    onImportStock(entries, {
                                        nNF: preview.nNF,
                                        emitNome: preview.emit.nome,
                                        emitCNPJ: preview.emit.cnpj,
                                        emitIE: preview.emit.ie,
                                        emitUF: preview.emit.uf,
                                        dhEmi: preview.dhEmi,
                                        natOp: preview.natOp,
                                        mod: preview.mod,
                                        serie: preview.serie,
                                        chaveAcesso: preview.chaveAcesso,
                                        protocolo: preview.protocolo,
                                        situacao: preview.situacao,
                                        dhRecbto: preview.dhRecbto,
                                        digVal: preview.digVal,
                                        cUF: preview.cUF,
                                        tpNF: preview.tpNF,
                                        idDest: preview.idDest,
                                        tpAmb: preview.tpAmb,
                                        finNFe: preview.finNFe,
                                        verProc: preview.verProc,
                                        dest: preview.dest,
                                        transp: preview.transp,
                                        pag: preview.pag,
                                        infAdic: preview.infAdic,
                                        respTec: preview.respTec,
                                        totais: preview.totais,
                                        items: preview.items,
                                        dateImport: new Date().toISOString(),
                                        operationId: preview.operationId || null,
                                        operationPedido: preview.operationPedido || '',
                                        operationLocal: preview.operationLocal || ''
                                    }, importOpts);
                                    setShowPreview(false);
                                    setPreview(null);
                                }}
                                className="px-10 py-3 bg-blue-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
                            >
                                Confirmar Importação
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Top Table Card */}
            <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden flex flex-col h-[300px]">
                <div className="bg-slate-50/50 px-6 py-3 border-b border-slate-100 flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Documentos Recentes ({nfeHistory.length})</span>
                    <div className="flex gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(37,99,235,0.4)]"></div>
                    </div>
                </div>
                <div className="overflow-y-auto flex-1 custom-scrollbar">
                    <table className="w-full border-collapse">
                        <thead className="sticky top-0 z-10 bg-white">
                            <tr>
                                <ClassicTh>Número N.F.</ClassicTh>
                                <ClassicTh>Data Emissão</ClassicTh>
                                <ClassicTh>Fornecedor</ClassicTh>
                                <ClassicTh>Valor Total</ClassicTh>
                                <ClassicTh>Status</ClassicTh>
                                <ClassicTh>Estoque</ClassicTh>
                                <ClassicTh>Financeiro</ClassicTh>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {nfeHistory.map((nfe, i) => (
                                <tr 
                                    key={i} 
                                    onClick={() => setSelectedEntry(nfe)}
                                    className={`cursor-pointer hover:bg-blue-50/50 transition-colors ${String(selectedEntry?.id || '') === String(nfe?.id || '') ? 'bg-blue-50' : ''}`}
                                >
                                    <ClassicTd className="font-black text-slate-900">{nfe.nNF}</ClassicTd>
                                    <ClassicTd className="text-slate-500 font-bold">{formatarData(nfe.dhEmi)}</ClassicTd>
                                    <ClassicTd className="uppercase font-bold text-slate-700">{nfe.emitNome}</ClassicTd>
                                    <ClassicTd className="font-black text-blue-600 data-mono">R$ {nfe.totais.vNF.toLocaleString('pt-BR')}</ClassicTd>
                                    <ClassicTd>
                                        {String(nfe.statusDocumento || '').toUpperCase() === 'ESTORNADA' ? (
                                            <span className="px-2 py-0.5 rounded bg-red-100 text-red-600 text-[9px] font-black uppercase">ESTORNADA</span>
                                        ) : (
                                            <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-600 text-[9px] font-black uppercase">PROCESSADA</span>
                                        )}
                                    </ClassicTd>
                                    <ClassicTd>
                                        {String(nfe.statusDocumento || '').toUpperCase() === 'ESTORNADA' ? (
                                            <Icon name="x" size={16} className="text-red-500" />
                                        ) : (
                                            <Icon name="check" size={16} className="text-emerald-500" />
                                        )}
                                    </ClassicTd>
                                    <ClassicTd>
                                        {String(nfe.statusDocumento || '').toUpperCase() === 'ESTORNADA' ? (
                                            <Icon name="x" size={16} className="text-red-500" />
                                        ) : (
                                            <Icon name="check" size={16} className="text-emerald-500" />
                                        )}
                                    </ClassicTd>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Details Section */}
            <div className="bg-white border border-slate-100 rounded-3xl shadow-sm flex-1 flex flex-col overflow-hidden">
                <div className="flex border-b border-slate-100 px-6 bg-slate-50/30">
                    <TabButton id="informacoes" label="Resumo da Nota" />
                    <TabButton id="itens" label="Itens da Nota" />
                    <TabButton id="estoque" label="Movimentação" />
                    <TabButton id="financeiro" label="Financeiro" />
                </div>

                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-white">
                    {selectedEntry ? (
                        <div className="animate-in slide-in-from-bottom-2 duration-500">
                            {activeTab === 'informacoes' && (
                                <div className="space-y-8">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-6">
                                            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Logística de Entrada</h4>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="col-span-2">
                                                    <ClassicInput label="Loja de Destino" value={`${selectedEntry.mod} - ${selectedEntry.emitNome}`} readOnly />
                                                </div>
                                                <ClassicInput label="Local de Estoque" value="ALMOXARIFADO CENTRAL" readOnly />
                                                <ClassicInput label="Tipo de Operação" value="ENTRADA DE COMPRA" readOnly />
                                            </div>
                                        </div>

                                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Parâmetros do Documento</h4>
                                            <div className="grid grid-cols-2 gap-3">
                                                <ClassicCheckbox label="Gerar Contas a Pagar" checked={true} />
                                                <ClassicCheckbox label="Atualizar Estoque" checked={true} />
                                                <ClassicCheckbox label="Creditar Impostos" checked={true} />
                                                <ClassicCheckbox label="Fechar Documento" checked={true} />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
                                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Dados da NF-e</h4>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="col-span-2">
                                                    <ClassicInput label="Chave de Acesso" value={selectedEntry.chaveAcesso || ''} readOnly />
                                                </div>
                                                <ClassicInput label="Protocolo" value={selectedEntry.protocolo || ''} readOnly />
                                                <ClassicInput label="Situação" value={selectedEntry.situacao || ''} readOnly />
                                                <ClassicInput label="Data/Hora Emissão" value={formatarDataHora(selectedEntry.dhEmi)} readOnly />
                                                <ClassicInput label="Data/Hora Recebimento" value={formatarDataHora(selectedEntry.dhRecbto)} readOnly />
                                                <ClassicInput label="Natureza da Operação" value={selectedEntry.natOp || ''} readOnly />
                                                <ClassicInput label="Modelo / Série" value={`${selectedEntry.mod || ''} / ${selectedEntry.serie || ''}`} readOnly />
                                                <ClassicInput label="Ambiente" value={selectedEntry.tpAmb === '1' ? 'Produção' : selectedEntry.tpAmb === '2' ? 'Homologação' : (selectedEntry.tpAmb || '')} readOnly />
                                            </div>
                                        </div>

                                        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
                                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Informações Complementares</h4>
                                            <div className="space-y-4">
                                                <div>
                                                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1 mb-1">Complementar</div>
                                                    <textarea
                                                        value={selectedEntry.infAdic?.infCpl || ''}
                                                        readOnly
                                                        className="w-full min-h-[110px] bg-white border border-slate-300 text-slate-900 px-3 py-2 text-xs focus:border-slate-500 focus:ring-4 focus:ring-slate-500/10 outline-none rounded-xl transition-all"
                                                    />
                                                </div>
                                                <div>
                                                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1 mb-1">Fisco</div>
                                                    <textarea
                                                        value={selectedEntry.infAdic?.infAdFisco || ''}
                                                        readOnly
                                                        className="w-full min-h-[80px] bg-white border border-slate-300 text-slate-900 px-3 py-2 text-xs focus:border-slate-500 focus:ring-4 focus:ring-slate-500/10 outline-none rounded-xl transition-all"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="relative border border-blue-100 p-6 rounded-2xl bg-blue-50/30">
                                        <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mb-6">Consolidação Financeira</h4>
                                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                            <ClassicInput label="Base ICMS" value={`R$ ${Number(selectedEntry?.totais?.vBC || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} />
                                            <ClassicInput label="Valor ICMS" value={`R$ ${Number(selectedEntry?.totais?.vICMS || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} />
                                            <ClassicInput label="Total Produtos" value={`R$ ${Number(selectedEntry?.totais?.vProdTot || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} />
                                            <ClassicInput label="Frete / Seguro" value={`R$ ${Number((selectedEntry?.totais?.vFrete || 0) + (selectedEntry?.totais?.vSeg || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} />
                                            <div className="bg-white p-2 rounded-xl border border-blue-200 shadow-sm">
                                                <ClassicInput label="Valor Total N.F." value={`R$ ${Number(selectedEntry?.totais?.vNF || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} className="font-black text-blue-600" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'itens' && (
                                <div className="rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                                    <table className="w-full border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50">
                                                <ClassicTh>Cód. Forn</ClassicTh>
                                                <ClassicTh>EAN/GTIN</ClassicTh>
                                                <ClassicTh>Descrição do Produto</ClassicTh>
                                                <ClassicTh>NCM</ClassicTh>
                                                <ClassicTh>CFOP</ClassicTh>
                                                <ClassicTh>Un</ClassicTh>
                                                <ClassicTh>Qtd</ClassicTh>
                                                <ClassicTh>CX/C</ClassicTh>
                                                <ClassicTh>V. Unit</ClassicTh>
                                                <ClassicTh>V. Total</ClassicTh>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {selectedEntry.items.map((item, idx) => (
                                                <tr 
                                                    key={idx} 
                                                    onDoubleClick={() => setEditingItem({ ...item, _itemIndex: idx })}
                                                    className="hover:bg-blue-50/30 transition-colors cursor-pointer group"
                                                >
                                                    <ClassicTd className="font-bold text-slate-400 data-mono">{item.cProd}</ClassicTd>
                                                    <ClassicTd className="text-slate-500 data-mono">{item.cEAN || item.cEANTrib || '—'}</ClassicTd>
                                                    <ClassicTd className="uppercase font-black text-slate-700 group-hover:text-blue-600">{item.xProd}</ClassicTd>
                                                    <ClassicTd className="text-slate-400">{item.NCM}</ClassicTd>
                                                    <ClassicTd className="text-slate-400">{item.CFOP}</ClassicTd>
                                                    <ClassicTd><span className="px-2 py-0.5 bg-slate-100 rounded text-[9px] font-black">{item.uCom}</span></ClassicTd>
                                                    <ClassicTd className="font-black text-slate-900">{item.qCom}</ClassicTd>
                                                    <ClassicTd className="text-slate-500 font-bold">{item.caixaCom || '-'}</ClassicTd>
                                                    <ClassicTd className="font-bold text-slate-600">R$ {item.vUnCom.toLocaleString('pt-BR')}</ClassicTd>
                                                    <ClassicTd className="font-black text-blue-600">R$ {item.vProd.toLocaleString('pt-BR')}</ClassicTd>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* Additional tabs (estoque, financeiro) can follow the same pattern if needed */}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full opacity-30 py-12">
                            <Icon name="import-nfe" size={64} className="text-slate-300 mb-4" />
                            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Selecione uma nota para auditoria</p>
                        </div>
                    )}
                </div>
            </div>
            {isAddModalOpen && (
                <NFeAddModal 
                    onSave={(data) => { setIsAddModalOpen(false); alert("Nota Fiscal salva com sucesso!"); }} 
                    onCancel={() => setIsAddModalOpen(false)} 
                    suppliers={suppliers} 
                />
            )}
            {editingItem && (
                <NFeItemModal 
                    item={editingItem} 
                    onSave={(data) => {
                        if (selectedEntry && typeof onAtualizarItemEntrada === 'function') {
                            onAtualizarItemEntrada(selectedEntry.id, data._itemIndex, data);
                        }
                        setEditingItem(null);
                        alert('Item atualizado!');
                    }} 
                    onCancel={() => setEditingItem(null)} 
                />
            )}
        </div>
    );
};

export default NFeEntryModule;
