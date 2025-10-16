/**
 * DynamicTable Component
 *
 * Componente para tabelas com crescimento vertical ilimitado.
 *
 * Princípios:
 * - Schema externo para defaults (ZERO fallbacks inline)
 * - Validação estrutural mínima (apenas config crítica)
 * - Validação de dados flexível (avisos, não bloqueios)
 * - Máscaras sugestivas (não forçadas)
 * - Feedback visual (classes CSS)
 *
 * @author Expertzy
 * @version 1.0.0
 */

class DynamicTable {
    static defaults = null;

    constructor(config) {
        // Validação estrutural MÍNIMA (apenas config crítica)
        if (!config.tableId) {
            throw new Error('DynamicTable: tableId obrigatório');
        }
        if (!config.containerId) {
            throw new Error('DynamicTable: containerId obrigatório');
        }
        if (!config.columns || config.columns.length === 0) {
            throw new Error('DynamicTable: columns obrigatório e não pode estar vazio');
        }

        this.tableId = config.tableId;
        this.containerId = config.containerId;

        // Carrega defaults e normaliza config
        this.initializeDefaults();
        this.columns = this.normalizeColumns(config.columns);
        this.options = this.normalizeOptions(config.options);

        this.data = [];
        this.rowCount = 0;
        this.container = null;
        this.table = null;
        this.saveTimeout = null;

        this.init();
    }

    /**
     * Carrega schema de defaults (cache estático)
     */
    async initializeDefaults() {
        if (DynamicTable.defaults) return;

        try {
            const response = await fetch('/config/dynamic-table-defaults.json');
            DynamicTable.defaults = await response.json();
        } catch (error) {
            throw new Error(`DynamicTable: Falha ao carregar defaults: ${error.message}`);
        }
    }

