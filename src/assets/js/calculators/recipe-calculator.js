/* =====================================
   RECIPE-CALCULATOR.JS
   Calculadora de custo de produção baseada em receitas
   NO FALLBACKS - Pure calculation layer
   ===================================== */

class RecipeCalculator {
  constructor(produtoInsumoManager) {
    if (!produtoInsumoManager) {
      throw new Error('ProdutoInsumoManager não fornecido. RecipeCalculator requer ProdutoInsumoManager.');
    }

    this.manager = produtoInsumoManager;
  }

  // ==================== CÁLCULO DE CUSTO DE PRODUÇÃO ====================

  /**
   * Calcula custo de produção de um produto (por unidade)
   */
  async calculateProductionCost(produtoId) {
    if (!produtoId) {
      throw new Error('produtoId é obrigatório');
    }

    const produto = await this.manager.getProduto(produtoId);
    if (!produto) {
      throw new Error(`Produto ${produtoId} não encontrado`);
    }

    const receitas = await this.manager.listReceitasByProduto(produtoId);

    let custoTotal = 0;
    const breakdown = [];

    for (const receita of receitas) {
      const insumo = await this.manager.getInsumo(receita.insumoId);

      if (!insumo) {
        throw new Error(`Insumo ${receita.insumoId} referenciado na receita não encontrado`);
      }

      const custoInsumo = receita.quantidadePorUnidade * insumo.custoUnitario;
      custoTotal += custoInsumo;

      breakdown.push({
        insumoId: insumo.id,
        insumoNome: insumo.nome,
        insumoUnidade: insumo.unidade,
        custoUnitario: insumo.custoUnitario,
        quantidadePorUnidade: receita.quantidadePorUnidade,
        custoTotal: custoInsumo,
        percentualCusto: 0 // Será calculado depois
      });
    }

    // Calcular percentual de cada insumo no custo total
    if (custoTotal > 0) {
      breakdown.forEach(item => {
        item.percentualCusto = (item.custoTotal / custoTotal) * 100;
      });
    }

    const margemBruta = produto.precoVenda - custoTotal;
    const margemPercentual = produto.precoVenda > 0
      ? (margemBruta / produto.precoVenda) * 100
      : 0;

    return {
      produtoId: produto.id,
      produtoNome: produto.nome,
      precoVenda: produto.precoVenda,
      custoTotal: custoTotal,
      margemBruta: margemBruta,
      margemPercentual: margemPercentual,
      totalInsumos: breakdown.length,
      breakdown: breakdown
    };
  }

  /**
   * Calcula custo de produção para todos os produtos
   */
  async calculateAllProductsCost() {
    const produtos = await this.manager.listProdutos(true);

    const results = await Promise.all(
      produtos.map(async (produto) => {
        try {
          return await this.calculateProductionCost(produto.id);
        } catch (error) {
          console.error(`Erro ao calcular custo do produto ${produto.id}:`, error);
          return {
            produtoId: produto.id,
            produtoNome: produto.nome,
            error: error.message
          };
        }
      })
    );

    const successful = results.filter(r => !r.error);
    const failed = results.filter(r => r.error);

    return {
      total: produtos.length,
      successful: successful.length,
      failed: failed.length,
      results: successful,
      errors: failed
    };
  }

  /**
   * Calcula custo de produção considerando volume (mensal/anual)
   */
  async calculateProductionCostWithVolume(produtoId, quantidade) {
    if (!produtoId) {
      throw new Error('produtoId é obrigatório');
    }

    if (quantidade === undefined || quantidade === null) {
      throw new Error('quantidade é obrigatória');
    }

    const quantidadeNumerica = parseFloat(quantidade);
    if (isNaN(quantidadeNumerica) || quantidadeNumerica <= 0) {
      throw new Error(`quantidade inválida: ${quantidade}`);
    }

    const custoUnitario = await this.calculateProductionCost(produtoId);

    return {
      ...custoUnitario,
      quantidade: quantidadeNumerica,
      custoTotalVolume: custoUnitario.custoTotal * quantidadeNumerica,
      receitaTotal: custoUnitario.precoVenda * quantidadeNumerica,
      margemBrutaTotal: custoUnitario.margemBruta * quantidadeNumerica,
      breakdownVolume: custoUnitario.breakdown.map(item => ({
        ...item,
        quantidadeTotal: item.quantidadePorUnidade * quantidadeNumerica,
        custoTotalVolume: item.custoTotal * quantidadeNumerica
      }))
    };
  }

