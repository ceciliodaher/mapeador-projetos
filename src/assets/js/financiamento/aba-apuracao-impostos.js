/* =====================================
   ABA-APURACAO-IMPOSTOS.JS
   Módulo Seção 12: Apuração de Impostos
   Sistema Atual (2025) vs Reforma Tributária (2026-2033)
   Toggle entre sistemas + Timeline + Comparativo + Chart.js
   NO HARDCODED DATA - NO FALLBACKS - KISS - DRY - SOLID
   ===================================== */

class AbaApuracaoImpostos {
  constructor(dependencies) {
    // Validar dependências obrigatórias
    this.validateDependencies(dependencies);

    this.sistemaHibrido = dependencies.sistemaHibrido;
    this.reformaCalc = dependencies.reformaCalculator;
    this.chartInstance = null;
    this.sistemaAtivo = 'atual'; // 'atual' ou 'reforma'
    this.dadosCache = null;

    console.log('✓ AbaApuracaoImpostos inicializado');
  }

  // ==========================================
  // VALIDAÇÕES
  // ==========================================

  /**
   * Valida dependências obrigatórias
   */
  validateDependencies(deps) {
    if (!deps) {
      throw new Error('AbaApuracaoImpostos: dependências não fornecidas');
    }

    if (!deps.sistemaHibrido) {
      throw new Error('AbaApuracaoImpostos: sistemaHibrido obrigatório');
    }

    if (!deps.reformaCalculator) {
      throw new Error('AbaApuracaoImpostos: reformaCalculator obrigatório');
    }

    // Verificar se Chart.js está disponível
    if (typeof Chart === 'undefined') {
      throw new Error('AbaApuracaoImpostos: Chart.js não disponível - obrigatório para gráficos');
    }
  }

  /**
   * Valida parâmetros de entrada para cálculo
   */
  validateParams(params) {
    const required = [
      'receitaBruta',
      'receitaAcumulada12m',
      'lucroContabil',
      'regimeTributario',
      'uf',
      'anoReforma',
      'setorReforma',
      'aliquotaISS',
      'creditosPisCofins',
      'instituicaoFinanceira'
    ];

    for (const field of required) {
      if (params[field] === undefined || params[field] === null) {
        throw new Error(`AbaApuracaoImpostos: Campo obrigatório "${field}" ausente`);
      }
    }

    // Validações específicas por regime
    if (params.regimeTributario === 'simplesNacional') {
      if (!params.anexoSimples || !params.receitaAcumulada12m) {
        throw new Error('AbaApuracaoImpostos: anexoSimples e receitaAcumulada12m obrigatórios para Simples Nacional');
      }
    }

    if (params.regimeTributario === 'lucroPresumido' && !params.tipoAtividadePresumido) {
      throw new Error('AbaApuracaoImpostos: tipoAtividadePresumido obrigatório para Lucro Presumido');
    }

    // Validar tipos numéricos
    const numericFields = ['receitaBruta', 'receitaAcumulada12m', 'lucroContabil', 'anoReforma', 'aliquotaISS', 'creditosPisCofins'];
    for (const field of numericFields) {
      if (typeof params[field] !== 'number' || isNaN(params[field])) {
        throw new Error(`AbaApuracaoImpostos: Campo "${field}" deve ser número válido`);
      }
    }

    // Validar tipos booleanos
    if (typeof params.instituicaoFinanceira !== 'boolean') {
      throw new Error('AbaApuracaoImpostos: Campo "instituicaoFinanceira" deve ser booleano (true/false)');
    }

    // Validar ano reforma
    if (params.anoReforma < 2026 || params.anoReforma > 2033) {
      throw new Error('AbaApuracaoImpostos: anoReforma deve estar entre 2026 e 2033');
    }

    // Validar alíquota ISS
    if (params.aliquotaISS < 0 || params.aliquotaISS > 100) {
      throw new Error('AbaApuracaoImpostos: aliquotaISS deve estar entre 0 e 100');
    }

    // Validar créditos PIS/COFINS
    if (params.creditosPisCofins < 0) {
      throw new Error('AbaApuracaoImpostos: creditosPisCofins não pode ser negativo');
    }
  }

  // ==========================================
  // RENDERIZAÇÃO PRINCIPAL
  // ==========================================

