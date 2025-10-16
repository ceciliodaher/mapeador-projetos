/* =====================================
   CALCULADOR-DRE-PROJETADO.JS
   Calculadora de Demonstração do Resultado do Exercício Projetado
   Projeção de 5 anos com cálculos tributários integrados
   NO HARDCODED DATA - NO FALLBACKS - KISS - DRY - SOLID

   Estrutura DRE (14 linhas):
   1. Receita Bruta de Vendas
   2. (-) Deduções da Receita (tributos sobre vendas)
   3. (=) Receita Líquida
   4. (-) CPV (Custo dos Produtos Vendidos)
   5. (=) Lucro Bruto
   6. (-) Despesas Operacionais
   7. (=) EBITDA
   8. (-) Depreciação
   9. (=) EBIT (Lucro Operacional)
   10. (+/-) Resultado Financeiro
   11. (=) LAIR (Lucro Antes do IR)
   12. (-) IR e CSLL
   13. (=) Lucro Líquido
   14. (%) Margem Líquida

   Dependências:
   - TaxCalculator (tax-calculator-core.js)
   ===================================== */

class CalculadorDREProjetado {
  /**
   * @param {TaxCalculator} taxCalculator - Instância do TaxCalculator para cálculos tributários
   */
  constructor(taxCalculator) {
    if (!taxCalculator) {
      throw new Error('CalculadorDREProjetado: taxCalculator é obrigatório');
    }

    this.taxCalc = taxCalculator;

    console.log('📊 CalculadorDREProjetado inicializado');
  }

  // ==========================================
  // CÁLCULO DRE PROJETADO (5 ANOS)
  // ==========================================

