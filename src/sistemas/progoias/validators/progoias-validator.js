/* =====================================
   PROGOIAS-VALIDATOR.JS
   Validações específicas do formulário ProGoiás
   NO FALLBACKS - NO HARDCODED DATA
   ===================================== */

import { DocumentValidator } from '@shared/validators/document-validator.js';
import { EmailValidator } from '@shared/validators/email-validator.js';
import { CurrencyFormatter } from '@shared/formatters/currency-formatter.js';
import { PATTERNS, ERROR_MESSAGES } from '@shared/constants/patterns.js';

/**
 * Validador para formulário ProGoiás
 * Responsável por todas as validações específicas do programa ProGoiás
 *
 * @class ProGoiasValidator
 */
export class ProGoiasValidator {
    /**
     * @param {Object} config - Configuração ProGoiás com validationRules
     */
    constructor(config) {
        if (!config) {
            throw new Error('ProGoiasValidator: configuração obrigatória não fornecida');
        }

        if (!config.validationRules) {
            throw new Error('ProGoiasValidator: validationRules obrigatórias na configuração');
        }

        this.config = config;
        this.validationErrors = new Map();
    }

    /**
     * Valida um campo do formulário
     * @public
     * @param {HTMLElement} field - Campo a validar
     * @returns {boolean} True se válido
     */
    validateField(field) {
        if (!field || !field.name) {
            throw new Error('ProGoiasValidator: campo inválido para validação');
        }

        const fieldName = field.name;

        // Limpar erro anterior
        this.clearFieldError(field);

        // Validações obrigatórias
        if (field.hasAttribute('required') && !field.value.trim()) {
            this.setFieldError(field, ERROR_MESSAGES.REQUIRED);
            return false;
        }

        // Se campo vazio e não obrigatório, válido
        if (!field.value.trim()) {
            return true;
        }

        // Validações por tipo
        if (field.type === 'email') {
            if (!EmailValidator.validate(field.value)) {
                this.setFieldError(field, ERROR_MESSAGES.INVALID_EMAIL);
                return false;
            }
        }

        // Validações por data-validation
        const validationType = field.dataset.validation;

        if (validationType === 'cnpj') {
            if (!DocumentValidator.validateCNPJ(field.value)) {
                this.setFieldError(field, ERROR_MESSAGES.INVALID_CNPJ);
                return false;
            }
        }

        if (validationType === 'cpf') {
            if (!DocumentValidator.validateCPF(field.value)) {
                this.setFieldError(field, ERROR_MESSAGES.INVALID_CPF);
                return false;
            }
        }

        // Validações específicas ProGoiás por nome do campo
        if (fieldName === 'empregosDiretos') {
            return this.validateEmploymentMinimum(field);
        }

        return true;
    }

    /**
     * Valida seção do formulário
     * @public
     * @param {HTMLElement} section - Seção a validar
     * @returns {boolean} True se válida
     */
    validateSection(section) {
        if (!section) {
            throw new Error('ProGoiasValidator: seção inválida para validação');
        }

        const requiredFields = section.querySelectorAll('[required]');
        let isValid = true;

        requiredFields.forEach(field => {
            if (!this.validateField(field)) {
                isValid = false;
            }
        });

        return isValid;
    }

    /**
     * Valida mínimo de empregos diretos
     * @public
     * @param {HTMLElement} field - Campo de empregos
     * @returns {boolean} True se válido
     */
    validateEmploymentMinimum(field) {
        const value = parseInt(field.value);

        if (isNaN(value) || value <= 0) {
            this.setFieldError(field, 'Número de empregos deve ser maior que zero');
            return false;
        }

        // Validar mínimo de empregos (se configurado)
        if (this.config.validationRules.empregosMinimos !== undefined &&
            this.config.validationRules.empregosMinimos !== null) {
            if (value < this.config.validationRules.empregosMinimos) {
                this.setFieldError(field,
                    `ProGoiás requer mínimo de ${this.config.validationRules.empregosMinimos} empregos diretos`);
                return false;
            }
        }

        return true;
    }

    /**
     * Valida anos dos balanços (3 anos, ordem cronológica, não futuro)
     * @public
     * @returns {Object} { isValid: boolean, message: string }
     */
    validateBalanceYears() {
        const year1Field = document.querySelector('[name="anoBase1"]');
        const year2Field = document.querySelector('[name="anoBase2"]');
        const year3Field = document.querySelector('[name="anoBase3"]');

        if (!year1Field || !year2Field || !year3Field) {
            return {
                isValid: false,
                message: 'Campos de ano base não encontrados'
            };
        }

        const year1 = year1Field.value;
        const year2 = year2Field.value;
        const year3 = year3Field.value;

        // Se algum campo vazio, não validar
        if (!year1 || !year2 || !year3) {
            return { isValid: true, message: '' };
        }

        const years = [parseInt(year1), parseInt(year2), parseInt(year3)];

        // Verificar ordem cronológica (mais recente primeiro)
        if (years[0] <= years[1] || years[1] <= years[2]) {
            const message = 'Anos devem estar em ordem cronológica decrescente (mais recente primeiro)';
            this.setFieldError(year1Field, message);
            return { isValid: false, message };
        }

        // Verificar ano futuro
        const currentYear = new Date().getFullYear();
        if (years[0] > currentYear) {
            const message = 'Ano base 1 não pode ser futuro';
            this.setFieldError(year1Field, message);
            return { isValid: false, message };
        }

        // Verificar período máximo (3 anos)
        if (years[0] - years[2] > 3) {
            const message = 'Período dos balanços não pode exceder 3 anos';
            this.setFieldError(year3Field, message);
            return { isValid: false, message };
        }

        // Limpar erros se tudo válido
        this.clearFieldError(year1Field);
        this.clearFieldError(year2Field);
        this.clearFieldError(year3Field);

        return { isValid: true, message: '' };
    }