  /**
   * Compara custos entre produtos
   */
  async compareProductsCost(produtoIds) {
    if (!produtoIds || produtoIds.length === 0) {
      throw new Error('produtoIds é obrigatório (array de IDs)');
    }

    const comparisons = await Promise.all(
      produtoIds.map(async (produtoId) => {
        return await this.calculateProductionCost(produtoId);
      })
    );

    // Ordenar por margem percentual (maior para menor)
    comparisons.sort((a, b) => b.margemPercentual - a.margemPercentual);

    return {
      totalProdutos: comparisons.length,
      produtos: comparisons,
      maiorMargem: comparisons[0],
      menorMargem: comparisons[comparisons.length - 1],
      margemMedia: comparisons.reduce((sum, p) => sum + p.margemPercentual, 0) / comparisons.length
    };
  }

  /**
   * Identifica produtos com margem abaixo de um limiar
   */
  async findLowMarginProducts(margemMinima) {
    if (margemMinima === undefined || margemMinima === null) {
      throw new Error('margemMinima é obrigatória');
    }

    const margemNumerica = parseFloat(margemMinima);
    if (isNaN(margemNumerica)) {
      throw new Error(`margemMinima inválida: ${margemMinima}`);
    }

    const allCosts = await this.calculateAllProductsCost();

    const lowMargin = allCosts.results.filter(p => p.margemPercentual < margemNumerica);

    return {
      margemMinima: margemNumerica,
      totalProdutos: allCosts.total,
      produtosAbaixoLimiar: lowMargin.length,
      produtos: lowMargin.sort((a, b) => a.margemPercentual - b.margemPercentual)
    };
  }

  /**
   * Calcula insumo mais caro em um produto
   */
  async findMostExpensiveInput(produtoId) {
    if (!produtoId) {
      throw new Error('produtoId é obrigatório');
    }

    const cost = await this.calculateProductionCost(produtoId);

    if (cost.breakdown.length === 0) {
      throw new Error(`Produto ${produtoId} não possui insumos vinculados`);
    }

    const mostExpensive = cost.breakdown.reduce((max, item) =>
      item.custoTotal > max.custoTotal ? item : max
    );

    return {
      produtoId: cost.produtoId,
      produtoNome: cost.produtoNome,
      custoTotal: cost.custoTotal,
      insumoMaisCaro: mostExpensive,
      representacaoCusto: mostExpensive.percentualCusto
    };
  }

  /**
   * Simula alteração de preço de venda
   */
  async simulatePrecoVendaChange(produtoId, novoPreco) {
    if (!produtoId) {
      throw new Error('produtoId é obrigatório');
    }

    if (novoPreco === undefined || novoPreco === null) {
      throw new Error('novoPreco é obrigatório');
    }

    const precoNumerico = parseFloat(novoPreco);
    if (isNaN(precoNumerico) || precoNumerico < 0) {
      throw new Error(`novoPreco inválido: ${novoPreco}`);
    }

    const custoAtual = await this.calculateProductionCost(produtoId);

    const novaMargemBruta = precoNumerico - custoAtual.custoTotal;
    const novaMargemPercentual = precoNumerico > 0
      ? (novaMargemBruta / precoNumerico) * 100
      : 0;

    return {
      produto: {
        id: custoAtual.produtoId,
        nome: custoAtual.produtoNome
      },
      custoProducao: custoAtual.custoTotal,
      cenarioAtual: {
        precoVenda: custoAtual.precoVenda,
        margemBruta: custoAtual.margemBruta,
        margemPercentual: custoAtual.margemPercentual
      },
      cenarioNovo: {
        precoVenda: precoNumerico,
        margemBruta: novaMargemBruta,
        margemPercentual: novaMargemPercentual
      },
      variacao: {
        precoVenda: precoNumerico - custoAtual.precoVenda,
        margemBruta: novaMargemBruta - custoAtual.margemBruta,
        margemPercentual: novaMargemPercentual - custoAtual.margemPercentual
      }
    };
  }
}

// Exportar para uso global
if (typeof window !== 'undefined') {
  window.RecipeCalculator = RecipeCalculator;
  console.log('[RecipeCalculator] Classe disponível para uso');
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = RecipeCalculator;
}
