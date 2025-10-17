# Módulos JavaScript - Sistema FCO

**Data:** 2025-10-16
**Versão:** 1.0
**Status:** Documentação Pré-Implementação

---

## 📋 Sumário Executivo

Este documento especifica **11 módulos JavaScript** do Sistema FCO:

- **1 módulo base:** `DynamicTable` (componente crítico reutilizável)
- **10 módulos especializados:** Gestão de seções com tabelas dinâmicas

**Princípios:**
- **SOLID:** Cada módulo tem uma responsabilidade única
- **DRY:** DynamicTable reutilizado em 126 instâncias
- **Event-Driven:** Comunicação via Event Bus
- **NO FALLBACKS:** Erros explícitos quando dependências faltam

---

## 📦 Módulo Base: DynamicTable

### Localização
```
/src/assets/js/components/dynamic-table.js
```

### Responsabilidades
- Renderizar tabelas dinâmicas (add/remove rows)
- Validação de campos por tipo
- Cálculo de totalizadores automáticos
- Persistência em IndexedDB
- Import/Export JSON
- Event system (onChange, onValidate, onError)

### Classe Completa

```javascript
/**
 * DynamicTable.js
 * Componente reutilizável para tabelas dinâmicas
 * Utilizado em 126 instâncias no sistema FCO
 */

class DynamicTable {
  /**
   * @param {Object} config - Configuração da tabela
   * @param {string} config.tableId - ID único
   * @param {string} config.sectionId - ID da seção
   * @param {Array} config.columns - Definição das colunas
   * @param {Object} config.validations - Validações customizadas
   * @param {Array} config.totalizers - Colunas com totalizadores
   * @param {number} config.minRows - Mínimo de linhas (default: 0)
   * @param {number} config.maxRows - Máximo de linhas (default: 999)
   * @param {boolean} config.allowDelete - Permitir deletar (default: true)
   * @param {boolean} config.horizontalScroll - Scroll horizontal (default: false)
   * @param {number} config.fixedColumns - Colunas fixas (default: 0)
   */
  constructor(config) {
    // Validar config
    if (!config.tableId || !config.sectionId || !config.columns) {
      throw new Error('DynamicTable: tableId, sectionId e columns são obrigatórios');
    }

    this.tableId = config.tableId;
    this.sectionId = config.sectionId;
    this.columns = config.columns;
    this.validations = config.validations || {};
    this.totalizers = config.totalizers || [];
    this.minRows = config.minRows || 0;
    this.maxRows = config.maxRows || 999;
    this.allowDelete = config.allowDelete !== false;
    this.horizontalScroll = config.horizontalScroll || false;
    this.fixedColumns = config.fixedColumns || 0;

    this.rows = [];
    this.listeners = {
      onChange: [],
      onValidate: [],
      onError: [],
      onRowAdded: [],
      onRowRemoved: []
    };

    this.container = null;
    this.tbody = null;

    console.log(`✓ DynamicTable[${this.tableId}] configurado`);
  }

  /**
   * Inicializa a tabela no DOM
   */
  async init() {
    try {
      // Localizar container
      this.container = document.querySelector(`[data-table-id="${this.tableId}"]`);
      if (!this.container) {
        throw new Error(`DynamicTable[${this.tableId}]: Container não encontrado no DOM`);
      }

      // Renderizar estrutura
      this.renderStructure();

      // Carregar dados salvos do IndexedDB
      await this.loadFromIndexedDB();

      // Se não há linhas e minRows > 0, adicionar linhas vazias
      if (this.rows.length === 0 && this.minRows > 0) {
        for (let i = 0; i < this.minRows; i++) {
          this.addRow({}, false); // skipPersist = false
        }
      }

      // Atualizar totalizadores iniciais
      this.updateTotalizers();

      console.log(`✓ DynamicTable[${this.tableId}] inicializado com ${this.rows.length} linhas`);

    } catch (error) {
      console.error(`✗ Erro ao inicializar DynamicTable[${this.tableId}]:`, error);
      throw error;
    }
  }

  /**
   * Renderiza estrutura HTML da tabela
   */
  renderStructure() {
    const html = `
      <!-- Header -->
      <div class="table-header">
        <table>
          <thead>
            <tr>
              <th class="row-selector-header">
                <input type="checkbox" id="${this.tableId}_selectAll" title="Selecionar todas">
              </th>
              ${this.columns.map((col, index) => `
                <th data-column-id="${col.id}"
                    style="width: ${col.width || 'auto'}; ${col.fixed && index < this.fixedColumns ? 'position: sticky; left: ' + (index * 150) + 'px; z-index: 5;' : ''}">
                  ${col.label}
                  ${col.required ? '<span class="required">*</span>' : ''}
                </th>
              `).join('')}
              <th class="row-actions-header">Ações</th>
            </tr>
          </thead>
        </table>
      </div>

      <!-- Body -->
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
                <td class="row-selector-footer"></td>
                ${this.columns.map((col) => `
                  <td data-totalizer="${col.id}">
                    ${this.totalizers.includes(col.id) ? '<span id="${this.tableId}_total_${col.id}">0</span>' : ''}
                  </td>
                `).join('')}
                <td class="row-actions-footer"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      ` : ''}
    `;

    this.container.innerHTML = html;
    this.tbody = document.getElementById(`${this.tableId}_tbody`);

    // Event listeners
    this.attachEventListeners();
  }

  /**
   * Adiciona event listeners
   */
  attachEventListeners() {
    // Select All
    const selectAllCheckbox = document.getElementById(`${this.tableId}_selectAll`);
    if (selectAllCheckbox) {
      selectAllCheckbox.addEventListener('change', (e) => {
        this.selectAll(e.target.checked);
      });
    }

    // Delegated events no tbody (otimização)
    this.tbody.addEventListener('input', (e) => {
      if (e.target.classList.contains('table-input')) {
        this.handleInputChange(e);
      }
    });

    this.tbody.addEventListener('blur', (e) => {
      if (e.target.classList.contains('table-input')) {
        this.handleInputBlur(e);
      }
    }, true);

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
   * @returns {string} rowId
   */
  addRow(data = {}, skipPersist = false) {
    // Verificar maxRows
    if (this.rows.length >= this.maxRows) {
      alert(`Limite máximo de ${this.maxRows} linhas atingido.`);
      return null;
    }

    // Gerar UUID
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

    // Persistir
    if (!skipPersist) {
      this.persistToIndexedDB();
    }

    // Disparar evento
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
      <td class="row-selector">
        <input type="checkbox" class="row-checkbox" data-row-id="${row.id}">
      </td>
    `;

    // Colunas de dados
    this.columns.forEach((col, index) => {
      const value = row[col.id] || '';
      const fieldId = `${this.tableId}_${row.id}_${col.id}`;

      let inputHtml = '';

      // Coluna calculada (readonly)
      if (col.calculated) {
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
                 data-formula="${col.formula || ''}">
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
                     ${col.required ? 'required' : ''}
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
                        ${col.required ? 'required' : ''}
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
                     ${col.required ? 'required' : ''}
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
                     ${col.required ? 'required' : ''}
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
                     ${col.required ? 'required' : ''}
                     data-row-id="${row.id}"
                     data-column-id="${col.id}"
                     data-type="percentage">
            `;
            break;

          case 'select':
            inputHtml = `
              <select id="${fieldId}"
                      name="${fieldId}"
                      class="table-input"
                      ${col.required ? 'required' : ''}
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
                     ${col.required ? 'required' : ''}
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
            ${col.fixed && index < this.fixedColumns ? `style="position: sticky; left: ${index * 150}px; z-index: 2;"` : ''}>
          ${inputHtml}
        </td>
      `;
    });

    // Ações
    html += `
      <td class="row-actions">
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
      alert(`Mínimo de ${this.minRows} linha(s) obrigatório.`);
      return;
    }

    // Confirmar
    if (!confirm('Deseja realmente deletar esta linha?')) {
      return;
    }

    // Remover do array
    const index = this.rows.findIndex(r => r.id === rowId);
    if (index !== -1) {
      this.rows.splice(index, 1);
    }

    // Remover do DOM
    const tr = this.tbody.querySelector(`tr[data-row-id="${rowId}"]`);
    if (tr) {
      tr.remove();
    }

    // Atualizar totalizadores
    this.updateTotalizers();

    // Persistir
    this.persistToIndexedDB();

    // Disparar evento
    this.dispatchEvent('onRowRemoved', { rowId });
    this.dispatchEvent('onChange', { action: 'remove', rowId });
  }

  /**
   * Clona uma linha
   * @param {string} rowId
   */
  cloneRow(rowId) {
    const row = this.rows.find(r => r.id === rowId);
    if (!row) return;

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
    if (row) {
      row[columnId] = value;
    }

    // Recalcular campos calculados desta linha
    this.recalculateRow(rowId);

    // Atualizar totalizadores
    this.updateTotalizers();

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
    if (!column) return;

    let isValid = true;
    let errorMessage = '';

    // Validação required
    if (column.required && (!value || value.trim() === '')) {
      isValid = false;
      errorMessage = 'Campo obrigatório';
    }

    // Validação customizada
    if (isValid && this.validations[columnId]) {
      const result = this.validations[columnId](value);
      isValid = result.valid;
      errorMessage = result.error || '';
    }

    // Aplicar/remover classe de erro
    if (!isValid) {
      input.classList.add('error');
      input.title = errorMessage;
    } else {
      input.classList.remove('error');
      input.title = '';
    }
  }

  /**
   * Recalcula campos calculados de uma linha
   * @param {string} rowId
   */
  recalculateRow(rowId) {
    const row = this.rows.find(r => r.id === rowId);
    if (!row) return;

    this.columns.forEach(col => {
      if (col.calculated && col.formula) {
        const value = this.evaluateFormula(col.formula, row);
        row[col.id] = value;

        // Atualizar campo no DOM
        const input = document.getElementById(`${this.tableId}_${rowId}_${col.id}`);
        if (input) {
          input.value = col.type === 'currency' ? this.formatCurrency(value) : value;
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
    try {
      // Substituir nomes de colunas por valores
      let expression = formula;

      this.columns.forEach(col => {
        const regex = new RegExp(`\\b${col.id}\\b`, 'g');
        const value = parseFloat(row[col.id]) || 0;
        expression = expression.replace(regex, value);
      });

      // Avaliar expressão (seguro para fórmulas simples)
      // Nota: eval() é perigoso - usar apenas com fórmulas controladas
      // Alternativa: implementar parser de expressões
      const result = eval(expression);
      return isNaN(result) ? 0 : result;

    } catch (error) {
      console.error(`Erro ao avaliar fórmula "${formula}":`, error);
      return 0;
    }
  }

  /**
   * Atualiza totalizadores
   */
  updateTotalizers() {
    this.totalizers.forEach(columnId => {
      const column = this.columns.find(c => c.id === columnId);
      if (!column) return;

      let total = 0;

      if (column.type === 'currency' || column.type === 'number') {
        total = this.rows.reduce((sum, row) => {
          const value = parseFloat(row[columnId]) || 0;
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
      if (!column) return;

      if (column.type === 'currency' || column.type === 'number') {
        totals[columnId] = this.rows.reduce((sum, row) => {
          return sum + (parseFloat(row[columnId]) || 0);
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
        if (col.required && (!value || value === '')) {
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
          if (!result.valid) {
            errors.push({
              rowIndex,
              rowId: row.id,
              columnId: col.id,
              error: result.error
            });
          }
        }
      });
    });

    const valid = errors.length === 0;

    if (!valid) {
      this.dispatchEvent('onError', { errors });
    }

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
        timestamp: new Date().toISOString()
      }
    };
  }

  /**
   * Importa de JSON
   * @param {Object} data
   */
  fromJSON(data) {
    try {
      // Validar estrutura
      if (!data.rows || !Array.isArray(data.rows)) {
        throw new Error('Estrutura JSON inválida: "rows" ausente ou não é array');
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

    } catch (error) {
      console.error(`✗ Erro ao importar JSON para DynamicTable[${this.tableId}]:`, error);
      this.dispatchEvent('onError', { error: error.message });
      throw error;
    }
  }

  /**
   * Persiste no IndexedDB
   */
  async persistToIndexedDB() {
    if (!window.financiamento || !window.financiamento.db) {
      console.warn('IndexedDB não disponível - dados não persistidos');
      return;
    }

    try {
      await window.financiamento.salvarDynamicTable(this.tableId, this.toJSON());
    } catch (error) {
      console.error(`Erro ao persistir DynamicTable[${this.tableId}]:`, error);
    }
  }

  /**
   * Carrega do IndexedDB
   */
  async loadFromIndexedDB() {
    if (!window.financiamento || !window.financiamento.db) {
      console.log('IndexedDB não disponível - sem dados para carregar');
      return;
    }

    try {
      const data = await window.financiamento.carregarDynamicTable(this.tableId);
      if (data && data.rows) {
        this.fromJSON(data);
        console.log(`✓ DynamicTable[${this.tableId}]: Dados carregados do IndexedDB`);
      }
    } catch (error) {
      console.log(`ℹ️ Sem dados salvos para DynamicTable[${this.tableId}]`);
    }
  }

  /**
   * Registra listener
   * @param {string} eventName - 'onChange' | 'onValidate' | 'onError' | 'onRowAdded' | 'onRowRemoved'
   * @param {Function} callback
   */
  on(eventName, callback) {
    if (this.listeners[eventName]) {
      this.listeners[eventName].push(callback);
    } else {
      console.warn(`Evento "${eventName}" não existe`);
    }
  }

  /**
   * Dispara evento
   * @param {string} eventName
   * @param {*} data
   */
  dispatchEvent(eventName, data) {
    if (this.listeners[eventName]) {
      this.listeners[eventName].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Erro em listener de "${eventName}":`, error);
        }
      });
    }
  }

  /**
   * Aplica máscaras nos inputs
   * @param {HTMLElement} container
   */
  applyMasks(container) {
    // Currency mask
    const currencyInputs = container.querySelectorAll('.currency-input');
    currencyInputs.forEach(input => {
      // Implementação de máscara de moeda
      // (usar biblioteca externa como IMask.js ou implementação própria)
      input.addEventListener('input', (e) => {
        // Formatar para R$ X.XXX,XX
      });
    });

    // Percentage mask
    const percentageInputs = container.querySelectorAll('.percentage-input');
    percentageInputs.forEach(input => {
      input.addEventListener('input', (e) => {
        // Formatar para XX,XX%
      });
    });
  }

  /**
   * Formata valor como moeda
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
    // Remover event listeners
    // Limpar DOM
    // Limpar arrays
    this.rows = [];
    this.listeners = {};
    console.log(`✓ DynamicTable[${this.tableId}] destruído`);
  }
}

// Exportar globalmente
if (typeof window !== 'undefined') {
  window.DynamicTable = DynamicTable;
}

// Exportar para Node.js (se necessário)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DynamicTable;
}
```

---

## 📦 Módulo 1: SecaoOrcamento

### Localização
```
/src/assets/js/financiamento/secao-orcamento.js
```

### Responsabilidades
- Gerenciar aba ORÇAMENTO (296 campos)
- Instanciar DynamicTable
- Validar total vs CAPEX
- Integrar com FinanciamentoModule

### Classe Completa

```javascript
/**
 * SecaoOrcamento.js
 * Gestão da Seção 4A - Orçamento Detalhado de Investimentos
 */

