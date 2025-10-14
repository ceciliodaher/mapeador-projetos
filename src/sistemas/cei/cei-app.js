/* =====================================
   CEI-APP.JS
   Aplicação principal do sistema CEI
   Sistema independente - migrado de cei-module.js
   NO FALLBACKS - NO HARDCODED DATA
   ===================================== */

import { CEIFormCore } from './core/cei-form-core.js';
import { CEIStorageManager } from './storage/cei-storage-manager.js';
import { CEIValidator } from './validators/cei-validator.js';
import { DocumentFormatter } from '@shared/formatters/document-formatter.js';
import { CurrencyFormatter } from '@shared/formatters/currency-formatter.js';
import { DateFormatter } from '@shared/formatters/date-formatter.js';
import { Toast } from '@shared/ui/toast.js';

/**
 * Aplicação CEI
 * Coordena core, storage, validator e exportação
 *
 * @class CEIApp
 */
class CEIApp {
    constructor() {
        this.config = null;
        this.core = null;
        this.storageManager = null;
        this.validator = null;

        this.init();
    }

    async init() {
        try {
            await this.loadConfig();
            this.initializeModules();
            this.setupEventListeners();
            this.setupCEIValidations();
            this.setupFileHandlers();

            console.log('[CEI App] Inicializado com sucesso');
        } catch (error) {
            console.error('[CEI App] Erro na inicialização:', error);
            Toast.error(`Erro ao inicializar aplicação CEI: ${error.message}`);
        }
    }

    async loadConfig() {
        try {
            const response = await fetch('/config/cei-config.json');
            if (!response.ok) {
                throw new Error(`Erro HTTP: ${response.status}`);
            }

            this.config = await response.json();

            if (!this.config.programType || this.config.programType !== 'CEI') {
                throw new Error('Configuração CEI inválida - programType incorreto');
            }

            console.log('[CEI App] Configuração carregada:', this.config.programType);
        } catch (error) {
            throw new Error(`Erro ao carregar configuração CEI: ${error.message}`);
        }
    }

    initializeModules() {
        // Inicializar na ordem correta (storage e validator primeiro, core por último)
        this.storageManager = new CEIStorageManager(this.config);
        this.validator = new CEIValidator(this.config);
        this.core = new CEIFormCore(this.config, this.storageManager, this.validator);

        console.log('[CEI App] Módulos inicializados');
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

        console.log('[CEI App] Event listeners configurados');
    }

    setupFileHandlers() {
        const importBtn = document.getElementById('importBtnHeader');
        const importFile = document.getElementById('importJsonFileHeader');

        if (importBtn && importFile) {
            importBtn.addEventListener('click', () => importFile.click());
            importFile.addEventListener('change', (e) => this.handleImport(e));
        }
    }

    setupCEIValidations() {
        // Validação de investimento mínimo
        const investmentField = document.querySelector('[name="valorTotalInvestimento"]');
        if (investmentField) {
            investmentField.addEventListener('blur', () => {
                this.validator.validateField(investmentField);
            });
        }

        // Validação de prazo máximo
        const prazoField = document.querySelector('[name="prazoExecucao"]');
        if (prazoField) {
            prazoField.addEventListener('blur', () => {
                this.validator.validateField(prazoField);
            });
        }

        // Validação de percentual mínimo de investimento
        this.setupInvestmentPercentageValidation();

        // Validações de datas
        this.setupDateValidations();

        console.log('[CEI App] Validações CEI configuradas');
    }

    setupInvestmentPercentageValidation() {
        const totalInvestmentField = document.querySelector('[name="valorTotalInvestimento"]');
        const operationValueField = document.querySelector('[name="valorOperacao"]');

        if (totalInvestmentField && operationValueField) {
            const validatePercentage = () => {
                const totalInvestment = this.#parseFinancialValue(totalInvestmentField.value);
                const operationValue = this.#parseFinancialValue(operationValueField.value);

                const result = this.validator.validateInvestmentPercentage(totalInvestment, operationValue);

                if (!result.isValid && result.message) {
                    this.validator.setFieldError(totalInvestmentField, result.message);
                } else {
                    this.validator.clearFieldError(totalInvestmentField);
                }
            };

            totalInvestmentField.addEventListener('blur', validatePercentage);
            operationValueField.addEventListener('blur', validatePercentage);
        }
    }

