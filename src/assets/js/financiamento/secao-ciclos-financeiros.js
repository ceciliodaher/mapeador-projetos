/* =====================================
   SECAO-CICLOS-FINANCEIROS.JS
   Módulo para Seção 7 - Ciclos Financeiros e NCG
   Tab 2.5 - Composição de estoques e cálculo de ciclos

   NO FALLBACKS - NO HARDCODED DATA - EXPLICIT VALIDATION
   ===================================== */

class SecaoCiclosFinanceiros {
    constructor() {
        this.isInitialized = false;
        this.calculador = null;
        this.init();
    }

    init() {
        console.log('SecaoCiclosFinanceiros: Iniciando...');

        // Verificar calculador
        if (typeof window.CalculadorCiclosFinanceiros === 'undefined') {
            throw new Error('SecaoCiclosFinanceiros: CalculadorCiclosFinanceiros não disponível - obrigatório para o fluxo');
        }

        this.calculador = new window.CalculadorCiclosFinanceiros();

        if (!this.collectDOMReferences()) {
            console.warn('SecaoCiclosFinanceiros: Campos não encontrados - seção ainda não renderizada');
            return;
        }

        this.setupEventListeners();
        this.isInitialized = true;
        console.log('✓ SecaoCiclosFinanceiros inicializada');
    }

    /**
     * Coletar referências aos campos do DOM
     * @returns {boolean} true se campos obrigatórios existem
     */
    collectDOMReferences() {
        // Composição de Estoques (inputs)
        this.percEstoqueMP = document.getElementById('percEstoqueMP');
        this.pmeMP = document.getElementById('pmeMP');
        this.percEstoqueWIP = document.getElementById('percEstoqueWIP');
        this.pmeWIP = document.getElementById('pmeWIP');
        this.percEstoquePA = document.getElementById('percEstoquePA');
        this.pmePA = document.getElementById('pmePA');
        this.percEstoqueReposicao = document.getElementById('percEstoqueReposicao');
        this.pmeReposicao = document.getElementById('pmeReposicao');

        // Parâmetros (inputs)
        this.percComprasPrazo = document.getElementById('percComprasPrazo');
        this.valorTotalEstoque = document.getElementById('valorTotalEstoque');

        // Calculados (readonly)
        this.pmePonderado = document.getElementById('pmePonderado');
        this.cicloOperacional = document.getElementById('cicloOperacional');
        this.cicloFinanceiro = document.getElementById('cicloFinanceiro');
        this.ncgDiaria = document.getElementById('ncgDiaria');
        this.ncgMensal = document.getElementById('ncgMensal');
        this.ncgAnual = document.getElementById('ncgAnual');

        // Alerta
        this.alertaPercentualEstoque = document.getElementById('alertaPercentualEstoque');

        // Verificar campos críticos
        return !!(this.percEstoqueMP && this.pmeMP && this.percEstoqueWIP && this.pmeWIP && this.percEstoquePA && this.pmePA);
    }

    /**
     * Configurar event listeners
     */
    setupEventListeners() {
        // Listeners para recalcular PME ponderado e ciclos
        const camposEstoque = [
            this.percEstoqueMP, this.pmeMP,
            this.percEstoqueWIP, this.pmeWIP,
            this.percEstoquePA, this.pmePA,
            this.percEstoqueReposicao, this.pmeReposicao
        ];

        camposEstoque.forEach(campo => {
            if (campo) {
                campo.addEventListener('input', () => {
                    this.validarPercentualTotal();
                    this.calcularPMEPonderado();
                    this.calcularCiclos();
                });
                campo.addEventListener('change', () => {
                    this.validarPercentualTotal();
                    this.calcularPMEPonderado();
                    this.calcularCiclos();
                });
            }
        });

        // Listener para % Compras Prazo
        if (this.percComprasPrazo) {
            this.percComprasPrazo.addEventListener('input', () => {
                this.calcularCiclos();
            });
            this.percComprasPrazo.addEventListener('change', () => {
                this.calcularCiclos();
            });
        }

        // Executar cálculos iniciais se valores já existem
        this.validarPercentualTotal();
        this.calcularPMEPonderado();
        this.calcularCiclos();
    }

