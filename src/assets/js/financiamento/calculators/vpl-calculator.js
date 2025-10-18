/* =====================================
   VPL-CALCULATOR.JS
   Calculadora de VPL (Valor Presente Líquido)
   Suporte para periodicidade MENSAL e ANUAL

   VPL = -I₀ + Σ[FC_i / (1 + r)^i]

   Onde:
   - I₀ = Investimento inicial
   - FC_i = Fluxo de caixa no período i
   - r = Taxa de desconto (TMA) por período
   - i = Número do período

   CONVERSÃO DE TAXA:
   - Se periodicidade = 'mensal' e TMA é anual:
     r_mensal = (1 + TMA_anual)^(1/12) - 1

   - Se periodicidade = 'anual':
     r = TMA_anual

   NO HARDCODED DATA - NO FALLBACKS - KISS - DRY - SOLID
   ===================================== */

class CalculadorVPL {
  constructor() {
    console.log('💰 CalculadorVPL inicializado');
  }

  // ==========================================
  // VPL - VALOR PRESENTE LÍQUIDO
  // ==========================================

  /**
   * Calcula VPL (Valor Presente Líquido)
   * Suporta periodicidade mensal e anual
   *
   * Fórmula: VPL = -I₀ + Σ[FC_i / (1 + r)^i]
   *
   * @param {Object} params - Parâmetros obrigatórios
   * @returns {Object} Resultado VPL com análise de viabilidade
   */
  calcularVPL(params) {
    // Validar parâmetros
    this.validarParams(params);

    const {
      investimentoInicial,
      fluxosCaixa,
      tma,                      // Taxa Mínima de Atratividade (% ao ano)
      periodicidade = 'mensal'  // 'mensal' | 'anual'
    } = params;

    console.log(`📊 Calculando VPL: ${fluxosCaixa.length} períodos, TMA ${tma}% a.a., periodicidade: ${periodicidade}`);

    // Converter TMA para taxa por período
    const taxaPeriodo = this.converterTMA(tma, periodicidade);

    console.log(`🔄 Taxa por período: ${(taxaPeriodo * 100).toFixed(4)}%`);

    // Calcular VPL: -I₀ + Σ[FC_i / (1 + r)^i]
    let vpl = -investimentoInicial;
    const valoresPresentes = [];

    fluxosCaixa.forEach((fluxo, index) => {
      const periodo = index + 1;
      const divisor = Math.pow(1 + taxaPeriodo, periodo);
      const valorPresente = fluxo / divisor;

      vpl += valorPresente;
      valoresPresentes.push({
        periodo,
        fluxoCaixa: fluxo,
        fatorDesconto: divisor,
        valorPresente
      });
    });

    // Análise de viabilidade
    const viavel = vpl > 0;

    // Valor presente dos fluxos (sem investimento inicial)
    const vpFluxos = valoresPresentes.reduce((sum, vp) => sum + vp.valorPresente, 0);

    return {
      indicador: 'VPL',
      vpl,
      vpFluxos,
      investimentoInicial,
      tma,
      taxaPeriodo: taxaPeriodo * 100,  // em %
      periodicidade,
      viavel,
      interpretacao: viavel
        ? `VPL positivo de ${this.formatarMoeda(vpl)} indica que o projeto gera valor acima da TMA de ${tma}% a.a.`
        : `VPL negativo de ${this.formatarMoeda(vpl)} indica que o projeto não supera a TMA de ${tma}% a.a.`,
      observacao: 'VPL > 0 → Projeto viável | VPL = 0 → Indiferente | VPL < 0 → Projeto inviável',
      detalhamento: {
        fluxosCaixa,
        valoresPresentes,
        somaVP: vpFluxos,
        criterioDecisao: viavel ? 'APROVAR' : 'REJEITAR'
      }
    };
  }