  /**
   * Calcula DRE projetado para 5 anos
   * Single Responsibility: apenas cálculo de DRE
   *
   * @param {Object} params - Parâmetros de projeção (TODOS obrigatórios)
   * @returns {Object} DRE projetado para 5 anos
   */
  async calcularDREProjetado(params) {
    // Validação obrigatória ANTES de desestruturar
    this.validateParams(params);

    const {
      // Ano base
      anoBase,

      // Receita ano 1
      receitaBrutaAno1,

      // Custos e despesas ano 1
      cpvAno1,
      despesasOperacionaisAno1,
      despesasFinanceirasAno1,
      receitasFinanceirasAno1,
      depreciacaoAnual,

      // Taxas de crescimento (% ao ano)
      taxaCrescimentoReceita,
      taxaCrescimentoCPV,
      taxaCrescimentoDespesas,

      // Regime tributário (obrigatório)
      regimeTributario,

      // Simples Nacional (obrigatório se regimeTributario === 'simplesNacional')
      anexoSimples,
      receitaAcumulada12m,

      // Lucro Presumido (obrigatório se regimeTributario === 'lucroPresumido')
      tipoAtividadePresumido,

      // Lucro Real (obrigatório se regimeTributario === 'lucroReal')
      creditosPisCofins,
      instituicaoFinanceira,

      // ICMS/ISS (obrigatórios)
      uf,
      aplicaICMS,
      aliquotaISS

    } = params;

    const anosProjecao = 5;
    const dre = [];

    // Calcular DRE para cada ano
    for (let ano = 0; ano < anosProjecao; ano++) {
      const anoAtual = anoBase + ano;

      // ==========================================
      // 1. RECEITA BRUTA
      // ==========================================
      const receitaBruta = ano === 0
        ? receitaBrutaAno1
        : receitaBrutaAno1 * Math.pow(1 + taxaCrescimentoReceita / 100, ano);

      // ==========================================
      // 2. DEDUÇÕES DA RECEITA (tributos sobre vendas)
      // ==========================================
      let deducoes = {};
      let receitaLiquida = receitaBruta;

      if (regimeTributario === 'simplesNacional') {
        // Simples Nacional - tributos unificados
        const simplesResult = this.taxCalc.calculateSimplesNacional(
          receitaAcumulada12m * Math.pow(1 + taxaCrescimentoReceita / 100, ano),
          anexoSimples,
          receitaBruta
        );

        deducoes = {
          tributos: simplesResult.valorDevido,
          aliquotaEfetiva: simplesResult.aliquotaEfetiva,
          detalhamento: {
            simplesNacional: simplesResult.valorDevido
          }
        };

        receitaLiquida = receitaBruta - simplesResult.valorDevido;

      } else {
        // Lucro Presumido ou Real - PIS + COFINS + ICMS/ISS
        let pisTotal = 0;
        let cofinsTotal = 0;
        let icmsTotal = 0;
        let issTotal = 0;

        if (regimeTributario === 'lucroPresumido') {
          // PIS/COFINS cumulativo
          pisTotal = receitaBruta * 0.0065;  // 0,65%
          cofinsTotal = receitaBruta * 0.03;  // 3%
        } else if (regimeTributario === 'lucroReal') {
          // PIS/COFINS não-cumulativo
          pisTotal = Math.max(0, (receitaBruta * 0.0165) - creditosPisCofins);
          cofinsTotal = Math.max(0, (receitaBruta * 0.076) - creditosPisCofins);
        }

        // ICMS ou ISS
        if (aplicaICMS) {
          const icmsResult = this.taxCalc.calculateICMS(receitaBruta, uf);
          icmsTotal = icmsResult.icmsDevido;
        } else {
          const issResult = this.taxCalc.calculateISS(receitaBruta, aliquotaISS);
          issTotal = issResult.issDevido;
        }

        const totalDeducoes = pisTotal + cofinsTotal + icmsTotal + issTotal;

        deducoes = {
          tributos: totalDeducoes,
          aliquotaEfetiva: (totalDeducoes / receitaBruta) * 100,
          detalhamento: {
            pis: pisTotal,
            cofins: cofinsTotal,
            icms: icmsTotal,
            iss: issTotal
          }
        };

        receitaLiquida = receitaBruta - totalDeducoes;
      }

      // ==========================================
      // 3. CPV (CUSTO PRODUTOS VENDIDOS)
      // ==========================================
      const cpv = ano === 0
        ? cpvAno1
        : cpvAno1 * Math.pow(1 + taxaCrescimentoCPV / 100, ano);

      // ==========================================
      // 4. LUCRO BRUTO
      // ==========================================
      const lucroBruto = receitaLiquida - cpv;
      const margemBruta = (lucroBruto / receitaBruta) * 100;

      // ==========================================
      // 5. DESPESAS OPERACIONAIS
      // ==========================================
      const despesasOperacionais = ano === 0
        ? despesasOperacionaisAno1
        : despesasOperacionaisAno1 * Math.pow(1 + taxaCrescimentoDespesas / 100, ano);

      // ==========================================
      // 6. EBITDA
      // ==========================================
      const ebitda = lucroBruto - despesasOperacionais;
      const margemEbitda = (ebitda / receitaBruta) * 100;

      // ==========================================
      // 7. DEPRECIAÇÃO
      // ==========================================
      const depreciacao = depreciacaoAnual;

      // ==========================================
      // 8. EBIT (LUCRO OPERACIONAL)
      // ==========================================
      const ebit = ebitda - depreciacao;
      const margemOperacional = (ebit / receitaBruta) * 100;

      // ==========================================
      // 9. RESULTADO FINANCEIRO
      // ==========================================
      const despesasFinanceiras = ano === 0
        ? despesasFinanceirasAno1
        : despesasFinanceirasAno1 * Math.pow(1 + taxaCrescimentoDespesas / 100, ano);

      const receitasFinanceiras = ano === 0
        ? receitasFinanceirasAno1
        : receitasFinanceirasAno1 * Math.pow(1 + taxaCrescimentoReceita / 100, ano);

      const resultadoFinanceiro = receitasFinanceiras - despesasFinanceiras;

      // ==========================================
      // 10. LAIR (LUCRO ANTES DO IR)
      // ==========================================
      const lair = ebit + resultadoFinanceiro;

      // ==========================================
      // 11. IR E CSLL
      // ==========================================
      let irCsll = 0;
      let detalhamentoIRCSLL = {};

      if (regimeTributario === 'simplesNacional') {
        // Já incluído nas deduções
        irCsll = 0;
        detalhamentoIRCSLL = { inclusoNoSimples: true };

      } else if (regimeTributario === 'lucroPresumido') {
        // Lucro Presumido
        const presumidoResult = this.taxCalc.calculateLucroPresumido(
          receitaBruta,
          tipoAtividadePresumido,
          'trimestral'
        );

        irCsll = presumidoResult.irpj.total + presumidoResult.csll.total;
        detalhamentoIRCSLL = {
          irpj: presumidoResult.irpj.total,
          csll: presumidoResult.csll.total
        };

      } else if (regimeTributario === 'lucroReal') {
        // Lucro Real
        const lucroContabil = lair; // Simplificação: LAIR = Lucro Contábil

        const realResult = this.taxCalc.calculateLucroReal(
          lucroContabil,
          'trimestral',
          receitaBruta,
          creditosPisCofins,
          instituicaoFinanceira
        );

        irCsll = realResult.irpj.total + realResult.csll.total;
        detalhamentoIRCSLL = {
          irpj: realResult.irpj.total,
          csll: realResult.csll.total
        };
      }

      // ==========================================
      // 12. LUCRO LÍQUIDO
      // ==========================================
      const lucroLiquido = lair - irCsll;
      const margemLiquida = (lucroLiquido / receitaBruta) * 100;

      // ==========================================
      // CONSTRUIR RESULTADO DO ANO
      // ==========================================
      dre.push({
        ano: anoAtual,
        periodoProjecao: ano + 1,
        receita: {
          receitaBruta,
          deducoes: deducoes.tributos,
          deducoesDetalhamento: deducoes.detalhamento,
          aliquotaEfetivaDeducoes: deducoes.aliquotaEfetiva,
          receitaLiquida
        },
        custos: {
          cpv,
          percentualCPV: (cpv / receitaBruta) * 100
        },
        lucroBruto: {
          valor: lucroBruto,
          margem: margemBruta
        },
        despesas: {
          operacionais: despesasOperacionais,
          percentualDespesas: (despesasOperacionais / receitaBruta) * 100
        },
        ebitda: {
          valor: ebitda,
          margem: margemEbitda
        },
        depreciacao: {
          valor: depreciacao
        },
        ebit: {
          valor: ebit,
          margem: margemOperacional
        },
        financeiro: {
          despesas: despesasFinanceiras,
          receitas: receitasFinanceiras,
          resultado: resultadoFinanceiro
        },
        lair: {
          valor: lair,
          margem: (lair / receitaBruta) * 100
        },
        irCsll: {
          valor: irCsll,
          detalhamento: detalhamentoIRCSLL,
          aliquotaEfetiva: receitaBruta > 0 ? (irCsll / receitaBruta) * 100 : 0
        },
        lucroLiquido: {
          valor: lucroLiquido,
          margem: margemLiquida
        },
        cargaTributariaTotal: {
          valor: deducoes.tributos + irCsll,
          percentual: ((deducoes.tributos + irCsll) / receitaBruta) * 100
        }
      });
    }

    // Calcular indicadores agregados
    const indicadores = this.calcularIndicadoresAgregados(dre);

    return {
      parametros: params,
      regimeTributario,
      anoBase,
      anosProjecao,
      dre,
      indicadores,
      metadata: {
        calculadoEm: new Date().toISOString(),
        versao: '1.0.0'
      }
    };
  }

