/* =====================================
   RECIPE-SERVICE.JS
   Serviço para gerenciar receitas (vínculos produto-insumo)
   NO FALLBACKS - Business Logic Layer
   ===================================== */

class RecipeService {
  constructor(produtoInsumoManager) {
    if (!produtoInsumoManager) {
      throw new Error('ProdutoInsumoManager não fornecido. RecipeService requer ProdutoInsumoManager.');
    }

    this.manager = produtoInsumoManager;
  }

  // ==================== OPERAÇÕES DE RECEITA ====================

  /**
   * Adiciona insumo a um produto (cria receita)
   */
  async addInsumoToProduto(produtoId, insumoId, quantidadePorUnidade, observacao) {
    if (!produtoId) {
      throw new Error('produtoId é obrigatório');
    }

    if (!insumoId) {
      throw new Error('insumoId é obrigatório');
    }

    if (quantidadePorUnidade === undefined || quantidadePorUnidade === null) {
      throw new Error('quantidadePorUnidade é obrigatória');
    }

    return await this.manager.createReceita({
      produtoId: produtoId,
      insumoId: insumoId,
      quantidadePorUnidade: quantidadePorUnidade,
      observacao: observacao
    });
  }

  /**
   * Remove insumo de um produto (deleta receita)
   */
  async removeInsumoFromProduto(produtoId, insumoId) {
    if (!produtoId) {
      throw new Error('produtoId é obrigatório');
    }

    if (!insumoId) {
      throw new Error('insumoId é obrigatório');
    }

    return await this.manager.deleteReceita(produtoId, insumoId);
  }

  /**
   * Atualiza quantidade de insumo em uma receita
   */
  async updateQuantidadeInsumo(produtoId, insumoId, novaQuantidade) {
    if (!produtoId) {
      throw new Error('produtoId é obrigatório');
    }

    if (!insumoId) {
      throw new Error('insumoId é obrigatório');
    }

    if (novaQuantidade === undefined || novaQuantidade === null) {
      throw new Error('novaQuantidade é obrigatória');
    }

    return await this.manager.updateReceita(produtoId, insumoId, {
      quantidadePorUnidade: novaQuantidade
    });
  }

  /**
   * Retorna receita completa de um produto (com dados de insumos)
   */
  async getReceitaCompleta(produtoId) {
    if (!produtoId) {
      throw new Error('produtoId é obrigatório');
    }

    const produto = await this.manager.getProduto(produtoId);
    if (!produto) {
      throw new Error(`Produto ${produtoId} não encontrado`);
    }

    const receitas = await this.manager.listReceitasByProduto(produtoId);

    // Enriquecer com dados dos insumos
    const receitaCompleta = await Promise.all(
      receitas.map(async (receita) => {
        const insumo = await this.manager.getInsumo(receita.insumoId);

        if (!insumo) {
          throw new Error(`Insumo ${receita.insumoId} referenciado na receita não encontrado`);
        }

        return {
          insumoId: insumo.id,
          insumoNome: insumo.nome,
          insumoTipo: insumo.tipo,
          insumoUnidade: insumo.unidade,
          custoUnitario: insumo.custoUnitario,
          quantidadePorUnidade: receita.quantidadePorUnidade,
          custoTotalPorUnidade: receita.quantidadePorUnidade * insumo.custoUnitario,
          observacao: receita.observacao
        };
      })
    );

    return {
      produto: {
        id: produto.id,
        nome: produto.nome,
        unidade: produto.unidade,
        precoVenda: produto.precoVenda
      },
      receita: receitaCompleta,
      custoTotalProducao: receitaCompleta.reduce((sum, item) => sum + item.custoTotalPorUnidade, 0),
      margemBruta: produto.precoVenda - receitaCompleta.reduce((sum, item) => sum + item.custoTotalPorUnidade, 0),
      margemPercentual: ((produto.precoVenda - receitaCompleta.reduce((sum, item) => sum + item.custoTotalPorUnidade, 0)) / produto.precoVenda) * 100
    };
  }

