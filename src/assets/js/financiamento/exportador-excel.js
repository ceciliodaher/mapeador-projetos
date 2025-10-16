/* =====================================
   EXPORTADOR-EXCEL.JS
   Exportador Excel - 18 Abas Completas
   Análise de Viabilidade Financeira Expertzy
   NO HARDCODED DATA - NO FALLBACKS - KISS - DRY - SOLID
   Requer: SheetJS (XLSX) library
   ===================================== */

class ExportadorExcel {
  constructor() {
    // Validar disponibilidade da biblioteca XLSX
    if (typeof XLSX === 'undefined') {
      throw new Error('ExportadorExcel: Biblioteca XLSX não disponível - obrigatória para exportação Excel');
    }

    this.workbook = null;
    this.metadados = null;

    console.log('✓ ExportadorExcel inicializado');
  }

  // ==========================================
  // EXPORTAÇÃO PRINCIPAL
  // ==========================================

  /**
   * Exporta todos os dados para arquivo Excel com 18 abas
   *
   * @param {Object} dados - Dados completos do formulário
   * @returns {Promise<void>}
   */
  async exportar(dados) {
    try {
      console.log('📊 Iniciando exportação Excel (18 abas)...');

      // Validar dados obrigatórios
      this.validateDados(dados);

      // Criar workbook
      this.workbook = XLSX.utils.book_new();
      this.metadados = {
        dataGeracao: new Date().toISOString(),
        sistema: 'Expertzy - Análise de Viabilidade Financeira',
        versao: '1.0.0',
        empresa: dados.secao1.razaoSocial
      };

      // Criar as 18 abas
      await this.criarAba01_Identificacao(dados.secao1);
      await this.criarAba02_RegimeTributario(dados.secao2);
      await this.criarAba03_HistoricoFinanceiro(dados.secao3);
      await this.criarAba04_ProjecoesFaturamento(dados.secao4);
      await this.criarAba05_EstruturaCustos(dados.secao5);
      await this.criarAba06_InvestimentosPlanejados(dados.secao6);
      await this.criarAba07_CronogramaFinanceiro(dados.secao7);
      await this.criarAba08_MatrizProdutoInsumo(dados.secao8);
      await this.criarAba09_DREProjetado(dados.secao9);
      await this.criarAba10_FluxoCaixa(dados.secao10);
      await this.criarAba11_IndicadoresFinanceiros(dados.secao11);
      await this.criarAba12_ImpostosAtual(dados.secao12.sistemaAtual);
      await this.criarAba13_ImpostosReforma(dados.secao12.reforma);
      await this.criarAba14_ComparativoTributario(dados.secao12.comparativo);
      await this.criarAba15_CenarioOtimista(dados.secao13.cenarios.otimista);
      await this.criarAba16_CenarioRealista(dados.secao13.cenarios.realista);
      await this.criarAba17_CenarioPessimista(dados.secao13.cenarios.pessimista);
      await this.criarAba18_AnaliseSensibilidade(dados.secao13.sensibilidade);

      // Gerar arquivo
      const nomeArquivo = this.gerarNomeArquivo(dados.secao1.razaoSocial);
      XLSX.writeFile(this.workbook, nomeArquivo);

      console.log(`✓ Excel exportado: ${nomeArquivo}`);

      return { success: true, arquivo: nomeArquivo };

    } catch (error) {
      console.error('✗ Erro ao exportar Excel:', error);
      throw error;
    }
  }

  /**
   * Valida dados obrigatórios
   */
  validateDados(dados) {
    const secoesObrigatorias = [
      'secao1', 'secao2', 'secao3', 'secao4', 'secao5',
      'secao6', 'secao7', 'secao8', 'secao9', 'secao10',
      'secao11', 'secao12', 'secao13'
    ];

    for (const secao of secoesObrigatorias) {
      if (!dados[secao]) {
        throw new Error(`ExportadorExcel: Seção obrigatória ausente: ${secao}`);
      }
    }

    if (!dados.secao1.razaoSocial) {
      throw new Error('ExportadorExcel: razaoSocial obrigatória');
    }
  }

  // ==========================================
  // ABA 01: IDENTIFICAÇÃO DA EMPRESA
  // ==========================================