  /**
   * Renderiza a aba completa com todos os componentes
   *
   * @param {Object} params - Dados da empresa para cálculo
   * @returns {Promise<Object>} Resultado do processamento
   */
  async renderizar(params) {
    try {
      console.log('📊 Renderizando Seção 12 - Apuração de Impostos...');

      // Validar parâmetros
      this.validateParams(params);

      // Calcular comparativo entre sistemas
      const comparativo = await this.calcularComparativo(params);
      this.dadosCache = comparativo;

      // Renderizar componentes
      this.renderSistemaAtual(comparativo.resultados);
      this.renderSistemaReforma(comparativo.resultados.reformaTributaria, params.anoReforma);
      this.renderComparativo(comparativo.analise, comparativo.recomendacao);
      this.renderTimeline(params.anoReforma);
      await this.renderGraficoEvolucao(params);

      // Configurar toggle inicial
      this.configurarToggle();

      console.log('✓ Seção 12 renderizada com sucesso');

      return {
        success: true,
        sistemaRecomendado: comparativo.recomendacao.regimeRecomendado,
        economiaAnual: comparativo.analise.diferencaReforma
      };

    } catch (error) {
      console.error('✗ Erro ao renderizar Seção 12:', error);
      throw error;
    }
  }

  /**
   * Calcula comparativo entre todos os regimes
   */
  async calcularComparativo(params) {
    const comparativoParams = {
      receitaBruta: params.receitaBruta,
      receitaAcumulada12m: params.receitaAcumulada12m,
      lucroContabil: params.lucroContabil,
      anexoSimples: params.anexoSimples,
      tipoAtividadePresumido: params.tipoAtividadePresumido,
      creditosPisCofins: params.creditosPisCofins,
      instituicaoFinanceira: params.instituicaoFinanceira,
      uf: params.uf,
      aliquotaISS: params.aliquotaISS,
      anoReforma: params.anoReforma,
      setorReforma: params.setorReforma
    };

    return await this.sistemaHibrido.calcularComparativo(comparativoParams);
  }

  // ==========================================
  // RENDERIZAÇÃO SISTEMA ATUAL (2025)
  // ==========================================

  /**
   * Renderiza tabela do sistema tributário atual
   */
  renderSistemaAtual(resultados) {
    const container = document.getElementById('sistemaAtualTabela');
    if (!container) {
      throw new Error('AbaApuracaoImpostos: Container "sistemaAtualTabela" não encontrado no DOM');
    }

    const regimeAtual = resultados.regimeAtual;
    const regime = regimeAtual.regime;

    let html = `
      <div class="tax-table">
        <div class="tax-header">
          <h4>Regime: ${this.formatRegimeName(regime)}</h4>
          <span class="badge">${regimeAtual.tipo || 'Sistema Atual'}</span>
        </div>
        <table class="table-striped">
          <thead>
            <tr>
              <th>Tributo</th>
              <th>Base de Cálculo</th>
              <th>Alíquota</th>
              <th>Valor</th>
            </tr>
          </thead>
          <tbody>
    `;

    // Renderizar tributos específicos por regime
    if (regime === 'simplesNacional') {
      html += this.renderSimplesRows(regimeAtual);
    } else if (regime === 'lucroPresumido') {
      html += this.renderPresumidoRows(regimeAtual);
    } else if (regime === 'lucroReal') {
      html += this.renderRealRows(regimeAtual);
    }

    html += `
          </tbody>
          <tfoot>
            <tr class="total-row">
              <td colspan="3"><strong>Total de Tributos</strong></td>
              <td><strong>${this.formatCurrency(regimeAtual.totalTributos)}</strong></td>
            </tr>
            <tr class="highlight">
              <td colspan="3"><strong>Carga Tributária Efetiva</strong></td>
              <td><strong>${this.formatPercentage(regimeAtual.cargaTributariaEfetiva)}</strong></td>
            </tr>
          </tfoot>
        </table>
      </div>
    `;

    container.innerHTML = html;
  }

  /**
   * Renderiza linhas para Simples Nacional
   */
  renderSimplesRows(resultado) {
    return `
      <tr>
        <td>Simples Nacional (DAS)</td>
        <td>${this.formatCurrency(resultado.detalhes.receitaAcumulada12m)}</td>
        <td>${this.formatPercentage(resultado.detalhes.aliquotaEfetiva)}</td>
        <td>${this.formatCurrency(resultado.totalTributos)}</td>
      </tr>
      <tr class="detail-row">
        <td colspan="4" style="font-size: 0.85em; color: #666;">
          Anexo ${resultado.detalhes.anexo} | Faixa ${resultado.detalhes.faixa} |
          Alíquota Nominal: ${this.formatPercentage(resultado.detalhes.aliquotaNominal)} |
          Dedução: ${this.formatCurrency(resultado.detalhes.parcelaADeduzir)}
        </td>
      </tr>
    `;
  }

