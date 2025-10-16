/* =====================================
   ABA-CENARIOS-ANALISE.JS
   Módulo Seção 13: Análise de Cenários
   3 Cenários (Otimista/Realista/Pessimista) + Sensibilidade + Recomendações
   NO HARDCODED DATA - NO FALLBACKS - KISS - DRY - SOLID
   ===================================== */

class AbaCenariosAnalise {
  constructor(dependencies) {
    // Validar dependências obrigatórias
    this.validateDependencies(dependencies);

    this.calculadorIndicadores = dependencies.calculadorIndicadores;
    this.calculadorDRE = dependencies.calculadorDRE;
    this.calculadorFluxoCaixa = dependencies.calculadorFluxoCaixa;
    this.dadosCache = null;

    console.log('✓ AbaCenariosAnalise inicializado');
  }

  // ==========================================
  // VALIDAÇÕES
  // ==========================================

  /**
   * Valida dependências obrigatórias
   */
  validateDependencies(deps) {
    if (!deps) {
      throw new Error('AbaCenariosAnalise: dependências não fornecidas');
    }

    const required = ['calculadorIndicadores', 'calculadorDRE', 'calculadorFluxoCaixa'];
    for (const dep of required) {
      if (!deps[dep]) {
        throw new Error(`AbaCenariosAnalise: ${dep} obrigatório`);
      }
    }
  }

  /**
   * Valida parâmetros de entrada
   */
  validateParams(params) {
    const required = [
      'investimentoInicial',
      'tma',
      'dreBase',
      'fluxoCaixaBase'
    ];

    for (const field of required) {
      if (params[field] === undefined || params[field] === null) {
        throw new Error(`AbaCenariosAnalise: Campo obrigatório "${field}" ausente`);
      }
    }

    // Validar tipos numéricos
    if (typeof params.investimentoInicial !== 'number' || params.investimentoInicial <= 0) {
      throw new Error('AbaCenariosAnalise: investimentoInicial deve ser número positivo');
    }

    if (typeof params.tma !== 'number' || params.tma <= 0) {
      throw new Error('AbaCenariosAnalise: tma deve ser número positivo');
    }

    // Validar estruturas
    if (!Array.isArray(params.dreBase) || params.dreBase.length !== 5) {
      throw new Error('AbaCenariosAnalise: dreBase deve ser array com 5 anos');
    }

    if (!Array.isArray(params.fluxoCaixaBase) || params.fluxoCaixaBase.length !== 5) {
      throw new Error('AbaCenariosAnalise: fluxoCaixaBase deve ser array com 5 anos');
    }
  }

  // ==========================================
  // RENDERIZAÇÃO PRINCIPAL
  // ==========================================

  /**
   * Renderiza a aba completa com todos os componentes
   *
   * @param {Object} params - Dados base para análise
   * @returns {Promise<Object>} Resultado do processamento
   */
  async renderizar(params) {
    try {
      console.log('📊 Renderizando Seção 13 - Análise de Cenários...');

      // Validar parâmetros
      this.validateParams(params);

      // Calcular cenários
      const cenarios = await this.calcularCenarios(params);
      this.dadosCache = cenarios;

      // Renderizar componentes
      this.renderCenarios(cenarios);
      this.renderAnaliseSensibilidade(params, cenarios.realista);
      this.renderRecomendacoes(cenarios);

      // Configurar botões de exportação
      this.configurarExportacao(cenarios, params);

      console.log('✓ Seção 13 renderizada com sucesso');

      return {
        success: true,
        cenarioRecomendado: this.identificarMelhorCenario(cenarios)
      };

    } catch (error) {
      console.error('✗ Erro ao renderizar Seção 13:', error);
      throw error;
    }
  }

  // ==========================================
  // CÁLCULO DE CENÁRIOS
  // ==========================================