  /**
   * Calcula VPL Perpétuo (fluxos de caixa constantes infinitos)
   * VPL_perpétuo = FC / r
   *
   * Usado para projetos com vida útil indefinida e fluxos constantes
   */
  calcularVPLPerpetuo(params) {
    this.validarParamsPerpetuo(params);

    const {
      investimentoInicial,
      fluxoCaixaConstante,
      tma,
      periodicidade = 'anual'  // Perpétuos geralmente usam periodicidade anual
    } = params;

    const taxaPeriodo = this.converterTMA(tma, periodicidade);

    // VPL perpétuo = -I₀ + (FC / r)
    const vpFluxosPerpetuo = fluxoCaixaConstante / taxaPeriodo;
    const vpl = -investimentoInicial + vpFluxosPerpetuo;

    const viavel = vpl > 0;

    return {
      indicador: 'VPL Perpétuo',
      vpl,
      vpFluxosPerpetuo,
      investimentoInicial,
      fluxoCaixaConstante,
      tma,
      taxaPeriodo: taxaPeriodo * 100,
      periodicidade,
      viavel,
      interpretacao: viavel
        ? `Projeto perpétuo viável: VPL de ${this.formatarMoeda(vpl)}`
        : `Projeto perpétuo inviável: VPL de ${this.formatarMoeda(vpl)}`,
      observacao: 'VPL perpétuo assume fluxos de caixa constantes indefinidamente'
    };
  }

  /**
   * Calcula VPL com crescimento perpétuo (Gordon Growth Model)
   * VPL = -I₀ + [FC₁ / (r - g)]
   *
   * Onde g = taxa de crescimento dos fluxos
   * ATENÇÃO: r deve ser > g
   */
  calcularVPLCrescimentoPerpetuo(params) {
    this.validarParamsCrescimentoPerpetuo(params);

    const {
      investimentoInicial,
      fluxoCaixaInicial,
      tma,
      taxaCrescimento,  // % ao ano
      periodicidade = 'anual'
    } = params;

    const taxaPeriodo = this.converterTMA(tma, periodicidade);
    const taxaCrescimentoPeriodo = this.converterTMA(taxaCrescimento, periodicidade);

    // Validar r > g
    if (taxaPeriodo <= taxaCrescimentoPeriodo) {
      throw new Error('CalculadorVPL: TMA deve ser maior que taxa de crescimento para modelo perpétuo');
    }

    // VPL = -I₀ + [FC₁ / (r - g)]
    const vpFluxosCrescentes = fluxoCaixaInicial / (taxaPeriodo - taxaCrescimentoPeriodo);
    const vpl = -investimentoInicial + vpFluxosCrescentes;

    const viavel = vpl > 0;

    return {
      indicador: 'VPL Crescimento Perpétuo (Gordon)',
      vpl,
      vpFluxosCrescentes,
      investimentoInicial,
      fluxoCaixaInicial,
      tma,
      taxaCrescimento,
      taxaPeriodo: taxaPeriodo * 100,
      taxaCrescimentoPeriodo: taxaCrescimentoPeriodo * 100,
      periodicidade,
      viavel,
      interpretacao: viavel
        ? `Projeto com crescimento perpétuo viável: VPL de ${this.formatarMoeda(vpl)}`
        : `Projeto com crescimento perpétuo inviável: VPL de ${this.formatarMoeda(vpl)}`,
      observacao: `Assume crescimento de ${taxaCrescimento}% a.a. indefinidamente. r=${(taxaPeriodo * 100).toFixed(2)}% > g=${(taxaCrescimentoPeriodo * 100).toFixed(2)}%`
    };
  }

  /**
   * Compara VPL com diferentes TMAs (Análise de Sensibilidade)
   * Útil para avaliar impacto da taxa de desconto no projeto
   */
  analiseSensibilidadeTMA(params) {
    this.validarParams(params);

    const tmasTestar = params.tmasTestar || [8, 10, 12, 15, 18, 20];  // % ao ano
    const resultados = [];

    tmasTestar.forEach(tma => {
      const resultado = this.calcularVPL({
        ...params,
        tma
      });

      resultados.push({
        tma,
        vpl: resultado.vpl,
        viavel: resultado.viavel
      });
    });

    // Encontrar TMA que torna VPL = 0 (aproximadamente a TIR)
    const vplsPositivos = resultados.filter(r => r.viavel);
    const vplsNegativos = resultados.filter(r => !r.viavel);

    let tmaLimite = null;
    if (vplsPositivos.length > 0 && vplsNegativos.length > 0) {
      // TMA limite está entre maior VPL positivo e menor VPL negativo
      const maiorTMAPositiva = Math.max(...vplsPositivos.map(r => r.tma));
      const menorTMANegativa = Math.min(...vplsNegativos.map(r => r.tma));
      tmaLimite = (maiorTMAPositiva + menorTMANegativa) / 2;
    }

    return {
      indicador: 'Análise de Sensibilidade - TMA',
      resultados,
      resumo: {
        tmaLimite,
        vplMaximo: Math.max(...resultados.map(r => r.vpl)),
        vplMinimo: Math.min(...resultados.map(r => r.vpl)),
        tmaVPLMaximo: resultados.find(r => r.vpl === Math.max(...resultados.map(x => x.vpl))).tma,
        observacao: tmaLimite
          ? `TMA limite (VPL ≈ 0): ~${tmaLimite.toFixed(2)}% a.a.`
          : 'VPL sempre positivo ou sempre negativo no intervalo testado'
      }
    };
  }

