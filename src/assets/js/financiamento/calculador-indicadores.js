/* =====================================
   CALCULADOR-INDICADORES.JS
   Calculadora de Indicadores Financeiros de Viabilidade
   VPL, TIR, Payback, Ponto de Equilíbrio
   NO HARDCODED DATA - NO FALLBACKS - KISS - DRY - SOLID

   Indicadores:
   1. VPL (Valor Presente Líquido) - NPV
   2. TIR (Taxa Interna de Retorno) - IRR (Newton-Raphson)
   3. Payback Simples
   4. Payback Descontado
   5. Índice de Lucratividade (IL)
   6. Ponto de Equilíbrio Operacional
   7. Ponto de Equilíbrio Financeiro

   Dependências:
   - CalculadorFluxoCaixa (para fluxo de caixa projetado)
   ===================================== */

class CalculadorIndicadores {
  constructor() {
    console.log('📈 CalculadorIndicadores inicializado');
  }

  // ==========================================
  // VPL - VALOR PRESENTE LÍQUIDO
  // ==========================================

  /**
   * Calcula VPL (Valor Presente Líquido)
   * Single Responsibility: apenas cálculo de VPL
   *
   * Fórmula: VPL = Σ [FCt / (1 + TMA)^t] - Investimento Inicial
   *
   * @param {Object} params - Parâmetros obrigatórios
   * @returns {Object} Resultado VPL
   */
  calcularVPL(params) {
    this.validateVPLParams(params);

    const {
      fluxosCaixa,        // Array de fluxos de caixa [FC1, FC2, FC3, FC4, FC5]
      investimentoInicial,
      tma                 // Taxa Mínima de Atratividade (% ao ano)
    } = params;

    let vpl = -investimentoInicial;

    // Somar valores presentes de cada fluxo
    fluxosCaixa.forEach((fluxo, index) => {
      const periodo = index + 1;
      const valorPresente = fluxo / Math.pow(1 + tma / 100, periodo);
      vpl += valorPresente;
    });

    const viavel = vpl > 0;

    return {
      indicador: 'VPL',
      vpl,
      investimentoInicial,
      tma,
      viavel,
      interpretacao: viavel
        ? `VPL positivo indica que o projeto gera valor acima da TMA de ${tma}%`
        : `VPL negativo indica que o projeto não supera a TMA de ${tma}%`,
      fluxosCaixa,
      valoresPresentes: fluxosCaixa.map((fc, idx) => fc / Math.pow(1 + tma / 100, idx + 1))
    };
  }

  // ==========================================
  // TIR - TAXA INTERNA DE RETORNO
  // ==========================================

  /**
   * Calcula TIR (Taxa Interna de Retorno) usando Método Newton-Raphson
   * Open/Closed Principle: algoritmo iterativo extensível
   *
   * TIR é a taxa que torna VPL = 0
   * Fórmula: 0 = Σ [FCt / (1 + TIR)^t] - Investimento Inicial
   *
   * @param {Object} params - Parâmetros obrigatórios
   * @returns {Object} Resultado TIR
   */
  calcularTIR(params) {
    this.validateTIRParams(params);

    const {
      fluxosCaixa,
      investimentoInicial,
      chute inicial,        // Chute inicial para Newton-Raphson (% ao ano)
      maxIteracoes,         // Máximo de iterações
      tolerancia            // Tolerância para convergência
    } = params;

    let tir = chuteInicial / 100;  // Converter % para decimal
    let iteracao = 0;
    let converged = false;

    while (iteracao < maxIteracoes && !converged) {
      // Calcular VPL com TIR atual
      const vpn = this.calcularVPN(fluxosCaixa, investimentoInicial, tir);

      // Calcular derivada (dVPL/dTIR)
      const derivada = this.calcularDerivadaVPL(fluxosCaixa, tir);

      // Verificar convergência
      if (Math.abs(vpn) < tolerancia) {
        converged = true;
        break;
      }

      // Newton-Raphson: TIR_novo = TIR_atual - VPL / dVPL
      tir = tir - vpn / derivada;

      iteracao++;
    }

    if (!converged) {
      throw new Error(`CalculadorIndicadores: TIR não convergiu após ${maxIteracoes} iterações. Ajuste o chute inicial.`);
    }

    const tirPercentual = tir * 100;

    return {
      indicador: 'TIR',
      tir: tirPercentual,
      investimentoInicial,
      iteracoes: iteracao,
      converged,
      interpretacao: `TIR de ${tirPercentual.toFixed(2)}% representa a taxa de retorno do projeto`,
      observacao: 'Compare com a TMA para avaliar viabilidade. TIR > TMA indica viabilidade.',
      fluxosCaixa
    };
  }