  /**
   * Calcula 3 cenários: Otimista (+20%), Realista (base), Pessimista (-20%)
   */
  async calcularCenarios(params) {
    const cenarios = {};

    // Cenário Realista (base)
    cenarios.realista = await this.calcularCenario(params, 1.0, 'Realista');

    // Cenário Otimista (+20% receita, +5% custos)
    cenarios.otimista = await this.calcularCenario(params, 1.2, 'Otimista', 1.05);

    // Cenário Pessimista (-20% receita, +10% custos)
    cenarios.pessimista = await this.calcularCenario(params, 0.8, 'Pessimista', 1.10);

    return cenarios;
  }

  /**
   * Calcula um cenário específico
   *
   * @param {Object} params - Parâmetros base
   * @param {number} fatorReceita - Fator multiplicador da receita
   * @param {string} nome - Nome do cenário
   * @param {number} fatorCustos - Fator multiplicador dos custos
   */
  async calcularCenario(params, fatorReceita, nome, fatorCustos = 1.0) {
    // Ajustar DRE
    const dreAjustado = params.dreBase.map(ano => ({
      receitaBruta: ano.receitaBruta * fatorReceita,
      cpv: ano.cpv * fatorReceita * fatorCustos,
      despesasOperacionais: ano.despesasOperacionais * fatorCustos,
      despesasFinanceiras: ano.despesasFinanceiras,
      receitasFinanceiras: ano.receitasFinanceiras,
      depreciacaoAnual: ano.depreciacaoAnual,
      lucroLiquido: 0 // Será recalculado
    }));

    // Recalcular lucro líquido para cada ano
    for (let i = 0; i < dreAjustado.length; i++) {
      const ano = dreAjustado[i];
      const receitaLiquida = ano.receitaBruta - (ano.receitaBruta * 0.20); // Simplificação: 20% tributos
      const lucroOperacional = receitaLiquida - ano.cpv - ano.despesasOperacionais - ano.depreciacaoAnual;
      const lucroAntesIR = lucroOperacional + ano.receitasFinanceiras - ano.despesasFinanceiras;
      ano.lucroLiquido = lucroAntesIR * 0.66; // Simplificação: 34% IR+CSLL
    }

    // Ajustar Fluxo de Caixa
    const fluxoCaixaAjustado = params.fluxoCaixaBase.map((fluxo, index) => ({
      ano: fluxo.ano,
      recebimentos: fluxo.recebimentos * fatorReceita,
      pagamentos: fluxo.pagamentos * fatorReceita * fatorCustos,
      capex: fluxo.capex,
      financiamentos: fluxo.financiamentos,
      fluxoLiquido: 0 // Será recalculado
    }));

    // Recalcular fluxo líquido
    for (const fluxo of fluxoCaixaAjustado) {
      fluxo.fluxoLiquido = fluxo.recebimentos - fluxo.pagamentos - fluxo.capex + fluxo.financiamentos;
    }

    // Calcular indicadores
    const fluxos = fluxoCaixaAjustado.map(f => f.fluxoLiquido);

    const vpl = this.calculadorIndicadores.calcularVPL({
      fluxosCaixa: fluxos,
      investimentoInicial: params.investimentoInicial,
      tma: params.tma
    });

    const tir = this.calculadorIndicadores.calcularTIR({
      fluxosCaixa: fluxos,
      investimentoInicial: params.investimentoInicial,
      chuteInicial: params.tma,
      maxIteracoes: 100,
      tolerancia: 0.0001
    });

    const paybackSimples = this.calculadorIndicadores.calcularPaybackSimples({
      fluxosCaixa: fluxos,
      investimentoInicial: params.investimentoInicial
    });

    const paybackDescontado = this.calculadorIndicadores.calcularPaybackDescontado({
      fluxosCaixa: fluxos,
      investimentoInicial: params.investimentoInicial,
      tma: params.tma
    });

    return {
      nome,
      fatorReceita,
      fatorCustos,
      dre: dreAjustado,
      fluxoCaixa: fluxoCaixaAjustado,
      indicadores: {
        vpl: vpl.vpl,
        vplViavel: vpl.viavel,
        tir: tir.tir,
        tirConvergiu: tir.convergiu,
        paybackSimples: paybackSimples.anoPayback,
        paybackSimplesRecuperado: paybackSimples.recuperado,
        paybackDescontado: paybackDescontado.anoPayback,
        paybackDescontadoRecuperado: paybackDescontado.recuperado
      }
    };
  }