class SecaoOrcamento {
  constructor(config) {
    this.config = config;
    this.dynamicTable = null;
    this.init();
  }

  async init() {
    try {
      // Instanciar DynamicTable
      this.dynamicTable = new DynamicTable(this.config);
      await this.dynamicTable.init();

      // Event listeners
      this.attachEventListeners();

      console.log('✓ SecaoOrcamento inicializado');

    } catch (error) {
      console.error('✗ Erro ao inicializar SecaoOrcamento:', error);
      throw error;
    }
  }

  attachEventListeners() {
    // Escutar mudanças na tabela
    this.dynamicTable.on('onChange', (data) => {
      this.handleDataChange(data);
    });

    // Botão adicionar item
    const btnAddRow = document.querySelector('[data-table="secao4A_orcamento"]');
    if (btnAddRow) {
      btnAddRow.addEventListener('click', () => {
        this.dynamicTable.addRow();
      });
    }
  }

  handleDataChange(data) {
    // Atualizar indicador de total
    this.updateTotalIndicator();

    // Validar consistência com CAPEX
    this.validateVsCapex();

    // Emitir evento para outros módulos
    window.eventBus.emit('orcamento:updated', {
      total: this.getTotalOrcamento(),
      categorias: this.getCategoriasBreakdown()
    });
  }

