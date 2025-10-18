/* =====================================
   SECAO-REGIME-TRIBUTARIO.JS
   Módulo para Seção 3 - Regime Tributário e Premissas
   Tab 2.1 - Definição do regime tributário e parâmetros financeiros

   NO FALLBACKS - NO HARDCODED DATA - ONLY LEGAL DATA - KISS - DRY
   ===================================== */

class SecaoRegimeTributario {
    constructor() {
        this.isInitialized = false;
        this.config = null;  // Carregado de aliquotas-tributarias-2025.json
        this.init();
    }

    async init() {
        console.log('SecaoRegimeTributario: Iniciando...');

        try {
            // Carregar configuração legal OBRIGATÓRIA
            await this.loadConfig();

            if (!this.collectDOMReferences()) {
                console.warn('SecaoRegimeTributario: Campos não encontrados - seção ainda não renderizada');
                return;
            }

            this.setupEventListeners();
            this.isInitialized = true;
            console.log('✓ SecaoRegimeTributario inicializada');

        } catch (error) {
            console.error('SecaoRegimeTributario: Erro ao inicializar:', error);
            throw error;
        }
    }

    /**
     * Carregar configuração legal de alíquotas tributárias
     * NO FALLBACKS - OBRIGATÓRIO existir
     */
    async loadConfig() {
        try {
            const response = await fetch('/config/aliquotas-tributarias-2025.json');

            if (!response.ok) {
                throw new Error(`SecaoRegimeTributario: Config não encontrado (HTTP ${response.status}): ${response.url}`);
            }

            this.config = await response.json();

            // Validar estrutura obrigatória
            if (!this.config.simplesNacional || !this.config.simplesNacional.limiteAnual) {
                throw new Error('SecaoRegimeTributario: Config inválido - falta simplesNacional.limiteAnual');
            }

            if (!this.config.lucroPresumido || !this.config.lucroPresumido.limiteAnual) {
                throw new Error('SecaoRegimeTributario: Config inválido - falta lucroPresumido.limiteAnual');
            }

            console.log('✓ SecaoRegimeTributario: Config carregado', {
                simplesLimite: this.config.simplesNacional.limiteAnual,
                presumidoLimite: this.config.lucroPresumido.limiteAnual
            });

        } catch (error) {
            console.error('SecaoRegimeTributario: Erro ao carregar config:', error);
            throw new Error('SecaoRegimeTributario: Config aliquotas-tributarias-2025.json não disponível - obrigatório para o fluxo');
        }
    }

    /**
     * Coletar referências aos campos do DOM
     * @returns {boolean} true se campos obrigatórios existem
     */
    collectDOMReferences() {
        // Regime Tributário
        this.regimeTributario = document.getElementById('regimeTributario');
        this.simplesAnexo = document.getElementById('simplesAnexo');
        this.simplesAnexoGroup = document.getElementById('simplesAnexoGroup');

        // Setor Econômico
        this.setorEconomico = document.getElementById('setorEconomico');

        // Período de Projeção
        this.anoBase = document.getElementById('anoBase');
        this.periodoProjecao = document.getElementById('periodoProjecao');
        this.anoFinal = document.getElementById('anoFinal');

        // Parâmetros Financeiros
        this.tma = document.getElementById('tma');
        this.inflacaoAnual = document.getElementById('inflacaoAnual');
        this.pmr = document.getElementById('pmr');
        this.pmp = document.getElementById('pmp');
        this.percVendasPrazo = document.getElementById('percVendasPrazo');

        // Container de alertas
        this.alertaEnquadramento = document.getElementById('alertaEnquadramento');

        // Verificar se campos críticos existem
        return !!(this.regimeTributario && this.anoBase && this.periodoProjecao && this.tma);
    }