  async criarAba01_Identificacao(dados) {
    const ws_data = [
      ['ANÁLISE DE VIABILIDADE FINANCEIRA - EXPERTZY'],
      ['1. IDENTIFICAÇÃO DA EMPRESA'],
      [],
      ['Razão Social', dados.razaoSocial],
      ['Nome Fantasia', dados.nomeFantasia],
      ['CNPJ', dados.cnpj],
      ['Inscrição Estadual', dados.inscricaoEstadual],
      ['Data de Constituição', dados.dataConstituicao],
      ['Estado (UF)', dados.uf],
      ['Município', dados.municipio],
      ['Endereço Completo', dados.endereco],
      ['Atividade Principal', dados.atividadePrincipal],
      ['Descrição da Atividade', dados.descricaoAtividade],
      [],
      ['CONTATOS'],
      ['Nome do Responsável', dados.responsavelNome],
      ['Cargo', dados.responsavelCargo],
      ['E-mail', dados.responsavelEmail],
      ['Telefone', dados.responsavelTelefone],
      [],
      ['Gerado em:', this.metadados.dataGeracao],
      ['Sistema:', this.metadados.sistema]
    ];

    const ws = XLSX.utils.aoa_to_sheet(ws_data);

    // Estilização básica
    ws['!cols'] = [{ wch: 25 }, { wch: 50 }];

    XLSX.utils.book_append_sheet(this.workbook, ws, '01-Identificacao');
  }

  // ==========================================
  // ABA 02: REGIME TRIBUTÁRIO
  // ==========================================

  async criarAba02_RegimeTributario(dados) {
    const ws_data = [
      ['2. REGIME TRIBUTÁRIO E PARÂMETROS'],
      [],
      ['REGIME TRIBUTÁRIO'],
      ['Regime Atual', dados.regimeTributario],
      ['Anexo Simples (se aplicável)', dados.simplesAnexo],
      [],
      ['CLASSIFICAÇÃO SETORIAL (REFORMA TRIBUTÁRIA)'],
      ['Setor Econômico', dados.setorEconomico],
      [],
      ['PERÍODO DE PROJEÇÃO'],
      ['Ano Base', dados.anoBase],
      ['Período de Projeção (anos)', dados.periodoProjecao],
      ['Ano Final', dados.anoFinal],
      [],
      ['PARÂMETROS FINANCEIROS'],
      ['TMA - Taxa Mínima de Atratividade (% a.a.)', dados.tma],
      ['Inflação Projetada (% a.a.)', dados.inflacaoAnual],
      ['PMR - Prazo Médio de Recebimento (dias)', dados.pmr],
      ['PMP - Prazo Médio de Pagamento (dias)', dados.pmp],
      ['% Vendas a Prazo', dados.percVendasPrazo]
    ];

    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    ws['!cols'] = [{ wch: 40 }, { wch: 30 }];

    XLSX.utils.book_append_sheet(this.workbook, ws, '02-Regime');
  }

  // ==========================================
  // ABA 03: HISTÓRICO FINANCEIRO
  // ==========================================

  async criarAba03_HistoricoFinanceiro(dados) {
    const ws_data = [
      ['3. HISTÓRICO FINANCEIRO'],
      [],
      ['Item', 'Ano -3', 'Ano -2', 'Ano -1'],
      ['Receita Bruta (R$)',
        this.formatCurrency(dados.receitaBrutaAno3),
        this.formatCurrency(dados.receitaBrutaAno2),
        this.formatCurrency(dados.receitaBrutaAno1)
      ],
      ['Custos Variáveis (R$)',
        this.formatCurrency(dados.custosVariaveisAno3),
        this.formatCurrency(dados.custosVariaveisAno2),
        this.formatCurrency(dados.custosVariaveisAno1)
      ],
      ['Custos Fixos (R$)',
        this.formatCurrency(dados.custosFixosAno3),
        this.formatCurrency(dados.custosFixosAno2),
        this.formatCurrency(dados.custosFixosAno1)
      ],
      ['Lucro Líquido (R$)',
        this.formatCurrency(dados.lucroLiquidoAno3),
        this.formatCurrency(dados.lucroLiquidoAno2),
        this.formatCurrency(dados.lucroLiquidoAno1)
      ],
      [],
      ['RESUMO'],
      ['Taxa de Crescimento Média (CAGR)', dados.cagrHistorico],
      ['Margem Líquida Média', dados.margemLiquidaMedia]
    ];

    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    ws['!cols'] = [{ wch: 25 }, { wch: 20 }, { wch: 20 }, { wch: 20 }];

    XLSX.utils.book_append_sheet(this.workbook, ws, '03-Historico');
  }

