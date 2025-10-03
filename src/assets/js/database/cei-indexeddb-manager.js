/* =====================================
   CEI-INDEXEDDB-MANAGER.JS
   Gerenciador IndexedDB para Formulário CEI
   NO FALLBACKS - NO MOCK DATA - SOLID PRINCIPLES
   ===================================== */

class CEIIndexedDBManager {
  constructor() {
    this.db = null;
    this.currentProjectId = null;
  }

  /**
   * Inicializa conexão com IndexedDB
   * Single Responsibility: apenas inicialização
   */
  async init() {
    return new Promise((resolve, reject) => {
      if (!window.indexedDB) {
        reject(new Error('IndexedDB não suportado neste navegador'));
        return;
      }

      const request = indexedDB.open(DB_NAME_CEI, DB_VERSION_CEI);

      request.onerror = () => {
        reject(new Error(`Erro ao abrir banco de dados CEI: ${request.error}`));
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('✓ IndexedDB CEI inicializado:', DB_NAME_CEI);
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        console.log('🔧 Criando/atualizando schema IndexedDB CEI...');
        this.createStores(event.target.result);
      };
    });
  }

  /**
   * Cria todas as stores definidas no schema
   * Open/Closed Principle: extensível via STORES_CEI
   */
  createStores(db) {
    Object.values(STORES_CEI).forEach(storeConfig => {
      if (!db.objectStoreNames.contains(storeConfig.name)) {
        console.log(`  → Criando store CEI: ${storeConfig.name}`);

        const objectStore = db.createObjectStore(storeConfig.name, {
          keyPath: storeConfig.keyPath,
          autoIncrement: storeConfig.autoIncrement
        });

        // Criar indexes
        storeConfig.indexes.forEach(index => {
          objectStore.createIndex(index.name, index.keyPath, {
            unique: index.unique
          });
        });
      }
    });
  }

  /**
   * Valida acesso a uma store
   */
  validateAccess(storeName) {
    if (!this.db) {
      throw new Error('IndexedDB CEI não inicializado. Execute init() primeiro.');
    }

    if (!isValidStoreCEI(storeName)) {
      throw new Error(`Store CEI inválida: ${storeName}`);
    }
  }

  /**
   * Salva dados em uma store
   * Single Responsibility: apenas operação de save
   */
  async save(storeName, data) {
    this.validateAccess(storeName);

    return new Promise((resolve, reject) => {
      try {
        const tx = this.db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const request = store.put(data);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Recupera um registro por chave
   */
  async get(storeName, key) {
    this.validateAccess(storeName);

    return new Promise((resolve, reject) => {
      try {
        const tx = this.db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const request = store.get(key);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Recupera todos os registros de uma store
   */
  async getAll(storeName) {
    this.validateAccess(storeName);

    return new Promise((resolve, reject) => {
      try {
        const tx = this.db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const request = store.getAll();

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Deleta um registro por chave
   */
  async delete(storeName, key) {
    this.validateAccess(storeName);

    return new Promise((resolve, reject) => {
      try {
        const tx = this.db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const request = store.delete(key);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Limpa todos os registros de uma store
   */
  async clear(storeName) {
    this.validateAccess(storeName);

    return new Promise((resolve, reject) => {
      try {
        const tx = this.db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const request = store.clear();

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Salva projeto atual (principal store)
   */
  async saveProject(projectData) {
    if (!this.currentProjectId) {
      this.currentProjectId = 'cei_' + Date.now();
    }

    const data = {
      id: this.currentProjectId,
      ...projectData,
      updatedAt: Date.now()
    };

    if (!data.createdAt) {
      data.createdAt = Date.now();
    }

    return await this.save('projetos_cei', data);
  }

  /**
   * Recupera projeto atual
   */
  async loadProject() {
    const projetos = await this.getAll('projetos_cei');

    if (projetos.length > 0) {
      // Ordenar por updatedAt e pegar o mais recente
      projetos.sort((a, b) => b.updatedAt - a.updatedAt);
      this.currentProjectId = projetos[0].id;
      return projetos[0];
    }

    return null;
  }

  /**
   * Migra dados de localStorage para IndexedDB
   */
  async migrateFromLocalStorage() {
    const oldData = localStorage.getItem('cei_form_data');

    if (oldData) {
      console.log('🔄 Migrando dados CEI de localStorage para IndexedDB...');

      try {
        const parsed = JSON.parse(oldData);

        await this.saveProject({
          ...parsed.formData,
          migratedFrom: 'localStorage',
          migratedAt: Date.now()
        });

        // Remover dados antigos do localStorage
        localStorage.removeItem('cei_form_data');
        console.log('✓ Migração CEI concluída com sucesso');

        return true;
      } catch (error) {
        console.error('✗ Erro na migração CEI:', error);
        throw error;
      }
    }

    return false;
  }

  /**
   * Salva auto-save
   */
  async saveAutoSave(secao, data) {
    return await this.save('auto_saves_cei', {
      timestamp: Date.now(),
      projectId: this.currentProjectId,
      secao: secao,
      data: data
    });
  }

  /**
   * Registra ação no histórico
   */
  async logAction(acao, detalhes = {}) {
    return await this.save('historico_cei', {
      id: 'hist_' + Date.now(),
      projectId: this.currentProjectId,
      acao: acao,
      detalhes: detalhes,
      timestamp: Date.now()
    });
  }
}

// Criar instância global
if (typeof window !== 'undefined') {
  window.ceiDBManager = null; // Será inicializado no formulário
  console.log('[CEIIndexedDBManager] Classe disponível para uso');
}

// Export para módulos ES6
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CEIIndexedDBManager;
}
