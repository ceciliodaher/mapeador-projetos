/* =====================================
   MATRIZ-VALIDATION.JS
   Validação de receitas (data integrity ONLY)
   NO HARDCODED LIMITS - Sistema nunca quebra por validação
   NO FALLBACKS - Validação explícita
   ===================================== */

class MatrizValidation {
  constructor(config = {}) {
    // Configurações opcionais (todas podem ser null/undefined)
    this.config = {
      maxQuantidade: config.maxQuantidade || null,
      maxDecimalPlaces: config.maxDecimalPlaces || null,
      minMargemWarning: config.minMargemWarning || null,
      ...config
    };
  }

  // ==================== VALIDAÇÃO DE QUANTIDADE ====================

  /**
   * Validar quantidade de receita (APENAS validações técnicas básicas)
   * @param {string|number} quantidade
   * @returns {Object|null} { valid: boolean, error: string } ou null se válido
   */
  validateQuantidade(quantidade) {
    // Vazio é válido (sem receita)
    if (quantidade === '' || quantidade === null || quantidade === undefined) {
      return null;
    }

    const num = parseFloat(quantidade);

    // VALIDAÇÃO TÉCNICA 1: Deve ser número
    if (isNaN(num)) {
      return {
        valid: false,
        error: 'Valor deve ser numérico',
        severity: 'error'
      };
    }

    // VALIDAÇÃO TÉCNICA 2: Não pode ser negativo
    if (num < 0) {
      return {
        valid: false,
        error: 'Valor não pode ser negativo',
        severity: 'error'
      };
    }

    // VALIDAÇÃO TÉCNICA 3: Deve ser maior que zero (se definido)
    if (num === 0) {
      return {
        valid: false,
        error: 'Quantidade deve ser maior que zero',
        severity: 'error'
      };
    }

    // VALIDAÇÕES OPCIONAIS (apenas se configuradas)

    // Máximo configurável (opcional)
    if (this.config.maxQuantidade !== null && num > this.config.maxQuantidade) {
      return {
        valid: false,
        error: `Valor acima do máximo configurado (${this.config.maxQuantidade.toLocaleString('pt-BR')})`,
        severity: 'error'
      };
    }

    // Casas decimais configurável (opcional)
    if (this.config.maxDecimalPlaces !== null) {
      const decimalPlaces = (quantidade.toString().split('.')[1] || '').length;
      if (decimalPlaces > this.config.maxDecimalPlaces) {
        return {
          valid: false,
          error: `Máximo ${this.config.maxDecimalPlaces} casas decimais`,
          severity: 'error'
        };
      }
    }

    return null; // Válido
  }

  /**
   * Validar quantidade com contexto (unidades) - APENAS AVISO, nunca erro
   */
  validateQuantidadeComContexto(quantidade, insumoUnidade, produtoUnidade) {
    const baseValidation = this.validateQuantidade(quantidade);
    if (baseValidation && !baseValidation.valid) {
      return baseValidation;
    }

    const num = parseFloat(quantidade);

    // AVISO (não erro): fração de unidades inteiras
    if (insumoUnidade === 'unidades' && num % 1 !== 0) {
      return {
        valid: true, // IMPORTANTE: ainda é válido
        warning: 'Usar fração de unidade? Considere mudar para kg ou g.',
        severity: 'info'
      };
    }

    return baseValidation; // null ou warning
  }

  // ==================== VALIDAÇÃO DE RECEITA COMPLETA ====================