  // ==========================================
  // INDICADORES AGREGADOS
  // ==========================================

  /**
   * Calcula indicadores agregados da projeção
   * Open/Closed Principle: extensível para novos indicadores
   */
  calcularIndicadoresAgregados(dre) {
    const totalAnos = dre.length;

    // Receita total 5 anos
    const receitaTotal5Anos = dre.reduce((sum, ano) => sum + ano.receita.receitaBruta, 0);

    // Lucro líquido acumulado 5 anos
    const lucroLiquidoAcumulado = dre.reduce((sum, ano) => sum + ano.lucroLiquido.valor, 0);

    // Margem líquida média
    const margemLiquidaMedia = dre.reduce((sum, ano) => sum + ano.lucroLiquido.margem, 0) / totalAnos;

    // Carga tributária média
    const cargaTributariaMedia = dre.reduce((sum, ano) => sum + ano.cargaTributariaTotal.percentual, 0) / totalAnos;

    // EBITDA acumulado
    const ebitdaAcumulado = dre.reduce((sum, ano) => sum + ano.ebitda.valor, 0);

    // Margem EBITDA média
    const margemEbitdaMedia = dre.reduce((sum, ano) => sum + ano.ebitda.margem, 0) / totalAnos;

    // Taxa de crescimento composta (CAGR) receita
    const receitaAno1 = dre[0].receita.receitaBruta;
    const receitaAno5 = dre[totalAnos - 1].receita.receitaBruta;
    const cagrReceita = (Math.pow(receitaAno5 / receitaAno1, 1 / (totalAnos - 1)) - 1) * 100;

    // Taxa de crescimento composta lucro líquido
    const lucroAno1 = dre[0].lucroLiquido.valor;
    const lucroAno5 = dre[totalAnos - 1].lucroLiquido.valor;
    const cagrLucro = lucroAno1 > 0 && lucroAno5 > 0
      ? (Math.pow(lucroAno5 / lucroAno1, 1 / (totalAnos - 1)) - 1) * 100
      : null;

    return {
      receitaTotal5Anos,
      lucroLiquidoAcumulado,
      margemLiquidaMedia,
      cargaTributariaMedia,
      ebitdaAcumulado,
      margemEbitdaMedia,
      crescimento: {
        cagrReceita,
        cagrLucro,
        receitaAno1,
        receitaAno5,
        lucroAno1,
        lucroAno5
      }
    };
  }

