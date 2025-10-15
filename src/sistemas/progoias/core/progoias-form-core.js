/* =====================================
   PROGOIAS-FORM-CORE.JS
   Core específico do sistema ProGoiás
   Extraído de progoias-module.js - Sistema independente
   NO FALLBACKS - NO HARDCODED DATA
   ===================================== */

import { DocumentFormatter } from '@shared/formatters/document-formatter.js';
import { CurrencyFormatter } from '@shared/formatters/currency-formatter.js';
import { DateFormatter } from '@shared/formatters/date-formatter.js';

/**
 * Core do formulário ProGoiás
 * Responsável por navegação, coleta de dados, gerenciamento de produtos/insumos
 *
 * @class ProGoiasFormCore
 */
export class ProGoiasFormCore {
    /**
     * @param {Object} config - Configuração do ProGoiás (progoias-config.json)
     * @param {Object} storageManager - Gerenciador de armazenamento IndexedDB
     * @param {Object} validator - Validador ProGoiás
     */
    constructor(config, storageManager, validator) {
        if (!config) {
            throw new Error('ProGoiasFormCore: configuração obrigatória não fornecida');
        }

        if (!config.programType || config.programType !== 'ProGoiás') {
            throw new Error('ProGoiasFormCore: configuração deve ser do tipo ProGoiás');
        }

        if (!config.totalSteps) {
            throw new Error('ProGoiasFormCore: número total de steps (totalSteps) é obrigatório');
        }

        if (config.totalSteps !== 17) {
            throw new Error('ProGoiasFormCore: ProGoiás deve ter exatamente 17 seções');
        }

        if (!storageManager) {
            throw new Error('ProGoiasFormCore: storageManager obrigatório');
        }

        if (!validator) {
            throw new Error('ProGoiasFormCore: validator obrigatório');
        }

        this.config = config;
        this.storageManager = storageManager;
        this.validator = validator;

        this.currentStep = 1;
        this.totalSteps = 17;
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
            throw new Error('ProGoiasFormCore: elemento #projectForm não encontrado');
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

        // Setup cálculos automáticos específicos ProGoiás
        this.setupInvestmentCalculation();
        this.setupEmploymentCalculation();

        console.log('[ProGoiás Core] Inicializado com sucesso');
    }

    /**
     * Coleta dados do formulário e salva automaticamente
     * @private
     */
    async #collectAndSaveData() {
        this.collectFormData();

        try {
            await this.storageManager.saveFormData(this.formData, this.currentStep);

            if (this.elements.saveStatus) {
                this.elements.saveStatus.textContent = '💾 Salvo automaticamente';
                setTimeout(() => {
                    this.elements.saveStatus.textContent = '';
                }, 2000);
            }
        } catch (error) {
            console.error('[ProGoiás Core] Erro ao salvar:', error);
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
            programType: 'ProGoiás',
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
            throw new Error('ProGoiasFormCore: dados inválidos para setFormData');
        }

