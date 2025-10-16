/* =====================================
   SISTEMA-APURACAO-HIBRIDO.JS
   Orquestrador de Cálculos Tributários Comparativos
   Compara Simples Nacional vs Lucro Presumido vs Lucro Real vs Reforma Tributária
   Gera análise de melhor regime tributário por cenário
   NO HARDCODED DATA - NO FALLBACKS - KISS - DRY - SOLID

   Dependências:
   - TaxCalculator (tax-calculator-core.js)
   - ReformaTributariaCalculator (reforma-tributaria-calculator.js)
   ===================================== */

class SistemaApuracaoHibrido {
  /**
   * @param {TaxCalculator} taxCalculator - Instância do TaxCalculator
   * @param {ReformaTributariaCalculator} reformaCalculator - Instância do ReformaTributariaCalculator
   */
  constructor(taxCalculator, reformaCalculator) {
    if (!taxCalculator) {
      throw new Error('SistemaApuracaoHibrido: taxCalculator é obrigatório');
    }

    if (!reformaCalculator) {
      throw new Error('SistemaApuracaoHibrido: reformaCalculator é obrigatório');
    }

    this.taxCalc = taxCalculator;
    this.reformaCalc = reformaCalculator;

    console.log('🔀 SistemaApuracaoHibrido inicializado');
  }

  // ==========================================
  // COMPARATIVO COMPLETO DE REGIMES
  // ==========================================

