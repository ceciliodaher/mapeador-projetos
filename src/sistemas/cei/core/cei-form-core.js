/* =====================================
   CEI-FORM-CORE.JS
   Core específico do sistema CEI
   Extraído de core.js - Sistema independente
   NO FALLBACKS - NO HARDCODED DATA
   ===================================== */

import { DocumentFormatter } from '@shared/formatters/document-formatter.js';
import { CurrencyFormatter } from '@shared/formatters/currency-formatter.js';
import { DateFormatter } from '@shared/formatters/date-formatter.js';

/**
 * Core do formulário CEI
 * Responsável por navegação, coleta de dados e integração com outros componentes
 *
 * @class CEIFormCore
 */
export class CEIFormCore {
    /**
     * @param {Object} config - Configuração do CEI (cei-config.json)
     * @param {Object} storageManager - Gerenciador de armazenamento
     * @param {Object} validator - Validador CEI
     */
    constructor(config, storageManager, validator) {
        if (!config) {
            throw new Error('CEIFormCore: configuração obrigatória não fornecida');
        }

        if (!config.programType || config.programType !== 'CEI') {
            throw new Error('CEIFormCore: configuração deve ser do tipo CEI');
        }

        if (!config.totalSteps) {
            throw new Error('CEIFormCore: número total de steps (totalSteps) é obrigatório');
        }

        if (!storageManager) {
            throw new Error('CEIFormCore: storageManager obrigatório');
        }

        if (!validator) {
            throw new Error('CEIFormCore: validator obrigatório');
        }

        this.config = config;
        this.storageManager = storageManager;
        this.validator = validator;

        this.currentStep = 1;
        this.formData = {};
        this.uploadedFiles = {};

        this.elements = this.#getDOMElements();
        this.#init();
    }

    /**
     * Obtém elementos do DOM necessários
     * @private
     * @returns {Object} Elementos do DOM
     */
    #getDOMElements() {
        const form = document.getElementById('projectForm');

        if (!form) {
            throw new Error('CEIFormCore: elemento #projectForm não encontrado');
        }