  updateTotalIndicator() {
    const totalizadores = this.dynamicTable.getTotalizers();
    const total = totalizadores.valor_total || 0;

    const element = document.getElementById('totalOrcamento');
    if (element) {
      element.textContent = this.formatCurrency(total);
    }
  }

  validateVsCapex() {
    // Obter total do CAPEX da Seção 3
    // (implementar quando Seção 3 estiver pronta)
    const totalCapex = 0; // Placeholder

    const totalOrcamento = this.getTotalOrcamento();
    const validationBox = document.getElementById('validacaoOrcamento');

    if (validationBox) {
      const isValid = Math.abs(totalOrcamento - totalCapex) < 0.01;

      if (isValid) {
        validationBox.className = 'validation-box valid';
        validationBox.innerHTML = `
          <i class="fas fa-check-circle"></i>
          <span>Orçamento consistente com CAPEX (R$ ${this.formatCurrency(totalCapex)})</span>
        `;
      } else {
        validationBox.className = 'validation-box invalid';
        validationBox.innerHTML = `
          <i class="fas fa-exclamation-triangle"></i>
          <span>
            Orçamento (R$ ${this.formatCurrency(totalOrcamento)}) diferente do CAPEX (R$ ${this.formatCurrency(totalCapex)}).
            Diferença: R$ ${this.formatCurrency(Math.abs(totalOrcamento - totalCapex))}
          </span>
        `;
      }
    }
  }