    /**
     * Normaliza colunas com defaults do schema
     */
    normalizeColumns(columns) {
        return columns.map(col => {
            const typeDefaults = DynamicTable.defaults.fieldTypes[col.type];

            if (!typeDefaults) {
                throw new Error(`DynamicTable: Tipo de campo inválido: ${col.type}`);
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
    normalizeOptions(userOptions) {
        const defaultOptions = DynamicTable.defaults.tableOptions;

        return {
            ...defaultOptions,
            ...userOptions
        };
    }

    /**
     * Inicializa o componente
     */
    init() {
        this.container = document.getElementById(this.containerId);
        if (!this.container) {
            throw new Error(`DynamicTable: Container #${this.containerId} não encontrado`);
        }

        this.render();
        this.addInitialRows();
        this.attachEventListeners();
    }

    /**
     * Renderiza a estrutura da tabela
     */
    render() {
        const css = DynamicTable.defaults.css;

        const tableHTML = `
            <div class="${css.wrapper}" data-table-id="${this.tableId}">
                <div class="${this.options.responsive ? css.tableResponsive : ''}">
                    <table class="${css.table} ${this.options.striped ? css.tableStriped : ''}" id="${this.tableId}">
                        <thead>
                            <tr>${this.renderHeaderRow()}</tr>
                        </thead>
                        <tbody id="${this.tableId}-tbody">
                        </tbody>
                        ${this.options.showTotal ? this.renderTotalRow() : ''}
                    </table>
                </div>
                ${this.options.allowAdd ? this.renderAddButton() : ''}
            </div>
        `;

        this.container.innerHTML = tableHTML;
        this.table = document.getElementById(this.tableId);
    }

    renderHeaderRow() {
        let html = '';

        this.columns.forEach(col => {
            const required = col.required ? '<span class="required">*</span>' : '';
            const helpText = col.helpText ? `<i class="help-icon" title="${col.helpText}">?</i>` : '';
            html += `<th>${col.label}${required}${helpText}</th>`;
        });

        if (this.options.allowDelete) {
            html += `<th class="${DynamicTable.defaults.css.actionsColumn}">Ações</th>`;
        }

        return html;
    }

    renderTotalRow() {
        const css = DynamicTable.defaults.css;

        return `
            <tfoot>
                <tr class="${css.totalRow}" id="${this.tableId}-total">
                    ${this.renderTotalCells()}
                </tr>
            </tfoot>
        `;
    }

    renderTotalCells() {
        let html = '';

        this.columns.forEach((col, index) => {
            if (index === 0) {
                html += '<td class="total-label"><strong>Total:</strong></td>';
            } else if (col.includeInTotal) {
                html += `<td class="total-value" data-column="${col.name}">-</td>`;
            } else {
                html += '<td>-</td>';
            }
        });

        if (this.options.allowDelete) {
            html += '<td></td>';
        }

        return html;
    }

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

    addInitialRows() {
        for (let i = 0; i < this.options.minRows; i++) {
            this.addRow();
        }
    }

    addRow(rowData = null) {
        const rowIndex = this.rowCount++;
        const tbody = document.getElementById(`${this.tableId}-tbody`);

        const row = document.createElement('tr');
        row.id = `${this.tableId}-row-${rowIndex}`;
        row.dataset.rowIndex = rowIndex;
        row.innerHTML = this.renderRowCells(rowIndex, rowData);

        tbody.appendChild(row);

        this.data.push(rowData ?? this.createEmptyRowData());

        if (this.options.showTotal) {
            this.updateTotals();
        }

        if (this.options.autoSave) {
            this.scheduleAutoSave();
        }

        return rowIndex;
    }

    renderRowCells(rowIndex, rowData) {
        const css = DynamicTable.defaults.css;
        let html = '';

        this.columns.forEach(col => {
            const value = rowData?.[col.name] ?? col.defaultValue;
            const cellId = `${this.tableId}-${rowIndex}-${col.name}`;
            html += `<td>${this.renderCell(col, cellId, value, rowIndex)}</td>`;
        });

        if (this.options.allowDelete) {
            const canDelete = this.data.length > this.options.minRows;
            html += `
                <td class="actions-cell">
                    <button type="button"
                            class="${css.deleteRowBtn}"
                            data-row-index="${rowIndex}"
                            data-table-id="${this.tableId}"
                            ${!canDelete ? 'disabled' : ''}>
                        🗑️
                    </button>
                </td>
            `;
        }

        return html;
    }

    renderCell(col, cellId, value, rowIndex) {
        const css = DynamicTable.defaults.css;
        const commonAttrs = `
            id="${cellId}"
            name="${col.name}"
            data-row-index="${rowIndex}"
            data-column="${col.name}"
            data-type="${col.type}"
            class="${css.formControl}"
            ${col.required ? 'required' : ''}
            ${col.readonly ? 'readonly' : ''}
            ${col.disabled ? 'disabled' : ''}
        `.trim();

        switch (col.type) {
            case 'text':
            case 'currency':
            case 'percentage':
            case 'cpf':
            case 'cnpj':
            case 'phone':
                return `<input type="${col.htmlType}" ${commonAttrs}
                    value="${value}"
                    placeholder="${col.placeholder}"
                    ${col.maxLength ? `maxlength="${col.maxLength}"` : ''} />`;

            case 'number':
                return `<input type="number" ${commonAttrs}
                    value="${value}"
                    placeholder="${col.placeholder}"
                    step="${col.step}" />`;

            case 'date':
                return `<input type="date" ${commonAttrs} value="${value}" />`;

            case 'email':
                return `<input type="email" ${commonAttrs}
                    value="${value}"
                    placeholder="${col.placeholder}" />`;

            case 'boolean':
                return this.renderBooleanField(col, commonAttrs, value);

            case 'list':
                return this.renderListField(col, commonAttrs, value);

            case 'calculated':
                return `<input type="text" ${commonAttrs}
                    value="${value}"
                    readonly
                    data-formula="${col.formula ?? ''}" />`;

            default:
                return `<input type="text" ${commonAttrs} value="${value}" />`;
        }
    }

    renderBooleanField(col, commonAttrs, value) {
        const options = col.options ?? DynamicTable.defaults.fieldTypes.boolean.options;
        let html = `<select ${commonAttrs}>`;

        options.forEach(opt => {
            const selected = value === opt.value ? 'selected' : '';
            html += `<option value="${opt.value}" ${selected}>${opt.label}</option>`;
        });

        html += '</select>';
        return html;
    }

    renderListField(col, commonAttrs, value) {
        const options = col.options ?? [];
        let html = `<select ${commonAttrs}>`;
        html += `<option value="">${col.placeholder}</option>`;

        options.forEach(opt => {
            const optValue = typeof opt === 'object' ? opt.value : opt;
            const optLabel = typeof opt === 'object' ? opt.label : opt;
            const selected = value === optValue ? 'selected' : '';
            html += `<option value="${optValue}" ${selected}>${optLabel}</option>`;
        });

        html += '</select>';
        return html;
    }

    createEmptyRowData() {
        const rowData = {};
        this.columns.forEach(col => {
            rowData[col.name] = col.defaultValue;
        });
        return rowData;
    }

    removeRow(rowIndex) {
        if (this.data.length <= this.options.minRows) {
            alert(`É necessário manter pelo menos ${this.options.minRows} linha(s).`);
            return;
        }

        const row = document.querySelector(`#${this.tableId}-row-${rowIndex}`);
        if (row) row.remove();

        const dataIndex = this.data.findIndex((_, idx) => idx === rowIndex);
        if (dataIndex !== -1) {
            this.data.splice(dataIndex, 1);
        }

        if (this.options.showTotal) {
            this.updateTotals();
        }

        this.updateDeleteButtons();

        if (this.options.autoSave) {
            this.scheduleAutoSave();
        }
    }

    updateDeleteButtons() {
        const deleteButtons = this.table.querySelectorAll('.btn-delete-row');
        const canDelete = this.data.length > this.options.minRows;

        deleteButtons.forEach(btn => {
            btn.disabled = !canDelete;
        });
    }

    updateTotals() {
        if (!this.options.showTotal) return;

        this.columns.forEach(col => {
            if (col.includeInTotal) {
                const totalCell = this.table.querySelector(`.total-value[data-column="${col.name}"]`);
                if (!totalCell) return;

                const values = this.getColumnValues(col.name);
                const total = this.calculateTotal(values, col);

                totalCell.textContent = this.formatValue(total, col);
            }
        });
    }

    getColumnValues(columnName) {
        const values = [];
        const inputs = this.table.querySelectorAll(`[data-column="${columnName}"]`);

        inputs.forEach(input => {
            const value = this.parseValue(input.value, input.dataset.type);
            if (value !== null && value !== '' && !isNaN(value)) {
                values.push(parseFloat(value));
            }
        });

        return values;
    }

    calculateTotal(values, column) {
        if (values.length === 0) return 0;

        const totalType = column.totalType ?? this.options.totalType;

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

    formatValue(value, column) {
        const decimalPlaces = column.decimalPlaces ?? 2;

        switch (column.type) {
            case 'currency':
                return new Intl.NumberFormat(column.locale, {
                    style: 'currency',
                    currency: column.currency,
                    minimumFractionDigits: decimalPlaces,
                    maximumFractionDigits: decimalPlaces
                }).format(value);

            case 'percentage':
                return new Intl.NumberFormat(column.locale, {
                    style: 'percent',
                    minimumFractionDigits: decimalPlaces,
                    maximumFractionDigits: decimalPlaces
                }).format(value / 100);

            case 'number':
                return new Intl.NumberFormat(column.locale ?? 'pt-BR', {
                    minimumFractionDigits: decimalPlaces,
                    maximumFractionDigits: decimalPlaces
                }).format(value);

            default:
                return value;
        }
    }

    parseValue(value, type) {
        if (!value) return null;

        switch (type) {
            case 'currency':
            case 'percentage':
                return parseFloat(value.replace(/[^\d,.-]/g, '').replace(',', '.'));
            case 'number':
                return parseFloat(value);
            case 'boolean':
                return value === 'true';
            default:
                return value;
        }
    }

    attachEventListeners() {
        const addButton = this.container.querySelector('.btn-add-row');
        if (addButton) {
            addButton.addEventListener('click', () => this.addRow());
        }

        this.table.addEventListener('click', (e) => {
            if (e.target.closest('.btn-delete-row')) {
                const btn = e.target.closest('.btn-delete-row');
                const rowIndex = parseInt(btn.dataset.rowIndex);

                if (confirm('Remover esta linha?')) {
                    this.removeRow(rowIndex);
                }
            }
        });

        this.table.addEventListener('input', (e) => {
            if (e.target.matches('input, select, textarea')) {
                this.handleInputChange(e.target);
            }
        });

        // Máscaras SUGESTIVAS em blur (não forçadas)
        this.table.addEventListener('blur', (e) => {
            if (e.target.matches('input')) {
                this.applySuggestedMask(e.target);
            }
        }, true);
    }

    handleInputChange(input) {
        const rowIndex = parseInt(input.dataset.rowIndex);
        const columnName = input.dataset.column;
        const value = this.parseValue(input.value, input.dataset.type);

        if (this.data[rowIndex]) {
            this.data[rowIndex][columnName] = value;
        }

        this.updateCalculatedFields(rowIndex);

        if (this.options.showTotal) {
            this.updateTotals();
        }

        // Remove avisos visuais ao digitar
        input.classList.remove(DynamicTable.defaults.css.warning);
        input.classList.remove(DynamicTable.defaults.css.error);

        if (this.options.autoSave) {
            this.scheduleAutoSave();
        }
    }

    updateCalculatedFields(rowIndex) {
        const calculatedCols = this.columns.filter(col => col.type === 'calculated');

        calculatedCols.forEach(col => {
            const cellId = `${this.tableId}-${rowIndex}-${col.name}`;
            const input = document.getElementById(cellId);

            if (input && col.formula) {
                const result = this.evaluateFormula(col.formula, this.data[rowIndex]);
                input.value = this.formatValue(result, col);
                this.data[rowIndex][col.name] = result;
            }
        });
    }

    evaluateFormula(formula, rowData) {
        try {
            let expression = formula;
            Object.keys(rowData).forEach(key => {
                const regex = new RegExp(`\\{${key}\\}`, 'g');
                expression = expression.replace(regex, rowData[key] ?? 0);
            });
            // NOTE: Em produção, usar biblioteca segura (math.js, expr-eval)
            return eval(expression);
        } catch (error) {
            console.warn('Erro ao avaliar fórmula:', error);
            return 0;
        }
    }

    /**
     * Aplica máscara SUGESTIVA (não força)
     * Se falhar, mantém valor original
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
            console.debug('Máscara não aplicada:', error);
        }
    }

    applyCurrencyMask(input) {
        let value = input.value.replace(/\D/g, '');
        if (!value) return;

        const col = this.columns.find(c => c.name === input.dataset.column);
        const decimalPlaces = col?.decimalPlaces ?? 2;
        const divisor = Math.pow(10, decimalPlaces);
        const number = parseInt(value) / divisor;

        input.value = new Intl.NumberFormat(col.locale, {
            style: 'currency',
            currency: col.currency,
            minimumFractionDigits: decimalPlaces
        }).format(number);
    }

    applyPercentageMask(input) {
        let value = input.value.replace(/\D/g, '');
        if (!value) return;

        const col = this.columns.find(c => c.name === input.dataset.column);
        const decimalPlaces = col?.decimalPlaces ?? 2;
        const divisor = Math.pow(10, decimalPlaces);
        const number = parseInt(value) / divisor;

        input.value = new Intl.NumberFormat(col.locale, {
            style: 'percent',
            minimumFractionDigits: decimalPlaces
        }).format(number / 100);
    }

    applyCPFMask(input) {
        let value = input.value.replace(/\D/g, '');
        value = value.replace(/(\d{3})(\d)/, '$1.$2');
        value = value.replace(/(\d{3})(\d)/, '$1.$2');
        value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
        input.value = value;
    }

    applyCNPJMask(input) {
        let value = input.value.replace(/\D/g, '');
        value = value.replace(/^(\d{2})(\d)/, '$1.$2');
        value = value.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
        value = value.replace(/\.(\d{3})(\d)/, '.$1/$2');
        value = value.replace(/(\d{4})(\d)/, '$1-$2');
        input.value = value;
    }

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

    scheduleAutoSave() {
        if (this.saveTimeout) {
            clearTimeout(this.saveTimeout);
        }

        this.saveTimeout = setTimeout(() => {
            this.save();
        }, this.options.saveDelay);
    }

    async save() {
        try {
            console.log(`[DynamicTable] Salvando ${this.tableId}:`, this.data);

            const event = new CustomEvent('dynamictable:save', {
                detail: {
                    tableId: this.tableId,
                    data: this.data
                }
            });
            this.container.dispatchEvent(event);

            return true;
        } catch (error) {
            console.error('[DynamicTable] Erro ao salvar:', error);
            return false;
        }
    }

    /**
     * Validação FLEXÍVEL de dados
     * Retorna errors (bloqueantes) e warnings (avisos)
     */
    validate() {
        const errors = [];
        const warnings = [];

        this.data.forEach((rowData, rowIndex) => {
            this.columns.forEach(col => {
                const value = rowData[col.name];

                // ERROR: apenas campo obrigatório vazio
                if (col.required && (!value || value === '')) {
                    errors.push({
                        row: rowIndex + 1,
                        column: col.label,
                        message: 'Campo obrigatório não preenchido'
                    });
                }

                // WARNING: formato sugerido diferente (NÃO bloqueia)
                if (value && value !== '') {
                    const warning = this.checkFormatWarning(col, value);
                    if (warning) {
                        warnings.push({
                            row: rowIndex + 1,
                            column: col.label,
                            message: warning
                        });
                    }
                }
            });
        });

        return {
            valid: errors.length === 0, // Permite salvar com warnings
            errors: errors,
            warnings: warnings
        };
    }

    /**
     * Verifica formato (AVISO apenas, não bloqueia)
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
     * Mostra avisos visuais na UI (classes CSS)
     */
    showValidationFeedback(validationResult) {
        const css = DynamicTable.defaults.css;

        // Remove avisos anteriores
        this.table.querySelectorAll(`.${css.warning}, .${css.error}`).forEach(el => {
            el.classList.remove(css.warning, css.error);
        });

        // Aplica errors
        validationResult.errors.forEach(err => {
            const col = this.columns.find(c => c.label === err.column);
            if (col) {
                const input = this.table.querySelector(`[data-row-index="${err.row - 1}"][data-column="${col.name}"]`);
                if (input) {
                    input.classList.add(css.error);
                    input.title = err.message;
                }
            }
        });

        // Aplica warnings
        validationResult.warnings.forEach(warn => {
            const col = this.columns.find(c => c.label === warn.column);
            if (col) {
                const input = this.table.querySelector(`[data-row-index="${warn.row - 1}"][data-column="${col.name}"]`);
                if (input) {
                    input.classList.add(css.warning);
                    input.title = warn.message;
                }
            }
        });
    }

    loadData(data) {
        this.clearTable();
        data.forEach(rowData => this.addRow(rowData));
        if (this.options.showTotal) {
            this.updateTotals();
        }
    }

    clearTable() {
        const tbody = document.getElementById(`${this.tableId}-tbody`);
        tbody.innerHTML = '';
        this.data = [];
        this.rowCount = 0;
    }

    getData() {
        return this.data;
    }

    exportToJSON() {
        return {
            tableId: this.tableId,
            columns: this.columns,
            data: this.data,
            metadata: {
                exportedAt: new Date().toISOString(),
                rowCount: this.data.length
            }
        };
    }

    importFromJSON(json) {
        if (json.tableId !== this.tableId) {
            throw new Error('ID da tabela não corresponde');
        }
        this.loadData(json.data);
    }

    destroy() {
        if (this.saveTimeout) {
            clearTimeout(this.saveTimeout);
        }
        this.container.innerHTML = '';
        this.data = [];
        this.rowCount = 0;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = DynamicTable;
}
