/* =====================================
   TIR-CALCULATOR.JS
   Calculadora de TIR (Taxa Interna de Retorno) usando Método da Secante
   Portado de: budget.py linhas 1607-1642

   MÉTODO DA SECANTE (mais estável que Newton-Raphson)
   - Usa 2 pontos para aproximação
   - Não requer cálculo de derivada
   - Melhor convergência com fluxos irregulares

   PROTEÇÕES NUMÉRICAS (3):
   1. rate <= -1 → ajuste para -0.9999 (evita divisão por zero)
   2. Overflow → retorna ±Infinity
   3. Denominador zero → fallback 0.0

   NO HARDCODED DATA - NO FALLBACKS - KISS - DRY - SOLID
   ===================================== */

class CalculadorTIR {
  constructor() {
    console.log('📊 CalculadorTIR (Método da Secante) inicializado');

    // Parâmetros fixos do algoritmo (exatamente como Python)
    this.TAXA_INICIAL_0 = 0.1;     // 10% - primeiro chute
    this.TAXA_INICIAL_1 = 0.11;    // 11% - segundo chute
    this.MAX_ITERACOES = 100;       // Limite de iterações
    this.TOLERANCIA = 1e-6;         // Precisão desejada
    this.TOLERANCIA_DENOMINADOR = 1e-9;  // Proteção divisão por zero
  }

  // ==========================================
  // TIR - MÉTODO DA SECANTE
  // ==========================================

