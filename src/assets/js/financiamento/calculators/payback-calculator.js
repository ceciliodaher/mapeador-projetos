/* =====================================
   PAYBACK-CALCULATOR.JS
   Calculadora de Payback Simples e Descontado
   Portado de: budget.py linhas 1644-1651

   DIFERENÇA CRÍTICA vs código existente:
   - Python: Retorna MÊS INTEIRO (i + 1) sem interpolação
   - JS antigo: Interpola com fracaoAno * 12

   IMPLEMENTAÇÃO: Seguir Python exatamente (sem interpolação)

   Payback Simples: Tempo para recuperar investimento (sem desconto)
   Payback Descontado: Considera valor do dinheiro no tempo (com TMA)

   NO HARDCODED DATA - NO FALLBACKS - KISS - DRY - SOLID
   ===================================== */

class CalculadorPayback {
  constructor() {
    console.log('⏱️ CalculadorPayback inicializado');
  }

  // ==========================================
  // PAYBACK SIMPLES
  // ==========================================

  /**
   * Calcula Payback Simples
   * Cópia exata do Python budget.py linhas 1644-1651
   *
   * Algoritmo:
   * 1. Acumular fluxos de caixa mês a mês
   * 2. Quando acumulado >= investimento: retornar i + 1 (MÊS INTEIRO)
   * 3. Se não recuperar: retornar len(fluxos)
   *
   * CRITICAL: SEM interpolação (diferente do código antigo)
   *
   * @param {Object} params - Parâmetros obrigatórios
   * @returns {Object} Resultado Payback Simples
   */
  calcularPaybackSimples(params) {
    this.validarParamsSimples(params);

    const { investimentoInicial, fluxosCaixa, periodicidade = 'mensal' } = params;

    console.log(`⏱️ Calculando Payback Simples: investimento ${this.formatarMoeda(investimentoInicial)}, ${fluxosCaixa.length} períodos`);

    // Python linha 1646-1650
    let acumulado = 0;
    for (let i = 0; i < fluxosCaixa.length; i++) {
      acumulado += fluxosCaixa[i];

      if (acumulado >= investimentoInicial) {
        const periodosPayback = i + 1;  // MÊS INTEIRO (Python linha 1650)

        console.log(`✅ Investimento recuperado no período ${periodosPayback}`);

        return {
          indicador: 'Payback Simples',
          periodosPayback,  // Meses ou anos (conforme periodicidade)
          anoPayback: periodicidade === 'mensal' ? Math.floor(periodosPayback / 12) : periodosPayback,
          mesesPayback: periodicidade === 'mensal' ? periodosPayback : periodosPayback * 12,
          recuperado: true,
          investimentoInicial,
          fluxoAcumulado: acumulado,
          periodicidade,
          interpretacao: periodicidade === 'mensal'
            ? `Investimento recuperado em ${periodosPayback} meses (${Math.floor(periodosPayback / 12)} ano(s) e ${periodosPayback % 12} mês(es))`
            : `Investimento recuperado em ${periodosPayback} anos`,
          observacao: 'Payback simples não considera valor do dinheiro no tempo',
          metodo: 'Python (mês inteiro, sem interpolação)',
          detalhamento: {
            periodoRecuperacao: i + 1,
            fluxosCaixa: fluxosCaixa.slice(0, i + 1),
            acumuladoPorPeriodo: this.calcularAcumulados(fluxosCaixa.slice(0, i + 1))
          }
        };
      }
    }

    // Python linha 1651: não recuperou - retorna len(fluxos)
    const periodosPayback = fluxosCaixa.length;

    console.warn(`⚠️ Investimento NÃO recuperado no horizonte de ${periodosPayback} períodos`);

    return {
      indicador: 'Payback Simples',
      periodosPayback,
      anoPayback: periodicidade === 'mensal' ? Math.floor(periodosPayback / 12) : periodosPayback,
      mesesPayback: periodicidade === 'mensal' ? periodosPayback : periodosPayback * 12,
      recuperado: false,
      investimentoInicial,
      fluxoAcumulado: acumulado,
      periodicidade,
      interpretacao: `Investimento NÃO recuperado no período de projeção (${periodosPayback} ${periodicidade === 'mensal' ? 'meses' : 'anos'})`,
      observacao: `Faltam ${this.formatarMoeda(investimentoInicial - acumulado)} para recuperar investimento`,
      metodo: 'Python (mês inteiro, sem interpolação)',
      detalhamento: {
        periodoRecuperacao: null,
        fluxosCaixa,
        acumuladoPorPeriodo: this.calcularAcumulados(fluxosCaixa),
        percentualRecuperado: (acumulado / investimentoInicial) * 100
      }
    };
  }

  // ==========================================
  // PAYBACK DESCONTADO
  // ==========================================