  /**
   * Renderiza linhas para Lucro Presumido
   */
  renderPresumidoRows(resultado) {
    const det = resultado.detalhes;
    return `
      <tr>
        <td>IRPJ</td>
        <td>${this.formatCurrency(det.baseCalculoIRPJ)}</td>
        <td>${this.formatPercentage(det.aliquotaIRPJ)}</td>
        <td>${this.formatCurrency(det.irpjDevido)}</td>
      </tr>
      <tr>
        <td>CSLL</td>
        <td>${this.formatCurrency(det.baseCalculoCSLL)}</td>
        <td>${this.formatPercentage(det.aliquotaCSLL)}</td>
        <td>${this.formatCurrency(det.csllDevido)}</td>
      </tr>
      <tr>
        <td>PIS</td>
        <td>${this.formatCurrency(resultado.receitaBruta)}</td>
        <td>${this.formatPercentage(det.aliquotaPIS)}</td>
        <td>${this.formatCurrency(det.pisDevido)}</td>
      </tr>
      <tr>
        <td>COFINS</td>
        <td>${this.formatCurrency(resultado.receitaBruta)}</td>
        <td>${this.formatPercentage(det.aliquotaCOFINS)}</td>
        <td>${this.formatCurrency(det.cofinsDevido)}</td>
      </tr>
      ${det.icmsDevido > 0 ? `
      <tr>
        <td>ICMS</td>
        <td>${this.formatCurrency(resultado.receitaBruta)}</td>
        <td>${this.formatPercentage(det.aliquotaICMS)}</td>
        <td>${this.formatCurrency(det.icmsDevido)}</td>
      </tr>
      ` : ''}
      ${det.issDevido > 0 ? `
      <tr>
        <td>ISS</td>
        <td>${this.formatCurrency(resultado.receitaBruta)}</td>
        <td>${this.formatPercentage(det.aliquotaISS)}</td>
        <td>${this.formatCurrency(det.issDevido)}</td>
      </tr>
      ` : ''}
    `;
  }

  /**
   * Renderiza linhas para Lucro Real
   */
  renderRealRows(resultado) {
    const det = resultado.detalhes;
    return `
      <tr>
        <td>IRPJ</td>
        <td>${this.formatCurrency(det.baseCalculoIRPJ)}</td>
        <td>${this.formatPercentage(det.aliquotaIRPJ)}</td>
        <td>${this.formatCurrency(det.irpjDevido)}</td>
      </tr>
      <tr>
        <td>CSLL</td>
        <td>${this.formatCurrency(det.baseCalculoCSLL)}</td>
        <td>${this.formatPercentage(det.aliquotaCSLL)}</td>
        <td>${this.formatCurrency(det.csllDevido)}</td>
      </tr>
      <tr>
        <td>PIS (Não-Cumulativo)</td>
        <td>${this.formatCurrency(resultado.receitaBruta)}</td>
        <td>${this.formatPercentage(det.aliquotaPIS)}</td>
        <td>${this.formatCurrency(det.pisDevido)}</td>
      </tr>
      <tr>
        <td>COFINS (Não-Cumulativo)</td>
        <td>${this.formatCurrency(resultado.receitaBruta)}</td>
        <td>${this.formatPercentage(det.aliquotaCOFINS)}</td>
        <td>${this.formatCurrency(det.cofinsDevido)}</td>
      </tr>
      ${det.creditosPisCofins > 0 ? `
      <tr class="credit-row">
        <td colspan="3">(-) Créditos PIS/COFINS</td>
        <td>(${this.formatCurrency(det.creditosPisCofins)})</td>
      </tr>
      ` : ''}
      ${det.icmsDevido > 0 ? `
      <tr>
        <td>ICMS</td>
        <td>${this.formatCurrency(resultado.receitaBruta)}</td>
        <td>${this.formatPercentage(det.aliquotaICMS)}</td>
        <td>${this.formatCurrency(det.icmsDevido)}</td>
      </tr>
      ` : ''}
      ${det.issDevido > 0 ? `
      <tr>
        <td>ISS</td>
        <td>${this.formatCurrency(resultado.receitaBruta)}</td>
        <td>${this.formatPercentage(det.aliquotaISS)}</td>
        <td>${this.formatCurrency(det.issDevido)}</td>
      </tr>
      ` : ''}
    `;
  }

