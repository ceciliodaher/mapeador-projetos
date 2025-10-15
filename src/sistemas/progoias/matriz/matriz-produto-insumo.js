/* =====================================
   MATRIZ-PRODUTO-INSUMO.JS
   Orquestrador principal da interface
   Coordena state, renderer, validation e import/export
   ===================================== */

class MatrizProdutoInsumo {
  constructor(containerId, dbManager) {
    if (!containerId) {
      throw new Error('containerId é obrigatório');
    }

    if (!dbManager) {
      throw new Error('dbManager é obrigatório');
    }

    this.container = document.getElementById(containerId);
    if (!this.container) {
      throw new Error(`Container #${containerId} não encontrado`);
    }

    // Dependências
    this.dbManager = dbManager;
    this.stateManager = new MatrizStateManager();
    this.renderer = new MatrizCardRenderer(this.stateManager);
    this.validation = new MatrizValidation();
    this.importExport = new MatrizImportExport(this.stateManager, this.dbManager);

    // Auto-save
    this.autoSaveTimer = null;
    this.AUTOSAVE_DELAY = 3000; // 3 segundos

    // Dropdown ativo
    this.activeDropdown = null;

    // Bind methods
    this.handleCardToggle = this.handleCardToggle.bind(this);
    this.handleAddInsumo = this.handleAddInsumo.bind(this);
    this.handleSelectInsumo = this.handleSelectInsumo.bind(this);
    this.handleUpdateQuantidade = this.handleUpdateQuantidade.bind(this);
    this.handleRemoveReceita = this.handleRemoveReceita.bind(this);
    this.handleSearch = this.handleSearch.bind(this);
    this.handleFilterChange = this.handleFilterChange.bind(this);
    this.scheduleAutoSave = this.scheduleAutoSave.bind(this);
    this.handleClickOutside = this.handleClickOutside.bind(this);
  }

  // ==================== INITIALIZATION ====================

  /**
   * Inicializar componente
   */
  async init() {
    try {
      this.showLoading(true);

      // Carregar dados do IndexedDB
      await this.stateManager.loadInitialData(this.dbManager);

      // Verificar se há dados
      const produtos = this.stateManager.get('produtos');
      const insumos = this.stateManager.get('insumos');

      const hasData = produtos.length > 0 && insumos.length > 0;
      if (!hasData) {
        this.showEmptyState(true);
      }

      // ALWAYS render interface (toolbar, filters, listeners)
      this.render();

      // Setup event listeners
      this.setupEventListeners();

      // Subscribe to state changes
      this.subscribeToStateChanges();

      this.showLoading(false);

      console.log('✓ Matriz Produto-Insumo inicializada');

    } catch (error) {
      console.error('Erro ao inicializar matriz:', error);
      this.showError('Erro ao carregar matriz. Por favor, recarregue a página.');
      this.showLoading(false);
    }
  }

  // ==================== RENDERING ====================

  /**
   * Renderizar interface completa
   */
  render() {
    const productListContainer = this.container.querySelector('.matriz-product-list-container');
    if (!productListContainer) {
      throw new Error('.matriz-product-list-container não encontrado - verifique HTML seção 7');
    }

    const html = this.renderer.renderProductList();
    productListContainer.innerHTML = html;
  }

  /**
   * Re-renderizar lista de produtos
   */
  rerenderProductList() {
    this.render();
    this.setupCardEventListeners();
  }

  // ==================== EVENT LISTENERS ====================

