/**
 * DocumentExtractor Component
 *
 * Componente para upload e extração automática de dados de PDFs.
 *
 * Princípios:
 * - Upload de PDFs com validação de tamanho
 * - Extração de texto (requer PDF.js - carregado externamente)
 * - Pattern matching para identificar tipo de documento
 * - Revisão manual obrigatória antes de aplicar
 * - Schema externo de defaults
 *
 * @author Expertzy
 * @version 1.0.0
 */

class DocumentExtractor {
    static defaults = null;

    constructor(config) {
        if (!config.extractorId) {
            throw new Error('DocumentExtractor: extractorId obrigatório');
        }
        if (!config.containerId) {
            throw new Error('DocumentExtractor: containerId obrigatório');
        }

        this.extractorId = config.extractorId;
        this.containerId = config.containerId;

        this.initializeDefaults();
        this.options = this.normalizeOptions(config.options);

        this.uploadedFiles = [];
        this.extractedData = null;
        this.container = null;

        this.init();
    }

    async initializeDefaults() {
        if (DocumentExtractor.defaults) return;

        try {
            const response = await fetch('/config/document-extractor-defaults.json');
            DocumentExtractor.defaults = await response.json();
        } catch (error) {
            throw new Error(`DocumentExtractor: Falha ao carregar defaults: ${error.message}`);
        }
    }

    normalizeOptions(userOptions) {
        return {
            allowMultiple: userOptions?.allowMultiple ?? false,
            autoExtract: userOptions?.autoExtract ?? true,
            showPreview: userOptions?.showPreview ?? true,
            ...userOptions
        };
    }

    init() {
        this.container = document.getElementById(this.containerId);
        if (!this.container) {
            throw new Error(`DocumentExtractor: Container #${this.containerId} não encontrado`);
        }

        this.render();
        this.attachEventListeners();
    }

    render() {
        const css = DocumentExtractor.defaults.css;
        const maxSizeMB = DocumentExtractor.defaults.upload.maxFileSizeMB;

        const html = `
            <div class="${css.wrapper}" data-extractor-id="${this.extractorId}">
                <div class="${css.uploadArea}" id="${this.extractorId}-upload-area">
                    <p>📄 Arraste arquivos PDF aqui ou clique para selecionar</p>
                    <p class="text-muted">Máximo: ${maxSizeMB}MB por arquivo</p>
                    <input type="file"
                           class="${css.fileInput}"
                           id="${this.extractorId}-file-input"
                           accept="${DocumentExtractor.defaults.upload.acceptedFormats.join(',')}"
                           ${this.options.allowMultiple ? 'multiple' : ''} />
                    <button type="button" class="${css.uploadButton}">
                        Selecionar Arquivo${this.options.allowMultiple ? 's' : ''}
                    </button>
                </div>

                <div class="${css.fileList}" id="${this.extractorId}-file-list"></div>

                <div class="${css.extractionResults}" id="${this.extractorId}-results"></div>

                <div class="${css.reviewPanel}" id="${this.extractorId}-review" style="display: none;">
                    <h4>Dados Extraídos - Revisar antes de aplicar</h4>
                    <div id="${this.extractorId}-review-content"></div>
                    <div class="button-group">
                        <button type="button" class="${css.applyButton}">✓ Aplicar Dados</button>
                        <button type="button" class="${css.cancelButton}">✗ Cancelar</button>
                    </div>
                </div>
            </div>
        `;

        this.container.innerHTML = html;
    }

