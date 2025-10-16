/* =====================================
   CALCULADOR-FLUXO-CAIXA.JS
   Calculadora de Fluxo de Caixa Projetado
   Projeção de 5 anos com regime de caixa (PMR/PMP)
   NO HARDCODED DATA - NO FALLBACKS - KISS - DRY - SOLID

   Estrutura Fluxo de Caixa:
   1. (+) Recebimentos de Clientes (Receita - PMR)
   2. (-) Pagamentos a Fornecedores (CPV - PMP)
   3. (-) Pagamentos Despesas Operacionais
   4. (-) Pagamentos de Tributos
   5. (=) Fluxo de Caixa Operacional
   6. (-) Investimentos CAPEX
   7. (+/-) Financiamentos (captação e amortização)
   8. (=) Fluxo de Caixa Livre
   9. (=) Saldo de Caixa Acumulado

   Dependências:
   - CalculadorDREProjetado (para base de cálculo)
   ===================================== */

class CalculadorFluxoCaixa {
  /**
   * @param {CalculadorDREProjetado} dreCalculator - Instância do calculador DRE
   */
  constructor(dreCalculator) {
    if (!dreCalculator) {
      throw new Error('CalculadorFluxoCaixa: dreCalculator é obrigatório');
    }

    this.dreCalc = dreCalculator;

    console.log('💰 CalculadorFluxoCaixa inicializado');
  }

  // ==========================================
  // CÁLCULO FLUXO DE CAIXA PROJETADO (5 ANOS)
  // ==========================================