  /**
   * Validar receita completa de um produto (APENAS data integrity)
   * @param {Object} produto
   * @param {Array} receitas - Array de { insumoId, quantidade }
   * @param {Array} insumos - Lista completa de insumos
   * @returns {Array} Array de avisos/erros
   */
  validateReceita(produto, receitas, insumos) {
    const issues = [];

    // AVISO (não erro): Produto sem receitas
    if (receitas.length === 0) {
      issues.push({
        type: 'empty_recipe',
        severity: 'info', // info, não warning
        message: `Produto "${produto.nome}" não possui insumos vinculados`,
        suggestion: 'Adicione insumos para calcular custo automaticamente'
      });
      return issues;
    }

    // Validar cada receita
    for (const receita of receitas) {
      const validation = this.validateQuantidade(receita.quantidade);

      if (validation && !validation.valid) {
        const insumo = insumos.find(i => i.id === receita.insumoId);
        issues.push({
          type: 'invalid_quantidade',
          severity: validation.severity,
          insumoId: receita.insumoId,
          insumoNome: insumo?.nome || 'Desconhecido',
          message: validation.error
        });
      }
    }

    return issues;
  }

  // ==================== VALIDAÇÃO DE CUSTO/MARGEM (OPCIONAL) ====================

  /**
   * Validar margem do produto (APENAS se configurado)
   * @param {number} custoTotal
   * @param {number} precoVenda
   * @returns {Object|null}
   */
  validateMargem(custoTotal, precoVenda) {
    // Validação técnica básica
    if (!precoVenda || precoVenda <= 0) {
      return {
        type: 'invalid_price',
        severity: 'info', // info, não erro
        message: 'Preço de venda não definido ou zero',
        suggestion: 'Defina preço de venda para calcular margem'
      };
    }

    const margem = (precoVenda - custoTotal) / precoVenda;

    // AVISO: Margem negativa (prejuízo)
    if (margem < 0) {
      return {
        type: 'negative_margin',
        severity: 'warning', // warning, não erro
        message: `Margem negativa: Custo (R$ ${custoTotal.toFixed(2)}) > Preço (R$ ${precoVenda.toFixed(2)})`,
        suggestion: 'Produto vendido com prejuízo. Revisar preços.',
        margem: margem
      };
    }

    // AVISO OPCIONAL: Margem baixa (apenas se configurado)
    if (this.config.minMargemWarning !== null && margem < this.config.minMargemWarning) {
      return {
        type: 'low_margin',
        severity: 'info', // info, não warning
        message: `Margem de ${(margem * 100).toFixed(1)}% abaixo da referência configurada (${(this.config.minMargemWarning * 100).toFixed(0)}%)`,
        suggestion: 'Opcional: revisar preços ou custos',
        margem: margem
      };
    }

    return null; // Margem OK
  }

  // ==================== VALIDAÇÃO DE CONSISTÊNCIA ====================

  /**
   * Validar referências órfãs (receita → produto/insumo inexistente)
   * @param {Map} receitas - Map de receitas
   * @param {Array} produtos
   * @param {Array} insumos
   * @returns {Array} Lista de erros
   */
  validateReferentialIntegrity(receitas, produtos, insumos) {
    const errors = [];

    const produtoIds = new Set(produtos.map(p => p.id));
    const insumoIds = new Set(insumos.map(i => i.id));

    for (const [key, quantidade] of receitas.entries()) {
      const [produtoId, insumoId] = key.split('-');

      // Produto inexistente
      if (!produtoIds.has(produtoId)) {
        errors.push({
          type: 'orphan_produto',
          severity: 'error',
          message: `Receita aponta para produto inexistente: ${produtoId}`,
          action: 'Remover receita órfã'
        });
      }

      // Insumo inexistente
      if (!insumoIds.has(insumoId)) {
        errors.push({
          type: 'orphan_insumo',
          severity: 'error',
          message: `Receita aponta para insumo inexistente: ${insumoId}`,
          action: 'Remover receita órfã'
        });
      }
    }

    return errors;
  }

  /**
   * Detectar receitas duplicadas
   * @param {Map} receitas
   * @returns {Array} Lista de duplicatas
   */
  validateDuplicates(receitas) {
    const seen = new Set();
    const duplicates = [];

    for (const key of receitas.keys()) {
      if (seen.has(key)) {
        duplicates.push({
          type: 'duplicate_recipe',
          severity: 'error',
          message: `Receita duplicada: ${key}`,
          action: 'Remover duplicata'
        });
      }
      seen.add(key);
    }

    return duplicates;
  }

