/* =====================================
   CEI-INDEXEDDB-SCHEMA.JS
   Schema IndexedDB para Formulário CEI
   NO FALLBACKS - NO MOCK DATA
   ===================================== */

const DB_NAME_CEI = 'incentivos_cei';
const DB_VERSION_CEI = 1;

/**
 * Definição das stores para formulário CEI
 * Isoladas dos outros formulários (ProGoiás, Questionário)
 */
const STORES_CEI = {
  PROJETOS_CEI: {
    name: 'projetos_cei',
    keyPath: 'id',
    autoIncrement: false,
    indexes: [
      { name: 'cnpj', keyPath: 'cnpj', unique: false },
      { name: 'razaoSocial', keyPath: 'razaoSocial', unique: false },
      { name: 'createdAt', keyPath: 'createdAt', unique: false },
      { name: 'updatedAt', keyPath: 'updatedAt', unique: false }
    ],
    description: 'Projetos CEI salvos (um projeto ativo por vez)'
  },

  AUTO_SAVES_CEI: {
    name: 'auto_saves_cei',
    keyPath: 'timestamp',
    autoIncrement: false,
    indexes: [
      { name: 'projectId', keyPath: 'projectId', unique: false },
      { name: 'secao', keyPath: 'secao', unique: false }
    ],
    description: 'Auto-saves para recuperação de dados CEI'
  },

  HISTORICO_CEI: {
    name: 'historico_cei',
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
 * Valida se uma store CEI existe no schema
 */
function isValidStoreCEI(storeName) {
  return Object.values(STORES_CEI).some(store => store.name === storeName);
}

/**
 * Retorna configuração de uma store CEI
 */
function getStoreConfigCEI(storeName) {
  return Object.values(STORES_CEI).find(store => store.name === storeName);
}

// Exportar para uso em outros módulos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    DB_NAME_CEI,
    DB_VERSION_CEI,
    STORES_CEI,
    isValidStoreCEI,
    getStoreConfigCEI
  };
}