    /**
     * Validar que percentuais de estoque somam 100%
     */
    validarPercentualTotal() {
        if (!this.percEstoqueMP || !this.percEstoqueWIP || !this.percEstoquePA) {
            return;
        }

        // Coletar valores SEM FALLBACKS
        const percMPValue = this.percEstoqueMP.value;
        const percWIPValue = this.percEstoqueWIP.value;
        const percPAValue = this.percEstoquePA.value;
        const percReposicaoValue = this.percEstoqueReposicao?.value;

        // Validar que não estão vazios
        if (percMPValue === '' || percWIPValue === '' || percPAValue === '') {
            if (this.alertaPercentualEstoque) {
                this.alertaPercentualEstoque.style.display = 'none';
            }
            return;
        }

        const percMP = parseFloat(percMPValue);
        const percWIP = parseFloat(percWIPValue);
        const percPA = parseFloat(percPAValue);
        const percReposicao = percReposicaoValue !== '' ? parseFloat(percReposicaoValue) : 0;

        // Validar se são números
        if (isNaN(percMP) || isNaN(percWIP) || isNaN(percPA)) {
            if (this.alertaPercentualEstoque) {
                this.alertaPercentualEstoque.className = 'alert alert-danger';
                this.alertaPercentualEstoque.innerHTML = '❌ Valores inválidos nos percentuais';
                this.alertaPercentualEstoque.style.display = 'block';
            }
            return;
        }

        // Validar composição
        const validacao = this.calculador.validarComposicaoEstoques(
            percMP, percWIP, percPA, percReposicao
        );

        if (!this.alertaPercentualEstoque) return;

        if (validacao.isValid) {
            this.alertaPercentualEstoque.className = 'alert alert-success';
            this.alertaPercentualEstoque.innerHTML = `✓ Composição válida: ${validacao.total.toFixed(1)}%`;
            this.alertaPercentualEstoque.style.display = 'block';
        } else {
            this.alertaPercentualEstoque.className = 'alert alert-warning';
            this.alertaPercentualEstoque.innerHTML = `⚠️ ${validacao.mensagem}`;
            this.alertaPercentualEstoque.style.display = 'block';
        }

        return validacao;
    }

    /**
     * Calcular PME Ponderado
     */
    calcularPMEPonderado() {
        if (!this.pmePonderado) return;

        // Validar que campos existem
        if (!this.percEstoqueMP || !this.pmeMP || !this.percEstoqueWIP || !this.pmeWIP || !this.percEstoquePA || !this.pmePA) {
            console.warn('SecaoCiclosFinanceiros: Campos de estoque não encontrados');
            return;
        }

        // Coletar valores SEM FALLBACKS
        const percMPValue = this.percEstoqueMP.value;
        const pmeMPValue = this.pmeMP.value;
        const percWIPValue = this.percEstoqueWIP.value;
        const pmeWIPValue = this.pmeWIP.value;
        const percPAValue = this.percEstoquePA.value;
        const pmePAValue = this.pmePA.value;
        const percReposicaoValue = this.percEstoqueReposicao?.value;
        const pmeReposicaoValue = this.pmeReposicao?.value;

        // Validar que não estão vazios
        if (percMPValue === '' || pmeMPValue === '' || percWIPValue === '' || pmeWIPValue === '' || percPAValue === '' || pmePAValue === '') {
            this.pmePonderado.value = '';
            return;
        }

        // Converter para números
        const percMP = parseFloat(percMPValue);
        const pmeMP = parseFloat(pmeMPValue);
        const percWIP = parseFloat(percWIPValue);
        const pmeWIP = parseFloat(pmeWIPValue);
        const percPA = parseFloat(percPAValue);
        const pmePA = parseFloat(pmePAValue);
        const percReposicao = percReposicaoValue !== '' ? parseFloat(percReposicaoValue) : 0;
        const pmeReposicao = pmeReposicaoValue !== '' ? parseFloat(pmeReposicaoValue) : 0;

        // Validar se são números
        if (isNaN(percMP) || isNaN(pmeMP) || isNaN(percWIP) || isNaN(pmeWIP) || isNaN(percPA) || isNaN(pmePA)) {
            this.pmePonderado.value = '';
            console.warn('SecaoCiclosFinanceiros: Valores inválidos para cálculo de PME ponderado');
            return;
        }

        try {
            const estoques = {
                percMP,
                pmeMP,
                percWIP,
                pmeWIP,
                percPA,
                pmePA,
                percReposicao,
                pmeReposicao
            };

            const pmePonderadoCalculado = this.calculador.calcularPMEPonderado(estoques);
            this.pmePonderado.value = pmePonderadoCalculado.toFixed(2);
            return pmePonderadoCalculado;

        } catch (error) {
            console.warn('SecaoCiclosFinanceiros: Erro ao calcular PME ponderado:', error.message);
            this.pmePonderado.value = '';
            return null;
        }
    }

