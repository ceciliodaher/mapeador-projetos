/**
 * DynamicTable v2.0 - Componente Consolidado
 *
 * Unifica as melhores funcionalidades de:
 * - financiamento/DynamicTable.js (schema externo, 11 tipos, máscaras BR)
 * - components/dynamic-table.js (IndexedDB nativo, UUID, Select All, Clone, Sticky)
 *
 * @version 2.0.0
 * @date 2025-10-17
 * @author Expertzy
 *
 * @example
 * const table = new DynamicTable({
 *   tableId: 'investimentos',
 *   containerId: 'investimentos-container',
 *   columns: [
 *     { name: 'item', label: 'Item', type: 'text', required: true },
 *     { name: 'valor', label: 'Valor', type: 'currency', includeInTotal: true },
 *     { name: 'quantidade', label: 'Qtd', type: 'number', includeInTotal: true }
 *   ],
 *   options: {
 *     minRows: 1,
 *     showTotal: true,
 *     allowDelete: true
 *   },
 *   persistence: {
 *     type: 'indexeddb', // 'indexeddb' | 'localstorage' | 'custom'
 *     manager: customIndexedDBManager // opcional
 *   }
 * });
 *
 * await table.init();
 */

class DynamicTable {
  /**
   * Cache estático de defaults (carregado uma única vez)
   * @type {Object|null}
   */
  static defaults = null;

  /**
   * @param {Object} config - Configuração da tabela
   * @param {string} config.tableId - ID único da tabela (obrigatório)
   * @param {string} config.containerId - ID do container DOM (obrigatório)
   * @param {Array} config.columns - Definição das colunas (obrigatório)
   * @param {Object} config.options - Opções da tabela (opcional)
   * @param {Object} config.persistence - Configuração de persistência (opcional)
   * @param {Object} config.validations - Validações customizadas (opcional)
   */
  constructor(config) {
    // ========================================
    // VALIDAÇÃO ESTRUTURAL MÍNIMA
    // ========================================
    if (!config) {
      throw new Error('DynamicTable: configuração obrigatória ausente');
    }

    if (!config.tableId || typeof config.tableId !== 'string') {
      throw new Error('DynamicTable: tableId é obrigatório e deve ser string');
    }

    if (!config.containerId || typeof config.containerId !== 'string') {
      throw new Error('DynamicTable: containerId é obrigatório e deve ser string');
    }

    if (!config.columns || !Array.isArray(config.columns) || config.columns.length === 0) {
      throw new Error('DynamicTable: columns é obrigatório e deve ser array não vazio');
    }

    // ========================================
    // PROPRIEDADES PRINCIPAIS
    // ========================================
    this.tableId = config.tableId;
    this.containerId = config.containerId;
    this.columns = config.columns; // Será normalizado no init()
    this.options = config.options || {};
    this.persistence = config.persistence || { type: 'localstorage' };
    this.validations = config.validations || {};

    // ========================================
    // ESTADO INTERNO
    // ========================================
    this.rows = [];
    this.rowCount = 0;
    this.container = null;
    this.table = null;
    this.tbody = null;

    // ========================================
    // TIMERS E DEBOUNCE
    // ========================================
    this.saveTimeout = null;
    this.persistDebounce = null;

    // ========================================
    // EVENT LISTENERS
    // ========================================
    this.listeners = {
      onChange: [],
      onValidate: [],
      onError: [],
      onRowAdded: [],
      onRowRemoved: []
    };

    console.log(`✓ DynamicTable[${this.tableId}] configurado`);
  }

  // ========================================
  // INICIALIZAÇÃO
  // ========================================

  /**
   * Inicializa a tabela
   * @returns {Promise<void>}
   */
  async init() {
    // 1. Carregar defaults do schema
    await this.loadDefaults();

    // 2. Normalizar colunas com defaults
    this.normalizeColumns();

    // 3. Normalizar opções com defaults
    this.normalizeOptions();

    // 4. Localizar container no DOM
    this.container = document.getElementById(this.containerId);
    if (!this.container) {
      throw new Error(`DynamicTable[${this.tableId}]: Container #${this.containerId} não encontrado`);
    }

    // 5. Renderizar estrutura HTML
    this.render();

    // 6. Carregar dados salvos
    await this.loadFromPersistence();

    // 7. Se não há linhas e minRows > 0, adicionar linhas vazias
    if (this.rows.length === 0 && this.options.minRows > 0) {
      for (let i = 0; i < this.options.minRows; i++) {
        this.addRow({}, true); // skipPersist = true
      }
      // Persistir uma única vez
      await this.persistData();
    }

    // 8. Atualizar totalizadores iniciais
    this.updateTotals();

    console.log(`✓ DynamicTable[${this.tableId}] inicializado com ${this.rows.length} linhas`);
  }

  /**
   * Carrega schema de defaults (cache estático)
   * @returns {Promise<void>}
   */
  async loadDefaults() {
    if (DynamicTable.defaults) {
      return; // Já carregado
    }

    try {
      const response = await fetch('/config/dynamic-table-defaults.json');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      DynamicTable.defaults = await response.json();
      console.log('✓ DynamicTable: Schema defaults carregado');
    } catch (error) {
      throw new Error(`DynamicTable: Falha ao carregar defaults: ${error.message}`);
    }
  }

