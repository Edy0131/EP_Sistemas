import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Icon } from './components/Icon';
import { getSupabaseClient } from './services/supabase';
import Dashboard from './components/Dashboard';
import ProductList from './components/ProductList';
import ProductForm from './components/ProductForm';
import SupplierModule from './components/SupplierModule';
import ImportModule from './components/ImportModule';
import XMLImportModule from './components/XMLImportModule';
import BulkProductImport from './components/BulkProductImport';
import NFeEntryModule from './components/NFeEntryModule';
import GradeTributariaModule from './components/GradeTributariaModule';
import ContainersTransitModule from './components/ContainersTransitModule';
import PedidoMercadoriasModule from './components/PedidoMercadoriasModule';
import Reports from './components/Reports';
import UserModule from './components/UserModule';
import ConfigModule from './components/ConfigModule';
import FinancialModule from './components/FinancialModule';
import Login from './components/Login';
import { 
    ROLES, 
    INITIAL_USERS, 
    INITIAL_PRODUCTS, 
    INITIAL_HISTORY,
    PRODUCT_DEFAULTS 
} from './data/constants';

const DEFAULT_CLOUD_CONFIG = {
    url: 'https://igositclawbwoonqwjbp.supabase.co',
    key: 'sb_publishable_N826EQC5-NLQKr-jCnqdpw_GS2LeiWX'
};