        return {
            form,
            progressText: document.getElementById('progressText'),
            saveStatus: document.getElementById('saveStatus'),
            previewModal: document.getElementById('previewModal'),
            previewContent: document.getElementById('previewContent'),
            modalClose: document.querySelector('#previewModal .modal-close'),
            editBtn: document.getElementById('editBtn')
        };
    }

    /**
     * Inicializa o core
     * @private
     */
    #init() {
        // Setup event listeners
        this.elements.form.addEventListener('input', () => this.#collectAndSaveData());
        this.elements.form.addEventListener('change', () => this.#collectAndSaveData());

        // Validação em blur
        document.addEventListener('blur', (e) => {
            if (e.target && typeof e.target.matches === 'function' &&
                e.target.matches('.form-control')) {
                this.validator.validateField(e.target);
            }
        }, true);

        // Verificar dados salvos
        this.#checkForSavedData();

        // Inicializar navegação (se tabs.js presente)
        if (window.tabNavigation) {
            this.showSection(this.currentStep);
        }
    }

    /**
     * Coleta dados do formulário e salva automaticamente
     * @private
     */
    #collectAndSaveData() {
        this.collectFormData();
        this.storageManager.saveFormData(this.formData, this.currentStep);

        if (this.elements.saveStatus) {
            this.elements.saveStatus.textContent = '💾 Salvo automaticamente';
            setTimeout(() => {
                this.elements.saveStatus.textContent = '';
            }, 2000);
        }
    }

    /**
     * Coleta dados do formulário
     * @public
     */
    collectFormData() {
        const formData = new FormData(this.elements.form);
        this.formData = {};

        for (const [key, value] of formData.entries()) {
            // Ignorar File objects
            if (value instanceof File) {
                continue;
            }

            // Apenas valores não-vazios
            if (typeof value === 'string' && value.trim()) {
                this.formData[key] = value;
            }
        }

        // Adicionar metadata
        this.formData._metadata = {
            programType: 'CEI',
            currentStep: this.currentStep,
            lastModified: new Date().toISOString(),
            version: '2.0'
        };
    }

    /**
     * Retorna dados do formulário
     * @public
     * @returns {Object} Dados do formulário
     */
    getFormData() {
        return this.formData;
    }

    /**
     * Define dados do formulário
     * @public
     * @param {Object} data - Dados para definir
     */
    setFormData(data) {
        if (!data || typeof data !== 'object') {
            throw new Error('CEIFormCore: dados inválidos para setFormData');
        }

        this.formData = data;
    }

    /**
     * Verifica se existem dados salvos
     * @private
     */
    #checkForSavedData() {
        const savedData = this.storageManager.loadFormData();

        if (!savedData || !savedData.formData ||
            Object.keys(savedData.formData).length === 0) {
            return;
        }

        const shouldRestore = confirm('Dados salvos encontrados. Deseja restaurar?');
        if (shouldRestore) {
            this.restoreFormData(savedData);
        }
    }

    /**
     * Restaura dados do formulário
     * @public
     * @param {Object} savedData - Dados salvos para restaurar
     */
    restoreFormData(savedData) {
        if (!savedData || !savedData.formData) {
            throw new Error('CEIFormCore: dados salvos inválidos para restauração');
        }

        this.formData = savedData.formData;

        // Restaurar step salvo
        if (savedData.currentStep !== undefined && savedData.currentStep !== null) {
            this.currentStep = savedData.currentStep;
        } else {
            this.currentStep = 1;
        }

        // Popular campos do formulário
        Object.entries(this.formData).forEach(([key, value]) => {
            // Ignorar campos internos (começam com _)
            if (key.startsWith('_')) return;

            const field = document.querySelector(`[name="${key}"]`);
            if (field) {
                field.value = value;
                // Disparar eventos para atualizar cálculos automáticos
                field.dispatchEvent(new Event('change', { bubbles: true }));
                field.dispatchEvent(new Event('input', { bubbles: true }));
            }
        });

        // Ocultar todas as seções antes de mostrar a correta
        const allSections = document.querySelectorAll('.form-section');
        allSections.forEach(section => {
            section.style.display = 'none';
            section.classList.remove('active');
        });

        // Mostrar seção restaurada
        this.showSection(this.currentStep);

        // Disparar evento customizado após restauração completa
        document.dispatchEvent(new CustomEvent('ceiFormDataRestored', {
            detail: { formData: this.formData, currentStep: this.currentStep }
        }));

        console.log(`[CEI Core] Dados restaurados - navegando para seção ${this.currentStep}`);
    }

    /**
     * Navega para próxima seção
     * @public
     */
    goToNextStep() {
        if (window.tabNavigation) {
            const nextTab = window.tabNavigation.getCurrentTab() + 1;
            if (nextTab <= this.config.totalSteps) {
                window.tabNavigation.switchToTab(nextTab);
                this.currentStep = nextTab;
            }
        }
    }

    /**
     * Navega para seção anterior
     * @public
     */
    goToPreviousStep() {
        if (window.tabNavigation) {
            const prevTab = window.tabNavigation.getCurrentTab() - 1;
            if (prevTab >= 1) {
                window.tabNavigation.switchToTab(prevTab);
                this.currentStep = prevTab;
            }
        }
    }

    /**
     * Mostra seção específica
     * @public
     * @param {number} step - Número da seção
     */
    showSection(step) {
        if (step < 1 || step > this.config.totalSteps) {
            throw new Error(`CEIFormCore: step ${step} inválido (1-${this.config.totalSteps})`);
        }

        this.currentStep = step;

        if (window.tabNavigation) {
            window.tabNavigation.switchToTab(step);
        }
    }

    /**
     * Valida seção atual
     * @public
     * @returns {boolean} True se válido
     */
    validateCurrentSection() {
        const currentSection = document.querySelector(`[data-section="${this.currentStep}"]`);
        if (!currentSection) {
            console.warn(`CEIFormCore: seção ${this.currentStep} não encontrada`);
            return true;
        }

        return this.validator.validateSection(currentSection);
    }

    /**
     * Limpa todos os dados
     * @public
     */
    clearAllData() {
        const confirmed = confirm('Tem certeza que deseja limpar todos os dados? Esta ação não pode ser desfeita.');

        if (!confirmed) {
            return false;
        }

        this.storageManager.clearStorage();
        this.formData = {};
        this.currentStep = 1;
        this.elements.form.reset();
        this.showSection(1);

        console.log('[CEI Core] Dados limpos');
        return true;
    }

    /**
     * Retorna configuração
     * @public
     * @returns {Object} Configuração CEI
     */
    getConfig() {
        return this.config;
    }

    /**
     * Retorna step atual
     * @public
     * @returns {number} Step atual
     */
    getCurrentStep() {
        return this.currentStep;
    }

    /**
     * Define step atual
     * @public
     * @param {number} step - Novo step
     */
    setCurrentStep(step) {
        if (step < 1 || step > this.config.totalSteps) {
            throw new Error(`CEIFormCore: step ${step} inválido (1-${this.config.totalSteps})`);
        }

        this.currentStep = step;
    }
}