  /**
   * Calcula VPN (Valor Presente Neto) para uma dada taxa
   * Helper para Newton-Raphson
   */
  calcularVPN(fluxosCaixa, investimentoInicial, taxa) {
    let vpn = -investimentoInicial;

    fluxosCaixa.forEach((fluxo, index) => {
      const periodo = index + 1;
      vpn += fluxo / Math.pow(1 + taxa, periodo);
    });

    return vpn;
  }

  /**
   * Calcula derivada do VPL em relação à taxa
   * dVPL/dr = Σ [-t × FCt / (1 + r)^(t+1)]
   */
  calcularDerivadaVPL(fluxosCaixa, taxa) {
    let derivada = 0;

    fluxosCaixa.forEach((fluxo, index) => {
      const periodo = index + 1;
      derivada += (-periodo * fluxo) / Math.pow(1 + taxa, periodo + 1);
    });

    return derivada;
  }

  // ==========================================
  // PAYBACK SIMPLES
  // ==========================================

  /**
   * Calcula Payback Simples (tempo para recuperar investimento)
   * Interface Segregation: método focado e simples
   *
   * @param {Object} params - Parâmetros obrigatórios
   * @returns {Object} Resultado Payback Simples
   */
  calcularPaybackSimples(params) {
    this.validatePaybackParams(params);

    const {
      fluxosCaixa,
      investimentoInicial
    } = params;

    let saldoAcumulado = -investimentoInicial;
    let anoPayback = null;
    let mesesPayback = null;

    for (let i = 0; i < fluxosCaixa.length; i++) {
      saldoAcumulado += fluxosCaixa[i];

      if (saldoAcumulado >= 0 && anoPayback === null) {
        anoPayback = i + 1;

        // Calcular meses adicionais
        const fluxoAnterior = i > 0 ? saldoAcumulado - fluxosCaixa[i] : -investimentoInicial;
        const fracaoAno = Math.abs(fluxoAnterior) / fluxosCaixa[i];
        mesesPayback = Math.round(fracaoAno * 12);

        break;
      }
    }

    const recuperado = anoPayback !== null;

    return {
      indicador: 'Payback Simples',
      anoPayback,
      mesesPayback,
      recuperado,
      investimentoInicial,
      interpretacao: recuperado
        ? `Investimento recuperado em ${anoPayback} ano(s) e ${mesesPayback} mês(es)`
        : 'Investimento não recuperado no período de projeção',
      fluxosCaixa
    };
  }

  // ==========================================
  // PAYBACK DESCONTADO
  // ==========================================

  /**
   * Calcula Payback Descontado (considera valor do dinheiro no tempo)
   * Dependency Inversion: depende de abstrações de fluxo de caixa
   *
   * @param {Object} params - Parâmetros obrigatórios
   * @returns {Object} Resultado Payback Descontado
   */
  calcularPaybackDescontado(params) {
    this.validatePaybackDescontadoParams(params);

    const {
      fluxosCaixa,
      investimentoInicial,
      tma
    } = params;

    let saldoAcumulado = -investimentoInicial;
    let anoPayback = null;
    let mesesPayback = null;

    const fluxosDescontados = fluxosCaixa.map((fc, idx) => {
      return fc / Math.pow(1 + tma / 100, idx + 1);
    });

    for (let i = 0; i < fluxosDescontados.length; i++) {
      saldoAcumulado += fluxosDescontados[i];

      if (saldoAcumulado >= 0 && anoPayback === null) {
        anoPayback = i + 1;

        // Calcular meses adicionais
        const fluxoAnterior = i > 0 ? saldoAcumulado - fluxosDescontados[i] : -investimentoInicial;
        const fracaoAno = Math.abs(fluxoAnterior) / fluxosDescontados[i];
        mesesPayback = Math.round(fracaoAno * 12);

        break;
      }
    }

    const recuperado = anoPayback !== null;

    return {
      indicador: 'Payback Descontado',
      anoPayback,
      mesesPayback,
      recuperado,
      investimentoInicial,
      tma,
      interpretacao: recuperado
        ? `Investimento recuperado (a valor presente) em ${anoPayback} ano(s) e ${mesesPayback} mês(es)`
        : 'Investimento não recuperado no período de projeção (mesmo descontado)',
      fluxosCaixa,
      fluxosDescontados
    };
  }

  // ==========================================
  // ÍNDICE DE LUCRATIVIDADE (IL)
  // ==========================================

