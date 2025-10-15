/* =====================================
   MATRIZ-CARD-RENDERER.JS
   Renderizador de cards de produtos (UI)
   APENAS QUESTIONÁRIO - Sem análise ou julgamento
   ===================================== */

class MatrizCardRenderer {
  constructor(stateManager) {
    if (!stateManager) {
      throw new Error('stateManager é obrigatório');
    }

    this.stateManager = stateManager;
  }

  // ==================== MAIN RENDER ====================

  /**
   * Renderizar lista completa de produtos
   * @returns {string} HTML
   */
  renderProductList() {
    const produtos = this.stateManager.getFilteredProdutos();

    if (produtos.length === 0) {
      return this.renderEmptyState();
    }

    const cardsHtml = produtos.map(produto =>
      this.renderProductCard(produto)
    ).join('');

    return `
      <div class="matriz-product-list">
        ${cardsHtml}
      </div>
    `;
  }

  /**
   * Renderizar card de um produto
   * @param {Object} produto
   * @returns {string} HTML
   */
  renderProductCard(produto) {
    const receitas = this.stateManager.getReceitasByProduto(produto.id);

    return `
      <article
        class="matriz-card"
        data-produto-id="${produto.id}"
        data-expanded="false">

        ${this.renderCardHeader(produto, receitas)}

        <div class="matriz-card__body" style="display: none;">
          ${this.renderCardBody(produto, receitas)}
        </div>
      </article>
    `;
  }

  /**
   * Renderizar cabeçalho do card (sempre visível)
   */
  renderCardHeader(produto, receitas) {
    const hasReceitas = receitas.length > 0;
    const expandIcon = '▶';

    return `
      <header class="matriz-card__header" data-action="toggle">
        <div class="matriz-card__header-left">
          <span class="matriz-card__expand-icon">${expandIcon}</span>
          <h3 class="matriz-card__title">
            ${this.escapeHtml(produto.nome)}
          </h3>
        </div>

        <div class="matriz-card__header-right">
          <button
            class="btn btn--icon matriz-card__menu-btn"
            data-action="menu"
            aria-label="Menu do produto"
            type="button">
            ⚙️
          </button>
        </div>
      </header>

      <div class="matriz-card__metadata">
        ${produto.ncm ? `<span class="metadata-item">NCM: ${produto.ncm}</span>` : ''}
        ${produto.precoVenda !== null && produto.precoVenda !== undefined
          ? `<span class="metadata-item">R$ ${this.formatCurrency(produto.precoVenda)}/${produto.unidade || 'un'}</span>`
          : '<span class="metadata-item metadata-item--warning">⚠️ Preço não definido</span>'}
        ${produto.producaoMensal !== null && produto.producaoMensal !== undefined
          ? `<span class="metadata-item">${this.formatNumber(produto.producaoMensal)} ${produto.unidade || 'un'}/mês</span>`
          : '<span class="metadata-item metadata-item--warning">⚠️ Produção mensal não calculada</span>'}
        <span class="metadata-item">${receitas.length} insumo(s)</span>
      </div>
    `;
  }

  /**
   * Renderizar corpo do card (expandível)
   */
  renderCardBody(produto, receitas) {
    const insumos = this.stateManager.get('insumos');

    return `
      <div class="matriz-card__section">
        <div class="matriz-card__section-header">
          <h4>Insumos Vinculados (${receitas.length})</h4>
          <button
            class="btn btn--secondary btn--sm"
            data-action="add-insumo"
            data-produto-id="${produto.id}"
            type="button">
            ➕ Adicionar Insumo
          </button>
        </div>

        ${receitas.length > 0 ? `
          <div class="matriz-receitas-list">
            ${receitas.map(receita =>
              this.renderReceitaItem(receita, insumos)
            ).join('')}
          </div>
        ` : `
          <p class="matriz-empty-message">
            Nenhum insumo vinculado ainda.
          </p>
        `}
      </div>

      ${receitas.length > 0 ? this.renderCostSummary(produto, receitas, insumos) : ''}
    `;
  }