  /**
   * Calcula e compara todos os regimes tributários
   * Single Responsibility: apenas orquestração de cálculos
   *
   * @param {Object} params - Parâmetros para cálculo
   * @returns {Object} Comparativo completo com recomendação
   */
  async calcularComparativo(params) {
    const {
      // Dados básicos
      receitaBruta,
      receitaAcumulada12m,
      lucroContabil,

      // Simples Nacional
      anexoSimples,

      // Lucro Presumido
      tipoAtividadePresumido,
      periodoPresumido = 'trimestral',

      // Lucro Real
      creditosPisCofins = 0,
      instituicaoFinanceira = false,

      // ICMS/ISS
      uf,
      aliquotaISS = 5.0,

      // Reforma Tributária
      anoReforma = 2033,
      setorReforma = 'padrao'

    } = params;

    // Validações
    this.validateParams(params);

    const resultados = {};

    // ==========================================
    // 1. SIMPLES NACIONAL
    // ==========================================
    try {
      const simplesResult = this.taxCalc.calculateSimplesNacional(
        receitaAcumulada12m,
        anexoSimples,
        receitaBruta
      );

      resultados.simplesNacional = {
        regime: 'Simples Nacional',
        elegivel: true,
        anexo: anexoSimples,
        tributoTotal: simplesResult.valorDevido,
        aliquotaEfetiva: simplesResult.aliquotaEfetiva,
        detalhamento: simplesResult,
        observacao: 'Regime unificado - substitui IRPJ, CSLL, PIS, COFINS, IPI, ICMS/ISS (conforme anexo)'
      };
    } catch (error) {
      resultados.simplesNacional = {
        regime: 'Simples Nacional',
        elegivel: false,
        motivo: error.message
      };
    }

    // ==========================================
    // 2. LUCRO PRESUMIDO
    // ==========================================
    try {
      const presumidoResult = this.taxCalc.calculateLucroPresumido(
        receitaBruta,
        tipoAtividadePresumido,
        periodoPresumido
      );

      // ICMS separado (não incluído no Lucro Presumido)
      const icmsResult = this.taxCalc.calculateICMS(receitaBruta, uf);

      const totalPresumido = presumidoResult.resumo.totalTributos + icmsResult.icmsDevido;

      resultados.lucroPresumido = {
        regime: 'Lucro Presumido',
        elegivel: receitaBruta <= 78000000, // Limite anual: R$ 78M
        tributoTotal: totalPresumido,
        aliquotaEfetiva: (totalPresumido / receitaBruta) * 100,
        detalhamento: {
          federal: presumidoResult.resumo.totalTributos,
          icms: icmsResult.icmsDevido,
          detalhes: {
            irpj: presumidoResult.irpj.total,
            csll: presumidoResult.csll.total,
            pis: presumidoResult.pis.total,
            cofins: presumidoResult.cofins.total,
            icms: icmsResult.icmsDevido
          }
        },
        observacao: 'Regime simplificado com presunção de lucro'
      };
    } catch (error) {
      resultados.lucroPresumido = {
        regime: 'Lucro Presumido',
        elegivel: false,
        motivo: error.message
      };
    }

    // ==========================================
    // 3. LUCRO REAL
    // ==========================================
    try {
      const realResult = this.taxCalc.calculateLucroReal(
        lucroContabil,
        'trimestral',
        receitaBruta,
        creditosPisCofins,
        instituicaoFinanceira
      );

      // ICMS separado
      const icmsResult = this.taxCalc.calculateICMS(receitaBruta, uf);

      const totalReal = realResult.resumo.totalTributos + icmsResult.icmsDevido;

      resultados.lucroReal = {
        regime: 'Lucro Real',
        elegivel: true, // Sempre elegível
        tributoTotal: totalReal,
        aliquotaEfetiva: (totalReal / receitaBruta) * 100,
        detalhamento: {
          federal: realResult.resumo.totalTributos,
          icms: icmsResult.icmsDevido,
          detalhes: {
            irpj: realResult.irpj.total,
            csll: realResult.csll.total,
            pis: realResult.pis.total,
            cofins: realResult.cofins.total,
            icms: icmsResult.icmsDevido
          },
          creditosAplicados: creditosPisCofins
        },
        observacao: 'Regime obrigatório para faturamento > R$ 78M/ano ou lucro no exterior'
      };
    } catch (error) {
      resultados.lucroReal = {
        regime: 'Lucro Real',
        elegivel: false,
        motivo: error.message
      };
    }

    // ==========================================
    // 4. REFORMA TRIBUTÁRIA (2026-2033)
    // ==========================================
    try {
      const reformaResult = this.reformaCalc.calculateReforma(
        receitaBruta,
        anoReforma,
        setorReforma
      );

      resultados.reformaTributaria = {
        regime: `Reforma Tributária (${anoReforma})`,
        elegivel: true,
        ano: anoReforma,
        fase: reformaResult.fase,
        setor: reformaResult.setor.nome,
        tributoTotal: reformaResult.total.comReducao,
        aliquotaEfetiva: reformaResult.total.aliquotaEfetiva,
        detalhamento: {
          cbs: reformaResult.cbs.comReducao,
          ibs: reformaResult.ibs.comReducao,
          splitPaymentAtivo: reformaResult.splitPayment.ativo,
          reducaoSetorial: reformaResult.setor.reducao
        },
        observacao: `${reformaResult.fase} - ${reformaResult.descricaoFase}`
      };

      // Calcular impacto Split Payment se ativo
      if (reformaResult.splitPayment.ativo) {
        const splitImpact = this.reformaCalc.calculateSplitPaymentImpact(
          receitaBruta,
          30, // PMR padrão 30 dias
          70  // 70% vendas a prazo
        );

        resultados.reformaTributaria.splitPayment = {
          ativo: true,
          impactoNCG: splitImpact.impactoNCG,
          estrategiasMitigacao: splitImpact.estrategiasMitigacao
        };
      }
    } catch (error) {
      resultados.reformaTributaria = {
        regime: 'Reforma Tributária',
        elegivel: false,
        motivo: error.message
      };
    }

    // ==========================================
    // 5. ANÁLISE COMPARATIVA E RECOMENDAÇÃO
    // ==========================================
    const analise = this.gerarAnaliseComparativa(resultados, params);

    return {
      parametros: params,
      resultados,
      analise,
      timestamp: Date.now(),
      dataCalculo: new Date().toISOString()
    };
  }

  // ==========================================
  // ANÁLISE E RECOMENDAÇÃO
  // ==========================================

