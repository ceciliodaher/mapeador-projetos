/* =====================================
   PROGOIAS-APP.JS
   Aplicação principal do sistema ProGoiás
   Sistema independente - migrado de progoias-module.js
   NO FALLBACKS - NO HARDCODED DATA
   ===================================== */

import { ProGoiasFormCore } from './core/progoias-form-core.js';
import { ProGoiasStorageManager } from './storage/progoias-storage-manager.js';
import { ProGoiasValidator } from './validators/progoias-validator.js';
import { DocumentFormatter } from '@shared/formatters/document-formatter.js';
import { CurrencyFormatter } from '@shared/formatters/currency-formatter.js';
import { DateFormatter } from '@shared/formatters/date-formatter.js';
import { Toast } from '@shared/ui/toast.js';

/**
 * Aplicação ProGoiás
 * Coordena core, storage, validator, matriz e exportação
 *
 * @class ProGoiasApp
 */
class ProGoiasApp {
    constructor() {
        this.config = null;
        this.core = null;
        this.storageManager = null;
        this.validator = null;
        this.dbManager = null; // IndexedDB manager direto (se precisar de acesso)
        this.matrizManager = null; // Matriz produto-insumo (lazy loading)

        this.init();
    }

    async init() {
        try {
            await this.loadConfig();
            await this.initializeModules();
            this.setupEventListeners();
            this.setupProGoiasValidations();
            this.setupFileHandlers();

            console.log('[ProGoiás App] Inicializado com sucesso');
        } catch (error) {
            console.error('[ProGoiás App] Erro na inicialização:', error);
            Toast.error(`Erro ao inicializar aplicação ProGoiás: ${error.message}`);
        }
    }

    async loadConfig() {
        try {
            const response = await fetch('/config/progoias-config.json');
            if (!response.ok) {
                throw new Error(`Erro HTTP: ${response.status}`);
            }

            this.config = await response.json();

            if (!this.config.programType || this.config.programType !== 'ProGoiás') {
                throw new Error('Configuração ProGoiás inválida - programType incorreto');
            }

            console.log('[ProGoiás App] Configuração carregada:', this.config.programType);
        } catch (error) {
            throw new Error(`Erro ao carregar configuração ProGoiás: ${error.message}`);
        }
    }

    async initializeModules() {
        // Inicializar na ordem correta:
        // 1. Storage primeiro (precisa init async)
        this.storageManager = new ProGoiasStorageManager(this.config);
        await this.storageManager.init();

        // Obter dbManager direto (se precisar)
        this.dbManager = this.storageManager.getDBManager();

        // 2. Validator
        this.validator = new ProGoiasValidator(this.config);

        // 3. Core por último (depende de storage e validator)
        this.core = new ProGoiasFormCore(this.config, this.storageManager, this.validator);

        console.log('[ProGoiás App] Módulos inicializados');
    }

