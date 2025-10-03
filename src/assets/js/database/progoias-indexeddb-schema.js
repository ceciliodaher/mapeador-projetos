/* =====================================
   PROGOIAS-INDEXEDDB-SCHEMA.JS
   Schema IndexedDB para Formulário ProGoiás
   NO FALLBACKS - NO MOCK DATA
   ===================================== */

const DB_NAME_PROGOIAS = 'incentivos_progoias';
const DB_VERSION_PROGOIAS = 1;

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