  getTotalOrcamento() {
    const totalizadores = this.dynamicTable.getTotalizers();
    return totalizadores.valor_total || 0;
  }

  getCategoriasBreakdown() {
    const breakdown = {};

    this.dynamicTable.rows.forEach(row => {
      const categoria = row.categoria || 'Sem Categoria';
      const valor = parseFloat(row.valor_total) || 0;

      if (!breakdown[categoria]) {
        breakdown[categoria] = 0;
      }

      breakdown[categoria] += valor;
    });

    return breakdown;
  }

  formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  }

  destroy() {
    if (this.dynamicTable) {
      this.dynamicTable.destroy();
    }
  }
}

// Exportar
if (typeof window !== 'undefined') {
  window.SecaoOrcamento = SecaoOrcamento;
}
```

---

## 📦 Módulo 2: SecaoUsosFontes ⚠️ CRÍTICO

### Localização
```
/src/assets/js/financiamento/secao-usos-fontes.js
```

### Responsabilidades
- Gerenciar aba USOS E FONTES (690 campos)
- Instanciar 2× DynamicTable (USOS + FONTES)
- **Validar balanço:** `SUM(USOS) === SUM(FONTES)`
- Indicador visual em tempo real

### Classe Completa

```javascript
/**
 * SecaoUsosFontes.js
 * Gestão da Seção 4B - Usos e Fontes de Recursos
 * CRÍTICO: Validação de balanço obrigatória para FCO
 */