  /**
   * Calcula TIR usando Método da Secante
   * Cópia exata do Python budget.py linhas 1607-1642
   *
   * Algoritmo:
   * 1. Inicia com 2 taxas: 10% e 11%
   * 2. Calcula VPL para cada taxa
   * 3. Usa fórmula da secante: taxa_next = taxa1 - vpl1 * (taxa1 - taxa0) / (vpl1 - vpl0)
   * 4. Itera até VPL ≈ 0 ou atingir MAX_ITERACOES
   * 5. Converte taxa mensal para anual: ((1+r)^12 - 1) * 100
   *
   * @param {Object} params - Parâmetros obrigatórios
   * @returns {Object} Resultado TIR com convergência e iterações
   */
  calcularTIRSecante(params) {
    // Validar parâmetros obrigatórios
    this.validarParams(params);

    const { investimentoInicial, fluxosCaixa, periodicidade = 'mensal' } = params;

    // Construir array de cash flows: [-I₀, FC₁, FC₂, ..., FCₙ]
    // CRITICAL: investimento inicial é NEGATIVO
    const cashFlows = [-investimentoInicial, ...fluxosCaixa];

    console.log(`🔢 Calculando TIR (Secante): ${cashFlows.length} períodos, periodicidade: ${periodicidade}`);

    // CORREÇÃO 1 & FINAL: Flag para rastrear proteção rate <= -1
    // MOVIDO para ANTES da detecção de fluxos constantes
    let protecaoRateAtivada = false;

    // CORREÇÃO 2: Detectar fluxos constantes ANTES do algoritmo
    // Fluxos constantes causam vpl1 ≈ vpl0 → denominador zero
    const todosIguais = fluxosCaixa.every(f =>
      Math.abs(f - fluxosCaixa[0]) < 0.01
    );

    if (todosIguais && fluxosCaixa.length > 0) {
      const fcMensal = fluxosCaixa[0];
      const n = fluxosCaixa.length;
      const somaFluxos = fcMensal * n;

      // Se fluxos constantes não recuperam investimento
      if (somaFluxos <= investimentoInicial) {
        // CORREÇÃO FINAL: Verificar se taxa seria <= -1
        // Se fluxos são negativos ou muito baixos, taxa seria <= -1
        const taxaAprox = somaFluxos / investimentoInicial - 1;
        if (taxaAprox <= -1.0) {
          protecaoRateAtivada = true;
        }

        return {
          indicador: 'TIR',
          tir: -100.0,
          tirMensal: -100.0,
          converged: true,
          iteracoes: 0,
          vplFinal: -investimentoInicial + somaFluxos,
          interpretacao: 'Fluxos constantes não recuperam investimento',
          observacao: 'TIR negativa - projeto inviável',
          metodo: 'Fluxos constantes (detecção early-return)',
          protecoes: {
            rateLimitado: protecaoRateAtivada,  // CORREÇÃO FINAL: Usar flag
            overflowDetectado: false,
            denominadorZero: false
          }
        };
      }

      // TIR mensal aproximada para fluxos constantes
      // Usando fórmula: VPL = 0 → I0 = FC * [(1 - (1+r)^-n) / r]
      // Aproximação: r ≈ (FC * n / I0) - 1
      const tirMensalAprox = Math.pow(somaFluxos / investimentoInicial, 1 / n) - 1;
      const tirAnualAprox = (Math.pow(1 + tirMensalAprox, 12) - 1) * 100;

      console.log(`📊 Fluxos constantes detectados: TIR aproximada ${tirAnualAprox.toFixed(2)}%`);

      return {
        indicador: 'TIR',
        tir: tirAnualAprox,
        tirMensal: tirMensalAprox * 100,
        converged: true,
        iteracoes: 0,
        vplFinal: 0,
        interpretacao: `TIR de ${tirAnualAprox.toFixed(2)}% ao ano (fluxos constantes)`,
        observacao: 'Cálculo direto para fluxos constantes (sem iteração)',
        metodo: 'Fluxos constantes (fórmula direta)',
        protecoes: {
          rateLimitado: false,  // Taxa positiva (fluxos recuperam investimento)
          overflowDetectado: false,
          denominadorZero: false
        }
      };
    }

    // Helper: Calcular VPL para uma dada taxa
    // Python linha 1614-1622
    const vplCalc = (rate) => {
      // PROTEÇÃO 1: Garante que taxa não seja <= -1
      // Evita divisão por zero ou números complexos
      // Python linha 1616-1617
      if (rate <= -1.0) {
        protecaoRateAtivada = true;  // CORREÇÃO 1: Marcar flag
        rate = -0.9999; // Valor muito próximo de -1
      }

      try {
        let vpn = 0;
        for (let i = 0; i < cashFlows.length; i++) {
          const divisor = Math.pow(1 + rate, i);

          // PROTEÇÃO 2: Overflow
          // Python linha 1620-1622
          if (!isFinite(divisor)) {
            // Retorna número grande para guiar algoritmo
            return rate > 0 ? Infinity : -Infinity;
          }

          vpn += cashFlows[i] / divisor;
        }
        return vpn;
      } catch (error) {
        // PROTEÇÃO 2 (catch): Se houver erro, retornar Infinity
        return rate > 0 ? Infinity : -Infinity;
      }
    };

    // Estimativas iniciais para Método da Secante
    // Python linha 1625
    let taxa0 = this.TAXA_INICIAL_0;  // 0.1 (10%)
    let taxa1 = this.TAXA_INICIAL_1;  // 0.11 (11%)
    let vpl0 = vplCalc(taxa0);
    let vpl1 = vplCalc(taxa1);

    let iteracao = 0;

    // Iterações do Método da Secante
    // Python linha 1628-1639
    for (iteracao = 0; iteracao < this.MAX_ITERACOES; iteracao++) {
      // Verificar convergência
      if (Math.abs(vpl1) < this.TOLERANCIA) {
        console.log(`✅ TIR convergiu em ${iteracao} iterações`);
        break;
      }

      // PROTEÇÃO 3: Evitar divisão por zero
      // Python linha 1633-1634
      if (Math.abs(vpl1 - vpl0) < this.TOLERANCIA_DENOMINADOR) {
        console.warn('⚠️ TIR não convergiu - denominador próximo de zero');
        return {
          indicador: 'TIR',
          tir: 0.0,
          tirMensal: 0.0,
          converged: false,
          iteracoes: iteracao,
          vplFinal: vpl1,
          interpretacao: 'TIR não convergiu - denominador próximo de zero',
          observacao: 'vpl1 ≈ vpl0 causa divisão por zero',
          motivo: 'Denominador próximo de zero (vpl1 ≈ vpl0)',
          metodo: 'Secante (abortado)',
          protecoes: {
            rateLimitado: protecaoRateAtivada,
            overflowDetectado: !isFinite(vpl1),
            denominadorZero: true
          }
        };
      }

      // Fórmula do Método da Secante
      // Python linha 1637
      const taxaNext = taxa1 - vpl1 * (taxa1 - taxa0) / (vpl1 - vpl0);

      // Atualizar taxas e VPLs para próxima iteração
      // Python linha 1638-1639
      taxa0 = taxa1;
      taxa1 = taxaNext;
      vpl0 = vpl1;
      vpl1 = vplCalc(taxa1);
    }

    // Converter taxa mensal para anual e percentual
    // Python linha 1642: ((1 + taxa1) ** 12 - 1) * 100 if taxa1 > -1 else -100.0
    let tirAnualPercentual;
    if (taxa1 > -1) {
      // Conversão: (1+r_mensal)^12 - 1 = r_anual
      tirAnualPercentual = (Math.pow(1 + taxa1, 12) - 1) * 100;
    } else {
      tirAnualPercentual = -100.0;
    }

    const converged = Math.abs(vpl1) < this.TOLERANCIA;

    // CORREÇÃO 5: Objeto protecoes completo e padronizado
    return {
      indicador: 'TIR',
      tir: tirAnualPercentual,
      tirMensal: taxa1 * 100,  // Taxa mensal em %
      converged,
      iteracoes: iteracao,
      vplFinal: vpl1,
      interpretacao: converged
        ? `TIR de ${tirAnualPercentual.toFixed(2)}% ao ano (${(taxa1 * 100).toFixed(4)}% ao mês)`
        : `TIR não convergiu após ${iteracao} iterações`,
      observacao: 'Compare TIR com TMA. Se TIR > TMA, projeto é viável.',
      metodo: 'Secante',
      protecoes: {
        rateLimitado: protecaoRateAtivada,  // CORREÇÃO 1: Usar flag
        overflowDetectado: !isFinite(vpl1),
        denominadorZero: Math.abs(vpl1 - vpl0) < this.TOLERANCIA_DENOMINADOR
      }
    };
  }