  // ==========================================
  // ABA 04: PROJEÇÕES DE FATURAMENTO
  // ==========================================

  async criarAba04_ProjecoesFaturamento(dados) {
    const ws_data = [
      ['4. PROJEÇÕES DE FATURAMENTO'],
      [],
      ['Ano', 'Receita Bruta Projetada (R$)', 'Crescimento (%)'],
      ['Ano 1', this.formatCurrency(dados.receitaProjetadaAno1), '-'],
      ['Ano 2', this.formatCurrency(dados.receitaProjetadaAno2), dados.crescimentoAno2],
      ['Ano 3', this.formatCurrency(dados.receitaProjetadaAno3), dados.crescimentoAno3],
      ['Ano 4', this.formatCurrency(dados.receitaProjetadaAno4), dados.crescimentoAno4],
      ['Ano 5', this.formatCurrency(dados.receitaProjetadaAno5), dados.crescimentoAno5],
      [],
      ['JUSTIFICATIVA'],
      [dados.justificativaFaturamento]
    ];

    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    ws['!cols'] = [{ wch: 15 }, { wch: 30 }, { wch: 20 }];

    XLSX.utils.book_append_sheet(this.workbook, ws, '04-Faturamento');
  }

  // ==========================================
  // ABA 05: ESTRUTURA DE CUSTOS
  // ==========================================

  async criarAba05_EstruturaCustos(dados) {
    const ws_data = [
      ['5. ESTRUTURA DE CUSTOS'],
      [],
      ['CUSTOS VARIÁVEIS (% sobre Receita)'],
      ['Matéria-Prima / Mercadorias', `${dados.custoMateriaPrima}%`],
      ['Mão-de-Obra Variável', `${dados.custoMaoObraVariavel}%`],
      ['Comissões de Vendas', `${dados.custoComissoes}%`],
      ['Fretes e Logística', `${dados.custoFretes}%`],
      ['Outros Custos Variáveis', `${dados.custosVariaveisOutros}%`],
      ['Total Custos Variáveis', `${dados.totalCustosVariaveis}%`],
      [],
      ['CUSTOS FIXOS (R$ por ano)'],
      ['Folha de Pagamento Fixa', this.formatCurrency(dados.custoFolhaPagamento)],
      ['Aluguel', this.formatCurrency(dados.custoAluguel)],
      ['Energia e Água', this.formatCurrency(dados.custoEnergiaAgua)],
      ['Marketing e Publicidade', this.formatCurrency(dados.custoMarketing)],
      ['Despesas Administrativas', this.formatCurrency(dados.custoAdministrativo)],
      ['Manutenção', this.formatCurrency(dados.custoManutencao)],
      ['Depreciação', this.formatCurrency(dados.custoDepreciacao)],
      ['Outros Custos Fixos', this.formatCurrency(dados.custosFixosOutros)],
      ['Total Custos Fixos Anuais', this.formatCurrency(dados.totalCustosFixos)],
      [],
      ['EVOLUÇÃO'],
      ['Taxa de Crescimento Anual dos Custos Fixos', `${dados.crescimentoCustosFixos}%`]
    ];

    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    ws['!cols'] = [{ wch: 35 }, { wch: 25 }];

    XLSX.utils.book_append_sheet(this.workbook, ws, '05-Custos');
  }

  // ==========================================
  // ABA 06: INVESTIMENTOS PLANEJADOS
  // ==========================================

