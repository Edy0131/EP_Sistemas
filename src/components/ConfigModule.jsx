import React, { useState } from 'react';
import { Icon } from './Icon';

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

const ConfigModule = ({ cloudConfig, onSaveCloudConfig, syncData, trelloConfig, onSaveTrelloConfig }) => {
    const [localCloudConfig, setLocalCloudConfig] = useState(cloudConfig || { url: '', key: '' });
    const [localTrelloConfig, setLocalTrelloConfig] = useState(trelloConfig || { key: '', token: '', boardId: '', listId: '' });
    const [testingTrello, setTestingTrello] = useState(false);

    const testTrelloConnection = async () => {
        if (!localTrelloConfig.key || !localTrelloConfig.token) {
            alert('Informe a chave e o token do Trello para testar.');
            return;
        }
        setTestingTrello(true);
        try {
            const url = `https://api.trello.com/1/members/me?key=${encodeURIComponent(localTrelloConfig.key)}&token=${encodeURIComponent(localTrelloConfig.token)}`;
            const res = await fetch(url);
            if (!res.ok) throw new Error('Falha ao validar credenciais no Trello.');
            const data = await res.json();
            alert(`Trello conectado com sucesso: ${data?.fullName || data?.username || 'Usuário'}`);
        } catch (err) {
            alert(err?.message || 'Não foi possível conectar no Trello. Verifique chave e token.');
        } finally {
            setTestingTrello(false);
        }
    };

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
                <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
                        <Icon name="upload" size={32} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">Configuração da Nuvem</h1>
                        <p className="text-slate-500">Habilite a sincronização entre dispositivos usando Supabase.</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="p-4 bg-amber-50 border border-amber-100 rounded-lg flex gap-3 text-sm text-amber-800">
                        <Icon name="alert-circle" size={20} className="shrink-0" />
                        <div>
                            <p className="font-bold mb-1">Como configurar:</p>
                            <ol className="list-decimal list-inside space-y-1">
                                <li>Crie uma conta gratuita em <a href="https://supabase.com" target="_blank" className="underline font-bold">supabase.com</a></li>
                                <li>Crie um novo projeto chamado "Edson Prestes Sistemas"</li>
                                <li>Vá em <b>Configurações do Projeto &gt; API</b> e copie a <b>URL do Projeto</b> e a <b>chave pública (anon)</b></li>
                                <li>Cole os dados abaixo e clique em Salvar</li>
                            </ol>
                        </div>
                    </div>

                    <div className="space-y-3 pt-4">
                        <InputField label="URL do Projeto Supabase" value={localCloudConfig.url} onChange={v => setLocalCloudConfig({...localCloudConfig, url: v})} placeholder="Ex: https://xyz.supabase.co" />
                        <InputField label="Chave Pública (anon)" value={localCloudConfig.key} onChange={v => setLocalCloudConfig({...localCloudConfig, key: v})} placeholder="Cole sua chave aqui" />
                        <button 
                            onClick={() => onSaveCloudConfig && onSaveCloudConfig(localCloudConfig)}
                            className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition shadow-lg shadow-blue-100 uppercase"
                        >
                            Salvar e Conectar
                        </button>
                        {cloudConfig?.url && (
                            <button 
                                onClick={syncData}
                                className="w-full bg-emerald-600 text-white font-bold py-3 rounded-lg hover:bg-emerald-700 transition shadow-lg shadow-emerald-100 uppercase flex items-center justify-center gap-2"
                            >
                                <Icon name="check" size={18} /> Sincronizar Agora
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
                <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 bg-slate-100 text-slate-600 rounded-lg">
                        <Icon name="layers" size={32} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold">Integração com Trello</h2>
                        <p className="text-slate-500">Envie produtos selecionados para uma lista do Trello (criação de cards).</p>
                    </div>
                </div>

                <div className="space-y-3">
                    <InputField label="Chave da API (Key)" value={localTrelloConfig.key} onChange={v => setLocalTrelloConfig({...localTrelloConfig, key: v})} />
                    <InputField label="Token" value={localTrelloConfig.token} onChange={v => setLocalTrelloConfig({...localTrelloConfig, token: v})} />
                    <div className="grid grid-cols-2 gap-3">
                        <InputField label="ID do Quadro" value={localTrelloConfig.boardId} onChange={v => setLocalTrelloConfig({...localTrelloConfig, boardId: v})} />
                        <InputField label="ID da Lista" value={localTrelloConfig.listId} onChange={v => setLocalTrelloConfig({...localTrelloConfig, listId: v})} />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            onClick={testTrelloConnection}
                            className={`flex-1 bg-white border border-slate-200 text-slate-600 font-bold py-3 rounded-lg hover:bg-slate-50 transition uppercase ${testingTrello ? 'opacity-70 cursor-not-allowed' : ''}`}
                            disabled={testingTrello}
                        >
                            Testar Conexão
                        </button>
                        <button
                            onClick={() => onSaveTrelloConfig && onSaveTrelloConfig(localTrelloConfig)}
                            className="flex-1 bg-slate-700 text-white font-bold py-3 rounded-lg hover:bg-slate-800 transition shadow-lg shadow-slate-100 uppercase"
                        >
                            Salvar Trello
                        </button>
                    </div>

                    <div className="p-4 bg-amber-50 border border-amber-100 rounded-lg flex gap-3 text-sm text-amber-800 mt-4">
                        <Icon name="alert-circle" size={20} className="shrink-0" />
                        <div>
                            <p className="font-bold mb-1">Atenção:</p>
                            <p>Este vínculo usa a API do Trello e guarda as credenciais no navegador (armazenamento local). Use apenas em computadores confiáveis.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConfigModule;