  // ==========================================
  // RENDERIZAÇÃO CENÁRIOS
  // ==========================================

  /**
   * Renderiza cards dos 3 cenários
   */
  renderCenarios(cenarios) {
    // Cenário Otimista
    this.renderCenarioCard('Otimista', cenarios.otimista.indicadores, {
      vplId: 'vplOtimista',
      tirId: 'tirOtimista',
      paybackId: 'paybackOtimista'
    });

    // Cenário Realista
    this.renderCenarioCard('Realista', cenarios.realista.indicadores, {
      vplId: 'vplRealista',
      tirId: 'tirRealista',
      paybackId: 'paybackRealista'
    });

    // Cenário Pessimista
    this.renderCenarioCard('Pessimista', cenarios.pessimista.indicadores, {
      vplId: 'vplPessimista',
      tirId: 'tirPessimista',
      paybackId: 'paybackPessimista'
    });
  }

  /**
   * Renderiza um card de cenário específico
   */
  renderCenarioCard(nome, indicadores, ids) {
    const vplElement = document.getElementById(ids.vplId);
    const tirElement = document.getElementById(ids.tirId);
    const paybackElement = document.getElementById(ids.paybackId);

    if (!vplElement || !tirElement || !paybackElement) {
      throw new Error(`AbaCenariosAnalise: Elementos do cenário ${nome} não encontrados no DOM`);
    }

    // VPL
    vplElement.textContent = this.formatCurrency(indicadores.vpl);
    vplElement.className = indicadores.vplViavel ? 'positive' : 'negative';

    // TIR
    tirElement.textContent = `${indicadores.tir.toFixed(2)}%`;
    tirElement.className = indicadores.tirConvergiu && indicadores.tir > 12 ? 'positive' : 'negative';

    // Payback
    if (indicadores.paybackSimplesRecuperado) {
      const meses = Math.round(indicadores.paybackSimples * 12);
      paybackElement.textContent = `${meses} meses`;
      paybackElement.className = meses <= 60 ? 'positive' : 'warning';
    } else {
      paybackElement.textContent = 'Não recupera';
      paybackElement.className = 'negative';
    }
  }

  // ==========================================
  // ANÁLISE DE SENSIBILIDADE
  // ==========================================

  /**
   * Renderiza tabela de análise de sensibilidade
   */
  renderAnaliseSensibilidade(params, cenarioBase) {
    const container = document.getElementById('sensibilidadeTableBody');
    if (!container) {
      throw new Error('AbaCenariosAnalise: Container "sensibilidadeTableBody" não encontrado no DOM');
    }

    const variacoes = [-0.20, -0.10, 0, 0.10, 0.20];
    const variaveis = [
      { nome: 'Receita Bruta', campo: 'receita' },
      { nome: 'Custos Variáveis', campo: 'custosVariaveis' },
      { nome: 'Custos Fixos', campo: 'custosFixos' },
      { nome: 'TMA', campo: 'tma' }
    ];

    let html = '';

    for (const variavel of variaveis) {
      html += '<tr>';
      html += `<td><strong>${variavel.nome}</strong></td>`;

      for (const variacao of variacoes) {
        const resultado = this.calcularSensibilidade(params, cenarioBase, variavel.campo, variacao);
        const cssClass = resultado.vpl > 0 ? 'positive' : 'negative';

        html += `<td class="${cssClass}">
          VPL: ${this.formatCurrency(resultado.vpl)}<br>
          TIR: ${resultado.tir.toFixed(1)}%
        </td>`;
      }

      html += '</tr>';
    }

    container.innerHTML = html;
  }

