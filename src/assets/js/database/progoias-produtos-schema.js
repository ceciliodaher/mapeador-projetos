/* =====================================
   PROGOIAS-PRODUTOS-SCHEMA.JS
   Extensão do schema ProGoiás para Produtos e Insumos
   Versão 2 - Adiciona 6 novas stores
   NO FALLBACKS - NO MOCK DATA
   ===================================== */

/**
 * Stores adicionais para sistema de Produtos e Insumos
 * Total: 6 stores novas (produtos, insumos, receitas, caches, config)
 */
const STORES_PRODUTOS_PROGOIAS = {

  // Store 1: Produtos com escalonamento individual
  PRODUTOS: {
    name: 'produtos_progoias',
    keyPath: 'id',
    autoIncrement: false,
    indexes: [
      { name: 'projectId', keyPath: 'projectId', unique: false },
      { name: 'nome', keyPath: 'nome', unique: false },
      { name: 'ativo', keyPath: 'ativo', unique: false },
      { name: 'ncm', keyPath: 'ncm', unique: false }
    ],
    description: 'Produtos do projeto ProGoiás com escalonamento individual'
  },

  // Store 2: Insumos (matérias-primas, embalagens, utilidades)
  INSUMOS: {
    name: 'insumos_progoias',
    keyPath: 'id',
    autoIncrement: false,
    indexes: [
      { name: 'projectId', keyPath: 'projectId', unique: false },
      { name: 'nome', keyPath: 'nome', unique: false },
      { name: 'tipo', keyPath: 'tipo', unique: false }, // "MP" | "EMB" | "UTIL"
      { name: 'isGeral', keyPath: 'isGeral', unique: false }, // true para energia, água
      { name: 'scalingMode', keyPath: 'scalingMode', unique: false } // "manual" | "calculated"
    ],
    description: 'Insumos do projeto com modo de escalonamento'
  },

  // Store 3: Matriz Produto-Insumo (Receitas - N:N)
  RECEITAS: {
    name: 'produto_insumo_map',
    keyPath: 'id',
    autoIncrement: false,
    indexes: [
      { name: 'produtoId', keyPath: 'produtoId', unique: false },
      { name: 'insumoId', keyPath: 'insumoId', unique: false },
      { name: 'produtoInsumo', keyPath: ['produtoId', 'insumoId'], unique: true } // Compound index
    ],
    description: 'Receitas - quantidade de insumo por unidade de produto'
  },

  // Store 4: Cache de Escalonamento de Produtos (desnormalizado)
  ESCALONAMENTO_PRODUTOS: {
    name: 'escalonamento_produtos',
    keyPath: ['produtoId', 'ano'], // Compound key
    autoIncrement: false,
    indexes: [
      { name: 'projectId', keyPath: 'projectId', unique: false },
      { name: 'produtoId', keyPath: 'produtoId', unique: false },
      { name: 'updatedAt', keyPath: 'updatedAt', unique: false }
    ],
    description: 'Cache desnormalizado de escalonamento calculado por produto'
  },

  // Store 5: Cache de Demanda de Insumos (desnormalizado)
  ESCALONAMENTO_INSUMOS: {
    name: 'escalonamento_insumos',
    keyPath: ['insumoId', 'ano'], // Compound key
    autoIncrement: false,
    indexes: [
      { name: 'projectId', keyPath: 'projectId', unique: false },
      { name: 'insumoId', keyPath: 'insumoId', unique: false },
      { name: 'updatedAt', keyPath: 'updatedAt', unique: false }
    ],
    description: 'Cache desnormalizado de demanda agregada de insumos'
  },

  // Store 6: Configuração Global de Escalonamento (NOVO - CRÍTICO)
  CONFIG_ESCALONAMENTO: {
    name: 'config_escalonamento_progoias',
    keyPath: 'projectId',
    autoIncrement: false,
    indexes: [
      { name: 'escalationMode', keyPath: 'escalationMode', unique: false },
      { name: 'updatedAt', keyPath: 'updatedAt', unique: false }
    ],
    description: 'Configuração: escalonamento global vs individual'
  }
};

/**
 * Schemas de exemplo para documentação
 */

// Exemplo: Produto
const EXAMPLE_PRODUTO = {
  "id": "prod_uuid_001",
  "projectId": "progoias_123",
  "nome": "Pão Francês 50g",
  "ncm": "19059090",
  "unidade": "unidade",
  "producaoMensal": 10000,
  "precoVenda": 0.50,
  "escalamento": { // Usado APENAS se config.escalationMode = "individual"
    "ano1": 30,
    "ano2": 60,
    "ano3": 80,
    "ano4": 100
  },
  "destinos": {
    "mercadoInterno": 70,
    "mercadoInterestadual": 20,
    "exportacao": 10
  },
  "ativo": true,
  "createdAt": 1730678400000,
  "updatedAt": 1730678400000
};

// Exemplo: Insumo
const EXAMPLE_INSUMO = {
  "id": "ins_uuid_001",
  "projectId": "progoias_123",
  "nome": "Farinha de Trigo Tipo 1",
  "tipo": "MP", // MP | EMB | UTIL
  "ncm": "11010000",
  "unidade": "kg",
  "custoUnitario": 3.50,
  "quantidadeFutura": 5000,
  "isGeral": false, // true para energia, água (sem vínculo específico)
  "scalingMode": "calculated", // "manual" | "calculated" (baseado em receitas)
  "origens": {
    "mercadoInterno": 100,
    "mercadoInterestadual": 0,
    "importacao": 0
  },
  "fornecedorPrincipal": "Moinho ABC Ltda",
  "observacoes": "",
  "ativo": true,
  "createdAt": 1730678400000,
  "updatedAt": 1730678400000
};

