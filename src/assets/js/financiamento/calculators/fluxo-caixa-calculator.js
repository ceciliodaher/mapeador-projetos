/* =====================================
   FLUXO-CAIXA-CALCULATOR.JS
   Calculadora de Fluxo de Caixa MENSAL (60 meses)
   Portada EXATAMENTE de budget.py linhas 1404-1508

   NO HARDCODED DATA - NO FALLBACKS - KISS - DRY - SOLID

   Referência Python:
   - calcular_fluxo_caixa() (linha 1404)
   - calcular_receitas_mes() (linha 1449)
   - calcular_custos_mes() (linha 1459)
   - calcular_impostos_mes() (linha 1482)
   - calcular_financiamento_mes() (linha 1491)

   Diferenças vs calculador-fluxo-caixa.js:
   - Granularidade: MENSAL (60 meses) vs ANUAL (5 anos)
   - Base: Dados brutos vs DRE agregado
   - Propósito: Portagem Python vs Sistema próprio
   ===================================== */

class CalculadorFluxoCaixaMensal {
  constructor() {
    this.mesesProjecao = 60;  // 5 anos × 12 meses (padrão Python linha 1412)

    console.log('💰 CalculadorFluxoCaixaMensal inicializado (60 meses)');
  }

  // ==========================================
  // MÉTODO PRINCIPAL - COPIAR EXATO budget.py:1404
  // ==========================================

  /**
   * Calcula fluxo de caixa completo (60 meses)
   * Portado EXATAMENTE de budget.py linhas 1404-1448
   *
   * @param {Object} params - Parâmetros obrigatórios (todos)
   * @returns {Object} Fluxo de caixa mensal (60 meses)
   */
  async calcularFluxoCaixaMensal(params) {
    // Validação obrigatória ANTES
    this.validateParams(params);

    const {
      // Produtos e serviços
      produtosServicos,     // Array [{descricao, receitaMensal, crescimento}]

      // Custos
      custosFixos,          // Array [{descricao, valor}]
      custosVariaveis,      // Array [{descricao, valor}]

      // Mão de obra
      maoObra,              // {producao: [], administrativo: [], ensino: []}

      // Insumos
      insumos,              // Array [{descricao, custo_total}]

      // Tributos
      tributos,             // {federais: [], estaduais: [], municipais: []}

      // Financiamentos
      financiamentos,       // Array [{descricao, valor, taxa, prazo, carencia, sistema}]

      // Configurações
      mesesProjecao         // Padrão 60, mas permite override
    } = params;

    // Usar meses de projeção customizado se fornecido
    const totalMeses = mesesProjecao || this.mesesProjecao;

    // Implementação completa do cálculo de fluxo de caixa (Python linha 1410)
    const fluxoMensal = [];

    // Calcular para cada mês (Python linha 1412: for mes in range(self.meses_projecao))
    for (let mes = 0; mes < totalMeses; mes++) {

      // Calcular receitas (Python linha 1414)
      const receitas = this.calcularReceitasMes(params, mes);

      // Calcular custos (Python linha 1417)
      const custos = this.calcularCustosMes(params, mes);

      // Calcular impostos (Python linha 1420)
      const impostos = this.calcularImpostosMes(params, receitas);

      // Calcular parcelas de financiamento (Python linha 1423)
      const financiamento = this.calcularFinanciamentoMes(params, mes);

      // Saldo do mês (Python linha 1426)
      const saldo = receitas - custos - impostos - financiamento;

      // Saldo acumulado (Python linha 1435)
      // Python: sum([f['saldo'] for f in fluxo_mensal]) + saldo
      const saldoAcumulado = fluxoMensal.reduce((acc, f) => acc + f.saldo, 0) + saldo;

      // Armazenar resultado do mês (Python linha 1428-1436)
      fluxoMensal.push({
        mes: mes + 1,
        receitas,
        custos,
        impostos,
        financiamento,
        saldo,
        saldoAcumulado
      });
    }

    // Retornar estrutura (Python linha 1438: self.data['fluxo_caixa']['mensal'] = fluxo_mensal)
    return {
      parametros: params,
      mesesProjecao: totalMeses,
      fluxoMensal,
      fluxoAnual: this.agregarPorAno(fluxoMensal),  // Bônus: agregação anual
      metadata: {
        calculadoEm: new Date().toISOString(),
        versao: '1.0.0',
        referenciaPython: 'budget.py:1404-1448'
      }
    };
  }

