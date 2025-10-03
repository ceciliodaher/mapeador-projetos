/* =====================================
   PRODUTO-INSUMO-MANAGER.JS
   CRUD operations para Produtos, Insumos e Receitas
   NO FALLBACKS - NO HARDCODED DATA - STRICT VALIDATION
   ===================================== */

class ProdutoInsumoManager {
  constructor(dbManager) {
    if (!dbManager) {
      throw new Error('DBManager não fornecido. ProdutoInsumoManager requer ProGoiasIndexedDBManager.');
    }

    this.dbManager = dbManager;
  }

  // ==================== CONFIG HELPERS ====================

  /**
   * Retorna configuração de escalonamento
   */
  async getEscalationConfig() {
    if (!this.dbManager.currentProjectId) {
      throw new Error('Projeto não inicializado. Configure o projeto antes de gerenciar produtos.');
    }

    const config = await this.dbManager.get('config_escalonamento_progoias', this.dbManager.currentProjectId);

    if (!config) {
      throw new Error('Configuração de escalonamento não encontrada. Configure o modo de escalonamento antes de criar produtos.');
    }

    return config;
  }

  // ==================== PRODUTOS ====================

  /**
   * Cria novo produto
   */
  async createProduto(produtoData) {
    // 1. Validações obrigatórias básicas
    if (!produtoData.nome) {
      throw new Error('Nome do produto é obrigatório');
    }

    if (!produtoData.unidade) {
      throw new Error('Unidade do produto é obrigatória');
    }

    if (produtoData.producaoMensal === undefined || produtoData.producaoMensal === null) {
      throw new Error('Produção mensal do produto é obrigatória');
    }

    const producaoMensal = parseFloat(produtoData.producaoMensal);
    if (isNaN(producaoMensal) || producaoMensal < 0) {
      throw new Error(`Produção mensal inválida: ${produtoData.producaoMensal}`);
    }

    if (produtoData.precoVenda === undefined || produtoData.precoVenda === null) {
      throw new Error('Preço de venda do produto é obrigatório');
    }

    const precoVenda = parseFloat(produtoData.precoVenda);
    if (isNaN(precoVenda) || precoVenda < 0) {
      throw new Error(`Preço de venda inválido: ${produtoData.precoVenda}`);
    }

    // 2. Buscar configuração de escalonamento
    const escalationConfig = await this.getEscalationConfig();

    // 3. Validar escalonamento baseado no modo
    let escalamento = null;

    if (escalationConfig.escalationMode === 'individual') {
      // Modo individual: escalonamento é OBRIGATÓRIO
      if (!produtoData.escalamento) {
        throw new Error('Escalonamento individual é obrigatório quando modo de escalonamento = individual');
      }

      // Validar estrutura do escalonamento
      if (typeof produtoData.escalamento !== 'object') {
        throw new Error('Escalonamento deve ser um objeto com anos (ano1, ano2, ano3, ano4)');
      }

      const anos = ['ano1', 'ano2', 'ano3', 'ano4'];
      for (const ano of anos) {
        if (produtoData.escalamento[ano] === undefined || produtoData.escalamento[ano] === null) {
          throw new Error(`Escalonamento ${ano} é obrigatório no modo individual`);
        }

        const percentual = parseFloat(produtoData.escalamento[ano]);
        if (isNaN(percentual)) {
          throw new Error(`Escalonamento ${ano} inválido: ${produtoData.escalamento[ano]}`);
        }

        if (percentual < 0 || percentual > 100) {
          throw new Error(`Escalonamento ${ano} deve estar entre 0 e 100 (recebido: ${percentual})`);
        }
      }

      escalamento = {
        ano1: parseFloat(produtoData.escalamento.ano1),
        ano2: parseFloat(produtoData.escalamento.ano2),
        ano3: parseFloat(produtoData.escalamento.ano3),
        ano4: parseFloat(produtoData.escalamento.ano4)
      };

    } else {
      // Modo global: escalonamento individual é IGNORADO (mesmo se fornecido)
      escalamento = null; // Explicitamente null - será usado config global
    }

    // 4. Validar destinos (OBRIGATÓRIO)
    if (!produtoData.destinos) {
      throw new Error('Destinos do produto são obrigatórios (mercadoInterno, mercadoInterestadual, exportacao)');
    }

    if (produtoData.destinos.mercadoInterno === undefined || produtoData.destinos.mercadoInterno === null) {
      throw new Error('destinos.mercadoInterno é obrigatório');
    }

    if (produtoData.destinos.mercadoInterestadual === undefined || produtoData.destinos.mercadoInterestadual === null) {
      throw new Error('destinos.mercadoInterestadual é obrigatório');
    }

    if (produtoData.destinos.exportacao === undefined || produtoData.destinos.exportacao === null) {
      throw new Error('destinos.exportacao é obrigatório');
    }

    const mercadoInterno = parseFloat(produtoData.destinos.mercadoInterno);
    const mercadoInterestadual = parseFloat(produtoData.destinos.mercadoInterestadual);
    const exportacao = parseFloat(produtoData.destinos.exportacao);

    if (isNaN(mercadoInterno) || mercadoInterno < 0 || mercadoInterno > 100) {
      throw new Error(`destinos.mercadoInterno inválido: ${produtoData.destinos.mercadoInterno}`);
    }

    if (isNaN(mercadoInterestadual) || mercadoInterestadual < 0 || mercadoInterestadual > 100) {
      throw new Error(`destinos.mercadoInterestadual inválido: ${produtoData.destinos.mercadoInterestadual}`);
    }

    if (isNaN(exportacao) || exportacao < 0 || exportacao > 100) {
      throw new Error(`destinos.exportacao inválido: ${produtoData.destinos.exportacao}`);
    }

    const totalDestinos = mercadoInterno + mercadoInterestadual + exportacao;
    if (Math.abs(totalDestinos - 100) > 0.01) { // Tolerância para arredondamento
      throw new Error(`Total de destinos deve ser 100% (recebido: ${totalDestinos}%)`);
    }

    const destinos = {
      mercadoInterno: mercadoInterno,
      mercadoInterestadual: mercadoInterestadual,
      exportacao: exportacao
    };

    // 5. NCM é opcional mas se fornecido deve ser string
    const ncm = produtoData.ncm ? String(produtoData.ncm) : '';

    // 6. Criar produto
    const produto = {
      id: 'prod_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      projectId: this.dbManager.currentProjectId,
      nome: produtoData.nome,
      ncm: ncm,
      unidade: produtoData.unidade,
      producaoMensal: producaoMensal,
      precoVenda: precoVenda,
      escalamento: escalamento, // null (global) ou objeto (individual)
      destinos: destinos,
      ativo: true,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    await this.dbManager.save('produtos_progoias', produto);
    console.log('✓ Produto criado:', produto.id, `(modo: ${escalationConfig.escalationMode})`);

    return produto;
  }

  /**
   * Atualiza produto existente
   */
  async updateProduto(produtoId, updates) {
    const produto = await this.dbManager.get('produtos_progoias', produtoId);

    if (!produto) {
      throw new Error(`Produto ${produtoId} não encontrado`);
    }

    // Se estiver atualizando escalonamento, validar baseado no modo
    if (updates.escalamento !== undefined) {
      const escalationConfig = await this.getEscalationConfig();

      if (escalationConfig.escalationMode === 'individual') {
        // Validar escalonamento individual
        if (!updates.escalamento) {
          throw new Error('Escalonamento não pode ser removido no modo individual');
        }

        const anos = ['ano1', 'ano2', 'ano3', 'ano4'];
        for (const ano of anos) {
          if (updates.escalamento[ano] === undefined || updates.escalamento[ano] === null) {
            throw new Error(`Escalonamento ${ano} é obrigatório no modo individual`);
          }

          const percentual = parseFloat(updates.escalamento[ano]);
          if (isNaN(percentual) || percentual < 0 || percentual > 100) {
            throw new Error(`Escalonamento ${ano} inválido: ${updates.escalamento[ano]}`);
          }
        }
      } else {
        // Modo global: escalonamento individual é ignorado
        updates.escalamento = null;
      }
    }

    const updated = {
      ...produto,
      ...updates,
      id: produtoId, // Garantir que ID não muda
      updatedAt: Date.now()
    };

    await this.dbManager.save('produtos_progoias', updated);
    console.log('✓ Produto atualizado:', produtoId);

    return updated;
  }

  /**
   * Lista todos os produtos ativos
   */
  async listProdutos(apenasAtivos = true) {
    const produtos = await this.dbManager.getAll('produtos_progoias');

    if (apenasAtivos) {
      return produtos.filter(p => p.ativo === true);
    }

    return produtos;
  }

  /**
   * Busca produto por ID
   */
  async getProduto(produtoId) {
    return await this.dbManager.get('produtos_progoias', produtoId);
  }

  /**
   * Soft delete de produto
   */
  async deleteProduto(produtoId) {
    // Verificar se há receitas vinculadas
    const receitas = await this.listReceitasByProduto(produtoId);

    if (receitas.length > 0) {
      throw new Error(`Produto possui ${receitas.length} receita(s) vinculada(s). Remova os vínculos primeiro.`);
    }

    const produto = await this.getProduto(produtoId);

    if (!produto) {
      throw new Error(`Produto ${produtoId} não encontrado`);
    }

    produto.ativo = false;
    produto.updatedAt = Date.now();

    await this.dbManager.save('produtos_progoias', produto);
    console.log('✓ Produto desativado:', produtoId);

    return produto;
  }

  // ==================== INSUMOS ====================

  /**
   * Cria novo insumo
   */
  async createInsumo(insumoData) {
    // Validações obrigatórias
    if (!insumoData.nome) {
      throw new Error('Nome do insumo é obrigatório');
    }

    if (!insumoData.tipo) {
      throw new Error('Tipo do insumo é obrigatório (MP, EMB, UTIL)');
    }

    if (!isValidTipoInsumo(insumoData.tipo)) {
      throw new Error(`Tipo de insumo inválido: ${insumoData.tipo}. Use: MP, EMB, UTIL`);
    }

    if (!insumoData.unidade) {
      throw new Error('Unidade do insumo é obrigatória');
    }

    if (insumoData.custoUnitario === undefined || insumoData.custoUnitario === null) {
      throw new Error('Custo unitário do insumo é obrigatório');
    }

    const custoUnitario = parseFloat(insumoData.custoUnitario);
    if (isNaN(custoUnitario) || custoUnitario < 0) {
      throw new Error(`Custo unitário inválido: ${insumoData.custoUnitario}`);
    }

    if (!insumoData.scalingMode) {
      throw new Error('Modo de escalonamento do insumo é obrigatório (manual ou calculated)');
    }

    if (!isValidScalingMode(insumoData.scalingMode)) {
      throw new Error(`Modo de escalonamento inválido: ${insumoData.scalingMode}. Use: manual, calculated`);
    }

    if (insumoData.isGeral === undefined || insumoData.isGeral === null) {
      throw new Error('isGeral é obrigatório (true para insumos gerais como energia, false para específicos)');
    }

    // Validar quantidade futura apenas se modo = manual
    let quantidadeFutura = null;
    if (insumoData.scalingMode === 'manual') {
      if (insumoData.quantidadeFutura === undefined || insumoData.quantidadeFutura === null) {
        throw new Error('quantidadeFutura é obrigatória para insumos com scalingMode = manual');
      }

      quantidadeFutura = parseFloat(insumoData.quantidadeFutura);
      if (isNaN(quantidadeFutura) || quantidadeFutura < 0) {
        throw new Error(`quantidadeFutura inválida: ${insumoData.quantidadeFutura}`);
      }
    }
    // Se modo = calculated, quantidade será calculada automaticamente (null inicialmente)

    // Validar origens (OBRIGATÓRIO)
    if (!insumoData.origens) {
      throw new Error('Origens do insumo são obrigatórias (mercadoInterno, mercadoInterestadual, importacao)');
    }

    if (insumoData.origens.mercadoInterno === undefined || insumoData.origens.mercadoInterno === null) {
      throw new Error('origens.mercadoInterno é obrigatório');
    }

    if (insumoData.origens.mercadoInterestadual === undefined || insumoData.origens.mercadoInterestadual === null) {
      throw new Error('origens.mercadoInterestadual é obrigatório');
    }

    if (insumoData.origens.importacao === undefined || insumoData.origens.importacao === null) {
      throw new Error('origens.importacao é obrigatório');
    }

    const mercadoInterno = parseFloat(insumoData.origens.mercadoInterno);
    const mercadoInterestadual = parseFloat(insumoData.origens.mercadoInterestadual);
    const importacao = parseFloat(insumoData.origens.importacao);

    if (isNaN(mercadoInterno) || mercadoInterno < 0 || mercadoInterno > 100) {
      throw new Error(`origens.mercadoInterno inválido: ${insumoData.origens.mercadoInterno}`);
    }

    if (isNaN(mercadoInterestadual) || mercadoInterestadual < 0 || mercadoInterestadual > 100) {
      throw new Error(`origens.mercadoInterestadual inválido: ${insumoData.origens.mercadoInterestadual}`);
    }

    if (isNaN(importacao) || importacao < 0 || importacao > 100) {
      throw new Error(`origens.importacao inválido: ${insumoData.origens.importacao}`);
    }

    const totalOrigens = mercadoInterno + mercadoInterestadual + importacao;
    if (Math.abs(totalOrigens - 100) > 0.01) {
      throw new Error(`Total de origens deve ser 100% (recebido: ${totalOrigens}%)`);
    }

    const origens = {
      mercadoInterno: mercadoInterno,
      mercadoInterestadual: mercadoInterestadual,
      importacao: importacao
    };

    // NCM, fornecedor e observações são opcionais
    const ncm = insumoData.ncm ? String(insumoData.ncm) : '';
    const fornecedorPrincipal = insumoData.fornecedorPrincipal ? String(insumoData.fornecedorPrincipal) : '';
    const observacoes = insumoData.observacoes ? String(insumoData.observacoes) : '';

    const insumo = {
      id: 'ins_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      projectId: this.dbManager.currentProjectId,
      nome: insumoData.nome,
      tipo: insumoData.tipo, // MP | EMB | UTIL
      ncm: ncm,
      unidade: insumoData.unidade,
      custoUnitario: custoUnitario,
      quantidadeFutura: quantidadeFutura,
      isGeral: insumoData.isGeral === true, // Coerce para boolean
      scalingMode: insumoData.scalingMode,
      origens: origens,
      fornecedorPrincipal: fornecedorPrincipal,
      observacoes: observacoes,
      ativo: true,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    await this.dbManager.save('insumos_progoias', insumo);
    console.log('✓ Insumo criado:', insumo.id);

    return insumo;
  }

  /**
   * Atualiza insumo existente
   */
  async updateInsumo(insumoId, updates) {
    const insumo = await this.dbManager.get('insumos_progoias', insumoId);

    if (!insumo) {
      throw new Error(`Insumo ${insumoId} não encontrado`);
    }

    const updated = {
      ...insumo,
      ...updates,
      id: insumoId,
      updatedAt: Date.now()
    };

    await this.dbManager.save('insumos_progoias', updated);
    console.log('✓ Insumo atualizado:', insumoId);

    return updated;
  }

  /**
   * Lista todos os insumos ativos
   */
  async listInsumos(apenasAtivos = true, tipo = null) {
    let insumos = await this.dbManager.getAll('insumos_progoias');

    if (apenasAtivos) {
      insumos = insumos.filter(i => i.ativo === true);
    }

    if (tipo) {
      insumos = insumos.filter(i => i.tipo === tipo);
    }

    return insumos;
  }

  /**
   * Busca insumo por ID
   */
  async getInsumo(insumoId) {
    return await this.dbManager.get('insumos_progoias', insumoId);
  }

  /**
   * Soft delete de insumo
   */
  async deleteInsumo(insumoId) {
    // Verificar se há receitas vinculadas
    const receitas = await this.listReceitasByInsumo(insumoId);

    if (receitas.length > 0) {
      throw new Error(`Insumo possui ${receitas.length} receita(s) vinculada(s). Remova os vínculos primeiro.`);
    }

    const insumo = await this.getInsumo(insumoId);

    if (!insumo) {
      throw new Error(`Insumo ${insumoId} não encontrado`);
    }

    insumo.ativo = false;
    insumo.updatedAt = Date.now();

    await this.dbManager.save('insumos_progoias', insumo);
    console.log('✓ Insumo desativado:', insumoId);

    return insumo;
  }

  // ==================== RECEITAS (VÍNCULOS) ====================

  /**
   * Cria vínculo produto-insumo (receita)
   */
  async createReceita(receitaData) {
    // Validações obrigatórias
    if (!receitaData.produtoId) {
      throw new Error('produtoId é obrigatório para criar receita');
    }

    if (!receitaData.insumoId) {
      throw new Error('insumoId é obrigatório para criar receita');
    }

    if (receitaData.quantidadePorUnidade === undefined || receitaData.quantidadePorUnidade === null) {
      throw new Error('quantidadePorUnidade é obrigatória para criar receita');
    }

    const quantidade = parseFloat(receitaData.quantidadePorUnidade);

    if (isNaN(quantidade)) {
      throw new Error(`quantidadePorUnidade inválida: ${receitaData.quantidadePorUnidade}`);
    }

    if (quantidade <= 0) {
      throw new Error('quantidadePorUnidade deve ser maior que zero');
    }

    // Verificar se produto existe
    const produto = await this.getProduto(receitaData.produtoId);
    if (!produto) {
      throw new Error(`Produto ${receitaData.produtoId} não encontrado`);
    }

    // Verificar se insumo existe
    const insumo = await this.getInsumo(receitaData.insumoId);
    if (!insumo) {
      throw new Error(`Insumo ${receitaData.insumoId} não encontrado`);
    }

    // Verificar se vínculo já existe
    const existente = await this.getReceita(receitaData.produtoId, receitaData.insumoId);
    if (existente) {
      throw new Error('Vínculo produto-insumo já existe. Use updateReceita() para atualizar.');
    }

    // Observação é opcional
    const observacao = receitaData.observacao ? String(receitaData.observacao) : '';

    const receita = {
      id: `${receitaData.produtoId}_${receitaData.insumoId}`,
      produtoId: receitaData.produtoId,
      insumoId: receitaData.insumoId,
      quantidadePorUnidade: quantidade,
      observacao: observacao,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    await this.dbManager.save('produto_insumo_map', receita);
    console.log('✓ Receita criada:', receita.id);

    return receita;
  }

  /**
   * Atualiza receita existente
   */
  async updateReceita(produtoId, insumoId, updates) {
    const receita = await this.getReceita(produtoId, insumoId);

    if (!receita) {
      throw new Error(`Receita não encontrada para produto ${produtoId} e insumo ${insumoId}`);
    }

    // Validar quantidadePorUnidade se estiver sendo atualizada
    if (updates.quantidadePorUnidade !== undefined) {
      const quantidade = parseFloat(updates.quantidadePorUnidade);

      if (isNaN(quantidade)) {
        throw new Error(`quantidadePorUnidade inválida: ${updates.quantidadePorUnidade}`);
      }

      if (quantidade <= 0) {
        throw new Error('quantidadePorUnidade deve ser maior que zero');
      }

      updates.quantidadePorUnidade = quantidade;
    }

    const updated = {
      ...receita,
      ...updates,
      id: receita.id,
      produtoId: produtoId, // Garantir que não muda
      insumoId: insumoId,   // Garantir que não muda
      updatedAt: Date.now()
    };

    await this.dbManager.save('produto_insumo_map', updated);
    console.log('✓ Receita atualizada:', receita.id);

    return updated;
  }

  /**
   * Busca receita específica
   */
  async getReceita(produtoId, insumoId) {
    const id = `${produtoId}_${insumoId}`;
    return await this.dbManager.get('produto_insumo_map', id);
  }

  /**
   * Lista receitas de um produto
   */
  async listReceitasByProduto(produtoId) {
    const allReceitas = await this.dbManager.getAll('produto_insumo_map');
    return allReceitas.filter(r => r.produtoId === produtoId);
  }

  /**
   * Lista receitas de um insumo
   */
  async listReceitasByInsumo(insumoId) {
    const allReceitas = await this.dbManager.getAll('produto_insumo_map');
    return allReceitas.filter(r => r.insumoId === insumoId);
  }

  /**
   * Deleta receita (vínculo)
   */
  async deleteReceita(produtoId, insumoId) {
    const id = `${produtoId}_${insumoId}`;
    await this.dbManager.delete('produto_insumo_map', id);
    console.log('✓ Receita deletada:', id);
  }

  /**
   * Lista todas as receitas
   */
  async listAllReceitas() {
    return await this.dbManager.getAll('produto_insumo_map');
  }

  // ==================== HELPERS ====================

  /**
   * Busca produtos por nome (fuzzy search)
   */
  async searchProdutos(query) {
    if (!query) {
      throw new Error('Query de busca é obrigatória');
    }

    const produtos = await this.listProdutos(true);
    const lowerQuery = query.toLowerCase();

    return produtos.filter(p =>
      p.nome.toLowerCase().includes(lowerQuery) ||
      p.ncm.includes(query)
    );
  }

  /**
   * Busca insumos por nome (fuzzy search)
   */
  async searchInsumos(query) {
    if (!query) {
      throw new Error('Query de busca é obrigatória');
    }

    const insumos = await this.listInsumos(true);
    const lowerQuery = query.toLowerCase();

    return insumos.filter(i =>
      i.nome.toLowerCase().includes(lowerQuery) ||
      i.ncm.includes(query)
    );
  }

  /**
   * Retorna estatísticas gerais
   */
  async getStatistics() {
    const produtos = await this.listProdutos(true);
    const insumos = await this.listInsumos(true);
    const receitas = await this.listAllReceitas();

    return {
      totalProdutos: produtos.length,
      totalInsumos: insumos.length,
      totalReceitas: receitas.length,
      produtosSemReceita: produtos.filter(p => {
        return !receitas.some(r => r.produtoId === p.id);
      }).length,
      insumosSemVinculo: insumos.filter(i => {
        return !i.isGeral && !receitas.some(r => r.insumoId === i.id);
      }).length
    };
  }
}

// Exportar para uso global
if (typeof window !== 'undefined') {
  window.ProdutoInsumoManager = ProdutoInsumoManager;
  console.log('[ProdutoInsumoManager] Classe disponível para uso');
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ProdutoInsumoManager;
}