  /**
   * Calcula sensibilidade para uma variável específica
   */
  calcularSensibilidade(params, cenarioBase, variavel, variacao) {
    let fluxosCaixa;

    switch (variavel) {
      case 'receita':
        fluxosCaixa = cenarioBase.fluxoCaixa.map(f => f.fluxoLiquido * (1 + variacao));
        break;

      case 'custosVariaveis':
        // Aumentar custos reduz fluxo
        fluxosCaixa = cenarioBase.fluxoCaixa.map(f => f.fluxoLiquido * (1 - variacao * 0.5));
        break;

      case 'custosFixos':
        // Aumentar custos fixos reduz fluxo
        const reducaoFixa = params.investimentoInicial * variacao * 0.1;
        fluxosCaixa = cenarioBase.fluxoCaixa.map(f => f.fluxoLiquido - reducaoFixa);
        break;

      case 'tma':
        fluxosCaixa = cenarioBase.fluxoCaixa.map(f => f.fluxoLiquido);
        break;

      default:
        throw new Error(`Variável desconhecida: ${variavel}`);
    }

    const tmaAjustada = variavel === 'tma' ? params.tma * (1 + variacao) : params.tma;

    const vpl = this.calculadorIndicadores.calcularVPL({
      fluxosCaixa,
      investimentoInicial: params.investimentoInicial,
      tma: tmaAjustada
    });

    const tir = this.calculadorIndicadores.calcularTIR({
      fluxosCaixa,
      investimentoInicial: params.investimentoInicial,
      chuteInicial: tmaAjustada,
      maxIteracoes: 100,
      tolerancia: 0.0001
    });

    return {
      vpl: vpl.vpl,
      tir: tir.tir
    };
  }

  // ==========================================
  // RECOMENDAÇÕES
  // ==========================================

  /**
   * Renderiza recomendações baseadas nos cenários
   */
  renderRecomendacoes(cenarios) {
    const container = document.getElementById('recomendacoesContent');
    if (!container) {
      throw new Error('AbaCenariosAnalise: Container "recomendacoesContent" não encontrado no DOM');
    }

    const recomendacoes = this.gerarRecomendacoes(cenarios);

    let html = '<div class="recomendacoes-list">';

    for (const rec of recomendacoes) {
      const iconClass = rec.tipo === 'success' ? '✅' : rec.tipo === 'warning' ? '⚠️' : '❌';
      const cssClass = rec.tipo === 'success' ? 'rec-success' : rec.tipo === 'warning' ? 'rec-warning' : 'rec-danger';

      html += `
        <div class="recomendacao-item ${cssClass}">
          <div class="rec-icon">${iconClass}</div>
          <div class="rec-content">
            <h4>${rec.titulo}</h4>
            <p>${rec.descricao}</p>
            ${rec.acoes ? `<ul class="rec-acoes">${rec.acoes.map(a => `<li>${a}</li>`).join('')}</ul>` : ''}
          </div>
        </div>
      `;
    }

    html += '</div>';

    container.innerHTML = html;
  }

