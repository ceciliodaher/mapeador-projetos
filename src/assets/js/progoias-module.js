/* =====================================
   PROGOIAS-MODULE.JS
   Módulo específico para formulário ProGoiás
   NO FALLBACKS - NO MOCK DATA
   ===================================== */

class ProGoiasForm {
    constructor() {
        this.config = null;
        this.core = null;
        this.validator = null;
        this.exporter = null;
        this.importer = null;
        
        this.init();
    }
    
    async init() {
        await this.loadConfig();
        this.initializeModules();
        this.setupEventListeners();
        this.setupFileHandlers();
    }
    
    async loadConfig() {
        const response = await fetch('../../config/progoias-config.json');
        if (!response.ok) {
            throw new Error('Erro ao carregar configuração ProGoiás');
        }
        
        this.config = await response.json();
        
        if (!this.config.programType || this.config.programType !== 'ProGoiás') {
            throw new Error('Configuração ProGoiás inválida');
        }
    }
    
    initializeModules() {
        this.core = new FormCore(this.config);
        this.validator = new FormValidator(this.config);
        this.exporter = null; // Lazy loading - criado apenas ao exportar
        this.importer = new ImportManager(this.config);

        new FieldAutoFormatter();
    }

    getExporter() {
        if (!this.exporter) {
            this.core.collectFormData(); // Atualiza this.core.formData
            this.exporter = new FormExporter(this.config, this.core.formData);
        }
        return this.exporter;
    }
    