  /**
   * Configurar event listeners globais
   */
  setupEventListeners() {
    // Busca
    const searchInput = this.container.querySelector('#matriz-search');
    if (searchInput) {
      let searchTimeout;
      searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
          this.handleSearch(e.target.value);
        }, 300);
      });
    }

    // Filtros
    const filterOnlyActive = this.container.querySelector('#filter-only-active');
    if (filterOnlyActive) {
      filterOnlyActive.addEventListener('change', this.handleFilterChange);
    }

    const filterOnlyFilled = this.container.querySelector('#filter-only-filled');
    if (filterOnlyFilled) {
      filterOnlyFilled.addEventListener('change', this.handleFilterChange);
    }

    // Toolbar buttons
    const btnImport = this.container.querySelector('#btn-import');
    if (btnImport) {
      btnImport.addEventListener('click', () => {
        this.importExport.showImportDialog();
      });
    }

    const btnExport = this.container.querySelector('#btn-export');
    if (btnExport) {
      btnExport.addEventListener('click', () => {
        this.importExport.showExportDialog();
      });
    }

    // Click outside para fechar dropdowns
    document.addEventListener('click', this.handleClickOutside);

    // Event listeners de cards (delegados)
    this.setupCardEventListeners();
  }

  /**
   * Configurar event listeners de cards (delegação de eventos)
   */
  setupCardEventListeners() {
    const productList = this.container.querySelector('.matriz-product-list');
    if (!productList) return;

    // Event delegation
    productList.addEventListener('click', (e) => {
      const action = e.target.closest('[data-action]')?.dataset.action;
      if (!action) return;

      e.preventDefault();
      e.stopPropagation();

      switch (action) {
        case 'toggle':
          this.handleCardToggle(e);
          break;
        case 'add-insumo':
          this.handleAddInsumo(e);
          break;
        case 'select-insumo':
          this.handleSelectInsumo(e);
          break;
        case 'remove-receita':
          this.handleRemoveReceita(e);
          break;
      }
    });

    // Input de quantidade (debounced)
    productList.addEventListener('input', (e) => {
      if (e.target.classList.contains('receita-quantidade-input')) {
        this.handleUpdateQuantidade(e);
      }
    });
  }

  /**
   * Subscribe to state changes
   */
  subscribeToStateChanges() {
    // Re-renderizar quando filtros mudarem
    this.stateManager.subscribe('filters', () => {
      this.rerenderProductList();
    });

    // Auto-save quando receitas mudarem
    this.stateManager.subscribe('receitas', () => {
      this.scheduleAutoSave();
    });
  }

  // ==================== EVENT HANDLERS ====================

  /**
   * Toggle expandir/colapsar card
   */
  handleCardToggle(e) {
    const card = e.target.closest('.matriz-card');
    if (!card) return;

    const isExpanded = card.dataset.expanded === 'true';
    const body = card.querySelector('.matriz-card__body');

    if (isExpanded) {
      // Colapsar
      card.dataset.expanded = 'false';
      body.style.display = 'none';
    } else {
      // Expandir
      card.dataset.expanded = 'true';
      body.style.display = 'block';
    }
  }

  /**
   * Adicionar insumo (mostrar dropdown)
   */
  handleAddInsumo(e) {
    const btn = e.target.closest('[data-action="add-insumo"]');
    const produtoId = btn.dataset.produtoId;

    // Fechar dropdown anterior
    if (this.activeDropdown) {
      this.activeDropdown.remove();
      this.activeDropdown = null;
    }

    // Criar dropdown
    const dropdown = document.createElement('div');
    dropdown.className = 'matriz-insumo-selector';
    dropdown.innerHTML = this.renderer.renderInsumoSelector(produtoId);

    // Inserir após o botão
    const section = btn.closest('.matriz-card__section');
    section.appendChild(dropdown);

    this.activeDropdown = dropdown;

    // Focus no search
    const searchInput = dropdown.querySelector(`#insumo-search-${produtoId}`);
    if (searchInput) {
      searchInput.focus();

      // Filtro de busca inline
      searchInput.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        const options = dropdown.querySelectorAll('.insumo-option');

        options.forEach(option => {
          const text = option.textContent.toLowerCase();
          option.style.display = text.includes(term) ? 'flex' : 'none';
        });
      });
    }
  }

  /**
   * Selecionar insumo do dropdown
   */
  async handleSelectInsumo(e) {
    const btn = e.target.closest('[data-action="select-insumo"]');
    const produtoId = btn.dataset.produtoId;
    const insumoId = btn.dataset.insumoId;

    // Fechar dropdown
    if (this.activeDropdown) {
      this.activeDropdown.remove();
      this.activeDropdown = null;
    }

    // Prompt para quantidade
    const quantidade = prompt('Digite a quantidade por unidade:');
    if (!quantidade) return;

    // Validar
    const validation = this.validation.validateQuantidade(quantidade);
    if (validation && !validation.valid) {
      alert(`Erro: ${validation.error}`);
      return;
    }

    // Adicionar receita
    try {
      this.stateManager.setReceita(produtoId, insumoId, parseFloat(quantidade));

      // Re-renderizar card
      this.rerenderCard(produtoId);

      console.log(`✓ Receita adicionada: ${produtoId} - ${insumoId}`);

    } catch (error) {
      console.error('Erro ao adicionar receita:', error);
      alert(`Erro: ${error.message}`);
    }
  }

  /**
   * Atualizar quantidade de receita
   */
  handleUpdateQuantidade(e) {
    const input = e.target;
    const produtoId = input.dataset.produtoId;
    const insumoId = input.dataset.insumoId;
    const quantidade = input.value;

    // Validação visual
    const validation = this.validation.validateQuantidade(quantidade);
    const receitaItem = input.closest('.matriz-receita-item');

    if (validation && !validation.valid) {
      receitaItem.style.borderColor = 'var(--expertzy-red)';
      input.title = validation.error;
    } else {
      receitaItem.style.borderColor = '';
      input.title = '';
    }

    // Atualizar state (mesmo se inválido, para permitir correção)
    try {
      this.stateManager.setReceita(produtoId, insumoId, quantidade);

      // Atualizar custo calculado em tempo real
      this.updateReceitaCost(produtoId, insumoId, quantidade);

    } catch (error) {
      console.error('Erro ao atualizar quantidade:', error);
    }
  }

  /**
   * Atualizar custo calculado de uma receita
   */
  updateReceitaCost(produtoId, insumoId, quantidade) {
    const insumo = this.stateManager.getInsumo(insumoId);
    if (!insumo) return;

    const qtd = parseFloat(quantidade);
    if (isNaN(qtd)) return;

    const custo = qtd * insumo.custoUnitario;

    // Encontrar elemento de custo
    const receitaItem = this.container.querySelector(
      `.matriz-receita-item[data-receita-id="${produtoId}-${insumoId}"]`
    );

    if (receitaItem) {
      const custoValue = receitaItem.querySelector('.receita-custo-value');
      if (custoValue) {
        custoValue.textContent = `R$ ${custo.toFixed(2).replace('.', ',')}`;
      }
    }

    // Atualizar resumo de custos do card (re-render completo)
    setTimeout(() => {
      this.rerenderCard(produtoId);
    }, 500);
  }

  /**
   * Remover receita
   */
  handleRemoveReceita(e) {
    const btn = e.target.closest('[data-action="remove-receita"]');
    const produtoId = btn.dataset.produtoId;
    const insumoId = btn.dataset.insumoId;

    if (!confirm('Remover este insumo do produto?')) {
      return;
    }

    try {
      this.stateManager.setReceita(produtoId, insumoId, null);

      // Re-renderizar card
      this.rerenderCard(produtoId);

      console.log(`✓ Receita removida: ${produtoId} - ${insumoId}`);

    } catch (error) {
      console.error('Erro ao remover receita:', error);
      alert(`Erro: ${error.message}`);
    }
  }

  /**
   * Buscar produtos/insumos
   */
  handleSearch(term) {
    this.stateManager.set('filters.searchTerm', term);
  }

  /**
   * Mudar filtros
   */
  handleFilterChange(e) {
    const filterKey = e.target.id === 'filter-only-active'
      ? 'filters.onlyActive'
      : 'filters.onlyFilled';

    this.stateManager.set(filterKey, e.target.checked);
  }

  /**
   * Click fora fecha dropdown
   */
  handleClickOutside(e) {
    if (!this.activeDropdown) return;

    if (!this.activeDropdown.contains(e.target) &&
        !e.target.closest('[data-action="add-insumo"]')) {
      this.activeDropdown.remove();
      this.activeDropdown = null;
    }
  }

  // ==================== HELPERS ====================

  /**
   * Re-renderizar um card específico
   */
  rerenderCard(produtoId) {
    const card = this.container.querySelector(`.matriz-card[data-produto-id="${produtoId}"]`);
    if (!card) return;

    const wasExpanded = card.dataset.expanded === 'true';

    const produto = this.stateManager.getProduto(produtoId);
    if (!produto) return;

    const receitas = this.stateManager.getReceitasByProduto(produtoId);

    // Re-criar card
    const newCardHtml = this.renderer.renderProductCard(produto);
    const temp = document.createElement('div');
    temp.innerHTML = newCardHtml;
    const newCard = temp.firstElementChild;

    // Manter estado expandido
    if (wasExpanded) {
      newCard.dataset.expanded = 'true';
      newCard.querySelector('.matriz-card__body').style.display = 'block';
    }

    card.replaceWith(newCard);
  }

  /**
   * Agendar auto-save (debounced)
   */
  scheduleAutoSave() {
    clearTimeout(this.autoSaveTimer);

    this.autoSaveTimer = setTimeout(async () => {
      await this.saveToDatabase();
    }, this.AUTOSAVE_DELAY);
  }

  /**
   * Salvar no IndexedDB
   */
  async saveToDatabase() {
    if (!this.stateManager.get('isDirty')) {
      return;
    }

    try {
      await this.importExport.saveAllReceitas();
      this.showAutoSaveIndicator();

      console.log('✓ Auto-save concluído');

    } catch (error) {
      console.error('Erro ao salvar:', error);
      this.showError('Erro ao salvar alterações.');
    }
  }

  /**
   * Mostrar indicador de auto-save
   */
  showAutoSaveIndicator() {
    const indicator = this.container.querySelector('.matriz-autosave');
    if (!indicator) return;

    indicator.classList.add('show');

    setTimeout(() => {
      indicator.classList.remove('show');
    }, 2000);
  }

  /**
   * Mostrar loading
   */
  showLoading(show) {
    const loading = this.container.querySelector('.matriz-loading');
    if (loading) {
      loading.style.display = show ? 'flex' : 'none';
    }
  }

  /**
   * Mostrar empty state
   */
  showEmptyState(show) {
    const emptyState = this.container.querySelector('.matriz-empty-state');
    if (emptyState) {
      emptyState.style.display = show ? 'flex' : 'none';
    }
  }

  /**
   * Mostrar erro
   */
  showError(message) {
    alert(message);
  }

  /**
   * Cleanup
   */
  destroy() {
    clearTimeout(this.autoSaveTimer);
    document.removeEventListener('click', this.handleClickOutside);
    this.saveToDatabase();
  }
}

// Exportar para uso global
if (typeof window !== 'undefined') {
  window.MatrizProdutoInsumo = MatrizProdutoInsumo;
  console.log('[MatrizProdutoInsumo] Classe disponível para uso');
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = MatrizProdutoInsumo;
}