  /**
   * Calcula Fluxo de Caixa projetado para 5 anos
   * Single Responsibility: apenas cálculo de fluxo de caixa
   *
   * @param {Object} params - Parâmetros de projeção (TODOS obrigatórios)
   * @returns {Object} Fluxo de Caixa projetado para 5 anos
   */
  async calcularFluxoCaixaProjetado(params) {
    // Validação obrigatória ANTES de desestruturar
    this.validateParams(params);

    const {
      // DRE base (obrigatório)
      dreProjetado,

      // Prazos médios (dias)
      pmr,  // Prazo Médio Recebimento
      pmp,  // Prazo Médio Pagamento

      // Investimentos CAPEX por ano
      capexPorAno,  // Array [ano1, ano2, ano3, ano4, ano5]

      // Financiamentos
      financiamentos,  // Array de objetos { ano, valor, taxaJuros, prazo }

      // Saldo inicial de caixa
      saldoCaixaInicial,

      // Capital de giro inicial
      capitalGiroInicial

    } = params;

    const anosProjecao = 5;
    const fluxoCaixa = [];

    let saldoCaixaAcumulado = saldoCaixaInicial;

    // Processar financiamentos por ano
    const finPorAno = this.processarFinanciamentosPorAno(financiamentos, anosProjecao);

    // Calcular fluxo de caixa para cada ano
    for (let ano = 0; ano < anosProjecao; ano++) {
      const dreAno = dreProjetado.dre[ano];

      if (!dreAno) {
        throw new Error(`CalculadorFluxoCaixa: DRE não encontrado para ano ${ano + 1}`);
      }

      // ==========================================
      // 1. RECEBIMENTOS DE CLIENTES (com PMR)
      // ==========================================
      // Ajuste para regime de caixa: receita com defasagem de PMR
      const receitaBruta = dreAno.receita.receitaBruta;

      // Simplificação: recebimentos no ano considerando PMR
      // Se PMR = 30 dias, recebe 11/12 no ano e 1/12 no ano seguinte
      const fatorRecebimentoAno = Math.max(0, (365 - pmr) / 365);
      const recebimentosClientes = receitaBruta * fatorRecebimentoAno;

      // ==========================================
      // 2. PAGAMENTOS A FORNECEDORES (com PMP)
      // ==========================================
      const cpv = dreAno.custos.cpv;

      // Ajuste para regime de caixa: pagamentos com defasagem de PMP
      const fatorPagamentoAno = Math.max(0, (365 - pmp) / 365);
      const pagamentosFornecedores = cpv * fatorPagamentoAno;

      // ==========================================
      // 3. PAGAMENTOS DESPESAS OPERACIONAIS
      // ==========================================
      // Assumir pagamento imediato
      const pagamentosDespesas = dreAno.despesas.operacionais;

      // ==========================================
      // 4. PAGAMENTOS DE TRIBUTOS
      // ==========================================
      // Tributos sobre vendas + IR/CSLL
      const tributosSobreVendas = dreAno.receita.deducoes;
      const irCsll = dreAno.irCsll.valor;
      const pagamentosTributos = tributosSobreVendas + irCsll;

      // ==========================================
      // 5. FLUXO DE CAIXA OPERACIONAL
      // ==========================================
      const fluxoCaixaOperacional =
        recebimentosClientes -
        pagamentosFornecedores -
        pagamentosDespesas -
        pagamentosTributos;

      // ==========================================
      // 6. INVESTIMENTOS CAPEX
      // ==========================================
      const capex = capexPorAno[ano];

      // ==========================================
      // 7. FINANCIAMENTOS
      // ==========================================
      const finAno = finPorAno[ano];
      const captacaoFinanciamentos = finAno.captacao;
      const amortizacaoFinanciamentos = finAno.amortizacao;
      const jurosFinanciamentos = finAno.juros;

      // ==========================================
      // 8. FLUXO DE CAIXA LIVRE
      // ==========================================
      const fluxoCaixaInvestimento = -capex;

      const fluxoCaixaFinanciamento =
        captacaoFinanciamentos -
        amortizacaoFinanciamentos -
        jurosFinanciamentos;

      const fluxoCaixaLivre =
        fluxoCaixaOperacional +
        fluxoCaixaInvestimento +
        fluxoCaixaFinanciamento;

      // ==========================================
      // 9. SALDO DE CAIXA ACUMULADO
      // ==========================================
      saldoCaixaAcumulado += fluxoCaixaLivre;

      // Variação NCG (Necessidade Capital Giro)
      // NCG = Contas a Receber + Estoques - Contas a Pagar
      const contasReceber = receitaBruta * (pmr / 365);
      const contasPagar = cpv * (pmp / 365);
      const ncg = contasReceber - contasPagar;

      const variacaoNCG = ano === 0
        ? ncg - capitalGiroInicial
        : ncg - fluxoCaixa[ano - 1].capitalGiro.ncg;

      // ==========================================
      // CONSTRUIR RESULTADO DO ANO
      // ==========================================
      fluxoCaixa.push({
        ano: dreAno.ano,
        periodoProjecao: ano + 1,
        operacional: {
          recebimentosClientes,
          pagamentosFornecedores,
          pagamentosDespesas,
          pagamentosTributos,
          total: fluxoCaixaOperacional,
          margem: (fluxoCaixaOperacional / receitaBruta) * 100
        },
        investimento: {
          capex,
          total: fluxoCaixaInvestimento
        },
        financiamento: {
          captacao: captacaoFinanciamentos,
          amortizacao: amortizacaoFinanciamentos,
          juros: jurosFinanciamentos,
          total: fluxoCaixaFinanciamento
        },
        fluxoCaixaLivre,
        saldoCaixaAcumulado,
        capitalGiro: {
          contasReceber,
          contasPagar,
          ncg,
          variacaoNCG
        },
        prazos: {
          pmr,
          pmp,
          pmz: 0  // Prazo Médio Estoque (assumir zero por simplicidade)
        }
      });
    }

    // Calcular indicadores agregados
    const indicadores = this.calcularIndicadoresAgregados(fluxoCaixa);

    return {
      parametros: params,
      anosProjecao,
      fluxoCaixa,
      indicadores,
      metadata: {
        calculadoEm: new Date().toISOString(),
        versao: '1.0.0'
      }
    };
  }

  // ==========================================
  // PROCESSAMENTO DE FINANCIAMENTOS
  // ==========================================