  /**
   * Renderizar item de receita (insumo)
   */
  renderReceitaItem(receita, insumos) {
    const insumo = insumos.find(i => i.id === receita.insumoId);

    if (!insumo) {
      return `
        <div class="matriz-receita-item matriz-receita-item--error">
          <span class="receita-insumo-name">⚠️ Insumo não encontrado (${receita.insumoId})</span>
          <button
            class="btn btn--danger btn--icon"
            data-action="remove-receita"
            data-produto-id="${receita.produtoId}"
            data-insumo-id="${receita.insumoId}"
            aria-label="Remover"
            type="button">
            ❌
          </button>
        </div>
      `;
    }

    const tipoEmoji = this.getInsumoTipoEmoji(insumo.tipo);
    const custoCalculado = receita.quantidade * insumo.custoUnitario;
    const produtoUnidade = this.stateManager.getProduto(receita.produtoId)?.unidade || 'un';

    return `
      <div class="matriz-receita-item" data-receita-id="${receita.produtoId}-${receita.insumoId}">
        <div class="receita-insumo-info">
          <span class="receita-insumo-emoji">${tipoEmoji}</span>
          <span class="receita-insumo-name">${this.escapeHtml(insumo.nome)}</span>
          <span class="receita-insumo-tipo">(${insumo.tipo})</span>
        </div>

        <div class="receita-quantidade-wrapper">
          <input
            type="number"
            class="input input--sm receita-quantidade-input"
            value="${receita.quantidade}"
            step="0.001"
            min="0"
            data-produto-id="${receita.produtoId}"
            data-insumo-id="${receita.insumoId}"
            data-action="update-quantidade"
            placeholder="0"
          />
          <span class="receita-unidade">${insumo.unidade}/${produtoUnidade}</span>
        </div>

        <div class="receita-custo">
          → <span class="receita-custo-value">R$ ${this.formatCurrency(custoCalculado)}</span>
        </div>

        <div class="receita-actions">
          <button
            class="btn btn--icon btn--sm btn--danger"
            data-action="remove-receita"
            data-produto-id="${receita.produtoId}"
            data-insumo-id="${receita.insumoId}"
            aria-label="Remover"
            type="button">
            ❌
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Renderizar resumo de custos (APENAS números, sem julgamento)
   */
  renderCostSummary(produto, receitas, insumos) {
    let custoMP = 0;
    let custoEMB = 0;
    let custoUTIL = 0;

    for (const receita of receitas) {
      const insumo = insumos.find(i => i.id === receita.insumoId);
      if (!insumo) continue;

      const custo = receita.quantidade * insumo.custoUnitario;

      if (insumo.tipo === 'MP') custoMP += custo;
      else if (insumo.tipo === 'EMB') custoEMB += custo;
      else if (insumo.tipo === 'UTIL') custoUTIL += custo;
    }

    const custoTotal = custoMP + custoEMB + custoUTIL;

    // Validação defensiva: só calcula margem se precoVenda válido (NO FALLBACKS)
    let margem = null;
    let margemPercentual = 'N/A';

    if (produto.precoVenda !== null && produto.precoVenda !== undefined && produto.precoVenda > 0) {
      margem = (produto.precoVenda - custoTotal) / produto.precoVenda;
      margemPercentual = (margem * 100).toFixed(1) + '%';
    }

    return `
      <div class="matriz-card__section matriz-cost-summary">
        <h4>Resumo de Custos Calculados</h4>

        <div class="cost-breakdown">
          ${custoMP > 0 ? `
            <div class="cost-item">
              <span class="cost-label">Matérias-Primas:</span>
              <span class="cost-value">R$ ${this.formatCurrency(custoMP)}</span>
              <span class="cost-percent">(${((custoMP/custoTotal)*100).toFixed(1)}%)</span>
            </div>
          ` : ''}

          ${custoEMB > 0 ? `
            <div class="cost-item">
              <span class="cost-label">Embalagens:</span>
              <span class="cost-value">R$ ${this.formatCurrency(custoEMB)}</span>
              <span class="cost-percent">(${((custoEMB/custoTotal)*100).toFixed(1)}%)</span>
            </div>
          ` : ''}

          ${custoUTIL > 0 ? `
            <div class="cost-item">
              <span class="cost-label">Utilidades:</span>
              <span class="cost-value">R$ ${this.formatCurrency(custoUTIL)}</span>
              <span class="cost-percent">(${((custoUTIL/custoTotal)*100).toFixed(1)}%)</span>
            </div>
          ` : ''}
        </div>

        <div class="cost-total">
          <div class="cost-total-item">
            <span class="cost-total-label">💰 Custo Total:</span>
            <strong class="cost-total-value">R$ ${this.formatCurrency(custoTotal)}</strong>
          </div>

          <div class="cost-total-item">
            <span class="cost-total-label">📊 Margem Bruta:</span>
            <strong class="cost-total-value">${margemPercentual}</strong>
          </div>
        </div>
      </div>
    `;
  }

  // ==================== MODAL/DROPDOWN RENDERS ====================

  /**
   * Renderizar dropdown de seleção de insumo
   */
  renderInsumoSelector(produtoId) {
    const insumos = this.stateManager.get('insumos');
    const receitasExistentes = this.stateManager.getReceitasByProduto(produtoId);
    const insumosVinculados = new Set(receitasExistentes.map(r => r.insumoId));

    // Agrupar por tipo (graceful degradation: aceita insumos sem tipo)
    const insumosPorTipo = {
      MP: [],
      IS: [],
      EMB: [],
      UTIL: [],
      SEM_TIPO: [] // ← insumos sem tipo definido
    };

    for (const insumo of insumos) {
      // Pular insumos gerais (não podem ser vinculados)
      if (insumo.isGeral) continue;

      // Pular insumos já vinculados
      if (insumosVinculados.has(insumo.id)) continue;

      const tipo = insumo.tipo || 'SEM_TIPO'; // ← fallback para SEM_TIPO
      if (tipo in insumosPorTipo) {
        insumosPorTipo[tipo].push(insumo);
      }
    }

    return `
      <div class="matriz-insumo-selector">
        <input
          type="text"
          class="input input--search"
          placeholder="🔍 Buscar insumo..."
          data-action="search-insumo"
          id="insumo-search-${produtoId}"
        />

        <div class="insumo-selector-list">
          ${Object.entries(insumosPorTipo).map(([tipo, insumos]) => {
            if (insumos.length === 0) return '';

            const tipoLabel = {
              MP: 'Matérias-Primas',
              IS: 'Insumos Secundários',
              EMB: 'Embalagens',
              UTIL: 'Utilidades',
              SEM_TIPO: '⚠️ Sem Tipo Definido (preencha na Seção 6)'
            }[tipo];

            return `
              <div class="insumo-group">
                <h5 class="insumo-group-title">${tipoLabel}</h5>
                ${insumos.map(insumo => `
                  <button
                    class="insumo-option"
                    data-action="select-insumo"
                    data-produto-id="${produtoId}"
                    data-insumo-id="${insumo.id}"
                    type="button">
                    ${this.getInsumoTipoEmoji(tipo)} ${this.escapeHtml(insumo.nome)}
                    <span class="insumo-option-unit">(${insumo.unidade})</span>
                  </button>
                `).join('')}
              </div>
            `;
          }).join('')}

          ${Object.values(insumosPorTipo).every(arr => arr.length === 0) ? `
            <p class="insumo-selector-empty">
              Nenhum insumo disponível para vincular.
            </p>
          ` : ''}
        </div>
      </div>
    `;
  }

  /**
   * Renderizar estado vazio
   */
  renderEmptyState() {
    return `
      <div class="matriz-empty-state">
        <div class="empty-state-icon">📋</div>
        <h3>Nenhum produto encontrado</h3>
        <p>Não há produtos cadastrados ou os filtros não retornaram resultados.</p>
      </div>
    `;
  }

  // ==================== HELPERS ====================

  /**
   * Obter emoji por tipo de insumo (graceful degradation)
   */
  getInsumoTipoEmoji(tipo) {
    const emojis = {
      MP: '🥩',      // Matéria-Prima
      IS: '🔧',      // Insumo Secundário
      EMB: '📦',     // Embalagem
      UTIL: '⚡',    // Utilidades
      SEM_TIPO: '⚠️' // Sem tipo definido (warning)
    };
    return emojis[tipo] || emojis.SEM_TIPO; // fallback para warning
  }

  /**
   * Escapar HTML
   */
  escapeHtml(text) {
    if (!text) return '';
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
  }

  /**
   * Formatar moeda
   */
  formatCurrency(value) {
    if (value === null || value === undefined || isNaN(value)) {
      return '0,00';
    }
    return parseFloat(value).toFixed(2).replace('.', ',');
  }

  /**
   * Formatar número
   */
  formatNumber(value) {
    if (value === null || value === undefined || isNaN(value)) {
      return '0';
    }
    return parseFloat(value).toLocaleString('pt-BR');
  }

  /**
   * Truncar texto
   */
  truncate(text, maxLength) {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  }
}

// Exportar para uso global
if (typeof window !== 'undefined') {
  window.MatrizCardRenderer = MatrizCardRenderer;
  console.log('[MatrizCardRenderer] Classe disponível para uso');
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = MatrizCardRenderer;
}
