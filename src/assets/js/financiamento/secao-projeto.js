/* =====================================
   SECAO-PROJETO.JS
   Módulo para Seção 2 - Caracterização do Projeto
   Sprint 7 - Dados descritivos, localização e cronograma

   NO FALLBACKS - NO HARDCODED DATA - KISS - DRY
   ===================================== */

class SecaoProjeto {
    constructor() {
        this.isInitialized = false;
        this.init();
    }

    init() {
        console.log('SecaoProjeto: Iniciando...');

        if (!this.collectDOMReferences()) {
            console.warn('SecaoProjeto: Campos não encontrados - seção ainda não renderizada');
            return;
        }

        this.setupEventListeners();
        this.isInitialized = true;
        console.log('✓ SecaoProjeto inicializada');
    }

    /**
     * Coletar referências aos campos do DOM
     * @returns {boolean} true se campos obrigatórios existem
     */
    collectDOMReferences() {
        // Campos obrigatórios
        this.tipoProjeto = document.getElementById('tipoProjeto');
        this.objetivoProjeto = document.getElementById('objetivoProjeto');
        this.descricaoDetalhada = document.getElementById('descricaoDetalhada');

        // Localização
        this.usarEnderecoEmpresa = document.getElementById('usarEnderecoEmpresa');
        this.cep = document.getElementById('cepProjeto');
        this.endereco = document.getElementById('enderecoProjeto');
        this.numero = document.getElementById('numeroProjeto');
        this.complemento = document.getElementById('complementoProjeto');
        this.bairro = document.getElementById('bairroProjeto');
        this.cidade = document.getElementById('cidadeProjeto');
        this.uf = document.getElementById('ufProjeto');

        // Área
        this.areaTotalM2 = document.getElementById('areaTotalM2');

        // Cronograma
        this.dataInicioProjeto = document.getElementById('dataInicioProjeto');
        this.dataFimImplantacao = document.getElementById('dataFimImplantacao');
        this.dataInicioOperacao = document.getElementById('dataInicioOperacao');
        this.prazoTotalMeses = document.getElementById('prazoTotalMeses');

        // Análise
        this.analiseMercado = document.getElementById('analiseMercado');
        this.justificativaEconomica = document.getElementById('justificativaEconomica');

        // Verificar se campos críticos existem
        return !!(this.tipoProjeto && this.dataInicioProjeto && this.prazoTotalMeses);
    }

    /**
     * Configurar event listeners
     */
    setupEventListeners() {
        // Checkbox "Usar endereço da empresa"
        if (this.usarEnderecoEmpresa) {
            this.usarEnderecoEmpresa.addEventListener('change', () => {
                this.handleUsarEnderecoEmpresa();
            });
        }

        // Listeners para cálculo automático de prazo
        if (this.dataInicioProjeto && this.dataFimImplantacao) {
            this.dataInicioProjeto.addEventListener('change', () => this.calcularPrazoTotal());
            this.dataFimImplantacao.addEventListener('change', () => this.calcularPrazoTotal());
        }

        // Validação em tempo real para datas
        if (this.dataInicioProjeto && this.dataFimImplantacao && this.dataInicioOperacao) {
            this.dataInicioProjeto.addEventListener('change', () => this.validarDatas());
            this.dataFimImplantacao.addEventListener('change', () => this.validarDatas());
            this.dataInicioOperacao.addEventListener('change', () => this.validarDatas());
        }
    }

    /**
     * Usar endereço da empresa (checkbox)
     */
    handleUsarEnderecoEmpresa() {
        if (!this.usarEnderecoEmpresa) return;

        if (this.usarEnderecoEmpresa.checked) {
            // Buscar dados da Seção 1
            if (typeof window.secaoEmpresa !== 'undefined') {
                try {
                    const enderecoEmpresa = this.getEnderecoEmpresa();
                    this.preencherLocalizacao(enderecoEmpresa);
                    this.setLocalizacaoReadonly(true);
                } catch (error) {
                    console.error('SecaoProjeto: Erro ao buscar endereço da empresa:', error);
                    this.usarEnderecoEmpresa.checked = false;
                    alert('Não foi possível carregar o endereço da empresa. Verifique se a Seção 1 está preenchida.');
                }
            } else {
                console.warn('SecaoProjeto: secaoEmpresa não disponível');
                this.usarEnderecoEmpresa.checked = false;
                alert('Seção 1 (Empresa) ainda não foi carregada. Preencha manualmente.');
            }
        } else {
            // Limpar e habilitar edição
            this.limparLocalizacao();
            this.setLocalizacaoReadonly(false);
        }
    }