  /**
   * Normaliza colunas com defaults do schema
   */
  normalizeColumns() {
    this.columns = this.columns.map(col => {
      const typeDefaults = DynamicTable.defaults.fieldTypes[col.type];

      if (!typeDefaults) {
        throw new Error(`DynamicTable[${this.tableId}]: Tipo de campo inválido: ${col.type}`);
      }

      // Merge: user config sobrescreve defaults
      return {
        ...typeDefaults,
        ...col,
        // Garante propriedades obrigatórias
        name: col.name,
        label: col.label,
        type: col.type
      };
    });
  }

  /**
   * Normaliza opções da tabela com defaults
   */
  normalizeOptions() {
    const defaultOptions = DynamicTable.defaults.tableOptions;

    this.options = {
      ...defaultOptions,
      ...this.options
    };
  }

  // ========================================
  // RENDERIZAÇÃO
  // ========================================

  /**
   * Renderiza a estrutura completa da tabela
   */
  render() {
    const css = DynamicTable.defaults.css;

    const tableHTML = `
      <div class="${css.wrapper}" data-table-id="${this.tableId}">
        <!-- Header fixo -->
        <div class="table-header">
          <table class="${css.table}">
            <thead>
              <tr>
                ${this.options.allowDelete || this.renderSelectAllCheckbox() ? `
                  <th class="row-selector-header" style="width: 40px;">
                    ${this.renderSelectAllCheckbox()}
                  </th>
                ` : ''}
                ${this.renderHeaderCells()}
                ${this.renderActionsHeader()}
              </tr>
            </thead>
          </table>
        </div>

        <!-- Body scrollable -->
        <div class="table-body ${this.options.responsive ? css.tableResponsive : ''}">
          <table class="${css.table} ${this.options.striped ? css.tableStriped : ''}">
            <tbody id="${this.tableId}-tbody">
              <!-- Linhas renderizadas dinamicamente -->
            </tbody>
          </table>
        </div>

        <!-- Footer com totalizadores -->
        ${this.options.showTotal ? this.renderFooter() : ''}

        <!-- Botão adicionar linha -->
        ${this.options.allowAdd ? this.renderAddButton() : ''}
      </div>
    `;

    this.container.innerHTML = tableHTML;
    this.table = this.container.querySelector('table');
    this.tbody = document.getElementById(`${this.tableId}-tbody`);

    if (!this.tbody) {
      throw new Error(`DynamicTable[${this.tableId}]: tbody não encontrado após render`);
    }

    // Anexar event listeners
    this.attachEventListeners();
  }

  /**
   * Renderiza checkbox "Selecionar Todas"
   * @returns {string}
   */
  renderSelectAllCheckbox() {
    return `<input type="checkbox" id="${this.tableId}_selectAll" title="Selecionar todas">`;
  }

  /**
   * Renderiza células do header
   * @returns {string}
   */
  renderHeaderCells() {
    return this.columns.map((col, index) => {
      const required = col.required ? '<span class="required">*</span>' : '';
      const helpText = col.helpText ? `<i class="help-icon" title="${col.helpText}">?</i>` : '';
      const width = col.width !== undefined ? `width: ${col.width};` : '';
      const sticky = this.isFixedColumn(index) ? this.getFixedColumnStyle(index) : '';

      return `<th data-column="${col.name}" style="${width}${sticky}">${col.label}${required}${helpText}</th>`;
    }).join('');
  }

  /**
   * Renderiza header de ações
   * @returns {string}
   */
  renderActionsHeader() {
    return '<th class="row-actions-header" style="width: 100px;">Ações</th>';
  }

  /**
   * Renderiza footer com totalizadores
   * @returns {string}
   */
  renderFooter() {
    const css = DynamicTable.defaults.css;

    return `
      <div class="table-footer">
        <table class="${css.table}">
          <tfoot>
            <tr class="${css.totalRow}">
              ${this.options.allowDelete ? '<td style="width: 40px;"></td>' : ''}
              ${this.renderTotalCells()}
              <td style="width: 100px;"></td>
            </tr>
          </tfoot>
        </table>
      </div>
    `;
  }

  /**
   * Renderiza células de totalizadores
   * @returns {string}
   */
  renderTotalCells() {
    return this.columns.map((col, index) => {
      if (index === 0) {
        return '<td class="total-label"><strong>Total:</strong></td>';
      } else if (col.includeInTotal) {
        return `<td class="total-value" data-column="${col.name}" id="${this.tableId}-total-${col.name}">-</td>`;
      } else {
        return '<td>-</td>';
      }
    }).join('');
  }

  /**
   * Renderiza botão adicionar linha
   * @returns {string}
   */
  renderAddButton() {
    const css = DynamicTable.defaults.css;
    return `
      <div class="add-row-container">
        <button type="button" class="${css.addRowBtn}" data-table-id="${this.tableId}">
          + Adicionar Linha
        </button>
      </div>
    `;
  }

  /**
   * Verifica se coluna é fixa (sticky)
   * @param {number} columnIndex
   * @returns {boolean}
   */
  isFixedColumn(columnIndex) {
    return this.columns[columnIndex].fixed === true && this.options.fixedColumns && columnIndex < this.options.fixedColumns;
  }

  /**
   * Retorna estilo CSS para coluna fixa
   * @param {number} columnIndex
   * @returns {string}
   */
  getFixedColumnStyle(columnIndex) {
    const leftOffset = this.columns
      .slice(0, columnIndex)
      .reduce((sum, col) => {
        const width = col.width !== undefined ? parseInt(col.width) : 150;
        return sum + width;
      }, 40); // 40px = checkbox width

    return `position: sticky; left: ${leftOffset}px; z-index: 5; background: white;`;
  }