  /**
   * Calcula Índice de Lucratividade
   * IL = VP dos Fluxos / Investimento Inicial
   *
   * @param {Object} params - Parâmetros obrigatórios
   * @returns {Object} Resultado IL
   */
  calcularIndiceLucratividade(params) {
    this.validateILParams(params);

    const {
      fluxosCaixa,
      investimentoInicial,
      tma
    } = params;

    // Valor presente dos fluxos de caixa
    const vpFluxos = fluxosCaixa.reduce((sum, fc, idx) => {
      return sum + fc / Math.pow(1 + tma / 100, idx + 1);
    }, 0);

    const il = vpFluxos / investimentoInicial;
    const viavel = il > 1;

    return {
      indicador: 'Índice de Lucratividade',
      il,
      vpFluxos,
      investimentoInicial,
      viavel,
      interpretacao: viavel
        ? `IL de ${il.toFixed(2)} indica que cada R$ 1 investido gera R$ ${il.toFixed(2)} de valor presente`
        : `IL de ${il.toFixed(2)} indica retorno insuficiente (IL deve ser > 1)`,
      observacao: 'IL > 1 indica viabilidade. Quanto maior o IL, mais atrativo o projeto.'
    };
  }

  // ==========================================
  // PONTO DE EQUILÍBRIO
  // ==========================================

  /**
   * Calcula Ponto de Equilíbrio Operacional
   * PE = Custos Fixos / (Margem Contribuição Unitária)
   *
   * @param {Object} params - Parâmetros obrigatórios
   * @returns {Object} Resultado Ponto Equilíbrio
   */
  calcularPontoEquilibrio(params) {
    this.validatePontoEquilibrioParams(params);

    const {
      custosFixosMensais,
      precoVendaUnitario,
      custoVariavelUnitario
    } = params;

    // Margem de contribuição unitária
    const margemContribuicaoUnitaria = precoVendaUnitario - custoVariavelUnitario;

    if (margemContribuicaoUnitaria <= 0) {
      throw new Error('CalculadorIndicadores: Margem de contribuição deve ser positiva (preço > custo variável)');
    }

    // Ponto de equilíbrio em unidades
    const pontoEquilibrioUnidades = custosFixosMensais / margemContribuicaoUnitaria;

    // Ponto de equilíbrio em faturamento
    const pontoEquilibrioFaturamento = pontoEquilibrioUnidades * precoVendaUnitario;

    // Margem de contribuição percentual
    const margemContribuicaoPerc = (margemContribuicaoUnitaria / precoVendaUnitario) * 100;

    return {
      indicador: 'Ponto de Equilíbrio Operacional',
      pontoEquilibrioUnidades,
      pontoEquilibrioFaturamento,
      custosFixosMensais,
      margemContribuicaoUnitaria,
      margemContribuicaoPerc,
      interpretacao: `Necessário vender ${Math.ceil(pontoEquilibrioUnidades)} unidades/mês para cobrir custos fixos`,
      observacao: `Faturamento mínimo: ${this.formatCurrency(pontoEquilibrioFaturamento)}/mês`
    };
  }

  // ==========================================
  // ANÁLISE COMPLETA DE VIABILIDADE
  // ==========================================

  /**
   * Calcula todos os indicadores de viabilidade
   * Aggregator: orquestra todos os cálculos
   *
   * @param {Object} params - Parâmetros obrigatórios
   * @returns {Object} Análise completa
   */
  calcularAnaliseCompleta(params) {
    this.validateAnaliseCompletaParams(params);

    const {
      fluxosCaixa,
      investimentoInicial,
      tma,
      chuteInicialTIR,
      maxIteracoesTIR,
      toleranciaTIR,
      custosFixosMensais,
      precoVendaUnitario,
      custoVariavelUnitario
    } = params;

    // Calcular todos os indicadores
    const vpl = this.calcularVPL({
      fluxosCaixa,
      investimentoInicial,
      tma
    });

    const tir = this.calcularTIR({
      fluxosCaixa,
      investimentoInicial,
      chuteInicial: chuteInicialTIR,
      maxIteracoes: maxIteracoesTIR,
      tolerancia: toleranciaTIR
    });

    const paybackSimples = this.calcularPaybackSimples({
      fluxosCaixa,
      investimentoInicial
    });

    const paybackDescontado = this.calcularPaybackDescontado({
      fluxosCaixa,
      investimentoInicial,
      tma
    });

    const il = this.calcularIndiceLucratividade({
      fluxosCaixa,
      investimentoInicial,
      tma
    });

    const pontoEquilibrio = this.calcularPontoEquilibrio({
      custosFixosMensais,
      precoVendaUnitario,
      custoVariavelUnitario
    });

    // Análise de viabilidade consolidada
    const viabilidade = this.analisarViabilidade(vpl, tir, il, tma);

    return {
      parametros: params,
      indicadores: {
        vpl,
        tir,
        paybackSimples,
        paybackDescontado,
        il,
        pontoEquilibrio
      },
      viabilidade,
      metadata: {
        calculadoEm: new Date().toISOString(),
        versao: '1.0.0'
      }
    };
  }