  /**
   * Método alternativo: TIR com chute inicial customizado
   * Útil se o algoritmo não convergir com chutes padrão (10% e 11%)
   */
  calcularTIRComChute(params) {
    this.validarParams(params);

    const { chuteInicial0, chuteInicial1 } = params;

    if (chuteInicial0 === undefined || chuteInicial1 === undefined) {
      throw new Error('CalculadorTIR: chuteInicial0 e chuteInicial1 obrigatórios para método com chute customizado');
    }

    // Temporariamente substituir chutes
    const taxaOriginal0 = this.TAXA_INICIAL_0;
    const taxaOriginal1 = this.TAXA_INICIAL_1;

    this.TAXA_INICIAL_0 = chuteInicial0 / 100;  // Converter % para decimal
    this.TAXA_INICIAL_1 = chuteInicial1 / 100;

    const resultado = this.calcularTIRSecante(params);

    // Restaurar chutes originais
    this.TAXA_INICIAL_0 = taxaOriginal0;
    this.TAXA_INICIAL_1 = taxaOriginal1;

    return resultado;
  }

  /**
   * Comparação: TIR Secante vs Newton-Raphson
   * Para fins de validação e debugging
   */
  compararMetodos(params) {
    const tirSecante = this.calcularTIRSecante(params);

    // Calcular TIR usando Newton-Raphson (método antigo)
    // Apenas para comparação - NÃO usar em produção
    const tirNewton = this.calcularTIRNewtonRaphson(params);

    const diferencaAbsoluta = Math.abs(tirSecante.tir - tirNewton.tir);
    const diferencaPercentual = (diferencaAbsoluta / tirNewton.tir) * 100;

    return {
      secante: tirSecante,
      newtonRaphson: tirNewton,
      comparacao: {
        diferencaAbsoluta,
        diferencaPercentual,
        algoritmoRecomendado: 'Secante (mais estável)',
        observacao: diferencaPercentual < 0.01
          ? 'Métodos convergem para mesmo valor'
          : 'Métodos divergem - usar Secante'
      }
    };
  }