// Exemplo: Receita (Vínculo Produto-Insumo)
const EXAMPLE_RECEITA = {
  "id": "prod_uuid_001_ins_uuid_001",
  "produtoId": "prod_uuid_001",
  "insumoId": "ins_uuid_001",
  "quantidadePorUnidade": 0.050, // 50g de farinha por unidade de pão
  "observacao": "Base da receita",
  "createdAt": 1730678400000,
  "updatedAt": 1730678400000
};

// Exemplo: Cache de Escalonamento de Produto
const EXAMPLE_ESCALONAMENTO_PRODUTO = {
  "produtoId": "prod_uuid_001",
  "ano": "ano1",
  "projectId": "progoias_123",
  "percentual": 30,
  "quantidadeProducao": 36000, // 10.000/mês × 12 meses × 30%
  "receitaEstimada": 18000.00, // 36.000 × R$ 0,50
  "updatedAt": 1730678400000,
  "ttl": 1730678700000 // 5 minutos de cache
};

// Exemplo: Cache de Demanda de Insumo
const EXAMPLE_ESCALONAMENTO_INSUMO = {
  "insumoId": "ins_uuid_001",
  "ano": "ano1",
  "projectId": "progoias_123",
  "demandaTotal": 1800, // 36.000 pães × 0.050kg/un
  "demandaVinculos": [
    {
      "produtoId": "prod_uuid_001",
      "produtoNome": "Pão Francês 50g",
      "quantidadeProduto": 36000,
      "quantidadePorUnidade": 0.050,
      "demandaParcial": 1800
    }
  ],
  "custoTotal": 6300.00, // 1.800kg × R$ 3,50
  "updatedAt": 1730678400000,
  "ttl": 1730678700000
};

// Exemplo: Configuração de Escalonamento (CRÍTICO)
const EXAMPLE_CONFIG_ESCALONAMENTO = {
  "projectId": "progoias_123",
  "escalationMode": "global", // "global" | "individual"
  "globalEscalation": { // Usado apenas se mode = "global"
    "ano1": 25,
    "ano2": 50,
    "ano3": 75,
    "ano4": 100
  },
  "updatedAt": 1730678400000
};

/**
 * Tipos de insumos
 */
const TIPOS_INSUMO = {
  MP: 'Matéria-Prima',
  EMB: 'Embalagem',
  UTIL: 'Utilidades' // Energia, água, gás
};

/**
 * Modos de escalonamento de insumo
 */
const SCALING_MODES = {
  MANUAL: 'manual', // Usuário define quantidade manualmente
  CALCULATED: 'calculated' // Calculado baseado em receitas de produtos
};

/**
 * Modos de escalonamento global
 */
const ESCALATION_MODES = {
  GLOBAL: 'global', // Mesmo % para todos os produtos
  INDIVIDUAL: 'individual' // % específico por produto
};

/**
 * Validação de tipo de insumo
 */
function isValidTipoInsumo(tipo) {
  return Object.keys(TIPOS_INSUMO).includes(tipo);
}

/**
 * Validação de modo de escalonamento
 */
function isValidScalingMode(mode) {
  return Object.values(SCALING_MODES).includes(mode);
}

/**
 * Validação de modo de escalonamento global
 */
function isValidEscalationMode(mode) {
  return Object.values(ESCALATION_MODES).includes(mode);
}

/**
 * Valida se uma store de produtos existe
 */
function isValidStoreProdutosProGoias(storeName) {
  return Object.values(STORES_PRODUTOS_PROGOIAS).some(store => store.name === storeName);
}

/**
 * Retorna configuração de uma store de produtos
 */
function getStoreConfigProdutosProGoias(storeName) {
  return Object.values(STORES_PRODUTOS_PROGOIAS).find(store => store.name === storeName);
}

// Exportar para uso em outros módulos
if (typeof window !== 'undefined') {
  window.STORES_PRODUTOS_PROGOIAS = STORES_PRODUTOS_PROGOIAS;
  window.TIPOS_INSUMO = TIPOS_INSUMO;
  window.SCALING_MODES = SCALING_MODES;
  window.ESCALATION_MODES = ESCALATION_MODES;
  window.isValidTipoInsumo = isValidTipoInsumo;
  window.isValidScalingMode = isValidScalingMode;
  window.isValidEscalationMode = isValidEscalationMode;
  window.isValidStoreProdutosProGoias = isValidStoreProdutosProGoias;
  window.getStoreConfigProdutosProGoias = getStoreConfigProdutosProGoias;
  console.log('[ProGoiasProduSchema] 6 stores de produtos definidas');
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    STORES_PRODUTOS_PROGOIAS,
    TIPOS_INSUMO,
    SCALING_MODES,
    ESCALATION_MODES,
    isValidTipoInsumo,
    isValidScalingMode,
    isValidEscalationMode,
    isValidStoreProdutosProGoias,
    getStoreConfigProdutosProGoias,
    // Exemplos para documentação
    EXAMPLE_PRODUTO,
    EXAMPLE_INSUMO,
    EXAMPLE_RECEITA,
    EXAMPLE_ESCALONAMENTO_PRODUTO,
    EXAMPLE_ESCALONAMENTO_INSUMO,
    EXAMPLE_CONFIG_ESCALONAMENTO
  };
}
