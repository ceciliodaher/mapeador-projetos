/* =====================================
   ESCALONAMENTO-CALCULATOR.JS
   Calculadora de escalonamento físico e financeiro
   Produtos e Insumos com projeção temporal
   NO FALLBACKS - Dados obrigatórios
   ===================================== */

class EscalonamentoCalculator {
    constructor() {
        this.config = null;
    }

    async init() {
        if (!window.configLoader) {
            throw new Error('ConfigLoader não disponível. Inclua config-loader.js antes deste módulo.');
        }

        this.config = await window.configLoader.loadConfig();
        console.log('[EscalonamentoCalculator] Inicializado com sucesso');
    }

    /**
     * Calcula escalonamento de produção de um produto
     * @param {Object} produto - Dados do produto
     * @returns {Object} Escalonamento calculado por ano
     */
    calcularEscalonamentoProduto(produto) {
        if (!produto) {
            throw new Error('Produto não fornecido para cálculo de escalonamento');
        }

        if (!produto.nome) {
            throw new Error('Produto sem nome');
        }

        // Validar campos obrigatórios
        if (!produto.preco || produto.preco <= 0) {
            throw new Error(`Produto "${produto.nome}": preço obrigatório e deve ser maior que zero`);
        }

        if (!produto.quantidadeFutura || produto.quantidadeFutura <= 0) {
            throw new Error(`Produto "${produto.nome}": quantidade futura obrigatória e deve ser maior que zero`);
        }

        const escalonamento = {
            situacaoAtual: this.calcularSituacaoAtual(produto),
            situacaoFutura: this.calcularSituacaoFutura(produto),
            porAno: {}
        };

        // Calcular para cada ano configurado
        this.config.escalonamento.anos.forEach(ano => {
            if (produto[ano] === undefined || produto[ano] === null || produto[ano] === '') {
                throw new Error(
                    `Produto "${produto.nome}": percentual de escalonamento "${ano}" obrigatório`
                );
            }

            const percentual = parseFloat(produto[ano]);

            if (isNaN(percentual) || percentual < 0 || percentual > 100) {
                throw new Error(
                    `Produto "${produto.nome}": ${ano} deve estar entre 0 e 100% (valor fornecido: ${produto[ano]})`
                );
            }

            const quantidade = Math.round((produto.quantidadeFutura * percentual) / 100);
            const receita = quantidade * produto.preco;

            escalonamento.porAno[ano] = {
                percentual: percentual,
                quantidade: quantidade,
                receita: parseFloat(receita.toFixed(2))
            };
        });

        return escalonamento;
    }

    /**
     * Calcula escalonamento de consumo de um insumo
     * @param {Object} insumo - Dados do insumo
     * @returns {Object} Escalonamento calculado por ano
     */
    calcularEscalonamentoInsumo(insumo) {
        if (!insumo) {
            throw new Error('Insumo não fornecido para cálculo de escalonamento');
        }

        if (!insumo.nome) {
            throw new Error('Insumo sem nome');
        }

        // Validar campos obrigatórios
        if (!insumo.custoUnitario || insumo.custoUnitario <= 0) {
            throw new Error(`Insumo "${insumo.nome}": custo unitário obrigatório e deve ser maior que zero`);
        }

        if (!insumo.quantidadeFutura || insumo.quantidadeFutura <= 0) {
            throw new Error(`Insumo "${insumo.nome}": quantidade futura obrigatória e deve ser maior que zero`);
        }

        const escalonamento = {
            situacaoAtual: this.calcularSituacaoAtualInsumo(insumo),
            situacaoFutura: this.calcularSituacaoFuturaInsumo(insumo),
            porAno: {}
        };

        // Calcular para cada ano configurado
        this.config.escalonamento.anos.forEach(ano => {
            if (insumo[ano] === undefined || insumo[ano] === null || insumo[ano] === '') {
                throw new Error(
                    `Insumo "${insumo.nome}": percentual de escalonamento "${ano}" obrigatório`
                );
            }

            const percentual = parseFloat(insumo[ano]);

            if (isNaN(percentual) || percentual < 0 || percentual > 100) {
                throw new Error(
                    `Insumo "${insumo.nome}": ${ano} deve estar entre 0 e 100% (valor fornecido: ${insumo[ano]})`
                );
            }

            const quantidade = Math.round((insumo.quantidadeFutura * percentual) / 100);
            const custoTotal = quantidade * insumo.custoUnitario;

            escalonamento.porAno[ano] = {
                percentual: percentual,
                quantidade: quantidade,
                custoTotal: parseFloat(custoTotal.toFixed(2))
            };
        });

        return escalonamento;
    }

    /**
     * Calcula situação atual de um produto
     * @param {Object} produto
     * @returns {Object}
     */
    calcularSituacaoAtual(produto) {
        const quantidadeAtual = parseFloat(produto.quantidadeAtual || 0);
        const receita = quantidadeAtual * produto.preco;

        return {
            quantidade: quantidadeAtual,
            receita: parseFloat(receita.toFixed(2))
        };
    }