    /**
     * Valida consistência financeira (variação máxima 50% entre anos)
     * @public
     * @returns {Object} { isValid: boolean, variations: Array, message: string }
     */
    validateFinancialConsistency() {
        const revenue1Field = document.querySelector('[name="receitaLiquida1"]');
        const revenue2Field = document.querySelector('[name="receitaLiquida2"]');
        const revenue3Field = document.querySelector('[name="receitaLiquida3"]');

        if (!revenue1Field || !revenue2Field || !revenue3Field) {
            return {
                isValid: false,
                variations: [],
                message: 'Campos de receita líquida não encontrados'
            };
        }

        const revenue1 = this.#parseFinancialValue(revenue1Field.value);
        const revenue2 = this.#parseFinancialValue(revenue2Field.value);
        const revenue3 = this.#parseFinancialValue(revenue3Field.value);

        // Se algum valor zero/vazio, não validar
        if (!revenue1 || !revenue2 || !revenue3) {
            return { isValid: true, variations: [], message: '' };
        }

        // Calcular variações
        const variation1to2 = Math.abs((revenue1 - revenue2) / revenue2);
        const variation2to3 = Math.abs((revenue2 - revenue3) / revenue3);

        const variations = [
            {
                period: 'Ano 1 → Ano 2',
                percentage: (variation1to2 * 100).toFixed(2),
                isHigh: variation1to2 > 0.5
            },
            {
                period: 'Ano 2 → Ano 3',
                percentage: (variation2to3 * 100).toFixed(2),
                isHigh: variation2to3 > 0.5
            }
        ];

        // Verificar variações extremas
        if (variation1to2 > 0.5 || variation2to3 > 0.5) {
            const message = 'Variação de receita superior a 50% entre anos - verificar consistência';
            console.warn('[ProGoiás Validator]', message);

            return {
                isValid: false,
                variations,
                message
            };
        }

        return {
            isValid: true,
            variations,
            message: ''
        };
    }