  /**
   * Calcula Payback Descontado (considera valor do dinheiro no tempo)
   * Similar ao Payback Simples, mas com fluxos descontados pela TMA
   *
   * Fórmula: FC_descontado = FC / (1 + r)^período
   *
   * @param {Object} params - Parâmetros obrigatórios
   * @returns {Object} Resultado Payback Descontado
   */
  calcularPaybackDescontado(params) {
    this.validarParamsDescontado(params);

    const { investimentoInicial, fluxosCaixa, tma, periodicidade = 'mensal' } = params;

    console.log(`⏱️ Calculando Payback Descontado: TMA ${tma}% a.a., ${fluxosCaixa.length} períodos`);

    // Converter TMA anual para taxa por período
    const taxaPeriodo = this.converterTMA(tma, periodicidade);

    // Descontar fluxos de caixa
    const fluxosDescontados = fluxosCaixa.map((fluxo, index) => {
      const periodo = index + 1;
      return fluxo / Math.pow(1 + taxaPeriodo, periodo);
    });

    // Acumular fluxos descontados
    let acumulado = 0;
    for (let i = 0; i < fluxosDescontados.length; i++) {
      acumulado += fluxosDescontados[i];

      if (acumulado >= investimentoInicial) {
        const periodosPayback = i + 1;  // MÊS INTEIRO

        console.log(`✅ Investimento recuperado (descontado) no período ${periodosPayback}`);

        return {
          indicador: 'Payback Descontado',
          periodosPayback,
          anoPayback: periodicidade === 'mensal' ? Math.floor(periodosPayback / 12) : periodosPayback,
          mesesPayback: periodicidade === 'mensal' ? periodosPayback : periodosPayback * 12,
          recuperado: true,
          investimentoInicial,
          fluxoAcumulado: acumulado,
          tma,
          taxaPeriodo: taxaPeriodo * 100,
          periodicidade,
          interpretacao: periodicidade === 'mensal'
            ? `Investimento recuperado (a valor presente) em ${periodosPayback} meses (${Math.floor(periodosPayback / 12)} ano(s) e ${periodosPayback % 12} mês(es))`
            : `Investimento recuperado (a valor presente) em ${periodosPayback} anos`,
          observacao: `Considera TMA de ${tma}% a.a. para descontar fluxos`,
          metodo: 'Python (mês inteiro, sem interpolação)',
          detalhamento: {
            periodoRecuperacao: i + 1,
            fluxosCaixa: fluxosCaixa.slice(0, i + 1),
            fluxosDescontados: fluxosDescontados.slice(0, i + 1),
            acumuladoPorPeriodo: this.calcularAcumulados(fluxosDescontados.slice(0, i + 1))
          }
        };
      }
    }

    // Não recuperou no horizonte de projeção
    const periodosPayback = fluxosDescontados.length;

    console.warn(`⚠️ Investimento NÃO recuperado (descontado) no horizonte de ${periodosPayback} períodos`);

    return {
      indicador: 'Payback Descontado',
      periodosPayback,
      anoPayback: periodicidade === 'mensal' ? Math.floor(periodosPayback / 12) : periodosPayback,
      mesesPayback: periodicidade === 'mensal' ? periodosPayback : periodosPayback * 12,
      recuperado: false,
      investimentoInicial,
      fluxoAcumulado: acumulado,
      tma,
      taxaPeriodo: taxaPeriodo * 100,
      periodicidade,
      interpretacao: `Investimento NÃO recuperado (a valor presente) no período de projeção (${periodosPayback} ${periodicidade === 'mensal' ? 'meses' : 'anos'})`,
      observacao: `Faltam ${this.formatarMoeda(investimentoInicial - acumulado)} (a valor presente) para recuperar investimento`,
      metodo: 'Python (mês inteiro, sem interpolação)',
      detalhamento: {
        periodoRecuperacao: null,
        fluxosCaixa,
        fluxosDescontados,
        acumuladoPorPeriodo: this.calcularAcumulados(fluxosDescontados),
        percentualRecuperado: (acumulado / investimentoInicial) * 100
      }
    };
  }

  // ==========================================
  // COMPARAÇÃO: Simples vs Descontado
  // ==========================================