  /**
   * Lista todos os produtos que usam um insumo específico
   */
  async getProdutosUsingInsumo(insumoId) {
    if (!insumoId) {
      throw new Error('insumoId é obrigatório');
    }

    const insumo = await this.manager.getInsumo(insumoId);
    if (!insumo) {
      throw new Error(`Insumo ${insumoId} não encontrado`);
    }

    const receitas = await this.manager.listReceitasByInsumo(insumoId);

    // Enriquecer com dados dos produtos
    const produtosUsando = await Promise.all(
      receitas.map(async (receita) => {
        const produto = await this.manager.getProduto(receita.produtoId);

        if (!produto) {
          throw new Error(`Produto ${receita.produtoId} referenciado na receita não encontrado`);
        }

        return {
          produtoId: produto.id,
          produtoNome: produto.nome,
          produtoUnidade: produto.unidade,
          producaoMensal: produto.producaoMensal,
          quantidadePorUnidade: receita.quantidadePorUnidade,
          demandaMensal: produto.producaoMensal * receita.quantidadePorUnidade,
          observacao: receita.observacao
        };
      })
    );

    return {
      insumo: {
        id: insumo.id,
        nome: insumo.nome,
        unidade: insumo.unidade,
        custoUnitario: insumo.custoUnitario
      },
      produtos: produtosUsando,
      demandaMensalTotal: produtosUsando.reduce((sum, item) => sum + item.demandaMensal, 0)
    };
  }

  /**
   * Valida consistência de uma receita
   */
  async validateReceita(produtoId) {
    if (!produtoId) {
      throw new Error('produtoId é obrigatório');
    }

    const receitaCompleta = await this.getReceitaCompleta(produtoId);

    const issues = [];

    // 1. Verificar se produto tem pelo menos um insumo
    if (receitaCompleta.receita.length === 0) {
      issues.push({
        tipo: 'WARNING',
        mensagem: 'Produto não possui insumos vinculados'
      });
    }

    // 2. Verificar se custo de produção é menor que preço de venda
    if (receitaCompleta.custoTotalProducao >= receitaCompleta.produto.precoVenda) {
      issues.push({
        tipo: 'ERROR',
        mensagem: `Custo de produção (R$ ${receitaCompleta.custoTotalProducao.toFixed(2)}) é maior ou igual ao preço de venda (R$ ${receitaCompleta.produto.precoVenda.toFixed(2)})`
      });
    }

    // 3. Verificar margem mínima (exemplo: 10%)
    if (receitaCompleta.margemPercentual < 10 && receitaCompleta.margemPercentual > 0) {
      issues.push({
        tipo: 'WARNING',
        mensagem: `Margem de lucro muito baixa: ${receitaCompleta.margemPercentual.toFixed(2)}%`
      });
    }

    // 4. Verificar insumos inativos
    for (const item of receitaCompleta.receita) {
      const insumo = await this.manager.getInsumo(item.insumoId);
      if (!insumo.ativo) {
        issues.push({
          tipo: 'ERROR',
          mensagem: `Insumo inativo na receita: ${item.insumoNome}`
        });
      }
    }

    return {
      valid: issues.filter(i => i.tipo === 'ERROR').length === 0,
      issues: issues,
      receita: receitaCompleta
    };
  }

  /**
   * Clona receita de um produto para outro
   */
  async cloneReceita(produtoIdOrigem, produtoIdDestino) {
    if (!produtoIdOrigem) {
      throw new Error('produtoIdOrigem é obrigatório');
    }

    if (!produtoIdDestino) {
      throw new Error('produtoIdDestino é obrigatório');
    }

    if (produtoIdOrigem === produtoIdDestino) {
      throw new Error('Produto origem e destino não podem ser o mesmo');
    }

    // Verificar se produtos existem
    const produtoOrigem = await this.manager.getProduto(produtoIdOrigem);
    if (!produtoOrigem) {
      throw new Error(`Produto origem ${produtoIdOrigem} não encontrado`);
    }

    const produtoDestino = await this.manager.getProduto(produtoIdDestino);
    if (!produtoDestino) {
      throw new Error(`Produto destino ${produtoIdDestino} não encontrado`);
    }

    // Verificar se produto destino já tem receitas
    const receitasDestino = await this.manager.listReceitasByProduto(produtoIdDestino);
    if (receitasDestino.length > 0) {
      throw new Error(`Produto destino já possui ${receitasDestino.length} receita(s). Remova-as antes de clonar.`);
    }

    // Clonar receitas
    const receitasOrigem = await this.manager.listReceitasByProduto(produtoIdOrigem);

    const receitasClonadas = await Promise.all(
      receitasOrigem.map(async (receita) => {
        return await this.manager.createReceita({
          produtoId: produtoIdDestino,
          insumoId: receita.insumoId,
          quantidadePorUnidade: receita.quantidadePorUnidade,
          observacao: receita.observacao
        });
      })
    );

    console.log(`✓ ${receitasClonadas.length} receita(s) clonada(s) de ${produtoOrigem.nome} para ${produtoDestino.nome}`);

    return receitasClonadas;
  }

