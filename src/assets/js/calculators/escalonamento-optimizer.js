/* =====================================
   ESCALONAMENTO-OPTIMIZER.JS
   Otimizador de cálculos com cache TTL
   Performance layer para cálculos frequentes
   NO FALLBACKS
   ===================================== */

class EscalonamentoOptimizer {
  constructor(produtoInsumoManager) {
    if (!produtoInsumoManager) {
      throw new Error('ProdutoInsumoManager não fornecido. EscalonamentoOptimizer requer ProdutoInsumoManager.');
    }

    this.manager = produtoInsumoManager;
    this.cache = new Map(); // Cache em memória
    this.cacheTTL = 5 * 60 * 1000; // 5 minutos em ms

    // Listener para invalidar cache ao mudar modo de escalonamento
    this.setupEventListeners();
  }

  // ==================== EVENT LISTENERS ====================

  /**
   * Configura listeners para invalidar cache
   */
  setupEventListeners() {
    if (typeof window !== 'undefined') {
      // Invalidar cache quando modo de escalonamento mudar
      window.addEventListener('escalation-mode-changed', () => {
        console.log('🔄 Modo de escalonamento mudou - invalidando cache');
        this.invalidateAllCache();
      });
    }
  }

  // ==================== CACHE MANAGEMENT ====================

  /**
   * Gera chave de cache
   */
  getCacheKey(type, id, params = {}) {
    const paramsStr = Object.keys(params).length > 0
      ? JSON.stringify(params)
      : '';
    return `${type}:${id}:${paramsStr}`;
  }

  /**
   * Verifica se cache é válido (não expirou)
   */
  isCacheValid(cacheEntry) {
    if (!cacheEntry) return false;

    const now = Date.now();
    const age = now - cacheEntry.timestamp;

    return age < this.cacheTTL;
  }

  /**
   * Salva no cache
   */
  setCache(key, value) {
    this.cache.set(key, {
      value: value,
      timestamp: Date.now()
    });
  }

  /**
   * Recupera do cache
   */
  getCache(key) {
    const entry = this.cache.get(key);

    if (!this.isCacheValid(entry)) {
      this.cache.delete(key);
      return null;
    }

    return entry.value;
  }

  /**
   * Invalida cache específico
   */
  invalidateCache(key) {
    this.cache.delete(key);
  }

  /**
   * Invalida todo o cache
   */
  invalidateAllCache() {
    this.cache.clear();
    console.log('✓ Cache completo invalidado');
  }

  /**
   * Invalida cache por tipo
   */
  invalidateCacheByType(type) {
    let count = 0;
    for (const key of this.cache.keys()) {
      if (key.startsWith(`${type}:`)) {
        this.cache.delete(key);
        count++;
      }
    }
    console.log(`✓ ${count} entradas de cache do tipo "${type}" invalidadas`);
  }

  // ==================== CACHED OPERATIONS ====================

  /**
   * Retorna percentual de escalonamento com cache
   */
  async getProductEscalation(produtoId, ano) {
    if (!produtoId) {
      throw new Error('produtoId é obrigatório');
    }

    if (!ano) {
      throw new Error('ano é obrigatório');
    }

    const cacheKey = this.getCacheKey('escalation', produtoId, { ano });
    const cached = this.getCache(cacheKey);

    if (cached !== null) {
      return cached;
    }

    // Calcular e armazenar em cache
    const config = await this.manager.getEscalationConfig();

    let percentual;
    if (config.escalationMode === 'global') {
      percentual = config.globalEscalation[ano];
    } else {
      const produto = await this.manager.getProduto(produtoId);
      if (!produto) {
        throw new Error(`Produto ${produtoId} não encontrado`);
      }
      percentual = produto.escalamento[ano];
    }

    this.setCache(cacheKey, percentual);
    return percentual;
  }

  /**
   * Salva escalonamento calculado em IndexedDB (cache persistente)
   */
  async saveProductEscalationCache(produtoId, ano, producaoEscalonada, receita) {
    if (!produtoId || !ano) {
      throw new Error('produtoId e ano são obrigatórios');
    }

    const produto = await this.manager.getProduto(produtoId);
    if (!produto) {
      throw new Error(`Produto ${produtoId} não encontrado`);
    }

    const percentual = await this.getProductEscalation(produtoId, ano);

    const cacheData = {
      produtoId: produtoId,
      ano: ano,
      projectId: this.manager.currentProjectId,
      percentual: percentual,
      quantidadeProducao: producaoEscalonada,
      receitaEstimada: receita,
      updatedAt: Date.now(),
      ttl: Date.now() + this.cacheTTL
    };

    await this.manager.save('escalonamento_produtos', cacheData);
    console.log(`✓ Cache persistente salvo: produto ${produtoId}, ${ano}`);
  }