  // ========================================
  // MANIPULAÇÃO DE LINHAS
  // ========================================

  /**
   * Adiciona nova linha
   * @param {Object} data - Dados iniciais (opcional)
   * @param {boolean} skipPersist - Pular persistência (default: false)
   * @returns {string} rowId
   */
  addRow(data = {}, skipPersist = false) {
    // Verificar maxRows
    if (this.options.maxRows && this.rows.length >= this.options.maxRows) {
      throw new Error(`DynamicTable[${this.tableId}]: Limite máximo de ${this.options.maxRows} linhas atingido`);
    }

    // Gerar UUID v4 único
    const rowId = this.generateUUID();

    // Criar objeto row
    const row = {
      id: rowId,
      ...this.createEmptyRowData(),
      ...data
    };

    // Adicionar ao array
    this.rows.push(row);
    this.rowCount++;

    // Renderizar no DOM
    this.renderRow(row);

    // Recalcular campos calculados (CRÍTICO para Teste 5)
    this.recalculateRow(rowId);

    // Atualizar totalizadores
    if (this.options.showTotal) {
      this.updateTotals();
    }

    // Persistir (com debounce)
    if (!skipPersist) {
      this.schedulePersist();
    }

    // Disparar eventos
    this.dispatchEvent('onRowAdded', { rowId, data: row });
    this.dispatchEvent('onChange', { action: 'add', rowId, data: row });

    return rowId;
  }

  /**
   * Renderiza uma linha no DOM
   * @param {Object} row
   */
  renderRow(row) {
    const tr = document.createElement('tr');
    tr.className = 'dynamic-row';
    tr.dataset.rowId = row.id;

    let html = '';

    // Checkbox de seleção
    if (this.options.allowDelete) {
      html += `
        <td class="row-selector" style="width: 40px;">
          <input type="checkbox" class="row-checkbox" data-row-id="${row.id}">
        </td>
      `;
    }

    // Colunas de dados
    this.columns.forEach((col, index) => {
      const value = row[col.name] !== undefined ? row[col.name] : '';
      const width = col.width !== undefined ? `width: ${col.width};` : '';
      const sticky = this.isFixedColumn(index) ? this.getFixedColumnStyle(index) : '';

      html += `
        <td data-column="${col.name}" style="${width}${sticky}">
          ${this.renderCell(col, row.id, value)}
        </td>
      `;
    });

    // Ações
    html += `
      <td class="row-actions" style="width: 100px;">
        ${this.options.allowDelete ? `
          <button type="button" class="btn-icon btn-delete-row" data-row-id="${row.id}" title="Deletar">
            🗑️
          </button>
        ` : ''}
        <button type="button" class="btn-icon btn-clone-row" data-row-id="${row.id}" title="Duplicar">
          📋
        </button>
      </td>
    `;

    tr.innerHTML = html;
    this.tbody.appendChild(tr);

    // Aplicar máscaras
    this.applyMasks(tr);
  }

  /**
   * Renderiza uma célula (input)
   * @param {Object} col - Configuração da coluna
   * @param {string} rowId - ID da linha
   * @param {*} value - Valor inicial
   * @returns {string}
   */
  renderCell(col, rowId, value) {
    const css = DynamicTable.defaults.css;
    const fieldId = `${this.tableId}-${rowId}-${col.name}`;
    const commonAttrs = `
      id="${fieldId}"
      name="${fieldId}"
      data-row-id="${rowId}"
      data-column="${col.name}"
      data-type="${col.type}"
      class="${css.formControl}"
      ${col.required ? 'required' : ''}
      ${col.readonly ? 'readonly' : ''}
      ${col.disabled ? 'disabled' : ''}
    `.trim();

    // Campo calculado (readonly)
    if (col.calculated === true || col.type === 'calculated') {
      return `
        <input type="text" ${commonAttrs} value="${value}" readonly
               data-calculated="true" data-formula="${col.formula || ''}">
      `;
    }

    // Campos editáveis
    switch (col.type) {
      case 'text':
        return `<input type="text" ${commonAttrs} value="${value}" placeholder="${col.placeholder}">`;

      case 'textarea':
        return `<textarea ${commonAttrs} rows="2" placeholder="${col.placeholder}">${value}</textarea>`;

      case 'number':
        return `<input type="number" ${commonAttrs} value="${value}"
                       step="${col.step}" placeholder="${col.placeholder}">`;

      case 'currency':
      case 'percentage':
      case 'cpf':
      case 'cnpj':
      case 'phone':
        return `<input type="text" ${commonAttrs} value="${value}"
                       placeholder="${col.placeholder}"
                       ${col.maxLength ? `maxlength="${col.maxLength}"` : ''}>`;

      case 'email':
        return `<input type="email" ${commonAttrs} value="${value}" placeholder="${col.placeholder}">`;

      case 'date':
        return `<input type="date" ${commonAttrs} value="${value}">`;

      case 'boolean':
        return this.renderBooleanField(col, commonAttrs, value);

      case 'list':
        return this.renderListField(col, commonAttrs, value);

      default:
        return `<input type="text" ${commonAttrs} value="${value}">`;
    }
  }

