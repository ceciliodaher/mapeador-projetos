/* =====================================
   CALCULADOR-CICLOS-FINANCEIROS.JS
   Calculador de Ciclos Operacional, Financeiro e NCG

   Fórmulas:
   - PME Ponderado = Σ(% Estoque × PME Estoque)
   - Ciclo Operacional = PMR + PME Ponderado
   - Ciclo Financeiro = (PMR + PME Ponderado) - PMP
   - NCG = (Receita × PMR/30) + (Custos × PME/30) - (Custos × PMP/30)

   NO FALLBACKS - NO HARDCODED DATA - EXPLICIT VALIDATION
   ===================================== */

class CalculadorCiclosFinanceiros {
    constructor() {
        console.log('📊 CalculadorCiclosFinanceiros inicializado');
    }

    /**
     * Calcular PME Ponderado (média ponderada dos estoques)
     *
     * @param {Object} estoques - Objeto com percentuais e PMEs
     * @param {number} estoques.percMP - % Matéria-Prima
     * @param {number} estoques.pmeMP - PME Matéria-Prima (dias)
     * @param {number} estoques.percWIP - % WIP
     * @param {number} estoques.pmeWIP - PME WIP (dias)
     * @param {number} estoques.percPA - % Produtos Acabados
     * @param {number} estoques.pmePA - PME PA (dias)
     * @param {number} estoques.percReposicao - % Peças Reposição (opcional)
     * @param {number} estoques.pmeReposicao - PME Reposição (dias) (opcional)
     *
     * @returns {number} PME ponderado em dias
     */
    calcularPMEPonderado(estoques) {
        if (!estoques || typeof estoques !== 'object') {
            throw new Error('CalculadorCiclos: parâmetro "estoques" é obrigatório');
        }

        // Extrair valores SEM FALLBACKS
        const percMP = estoques.percMP;
        const pmeMP = estoques.pmeMP;
        const percWIP = estoques.percWIP;
        const pmeWIP = estoques.pmeWIP;
        const percPA = estoques.percPA;
        const pmePA = estoques.pmePA;

        // Opcional (pode ser 0)
        const percReposicao = estoques.percReposicao !== undefined ? estoques.percReposicao : 0;
        const pmeReposicao = estoques.pmeReposicao !== undefined ? estoques.pmeReposicao : 0;

        // Validar obrigatórios
        if (percMP === undefined || percMP === null || isNaN(percMP)) {
            throw new Error('CalculadorCiclos: percMP é obrigatório');
        }
        if (pmeMP === undefined || pmeMP === null || isNaN(pmeMP)) {
            throw new Error('CalculadorCiclos: pmeMP é obrigatório');
        }
        if (percWIP === undefined || percWIP === null || isNaN(percWIP)) {
            throw new Error('CalculadorCiclos: percWIP é obrigatório');
        }
        if (pmeWIP === undefined || pmeWIP === null || isNaN(pmeWIP)) {
            throw new Error('CalculadorCiclos: pmeWIP é obrigatório');
        }
        if (percPA === undefined || percPA === null || isNaN(percPA)) {
            throw new Error('CalculadorCiclos: percPA é obrigatório');
        }
        if (pmePA === undefined || pmePA === null || isNaN(pmePA)) {
            throw new Error('CalculadorCiclos: pmePA é obrigatório');
        }

        // Validar ranges
        if (percMP < 0 || percMP > 100) {
            throw new Error(`CalculadorCiclos: percMP fora do range (0-100): ${percMP}`);
        }
        if (percWIP < 0 || percWIP > 100) {
            throw new Error(`CalculadorCiclos: percWIP fora do range (0-100): ${percWIP}`);
        }
        if (percPA < 0 || percPA > 100) {
            throw new Error(`CalculadorCiclos: percPA fora do range (0-100): ${percPA}`);
        }
        if (percReposicao < 0 || percReposicao > 100) {
            throw new Error(`CalculadorCiclos: percReposicao fora do range (0-100): ${percReposicao}`);
        }

        // Validar que percentuais somam 100%
        const totalPerc = percMP + percWIP + percPA + percReposicao;
        if (Math.abs(totalPerc - 100) > 0.1) {
            throw new Error(`CalculadorCiclos: Percentuais devem somar 100%. Atual: ${totalPerc.toFixed(2)}%`);
        }

        // Calcular PME ponderado
        const pmePonderado = (
            (percMP / 100 * pmeMP) +
            (percWIP / 100 * pmeWIP) +
            (percPA / 100 * pmePA) +
            (percReposicao / 100 * pmeReposicao)
        );

        console.log(`✓ PME Ponderado calculado: ${pmePonderado.toFixed(2)} dias`);
        return pmePonderado;
    }

