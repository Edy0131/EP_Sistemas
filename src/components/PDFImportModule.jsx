import React, { useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { Icon } from './Icon';

// Configurar o worker do PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

const PDFImportModule = ({ onImport, onCancel }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleFileSelect = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setLoading(true);
        setError(null);

        try {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            let fullText = '';

            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                const pageText = textContent.items.map(item => item.str).join(' ');
                fullText += pageText + '\n';
            }

            // Lógica de extração inteligente (RegEx)
            const data = extractDataFromText(fullText);
            onImport(data);
        } catch (err) {
            console.error('Erro ao ler PDF:', err);
            setError('Não foi possível processar este arquivo PDF. Verifique se ele não está protegido.');
        } finally {
            setLoading(false);
        }
    };

    const extractDataFromText = (text) => {
        // Tentativa de extrair Valor, Data e Nome do Fornecedor/Cliente usando padrões comuns
        
        // 1. Tentar extrair valor monetário (R$ 0.000,00)
        const valueMatch = text.match(/(?:R\$|VALOR TOTAL|TOTAL|VALOR)\s*[:\s]*([\d.,]+)/i);
        const value = valueMatch ? valueMatch[1].replace(/\./g, '').replace(',', '.') : '0.00';

        // 2. Tentar extrair data (DD/MM/AAAA ou DD/MM/AA)
        const dateMatch = text.match(/(\d{2}\/\d{2}\/\d{4}|\d{2}\/\d{2}\/\d{2})/);
        const date = dateMatch ? formatDate(dateMatch[1]) : new Date().toISOString().split('T')[0];

        // 3. Tentar extrair descrição ou nome (Pega as primeiras palavras após palavras-chave)
        const descMatch = text.match(/(?:RAZÃO SOCIAL|EMITENTE|FORNECEDOR|DESTINATÁRIO|NOME)\s*[:\s]*([A-Z0-9\s.]{5,50})/i);
        const description = descMatch ? descMatch[1].trim() : 'Documento PDF Importado';

        return {
            description: description,
            entity: description,
            value: parseFloat(value) || 0,
            dueDate: date,
            category: 'Geral',
            status: 'pending'
        };
    };

    const formatDate = (dateStr) => {
        const parts = dateStr.split('/');
        if (parts.length === 3) {
            const year = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
            return `${year}-${parts[1]}-${parts[0]}`;
        }
        return new Date().toISOString().split('T')[0];
    };

    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-[400] animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-[500px] shadow-2xl rounded-3xl overflow-hidden flex flex-col border border-slate-200">
                <div className="bg-white px-8 py-5 flex justify-between items-center border-b border-slate-100">
                    <div className="flex items-center gap-4">
                        <div className="bg-red-600 p-2.5 rounded-2xl shadow-lg shadow-red-100">
                            <Icon name="file-text" size={24} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">Importar PDF</h2>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Leitura inteligente de faturas</p>
                        </div>
                    </div>
                    <button onClick={onCancel} className="hover:bg-slate-100 p-2 rounded-xl transition-all text-slate-400 hover:text-slate-900">
                        <Icon name="x" size={24} />
                    </button>
                </div>

                <div className="p-10 space-y-8">
                    <div className="p-6 bg-red-50/50 border border-red-100 rounded-3xl flex gap-5 text-red-800">
                        <div className="p-3 bg-white rounded-2xl shadow-sm self-start">
                            <Icon name="info" size={24} className="text-red-600" />
                        </div>
                        <div>
                            <p className="font-black text-[10px] uppercase tracking-widest mb-2">OCR Integrado</p>
                            <p className="text-sm font-medium leading-relaxed opacity-80">
                                Selecione um boleto, fatura ou nota em PDF. O sistema tentará extrair o <b>valor, vencimento e fornecedor</b> automaticamente.
                            </p>
                        </div>
                    </div>

                    <div className={`border-2 border-dashed rounded-[32px] p-16 text-center transition-all cursor-pointer group relative ${loading ? 'bg-slate-50 border-red-300' : 'border-slate-200 hover:border-red-400 hover:bg-red-50/30'}`}>
                        <input type="file" accept=".pdf" onChange={handleFileSelect} className="absolute inset-0 opacity-0 cursor-pointer" disabled={loading} />
                        <div className="flex flex-col items-center gap-5">
                            {loading ? (
                                <div className="relative">
                                    <div className="w-16 h-16 border-4 border-red-100 border-t-red-600 rounded-full animate-spin"></div>
                                    <Icon name="loader" size={24} className="absolute inset-0 m-auto text-red-600" />
                                </div>
                            ) : (
                                <div className="p-6 bg-slate-50 rounded-full group-hover:scale-110 group-hover:bg-white transition-all duration-500 shadow-sm group-hover:shadow-md">
                                    <Icon name="file-text" size={48} className="text-slate-300 group-hover:text-red-500" />
                                </div>
                            )}
                            <div>
                                <p className="text-lg font-black text-slate-700 uppercase tracking-tight">{loading ? 'Lendo Documento...' : 'Solte seu PDF aqui'}</p>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">Clique para abrir o explorador</p>
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-[10px] font-black uppercase text-center animate-in shake duration-500">
                            {error}
                        </div>
                    )}

                    <div className="flex justify-end pt-4 border-t border-slate-50">
                        <button onClick={onCancel} className="px-8 py-3 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-slate-600 transition-all">
                            Desistir
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PDFImportModule;