  /**
   * Processa financiamentos e distribui por ano
   * Open/Closed Principle: extensível para novos tipos de financiamento
   *
   * @param {Array} financiamentos - Lista de financiamentos
   * @param {number} anosProjecao - Número de anos
   * @returns {Array} Financiamentos por ano
   */
  processarFinanciamentosPorAno(financiamentos, anosProjecao) {
    // Inicializar array
    const finPorAno = Array(anosProjecao).fill(null).map(() => ({
      captacao: 0,
      amortizacao: 0,
      juros: 0
    }));

    // Processar cada financiamento
    financiamentos.forEach(fin => {
      const { anoInicio, valor, taxaJuros, prazoMeses } = fin;

      // Ano de início (0-indexed)
      const anoIdx = anoInicio - 1;

      if (anoIdx < 0 || anoIdx >= anosProjecao) {
        throw new Error(`CalculadorFluxoCaixa: anoInicio ${anoInicio} fora do intervalo de projeção`);
      }

      // Captação no ano de início
      finPorAno[anoIdx].captacao += valor;

      // Calcular amortização e juros (Sistema Price simplificado)
      const taxaMensal = taxaJuros / 12 / 100;
      const parcelaMensal = (valor * taxaMensal * Math.pow(1 + taxaMensal, prazoMeses)) /
                            (Math.pow(1 + taxaMensal, prazoMeses) - 1);

      // Distribuir parcelas pelos anos
      for (let mes = 1; mes <= prazoMeses; mes++) {
        const anoParcelaIdx = anoIdx + Math.floor((mes - 1) / 12);

        if (anoParcelaIdx >= anosProjecao) {
          break; // Parcelas fora do horizonte de projeção
        }

        // Saldo devedor no início do mês
        const saldoDevedor = this.calcularSaldoDevedor(valor, taxaMensal, mes - 1, parcelaMensal);

        // Juros do mês
        const jurosMes = saldoDevedor * taxaMensal;

        // Amortização do mês
        const amortizacaoMes = parcelaMensal - jurosMes;

        finPorAno[anoParcelaIdx].amortizacao += amortizacaoMes;
        finPorAno[anoParcelaIdx].juros += jurosMes;
      }
    });

    return finPorAno;
  }

  /**
   * Calcula saldo devedor em um determinado mês
   * Sistema Price (parcelas fixas)
   */
  calcularSaldoDevedor(valorInicial, taxaMensal, mesesPassados, parcelaMensal) {
    if (mesesPassados === 0) {
      return valorInicial;
    }

    let saldo = valorInicial;

    for (let i = 0; i < mesesPassados; i++) {
      const juros = saldo * taxaMensal;
      const amortizacao = parcelaMensal - juros;
      saldo -= amortizacao;
    }

    return Math.max(0, saldo);
  }

  // ==========================================
  // INDICADORES AGREGADOS
  // ==========================================

  /**
   * Calcula indicadores agregados do fluxo de caixa
   * Dependency Inversion: depende de abstrações
   */
  calcularIndicadoresAgregados(fluxoCaixa) {
    const totalAnos = fluxoCaixa.length;

    // Fluxo de caixa operacional total
    const fcOperacionalTotal = fluxoCaixa.reduce((sum, ano) => sum + ano.operacional.total, 0);

    // Fluxo de caixa livre total
    const fcLivreTotal = fluxoCaixa.reduce((sum, ano) => sum + ano.fluxoCaixaLivre, 0);

    // CAPEX total
    const capexTotal = fluxoCaixa.reduce((sum, ano) => sum + ano.investimento.capex, 0);

    // Financiamentos captados totais
    const financiamentosTotal = fluxoCaixa.reduce((sum, ano) => sum + ano.financiamento.captacao, 0);

    // Juros pagos totais
    const jurosPagosTotal = fluxoCaixa.reduce((sum, ano) => sum + ano.financiamento.juros, 0);

    // NCG média
    const ncgMedia = fluxoCaixa.reduce((sum, ano) => sum + ano.capitalGiro.ncg, 0) / totalAnos;

    // Saldo de caixa final
    const saldoCaixaFinal = fluxoCaixa[totalAnos - 1].saldoCaixaAcumulado;

    // Margem operacional média
    const margemOperacionalMedia = fluxoCaixa.reduce((sum, ano) => sum + ano.operacional.margem, 0) / totalAnos;

    return {
      fcOperacionalTotal,
      fcLivreTotal,
      capexTotal,
      financiamentosTotal,
      jurosPagosTotal,
      ncgMedia,
      saldoCaixaFinal,
      margemOperacionalMedia,
      fluxoCaixaPositivo: fcLivreTotal > 0,
      geracaoCaixa: {
        ano1: fluxoCaixa[0].fluxoCaixaLivre,
        ano5: fluxoCaixa[totalAnos - 1].fluxoCaixaLivre,
        acumulado: fcLivreTotal
      }
    };
  }