const App = () => {
    const [currentUser, setCurrentUser] = useState(() => {
        try {
            const saved = localStorage.getItem('sistestoque_user');
            return saved ? JSON.parse(saved) : null;
        } catch (e) { return null; }
    });
    const [users, setUsers] = useState(() => {
        try {
            const saved = localStorage.getItem('sistestoque_users_list');
            return saved ? JSON.parse(saved) : INITIAL_USERS;
        } catch (e) { return INITIAL_USERS; }
    });
    const [activeTab, setActiveTab] = useState('dashboard');
    const [products, setProducts] = useState(() => {
        try {
            const saved = localStorage.getItem('sistestoque_products');
            return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
        } catch (e) { return INITIAL_PRODUCTS; }
    });
    const [history, setHistory] = useState(() => {
        try {
            const saved = localStorage.getItem('sistestoque_history');
            return saved ? JSON.parse(saved) : INITIAL_HISTORY;
        } catch (e) { return INITIAL_HISTORY; }
    });
    const [nfeHistory, setNfeHistory] = useState(() => {
        try {
            const saved = localStorage.getItem('sistestoque_nfe_history');
            return saved ? JSON.parse(saved) : [];
        } catch (e) { return []; }
    });
    const [gradeTributaria, setGradeTributaria] = useState(() => {
        try {
            const saved = localStorage.getItem('sistestoque_grade_tributaria');
            return saved ? JSON.parse(saved) : [];
        } catch (e) { return []; }
    });
    const [suppliers, setSuppliers] = useState(() => {
        try {
            const saved = localStorage.getItem('sistestoque_suppliers');
            return saved ? JSON.parse(saved) : [];
        } catch (e) { return []; }
    });
    const [financialRecords, setFinancialRecords] = useState(() => {
        try {
            const saved = localStorage.getItem('sistestoque_finance');
            return saved ? JSON.parse(saved) : [];
        } catch (e) { return []; }
    });
    const [containersTransit, setContainersTransit] = useState(() => {
        try {
            const saved = localStorage.getItem('sistestoque_containers_transito');
            return saved ? JSON.parse(saved) : [];
        } catch (e) { return []; }
    });
    const [containersRates, setContainersRates] = useState(() => {
        try {
            const saved = localStorage.getItem('sistestoque_containers_taxas');
            return saved ? JSON.parse(saved) : {};
        } catch (e) { return {}; }
    });
    const [containersRatesMeta, setContainersRatesMeta] = useState(() => {
        try {
            const saved = localStorage.getItem('sistestoque_containers_taxas_meta');
            return saved ? JSON.parse(saved) : {};
        } catch (e) { return {}; }
    });
    const [pedidosMercadorias, setPedidosMercadorias] = useState(() => {
        try {
            const saved = localStorage.getItem('sistestoque_pedidos_mercadorias');
            return saved ? JSON.parse(saved) : [];
        } catch (e) { return []; }
    });
    const [cloudConfig, setCloudConfig] = useState(() => {
        try {
            const saved = localStorage.getItem('sistestoque_cloud');
            if (!saved) return { ...DEFAULT_CLOUD_CONFIG };
            const parsed = JSON.parse(saved) || {};
            return {
                url: parsed.url || DEFAULT_CLOUD_CONFIG.url,
                key: parsed.key || DEFAULT_CLOUD_CONFIG.key
            };
        } catch (e) { return { ...DEFAULT_CLOUD_CONFIG }; }
    });
    const [trelloConfig, setTrelloConfig] = useState(() => {
        try {
            const saved = localStorage.getItem('sistestoque_trello');
            return saved ? JSON.parse(saved) : { key: '', token: '', boardId: '', listId: '' };
        } catch (e) { return { key: '', token: '', boardId: '', listId: '' }; }
    });
    const [syncStatus, setSyncStatus] = useState('offline');
    const [lastAutoSaveAt, setLastAutoSaveAt] = useState(null);
    const [editingProduct, setEditingProduct] = useState(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
    const snapshotSignatureRef = useRef('');

    const getNfeEntryId = (entry) => {
        const raw = String(entry?.chaveAcesso || entry?.chNFe || entry?.id || '').trim();
        if (raw) return raw;
        const fallback = `${entry?.emitCNPJ || ''}-${entry?.nNF || ''}-${entry?.dhEmi || entry?.dateImport || ''}`.trim();
        return fallback || String(Date.now());
    };

    const readLocalJson = (key, fallback) => {
        try {
            const raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) : fallback;
        } catch (e) {
            return fallback;
        }
    };

    const buildPersistenceSnapshot = () => ({
        currentUser: readLocalJson('sistestoque_user', currentUser),
        users: readLocalJson('sistestoque_users_list', users),
        products: readLocalJson('sistestoque_products', products),
        history: readLocalJson('sistestoque_history', history),
        nfeHistory: readLocalJson('sistestoque_nfe_history', nfeHistory),
        gradeTributaria: readLocalJson('sistestoque_grade_tributaria', gradeTributaria),
        suppliers: readLocalJson('sistestoque_suppliers', suppliers),
        finance: readLocalJson('sistestoque_finance', financialRecords),
        containersTransit: readLocalJson('sistestoque_containers_transito', containersTransit),
        containersRates: readLocalJson('sistestoque_containers_taxas', containersRates),
        containersRatesMeta: readLocalJson('sistestoque_containers_taxas_meta', containersRatesMeta),
        pedidosMercadorias: readLocalJson('sistestoque_pedidos_mercadorias', pedidosMercadorias),
        cloudConfig: readLocalJson('sistestoque_cloud', cloudConfig),
        trelloConfig: readLocalJson('sistestoque_trello', trelloConfig)
    });

    const persistSnapshotLocally = (snapshot) => {
        const savedAt = new Date().toISOString();
        localStorage.setItem('sistestoque_backup_latest', JSON.stringify({ savedAt, data: snapshot }));

        const previous = readLocalJson('sistestoque_backup_history', []);
        const nextHistory = [{ savedAt, data: snapshot }, ...(Array.isArray(previous) ? previous : [])].slice(0, 30);
        localStorage.setItem('sistestoque_backup_history', JSON.stringify(nextHistory));
        setLastAutoSaveAt(savedAt);
    };

    useEffect(() => {
        if (currentUser) {
            localStorage.setItem('sistestoque_user', JSON.stringify(currentUser));
        } else {
            localStorage.removeItem('sistestoque_user');
        }
    }, [currentUser]);

    useEffect(() => {
        localStorage.setItem('sistestoque_users_list', JSON.stringify(users));
    }, [users]);

    const handleSaveUser = (userData) => {
        if (userData.id) {
            const updatedUsers = users.map(u => u.id === userData.id ? userData : u);
            setUsers(updatedUsers);
            if (userData.id === currentUser.id) {
                setCurrentUser(userData);
            }
        } else {
            setUsers([...users, { ...userData, id: Date.now() }]);
        }
    };

    const handleDeleteUser = (id) => {
        if (confirm('Deseja realmente remover este usuário?')) {
            setUsers(users.filter(u => u.id !== id));
        }
    };

    const hasPermission = (permission) => {
        if (!currentUser) return false;
        const roleData = ROLES[currentUser.role];
        return roleData.permissions.includes('all') || roleData.permissions.includes(permission);
    };

    const handleLogout = () => {
        if (confirm('Deseja realmente sair do sistema?')) {
            setCurrentUser(null);
        }
    };

    const supabase = useMemo(() => {
        const client = getSupabaseClient(cloudConfig.url, cloudConfig.key);
        if (!client && cloudConfig.url && cloudConfig.key) {
            console.error('Erro ao inicializar Supabase');
        }
        return client;
    }, [cloudConfig.url, cloudConfig.key]);

    useEffect(() => {
        localStorage.setItem('sistestoque_products', JSON.stringify(products));
    }, [products]);

    useEffect(() => {
        localStorage.setItem('sistestoque_history', JSON.stringify(history));
    }, [history]);

    useEffect(() => {
        localStorage.setItem('sistestoque_nfe_history', JSON.stringify(nfeHistory));
    }, [nfeHistory]);

    useEffect(() => {
        setNfeHistory((prev) => {
            if (!Array.isArray(prev) || prev.length === 0) return prev;
            let changed = false;
            const next = prev.map((e) => {
                const id = e?.id ? String(e.id).trim() : '';
                const computedId = id || getNfeEntryId(e);
                const statusDocumento = e?.statusDocumento ? e.statusDocumento : 'PROCESSADA';
                if (computedId !== id || statusDocumento !== e?.statusDocumento) changed = true;
                return { ...e, id: computedId, statusDocumento };
            });
            return changed ? next : prev;
        });
    }, []);

    useEffect(() => {
        localStorage.setItem('sistestoque_grade_tributaria', JSON.stringify(gradeTributaria));
    }, [gradeTributaria]);

    useEffect(() => {
        localStorage.setItem('sistestoque_suppliers', JSON.stringify(suppliers));
    }, [suppliers]);

    useEffect(() => {
        localStorage.setItem('sistestoque_finance', JSON.stringify(financialRecords));
    }, [financialRecords]);

    useEffect(() => {
        localStorage.setItem('sistestoque_containers_transito', JSON.stringify(containersTransit));
    }, [containersTransit]);

    useEffect(() => {
        localStorage.setItem('sistestoque_containers_taxas', JSON.stringify(containersRates));
    }, [containersRates]);

    useEffect(() => {
        localStorage.setItem('sistestoque_containers_taxas_meta', JSON.stringify(containersRatesMeta));
    }, [containersRatesMeta]);

    useEffect(() => {
        localStorage.setItem('sistestoque_pedidos_mercadorias', JSON.stringify(pedidosMercadorias));
    }, [pedidosMercadorias]);

    useEffect(() => {
        localStorage.setItem('sistestoque_cloud', JSON.stringify(cloudConfig));
    }, [cloudConfig]);

    useEffect(() => {
        localStorage.setItem('sistestoque_trello', JSON.stringify(trelloConfig));
    }, [trelloConfig]);

    useEffect(() => {
        const snapshot = buildPersistenceSnapshot();
        persistSnapshotLocally(snapshot);
        snapshotSignatureRef.current = JSON.stringify(snapshot);
    }, [currentUser, users, products, history, nfeHistory, gradeTributaria, suppliers, financialRecords, containersTransit, containersRates, containersRatesMeta, pedidosMercadorias, cloudConfig, trelloConfig]);

    useEffect(() => {
        const syncSharedLocalKeys = () => {
            localStorage.setItem('sistestoque_backup_latest', JSON.stringify({ savedAt: new Date().toISOString(), data: buildPersistenceSnapshot() }));
        };
        window.addEventListener('storage', syncSharedLocalKeys);
        return () => window.removeEventListener('storage', syncSharedLocalKeys);
    }, []);

    const applyRemoteSnapshot = (snapshot) => {
        if (!snapshot || typeof snapshot !== 'object') return;
        if (snapshot.currentUser !== undefined) {
            if (snapshot.currentUser) localStorage.setItem('sistestoque_user', JSON.stringify(snapshot.currentUser));
            else localStorage.removeItem('sistestoque_user');
            setCurrentUser(snapshot.currentUser || null);
        }
        if (snapshot.users !== undefined) {
            localStorage.setItem('sistestoque_users_list', JSON.stringify(snapshot.users || []));
            setUsers(snapshot.users || []);
        }
        if (snapshot.products !== undefined) {
            localStorage.setItem('sistestoque_products', JSON.stringify(snapshot.products || []));
            setProducts(snapshot.products || []);
        }
        if (snapshot.history !== undefined) {
            localStorage.setItem('sistestoque_history', JSON.stringify(snapshot.history || []));
            setHistory(snapshot.history || []);
        }
        if (snapshot.nfeHistory !== undefined) {
            localStorage.setItem('sistestoque_nfe_history', JSON.stringify(snapshot.nfeHistory || []));
            setNfeHistory(snapshot.nfeHistory || []);
        }
        if (snapshot.gradeTributaria !== undefined) {
            localStorage.setItem('sistestoque_grade_tributaria', JSON.stringify(snapshot.gradeTributaria || []));
            setGradeTributaria(snapshot.gradeTributaria || []);
        }
        if (snapshot.suppliers !== undefined) {
            localStorage.setItem('sistestoque_suppliers', JSON.stringify(snapshot.suppliers || []));
            setSuppliers(snapshot.suppliers || []);
        }
        if (snapshot.finance !== undefined) localStorage.setItem('sistestoque_finance', JSON.stringify(snapshot.finance || []));
        if (snapshot.containersTransit !== undefined) localStorage.setItem('sistestoque_containers_transito', JSON.stringify(snapshot.containersTransit || []));
        if (snapshot.containersRates !== undefined) localStorage.setItem('sistestoque_containers_taxas', JSON.stringify(snapshot.containersRates || {}));
        if (snapshot.containersRatesMeta !== undefined) localStorage.setItem('sistestoque_containers_taxas_meta', JSON.stringify(snapshot.containersRatesMeta || {}));
        if (snapshot.pedidosMercadorias !== undefined) localStorage.setItem('sistestoque_pedidos_mercadorias', JSON.stringify(snapshot.pedidosMercadorias || []));
    };

    const restoreFromCloud = async ({ silent = true } = {}) => {
        if (!supabase) return false;
        try {
            const { data, error } = await supabase.from('system_backups').select('payload').eq('id', 'main').maybeSingle();
            if (error) throw error;
            if (data?.payload) {
                applyRemoteSnapshot(data.payload);
                setSyncStatus('online');
                if (!silent) alert('Dados restaurados da nuvem com sucesso.');
                return true;
            }
        } catch (e) {
            console.error('Erro ao restaurar snapshot da nuvem:', e);
            if (!silent) alert('Não foi possível restaurar os dados da nuvem.');
        }
        return false;
    };

    const handleSync = async ({ silent = false } = {}) => {
         if (!supabase) return;
         setSyncStatus('syncing');
         try {
             const snapshot = buildPersistenceSnapshot();
             const { error: backupError } = await supabase
                .from('system_backups')
                .upsert([{ id: 'main', payload: snapshot, updated_at: new Date().toISOString() }], { onConflict: 'id' });

             if (backupError) {
                 throw new Error(backupError?.message || 'Falha ao salvar backup principal.');
             }

             setSyncStatus('online');
             if (!silent) {
                alert('Sincronização total realizada com sucesso!');
             }
         } catch (e) {
             setSyncStatus('error');
             console.error("Erro na sincronização:", e);
             if (!silent) alert("Erro ao sincronizar. Verifique suas chaves e a tabela system_backups no Supabase.");
         }
     };

    useEffect(() => {
        if (!supabase) return;
        restoreFromCloud({ silent: true });
    }, [supabase]);

    useEffect(() => {
        if (!supabase) return;
        const debounceId = setTimeout(() => {
            handleSync({ silent: true });
        }, 1800);
        return () => clearTimeout(debounceId);
    }, [supabase, currentUser, users, products, history, nfeHistory, gradeTributaria, suppliers, cloudConfig, trelloConfig]);

    useEffect(() => {
        const intervalId = setInterval(() => {
            const snapshot = buildPersistenceSnapshot();
            const signature = JSON.stringify(snapshot);
            if (signature === snapshotSignatureRef.current) return;

            snapshotSignatureRef.current = signature;
            persistSnapshotLocally(snapshot);
            if (supabase) handleSync({ silent: true });
        }, 1200);

        const onOnline = () => {
            const snapshot = buildPersistenceSnapshot();
            snapshotSignatureRef.current = JSON.stringify(snapshot);
            persistSnapshotLocally(snapshot);
            if (supabase) handleSync({ silent: true });
        };

        window.addEventListener('online', onOnline);
        return () => {
            clearInterval(intervalId);
            window.removeEventListener('online', onOnline);
        };
    }, [supabase, currentUser, users, products, history, nfeHistory, gradeTributaria, suppliers, cloudConfig, trelloConfig]);

    const handleImportStockFromNFe = (entries, nfeInfo, opts) => {
        const options = {
            atualizarEstoque: opts?.atualizarEstoque !== false,
            gerarFinanceiro: opts?.gerarFinanceiro !== false
        };

        const linkedSupplier = suppliers.find((s) => String(s?.cnpj || '').trim() === String(nfeInfo?.emitCNPJ || '').trim())
            || suppliers.find((s) => String(s?.name || '').trim().toLowerCase() === String(nfeInfo?.emitNome || '').trim().toLowerCase());
        const supplierName = linkedSupplier?.name || nfeInfo?.emitNome || '';
        const supplierCNPJ = linkedSupplier?.cnpj || nfeInfo?.emitCNPJ || '';
        const supplierId = linkedSupplier?.id || null;

        const updatedProducts = [...products];
        const newHistory = [...history];
        let skippedMissingBarcode = 0;

        if (options.atualizarEstoque) {
            entries.forEach(entry => {
                const barras = String(entry.barras || '').trim();
                const byBarcodeIdx = barras ? updatedProducts.findIndex(p => String(p.barras || '').trim() === barras) : -1;
                const byIdIdx = entry.productId ? updatedProducts.findIndex(p => p.id === entry.productId) : -1;
                const byCodIdx = entry.codInterno ? updatedProducts.findIndex(p => String(p.codInterno || '').trim() === String(entry.codInterno || '').trim()) : -1;
                const productIdx = byBarcodeIdx !== -1 ? byBarcodeIdx : (byIdIdx !== -1 ? byIdIdx : byCodIdx);

                if (productIdx !== -1) {
                    const effectiveProductId = updatedProducts[productIdx].id;
                    updatedProducts[productIdx] = { 
                        ...updatedProducts[productIdx], 
                        stock: (Number(updatedProducts[productIdx].stock) || 0) + (Number(entry.quantity) || 0),
                        ncm: updatedProducts[productIdx].ncm || entry.ncm,
                        codInterno: updatedProducts[productIdx].codInterno || entry.codInterno,
                        barras: updatedProducts[productIdx].barras || barras,
                        fornecedor: updatedProducts[productIdx].fornecedor || supplierName,
                        fornecedorCNPJ: updatedProducts[productIdx].fornecedorCNPJ || supplierCNPJ,
                        fornecedorId: updatedProducts[productIdx].fornecedorId || supplierId,
                        prodForn: updatedProducts[productIdx].prodForn || entry.codInterno
                    };

                    newHistory.push({
                        id: Date.now() + Math.random(),
                        productId: effectiveProductId,
                        type: 'ENTRADA',
                        quantity: entry.quantity,
                        date: new Date().toISOString(),
                        user: 'XML Import',
                        observation: `NF-e: ${nfeInfo.nNF} - ${nfeInfo.emitNome}`
                    });
                } else {
                    if (!barras) {
                        skippedMissingBarcode += 1;
                        return;
                    }
                    const newId = Date.now() + Math.random();
                    updatedProducts.push({
                        ...PRODUCT_DEFAULTS,
                        id: newId,
                        name: entry.productName,
                        category: 'Importado XML',
                        price: entry.price * 1.5,
                        venda: entry.price * 1.5,
                        custo: entry.price,
                        stock: entry.quantity,
                        minStock: 5,
                        unit: entry.unit || 'UN',
                        codInterno: entry.codInterno,
                        barras,
                        ncm: entry.ncm,
                        fornecedor: supplierName,
                        fornecedorCNPJ: supplierCNPJ,
                        fornecedorId: supplierId,
                        prodForn: entry.codInterno
                    });

                    newHistory.push({
                        id: Date.now() + Math.random(),
                        productId: newId,
                        type: 'ENTRADA',
                        quantity: entry.quantity,
                        date: new Date().toISOString(),
                        user: 'XML Import',
                        observation: `NF-e: ${nfeInfo.nNF} - ${nfeInfo.emitNome}`
                    });
                }
            });
        }

        if (options.atualizarEstoque) {
            setProducts(updatedProducts);
            setHistory(newHistory);
        }

        setNfeHistory((prev) => {
            const nextId = getNfeEntryId(nfeInfo);
            if (prev.some(e => String(e.id || '').trim() === nextId)) return prev;
            return [...prev, {
                ...nfeInfo,
                id: nextId,
                statusDocumento: 'PROCESSADA',
                itemsCount: entries.length,
                fornecedorId: supplierId,
                fornecedorCNPJ: supplierCNPJ,
                fornecedorNome: supplierName,
                items: Array.isArray(nfeInfo?.items)
                    ? nfeInfo.items.map((item) => ({
                        ...item,
                        fornecedorId: item?.fornecedorId || supplierId,
                        fornecedorCNPJ: item?.fornecedorCNPJ || supplierCNPJ,
                        fornecedorNome: item?.fornecedorNome || supplierName
                    }))
                    : nfeInfo?.items
            }];
        });

        if (options.gerarFinanceiro) {
            const savedFinance = localStorage.getItem('sistestoque_finance');
            const currentFinance = savedFinance ? JSON.parse(savedFinance) : [];
            const newPayable = {
                id: Date.now() + Math.random(),
                type: 'payable',
                description: `Entrada NF-e: ${nfeInfo.nNF}`,
                entity: nfeInfo.emitNome,
                value: nfeInfo.totais.vNF,
                dueDate: new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                category: 'Mercadorias',
                status: 'pending'
            };
            localStorage.setItem('sistestoque_finance', JSON.stringify([...currentFinance, newPayable]));
        }

        const extra = skippedMissingBarcode > 0 ? ` Itens sem código de barras ignorados: ${skippedMissingBarcode}.` : '';
        alert(`NF-e ${nfeInfo.nNF} processada com sucesso! ${entries.length} itens processados.${extra}`);
    };

    const handleExcluirEntradaNFe = (entryId) => {
        const id = String(entryId || '').trim();
        if (!id) return;
        const entry = nfeHistory.find(e => String(e.id || '').trim() === id);
        if (!entry) return;
        if (!confirm(`Deseja realmente excluir a entrada da NF-e ${entry.nNF || ''}? (não altera o estoque)`)) return;
        setNfeHistory((prev) => prev.filter(e => String(e.id || '').trim() !== id));
    };

    const handleAtualizarItemEntradaNFe = (entryId, itemIndex, itemData) => {
        const id = String(entryId || '').trim();
        if (!id) return;
        const idx = Number(itemIndex);
        if (!Number.isInteger(idx) || idx < 0) return;

        const previousEntry = nfeHistory.find(e => String(e.id || '').trim() === id);
        if (!previousEntry) return;
        const oldItem = previousEntry.items?.[idx];
        if (!oldItem) return;

        const oldQty = Number(oldItem.qCom ?? oldItem.quantity ?? 0) || 0;
        const newQty = Number(itemData?.qCom ?? 0) || 0;
        const delta = newQty - oldQty;

        const normalizeBarcode = (value) => String(value || '').trim();
        const barras = normalizeBarcode(itemData?.cEAN || itemData?.cEANTrib || itemData?.barras || oldItem?.cEAN || oldItem?.cEANTrib);
        const codInterno = String(itemData?.cProd || oldItem?.cProd || '').trim();
        const name = String(itemData?.xProd || oldItem?.xProd || '').trim().toLowerCase();

        if (delta !== 0) {
            setProducts((prevProducts) => {
                const next = [...prevProducts];
                const productIdx = barras
                    ? next.findIndex(p => normalizeBarcode(p.barras) === barras)
                    : (codInterno
                        ? next.findIndex(p => String(p.codInterno || '').trim() === codInterno)
                        : next.findIndex(p => String(p.name || '').trim().toLowerCase() === name));

                if (productIdx !== -1) {
                    next[productIdx] = {
                        ...next[productIdx],
                        stock: (Number(next[productIdx].stock) || 0) + delta,
                        caixaCom: itemData?.caixaCom ?? next[productIdx].caixaCom,
                    };
                }
                return next;
            });

            setHistory((prevHistory) => ([
                ...prevHistory,
                {
                    id: Date.now() + Math.random(),
                    productId: null,
                    type: delta > 0 ? 'ENTRADA' : 'SAÍDA',
                    quantity: Math.abs(delta),
                    date: new Date().toISOString(),
                    user: 'Ajuste NF-e',
                    observation: `Ajuste item NF-e ${previousEntry.nNF || ''}: ${oldQty} -> ${newQty}`
                }
            ]));
        }

        setNfeHistory((prev) => prev.map((entry) => {
            if (String(entry.id || '').trim() !== id) return entry;
            const nextItems = Array.isArray(entry.items) ? [...entry.items] : [];
            const prevItem = nextItems[idx] || {};
            const mergedItem = {
                ...prevItem,
                ...itemData,
                qCom: newQty,
                vUnCom: Number(itemData?.vUnCom ?? prevItem?.vUnCom ?? 0) || 0,
                vProd: Number(itemData?.vProd ?? prevItem?.vProd ?? 0) || 0,
                caixaCom: itemData?.caixaCom ?? prevItem?.caixaCom ?? '',
                fornecedorId: itemData?.fornecedorId ?? prevItem?.fornecedorId ?? entry?.fornecedorId ?? null,
                fornecedorCNPJ: itemData?.fornecedorCNPJ ?? prevItem?.fornecedorCNPJ ?? entry?.fornecedorCNPJ ?? '',
                fornecedorNome: itemData?.fornecedorNome ?? prevItem?.fornecedorNome ?? entry?.fornecedorNome ?? entry?.emitNome ?? ''
            };
            nextItems[idx] = mergedItem;

            const totais = { ...(entry.totais || {}) };
            const totalProdutos = nextItems.reduce((acc, item) => acc + (Number(item?.vProd || 0) || 0), 0);
            totais.vProdTot = totalProdutos;

            return {
                ...entry,
                items: nextItems,
                totais,
                updatedAt: new Date().toISOString()
            };
        }));
    };

    const handleEstornarEntradaNFe = (entryId) => {
        const id = String(entryId || '').trim();
        if (!id) return;
        const entry = nfeHistory.find(e => String(e.id || '').trim() === id);
        if (!entry) return;
        if (String(entry.statusDocumento || '').toUpperCase() === 'ESTORNADA') {
            alert('Esta nota já está estornada.');
            return;
        }
        if (!confirm(`Deseja estornar a entrada e o saldo de estoque da NF-e ${entry.nNF || ''}?`)) return;

        const updatedProducts = [...products];
        const newHistory = [...history];
        let estornados = 0;
        let ignorados = 0;

        (entry.items || []).forEach((item) => {
            const barras = String(item?.cEAN || item?.cEANTrib || item?.barras || '').trim();
            const codInterno = String(item?.cProd || item?.codInterno || '').trim();
            const name = String(item?.xProd || item?.productName || '').trim().toLowerCase();
            const qty = Number(item?.qCom ?? item?.quantity ?? 0) || 0;
            if (qty <= 0) { ignorados += 1; return; }

            const idx = barras
                ? updatedProducts.findIndex(p => String(p.barras || '').trim() === barras)
                : (codInterno
                    ? updatedProducts.findIndex(p => String(p.codInterno || '').trim() === codInterno)
                    : updatedProducts.findIndex(p => String(p.name || '').trim().toLowerCase() === name));

            if (idx === -1) { ignorados += 1; return; }

            updatedProducts[idx] = {
                ...updatedProducts[idx],
                stock: (Number(updatedProducts[idx].stock) || 0) - qty
            };

            newHistory.push({
                id: Date.now() + Math.random(),
                productId: updatedProducts[idx].id,
                type: 'SAÍDA',
                quantity: qty,
                date: new Date().toISOString(),
                user: 'Estorno XML',
                observation: `Estorno NF-e: ${entry.nNF || ''} - ${entry.emitNome || ''}`
            });

            estornados += 1;
        });

        setProducts(updatedProducts);
        setHistory(newHistory);

        setNfeHistory((prev) => prev.map((e) => {
            if (String(e.id || '').trim() !== id) return e;
            return {
                ...e,
                statusDocumento: 'ESTORNADA',
                estornoEm: new Date().toISOString()
            };
        }));

        const savedFinance = localStorage.getItem('sistestoque_finance');
        const currentFinance = savedFinance ? JSON.parse(savedFinance) : [];
        const updatedFinance = currentFinance.filter((r) => {
            const desc = String(r?.description || '').trim();
            const entity = String(r?.entity || '').trim();
            if (desc === `Entrada NF-e: ${entry.nNF}` && entity === String(entry.emitNome || '').trim()) return false;
            return true;
        });
        localStorage.setItem('sistestoque_finance', JSON.stringify(updatedFinance));

        alert(`Estorno concluído. Itens estornados: ${estornados}. Itens ignorados: ${ignorados}.`);
    };

    const handleBulkProductImport = (bulkData) => {
        const normalizeBarcode = (value) => String(value || '').trim();
        const allowedKeys = new Set(Object.keys(PRODUCT_DEFAULTS).filter(k => k !== 'id'));
        const parseNumberSmart = (value) => {
            if (value === null || value === undefined || value === '') return undefined;
            if (typeof value === 'number') return Number.isFinite(value) ? value : undefined;
            const raw = String(value).trim();
            if (!raw) return undefined;
            const cleaned = raw.replace(/[^\d,.\-]/g, '');
            if (!cleaned) return undefined;
            const normalized = cleaned.includes(',')
                ? cleaned.replace(/\./g, '').replace(',', '.')
                : cleaned.replace(/,/g, '');
            const parsed = Number.parseFloat(normalized);
            return Number.isFinite(parsed) ? parsed : undefined;
        };
        const normalizeFotos = (fotosValue, fotoValue) => {
            if (Array.isArray(fotosValue)) {
                const arr = fotosValue.map(v => String(v || '').trim()).slice(0, 4);
                while (arr.length < 4) arr.push('');
                return arr;
            }
            const first = String(fotoValue || '').trim();
            return [first, '', '', ''];
        };
        const pickKnownFields = (obj) => {
            const out = {};
            allowedKeys.forEach((k) => {
                if (obj?.[k] !== undefined) out[k] = obj[k];
            });
            if (out.venda === undefined && obj?.price !== undefined) out.venda = obj.price;
            if (out.price === undefined && obj?.venda !== undefined) out.price = obj.venda;
            if (out.custo === undefined && obj?.costPrice !== undefined) out.custo = obj.costPrice;

            if (out.stock !== undefined) out.stock = parseNumberSmart(out.stock);
            if (out.minStock !== undefined) out.minStock = parseNumberSmart(out.minStock);
            if (out.price !== undefined) out.price = parseNumberSmart(out.price);
            if (out.venda !== undefined) out.venda = parseNumberSmart(out.venda);
            if (out.custo !== undefined) out.custo = parseNumberSmart(out.custo);
            if (out.margemVenda !== undefined) out.margemVenda = parseNumberSmart(out.margemVenda);
            if (out.pesoBruto !== undefined) out.pesoBruto = parseNumberSmart(out.pesoBruto);
            if (out.pesoLiquido !== undefined) out.pesoLiquido = parseNumberSmart(out.pesoLiquido);
            if (out.validade !== undefined) out.validade = parseNumberSmart(out.validade);
            return out;
        };

        let adicionados = 0;
        let atualizados = 0;
        let semCodigo = 0;
        let repetidosNoArquivo = 0;

        setProducts((prev) => {
            const next = [...prev];
            const indexByBarcode = new Map();
            next.forEach((p, idx) => {
                const b = normalizeBarcode(p.barras);
                if (b) indexByBarcode.set(b, idx);
            });

            const processedInFile = new Set();

            (bulkData || []).forEach((row, idx) => {
                const barras = normalizeBarcode(row?.barras);
                if (!barras) { semCodigo += 1; return; }
                if (processedInFile.has(barras)) { repetidosNoArquivo += 1; return; }
                processedInFile.add(barras);

                const patch = pickKnownFields(row);
                const fotos = normalizeFotos(row?.fotos, row?.foto);
                const hasFotos = fotos.some(v => v);

                if (indexByBarcode.has(barras)) {
                    const pIdx = indexByBarcode.get(barras);
                    const current = next[pIdx];
                    const merged = { ...current, ...patch, barras };
                    if (hasFotos) merged.fotos = fotos;
                    merged.foto = (Array.isArray(merged.fotos) ? merged.fotos[0] : merged.foto) || merged.foto || '';
                    next[pIdx] = merged;
                    atualizados += 1;
                    return;
                }

                const newId = Date.now() + idx;
                const newProduct = {
                    ...PRODUCT_DEFAULTS,
                    ...patch,
                    id: newId,
                    barras
                };
                if (hasFotos) newProduct.fotos = fotos;
                newProduct.foto = (Array.isArray(newProduct.fotos) ? newProduct.fotos[0] : newProduct.foto) || '';
                if (newProduct.price === 0 && (newProduct.venda || 0) > 0) newProduct.price = newProduct.venda;
                if ((newProduct.venda || 0) === 0 && (newProduct.price || 0) > 0) newProduct.venda = newProduct.price;
                if (newProduct.stock === undefined) newProduct.stock = 0;
                if (newProduct.minStock === undefined) newProduct.minStock = 5;
                next.push(newProduct);
                indexByBarcode.set(barras, next.length - 1);
                adicionados += 1;
            });

            return next;
        });

        const msg = `Importação concluída: ${adicionados} adicionados, ${atualizados} atualizados. Sem código de barras: ${semCodigo}. Repetidos no arquivo: ${repetidosNoArquivo}.`;
        alert(msg);
        return { adicionados, atualizados, semCodigo, repetidosNoArquivo, mensagem: msg };
    };

    const handleAddSupplier = (supplierData, isUpdate = false) => {
        if (isUpdate) {
            setSuppliers(suppliers.map(s => s.id === supplierData.id ? supplierData : s));
        } else {
            setSuppliers([...suppliers, supplierData]);
        }
    };

    const handleDeleteSupplier = (id) => {
        if (confirm('Deseja realmente remover este fornecedor?')) {
            setSuppliers(suppliers.filter(s => s.id !== id));
        }
    };

    const normalizeBarcode = (value) => String(value || '').trim();

    const collectAllBarcodes = (product) => {
        const primary = normalizeBarcode(product?.barras);
        const secondaries = Array.isArray(product?.secondaryBarcodes)
            ? product.secondaryBarcodes.map((code) => normalizeBarcode(code)).filter(Boolean)
            : [];
        return [primary, ...secondaries].filter(Boolean);
    };

    const isBarcodeAssignedToOtherProduct = (barcode, currentProductId = null) => {
        const normalized = normalizeBarcode(barcode);
        if (!normalized) return false;
        return products.some((product) => product.id !== currentProductId && collectAllBarcodes(product).includes(normalized));
    };

    const handleAddSecondaryBarcode = (productId, barcode) => {
        const normalized = normalizeBarcode(barcode);
        if (!normalized) {
            alert('Informe um código de barras válido.');
            return false;
        }

        const targetProduct = products.find((product) => product.id === productId);
        if (!targetProduct) return false;

        const ownBarcodes = collectAllBarcodes(targetProduct);
        if (ownBarcodes.includes(normalized)) {
            alert('Este código de barras já está vinculado a este produto.');
            return false;
        }

        if (isBarcodeAssignedToOtherProduct(normalized, productId)) {
            alert('Este código de barras já está vinculado a outro código interno.');
            return false;
        }

        setProducts(products.map((product) => product.id === productId
            ? { ...product, secondaryBarcodes: [...(Array.isArray(product.secondaryBarcodes) ? product.secondaryBarcodes : []), normalized] }
            : product));
        return true;
    };

    const handleRemoveSecondaryBarcode = (productId, barcode) => {
        const normalized = normalizeBarcode(barcode);
        setProducts(products.map((product) => product.id === productId
            ? { ...product, secondaryBarcodes: (Array.isArray(product.secondaryBarcodes) ? product.secondaryBarcodes : []).filter((code) => normalizeBarcode(code) !== normalized) }
            : product));
    };

    const handleSaveProduct = (formData) => {
        const barcode = normalizeBarcode(formData.barras);
        const codInterno = String(formData.codInterno || '').trim();
        if (!barcode) {
            alert('Código de Barras é obrigatório.');
            return;
        }
        if (!codInterno) {
            alert('Código Interno é obrigatório.');
            return;
        }
        const duplicateInternal = products.some(p => String(p.codInterno || '').trim() === codInterno && p.id !== formData.id);
        if (duplicateInternal) {
            alert('Código interno já cadastrado. Use um código interno único.');
            return;
        }
        if (isBarcodeAssignedToOtherProduct(barcode, formData.id)) {
            alert('Código de Barras já cadastrado. Use um código único.');
            return;
        }

        const normalizedSecondary = Array.isArray(formData.secondaryBarcodes)
            ? Array.from(new Set(formData.secondaryBarcodes.map((code) => normalizeBarcode(code)).filter(Boolean)))
            : [];

        if (normalizedSecondary.includes(barcode)) {
            alert('O código de barras principal não pode se repetir entre os secundários.');
            return;
        }

        const duplicateSecondaryInOtherProduct = normalizedSecondary.find((code) => isBarcodeAssignedToOtherProduct(code, formData.id));
        if (duplicateSecondaryInOtherProduct) {
            alert(`O código secundário ${duplicateSecondaryInOtherProduct} já está vinculado a outro produto.`);
            return;
        }

        const duplicateSecondaryInsideProduct = normalizedSecondary.length !== new Set(normalizedSecondary).size;
        if (duplicateSecondaryInsideProduct) {
            alert('Há códigos secundários repetidos no mesmo produto.');
            return;
        }

        const finalFormData = { ...formData, codInterno, barras: barcode, secondaryBarcodes: normalizedSecondary };

        if (formData.id) {
            const oldProduct = products.find(p => p.id === formData.id);
            if (oldProduct && oldProduct.stock !== formData.stock) {
                const diff = formData.stock - oldProduct.stock;
                const newEntry = {
                    id: Date.now(),
                    productId: formData.id,
                    type: diff > 0 ? 'ENTRADA' : 'SAÍDA',
                    quantity: Math.abs(diff),
                    date: new Date().toISOString(),
                    user: 'Admin'
                };
                setHistory([...history, newEntry]);
            }
            setProducts(products.map(p => p.id === formData.id ? finalFormData : p));
        } else {
            const newId = Date.now();
            const newProduct = { ...finalFormData, id: newId };
            setProducts([...products, newProduct]);
            if (finalFormData.stock > 0) {
                setHistory([...history, {
                    id: Date.now() + 1,
                    productId: newId,
                    type: 'ENTRADA',
                    quantity: finalFormData.stock,
                    date: new Date().toISOString(),
                    user: 'Admin'
                }]);
            }
        }
        setIsFormOpen(false);
    };

    const handleImport = (importedProducts) => {
        handleBulkProductImport(importedProducts);
    };

    const handleDeleteProduct = (id) => {
        if (confirm('Tem certeza que deseja excluir este produto?')) {
            setProducts(products.filter(p => p.id !== id));
        }
    };

    const handleDeleteProducts = (ids) => {
        if (!Array.isArray(ids) || ids.length === 0) return;
        setProducts(products.filter(p => !ids.includes(p.id)));
    };

    const openEdit = (product) => {
        if (!hasPermission('products')) {
            alert('Você não tem permissão para editar produtos.');
            return;
        }
        setEditingProduct(product);
        setIsFormOpen(true);
    };

    if (!currentUser) {
        return <Login onLogin={setCurrentUser} INITIAL_USERS={INITIAL_USERS} ROLES={ROLES} />;
    }

    const NavItem = ({ active, onClick, icon, label }) => (
        <button 
            onClick={() => {
                onClick();
                setIsMobileNavOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${active ? 'bg-slate-600 text-white shadow-md shadow-slate-200' : 'text-slate-500 hover:text-slate-600 hover:bg-slate-100'}`}
        >
            <div className={active ? 'text-white' : 'text-slate-400 group-hover:text-slate-500'}>
                <Icon name={icon} size={20} />
            </div>
            <span className="text-sm font-bold whitespace-nowrap">{label}</span>
        </button>
    );

    return (
        <div className="flex h-screen w-full bg-[#f1f5f9] text-slate-900 overflow-hidden">
            {isMobileNavOpen && (
                <button
                    type="button"
                    aria-label="Fechar menu"
                    onClick={() => setIsMobileNavOpen(false)}
                    className="fixed inset-0 z-30 bg-slate-900/40 lg:hidden"
                />
            )}
            {/* Sidebar */}
            <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200 flex flex-col shrink-0 shadow-sm transform transition-transform duration-300 lg:static lg:translate-x-0 ${isMobileNavOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="p-8">
                    <div className="flex items-center gap-3">
                        <div className="bg-slate-600 p-2.5 rounded-2xl shadow-lg shadow-slate-100">
                            <Icon name="products" size={24} className="text-white" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-lg font-black tracking-tight leading-none text-slate-900">EP Sistemas</span>
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Empresarial</span>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 px-4 py-2 space-y-1.5 overflow-y-auto custom-scrollbar">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-4 mb-4 mt-2">Principal</div>
                    {hasPermission('dashboard') && <NavItem active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon="dashboard" label="Painel" />}
                    {hasPermission('products') && <NavItem active={activeTab === 'products'} onClick={() => setActiveTab('products')} icon="products" label="Produtos" />}
                    {hasPermission('suppliers') && <NavItem active={activeTab === 'suppliers'} onClick={() => setActiveTab('suppliers')} icon="suppliers" label="Fornecedores" />}
                    {hasPermission('containers') && <NavItem active={activeTab === 'containers'} onClick={() => setActiveTab('containers')} icon="containers" label="Containers em Trânsito" />}
                    {hasPermission('containers') && <NavItem active={activeTab === 'pedidos-mercadorias'} onClick={() => setActiveTab('pedidos-mercadorias')} icon="import-nfe" label="Pedido Mercadorias" />}

                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-4 mt-8 mb-4">Gestão</div>
                    {hasPermission('import-nfe') && <NavItem active={activeTab === 'nfe-entries'} onClick={() => setActiveTab('nfe-entries')} icon="import-nfe" label="Entradas NF-e" />}
                    {hasPermission('import-nfe') && <NavItem active={activeTab === 'grade-tributaria'} onClick={() => setActiveTab('grade-tributaria')} icon="layers" label="Fiscal / Grade" />}
                    {hasPermission('import') && <NavItem active={activeTab === 'import'} onClick={() => setActiveTab('import')} icon="upload" label="Importação" />}
                    {hasPermission('import') && <NavItem active={activeTab === 'bulk-import'} onClick={() => setActiveTab('bulk-import')} icon="upload" label="Carga em Lote" />}
                    {hasPermission('reports') && <NavItem active={activeTab === 'reports'} onClick={() => setActiveTab('reports')} icon="layers" label="Relatórios" />}
                    {hasPermission('financial') && <NavItem active={activeTab === 'financial'} onClick={() => setActiveTab('financial')} icon="dollar-sign" label="Financeiro" />}
                    {hasPermission('settings') && <NavItem active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon="settings" label="Configurações" />}
                </nav>
                
                <div className="p-4 border-t border-slate-100">
                    <div 
                        onClick={() => hasPermission('users') && setActiveTab('users')}
                        className={`p-4 rounded-2xl border flex items-center gap-3 transition-all duration-200 ${hasPermission('users') ? 'bg-slate-50 border-slate-100 hover:bg-blue-50 hover:border-blue-100 cursor-pointer group/profile' : 'bg-slate-50/50 border-slate-50 opacity-80'}`}
                    >
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xs font-black shrink-0 transition-colors ${hasPermission('users') ? 'bg-slate-100 text-slate-700 group-hover/profile:bg-slate-600 group-hover/profile:text-white' : 'bg-slate-200 text-slate-500'}`}>
                            {currentUser.username.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-black text-slate-900 truncate group-hover/profile:text-slate-600 transition-colors">{currentUser.fullName}</p>
                            <p className="text-[10px] text-slate-500 font-bold uppercase">{ROLES[currentUser.role].name}</p>
                        </div>
                        <button 
                            onClick={(e) => { e.stopPropagation(); handleLogout(); }} 
                            className="text-slate-400 hover:text-red-500 transition-colors p-1 shrink-0"
                            title="Sair do Sistema"
                        >
                            <Icon name="logout" size={16} />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 relative">
                <header className="min-h-20 border-b border-slate-200 flex items-center justify-between px-4 md:px-6 lg:px-10 py-4 bg-white/80 backdrop-blur-xl shrink-0 gap-4">
                    <div className="flex items-center gap-3 md:gap-4 min-w-0">
                        <button
                            type="button"
                            onClick={() => setIsMobileNavOpen(true)}
                            className="lg:hidden p-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-all"
                            aria-label="Abrir menu"
                        >
                            <Icon name="layers" size={18} />
                        </button>
                        <div className="h-8 w-px bg-slate-300 hidden md:block"></div>
                        <h2 className="text-xs md:text-sm font-black text-slate-500 uppercase tracking-[0.2em] truncate">
                            {activeTab === 'dashboard'
                                ? 'Painel de Controle'
                                : activeTab === 'products'
                                    ? 'Painel de Produtos'
                                    : activeTab.replace('-', ' ')}
                        </h2>
                    </div>
                    <div className="flex items-center gap-3 md:gap-4 flex-wrap justify-end">
                        <div className="flex items-center gap-2 px-3 md:px-4 py-2 bg-slate-100 border border-slate-200 rounded-full">
                            <div className={`w-2 h-2 rounded-full shadow-[0_0_8px] ${syncStatus === 'online' ? 'bg-emerald-500 shadow-emerald-300' : syncStatus === 'syncing' ? 'bg-amber-500 shadow-amber-300' : syncStatus === 'error' ? 'bg-red-500 shadow-red-300' : 'bg-slate-500 shadow-slate-300'}`}></div>
                            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
                                {syncStatus === 'online' ? 'Salvo Automaticamente' : syncStatus === 'syncing' ? 'Salvando...' : syncStatus === 'error' ? 'Erro ao Salvar' : 'Sistema Ativo'}
                            </span>
                        </div>
                        {lastAutoSaveAt && (
                            <div className="text-right">
                                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Último Auto-Save</p>
                                <p className="text-xs font-bold text-slate-500 data-mono">{new Date(lastAutoSaveAt).toLocaleTimeString('pt-BR')}</p>
                            </div>
                        )}
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-10 custom-scrollbar">
                    <div className="max-w-[1600px] mx-auto">
                        {activeTab === 'dashboard' && <Dashboard products={products} history={history} />}
                        {activeTab === 'products' && (
                            <div className="space-y-6">
                                {isFormOpen && (
                                    <ProductForm 
                                        product={editingProduct} 
                                        onSave={handleSaveProduct} 
                                        onCancel={() => setIsFormOpen(false)} 
                                        suppliers={suppliers}
                                    />
                                )}
                                <ProductList products={products} onEdit={openEdit} onDelete={handleDeleteProduct} onDeleteMany={handleDeleteProducts} onBulkImport={handleBulkProductImport} trelloConfig={trelloConfig} />
                            </div>
                        )}
                        {activeTab === 'containers' && (
                            <ContainersTransitModule
                                operations={containersTransit}
                                setOperations={setContainersTransit}
                                rates={containersRates}
                                setRates={setContainersRates}
                                rateMeta={containersRatesMeta}
                                setRateMeta={setContainersRatesMeta}
                            />
                        )}
                        {activeTab === 'pedidos-mercadorias' && (
                            <PedidoMercadoriasModule
                                products={products}
                                suppliers={suppliers}
                                records={pedidosMercadorias}
                                setRecords={setPedidosMercadorias}
                                containerRecords={containersTransit}
                            />
                        )}
                        {activeTab === 'suppliers' && <SupplierModule suppliers={suppliers} onAddSupplier={handleAddSupplier} onDeleteSupplier={handleDeleteSupplier} />}
                        {activeTab === 'import' && <ImportModule products={products} onSave={handleSaveProduct} onBulkImport={handleBulkProductImport} />}
                        {activeTab === 'import-nfe' && <XMLImportModule products={products} onImportStock={handleImportStockFromNFe} nfeHistory={nfeHistory} suppliers={suppliers} onAddSupplier={handleAddSupplier} />}
                        {activeTab === 'bulk-import' && <BulkProductImport onBulkImport={handleBulkProductImport} />}
                        {activeTab === 'nfe-entries' && (
                            <NFeEntryModule
                                nfeHistory={nfeHistory}
                                products={products}
                                suppliers={suppliers}
                                onImportStock={handleImportStockFromNFe}
                                onAddSupplier={handleAddSupplier}
                                onExcluirEntrada={handleExcluirEntradaNFe}
                                onEstornarEntrada={handleEstornarEntradaNFe}
                                onAtualizarItemEntrada={handleAtualizarItemEntradaNFe}
                            />
                        )}
                        {activeTab === 'grade-tributaria' && <GradeTributariaModule gradeTributaria={gradeTributaria} setGradeTributaria={setGradeTributaria} />}
                        {activeTab === 'reports' && <Reports products={products} />}
                        {activeTab === 'financial' && <FinancialModule suppliers={suppliers} records={financialRecords} setRecords={setFinancialRecords} />}
                        {activeTab === 'users' && <UserModule users={users} onSaveUser={handleSaveUser} onDeleteUser={handleDeleteUser} currentUser={currentUser} />}
                        {activeTab === 'settings' && <ConfigModule cloudConfig={cloudConfig} onSaveCloudConfig={setCloudConfig} syncData={handleSync} trelloConfig={trelloConfig} onSaveTrelloConfig={setTrelloConfig} />}
                    </div>
                </main>
            </div>

            {isProfileModalOpen && (
                <UserForm 
                    user={currentUser} 
                    onSave={(data) => { handleSaveUser(data); setIsProfileModalOpen(false); }} 
                    onCancel={() => setIsProfileModalOpen(false)} 
                />
            )}
        </div>
    );
};

export default App;