  // ==========================================
  // RENDERIZAÇÃO REFORMA TRIBUTÁRIA
  // ==========================================

  /**
   * Renderiza tabela da Reforma Tributária
   */
  renderSistemaReforma(resultado, ano) {
    const container = document.getElementById('sistemaReformaTabela');
    if (!container) {
      throw new Error('AbaApuracaoImpostos: Container "sistemaReformaTabela" não encontrado no DOM');
    }

    const html = `
      <div class="tax-table reforma">
        <div class="tax-header">
          <h4>Reforma Tributária - ${ano}</h4>
          <span class="badge reforma">${resultado.fase}</span>
        </div>
        <table class="table-striped">
          <thead>
            <tr>
              <th>Tributo</th>
              <th>Base de Cálculo</th>
              <th>Alíquota</th>
              <th>Valor</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>CBS (Contribuição sobre Bens e Serviços)</td>
              <td>${this.formatCurrency(resultado.receita)}</td>
              <td>${this.formatPercentage(resultado.cbs.aliquota)}</td>
              <td>${this.formatCurrency(resultado.cbs.comReducao)}</td>
            </tr>
            <tr>
              <td>IBS (Imposto sobre Bens e Serviços)</td>
              <td>${this.formatCurrency(resultado.receita)}</td>
              <td>${this.formatPercentage(resultado.ibs.aliquota)}</td>
              <td>${this.formatCurrency(resultado.ibs.comReducao)}</td>
            </tr>
            ${resultado.setor.reducao > 0 ? `
            <tr class="benefit-row">
              <td colspan="4" style="background: #e8f5e9; padding: 8px; font-size: 0.9em;">
                <strong>Benefício Setorial:</strong> ${resultado.setor.nome} -
                Redução de ${this.formatPercentage(resultado.setor.reducao)} |
                Economia: ${this.formatCurrency(resultado.total.economia)}
              </td>
            </tr>
            ` : ''}
            ${resultado.splitPayment.ativo ? `
            <tr class="info-row">
              <td colspan="4" style="background: #fff3e0; padding: 8px; font-size: 0.9em;">
                <strong>Split Payment Ativo:</strong> ${resultado.splitPayment.descricao}
              </td>
            </tr>
            ` : ''}
          </tbody>
          <tfoot>
            <tr class="total-row">
              <td colspan="3"><strong>Total de Tributos (CBS + IBS)</strong></td>
              <td><strong>${this.formatCurrency(resultado.total.comReducao)}</strong></td>
            </tr>
            <tr class="highlight">
              <td colspan="3"><strong>Carga Tributária Efetiva</strong></td>
              <td><strong>${this.formatPercentage(resultado.total.aliquotaEfetiva)}</strong></td>
            </tr>
          </tfoot>
        </table>
        <div class="reforma-info" style="margin-top: 12px; padding: 12px; background: #f5f5f5; border-radius: 4px; font-size: 0.9em;">
          <strong>Fase da Transição:</strong> ${resultado.descricaoFase}<br>
          <strong>Substituição:</strong> CBS substitui PIS/COFINS/IPI | IBS substitui ICMS/ISS
        </div>
      </div>
    `;

    container.innerHTML = html;
  }

  // ==========================================
  // RENDERIZAÇÃO COMPARATIVO
  // ==========================================