    /**
     * Buscar endereço da empresa (Seção 1)
     * @returns {Object} Objeto com dados de endereço
     */
    getEnderecoEmpresa() {
        // Tentar via método público da secaoEmpresa (se existir)
        if (window.secaoEmpresa && typeof window.secaoEmpresa.getEndereco === 'function') {
            return window.secaoEmpresa.getEndereco();
        }

        // Fallback: buscar diretamente dos campos do DOM da Seção 1
        const endereco = {
            cep: this.getFieldValueById('cep'),
            endereco: this.getFieldValueById('endereco'),
            numero: this.getFieldValueById('numero'),
            complemento: this.getFieldValueById('complemento'),
            bairro: this.getFieldValueById('bairro'),
            municipio: this.getFieldValueById('municipio'),
            uf: this.getFieldValueById('uf')
        };

        // Validar se pelo menos alguns campos essenciais foram encontrados
        if (!endereco.uf || !endereco.municipio) {
            throw new Error('Endereço da empresa incompleto');
        }

        return endereco;
    }

    /**
     * Helper para buscar valor de campo por ID
     */
    getFieldValueById(id) {
        const field = document.getElementById(id);
        return field ? field.value : '';
    }

    /**
     * Preencher campos de localização
     * @param {Object} endereco - Dados de endereço
     */
    preencherLocalizacao(endereco) {
        if (this.cep) this.cep.value = endereco.cep || '';
        if (this.endereco) this.endereco.value = endereco.endereco || '';
        if (this.numero) this.numero.value = endereco.numero || '';
        if (this.complemento) this.complemento.value = endereco.complemento || '';
        if (this.bairro) this.bairro.value = endereco.bairro || '';
        if (this.cidade) this.cidade.value = endereco.municipio || '';
        if (this.uf) this.uf.value = endereco.uf || '';
    }

    /**
     * Limpar campos de localização
     */
    limparLocalizacao() {
        if (this.cep) this.cep.value = '';
        if (this.endereco) this.endereco.value = '';
        if (this.numero) this.numero.value = '';
        if (this.complemento) this.complemento.value = '';
        if (this.bairro) this.bairro.value = '';
        if (this.cidade) this.cidade.value = '';
        if (this.uf) this.uf.value = '';
    }

    /**
     * Habilitar/desabilitar edição dos campos de localização
     */
    setLocalizacaoReadonly(readonly) {
        const fields = [this.cep, this.endereco, this.numero, this.complemento,
                       this.bairro, this.cidade, this.uf];

        fields.forEach(field => {
            if (field) {
                field.readOnly = readonly;
                field.style.backgroundColor = readonly ? '#f0f0f0' : '';
                field.style.cursor = readonly ? 'not-allowed' : '';
            }
        });
    }

    /**
     * Calcular prazo total em meses
     */
    calcularPrazoTotal() {
        if (!this.dataInicioProjeto || !this.dataFimImplantacao || !this.prazoTotalMeses) {
            return;
        }

        const dataInicio = this.dataInicioProjeto.value;
        const dataFim = this.dataFimImplantacao.value;

        if (!dataInicio || !dataFim) {
            this.prazoTotalMeses.value = '';
            return;
        }

        const inicio = new Date(dataInicio);
        const fim = new Date(dataFim);

        // Calcular diferença em meses
        const diffTime = fim.getTime() - inicio.getTime();
        const diffDays = diffTime / (1000 * 60 * 60 * 24);
        const diffMonths = Math.ceil(diffDays / 30);

        this.prazoTotalMeses.value = diffMonths > 0 ? diffMonths : 0;
    }

