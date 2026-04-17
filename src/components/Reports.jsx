import React from 'react';
import { Icon } from './Icon';

const Reports = ({ products }) => {
    const categories = [...new Set(products.map(p => p.category))];
    const stockByCategory = categories.map(cat => ({
        name: cat,
        value: products.filter(p => p.category === cat).reduce((acc, p) => acc + (p.price * p.stock), 0)
    }));

    const exportToCSV = () => {
        const headers = ['ID', 'Nome', 'Categoria', 'Preco', 'Estoque', 'Minimo', 'Unidade'];
        const rows = products.map(p => [p.id, p.name, p.category, p.price, p.stock, p.minStock, p.unit]);
        const csvContent = "data:text/csv;charset=utf-8," 
            + headers.join(",") + "\n"
            + rows.map(e => e.join(",")).join("\n");
        
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "relatorio_estoque.csv");
        document.body.appendChild(link);
        link.click();
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Relatórios de Estoque</h1>
                <button onClick={exportToCSV} className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition flex items-center gap-2">
                    <Icon name="download" size={18} /> Exportar CSV
                </button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="text-lg font-semibold mb-4 text-slate-900">Valor Total por Categoria</h3>
                    <div className="space-y-4">
                        {stockByCategory.map(item => (
                            <div key={item.name} className="flex flex-col gap-1">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-600">{item.name}</span>
                                    <span className="font-bold">R$ {item.value.toLocaleString('pt-BR')}</span>
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-2">
                                    <div 
                                        className="bg-blue-600 h-2 rounded-full" 
                                        style={{ width: `${(item.value / stockByCategory.reduce((a, b) => a + b.value, 0)) * 100}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="text-lg font-semibold mb-4 text-slate-900">Análise de Estoque</h3>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Item</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                                    <th className="px-4 py-2 text-right text-xs font-medium text-slate-500 uppercase">Necessidade</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {products.map(p => (
                                    <tr key={p.id}>
                                        <td className="px-4 py-3 text-sm font-medium">{p.name}</td>
                                        <td className="px-4 py-3 text-sm">
                                            {p.stock <= p.minStock ? 
                                                <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs">Crítico</span> :
                                                <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs">Normal</span>
                                            }
                                        </td>
                                        <td className="px-4 py-3 text-sm text-right font-bold text-slate-700">
                                            {p.stock <= p.minStock ? p.minStock * 2 - p.stock : 0} {p.unit}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Reports;