    /**
     * Configurar event listeners
     */
    setupEventListeners() {
        // Regime Tributário: mostrar/esconder Anexo Simples
        if (this.regimeTributario) {
            this.regimeTributario.addEventListener('change', () => {
                this.handleRegimeChange();
                this.validarEnquadramento();
            });
        }

        // Período: auto-calcular ano final
        if (this.periodoProjecao) {
            this.periodoProjecao.addEventListener('change', () => {
                this.calcularAnoFinal();
            });
            this.periodoProjecao.addEventListener('input', () => {
                this.calcularAnoFinal();
            });
        }

        if (this.anoBase) {
            this.anoBase.addEventListener('change', () => {
                this.calcularAnoFinal();
            });
            this.anoBase.addEventListener('input', () => {
                this.calcularAnoFinal();
            });
        }

        // Calcular ano final ao carregar a página (se valores já existem)
        if (this.anoBase && this.periodoProjecao) {
            this.calcularAnoFinal();
        }

        // Executar handleRegimeChange para configurar visibilidade inicial
        if (this.regimeTributario) {
            this.handleRegimeChange();
        }
    }

    /**
     * Mostrar/esconder Anexo Simples Nacional conforme regime selecionado
     */
    handleRegimeChange() {
        if (!this.regimeTributario || !this.simplesAnexoGroup) {
            return;
        }

        const regime = this.regimeTributario.value;

        if (regime === 'simples-nacional') {
            // Mostrar campo Anexo Simples
            this.simplesAnexoGroup.style.display = 'block';
            if (this.simplesAnexo) {
                this.simplesAnexo.setAttribute('required', 'required');
            }
        } else {
            // Esconder e limpar campo Anexo Simples
            this.simplesAnexoGroup.style.display = 'none';
            if (this.simplesAnexo) {
                this.simplesAnexo.removeAttribute('required');
                this.simplesAnexo.value = '';
            }
        }

        console.log(`SecaoRegimeTributario: Regime alterado para ${regime}`);
    }

    /**
     * Auto-calcular Ano Final = Ano Base + Período Projeção
     */
    calcularAnoFinal() {
        if (!this.anoBase || !this.periodoProjecao || !this.anoFinal) {
            return;
        }

        const anoBase = parseInt(this.anoBase.value);
        const periodo = parseInt(this.periodoProjecao.value);

        if (isNaN(anoBase) || isNaN(periodo)) {
            this.anoFinal.value = '';
            return;
        }

        const anoFinalCalculado = anoBase + periodo;
        this.anoFinal.value = anoFinalCalculado;

        console.log(`SecaoRegimeTributario: Ano Final = ${anoFinalCalculado} (${anoBase} + ${periodo})`);
    }

    /**
     * Validar enquadramento no Simples Nacional
     * APENAS validação LEGAL: receita anual < R$ 4,8 milhões (LC 123/2006)
     * Integra com Tab 8 (Receitas) quando disponível
     */
    validarEnquadramento() {
        if (!this.regimeTributario || !this.config) {
            return { isValid: true, errors: [] };
        }

        const regime = this.regimeTributario.value;
        const errors = [];

        // Validação aplica-se apenas ao Simples Nacional
        if (regime !== 'simples-nacional') {
            this.esconderAlerta();
            return { isValid: true, errors };
        }

        // Tentar buscar receita projetada do Tab 8 (se disponível)
        let receitaAnual = 0;

        try {
            // Integração com SecaoReceitas (se já inicializada)
            if (typeof window.secaoReceitas !== 'undefined' && window.secaoReceitas.isInitialized) {
                const dadosReceitas = window.secaoReceitas.coletarDadosReceitas();

                // Somar receitas de todos os produtos
                if (dadosReceitas && dadosReceitas.produtos) {
                    receitaAnual = dadosReceitas.produtos.reduce((total, produto) => {
                        return total + (produto.receitaAnual || 0);
                    }, 0);
                }
            }
        } catch (error) {
            console.warn('SecaoRegimeTributario: Não foi possível buscar receitas do Tab 8:', error);
        }

        // Limite legal do Simples Nacional (LC 123/2006)
        const limiteSimples = this.config.simplesNacional.limiteAnual;

        // Validar enquadramento
        if (receitaAnual > 0) {
            if (receitaAnual > limiteSimples) {
                errors.push(`Receita anual de R$ ${this.formatarMoeda(receitaAnual)} excede o limite do Simples Nacional (R$ ${this.formatarMoeda(limiteSimples)})`);

                this.exibirAlerta(
                    'danger',
                    `🔴 <strong>CRÍTICO:</strong> Receita projetada de <strong>R$ ${this.formatarMoeda(receitaAnual)}</strong> excede R$ ${this.formatarMoeda(limiteSimples)}/ano (limite Simples Nacional - LC 123/2006).<br>
                    <strong>Ação necessária:</strong> Migrar para <strong>Lucro Presumido</strong> ou <strong>Lucro Real</strong>.`
                );

                return { isValid: false, errors };
            } else {
                this.exibirAlerta(
                    'success',
                    `🟢 <strong>OK:</strong> Receita projetada de R$ ${this.formatarMoeda(receitaAnual)} está dentro do limite do Simples Nacional (R$ ${this.formatarMoeda(limiteSimples)}/ano).`
                );
            }
        } else {
            // Receitas ainda não preenchidas - alerta informativo
            this.exibirAlerta(
                'info',
                `ℹ️ <strong>Simples Nacional selecionado.</strong> Preencha o <strong>Tab 8 (Receitas)</strong> para validar enquadramento automaticamente.<br>
                <strong>Limite legal:</strong> R$ ${this.formatarMoeda(limiteSimples)}/ano (LC 123/2006).`
            );
        }

        return { isValid: errors.length === 0, errors };
    }