  /**
   * Compara Payback Simples vs Descontado
   * Útil para demonstrar impacto do valor do dinheiro no tempo
   */
  compararPaybacks(params) {
    this.validarParamsDescontado(params);

    const paybackSimples = this.calcularPaybackSimples(params);
    const paybackDescontado = this.calcularPaybackDescontado(params);

    const diferencaPeriodos = paybackDescontado.periodosPayback - paybackSimples.periodosPayback;

    return {
      indicador: 'Comparação Payback',
      simples: paybackSimples,
      descontado: paybackDescontado,
      comparacao: {
        diferencaPeriodos,
        diferencaMeses: params.periodicidade === 'mensal' ? diferencaPeriodos : diferencaPeriodos * 12,
        impactoTMA: diferencaPeriodos > 0
          ? `TMA de ${params.tma}% a.a. aumenta payback em ${diferencaPeriodos} ${params.periodicidade === 'mensal' ? 'meses' : 'anos'}`
          : 'Ambos paybacks iguais',
        observacao: 'Payback descontado sempre >= Payback simples (devido ao desconto dos fluxos futuros)'
      }
    };
  }

  // ==========================================
  // ANÁLISE DE SENSIBILIDADE
  // ==========================================

  /**
   * Analisa impacto de diferentes TMAs no Payback Descontado
   */
  analiseSensibilidadeTMA(params) {
    this.validarParamsDescontado(params);

    const tmasTestar = params.tmasTestar || [8, 10, 12, 15, 18, 20];
    const resultados = [];

    tmasTestar.forEach(tma => {
      const resultado = this.calcularPaybackDescontado({
        ...params,
        tma
      });

      resultados.push({
        tma,
        periodosPayback: resultado.periodosPayback,
        recuperado: resultado.recuperado
      });
    });

    return {
      indicador: 'Análise Sensibilidade - Payback Descontado',
      resultados,
      resumo: {
        paybackMinimo: Math.min(...resultados.filter(r => r.recuperado).map(r => r.periodosPayback)),
        paybackMaximo: Math.max(...resultados.filter(r => r.recuperado).map(r => r.periodosPayback)),
        tmaPaybackMinimo: resultados.find(r => r.periodosPayback === Math.min(...resultados.filter(x => x.recuperado).map(x => x.periodosPayback)))?.tma,
        observacao: 'Quanto maior a TMA, maior o Payback Descontado (fluxos futuros valem menos)'
      }
    };
  }

  // ==========================================
  // HELPERS
  // ==========================================

  /**
   * Calcula valores acumulados período a período
   */
  calcularAcumulados(fluxos) {
    let acumulado = 0;
    return fluxos.map(fluxo => {
      acumulado += fluxo;
      return acumulado;
    });
  }

  /**
   * Converte TMA anual para taxa por período
   * Mensal: r_mensal = (1 + TMA_anual)^(1/12) - 1
   * Anual: r = TMA_anual
   */
  converterTMA(tmaAnual, periodicidade) {
    const tmaDecimal = tmaAnual / 100;

    if (periodicidade === 'mensal') {
      return Math.pow(1 + tmaDecimal, 1 / 12) - 1;
    } else if (periodicidade === 'anual') {
      return tmaDecimal;
    } else {
      throw new Error(`CalculadorPayback: periodicidade inválida "${periodicidade}"`);
    }
  }

  // ==========================================
  // VALIDAÇÕES
  // ==========================================

  validarParamsSimples(params) {
    if (!params) {
      throw new Error('CalculadorPayback: params obrigatório');
    }

    if (params.investimentoInicial === undefined || params.investimentoInicial === null) {
      throw new Error('CalculadorPayback: investimentoInicial obrigatório');
    }

    if (typeof params.investimentoInicial !== 'number' || params.investimentoInicial <= 0) {
      throw new Error('CalculadorPayback: investimentoInicial deve ser número positivo');
    }

    if (!params.fluxosCaixa || !Array.isArray(params.fluxosCaixa)) {
      throw new Error('CalculadorPayback: fluxosCaixa deve ser array');
    }

    if (params.fluxosCaixa.length === 0) {
      throw new Error('CalculadorPayback: fluxosCaixa não pode ser vazio');
    }

    if (params.periodicidade && params.periodicidade !== 'mensal' && params.periodicidade !== 'anual') {
      throw new Error('CalculadorPayback: periodicidade deve ser "mensal" ou "anual"');
    }
  }

  validarParamsDescontado(params) {
    this.validarParamsSimples(params);

    if (params.tma === undefined || params.tma === null) {
      throw new Error('CalculadorPayback: tma obrigatório para Payback Descontado');
    }

    if (typeof params.tma !== 'number' || params.tma < 0) {
      throw new Error('CalculadorPayback: tma deve ser número não-negativo (%)');
    }
  }

  // ==========================================
  // UTILITIES
  // ==========================================

  formatarMoeda(valor) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  }

  formatarPercentual(valor, decimais = 2) {
    return `${valor.toFixed(decimais)}%`;
  }
}

// Exportar para uso global
if (typeof window !== 'undefined') {
  window.CalculadorPayback = CalculadorPayback;
  console.log('✅ CalculadorPayback exportado para window');
}

// Exportar para Node.js (se necessário)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CalculadorPayback;
}