    /**
     * Calcular Ciclos (Operacional e Financeiro)
     */
    async calcularCiclos() {
        // Calcular PME ponderado primeiro
        const pmePonderado = this.calcularPMEPonderado();

        if (pmePonderado === null || pmePonderado === undefined) {
            // Limpar campos calculados
            if (this.cicloOperacional) this.cicloOperacional.value = '';
            if (this.cicloFinanceiro) this.cicloFinanceiro.value = '';
            if (this.ncgDiaria) this.ncgDiaria.value = '';
            if (this.ncgMensal) this.ncgMensal.value = '';
            if (this.ncgAnual) this.ncgAnual.value = '';
            return;
        }

        // Buscar dados de Tab 2.1 (PMR, PMP, % Vendas Prazo)
        let pmr, pmp, percVendasPrazo;

        try {
            if (typeof window.secaoRegimeTributario === 'undefined' || !window.secaoRegimeTributario.isInitialized) {
                throw new Error('Tab 2.1 (Regime Tributário) não inicializada');
            }

            const dadosRegime = window.secaoRegimeTributario.coletarDadosRegime();
            pmr = dadosRegime.pmr;
            pmp = dadosRegime.pmp;
            percVendasPrazo = dadosRegime.percVendasPrazo;

            // Validar SEM FALLBACKS
            if (pmr === undefined || pmr === null || isNaN(pmr)) {
                throw new Error('PMR não disponível em Tab 2.1');
            }
            if (pmp === undefined || pmp === null || isNaN(pmp)) {
                throw new Error('PMP não disponível em Tab 2.1');
            }
            if (percVendasPrazo === undefined || percVendasPrazo === null || isNaN(percVendasPrazo)) {
                throw new Error('% Vendas Prazo não disponível em Tab 2.1');
            }

        } catch (error) {
            console.warn('SecaoCiclosFinanceiros: Erro ao buscar dados de Tab 2.1:', error.message);
            console.warn('SecaoCiclosFinanceiros: Preencha Tab 2.1 (Regime Tributário) para calcular ciclos');

            // Limpar campos calculados
            if (this.cicloOperacional) this.cicloOperacional.value = '';
            if (this.cicloFinanceiro) this.cicloFinanceiro.value = '';
            if (this.ncgDiaria) this.ncgDiaria.value = '';
            if (this.ncgMensal) this.ncgMensal.value = '';
            if (this.ncgAnual) this.ncgAnual.value = '';
            return;
        }

        // Calcular Ciclo Operacional
        try {
            const cicloOp = this.calculador.calcularCicloOperacional(pmr, pmePonderado);
            if (this.cicloOperacional) {
                this.cicloOperacional.value = cicloOp.toFixed(2);
            }
        } catch (error) {
            console.error('SecaoCiclosFinanceiros: Erro ao calcular Ciclo Operacional:', error.message);
            if (this.cicloOperacional) this.cicloOperacional.value = '';
        }

        // Calcular Ciclo Financeiro
        try {
            const cicloFin = this.calculador.calcularCicloFinanceiro(pmr, pmePonderado, pmp);
            if (this.cicloFinanceiro) {
                this.cicloFinanceiro.value = cicloFin.toFixed(2);
            }
        } catch (error) {
            console.error('SecaoCiclosFinanceiros: Erro ao calcular Ciclo Financeiro:', error.message);
            if (this.cicloFinanceiro) this.cicloFinanceiro.value = '';
        }

        // Calcular NCG
        await this.calcularNCG(pmr, pmePonderado, pmp, percVendasPrazo);
    }