class SecaoUsosFontes {
  constructor(config) {
    this.usosConfig = config.usosConfig;
    this.fontesConfig = config.fontesConfig;

    this.tableUsos = null;
    this.tableFontes = null;

    this.init();
  }

  async init() {
    try {
      // Instanciar tabelas
      this.tableUsos = new DynamicTable(this.usosConfig);
      await this.tableUsos.init();

      this.tableFontes = new DynamicTable(this.fontesConfig);
      await this.tableFontes.init();

      // Event listeners
      this.attachEventListeners();

      // Validar balanço inicial
      this.validateBalance();

      console.log('✓ SecaoUsosFontes inicializado');

    } catch (error) {
      console.error('✗ Erro ao inicializar SecaoUsosFontes:', error);
      throw error;
    }
  }

  attachEventListeners() {
    // Escutar mudanças em USOS
    this.tableUsos.on('onChange', () => {
      this.handleDataChange();
    });

    // Escutar mudanças em FONTES
    this.tableFontes.on('onChange', () => {
      this.handleDataChange();
    });

    // Botões adicionar
    document.querySelector('[data-table="secao4B_usos"]')?.addEventListener('click', () => {
      this.tableUsos.addRow();
    });

    document.querySelector('[data-table="secao4B_fontes"]')?.addEventListener('click', () => {
      this.tableFontes.addRow();
    });
  }

  handleDataChange() {
    // Atualizar totais
    this.updateTotals();

    // Validar balanço
    const balanced = this.validateBalance();

    // Emitir evento
    window.eventBus.emit('usosFontes:updated', {
      totalUsos: this.getTotalUsos(),
      totalFontes: this.getTotalFontes(),
      balanced: balanced
    });
  }

  updateTotals() {
    // Total USOS
    const totalUsos = this.getTotalUsos();
    document.getElementById('totalUsos').textContent = this.formatCurrency(totalUsos);
    document.getElementById('summaryUsos').textContent = this.formatCurrency(totalUsos);

    // Total FONTES
    const totalFontes = this.getTotalFontes();
    document.getElementById('totalFontes').textContent = this.formatCurrency(totalFontes);
    document.getElementById('summaryFontes').textContent = this.formatCurrency(totalFontes);

    // Diferença
    const diferenca = totalUsos - totalFontes;
    document.getElementById('summaryDiferenca').textContent = this.formatCurrency(Math.abs(diferenca));
  }

  validateBalance() {
    const totalUsos = this.getTotalUsos();
    const totalFontes = this.getTotalFontes();

    const balanced = Math.abs(totalUsos - totalFontes) < 0.01; // Tolerância R$ 0,01

    // Atualizar indicador principal
    const indicador = document.getElementById('balanceIndicator');

    if (balanced) {
      indicador.className = 'balance-indicator balanced';
      indicador.innerHTML = `
        <i class="fas fa-check-circle"></i>
        BALANCEADO: R$ ${this.formatCurrency(totalUsos)}
      `;
    } else {
      indicador.className = 'balance-indicator unbalanced';
      const diferenca = totalUsos - totalFontes;
      indicador.innerHTML = `
        <i class="fas fa-exclamation-triangle"></i>
        DESBALANCEADO: Diferença de R$ ${this.formatCurrency(Math.abs(diferenca))}
        ${diferenca > 0 ? '(Falta FONTES)' : '(Falta USOS)'}
      `;
    }

    // Atualizar status message
    const statusMsg = document.getElementById('balanceStatus');

    if (balanced) {
      statusMsg.className = 'status-message success';
      statusMsg.innerHTML = `
        <i class="fas fa-check-circle"></i>
        <strong>APROVADO:</strong> Balanço entre USOS e FONTES está correto.
      `;
    } else {
      statusMsg.className = 'status-message error';
      const diferenca = totalUsos - totalFontes;

      if (diferenca > 0) {
        statusMsg.innerHTML = `
          <i class="fas fa-times-circle"></i>
          <strong>ATENÇÃO:</strong> Falta adicionar R$ ${this.formatCurrency(diferenca)} em FONTES,
          OU remover este valor dos USOS.
        `;
      } else {
        statusMsg.innerHTML = `
          <i class="fas fa-times-circle"></i>
          <strong>ATENÇÃO:</strong> Falta adicionar R$ ${this.formatCurrency(Math.abs(diferenca))} em USOS,
          OU remover este valor das FONTES.
        `;
      }
    }

    // Emitir evento de validação
    window.eventBus.emit('usosFontes:validated', { balanced, totalUsos, totalFontes });

    return balanced;
  }