  /**
   * Retorna matriz completa produto×insumo
   */
  async getMatrizCompleta() {
    const produtos = await this.manager.listProdutos(true);
    const insumos = await this.manager.listInsumos(true);
    const receitas = await this.manager.listAllReceitas();

    // Criar mapa de receitas por produto+insumo
    const receitaMap = {};
    receitas.forEach(receita => {
      const key = `${receita.produtoId}_${receita.insumoId}`;
      receitaMap[key] = receita.quantidadePorUnidade;
    });

    // Construir matriz
    const matriz = produtos.map(produto => {
      const linha = {
        produtoId: produto.id,
        produtoNome: produto.nome,
        insumos: {}
      };

      insumos.forEach(insumo => {
        const key = `${produto.id}_${insumo.id}`;
        linha.insumos[insumo.id] = receitaMap[key] !== undefined ? receitaMap[key] : null;
      });

      return linha;
    });

    return {
      produtos: produtos,
      insumos: insumos,
      matriz: matriz
    };
  }

  /**
   * Calcula impacto de mudança de preço de insumo
   */
  async calcularImpactoMudancaPrecoInsumo(insumoId, novoPreco) {
    if (!insumoId) {
      throw new Error('insumoId é obrigatório');
    }

    if (novoPreco === undefined || novoPreco === null) {
      throw new Error('novoPreco é obrigatório');
    }

    const precoNumerico = parseFloat(novoPreco);
    if (isNaN(precoNumerico) || precoNumerico < 0) {
      throw new Error(`novoPreco inválido: ${novoPreco}`);
    }

    const insumo = await this.manager.getInsumo(insumoId);
    if (!insumo) {
      throw new Error(`Insumo ${insumoId} não encontrado`);
    }

    const precoAtual = insumo.custoUnitario;
    const variacao = precoNumerico - precoAtual;
    const variacaoPercentual = (variacao / precoAtual) * 100;

    const produtosUsando = await this.getProdutosUsingInsumo(insumoId);

    // Calcular impacto em cada produto
    const impactos = await Promise.all(
      produtosUsando.produtos.map(async (produtoInfo) => {
        const receitaCompleta = await this.getReceitaCompleta(produtoInfo.produtoId);

        const custoAtual = receitaCompleta.custoTotalProducao;
        const impactoUnitario = produtoInfo.quantidadePorUnidade * variacao;
        const novoCusto = custoAtual + impactoUnitario;
        const novaMargemBruta = receitaCompleta.produto.precoVenda - novoCusto;
        const novaMargemPercentual = (novaMargemBruta / receitaCompleta.produto.precoVenda) * 100;

        return {
          produtoId: produtoInfo.produtoId,
          produtoNome: produtoInfo.produtoNome,
          custoAtual: custoAtual,
          novoCusto: novoCusto,
          impactoUnitario: impactoUnitario,
          margemAtual: receitaCompleta.margemPercentual,
          novaMargemPercentual: novaMargemPercentual,
          variacaoMargem: novaMargemPercentual - receitaCompleta.margemPercentual
        };
      })
    );

    return {
      insumo: {
        id: insumo.id,
        nome: insumo.nome,
        precoAtual: precoAtual,
        novoPreco: precoNumerico,
        variacao: variacao,
        variacaoPercentual: variacaoPercentual
      },
      impactos: impactos,
      produtosAfetados: impactos.length
    };
  }
}

// Exportar para uso global
if (typeof window !== 'undefined') {
  window.RecipeService = RecipeService;
  console.log('[RecipeService] Classe disponível para uso');
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = RecipeService;
}