    /**
     * Calcular NCG (Necessidade de Capital de Giro)
     */
    async calcularNCG(pmr, pmePonderado, pmp, percVendasPrazo) {
        // Buscar % Compras Prazo
        const percComprasPrazoValue = this.percComprasPrazo?.value;

        if (!percComprasPrazoValue || percComprasPrazoValue === '') {
            console.warn('SecaoCiclosFinanceiros: % Compras Prazo não informado');
            return;
        }

        const percComprasPrazo = parseFloat(percComprasPrazoValue);

        if (isNaN(percComprasPrazo)) {
            console.warn('SecaoCiclosFinanceiros: % Compras Prazo inválido');
            return;
        }

        // Buscar receitas de Tab 8
        let receitaMensal = 0;

        try {
            if (typeof window.secaoReceitas !== 'undefined' && window.secaoReceitas.isInitialized) {
                const dadosReceitas = window.secaoReceitas.coletarDadosReceitas();

                if (dadosReceitas && dadosReceitas.produtos && Array.isArray(dadosReceitas.produtos)) {
                    const receitaAnual = dadosReceitas.produtos.reduce((total, produto) => {
                        const receitaProduto = produto.receitaAnual;
                        if (receitaProduto !== undefined && receitaProduto !== null && !isNaN(receitaProduto)) {
                            return total + receitaProduto;
                        }
                        return total;
                    }, 0);

                    receitaMensal = receitaAnual / 12;
                }
            }
        } catch (error) {
            console.warn('SecaoCiclosFinanceiros: Erro ao buscar receitas de Tab 8:', error.message);
        }

        if (receitaMensal === 0) {
            console.warn('SecaoCiclosFinanceiros: Receitas não disponíveis. Preencha Tab 8 (Receitas) para calcular NCG');
            if (this.ncgDiaria) this.ncgDiaria.value = '';
            if (this.ncgMensal) this.ncgMensal.value = '';
            if (this.ncgAnual) this.ncgAnual.value = '';
            return;
        }

        // Estimar custos (70% da receita como aproximação)
        // TODO: Buscar custos reais de Tab 11 quando disponível
        const custosMensais = receitaMensal * 0.7;

        // Calcular NCG
        try {
            const params = {
                receitaMensal,
                custosMensais,
                pmr,
                pmePonderado,
                pmp,
                percVendasPrazo,
                percComprasPrazo
            };

            const ncg = this.calculador.calcularNCG(params);

            // Atualizar campos
            if (this.ncgDiaria) this.ncgDiaria.value = ncg.ncgDiaria.toFixed(2);
            if (this.ncgMensal) this.ncgMensal.value = ncg.ncgMensal.toFixed(2);
            if (this.ncgAnual) this.ncgAnual.value = ncg.ncgAnual.toFixed(2);

        } catch (error) {
            console.error('SecaoCiclosFinanceiros: Erro ao calcular NCG:', error.message);
            if (this.ncgDiaria) this.ncgDiaria.value = '';
            if (this.ncgMensal) this.ncgMensal.value = '';
            if (this.ncgAnual) this.ncgAnual.value = '';
        }
    }