  /**
   * Renderiza campo boolean (select)
   * @param {Object} col
   * @param {string} commonAttrs
   * @param {*} value
   * @returns {string}
   */
  renderBooleanField(col, commonAttrs, value) {
    const options = col.options || DynamicTable.defaults.fieldTypes.boolean.options;
    let html = `<select ${commonAttrs}>`;

    options.forEach(opt => {
      const selected = value === opt.value ? 'selected' : '';
      html += `<option value="${opt.value}" ${selected}>${opt.label}</option>`;
    });

    html += '</select>';
    return html;
  }

  /**
   * Renderiza campo list (select)
   * @param {Object} col
   * @param {string} commonAttrs
   * @param {*} value
   * @returns {string}
   */
  renderListField(col, commonAttrs, value) {
    const options = col.options || [];
    let html = `<select ${commonAttrs}>`;
    html += `<option value="">${col.placeholder || 'Selecione...'}</option>`;

    options.forEach(opt => {
      const optValue = typeof opt === 'object' ? opt.value : opt;
      const optLabel = typeof opt === 'object' ? opt.label : opt;
      const selected = value === optValue ? 'selected' : '';
      html += `<option value="${optValue}" ${selected}>${optLabel}</option>`;
    });

    html += '</select>';
    return html;
  }

  /**
   * Cria objeto de dados vazio para uma linha
   * @returns {Object}
   */
  createEmptyRowData() {
    const rowData = {};
    this.columns.forEach(col => {
      rowData[col.name] = col.defaultValue;
    });
    return rowData;
  }

  /**
   * Remove linha
   * @param {string} rowId
   */
  removeRow(rowId) {
    // Verificar minRows
    if (this.rows.length <= this.options.minRows) {
      alert(`É necessário manter pelo menos ${this.options.minRows} linha(s).`);
      return;
    }

    // Confirmar
    if (!confirm('Deseja realmente deletar esta linha?')) {
      return;
    }

    // Remover do array
    const index = this.rows.findIndex(r => r.id === rowId);
    if (index === -1) {
      throw new Error(`DynamicTable[${this.tableId}]: linha com rowId="${rowId}" não encontrada`);
    }
    this.rows.splice(index, 1);

    // Remover do DOM
    const tr = this.tbody.querySelector(`tr[data-row-id="${rowId}"]`);
    if (tr) {
      tr.remove();
    }

    // Atualizar totalizadores
    if (this.options.showTotal) {
      this.updateTotals();
    }

    // Atualizar botões delete (minRows)
    this.updateDeleteButtons();

    // Persistir
    this.schedulePersist();

    // Disparar eventos
    this.dispatchEvent('onRowRemoved', { rowId });
    this.dispatchEvent('onChange', { action: 'remove', rowId });
  }

  /**
   * Clona uma linha
   * @param {string} rowId
   * @returns {string} newRowId
   */
  cloneRow(rowId) {
    const row = this.rows.find(r => r.id === rowId);
    if (!row) {
      throw new Error(`DynamicTable[${this.tableId}]: linha com rowId="${rowId}" não encontrada`);
    }

    // Copiar dados (sem o ID)
    const clonedData = { ...row };
    delete clonedData.id;

    // Adicionar nova linha
    return this.addRow(clonedData);
  }

  /**
   * Atualiza estado dos botões delete (baseado em minRows)
   */
  updateDeleteButtons() {
    const deleteButtons = this.tbody.querySelectorAll('.btn-delete-row');
    const canDelete = this.rows.length > this.options.minRows;

    deleteButtons.forEach(btn => {
      btn.disabled = !canDelete;
    });
  }

  // ========================================
  // SELEÇÃO DE LINHAS
  // ========================================

  /**
   * Seleciona/desseleciona todas as linhas
   * @param {boolean} checked
   */
  selectAll(checked) {
    const checkboxes = this.tbody.querySelectorAll('.row-checkbox');
    checkboxes.forEach(cb => {
      cb.checked = checked;
    });
  }

  /**
   * Retorna IDs das linhas selecionadas
   * @returns {Array<string>}
   */
  getSelectedRows() {
    const checkboxes = this.tbody.querySelectorAll('.row-checkbox:checked');
    return Array.from(checkboxes).map(cb => cb.dataset.rowId);
  }

  // ========================================
  // EVENT HANDLERS
  // ========================================

  /**
   * Anexa event listeners
   */
  attachEventListeners() {
    // Select All checkbox
    const selectAllCheckbox = document.getElementById(`${this.tableId}_selectAll`);
    if (selectAllCheckbox) {
      selectAllCheckbox.addEventListener('change', (e) => {
        this.selectAll(e.target.checked);
      });
    }

    // Botão adicionar linha
    const addButton = this.container.querySelector('.btn-add-row');
    if (addButton) {
      addButton.addEventListener('click', () => this.addRow());
    }

    // Delegated events no tbody (performance)
    this.tbody.addEventListener('click', (e) => {
      // Botão deletar
      if (e.target.closest('.btn-delete-row')) {
        const btn = e.target.closest('.btn-delete-row');
        const rowId = btn.dataset.rowId;
        this.removeRow(rowId);
      }

      // Botão clonar
      if (e.target.closest('.btn-clone-row')) {
        const btn = e.target.closest('.btn-clone-row');
        const rowId = btn.dataset.rowId;
        this.cloneRow(rowId);
      }
    });

    this.tbody.addEventListener('input', (e) => {
      if (e.target.matches('input, select, textarea')) {
        this.handleInputChange(e.target);
      }
    });

    this.tbody.addEventListener('blur', (e) => {
      if (e.target.matches('input')) {
        this.applySuggestedMask(e.target);
      }
    }, true); // useCapture = true
  }