  // ==========================================
  // RECEITAS - COPIAR EXATO budget.py:1449
  // ==========================================

  /**
   * Calcula receitas do mês
   * Portado EXATAMENTE de budget.py linhas 1449-1457
   *
   * CRÍTICO: Crescimento exponencial (linha 1454)
   * fator_cresc = (1 + produto['crescimento'] / 100) ** (mes / 12)
   *
   * @param {Object} params - Parâmetros completos
   * @param {number} mes - Mês atual (0-indexed)
   * @returns {number} Total de receitas do mês
   */
  calcularReceitasMes(params, mes) {
    let total = 0;

    // Python linha 1452: for produto in self.data['receitas']['produtos_servicos']
    for (const produto of params.produtosServicos) {

      // Aplicar crescimento EXPONENCIAL (Python linha 1454)
      // CRÍTICO: Manter fórmula EXATA
      const fatorCrescimento = Math.pow(1 + (produto.crescimento / 100), mes / 12);

      // Receita do produto no mês (Python linha 1455)
      const receitaProduto = produto.receitaMensal * fatorCrescimento;

      // Acumular (Python linha 1456)
      total += receitaProduto;
    }

    return total;  // Python linha 1457
  }

  // ==========================================
  // CUSTOS - COPIAR EXATO budget.py:1459
  // ==========================================

  /**
   * Calcula custos do mês
   * Portado EXATAMENTE de budget.py linhas 1459-1480
   *
   * 4 categorias (Python):
   * 1. Custos fixos (linha 1464)
   * 2. Custos variáveis (linha 1468)
   * 3. Mão de obra (linha 1472)
   * 4. Insumos (linha 1477)
   *
   * @param {Object} params - Parâmetros completos
   * @param {number} mes - Mês atual (0-indexed)
   * @returns {number} Total de custos do mês
   */
  calcularCustosMes(params, mes) {
    let total = 0;

    // 1. Custos fixos (Python linha 1464-1465)
    for (const custo of params.custosFixos) {
      total += custo.valor;
    }

    // 2. Custos variáveis (Python linha 1468-1469)
    for (const custo of params.custosVariaveis) {
      total += custo.valor;
    }

    // 3. Mão de obra (Python linha 1472-1474)
    // for tipo in ['producao', 'administrativo', 'ensino']:
    //     for func in self.data['mao_obra'][tipo]:
    //         total += func['custo_total']
    for (const tipo of ['producao', 'administrativo', 'ensino']) {
      for (const func of params.maoObra[tipo]) {
        total += func.custo_total;
      }
    }

    // 4. Insumos (Python linha 1477-1478)
    for (const insumo of params.insumos) {
      total += insumo.custo_total;
    }

    return total;  // Python linha 1480
  }

  // ==========================================
  // IMPOSTOS - COPIAR EXATO budget.py:1482
  // ==========================================

  /**
   * Calcula impostos sobre a receita
   * Portado EXATAMENTE de budget.py linhas 1482-1489
   *
   * CRÍTICO: Loop por categorias e tributos (linha 1485-1488)
   * Filtro: base == 'Receita Bruta'
   *
   * @param {Object} params - Parâmetros completos
   * @param {number} receita - Receita do mês
   * @returns {number} Total de impostos do mês
   */
  calcularImpostosMes(params, receita) {
    let total = 0;

    // Python linha 1485: for categoria in ['federais', 'estaduais', 'municipais']
    for (const categoria of ['federais', 'estaduais', 'municipais']) {

      // Python linha 1486: for tributo in self.data['tributos'][categoria]
      for (const tributo of params.tributos[categoria]) {

        // Python linha 1487: if tributo['base'] == 'Receita Bruta'
        if (tributo.base === 'Receita Bruta') {

          // Python linha 1488: total += receita * (tributo['aliquota'] / 100)
          total += receita * (tributo.aliquota / 100);
        }
      }
    }

    return total;  // Python linha 1489
  }

  // ==========================================
  // FINANCIAMENTOS - COPIAR EXATO budget.py:1491
  // ==========================================

