/* =====================================
   MATRIZ-STATE-MANAGER.JS
   Gerenciamento de estado reativo (Observer Pattern)
   NO FALLBACKS - Validação explícita
   ===================================== */

class MatrizStateManager {
  constructor() {
    this.state = {
      produtos: [],
      insumos: [],
      receitas: new Map(), // Map<'produtoId-insumoId', quantidade>
      view: 'entry', // 'entry' | 'analysis' | 'summary'
      filters: {
        onlyActive: true,
        onlyFilled: false,
        searchTerm: ''
      },
      isDirty: false,
      lastSaved: null
    };

    // Map<key, Set<callback>>
    this.listeners = new Map();
  }

  // ==================== OBSERVER PATTERN ====================

  /**
   * Subscrever mudanças de estado
   * @param {string} key - Chave do estado (ex: 'produtos', 'view', 'filters.onlyActive')
   * @param {Function} callback - Função chamada quando valor muda
   * @returns {Function} Função para cancelar subscrição
   */
  subscribe(key, callback) {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }

    this.listeners.get(key).add(callback);

    // Retorna função de unsubscribe
    return () => {
      this.listeners.get(key)?.delete(callback);
    };
  }

  /**
   * Notificar listeners sobre mudança
   */
  notify(key, value) {
    // Notificar listeners específicos
    const listeners = this.listeners.get(key);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(value);
        } catch (error) {
          console.error(`Erro no listener de "${key}":`, error);
        }
      });
    }

    // Notificar listeners wildcard (*)
    const wildcardListeners = this.listeners.get('*');
    if (wildcardListeners) {
      wildcardListeners.forEach(callback => {
        try {
          callback({ key, value });
        } catch (error) {
          console.error('Erro no listener wildcard:', error);
        }
      });
    }
  }

  // ==================== STATE ACCESS ====================

  /**
   * Obter valor do estado (suporta notação dot para nested)
   */
  get(key) {
    const keys = key.split('.');
    let value = this.state;

    for (const k of keys) {
      value = value[k];
      if (value === undefined) {
        break;
      }
    }

    return value;
  }

  /**
   * Definir valor do estado (suporta notação dot para nested)
   */
  set(key, value) {
    const keys = key.split('.');
    const lastKey = keys.pop();
    let target = this.state;

    // Navegar até objeto alvo
    for (const k of keys) {
      if (!(k in target)) {
        target[k] = {};
      }
      target = target[k];
    }

    // Definir valor
    target[lastKey] = value;

    // Notificar listeners
    this.notify(key, value);

    // Marcar como dirty se dados mudaram
    if (key.startsWith('receitas')) {
      this.set('isDirty', true);
    }
  }

  // ==================== DATA LOADING ====================

  /**
   * Carregar dados iniciais do IndexedDB
   */
  async loadInitialData(dbManager) {
    if (!dbManager) {
      throw new Error('dbManager é obrigatório para loadInitialData');
    }

    try {
      // Carregar produtos e insumos
      const [produtos, insumos] = await Promise.all([
        dbManager.listProdutos(true), // apenas ativos
        dbManager.listInsumos(true)   // apenas ativos
      ]);

      this.set('produtos', produtos);
      this.set('insumos', insumos);

      // Carregar todas as receitas
      const receitasMap = new Map();

      for (const produto of produtos) {
        const receitas = await dbManager.listReceitasByProduto(produto.id);

        for (const receita of receitas) {
          const key = `${receita.produtoId}-${receita.insumoId}`;
          receitasMap.set(key, parseFloat(receita.quantidadePorUnidade));
        }
      }

      this.set('receitas', receitasMap);
      this.set('isDirty', false);
      this.set('lastSaved', Date.now());

      console.log(`✓ Dados carregados: ${produtos.length} produtos, ${insumos.length} insumos, ${receitasMap.size} receitas`);

    } catch (error) {
      console.error('Erro ao carregar dados iniciais:', error);
      throw error;
    }
  }

  // ==================== FILTERED DATA ====================

  /**
   * Obter produtos filtrados
   */
  getFilteredProdutos() {
    let produtos = this.get('produtos');
    const filters = this.get('filters');

    // Filtro de busca
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      produtos = produtos.filter(p =>
        p.nome.toLowerCase().includes(term) ||
        (p.ncm && p.ncm.includes(term))
      );
    }

    // Filtro: apenas com receitas
    if (filters.onlyFilled) {
      produtos = produtos.filter(p => {
        return Array.from(this.state.receitas.keys())
          .some(key => key.startsWith(`${p.id}-`));
      });
    }

    return produtos;
  }

  /**
   * Obter insumos filtrados
   */
  getFilteredInsumos() {
    let insumos = this.get('insumos');
    const filters = this.get('filters');

    // Filtro de busca
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      insumos = insumos.filter(i =>
        i.nome.toLowerCase().includes(term) ||
        (i.tipo && i.tipo.toLowerCase().includes(term))
      );
    }

    // Filtro: apenas usados
    if (filters.onlyFilled) {
      insumos = insumos.filter(i => {
        return Array.from(this.state.receitas.keys())
          .some(key => key.endsWith(`-${i.id}`));
      });
    }

    return insumos;
  }

  // ==================== RECEITA OPERATIONS ====================

  /**
   * Definir quantidade de receita
   */
  setReceita(produtoId, insumoId, quantidade) {
    if (!produtoId) {
      throw new Error('produtoId é obrigatório');
    }

    if (!insumoId) {
      throw new Error('insumoId é obrigatório');
    }

    const key = `${produtoId}-${insumoId}`;
    const receitas = this.get('receitas');

    // Se quantidade vazia, null ou zero, remover receita
    if (quantidade === null || quantidade === 0 || quantidade === '' || quantidade === undefined) {
      receitas.delete(key);
    } else {
      // Validar quantidade
      const qtd = parseFloat(quantidade);
      if (isNaN(qtd)) {
        throw new Error(`Quantidade inválida: ${quantidade}`);
      }

      if (qtd < 0) {
        throw new Error('Quantidade não pode ser negativa');
      }

      receitas.set(key, qtd);
    }

    // Notificar mudança
    this.notify('receitas', receitas);
    this.set('isDirty', true);
  }

  /**
   * Obter quantidade de receita
   */
  getReceita(produtoId, insumoId) {
    if (!produtoId || !insumoId) {
      return null;
    }

    const key = `${produtoId}-${insumoId}`;
    return this.state.receitas.get(key) || null;
  }

  /**
   * Obter todas as receitas de um produto
   */
  getReceitasByProduto(produtoId) {
    if (!produtoId) {
      throw new Error('produtoId é obrigatório');
    }

    const receitas = [];

    for (const [key, quantidade] of this.state.receitas.entries()) {
      if (key.startsWith(`${produtoId}-`)) {
        const insumoId = key.split('-')[1];
        receitas.push({
          produtoId,
          insumoId,
          quantidade
        });
      }
    }

    return receitas;
  }

  /**
   * Obter todos os produtos que usam um insumo
   */
  getProdutosByInsumo(insumoId) {
    if (!insumoId) {
      throw new Error('insumoId é obrigatório');
    }

    const produtos = [];

    for (const [key, quantidade] of this.state.receitas.entries()) {
      if (key.endsWith(`-${insumoId}`)) {
        const produtoId = key.split('-')[0];
        produtos.push({
          produtoId,
          insumoId,
          quantidade
        });
      }
    }

    return produtos;
  }

  /**
   * Remover todas as receitas de um produto
   */
  clearReceitasByProduto(produtoId) {
    if (!produtoId) {
      throw new Error('produtoId é obrigatório');
    }

    const receitas = this.get('receitas');
    let removed = 0;

    for (const key of receitas.keys()) {
      if (key.startsWith(`${produtoId}-`)) {
        receitas.delete(key);
        removed++;
      }
    }

    if (removed > 0) {
      this.notify('receitas', receitas);
      this.set('isDirty', true);
    }

    return removed;
  }

  // ==================== STATISTICS ====================

  /**
   * Obter estatísticas resumidas
   */
  getSummary() {
    const produtosComReceita = new Set();
    const insumosUtilizados = new Set();

    for (const key of this.state.receitas.keys()) {
      const [produtoId, insumoId] = key.split('-');
      produtosComReceita.add(produtoId);
      insumosUtilizados.add(insumoId);
    }

    const totalReceitas = this.state.receitas.size;
    const mediaInsumosPorProduto = produtosComReceita.size > 0
      ? (totalReceitas / produtosComReceita.size).toFixed(1)
      : 0;

    return {
      totalProdutos: this.state.produtos.length,
      totalInsumos: this.state.insumos.length,
      produtosComReceita: produtosComReceita.size,
      produtosSemReceita: this.state.produtos.length - produtosComReceita.size,
      insumosUtilizados: insumosUtilizados.size,
      insumosNaoUtilizados: this.state.insumos.length - insumosUtilizados.size,
      totalReceitas,
      mediaInsumosPorProduto: parseFloat(mediaInsumosPorProduto)
    };
  }

  /**
   * Obter produto por ID
   */
  getProduto(produtoId) {
    if (!produtoId) {
      throw new Error('produtoId é obrigatório');
    }

    return this.state.produtos.find(p => p.id === produtoId) || null;
  }

  /**
   * Obter insumo por ID
   */
  getInsumo(insumoId) {
    if (!insumoId) {
      throw new Error('insumoId é obrigatório');
    }

    return this.state.insumos.find(i => i.id === insumoId) || null;
  }

  // ==================== DEBUG ====================

  /**
   * Exportar estado completo (para debug)
   */
  getStateSnapshot() {
    return {
      produtos: this.state.produtos.length,
      insumos: this.state.insumos.length,
      receitas: this.state.receitas.size,
      view: this.state.view,
      filters: { ...this.state.filters },
      isDirty: this.state.isDirty,
      lastSaved: this.state.lastSaved
    };
  }

  /**
   * Log estado atual
   */
  logState() {
    console.log('📊 Estado da Matriz:', this.getStateSnapshot());
    console.log('📝 Resumo:', this.getSummary());
  }
}

// Exportar para uso global
if (typeof window !== 'undefined') {
  window.MatrizStateManager = MatrizStateManager;
  console.log('[MatrizStateManager] Classe disponível para uso');
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = MatrizStateManager;
}