  /**
   * Handle input change
   * @param {HTMLElement} input
   */
  handleInputChange(input) {
    const rowId = input.dataset.rowId;
    const columnName = input.dataset.column;
    const value = this.parseValue(input.value, input.dataset.type);

    // Atualizar no array rows
    const row = this.rows.find(r => r.id === rowId);
    if (!row) {
      console.error(`DynamicTable[${this.tableId}]: linha rowId="${rowId}" não encontrada`);
      return;
    }
    row[columnName] = value;

    // Recalcular campos calculados
    this.recalculateRow(rowId);

    // Atualizar totalizadores
    if (this.options.showTotal) {
      this.updateTotals();
    }

    // Remove avisos visuais ao digitar
    const css = DynamicTable.defaults.css;
    input.classList.remove(css.warning);
    input.classList.remove(css.error);

    // Persistir (com debounce)
    this.schedulePersist();

    // Disparar evento
    this.dispatchEvent('onChange', { action: 'update', rowId, columnName, value });
  }

  // ========================================
  // PARSE E FORMAT
  // ========================================

  /**
   * Parse value baseado no tipo
   * @param {string} value
   * @param {string} type
   * @returns {*}
   */
  parseValue(value, type) {
    if (!value || value === '') return value;

    switch (type) {
      case 'currency':
      case 'percentage':
        // Para formato pt-BR: "R$ 1.000,00" → 1000
        // 1. Remove currency symbols/spaces
        let cleaned = value.replace(/[^\d,.-]/g, '');
        // 2. Remove thousands separator (.) then replace decimal (,) with (.)
        cleaned = cleaned.replace(/\./g, '').replace(',', '.');
        return parseFloat(cleaned) || 0;
      case 'number':
        return parseFloat(value) || 0;
      case 'boolean':
        return value === 'true';
      default:
        return value;
    }
  }

  /**
   * Formata valor baseado no tipo e coluna
   * @param {*} value
   * @param {Object} column
   * @returns {string}
   */
  formatValue(value, column) {
    const decimalPlaces = column.decimalPlaces !== undefined ? column.decimalPlaces : 2;

    switch (column.type) {
      case 'currency':
        return new Intl.NumberFormat(column.locale || 'pt-BR', {
          style: 'currency',
          currency: column.currency || 'BRL',
          minimumFractionDigits: decimalPlaces,
          maximumFractionDigits: decimalPlaces
        }).format(value);

      case 'percentage':
        return new Intl.NumberFormat(column.locale || 'pt-BR', {
          style: 'percent',
          minimumFractionDigits: decimalPlaces,
          maximumFractionDigits: decimalPlaces
        }).format(value / 100);

      case 'number':
        return new Intl.NumberFormat(column.locale || 'pt-BR', {
          minimumFractionDigits: decimalPlaces,
          maximumFractionDigits: decimalPlaces
        }).format(value);

      default:
        return value;
    }
  }

  // ========================================
  // MÁSCARAS BRASILEIRAS
  // ========================================

  /**
   * Aplica máscara SUGESTIVA (não força) no blur
   * @param {HTMLElement} input
   */
  applySuggestedMask(input) {
    const type = input.dataset.type;

    try {
      switch (type) {
        case 'currency':
          this.applyCurrencyMask(input);
          break;
        case 'percentage':
          this.applyPercentageMask(input);
          break;
        case 'cpf':
          this.applyCPFMask(input);
          break;
        case 'cnpj':
          this.applyCNPJMask(input);
          break;
        case 'phone':
          this.applyPhoneMask(input);
          break;
      }
    } catch (error) {
      // Se falhar, não faz nada - mantém valor original
      console.debug(`Máscara não aplicada para ${type}:`, error);
    }
  }

  /**
   * Aplica máscara de moeda (blur)
   * @param {HTMLElement} input
   */
  applyCurrencyMask(input) {
    let value = input.value.replace(/\D/g, '');
    if (!value) return;

    const col = this.columns.find(c => c.name === input.dataset.column);
    const decimalPlaces = col?.decimalPlaces !== undefined ? col.decimalPlaces : 2;
    const divisor = Math.pow(10, decimalPlaces);
    const number = parseInt(value) / divisor;

    input.value = new Intl.NumberFormat(col?.locale || 'pt-BR', {
      style: 'currency',
      currency: col?.currency || 'BRL',
      minimumFractionDigits: decimalPlaces
    }).format(number);
  }

  /**
   * Aplica máscara de percentual (blur)
   * @param {HTMLElement} input
   */
  applyPercentageMask(input) {
    let value = input.value.replace(/\D/g, '');
    if (!value) return;

    const col = this.columns.find(c => c.name === input.dataset.column);
    const decimalPlaces = col?.decimalPlaces !== undefined ? col.decimalPlaces : 2;
    const divisor = Math.pow(10, decimalPlaces);
    const number = parseInt(value) / divisor;

    input.value = new Intl.NumberFormat(col?.locale || 'pt-BR', {
      style: 'percent',
      minimumFractionDigits: decimalPlaces
    }).format(number / 100);
  }

  /**
   * Aplica máscara de CPF (000.000.000-00)
   * @param {HTMLElement} input
   */
  applyCPFMask(input) {
    let value = input.value.replace(/\D/g, '');
    value = value.replace(/(\d{3})(\d)/, '$1.$2');
    value = value.replace(/(\d{3})(\d)/, '$1.$2');
    value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    input.value = value;
  }

