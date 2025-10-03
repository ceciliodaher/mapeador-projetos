/* =====================================
   VALIDATION-SERVICE.JS
   Serviço para validação de integridade referencial
   FOCO: Prevenir corrupção de dados, não impor regras de negócio
   NO FALLBACKS - Data Integrity Layer
   ===================================== */

class ValidationService {
  constructor(produtoInsumoManager) {
    if (!produtoInsumoManager) {
      throw new Error('ProdutoInsumoManager não fornecido. ValidationService requer ProdutoInsumoManager.');
    }

    this.manager = produtoInsumoManager;
  }

  // ==================== VALIDAÇÕES DE INTEGRIDADE REFERENCIAL ====================

  /**
   * Valida apenas integridade referencial (referências órfãs)
   * NÃO valida regras de negócio
   */
  async validateReferentialIntegrity() {
    const errors = [];

    const produtos = await this.manager.listProdutos(false);
    const insumos = await this.manager.listInsumos(false);
    const receitas = await this.manager.listAllReceitas();

    // IDs válidos
    const produtoIds = new Set(produtos.map(p => p.id));
    const insumoIds = new Set(insumos.map(i => i.id));

    // Verificar receitas com referências inválidas
    for (const receita of receitas) {
      if (!produtoIds.has(receita.produtoId)) {
        errors.push({
          tipo: 'ORPHAN_REFERENCE',
          entidade: 'RECEITA',
          id: receita.id,
          campo: 'produtoId',
          valor: receita.produtoId,
          mensagem: `Receita aponta para produto inexistente: ${receita.produtoId}`
        });
      }

      if (!insumoIds.has(receita.insumoId)) {
        errors.push({
          tipo: 'ORPHAN_REFERENCE',
          entidade: 'RECEITA',
          id: receita.id,
          campo: 'insumoId',
          valor: receita.insumoId,
          mensagem: `Receita aponta para insumo inexistente: ${receita.insumoId}`
        });
      }
    }

    return {
      valid: errors.length === 0,
      totalErrors: errors.length,
      errors: errors
    };
  }

  /**
   * Verifica se é seguro deletar um produto
   */
  async canDeleteProduto(produtoId) {
    if (!produtoId) {
      throw new Error('produtoId é obrigatório');
    }

    const receitas = await this.manager.listReceitasByProduto(produtoId);

    return {
      canDelete: receitas.length === 0,
      blockers: receitas.length > 0 ? [
        `Produto possui ${receitas.length} receita(s) vinculada(s). Remova as receitas antes de deletar o produto.`
      ] : [],
      affectedReceitas: receitas.map(r => r.id)
    };
  }

  /**
   * Verifica se é seguro deletar um insumo
   */
  async canDeleteInsumo(insumoId) {
    if (!insumoId) {
      throw new Error('insumoId é obrigatório');
    }

    const receitas = await this.manager.listReceitasByInsumo(insumoId);

    return {
      canDelete: receitas.length === 0,
      blockers: receitas.length > 0 ? [
        `Insumo possui ${receitas.length} receita(s) vinculada(s). Remova as receitas antes de deletar o insumo.`
      ] : [],
      affectedReceitas: receitas.map(r => r.id)
    };
  }

  /**
   * Limpa referências órfãs (DANGEROUS - use com cuidado)
   */
  async cleanOrphanReferences(dryRun = true) {
    const produtos = await this.manager.listProdutos(false);
    const insumos = await this.manager.listInsumos(false);
    const receitas = await this.manager.listAllReceitas();

    const produtoIds = new Set(produtos.map(p => p.id));
    const insumoIds = new Set(insumos.map(i => i.id));

    const receitasOrfas = receitas.filter(r =>
      !produtoIds.has(r.produtoId) || !insumoIds.has(r.insumoId)
    );

    if (dryRun) {
      return {
        dryRun: true,
        receitasOrfasEncontradas: receitasOrfas.length,
        receitas: receitasOrfas.map(r => ({
          id: r.id,
          produtoId: r.produtoId,
          produtoExiste: produtoIds.has(r.produtoId),
          insumoId: r.insumoId,
          insumoExiste: insumoIds.has(r.insumoId)
        }))
      };
    }

    // Deletar receitas órfãs
    const deletedIds = [];
    for (const receita of receitasOrfas) {
      try {
        await this.manager.deleteReceita(receita.produtoId, receita.insumoId);
        deletedIds.push(receita.id);
      } catch (error) {
        console.error(`Erro ao deletar receita órfã ${receita.id}:`, error);
      }
    }

    return {
      dryRun: false,
      receitasDeletadas: deletedIds.length,
      deletedIds: deletedIds
    };
  }