  // ==========================================
  // EXPORTAÇÃO
  // ==========================================

  /**
   * Exporta Fluxo de Caixa para formato tabular (para Excel)
   * Interface Segregation: apenas estrutura de dados
   */
  exportarParaTabela(fluxoCaixaProjetado) {
    const header = ['Descrição', ...fluxoCaixaProjetado.fluxoCaixa.map(ano => `Ano ${ano.periodoProjecao} (${ano.ano})`)];

    const rows = [
      ['OPERACIONAL', ...Array(fluxoCaixaProjetado.fluxoCaixa.length).fill('')],
      ['(+) Recebimentos de Clientes', ...fluxoCaixaProjetado.fluxoCaixa.map(a => a.operacional.recebimentosClientes)],
      ['(-) Pagamentos a Fornecedores', ...fluxoCaixaProjetado.fluxoCaixa.map(a => -a.operacional.pagamentosFornecedores)],
      ['(-) Despesas Operacionais', ...fluxoCaixaProjetado.fluxoCaixa.map(a => -a.operacional.pagamentosDespesas)],
      ['(-) Tributos', ...fluxoCaixaProjetado.fluxoCaixa.map(a => -a.operacional.pagamentosTributos)],
      ['(=) Fluxo de Caixa Operacional', ...fluxoCaixaProjetado.fluxoCaixa.map(a => a.operacional.total)],
      ['', ...Array(fluxoCaixaProjetado.fluxoCaixa.length).fill('')],
      ['INVESTIMENTO', ...Array(fluxoCaixaProjetado.fluxoCaixa.length).fill('')],
      ['(-) CAPEX', ...fluxoCaixaProjetado.fluxoCaixa.map(a => -a.investimento.capex)],
      ['(=) Fluxo de Caixa de Investimento', ...fluxoCaixaProjetado.fluxoCaixa.map(a => a.investimento.total)],
      ['', ...Array(fluxoCaixaProjetado.fluxoCaixa.length).fill('')],
      ['FINANCIAMENTO', ...Array(fluxoCaixaProjetado.fluxoCaixa.length).fill('')],
      ['(+) Captação de Financiamentos', ...fluxoCaixaProjetado.fluxoCaixa.map(a => a.financiamento.captacao)],
      ['(-) Amortização', ...fluxoCaixaProjetado.fluxoCaixa.map(a => -a.financiamento.amortizacao)],
      ['(-) Juros', ...fluxoCaixaProjetado.fluxoCaixa.map(a => -a.financiamento.juros)],
      ['(=) Fluxo de Caixa de Financiamento', ...fluxoCaixaProjetado.fluxoCaixa.map(a => a.financiamento.total)],
      ['', ...Array(fluxoCaixaProjetado.fluxoCaixa.length).fill('')],
      ['(=) FLUXO DE CAIXA LIVRE', ...fluxoCaixaProjetado.fluxoCaixa.map(a => a.fluxoCaixaLivre)],
      ['(=) SALDO DE CAIXA ACUMULADO', ...fluxoCaixaProjetado.fluxoCaixa.map(a => a.saldoCaixaAcumulado)],
      ['', ...Array(fluxoCaixaProjetado.fluxoCaixa.length).fill('')],
      ['CAPITAL DE GIRO', ...Array(fluxoCaixaProjetado.fluxoCaixa.length).fill('')],
      ['Contas a Receber', ...fluxoCaixaProjetado.fluxoCaixa.map(a => a.capitalGiro.contasReceber)],
      ['Contas a Pagar', ...fluxoCaixaProjetado.fluxoCaixa.map(a => a.capitalGiro.contasPagar)],
      ['NCG', ...fluxoCaixaProjetado.fluxoCaixa.map(a => a.capitalGiro.ncg)],
      ['Variação NCG', ...fluxoCaixaProjetado.fluxoCaixa.map(a => a.capitalGiro.variacaoNCG)]
    ];

    return { header, rows };
  }