  /**
   * Aplica máscara de CNPJ (00.000.000/0000-00)
   * @param {HTMLElement} input
   */
  applyCNPJMask(input) {
    let value = input.value.replace(/\D/g, '');
    value = value.replace(/^(\d{2})(\d)/, '$1.$2');
    value = value.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
    value = value.replace(/\.(\d{3})(\d)/, '.$1/$2');
    value = value.replace(/(\d{4})(\d)/, '$1-$2');
    input.value = value;
  }

  /**
   * Aplica máscara de telefone ((00) 00000-0000)
   * @param {HTMLElement} input
   */
  applyPhoneMask(input) {
    let value = input.value.replace(/\D/g, '');
    if (value.length <= 10) {
      value = value.replace(/^(\d{2})(\d)/g, '($1) $2');
      value = value.replace(/(\d)(\d{4})$/, '$1-$2');
    } else {
      value = value.replace(/^(\d{2})(\d)/g, '($1) $2');
      value = value.replace(/(\d)(\d{4})$/, '$1-$2');
    }
    input.value = value;
  }

  /**
   * Aplica máscaras nos inputs (após renderRow)
   * @param {HTMLElement} container - TR da linha
   */
  applyMasks(container) {
    // Currency e Percentage: remover formatação no focus, aplicar no blur
    const maskedInputs = container.querySelectorAll('[data-type="currency"], [data-type="percentage"]');
    maskedInputs.forEach(input => {
      input.addEventListener('focus', (e) => {
        // Remover formatação ao focar
        const rawValue = e.target.value.replace(/[^\d,.-]/g, '').replace(',', '.');
        const value = rawValue !== '' ? parseFloat(rawValue) : 0;
        if (!isNaN(value)) {
          e.target.value = value.toString().replace('.', ',');
        }
      });
    });
  }

  // ========================================
  // CAMPOS CALCULADOS
  // ========================================

  /**
   * Recalcula campos calculados de uma linha
   * @param {string} rowId
   */
  recalculateRow(rowId) {
    const row = this.rows.find(r => r.id === rowId);
    if (!row) {
      console.error(`DynamicTable[${this.tableId}]: linha rowId="${rowId}" não encontrada em recalculateRow`);
      return;
    }

    this.columns.forEach(col => {
      if ((col.calculated === true || col.type === 'calculated') && col.formula) {
        const value = this.evaluateFormula(col.formula, row);
        row[col.name] = value;

        // Atualizar campo no DOM
        const input = document.getElementById(`${this.tableId}-${rowId}-${col.name}`);
        if (input) {
          if (col.type === 'currency') {
            input.value = this.formatValue(value, col);
          } else {
            input.value = value;
          }
        }
      }
    });
  }

  /**
   * Avalia fórmula simples
   * @param {string} formula - Ex: "quantidade * valor_unitario"
   * @param {Object} row - Dados da linha
   * @returns {number}
   */
  evaluateFormula(formula, row) {
    // Substituir nomes de colunas por valores
    let expression = formula;

    this.columns.forEach(col => {
      const regex = new RegExp(`\\b${col.name}\\b`, 'g');
      const rawValue = row[col.name];
      const value = rawValue !== undefined && rawValue !== '' && rawValue !== null
        ? parseFloat(rawValue)
        : 0;

      if (isNaN(value)) {
        console.warn(`DynamicTable[${this.tableId}]: valor da coluna "${col.name}" não é número válido, usando 0`);
      }

      expression = expression.replace(regex, isNaN(value) ? 0 : value);
    });

    // Avaliar expressão (eval seguro - fórmulas controladas, não user input direto)
    // Alternativa futura: usar biblioteca como math.js ou expr-eval
    try {
      const result = eval(expression);
      return isNaN(result) ? 0 : result;
    } catch (error) {
      console.error(`DynamicTable[${this.tableId}]: erro ao avaliar fórmula "${formula}":`, error);
      return 0;
    }
  }

  // ========================================
  // TOTALIZADORES
  // ========================================

  /**
   * Atualiza totalizadores
   */
  updateTotals() {
    if (!this.options.showTotal) return;

    this.columns.forEach(col => {
      if (col.includeInTotal) {
        const totalCell = document.getElementById(`${this.tableId}-total-${col.name}`);
        if (!totalCell) return;

        const values = this.getColumnValues(col.name);
        const total = this.calculateTotal(values, col);

        totalCell.textContent = this.formatValue(total, col);
      }
    });
  }

  /**
   * Retorna valores de uma coluna
   * @param {string} columnName
   * @returns {Array<number>}
   */
  getColumnValues(columnName) {
    const values = [];
    const inputs = this.tbody.querySelectorAll(`[data-column="${columnName}"]`);

    inputs.forEach(input => {
      const value = this.parseValue(input.value, input.dataset.type);
      if (value !== null && value !== '' && !isNaN(value)) {
        values.push(parseFloat(value));
      }
    });

    return values;
  }

  /**
   * Calcula total baseado no totalType
   * @param {Array<number>} values
   * @param {Object} column
   * @returns {number}
   */
  calculateTotal(values, column) {
    if (values.length === 0) return 0;

    const totalType = column.totalType || this.options.totalType || 'sum';

    switch (totalType) {
      case 'sum':
        return values.reduce((acc, val) => acc + val, 0);
      case 'average':
        return values.reduce((acc, val) => acc + val, 0) / values.length;
      case 'count':
        return values.length;
      default:
        return values.reduce((acc, val) => acc + val, 0);
    }
  }