    /**
     * Exibir alerta visual
     * @param {string} tipo - 'danger', 'warning', 'success', 'info'
     * @param {string} mensagem - Texto do alerta (pode conter HTML)
     */
    exibirAlerta(tipo, mensagem) {
        if (!this.alertaEnquadramento) return;

        // Limpar classes anteriores
        this.alertaEnquadramento.className = 'alert';

        // Adicionar classe do tipo
        const classeMap = {
            'danger': 'alert-danger',
            'warning': 'alert-warning',
            'success': 'alert-success',
            'info': 'alert-info'
        };

        this.alertaEnquadramento.classList.add(classeMap[tipo] || 'alert-info');
        this.alertaEnquadramento.innerHTML = mensagem;
        this.alertaEnquadramento.style.display = 'block';
    }

    /**
     * Esconder alerta
     */
    esconderAlerta() {
        if (!this.alertaEnquadramento) return;
        this.alertaEnquadramento.style.display = 'none';
    }

    /**
     * Formatar valor monetário
     * @param {number} valor
     * @returns {string}
     */
    formatarMoeda(valor) {
        return valor.toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }

    /**
     * Coletar dados do Regime Tributário
     * API PÚBLICA - usado por financiamento-module.js
     * @returns {Object} Dados da seção
     */
    coletarDadosRegime() {
        if (!this.isInitialized) {
            throw new Error('SecaoRegimeTributario: Módulo não inicializado');
        }

        // Helper para obter valor de campo - NO FALLBACKS
        const getFieldValue = (field, fieldName, required = true) => {
            if (!field) {
                if (required) {
                    throw new Error(`SecaoRegimeTributario: Campo "${fieldName}" não encontrado no DOM`);
                }
                return '';
            }

            const value = field.value;

            if (required && !value) {
                throw new Error(`SecaoRegimeTributario: Campo "${fieldName}" é obrigatório`);
            }

            return value;
        };

        // Coletar dados
        const dados = {
            // Regime Tributário
            regimeTributario: getFieldValue(this.regimeTributario, 'regimeTributario'),
            simplesAnexo: this.regimeTributario?.value === 'simples-nacional'
                ? getFieldValue(this.simplesAnexo, 'simplesAnexo')
                : '',

            // Setor Econômico
            setorEconomico: getFieldValue(this.setorEconomico, 'setorEconomico'),

            // Período de Projeção
            anoBase: parseInt(getFieldValue(this.anoBase, 'anoBase')),
            periodoProjecao: parseInt(getFieldValue(this.periodoProjecao, 'periodoProjecao')),
            anoFinal: parseInt(getFieldValue(this.anoFinal, 'anoFinal', false)),

            // Parâmetros Financeiros (USUÁRIO define, não sistema)
            tma: parseFloat(getFieldValue(this.tma, 'tma')),
            inflacaoAnual: this.inflacaoAnual?.value ? parseFloat(this.inflacaoAnual.value) : null,
            pmr: parseInt(getFieldValue(this.pmr, 'pmr')),
            pmp: parseInt(getFieldValue(this.pmp, 'pmp')),
            percVendasPrazo: parseFloat(getFieldValue(this.percVendasPrazo, 'percVendasPrazo'))
        };

        // Validações básicas (tipo)
        if (isNaN(dados.anoBase)) {
            throw new Error('SecaoRegimeTributario: Ano base inválido');
        }

        if (isNaN(dados.periodoProjecao)) {
            throw new Error('SecaoRegimeTributario: Período de projeção inválido');
        }

        if (isNaN(dados.tma)) {
            throw new Error('SecaoRegimeTributario: TMA inválida');
        }

        // Validar enquadramento legal (APENAS)
        const validacaoEnquadramento = this.validarEnquadramento();
        if (!validacaoEnquadramento.isValid) {
            console.warn('SecaoRegimeTributario: Alerta de enquadramento:', validacaoEnquadramento.errors);
            // Não bloquear coleta, apenas alertar
        }

        console.log('✓ SecaoRegimeTributario: Dados coletados com sucesso');
        return dados;
    }

