import React from 'react';

export const ClassicInput = ({ label, value, onChange, type = "text", span = 1, className = "", readOnly = false }) => (
    <div className={`flex flex-col gap-1.5 col-span-${span} ${className}`}>
        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">{label}</label>
        <input 
            type={type}
            className="w-full bg-white border border-slate-300 text-slate-900 px-3 py-2 text-sm focus:border-slate-500 focus:ring-4 focus:ring-slate-500/10 outline-none rounded-xl transition-all"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            readOnly={readOnly}
            disabled={readOnly}
        />
    </div>
);

export const ClassicSelect = ({ label, value, onChange, options, span = 1 }) => (
    <div className={`flex flex-col gap-1.5 col-span-${span}`}>
        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">{label}</label>
        <select 
            className="w-full bg-white border border-slate-300 text-slate-900 px-3 py-2 text-sm focus:border-slate-500 outline-none rounded-xl transition-all cursor-pointer appearance-none"
            value={value}
            onChange={(e) => onChange(e.target.value)}
        >
            {options.map((opt) => {
                if (opt && typeof opt === 'object') {
                    return <option key={opt.value} value={opt.value}>{opt.label}</option>;
                }
                return <option key={opt} value={opt}>{opt}</option>;
            })}
        </select>
    </div>
);

export const ClassicCheckbox = ({ label, checked, onChange, span = 1 }) => (
    <label className={`flex items-center gap-3 col-span-${span} cursor-pointer group py-1`}>
        <div className={`w-5 h-5 border-2 rounded-lg flex items-center justify-center transition-all ${checked ? 'bg-slate-600 border-slate-600' : 'bg-white border-slate-300 group-hover:border-slate-400'}`}>
            {checked && (
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
            )}
            <input 
                type="checkbox" 
                className="hidden"
                checked={checked}
                onChange={(e) => onChange(e.target.checked)}
            />
        </div>
        <span className="text-sm font-semibold text-slate-600 group-hover:text-slate-900 transition-colors">{label}</span>
    </label>
);

export const ClassicSection = ({ title, children, className = "" }) => (
    <div className={`bg-white border border-slate-200 p-6 rounded-2xl shadow-sm ${className}`}>
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6 border-b border-slate-100 pb-3">
            {title}
        </h3>
        {children}
    </div>
);

export const ClassicTh = ({ children, className = "" }) => (
    <th className={`px-4 py-3 text-left text-[11px] font-black text-slate-500 uppercase tracking-wider bg-slate-50 border-b border-slate-200 ${className}`}>
        {children}
    </th>
);

export const ClassicTd = ({ children, className = "" }) => (
    <td className={`px-4 py-3 text-sm text-slate-600 border-b border-slate-100 ${className}`}>
        {children}
    </td>
);
