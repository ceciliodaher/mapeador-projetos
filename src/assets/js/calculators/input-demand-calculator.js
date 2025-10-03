/* =====================================
   INPUT-DEMAND-CALCULATOR.JS
   Calculadora de demanda agregada de insumos
   Respeita escalonamento global/individual
   NO FALLBACKS - Pure calculation layer
   ===================================== */

class InputDemandCalculator {
  constructor(produtoInsumoManager) {
    if (!produtoInsumoManager) {
      throw new Error('ProdutoInsumoManager não fornecido. InputDemandCalculator requer ProdutoInsumoManager.');
    }

    this.manager = produtoInsumoManager;
  }

  // ==================== HELPERS DE ESCALONAMENTO ====================

  /**
   * Retorna percentual de escalonamento de um produto em um ano
   * Respeita modo global/individual
   */
  async getProductEscalation(produtoId, ano) {
    if (!produtoId) {
      throw new Error('produtoId é obrigatório');
    }

    if (!ano) {
      throw new Error('ano é obrigatório (ano1, ano2, ano3, ano4)');
    }

    const anosValidos = ['ano1', 'ano2', 'ano3', 'ano4'];
    if (!anosValidos.includes(ano)) {
      throw new Error(`ano inválido: ${ano}. Use: ano1, ano2, ano3, ano4`);
    }

    // Buscar configuração de escalonamento
    const config = await this.manager.getEscalationConfig();

    if (config.escalationMode === 'global') {
      // Modo global: usar percentual global
      return config.globalEscalation[ano];
    } else {
      // Modo individual: usar percentual do produto
      const produto = await this.manager.getProduto(produtoId);
      if (!produto) {
        throw new Error(`Produto ${produtoId} não encontrado`);
      }

      if (!produto.escalamento || produto.escalamento[ano] === undefined) {
        throw new Error(`Produto ${produtoId} não possui escalonamento definido para ${ano}`);
      }

      return produto.escalamento[ano];
    }
  }

  // ==================== CÁLCULO DE DEMANDA ====================

  /**
   * Calcula demanda de um insumo em um ano específico
   */
  async calculateInputDemand(insumoId, ano) {
    if (!insumoId) {
      throw new Error('insumoId é obrigatório');
    }

    if (!ano) {
      throw new Error('ano é obrigatório (ano1, ano2, ano3, ano4)');
    }

    const insumo = await this.manager.getInsumo(insumoId);
    if (!insumo) {
      throw new Error(`Insumo ${insumoId} não encontrado`);
    }

    // Se insumo é geral E modo é manual, retornar quantidade manual
    if (insumo.isGeral && insumo.scalingMode === 'manual') {
      return {
        insumoId: insumo.id,
        insumoNome: insumo.nome,
        insumoUnidade: insumo.unidade,
        ano: ano,
        scalingMode: 'manual',
        demandaTotal: insumo.quantidadeFutura,
        custoTotal: insumo.quantidadeFutura * insumo.custoUnitario,
        produtos: [],
        observacao: 'Insumo geral com quantidade definida manualmente'
      };
    }

    // Calcular demanda baseada em receitas
    const receitas = await this.manager.listReceitasByInsumo(insumoId);

    if (receitas.length === 0) {
      return {
        insumoId: insumo.id,
        insumoNome: insumo.nome,
        insumoUnidade: insumo.unidade,
        ano: ano,
        scalingMode: 'calculated',
        demandaTotal: 0,
        custoTotal: 0,
        produtos: [],
        observacao: 'Insumo sem produtos vinculados'
      };
    }

    let demandaTotal = 0;
    const produtosDetalhados = [];

    for (const receita of receitas) {
      const produto = await this.manager.getProduto(receita.produtoId);

      if (!produto) {
        console.warn(`Produto ${receita.produtoId} não encontrado (receita órfã)`);
        continue;
      }

      if (!produto.ativo) {
        continue; // Ignorar produtos inativos
      }

      // Obter percentual de escalonamento
      const percentual = await this.getProductEscalation(produto.id, ano);

      // Calcular produção escalonada
      const producaoMensal = produto.producaoMensal;
      const producaoAnual = producaoMensal * 12;
      const producaoEscalonada = (producaoAnual * percentual) / 100;

      // Calcular demanda do insumo para este produto
      const demandaProduto = producaoEscalonada * receita.quantidadePorUnidade;
      demandaTotal += demandaProduto;

      produtosDetalhados.push({
        produtoId: produto.id,
        produtoNome: produto.nome,
        producaoMensal: producaoMensal,
        producaoAnual: producaoAnual,
        escalonamento: percentual,
        producaoEscalonada: producaoEscalonada,
        quantidadePorUnidade: receita.quantidadePorUnidade,
        demanda: demandaProduto
      });
    }

    return {
      insumoId: insumo.id,
      insumoNome: insumo.nome,
      insumoUnidade: insumo.unidade,
      custoUnitario: insumo.custoUnitario,
      ano: ano,
      scalingMode: 'calculated',
      demandaTotal: demandaTotal,
      custoTotal: demandaTotal * insumo.custoUnitario,
      totalProdutos: produtosDetalhados.length,
      produtos: produtosDetalhados
    };
  }

