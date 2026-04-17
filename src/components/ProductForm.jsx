import React, { useRef, useState } from 'react';
import { Icon } from './Icon';
import { 
    ClassicInput, 
    ClassicSelect, 
    ClassicCheckbox, 
    ClassicSection 
} from './ClassicUI';
import { PRODUCT_DEFAULTS } from '../data/constants';

const ProductForm = ({ product, onSave, onCancel, suppliers = [] }) => {
    const [formData, setFormData] = useState(() => {
        const base = product ? { ...PRODUCT_DEFAULTS, ...product } : { ...PRODUCT_DEFAULTS };
        const normalizedFotos = Array.isArray(base.fotos) ? base.fotos.slice(0, 4) : ['', '', '', ''];
        while (normalizedFotos.length < 4) normalizedFotos.push('');
        if (!normalizedFotos[0] && base.foto) normalizedFotos[0] = base.foto;
        return { ...base, fotos: normalizedFotos };
    });
    const [activeTab, setActiveTab] = useState('PRODUTO');
    const [photoTargetIndex, setPhotoTargetIndex] = useState(null);
    const photoInputRef = useRef(null);

    const supplierOptions = ['Nenhum', ...suppliers.map(s => s.name)];
    const categoryOptions = ['DECORAÇÃO', 'ELETRÔNICOS', 'INFORMÁTICA', 'MÓVEIS', 'OUTROS'];

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    const TabButton = ({ name, label }) => (
        <button
            type="button"
            onClick={() => setActiveTab(name)}
            className={`px-6 py-3 text-[11px] font-bold uppercase tracking-widest transition-all border-b-2 ${activeTab === name ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
        >
            {label}
        </button>
    );

    const readFileAsDataUrl = (file) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('Falha ao ler arquivo'));
        reader.readAsDataURL(file);
    });

    const handlePickPhotos = async (e) => {
        const files = Array.from(e.target.files || []);
        e.target.value = '';
        if (files.length === 0) return;

        const images = files.filter(f => (f.type || '').startsWith('image/')).slice(0, 4);
        if (images.length === 0) return;

        const dataUrls = [];
        for (const file of images) {
            try {
                const dataUrl = await readFileAsDataUrl(file);
                if (typeof dataUrl === 'string') dataUrls.push(dataUrl);
            } catch (err) {
                alert('Não foi possível ler uma das imagens.');
            }
        }

        setFormData((prev) => {
            const nextFotos = Array.isArray(prev.fotos) ? prev.fotos.slice(0, 4) : ['', '', '', ''];
            while (nextFotos.length < 4) nextFotos.push('');

            if (photoTargetIndex !== null) {
                nextFotos[photoTargetIndex] = dataUrls[0] || nextFotos[photoTargetIndex];
                return { ...prev, fotos: nextFotos, foto: nextFotos[0] || prev.foto };
            }

            let writeIdx = 0;
            for (const url of dataUrls) {
                while (writeIdx < 4 && nextFotos[writeIdx]) writeIdx += 1;
                if (writeIdx >= 4) break;
                nextFotos[writeIdx] = url;
            }
            return { ...prev, fotos: nextFotos, foto: nextFotos[0] || prev.foto };
        });

        setPhotoTargetIndex(null);
    };

    const removePhoto = (index) => {
        setFormData((prev) => {
            const nextFotos = Array.isArray(prev.fotos) ? prev.fotos.slice(0, 4) : ['', '', '', ''];
            while (nextFotos.length < 4) nextFotos.push('');
            nextFotos[index] = '';
            return { ...prev, fotos: nextFotos, foto: nextFotos[0] || '' };
        });
    };

    return (
        <div className="fixed inset-0 z-[260] bg-slate-900/40 backdrop-blur-sm p-0 md:p-4 flex items-stretch md:items-center justify-stretch md:justify-center animate-in fade-in duration-300">
            <div className="bg-white w-screen h-screen md:w-[96vw] md:max-w-[1400px] md:h-[94vh] shadow-2xl overflow-hidden flex flex-col border-0 md:border md:border-slate-200 rounded-none md:rounded-3xl animate-in slide-in-from-top duration-500">

            {/* Header with Top Actions */}
                <div className="sticky top-0 z-30 bg-white px-4 md:px-8 py-4 md:py-5 flex flex-col lg:flex-row justify-between lg:items-center gap-3 border-b border-slate-100">
                    <div>
                        <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">Cadastro de produtos</h2>
                        <p className="text-xs text-slate-400 font-semibold mt-1">Preencha os dados principais, referência e estoque do item.</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <button type="button" className="px-4 py-2 bg-purple-600 text-white rounded-lg text-[11px] font-black tracking-wide hover:bg-purple-700 transition-all flex items-center gap-2">
                            <Icon name="download" size={14} /> EXPORTAR EXCEL
                        </button>
                        <button type="button" className="hidden xl:flex px-4 py-2 bg-white border border-blue-200 text-blue-600 rounded-lg text-[11px] font-black tracking-wide hover:bg-blue-50 transition-all items-center gap-2">
                            <Icon name="alert-circle" size={14} /> PREÇOS ZERADOS
                        </button>
                        <button type="button" className="hidden xl:flex px-4 py-2 bg-white border border-blue-200 text-blue-600 rounded-lg text-[11px] font-black tracking-wide hover:bg-blue-50 transition-all items-center gap-2">
                            <Icon name="upload" size={14} /> IMPORTAR EXCEL
                        </button>
                        <button type="button" className="hidden xl:flex px-4 py-2 bg-white border border-blue-200 text-blue-600 rounded-lg text-[11px] font-black tracking-wide hover:bg-blue-50 transition-all items-center gap-2">
                            <Icon name="upload" size={14} /> IMPORTAR XML
                        </button>
                        <button onClick={onCancel} className="ml-1 p-2 text-slate-400 hover:text-slate-900 transition-all">
                            <Icon name="x" size={24} />
                        </button>
                    </div>
                </div>

                {/* Tabs Navigation */}
                <div className="sticky top-[88px] md:top-[96px] z-20 bg-white px-4 md:px-8 border-b border-slate-100 flex gap-2 overflow-x-auto no-scrollbar">
                    <TabButton name="PRODUTO" label="PRODUTO" />
                    <TabButton name="BARRAS" label="CÓDIGOS DE BARRAS" />
                    <TabButton name="ESPECIFICAÇÕES" label="ESPECIFICAÇÕES" />
                    <TabButton name="OBSERVAÇÕES" label="OBSERVAÇÕES" />
                    <TabButton name="TRIBUTAÇÃO" label="TRIBUTAÇÃO" />
                </div>

                <form onSubmit={handleSubmit} className="p-5 md:p-8 lg:p-10 pb-32 bg-white overflow-y-auto flex-1 custom-scrollbar">
                    {activeTab === 'PRODUTO' && (
                        <div className="space-y-6">
                            {/* Row 1 */}
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                                <ClassicInput 
                                    label="Código Interno" 
                                    value={formData.codInterno} 
                                    onChange={v => setFormData({...formData, codInterno: v})} 
                                />
                                <div className="flex flex-col gap-1.5">
                                    <ClassicInput 
                                        label="Código de Barras / SKU" 
                                        value={formData.barras} 
                                        onChange={v => setFormData({...formData, barras: v})} 
                                    />
                                    <span className="text-[9px] text-slate-400 font-bold ml-1">EAN, SKU ou Código interno</span>
                                </div>
                                <div className="md:col-span-2">
                                    <ClassicInput 
                                        label="Descrição do Produto" 
                                        value={formData.name} 
                                        onChange={v => setFormData({...formData, name: v})} 
                                    />
                                </div>
                            </div>

                            {/* Row 2 */}
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                                <ClassicSelect 
                                    label="Fornecedor" 
                                    value={formData.fornecedor} 
                                    options={supplierOptions} 
                                    onChange={v => setFormData({...formData, fornecedor: v})} 
                                />
                                <ClassicSelect 
                                    label="Categoria" 
                                    value={formData.category} 
                                    options={categoryOptions} 
                                    onChange={v => setFormData({...formData, category: v})} 
                                />
                                <ClassicInput 
                                    label="Referência" 
                                    value={formData.referencia} 
                                    onChange={v => setFormData({...formData, referencia: v})} 
                                />
                                <ClassicInput 
                                    label="Tipo" 
                                    value={formData.tipoProduto} 
                                    onChange={v => setFormData({...formData, tipoProduto: v})} 
                                />
                            </div>

                            {/* Row 3 */}
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                                <div className="md:col-span-2">
                                    <ClassicInput 
                                        label="Quantidade Total (Estoque Inicial)" 
                                        type="number"
                                        value={formData.stock} 
                                        onChange={v => setFormData({...formData, stock: Number(v)})} 
                                    />
                                </div>
                                <ClassicInput 
                                    label="Quantidade Mínima" 
                                    type="number"
                                    value={formData.minStock} 
                                    onChange={v => setFormData({...formData, minStock: Number(v)})} 
                                />
                            </div>

                            <ClassicSection title="Fotos do Produto (até 4)">
                                <input
                                    ref={photoInputRef}
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    className="hidden"
                                    onChange={handlePickPhotos}
                                />
                                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                        Clique em uma foto para substituir
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => { setPhotoTargetIndex(null); photoInputRef.current?.click(); }}
                                        className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                                    >
                                        <Icon name="upload" size={14} /> Adicionar fotos
                                    </button>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 justify-items-center md:justify-items-start">
                                    {(Array.isArray(formData.fotos) ? formData.fotos : ['', '', '', '']).slice(0, 4).map((src, idx) => (
                                        <div key={idx} className="relative w-full max-w-[150px] md:max-w-[180px]">
                                            <button
                                                type="button"
                                                onClick={() => { setPhotoTargetIndex(idx); photoInputRef.current?.click(); }}
                                                className="w-full aspect-square rounded-xl border border-slate-200 bg-slate-50 overflow-hidden flex items-center justify-center hover:border-slate-400 transition-all"
                                            >
                                                {src ? (
                                                    <img src={src} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="flex flex-col items-center gap-2 text-slate-300">
                                                        <Icon name="products" size={22} />
                                                        <span className="text-[9px] font-black uppercase tracking-widest">Foto {idx + 1}</span>
                                                    </div>
                                                )}
                                            </button>
                                            {src && (
                                                <button
                                                    type="button"
                                                    onClick={() => removePhoto(idx)}
                                                    className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-white border border-slate-200 text-slate-500 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-all flex items-center justify-center shadow-sm"
                                                    title="Remover"
                                                >
                                                    <Icon name="x" size={14} />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </ClassicSection>
                        </div>
                    )}

                    {activeTab === 'BARRAS' && (
                        <ClassicSection title="Códigos de Barras">
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <ClassicInput label="Código Interno" value={formData.codInterno} readOnly />
                                    <ClassicInput label="Código de Barras Primário" value={formData.barras} onChange={v => setFormData({ ...formData, barras: v })} />
                                </div>

                                <div>
                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Códigos Secundários</div>
                                    <div className="space-y-2">
                                        {(Array.isArray(formData.secondaryBarcodes) ? formData.secondaryBarcodes : []).map((barcode, idx) => (
                                            <div key={`${barcode}-${idx}`} className="flex items-center gap-3">
                                                <input
                                                    type="text"
                                                    value={barcode}
                                                    onChange={(e) => {
                                                        const next = Array.isArray(formData.secondaryBarcodes) ? [...formData.secondaryBarcodes] : [];
                                                        next[idx] = e.target.value;
                                                        setFormData({ ...formData, secondaryBarcodes: next });
                                                    }}
                                                    className="w-full bg-white border border-slate-300 text-slate-900 px-3 py-2 text-sm focus:border-slate-500 focus:ring-4 focus:ring-slate-500/10 outline-none rounded-xl transition-all"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const next = (Array.isArray(formData.secondaryBarcodes) ? formData.secondaryBarcodes : []).filter((_, itemIdx) => itemIdx !== idx);
                                                        setFormData({ ...formData, secondaryBarcodes: next });
                                                    }}
                                                    className="px-3 py-2 bg-white border border-red-200 text-red-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-red-50 transition-all"
                                                >
                                                    Remover
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, secondaryBarcodes: [...(Array.isArray(formData.secondaryBarcodes) ? formData.secondaryBarcodes : []), ''] })}
                                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-all flex items-center gap-2"
                                    >
                                        <Icon name="plus" size={14} /> Adicionar Código Secundário
                                    </button>
                                </div>
                            </div>
                        </ClassicSection>
                    )}

                    {activeTab === 'TRIBUTAÇÃO' && (
                        <div className="space-y-8">
                            <ClassicSection title="Tributação de Venda (NF-e)">
                                <div className="grid grid-cols-4 gap-4">
                                    <ClassicInput label="CFOP de Venda" value={formData.cfopVenda} onChange={v => setFormData({...formData, cfopVenda: v})} />
                                    <ClassicSelect label="Origem da Mercadoria" value={formData.origemMercadoria} onChange={v => setFormData({...formData, origemMercadoria: v})} options={[
                                        '0 - Nacional',
                                        '1 - Estrangeira - Importação direta',
                                        '2 - Estrangeira - Adquirida no mercado interno'
                                    ]} />
                                    <ClassicSelect label="Regime ICMS" value={formData.icmsRegime} onChange={v => setFormData({...formData, icmsRegime: v})} options={['NORMAL', 'SIMPLES_NACIONAL']} />
                                    <ClassicInput label="Alíquota ICMS (%)" type="number" value={formData.icmsAliquota} onChange={v => setFormData({...formData, icmsAliquota: Number(v)})} />
                                </div>
                                <div className="grid grid-cols-4 gap-4 mt-2">
                                    <ClassicSelect label="Modalidade BC ICMS" value={formData.icmsModalidadeBC} onChange={v => setFormData({...formData, icmsModalidadeBC: v})} options={[
                                        '0 - Margem Valor Agregado',
                                        '1 - Pauta (Valor)',
                                        '2 - Preço Tabelado',
                                        '3 - Valor da operação'
                                    ]} />
                                    <ClassicInput label="MVA (%)" type="number" value={formData.icmsMVA} onChange={v => setFormData({...formData, icmsMVA: Number(v)})} />
                                    <ClassicInput label="Alíquota ICMS ST (%)" type="number" value={formData.icmsSTAliquota} onChange={v => setFormData({...formData, icmsSTAliquota: Number(v)})} />
                                    <ClassicInput label="Alíquota FCP (%)" type="number" value={formData.fcpAliquota} onChange={v => setFormData({...formData, fcpAliquota: Number(v)})} />
                                </div>
                                <div className="grid grid-cols-4 gap-4 mt-2">
                                    <ClassicSelect label="CST ICMS" value={formData.icmsCST} onChange={v => setFormData({...formData, icmsCST: v})} options={['00','10','20','30','40','41','50','51','60','70','90']} />
                                    <ClassicSelect label="CSOSN (Simples)" value={formData.csosn} onChange={v => setFormData({...formData, csosn: v})} options={['101','102','103','201','202','203','300','400','500','900']} />
                                    <ClassicInput label="cBenef (Código de Benefício)" value={formData.cBenef} onChange={v => setFormData({...formData, cBenef: v})} />
                                    <ClassicInput label="CEST" value={formData.cest} onChange={v => setFormData({...formData, cest: v})} />
                                </div>
                            </ClassicSection>

                            <ClassicSection title="IPI / PIS / COFINS">
                                <div className="grid grid-cols-4 gap-4">
                                    <ClassicSelect label="CST IPI" value={formData.ipiCST} onChange={v => setFormData({...formData, ipiCST: v})} options={['50','99','00','49']} />
                                    <ClassicInput label="Enquadramento IPI" value={formData.ipiEnquadramento} onChange={v => setFormData({...formData, ipiEnquadramento: v})} />
                                    <ClassicInput label="Alíquota IPI (%)" type="number" value={formData.ipiAliquota} onChange={v => setFormData({...formData, ipiAliquota: Number(v)})} />
                                    <ClassicInput label="NCM" value={formData.ncm} onChange={v => setFormData({...formData, ncm: v})} />
                                </div>
                                <div className="grid grid-cols-4 gap-4 mt-2">
                                    <ClassicSelect label="CST PIS" value={formData.pisCST} onChange={v => setFormData({...formData, pisCST: v})} options={['01','02','03','04','06','07','08','09','49','99']} />
                                    <ClassicInput label="Alíquota PIS (%)" type="number" value={formData.pisAliquota} onChange={v => setFormData({...formData, pisAliquota: Number(v)})} />
                                    <ClassicSelect label="CST COFINS" value={formData.cofinsCST} onChange={v => setFormData({...formData, cofinsCST: v})} options={['01','02','03','04','06','07','08','09','49','99']} />
                                    <ClassicInput label="Alíquota COFINS (%)" type="number" value={formData.cofinsAliquota} onChange={v => setFormData({...formData, cofinsAliquota: Number(v)})} />
                                </div>
                            </ClassicSection>
                        </div>
                    )}

                    {activeTab !== 'PRODUTO' && activeTab !== 'BARRAS' && activeTab !== 'TRIBUTAÇÃO' && (
                        <div className="h-40 flex items-center justify-center text-slate-400 font-bold uppercase tracking-widest text-xs bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                            Conteúdo da aba {activeTab} em desenvolvimento
                        </div>
                    )}

                    {/* Footer Actions */}
                    <div className="sticky bottom-0 z-20 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85 flex flex-col-reverse md:flex-row justify-end md:items-center gap-4 mt-8 pt-4 pb-2 border-t border-slate-100">
                        <div className="flex-1">
                            <ClassicCheckbox 
                                label="Produto Premium" 
                                checked={formData.premium} 
                                onChange={v => setFormData({...formData, premium: v})} 
                            />
                        </div>
                        <button 
                            type="button" 
                            onClick={onCancel} 
                            className="px-8 py-3 bg-white border border-slate-300 text-slate-700 rounded-lg font-black text-[11px] uppercase tracking-widest hover:bg-slate-50 transition-all"
                        >
                            CANCELAR
                        </button>
                        <button 
                            type="submit" 
                            className="px-10 py-3 bg-blue-600 text-white rounded-lg font-black text-[11px] uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
                        >
                            {formData.id ? 'ATUALIZAR PRODUTO' : 'CADASTRAR PRODUTO'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProductForm;