  /**
   * Gera análise comparativa e recomendação de melhor regime
   * Open/Closed Principle: extensível para novos critérios
   */
  gerarAnaliseComparativa(resultados, params) {
    // Filtrar apenas regimes elegíveis
    const regimesElegiveis = Object.entries(resultados)
      .filter(([_, regime]) => regime.elegivel)
      .map(([nome, regime]) => ({
        nome: regime.regime,
        chave: nome,
        tributoTotal: regime.tributoTotal,
        aliquotaEfetiva: regime.aliquotaEfetiva
      }));

    if (regimesElegiveis.length === 0) {
      return {
        regimesElegiveis: 0,
        recomendacao: null,
        motivo: 'Nenhum regime elegível encontrado'
      };
    }

    // Ordenar por menor tributo
    regimesElegiveis.sort((a, b) => a.tributoTotal - b.tributoTotal);

    const melhorRegime = regimesElegiveis[0];
    const piorRegime = regimesElegiveis[regimesElegiveis.length - 1];

    // Calcular economia
    const economia = piorRegime.tributoTotal - melhorRegime.tributoTotal;
    const economiaPercentual = (economia / piorRegime.tributoTotal) * 100;

    // Gerar tabela comparativa
    const tabelaComparativa = regimesElegiveis.map(regime => ({
      regime: regime.nome,
      tributoTotal: regime.tributoTotal,
      aliquotaEfetiva: regime.aliquotaEfetiva,
      diferencaMelhor: regime.tributoTotal - melhorRegime.tributoTotal,
      percentualAMais: ((regime.tributoTotal - melhorRegime.tributoTotal) / melhorRegime.tributoTotal) * 100
    }));

    // Critérios de recomendação
    const criterios = this.avaliarCriterios(resultados, params);

    return {
      regimesElegiveis: regimesElegiveis.length,
      melhorRegime: {
        nome: melhorRegime.nome,
        chave: melhorRegime.chave,
        tributoTotal: melhorRegime.tributoTotal,
        aliquotaEfetiva: melhorRegime.aliquotaEfetiva
      },
      piorRegime: {
        nome: piorRegime.nome,
        tributoTotal: piorRegime.tributoTotal,
        aliquotaEfetiva: piorRegime.aliquotaEfetiva
      },
      economia: {
        valorAbsoluto: economia,
        percentual: economiaPercentual,
        descricao: `Economia de ${this.formatCurrency(economia)} (${economiaPercentual.toFixed(2)}%) ao escolher ${melhorRegime.nome}`
      },
      tabelaComparativa,
      criterios,
      recomendacao: this.gerarRecomendacaoDetalhada(melhorRegime, criterios, resultados)
    };
  }

  /**
   * Avalia critérios qualitativos para recomendação
   * Dependency Inversion: depende de abstrações
   */
  avaliarCriterios(resultados, params) {
    const criterios = {
      simplificacaoContabil: null,
      aproveitamentoCreditos: null,
      projecaoReforma: null,
      riscoAuditoria: null
    };

    const melhorRegimeCalc = this.identificarMelhorRegime(resultados);

    // Simplificação contábil
    if (melhorRegimeCalc === 'simplesNacional') {
      criterios.simplificacaoContabil = {
        nivel: 'ALTO',
        descricao: 'Simples Nacional unifica tributos e reduz obrigações acessórias'
      };
    } else if (melhorRegimeCalc === 'lucroPresumido') {
      criterios.simplificacaoContabil = {
        nivel: 'MÉDIO',
        descricao: 'Lucro Presumido exige contabilidade simplificada'
      };
    } else {
      criterios.simplificacaoContabil = {
        nivel: 'BAIXO',
        descricao: 'Lucro Real exige contabilidade completa e detalhada'
      };
    }

    // Aproveitamento de créditos
    if (melhorRegimeCalc === 'lucroReal') {
      criterios.aproveitamentoCreditos = {
        possivel: true,
        descricao: 'Lucro Real permite aproveitamento de créditos de PIS/COFINS sobre insumos'
      };
    } else {
      criterios.aproveitamentoCreditos = {
        possivel: false,
        descricao: 'Regime não permite aproveitamento de créditos'
      };
    }

    // Projeção Reforma Tributária
    if (resultados.reformaTributaria && resultados.reformaTributaria.elegivel) {
      const diferencaReforma = resultados.reformaTributaria.tributoTotal -
                               resultados[melhorRegimeCalc].tributoTotal;

      if (diferencaReforma > 0) {
        criterios.projecaoReforma = {
          impacto: 'NEGATIVO',
          valorExtra: diferencaReforma,
          descricao: `Reforma aumentará carga tributária em ${this.formatCurrency(diferencaReforma)}`
        };
      } else {
        criterios.projecaoReforma = {
          impacto: 'POSITIVO',
          economia: Math.abs(diferencaReforma),
          descricao: `Reforma reduzirá carga tributária em ${this.formatCurrency(Math.abs(diferencaReforma))}`
        };
      }
    }

    // Risco de auditoria
    criterios.riscoAuditoria = this.avaliarRiscoAuditoria(melhorRegimeCalc, params);

    return criterios;
  }

  /**
   * Identifica melhor regime por menor tributo
   */
  identificarMelhorRegime(resultados) {
    let melhorChave = null;
    let menorTributo = Infinity;

    for (const [chave, regime] of Object.entries(resultados)) {
      if (regime.elegivel && regime.tributoTotal < menorTributo) {
        menorTributo = regime.tributoTotal;
        melhorChave = chave;
      }
    }

    return melhorChave;
  }