  /**
   * Analisa viabilidade consolidada
   * Business Rule: critérios de viabilidade
   */
  analisarViabilidade(vpl, tir, il, tma) {
    const criterios = {
      vplPositivo: vpl.vpl > 0,
      tirSuperaTMA: tir.tir > tma,
      ilMaiorQue1: il.il > 1
    };

    const criteriosAtendidos = Object.values(criterios).filter(c => c === true).length;
    const viavel = criteriosAtendidos >= 2; // Pelo menos 2 de 3 critérios

    let recomendacao;
    if (criteriosAtendidos === 3) {
      recomendacao = 'APROVADO - Todos os indicadores apontam viabilidade econômica';
    } else if (criteriosAtendidos === 2) {
      recomendacao = 'APROVADO COM RESSALVAS - Maioria dos indicadores favoráveis';
    } else if (criteriosAtendidos === 1) {
      recomendacao = 'AVALIAR - Apenas 1 indicador favorável, necessário análise detalhada';
    } else {
      recomendacao = 'REPROVADO - Nenhum indicador favorável';
    }

    return {
      viavel,
      criterios,
      criteriosAtendidos,
      recomendacao,
      detalhamento: {
        vpl: vpl.vpl,
        tir: tir.tir,
        il: il.il,
        tma,
        tirVsTMA: tir.tir - tma
      }
    };
  }

  // ==========================================
  // VALIDAÇÕES
  // ==========================================

  validateVPLParams(params) {
    if (!params.fluxosCaixa || !Array.isArray(params.fluxosCaixa)) {
      throw new Error('CalculadorIndicadores: fluxosCaixa deve ser array');
    }

    if (params.investimentoInicial === undefined || params.investimentoInicial === null) {
      throw new Error('CalculadorIndicadores: investimentoInicial obrigatório');
    }

    if (typeof params.investimentoInicial !== 'number' || params.investimentoInicial <= 0) {
      throw new Error('CalculadorIndicadores: investimentoInicial deve ser número positivo');
    }

    if (params.tma === undefined || params.tma === null) {
      throw new Error('CalculadorIndicadores: tma obrigatório');
    }

    if (typeof params.tma !== 'number' || params.tma < 0) {
      throw new Error('CalculadorIndicadores: tma deve ser número não-negativo (%)');
    }
  }

  validateTIRParams(params) {
    this.validateVPLParams(params); // TIR usa mesmos params base que VPL

    if (params.chuteInicial === undefined || params.chuteInicial === null) {
      throw new Error('CalculadorIndicadores: chuteInicial obrigatório para TIR');
    }

    if (params.maxIteracoes === undefined || params.maxIteracoes === null) {
      throw new Error('CalculadorIndicadores: maxIteracoes obrigatório para TIR');
    }

    if (params.tolerancia === undefined || params.tolerancia === null) {
      throw new Error('CalculadorIndicadores: tolerancia obrigatório para TIR');
    }
  }

  validatePaybackParams(params) {
    if (!params.fluxosCaixa || !Array.isArray(params.fluxosCaixa)) {
      throw new Error('CalculadorIndicadores: fluxosCaixa deve ser array');
    }

    if (params.investimentoInicial === undefined || params.investimentoInicial === null) {
      throw new Error('CalculadorIndicadores: investimentoInicial obrigatório');
    }
  }

  validatePaybackDescontadoParams(params) {
    this.validatePaybackParams(params);

    if (params.tma === undefined || params.tma === null) {
      throw new Error('CalculadorIndicadores: tma obrigatório para Payback Descontado');
    }
  }

  validateILParams(params) {
    this.validateVPLParams(params);
  }

  validatePontoEquilibrioParams(params) {
    const required = ['custosFixosMensais', 'precoVendaUnitario', 'custoVariavelUnitario'];

    for (const field of required) {
      if (params[field] === undefined || params[field] === null) {
        throw new Error(`CalculadorIndicadores: ${field} obrigatório`);
      }

      if (typeof params[field] !== 'number' || params[field] < 0) {
        throw new Error(`CalculadorIndicadores: ${field} deve ser número não-negativo`);
      }
    }
  }

  validateAnaliseCompletaParams(params) {
    const required = [
      'fluxosCaixa',
      'investimentoInicial',
      'tma',
      'chuteInicialTIR',
      'maxIteracoesTIR',
      'toleranciaTIR',
      'custosFixosMensais',
      'precoVendaUnitario',
      'custoVariavelUnitario'
    ];

    for (const field of required) {
      if (params[field] === undefined || params[field] === null) {
        throw new Error(`CalculadorIndicadores: ${field} obrigatório para análise completa`);
      }
    }
  }

  // ==========================================
  // UTILITIES
  // ==========================================

  formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  }

  formatPercentage(value, decimals = 2) {
    return `${value.toFixed(decimals)}%`;
  }
}

// Exportar para uso global
if (typeof window !== 'undefined') {
  window.CalculadorIndicadores = CalculadorIndicadores;
}

// Exportar para Node.js (se necessário)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CalculadorIndicadores;
}
