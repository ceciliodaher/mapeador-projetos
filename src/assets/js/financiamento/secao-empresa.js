/* =====================================
   SECAO-EMPRESA.JS
   Módulo para Seção 1 - Quadro Societário
   Gerencia sócios/acionistas da empresa
   ===================================== */

/**
 * Classe para gerenciar Seção 1 - Quadro Societário
 * Segue padrão de secao-receitas.js com clone manual
 */
class SecaoEmpresa {
    constructor() {
        this.socioCount = 0;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateNumeroSocios();
        this.updateCapitalValidation();
    }

    setupEventListeners() {
        // Botão adicionar sócio
        const addSocioBtn = document.getElementById('addSocio');

        if (addSocioBtn) {
            addSocioBtn.addEventListener('click', () => this.addSocioEntry());
        }

        // Event delegation para validação de participação em tempo real
        const container = document.getElementById('socios-container');
        if (container) {
            container.addEventListener('input', (e) => {
                if (e.target.name && e.target.name.includes('Participacao')) {
                    this.updateCapitalValidation();
                }
            });

            // Event delegation para mudança de tipo de pessoa (PF/PJ)
            container.addEventListener('change', (e) => {
                if (e.target.name && e.target.name.includes('TipoPessoa')) {
                    this.updateDocumentoMask(e.target);
                }
            });
        }
    }

    /**
     * Adiciona nova entrada de sócio
     * Clona template, atualiza índices, aplica validações
     */
    addSocioEntry() {
        const container = document.getElementById('socios-container');
        if (!container) {
            console.error('❌ Container #socios-container não encontrado');
            return;
        }

        const entries = container.querySelectorAll('.socio-entry');
        const newIndex = entries.length + 1;

        console.log(`➕ Adicionando sócio ${newIndex}...`);

        // Clonar primeira entrada (template)
        const template = entries[0].cloneNode(true);

        // Atualizar todos os name/id attributes
        this.updateEntryIndexes(template, 'socio', newIndex);

        // Limpar todos os valores
        this.clearEntryValues(template);

        // Adicionar botão "Remover"
        this.addRemoveButton(template, 'socio', newIndex);

        // Remover classe 'first' se existir
        template.classList.remove('first');

        // Inserir no container
        container.appendChild(template);

        // Aplicar máscaras aos campos
        this.applyMasksToEntry(template);

        // Atualizar contador
        this.updateNumeroSocios();
        this.updateCapitalValidation();

        console.log(`✓ Sócio ${newIndex} adicionado com sucesso`);
    }

    /**
     * Atualiza índices de name/id em uma entrada clonada
     *
     * @param {HTMLElement} element - Elemento clonado
     * @param {string} prefix - Prefixo (socio)
     * @param {number} newIndex - Novo índice
     */
    updateEntryIndexes(element, prefix, newIndex) {
        // Regex para capturar padrões como: socio1_nome, socio1_tipoPessoa, etc.
        const nameRegex = new RegExp(`${prefix}1_`, 'g');
        const idRegex = new RegExp(`${prefix}1_`, 'g');

        // Atualizar todos os elementos com name
        element.querySelectorAll('[name]').forEach(field => {
            const oldName = field.getAttribute('name');
            const newName = oldName.replace(nameRegex, `${prefix}${newIndex}_`);
            field.setAttribute('name', newName);
        });

        // Atualizar todos os elementos com id
        element.querySelectorAll('[id]').forEach(field => {
            const oldId = field.getAttribute('id');
            const newId = oldId.replace(idRegex, `${prefix}${newIndex}_`);
            field.setAttribute('id', newId);
        });

        // Atualizar labels (for attribute)
        element.querySelectorAll('label[for]').forEach(label => {
            const oldFor = label.getAttribute('for');
            const newFor = oldFor.replace(idRegex, `${prefix}${newIndex}_`);
            label.setAttribute('for', newFor);
        });

        console.log(`  ↳ Índices atualizados: ${prefix}1_ → ${prefix}${newIndex}_`);
    }