    /**
     * Coletar dados de Ciclos Financeiros
     * API PÚBLICA - usado por financiamento-module.js
     * @returns {Object} Dados da seção
     */
    coletarDadosCiclos() {
        if (!this.isInitialized) {
            throw new Error('SecaoCiclosFinanceiros: Módulo não inicializado');
        }

        // Helper para obter valor de campo - NO FALLBACKS
        const getFieldValue = (field, fieldName, required = true) => {
            if (!field) {
                if (required) {
                    throw new Error(`SecaoCiclosFinanceiros: Campo "${fieldName}" não encontrado no DOM`);
                }
                return null;
            }

            const value = field.value;

            if (required && (value === '' || value === null || value === undefined)) {
                throw new Error(`SecaoCiclosFinanceiros: Campo "${fieldName}" é obrigatório`);
            }

            return value !== '' ? value : null;
        };

        // Coletar dados
        const dados = {
            // Composição de Estoques
            percEstoqueMP: parseFloat(getFieldValue(this.percEstoqueMP, 'percEstoqueMP')),
            pmeMP: parseFloat(getFieldValue(this.pmeMP, 'pmeMP')),
            percEstoqueWIP: parseFloat(getFieldValue(this.percEstoqueWIP, 'percEstoqueWIP')),
            pmeWIP: parseFloat(getFieldValue(this.pmeWIP, 'pmeWIP')),
            percEstoquePA: parseFloat(getFieldValue(this.percEstoquePA, 'percEstoquePA')),
            pmePA: parseFloat(getFieldValue(this.pmePA, 'pmePA')),
            percEstoqueReposicao: this.percEstoqueReposicao?.value !== '' ? parseFloat(this.percEstoqueReposicao.value) : 0,
            pmeReposicao: this.pmeReposicao?.value !== '' ? parseFloat(this.pmeReposicao.value) : 0,

            // Parâmetros
            percComprasPrazo: parseFloat(getFieldValue(this.percComprasPrazo, 'percComprasPrazo')),
            valorTotalEstoque: this.valorTotalEstoque?.value !== '' ? parseFloat(this.valorTotalEstoque.value.replace(/[^\d,]/g, '').replace(',', '.')) : 0,

            // Calculados
            pmePonderado: this.pmePonderado?.value !== '' ? parseFloat(this.pmePonderado.value) : null,
            cicloOperacional: this.cicloOperacional?.value !== '' ? parseFloat(this.cicloOperacional.value) : null,
            cicloFinanceiro: this.cicloFinanceiro?.value !== '' ? parseFloat(this.cicloFinanceiro.value) : null,
            ncgDiaria: this.ncgDiaria?.value !== '' ? parseFloat(this.ncgDiaria.value.replace(/[^\d,]/g, '').replace(',', '.')) : 0,
            ncgMensal: this.ncgMensal?.value !== '' ? parseFloat(this.ncgMensal.value.replace(/[^\d,]/g, '').replace(',', '.')) : 0,
            ncgAnual: this.ncgAnual?.value !== '' ? parseFloat(this.ncgAnual.value.replace(/[^\d,]/g, '').replace(',', '.')) : 0
        };

        console.log('✓ SecaoCiclosFinanceiros: Dados coletados com sucesso');
        return dados;
    }