  /**
   * Renderiza tabela comparativa entre sistemas
   */
  renderComparativo(analise, recomendacao) {
    const container = document.getElementById('comparativoTabela');
    if (!container) {
      throw new Error('AbaApuracaoImpostos: Container "comparativoTabela" não encontrado no DOM');
    }

    const html = `
      <div class="comparison-table">
        <h4>Análise Comparativa</h4>
        <table class="table-bordered">
          <thead>
            <tr>
              <th>Indicador</th>
              <th>Sistema Atual (2025)</th>
              <th>Reforma Tributária</th>
              <th>Diferença</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Total de Tributos</strong></td>
              <td>${this.formatCurrency(analise.sistemaAtual.total)}</td>
              <td>${this.formatCurrency(analise.reforma.total)}</td>
              <td class="${analise.diferencaReforma < 0 ? 'positive' : 'negative'}">
                ${this.formatCurrency(Math.abs(analise.diferencaReforma))}
                ${analise.diferencaReforma < 0 ? '↓' : '↑'}
              </td>
            </tr>
            <tr>
              <td><strong>Carga Tributária Efetiva</strong></td>
              <td>${this.formatPercentage(analise.sistemaAtual.cargaTributaria)}</td>
              <td>${this.formatPercentage(analise.reforma.cargaTributaria)}</td>
              <td class="${analise.diferencaPercentualReforma < 0 ? 'positive' : 'negative'}">
                ${this.formatPercentage(Math.abs(analise.diferencaPercentualReforma))}
                ${analise.diferencaPercentualReforma < 0 ? '↓' : '↑'}
              </td>
            </tr>
            <tr>
              <td><strong>Economia/Aumento Anual</strong></td>
              <td colspan="2" class="center-text">-</td>
              <td class="${analise.diferencaReforma < 0 ? 'positive' : 'negative'}">
                <strong>
                  ${analise.diferencaReforma < 0 ? 'Economia' : 'Aumento'}:
                  ${this.formatCurrency(Math.abs(analise.diferencaReforma))}
                </strong>
              </td>
            </tr>
          </tbody>
        </table>

        <div class="recommendation-box" style="margin-top: 16px; padding: 16px; background: ${recomendacao.vantajoso ? '#e8f5e9' : '#fff3e0'}; border-left: 4px solid ${recomendacao.vantajoso ? '#4caf50' : '#ff9800'}; border-radius: 4px;">
          <h5 style="margin-top: 0;">Recomendação</h5>
          <p><strong>Regime Recomendado:</strong> ${this.formatRegimeName(recomendacao.regimeRecomendado)}</p>
          <p><strong>Justificativa:</strong> ${recomendacao.justificativa}</p>
          ${recomendacao.observacoes ? `<p><strong>Observações:</strong> ${recomendacao.observacoes}</p>` : ''}
        </div>
      </div>
    `;

    container.innerHTML = html;
  }

  // ==========================================
  // RENDERIZAÇÃO TIMELINE
  // ==========================================

  /**
   * Renderiza timeline de transição da reforma
   */
  renderTimeline(anoSelecionado) {
    const container = document.getElementById('reformaTimeline');
    if (!container) {
      throw new Error('AbaApuracaoImpostos: Container "reformaTimeline" não encontrado no DOM');
    }

    const timeline = this.reformaCalc.getTimeline();

    let html = '<div class="timeline-container">';

    timeline.forEach((item, index) => {
      const isSelected = item.ano === anoSelecionado;
      const isComplete = item.ano < anoSelecionado;

      html += `
        <div class="timeline-item ${isSelected ? 'selected' : ''} ${isComplete ? 'complete' : ''}">
          <div class="timeline-year">${item.ano}</div>
          <div class="timeline-phase">${item.fase}</div>
          <div class="timeline-rates">
            CBS: ${this.formatPercentage(item.cbs)} |
            IBS: ${this.formatPercentage(item.ibs)}
          </div>
          <div class="timeline-description">${item.descricao}</div>
          ${item.observacao ? `<div class="timeline-note">${item.observacao}</div>` : ''}
        </div>
      `;

      if (index < timeline.length - 1) {
        html += '<div class="timeline-connector"></div>';
      }
    });

    html += '</div>';

    container.innerHTML = html;
  }

  // ==========================================
  // RENDERIZAÇÃO GRÁFICO CHART.JS
  // ==========================================

