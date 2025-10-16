/**
 * DynamicTable.js
 * Componente reutilizável para tabelas dinâmicas
 * Utilizado em 126 instâncias no sistema FCO
 *
 * @version 1.0.0
 * @date 2025-10-16
 */

class DynamicTable {
  /**
   * @param {Object} config - Configuração da tabela
   * @param {string} config.tableId - ID único da tabela
   * @param {string} config.sectionId - ID da seção
   * @param {Array} config.columns - Definição das colunas
   * @param {Object} config.validations - Validações customizadas (opcional)
   * @param {Array} config.totalizers - Colunas com totalizadores (opcional)
   * @param {number} config.minRows - Mínimo de linhas (default: 0)
   * @param {number} config.maxRows - Máximo de linhas (default: 999)
   * @param {boolean} config.allowDelete - Permitir deletar (default: true)
   * @param {boolean} config.horizontalScroll - Scroll horizontal (default: false)
   * @param {number} config.fixedColumns - Colunas fixas (default: 0)
   */
  constructor(config) {
    // Validar config obrigatório
    if (!config) {
      throw new Error('DynamicTable: configuração obrigatória ausente');
    }

    if (!config.tableId || typeof config.tableId !== 'string') {
      throw new Error('DynamicTable: tableId é obrigatório e deve ser string');
    }

    if (!config.sectionId || typeof config.sectionId !== 'string') {
      throw new Error('DynamicTable: sectionId é obrigatório e deve ser string');
    }

    if (!config.columns || !Array.isArray(config.columns) || config.columns.length === 0) {
      throw new Error('DynamicTable: columns é obrigatório e deve ser array não vazio');
    }

    // Propriedades principais
    this.tableId = config.tableId;
    this.sectionId = config.sectionId;
    this.columns = config.columns;
    this.validations = config.validations !== undefined ? config.validations : {};
    this.totalizers = config.totalizers !== undefined ? config.totalizers : [];
    this.minRows = config.minRows !== undefined ? config.minRows : 0;
    this.maxRows = config.maxRows !== undefined ? config.maxRows : 999;
    this.allowDelete = config.allowDelete !== false;
    this.horizontalScroll = config.horizontalScroll === true;
    this.fixedColumns = config.fixedColumns !== undefined ? config.fixedColumns : 0;

    // Estado interno
    this.rows = [];
    this.listeners = {
      onChange: [],
      onValidate: [],
      onError: [],
      onRowAdded: [],
      onRowRemoved: []
    };

    // Referências DOM
    this.container = null;
    this.tbody = null;

    // Debounce para persistência
    this.persistDebounce = null;

    console.log(`✓ DynamicTable[${this.tableId}] configurado com sucesso`);
  }

  /**
   * Inicializa a tabela no DOM
   * @returns {Promise<void>}
   */
  async init() {
    // Localizar container no DOM
    this.container = document.querySelector(`[data-table-id="${this.tableId}"]`);
    if (!this.container) {
      throw new Error(`DynamicTable[${this.tableId}]: Container com data-table-id="${this.tableId}" não encontrado no DOM`);
    }

    // Renderizar estrutura HTML
    this.renderStructure();

    // Carregar dados salvos do IndexedDB
    await this.loadFromIndexedDB();

    // Se não há linhas e minRows > 0, adicionar linhas vazias
    if (this.rows.length === 0 && this.minRows > 0) {
      for (let i = 0; i < this.minRows; i++) {
        this.addRow({}, true); // skipPersist = true (persistir no final)
      }
      // Persistir uma única vez
      if (this.minRows > 0) {
        await this.persistToIndexedDB();
      }
    }

    // Atualizar totalizadores iniciais
    this.updateTotalizers();

    console.log(`✓ DynamicTable[${this.tableId}] inicializado com ${this.rows.length} linhas`);
  }