  /**
   * Salva demanda de insumo em IndexedDB (cache persistente)
   */
  async saveInputDemandCache(insumoId, ano, demandaTotal, custoTotal, produtos) {
    if (!insumoId || !ano) {
      throw new Error('insumoId e ano são obrigatórios');
    }

    const cacheData = {
      insumoId: insumoId,
      ano: ano,
      projectId: this.manager.currentProjectId,
      demandaTotal: demandaTotal,
      custoTotal: custoTotal,
      demandaVinculos: produtos,
      updatedAt: Date.now(),
      ttl: Date.now() + this.cacheTTL
    };

    await this.manager.save('escalonamento_insumos', cacheData);
    console.log(`✓ Cache persistente salvo: insumo ${insumoId}, ${ano}`);
  }

  /**
   * Carrega escalonamento de produto do cache persistente
   */
  async loadProductEscalationCache(produtoId, ano) {
    if (!produtoId || !ano) {
      throw new Error('produtoId e ano são obrigatórios');
    }

    try {
      const cached = await this.manager.get('escalonamento_produtos', [produtoId, ano]);

      if (!cached) {
        return null;
      }

      // Verificar TTL
      if (Date.now() > cached.ttl) {
        console.log(`Cache persistente expirado: produto ${produtoId}, ${ano}`);
        return null;
      }

      return cached;
    } catch (error) {
      console.error('Erro ao carregar cache persistente:', error);
      return null;
    }
  }

  /**
   * Carrega demanda de insumo do cache persistente
   */
  async loadInputDemandCache(insumoId, ano) {
    if (!insumoId || !ano) {
      throw new Error('insumoId e ano são obrigatórios');
    }

    try {
      const cached = await this.manager.get('escalonamento_insumos', [insumoId, ano]);

      if (!cached) {
        return null;
      }

      // Verificar TTL
      if (Date.now() > cached.ttl) {
        console.log(`Cache persistente expirado: insumo ${insumoId}, ${ano}`);
        return null;
      }

      return cached;
    } catch (error) {
      console.error('Erro ao carregar cache persistente:', error);
      return null;
    }
  }

  /**
   * Limpa cache persistente expirado
   */
  async cleanExpiredPersistentCache() {
    const now = Date.now();
    let cleanedProdutos = 0;
    let cleanedInsumos = 0;

    try {
      // Limpar escalonamento de produtos
      const produtosCache = await this.manager.getAll('escalonamento_produtos');
      for (const cache of produtosCache) {
        if (cache.ttl && now > cache.ttl) {
          await this.manager.delete('escalonamento_produtos', [cache.produtoId, cache.ano]);
          cleanedProdutos++;
        }
      }

      // Limpar escalonamento de insumos
      const insumosCache = await this.manager.getAll('escalonamento_insumos');
      for (const cache of insumosCache) {
        if (cache.ttl && now > cache.ttl) {
          await this.manager.delete('escalonamento_insumos', [cache.insumoId, cache.ano]);
          cleanedInsumos++;
        }
      }

      console.log(`✓ Cache persistente limpo: ${cleanedProdutos} produtos, ${cleanedInsumos} insumos`);

      return {
        produtosLimpos: cleanedProdutos,
        insumosLimpos: cleanedInsumos,
        total: cleanedProdutos + cleanedInsumos
      };
    } catch (error) {
      console.error('Erro ao limpar cache persistente:', error);
      throw error;
    }
  }

  /**
   * Estatísticas do cache
   */
  getCacheStats() {
    const now = Date.now();
    let valid = 0;
    let expired = 0;

    for (const entry of this.cache.values()) {
      const age = now - entry.timestamp;
      if (age < this.cacheTTL) {
        valid++;
      } else {
        expired++;
      }
    }

    return {
      total: this.cache.size,
      valid: valid,
      expired: expired,
      ttl: this.cacheTTL,
      ttlMinutes: this.cacheTTL / (60 * 1000)
    };
  }

  /**
   * Pré-aquecer cache (warm up)
   */
  async warmUpCache() {
    console.log('🔥 Pré-aquecendo cache...');

    const produtos = await this.manager.listProdutos(true);
    const anos = ['ano1', 'ano2', 'ano3', 'ano4'];

    let warmed = 0;

    for (const produto of produtos) {
      for (const ano of anos) {
        try {
          await this.getProductEscalation(produto.id, ano);
          warmed++;
        } catch (error) {
          console.error(`Erro ao pré-aquecer ${produto.id}, ${ano}:`, error);
        }
      }
    }

    console.log(`✓ Cache pré-aquecido: ${warmed} entradas`);

    return {
      entradas: warmed,
      produtos: produtos.length,
      anos: anos.length
    };
  }
}

// Exportar para uso global
if (typeof window !== 'undefined') {
  window.EscalonamentoOptimizer = EscalonamentoOptimizer;
  console.log('[EscalonamentoOptimizer] Classe disponível para uso');
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = EscalonamentoOptimizer;
}