    /**
     * Calcular Ciclo Operacional = PMR + PME Ponderado
     *
     * @param {number} pmr - Prazo Médio de Recebimento (dias)
     * @param {number} pmePonderado - PME Ponderado (dias)
     * @returns {number} Ciclo Operacional em dias
     */
    calcularCicloOperacional(pmr, pmePonderado) {
        // Validação explícita
        if (pmr === undefined || pmr === null || isNaN(pmr)) {
            throw new Error('CalculadorCiclos: PMR é obrigatório para calcular Ciclo Operacional');
        }
        if (pmePonderado === undefined || pmePonderado === null || isNaN(pmePonderado)) {
            throw new Error('CalculadorCiclos: PME Ponderado é obrigatório para calcular Ciclo Operacional');
        }

        const cicloOperacional = pmr + pmePonderado;
        console.log(`✓ Ciclo Operacional: ${cicloOperacional.toFixed(2)} dias (PMR ${pmr} + PME ${pmePonderado.toFixed(2)})`);
        return cicloOperacional;
    }

    /**
     * Calcular Ciclo Financeiro = (PMR + PME Ponderado) - PMP
     *
     * @param {number} pmr - Prazo Médio de Recebimento (dias)
     * @param {number} pmePonderado - PME Ponderado (dias)
     * @param {number} pmp - Prazo Médio de Pagamento (dias)
     * @returns {number} Ciclo Financeiro em dias
     */
    calcularCicloFinanceiro(pmr, pmePonderado, pmp) {
        // Validação explícita
        if (pmr === undefined || pmr === null || isNaN(pmr)) {
            throw new Error('CalculadorCiclos: PMR é obrigatório para calcular Ciclo Financeiro');
        }
        if (pmePonderado === undefined || pmePonderado === null || isNaN(pmePonderado)) {
            throw new Error('CalculadorCiclos: PME Ponderado é obrigatório para calcular Ciclo Financeiro');
        }
        if (pmp === undefined || pmp === null || isNaN(pmp)) {
            throw new Error('CalculadorCiclos: PMP é obrigatório para calcular Ciclo Financeiro');
        }

        const cicloFinanceiro = (pmr + pmePonderado) - pmp;
        console.log(`✓ Ciclo Financeiro: ${cicloFinanceiro.toFixed(2)} dias ((PMR ${pmr} + PME ${pmePonderado.toFixed(2)}) - PMP ${pmp})`);
        return cicloFinanceiro;
    }

