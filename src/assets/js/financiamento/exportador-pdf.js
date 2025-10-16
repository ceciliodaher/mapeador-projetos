/* =====================================
   EXPORTADOR-PDF.JS
   Exportador PDF - Relatório Completo
   Análise de Viabilidade Financeira Expertzy
   NO HARDCODED DATA - NO FALLBACKS - KISS - DRY - SOLID
   Requer: jsPDF library
   ===================================== */

class ExportadorPDF {
  constructor() {
    // Validar disponibilidade da biblioteca jsPDF
    if (typeof jspdf === 'undefined' && typeof jsPDF === 'undefined') {
      throw new Error('ExportadorPDF: Biblioteca jsPDF não disponível - obrigatória para exportação PDF');
    }

    this.pdf = null;
    this.metadados = null;
    this.paginaAtual = 0;
    this.margemEsquerda = 20;
    this.margemDireita = 20;
    this.margemSuperior = 20;
    this.margemInferior = 20;
    this.larguraPagina = 210; // A4
    this.alturaPagina = 297; // A4
    this.yAtual = this.margemSuperior;

    // Cores Expertzy
    this.corPrimaria = [255, 0, 45]; // #FF002D
    this.corSecundaria = [9, 26, 48]; // #091A30
    this.corCinza = [128, 128, 128];

    console.log('✓ ExportadorPDF inicializado');
  }

  // ==========================================
  // EXPORTAÇÃO PRINCIPAL
  // ==========================================

  /**
   * Exporta todos os dados para arquivo PDF
   *
   * @param {Object} dados - Dados completos do formulário
   * @returns {Promise<void>}
   */
  async exportar(dados) {
    try {
      console.log('📄 Iniciando exportação PDF...');

      // Validar dados obrigatórios
      this.validateDados(dados);

      // Criar PDF
      const { jsPDF } = typeof jspdf !== 'undefined' ? jspdf : window;
      this.pdf = new jsPDF();
      this.paginaAtual = 1;

      this.metadados = {
        dataGeracao: new Date().toISOString(),
        sistema: 'Expertzy - Análise de Viabilidade Financeira',
        versao: '1.0.0',
        empresa: dados.secao1.razaoSocial
      };

      // Criar capa
      this.criarCapa(dados.secao1);

      // Criar índice
      this.novaPagina();
      this.criarIndice();

      // Criar seções
      this.novaPagina();
      await this.criarSecao01_Identificacao(dados.secao1);

      this.novaPagina();
      await this.criarSecao02_RegimeTributario(dados.secao2);

      this.novaPagina();
      await this.criarSecao03_HistoricoFinanceiro(dados.secao3);

      this.novaPagina();
      await this.criarSecao04_ProjecoesFaturamento(dados.secao4);

      this.novaPagina();
      await this.criarSecao05_EstruturaCustos(dados.secao5);

      this.novaPagina();
      await this.criarSecao06_Investimentos(dados.secao6);

      this.novaPagina();
      await this.criarSecao07_Indicadores(dados.secao11);

      this.novaPagina();
      await this.criarSecao08_Cenarios(dados.secao13);

      this.novaPagina();
      await this.criarSecao09_Conclusao(dados);

      // Gerar arquivo
      const nomeArquivo = this.gerarNomeArquivo(dados.secao1.razaoSocial);
      this.pdf.save(nomeArquivo);

      console.log(`✓ PDF exportado: ${nomeArquivo}`);

      return { success: true, arquivo: nomeArquivo };

    } catch (error) {
      console.error('✗ Erro ao exportar PDF:', error);
      throw error;
    }
  }

  /**
   * Valida dados obrigatórios
   */
  validateDados(dados) {
    if (!dados || typeof dados !== 'object') {
      throw new Error('ExportadorPDF: dados obrigatórios ausentes');
    }

    if (!dados.secao1 || !dados.secao1.razaoSocial) {
      throw new Error('ExportadorPDF: razaoSocial obrigatória');
    }
  }

