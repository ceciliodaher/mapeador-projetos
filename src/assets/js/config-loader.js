/* =====================================
   CONFIG-LOADER.JS
   Carregador centralizado de configurações
   NO FALLBACKS - Falha explicitamente se config ausente
   ===================================== */

class ConfigLoader {
    constructor() {
        this.config = null;
        this.configPath = '/config/progoias-icms-config.json';
    }

    /**
     * Carrega configuração do arquivo JSON
     * Lança erro se arquivo não encontrado ou inválido
     * @returns {Promise<Object>} Configuração carregada
     */
    async loadConfig() {
        if (this.config) {
            return this.config;
        }

        try {
            const response = await fetch(this.configPath);

            if (!response.ok) {
                throw new Error(
                    `Falha ao carregar configuração (HTTP ${response.status}): ${response.statusText}`
                );
            }

            this.config = await response.json();

            // Validar estrutura obrigatória
            this.validateConfig();

            console.log('[ConfigLoader] Configuração carregada com sucesso:', this.config.versao);
            return this.config;

        } catch (error) {
            const errorMsg = `ERRO CRÍTICO: Não foi possível carregar ${this.configPath}. ${error.message}`;
            console.error('[ConfigLoader]', errorMsg);
            throw new Error(errorMsg);
        }
    }

    /**
     * Valida estrutura obrigatória da configuração
     * Lança erro se campos essenciais ausentes
     */
    validateConfig() {
        const required = [
            'versao',
            'tiposInsumo',
            'regioes',
            'escalonamento',
            'beneficio',
            'validacoes',
            'mensagensErro'
        ];

        required.forEach(key => {
            if (!this.config[key]) {
                throw new Error(
                    `Configuração inválida: campo "${key}" obrigatório ausente`
                );
            }
        });

        // Validar subestrutura de regiões
        if (!this.config.regioes.origem || !Array.isArray(this.config.regioes.origem)) {
            throw new Error('Configuração inválida: regioes.origem deve ser array');
        }
        if (!this.config.regioes.destino || !Array.isArray(this.config.regioes.destino)) {
            throw new Error('Configuração inválida: regioes.destino deve ser array');
        }

        // Validar tipos de insumo
        if (typeof this.config.tiposInsumo !== 'object' || Object.keys(this.config.tiposInsumo).length === 0) {
            throw new Error('Configuração inválida: tiposInsumo deve conter pelo menos um tipo');
        }

        // Validar escalonamento
        if (!this.config.escalonamento.anos || !Array.isArray(this.config.escalonamento.anos)) {
            throw new Error('Configuração inválida: escalonamento.anos deve ser array');
        }
        if (!this.config.escalonamento.anosProjeca || this.config.escalonamento.anosProjeca < 1) {
            throw new Error('Configuração inválida: escalonamento.anosProjeca deve ser número positivo');
        }

        // Validar benefício
        if (this.config.beneficio.percentualProgoias === undefined ||
            this.config.beneficio.percentualProgoias < 0 ||
            this.config.beneficio.percentualProgoias > 1) {
            throw new Error('Configuração inválida: beneficio.percentualProgoias deve estar entre 0 e 1');
        }
        if (this.config.beneficio.investimentoMinimo === undefined ||
            this.config.beneficio.investimentoMinimo < 0 ||
            this.config.beneficio.investimentoMinimo > 1) {
            throw new Error('Configuração inválida: beneficio.investimentoMinimo deve estar entre 0 e 1');
        }

        // Validar validações (meta!)
        const requiredValidations = [
            'toleranciaPercentual',
            'aliquotaMinima',
            'aliquotaMaxima',
            'camposObrigatoriosProduto',
            'camposObrigatoriosInsumo',
            'camposObrigatoriosEscalonamento'
        ];

        requiredValidations.forEach(key => {
            if (this.config.validacoes[key] === undefined) {
                throw new Error(`Configuração inválida: validacoes.${key} obrigatório`);
            }
        });
    }

    /**
     * Retorna configuração carregada
     * Lança erro se configuração não foi carregada ainda
     * @returns {Object} Configuração
     */
    getConfig() {
        if (!this.config) {
            throw new Error(
                this.config?.mensagensErro?.configNaoCarregada ||
                'Configuração não carregada. Execute loadConfig() primeiro.'
            );
        }
        return this.config;
    }