  // ==========================================
  // CONVERSÃO DE TAXA
  // ==========================================

  /**
   * Converte TMA anual para taxa por período
   *
   * Mensal: r_mensal = (1 + TMA_anual)^(1/12) - 1
   * Anual: r = TMA_anual
   *
   * @param {number} tmaAnual - TMA em % ao ano
   * @param {string} periodicidade - 'mensal' | 'anual'
   * @returns {number} Taxa por período (decimal, não %)
   */
  converterTMA(tmaAnual, periodicidade) {
    const tmaDecimal = tmaAnual / 100;  // Converter % para decimal

    if (periodicidade === 'mensal') {
      // Conversão: (1 + r_anual)^(1/12) - 1
      return Math.pow(1 + tmaDecimal, 1 / 12) - 1;
    } else if (periodicidade === 'anual') {
      return tmaDecimal;
    } else {
      throw new Error(`CalculadorVPL: periodicidade inválida "${periodicidade}" (deve ser "mensal" ou "anual")`);
    }
  }

  /**
   * Converte taxa mensal para anual (inverso)
   * r_anual = (1 + r_mensal)^12 - 1
   */
  converterMensalParaAnual(taxaMensal) {
    return (Math.pow(1 + taxaMensal / 100, 12) - 1) * 100;
  }

  // ==========================================
  // VALIDAÇÕES
  // ==========================================

  validarParams(params) {
    if (!params) {
      throw new Error('CalculadorVPL: params obrigatório');
    }

    // Validar investimentoInicial
    if (params.investimentoInicial === undefined || params.investimentoInicial === null) {
      throw new Error('CalculadorVPL: investimentoInicial obrigatório');
    }

    if (typeof params.investimentoInicial !== 'number' || params.investimentoInicial <= 0) {
      throw new Error('CalculadorVPL: investimentoInicial deve ser número positivo');
    }

    // Validar fluxosCaixa
    if (!params.fluxosCaixa || !Array.isArray(params.fluxosCaixa)) {
      throw new Error('CalculadorVPL: fluxosCaixa deve ser array');
    }

    if (params.fluxosCaixa.length === 0) {
      throw new Error('CalculadorVPL: fluxosCaixa não pode ser vazio');
    }

    // Validar TMA
    if (params.tma === undefined || params.tma === null) {
      throw new Error('CalculadorVPL: tma obrigatório');
    }

    if (typeof params.tma !== 'number' || params.tma < 0) {
      throw new Error('CalculadorVPL: tma deve ser número não-negativo (%)');
    }

    // Validar periodicidade
    if (params.periodicidade && params.periodicidade !== 'mensal' && params.periodicidade !== 'anual') {
      throw new Error('CalculadorVPL: periodicidade deve ser "mensal" ou "anual"');
    }
  }

  validarParamsPerpetuo(params) {
    if (!params.fluxoCaixaConstante || typeof params.fluxoCaixaConstante !== 'number') {
      throw new Error('CalculadorVPL: fluxoCaixaConstante obrigatório para VPL perpétuo');
    }

    if (!params.investimentoInicial || !params.tma) {
      throw new Error('CalculadorVPL: investimentoInicial e tma obrigatórios');
    }
  }

  validarParamsCrescimentoPerpetuo(params) {
    if (!params.fluxoCaixaInicial || typeof params.fluxoCaixaInicial !== 'number') {
      throw new Error('CalculadorVPL: fluxoCaixaInicial obrigatório para modelo de crescimento');
    }

    if (params.taxaCrescimento === undefined || params.taxaCrescimento === null) {
      throw new Error('CalculadorVPL: taxaCrescimento obrigatório para modelo de crescimento');
    }

    if (!params.investimentoInicial || !params.tma) {
      throw new Error('CalculadorVPL: investimentoInicial e tma obrigatórios');
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
  window.CalculadorVPL = CalculadorVPL;
  console.log('✅ CalculadorVPL exportado para window');
}

// Exportar para Node.js (se necessário)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CalculadorVPL;
}