  getTotalUsos() {
    const totalizadores = this.tableUsos.getTotalizers();
    return totalizadores.valor || 0;
  }

  getTotalFontes() {
    const totalizadores = this.tableFontes.getTotalizers();
    return totalizadores.valor || 0;
  }

  formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  }

  destroy() {
    if (this.tableUsos) this.tableUsos.destroy();
    if (this.tableFontes) this.tableFontes.destroy();
  }
}

// Exportar
if (typeof window !== 'undefined') {
  window.SecaoUsosFontes = SecaoUsosFontes;
}
```

---

## 📦 Módulo 3-10: Resumo das Demais Seções

### Módulo 3: SecaoReceitas
- **Localização:** `/src/assets/js/financiamento/secao-receitas.js`
- **Campos:** 555
- **Responsabilidades:**
  - Gerenciar produtos/serviços individuais
  - Calcular receitas mensais (12 meses)
  - Integrar com `CalculadorDREProjetado`
- **Event Emitted:** `receitas:updated` → `{ totaisMensais, totalAnual }`

### Módulo 4: SecaoInsumos
- **Localização:** `/src/assets/js/financiamento/secao-insumos.js`
- **Campos:** 67
- **Responsabilidades:**
  - Gerenciar insumos/matérias-primas
  - Calcular custos mensais
  - Integrar com `CalculadorDREProjetado`
- **Event Emitted:** `insumos:updated`

### Módulo 5: SecaoCustos
- **Localização:** `/src/assets/js/financiamento/secao-custos.js`
- **Campos:** 276
- **Responsabilidades:**
  - Gerenciar custos operacionais
  - Calcular totais mensais
  - Integrar com DRE
- **Event Emitted:** `custos:updated`

### Módulo 6: SecaoMaoObra
- **Localização:** `/src/assets/js/financiamento/secao-mao-obra.js`
- **Campos:** 778
- **Responsabilidades:**
  - Gerenciar empregados individuais
  - Calcular folha de pagamento mensal
  - Integrar com DRE (Despesas com Pessoal)
- **Event Emitted:** `maoObra:updated`

### Módulo 7: SecaoDepreciacao
- **Localização:** `/src/assets/js/financiamento/secao-depreciacao.js`
- **Campos:** 122
- **Responsabilidades:**
  - Gerenciar ativos imobilizados
  - Calcular depreciação anual
  - Integrar com DRE
- **Event Emitted:** `depreciacao:updated`

### Módulo 8: SecaoGiro
- **Localização:** `/src/assets/js/financiamento/secao-giro.js`
- **Campos:** 166
- **Responsabilidades:**
  - Calcular capital de giro necessário
  - PMR, PMP, giro de estoque
- **Event Emitted:** `giro:updated`

### Módulo 9: SecaoFinanciamento
- **Localização:** `/src/assets/js/financiamento/secao-financiamento.js`
- **Campos:** 432
- **Responsabilidades:**
  - Gerenciar linhas de crédito
  - Calcular parcelas (SAC, PRICE)
  - Integrar com Fluxo de Caixa
- **Event Emitted:** `financiamento:updated`

### Módulo 10: SecaoDividas
- **Localização:** `/src/assets/js/financiamento/secao-dividas.js`
- **Campos:** 2.760 (MAIOR SEÇÃO!)
- **Responsabilidades:**
  - Gerenciar dívidas existentes
  - Calcular serviço da dívida mensal
  - Integrar com Fluxo de Caixa
- **Event Emitted:** `dividas:updated`
- **Nota:** Implementar Virtual Scrolling devido ao tamanho

---

## 📦 Módulo Implementado: SecaoInvestimentos ✅

### Status
**IMPLEMENTADO E FUNCIONAL** (Outubro 2025)

### Localização
```
/src/assets/js/financiamento/secao-investimentos.js
```

### Responsabilidades
- Gerenciar Seção 8: Orçamento dos Investimentos Projetados
- Tabela dinâmica com 21 colunas de dados
- **Lógica financeira invertida:** Usuário insere % Terceiros → Sistema calcula % Próprios (100% - Terceiros)
- Cálculo automático de valores baseado em percentuais
- Lógica de contrapartida para investimentos já realizados
- Totalização automática com depreciação média ponderada
- Persistência em IndexedDB via `financiamento-module.js`
- **Não utiliza DynamicTable** - Implementação standalone com lógica customizada

### Estrutura da Tabela (21 Colunas)

1. **Categoria** (select) - Tipo de investimento
2. **Item** (text) - Descrição do item
3. **Especificação** (textarea) - Especificação técnica
4. **Quantidade** (number) - Quantidade
5. **Unidade** (select) - Unidade de medida (UN, M, M², KG, etc.)
6. **Valor Unitário** (currency) - Valor por unidade
7. **Valor Total** (currency, readonly) - Calculado: Qtd × Valor Unit.
8. **Ano Desembolso** (select) - Ano 0 a 5
9. **Depreciação** (number, %) - Taxa de depreciação anual
10. **Realizado** (currency) - Valor já investido/executado
11. **Cobertura Terceiros** (select) - FCO, FNE, FNO, FINEP, BNDES, etc.
12. **% Terceiros** (number, INPUT) - Percentual de recursos de terceiros
13. **Valor Terceiros** (currency, readonly) - Calculado: (% Terceiros / 100) × Valor Total
14. **Cobertura Próprios** (select) - Capital Social, Lucros, Reinvestimento, etc.
15. **% Próprios** (text, readonly) - Calculado: 100% - % Terceiros
16. **Valor Próprios** (currency, readonly) - Calculado: (% Próprios / 100) × Valor Total
17. **A Realizar** (currency, readonly) - Calculado: Valor Total - Realizado
18. **Fornecedor** (text) - Nome do fornecedor
19. **CNPJ** (text) - CNPJ do fornecedor
20. **Tem Orçamento** (select) - Sim, Não, Cotação
21. **Ações** (button) - Botão remover linha

### Lógica de Cálculo

#### 1. Cálculo de Valor Total
```javascript
Valor Total = Quantidade × Valor Unitário
```

#### 2. Cálculo de Percentuais e Valores de Financiamento
```javascript
// INPUT DO USUÁRIO
% Terceiros (input do usuário, 0-100%)