  /**
   * Exporta para JSON
   */
  exportarJSON(fluxoCaixaProjetado) {
    return JSON.stringify(fluxoCaixaProjetado, null, 2);
  }

  // ==========================================
  // VALIDAÇÕES
  // ==========================================

  /**
   * Valida parâmetros de entrada - TODOS obrigatórios
   * NO FALLBACKS - lança exceção se algo estiver faltando
   */
  validateParams(params) {
    // Parâmetros obrigatórios
    const required = [
      'dreProjetado',
      'pmr',
      'pmp',
      'capexPorAno',
      'financiamentos',
      'saldoCaixaInicial',
      'capitalGiroInicial'
    ];

    for (const field of required) {
      if (params[field] === undefined || params[field] === null) {
        throw new Error(`CalculadorFluxoCaixa: Campo obrigatório "${field}" ausente`);
      }
    }

    // Validar DRE projetado
    if (!params.dreProjetado.dre || !Array.isArray(params.dreProjetado.dre)) {
      throw new Error('CalculadorFluxoCaixa: dreProjetado.dre deve ser um array');
    }

    if (params.dreProjetado.dre.length !== 5) {
      throw new Error('CalculadorFluxoCaixa: dreProjetado.dre deve ter 5 anos');
    }

    // Validar prazos
    if (typeof params.pmr !== 'number' || params.pmr < 0) {
      throw new Error('CalculadorFluxoCaixa: pmr deve ser número não-negativo (dias)');
    }

    if (typeof params.pmp !== 'number' || params.pmp < 0) {
      throw new Error('CalculadorFluxoCaixa: pmp deve ser número não-negativo (dias)');
    }

    // Validar CAPEX
    if (!Array.isArray(params.capexPorAno) || params.capexPorAno.length !== 5) {
      throw new Error('CalculadorFluxoCaixa: capexPorAno deve ser array de 5 valores');
    }

    for (let i = 0; i < params.capexPorAno.length; i++) {
      if (typeof params.capexPorAno[i] !== 'number' || params.capexPorAno[i] < 0) {
        throw new Error(`CalculadorFluxoCaixa: capexPorAno[${i}] deve ser número não-negativo`);
      }
    }

    // Validar financiamentos
    if (!Array.isArray(params.financiamentos)) {
      throw new Error('CalculadorFluxoCaixa: financiamentos deve ser array (pode ser vazio)');
    }

    params.financiamentos.forEach((fin, idx) => {
      if (!fin.anoInicio || !fin.valor || !fin.taxaJuros || !fin.prazoMeses) {
        throw new Error(`CalculadorFluxoCaixa: financiamentos[${idx}] deve ter anoInicio, valor, taxaJuros, prazoMeses`);
      }

      if (typeof fin.valor !== 'number' || fin.valor <= 0) {
        throw new Error(`CalculadorFluxoCaixa: financiamentos[${idx}].valor deve ser número positivo`);
      }

      if (typeof fin.taxaJuros !== 'number' || fin.taxaJuros < 0) {
        throw new Error(`CalculadorFluxoCaixa: financiamentos[${idx}].taxaJuros deve ser número não-negativo (%)`);
      }

      if (typeof fin.prazoMeses !== 'number' || fin.prazoMeses <= 0) {
        throw new Error(`CalculadorFluxoCaixa: financiamentos[${idx}].prazoMeses deve ser número positivo`);
      }
    });

    // Validar saldos
    if (typeof params.saldoCaixaInicial !== 'number') {
      throw new Error('CalculadorFluxoCaixa: saldoCaixaInicial deve ser número');
    }

    if (typeof params.capitalGiroInicial !== 'number' || params.capitalGiroInicial < 0) {
      throw new Error('CalculadorFluxoCaixa: capitalGiroInicial deve ser número não-negativo');
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
  window.CalculadorFluxoCaixa = CalculadorFluxoCaixa;
}

// Exportar para Node.js (se necessário)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CalculadorFluxoCaixa;
}