    /**
     * Valida dados de produto para salvar no IndexedDB
     * @public
     * @param {Object} produto - Dados do produto
     * @returns {Object} { isValid: boolean, errors: Array }
     */
    validateProduto(produto) {
        const errors = [];

        if (!produto) {
            return {
                isValid: false,
                errors: ['Produto não fornecido']
            };
        }

        // Validações obrigatórias
        if (!produto.nome || !produto.nome.trim()) {
            errors.push('Nome do produto é obrigatório');
        }

        if (produto.precoVenda === undefined || produto.precoVenda === null) {
            errors.push('Preço de venda é obrigatório para exibição na matriz');
        }

        if (produto.producaoMensal === undefined || produto.producaoMensal === null) {
            errors.push('Produção mensal é obrigatória para exibição na matriz');
        }

        // Validações de valores
        if (produto.precoVenda !== undefined && produto.precoVenda <= 0) {
            errors.push('Preço de venda deve ser maior que zero');
        }

        if (produto.producaoMensal !== undefined && produto.producaoMensal < 0) {
            errors.push('Produção mensal não pode ser negativa');
        }

        // Validações de percentuais (destinos)
        const percentuaisDestino = [
            produto.destinoGoiasPerc,
            produto.destinoOutrosEstadosPerc,
            produto.destinoExportacaoPerc
        ].filter(p => p !== undefined && p !== null);

        if (percentuaisDestino.length > 0) {
            const totalDestino = percentuaisDestino.reduce((sum, p) => sum + parseFloat(p || 0), 0);

            // Aceitar 100% ± 0.01% (margem de erro de arredondamento)
            if (Math.abs(totalDestino - 100) > 0.01) {
                errors.push(`Percentuais de destino devem somar 100% (atual: ${totalDestino.toFixed(2)}%)`);
            }
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Valida dados de insumo para salvar no IndexedDB
     * @public
     * @param {Object} insumo - Dados do insumo
     * @returns {Object} { isValid: boolean, errors: Array }
     */
    validateInsumo(insumo) {
        const errors = [];

        if (!insumo) {
            return {
                isValid: false,
                errors: ['Insumo não fornecido']
            };
        }

        // Validações obrigatórias
        if (!insumo.nome || !insumo.nome.trim()) {
            errors.push('Nome do insumo é obrigatório');
        }

        if (insumo.custoUnitario === undefined || insumo.custoUnitario === null) {
            errors.push('Custo unitário é obrigatório para cálculos');
        }

        // Validações de valores
        if (insumo.custoUnitario !== undefined && insumo.custoUnitario <= 0) {
            errors.push('Custo unitário deve ser maior que zero');
        }

        // Validações de percentuais (origens)
        const percentuaisOrigem = [
            insumo.origemGoiasPerc,
            insumo.origemOutrosEstadosPerc,
            insumo.origemImportacaoPerc
        ].filter(p => p !== undefined && p !== null);

        if (percentuaisOrigem.length > 0) {
            const totalOrigem = percentuaisOrigem.reduce((sum, p) => sum + parseFloat(p || 0), 0);

            // Aceitar 100% ± 0.01% (margem de erro de arredondamento)
            if (Math.abs(totalOrigem - 100) > 0.01) {
                errors.push(`Percentuais de origem devem somar 100% (atual: ${totalOrigem.toFixed(2)}%)`);
            }
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Valida percentuais de destino de produto
     * @public
     * @param {number} goias - Percentual Goiás
     * @param {number} outrosEstados - Percentual outros estados
     * @param {number} exportacao - Percentual exportação
     * @returns {Object} { isValid: boolean, total: number, message: string }
     */
    validateDestinoPercentages(goias, outrosEstados, exportacao) {
        const values = [goias, outrosEstados, exportacao].filter(v => v !== undefined && v !== null);

        if (values.length === 0) {
            return { isValid: true, total: 0, message: '' };
        }

        const total = values.reduce((sum, v) => sum + parseFloat(v || 0), 0);

        // Margem de erro de arredondamento: 0.01%
        if (Math.abs(total - 100) > 0.01) {
            return {
                isValid: false,
                total: total.toFixed(2),
                message: `Percentuais de destino devem somar 100% (atual: ${total.toFixed(2)}%)`
            };
        }

        return {
            isValid: true,
            total: total.toFixed(2),
            message: ''
        };
    }

    /**
     * Valida percentuais de origem de insumo
     * @public
     * @param {number} goias - Percentual Goiás
     * @param {number} outrosEstados - Percentual outros estados
     * @param {number} importacao - Percentual importação
     * @returns {Object} { isValid: boolean, total: number, message: string }
     */
    validateOrigemPercentages(goias, outrosEstados, importacao) {
        const values = [goias, outrosEstados, importacao].filter(v => v !== undefined && v !== null);

        if (values.length === 0) {
            return { isValid: true, total: 0, message: '' };
        }

        const total = values.reduce((sum, v) => sum + parseFloat(v || 0), 0);

        // Margem de erro de arredondamento: 0.01%
        if (Math.abs(total - 100) > 0.01) {
            return {
                isValid: false,
                total: total.toFixed(2),
                message: `Percentuais de origem devem somar 100% (atual: ${total.toFixed(2)}%)`
            };
        }

        return {
            isValid: true,
            total: total.toFixed(2),
            message: ''
        };
    }

    /**
     * Define erro de validação em um campo
     * @public
     * @param {HTMLElement} field - Campo
     * @param {string} message - Mensagem de erro
     */
    setFieldError(field, message) {
        field.classList.add('error');

        let errorElement = field.parentNode.querySelector('.error-message');
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.className = 'error-message show';
            field.parentNode.appendChild(errorElement);
        }

        errorElement.textContent = message;
        this.validationErrors.set(field.name, message);
    }

    /**
     * Limpa erro de validação de um campo
     * @public
     * @param {HTMLElement} field - Campo
     */
    clearFieldError(field) {
        field.classList.remove('error');

        const errorElement = field.parentNode.querySelector('.error-message');
        if (errorElement) {
            errorElement.remove();
        }

        this.validationErrors.delete(field.name);
    }

    /**
     * Limpa todos os erros de validação
     * @public
     */
    clearAllErrors() {
        this.validationErrors.clear();

        const errorElements = document.querySelectorAll('.error-message');
        errorElements.forEach(el => el.remove());

        const errorFields = document.querySelectorAll('.form-control.error');
        errorFields.forEach(field => field.classList.remove('error'));
    }

    /**
     * Verifica se existem erros de validação
     * @public
     * @returns {boolean} True se existem erros
     */
    hasErrors() {
        return this.validationErrors.size > 0;
    }

    /**
     * Retorna erros de validação
     * @public
     * @returns {Map} Mapa de erros (fieldName -> message)
     */
    getErrors() {
        return new Map(this.validationErrors);
    }

    /**
     * Parse valor financeiro
     * @private
     * @param {string} value - Valor para fazer parse
     * @returns {number} Valor numérico
     */
    #parseFinancialValue(value) {
        if (!value) return 0;
        const cleanValue = value.replace(/[^\d.,]/g, '').replace(',', '.');
        const parsed = parseFloat(cleanValue);
        return isNaN(parsed) ? 0 : parsed;
    }
}