  // ==========================================
  // ESTRUTURA DO PDF
  // ==========================================

  /**
   * Cria capa do relatório
   */
  criarCapa(dados) {
    // Background header
    this.pdf.setFillColor(...this.corPrimaria);
    this.pdf.rect(0, 0, this.larguraPagina, 80, 'F');

    // Título
    this.pdf.setTextColor(255, 255, 255);
    this.pdf.setFontSize(28);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('ANÁLISE DE', this.larguraPagina / 2, 35, { align: 'center' });
    this.pdf.text('VIABILIDADE FINANCEIRA', this.larguraPagina / 2, 50, { align: 'center' });

    // Empresa
    this.pdf.setTextColor(...this.corSecundaria);
    this.pdf.setFontSize(20);
    this.pdf.setFont('helvetica', 'normal');
    this.yAtual = 110;
    const empresaLines = this.pdf.splitTextToSize(dados.razaoSocial, 170);
    this.pdf.text(empresaLines, this.larguraPagina / 2, this.yAtual, { align: 'center' });

    // CNPJ
    this.pdf.setFontSize(12);
    this.pdf.setTextColor(...this.corCinza);
    this.pdf.text(`CNPJ: ${dados.cnpj}`, this.larguraPagina / 2, 130, { align: 'center' });

    // Data
    this.pdf.setFontSize(10);
    const dataFormatada = new Date().toLocaleDateString('pt-BR');
    this.pdf.text(`Gerado em: ${dataFormatada}`, this.larguraPagina / 2, 270, { align: 'center' });

    // Footer
    this.pdf.setFontSize(8);
    this.pdf.text('Elaborado por Expertzy', this.larguraPagina / 2, 285, { align: 'center' });
    this.pdf.text('Sistema de Análise de Viabilidade Financeira', this.larguraPagina / 2, 290, { align: 'center' });
  }

  /**
   * Cria índice
   */
  criarIndice() {
    this.adicionarTitulo('ÍNDICE', true);

    const itens = [
      '1. Identificação da Empresa',
      '2. Regime Tributário e Parâmetros',
      '3. Histórico Financeiro',
      '4. Projeções de Faturamento',
      '5. Estrutura de Custos',
      '6. Investimentos Planejados',
      '7. Indicadores de Viabilidade',
      '8. Análise de Cenários',
      '9. Conclusão e Recomendações'
    ];

    this.pdf.setFontSize(11);
    this.pdf.setTextColor(...this.corSecundaria);

    for (const item of itens) {
      this.verificarEspaco(10);
      this.pdf.text(item, this.margemEsquerda, this.yAtual);
      this.yAtual += 10;
    }
  }

  /**
   * Cria nova página
   */
  novaPagina() {
    this.pdf.addPage();
    this.paginaAtual++;
    this.yAtual = this.margemSuperior;
    this.adicionarRodape();
  }

  /**
   * Adiciona rodapé com número de página
   */
  adicionarRodape() {
    this.pdf.setFontSize(8);
    this.pdf.setTextColor(...this.corCinza);
    this.pdf.text(
      `Página ${this.paginaAtual}`,
      this.larguraPagina / 2,
      this.alturaPagina - 10,
      { align: 'center' }
    );
    this.pdf.text(
      `Expertzy - Análise de Viabilidade Financeira`,
      this.larguraPagina / 2,
      this.alturaPagina - 5,
      { align: 'center' }
    );
  }

  /**
   * Verifica espaço disponível e cria nova página se necessário
   */
  verificarEspaco(espacoNecessario) {
    if (this.yAtual + espacoNecessario > this.alturaPagina - this.margemInferior - 20) {
      this.novaPagina();
    }
  }

  // ==========================================
  // COMPONENTES DE FORMATAÇÃO
  // ==========================================