    setupEventListeners() {
        // Botões de exportação
        const exportJsonBtn = document.getElementById('exportJsonBtn');
        const exportExcelBtn = document.getElementById('exportExcelBtn');
        const exportPDFBtn = document.getElementById('exportPDFBtn');
        
        if (!exportJsonBtn || !exportExcelBtn || !exportPDFBtn) {
            throw new Error('Botões de exportação não encontrados');
        }
        
        exportJsonBtn.addEventListener('click', () => this.handleExport('json'));
        exportExcelBtn.addEventListener('click', () => this.handleExport('excel'));
        exportPDFBtn.addEventListener('click', () => this.handleExport('pdf'));
        
        // Botões do modal
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
        
        // Botão limpar
        const clearBtn = document.getElementById('clearBtn');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.handleClearData());
        }
        
        // Botão preview
        const previewBtn = document.getElementById('previewBtn');
        if (previewBtn) {
            previewBtn.addEventListener('click', () => this.handlePreview());
        }
        
        // Validações específicas ProGoiás
        this.setupProGoiasValidations();
    }
    
    setupFileHandlers() {
        const importBtn = document.getElementById('importBtnHeader');
        const importFile = document.getElementById('importJsonFileHeader');
        
        if (importBtn && importFile) {
            importBtn.addEventListener('click', () => importFile.click());
        }
    }
    
    setupProGoiasValidations() {
        // Validação de empregos mínimos
        const empregosField = document.querySelector('[name="empregosDiretos"]');
        if (empregosField) {
            empregosField.addEventListener('blur', (e) => {
                const value = parseInt(e.target.value);
                if (value && value < this.config.validationRules.empregosMinimos) {
                    this.validator.setFieldError(e.target, 
                        `ProGoiás requer mínimo de ${this.config.validationRules.empregosMinimos} empregos diretos`);
                }
            });
        }
        
        // Validação de anos dos balanços
        this.setupBalanceYearValidation();
        
        // Validação de consistência de dados financeiros
        this.setupFinancialValidation();
    }
    
    setupBalanceYearValidation() {
        const yearFields = ['anoBase1', 'anoBase2', 'anoBase3'];
        
        yearFields.forEach(fieldName => {
            const field = document.querySelector(`[name="${fieldName}"]`);
            if (field) {
                field.addEventListener('blur', () => this.validateBalanceYears());
            }
        });
    }
    
    validateBalanceYears() {
        const year1 = document.querySelector('[name="anoBase1"]').value;
        const year2 = document.querySelector('[name="anoBase2"]').value;
        const year3 = document.querySelector('[name="anoBase3"]').value;
        
        if (!year1 || !year2 || !year3) {
            return;
        }
        
        const years = [parseInt(year1), parseInt(year2), parseInt(year3)];
        
        // Verificar ordem cronológica
        if (years[0] <= years[1] || years[1] <= years[2]) {
            throw new Error('Anos devem estar em ordem cronológica decrescente (mais recente primeiro)');
        }
        
        // Verificar sequência de anos
        const currentYear = new Date().getFullYear();
        if (years[0] > currentYear) {
            throw new Error('Ano base 1 não pode ser futuro');
        }
        
        if (years[0] - years[2] > 3) {
            throw new Error('Período dos balanços não pode exceder 3 anos');
        }
    }
    
    setupFinancialValidation() {
        const revenueFields = ['receitaLiquida1', 'receitaLiquida2', 'receitaLiquida3'];
        
        revenueFields.forEach(fieldName => {
            const field = document.querySelector(`[name="${fieldName}"]`);
            if (field) {
                field.addEventListener('blur', () => this.validateFinancialConsistency());
            }
        });
    }
    
    validateFinancialConsistency() {
        const revenue1 = this.parseFinancialValue(document.querySelector('[name="receitaLiquida1"]').value);
        const revenue2 = this.parseFinancialValue(document.querySelector('[name="receitaLiquida2"]').value);
        const revenue3 = this.parseFinancialValue(document.querySelector('[name="receitaLiquida3"]').value);
        
        if (!revenue1 || !revenue2 || !revenue3) {
            return;
        }
        
        // Verificar variações extremas
        const variation1to2 = Math.abs((revenue1 - revenue2) / revenue2);
        const variation2to3 = Math.abs((revenue2 - revenue3) / revenue3);
        
        if (variation1to2 > 0.5 || variation2to3 > 0.5) {
            console.warn('Variação de receita superior a 50% entre anos - verificar consistência');
        }
    }
    
    parseFinancialValue(value) {
        if (!value) return 0;
        const cleanValue = value.replace(/[^\d.,]/g, '').replace(',', '.');
        return parseFloat(cleanValue);
    }
    
    handleExport(format) {
        this.core.collectFormData();
        const formData = this.core.getFormData();
        
        if (Object.keys(formData).length === 0) {
            throw new Error('Nenhum dado para exportar');
        }
        
        const exporter = new FormExporter(this.config, formData);
        
        switch (format) {
            case 'json':
                exporter.exportToJSON();
                break;
            case 'excel':
                exporter.exportToExcel();
                break;
            case 'pdf':
                exporter.exportToPDF();
                break;
            default:
                throw new Error(`Formato de exportação '${format}' não suportado`);
        }
        
        console.log(`Exportação ${format} concluída para ProGoiás`);
    }
    
    handleClearData() {
        const confirmed = confirm('Tem certeza que deseja limpar todos os dados? Esta ação não pode ser desfeita.');
        
        if (!confirmed) {
            return;
        }
        
        this.core.clearAllData();
        console.log('Dados ProGoiás limpos');
    }
    
    handlePreview() {
        this.core.collectFormData();
        const formData = this.core.getFormData();
        
        if (Object.keys(formData).length === 0) {
            throw new Error('Nenhum dado para visualizar');
        }
        
        const previewContent = this.generatePreviewContent(formData);
        this.showPreviewModal(previewContent);
    }
    
    generatePreviewContent(formData) {
        let html = `
            <div class="preview-content">
                <h3>Projeto ProGoiás - ${formData.razaoSocial}</h3>
                
                <div class="preview-section">
                    <h4>Identificação da Empresa</h4>
                    <p><strong>Razão Social:</strong> ${formData.razaoSocial}</p>
                    <p><strong>CNPJ:</strong> ${formData.cnpj}</p>
                    <p><strong>Inscrição Estadual:</strong> ${formData.inscricaoEstadual}</p>
                    <p><strong>Município:</strong> ${formData.municipio}</p>
                    <p><strong>Atividade Principal:</strong> ${formData.atividadePrincipal}</p>
                </div>
        `;
        
        if (formData.tipoProjeto) {
            html += `
                <div class="preview-section">
                    <h4>Dados do Projeto</h4>
                    <p><strong>Tipo:</strong> ${formData.tipoProjeto}</p>
                    <p><strong>Descrição:</strong> ${formData.descricaoProjeto}</p>
                </div>
            `;
        }
        
        if (formData.valorTotalInvestimento) {
            html += `
                <div class="preview-section">
                    <h4>Investimentos</h4>
                    <p><strong>Valor Total:</strong> ${formData.valorTotalInvestimento}</p>
                    <p><strong>Obras Civis:</strong> ${formData.obrasCivis}</p>
                    <p><strong>Máquinas e Equipamentos:</strong> ${formData.maquinasEquipamentos}</p>
                </div>
            `;
        }
        
        if (formData.anoBase1) {
            html += `
                <div class="preview-section">
                    <h4>Dados Financeiros</h4>
                    <p><strong>Ano ${formData.anoBase1}:</strong> Receita ${formData.receitaLiquida1} | Lucro ${formData.lucroLiquido1}</p>
                    <p><strong>Ano ${formData.anoBase2}:</strong> Receita ${formData.receitaLiquida2} | Lucro ${formData.lucroLiquido2}</p>
                    <p><strong>Ano ${formData.anoBase3}:</strong> Receita ${formData.receitaLiquida3} | Lucro ${formData.lucroLiquido3}</p>
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
    
    // Métodos de validação específicos ProGoiás
    validateProGoiasSection(sectionNumber) {
        const section = document.querySelector(`[data-section="${sectionNumber}"]`);
        if (!section) {
            throw new Error(`Seção ${sectionNumber} não encontrada`);
        }
        
        const result = this.validator.validateSection(section);
        
        // Validações específicas por seção
        switch (sectionNumber) {
            case 5:
                this.validateBalanceYears();
                this.validateFinancialConsistency();
                break;
            case 10:
                this.validateEmploymentRequirements();
                break;
        }
        
        return result;
    }
    
    validateEmploymentRequirements() {
        const empregosField = document.querySelector('[name="empregosDiretos"]');
        if (empregosField && empregosField.value) {
            const empregos = parseInt(empregosField.value);
            if (empregos < this.config.validationRules.empregosMinimos) {
                throw new Error(`ProGoiás requer mínimo de ${this.config.validationRules.empregosMinimos} empregos diretos`);
            }
        }
    }
    
    // Getters para acesso aos módulos
    getCore() {
        return this.core;
    }
    
    getValidator() {
        return this.validator;
    }
    
    getConfig() {
        return this.config;
    }
}

// Inicializar quando DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    new ProGoiasForm();
});