    /**
     * Calcular NCG (Necessidade de Capital de Giro)
     *
     * Fórmula:
     * NCG Diária = (Receita × PMR/30) + (Custos × PME/30) - (Custos × PMP/30)
     * NCG Mensal = NCG Diária × 30
     * NCG Anual = NCG Mensal × 12
     *
     * @param {Object} params - Parâmetros para cálculo
     * @param {number} params.receitaMensal - Receita mensal (R$)
     * @param {number} params.custosMensais - Custos mensais (R$)
     * @param {number} params.pmr - Prazo Médio Recebimento (dias)
     * @param {number} params.pmePonderado - PME Ponderado (dias)
     * @param {number} params.pmp - Prazo Médio Pagamento (dias)
     * @param {number} params.percVendasPrazo - % Vendas a Prazo
     * @param {number} params.percComprasPrazo - % Compras a Prazo
     *
     * @returns {Object} { ncgDiaria, ncgMensal, ncgAnual, detalhamento }
     */
    calcularNCG(params) {
        if (!params || typeof params !== 'object') {
            throw new Error('CalculadorCiclos: parâmetro "params" é obrigatório');
        }

        // Extrair parâmetros SEM FALLBACKS
        const {
            receitaMensal,
            custosMensais,
            pmr,
            pmePonderado,
            pmp,
            percVendasPrazo,
            percComprasPrazo
        } = params;

        // Validação explícita de cada parâmetro
        if (receitaMensal === undefined || receitaMensal === null || isNaN(receitaMensal)) {
            throw new Error('CalculadorCiclos.calcularNCG: receitaMensal é obrigatório');
        }
        if (custosMensais === undefined || custosMensais === null || isNaN(custosMensais)) {
            throw new Error('CalculadorCiclos.calcularNCG: custosMensais é obrigatório');
        }
        if (pmr === undefined || pmr === null || isNaN(pmr)) {
            throw new Error('CalculadorCiclos.calcularNCG: pmr é obrigatório');
        }
        if (pmePonderado === undefined || pmePonderado === null || isNaN(pmePonderado)) {
            throw new Error('CalculadorCiclos.calcularNCG: pmePonderado é obrigatório');
        }
        if (pmp === undefined || pmp === null || isNaN(pmp)) {
            throw new Error('CalculadorCiclos.calcularNCG: pmp é obrigatório');
        }
        if (percVendasPrazo === undefined || percVendasPrazo === null || isNaN(percVendasPrazo)) {
            throw new Error('CalculadorCiclos.calcularNCG: percVendasPrazo é obrigatório');
        }
        if (percComprasPrazo === undefined || percComprasPrazo === null || isNaN(percComprasPrazo)) {
            throw new Error('CalculadorCiclos.calcularNCG: percComprasPrazo é obrigatório');
        }

        // Ajustar por % a prazo
        const receitaEfetivaPrazo = receitaMensal * (percVendasPrazo / 100);
        const custosEfetivosPrazo = custosMensais * (percComprasPrazo / 100);

        // Calcular componentes da NCG
        const contasReceber = (receitaEfetivaPrazo * pmr) / 30;
        const estoques = (custosEfetivosPrazo * pmePonderado) / 30;
        const contasPagar = (custosEfetivosPrazo * pmp) / 30;

        // NCG Diária
        const ncgDiaria = contasReceber + estoques - contasPagar;
        const ncgMensal = ncgDiaria * 30;
        const ncgAnual = ncgMensal * 12;

        console.log('✓ NCG calculada:', {
            ncgDiaria: ncgDiaria.toFixed(2),
            ncgMensal: ncgMensal.toFixed(2),
            ncgAnual: ncgAnual.toFixed(2)
        });

        return {
            ncgDiaria,
            ncgMensal,
            ncgAnual,
            detalhamento: {
                contasReceber,
                estoques,
                contasPagar
            }
        };
    }

    /**
     * Validar composição de estoques (deve somar 100%)
     *
     * @param {number} percMP - % Matéria-Prima
     * @param {number} percWIP - % WIP
     * @param {number} percPA - % Produtos Acabados
     * @param {number} percReposicao - % Peças Reposição
     * @returns {Object} { isValid, total, diferenca, mensagem }
     */
    validarComposicaoEstoques(percMP, percWIP, percPA, percReposicao) {
        // Validação explícita
        if (percMP === undefined || percMP === null || isNaN(percMP)) {
            return {
                isValid: false,
                total: 0,
                diferenca: 100,
                mensagem: '❌ % Matéria-Prima inválido'
            };
        }
        if (percWIP === undefined || percWIP === null || isNaN(percWIP)) {
            return {
                isValid: false,
                total: 0,
                diferenca: 100,
                mensagem: '❌ % WIP inválido'
            };
        }
        if (percPA === undefined || percPA === null || isNaN(percPA)) {
            return {
                isValid: false,
                total: 0,
                diferenca: 100,
                mensagem: '❌ % Produtos Acabados inválido'
            };
        }

        // Reposição é opcional
        const percReposicaoFinal = (percReposicao !== undefined && percReposicao !== null && !isNaN(percReposicao))
            ? percReposicao
            : 0;

        const total = percMP + percWIP + percPA + percReposicaoFinal;
        const isValid = Math.abs(total - 100) < 0.1;  // Tolerância de 0.1%
        const diferenca = 100 - total;

        return {
            isValid,
            total,
            diferenca,
            mensagem: isValid
                ? `✓ Composição válida (${total.toFixed(1)}%)`
                : `❌ Total: ${total.toFixed(1)}%. ${diferenca > 0 ? 'Faltam' : 'Excesso de'} ${Math.abs(diferenca).toFixed(1)}%`
        };
    }
}

// Export global
if (typeof window !== 'undefined') {
    window.CalculadorCiclosFinanceiros = CalculadorCiclosFinanceiros;
    console.log('✓ CalculadorCiclosFinanceiros exportado para window');
}
