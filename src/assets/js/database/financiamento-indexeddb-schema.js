/**
 * financiamento-indexeddb-schema.js
 * Schema completo do IndexedDB para o Sistema FCO
 *
 * Object Stores:
 * 1. formulario - Dados de campos simples (Seções 1, 2, 3, etc)
 *    - Tab 2.1 (regimeTributario): PMR, PMP, % Vendas Prazo, TMA, Inflação
 *    - Tab 2.5 (ciclosFinanceiros): PME desagregado (MP/WIP/PA/Reposição), % Compras Prazo,
 *                                    Ciclos calculados (Operacional, Financeiro), NCG (diária/mensal/anual)
 * 2. dynamicTables - Dados das 126 tabelas dinâmicas
 * 3. autosave - Backup temporário (auto-save periódico)
 * 4. calculatedResults - Cache de resultados calculados (DRE, Fluxo de Caixa, etc)
 *
 * @version 1.0.0
 * @date 2025-10-18 (atualizado com ciclos financeiros)
 */

// Constantes
const DB_NAME = 'expertzy_financiamento';
const DB_VERSION = 1;

/**
 * Abre ou cria o banco de dados IndexedDB
 * @returns {Promise<IDBDatabase>}
 */
function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    // Erro ao abrir
    request.onerror = () => {
      reject(new Error(`Erro ao abrir IndexedDB: ${request.error.message}`));
    };

    // Sucesso ao abrir
    request.onsuccess = () => {
      const db = request.result;
      console.log(`✓ IndexedDB "${DB_NAME}" aberto com sucesso (versão ${db.version})`);
      resolve(db);
    };

    // Upgrade necessário (primeira vez ou mudança de versão)
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      console.log(`⚙️ IndexedDB upgrade: versão ${event.oldVersion} → ${event.newVersion}`);

      createSchema(db, event.oldVersion);
    };
  });
}

/**
 * Cria o schema completo do IndexedDB
 * @param {IDBDatabase} db
 * @param {number} oldVersion - Versão anterior (0 se primeira criação)
 */
function createSchema(db, oldVersion) {
  // Object Store 1: formulario
  // Armazena dados de campos simples das seções
  if (!db.objectStoreNames.contains('formulario')) {
    const formularioStore = db.createObjectStore('formulario', { keyPath: 'id' });

    // Indexes para busca eficiente
    formularioStore.createIndex('timestamp', 'timestamp', { unique: false });
    formularioStore.createIndex('sectionId', 'sectionId', { unique: false });

    console.log('✓ Object Store "formulario" criado');
  }

  // Object Store 2: dynamicTables
  // Armazena dados das 126 tabelas dinâmicas (DynamicTable instances)
  if (!db.objectStoreNames.contains('dynamicTables')) {
    const dynamicTablesStore = db.createObjectStore('dynamicTables', { keyPath: 'id' });

    // Indexes
    dynamicTablesStore.createIndex('timestamp', 'timestamp', { unique: false });
    dynamicTablesStore.createIndex('sectionId', 'sectionId', { unique: false });
    dynamicTablesStore.createIndex('tableId', 'tableId', { unique: true });

    console.log('✓ Object Store "dynamicTables" criado');
  }

  // Object Store 3: autosave
  // Armazena backups temporários para recuperação
  if (!db.objectStoreNames.contains('autosave')) {
    const autosaveStore = db.createObjectStore('autosave', { keyPath: 'id' });

    // Indexes
    autosaveStore.createIndex('timestamp', 'timestamp', { unique: false });
    autosaveStore.createIndex('type', 'type', { unique: false }); // 'full' | 'partial'

    console.log('✓ Object Store "autosave" criado');
  }

  // Object Store 4: calculatedResults
  // Cache de resultados calculados (DRE, Fluxo de Caixa, Indicadores)
  if (!db.objectStoreNames.contains('calculatedResults')) {
    const calculatedResultsStore = db.createObjectStore('calculatedResults', { keyPath: 'id' });

    // Indexes
    calculatedResultsStore.createIndex('timestamp', 'timestamp', { unique: false });
    calculatedResultsStore.createIndex('calculatorType', 'calculatorType', { unique: false });

    console.log('✓ Object Store "calculatedResults" criado');
  }

  console.log('✓ Schema IndexedDB criado com sucesso');
}

/**
 * Salva dados em uma object store
 * @param {string} storeName - Nome da object store
 * @param {Object} data - Dados a salvar (deve conter 'id')
 * @returns {Promise<void>}
 */
async function saveToStore(storeName, data) {
  if (typeof storeName !== 'string') {
    throw new Error('saveToStore: storeName deve ser uma string');
  }

  if (!data || typeof data !== 'object') {
    throw new Error('saveToStore: data deve ser um objeto');
  }

  if (!data.id) {
    throw new Error('saveToStore: data deve conter propriedade "id"');
  }

  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);

    // Adicionar timestamp se não existir
    if (!data.timestamp) {
      data.timestamp = new Date().toISOString();
    }

    const request = store.put(data);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(new Error(`Erro ao salvar em "${storeName}": ${request.error.message}`));
    };

    transaction.oncomplete = () => {
      db.close();
    };

    transaction.onerror = () => {
      db.close();
      reject(new Error(`Transação falhou em "${storeName}": ${transaction.error.message}`));
    };
  });
}

/**
 * Carrega dados de uma object store por ID
 * @param {string} storeName - Nome da object store
 * @param {string} id - ID do registro
 * @returns {Promise<Object|null>}
 */