  /**
   * Adiciona título de seção
   */
  adicionarTitulo(texto, principal = false) {
    this.verificarEspaco(20);

    if (principal) {
      this.pdf.setFillColor(...this.corPrimaria);
      this.pdf.rect(this.margemEsquerda - 5, this.yAtual - 5, this.larguraPagina - 30, 12, 'F');
      this.pdf.setTextColor(255, 255, 255);
      this.pdf.setFontSize(16);
    } else {
      this.pdf.setTextColor(...this.corPrimaria);
      this.pdf.setFontSize(14);
    }

    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text(texto, this.margemEsquerda, this.yAtual + 5);
    this.yAtual += 15;

    // Reset
    this.pdf.setTextColor(...this.corSecundaria);
    this.pdf.setFont('helvetica', 'normal');
  }

  /**
   * Adiciona subtítulo
   */
  adicionarSubtitulo(texto) {
    this.verificarEspaco(10);
    this.pdf.setFontSize(12);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setTextColor(...this.corSecundaria);
    this.pdf.text(texto, this.margemEsquerda, this.yAtual);
    this.yAtual += 8;
    this.pdf.setFont('helvetica', 'normal');
  }

  /**
   * Adiciona campo (label: valor)
   */
  adicionarCampo(label, valor) {
    this.verificarEspaco(8);
    this.pdf.setFontSize(10);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setTextColor(...this.corSecundaria);
    this.pdf.text(`${label}:`, this.margemEsquerda, this.yAtual);

    this.pdf.setFont('helvetica', 'normal');
    this.pdf.setTextColor(50, 50, 50);
    const valorTexto = valor !== undefined && valor !== null ? String(valor) : '-';
    this.pdf.text(valorTexto, this.margemEsquerda + 50, this.yAtual);
    this.yAtual += 7;
  }

  /**
   * Adiciona tabela simples
   */
  adicionarTabela(cabecalho, linhas) {
    this.verificarEspaco(30);

    const larguraColuna = (this.larguraPagina - this.margemEsquerda - this.margemDireita) / cabecalho.length;
    let x = this.margemEsquerda;

    // Cabeçalho
    this.pdf.setFillColor(...this.corPrimaria);
    this.pdf.rect(this.margemEsquerda, this.yAtual, this.larguraPagina - this.margemEsquerda - this.margemDireita, 8, 'F');
    this.pdf.setTextColor(255, 255, 255);
    this.pdf.setFontSize(9);
    this.pdf.setFont('helvetica', 'bold');

    for (const col of cabecalho) {
      this.pdf.text(col, x + 2, this.yAtual + 5);
      x += larguraColuna;
    }

    this.yAtual += 10;

    // Linhas
    this.pdf.setTextColor(...this.corSecundaria);
    this.pdf.setFont('helvetica', 'normal');

    for (const linha of linhas) {
      this.verificarEspaco(8);
      x = this.margemEsquerda;

      for (const celula of linha) {
        const texto = celula !== undefined && celula !== null ? String(celula) : '-';
        this.pdf.text(texto, x + 2, this.yAtual + 5);
        x += larguraColuna;
      }

      this.yAtual += 7;
    }

    this.yAtual += 5;
  }

  /**
   * Adiciona box de destaque
   */
  adicionarBoxDestaque(titulo, conteudo, cor = 'verde') {
    this.verificarEspaco(30);

    const cores = {
      verde: [232, 245, 233],
      amarelo: [255, 243, 224],
      vermelho: [255, 235, 238],
      azul: [227, 242, 253]
    };

    this.pdf.setFillColor(...cores[cor]);
    const altura = 20 + (conteudo.split('\n').length * 7);
    this.pdf.rect(this.margemEsquerda, this.yAtual, this.larguraPagina - this.margemEsquerda - this.margemDireita, altura, 'F');

    this.pdf.setFontSize(11);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setTextColor(...this.corSecundaria);
    this.pdf.text(titulo, this.margemEsquerda + 5, this.yAtual + 7);

    this.pdf.setFontSize(10);
    this.pdf.setFont('helvetica', 'normal');
    const linhas = this.pdf.splitTextToSize(conteudo, this.larguraPagina - this.margemEsquerda - this.margemDireita - 10);
    this.pdf.text(linhas, this.margemEsquerda + 5, this.yAtual + 15);

    this.yAtual += altura + 5;
  }