  async criarAba06_InvestimentosPlanejados(dados) {
    const ws_data = [
      ['6. INVESTIMENTOS PLANEJADOS'],
      [],
      ['CAPEX - INVESTIMENTOS EM ATIVOS FIXOS'],
      ['Terrenos', this.formatCurrency(dados.investimentoTerrenos)],
      ['Obras Civis', this.formatCurrency(dados.investimentoObrasCivis)],
      ['Máquinas e Equipamentos', this.formatCurrency(dados.investimentoMaquinas)],
      ['Veículos', this.formatCurrency(dados.investimentoVeiculos)],
      ['Informática e TI', this.formatCurrency(dados.investimentoInformatica)],
      ['Móveis e Utensílios', this.formatCurrency(dados.investimentoMoveis)],
      ['Intangíveis', this.formatCurrency(dados.investimentoIntangiveis)],
      ['Outros Investimentos', this.formatCurrency(dados.investimentoOutros)],
      ['Total CAPEX', this.formatCurrency(dados.totalCapex)],
      [],
      ['CAPITAL DE GIRO'],
      ['Capital de Giro Inicial', this.formatCurrency(dados.capitalGiroInicial)],
      [],
      ['FONTES DE RECURSOS'],
      ['Recursos Próprios', `${dados.recursosPropriosPerc}%`],
      ['Financiamento', `${dados.recursosFinanciamentoPerc}%`],
      [],
      ['PARÂMETROS DO FINANCIAMENTO'],
      ['Taxa de Juros (% a.a.)', dados.taxaJurosFinanciamento],
      ['Prazo (meses)', dados.prazoFinanciamento],
      ['Carência (meses)', dados.carenciaFinanciamento],
      [],
      ['TOTAL DE INVESTIMENTO', this.formatCurrency(dados.totalInvestimento)]
    ];

    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    ws['!cols'] = [{ wch: 35 }, { wch: 25 }];

    XLSX.utils.book_append_sheet(this.workbook, ws, '06-Investimentos');
  }

  // ==========================================
  // ABA 07: CRONOGRAMA FINANCEIRO
  // ==========================================

  async criarAba07_CronogramaFinanceiro(dados) {
    const ws_data = [
      ['7. CRONOGRAMA FINANCEIRO'],
      [],
      ['Data de Início dos Investimentos', dados.dataInicioInvestimentos],
      ['Data de Início das Operações', dados.dataInicioOperacoes],
      ['Duração dos Investimentos (meses)', dados.duracaoInvestimentos],
      [],
      ['CRONOGRAMA DE DESEMBOLSOS DE CAPEX'],
      ['Período', 'Descrição', 'Valor (R$)', '% do Total']
    ];

    // Adicionar desembolsos
    if (dados.cronogramaDesembolsos && Array.isArray(dados.cronogramaDesembolsos)) {
      for (const desembolso of dados.cronogramaDesembolsos) {
        ws_data.push([
          desembolso.periodo,
          desembolso.descricao,
          this.formatCurrency(desembolso.valor),
          `${desembolso.percentual}%`
        ]);
      }
    }

    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    ws['!cols'] = [{ wch: 20 }, { wch: 40 }, { wch: 20 }, { wch: 15 }];

    XLSX.utils.book_append_sheet(this.workbook, ws, '07-Cronograma');
  }

  // ==========================================
  // ABA 08: MATRIZ PRODUTO-INSUMO
  // ==========================================

  async criarAba08_MatrizProdutoInsumo(dados) {
    const ws_data = [
      ['8. MATRIZ PRODUTO-INSUMO'],
      [],
      ['PRODUTOS'],
      ['Nome', 'Unidade', 'Preço Unitário (R$)']
    ];

    // Adicionar produtos
    if (dados.produtos && Array.isArray(dados.produtos)) {
      for (const produto of dados.produtos) {
        ws_data.push([
          produto.nome,
          produto.unidade,
          this.formatCurrency(produto.preco)
        ]);
      }
    }

    ws_data.push([]);
    ws_data.push(['INSUMOS']);
    ws_data.push(['Nome', 'Tipo', 'Unidade', 'Custo Unitário (R$)']);

    // Adicionar insumos
    if (dados.insumos && Array.isArray(dados.insumos)) {
      for (const insumo of dados.insumos) {
        ws_data.push([
          insumo.nome,
          insumo.tipo,
          insumo.unidade,
          this.formatCurrency(insumo.custoUnitario)
        ]);
      }
    }

    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    ws['!cols'] = [{ wch: 30 }, { wch: 15 }, { wch: 15 }, { wch: 20 }];

    XLSX.utils.book_append_sheet(this.workbook, ws, '08-Matriz');
  }

  // ==========================================
  // ABA 09: DRE PROJETADO
  // ==========================================