    /**
     * Retorna mensagem de erro configurada
     * @param {string} chave - Chave da mensagem
     * @param {Object} substituicoes - Valores para substituir placeholders
     * @returns {string} Mensagem formatada
     */
    getErrorMessage(chave, substituicoes = {}) {
        const config = this.getConfig();
        let mensagem = config.mensagensErro[chave];

        if (!mensagem) {
            throw new Error(`Mensagem de erro "${chave}" não encontrada na configuração`);
        }

        // Substituir placeholders {key} pelos valores
        Object.keys(substituicoes).forEach(key => {
            mensagem = mensagem.replace(new RegExp(`\\{${key}\\}`, 'g'), substituicoes[key]);
        });

        return mensagem;
    }

    /**
     * Valida se um tipo de insumo é válido
     * @param {string} tipo - Tipo a validar (MP, IS, ME, EE)
     * @returns {boolean}
     */
    isValidTipoInsumo(tipo) {
        const config = this.getConfig();
        return Object.keys(config.tiposInsumo).includes(tipo);
    }

    /**
     * Retorna lista de tipos de insumo válidos
     * @returns {Array<string>}
     */
    getTiposInsumo() {
        const config = this.getConfig();
        return Object.keys(config.tiposInsumo);
    }

    /**
     * Retorna nome descritivo de um tipo de insumo
     * @param {string} tipo - Código do tipo (MP, IS, ME, EE)
     * @returns {string}
     */
    getNomeTipoInsumo(tipo) {
        const config = this.getConfig();
        if (!config.tiposInsumo[tipo]) {
            throw new Error(`Tipo de insumo "${tipo}" não encontrado na configuração`);
        }
        return config.tiposInsumo[tipo];
    }

    /**
     * Retorna nome descritivo de uma região
     * @param {string} regiao - Código da região
     * @returns {string}
     */
    getNomeRegiao(regiao) {
        const config = this.getConfig();
        if (!config.regioes.nomes[regiao]) {
            throw new Error(`Região "${regiao}" não encontrada na configuração`);
        }
        return config.regioes.nomes[regiao];
    }

    /**
     * Retorna lista de anos de escalonamento
     * @returns {Array<string>}
     */
    getAnosEscalonamento() {
        const config = this.getConfig();
        return config.escalonamento.anos;
    }

    /**
     * Retorna label de um ano de escalonamento
     * @param {string} ano - Código do ano (ano1, ano2, etc)
     * @returns {string}
     */
    getLabelAno(ano) {
        const config = this.getConfig();
        if (!config.escalonamento.labels[ano]) {
            throw new Error(`Label para ano "${ano}" não encontrado na configuração`);
        }
        return config.escalonamento.labels[ano];
    }

    /**
     * Retorna número de anos de projeção
     * @returns {number}
     */
    getAnosProjecao() {
        const config = this.getConfig();
        return config.escalonamento.anosProjeca;
    }

    /**
     * Retorna percentual de benefício ProGoiás
     * @returns {number}
     */
    getPercentualBeneficio() {
        const config = this.getConfig();
        return config.beneficio.percentualProgoias;
    }

    /**
     * Retorna percentual de investimento mínimo
     * @returns {number}
     */
    getInvestimentoMinimo() {
        const config = this.getConfig();
        return config.beneficio.investimentoMinimo;
    }

    /**
     * Retorna tolerância para validação de percentuais
     * @returns {number}
     */
    getToleranciaPercentual() {
        const config = this.getConfig();
        return config.validacoes.toleranciaPercentual;
    }

    /**
     * Retorna limites de alíquota
     * @returns {Object} {minima, maxima}
     */
    getLimitesAliquota() {
        const config = this.getConfig();
        return {
            minima: config.validacoes.aliquotaMinima,
            maxima: config.validacoes.aliquotaMaxima
        };
    }
}

// Criar instância singleton global
if (typeof window !== 'undefined') {
    window.configLoader = new ConfigLoader();
    console.log('[ConfigLoader] Instância global criada: window.configLoader');
}

// Export para módulos ES6
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ConfigLoader;
}