  // ==========================================
  // SEÇÕES DO RELATÓRIO
  // ==========================================

  /**
   * Seção 1: Identificação
   */
  async criarSecao01_Identificacao(dados) {
    this.adicionarTitulo('1. IDENTIFICAÇÃO DA EMPRESA', true);

    this.adicionarSubtitulo('Dados Cadastrais');
    this.adicionarCampo('Razão Social', dados.razaoSocial);
    this.adicionarCampo('Nome Fantasia', dados.nomeFantasia);
    this.adicionarCampo('CNPJ', dados.cnpj);
    this.adicionarCampo('Inscrição Estadual', dados.inscricaoEstadual);
    this.adicionarCampo('Data de Constituição', dados.dataConstituicao);

    this.yAtual += 5;
    this.adicionarSubtitulo('Localização');
    this.adicionarCampo('Estado (UF)', dados.uf);
    this.adicionarCampo('Município', dados.municipio);
    this.adicionarCampo('Endereço', dados.endereco);

    this.yAtual += 5;
    this.adicionarSubtitulo('Atividade');
    this.adicionarCampo('Atividade Principal', dados.atividadePrincipal);
    this.adicionarCampo('Descrição', dados.descricaoAtividade);

    this.yAtual += 5;
    this.adicionarSubtitulo('Responsável');
    this.adicionarCampo('Nome', dados.responsavelNome);
    this.adicionarCampo('Cargo', dados.responsavelCargo);
    this.adicionarCampo('E-mail', dados.responsavelEmail);
    this.adicionarCampo('Telefone', dados.responsavelTelefone);
  }

  /**
   * Seção 2: Regime Tributário
   */
  async criarSecao02_RegimeTributario(dados) {
    this.adicionarTitulo('2. REGIME TRIBUTÁRIO E PARÂMETROS', true);

    this.adicionarSubtitulo('Regime Tributário');
    this.adicionarCampo('Regime Atual', dados.regimeTributario);
    if (dados.simplesAnexo) {
      this.adicionarCampo('Anexo Simples', dados.simplesAnexo);
    }
    this.adicionarCampo('Setor Econômico', dados.setorEconomico);

    this.yAtual += 5;
    this.adicionarSubtitulo('Período de Projeção');
    this.adicionarCampo('Ano Base', dados.anoBase);
    this.adicionarCampo('Período (anos)', dados.periodoProjecao);
    this.adicionarCampo('Ano Final', dados.anoFinal);

    this.yAtual += 5;
    this.adicionarSubtitulo('Parâmetros Financeiros');
    this.adicionarCampo('TMA (% a.a.)', dados.tma);
    this.adicionarCampo('Inflação Projetada (% a.a.)', dados.inflacaoAnual);
    this.adicionarCampo('PMR (dias)', dados.pmr);
    this.adicionarCampo('PMP (dias)', dados.pmp);
    this.adicionarCampo('% Vendas a Prazo', dados.percVendasPrazo);
  }