  // ==========================================
  // EXPORTAÇÃO
  // ==========================================

  /**
   * Exporta DRE para formato tabular (para Excel)
   * Interface Segregation: apenas estrutura de dados
   */
  exportarParaTabela(dreProjetado) {
    const header = ['Descrição', ...dreProjetado.dre.map(ano => `Ano ${ano.periodoProjecao} (${ano.ano})`)];

    const rows = [
      ['RECEITA BRUTA', ...dreProjetado.dre.map(a => a.receita.receitaBruta)],
      ['(-) Deduções da Receita', ...dreProjetado.dre.map(a => -a.receita.deducoes)],
      ['    PIS', ...dreProjetado.dre.map(a => -(a.receita.deducoesDetalhamento.pis || 0))],
      ['    COFINS', ...dreProjetado.dre.map(a => -(a.receita.deducoesDetalhamento.cofins || 0))],
      ['    ICMS', ...dreProjetado.dre.map(a => -(a.receita.deducoesDetalhamento.icms || 0))],
      ['    ISS', ...dreProjetado.dre.map(a => -(a.receita.deducoesDetalhamento.iss || 0))],
      ['(=) RECEITA LÍQUIDA', ...dreProjetado.dre.map(a => a.receita.receitaLiquida)],
      ['(-) CPV', ...dreProjetado.dre.map(a => -a.custos.cpv)],
      ['(=) LUCRO BRUTO', ...dreProjetado.dre.map(a => a.lucroBruto.valor)],
      ['    % Margem Bruta', ...dreProjetado.dre.map(a => a.lucroBruto.margem)],
      ['(-) Despesas Operacionais', ...dreProjetado.dre.map(a => -a.despesas.operacionais)],
      ['(=) EBITDA', ...dreProjetado.dre.map(a => a.ebitda.valor)],
      ['    % Margem EBITDA', ...dreProjetado.dre.map(a => a.ebitda.margem)],
      ['(-) Depreciação', ...dreProjetado.dre.map(a => -a.depreciacao.valor)],
      ['(=) EBIT', ...dreProjetado.dre.map(a => a.ebit.valor)],
      ['(+/-) Resultado Financeiro', ...dreProjetado.dre.map(a => a.financeiro.resultado)],
      ['(=) LAIR', ...dreProjetado.dre.map(a => a.lair.valor)],
      ['(-) IR e CSLL', ...dreProjetado.dre.map(a => -a.irCsll.valor)],
      ['(=) LUCRO LÍQUIDO', ...dreProjetado.dre.map(a => a.lucroLiquido.valor)],
      ['    % Margem Líquida', ...dreProjetado.dre.map(a => a.lucroLiquido.margem)],
      ['', ...Array(dreProjetado.dre.length).fill('')],
      ['CARGA TRIBUTÁRIA TOTAL', ...dreProjetado.dre.map(a => a.cargaTributariaTotal.valor)],
      ['% Carga Tributária', ...dreProjetado.dre.map(a => a.cargaTributariaTotal.percentual)]
    ];

    return { header, rows };
  }

