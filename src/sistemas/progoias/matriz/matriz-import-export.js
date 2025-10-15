/* =====================================
   MATRIZ-IMPORT-EXPORT.JS
   Import/Export de receitas (JSON/CSV)
   NO FALLBACKS - Dados explícitos apenas
   ===================================== */

class MatrizImportExport {
  constructor(stateManager, dbManager) {
    if (!stateManager) {
      throw new Error('stateManager é obrigatório');
    }

    if (!dbManager) {
      throw new Error('dbManager é obrigatório');
    }

    this.stateManager = stateManager;
    this.dbManager = dbManager;
  }

  // ==================== EXPORT ====================

  /**
   * Exportar receitas para JSON
   */
  exportJSON() {
    const produtos = this.stateManager.get('produtos');
    const insumos = this.stateManager.get('insumos');
    const receitas = this.stateManager.get('receitas');

    const data = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      produtos: produtos.map(p => ({
        id: p.id,
        nome: p.nome,
        ncm: p.ncm,
        unidade: p.unidade,
        precoVenda: p.precoVenda,
        producaoMensal: p.producaoMensal
      })),
      insumos: insumos.map(i => ({
        id: i.id,
        nome: i.nome,
        tipo: i.tipo,
        unidade: i.unidade,
        custoUnitario: i.custoUnitario,
        isGeral: i.isGeral
      })),
      receitas: Array.from(receitas.entries()).map(([key, quantidade]) => {
        const [produtoId, insumoId] = key.split('-');
        return {
          produtoId,
          insumoId,
          quantidade
        };
      })
    };

    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const filename = `matriz-receitas-${this.formatDateForFilename()}.json`;

    this.downloadFile(blob, filename);