// CALCULADO AUTOMATICAMENTE
% Próprios = 100% - % Terceiros

// VALORES CALCULADOS
Valor Terceiros = (% Terceiros / 100) × Valor Total
Valor Próprios = (% Próprios / 100) × Valor Total
```

**Vantagem desta abordagem:**
- ✅ Impossível ter erro de balanço (sempre soma 100%)
- ✅ UX simplificada (1 input ao invés de 2)
- ✅ Menos propenso a erros humanos

#### 3. Lógica de Contrapartida
```javascript
if (checkbox "Investimentos como contrapartida" MARCADO && Realizado > 0) {
    Próprios Necessários = Max(0, Valor Próprios Base - Realizado)
} else {
    Próprios Necessários = Valor Próprios Base
}
```

**Exemplo prático:**
- Valor Total: R$ 1.000.000
- Realizado: R$ 200.000
- % Terceiros: 70% (R$ 700.000)
- % Próprios: 30% (R$ 300.000)
- **Contrapartida marcada:** Próprios Necessários = R$ 100.000 (300k - 200k já investidos)

#### 4. Cálculo de Depreciação Média Ponderada
```javascript
Depreciação Média = (Σ(Valor Total × Depreciação)) / Σ(Valor Total)
```

### Totalização

A seção calcula e exibe:

- **Total Orçamento:** Soma de todos os Valores Totais
- **Depreciação Média:** Depreciação ponderada pelo valor
- **Total Realizado:** Soma dos valores já investidos
- **Total Terceiros:** Soma dos valores de financiamento
- **% Terceiros Total:** Percentual médio de recursos de terceiros
- **Total Próprios:** Soma dos valores de recursos próprios
- **% Próprios Total:** Percentual médio de recursos próprios
- **Total A Realizar:** Soma dos valores ainda a investir
- **Grand Total:** Orçamento + Capital Giro + Juros Pré-Op

### Dropdowns Implementados

#### Categoria de Investimento
- Terreno, Obras Civis, Edificações, Máquinas e Equipamentos, Instalações, Móveis e Utensílios, Veículos, Equipamentos de Informática, Software, Projetos e Estudos, Treinamento, Outros

#### Unidade de Medida
- UN, M, M², M³, KG, T, L, SERV, VERBA, CJ

#### Ano de Desembolso
- Ano 0 (corrente), Ano 1, Ano 2, Ano 3, Ano 4, Ano 5

#### Cobertura Terceiros (FUNDOS CONSTITUCIONAIS + AGÊNCIAS DE FOMENTO)
- **FCO** - Fundo Centro-Oeste
- **FNE** - Fundo Nordeste
- **FNO** - Fundo Norte
- **FINEP** - Financiadora de Estudos e Projetos
- **BNDES** - Banco Nacional de Desenvolvimento
- **Banco Privado**
- **Outro**

#### Cobertura Próprios
- Capital Social, Lucros Acumulados, Reinvestimento, Investimentos Realizados, Outro

#### Possui Orçamento
- Sim (orçamento formal), Não, Cotação (preliminar)

### Métodos Principais

```javascript
class SecaoInvestimentos {
  init()                              // Inicializa módulo
  collectDOMReferences()              // Valida elementos obrigatórios
  setupEventListeners()               // Event delegation otimizado
  applyMasks()                        // Aplica máscaras de moeda