    /**
     * Calcula situação futura de um produto (100% capacidade)
     * @param {Object} produto
     * @returns {Object}
     */
    calcularSituacaoFutura(produto) {
        const receita = produto.quantidadeFutura * produto.preco;

        return {
            quantidade: produto.quantidadeFutura,
            receita: parseFloat(receita.toFixed(2))
        };
    }

    /**
     * Calcula situação atual de um insumo
     * @param {Object} insumo
     * @returns {Object}
     */
    calcularSituacaoAtualInsumo(insumo) {
        const quantidadeAtual = parseFloat(insumo.quantidadeAtual || 0);
        const custo = quantidadeAtual * insumo.custoUnitario;

        return {
            quantidade: quantidadeAtual,
            custoTotal: parseFloat(custo.toFixed(2))
        };
    }

    /**
     * Calcula situação futura de um insumo (100% capacidade)
     * @param {Object} insumo
     * @returns {Object}
     */
    calcularSituacaoFuturaInsumo(insumo) {
        const custo = insumo.quantidadeFutura * insumo.custoUnitario;

        return {
            quantidade: insumo.quantidadeFutura,
            custoTotal: parseFloat(custo.toFixed(2))
        };
    }

    /**
     * Calcula totalizadores de escalonamento para múltiplos produtos
     * @param {Array<Object>} produtos
     * @returns {Object} Totais por ano
     */
    calcularTotaisProdutos(produtos) {
        if (!produtos || produtos.length === 0) {
            throw new Error('Nenhum produto fornecido para totalização');
        }

        const totais = {
            situacaoAtual: { quantidade: 0, receita: 0 },
            situacaoFutura: { quantidade: 0, receita: 0 },
            porAno: {}
        };

        // Inicializar totais por ano
        this.config.escalonamento.anos.forEach(ano => {
            totais.porAno[ano] = {
                percentualMedio: 0,
                quantidadeTotal: 0,
                receitaTotal: 0
            };
        });

        // Somar todos os produtos
        produtos.forEach(produto => {
            const escalonamento = this.calcularEscalonamentoProduto(produto);

            totais.situacaoAtual.receita += escalonamento.situacaoAtual.receita;
            totais.situacaoFutura.receita += escalonamento.situacaoFutura.receita;

            this.config.escalonamento.anos.forEach(ano => {
                totais.porAno[ano].receitaTotal += escalonamento.porAno[ano].receita;
            });
        });

        // Calcular percentual médio por ano (baseado em receita)
        this.config.escalonamento.anos.forEach(ano => {
            if (totais.situacaoFutura.receita > 0) {
                totais.porAno[ano].percentualMedio = parseFloat(
                    ((totais.porAno[ano].receitaTotal / totais.situacaoFutura.receita) * 100).toFixed(1)
                );
            }
        });

        return totais;
    }

    /**
     * Calcula totalizadores de escalonamento para múltiplos insumos
     * @param {Array<Object>} insumos
     * @returns {Object} Totais por ano
     */
    calcularTotaisInsumos(insumos) {
        if (!insumos || insumos.length === 0) {
            throw new Error('Nenhum insumo fornecido para totalização');
        }

        const totais = {
            situacaoAtual: { quantidade: 0, custoTotal: 0 },
            situacaoFutura: { quantidade: 0, custoTotal: 0 },
            porAno: {}
        };

        // Inicializar totais por ano
        this.config.escalonamento.anos.forEach(ano => {
            totais.porAno[ano] = {
                percentualMedio: 0,
                custoTotal: 0
            };
        });

        // Somar todos os insumos
        insumos.forEach(insumo => {
            const escalonamento = this.calcularEscalonamentoInsumo(insumo);

            totais.situacaoAtual.custoTotal += escalonamento.situacaoAtual.custoTotal;
            totais.situacaoFutura.custoTotal += escalonamento.situacaoFutura.custoTotal;

            this.config.escalonamento.anos.forEach(ano => {
                totais.porAno[ano].custoTotal += escalonamento.porAno[ano].custoTotal;
            });
        });

        // Calcular percentual médio por ano (baseado em custo)
        this.config.escalonamento.anos.forEach(ano => {
            if (totais.situacaoFutura.custoTotal > 0) {
                totais.porAno[ano].percentualMedio = parseFloat(
                    ((totais.porAno[ano].custoTotal / totais.situacaoFutura.custoTotal) * 100).toFixed(1)
                );
            }
        });

        return totais;
    }

    /**
     * Formata valor monetário
     * @param {number} valor
     * @returns {string}
     */
    formatarMoeda(valor) {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(valor || 0);
    }

    /**
     * Formata percentual
     * @param {number} valor
     * @returns {string}
     */
    formatarPercentual(valor) {
        return `${(valor || 0).toFixed(1)}%`;
    }
}

// Inicializar quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', async () => {
    try {
        window.escalonamentoCalculator = new EscalonamentoCalculator();
        await window.escalonamentoCalculator.init();
        console.log('[EscalonamentoCalculator] Pronto para uso');
    } catch (error) {
        console.error('[EscalonamentoCalculator] Erro na inicialização:', error);
    }
});

// Export para módulos ES6
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EscalonamentoCalculator;
}