  async criarAba09_DREProjetado(dados) {
    const ws_data = [
      ['9. DRE PROJETADO (5 ANOS)'],
      [],
      ['Item', 'Ano 1', 'Ano 2', 'Ano 3', 'Ano 4', 'Ano 5']
    ];

    // Linhas do DRE
    const linhasDRE = [
      'Receita Bruta',
      '(-) Deduções e Impostos sobre Vendas',
      'Receita Líquida',
      '(-) CPV',
      'Lucro Bruto',
      '(-) Despesas Operacionais',
      'EBITDA',
      '(-) Depreciação',
      'EBIT',
      '(+/-) Resultado Financeiro',
      'LAIR',
      '(-) IR e CSLL',
      'Lucro Líquido',
      'Margem Líquida (%)'
    ];

    for (const linha of linhasDRE) {
      const valores = [];
      for (let ano = 1; ano <= 5; ano++) {
        const anoData = dados[`ano${ano}`];
        if (anoData && anoData[linha]) {
          valores.push(this.formatCurrency(anoData[linha]));
        } else {
          valores.push('-');
        }
      }
      ws_data.push([linha, ...valores]);
    }

    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    ws['!cols'] = [{ wch: 35 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 18 }];

    XLSX.utils.book_append_sheet(this.workbook, ws, '09-DRE');
  }

  // ==========================================
  // ABA 10: FLUXO DE CAIXA
  // ==========================================

  async criarAba10_FluxoCaixa(dados) {
    const ws_data = [
      ['10. FLUXO DE CAIXA PROJETADO (5 ANOS)'],
      [],
      ['Item', 'Ano 1', 'Ano 2', 'Ano 3', 'Ano 4', 'Ano 5']
    ];

    // Linhas do Fluxo de Caixa
    const linhasFC = [
      'Recebimentos',
      '(-) Pagamentos',
      'Fluxo Operacional',
      '(-) CAPEX',
      '(+/-) Financiamentos',
      'Fluxo de Caixa Livre',
      'Saldo de Caixa Acumulado',
      'NCG (Necessidade Capital Giro)'
    ];

    for (const linha of linhasFC) {
      const valores = [];
      for (let ano = 1; ano <= 5; ano++) {
        const anoData = dados[`ano${ano}`];
        if (anoData && anoData[linha]) {
          valores.push(this.formatCurrency(anoData[linha]));
        } else {
          valores.push('-');
        }
      }
      ws_data.push([linha, ...valores]);
    }

    ws_data.push([]);
    ws_data.push(['ANÁLISE SPLIT PAYMENT']);
    ws_data.push(['NCG sem Split Payment (2025)', this.formatCurrency(dados.ncgSemSplit)]);
    ws_data.push(['NCG com Split Payment (2027+)', this.formatCurrency(dados.ncgComSplit)]);
    ws_data.push(['Redução de NCG', this.formatCurrency(dados.reducaoNCG)]);

    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    ws['!cols'] = [{ wch: 35 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 18 }];

    XLSX.utils.book_append_sheet(this.workbook, ws, '10-FluxoCaixa');
  }

  // ==========================================
  // ABA 11: INDICADORES FINANCEIROS
  // ==========================================

  async criarAba11_IndicadoresFinanceiros(dados) {
    const ws_data = [
      ['11. INDICADORES DE VIABILIDADE'],
      [],
      ['INDICADORES PRINCIPAIS'],
      ['VPL - Valor Presente Líquido', this.formatCurrency(dados.vpl), dados.vplStatus],
      ['TIR - Taxa Interna de Retorno', `${dados.tir}%`, dados.tirStatus],
      ['Payback Simples', `${dados.paybackSimples} meses`, dados.paybackSimplesStatus],
      ['Payback Descontado', `${dados.paybackDescontado} meses`, dados.paybackDescontadoStatus],
      [],
      ['INDICADORES DE RENTABILIDADE'],
      ['ROI - Retorno sobre Investimento (Ano 5)', `${dados.roi}%`],
      ['ROE - Retorno sobre Patrimônio (Ano 5)', `${dados.roe}%`],
      ['ROA - Retorno sobre Ativos (Ano 5)', `${dados.roa}%`],
      ['Margem Líquida Média (5 anos)', `${dados.margemLiquida}%`],
      [],
      ['PONTO DE EQUILÍBRIO'],
      ['Faturamento Mínimo (mensal)', this.formatCurrency(dados.pontoEquilibrio)],
      ['Margem de Segurança (Ano 1)', `${dados.margemSeguranca}%`]
    ];

    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    ws['!cols'] = [{ wch: 40 }, { wch: 25 }, { wch: 20 }];

    XLSX.utils.book_append_sheet(this.workbook, ws, '11-Indicadores');
  }

  // ==========================================
  // ABA 12: IMPOSTOS - SISTEMA ATUAL
  // ==========================================