    /**
     * Restaurar dados do Regime Tributário
     * API PÚBLICA - usado por financiamento-module.js
     * @param {Object} dados - Dados para restaurar
     */
    restaurarDadosRegime(dados) {
        if (!dados || typeof dados !== 'object') {
            throw new Error('SecaoRegimeTributario.restaurarDadosRegime: dados inválidos');
        }

        console.log('SecaoRegimeTributario: Restaurando dados...', dados);

        // Helper para setar valor - NO FALLBACKS
        const setFieldValue = (field, value, fieldName) => {
            if (!field) {
                console.warn(`SecaoRegimeTributario: Campo "${fieldName}" não encontrado para restauração`);
                return;
            }

            field.value = (value === null || value === undefined) ? '' : String(value);
        };

        // Restaurar campos
        setFieldValue(this.regimeTributario, dados.regimeTributario, 'regimeTributario');
        setFieldValue(this.simplesAnexo, dados.simplesAnexo, 'simplesAnexo');
        setFieldValue(this.setorEconomico, dados.setorEconomico, 'setorEconomico');
        setFieldValue(this.anoBase, dados.anoBase, 'anoBase');
        setFieldValue(this.periodoProjecao, dados.periodoProjecao, 'periodoProjecao');
        setFieldValue(this.anoFinal, dados.anoFinal, 'anoFinal');
        setFieldValue(this.tma, dados.tma, 'tma');
        setFieldValue(this.inflacaoAnual, dados.inflacaoAnual, 'inflacaoAnual');
        setFieldValue(this.pmr, dados.pmr, 'pmr');
        setFieldValue(this.pmp, dados.pmp, 'pmp');
        setFieldValue(this.percVendasPrazo, dados.percVendasPrazo, 'percVendasPrazo');

        // Executar lógica condicional e validações
        this.handleRegimeChange();
        this.calcularAnoFinal();
        this.validarEnquadramento();

        console.log('✓ SecaoRegimeTributario: Dados restaurados com sucesso');
    }

    /**
     * Validar seção completa
     * @returns {Object} {isValid, errors}
     */
    validarSecao() {
        const errors = [];

        // Validar campos obrigatórios
        if (!this.regimeTributario || !this.regimeTributario.value) {
            errors.push('Regime tributário não selecionado');
        }

        if (this.regimeTributario?.value === 'simples-nacional') {
            if (!this.simplesAnexo || !this.simplesAnexo.value) {
                errors.push('Anexo do Simples Nacional não selecionado');
            }
        }

        if (!this.setorEconomico || !this.setorEconomico.value) {
            errors.push('Setor econômico não selecionado');
        }

        if (!this.anoBase || !this.anoBase.value) {
            errors.push('Ano base não informado');
        }

        if (!this.periodoProjecao || !this.periodoProjecao.value) {
            errors.push('Período de projeção não informado');
        }

        if (!this.tma || !this.tma.value) {
            errors.push('TMA não informada');
        }

        if (!this.pmr || !this.pmr.value) {
            errors.push('PMR não informado');
        }

        if (!this.pmp || !this.pmp.value) {
            errors.push('PMP não informado');
        }

        if (!this.percVendasPrazo || this.percVendasPrazo.value === '') {
            errors.push('% Vendas a Prazo não informado');
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
            window.secaoRegimeTributario = new SecaoRegimeTributario();
        });
    } else {
        window.secaoRegimeTributario = new SecaoRegimeTributario();
    }
}