  /**
   * Renderiza gráfico de evolução da carga tributária
   */
  async renderGraficoEvolucao(params) {
    const canvas = document.getElementById('graficoEvolucao');
    if (!canvas) {
      throw new Error('AbaApuracaoImpostos: Canvas "graficoEvolucao" não encontrado no DOM');
    }

    // Destruir gráfico anterior se existir
    if (this.chartInstance) {
      this.chartInstance.destroy();
    }

    // Calcular dados para anos 2025-2033
    const anos = [];
    const cargaAtual = [];
    const cargaReforma = [];

    // Ano base: 2025 (sistema atual)
    anos.push('2025');
    const resultadoAtual = await this.sistemaHibrido.calcularComparativo(params);
    cargaAtual.push(resultadoAtual.resultados.regimeAtual.cargaTributariaEfetiva);
    cargaReforma.push(null); // Reforma ainda não começou

    // Anos 2026-2033 (transição)
    for (let ano = 2026; ano <= 2033; ano++) {
      anos.push(ano.toString());

      const resultadoReforma = this.reformaCalc.calculateReforma(
        params.receitaBruta,
        ano,
        params.setorReforma
      );

      cargaAtual.push(resultadoAtual.resultados.regimeAtual.cargaTributariaEfetiva);
      cargaReforma.push(resultadoReforma.total.aliquotaEfetiva);
    }

    // Configuração do gráfico
    const ctx = canvas.getContext('2d');
    this.chartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: anos,
        datasets: [
          {
            label: 'Sistema Atual (2025)',
            data: cargaAtual,
            borderColor: '#091A30',
            backgroundColor: 'rgba(9, 26, 48, 0.1)',
            borderWidth: 2,
            tension: 0.1
          },
          {
            label: 'Reforma Tributária (2026-2033)',
            data: cargaReforma,
            borderColor: '#FF002D',
            backgroundColor: 'rgba(255, 0, 45, 0.1)',
            borderWidth: 2,
            tension: 0.1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Evolução da Carga Tributária - Sistema Atual vs Reforma Tributária',
            font: {
              size: 16,
              weight: 'bold'
            }
          },
          legend: {
            display: true,
            position: 'top'
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                return `${context.dataset.label}: ${context.parsed.y.toFixed(2)}%`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Carga Tributária (%)'
            },
            ticks: {
              callback: (value) => value.toFixed(1) + '%'
            }
          },
          x: {
            title: {
              display: true,
              text: 'Ano'
            }
          }
        }
      }
    });

    console.log('✓ Gráfico Chart.js renderizado');
  }

  // ==========================================
  // TOGGLE ENTRE SISTEMAS
  // ==========================================

  /**
   * Configura toggle entre Sistema Atual e Reforma
   */
  configurarToggle() {
    const btnAtual = document.getElementById('btnSistemaAtual');
    const btnReforma = document.getElementById('btnSistemaReforma');
    const containerAtual = document.getElementById('sistemaAtualContainer');
    const containerReforma = document.getElementById('sistemaReformaContainer');

    if (!btnAtual || !btnReforma || !containerAtual || !containerReforma) {
      throw new Error('AbaApuracaoImpostos: Elementos de toggle não encontrados no DOM');
    }

    // Toggle para Sistema Atual
    btnAtual.addEventListener('click', () => {
      this.sistemaAtivo = 'atual';
      btnAtual.classList.add('active');
      btnReforma.classList.remove('active');
      containerAtual.style.display = 'block';
      containerReforma.style.display = 'none';
      console.log('Toggle: Sistema Atual ativado');
    });

    // Toggle para Reforma
    btnReforma.addEventListener('click', () => {
      this.sistemaAtivo = 'reforma';
      btnReforma.classList.add('active');
      btnAtual.classList.remove('active');
      containerReforma.style.display = 'block';
      containerAtual.style.display = 'none';
      console.log('Toggle: Reforma Tributária ativada');
    });

    // Estado inicial: Sistema Atual
    btnAtual.click();
  }

  // ==========================================
  // UTILITIES & FORMATAÇÃO
  // ==========================================

  /**
   * Formata nome do regime tributário
   */
  formatRegimeName(regime) {
    const names = {
      simplesNacional: 'Simples Nacional',
      lucroPresumido: 'Lucro Presumido',
      lucroReal: 'Lucro Real',
      reformaTributaria: 'Reforma Tributária (CBS + IBS)'
    };
    return names[regime] || regime;
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
   * Formata percentual
   */
  formatPercentage(value) {
    return `${value.toFixed(2)}%`;
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

  /**
   * Destroy - limpa recursos
   */
  destroy() {
    if (this.chartInstance) {
      this.chartInstance.destroy();
      this.chartInstance = null;
    }
    this.dadosCache = null;
    console.log('✓ AbaApuracaoImpostos destruído');
  }
}

// Exportar para uso global
if (typeof window !== 'undefined') {
  window.AbaApuracaoImpostos = AbaApuracaoImpostos;
}

// Exportar para Node.js (se necessário)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AbaApuracaoImpostos;
}