  /**
   * Seção 3: Histórico Financeiro
   */
  async criarSecao03_HistoricoFinanceiro(dados) {
    this.adicionarTitulo('3. HISTÓRICO FINANCEIRO', true);

    const cabecalho = ['Item', 'Ano -3', 'Ano -2', 'Ano -1'];
    const linhas = [
      ['Receita Bruta', this.formatCurrency(dados.receitaBrutaAno3), this.formatCurrency(dados.receitaBrutaAno2), this.formatCurrency(dados.receitaBrutaAno1)],
      ['Custos Variáveis', this.formatCurrency(dados.custosVariaveisAno3), this.formatCurrency(dados.custosVariaveisAno2), this.formatCurrency(dados.custosVariaveisAno1)],
      ['Custos Fixos', this.formatCurrency(dados.custosFixosAno3), this.formatCurrency(dados.custosFixosAno2), this.formatCurrency(dados.custosFixosAno1)],
      ['Lucro Líquido', this.formatCurrency(dados.lucroLiquidoAno3), this.formatCurrency(dados.lucroLiquidoAno2), this.formatCurrency(dados.lucroLiquidoAno1)]
    ];

    this.adicionarTabela(cabecalho, linhas);

    this.yAtual += 5;
    this.adicionarSubtitulo('Resumo');
    this.adicionarCampo('CAGR Histórico', dados.cagrHistorico);
    this.adicionarCampo('Margem Líquida Média', dados.margemLiquidaMedia);
  }

  /**
   * Seção 4: Projeções de Faturamento
   */
  async criarSecao04_ProjecoesFaturamento(dados) {
    this.adicionarTitulo('4. PROJEÇÕES DE FATURAMENTO', true);

    const cabecalho = ['Ano', 'Receita Projetada', 'Crescimento'];
    const linhas = [
      ['Ano 1', this.formatCurrency(dados.receitaProjetadaAno1), '-'],
      ['Ano 2', this.formatCurrency(dados.receitaProjetadaAno2), dados.crescimentoAno2],
      ['Ano 3', this.formatCurrency(dados.receitaProjetadaAno3), dados.crescimentoAno3],
      ['Ano 4', this.formatCurrency(dados.receitaProjetadaAno4), dados.crescimentoAno4],
      ['Ano 5', this.formatCurrency(dados.receitaProjetadaAno5), dados.crescimentoAno5]
    ];

    this.adicionarTabela(cabecalho, linhas);

    this.yAtual += 5;
    this.adicionarSubtitulo('Justificativa');
    const justificativaLines = this.pdf.splitTextToSize(dados.justificativaFaturamento, 170);
    this.pdf.setFontSize(10);
    this.pdf.text(justificativaLines, this.margemEsquerda, this.yAtual);
    this.yAtual += justificativaLines.length * 5 + 5;
  }

  /**
   * Seção 5: Estrutura de Custos
   */
  async criarSecao05_EstruturaCustos(dados) {
    this.adicionarTitulo('5. ESTRUTURA DE CUSTOS', true);

    this.adicionarSubtitulo('Custos Variáveis (% sobre Receita)');
    this.adicionarCampo('Matéria-Prima / Mercadorias', `${dados.custoMateriaPrima}%`);
    this.adicionarCampo('Mão-de-Obra Variável', `${dados.custoMaoObraVariavel}%`);
    this.adicionarCampo('Comissões', `${dados.custoComissoes}%`);
    this.adicionarCampo('Fretes', `${dados.custoFretes}%`);
    this.adicionarCampo('Outros', `${dados.custosVariaveisOutros}%`);
    this.adicionarCampo('Total', `${dados.totalCustosVariaveis}%`);

    this.yAtual += 5;
    this.adicionarSubtitulo('Custos Fixos (R$ por ano)');
    this.adicionarCampo('Folha de Pagamento', this.formatCurrency(dados.custoFolhaPagamento));
    this.adicionarCampo('Aluguel', this.formatCurrency(dados.custoAluguel));
    this.adicionarCampo('Energia e Água', this.formatCurrency(dados.custoEnergiaAgua));
    this.adicionarCampo('Marketing', this.formatCurrency(dados.custoMarketing));
    this.adicionarCampo('Administrativo', this.formatCurrency(dados.custoAdministrativo));
    this.adicionarCampo('Total', this.formatCurrency(dados.totalCustosFixos));
  }

