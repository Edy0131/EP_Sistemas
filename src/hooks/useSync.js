import { useEffect, useState, useRef } from 'react';

// Hook to manage synchronization with Supabase: manual sync, auto-sync (debounced),
// pending history queue and flush retries.
export default function useSync({ supabase, products, setProducts, history, setHistory, nfeHistory, setNfeHistory }) {
  const [syncStatus, setSyncStatus] = useState('offline');
  const [lastSyncAt, setLastSyncAt] = useState(null);
  const [pendingHistory, setPendingHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('sistestoque_history_pending');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // Persist pending history
  useEffect(() => {
    try {
      localStorage.setItem('sistestoque_history_pending', JSON.stringify(pendingHistory));
    } catch (e) {
      console.error('Failed saving pendingHistory', e);
    }
  }, [pendingHistory]);

  // Normalizers
  const normalizeProductForDb = (p) => {
    const meta = {};
    const out = {};
    if (!p || typeof p !== 'object') return p;
    out.id = String(p.id);
    if (p.name !== undefined) out.name = p.name;
    if (p.category !== undefined) out.category = p.category;
    if (p.price !== undefined) out.price = Number(p.price) || 0;
    if (p.venda !== undefined) out.venda = Number(p.venda) || 0;
    if (p.custo !== undefined) out.custo = Number(p.custo) || 0;
    if (p.minStock !== undefined) out.min_stock = Number(p.minStock) || 0;
    if (p.min_stock !== undefined && out.min_stock === undefined) out.min_stock = Number(p.min_stock) || 0;
    if (p.stock !== undefined) out.stock = Number(p.stock) || 0;
    if (p.unit !== undefined) out.unit = p.unit;
    if (p.codInterno !== undefined) out.cod_interno = p.codInterno;
    if (p.cod_interno !== undefined && out.cod_interno === undefined) out.cod_interno = p.cod_interno;
    if (p.barras !== undefined) out.barras = p.barras;
    if (p.ncm !== undefined) out.ncm = p.ncm;
    if (p.fornecedor !== undefined) out.fornecedor = p.fornecedor;
    if (Array.isArray(p.fotos)) out.fotos = p.fotos;
    if (p.foto !== undefined) out.foto = p.foto;

    Object.keys(p).forEach((k) => {
      const known = new Set(['id','name','category','price','venda','custo','minStock','min_stock','stock','unit','codInterno','cod_interno','barras','ncm','fornecedor','fotos','foto','created_at']);
      if (!known.has(k)) meta[k] = p[k];
    });
    if (Object.keys(meta).length) out.meta = meta;
    return out;
  };

  const normalizeHistoryForDb = (h) => {
    if (!h || typeof h !== 'object') return h;
    const out = {};
    out.id = String(h.id);
    if (h.productId !== undefined) out.product_id = String(h.productId);
    if (h.product_id !== undefined && out.product_id === undefined) out.product_id = String(h.product_id);
    if (h.type !== undefined) out.type = h.type;
    if (h.quantity !== undefined) out.quantity = Number(h.quantity) || 0;
    if (h.date !== undefined) out.date = h.date;
    if (h.user !== undefined) out.user = h.user;
    if (h.observation !== undefined) out.observation = h.observation;
    const meta = {};
    Object.keys(h).forEach((k) => {
      const known = new Set(['id','productId','product_id','type','quantity','date','user','observation','created_at']);
      if (!known.has(k)) meta[k] = h[k];
    });
    if (Object.keys(meta).length) out.meta = meta;
    return out;
  };

  const normalizeNfeForDb = (n) => {
    if (!n || typeof n !== 'object') return n;
    const out = {};
    out.id = String(n.id);
    if (n.nNF !== undefined) out.nNF = n.nNF;
    if (n.emitNome !== undefined) out.emitNome = n.emitNome;
    if (n.itemsCount !== undefined) out.items_count = Number(n.itemsCount) || 0;
    if (n.items_count !== undefined && out.items_count === undefined) out.items_count = Number(n.items_count) || 0;
    if (n.statusDocumento !== undefined) out.statusDocumento = n.statusDocumento;
    if (n.items !== undefined) out.items = n.items;
    if (n.dateImport !== undefined) out.dateImport = n.dateImport;
    if (n.raw !== undefined) out.raw = n.raw;
    const meta = {};
    Object.keys(n).forEach((k) => {
      const known = new Set(['id','nNF','emitNome','itemsCount','items_count','statusDocumento','items','dateImport','raw','estornoEm','created_at']);
      if (!known.has(k)) meta[k] = n[k];
    });
    if (Object.keys(meta).length) out.meta = meta;
    return out;
  };

  const addPendingHistory = (rows) => {
    if (!Array.isArray(rows) || rows.length === 0) return;
    setPendingHistory((prev) => {
      const map = new Map(prev.map(r => [String(r.id), r]));
      rows.forEach(r => map.set(String(r.id), r));
      const next = Array.from(map.values());
      try { localStorage.setItem('sistestoque_history_pending', JSON.stringify(next)); } catch (e) {}
      return next;
    });
  };

  const flushPendingHistory = async () => {
    if (!supabase) return;
    try {
      const pending = (pendingHistory || []).slice();
      if (!pending.length) return;
      const { data: remoteProducts } = await supabase.from('products').select('id');
      const remoteSet = new Set((remoteProducts || []).map(p => String(p.id)));
      const canSend = [];
      pending.forEach((h) => {
        if (!h.product_id) canSend.push(h);
        else if (remoteSet.has(String(h.product_id))) canSend.push(h);
      });
      if (canSend.length) {
        const { error } = await supabase.from('history').upsert(canSend);
        if (!error) {
          const remaining = pending.filter(p => !canSend.some(s => String(s.id) === String(p.id)));
          setPendingHistory(remaining);
          console.info(`Flushed ${canSend.length} pending history rows to Supabase.`);
        } else {
          console.error('Error flushing pending history:', error);
        }
      }
    } catch (e) {
      console.error('flushPendingHistory error:', e);
    }
  };

  const handleSync = async () => {
    if (!supabase) return;
    setSyncStatus('syncing');
    try {
      const productsPayload = (products || []).map((p) => normalizeProductForDb(p));
      const historyPayload = (history || []).map((h) => normalizeHistoryForDb(h));
      const nfePayload = (nfeHistory || []).map((n) => normalizeNfeForDb(n));

      const { error: pError } = await supabase.from('products').upsert(productsPayload);

      const productIds = new Set((productsPayload || []).map(p => String(p.id)));
      const safeHistoryPayload = [];
      const dropped = [];
      (historyPayload || []).forEach((h) => {
        if (!h.product_id) safeHistoryPayload.push(h);
        else if (productIds.has(String(h.product_id))) safeHistoryPayload.push(h);
        else dropped.push(h);
      });
      if (dropped.length > 0) addPendingHistory(dropped);

      const { error: hError } = await supabase.from('history').upsert(safeHistoryPayload);
      const { error: nError } = await supabase.from('nfe_history').upsert(nfePayload);

      if (!pError && !hError && !nError) {
        setSyncStatus('online');
        setLastSyncAt(new Date().toISOString());
        // try flush any pending
        flushPendingHistory();
      } else {
        throw new Error(pError?.message || hError?.message || nError?.message);
      }
    } catch (e) {
      setSyncStatus('error');
      console.error('Erro na sincronização:', e);
    }
  };

  // Auto-sync (debounced) when key state arrays change
  const debounceRef = useRef(null);
  useEffect(() => {
    if (!supabase) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      handleSync();
    }, 2000);
    return () => clearTimeout(debounceRef.current);
  }, [products, history, nfeHistory, supabase]);

  // Periodic flush retry
  useEffect(() => {
    if (!supabase) return;
    const id = setInterval(() => {
      if (pendingHistory && pendingHistory.length > 0) flushPendingHistory();
    }, 30000);
    return () => clearInterval(id);
  }, [supabase, pendingHistory]);

  return {
    syncStatus,
    lastSyncAt,
    pendingHistory,
    handleSync,
    flushPendingHistory,
  };
}