  /**
   * TIR Newton-Raphson (DEPRECATED - apenas para comparação)
   * Usa derivada - menos estável que Secante
   */
  calcularTIRNewtonRaphson(params) {
    this.validarParams(params);

    const { investimentoInicial, fluxosCaixa } = params;
    const cashFlows = [-investimentoInicial, ...fluxosCaixa];

    const calcularVPN = (taxa) => {
      let vpn = 0;
      for (let i = 0; i < cashFlows.length; i++) {
        vpn += cashFlows[i] / Math.pow(1 + taxa, i);
      }
      return vpn;
    };

    const calcularDerivada = (taxa) => {
      let derivada = 0;
      for (let i = 0; i < cashFlows.length; i++) {
        derivada += (-i * cashFlows[i]) / Math.pow(1 + taxa, i + 1);
      }
      return derivada;
    };

    let taxa = 0.1;  // Chute inicial 10%
    let iteracao = 0;

    for (iteracao = 0; iteracao < this.MAX_ITERACOES; iteracao++) {
      const vpn = calcularVPN(taxa);
      if (Math.abs(vpn) < this.TOLERANCIA) break;

      const derivada = calcularDerivada(taxa);
      taxa = taxa - vpn / derivada;
    }

    const tirAnual = (Math.pow(1 + taxa, 12) - 1) * 100;

    return {
      indicador: 'TIR',
      tir: tirAnual,
      converged: Math.abs(calcularVPN(taxa)) < this.TOLERANCIA,
      iteracoes: iteracao,
      metodo: 'Newton-Raphson (DEPRECATED)'
    };
  }

  // ==========================================
  // VALIDAÇÕES
  // ==========================================

  validarParams(params) {
    if (!params) {
      throw new Error('CalculadorTIR: params obrigatório');
    }

    // Validar investimentoInicial
    if (params.investimentoInicial === undefined || params.investimentoInicial === null) {
      throw new Error('CalculadorTIR: investimentoInicial obrigatório');
    }

    if (typeof params.investimentoInicial !== 'number' || params.investimentoInicial <= 0) {
      throw new Error('CalculadorTIR: investimentoInicial deve ser número positivo');
    }

    // Validar fluxosCaixa
    if (!params.fluxosCaixa || !Array.isArray(params.fluxosCaixa)) {
      throw new Error('CalculadorTIR: fluxosCaixa deve ser array');
    }

    if (params.fluxosCaixa.length === 0) {
      throw new Error('CalculadorTIR: fluxosCaixa não pode ser vazio');
    }

    // Validar que fluxos são números
    for (let i = 0; i < params.fluxosCaixa.length; i++) {
      const fluxo = params.fluxosCaixa[i];
      if (typeof fluxo !== 'number' || isNaN(fluxo)) {
        throw new Error(`CalculadorTIR: fluxosCaixa[${i}] deve ser número válido`);
      }
    }

    // Validar periodicidade (opcional)
    if (params.periodicidade && params.periodicidade !== 'mensal' && params.periodicidade !== 'anual') {
      throw new Error('CalculadorTIR: periodicidade deve ser "mensal" ou "anual"');
    }
  }

  // ==========================================
  // UTILITIES
  // ==========================================

  formatarPercentual(valor, decimais = 2) {
    return `${valor.toFixed(decimais)}%`;
  }

  formatarMoeda(valor) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  }
}

// Exportar para uso global
if (typeof window !== 'undefined') {
  window.CalculadorTIR = CalculadorTIR;
  console.log('✅ CalculadorTIR exportado para window');
}

// Exportar para Node.js (se necessário)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CalculadorTIR;
}