  /**
   * Seção 6: Investimentos
   */
  async criarSecao06_Investimentos(dados) {
    this.adicionarTitulo('6. INVESTIMENTOS PLANEJADOS', true);

    this.adicionarSubtitulo('CAPEX');
    this.adicionarCampo('Terrenos', this.formatCurrency(dados.investimentoTerrenos));
    this.adicionarCampo('Obras Civis', this.formatCurrency(dados.investimentoObrasCivis));
    this.adicionarCampo('Máquinas', this.formatCurrency(dados.investimentoMaquinas));
    this.adicionarCampo('Veículos', this.formatCurrency(dados.investimentoVeiculos));
    this.adicionarCampo('TI', this.formatCurrency(dados.investimentoInformatica));
    this.adicionarCampo('Intangíveis', this.formatCurrency(dados.investimentoIntangiveis));
    this.adicionarCampo('Total CAPEX', this.formatCurrency(dados.totalCapex));

    this.yAtual += 5;
    this.adicionarSubtitulo('Capital de Giro');
    this.adicionarCampo('Capital de Giro Inicial', this.formatCurrency(dados.capitalGiroInicial));

    this.yAtual += 5;
    this.adicionarBoxDestaque(
      'Total de Investimento',
      `CAPEX + Capital de Giro = ${this.formatCurrency(dados.totalInvestimento)}`,
      'azul'
    );
  }

  /**
   * Seção 7: Indicadores
   */
  async criarSecao07_Indicadores(dados) {
    this.adicionarTitulo('7. INDICADORES DE VIABILIDADE', true);

    this.adicionarSubtitulo('Indicadores Principais');
    this.adicionarCampo('VPL', `${this.formatCurrency(dados.vpl)} - ${dados.vplStatus}`);
    this.adicionarCampo('TIR', `${dados.tir}% - ${dados.tirStatus}`);
    this.adicionarCampo('Payback Simples', `${dados.paybackSimples} meses`);
    this.adicionarCampo('Payback Descontado', `${dados.paybackDescontado} meses`);

    this.yAtual += 5;
    this.adicionarSubtitulo('Indicadores de Rentabilidade');
    this.adicionarCampo('ROI (Ano 5)', `${dados.roi}%`);
    this.adicionarCampo('ROE (Ano 5)', `${dados.roe}%`);
    this.adicionarCampo('ROA (Ano 5)', `${dados.roa}%`);
    this.adicionarCampo('Margem Líquida Média', `${dados.margemLiquida}%`);

    this.yAtual += 5;
    this.adicionarSubtitulo('Ponto de Equilíbrio');
    this.adicionarCampo('Faturamento Mínimo (mensal)', this.formatCurrency(dados.pontoEquilibrio));
    this.adicionarCampo('Margem de Segurança', `${dados.margemSeguranca}%`);

    // Box de conclusão baseado em VPL
    this.yAtual += 5;
    const corBox = dados.vplStatus && dados.vplStatus.includes('Viável') ? 'verde' : 'vermelho';
    this.adicionarBoxDestaque(
      'Análise de Viabilidade',
      `VPL ${dados.vplStatus}: O projeto ${dados.vplStatus && dados.vplStatus.includes('Viável') ? 'RECOMENDADO' : 'NÃO RECOMENDADO'} para implementação com base nos indicadores financeiros.`,
      corBox
    );
  }