  /**
   * Calcula parcela de financiamento do mês
   * Portado EXATAMENTE de budget.py linhas 1491-1508
   *
   * Sistemas suportados:
   * 1. SAC - Sistema de Amortização Constante (linha 1497)
   * 2. PRICE - Parcelas Fixas (linha 1502)
   *
   * CRÍTICO: Carência (linha 1495)
   *
   * @param {Object} params - Parâmetros completos
   * @param {number} mes - Mês atual (0-indexed)
   * @returns {number} Total de parcelas do mês
   */
  calcularFinanciamentoMes(params, mes) {
    let total = 0;

    // Python linha 1494: for finan in self.data['financiamentos']
    for (const finan of params.financiamentos) {

      // Python linha 1495: if mes >= finan['carencia']
      if (mes >= finan.carencia) {

        let parcela = 0;

        // Sistema SAC (Python linha 1497-1501)
        if (finan.sistema === 'SAC') {
          // Amortização constante (Python linha 1498)
          const amort = finan.valor / finan.prazo;

          // Saldo devedor (Python linha 1499)
          const saldoDevedor = finan.valor - (amort * (mes - finan.carencia));

          // Juros do mês (Python linha 1500)
          const juros = saldoDevedor * (finan.taxa / 100 / 12);

          // Parcela = amortização + juros (Python linha 1501)
          parcela = amort + juros;
        }
        // Sistema PRICE (Python linha 1502-1505)
        else {  // PRICE
          // Taxa mensal (Python linha 1503)
          const taxaMensal = finan.taxa / 100 / 12;

          // Prazo (Python linha 1504)
          const n = finan.prazo;

          // Parcela PRICE (Python linha 1505)
          // parcela = finan['valor'] * (taxa_mensal * (1 + taxa_mensal) ** n) /
          //           ((1 + taxa_mensal) ** n - 1)
          parcela = finan.valor *
            (taxaMensal * Math.pow(1 + taxaMensal, n)) /
            (Math.pow(1 + taxaMensal, n) - 1);
        }

        total += parcela;  // Python linha 1507
      }
    }

    return total;  // Python linha 1508
  }

  // ==========================================
  // AGREGAÇÃO ANUAL (BÔNUS - NÃO TEM NO PYTHON)
  // ==========================================

  /**
   * Agrega fluxo mensal por ano
   * BÔNUS: Python não tem, mas útil para compatibilidade
   *
   * @param {Array} fluxoMensal - Fluxo de caixa mensal (60 meses)
   * @returns {Array} Fluxo de caixa anual (5 anos)
   */
  agregarPorAno(fluxoMensal) {
    const fluxoAnual = [];

    for (let ano = 0; ano < 5; ano++) {
      const inicio = ano * 12;
      const fim = inicio + 12;
      const mesesAno = fluxoMensal.slice(inicio, fim);

      fluxoAnual.push({
        ano: ano + 1,
        receitas: mesesAno.reduce((sum, m) => sum + m.receitas, 0),
        custos: mesesAno.reduce((sum, m) => sum + m.custos, 0),
        impostos: mesesAno.reduce((sum, m) => sum + m.impostos, 0),
        financiamento: mesesAno.reduce((sum, m) => sum + m.financiamento, 0),
        saldo: mesesAno.reduce((sum, m) => sum + m.saldo, 0),
        saldoAcumulado: mesesAno[11].saldoAcumulado
      });
    }

    return fluxoAnual;
  }

  // ==========================================
  // VALIDAÇÕES - NO FALLBACKS
  // ==========================================