  /**
   * Avalia risco de auditoria por regime
   */
  avaliarRiscoAuditoria(regime, params) {
    const riscos = {
      simplesNacional: {
        nivel: 'BAIXO',
        descricao: 'Auditoria focada em enquadramento e faturamento'
      },
      lucroPresumido: {
        nivel: 'MÉDIO',
        descricao: 'Auditoria em presunções e despesas não dedutíveis'
      },
      lucroReal: {
        nivel: 'ALTO',
        descricao: 'Auditoria detalhada de escrituração contábil e créditos'
      },
      reformaTributaria: {
        nivel: 'MÉDIO',
        descricao: 'Regime em transição - regras ainda sendo consolidadas'
      }
    };

    return riscos[regime] || {
      nivel: 'DESCONHECIDO',
      descricao: 'Regime não mapeado'
    };
  }

  /**
   * Gera recomendação textual detalhada
   */
  gerarRecomendacaoDetalhada(melhorRegime, criterios, resultados) {
    const textos = [];

    // Título
    textos.push(`**Recomendação: ${melhorRegime.nome}**`);
    textos.push('');

    // Resumo
    textos.push(`Este regime apresenta a menor carga tributária total de ${this.formatCurrency(melhorRegime.tributoTotal)} (${melhorRegime.aliquotaEfetiva.toFixed(2)}% de alíquota efetiva).`);
    textos.push('');

    // Critérios
    textos.push('**Critérios considerados:**');
    textos.push(`- Simplificação contábil: ${criterios.simplificacaoContabil.nivel}`);
    textos.push(`- Aproveitamento de créditos: ${criterios.aproveitamentoCreditos.possivel ? 'Sim' : 'Não'}`);

    if (criterios.projecaoReforma) {
      textos.push(`- Projeção Reforma: ${criterios.projecaoReforma.impacto}`);
    }

    textos.push(`- Risco auditoria: ${criterios.riscoAuditoria.nivel}`);
    textos.push('');

    // Observações específicas do regime
    textos.push('**Observações:**');
    textos.push(resultados[melhorRegime.chave].observacao);

    return textos.join('\n');
  }

  // ==========================================
  // VALIDAÇÕES
  // ==========================================

  /**
   * Valida parâmetros de entrada
   * Interface Segregation: validação mínima necessária
   */
  validateParams(params) {
    const required = ['receitaBruta', 'receitaAcumulada12m', 'anexoSimples', 'tipoAtividadePresumido', 'uf'];

    for (const field of required) {
      if (params[field] === undefined || params[field] === null) {
        throw new Error(`Campo obrigatório "${field}" ausente`);
      }
    }

    if (typeof params.receitaBruta !== 'number' || params.receitaBruta < 0) {
      throw new Error('receitaBruta deve ser número não-negativo');
    }

    if (typeof params.receitaAcumulada12m !== 'number' || params.receitaAcumulada12m < 0) {
      throw new Error('receitaAcumulada12m deve ser número não-negativo');
    }

    if (!['I', 'II', 'III', 'IV', 'V'].includes(params.anexoSimples)) {
      throw new Error('anexoSimples deve ser I, II, III, IV ou V');
    }
  }

  // ==========================================
  // UTILITIES
  // ==========================================

  /**
   * Formata valor em moeda brasileira
   */
  formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  }

  /**
   * Formata percentual
   */
  formatPercentage(value, decimals = 2) {
    return `${value.toFixed(decimals)}%`;
  }

  /**
   * Exporta comparativo para JSON
   */
  exportarJSON(comparativo) {
    return JSON.stringify(comparativo, null, 2);
  }

  /**
   * Exporta comparativo para CSV
   */
  exportarCSV(comparativo) {
    const { tabelaComparativa } = comparativo.analise;

    const headers = ['Regime', 'Tributo Total', 'Alíquota Efetiva (%)', 'Diferença p/ Melhor', 'Percentual a Mais (%)'];
    const rows = tabelaComparativa.map(row => [
      row.regime,
      row.tributoTotal.toFixed(2),
      row.aliquotaEfetiva.toFixed(2),
      row.diferencaMelhor.toFixed(2),
      row.percentualAMais.toFixed(2)
    ]);

    const csv = [headers, ...rows]
      .map(row => row.join(','))
      .join('\n');

    return csv;
  }
}

// Exportar para uso global
if (typeof window !== 'undefined') {
  window.SistemaApuracaoHibrido = SistemaApuracaoHibrido;
}

// Exportar para Node.js (se necessário)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SistemaApuracaoHibrido;
}
