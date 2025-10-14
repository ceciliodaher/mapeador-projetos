/* =====================================
   CEI-VALIDATOR.JS
   Validações específicas do formulário CEI
   NO FALLBACKS - NO HARDCODED DATA
   ===================================== */

import { DocumentValidator } from '@shared/validators/document-validator.js';
import { EmailValidator } from '@shared/validators/email-validator.js';
import { CurrencyFormatter } from '@shared/formatters/currency-formatter.js';
import { PATTERNS, ERROR_MESSAGES } from '@shared/constants/patterns.js';

/**
 * Validador para formulário CEI
 * Responsável por todas as validações específicas do programa CEI
 *
 * @class CEIValidator
 */
export class CEIValidator {
    /**
     * @param {Object} config - Configuração CEI com validationRules
     */
    constructor(config) {
        if (!config) {
            throw new Error('CEIValidator: configuração obrigatória não fornecida');
        }

        if (!config.validationRules) {
            throw new Error('CEIValidator: validationRules obrigatórias na configuração');
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
            throw new Error('CEIValidator: campo inválido para validação');
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

        // Validações específicas CEI por nome do campo
        if (fieldName === 'valorTotalInvestimento') {
            return this.validateInvestmentAmount(field);
        }

        if (fieldName === 'prazoExecucao') {
            return this.validateScheduleDuration(field);
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
            throw new Error('CEIValidator: seção inválida para validação');
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
     * Valida valor do investimento
     * @public
     * @param {HTMLElement} field - Campo de investimento
     * @returns {boolean} True se válido
     */
    validateInvestmentAmount(field) {
        const value = this.#parseFinancialValue(field.value);

        if (value <= 0) {
            this.setFieldError(field, 'Valor do investimento deve ser maior que zero');
            return false;
        }

        // Validar investimento mínimo (se configurado)
        if (this.config.validationRules.investimentoMinimo !== undefined &&
            this.config.validationRules.investimentoMinimo !== null) {
            if (value < this.config.validationRules.investimentoMinimo) {
                const minValue = CurrencyFormatter.formatBRL(this.config.validationRules.investimentoMinimo);
                this.setFieldError(field, `CEI requer investimento mínimo de ${minValue}`);
                return false;
            }
        }

        return true;
    }

    /**
     * Valida prazo de execução
     * @public
     * @param {HTMLElement} field - Campo de prazo
     * @returns {boolean} True se válido
     */
    validateScheduleDuration(field) {
        const value = parseInt(field.value);

        if (isNaN(value) || value <= 0) {
            this.setFieldError(field, 'Prazo deve ser um número positivo');
            return false;
        }

        // Validar prazo máximo (se configurado)
        if (this.config.validationRules.prazoMaximo !== undefined &&
            this.config.validationRules.prazoMaximo !== null) {
            if (value > this.config.validationRules.prazoMaximo) {
                this.setFieldError(field,
                    `CEI permite prazo máximo de ${this.config.validationRules.prazoMaximo} meses`);
                return false;
            }
        }

        return true;
    }

    /**
     * Valida percentual mínimo de investimento
     * @public
     * @param {number} totalInvestment - Investimento total
     * @param {number} operationValue - Valor da operação
     * @returns {Object} { isValid: boolean, percentage: number, message: string }
     */
    validateInvestmentPercentage(totalInvestment, operationValue) {
        if (!totalInvestment || !operationValue) {
            return { isValid: true, percentage: 0, message: '' };
        }

        if (operationValue <= 0) {
            return {
                isValid: false,
                percentage: 0,
                message: 'Valor da operação deve ser maior que zero'
            };
        }

        const percentage = (totalInvestment / operationValue) * 100;

        // Validar percentual mínimo (se configurado)
        if (this.config.validationRules.percentualMinimo !== undefined &&
            this.config.validationRules.percentualMinimo !== null) {
            if (percentage < this.config.validationRules.percentualMinimo) {
                return {
                    isValid: false,
                    percentage: percentage.toFixed(2),
                    message: `Investimento deve ser no mínimo ${this.config.validationRules.percentualMinimo}% do valor da operação`
                };
            }
        }

        return {
            isValid: true,
            percentage: percentage.toFixed(2),
            message: ''
        };
    }

    /**
     * Valida intervalo de datas
     * @public
     * @param {string|Date} startDate - Data inicial
     * @param {string|Date} endDate - Data final
     * @returns {Object} { isValid: boolean, diffMonths: number, message: string }
     */
    validateDateRange(startDate, endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return {
                isValid: false,
                diffMonths: 0,
                message: 'Datas inválidas'
            };
        }

        if (start >= end) {
            return {
                isValid: false,
                diffMonths: 0,
                message: 'Data de término deve ser posterior à data de início'
            };
        }

        const diffMonths = (end.getFullYear() - start.getFullYear()) * 12 +
            (end.getMonth() - start.getMonth());

        // Validar prazo máximo (se configurado)
        if (this.config.validationRules.prazoMaximo !== undefined &&
            this.config.validationRules.prazoMaximo !== null) {
            if (diffMonths > this.config.validationRules.prazoMaximo) {
                return {
                    isValid: false,
                    diffMonths,
                    message: `Período não pode exceder ${this.config.validationRules.prazoMaximo} meses`
                };
            }
        }

        return {
            isValid: true,
            diffMonths,
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