    /**
     * Validar datas (fim > início, operação ≥ fim)
     * @returns {Object} {isValid, errors}
     */
    validarDatas() {
        const errors = [];

        if (!this.dataInicioProjeto || !this.dataFimImplantacao || !this.dataInicioOperacao) {
            return { isValid: true, errors };
        }

        const dataInicio = this.dataInicioProjeto.value;
        const dataFim = this.dataFimImplantacao.value;
        const dataOp = this.dataInicioOperacao.value;

        // Se algum campo estiver vazio, não validar ainda
        if (!dataInicio || !dataFim || !dataOp) {
            return { isValid: true, errors };
        }

        const inicio = new Date(dataInicio);
        const fim = new Date(dataFim);
        const operacao = new Date(dataOp);

        // Validação 1: Data fim deve ser posterior à data início
        if (fim <= inicio) {
            errors.push('Data fim de implantação deve ser posterior à data início do projeto');
            this.dataFimImplantacao.setCustomValidity('Data inválida');
        } else {
            this.dataFimImplantacao.setCustomValidity('');
        }

        // Validação 2: Data operação deve ser >= data fim
        if (operacao < fim) {
            errors.push('Data início de operação deve ser igual ou posterior à data fim de implantação');
            this.dataInicioOperacao.setCustomValidity('Data inválida');
        } else {
            this.dataInicioOperacao.setCustomValidity('');
        }

        // Mostrar alertas se houver erros
        if (errors.length > 0) {
            console.warn('SecaoProjeto: Validação de datas:', errors);
            // Não fazer alert aqui para não incomodar o usuário durante o preenchimento
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Coletar dados da Seção 2
     * API PÚBLICA - usado por financiamento-module.js
     * @returns {Object} Dados da seção
     */
    coletarDadosProjeto() {
        if (!this.isInitialized) {
            throw new Error('SecaoProjeto: Módulo não inicializado');
        }

        // Helper para obter valor de campo - NO FALLBACKS
        const getFieldValue = (field, fieldName, required = true) => {
            if (!field) {
                if (required) {
                    throw new Error(`SecaoProjeto: Campo "${fieldName}" não encontrado no DOM`);
                }
                return '';
            }

            const value = field.value;

            if (required && !value) {
                throw new Error(`SecaoProjeto: Campo "${fieldName}" é obrigatório`);
            }

            return value;
        };

        // Coletar dados
        const dados = {
            // Tipo e Descrição
            tipoProjeto: getFieldValue(this.tipoProjeto, 'tipoProjeto'),
            objetivoProjeto: getFieldValue(this.objetivoProjeto, 'objetivoProjeto'),
            descricaoDetalhada: getFieldValue(this.descricaoDetalhada, 'descricaoDetalhada'),

            // Localização
            usarEnderecoEmpresa: this.usarEnderecoEmpresa ? this.usarEnderecoEmpresa.checked : false,
            cep: getFieldValue(this.cep, 'cep', false),
            endereco: getFieldValue(this.endereco, 'endereco', false),
            numero: getFieldValue(this.numero, 'numero', false),
            complemento: getFieldValue(this.complemento, 'complemento', false),
            bairro: getFieldValue(this.bairro, 'bairro', false),
            cidade: getFieldValue(this.cidade, 'cidade', false),
            uf: getFieldValue(this.uf, 'uf', false),

            // Área
            areaTotalM2: parseFloat(getFieldValue(this.areaTotalM2, 'areaTotalM2')),

            // Cronograma
            dataInicioProjeto: getFieldValue(this.dataInicioProjeto, 'dataInicioProjeto'),
            dataFimImplantacao: getFieldValue(this.dataFimImplantacao, 'dataFimImplantacao'),
            dataInicioOperacao: getFieldValue(this.dataInicioOperacao, 'dataInicioOperacao'),
            prazoTotalMeses: parseInt(getFieldValue(this.prazoTotalMeses, 'prazoTotalMeses')),

            // Análise
            analiseMercado: getFieldValue(this.analiseMercado, 'analiseMercado'),
            justificativaEconomica: getFieldValue(this.justificativaEconomica, 'justificativaEconomica')
        };

        // Validações
        if (isNaN(dados.areaTotalM2) || dados.areaTotalM2 <= 0) {
            throw new Error('Área total deve ser um número maior que zero');
        }

        if (isNaN(dados.prazoTotalMeses)) {
            throw new Error('Prazo total inválido - verifique as datas do cronograma');
        }

        // Validar datas
        const validacao = this.validarDatas();
        if (!validacao.isValid) {
            throw new Error(`Datas inválidas: ${validacao.errors.join('; ')}`);
        }

        console.log('✓ SecaoProjeto: Dados coletados com sucesso');
        return dados;
    }

    /**
     * Restaurar dados da Seção 2
     * API PÚBLICA - usado por financiamento-module.js
     * @param {Object} dados - Dados para restaurar
     */
    restaurarDadosProjeto(dados) {
        if (!dados || typeof dados !== 'object') {
            throw new Error('SecaoProjeto.restaurarDadosProjeto: dados inválidos');
        }

        console.log('SecaoProjeto: Restaurando dados...', dados);

        // Helper para setar valor - NO FALLBACKS
        const setFieldValue = (field, value, fieldName) => {
            if (!field) {
                console.warn(`SecaoProjeto: Campo "${fieldName}" não encontrado para restauração`);
                return;
            }

            field.value = (value === null || value === undefined) ? '' : String(value);
        };

        // Restaurar campos
        setFieldValue(this.tipoProjeto, dados.tipoProjeto, 'tipoProjeto');
        setFieldValue(this.objetivoProjeto, dados.objetivoProjeto, 'objetivoProjeto');
        setFieldValue(this.descricaoDetalhada, dados.descricaoDetalhada, 'descricaoDetalhada');

        // Localização
        if (this.usarEnderecoEmpresa) {
            this.usarEnderecoEmpresa.checked = dados.usarEnderecoEmpresa || false;
            if (dados.usarEnderecoEmpresa) {
                // Desabilitar edição se usar endereço da empresa
                this.setLocalizacaoReadonly(true);
            }
        }

        setFieldValue(this.cep, dados.cep, 'cep');
        setFieldValue(this.endereco, dados.endereco, 'endereco');
        setFieldValue(this.numero, dados.numero, 'numero');
        setFieldValue(this.complemento, dados.complemento, 'complemento');
        setFieldValue(this.bairro, dados.bairro, 'bairro');
        setFieldValue(this.cidade, dados.cidade, 'cidade');
        setFieldValue(this.uf, dados.uf, 'uf');

        // Área
        setFieldValue(this.areaTotalM2, dados.areaTotalM2, 'areaTotalM2');

        // Cronograma
        setFieldValue(this.dataInicioProjeto, dados.dataInicioProjeto, 'dataInicioProjeto');
        setFieldValue(this.dataFimImplantacao, dados.dataFimImplantacao, 'dataFimImplantacao');
        setFieldValue(this.dataInicioOperacao, dados.dataInicioOperacao, 'dataInicioOperacao');
        setFieldValue(this.prazoTotalMeses, dados.prazoTotalMeses, 'prazoTotalMeses');

        // Análise
        setFieldValue(this.analiseMercado, dados.analiseMercado, 'analiseMercado');
        setFieldValue(this.justificativaEconomica, dados.justificativaEconomica, 'justificativaEconomica');

        // Recalcular prazo (caso as datas tenham sido restauradas)
        this.calcularPrazoTotal();

        console.log('✓ SecaoProjeto: Dados restaurados com sucesso');
    }

    /**
     * Validar seção completa
     * @returns {Object} {isValid, errors}
     */
    validarSecao() {
        const errors = [];

        // Validar campos obrigatórios
        if (!this.tipoProjeto || !this.tipoProjeto.value) {
            errors.push('Tipo de projeto não selecionado');
        }

        if (!this.objetivoProjeto || !this.objetivoProjeto.value ||
            this.objetivoProjeto.value.length < 50) {
            errors.push('Objetivo do projeto deve ter no mínimo 50 caracteres');
        }

        if (!this.descricaoDetalhada || !this.descricaoDetalhada.value ||
            this.descricaoDetalhada.value.length < 100) {
            errors.push('Descrição detalhada deve ter no mínimo 100 caracteres');
        }

        // Validar área
        const area = this.areaTotalM2 ? parseFloat(this.areaTotalM2.value) : 0;
        if (isNaN(area) || area <= 0) {
            errors.push('Área total deve ser maior que zero');
        }

        // Validar datas
        const validacaoDatas = this.validarDatas();
        if (!validacaoDatas.isValid) {
            errors.push(...validacaoDatas.errors);
        }

        // Validar análise
        if (!this.analiseMercado || !this.analiseMercado.value ||
            this.analiseMercado.value.length < 50) {
            errors.push('Análise de mercado deve ter no mínimo 50 caracteres');
        }

        if (!this.justificativaEconomica || !this.justificativaEconomica.value ||
            this.justificativaEconomica.value.length < 50) {
            errors.push('Justificativa econômica deve ter no mínimo 50 caracteres');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }
}

// Export global - CRÍTICO para integração
if (typeof window !== 'undefined') {
    // Inicializar quando DOM estiver pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.secaoProjeto = new SecaoProjeto();
        });
    } else {
        window.secaoProjeto = new SecaoProjeto();
    }
}