  // ==================== VALIDAÇÃO GERAL ====================

  /**
   * Validar matriz completa (APENAS data integrity)
   * @param {MatrizStateManager} stateManager
   * @returns {Object} { valid: boolean, errors: [], warnings: [], infos: [] }
   */
  validateMatriz(stateManager) {
    const produtos = stateManager.get('produtos');
    const insumos = stateManager.get('insumos');
    const receitas = stateManager.get('receitas');

    const errors = [];
    const warnings = [];
    const infos = [];

    // Validar integridade referencial (CRÍTICO)
    const refErrors = this.validateReferentialIntegrity(receitas, produtos, insumos);
    errors.push(...refErrors);

    // Validar duplicatas (CRÍTICO)
    const duplicates = this.validateDuplicates(receitas);
    errors.push(...duplicates);

    // Validar cada produto (NÃO CRÍTICO - apenas informativo)
    for (const produto of produtos) {
      const receitasProduto = stateManager.getReceitasByProduto(produto.id);
      const issues = this.validateReceita(produto, receitasProduto, insumos);

      for (const issue of issues) {
        if (issue.severity === 'error') {
          errors.push(issue);
        } else if (issue.severity === 'warning') {
          warnings.push(issue);
        } else {
          infos.push(issue);
        }
      }
    }

    return {
      valid: errors.length === 0, // APENAS erros críticos bloqueiam
      errors: errors,
      warnings: warnings,
      infos: infos,
      summary: {
        totalErrors: errors.length,
        totalWarnings: warnings.length,
        totalInfos: infos.length,
        critical: errors.filter(e => e.type === 'orphan_produto' || e.type === 'orphan_insumo').length
      }
    };
  }

  // ==================== HELPERS ====================

  /**
   * Formatar mensagem de erro para exibição
   */
  formatErrorMessage(error) {
    let msg = error.message;

    if (error.suggestion) {
      msg += `\n💡 ${error.suggestion}`;
    }

    if (error.action) {
      msg += `\n🔧 Ação: ${error.action}`;
    }

    return msg;
  }

  /**
   * Agrupar erros por tipo
   */
  groupErrorsByType(errors) {
    const grouped = {};

    for (const error of errors) {
      if (!grouped[error.type]) {
        grouped[error.type] = [];
      }
      grouped[error.type].push(error);
    }

    return grouped;
  }

  /**
   * Obter resumo de validação formatado
   */
  getValidationSummary(validation) {
    const { valid, errors, warnings, infos, summary } = validation;

    if (valid && warnings.length === 0 && infos.length === 0) {
      return '✅ Matriz válida sem problemas';
    }

    const parts = [];

    if (summary.critical > 0) {
      parts.push(`🔴 ${summary.critical} problema(s) crítico(s)`);
    }

    if (errors.length > 0) {
      parts.push(`❌ ${errors.length} erro(s)`);
    }

    if (warnings.length > 0) {
      parts.push(`⚠️ ${warnings.length} aviso(s)`);
    }

    if (infos.length > 0) {
      parts.push(`ℹ️ ${infos.length} info(s)`);
    }

    return parts.join(' • ');
  }

  // ==================== CONFIGURAÇÃO ====================

  /**
   * Atualizar configurações de validação
   */
  updateConfig(newConfig) {
    this.config = {
      ...this.config,
      ...newConfig
    };
  }

  /**
   * Resetar configurações (remover limites)
   */
  resetConfig() {
    this.config = {
      maxQuantidade: null,
      maxDecimalPlaces: null,
      minMargemWarning: null
    };
  }
}

// Exportar para uso global
if (typeof window !== 'undefined') {
  window.MatrizValidation = MatrizValidation;
  console.log('[MatrizValidation] Classe disponível para uso');
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = MatrizValidation;
}