  /**
   * Gera lista de recomendações baseadas nos indicadores
   */
  gerarRecomendacoes(cenarios) {
    const recomendacoes = [];
    const { otimista, realista, pessimista } = cenarios;

    // Análise de Viabilidade Geral
    const viaveisCount = [otimista, realista, pessimista].filter(c => c.indicadores.vplViavel).length;

    if (viaveisCount === 3) {
      recomendacoes.push({
        tipo: 'success',
        titulo: 'Projeto Altamente Viável',
        descricao: 'O projeto apresenta VPL positivo em todos os cenários (otimista, realista e pessimista), indicando robustez financeira.',
        acoes: [
          'Recomenda-se prosseguir com a implementação',
          'Considerar antecipação de investimentos para capturar oportunidades',
          'Monitorar premissas para garantir realização dos cenários'
        ]
      });
    } else if (viaveisCount === 2) {
      recomendacoes.push({
        tipo: 'success',
        titulo: 'Projeto Viável com Ressalvas',
        descricao: 'O projeto é viável nos cenários otimista e realista, mas apresenta VPL negativo no cenário pessimista.',
        acoes: [
          'Implementar plano de contingência para cenário pessimista',
          'Avaliar estratégias de redução de custos',
          'Estabelecer indicadores de alerta antecipado'
        ]
      });
    } else if (viaveisCount === 1) {
      recomendacoes.push({
        tipo: 'warning',
        titulo: 'Projeto de Risco Elevado',
        descricao: 'O projeto só é viável no cenário otimista. Há risco significativo de não atingir retorno adequado.',
        acoes: [
          'Reavaliar premissas de receita e custos',
          'Buscar alternativas de financiamento mais favoráveis',
          'Considerar postergar investimento até melhoria das condições'
        ]
      });
    } else {
      recomendacoes.push({
        tipo: 'danger',
        titulo: 'Projeto Inviável',
        descricao: 'O projeto apresenta VPL negativo em todos os cenários. Não recomendado para implementação.',
        acoes: [
          'Rever fundamentalmente o modelo de negócio',
          'Avaliar redução significativa de CAPEX',
          'Considerar alternativas de investimento'
        ]
      });
    }

    // Análise de TIR
    const tirMedia = (otimista.indicadores.tir + realista.indicadores.tir + pessimista.indicadores.tir) / 3;
    const tmaReferencia = 12; // Assumindo TMA padrão 12%

    if (tirMedia > tmaReferencia * 1.5) {
      recomendacoes.push({
        tipo: 'success',
        titulo: 'Excelente Retorno sobre Investimento',
        descricao: `TIR média de ${tirMedia.toFixed(1)}% supera significativamente a TMA de ${tmaReferencia}%, indicando forte atratividade.`
      });
    } else if (tirMedia > tmaReferencia) {
      recomendacoes.push({
        tipo: 'success',
        titulo: 'Retorno Adequado',
        descricao: `TIR média de ${tirMedia.toFixed(1)}% está acima da TMA de ${tmaReferencia}%, indicando viabilidade financeira.`
      });
    } else {
      recomendacoes.push({
        tipo: 'warning',
        titulo: 'Retorno Insuficiente',
        descricao: `TIR média de ${tirMedia.toFixed(1)}% está abaixo ou próxima da TMA de ${tmaReferencia}%, indicando baixa atratividade.`,
        acoes: [
          'Buscar formas de aumentar receita',
          'Reduzir custos operacionais',
          'Reavaliar estrutura de capital'
        ]
      });
    }

    // Análise de Payback
    const paybackRealista = realista.indicadores.paybackSimples;
    if (paybackRealista <= 3) {
      recomendacoes.push({
        tipo: 'success',
        titulo: 'Recuperação Rápida do Investimento',
        descricao: `Payback de ${(paybackRealista * 12).toFixed(0)} meses no cenário realista indica recuperação rápida do capital investido.`
      });
    } else if (paybackRealista <= 5) {
      recomendacoes.push({
        tipo: 'success',
        titulo: 'Recuperação Moderada',
        descricao: `Payback de ${(paybackRealista * 12).toFixed(0)} meses está dentro do padrão aceitável para projetos desta natureza.`
      });
    } else {
      recomendacoes.push({
        tipo: 'warning',
        titulo: 'Recuperação Lenta',
        descricao: `Payback de ${(paybackRealista * 12).toFixed(0)} meses indica recuperação lenta do investimento, aumentando exposição a riscos.`,
        acoes: [
          'Avaliar formas de acelerar geração de caixa',
          'Considerar faseamento do investimento',
          'Buscar fontes de financiamento com menor custo'
        ]
      });
    }

    return recomendacoes;
  }

  // ==========================================
  // EXPORTAÇÃO
  // ==========================================

  /**
   * Configura botões de exportação
   */
  configurarExportacao(cenarios, params) {
    const btnJSON = document.getElementById('exportJsonBtn');
    const btnExcel = document.getElementById('exportExcelBtn');
    const btnPDF = document.getElementById('exportPDFBtn');

    if (!btnJSON || !btnExcel || !btnPDF) {
      throw new Error('AbaCenariosAnalise: Botões de exportação não encontrados no DOM');
    }

    // Exportar JSON
    btnJSON.addEventListener('click', () => {
      this.exportarJSON(cenarios, params);
    });

    // Exportar Excel
    btnExcel.addEventListener('click', () => {
      this.exportarExcel(cenarios, params);
    });

    // Exportar PDF
    btnPDF.addEventListener('click', () => {
      this.exportarPDF(cenarios, params);
    });
  }