  /**
   * Retorna totalizadores
   * @returns {Object}
   */
  getTotals() {
    const totals = {};

    this.columns.forEach(col => {
      if (col.includeInTotal) {
        const values = this.getColumnValues(col.name);
        totals[col.name] = this.calculateTotal(values, col);
      }
    });

    return totals;
  }

  // ========================================
  // VALIDAÇÃO
  // ========================================

  /**
   * Valida toda a tabela
   * @returns {Object} { valid: boolean, errors: Array, warnings: Array }
   */
  validate() {
    const errors = [];
    const warnings = [];

    this.rows.forEach((row, rowIndex) => {
      this.columns.forEach(col => {
        const value = row[col.name];

        // ERROR: campo obrigatório vazio
        if (col.required && (!value || value === '')) {
          errors.push({
            rowIndex,
            rowId: row.id,
            columnName: col.name,
            columnLabel: col.label,
            message: `${col.label} é obrigatório`
          });
        }

        // WARNING: formato sugerido diferente (NÃO bloqueia)
        if (value && value !== '') {
          const warning = this.checkFormatWarning(col, value);
          if (warning) {
            warnings.push({
              rowIndex,
              rowId: row.id,
              columnName: col.name,
              columnLabel: col.label,
              message: warning
            });
          }
        }

        // Validação customizada
        if (value && this.validations[col.name]) {
          const result = this.validations[col.name](value);
          if (result && typeof result.valid === 'boolean' && !result.valid) {
            errors.push({
              rowIndex,
              rowId: row.id,
              columnName: col.name,
              columnLabel: col.label,
              message: result.error || 'Validação customizada falhou'
            });
          }
        }
      });
    });

    const valid = errors.length === 0;

    if (!valid) {
      this.dispatchEvent('onError', { errors, warnings });
    }

    this.dispatchEvent('onValidate', { valid, errors, warnings });

    return { valid, errors, warnings };
  }

  /**
   * Verifica formato (AVISO apenas, não bloqueia)
   * @param {Object} column
   * @param {*} value
   * @returns {string|null}
   */
  checkFormatWarning(column, value) {
    switch (column.type) {
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          return 'Formato de e-mail sugerido: email@exemplo.com';
        }
        break;

      case 'cpf':
        if (value.replace(/\D/g, '').length !== 11) {
          return 'CPF deve conter 11 dígitos';
        }
        break;

      case 'cnpj':
        if (value.replace(/\D/g, '').length !== 14) {
          return 'CNPJ deve conter 14 dígitos';
        }
        break;

      case 'phone':
        const phoneDigits = value.replace(/\D/g, '').length;
        if (phoneDigits < 10 || phoneDigits > 11) {
          return 'Telefone deve conter 10 ou 11 dígitos';
        }
        break;
    }