  addInvestimentoRow()                // Adiciona linha vazia
  addInvestimentoRowWithData(item)    // Adiciona linha com dados (restauração)

  calculateRowValues(row)             // Calcula todos os valores da linha
  updateAllTotals()                   // Atualiza totalizações
  updateGrandTotal()                  // Atualiza total geral

  coletarDadosInvestimentos()         // Coleta dados para persistência
  restaurarDadosInvestimentos(dados)  // Restaura dados salvos

  parseCurrency(value)                // Converte moeda para número
  formatCurrency(value)               // Formata número como moeda

  isReady()                           // Verifica se módulo está pronto
}
```

### Persistência

```javascript
// Estrutura de dados persistida
{
  investimentos: [
    {
      categoria: "Máquinas e Equipamentos",
      item: "Torno CNC",
      especificacao: "Torno CNC 3 eixos",
      quantidade: "2",
      unidade: "UN",
      valorUnitario: "R$ 150.000,00",
      valorTotal: "R$ 300.000,00",
      anoDesembolso: "1",
      depreciacao: "10",
      realizado: "R$ 50.000,00",
      recursosTerceiros: {
        cobertura: "FCO",
        valor: "R$ 210.000,00",
        percentual: "70"
      },
      recursosProprios: {
        cobertura: "Capital Social",
        valor: "R$ 90.000,00",
        percentual: "30%"
      },
      aRealizar: "R$ 250.000,00",
      fornecedor: "Máquinas Industriais Ltda",
      cnpj: "12.345.678/0001-90",
      temOrcamento: "Sim"
    }
  ],
  capitalGiro: "R$ 50.000,00",
  jurosPreOp: "R$ 10.000,00",
  investimentosComoContrapartida: true,
  notasInvestimentos: "Observações gerais sobre os investimentos..."
}
```

### Auto-Inicialização

```javascript
document.addEventListener('DOMContentLoaded', () => {
    const investimentosContainer = document.getElementById('investimentos-tbody');
    if (investimentosContainer) {
        window.secaoInvestimentos = new SecaoInvestimentos();
        window.secaoInvestimentos.init();
        console.log('✓ SecaoInvestimentos inicializada e disponível globalmente');
    }
});
```

### Princípios Aplicados

- ✅ **NO FALLBACKS:** Erros explícitos quando elementos obrigatórios faltam
- ✅ **KISS:** Lógica de cálculo simplificada (% → Valor)
- ✅ **DRY:** Funções reutilizáveis para parsing/formatting
- ✅ **SOLID:** Responsabilidade única, métodos coesos
- ✅ **Event Delegation:** Performance otimizada para tabelas dinâmicas

### Diferenças vs DynamicTable

| Aspecto | DynamicTable | SecaoInvestimentos |
|---------|-------------|-------------------|
| **Arquitetura** | Genérica, configurável | Específica, customizada |
| **Cálculos** | Fórmulas simples | Lógica financeira complexa |
| **Validação** | Básica por tipo | Contrapartida, balanceamento |
| **Dependências** | Standalone | Integra com currencyMask |
| **Use Case** | Tabelas simples | Orçamento de investimentos |

### Commits Relevantes
- `602b4f1` - Implementação inicial SecaoInvestimentos
- `ab3d2e4` - Fix: Adicionar script tag + auto-init
- `6d981a5` - Refactor: Lógica invertida % → Valor + FCO/FNE/FNO + Contrapartida

---

## 📝 Próximos Passos

1. ✅ **ARQUITETURA_IMPLEMENTACAO.md criado**
2. ✅ **ESTRUTURA_HTML.md criado**
3. ✅ **MODULOS_JS.md criado**
4. ⏳ Criar IMPORT_EXPORT_SPEC.md
5. ⏳ Criar ROADMAP_IMPLEMENTACAO.md
6. ⏳ Revisão completa da documentação
7. ⏳ Iniciar implementação Sprint 1

---

**Última atualização:** 2025-10-17
**Próxima revisão:** Após criação dos 2 documentos restantes
**Implementações concluídas:** SecaoInvestimentos (Seção 8) ✅