    setupDateValidations() {
        const startDateField = document.querySelector('[name="dataInicio"]');
        const endDateField = document.querySelector('[name="dataTermino"]');

        if (startDateField && endDateField) {
            const validateDateRange = () => {
                if (!startDateField.value || !endDateField.value) {
                    return;
                }

                const result = this.validator.validateDateRange(startDateField.value, endDateField.value);

                if (!result.isValid && result.message) {
                    this.validator.setFieldError(endDateField, result.message);
                } else {
                    this.validator.clearFieldError(endDateField);
                }
            };

            startDateField.addEventListener('blur', validateDateRange);
            endDateField.addEventListener('blur', validateDateRange);
        }
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

            console.log(`[CEI App] Exportação ${format} concluída`);
        } catch (error) {
            console.error('[CEI App] Erro na exportação:', error);
            Toast.error(`Erro ao exportar: ${error.message}`);
        }
    }

    handleImport(event) {
        try {
            const file = event.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    this.storageManager.importData(data);
                    this.core.restoreFormData(data);
                    Toast.success('Dados importados com sucesso');
                } catch (error) {
                    console.error('[CEI App] Erro ao processar arquivo:', error);
                    Toast.error(`Erro ao importar: ${error.message}`);
                }
            };
            reader.readAsText(file);
        } catch (error) {
            console.error('[CEI App] Erro na importação:', error);
            Toast.error(`Erro ao importar arquivo: ${error.message}`);
        }
    }

    handleClearData() {
        try {
            const cleared = this.core.clearAllData();
            if (cleared) {
                Toast.success('Dados limpos com sucesso');
            }
        } catch (error) {
            console.error('[CEI App] Erro ao limpar dados:', error);
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
            console.error('[CEI App] Erro no preview:', error);
            Toast.error(`Erro ao gerar preview: ${error.message}`);
        }
    }

    generatePreviewContent(formData) {
        let html = `
            <div class="preview-content">
                <h3>Projeto CEI - ${formData.razaoSocial || 'Sem nome'}</h3>
        `;

        if (formData.razaoSocial || formData.cnpj) {
            html += `
                <div class="preview-section">
                    <h4>Identificação do Beneficiário</h4>
                    ${formData.razaoSocial ? `<p><strong>Razão Social:</strong> ${formData.razaoSocial}</p>` : ''}
                    ${formData.cnpj ? `<p><strong>CNPJ:</strong> ${DocumentFormatter.formatCNPJ(formData.cnpj)}</p>` : ''}
                    ${formData.inscricaoEstadual ? `<p><strong>Inscrição Estadual:</strong> ${formData.inscricaoEstadual}</p>` : ''}
                    ${formData.municipio ? `<p><strong>Município:</strong> ${formData.municipio}</p>` : ''}
                </div>
            `;
        }

        if (formData.descricaoEmpreendimento) {
            html += `
                <div class="preview-section">
                    <h4>Descrição do Empreendimento</h4>
                    <p>${formData.descricaoEmpreendimento}</p>
                </div>
            `;
        }

        if (formData.valorTotalInvestimento) {
            html += `
                <div class="preview-section">
                    <h4>Valor Total do Investimento</h4>
                    <p><strong>Total:</strong> ${formData.valorTotalInvestimento}</p>
                    ${formData.obrasCivis ? `<p><strong>Obras Civis:</strong> ${formData.obrasCivis}</p>` : ''}
                    ${formData.maquinasEquipamentos ? `<p><strong>Máquinas e Equipamentos:</strong> ${formData.maquinasEquipamentos}</p>` : ''}
                </div>
            `;
        }

        if (formData.dataInicio && formData.dataTermino) {
            html += `
                <div class="preview-section">
                    <h4>Cronograma</h4>
                    <p><strong>Data de Início:</strong> ${DateFormatter.formatBR(formData.dataInicio)}</p>
                    <p><strong>Data de Término:</strong> ${DateFormatter.formatBR(formData.dataTermino)}</p>
                    ${formData.prazoExecucao ? `<p><strong>Prazo:</strong> ${formData.prazoExecucao} meses</p>` : ''}
                </div>
            `;
        }

        if (formData.empregosDiretos) {
            html += `
                <div class="preview-section">
                    <h4>Recursos Humanos</h4>
                    <p><strong>Empregos Diretos:</strong> ${formData.empregosDiretos}</p>
                    ${formData.empregosIndiretos ? `<p><strong>Empregos Indiretos:</strong> ${formData.empregosIndiretos}</p>` : ''}
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

    #parseFinancialValue(value) {
        if (!value) return 0;
        const cleanValue = value.replace(/[^\d.,]/g, '').replace(',', '.');
        const parsed = parseFloat(cleanValue);
        return isNaN(parsed) ? 0 : parsed;
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

    getConfig() {
        return this.config;
    }
}

// Inicializar quando DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    window.ceiApp = new CEIApp();
});

export default CEIApp;