  /**
   * Renderiza estrutura HTML completa da tabela
   */
  renderStructure() {
    const html = `
      <!-- Header -->
      <div class="table-header">
        <table>
          <thead>
            <tr>
              <th class="row-selector-header" style="width: 40px;">
                <input type="checkbox" id="${this.tableId}_selectAll" title="Selecionar todas">
              </th>
              ${this.columns.map((col, index) => `
                <th data-column-id="${col.id}"
                    style="width: ${col.width !== undefined ? col.width : 'auto'}; ${this.isFixedColumn(index) ? this.getFixedColumnStyle(index) : ''}">
                  ${col.label}
                  ${col.required === true ? '<span class="required">*</span>' : ''}
                </th>
              `).join('')}
              <th class="row-actions-header" style="width: 100px;">Ações</th>
            </tr>
          </thead>
        </table>
      </div>

      <!-- Body (scrollable) -->
      <div class="table-body ${this.horizontalScroll ? 'horizontal-scroll' : ''}">
        <table>
          <tbody id="${this.tableId}_tbody">
            <!-- Linhas renderizadas dinamicamente -->
          </tbody>
        </table>
      </div>

      <!-- Footer (Totalizadores) -->
      ${this.totalizers.length > 0 ? `
        <div class="table-footer">
          <table>
            <tfoot>
              <tr class="totalizer-row">
                <td class="row-selector-footer" style="width: 40px;"></td>
                ${this.columns.map((col, index) => `
                  <td data-totalizer="${col.id}" style="width: ${col.width !== undefined ? col.width : 'auto'}; ${this.isFixedColumn(index) ? this.getFixedColumnStyle(index) : ''}">
                    ${this.totalizers.includes(col.id) ? `<span id="${this.tableId}_total_${col.id}">0</span>` : ''}
                  </td>
                `).join('')}
                <td class="row-actions-footer" style="width: 100px;"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      ` : ''}
    `;

    this.container.innerHTML = html;
    this.tbody = document.getElementById(`${this.tableId}_tbody`);

    if (!this.tbody) {
      throw new Error(`DynamicTable[${this.tableId}]: tbody não encontrado após renderStructure`);
    }

    // Anexar event listeners
    this.attachEventListeners();
  }

  /**
   * Verifica se coluna é fixa
   * @param {number} columnIndex
   * @returns {boolean}
   */
  isFixedColumn(columnIndex) {
    return this.columns[columnIndex].fixed === true && columnIndex < this.fixedColumns;
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

    // Delegated events no tbody (otimização de performance)
    this.tbody.addEventListener('input', (e) => {
      if (e.target.classList.contains('table-input')) {
        this.handleInputChange(e);
      }
    });

    this.tbody.addEventListener('blur', (e) => {
      if (e.target.classList.contains('table-input')) {
        this.handleInputBlur(e);
      }
    }, true); // useCapture = true

    this.tbody.addEventListener('click', (e) => {
      // Botão deletar
      if (e.target.closest('.btn-delete-row')) {
        const rowId = e.target.closest('.btn-delete-row').dataset.rowId;
        this.removeRow(rowId);
      }

      // Botão clonar
      if (e.target.closest('.btn-clone-row')) {
        const rowId = e.target.closest('.btn-clone-row').dataset.rowId;
        this.cloneRow(rowId);
      }
    });
  }

