/* ===================================== PROGOIAS-INDEXEDDB-MANAGER.JS
   Gerenciador IndexedDB para Formulário ProGoiás
   NO FALLBACKS - NO MOCK DATA - SOLID PRINCIPLES
   ===================================== */

class ProGoiasIndexedDBManager {
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

      const request = indexedDB.open(DB_NAME_PROGOIAS, DB_VERSION_PROGOIAS);

      request.onerror = () => {
        reject(new Error(`Erro ao abrir banco de dados ProGoiás: ${request.error}`));
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('✓ IndexedDB ProGoiás inicializado:', DB_NAME_PROGOIAS);
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        console.log('🔧 Criando/atualizando schema IndexedDB ProGoiás...');
        this.createStores(event.target.result);
      };
    });
  }

  /**
   * Cria todas as stores definidas no schema
   * Open/Closed Principle: extensível via STORES_PROGOIAS
   */
  createStores(db) {
    Object.values(STORES_PROGOIAS).forEach(storeConfig => {
      if (!db.objectStoreNames.contains(storeConfig.name)) {
        console.log(`  → Criando store ProGoiás: ${storeConfig.name}`);

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
      throw new Error('IndexedDB ProGoiás não inicializado. Execute init() primeiro.');
    }

    if (!isValidStoreProGoias(storeName)) {
      throw new Error(`Store ProGoiás inválida: ${storeName}`);
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
      this.currentProjectId = 'progoias_' + Date.now();
    }

    const data = {
      id: this.currentProjectId,
      ...projectData,
      updatedAt: Date.now()
    };

    if (!data.createdAt) {
      data.createdAt = Date.now();
    }

    return await this.save('projetos_progoias', data);
  }

  /**
   * Recupera projeto atual
   */
  async loadProject() {
    const projetos = await this.getAll('projetos_progoias');

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
    const oldData = localStorage.getItem('progoias_form_data');

    if (oldData) {
      console.log('🔄 Migrando dados ProGoiás de localStorage para IndexedDB...');

      try {
        const parsed = JSON.parse(oldData);

        await this.saveProject({
          ...parsed.formData,
          migratedFrom: 'localStorage',
          migratedAt: Date.now()
        });

        // Remover dados antigos do localStorage
        localStorage.removeItem('progoias_form_data');
        console.log('✓ Migração ProGoiás concluída com sucesso');

        return true;
      } catch (error) {
        console.error('✗ Erro na migração ProGoiás:', error);
        throw error;
      }
    }

    return false;
  }

  /**
   * Salva auto-save
   */
  async saveAutoSave(secao, data) {
    return await this.save('auto_saves_progoias', {
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
    return await this.save('historico_progoias', {
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
  window.progoiasDBManager = null; // Será inicializado no formulário
  console.log('[ProGoiasIndexedDBManager] Classe disponível para uso');
}

// Export para módulos ES6
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ProGoiasIndexedDBManager;
}