    return null;
  }

  /**
   * Mostra feedback visual de validação (classes CSS)
   * @param {Object} validationResult
   */
  showValidationFeedback(validationResult) {
    const css = DynamicTable.defaults.css;

    // Remove avisos anteriores
    this.tbody.querySelectorAll(`.${css.warning}, .${css.error}`).forEach(el => {
      el.classList.remove(css.warning, css.error);
    });

    // Aplica errors
    validationResult.errors.forEach(err => {
      const input = this.tbody.querySelector(
        `[data-row-id="${err.rowId}"][data-column="${err.columnName}"]`
      );
      if (input) {
        input.classList.add(css.error);
        input.title = err.message;
      }
    });

    // Aplica warnings
    validationResult.warnings.forEach(warn => {
      const input = this.tbody.querySelector(
        `[data-row-id="${warn.rowId}"][data-column="${warn.columnName}"]`
      );
      if (input) {
        input.classList.add(css.warning);
        input.title = warn.message;
      }
    });
  }

  // ========================================
  // PERSISTÊNCIA
  // ========================================

  /**
   * Agenda persistência com debounce
   */
  schedulePersist() {
    if (this.persistDebounce) {
      clearTimeout(this.persistDebounce);
    }

    this.persistDebounce = setTimeout(() => {
      this.persistData();
    }, 300); // 300ms debounce
  }

  /**
   * Persiste dados
   * @returns {Promise<void>}
   */
  async persistData() {
    const data = this.toJSON();

    try {
      if (this.persistence.type === 'indexeddb') {
        await this.persistToIndexedDB(data);
      } else if (this.persistence.type === 'localstorage') {
        this.persistToLocalStorage(data);
      } else if (this.persistence.type === 'custom' && this.persistence.manager) {
        await this.persistence.manager.save(this.tableId, data);
      } else {
        // Fallback: localStorage
        this.persistToLocalStorage(data);
      }

      console.log(`✓ DynamicTable[${this.tableId}]: Dados persistidos`);
    } catch (error) {
      console.error(`DynamicTable[${this.tableId}]: Erro ao persistir:`, error);
    }
  }

  /**
   * Persiste no IndexedDB
   * @param {Object} data
   * @returns {Promise<void>}
   */
  async persistToIndexedDB(data) {
    if (this.persistence.manager && typeof this.persistence.manager.save === 'function') {
      await this.persistence.manager.save(this.tableId, data);
    } else if (window.financiamento && window.financiamento.salvarDynamicTable) {
      // Compatibilidade com sistema existente
      await window.financiamento.salvarDynamicTable(this.tableId, data);
    } else {
      throw new Error('IndexedDB manager não configurado');
    }
  }

  /**
   * Persiste no LocalStorage
   * @param {Object} data
   */
  persistToLocalStorage(data) {
    const key = `dynamictable_${this.tableId}`;
    localStorage.setItem(key, JSON.stringify(data));
  }

  /**
   * Carrega dados da persistência
   * @returns {Promise<void>}
   */
  async loadFromPersistence() {
    try {
      let data = null;

      if (this.persistence.type === 'indexeddb') {
        data = await this.loadFromIndexedDB();
      } else if (this.persistence.type === 'localstorage') {
        data = this.loadFromLocalStorage();
      } else if (this.persistence.type === 'custom' && this.persistence.manager) {
        data = await this.persistence.manager.load(this.tableId);
      } else {
        // Fallback: localStorage
        data = this.loadFromLocalStorage();
      }

      if (data && data.rows && data.rows.length > 0) {
        this.fromJSON(data);
        console.log(`✓ DynamicTable[${this.tableId}]: ${data.rows.length} linhas carregadas`);
      } else {
        console.log(`ℹ️ DynamicTable[${this.tableId}]: Sem dados salvos (primeira execução)`);
      }
    } catch (error) {
      console.error(`DynamicTable[${this.tableId}]: Erro ao carregar dados:`, error);
    }
  }

  /**
   * Carrega do IndexedDB
   * @returns {Promise<Object|null>}
   */
  async loadFromIndexedDB() {
    if (this.persistence.manager && typeof this.persistence.manager.load === 'function') {
      return await this.persistence.manager.load(this.tableId);
    } else if (window.financiamento && window.financiamento.carregarDynamicTable) {
      // Compatibilidade com sistema existente
      return await window.financiamento.carregarDynamicTable(this.tableId);
    } else {
      console.warn('IndexedDB manager não configurado, usando localStorage');
      return null;
    }
  }

  /**
   * Carrega do LocalStorage
   * @returns {Object|null}
   */
  loadFromLocalStorage() {
    const key = `dynamictable_${this.tableId}`;
    const json = localStorage.getItem(key);
    return json ? JSON.parse(json) : null;
  }

  // ========================================
  // EXPORT / IMPORT JSON
  // ========================================

  /**
   * Exporta para JSON
   * @returns {Object}
   */
  toJSON() {
    return {
      tableId: this.tableId,
      rows: this.rows,
      totals: this.getTotals(),
      metadata: {
        rowCount: this.rows.length,
        timestamp: new Date().toISOString(),
        version: '2.0.0'
      }
    };
  }

  /**
   * Importa de JSON
   * @param {Object} data
   */
  fromJSON(data) {
    // Validar estrutura
    if (!data.rows || !Array.isArray(data.rows)) {
      throw new Error(`DynamicTable[${this.tableId}]: estrutura JSON inválida - "rows" ausente ou não é array`);
    }

    // Limpar linhas atuais
    this.clearTable();

    // Adicionar cada row
    data.rows.forEach(rowData => {
      this.addRow(rowData, true); // skipPersist = true
    });

    // Atualizar totalizadores
    if (this.options.showTotal) {
      this.updateTotals();
    }

    // Disparar evento
    this.dispatchEvent('onChange', { action: 'import', data });

    console.log(`✓ DynamicTable[${this.tableId}]: ${data.rows.length} linhas importadas`);
  }

  /**
   * Limpa tabela
   */
  clearTable() {
    this.tbody.innerHTML = '';
    this.rows = [];
    this.rowCount = 0;
  }

  // ========================================
  // EVENT SYSTEM
  // ========================================

  /**
   * Registra listener
   * @param {string} eventName - 'onChange' | 'onValidate' | 'onError' | 'onRowAdded' | 'onRowRemoved'
   * @param {Function} callback
   */
  on(eventName, callback) {
    if (!this.listeners[eventName]) {
      throw new Error(`DynamicTable[${this.tableId}]: Evento "${eventName}" não existe`);
    }

    if (typeof callback !== 'function') {
      throw new Error(`DynamicTable[${this.tableId}]: callback para "${eventName}" deve ser função`);
    }

    this.listeners[eventName].push(callback);
  }

  /**
   * Dispara evento
   * @param {string} eventName
   * @param {*} data
   */
  dispatchEvent(eventName, data) {
    if (this.listeners[eventName]) {
      this.listeners[eventName].forEach(callback => {
        callback(data);
      });
    }
  }

  // ========================================
  // UTILITÁRIOS
  // ========================================

  /**
   * Retorna dados
   * @returns {Array}
   */
  getData() {
    return this.rows;
  }

  /**
   * Gera UUID v4
   * @returns {string}
   */
  generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * Destrói o componente
   */
  destroy() {
    // Cancelar debounce pendente
    if (this.persistDebounce) {
      clearTimeout(this.persistDebounce);
    }
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }

    // Limpar listeners
    this.listeners = {
      onChange: [],
      onValidate: [],
      onError: [],
      onRowAdded: [],
      onRowRemoved: []
    };

    // Limpar arrays
    this.rows = [];

    // Limpar DOM
    if (this.container) {
      this.container.innerHTML = '';
    }

    console.log(`✓ DynamicTable[${this.tableId}] destruído`);
  }
}

// Exportar globalmente
if (typeof window !== 'undefined') {
  window.DynamicTable = DynamicTable;
}

// Exportar para Node.js (testes)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DynamicTable;
}