    setupEventListeners() {
        // Botões de exportação (header)
        const exportJsonBtn = document.getElementById('exportJsonBtn');
        const exportExcelBtn = document.getElementById('exportExcelBtn');
        const exportPDFBtn = document.getElementById('exportPDFBtn');

        if (exportJsonBtn) {
            exportJsonBtn.addEventListener('click', () => this.handleExport('json'));
        }
        if (exportExcelBtn) {
            exportExcelBtn.addEventListener('click', () => this.handleExport('excel'));
        }
        if (exportPDFBtn) {
            exportPDFBtn.addEventListener('click', () => this.handleExport('pdf'));
        }

        // Botões de exportação (modal)
        const exportJsonBtnModal = document.getElementById('exportJsonBtnModal');
        const exportExcelBtnModal = document.getElementById('exportExcelBtnModal');
        const exportPDFBtnModal = document.getElementById('exportPDFBtnModal');

        if (exportJsonBtnModal) {
            exportJsonBtnModal.addEventListener('click', () => this.handleExport('json'));
        }
        if (exportExcelBtnModal) {
            exportExcelBtnModal.addEventListener('click', () => this.handleExport('excel'));
        }
        if (exportPDFBtnModal) {
            exportPDFBtnModal.addEventListener('click', () => this.handleExport('pdf'));
        }

        // Botão limpar dados
        const clearBtn = document.getElementById('clearBtn');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.handleClearData());
        }

        // Botão preview
        const previewBtn = document.getElementById('previewBtn');
        if (previewBtn) {
            previewBtn.addEventListener('click', () => this.handlePreview());
        }

        // Botões adicionar produto/insumo
        const addProdutoBtn = document.getElementById('addProduto');
        const addInsumoBtn = document.getElementById('addInsumo');

        if (addProdutoBtn) {
            addProdutoBtn.addEventListener('click', () => this.core.addProdutoEntry());
        }

        if (addInsumoBtn) {
            addInsumoBtn.addEventListener('click', () => this.core.addInsumoEntry());
        }

        console.log('[ProGoiás App] Event listeners configurados');
    }

    setupFileHandlers() {
        const importBtn = document.getElementById('importBtnHeader');
        const importFile = document.getElementById('importJsonFileHeader');

        if (importBtn && importFile) {
            importBtn.addEventListener('click', () => importFile.click());
            importFile.addEventListener('change', (e) => this.handleImport(e));
        }
    }

    setupProGoiasValidations() {
        // Validação de empregos mínimos
        const empregosField = document.querySelector('[name="empregosDiretos"]');
        if (empregosField) {
            empregosField.addEventListener('blur', () => {
                this.validator.validateField(empregosField);
            });
        }

        // Validação de anos dos balanços
        this.setupBalanceYearValidation();

        // Validação de consistência financeira
        this.setupFinancialValidation();

        console.log('[ProGoiás App] Validações ProGoiás configuradas');
    }

    setupBalanceYearValidation() {
        const yearFields = ['anoBase1', 'anoBase2', 'anoBase3'];

        yearFields.forEach(fieldName => {
            const field = document.querySelector(`[name="${fieldName}"]`);
            if (field) {
                field.addEventListener('blur', () => {
                    const result = this.validator.validateBalanceYears();
                    if (!result.isValid && result.message) {
                        Toast.warning(result.message);
                    }
                });
            }
        });
    }

    setupFinancialValidation() {
        const revenueFields = ['receitaLiquida1', 'receitaLiquida2', 'receitaLiquida3'];

        revenueFields.forEach(fieldName => {
            const field = document.querySelector(`[name="${fieldName}"]`);
            if (field) {
                field.addEventListener('blur', () => {
                    const result = this.validator.validateFinancialConsistency();
                    if (!result.isValid && result.message) {
                        Toast.warning(result.message);
                    }
                });
            }
        });
    }

    handleExport(format) {
        try {
            this.core.collectFormData();
            const formData = this.core.getFormData();

            if (Object.keys(formData).length === 0) {
                Toast.warning('Nenhum dado para exportar');
                return;
            }

            // TODO: Implementar exportadores específicos (JSON, Excel, PDF)
            // Por enquanto, usa os exportadores legados do FormExporter

            if (window.FormExporter) {
                const exporter = new window.FormExporter(this.config, formData);

                switch (format) {
                    case 'json':
                        exporter.exportToJSON();
                        Toast.success('Dados exportados em JSON');
                        break;
                    case 'excel':
                        exporter.exportToExcel();
                        Toast.success('Dados exportados em Excel');
                        break;
                    case 'pdf':
                        exporter.exportToPDF();
                        Toast.success('Dados exportados em PDF');
                        break;
                    default:
                        throw new Error(`Formato '${format}' não suportado`);
                }
            } else {
                throw new Error('FormExporter não disponível');
            }

            console.log(`[ProGoiás App] Exportação ${format} concluída`);
        } catch (error) {
            console.error('[ProGoiás App] Erro na exportação:', error);
            Toast.error(`Erro ao exportar: ${error.message}`);
        }
    }

    async handleImport(event) {
        try {
            const file = event.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    await this.storageManager.importData(data);
                    await this.core.restoreFormData({ formData: data });
                    Toast.success('Dados importados com sucesso');
                } catch (error) {
                    console.error('[ProGoiás App] Erro ao processar arquivo:', error);
                    Toast.error(`Erro ao importar: ${error.message}`);
                }
            };
            reader.readAsText(file);
        } catch (error) {
            console.error('[ProGoiás App] Erro na importação:', error);
            Toast.error(`Erro ao importar arquivo: ${error.message}`);
        }
    }

    async handleClearData() {
        try {
            const cleared = await this.core.clearAllData();
            if (cleared) {
                Toast.success('Dados limpos com sucesso');
            }
        } catch (error) {
            console.error('[ProGoiás App] Erro ao limpar dados:', error);
            Toast.error(`Erro ao limpar dados: ${error.message}`);
        }
    }

    handlePreview() {
        try {
            this.core.collectFormData();
            const formData = this.core.getFormData();

            if (Object.keys(formData).length === 0) {
                Toast.warning('Nenhum dado para visualizar');
                return;
            }

            const previewContent = this.generatePreviewContent(formData);
            this.showPreviewModal(previewContent);
        } catch (error) {
            console.error('[ProGoiás App] Erro no preview:', error);
            Toast.error(`Erro ao gerar preview: ${error.message}`);
        }
    }

    generatePreviewContent(formData) {
        let html = `
            <div class="preview-content">
                <h3>Projeto ProGoiás - ${formData.razaoSocial || 'Sem nome'}</h3>
        `;

        // Identificação da Empresa
        if (formData.razaoSocial || formData.cnpj) {
            html += `
                <div class="preview-section">
                    <h4>Identificação da Empresa</h4>
                    ${formData.razaoSocial ? `<p><strong>Razão Social:</strong> ${formData.razaoSocial}</p>` : ''}
                    ${formData.cnpj ? `<p><strong>CNPJ:</strong> ${DocumentFormatter.formatCNPJ(formData.cnpj)}</p>` : ''}
                    ${formData.inscricaoEstadual ? `<p><strong>Inscrição Estadual:</strong> ${formData.inscricaoEstadual}</p>` : ''}
                    ${formData.municipio ? `<p><strong>Município:</strong> ${formData.municipio}</p>` : ''}
                    ${formData.atividadePrincipal ? `<p><strong>Atividade:</strong> ${formData.atividadePrincipal}</p>` : ''}
                </div>
            `;
        }

        // Dados do Projeto
        if (formData.tipoProjeto || formData.descricaoProjeto) {
            html += `
                <div class="preview-section">
                    <h4>Dados do Projeto</h4>
                    ${formData.tipoProjeto ? `<p><strong>Tipo:</strong> ${formData.tipoProjeto}</p>` : ''}
                    ${formData.descricaoProjeto ? `<p><strong>Descrição:</strong> ${formData.descricaoProjeto}</p>` : ''}
                </div>
            `;
        }

        // Investimentos
        if (formData.valorTotalInvestimento) {
            html += `
                <div class="preview-section">
                    <h4>Investimentos</h4>
                    <p><strong>Valor Total:</strong> ${formData.valorTotalInvestimento}</p>
                    ${formData.obrasCivis ? `<p><strong>Obras Civis:</strong> ${formData.obrasCivis}</p>` : ''}
                    ${formData.maquinasEquipamentos ? `<p><strong>Máquinas:</strong> ${formData.maquinasEquipamentos}</p>` : ''}
                </div>
            `;
        }

        // Dados Financeiros
        if (formData.anoBase1) {
            html += `
                <div class="preview-section">
                    <h4>Dados Financeiros</h4>
                    <p><strong>Ano ${formData.anoBase1}:</strong> Receita ${formData.receitaLiquida1 || 'N/A'} | Lucro ${formData.lucroLiquido1 || 'N/A'}</p>
                    ${formData.anoBase2 ? `<p><strong>Ano ${formData.anoBase2}:</strong> Receita ${formData.receitaLiquida2 || 'N/A'} | Lucro ${formData.lucroLiquido2 || 'N/A'}</p>` : ''}
                    ${formData.anoBase3 ? `<p><strong>Ano ${formData.anoBase3}:</strong> Receita ${formData.receitaLiquida3 || 'N/A'} | Lucro ${formData.lucroLiquido3 || 'N/A'}</p>` : ''}
                </div>
            `;
        }

        // Empregos
        if (formData.empregosDiretos) {
            html += `
                <div class="preview-section">
                    <h4>Recursos Humanos</h4>
                    <p><strong>Empregos Diretos:</strong> ${formData.empregosDiretos}</p>
                    ${formData.empregosAno3 ? `<p><strong>Projeção Ano 3:</strong> ${formData.empregosAno3}</p>` : ''}
                </div>
            `;
        }

        html += '</div>';
        return html;
    }

    showPreviewModal(content) {
        const modal = document.getElementById('previewModal');
        const previewContent = document.getElementById('previewContent');

        if (!modal || !previewContent) {
            throw new Error('Modal de preview não encontrado');
        }

        previewContent.innerHTML = content;
        modal.classList.add('show');
    }

    /**
     * Valida seção ProGoiás específica
     * @public
     * @param {number} sectionNumber - Número da seção (1-17)
     * @returns {boolean} True se válida
     */
    validateProGoiasSection(sectionNumber) {
        const section = document.querySelector(`[data-section="${sectionNumber}"]`);
        if (!section) {
            throw new Error(`Seção ${sectionNumber} não encontrada`);
        }

        const result = this.validator.validateSection(section);

        // Validações específicas por seção
        switch (sectionNumber) {
            case 5:
                // Seção de balanços
                const balanceResult = this.validator.validateBalanceYears();
                const financialResult = this.validator.validateFinancialConsistency();

                if (!balanceResult.isValid || !financialResult.isValid) {
                    const message = balanceResult.message || financialResult.message;
                    Toast.error(message);
                    return false;
                }
                break;

            case 10:
                // Seção de empregos
                const empregosField = document.querySelector('[name="empregosDiretos"]');
                if (empregosField) {
                    if (!this.validator.validateEmploymentMinimum(empregosField)) {
                        return false;
                    }
                }
                break;
        }

        return result;
    }

    /**
     * Valida formulário completo para submissão
     * @public
     * @returns {boolean} True se válido
     */
    validateForSubmission() {
        this.core.collectFormData();
        const formData = this.core.getFormData();

        // Verificar se há dados
        if (Object.keys(formData).length === 0) {
            Toast.error('Nenhum dado preenchido');
            return false;
        }

        // Validar todas as seções
        let allValid = true;
        for (let i = 1; i <= 17; i++) {
            if (!this.validateProGoiasSection(i)) {
                allValid = false;
                Toast.error(`Erros encontrados na Seção ${i}`);
                break;
            }
        }

        return allValid;
    }

    // Getters públicos
    getCore() {
        return this.core;
    }

    getValidator() {
        return this.validator;
    }

    getStorageManager() {
        return this.storageManager;
    }

    getDBManager() {
        return this.dbManager;
    }

    getConfig() {
        return this.config;
    }

    /**
     * Inicializa módulo Matriz (lazy loading)
     * @public
     * @returns {Object} MatrizProdutoInsumo instance
     */
    async initMatrizModule() {
        if (this.matrizManager) {
            return this.matrizManager;
        }

        // Lazy load matriz (se disponível)
        if (window.MatrizProdutoInsumo) {
            this.matrizManager = new window.MatrizProdutoInsumo(this.dbManager);
            await this.matrizManager.init();
            console.log('[ProGoiás App] Módulo Matriz inicializado');
            return this.matrizManager;
        } else {
            console.warn('[ProGoiás App] Módulo Matriz não disponível');
            return null;
        }
    }
}

// Inicializar quando DOM estiver carregado
document.addEventListener('DOMContentLoaded', async () => {
    window.progoiasApp = new ProGoiasApp();
});

export default ProGoiasApp;