        this.formData = data;
    }

    /**
     * Verifica se existem dados salvos
     * @private
     */
    async #checkForSavedData() {
        try {
            const savedData = await this.storageManager.loadFormData();

            if (!savedData || !savedData.formData ||
                Object.keys(savedData.formData).length === 0) {
                return;
            }

            const shouldRestore = confirm('Dados salvos encontrados. Deseja restaurar?');
            if (shouldRestore) {
                await this.restoreFormData(savedData);
            }
        } catch (error) {
            console.error('[ProGoiás Core] Erro ao verificar dados salvos:', error);
        }
    }

    /**
     * Restaura dados do formulário
     * @public
     * @param {Object} savedData - Dados salvos para restaurar
     */
    async restoreFormData(savedData) {
        if (!savedData || !savedData.formData) {
            throw new Error('ProGoiasFormCore: dados salvos inválidos para restauração');
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
        this.ensureSingleActiveSection();

        // Mostrar seção restaurada
        this.showSection(this.currentStep);

        // Disparar evento customizado após restauração completa
        document.dispatchEvent(new CustomEvent('progoiasFormDataRestored', {
            detail: { formData: this.formData, currentStep: this.currentStep }
        }));

        console.log(`[ProGoiás Core] Dados restaurados - navegando para seção ${this.currentStep}`);
    }

    /**
     * Garante que apenas a seção atual está visível
     * CRITICAL FIX: Corrige estados inconsistentes após restauração/importação
     * @public
     */
    ensureSingleActiveSection() {
        console.log(`🔧 [ProGoiás Core] Normalizando estado de navegação...`);

        // 1. Esconder TODAS as seções primeiro (exceto a atual)
        for (let i = 1; i <= this.totalSteps; i++) {
            if (i !== this.currentStep) {
                const section = document.querySelector(`[data-section="${i}"]`);
                if (section) {
                    section.classList.remove('active');
                    section.style.display = 'none';
                }
            }
        }

        // 2. Mostrar APENAS a seção atual
        const currentSection = document.querySelector(`[data-section="${this.currentStep}"]`);
        if (currentSection) {
            currentSection.classList.add('active');
            currentSection.style.display = 'block';
        } else {
            console.error(`❌ [ProGoiás Core] Seção ${this.currentStep} não encontrada no DOM`);
        }

        console.log(`✓ [ProGoiás Core] Estado normalizado: apenas Seção ${this.currentStep} visível`);
    }

    /**
     * Navega para próxima seção
     * @public
     */
    goToNextStep() {
        if (window.tabNavigation) {
            const nextTab = window.tabNavigation.getCurrentTab() + 1;
            if (nextTab <= this.totalSteps) {
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
        if (step < 1 || step > this.totalSteps) {
            throw new Error(`ProGoiasFormCore: step ${step} inválido (1-${this.totalSteps})`);
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
            console.warn(`ProGoiasFormCore: seção ${this.currentStep} não encontrada`);
            return true;
        }

        return this.validator.validateSection(currentSection);
    }

    /**
     * Limpa todos os dados
     * @public
     */
    async clearAllData() {
        const confirmed = confirm('Tem certeza que deseja limpar todos os dados? Esta ação não pode ser desfeita.');

        if (!confirmed) {
            return false;
        }

        try {
            await this.storageManager.clearStorage();
            this.formData = {};
            this.currentStep = 1;
            this.elements.form.reset();
            this.showSection(1);

            console.log('[ProGoiás Core] Dados limpos');
            return true;
        } catch (error) {
            console.error('[ProGoiás Core] Erro ao limpar dados:', error);
            throw error;
        }
    }

    /**
     * Setup cálculo automático de investimentos (12 campos)
     * NO FALLBACK: Só atualiza se houver valores
     * @public
     */
    setupInvestmentCalculation() {
        const investmentFields = [
            'terrenos', 'obrasPreliminares', 'obrasCivis',
            'maquinaValor1', 'maquinaValor2', 'maquinaValor3',
            'equipamentosInformatica', 'veiculos', 'moveisUtensilios',
            'intangiveis', 'marcasPatentes', 'demaisInvestimentos'
        ];

        const calculateTotal = () => {
            let total = 0;
            let hasValues = false;

            investmentFields.forEach(fieldName => {
                const field = document.querySelector(`[name="${fieldName}"]`);
                if (!field) return;

                if (field.value && field.value.trim()) {
                    hasValues = true;
                    // Remove máscara de moeda e converte
                    const cleanValue = field.value.replace(/[^\d,]/g, '').replace(',', '.');
                    const value = parseFloat(cleanValue);

                    if (!isNaN(value)) {
                        total += value;
                    }
                }
            });

            // Só atualiza se houver valores (NO FALLBACK)
            const totalField = document.getElementById('valorTotalInvestimento');
            const displayField = document.getElementById('totalInvestimentos');

            if (totalField && hasValues) {
                totalField.value = total.toFixed(2);
            } else if (totalField) {
                totalField.value = '';
            }

            if (displayField) {
                if (hasValues) {
                    displayField.textContent = CurrencyFormatter.formatBRL(total);
                } else {
                    displayField.textContent = 'R$ 0,00';
                }
            }
        };

        // Listener em todos os campos de investimento
        investmentFields.forEach(fieldName => {
            const field = document.querySelector(`[name="${fieldName}"]`);
            if (field) {
                field.addEventListener('input', calculateTotal);
                field.addEventListener('change', calculateTotal);
            }
        });

        // Cálculo inicial
        calculateTotal();
    }

    /**
     * Setup cálculo automático de empregos (ano 1 e ano 3)
     * NO FALLBACK: Só atualiza se houver valores
     * @public
     */
    setupEmploymentCalculation() {
        const employmentFields = {
            ano1: ['qtdAno1Diretoria', 'qtdAno1Fixa', 'qtdAno1Variavel'],
            ano3: ['qtdAno3Diretoria', 'qtdAno3Fixa', 'qtdAno3Variavel']
        };

        const calculateEmployment = () => {
            // Ano 1 (empregos diretos)
            let totalAno1 = 0;
            let hasValuesAno1 = false;

            employmentFields.ano1.forEach(fieldName => {
                const field = document.querySelector(`[name="${fieldName}"]`);
                if (!field) return;

                if (field.value && field.value.trim()) {
                    hasValuesAno1 = true;
                    const value = parseInt(field.value, 10);

                    if (!isNaN(value)) {
                        totalAno1 += value;
                    }
                }
            });

            // Ano 3 (projeção)
            let totalAno3 = 0;
            let hasValuesAno3 = false;

            employmentFields.ano3.forEach(fieldName => {
                const field = document.querySelector(`[name="${fieldName}"]`);
                if (!field) return;

                if (field.value && field.value.trim()) {
                    hasValuesAno3 = true;
                    const value = parseInt(field.value, 10);

                    if (!isNaN(value)) {
                        totalAno3 += value;
                    }
                }
            });

            // Atualizar campos APENAS se houver valores (NO FALLBACK)
            const empregosField = document.getElementById('empregosDiretos');
            const ano3Field = document.getElementById('empregosAno3');

            if (empregosField) {
                empregosField.value = hasValuesAno1 ? totalAno1 : '';
            }

            if (ano3Field) {
                ano3Field.value = hasValuesAno3 ? totalAno3 : '';
            }
        };

        // Listeners
        [...employmentFields.ano1, ...employmentFields.ano3].forEach(fieldName => {
            const field = document.querySelector(`[name="${fieldName}"]`);
            if (field) {
                field.addEventListener('input', calculateEmployment);
                field.addEventListener('change', calculateEmployment);
            }
        });

        calculateEmployment();
    }

    /**
     * Adiciona nova entrada de produto (Seção 5)
     * Clona template, atualiza índices, aplica validações
     * @public
     */
    addProdutoEntry() {
        const container = document.getElementById('produtos-container');
        if (!container) {
            throw new Error('ProGoiasFormCore: container #produtos-container não encontrado');
        }

        const entries = container.querySelectorAll('.produto-entry');
        const newIndex = entries.length + 1;

        console.log(`➕ [ProGoiás Core] Adicionando produto ${newIndex}...`);

        // Clonar primeira entrada (template)
        const template = entries[0].cloneNode(true);

        // Atualizar todos os name/id attributes
        this.#updateEntryIndexes(template, 'produto', newIndex);

        // Limpar todos os valores
        this.#clearEntryValues(template);

        // Adicionar botão "Remover"
        this.#addRemoveButton(template, 'produto', newIndex);

        // Inserir no container
        container.appendChild(template);

        // Aplicar máscaras aos campos currency
        this.#applyMasksToEntry(template);

        // Configurar calculadora de percentuais para destinos
        if (window.PercentageCalculator) {
            window.PercentageCalculator.setupProductDestinations(newIndex);
        }

        console.log(`✓ [ProGoiás Core] Produto ${newIndex} adicionado com sucesso`);
    }

    /**
     * Adiciona nova entrada de insumo (Seção 6)
     * Clona template, atualiza índices, aplica validações
     * @public
     */
    addInsumoEntry() {
        const container = document.getElementById('insumos-container');
        if (!container) {
            throw new Error('ProGoiasFormCore: container #insumos-container não encontrado');
        }

        const entries = container.querySelectorAll('.insumo-entry');
        const newIndex = entries.length + 1;

        console.log(`➕ [ProGoiás Core] Adicionando insumo ${newIndex}...`);

        // Clonar primeira entrada (template)
        const template = entries[0].cloneNode(true);

        // Atualizar todos os name/id attributes
        this.#updateEntryIndexes(template, 'insumo', newIndex);

        // Limpar todos os valores
        this.#clearEntryValues(template);

        // Adicionar botão "Remover"
        this.#addRemoveButton(template, 'insumo', newIndex);

        // Inserir no container
        container.appendChild(template);

        // Aplicar máscaras aos campos currency
        this.#applyMasksToEntry(template);

        // Configurar calculadora de percentuais para origens
        if (window.PercentageCalculator) {
            window.PercentageCalculator.setupInsumoOrigins(newIndex);
        }

        console.log(`✓ [ProGoiás Core] Insumo ${newIndex} adicionado com sucesso`);
    }

    /**
     * Remove uma entrada de produto/insumo
     * @public
     * @param {string} type - Tipo (produto ou insumo)
     * @param {number} index - Índice da entrada a remover
     */
    removeEntry(type, index) {
        const typeName = type === 'produto' ? 'Produto' : 'Insumo';

        if (!confirm(`Tem certeza que deseja remover este ${typeName.toLowerCase()}?`)) {
            return;
        }

        const container = document.getElementById(`${type}s-container`);
        const entries = container.querySelectorAll(`.${type}-entry`);

        // Não permitir remover se for o último
        if (entries.length === 1) {
            throw new Error(`Não é possível remover o único ${typeName.toLowerCase()}. Pelo menos um ${typeName.toLowerCase()} deve existir.`);
        }

        // Encontrar entrada específica pelo índice
        let targetEntry = null;
        entries.forEach(entry => {
            const firstInput = entry.querySelector(`input[name^="${type}"]`);
            if (firstInput) {
                const match = firstInput.name.match(new RegExp(`${type}(\\d+)`));
                if (match && parseInt(match[1]) === index) {
                    targetEntry = entry;
                }
            }
        });

        if (targetEntry) {
            targetEntry.remove();
            console.log(`✓ [ProGoiás Core] ${typeName} ${index} removido`);

            // Auto-save após remoção
            this.#collectAndSaveData();
        } else {
            throw new Error(`Não foi possível encontrar ${typeName} ${index} para remover`);
        }
    }

    /**
     * Atualiza índices de name/id em uma entrada clonada
     * @private
     * @param {HTMLElement} element - Elemento clonado
     * @param {string} prefix - Prefixo (produto ou insumo)
     * @param {number} newIndex - Novo índice
     */
    #updateEntryIndexes(element, prefix, newIndex) {
        // Regex para capturar padrões como: produto1Nome, produto1DestinoGoiasPerc, etc.
        const nameRegex = new RegExp(`${prefix}1([A-Z][a-zA-Z]*)`, 'g');
        const idRegex = new RegExp(`${prefix}1([A-Z][a-zA-Z]*)`, 'g');

        // Atualizar todos os elementos com name
        element.querySelectorAll('[name]').forEach(field => {
            const oldName = field.getAttribute('name');
            const newName = oldName.replace(nameRegex, `${prefix}${newIndex}$1`);
            field.setAttribute('name', newName);
        });

        // Atualizar todos os elementos com id
        element.querySelectorAll('[id]').forEach(field => {
            const oldId = field.getAttribute('id');
            const newId = oldId.replace(idRegex, `${prefix}${newIndex}$1`);
            field.setAttribute('id', newId);
        });

        console.log(`  ↳ Índices atualizados: ${prefix}1* → ${prefix}${newIndex}*`);
    }

    /**
     * Limpa valores de todos os campos em uma entrada
     * @private
     * @param {HTMLElement} element - Elemento a limpar
     */
    #clearEntryValues(element) {
        element.querySelectorAll('input:not([readonly]), select, textarea').forEach(field => {
            if (field.type === 'checkbox' || field.type === 'radio') {
                field.checked = false;
            } else if (field.tagName === 'SELECT') {
                field.selectedIndex = 0;
            } else {
                field.value = '';
            }
        });

        console.log('  ↳ Valores limpos');
    }

    /**
     * Adiciona botão "Remover" a uma entrada
     * @private
     * @param {HTMLElement} element - Elemento que receberá o botão
     * @param {string} type - Tipo (produto ou insumo)
     * @param {number} index - Índice da entrada
     */
    #addRemoveButton(element, type, index) {
        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = 'btn btn-danger btn-sm remove-entry-btn';
        removeBtn.textContent = '🗑️ Remover ' + (type === 'produto' ? 'Produto' : 'Insumo');
        removeBtn.style.marginBottom = '1rem';
        removeBtn.onclick = () => this.removeEntry(type, index);

        // Inserir no topo do entry (primeiro filho)
        element.insertBefore(removeBtn, element.firstChild);

        console.log('  ↳ Botão remover adicionado');
    }

    /**
     * Aplica máscaras monetárias aos campos de uma entrada
     * @private
     * @param {HTMLElement} element - Elemento que contém os campos
     */
    #applyMasksToEntry(element) {
        const currencyFields = element.querySelectorAll('[data-mask="currency"]');

        if (currencyFields.length > 0 && window.currencyMask) {
            currencyFields.forEach(field => {
                window.currencyMask.applyMask(field);
            });
            console.log(`  ↳ Máscaras aplicadas a ${currencyFields.length} campos`);
        }
    }

    /**
     * Retorna configuração
     * @public
     * @returns {Object} Configuração ProGoiás
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
        if (step < 1 || step > this.totalSteps) {
            throw new Error(`ProGoiasFormCore: step ${step} inválido (1-${this.totalSteps})`);
        }

        this.currentStep = step;
    }
}