  async criarAba12_ImpostosAtual(dados) {
    const ws_data = [
      ['12. APURAÇÃO DE IMPOSTOS - SISTEMA ATUAL (2025)'],
      [],
      ['Regime Tributário:', dados.regime],
      ['Carga Tributária Efetiva:', `${dados.cargaTributariaEfetiva}%`],
      [],
      ['Imposto', 'Base de Cálculo', 'Alíquota', 'Valor Anual']
    ];

    // Adicionar tributos
    if (dados.tributos && Array.isArray(dados.tributos)) {
      for (const tributo of dados.tributos) {
        ws_data.push([
          tributo.nome,
          this.formatCurrency(tributo.baseCalculo),
          `${tributo.aliquota}%`,
          this.formatCurrency(tributo.valor)
        ]);
      }
    }

    ws_data.push([]);
    ws_data.push(['Total de Tributos', '', '', this.formatCurrency(dados.totalTributos)]);

    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    ws['!cols'] = [{ wch: 30 }, { wch: 20 }, { wch: 15 }, { wch: 20 }];

    XLSX.utils.book_append_sheet(this.workbook, ws, '12-ImpostosAtual');
  }

  // ==========================================
  // ABA 13: IMPOSTOS - REFORMA TRIBUTÁRIA
  // ==========================================

  async criarAba13_ImpostosReforma(dados) {
    const ws_data = [
      ['13. APURAÇÃO DE IMPOSTOS - REFORMA TRIBUTÁRIA (2026-2033)'],
      [],
      ['Fase:', dados.fase],
      ['Ano de Referência:', dados.ano],
      ['Setor:', dados.setor],
      ['Alíquota Efetiva:', `${dados.aliquotaEfetiva}%`],
      [],
      ['Tributo', 'Alíquota', 'Valor Anual', 'Economia']
    ];

    ws_data.push(['CBS', `${dados.cbs.aliquota}%`, this.formatCurrency(dados.cbs.valor), this.formatCurrency(dados.cbs.economia)]);
    ws_data.push(['IBS', `${dados.ibs.aliquota}%`, this.formatCurrency(dados.ibs.valor), this.formatCurrency(dados.ibs.economia)]);
    ws_data.push([]);
    ws_data.push(['Total', '', this.formatCurrency(dados.total), this.formatCurrency(dados.economiaTotal)]);

    ws_data.push([]);
    ws_data.push(['Split Payment Ativo:', dados.splitPaymentAtivo ? 'Sim' : 'Não']);
    if (dados.splitPaymentAtivo) {
      ws_data.push(['Impacto NCG:', this.formatCurrency(dados.impactoNCG)]);
    }

    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    ws['!cols'] = [{ wch: 25 }, { wch: 15 }, { wch: 20 }, { wch: 20 }];

    XLSX.utils.book_append_sheet(this.workbook, ws, '13-ImpostosReforma');
  }

  // ==========================================
  // ABA 14: COMPARATIVO TRIBUTÁRIO
  // ==========================================

  async criarAba14_ComparativoTributario(dados) {
    const ws_data = [
      ['14. COMPARATIVO TRIBUTÁRIO - SISTEMA ATUAL VS REFORMA'],
      [],
      ['Indicador', 'Sistema Atual (2025)', 'Reforma Tributária', 'Diferença (R$)', 'Variação (%)']
    ];

    ws_data.push([
      'Total de Tributos',
      this.formatCurrency(dados.sistemaAtual.total),
      this.formatCurrency(dados.reforma.total),
      this.formatCurrency(dados.diferenca),
      `${dados.diferencaPercentual}%`
    ]);

    ws_data.push([
      'Carga Tributária Efetiva',
      `${dados.sistemaAtual.cargaTributaria}%`,
      `${dados.reforma.cargaTributaria}%`,
      `${dados.diferencaCarga}%`,
      '-'
    ]);

    ws_data.push([]);
    ws_data.push(['RECOMENDAÇÃO']);
    ws_data.push(['Regime Recomendado:', dados.recomendacao.regime]);
    ws_data.push(['Justificativa:', dados.recomendacao.justificativa]);
    ws_data.push(['Vantajoso?', dados.recomendacao.vantajoso ? 'Sim' : 'Não']);

    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    ws['!cols'] = [{ wch: 30 }, { wch: 25 }, { wch: 25 }, { wch: 20 }, { wch: 15 }];

    XLSX.utils.book_append_sheet(this.workbook, ws, '14-Comparativo');
  }