  /**
   * Calcula demanda de todos os insumos em um ano
   */
  async calculateAllInputsDemand(ano) {
    if (!ano) {
      throw new Error('ano é obrigatório (ano1, ano2, ano3, ano4)');
    }

    const insumos = await this.manager.listInsumos(true);

    const results = await Promise.all(
      insumos.map(async (insumo) => {
        try {
          return await this.calculateInputDemand(insumo.id, ano);
        } catch (error) {
          console.error(`Erro ao calcular demanda do insumo ${insumo.id}:`, error);
          return {
            insumoId: insumo.id,
            insumoNome: insumo.nome,
            error: error.message
          };
        }
      })
    );

    const successful = results.filter(r => !r.error);
    const failed = results.filter(r => r.error);

    const demandaTotalGeral = successful.reduce((sum, r) => sum + r.demandaTotal, 0);
    const custoTotalGeral = successful.reduce((sum, r) => sum + r.custoTotal, 0);

    return {
      ano: ano,
      totalInsumos: insumos.length,
      successful: successful.length,
      failed: failed.length,
      demandaTotalGeral: demandaTotalGeral,
      custoTotalGeral: custoTotalGeral,
      results: successful,
      errors: failed
    };
  }

  /**
   * Calcula demanda de um insumo em todos os anos
   */
  async calculateInputDemandAllYears(insumoId) {
    if (!insumoId) {
      throw new Error('insumoId é obrigatório');
    }

    const anos = ['ano1', 'ano2', 'ano3', 'ano4'];

    const demandaPorAno = await Promise.all(
      anos.map(async (ano) => {
        return await this.calculateInputDemand(insumoId, ano);
      })
    );

    const insumo = await this.manager.getInsumo(insumoId);

    return {
      insumo: {
        id: insumo.id,
        nome: insumo.nome,
        unidade: insumo.unidade,
        custoUnitario: insumo.custoUnitario
      },
      demandaPorAno: demandaPorAno,
      demandaTotal4Anos: demandaPorAno.reduce((sum, d) => sum + d.demandaTotal, 0),
      custoTotal4Anos: demandaPorAno.reduce((sum, d) => sum + d.custoTotal, 0)
    };
  }

  /**
   * Identifica insumos críticos (alta demanda)
   */
  async findCriticalInputs(ano, limiarDemanda) {
    if (!ano) {
      throw new Error('ano é obrigatório');
    }

    const allDemands = await this.calculateAllInputsDemand(ano);

    const critical = allDemands.results.filter(d => d.demandaTotal >= limiarDemanda);

    critical.sort((a, b) => b.demandaTotal - a.demandaTotal);

    return {
      ano: ano,
      limiarDemanda: limiarDemanda,
      totalInsumosCriticos: critical.length,
      insumosCriticos: critical
    };
  }

  /**
   * Compara demanda entre anos
   */
  async compareDemandBetweenYears(insumoId) {
    if (!insumoId) {
      throw new Error('insumoId é obrigatório');
    }

    const allYears = await this.calculateInputDemandAllYears(insumoId);

    const comparisons = [];
    for (let i = 0; i < allYears.demandaPorAno.length - 1; i++) {
      const anoAtual = allYears.demandaPorAno[i];
      const proximoAno = allYears.demandaPorAno[i + 1];

      const crescimento = proximoAno.demandaTotal - anoAtual.demandaTotal;
      const crescimentoPercentual = anoAtual.demandaTotal > 0
        ? (crescimento / anoAtual.demandaTotal) * 100
        : 0;

      comparisons.push({
        de: anoAtual.ano,
        para: proximoAno.ano,
        demandaInicial: anoAtual.demandaTotal,
        demandaFinal: proximoAno.demandaTotal,
        crescimento: crescimento,
        crescimentoPercentual: crescimentoPercentual
      });
    }

    return {
      insumo: allYears.insumo,
      comparisons: comparisons,
      crescimentoMedio: comparisons.reduce((sum, c) => sum + c.crescimentoPercentual, 0) / comparisons.length
    };
  }

  /**
   * Identifica gargalos de fornecimento
   */
  async identifySupplyBottlenecks(ano) {
    if (!ano) {
      throw new Error('ano é obrigatório');
    }

    const allDemands = await this.calculateAllInputsDemand(ano);

    // Identificar insumos com muitos produtos dependentes
    const bottlenecks = allDemands.results
      .filter(d => d.totalProdutos >= 3) // 3+ produtos dependem deste insumo
      .sort((a, b) => b.totalProdutos - a.totalProdutos);

    return {
      ano: ano,
      totalGargalos: bottlenecks.length,
      gargalos: bottlenecks.map(b => ({
        insumoId: b.insumoId,
        insumoNome: b.insumoNome,
        produtosDependentes: b.totalProdutos,
        demandaTotal: b.demandaTotal,
        custoTotal: b.custoTotal,
        riscoFornecimento: b.totalProdutos >= 5 ? 'ALTO' : 'MÉDIO'
      }))
    };
  }
}

// Exportar para uso global
if (typeof window !== 'undefined') {
  window.InputDemandCalculator = InputDemandCalculator;
  console.log('[InputDemandCalculator] Classe disponível para uso');
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = InputDemandCalculator;
}