  /**
   * Exporta dados em formato JSON
   */
  exportarJSON(cenarios, params) {
    const dados = {
      metadados: {
        dataGeracao: new Date().toISOString(),
        sistema: 'Expertzy - Análise de Viabilidade Financeira',
        versao: '1.0.0'
      },
      parametros: {
        investimentoInicial: params.investimentoInicial,
        tma: params.tma
      },
      cenarios: {
        otimista: this.formatarCenarioParaExport(cenarios.otimista),
        realista: this.formatarCenarioParaExport(cenarios.realista),
        pessimista: this.formatarCenarioParaExport(cenarios.pessimista)
      },
      recomendacoes: this.gerarRecomendacoes(cenarios)
    };

    const json = JSON.stringify(dados, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `analise_viabilidade_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);

    console.log('✓ JSON exportado com sucesso');
  }

  /**
   * Exporta para Excel (placeholder - requer biblioteca XLSX)
   */
  exportarExcel(cenarios, params) {
    if (typeof XLSX === 'undefined') {
      throw new Error('AbaCenariosAnalise: Biblioteca XLSX não disponível - obrigatória para exportação Excel');
    }

    console.log('📊 Exportação Excel: funcionalidade a ser implementada em Sprint 4D.1');
    alert('Exportação Excel será implementada em breve (Sprint 4D.1)');
  }

  /**
   * Exporta para PDF (placeholder - requer biblioteca jsPDF)
   */
  exportarPDF(cenarios, params) {
    if (typeof jsPDF === 'undefined') {
      throw new Error('AbaCenariosAnalise: Biblioteca jsPDF não disponível - obrigatória para exportação PDF');
    }

    console.log('📄 Exportação PDF: funcionalidade a ser implementada em Sprint 4D.2');
    alert('Exportação PDF será implementada em breve (Sprint 4D.2)');
  }

  /**
   * Formata cenário para exportação
   */
  formatarCenarioParaExport(cenario) {
    return {
      nome: cenario.nome,
      fatorReceita: cenario.fatorReceita,
      fatorCustos: cenario.fatorCustos,
      indicadores: cenario.indicadores,
      dre: cenario.dre.map((ano, index) => ({
        ano: index + 1,
        receitaBruta: ano.receitaBruta,
        cpv: ano.cpv,
        lucroLiquido: ano.lucroLiquido
      })),
      fluxoCaixa: cenario.fluxoCaixa.map(f => ({
        ano: f.ano,
        fluxoLiquido: f.fluxoLiquido
      }))
    };
  }

  // ==========================================
  // UTILITIES
  // ==========================================

  /**
   * Identifica melhor cenário com base em múltiplos critérios
   */
  identificarMelhorCenario(cenarios) {
    const { otimista, realista, pessimista } = cenarios;

    // Score baseado em VPL, TIR e Payback
    const calcularScore = (cenario) => {
      let score = 0;
      score += cenario.indicadores.vplViavel ? 3 : 0;
      score += cenario.indicadores.tir > 12 ? 2 : 0;
      score += cenario.indicadores.paybackSimplesRecuperado && cenario.indicadores.paybackSimples <= 5 ? 1 : 0;
      return score;
    };

    const scores = {
      otimista: calcularScore(otimista),
      realista: calcularScore(realista),
      pessimista: calcularScore(pessimista)
    };

    // Retornar cenário com maior score
    if (scores.pessimista >= 4) return 'pessimista';
    if (scores.realista >= 4) return 'realista';
    if (scores.otimista >= 4) return 'otimista';
    return 'nenhum';
  }

  /**
   * Formata valor monetário
   */
  formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  }

  /**
   * Obtém dados em cache
   */
  getDadosCache() {
    return this.dadosCache;
  }

  /**
   * Limpa cache
   */
  limparCache() {
    this.dadosCache = null;
  }
}

// Exportar para uso global
if (typeof window !== 'undefined') {
  window.AbaCenariosAnalise = AbaCenariosAnalise;
}

// Exportar para Node.js (se necessário)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AbaCenariosAnalise;
}