async function loadFromStore(storeName, id) {
  if (typeof storeName !== 'string') {
    throw new Error('loadFromStore: storeName deve ser uma string');
  }

  if (!id) {
    throw new Error('loadFromStore: id é obrigatório');
  }

  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);

    const request = store.get(id);

    request.onsuccess = () => {
      if (request.result) {
        resolve(request.result);
      } else {
        resolve(null); // Registro não encontrado
      }
    };

    request.onerror = () => {
      reject(new Error(`Erro ao carregar de "${storeName}": ${request.error.message}`));
    };

    transaction.oncomplete = () => {
      db.close();
    };

    transaction.onerror = () => {
      db.close();
      reject(new Error(`Transação falhou em "${storeName}": ${transaction.error.message}`));
    };
  });
}

/**
 * Carrega todos os dados de uma object store
 * @param {string} storeName - Nome da object store
 * @returns {Promise<Array>}
 */
async function loadAllFromStore(storeName) {
  if (typeof storeName !== 'string') {
    throw new Error('loadAllFromStore: storeName deve ser uma string');
  }

  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);

    const request = store.getAll();

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(new Error(`Erro ao carregar todos de "${storeName}": ${request.error.message}`));
    };

    transaction.oncomplete = () => {
      db.close();
    };

    transaction.onerror = () => {
      db.close();
      reject(new Error(`Transação falhou em "${storeName}": ${transaction.error.message}`));
    };
  });
}

/**
 * Deleta registro de uma object store por ID
 * @param {string} storeName - Nome da object store
 * @param {string} id - ID do registro
 * @returns {Promise<void>}
 */
async function deleteFromStore(storeName, id) {
  if (typeof storeName !== 'string') {
    throw new Error('deleteFromStore: storeName deve ser uma string');
  }

  if (!id) {
    throw new Error('deleteFromStore: id é obrigatório');
  }

  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);

    const request = store.delete(id);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(new Error(`Erro ao deletar de "${storeName}": ${request.error.message}`));
    };

    transaction.oncomplete = () => {
      db.close();
    };

    transaction.onerror = () => {
      db.close();
      reject(new Error(`Transação falhou em "${storeName}": ${transaction.error.message}`));
    };
  });
}

/**
 * Limpa todos os dados de uma object store
 * @param {string} storeName - Nome da object store
 * @returns {Promise<void>}
 */
async function clearStore(storeName) {
  if (typeof storeName !== 'string') {
    throw new Error('clearStore: storeName deve ser uma string');
  }

  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);

    const request = store.clear();

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(new Error(`Erro ao limpar "${storeName}": ${request.error.message}`));
    };

    transaction.oncomplete = () => {
      db.close();
    };

    transaction.onerror = () => {
      db.close();
      reject(new Error(`Transação falhou em "${storeName}": ${transaction.error.message}`));
    };
  });
}

/**
 * Busca registros por index
 * @param {string} storeName - Nome da object store
 * @param {string} indexName - Nome do index
 * @param {*} value - Valor a buscar
 * @returns {Promise<Array>}
 */
async function findByIndex(storeName, indexName, value) {
  if (typeof storeName !== 'string') {
    throw new Error('findByIndex: storeName deve ser uma string');
  }

  if (typeof indexName !== 'string') {
    throw new Error('findByIndex: indexName deve ser uma string');
  }

  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);

    if (!store.indexNames.contains(indexName)) {
      db.close();
      reject(new Error(`Index "${indexName}" não existe em "${storeName}"`));
      return;
    }

    const index = store.index(indexName);
    const request = index.getAll(value);

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(new Error(`Erro ao buscar por index "${indexName}" em "${storeName}": ${request.error.message}`));
    };

    transaction.oncomplete = () => {
      db.close();
    };

    transaction.onerror = () => {
      db.close();
      reject(new Error(`Transação falhou em "${storeName}": ${transaction.error.message}`));
    };
  });
}

/**
 * Conta registros em uma object store
 * @param {string} storeName - Nome da object store
 * @returns {Promise<number>}
 */
async function countRecords(storeName) {
  if (typeof storeName !== 'string') {
    throw new Error('countRecords: storeName deve ser uma string');
  }

  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);

    const request = store.count();

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(new Error(`Erro ao contar registros em "${storeName}": ${request.error.message}`));
    };

    transaction.oncomplete = () => {
      db.close();
    };

    transaction.onerror = () => {
      db.close();
      reject(new Error(`Transação falhou em "${storeName}": ${transaction.error.message}`));
    };
  });
}

/**
 * Deleta o banco de dados completo (útil para testes)
 * @returns {Promise<void>}
 */
function deleteDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.deleteDatabase(DB_NAME);

    request.onsuccess = () => {
      console.log(`✓ IndexedDB "${DB_NAME}" deletado com sucesso`);
      resolve();
    };

    request.onerror = () => {
      reject(new Error(`Erro ao deletar IndexedDB: ${request.error.message}`));
    };

    request.onblocked = () => {
      console.warn(`⚠️ Deleção de IndexedDB bloqueada - feche todas as abas`);
    };
  });
}

// Exportar para uso global
if (typeof window !== 'undefined') {
  window.FinanciamentoIndexedDB = {
    DB_NAME,
    DB_VERSION,
    openDatabase,
    saveToStore,
    loadFromStore,
    loadAllFromStore,
    deleteFromStore,
    clearStore,
    findByIndex,
    countRecords,
    deleteDatabase
  };
}

// Exportar para Node.js (se necessário para testes)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    DB_NAME,
    DB_VERSION,
    openDatabase,
    saveToStore,
    loadFromStore,
    loadAllFromStore,
    deleteFromStore,
    clearStore,
    findByIndex,
    countRecords,
    deleteDatabase
  };
}