  /**
   * Valida parâmetros de entrada
   * NO FALLBACKS: lança exceção se algo estiver faltando ou inválido
   *
   * @param {Object} params - Parâmetros a validar
   */
  validateParams(params) {
    // 1. Produtos/Serviços obrigatórios
    if (!params.produtosServicos || !Array.isArray(params.produtosServicos)) {
      throw new Error('CalculadorFluxoCaixaMensal: produtosServicos deve ser array não-vazio');
    }

    if (params.produtosServicos.length === 0) {
      throw new Error('CalculadorFluxoCaixaMensal: Deve haver pelo menos 1 produto/serviço cadastrado');
    }

    // Validar cada produto
    params.produtosServicos.forEach((produto, idx) => {
      if (!produto.descricao) {
        throw new Error(`CalculadorFluxoCaixaMensal: Produto ${idx}: descricao obrigatória`);
      }

      if (typeof produto.receitaMensal !== 'number' || produto.receitaMensal < 0) {
        throw new Error(`CalculadorFluxoCaixaMensal: Produto ${idx}: receitaMensal deve ser número não-negativo`);
      }

      if (typeof produto.crescimento !== 'number') {
        throw new Error(`CalculadorFluxoCaixaMensal: Produto ${idx}: crescimento deve ser número (% ao ano)`);
      }
    });

    // 2. Validar custos (podem ser vazios)
    if (!Array.isArray(params.custosFixos)) {
      throw new Error('CalculadorFluxoCaixaMensal: custosFixos deve ser array (pode ser vazio)');
    }

    if (!Array.isArray(params.custosVariaveis)) {
      throw new Error('CalculadorFluxoCaixaMensal: custosVariaveis deve ser array (pode ser vazio)');
    }

    // 3. Validar mão de obra
    if (!params.maoObra || typeof params.maoObra !== 'object') {
      throw new Error('CalculadorFluxoCaixaMensal: maoObra deve ser objeto {producao, administrativo, ensino}');
    }

    for (const tipo of ['producao', 'administrativo', 'ensino']) {
      if (!Array.isArray(params.maoObra[tipo])) {
        throw new Error(`CalculadorFluxoCaixaMensal: maoObra.${tipo} deve ser array`);
      }
    }

    // 4. Validar insumos
    if (!Array.isArray(params.insumos)) {
      throw new Error('CalculadorFluxoCaixaMensal: insumos deve ser array (pode ser vazio)');
    }

    // 5. Validar tributos
    if (!params.tributos || typeof params.tributos !== 'object') {
      throw new Error('CalculadorFluxoCaixaMensal: tributos deve ser objeto {federais, estaduais, municipais}');
    }

    for (const categoria of ['federais', 'estaduais', 'municipais']) {
      if (!Array.isArray(params.tributos[categoria])) {
        throw new Error(`CalculadorFluxoCaixaMensal: tributos.${categoria} deve ser array`);
      }
    }

    // 6. Validar financiamentos
    if (!Array.isArray(params.financiamentos)) {
      throw new Error('CalculadorFluxoCaixaMensal: financiamentos deve ser array (pode ser vazio)');
    }

    params.financiamentos.forEach((fin, idx) => {
      if (!fin.sistema || !['SAC', 'PRICE'].includes(fin.sistema)) {
        throw new Error(`CalculadorFluxoCaixaMensal: financiamentos[${idx}]: sistema deve ser 'SAC' ou 'PRICE'`);
      }

      if (typeof fin.valor !== 'number' || fin.valor <= 0) {
        throw new Error(`CalculadorFluxoCaixaMensal: financiamentos[${idx}]: valor deve ser número positivo`);
      }

      if (typeof fin.taxa !== 'number' || fin.taxa < 0) {
        throw new Error(`CalculadorFluxoCaixaMensal: financiamentos[${idx}]: taxa deve ser número não-negativo (% a.a.)`);
      }

      if (!Number.isInteger(fin.prazo) || fin.prazo <= 0) {
        throw new Error(`CalculadorFluxoCaixaMensal: financiamentos[${idx}]: prazo deve ser inteiro positivo (meses)`);
      }

      if (!Number.isInteger(fin.carencia) || fin.carencia < 0) {
        throw new Error(`CalculadorFluxoCaixaMensal: financiamentos[${idx}]: carencia deve ser inteiro não-negativo (meses)`);
      }
    });

    // 7. Validar meses de projeção (se fornecido)
    if (params.mesesProjecao !== undefined) {
      if (!Number.isInteger(params.mesesProjecao) || params.mesesProjecao <= 0) {
        throw new Error('CalculadorFluxoCaixaMensal: mesesProjecao deve ser inteiro positivo (padrão: 60)');
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
  window.CalculadorFluxoCaixaMensal = CalculadorFluxoCaixaMensal;
}

// Exportar para Node.js (se necessário)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CalculadorFluxoCaixaMensal;
}