    /**
     * Limpa valores de todos os campos em uma entrada
     *
     * @param {HTMLElement} element - Elemento a limpar
     */
    clearEntryValues(element) {
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
     *
     * @param {HTMLElement} element - Elemento que receberá o botão
     * @param {string} type - Tipo (socio)
     * @param {number} index - Índice da entrada
     */
    addRemoveButton(element, type, index) {
        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = 'btn btn-danger btn-sm remove-entry-btn';
        removeBtn.textContent = '🗑️ Remover Sócio';
        removeBtn.style.marginBottom = '1rem';
        removeBtn.onclick = () => this.removeEntry(type, index);

        // Inserir no topo do entry (primeiro filho)
        element.insertBefore(removeBtn, element.firstChild);

        console.log('  ↳ Botão remover adicionado');
    }

    /**
     * Remove uma entrada de sócio
     *
     * @param {string} type - Tipo (socio)
     * @param {number} index - Índice da entrada a remover
     */
    removeEntry(type, index) {
        const typeName = 'Sócio';

        if (!confirm(`Tem certeza que deseja remover este ${typeName.toLowerCase()}?`)) {
            return;
        }

        const container = document.getElementById(`${type}s-container`);
        const entries = container.querySelectorAll(`.${type}-entry`);

        // Não permitir remover se for o último
        if (entries.length === 1) {
            alert(`Não é possível remover o único ${typeName.toLowerCase()}. Pelo menos um ${typeName.toLowerCase()} deve existir.`);
            return;
        }

        // Remover entrada específica
        let targetEntry = null;
        entries.forEach(entry => {
            const firstInput = entry.querySelector('input[name^="' + type + '"]');
            if (firstInput) {
                const match = firstInput.name.match(new RegExp(`${type}(\\d+)_`));
                if (match && parseInt(match[1]) === index) {
                    targetEntry = entry;
                }
            }
        });

        if (targetEntry) {
            targetEntry.remove();
            console.log(`✓ ${typeName} ${index} removido`);

            // Atualizar contador e validação
            this.updateNumeroSocios();
            this.updateCapitalValidation();

            // Auto-save será feito pelo financiamento-module.js
            console.log('  ↳ Auto-save delegado ao módulo principal');
        } else {
            console.error(`❌ Não foi possível encontrar ${typeName} ${index} para remover`);
        }
    }

    /**
     * Aplica máscaras aos campos de uma entrada
     *
     * @param {HTMLElement} element - Elemento que contém os campos
     */
    applyMasksToEntry(element) {
        // Aplicar máscara de telefone
        const phoneFields = element.querySelectorAll('.phone-input');
        if (phoneFields.length > 0 && window.FieldFormatter) {
            phoneFields.forEach(field => {
                field.addEventListener('input', (e) => {
                    e.target.value = window.FieldFormatter.formatPhone(e.target.value);
                });
            });
        }

        // Máscara CPF/CNPJ será aplicada dinamicamente com base no tipo de pessoa
        const documentFields = element.querySelectorAll('.cpf-cnpj-input');
        if (documentFields.length > 0) {
            documentFields.forEach(field => {
                field.addEventListener('input', (e) => {
                    this.applyDocumentoMask(e.target);
                });
            });
        }

        console.log(`  ↳ Máscaras configuradas`);
    }

    /**
     * Atualiza máscara do campo documento baseado no tipo de pessoa
     *
     * @param {HTMLSelectElement} selectElement - Select de tipo de pessoa
     */
    updateDocumentoMask(selectElement) {
        const match = selectElement.name.match(/socio(\d+)_tipoPessoa/);
        if (!match) return;

        const index = match[1];
        const documentoField = document.querySelector(`[name="socio${index}_documento"]`);

        if (documentoField) {
            documentoField.value = ''; // Limpar campo ao trocar tipo
            documentoField.placeholder = selectElement.value === 'PF' ? '000.000.000-00' : '00.000.000/0000-00';
        }
    }

    /**
     * Aplica máscara CPF ou CNPJ baseado no comprimento
     *
     * @param {HTMLInputElement} field - Campo de documento
     */
    applyDocumentoMask(field) {
        if (!window.FieldFormatter) return;

        const value = field.value.replace(/\D/g, '');

        if (value.length <= 11) {
            // CPF
            field.value = window.FieldFormatter.formatCPF(field.value);
        } else {
            // CNPJ
            field.value = window.FieldFormatter.formatCNPJ(field.value);
        }
    }

    /**
     * Atualiza contador de número de sócios (campo readonly)
     */
    updateNumeroSocios() {
        const container = document.getElementById('socios-container');
        if (!container) return;

        const entries = container.querySelectorAll('.socio-entry');
        this.socioCount = entries.length;

        const numeroSociosField = document.getElementById('numeroSocios');
        if (numeroSociosField) {
            numeroSociosField.value = this.socioCount;
        }

        console.log(`  ↳ Número de sócios atualizado: ${this.socioCount}`);
    }

    /**
     * Valida se soma de participações = 100%
     * NO FALLBACKS - Requer FieldValidator obrigatório
     * @returns {boolean} true se válido (= 100%)
     * @throws {Error} Se validador não disponível ou dados inválidos
     */
    validateCapitalTotal() {
        if (!window.FieldValidator) {
            throw new Error('SecaoEmpresa: FieldValidator não disponível - dependência obrigatória');
        }

        const container = document.getElementById('socios-container');
        if (!container) {
            throw new Error('SecaoEmpresa: Container socios-container não encontrado');
        }

        const entries = container.querySelectorAll('.socio-entry');
        const participacoes = [];

        entries.forEach((entry, idx) => {
            const index = idx + 1;
            const participacaoField = entry.querySelector(`[name^="socio${index}_participacao"]`);

            if (!participacaoField) {
                throw new Error(`SecaoEmpresa: Campo participação do sócio ${index} não encontrado`);
            }

            participacoes.push(participacaoField.value);
        });

        // Validador lança exceção se inválido - NO FALLBACK
        const result = window.FieldValidator.validateCapitalTotal(participacoes);
        return result.isValid;
    }

    /**
     * Atualiza mensagem de validação de capital
     * NO FALLBACKS - Mostra erros explícitos no UI
     */
    updateCapitalValidation() {
        const container = document.getElementById('socios-container');
        if (!container) {
            console.error('SecaoEmpresa.updateCapitalValidation: container não encontrado');
            return;
        }

        const totalDisplay = document.getElementById('totalParticipacao');
        const statusDisplay = document.getElementById('validationStatus');
        const validationBox = document.getElementById('capital-validation');

        if (!totalDisplay || !statusDisplay || !validationBox) {
            console.error('SecaoEmpresa.updateCapitalValidation: elementos de UI não encontrados');
            return;
        }

        try {
            const entries = container.querySelectorAll('.socio-entry');
            const participacoes = [];

            entries.forEach((entry, idx) => {
                const index = idx + 1;
                const participacaoField = entry.querySelector(`[name^="socio${index}_participacao"]`);

                if (!participacaoField) {
                    throw new Error(`Campo participação do sócio ${index} não encontrado`);
                }

                participacoes.push(participacaoField.value);
            });

            // Check if all fields are empty (initial state) - NO FALLBACK
            const allEmpty = participacoes.every(p => p === '' || p === null || p === undefined);

            if (allEmpty) {
                // Initial empty state - show neutral message, don't validate
                totalDisplay.textContent = '0.00';
                statusDisplay.textContent = 'ℹ️ Aguardando preenchimento';
                validationBox.className = 'validation-message neutral';
                return; // Skip validator
            }

            // Validador pode lançar exceção - capturamos para mostrar no UI
            const result = window.FieldValidator.validateCapitalTotal(participacoes);

            // Atualizar display do total
            totalDisplay.textContent = result.total.toFixed(2);

            // Atualizar status de validação baseado no resultado
            statusDisplay.textContent = result.message;

            if (result.isValid) {
                statusDisplay.style.color = '#2e7d32';
                validationBox.className = 'validation-message valid';
            } else {
                statusDisplay.style.color = '#c62828';
                validationBox.className = 'validation-message invalid';
            }

        } catch (error) {
            // Mostrar erro de validação no UI
            totalDisplay.textContent = '0.00';
            statusDisplay.textContent = `❌ ${error.message}`;
            statusDisplay.style.color = '#c62828';
            validationBox.className = 'validation-message invalid';
            console.error('SecaoEmpresa.updateCapitalValidation:', error);
        }
    }

    /**
     * Coleta dados de todos os sócios da seção
     * NO FALLBACKS - Lança exceção se container ou campos ausentes
     * @returns {Array} Array de objetos com dados dos sócios
     * @throws {Error} Se container ou campos obrigatórios ausentes
     */
    coletarDadosSocios() {
        const container = document.getElementById('socios-container');
        if (!container) {
            throw new Error('SecaoEmpresa.coletarDadosSocios: Container socios-container não encontrado');
        }

        const entries = container.querySelectorAll('.socio-entry');
        const socios = [];

        entries.forEach((entry, idx) => {
            const index = idx + 1;

            // Helper que lança exceção se campo não existir - NO FALLBACK
            const getFieldValue = (suffix, required = true) => {
                const field = entry.querySelector(`[name="socio${index}_${suffix}"]`);

                if (!field) {
                    if (required) {
                        throw new Error(`Campo "${suffix}" do sócio ${index} não encontrado`);
                    }
                    return ''; // Campos opcionais retornam string vazia
                }

                return field.value;
            };

            // Obter participação e validar explicitamente - NO FALLBACK
            const participacaoStr = getFieldValue('participacao');
            const participacao = parseFloat(participacaoStr);

            if (isNaN(participacao)) {
                throw new Error(`Participação do sócio ${index} inválida: "${participacaoStr}"`);
            }

            const socio = {
                nome: getFieldValue('nome'),
                tipoPessoa: getFieldValue('tipoPessoa'),
                documento: getFieldValue('documento'),
                participacao: participacao,
                qualificacao: getFieldValue('qualificacao'),
                email: getFieldValue('email', false), // Opcional
                telefone: getFieldValue('telefone', false) // Opcional
            };

            socios.push(socio);
        });

        console.log(`✓ ${socios.length} sócios coletados`);
        return socios;
    }

    /**
     * Restaura dados de sócios na seção
     * NO FALLBACKS - Valida dados obrigatórios
     * @param {Array} dados - Array de dados dos sócios
     * @throws {Error} Se dados inválidos ou container ausente
     */
    restaurarDadosSocios(dados) {
        if (!Array.isArray(dados)) {
            throw new Error('SecaoEmpresa.restaurarDadosSocios: dados deve ser um array');
        }

        if (dados.length === 0) {
            throw new Error('SecaoEmpresa.restaurarDadosSocios: array de dados vazio');
        }

        const container = document.getElementById('socios-container');
        if (!container) {
            throw new Error('SecaoEmpresa.restaurarDadosSocios: Container socios-container não encontrado');
        }

        // Limpar sócios existentes (exceto o primeiro - template)
        const existingEntries = container.querySelectorAll('.socio-entry');
        existingEntries.forEach((entry, idx) => {
            if (idx > 0) entry.remove();
        });

        // Restaurar cada sócio
        dados.forEach((socio, idx) => {
            const index = idx + 1;

            // Validar que socio é um objeto
            if (!socio || typeof socio !== 'object') {
                throw new Error(`Sócio ${index} inválido: deve ser um objeto`);
            }

            // Se não for o primeiro, adicionar nova entrada
            if (index > 1) {
                this.addSocioEntry();
            }

            // Helper que lança exceção se campo não existir - NO FALLBACK
            const setFieldValue = (suffix, value) => {
                const field = document.querySelector(`[name="socio${index}_${suffix}"]`);

                if (!field) {
                    throw new Error(`Campo "${suffix}" do sócio ${index} não encontrado no DOM`);
                }

                // Converter valores para string, mas sem fallback para vazios
                const stringValue = (value === null || value === undefined) ? '' : String(value);
                field.value = stringValue;
            };

            // Restaurar campos (lança exceção se campo DOM não existir)
            setFieldValue('nome', socio.nome);
            setFieldValue('tipoPessoa', socio.tipoPessoa);
            setFieldValue('documento', socio.documento);
            setFieldValue('participacao', socio.participacao);
            setFieldValue('qualificacao', socio.qualificacao);
            setFieldValue('email', socio.email);
            setFieldValue('telefone', socio.telefone);
        });

        // Atualizar contador e validação
        this.updateNumeroSocios();
        this.updateCapitalValidation();

        console.log(`✓ ${dados.length} sócios restaurados na Seção 1`);
    }
}

// Inicializar quando DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    // Verificar se estamos no formulário de financiamento
    if (document.getElementById('socios-container')) {
        window.secaoEmpresa = new SecaoEmpresa();
        console.log('✓ SecaoEmpresa inicializada');
    }
});
