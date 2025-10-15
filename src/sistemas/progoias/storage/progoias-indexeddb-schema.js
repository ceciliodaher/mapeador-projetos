/* =====================================
   PROGOIAS-INDEXEDDB-SCHEMA.JS
   Schema IndexedDB para Formulário ProGoiás
   NO FALLBACKS - NO MOCK DATA
   ===================================== */

const DB_NAME_PROGOIAS = 'incentivos_progoias';
const DB_VERSION_PROGOIAS = 2; // v2: Adiciona 6 stores de produtos/insumos

/**
 * Definição das stores para formulário ProGoiás
 * Isoladas dos outros formulários (CEI, Questionário)
 */
const STORES_PROGOIAS = {
  PROJETOS_PROGOIAS: {
    name: 'projetos_progoias',
    keyPath: 'id',
    autoIncrement: false,
    indexes: [
      { name: 'cnpj', keyPath: 'cnpj', unique: false },
      { name: 'razaoSocial', keyPath: 'razaoSocial', unique: false },
      { name: 'createdAt', keyPath: 'createdAt', unique: false },
      { name: 'updatedAt', keyPath: 'updatedAt', unique: false }
    ],
    description: 'Projetos ProGoiás salvos (um projeto ativo por vez)'
  },

  AUTO_SAVES_PROGOIAS: {
    name: 'auto_saves_progoias',
    keyPath: 'timestamp',
    autoIncrement: false,
    indexes: [
      { name: 'projectId', keyPath: 'projectId', unique: false },
      { name: 'secao', keyPath: 'secao', unique: false }
    ],
    description: 'Auto-saves para recuperação de dados ProGoiás'
  },

  HISTORICO_PROGOIAS: {
    name: 'historico_progoias',
    keyPath: 'id',
    autoIncrement: false,
    indexes: [
      { name: 'projectId', keyPath: 'projectId', unique: false },
      { name: 'acao', keyPath: 'acao', unique: false },
      { name: 'timestamp', keyPath: 'timestamp', unique: false }
    ],
    description: 'Histórico de ações do usuário (auditoria)'
  },

  // === V2: STORES DE PRODUTOS E INSUMOS ===

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
    description: 'Produtos do projeto com escalonamento individual'
  },

  INSUMOS: {
    name: 'insumos_progoias',
    keyPath: 'id',
    autoIncrement: false,
    indexes: [
      { name: 'projectId', keyPath: 'projectId', unique: false },
      { name: 'nome', keyPath: 'nome', unique: false },
      { name: 'tipo', keyPath: 'tipo', unique: false },
      { name: 'isGeral', keyPath: 'isGeral', unique: false },
      { name: 'scalingMode', keyPath: 'scalingMode', unique: false }
    ],
    description: 'Insumos do projeto com modo de escalonamento'
  },

  RECEITAS: {
    name: 'produto_insumo_map',
    keyPath: 'id',
    autoIncrement: false,
    indexes: [
      { name: 'produtoId', keyPath: 'produtoId', unique: false },
      { name: 'insumoId', keyPath: 'insumoId', unique: false },
      { name: 'produtoInsumo', keyPath: ['produtoId', 'insumoId'], unique: true }
    ],
    description: 'Receitas - quantidade de insumo por unidade de produto'
  },

  ESCALONAMENTO_PRODUTOS: {
    name: 'escalonamento_produtos',
    keyPath: ['produtoId', 'ano'],
    autoIncrement: false,
    indexes: [
      { name: 'projectId', keyPath: 'projectId', unique: false },
      { name: 'produtoId', keyPath: 'produtoId', unique: false },
      { name: 'updatedAt', keyPath: 'updatedAt', unique: false }
    ],
    description: 'Cache desnormalizado de escalonamento calculado por produto'
  },

  ESCALONAMENTO_INSUMOS: {
    name: 'escalonamento_insumos',
    keyPath: ['insumoId', 'ano'],
    autoIncrement: false,
    indexes: [
      { name: 'projectId', keyPath: 'projectId', unique: false },
      { name: 'insumoId', keyPath: 'insumoId', unique: false },
      { name: 'updatedAt', keyPath: 'updatedAt', unique: false }
    ],
    description: 'Cache desnormalizado de demanda agregada de insumos'
  },

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
 * Valida se uma store ProGoiás existe no schema
 */
function isValidStoreProGoias(storeName) {
  return Object.values(STORES_PROGOIAS).some(store => store.name === storeName);
}

/**
 * Retorna configuração de uma store ProGoiás
 */
function getStoreConfigProGoias(storeName) {
  return Object.values(STORES_PROGOIAS).find(store => store.name === storeName);
}

// Exportar para uso em outros módulos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    DB_NAME_PROGOIAS,
    DB_VERSION_PROGOIAS,
    STORES_PROGOIAS,
    isValidStoreProGoias,
    getStoreConfigProGoias
  };
}