  /**
   * Adiciona nova linha
   * @param {Object} data - Dados iniciais (opcional)
   * @param {boolean} skipPersist - Pular persistência (default: false)
   * @returns {string|null} rowId
   */
  addRow(data = {}, skipPersist = false) {
    // Verificar maxRows
    if (this.rows.length >= this.maxRows) {
      throw new Error(`DynamicTable[${this.tableId}]: Limite máximo de ${this.maxRows} linhas atingido`);
    }

    // Gerar UUID único
    const rowId = this.generateUUID();

    // Criar objeto row
    const row = {
      id: rowId,
      ...data
    };

    // Adicionar ao array
    this.rows.push(row);

    // Renderizar no DOM
    this.renderRow(row);

    // Atualizar totalizadores
    this.updateTotalizers();

    // Persistir (com debounce)
    if (!skipPersist) {
      this.persistToIndexedDB();
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

    // Checkbox de seleção
    let html = `
      <td class="row-selector" style="width: 40px;">
        <input type="checkbox" class="row-checkbox" data-row-id="${row.id}">
      </td>
    `;

    // Colunas de dados
    this.columns.forEach((col, index) => {
      const value = row[col.id] !== undefined ? row[col.id] : '';
      const fieldId = `${this.tableId}_${row.id}_${col.id}`;

      let inputHtml = '';

      // Coluna calculada (readonly)
      if (col.calculated === true) {
        inputHtml = `
          <input type="text"
                 id="${fieldId}"
                 name="${fieldId}"
                 class="table-input calculated-field"
                 value="${value}"
                 readonly
                 data-row-id="${row.id}"
                 data-column-id="${col.id}"
                 data-calculated="true"
                 data-formula="${col.formula !== undefined ? col.formula : ''}">
        `;
      }
      // Coluna editável
      else {
        switch (col.type) {
          case 'text':
            inputHtml = `
              <input type="text"
                     id="${fieldId}"
                     name="${fieldId}"
                     class="table-input"
                     value="${value}"
                     ${col.required === true ? 'required' : ''}
                     data-row-id="${row.id}"
                     data-column-id="${col.id}">
            `;
            break;

          case 'textarea':
            inputHtml = `
              <textarea id="${fieldId}"
                        name="${fieldId}"
                        class="table-input"
                        rows="2"
                        ${col.required === true ? 'required' : ''}
                        data-row-id="${row.id}"
                        data-column-id="${col.id}">${value}</textarea>
            `;
            break;

          case 'number':
            inputHtml = `
              <input type="number"
                     id="${fieldId}"
                     name="${fieldId}"
                     class="table-input"
                     value="${value}"
                     ${col.required === true ? 'required' : ''}
                     ${col.min !== undefined ? `min="${col.min}"` : ''}
                     ${col.max !== undefined ? `max="${col.max}"` : ''}
                     ${col.step !== undefined ? `step="${col.step}"` : ''}
                     data-row-id="${row.id}"
                     data-column-id="${col.id}">
            `;
            break;

          case 'currency':
            inputHtml = `
              <input type="text"
                     id="${fieldId}"
                     name="${fieldId}"
                     class="table-input currency-input"
                     value="${value}"
                     ${col.required === true ? 'required' : ''}
                     data-row-id="${row.id}"
                     data-column-id="${col.id}"
                     data-type="currency">
            `;
            break;

          case 'percentage':
            inputHtml = `
              <input type="text"
                     id="${fieldId}"
                     name="${fieldId}"
                     class="table-input percentage-input"
                     value="${value}"
                     ${col.required === true ? 'required' : ''}
                     data-row-id="${row.id}"
                     data-column-id="${col.id}"
                     data-type="percentage">
            `;
            break;

          case 'select':
            if (!col.options || !Array.isArray(col.options)) {
              throw new Error(`DynamicTable[${this.tableId}]: coluna type='select' requer 'options' array`);
            }
            inputHtml = `
              <select id="${fieldId}"
                      name="${fieldId}"
                      class="table-input"
                      ${col.required === true ? 'required' : ''}
                      data-row-id="${row.id}"
                      data-column-id="${col.id}">
                <option value="">Selecione...</option>
                ${col.options.map(opt => `
                  <option value="${opt}" ${value === opt ? 'selected' : ''}>${opt}</option>
                `).join('')}
              </select>
            `;
            break;

          case 'date':
            inputHtml = `
              <input type="date"
                     id="${fieldId}"
                     name="${fieldId}"
                     class="table-input"
                     value="${value}"
                     ${col.required === true ? 'required' : ''}
                     data-row-id="${row.id}"
                     data-column-id="${col.id}">
            `;
            break;

          default:
            inputHtml = `
              <input type="text"
                     id="${fieldId}"
                     name="${fieldId}"
                     class="table-input"
                     value="${value}"
                     data-row-id="${row.id}"
                     data-column-id="${col.id}">
            `;
        }
      }

      html += `
        <td data-column-id="${col.id}"
            style="width: ${col.width !== undefined ? col.width : 'auto'}; ${this.isFixedColumn(index) ? this.getFixedColumnStyle(index) : ''}">
          ${inputHtml}
        </td>
      `;
    });

    // Ações
    html += `
      <td class="row-actions" style="width: 100px;">
        ${this.allowDelete ? `
          <button type="button"
                  class="btn-icon btn-delete-row"
                  data-row-id="${row.id}"
                  title="Deletar linha">
            <i class="fas fa-trash"></i>
          </button>
        ` : ''}
        <button type="button"
                class="btn-icon btn-clone-row"
                data-row-id="${row.id}"
                title="Duplicar linha">
          <i class="fas fa-clone"></i>
        </button>
      </td>
    `;

    tr.innerHTML = html;
    this.tbody.appendChild(tr);

    // Aplicar máscaras (currency, percentage, etc)
    this.applyMasks(tr);
  }

  /**
   * Remove linha
   * @param {string} rowId
   */
  removeRow(rowId) {
    // Verificar minRows
    if (this.rows.length <= this.minRows) {
      throw new Error(`DynamicTable[${this.tableId}]: Mínimo de ${this.minRows} linha(s) obrigatório`);
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
    if (!tr) {
      throw new Error(`DynamicTable[${this.tableId}]: TR com rowId="${rowId}" não encontrado no DOM`);
    }
    tr.remove();

    // Atualizar totalizadores
    this.updateTotalizers();

    // Persistir
    this.persistToIndexedDB();

    // Disparar eventos
    this.dispatchEvent('onRowRemoved', { rowId });
    this.dispatchEvent('onChange', { action: 'remove', rowId });
  }

  /**
   * Clona uma linha
   * @param {string} rowId
   */
  cloneRow(rowId) {
    const row = this.rows.find(r => r.id === rowId);
    if (!row) {
      throw new Error(`DynamicTable[${this.tableId}]: linha com rowId="${rowId}" não encontrada para clonar`);
    }

    // Copiar dados (sem o ID)
    const clonedData = { ...row };
    delete clonedData.id;

    // Adicionar nova linha com dados clonados
    this.addRow(clonedData);
  }

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

  /**
   * Handle input change
   * @param {Event} e
   */
  handleInputChange(e) {
    const input = e.target;
    const rowId = input.dataset.rowId;
    const columnId = input.dataset.columnId;
    const value = input.value;

    // Atualizar no array rows
    const row = this.rows.find(r => r.id === rowId);
    if (!row) {
      throw new Error(`DynamicTable[${this.tableId}]: linha com rowId="${rowId}" não encontrada em handleInputChange`);
    }
    row[columnId] = value;

    // Recalcular campos calculados desta linha
    this.recalculateRow(rowId);

    // Atualizar totalizadores
    this.updateTotalizers();

    // Persistir (com debounce)
    this.persistToIndexedDB();

    // Disparar evento
    this.dispatchEvent('onChange', { action: 'update', rowId, columnId, value });
  }

  /**
   * Handle input blur (validação)
   * @param {Event} e
   */
  handleInputBlur(e) {
    const input = e.target;
    const columnId = input.dataset.columnId;
    const value = input.value;

    // Validação do campo
    const column = this.columns.find(c => c.id === columnId);
    if (!column) {
      throw new Error(`DynamicTable[${this.tableId}]: coluna com id="${columnId}" não encontrada`);
    }

    let isValid = true;
    let errorMessage = '';

    // Validação required
    if (column.required === true && (!value || value.trim() === '')) {
      isValid = false;
      errorMessage = 'Campo obrigatório';
    }

    // Validação customizada
    if (isValid && this.validations[columnId]) {
      const result = this.validations[columnId](value);
      if (!result || typeof result.valid !== 'boolean') {
        throw new Error(`DynamicTable[${this.tableId}]: validação customizada para "${columnId}" deve retornar { valid: boolean, error?: string }`);
      }
      isValid = result.valid;
      errorMessage = result.error !== undefined ? result.error : '';
    }

    // Aplicar/remover classe de erro
    if (!isValid) {
      input.classList.add('error');
      input.title = errorMessage;
    } else {
      input.classList.remove('error');
      input.title = '';
    }

    // Disparar evento de validação
    this.dispatchEvent('onValidate', {
      rowId: input.dataset.rowId,
      columnId,
      value,
      isValid,
      errorMessage
    });
  }

  /**
   * Recalcula campos calculados de uma linha
   * @param {string} rowId
   */
  recalculateRow(rowId) {
    const row = this.rows.find(r => r.id === rowId);
    if (!row) {
      throw new Error(`DynamicTable[${this.tableId}]: linha com rowId="${rowId}" não encontrada em recalculateRow`);
    }

    this.columns.forEach(col => {
      if (col.calculated === true && col.formula) {
        const value = this.evaluateFormula(col.formula, row);
        row[col.id] = value;

        // Atualizar campo no DOM
        const input = document.getElementById(`${this.tableId}_${rowId}_${col.id}`);
        if (input) {
          if (col.type === 'currency') {
            input.value = this.formatCurrency(value);
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
      const regex = new RegExp(`\\b${col.id}\\b`, 'g');
      const rawValue = row[col.id];
      const value = rawValue !== undefined && rawValue !== '' ? parseFloat(rawValue) : 0;

      if (isNaN(value)) {
        throw new Error(`DynamicTable[${this.tableId}]: valor da coluna "${col.id}" não é um número válido para fórmula`);
      }

      expression = expression.replace(regex, value);
    });

    // Avaliar expressão (seguro para fórmulas controladas)
    // Nota: eval() é usado aqui com dados controlados (não user input direto)
    // Alternativa futura: implementar parser de expressões seguro
    const result = eval(expression);

    if (isNaN(result)) {
      throw new Error(`DynamicTable[${this.tableId}]: resultado da fórmula "${formula}" não é um número válido`);
    }

    return result;
  }

  /**
   * Atualiza totalizadores
   */
  updateTotalizers() {
    this.totalizers.forEach(columnId => {
      const column = this.columns.find(c => c.id === columnId);
      if (!column) {
        throw new Error(`DynamicTable[${this.tableId}]: coluna totalizadora "${columnId}" não encontrada`);
      }

      let total = 0;

      if (column.type === 'currency' || column.type === 'number') {
        total = this.rows.reduce((sum, row) => {
          const rawValue = row[columnId];
          const value = rawValue !== undefined && rawValue !== '' ? parseFloat(rawValue) : 0;
          return sum + value;
        }, 0);
      }

      // Atualizar no DOM
      const totalizerElement = document.getElementById(`${this.tableId}_total_${columnId}`);
      if (totalizerElement) {
        totalizerElement.textContent = column.type === 'currency'
          ? this.formatCurrency(total)
          : total.toFixed(2);
      }
    });
  }

  /**
   * Retorna totalizadores
   * @returns {Object}
   */
  getTotalizers() {
    const totals = {};

    this.totalizers.forEach(columnId => {
      const column = this.columns.find(c => c.id === columnId);
      if (!column) {
        throw new Error(`DynamicTable[${this.tableId}]: coluna totalizadora "${columnId}" não encontrada`);
      }

      if (column.type === 'currency' || column.type === 'number') {
        totals[columnId] = this.rows.reduce((sum, row) => {
          const rawValue = row[columnId];
          const value = rawValue !== undefined && rawValue !== '' ? parseFloat(rawValue) : 0;
          return sum + value;
        }, 0);
      }
    });

    return totals;
  }

  /**
   * Valida toda a tabela
   * @returns {Object} { valid: boolean, errors: Array }
   */
  validate() {
    const errors = [];

    this.rows.forEach((row, rowIndex) => {
      this.columns.forEach(col => {
        const value = row[col.id];

        // Required
        if (col.required === true && (!value || value === '')) {
          errors.push({
            rowIndex,
            rowId: row.id,
            columnId: col.id,
            error: `${col.label} é obrigatório`
          });
        }

        // Custom validation
        if (value && this.validations[col.id]) {
          const result = this.validations[col.id](value);
          if (!result || typeof result.valid !== 'boolean') {
            throw new Error(`DynamicTable[${this.tableId}]: validação customizada para "${col.id}" deve retornar { valid: boolean, error?: string }`);
          }
          if (!result.valid) {
            errors.push({
              rowIndex,
              rowId: row.id,
              columnId: col.id,
              error: result.error !== undefined ? result.error : 'Validação falhou'
            });
          }
        }
      });
    });

    const valid = errors.length === 0;

    if (!valid) {
      this.dispatchEvent('onError', { errors });
    }

    this.dispatchEvent('onValidate', { valid, errors });

    return { valid, errors };
  }

  /**
   * Exporta para JSON
   * @returns {Object}
   */
  toJSON() {
    return {
      tableId: this.tableId,
      sectionId: this.sectionId,
      rows: this.rows,
      totalizadores: this.getTotalizers(),
      metadata: {
        rowCount: this.rows.length,
        timestamp: new Date().toISOString(),
        version: '1.0.0'
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
    this.rows = [];
    this.tbody.innerHTML = '';

    // Adicionar cada row
    data.rows.forEach(rowData => {
      this.addRow(rowData, true); // skipPersist = true (persistir apenas no final)
    });

    // Persistir uma única vez
    this.persistToIndexedDB();

    // Disparar evento
    this.dispatchEvent('onChange', { action: 'import', data });

    console.log(`✓ DynamicTable[${this.tableId}]: ${data.rows.length} linhas importadas`);
  }

  /**
   * Persiste no IndexedDB (com debounce)
   */
  async persistToIndexedDB() {
    // Verificar se FinanciamentoModule está disponível
    if (!window.financiamento) {
      throw new Error(`DynamicTable[${this.tableId}]: window.financiamento não disponível - obrigatório para persistência`);
    }

    if (!window.financiamento.db) {
      throw new Error(`DynamicTable[${this.tableId}]: window.financiamento.db não disponível - IndexedDB não inicializado`);
    }

    if (typeof window.financiamento.salvarDynamicTable !== 'function') {
      throw new Error(`DynamicTable[${this.tableId}]: window.financiamento.salvarDynamicTable() não está disponível`);
    }

    // Debounce: aguardar 300ms após última alteração
    if (this.persistDebounce) {
      clearTimeout(this.persistDebounce);
    }

    this.persistDebounce = setTimeout(async () => {
      await window.financiamento.salvarDynamicTable(this.tableId, this.toJSON());
      console.log(`✓ DynamicTable[${this.tableId}]: Dados persistidos`);
    }, 300);
  }

  /**
   * Carrega do IndexedDB
   */
  async loadFromIndexedDB() {
    // Verificar se FinanciamentoModule está disponível
    if (!window.financiamento) {
      throw new Error(`DynamicTable[${this.tableId}]: window.financiamento não disponível - obrigatório para carregar dados`);
    }

    if (!window.financiamento.db) {
      throw new Error(`DynamicTable[${this.tableId}]: window.financiamento.db não disponível - IndexedDB não inicializado`);
    }

    if (typeof window.financiamento.carregarDynamicTable !== 'function') {
      throw new Error(`DynamicTable[${this.tableId}]: window.financiamento.carregarDynamicTable() não está disponível`);
    }

    const data = await window.financiamento.carregarDynamicTable(this.tableId);

    if (data && data.rows && data.rows.length > 0) {
      this.fromJSON(data);
      console.log(`✓ DynamicTable[${this.tableId}]: Dados carregados do IndexedDB (${data.rows.length} linhas)`);
    } else {
      console.log(`ℹ️ DynamicTable[${this.tableId}]: Sem dados salvos no IndexedDB (primeira execução)`);
    }
  }

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
      throw new Error(`DynamicTable[${this.tableId}]: callback para "${eventName}" deve ser uma função`);
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

  /**
   * Aplica máscaras nos inputs
   * @param {HTMLElement} container
   */
  applyMasks(container) {
    // Currency mask - aplicar formatação brasileira
    const currencyInputs = container.querySelectorAll('.currency-input');
    currencyInputs.forEach(input => {
      input.addEventListener('blur', (e) => {
        const rawValue = e.target.value.replace(/[^\d,.-]/g, '').replace(',', '.');
        const value = rawValue !== '' ? parseFloat(rawValue) : 0;
        e.target.value = this.formatCurrency(value);
      });

      input.addEventListener('focus', (e) => {
        // Remover formatação ao focar
        const rawValue = e.target.value.replace(/[^\d,.-]/g, '').replace(',', '.');
        const value = rawValue !== '' ? parseFloat(rawValue) : 0;
        e.target.value = value.toString().replace('.', ',');
      });
    });

    // Percentage mask
    const percentageInputs = container.querySelectorAll('.percentage-input');
    percentageInputs.forEach(input => {
      input.addEventListener('blur', (e) => {
        const rawValue = e.target.value.replace(/[^\d,.-]/g, '').replace(',', '.');
        const value = rawValue !== '' ? parseFloat(rawValue) : 0;
        e.target.value = value.toFixed(2).replace('.', ',') + '%';
      });

      input.addEventListener('focus', (e) => {
        // Remover % ao focar
        const rawValue = e.target.value.replace(/[^\d,.-]/g, '').replace(',', '.');
        const value = rawValue !== '' ? parseFloat(rawValue) : 0;
        e.target.value = value.toString().replace('.', ',');
      });
    });
  }

  /**
   * Formata valor como moeda brasileira
   * @param {number} value
   * @returns {string}
   */
  formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
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
   * Limpa recursos
   */
  destroy() {
    // Cancelar debounce pendente
    if (this.persistDebounce) {
      clearTimeout(this.persistDebounce);
    }

    // Limpar event listeners (delegated events serão removidos com o DOM)
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

// Exportar para Node.js (se necessário para testes)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DynamicTable;
}