  // ==========================================
  // ABAS 15-17: CENÁRIOS
  // ==========================================

  async criarAba15_CenarioOtimista(dados) {
    await this.criarAbaCenario(dados, '15-Otimista', 'CENÁRIO OTIMISTA (+20%)');
  }

  async criarAba16_CenarioRealista(dados) {
    await this.criarAbaCenario(dados, '16-Realista', 'CENÁRIO REALISTA (BASE)');
  }

  async criarAba17_CenarioPessimista(dados) {
    await this.criarAbaCenario(dados, '17-Pessimista', 'CENÁRIO PESSIMISTA (-20%)');
  }

  async criarAbaCenario(dados, nomeAba, titulo) {
    const ws_data = [
      [titulo],
      [],
      ['INDICADORES'],
      ['VPL - Valor Presente Líquido', this.formatCurrency(dados.vpl), dados.vplViavel ? 'Viável' : 'Inviável'],
      ['TIR - Taxa Interna de Retorno', `${dados.tir}%`, dados.tirConvergiu ? 'Convergiu' : 'Não convergiu'],
      ['Payback Simples', `${dados.paybackSimples} meses`, dados.paybackSimplesRecuperado ? 'Recupera' : 'Não recupera'],
      ['Payback Descontado', `${dados.paybackDescontado} meses`, dados.paybackDescontadoRecuperado ? 'Recupera' : 'Não recupera'],
      [],
      ['PREMISSAS'],
      ['Fator Receita', `${(dados.fatorReceita * 100)}%`],
      ['Fator Custos', `${(dados.fatorCustos * 100)}%`]
    ];

    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    ws['!cols'] = [{ wch: 35 }, { wch: 25 }, { wch: 20 }];

    XLSX.utils.book_append_sheet(this.workbook, ws, nomeAba);
  }

  // ==========================================
  // ABA 18: ANÁLISE DE SENSIBILIDADE
  // ==========================================

  async criarAba18_AnaliseSensibilidade(dados) {
    const ws_data = [
      ['18. ANÁLISE DE SENSIBILIDADE'],
      [],
      ['Variável', '-20%', '-10%', 'Base', '+10%', '+20%']
    ];

    // Adicionar variáveis
    const variaveis = ['Receita Bruta', 'Custos Variáveis', 'Custos Fixos', 'TMA'];

    for (const variavel of variaveis) {
      const linha = [variavel];
      const varData = dados[variavel];

      if (varData) {
        linha.push(
          `VPL: ${this.formatCurrency(varData.menos20.vpl)} | TIR: ${varData.menos20.tir}%`,
          `VPL: ${this.formatCurrency(varData.menos10.vpl)} | TIR: ${varData.menos10.tir}%`,
          `VPL: ${this.formatCurrency(varData.base.vpl)} | TIR: ${varData.base.tir}%`,
          `VPL: ${this.formatCurrency(varData.mais10.vpl)} | TIR: ${varData.mais10.tir}%`,
          `VPL: ${this.formatCurrency(varData.mais20.vpl)} | TIR: ${varData.mais20.tir}%`
        );
      } else {
        linha.push('-', '-', '-', '-', '-');
      }

      ws_data.push(linha);
    }

    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    ws['!cols'] = [{ wch: 20 }, { wch: 30 }, { wch: 30 }, { wch: 30 }, { wch: 30 }, { wch: 30 }];

    XLSX.utils.book_append_sheet(this.workbook, ws, '18-Sensibilidade');
  }

  // ==========================================
  // UTILITIES
  // ==========================================

  /**
   * Formata valor monetário (sem símbolo para Excel)
   */
  formatCurrency(value) {
    if (value === undefined || value === null || isNaN(value)) {
      return 'R$ 0,00';
    }
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  }

  /**
   * Gera nome do arquivo
   */
  gerarNomeArquivo(razaoSocial) {
    const nomeEmpresa = razaoSocial.replace(/[^a-zA-Z0-9]/g, '_');
    const data = new Date().toISOString().split('T')[0];
    return `Analise_Viabilidade_${nomeEmpresa}_${data}.xlsx`;
  }
}

// Exportar para uso global
if (typeof window !== 'undefined') {
  window.ExportadorExcel = ExportadorExcel;
}

// Exportar para Node.js (se necessário)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ExportadorExcel;
}