  /**
   * Detecta duplicatas de receitas (mesmo produto+insumo)
   */
  async detectDuplicateReceitas() {
    const receitas = await this.manager.listAllReceitas();
    const seen = new Set();
    const duplicates = [];

    for (const receita of receitas) {
      const key = `${receita.produtoId}_${receita.insumoId}`;
      if (seen.has(key)) {
        duplicates.push({
          produtoId: receita.produtoId,
          insumoId: receita.insumoId,
          receitaId: receita.id
        });
      }
      seen.add(key);
    }

    return {
      hasDuplicates: duplicates.length > 0,
      totalDuplicates: duplicates.length,
      duplicates: duplicates
    };
  }

  /**
   * Verifica consistência de IDs (formato correto)
   */
  async validateIdFormats() {
    const errors = [];

    const produtos = await this.manager.listProdutos(false);
    const insumos = await this.manager.listInsumos(false);
    const receitas = await this.manager.listAllReceitas();

    // Validar formato de ID de produtos
    for (const produto of produtos) {
      if (!produto.id || !produto.id.startsWith('prod_')) {
        errors.push({
          tipo: 'INVALID_ID_FORMAT',
          entidade: 'PRODUTO',
          id: produto.id,
          mensagem: `ID de produto inválido: ${produto.id} (esperado: prod_*)`
        });
      }
    }

    // Validar formato de ID de insumos
    for (const insumo of insumos) {
      if (!insumo.id || !insumo.id.startsWith('ins_')) {
        errors.push({
          tipo: 'INVALID_ID_FORMAT',
          entidade: 'INSUMO',
          id: insumo.id,
          mensagem: `ID de insumo inválido: ${insumo.id} (esperado: ins_*)`
        });
      }
    }

    // Validar formato de ID de receitas
    for (const receita of receitas) {
      const expectedId = `${receita.produtoId}_${receita.insumoId}`;
      if (receita.id !== expectedId) {
        errors.push({
          tipo: 'INVALID_ID_FORMAT',
          entidade: 'RECEITA',
          id: receita.id,
          mensagem: `ID de receita inconsistente. Esperado: ${expectedId}, Atual: ${receita.id}`
        });
      }
    }

    return {
      valid: errors.length === 0,
      totalErrors: errors.length,
      errors: errors
    };
  }

  /**
   * Gera relatório de saúde do sistema (sem bloquear operações)
   */
  async generateHealthReport() {
    const stats = await this.manager.getStatistics();
    const referentialIntegrity = await this.validateReferentialIntegrity();
    const duplicates = await this.detectDuplicateReceitas();
    const idFormats = await this.validateIdFormats();

    // Informações adicionais (não bloqueantes)
    const produtos = await this.manager.listProdutos(true);
    const insumos = await this.manager.listInsumos(true);

    const produtosInativos = (await this.manager.listProdutos(false)).filter(p => !p.ativo).length;
    const insumosInativos = (await this.manager.listInsumos(false)).filter(i => !i.ativo).length;

    return {
      timestamp: new Date().toISOString(),
      healthy: referentialIntegrity.valid && duplicates.hasDuplicates === false && idFormats.valid,
      statistics: {
        produtosAtivos: stats.totalProdutos,
        produtosInativos: produtosInativos,
        insumosAtivos: stats.totalInsumos,
        insumosInativos: insumosInativos,
        totalReceitas: stats.totalReceitas,
        produtosSemReceita: stats.produtosSemReceita,
        insumosSemVinculo: stats.insumosSemVinculo
      },
      integrity: {
        referentialIntegrity: referentialIntegrity.valid,
        duplicateReceitas: duplicates.hasDuplicates,
        validIdFormats: idFormats.valid
      },
      issues: {
        orphanReferences: referentialIntegrity.errors,
        duplicates: duplicates.duplicates,
        invalidIds: idFormats.errors
      }
    };
  }

  /**
   * Verifica se sistema está em estado válido para operações críticas
   * (ex: exportação, cálculos, envio)
   */
  async isSystemOperational() {
    const referentialIntegrity = await this.validateReferentialIntegrity();
    const duplicates = await this.detectDuplicateReceitas();

    const criticalIssues = [];

    if (!referentialIntegrity.valid) {
      criticalIssues.push('Referências órfãs detectadas no sistema');
    }

    if (duplicates.hasDuplicates) {
      criticalIssues.push('Receitas duplicadas detectadas');
    }

    return {
      operational: criticalIssues.length === 0,
      criticalIssues: criticalIssues,
      canExport: criticalIssues.length === 0,
      canCalculate: criticalIssues.length === 0
    };
  }
}

// Exportar para uso global
if (typeof window !== 'undefined') {
  window.ValidationService = ValidationService;
  console.log('[ValidationService] Classe disponível para uso');
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ValidationService;
}
