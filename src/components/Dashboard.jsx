import React, { useEffect, useMemo, useState } from 'react';
import { Icon } from './Icon';
import Chart from 'chart.js/auto';

const StatCard = ({ title, value, icon, color }) => (
    <div className="bg-white p-6 rounded-2xl flex items-center gap-5 group border border-slate-100 shadow-sm hover:shadow-md transition-all">
        <div className={`p-4 bg-slate-50 rounded-xl border border-slate-100 group-hover:border-blue-100 transition-colors ${color}`}>
            <Icon name={icon} size={28} />
        </div>
        <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{title}</p>
            <p className="text-2xl font-black text-slate-900 tracking-tight data-mono">{value}</p>
        </div>
    </div>
);

const CurrencyWidget = () => {
    const [currencies, setCurrencies] = useState({
        USD: { bid: '0.00', pctChange: '0' },
        CNY: { bid: '0.00', pctChange: '0' },
        USDCNY: { bid: '0.00', pctChange: '0' }
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCurrencies = async () => {
            try {
                const response = await fetch('https://economia.awesomeapi.com.br/last/USD-BRL,CNY-BRL,USD-CNY');
                const data = await response.json();
                setCurrencies({
                    USD: data.USDBRL,
                    CNY: data.CNYBRL,
                    USDCNY: data.USDCNY
                });
            } catch (error) {
                console.error('Erro ao buscar cotações:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchCurrencies();
        const interval = setInterval(fetchCurrencies, 60000); // Atualiza a cada minuto
        return () => clearInterval(interval);
    }, []);

    const CurrencyCard = ({ code, name, data, flagColor, prefix = "R$" }) => (
        <div className="flex items-center gap-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-100 group hover:border-blue-200 transition-all">
            <div className={`w-10 h-10 rounded-xl ${flagColor} flex items-center justify-center text-white shadow-sm font-black text-xs tracking-tighter`}>
                {code}
            </div>
            <div className="flex-1">
                <div className="flex justify-between items-center mb-0.5">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{name}</p>
                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${parseFloat(data.pctChange) >= 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                        {data.pctChange}%
                    </span>
                </div>
                <p className="text-lg font-black text-slate-900 data-mono tracking-tighter">
                    {loading ? '---' : `${prefix} ${parseFloat(data.bid).toFixed(code === 'USDCNY' ? 4 : 2)}`}
                </p>
            </div>
        </div>
    );

    return (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <CurrencyCard code="USD" name="Dólar / BRL" data={currencies.USD} flagColor="bg-slate-600" />
            <CurrencyCard code="CNY" name="Yuan / BRL" data={currencies.CNY} flagColor="bg-slate-400" />
            <CurrencyCard code="USDCNY" name="USD / CNY" data={currencies.USDCNY} flagColor="bg-slate-800" prefix="¥" />
        </div>
    );
};

const Dashboard = ({ products, history }) => {
    const totalStockValue = products.reduce((acc, p) => acc + (p.price * p.stock), 0);
    const totalItems = products.reduce((acc, p) => acc + p.stock, 0);
    const lowStockItems = products.filter(p => p.stock <= p.minStock).length;
    const totalCategories = new Set(products.map(p => p.category)).size;

    const getTodayISO = () => new Date().toISOString().split('T')[0];
    const [periodStart, setPeriodStart] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() - 6);
        return d.toISOString().split('T')[0];
    });
    const [periodEnd, setPeriodEnd] = useState(getTodayISO);

    const periodDates = useMemo(() => {
        if (!periodStart || !periodEnd || periodStart > periodEnd) return [];
        const dates = [];
        const current = new Date(`${periodStart}T00:00:00`);
        const end = new Date(`${periodEnd}T00:00:00`);
        while (current <= end) {
            dates.push(current.toISOString().split('T')[0]);
            current.setDate(current.getDate() + 1);
        }
        return dates;
    }, [periodStart, periodEnd]);

    const entradasMercadoriasPeriodo = useMemo(() => {
        if (!periodDates.length) return 0;
        const startISO = `${periodStart}T00:00:00`;
        const endISO = `${periodEnd}T23:59:59`;

        return history
            .filter(h => h.type === 'ENTRADA' && h.date >= startISO && h.date <= endISO)
            .reduce((acc, h) => acc + (Number(h.value ?? h.Vale ?? h.valor ?? 0) || 0), 0);
    }, [history, periodDates, periodStart, periodEnd]);

    const [financeRecords, setFinanceRecords] = useState(() => {
        try {
            const saved = localStorage.getItem('sistestoque_finance');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            return [];
        }
    });

    useEffect(() => {
        const refreshFinance = () => {
            try {
                const saved = localStorage.getItem('sistestoque_finance');
                setFinanceRecords(saved ? JSON.parse(saved) : []);
            } catch (e) {
                setFinanceRecords([]);
            }
        };

        refreshFinance();
        window.addEventListener('focus', refreshFinance);
        return () => window.removeEventListener('focus', refreshFinance);
    }, []);

    useEffect(() => {
        const ctx = document.getElementById('stockChart')?.getContext('2d');
        if (!ctx) return;

        const financialLabels = periodDates.length ? periodDates : [getTodayISO()];

        const chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: financialLabels,
                datasets: [
                    {
                        label: 'Contas a Pagar',
                        data: financialLabels.map((date) =>
                            financeRecords
                                .filter((r) => r.type === 'payable' && String(r.dueDate || '').startsWith(date))
                                .reduce((acc, r) => acc + (Number(r.value) || 0), 0)
                        ),
                        backgroundColor: 'rgba(239, 68, 68, 0.2)',
                        borderColor: '#ef4444',
                        borderWidth: 1,
                        borderRadius: 4
                    },
                    {
                        label: 'Contas a Receber',
                        data: financialLabels.map((date) =>
                            financeRecords
                                .filter((r) => r.type === 'receivable' && String(r.dueDate || '').startsWith(date))
                                .reduce((acc, r) => acc + (Number(r.value) || 0), 0)
                        ),
                        backgroundColor: 'rgba(16, 185, 129, 0.2)',
                        borderColor: '#10b981',
                        borderWidth: 1,
                        borderRadius: 4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { labels: { color: '#64748b', font: { weight: 'bold', size: 10 } } }
                },
                scales: {
                    y: {
                        grid: { color: '#f1f5f9' },
                        ticks: {
                            color: '#64748b',
                            font: { weight: 'bold', size: 10 },
                            callback: (value) => `R$ ${Number(value).toLocaleString('pt-BR')}`
                        }
                    },
                    x: { grid: { display: false }, ticks: { color: '#64748b', font: { weight: 'bold', size: 10 } } }
                }
            }
        });

        const ctx2 = document.getElementById('historyChart')?.getContext('2d');
        if (!ctx2) return;

        const labels = periodDates.length ? periodDates : [getTodayISO()];

        const historyChart = new Chart(ctx2, {
            type: 'line',
            data: {
                labels,
                datasets: [
                    {
                        label: 'Mercadorias (Entradas)',
                        data: labels.map(date => history
                            .filter(h => h.type === 'ENTRADA' && h.date.startsWith(date))
                            .reduce((a, b) => a + (Number(b.value ?? b.Vale ?? b.valor ?? 0) || 0), 0)
                        ),
                        borderColor: '#10b981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        fill: true,
                        tension: 0.4
                    },
                    {
                        label: 'Saídas',
                        data: labels.map(date => history
                            .filter(h => h.type === 'SAÍDA' && h.date.startsWith(date))
                            .reduce((a, b) => a + (Number(b.value ?? b.Vale ?? b.valor ?? 0) || 0), 0)
                        ),
                        borderColor: '#ef4444',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        fill: true,
                        tension: 0.4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { labels: { color: '#64748b', font: { weight: 'bold', size: 10 } } } },
                scales: {
                    y: { grid: { color: '#f1f5f9' }, ticks: { color: '#64748b', font: { weight: 'bold', size: 10 } } },
                    x: { grid: { color: '#f1f5f9' }, ticks: { color: '#64748b', font: { weight: 'bold', size: 10 } } }
                }
            }
        });

        return () => {
            chart.destroy();
            historyChart.destroy();
        };
    }, [history, periodDates, financeRecords]);

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Visão Geral</h1>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.3em] mt-1">Telemetria do sistema em tempo real</p>
                </div>
                <div className="text-right">
                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Última Atualização</p>
                    <p className="text-xs font-bold text-slate-500 data-mono">{new Date().toLocaleTimeString()}</p>
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-2">
                    <CurrencyWidget />
                </div>
                <StatCard title="Fluxo de Capital" value={`R$ ${totalStockValue.toLocaleString('pt-BR')}`} icon="dollar-sign" color="text-emerald-600" />
                <StatCard title="Itens Gerenciados" value={totalItems} icon="layers" color="text-blue-600" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Alertas Críticos" value={lowStockItems} icon="alert-triangle" color="text-amber-600" />
                <StatCard title="Categorias" value={totalCategories} icon="layers" color="text-purple-600" />
                <div className="md:col-span-2 lg:col-span-2 bg-slate-900 rounded-2xl p-6 flex items-center justify-between shadow-lg shadow-slate-200">
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Mercadorias no Período</p>
                        <p className="text-lg font-black text-white uppercase tracking-tight data-mono">R$ {entradasMercadoriasPeriodo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                    <div className="flex items-center gap-3 bg-white/10 px-4 py-2 rounded-xl">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                        <span className="text-[10px] font-black text-white uppercase tracking-widest">Entradas</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                    <div className="flex flex-col gap-4 mb-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Relatório Financeiro</h3>
                            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]"></div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Data inicial</label>
                                <input
                                    type="date"
                                    className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-600"
                                    value={periodStart}
                                    max={periodEnd || undefined}
                                    onChange={(e) => setPeriodStart(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Data final</label>
                                <input
                                    type="date"
                                    className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-600"
                                    value={periodEnd}
                                    min={periodStart || undefined}
                                    onChange={(e) => setPeriodEnd(e.target.value)}
                                />
                            </div>
                        </div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                            Período: {periodStart ? new Date(`${periodStart}T00:00:00`).toLocaleDateString('pt-BR') : '--'} até {periodEnd ? new Date(`${periodEnd}T00:00:00`).toLocaleDateString('pt-BR') : '--'}
                        </p>
                    </div>
                    <div className="h-80">
                        <canvas id="stockChart"></canvas>
                    </div>
                </div>
                <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                    <div className="flex flex-col gap-4 mb-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Logística do Sistema</h3>
                            <div className="flex gap-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Data inicial</label>
                                <input
                                    type="date"
                                    className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-600"
                                    value={periodStart}
                                    max={periodEnd || undefined}
                                    onChange={(e) => setPeriodStart(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Data final</label>
                                <input
                                    type="date"
                                    className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-600"
                                    value={periodEnd}
                                    min={periodStart || undefined}
                                    onChange={(e) => setPeriodEnd(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                    <div className="h-80">
                        <canvas id="historyChart"></canvas>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-8">Itens Críticos</h3>
                    <div className="space-y-4">
                        {products.filter(p => p.stock <= p.minStock).slice(0, 4).map(p => (
                            <div key={p.id} className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-amber-200 transition-all">
                                <div className="flex items-center gap-5">
                                    <div className="p-3 bg-amber-50 rounded-xl text-amber-600 border border-amber-100">
                                        <Icon name="alert-circle" size={20} />
                                    </div>
                                    <div>
                                        <p className="font-black text-slate-900 text-sm uppercase tracking-tight">{p.name}</p>
                                        <p className="text-[10px] text-amber-600 font-bold uppercase tracking-tighter mt-1">Nível: {p.stock} / Mínimo: {p.minStock}</p>
                                    </div>
                                </div>
                                <button className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black text-slate-600 uppercase tracking-widest hover:bg-amber-500 hover:text-white hover:border-amber-500 transition-all shadow-sm">Repor</button>
                            </div>
                        ))}
                        {lowStockItems === 0 && (
                            <div className="flex flex-col items-center justify-center py-16 opacity-40">
                                <Icon name="check" size={48} className="text-emerald-500 mb-3" />
                                <p className="text-xs font-black uppercase tracking-widest text-slate-500">Sistemas Estáveis</p>
                            </div>
                        )}
                    </div>
                </div>
                <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-8">Log de Eventos</h3>
                    <div className="space-y-6">
                        {history.slice(-6).reverse().map(h => {
                            const p = products.find(prod => prod.id === h.productId);
                            return (
                                <div key={h.id} className="flex items-start gap-5 text-sm relative group">
                                    <div className={`shrink-0 w-2.5 h-2.5 rounded-full mt-1.5 shadow-[0_0_8px] transition-transform group-hover:scale-125 ${h.type === 'ENTRADA' ? 'bg-emerald-500 shadow-emerald-200' : 'bg-red-500 shadow-red-200'}`}></div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-slate-900 font-black text-[11px] leading-tight uppercase tracking-tight">
                                            <span className={h.type === 'ENTRADA' ? 'text-emerald-600' : 'text-red-600'}>{h.type}</span>: {h.quantity} UNIDADES
                                        </p>
                                        <p className="text-[10px] text-slate-400 truncate mt-1 font-semibold">{p?.name || 'Objeto do Sistema'}</p>
                                        <p className="text-[9px] text-slate-300 font-black mt-1.5 data-mono uppercase tracking-widest">{new Date(h.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