    return {
      success: true,
      filename,
      totalReceitas: receitas.size
    };
  }

  /**
   * Exportar receitas para CSV
   */
  exportCSV() {
    const produtos = this.stateManager.get('produtos');
    const insumos = this.stateManager.get('insumos');
    const receitas = this.stateManager.get('receitas');

    // Cabeçalho CSV
    const header = [
      'Produto ID',
      'Produto Nome',
      'Produto Unidade',
      'Insumo ID',
      'Insumo Nome',
      'Insumo Tipo',
      'Insumo Unidade',
      'Quantidade por Unidade',
      'Custo Unitário Insumo',
      'Custo Calculado'
    ];

    // Linhas de dados
    const rows = [];

    for (const [key, quantidade] of receitas.entries()) {
      const [produtoId, insumoId] = key.split('-');

      const produto = produtos.find(p => p.id === produtoId);
      const insumo = insumos.find(i => i.id === insumoId);

      if (!produto || !insumo) continue;

      const custoCalculado = quantidade * insumo.custoUnitario;

      rows.push([
        produtoId,
        produto.nome,
        produto.unidade,
        insumoId,
        insumo.nome,
        insumo.tipo,
        insumo.unidade,
        quantidade,
        insumo.custoUnitario,
        custoCalculado.toFixed(2)
      ]);
    }

    // Combinar cabeçalho + linhas
    const csvContent = [header, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const filename = `matriz-receitas-${this.formatDateForFilename()}.csv`;

    this.downloadFile(blob, filename);

    return {
      success: true,
      filename,
      totalReceitas: rows.length
    };
  }

  // ==================== IMPORT ====================

  /**
   * Importar receitas de JSON
   */
  async importJSON(fileContent) {
    try {
      const data = JSON.parse(fileContent);

      // Validar estrutura básica
      if (!data.receitas || !Array.isArray(data.receitas)) {
        throw new Error('Formato JSON inválido: campo "receitas" não encontrado ou não é array');
      }

      // Confirmar sobrescrita
      const currentReceitas = this.stateManager.get('receitas');
      if (currentReceitas.size > 0) {
        const confirmMessage = `Existem ${currentReceitas.size} receitas cadastradas.\n` +
                              `A importação irá ADICIONAR ${data.receitas.length} receitas.\n` +
                              `Continuar?`;

        if (!confirm(confirmMessage)) {
          return {
            success: false,
            cancelled: true
          };
        }
      }

      // Importar receitas
      let imported = 0;
      let skipped = 0;
      const errors = [];

      for (const receita of data.receitas) {
        try {
          // Validar campos obrigatórios
          if (!receita.produtoId || !receita.insumoId || receita.quantidade === undefined) {
            skipped++;
            errors.push(`Receita inválida: faltam campos obrigatórios`);
            continue;
          }

          // Validar que quantidade é número positivo
          const quantidade = parseFloat(receita.quantidade);
          if (isNaN(quantidade) || quantidade <= 0) {
            skipped++;
            errors.push(`Quantidade inválida para ${receita.produtoId}-${receita.insumoId}: ${receita.quantidade}`);
            continue;
          }

          // Adicionar ao state
          this.stateManager.setReceita(
            receita.produtoId,
            receita.insumoId,
            quantidade
          );

          imported++;

        } catch (error) {
          skipped++;
          errors.push(`Erro ao importar ${receita.produtoId}-${receita.insumoId}: ${error.message}`);
        }
      }

      // Salvar no IndexedDB
      if (imported > 0) {
        await this.saveAllReceitas();
      }

      return {
        success: true,
        imported,
        skipped,
        errors: errors.length > 0 ? errors : null
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Importar receitas de CSV
   */
  async importCSV(fileContent) {
    try {
      const lines = fileContent.split('\n').filter(line => line.trim());

      if (lines.length < 2) {
        throw new Error('Arquivo CSV vazio ou apenas com cabeçalho');
      }

      // Ignorar cabeçalho
      const dataLines = lines.slice(1);

      let imported = 0;
      let skipped = 0;
      const errors = [];

      for (const line of dataLines) {
        try {
          // Parse CSV (simplificado - não lida com vírgulas dentro de aspas)
          const fields = line.split(',').map(field => field.replace(/^"|"$/g, '').trim());

          if (fields.length < 8) {
            skipped++;
            continue;
          }

          const [produtoId, , , insumoId, , , , quantidade] = fields;

          if (!produtoId || !insumoId || !quantidade) {
            skipped++;
            continue;
          }

          const qtd = parseFloat(quantidade);
          if (isNaN(qtd) || qtd <= 0) {
            skipped++;
            errors.push(`Quantidade inválida na linha: ${line.substring(0, 50)}...`);
            continue;
          }

          this.stateManager.setReceita(produtoId, insumoId, qtd);
          imported++;

        } catch (error) {
          skipped++;
          errors.push(`Erro ao processar linha: ${error.message}`);
        }
      }

      // Salvar no IndexedDB
      if (imported > 0) {
        await this.saveAllReceitas();
      }

      return {
        success: true,
        imported,
        skipped,
        errors: errors.length > 0 ? errors : null
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ==================== UI HELPERS ====================

  /**
   * Mostrar diálogo de importação
   */
  showImportDialog() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,.csv';

    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (event) => {
        const content = event.target.result;

        let result;
        if (file.name.endsWith('.json')) {
          result = await this.importJSON(content);
        } else if (file.name.endsWith('.csv')) {
          result = await this.importCSV(content);
        } else {
          alert('Formato não suportado. Use .json ou .csv');
          return;
        }

        this.showImportResult(result);
      };

      reader.readAsText(file);
    };

    input.click();
  }

  /**
   * Mostrar diálogo de exportação
   */
  showExportDialog() {
    const format = confirm('Exportar como JSON?\n\nOK = JSON\nCancelar = CSV');

    let result;
    if (format) {
      result = this.exportJSON();
    } else {
      result = this.exportCSV();
    }

    if (result.success) {
      alert(`✅ Exportação concluída!\n\nArquivo: ${result.filename}\nReceitas: ${result.totalReceitas}`);
    }
  }

  /**
   * Mostrar resultado da importação
   */
  showImportResult(result) {
    if (result.cancelled) {
      return;
    }

    if (!result.success) {
      alert(`❌ Erro na importação:\n\n${result.error}`);
      return;
    }

    let message = `✅ Importação concluída!\n\n`;
    message += `Importadas: ${result.imported}\n`;

    if (result.skipped > 0) {
      message += `Ignoradas: ${result.skipped}\n`;
    }

    if (result.errors && result.errors.length > 0) {
      message += `\n⚠️ Avisos:\n${result.errors.slice(0, 3).join('\n')}`;
      if (result.errors.length > 3) {
        message += `\n... e mais ${result.errors.length - 3} avisos`;
      }
    }

    alert(message);

    // Recarregar UI
    if (result.imported > 0) {
      window.location.reload();
    }
  }

  // ==================== PERSISTENCE ====================

  /**
   * Salvar todas as receitas no IndexedDB
   */
  async saveAllReceitas() {
    const receitas = this.stateManager.get('receitas');

    const promises = [];

    for (const [key, quantidade] of receitas.entries()) {
      const [produtoId, insumoId] = key.split('-');

      const receitaData = {
        produtoId,
        insumoId,
        quantidadePorUnidade: quantidade,
        updatedAt: Date.now()
      };

      promises.push(
        this.dbManager.createReceita(receitaData)
      );
    }

    await Promise.all(promises);

    this.stateManager.set('isDirty', false);
    this.stateManager.set('lastSaved', Date.now());
  }

  // ==================== HELPERS ====================

  /**
   * Download de arquivo
   */
  downloadFile(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Formatar data para nome de arquivo
   */
  formatDateForFilename() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');

    return `${year}-${month}-${day}_${hours}h${minutes}`;
  }
}

// Exportar para uso global
if (typeof window !== 'undefined') {
  window.MatrizImportExport = MatrizImportExport;
  console.log('[MatrizImportExport] Classe disponível para uso');
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = MatrizImportExport;
}
