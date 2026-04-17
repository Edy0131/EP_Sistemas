import React, { useState } from 'react';
import { Icon } from './Icon';

const TotalLine = ({ label, value, color = "text-indigo-100" }) => (
    <div className="flex justify-between items-center text-sm">
        <span className="opacity-60 font-medium">{label}</span>
        <span className={`font-black ${color}`}>R$ {value.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
    </div>
);

const XMLImportModule = ({ products, onImportStock, nfeHistory, suppliers, onAddSupplier }) => {
    const [xmlData, setXmlData] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [viewHistory, setViewHistory] = useState(false);
    const [importOptions, setImportOptions] = useState({
        atualizarEstoque: true,
        gerarFinanceiro: true
    });

    const normalizeBarcode = (value) => {
        const raw = String(value || '').trim();
        if (!raw) return '';
        const upper = raw.toUpperCase();
        if (upper.includes('SEM GTIN') || upper === 'SEM' || upper === 'NAO INFORMADO' || upper === 'NÃO INFORMADO') return '';
        return raw;
    };

    const handleXmlUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsProcessing(true);
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(event.target.result, "text/xml");
                
                // --- Extração Completa de Dados da NF-e ---
                const getText = (node, tag) => node?.getElementsByTagName(tag)?.[0]?.textContent || '';
                const getAttr = (node, name) => node?.getAttribute?.(name) || '';
                const ide = xmlDoc.getElementsByTagName("ide")[0];
                const nNF = getText(ide, "nNF");
                const dhEmi = getText(ide, "dhEmi") || getText(ide, "dEmi");
                const dhSaiEnt = getText(ide, "dhSaiEnt") || getText(ide, "dSaiEnt");
                const natOp = getText(ide, "natOp");
                const mod = getText(ide, "mod");
                const serie = getText(ide, "serie");
                const cUF = getText(ide, "cUF");
                const tpNF = getText(ide, "tpNF");
                const idDest = getText(ide, "idDest");
                const cMunFG = getText(ide, "cMunFG");
                const tpImp = getText(ide, "tpImp");
                const tpEmis = getText(ide, "tpEmis");
                const tpAmb = getText(ide, "tpAmb");
                const finNFe = getText(ide, "finNFe");
                const indFinal = getText(ide, "indFinal");
                const indPres = getText(ide, "indPres");
                const verProc = getText(ide, "verProc");

                const emit = xmlDoc.getElementsByTagName("emit")[0];
                const emitNome = getText(emit, "xNome");
                const emitCNPJ = getText(emit, "CNPJ");
                const emitIE = getText(emit, "IE");
                const emitCRT = getText(emit, "CRT");
                const emitEnd = emit.getElementsByTagName("enderEmit")[0];
                const emitUF = getText(emitEnd, "UF");
                const emitMun = getText(emitEnd, "xMun");

                const dest = xmlDoc.getElementsByTagName("dest")[0];
                const destNome = getText(dest, "xNome");
                const destCNPJ = getText(dest, "CNPJ");
                const destCPF = getText(dest, "CPF");
                const destIdEstrangeiro = getText(dest, "idEstrangeiro");
                const destEmail = getText(dest, "email");
                const enderDest = dest?.getElementsByTagName("enderDest")?.[0];
                const destUF = getText(enderDest, "UF");
                const destMun = getText(enderDest, "xMun");
                const destPais = getText(enderDest, "xPais");

                const infNFe = xmlDoc.getElementsByTagName("infNFe")[0];
                const infNFeId = getAttr(infNFe, "Id");

                const protNFe = xmlDoc.getElementsByTagName("protNFe")[0];
                const infProt = protNFe?.getElementsByTagName("infProt")?.[0];
                const chNFe = getText(infProt, "chNFe");
                const nProt = getText(infProt, "nProt");
                const cStat = getText(infProt, "cStat");
                const xMotivo = getText(infProt, "xMotivo");
                const dhRecbto = getText(infProt, "dhRecbto");
                const digVal = getText(infProt, "digVal");
                const chaveAcesso = (chNFe || infNFeId.replace(/^NFe/i, '')).trim();
                const situacao = cStat ? `${cStat} - ${xMotivo || ''}`.trim() : "";

                const total = xmlDoc.getElementsByTagName("total")[0];
                const icmsTot = total.getElementsByTagName("ICMSTot")[0];
                const vBC = parseFloat(icmsTot.getElementsByTagName("vBC")[0]?.textContent || 0);
                const vICMS = parseFloat(icmsTot.getElementsByTagName("vICMS")[0]?.textContent || 0);
                const vProdTot = parseFloat(icmsTot.getElementsByTagName("vProd")[0]?.textContent || 0);
                const vFrete = parseFloat(icmsTot.getElementsByTagName("vFrete")[0]?.textContent || 0);
                const vSeg = parseFloat(icmsTot.getElementsByTagName("vSeg")[0]?.textContent || 0);
                const vDesc = parseFloat(icmsTot.getElementsByTagName("vDesc")[0]?.textContent || 0);
                const vIPI = parseFloat(icmsTot.getElementsByTagName("vIPI")[0]?.textContent || 0);
                const vNF = parseFloat(icmsTot.getElementsByTagName("vNF")[0]?.textContent || 0);
                const vPIS = parseFloat(icmsTot.getElementsByTagName("vPIS")[0]?.textContent || 0);
                const vCOFINS = parseFloat(icmsTot.getElementsByTagName("vCOFINS")[0]?.textContent || 0);
                const vII = parseFloat(icmsTot.getElementsByTagName("vII")[0]?.textContent || 0);
                const vOutro = parseFloat(icmsTot.getElementsByTagName("vOutro")[0]?.textContent || 0);

                const transp = xmlDoc.getElementsByTagName("transp")[0];
                const modFrete = getText(transp, "modFrete");
                const transporta = transp?.getElementsByTagName("transporta")?.[0];
                const transportadora = getText(transporta, "xNome") || "Não informada";
                const transportadoraDoc = getText(transporta, "CNPJ") || getText(transporta, "CPF");
                const transportadoraUF = getText(transporta, "UF");
                const transportadoraMun = getText(transporta, "xMun");
                const volumes = Array.from(transp?.getElementsByTagName("vol") || []).map((vol) => ({
                    qVol: parseFloat(getText(vol, "qVol") || 0),
                    esp: getText(vol, "esp"),
                    pesoL: parseFloat(getText(vol, "pesoL") || 0),
                    pesoB: parseFloat(getText(vol, "pesoB") || 0)
                }));

                const pag = xmlDoc.getElementsByTagName("pag")[0];
                const detPagList = Array.from(pag?.getElementsByTagName("detPag") || []).map((detPag) => ({
                    indPag: getText(detPag, "indPag"),
                    tPag: getText(detPag, "tPag"),
                    vPag: parseFloat(getText(detPag, "vPag") || 0)
                }));

                const infAdic = xmlDoc.getElementsByTagName("infAdic")[0];
                const infCpl = getText(infAdic, "infCpl") || "";
                const infAdFisco = getText(infAdic, "infAdFisco") || "";

                const infRespTec = xmlDoc.getElementsByTagName("infRespTec")[0];
                const respTec = {
                    cnpj: getText(infRespTec, "CNPJ"),
                    contato: getText(infRespTec, "xContato"),
                    email: getText(infRespTec, "email"),
                    fone: getText(infRespTec, "fone")
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

                const items = xmlDoc.getElementsByTagName("det");
                const extractedItems = Array.from(items).map(item => {
                    const prod = item.getElementsByTagName("prod")[0];
                    const imposto = item.getElementsByTagName("imposto")[0];
                    const cEAN = normalizeBarcode(prod.getElementsByTagName("cEAN")[0]?.textContent);
                    const cEANTrib = normalizeBarcode(prod.getElementsByTagName("cEANTrib")[0]?.textContent);
                    const icms = imposto?.getElementsByTagName("ICMS")?.[0];
                    const ipi = imposto?.getElementsByTagName("IPI")?.[0];
                    const pis = imposto?.getElementsByTagName("PIS")?.[0];
                    const cofins = imposto?.getElementsByTagName("COFINS")?.[0];
                    const ii = imposto?.getElementsByTagName("II")?.[0];
                    
                    return {
                        nItem: item.getAttribute("nItem"),
                        cProd: prod.getElementsByTagName("cProd")[0]?.textContent,
                        cEAN,
                        cEANTrib,
                        xProd: prod.getElementsByTagName("xProd")[0]?.textContent,
                        NCM: prod.getElementsByTagName("NCM")[0]?.textContent,
                        CFOP: prod.getElementsByTagName("CFOP")[0]?.textContent,
                        uCom: prod.getElementsByTagName("uCom")[0]?.textContent,
                        qCom: parseFloat(prod.getElementsByTagName("qCom")[0]?.textContent || 0),
                        vUnCom: parseFloat(prod.getElementsByTagName("vUnCom")[0]?.textContent || 0),
                        vProd: parseFloat(prod.getElementsByTagName("vProd")[0]?.textContent || 0),
                        vDesc: parseFloat(prod.getElementsByTagName("vDesc")[0]?.textContent || 0),
                        uTrib: prod.getElementsByTagName("uTrib")[0]?.textContent || "",
                        qTrib: parseFloat(prod.getElementsByTagName("qTrib")[0]?.textContent || 0),
                        vUnTrib: parseFloat(prod.getElementsByTagName("vUnTrib")[0]?.textContent || 0),
                        vFrete: parseFloat(prod.getElementsByTagName("vFrete")[0]?.textContent || 0),
                        vSeg: parseFloat(prod.getElementsByTagName("vSeg")[0]?.textContent || 0),
                        vOutro: parseFloat(prod.getElementsByTagName("vOutro")[0]?.textContent || 0),
                        imposto: {
                            icms: parseFirstChildObject(icms),
                            ipi: parseFirstChildObject(ipi),
                            pis: parseFirstChildObject(pis),
                            cofins: parseFirstChildObject(cofins),
                            ii: ii ? {
                                vBC: getText(ii, "vBC"),
                                vDespAdu: getText(ii, "vDespAdu"),
                                vII: getText(ii, "vII"),
                                vIOF: getText(ii, "vIOF")
                            } : null
                        }
                    };
                });

                setXmlData({ 
                    nNF, dhEmi, natOp, mod, serie, cUF, tpNF, idDest, cMunFG, tpImp, tpEmis, tpAmb, finNFe, indFinal, indPres,
                    emit: { nome: emitNome, cnpj: emitCNPJ, ie: emitIE, crt: emitCRT, uf: emitUF, mun: emitMun },
                    dest: { nome: destNome, cnpj: destCNPJ, cpf: destCPF, idEstrangeiro: destIdEstrangeiro, email: destEmail, uf: destUF, mun: destMun, pais: destPais },
                    chaveAcesso,
                    protocolo: nProt,
                    situacao,
                    dhRecbto,
                    digVal,
                    verProc,
                    dhSaiEnt,
                    totais: { vBC, vICMS, vProdTot, vFrete, vSeg, vDesc, vIPI, vNF, vPIS, vCOFINS, vII, vOutro },
                    transp: { modFrete, transportadora, transportadoraDoc, transportadoraUF, transportadoraMun, volumes },
                    pag: { detPag: detPagList },
                    infAdic: { infCpl, infAdFisco },
                    respTec,
                    items: extractedItems,
                    xmlRaw: event.target.result
                });
            } catch (err) {
                alert("Erro ao processar XML completo: " + err.message);
            } finally {
                setIsProcessing(false);
            }
        };
        reader.readAsText(file);
    };

    const confirmImport = () => {
        if (!xmlData) return;
        
        const supplierExists = suppliers.find(s => s.cnpj === xmlData.emit.cnpj);
        if (!supplierExists) {
            onAddSupplier({
                id: Date.now(),
                name: xmlData.emit.nome,
                cnpj: xmlData.emit.cnpj,
                ie: xmlData.emit.ie,
                uf: xmlData.emit.uf,
                city: xmlData.emit.mun,
                category: 'Importado via XML'
            });
        }

        const entries = xmlData.items.map(item => {
            const barras = item.cEAN || item.cEANTrib || '';
            const existingProduct = products.find(p => {
                const pBarras = String(p.barras || '').trim();
                const pCod = String(p.codInterno || '').trim();
                const pName = String(p.name || '').trim().toLowerCase();
                const itemName = String(item.xProd || '').trim().toLowerCase();
                if (barras && pBarras && pBarras === barras) return true;
                if (pCod && pCod === String(item.cProd || '').trim()) return true;
                if (pName && itemName && pName === itemName) return true;
                return false;
            });

            return {
                productId: existingProduct?.id || null,
                productName: item.xProd,
                quantity: item.qCom,
                price: item.vUnCom,
                ncm: item.NCM,
                codInterno: item.cProd,
                barras,
                unit: item.uCom
            };
        });

        onImportStock(entries, {
            nNF: xmlData.nNF,
            emitNome: xmlData.emit.nome,
            emitCNPJ: xmlData.emit.cnpj,
            emitIE: xmlData.emit.ie,
            emitCRT: xmlData.emit.crt,
            vNF: xmlData.totais.vNF,
            dhEmi: xmlData.dhEmi,
            natOp: xmlData.natOp,
            mod: xmlData.mod,
            serie: xmlData.serie,
            cUF: xmlData.cUF,
            tpNF: xmlData.tpNF,
            idDest: xmlData.idDest,
            tpAmb: xmlData.tpAmb,
            finNFe: xmlData.finNFe,
            indFinal: xmlData.indFinal,
            indPres: xmlData.indPres,
            tpImp: xmlData.tpImp,
            tpEmis: xmlData.tpEmis,
            cMunFG: xmlData.cMunFG,
            chaveAcesso: xmlData.chaveAcesso,
            protocolo: xmlData.protocolo,
            situacao: xmlData.situacao,
            dhRecbto: xmlData.dhRecbto,
            digVal: xmlData.digVal,
            verProc: xmlData.verProc,
            dhSaiEnt: xmlData.dhSaiEnt,
            dest: xmlData.dest,
            transp: xmlData.transp,
            pag: xmlData.pag,
            infAdic: xmlData.infAdic,
            respTec: xmlData.respTec,
            totais: xmlData.totais,
            items: xmlData.items,
            dateImport: new Date().toISOString()
        }, importOptions);
        
        setXmlData(null);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Painel de Notas Fiscais</h1>
                    <p className="text-sm text-slate-500">Gestão completa de entradas via XML (NF-e)</p>
                </div>
                <button 
                    onClick={() => setViewHistory(!viewHistory)}
                    className="bg-white border border-slate-300 px-4 py-2 rounded-lg text-slate-700 font-bold flex items-center gap-2 hover:bg-slate-50 transition shadow-sm"
                >
                    <Icon name={viewHistory ? "upload" : "history"} size={18} />
                    {viewHistory ? "Nova Importação" : "Histórico de Notas"}
                </button>
            </div>

            {viewHistory ? (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">Data</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">№ Nota</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">Fornecedor</th>
                                <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-widest">Total</th>
                                <th className="px-6 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-widest">Status</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {nfeHistory.length === 0 ? (
                                <tr><td colSpan="5" className="px-6 py-12 text-center text-slate-400">Nenhuma nota fiscal registrada.</td></tr>
                            ) : (
                                nfeHistory.slice().reverse().map((nfe, i) => (
                                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 font-medium">
                                            {new Date(nfe.dateImport).toLocaleDateString('pt-BR')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-black text-indigo-600">
                                            {nfe.nNF}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <p className="text-sm font-bold text-slate-900">{nfe.emitNome}</p>
                                            <p className="text-[10px] text-slate-500 font-mono">{nfe.emitCNPJ}</p>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-black text-slate-900">
                                            R$ {nfe.vNF.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-black uppercase">Processada</span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="space-y-6">
                    {!xmlData ? (
                        <div className="bg-white border-2 border-dashed border-slate-300 rounded-2xl p-16 text-center hover:border-indigo-400 transition-all cursor-pointer group relative shadow-inner">
                            <input type="file" accept=".xml" onChange={handleXmlUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                            <div className="flex flex-col items-center gap-4">
                                <div className="p-6 bg-indigo-50 text-indigo-600 rounded-full group-hover:scale-110 transition-transform shadow-sm">
                                    <Icon name="upload" size={64} />
                                </div>
                                <div>
                                    <p className="text-xl font-black text-slate-800 tracking-tight">Importar XML de NF-e</p>
                                    <p className="text-slate-500 mt-1 max-w-sm mx-auto text-sm">Arraste o arquivo aqui para extrair automaticamente produtos, fornecedores, impostos e financeiros.</p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
                            <div className="lg:col-span-2 space-y-6">
                                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                                    <div className="flex justify-between items-start mb-6">
                                        <div>
                                            <span className="bg-indigo-600 text-white text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-widest">NF-e Mod: {xmlData.mod}</span>
                                            <h2 className="text-2xl font-black text-slate-900 mt-1">№ {xmlData.nNF} <span className="text-slate-400 font-normal text-lg">/ Série: {xmlData.serie}</span></h2>
                                            <p className="text-xs text-slate-500 font-medium">Natureza: {xmlData.natOp}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase">Data Emissão</p>
                                            <p className="text-sm font-black text-slate-700">{new Date(xmlData.dhEmi).toLocaleString('pt-BR')}</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-8 border-t border-slate-100 pt-6">
                                        <div>
                                            <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-2">Dados do Emitente</p>
                                            <p className="text-sm font-black text-slate-900 uppercase">{xmlData.emit.nome}</p>
                                            <p className="text-xs text-slate-600 mt-1">CNPJ: <span className="font-mono">{xmlData.emit.cnpj}</span></p>
                                            <p className="text-xs text-slate-600">Insc. Est.: {xmlData.emit.ie}</p>
                                            <p className="text-xs text-slate-500 mt-1">{xmlData.emit.mun} - {xmlData.emit.uf}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-2">Transporte</p>
                                            <p className="text-sm font-black text-slate-900 uppercase">{xmlData.transp.transportadora}</p>
                                            <p className="text-xs text-slate-600 mt-1">Modalidade Frete: {xmlData.transp.modFrete === '0' ? 'CIF' : 'FOB'}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                                    <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                                        <h3 className="text-xs font-black text-slate-700 uppercase tracking-widest">Itens da Nota Fiscal</h3>
                                        <span className="text-[10px] font-bold text-slate-500 bg-white px-2 py-1 rounded border border-slate-200">{xmlData.items.length} itens encontrados</span>
                                    </div>
                                    <div className="overflow-x-auto max-h-[400px]">
                                        <table className="min-w-full divide-y divide-slate-200">
                                            <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                                                <tr>
                                                    <th className="px-4 py-2 text-left text-[10px] font-black text-slate-500 uppercase">Prod.</th>
                                                    <th className="px-4 py-2 text-center text-[10px] font-black text-slate-500 uppercase">Qtd</th>
                                                    <th className="px-4 py-2 text-center text-[10px] font-black text-slate-500 uppercase">Un.</th>
                                                    <th className="px-4 py-2 text-right text-[10px] font-black text-slate-500 uppercase">Preço Un.</th>
                                                    <th className="px-4 py-2 text-right text-[10px] font-black text-slate-500 uppercase">Total</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-slate-200">
                                                {xmlData.items.map((item, i) => (
                                                    <tr key={i} className="hover:bg-indigo-50/30 transition-colors">
                                                        <td className="px-4 py-3">
                                                            <p className="text-[11px] font-black text-slate-900 leading-tight">{item.xProd}</p>
                                                            <div className="flex gap-2 mt-1">
                                                                <span className="text-[9px] text-slate-400 font-mono bg-slate-100 px-1 rounded">CÓD: {item.cProd}</span>
                                                                <span className="text-[9px] text-slate-400 font-mono bg-slate-100 px-1 rounded">NCM: {item.NCM}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 text-center text-xs font-black text-indigo-700">{item.qCom}</td>
                                                        <td className="px-4 py-3 text-center text-[10px] font-bold text-slate-500 uppercase">{item.uCom}</td>
                                                        <td className="px-4 py-3 text-right text-xs text-slate-600">R$ {item.vUnCom.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</td>
                                                        <td className="px-4 py-3 text-right text-xs font-black text-slate-900">R$ {item.vProd.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-6">
                                <div className="bg-indigo-900 text-white p-6 rounded-2xl shadow-xl shadow-indigo-200">
                                    <h3 className="text-xs font-black uppercase tracking-[0.2em] mb-6 opacity-60">Resumo Financeiro</h3>
                                    <div className="space-y-4">
                                        <TotalLine label="Produtos" value={xmlData.totais.vProdTot} />
                                        <TotalLine label="Frete (+)" value={xmlData.totais.vFrete} />
                                        <TotalLine label="Seguro (+)" value={xmlData.totais.vSeg} />
                                        <TotalLine label="IPI (+)" value={xmlData.totais.vIPI} />
                                        <TotalLine label="Desconto (-)" value={xmlData.totais.vDesc} color="text-red-300" />
                                        <div className="pt-4 mt-4 border-t border-indigo-800 flex justify-between items-end">
                                            <span className="text-xs font-black uppercase tracking-widest opacity-60">Total da Nota</span>
                                            <span className="text-3xl font-black tracking-tighter">R$ {xmlData.totais.vNF.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-4">
                                    <div className="space-y-2 border border-slate-200 rounded-xl p-3 bg-slate-50">
                                        <label className="flex items-center gap-2 text-[11px] font-bold text-slate-700 uppercase tracking-wide cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={importOptions.atualizarEstoque}
                                                onChange={(e) => setImportOptions(prev => ({ ...prev, atualizarEstoque: e.target.checked }))}
                                            />
                                            Atualizar estoque
                                        </label>
                                        <label className="flex items-center gap-2 text-[11px] font-bold text-slate-700 uppercase tracking-wide cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={importOptions.gerarFinanceiro}
                                                onChange={(e) => setImportOptions(prev => ({ ...prev, gerarFinanceiro: e.target.checked }))}
                                            />
                                            Lançar no financeiro
                                        </label>
                                    </div>
                                    <button 
                                        onClick={confirmImport}
                                        className="w-full bg-indigo-600 text-white font-black py-4 rounded-xl hover:bg-indigo-700 transition shadow-lg shadow-indigo-100 uppercase tracking-widest text-xs flex items-center justify-center gap-2"
                                    >
                                        <Icon name="check" size={20} />
                                        Confirmar Entrada
                                    </button>
                                    <button 
                                        onClick={() => setXmlData(null)}
                                        className="w-full bg-slate-50 text-slate-500 font-bold py-3 rounded-xl hover:bg-slate-100 transition uppercase tracking-widest text-[10px]"
                                    >
                                        Cancelar Importação
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default XMLImportModule;