  /**
   * Exporta para JSON
   */
  exportarJSON(dreProjetado) {
    return JSON.stringify(dreProjetado, null, 2);
  }

  // ==========================================
  // VALIDAÇÕES
  // ==========================================

  /**
   * Valida parâmetros de entrada - TODOS obrigatórios
   * NO FALLBACKS - lança exceção se algo estiver faltando
   */
  validateParams(params) {
    // Parâmetros base obrigatórios
    const requiredBase = [
      'anoBase',
      'receitaBrutaAno1',
      'cpvAno1',
      'despesasOperacionaisAno1',
      'despesasFinanceirasAno1',
      'receitasFinanceirasAno1',
      'depreciacaoAnual',
      'taxaCrescimentoReceita',
      'taxaCrescimentoCPV',
      'taxaCrescimentoDespesas',
      'regimeTributario',
      'uf',
      'aplicaICMS'
    ];

    for (const field of requiredBase) {
      if (params[field] === undefined || params[field] === null) {
        throw new Error(`CalculadorDREProjetado: Campo obrigatório "${field}" ausente`);
      }
    }

    // Validar tipos numéricos
    const numericFields = [
      'anoBase',
      'receitaBrutaAno1',
      'cpvAno1',
      'despesasOperacionaisAno1',
      'despesasFinanceirasAno1',
      'receitasFinanceirasAno1',
      'depreciacaoAnual',
      'taxaCrescimentoReceita',
      'taxaCrescimentoCPV',
      'taxaCrescimentoDespesas'
    ];

    for (const field of numericFields) {
      if (typeof params[field] !== 'number') {
        throw new Error(`CalculadorDREProjetado: Campo "${field}" deve ser número`);
      }

      // Valores não podem ser negativos (exceto taxas de crescimento)
      if (!field.includes('taxaCrescimento') && params[field] < 0) {
        throw new Error(`CalculadorDREProjetado: Campo "${field}" não pode ser negativo`);
      }
    }

    // Validar regime tributário
    const regimesValidos = ['simplesNacional', 'lucroPresumido', 'lucroReal'];
    if (!regimesValidos.includes(params.regimeTributario)) {
      throw new Error(`CalculadorDREProjetado: regimeTributario deve ser: ${regimesValidos.join(', ')}`);
    }

    // Validações condicionais por regime
    if (params.regimeTributario === 'simplesNacional') {
      if (!params.anexoSimples) {
        throw new Error('CalculadorDREProjetado: anexoSimples obrigatório para Simples Nacional');
      }
      if (!params.receitaAcumulada12m) {
        throw new Error('CalculadorDREProjetado: receitaAcumulada12m obrigatório para Simples Nacional');
      }
    }

    if (params.regimeTributario === 'lucroPresumido') {
      if (!params.tipoAtividadePresumido) {
        throw new Error('CalculadorDREProjetado: tipoAtividadePresumido obrigatório para Lucro Presumido');
      }
    }

    if (params.regimeTributario === 'lucroReal') {
      if (params.creditosPisCofins === undefined || params.creditosPisCofins === null) {
        throw new Error('CalculadorDREProjetado: creditosPisCofins obrigatório para Lucro Real');
      }
      if (params.instituicaoFinanceira === undefined || params.instituicaoFinanceira === null) {
        throw new Error('CalculadorDREProjetado: instituicaoFinanceira obrigatório para Lucro Real');
      }
    }

    // Validar ICMS/ISS
    if (typeof params.aplicaICMS !== 'boolean') {
      throw new Error('CalculadorDREProjetado: aplicaICMS deve ser boolean');
    }

    if (!params.aplicaICMS && !params.aliquotaISS) {
      throw new Error('CalculadorDREProjetado: aliquotaISS obrigatório quando aplicaICMS = false');
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
}

// Exportar para uso global
if (typeof window !== 'undefined') {
  window.CalculadorDREProjetado = CalculadorDREProjetado;
}

// Exportar para Node.js (se necessário)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CalculadorDREProjetado;
}
