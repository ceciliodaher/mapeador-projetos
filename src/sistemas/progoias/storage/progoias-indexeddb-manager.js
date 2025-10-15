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
        const db = event.target.result;
        const oldVersion = event.oldVersion;
        const newVersion = event.newVersion;

        console.log(`🔧 Migrando IndexedDB ProGoiás: v${oldVersion} → v${newVersion}`);

        // Migration v1 → v2: Adicionar stores de produtos/insumos
        if (oldVersion < 2) {
          console.log('  📦 Aplicando migration v1 → v2 (stores de produtos/insumos)');
          this.createStores(db);
        } else {
          // Apenas criar stores faltantes (instalação limpa)
          this.createStores(db);
        }
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

  /* =====================================
     MÉTODOS ESPECÍFICOS PRODUTOS/INSUMOS
     ===================================== */

  /**
   * Salva produto no IndexedDB
   */
  async saveProduto(produto) {
    if (!produto) {
      throw new Error('Produto obrigatório para salvar');
    }

    if (!produto.id) {
      throw new Error('Produto deve ter ID');
    }

    if (!produto.nome || !produto.nome.trim()) {
      throw new Error('Produto deve ter nome');
    }

    // Validação: campos críticos para renderização na matriz (NO FALLBACKS)
    if (produto.precoVenda === undefined || produto.precoVenda === null) {
      throw new Error(`Produto ${produto.nome} não pode ser salvo: precoVenda obrigatório para exibição na matriz`);
    }

    if (produto.producaoMensal === undefined || produto.producaoMensal === null) {
      throw new Error(`Produto ${produto.nome} não pode ser salvo: producaoMensal obrigatório para exibição na matriz`);
    }

    return await this.save('produtos_progoias', produto);
  }

  /**
   * Salva insumo no IndexedDB
   */
  async saveInsumo(insumo) {
    if (!insumo) {
      throw new Error('Insumo obrigatório para salvar');
    }

    if (!insumo.id) {
      throw new Error('Insumo deve ter ID');
    }

    if (!insumo.nome || !insumo.nome.trim()) {
      throw new Error('Insumo deve ter nome');
    }

    // Validação: campos críticos para cálculos (NO FALLBACKS)
    if (insumo.custoUnitario === undefined || insumo.custoUnitario === null) {
      throw new Error(`Insumo ${insumo.nome} não pode ser salvo: custoUnitario obrigatório para cálculos`);
    }

    return await this.save('insumos_progoias', insumo);
  }

  /**
   * Lista produtos (apenas ativos se especificado)
   */
  async listProdutos(apenasAtivos = true) {
    const produtos = await this.getAll('produtos_progoias');

    if (!produtos) {
      return [];
    }

    if (apenasAtivos) {
      return produtos.filter(p => p.ativo === true);
    }

    return produtos;
  }

  /**
   * Lista insumos (apenas ativos se especificado)
   */
  async listInsumos(apenasAtivos = true) {
    const insumos = await this.getAll('insumos_progoias');

    if (!insumos) {
      return [];
    }

    if (apenasAtivos) {
      return insumos.filter(i => i.ativo === true);
    }

    return insumos;
  }

  /**
   * Obtém produto por ID
   */
  async getProduto(produtoId) {
    return await this.get('produtos_progoias', produtoId);
  }

  /**
   * Obtém insumo por ID
   */
  async getInsumo(insumoId) {
    return await this.get('insumos_progoias', insumoId);
  }

  /**
   * Lista receitas vinculadas a um produto
   */
  async listReceitasByProduto(produtoId) {
    if (!produtoId) {
      throw new Error('produtoId obrigatório');
    }

    const allMaps = await this.getAll('produto_insumo_map');

    if (!allMaps) {
      return [];
    }

    return allMaps.filter(map => map.produtoId === produtoId);
  }

  /**
   * Limpa todos os produtos
   */
  async clearProdutos() {
    return await this.clear('produtos_progoias');
  }

  /**
   * Limpa todos os insumos
   */
  async clearInsumos() {
    return await this.clear('insumos_progoias');
  }

  /**
   * Limpa mapeamento produto-insumo
   */
  async clearProdutoInsumoMap() {
    return await this.clear('produto_insumo_map');
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