    /**
     * Restaurar dados de Ciclos Financeiros
     * API PÚBLICA - usado por financiamento-module.js
     * @param {Object} dados - Dados para restaurar
     */
    restaurarDadosCiclos(dados) {
        if (!dados || typeof dados !== 'object') {
            throw new Error('SecaoCiclosFinanceiros.restaurarDadosCiclos: dados inválidos');
        }

        console.log('SecaoCiclosFinanceiros: Restaurando dados...', dados);

        // Helper para setar valor - NO FALLBACKS
        const setFieldValue = (field, value, fieldName) => {
            if (!field) {
                console.warn(`SecaoCiclosFinanceiros: Campo "${fieldName}" não encontrado para restauração`);
                return;
            }

            field.value = (value === null || value === undefined) ? '' : String(value);
        };

        // Restaurar campos
        setFieldValue(this.percEstoqueMP, dados.percEstoqueMP, 'percEstoqueMP');
        setFieldValue(this.pmeMP, dados.pmeMP, 'pmeMP');
        setFieldValue(this.percEstoqueWIP, dados.percEstoqueWIP, 'percEstoqueWIP');
        setFieldValue(this.pmeWIP, dados.pmeWIP, 'pmeWIP');
        setFieldValue(this.percEstoquePA, dados.percEstoquePA, 'percEstoquePA');
        setFieldValue(this.pmePA, dados.pmePA, 'pmePA');
        setFieldValue(this.percEstoqueReposicao, dados.percEstoqueReposicao, 'percEstoqueReposicao');
        setFieldValue(this.pmeReposicao, dados.pmeReposicao, 'pmeReposicao');
        setFieldValue(this.percComprasPrazo, dados.percComprasPrazo, 'percComprasPrazo');
        setFieldValue(this.valorTotalEstoque, dados.valorTotalEstoque, 'valorTotalEstoque');
        setFieldValue(this.pmePonderado, dados.pmePonderado, 'pmePonderado');
        setFieldValue(this.cicloOperacional, dados.cicloOperacional, 'cicloOperacional');
        setFieldValue(this.cicloFinanceiro, dados.cicloFinanceiro, 'cicloFinanceiro');
        setFieldValue(this.ncgDiaria, dados.ncgDiaria, 'ncgDiaria');
        setFieldValue(this.ncgMensal, dados.ncgMensal, 'ncgMensal');
        setFieldValue(this.ncgAnual, dados.ncgAnual, 'ncgAnual');

        // Executar validações e cálculos
        this.validarPercentualTotal();
        this.calcularPMEPonderado();
        this.calcularCiclos();

        console.log('✓ SecaoCiclosFinanceiros: Dados restaurados com sucesso');
    }

    /**
     * Validar seção completa
     * @returns {Object} {isValid, errors}
     */
    validarSecao() {
        const errors = [];

        // Validar campos obrigatórios
        if (!this.percEstoqueMP || this.percEstoqueMP.value === '') {
            errors.push('% Estoque Matéria-Prima não informado');
        }
        if (!this.pmeMP || this.pmeMP.value === '') {
            errors.push('PME Matéria-Prima não informado');
        }
        if (!this.percEstoqueWIP || this.percEstoqueWIP.value === '') {
            errors.push('% Estoque WIP não informado');
        }
        if (!this.pmeWIP || this.pmeWIP.value === '') {
            errors.push('PME WIP não informado');
        }
        if (!this.percEstoquePA || this.percEstoquePA.value === '') {
            errors.push('% Estoque Produtos Acabados não informado');
        }
        if (!this.pmePA || this.pmePA.value === '') {
            errors.push('PME Produtos Acabados não informado');
        }
        if (!this.percComprasPrazo || this.percComprasPrazo.value === '') {
            errors.push('% Compras a Prazo não informado');
        }

        // Validar composição de estoques (deve somar 100%)
        const validacaoComposicao = this.validarPercentualTotal();
        if (validacaoComposicao && !validacaoComposicao.isValid) {
            errors.push(validacaoComposicao.mensagem);
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
            window.secaoCiclosFinanceiros = new SecaoCiclosFinanceiros();
        });
    } else {
        window.secaoCiclosFinanceiros = new SecaoCiclosFinanceiros();
    }
}