  /**
   * Seção 8: Cenários
   */
  async criarSecao08_Cenarios(dados) {
    this.adicionarTitulo('8. ANÁLISE DE CENÁRIOS', true);

    if (dados.cenarios) {
      const { otimista, realista, pessimista } = dados.cenarios;

      const cabecalho = ['Indicador', 'Otimista', 'Realista', 'Pessimista'];
      const linhas = [
        ['VPL', this.formatCurrency(otimista.vpl), this.formatCurrency(realista.vpl), this.formatCurrency(pessimista.vpl)],
        ['TIR', `${otimista.tir}%`, `${realista.tir}%`, `${pessimista.tir}%`],
        ['Payback', `${otimista.paybackSimples}m`, `${realista.paybackSimples}m`, `${pessimista.paybackSimples}m`]
      ];

      this.adicionarTabela(cabecalho, linhas);

      this.yAtual += 5;
      this.adicionarSubtitulo('Interpretação');
      this.pdf.setFontSize(10);
      const interpretacao = this.pdf.splitTextToSize(
        'Cenário Otimista: Projeções com crescimento 20% acima do esperado. Cenário Realista: Projeções conservadoras baseadas em premissas validadas. Cenário Pessimista: Projeções com redução de 20% nas receitas.',
        170
      );
      this.pdf.text(interpretacao, this.margemEsquerda, this.yAtual);
      this.yAtual += interpretacao.length * 5 + 5;
    }
  }

  /**
   * Seção 9: Conclusão
   */
  async criarSecao09_Conclusao(dados) {
    this.adicionarTitulo('9. CONCLUSÃO E RECOMENDAÇÕES', true);

    // Análise baseada em indicadores
    const vplViavel = dados.secao11 && dados.secao11.vplStatus && dados.secao11.vplStatus.includes('Viável');
    const tirPositiva = dados.secao11 && dados.secao11.tir && parseFloat(dados.secao11.tir) > 12;

    let recomendacao = '';
    let corBox = 'amarelo';

    if (vplViavel && tirPositiva) {
      recomendacao = 'Projeto VIÁVEL e RECOMENDADO para implementação. Os indicadores financeiros demonstram que o investimento é atrativo e apresenta retorno adequado aos acionistas.';
      corBox = 'verde';
    } else if (vplViavel || tirPositiva) {
      recomendacao = 'Projeto VIÁVEL COM RESSALVAS. Alguns indicadores são favoráveis, mas recomenda-se revisão de premissas e análise de riscos antes da implementação.';
      corBox = 'amarelo';
    } else {
      recomendacao = 'Projeto INVIÁVEL nas condições atuais. Os indicadores financeiros não justificam o investimento. Recomenda-se reavaliação do modelo de negócio ou busca de alternativas.';
      corBox = 'vermelho';
    }

    this.adicionarBoxDestaque('Recomendação Final', recomendacao, corBox);

    this.yAtual += 5;
    this.adicionarSubtitulo('Observações');
    const observacoes = this.pdf.splitTextToSize(
      'Esta análise foi gerada automaticamente pelo Sistema Expertzy com base nas informações fornecidas. Recomenda-se validação das premissas por especialistas e análise de mercado atualizada antes da tomada de decisão final de investimento.',
      170
    );
    this.pdf.setFontSize(9);
    this.pdf.setTextColor(...this.corCinza);
    this.pdf.text(observacoes, this.margemEsquerda, this.yAtual);
    this.yAtual += observacoes.length * 4 + 10;

    // Informações finais
    this.pdf.setDrawColor(...this.corCinza);
    this.pdf.line(this.margemEsquerda, this.yAtual, this.larguraPagina - this.margemDireita, this.yAtual);
    this.yAtual += 10;

    this.pdf.setFontSize(8);
    this.pdf.text(`Documento gerado em: ${new Date().toLocaleString('pt-BR')}`, this.margemEsquerda, this.yAtual);
    this.yAtual += 5;
    this.pdf.text(`Sistema: ${this.metadados.sistema} v${this.metadados.versao}`, this.margemEsquerda, this.yAtual);
  }

  // ==========================================
  // UTILITIES
  // ==========================================

  /**
   * Formata valor monetário
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
    return `Relatorio_Viabilidade_${nomeEmpresa}_${data}.pdf`;
  }
}

// Exportar para uso global
if (typeof window !== 'undefined') {
  window.ExportadorPDF = ExportadorPDF;
}

// Exportar para Node.js (se necessário)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ExportadorPDF;
}
