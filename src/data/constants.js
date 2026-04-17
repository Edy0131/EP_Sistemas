export const ROLES = {
    ADMIN: { name: 'Administrador', permissions: ['all'] },
    MANAGER: { name: 'Gerente', permissions: ['dashboard', 'products', 'suppliers', 'containers', 'import-nfe', 'reports', 'financial'] },
    OPERATOR: { name: 'Operador', permissions: ['dashboard', 'products', 'containers', 'import-nfe'] }
};

export const INITIAL_USERS = [
    { id: 1, username: 'admin', password: '123', role: 'ADMIN', fullName: 'Edson Prestes' },
    { id: 2, username: 'gerente', password: '123', role: 'MANAGER', fullName: 'Gerente Geral' },
    { id: 3, username: 'operador', password: '123', role: 'OPERATOR', fullName: 'Operador de Estoque' }
];

export const PRODUCT_DEFAULTS = {
    // Basic & Original
    name: '', category: '', price: 0, stock: 0, minStock: 0, unit: 'Unidade',
    ano: '', fornecedor: '', codInterno: '', codigo: '', prodForn: '', barras: '', secondaryBarcodes: [],
    itens1536: '', te: '', referencia: '', material: '', valor: 0, tipo: '',
    caixaCom: '', cbm: '', size: '', peso: '', observacao: '', packing: '',
    complementares: '', zeroField: '', nossoLogo: '', ncm: '', pesoLiquido: '',
    pesoBruto: '', data: '', compra: 0, venda: 0, custo: 0, margem: 0,
    saldo: 0, rep: '', deposito: '', repCompra: '', ultimoPedido: '',
    container: '', ii: 0, ipi: 0, pis: 0, cofins: 0, ultimaEntrada: '',
    saoJoao: '', moduloVenda: '', description: '', descricaoDI: '',
    linkImagem: '', linkArte: '', foto: '', fotos: ['', '', '', ''], inmetro: '', informacoes: '',
    
    // New Classic ERP Fields
    tipoProduto: 'ESTOQUE',
    complementoNome: '',
    nomeECF: '',
    tipoVenda: 'CAIXA',
    margemVenda: 0,
    tipoItem: '07 - MATERIAL DE USO E CONSUMO',
    cest: '',
    secaoCategoria: '',
    grupo: '',
    gradeProdutos: '',
    categoriaFabricante: '',
    categoriaEcommerce: '',
    tipoEmbalagem: '1',
    unidUniversal: 'UN',
    qtdProd: 1.00,
    qtdUnMed: 0,
    unMedida: 'UNIDADE',
    ecommerce: false,
    altura: '', largura: '', profundidade: '', volume: '',
    loja: '4',
    dataInicio: '2001-01-01',
    dataFim: '',
    editarLoja: 'NA LOJA INFORMADA',
    gradeTributariaVenda: '290',
    gradeDevolucaoVenda: '2074',
    tipoCredito: '0',
    naturezaReceita: '0',
    classificacaoTributaria: '',
    status: 'ATIVO',
    validade: 0,
    tecla: 0,
    taraBalanca: 0,
    qtdECompra: 0,
    embalagemCompra: 0,
    descMaxAtacado: 0,
    codigoVasilhame: 0,
    codigoANP: 0,
    comissao: 0,
    garantia: 0,
    descontoProgressivo: 0,
    taxaAdicRest: 0,
    
    // NF-e Venda - Tributação
    cfopVenda: '',
    origemMercadoria: '0 - Nacional',
    icmsRegime: 'NORMAL',
    icmsCST: '00',
    csosn: '102',
    icmsAliquota: 18,
    icmsModalidadeBC: '3 - Valor da operação',
    icmsMVA: 0,
    icmsSTAliquota: 0,
    fcpAliquota: 0,
    ipiCST: '50',
    ipiEnquadramento: '999',
    ipiAliquota: 0,
    pisCST: '01',
    pisAliquota: 0.65,
    cofinsCST: '01',
    cofinsAliquota: 3,
    cBenef: '',
    
    // Checkboxes
    controlaSaldoEstoque: true,
    usaEtiquetaGondola: true,
    pautaPrecos: true,
    itemRateio: false,
    possuiEtiquetaSeguranca: false,
    cotacao: false,
    valeGas: false,
    entregaRancho: false,
    possuiVasilhame: false,
    controlarEquipamento: false,
    cupomPromocao: false,
    controlarValidade: false,
    controlaNumSerie: false,
    kitCestaConjunto: false,
    cobrarTaxaServico: false,
    lote: false,
    premium: false
};

export const INITIAL_PRODUCTS = [
    { id: 1, name: 'Smartphone Galaxy S23', category: 'Eletrônicos', price: 4500, stock: 15, minStock: 5, unit: 'Unidade', ...PRODUCT_DEFAULTS },
    { id: 2, name: 'Monitor Gamer 27"', category: 'Informática', price: 1800, stock: 8, minStock: 10, unit: 'Unidade', ...PRODUCT_DEFAULTS },
    { id: 3, name: 'Cadeira Ergonômica', category: 'Móveis', price: 1200, stock: 25, minStock: 5, unit: 'Unidade', ...PRODUCT_DEFAULTS },
    { id: 4, name: 'Mouse Sem Fio', category: 'Informática', price: 150, stock: 45, minStock: 15, unit: 'Unidade', ...PRODUCT_DEFAULTS },
    { id: 5, name: 'Teclado Mecânico RGB', category: 'Informática', price: 450, stock: 3, minStock: 8, unit: 'Unidade', ...PRODUCT_DEFAULTS },
];

export const INITIAL_HISTORY = [
    { id: 1, productId: 1, type: 'ENTRADA', quantity: 10, date: '2026-03-25T10:00:00', user: 'Admin' },
    { id: 2, productId: 1, type: 'SAÍDA', quantity: 2, date: '2026-03-26T14:30:00', user: 'Admin' },
    { id: 3, productId: 2, type: 'ENTRADA', quantity: 5, date: '2026-03-27T09:15:00', user: 'Admin' },
];