    attachEventListeners() {
        const uploadArea = document.getElementById(`${this.extractorId}-upload-area`);
        const fileInput = document.getElementById(`${this.extractorId}-file-input`);
        const uploadButton = this.container.querySelector('.btn-upload');

        // Drag and drop
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add(DocumentExtractor.defaults.css.uploadAreaActive);
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove(DocumentExtractor.defaults.css.uploadAreaActive);
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove(DocumentExtractor.defaults.css.uploadAreaActive);

            const files = Array.from(e.dataTransfer.files);
            this.handleFiles(files);
        });

        // Click to select
        uploadButton.addEventListener('click', () => {
            fileInput.click();
        });

        fileInput.addEventListener('change', (e) => {
            const files = Array.from(e.target.files);
            this.handleFiles(files);
        });

        // Botões de revisão
        this.container.querySelector('.btn-apply')?.addEventListener('click', () => {
            this.applyExtractedData();
        });

        this.container.querySelector('.btn-cancel')?.addEventListener('click', () => {
            this.cancelExtraction();
        });
    }

    handleFiles(files) {
        const maxSize = DocumentExtractor.defaults.upload.maxFileSize;
        const acceptedTypes = DocumentExtractor.defaults.upload.acceptedMimeTypes;

        files.forEach(file => {
            // Validações
            if (!acceptedTypes.includes(file.type)) {
                alert(`Arquivo ${file.name} não é um PDF válido.`);
                return;
            }

            if (file.size > maxSize) {
                const maxMB = DocumentExtractor.defaults.upload.maxFileSizeMB;
                alert(`Arquivo ${file.name} excede o tamanho máximo de ${maxMB}MB.`);
                return;
            }

            // Adiciona à lista
            this.addFile(file);

            // Auto-extrai se habilitado
            if (this.options.autoExtract) {
                this.extractFromFile(file);
            }
        });
    }

    addFile(file) {
        const fileInfo = {
            name: file.name,
            size: file.size,
            type: file.type,
            file: file,
            status: 'pending',
            extractedData: null
        };

        this.uploadedFiles.push(fileInfo);
        this.renderFileList();
    }

    renderFileList() {
        const fileList = document.getElementById(`${this.extractorId}-file-list`);
        const css = DocumentExtractor.defaults.css;

        if (this.uploadedFiles.length === 0) {
            fileList.innerHTML = '';
            return;
        }

        let html = '<h5>Arquivos:</h5><ul>';

        this.uploadedFiles.forEach((fileInfo, idx) => {
            const sizeKB = (fileInfo.size / 1024).toFixed(2);
            const statusIcon = this.getStatusIcon(fileInfo.status);

            html += `
                <li class="${css.fileItem}">
                    <span>${fileInfo.name} (${sizeKB} KB)</span>
                    <span class="${css.fileStatus}">${statusIcon} ${this.getStatusLabel(fileInfo.status)}</span>
                </li>
            `;
        });

        html += '</ul>';
        fileList.innerHTML = html;
    }

    getStatusIcon(status) {
        switch (status) {
            case 'pending': return '⏳';
            case 'extracting': return '🔄';
            case 'success': return '✅';
            case 'error': return '❌';
            default: return '❓';
        }
    }

    getStatusLabel(status) {
        switch (status) {
            case 'pending': return 'Aguardando';
            case 'extracting': return 'Extraindo...';
            case 'success': return 'Concluído';
            case 'error': return 'Erro';
            default: return 'Desconhecido';
        }
    }

    /**
     * Extrai dados do PDF
     * NOTA: Requer PDF.js carregado externamente
     */
    async extractFromFile(file) {
        const fileInfo = this.uploadedFiles.find(f => f.file === file);
        if (!fileInfo) return;

        fileInfo.status = 'extracting';
        this.renderFileList();

        try {
            // Verifica se PDF.js está disponível
            if (typeof pdfjsLib === 'undefined') {
                throw new Error('PDF.js não está carregado. Adicione <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script> ao HTML.');
            }

            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

            let fullText = '';

            // Extrai texto de todas as páginas
            for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                const page = await pdf.getPage(pageNum);
                const textContent = await page.getTextContent();
                const pageText = textContent.items.map(item => item.str).join(' ');
                fullText += pageText + '\n';
            }

            // Identifica tipo de documento
            const tipoDocumento = this.identificarTipoDocumento(fullText);

            // Extrai campos específicos
            const dadosExtraidos = this.extrairCampos(fullText, tipoDocumento);

            fileInfo.status = 'success';
            fileInfo.extractedData = {
                tipo: tipoDocumento,
                dados: dadosExtraidos,
                textoCompleto: fullText
            };

            this.renderFileList();
            this.showReviewPanel(fileInfo);

        } catch (error) {
            console.error('Erro ao extrair PDF:', error);
            fileInfo.status = 'error';
            this.renderFileList();
            alert(`Erro ao extrair dados de ${file.name}: ${error.message}`);
        }
    }

    /**
     * Identifica tipo de documento baseado em patterns
     */
    identificarTipoDocumento(texto) {
        const textoLower = texto.toLowerCase();
        const tipos = DocumentExtractor.defaults.tiposDocumento;

        for (const [tipoKey, tipoConfig] of Object.entries(tipos)) {
            const matchCount = tipoConfig.patterns.filter(pattern =>
                textoLower.includes(pattern.toLowerCase())
            ).length;

            // Se encontrou pelo menos 2 patterns, considera match
            if (matchCount >= 2) {
                return {
                    tipo: tipoKey,
                    label: tipoConfig.label,
                    confidence: matchCount / tipoConfig.patterns.length
                };
            }
        }

        return {
            tipo: 'desconhecido',
            label: 'Documento Não Identificado',
            confidence: 0
        };
    }

    /**
     * Extrai campos específicos baseado no tipo de documento
     * NOTA: Implementação simplificada - expandir com regex patterns específicos
     */
    extrairCampos(texto, tipoDocumento) {
        const campos = {};

        // Patterns básicos (expandir conforme necessidade)
        const patterns = {
            cnpj: /\b\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}\b/g,
            cpf: /\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/g,
            data: /\b\d{2}\/\d{2}\/\d{4}\b/g,
            valor: /R\$\s*[\d.,]+/g,
            email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
            telefone: /\(\d{2}\)\s*\d{4,5}-\d{4}/g
        };

        // Extrai patterns comuns
        for (const [tipo, regex] of Object.entries(patterns)) {
            const matches = texto.match(regex);
            if (matches && matches.length > 0) {
                campos[tipo] = matches;
            }
        }

        return campos;
    }

    /**
     * Mostra painel de revisão com dados extraídos
     */
    showReviewPanel(fileInfo) {
        const reviewPanel = document.getElementById(`${this.extractorId}-review`);
        const reviewContent = document.getElementById(`${this.extractorId}-review-content`);

        const { tipo, dados } = fileInfo.extractedData;
        const css = DocumentExtractor.defaults.css;

        let html = `<div class="extraction-info">`;
        html += `<p><strong>Tipo de Documento:</strong> ${tipo.label}</p>`;
        html += `<p><strong>Confiança:</strong> <span class="${this.getConfidenceClass(tipo.confidence)}">${(tipo.confidence * 100).toFixed(0)}%</span></p>`;
        html += `</div>`;

        html += `<h5>Dados Identificados:</h5>`;
        html += `<table class="table">`;
        html += `<thead><tr><th>Campo</th><th>Valores Encontrados</th></tr></thead>`;
        html += `<tbody>`;

        for (const [campo, valores] of Object.entries(dados)) {
            const valoresStr = Array.isArray(valores) ? valores.join(', ') : valores;
            html += `<tr><td><strong>${campo}</strong></td><td>${valoresStr}</td></tr>`;
        }

        html += `</tbody></table>`;

        reviewContent.innerHTML = html;
        reviewPanel.style.display = 'block';

        this.extractedData = fileInfo.extractedData;
    }

    getConfidenceClass(confidence) {
        const css = DocumentExtractor.defaults.css;

        if (confidence >= 0.9) return css.confidenceHigh;
        if (confidence >= 0.7) return css.confidenceMedium;
        return css.confidenceLow;
    }

    /**
     * Aplica dados extraídos (dispara evento customizado)
     */
    applyExtractedData() {
        if (!this.extractedData) return;

        const event = new CustomEvent('document:extracted', {
            detail: {
                extractorId: this.extractorId,
                tipo: this.extractedData.tipo,
                dados: this.extractedData.dados
            }
        });

        this.container.dispatchEvent(event);

        // Esconde painel de revisão
        const reviewPanel = document.getElementById(`${this.extractorId}-review`);
        reviewPanel.style.display = 'none';

        alert('Dados aplicados com sucesso! Revise os campos preenchidos.');
    }

    /**
     * Cancela extração
     */
    cancelExtraction() {
        const reviewPanel = document.getElementById(`${this.extractorId}-review`);
        reviewPanel.style.display = 'none';
        this.extractedData = null;
    }

    /**
     * Limpa arquivos
     */
    clearFiles() {
        this.uploadedFiles = [];
        this.extractedData = null;
        this.renderFileList();

        const reviewPanel = document.getElementById(`${this.extractorId}-review`);
        reviewPanel.style.display = 'none';
    }

    /**
     * Obtém arquivos uploadados
     */
    getFiles() {
        return this.uploadedFiles;
    }

    /**
     * Destrói componente
     */
    destroy() {
        this.container.innerHTML = '';
        this.uploadedFiles = [];
        this.extractedData = null;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = DocumentExtractor;
}
