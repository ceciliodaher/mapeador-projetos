/* =====================================
   FINANCIAMENTO-MODULE.JS
   Módulo Principal - Orquestrador
   Sistema de Análise de Viabilidade Financeira
   Integra: Calculadores + Abas + Exportadores + Auto-Save
   NO HARDCODED DATA - NO FALLBACKS - KISS - DRY - SOLID
   ===================================== */

class FinanciamentoModule {
  constructor() {
    this.formulario = null;
    this.dbName = 'expertzy_financiamento';
    this.dbVersion = 1;
    this.db = null;
    this.autoSaveTimer = null;
    this.autoSaveInterval = 30000; // 30 segundos
    this.dadosFormulario = null;

    // Calculadores
    this.taxCalculator = null;
    this.reformaCalculator = null;
    this.sistemaHibrido = null;
    this.calculadorDRE = null;
    this.calculadorFluxoCaixa = null;
    this.calculadorIndicadores = null;

    // Módulos de abas
    this.abaApuracaoImpostos = null;
    this.abaCenariosAnalise = null;

    // Exportadores
    this.exportadorExcel = null;
    this.exportadorPDF = null;

    console.log('✓ FinanciamentoModule inicializado');
  }

  // ==========================================
  // INICIALIZAÇÃO
  // ==========================================

  /**
   * Inicializa o módulo completo
   */
  async init() {
    try {
      console.log('🚀 Inicializando Sistema de Viabilidade Financeira...');

      // Verificar dependências obrigatórias
      this.verificarDependencias();

      // Inicializar IndexedDB
      await this.initIndexedDB();

      // Inicializar calculadores
      await this.initCalculadores();

      // Inicializar módulos de abas
      await this.initModulosAbas();

      // Inicializar exportadores
      await this.initExportadores();

      // Vincular formulário
      this.formulario = document.getElementById('projectForm');
      if (!this.formulario) {
        throw new Error('FinanciamentoModule: Formulário #projectForm não encontrado no DOM');
      }

      // Configurar event listeners
      this.configurarEventListeners();

      // Tentar carregar dados salvos
      await this.carregarDadosSalvos();

      // Iniciar auto-save
      this.iniciarAutoSave();

      console.log('✓ Sistema inicializado com sucesso');

    } catch (error) {
      console.error('✗ Erro ao inicializar sistema:', error);
      throw error;
    }
  }

  /**
   * Verifica dependências obrigatórias
   */
  verificarDependencias() {
    const dependenciasObrigatorias = [
      'TaxCalculator',
      'ReformaTributariaCalculator',
      'SistemaApuracaoHibrido',
      'CalculadorDREProjetado',
      'CalculadorFluxoCaixa',
      'CalculadorIndicadores',
      'AbaApuracaoImpostos',
      'AbaCenariosAnalise',
      'ExportadorExcel',
      'ExportadorPDF'
    ];

    for (const dep of dependenciasObrigatorias) {
      if (typeof window[dep] === 'undefined') {
        throw new Error(`FinanciamentoModule: Dependência obrigatória ausente - ${dep}`);
      }
    }
  }

  /**
   * Inicializa IndexedDB
   */
  async initIndexedDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        reject(new Error('FinanciamentoModule: Erro ao abrir IndexedDB'));
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        console.log('✓ IndexedDB conectado');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Object store para dados do formulário
        if (!db.objectStoreNames.contains('formulario')) {
          const store = db.createObjectStore('formulario', { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          console.log('✓ Object store "formulario" criado');
        }

        // Object store para auto-save temporário
        if (!db.objectStoreNames.contains('autosave')) {
          db.createObjectStore('autosave', { keyPath: 'id' });
          console.log('✓ Object store "autosave" criado');
        }

        // Object store para tabelas dinâmicas (DynamicTable instances)
        if (!db.objectStoreNames.contains('dynamicTables')) {
          const store = db.createObjectStore('dynamicTables', { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('sectionId', 'sectionId', { unique: false });
          store.createIndex('tableId', 'tableId', { unique: false });
          console.log('✓ Object store "dynamicTables" criado');
        }
      };
    });
  }

  /**
   * Inicializa calculadores
   */
  async initCalculadores() {
    // Tax Calculator
    this.taxCalculator = new window.TaxCalculator();
    await this.taxCalculator.loadConfigs();

    // Reforma Tributária Calculator
    this.reformaCalculator = new window.ReformaTributariaCalculator();
    await this.reformaCalculator.loadConfigs();

    // Sistema Híbrido
    this.sistemaHibrido = new window.SistemaApuracaoHibrido(
      this.taxCalculator,
      this.reformaCalculator
    );

    // Calculador DRE
    this.calculadorDRE = new window.CalculadorDREProjetado(
      this.taxCalculator
    );

    // Calculador Fluxo de Caixa
    this.calculadorFluxoCaixa = new window.CalculadorFluxoCaixa(
      this.calculadorDRE
    );

    // Calculador Indicadores
    this.calculadorIndicadores = new window.CalculadorIndicadores();

    console.log('✓ Calculadores inicializados');
  }

  /**
   * Inicializa módulos de abas
   */
  async initModulosAbas() {
    // Aba Apuração de Impostos
    this.abaApuracaoImpostos = new window.AbaApuracaoImpostos({
      sistemaHibrido: this.sistemaHibrido,
      reformaCalculator: this.reformaCalculator
    });

    // Aba Cenários e Análise
    this.abaCenariosAnalise = new window.AbaCenariosAnalise({
      calculadorIndicadores: this.calculadorIndicadores,
      calculadorDRE: this.calculadorDRE,
      calculadorFluxoCaixa: this.calculadorFluxoCaixa
    });

    console.log('✓ Módulos de abas inicializados');
  }

  /**
   * Inicializa exportadores
   */
  async initExportadores() {
    this.exportadorExcel = new window.ExportadorExcel();
    this.exportadorPDF = new window.ExportadorPDF();

    console.log('✓ Exportadores inicializados');
  }

  // ==========================================
  // EVENT LISTENERS
  // ==========================================

  /**
   * Configura event listeners do formulário
   */
  configurarEventListeners() {
    // Detectar mudanças em todos os inputs
    this.formulario.addEventListener('input', () => {
      this.agendarAutoSave();
    });

    this.formulario.addEventListener('change', () => {
      this.agendarAutoSave();
    });

    // Botões de exportação
    const btnExportJSON = document.getElementById('exportJsonBtn');
    const btnExportExcel = document.getElementById('exportExcelBtn');
    const btnExportPDF = document.getElementById('exportPDFBtn');

    if (btnExportJSON) {
      btnExportJSON.addEventListener('click', () => this.exportarJSON());
    }

    if (btnExportExcel) {
      btnExportExcel.addEventListener('click', () => this.exportarExcel());
    }

    if (btnExportPDF) {
      btnExportPDF.addEventListener('click', () => this.exportarPDF());
    }

    // Botão de importação
    const btnImport = document.getElementById('importBtnHeader');
    const inputImport = document.getElementById('importJsonFileHeader');

    if (btnImport && inputImport) {
      btnImport.addEventListener('click', () => inputImport.click());
      inputImport.addEventListener('change', (e) => this.importarJSON(e));
    }

    // Evento antes de sair da página
    window.addEventListener('beforeunload', (e) => {
      this.salvarImediato();
    });

    // Verificar integração com TabNavigation
    this.initTabNavigation();

    // Mode toggle (Usuário vs Analista) com integração TabNavigation
    this.configurarModeToggle();

    // Proteção para seções restritas ao modo Analista
    this.configurarProtecaoSecoes();

    // Event listener para calcular tempo no mercado automaticamente
    const dataInicioOpInput = document.getElementById('dataInicioOperacoes');
    if (dataInicioOpInput) {
      dataInicioOpInput.addEventListener('change', () => {
        this.calcularTempoMercado();
      });

      // Calcular no load se já houver valor
      if (dataInicioOpInput.value) {
        this.calcularTempoMercado();
      }
    }

    console.log('✓ Event listeners configurados (incluindo mode toggle e navegação)');
  }

  /**
   * Verifica e inicializa integração com TabNavigation
   */
  initTabNavigation() {
    if (typeof window.tabNavigation === 'undefined' || !window.tabNavigation) {
      throw new Error('FinanciamentoModule: TabNavigation não disponível - obrigatório para navegação');
    }
    console.log('✓ TabNavigation integrado');
  }

  /**
   * Configura mode toggle com integração TabNavigation
   */
  configurarModeToggle() {
    const btnModeUsuario = document.getElementById('modeUsuario');
    const btnModeAnalista = document.getElementById('modeAnalista');
    const progressContainer = document.querySelector('.progress-container');

    if (!btnModeUsuario || !btnModeAnalista || !progressContainer) {
      console.warn('⚠️ Botões de modo não encontrados - funcionalidade desabilitada');
      return;
    }

    // Modo Usuário (seções 1-11)
    btnModeUsuario.addEventListener('click', () => {
      btnModeUsuario.classList.add('active');
      btnModeAnalista.classList.remove('active');
      progressContainer.classList.remove('analyst-mode');

      // Se estiver em seção protegida, redirecionar para seção 11
      const currentTab = window.tabNavigation?.currentTab || 1;
      if (currentTab > 11) {
        window.tabNavigation.switchToTab(11);
      }

      console.log('🔄 Modo: Usuário (seções 1-11)');
    });

    // Modo Analista (todas as seções 1-13)
    btnModeAnalista.addEventListener('click', () => {
      btnModeAnalista.classList.add('active');
      btnModeUsuario.classList.remove('active');
      progressContainer.classList.add('analyst-mode');
      console.log('🔄 Modo: Analista (seções 1-13)');
    });
  }

  /**
   * Configura proteção para seções restritas
   */
  configurarProtecaoSecoes() {
    const progressContainer = document.querySelector('.progress-container');

    // Interceptar cliques em tabs protegidas (capture phase)
    document.addEventListener('click', (e) => {
      const tab = e.target.closest('.tab-item[data-protected="true"]');

      if (tab) {
        const isAnalystMode = progressContainer?.classList.contains('analyst-mode');

        if (!isAnalystMode) {
          e.stopPropagation();
          e.preventDefault();
          alert('Esta seção está disponível apenas no Modo Analista.\nUse o toggle acima para alternar para o Modo Analista.');
        }
      }
    }, true); // true = capture phase (antes do TabNavigation)
  }

  // ==========================================
  // AUTO-SAVE
  // ==========================================

  /**
   * Inicia auto-save periódico
   */
  iniciarAutoSave() {
    this.autoSaveTimer = setInterval(() => {
      this.executarAutoSave();
    }, this.autoSaveInterval);

    console.log(`✓ Auto-save iniciado (intervalo: ${this.autoSaveInterval / 1000}s)`);
  }

  /**
   * Agenda auto-save (debounce)
   */
  agendarAutoSave() {
    if (this.autoSaveDebounce) {
      clearTimeout(this.autoSaveDebounce);
    }

    this.autoSaveDebounce = setTimeout(() => {
      this.executarAutoSave();
    }, 3000); // 3 segundos após última alteração
  }

  /**
   * Executa auto-save
   */
  async executarAutoSave() {
    try {
      const dados = this.coletarDadosFormulario();

      if (!dados || Object.keys(dados).length === 0) {
        return; // Nada para salvar
      }

      await this.salvarDados('autosave', {
        id: 'current',
        timestamp: new Date().toISOString(),
        dados
      });

      this.atualizarStatusSave('💾 Salvo automaticamente');

    } catch (error) {
      console.error('✗ Erro no auto-save:', error);
      this.atualizarStatusSave('⚠️ Erro ao salvar');
    }
  }

  /**
   * Salva dados imediatamente
   */
  async salvarImediato() {
    const dados = this.coletarDadosFormulario();

    if (!dados || Object.keys(dados).length === 0) {
      return;
    }

    await this.salvarDados('formulario', {
      id: `save_${Date.now()}`,
      timestamp: new Date().toISOString(),
      dados
    });

    console.log('✓ Dados salvos imediatamente');
  }

  /**
   * Salva dados no IndexedDB
   */
  async salvarDados(storeName, registro) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(registro);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Erro ao salvar no IndexedDB'));
    });
  }

  /**
   * Carrega dados salvos
   */
  async carregarDadosSalvos() {
    try {
      const dados = await this.carregarDados('autosave', 'current');

      if (dados && dados.dados) {
        console.log('📥 Dados anteriores encontrados');
        const restaurar = confirm('Deseja restaurar os dados da sessão anterior?');

        if (restaurar) {
          this.restaurarDadosFormulario(dados.dados);
          this.atualizarStatusSave('✓ Dados restaurados');
        }
      }

    } catch (error) {
      console.log('ℹ️ Nenhum dado anterior encontrado');
    }
  }

  /**
   * Carrega dados do IndexedDB
   */
  async carregarDados(storeName, id) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(id);

      request.onsuccess = () => {
        if (request.result) {
          resolve(request.result);
        } else {
          reject(new Error('Dados não encontrados'));
        }
      };

      request.onerror = () => reject(new Error('Erro ao carregar do IndexedDB'));
    });
  }

  /**
   * Salva dados de DynamicTable no IndexedDB
   * @param {string} tableId - ID da tabela
   * @param {Object} data - Dados da tabela (toJSON())
   */
  async salvarDynamicTable(tableId, data) {
    if (!this.db) {
      throw new Error('FinanciamentoModule.salvarDynamicTable: IndexedDB não disponível - obrigatório para persistência');
    }

    if (!tableId) {
      throw new Error('FinanciamentoModule.salvarDynamicTable: tableId obrigatório');
    }

    if (!data) {
      throw new Error('FinanciamentoModule.salvarDynamicTable: data obrigatório');
    }

    try {
      const record = {
        id: tableId,
        timestamp: new Date().toISOString(),
        sectionId: data.sectionId || null,
        tableId: tableId,
        data: data
      };

      await this.salvarDados('dynamicTables', record);
      console.log(`✓ DynamicTable[${tableId}] salvo no IndexedDB`);
    } catch (error) {
      console.error(`✗ Erro ao salvar DynamicTable[${tableId}]:`, error);
      throw new Error(`FinanciamentoModule.salvarDynamicTable: Falha ao salvar tabela ${tableId} - ${error.message}`);
    }
  }

  /**
   * Carrega dados de DynamicTable do IndexedDB
   * @param {string} tableId - ID da tabela
   * @returns {Object|null} Dados da tabela ou null se não encontrado
   */
  async carregarDynamicTable(tableId) {
    if (!this.db) {
      console.warn('FinanciamentoModule.carregarDynamicTable: IndexedDB não disponível - sem dados para carregar');
      return null;
    }

    if (!tableId) {
      throw new Error('FinanciamentoModule.carregarDynamicTable: tableId obrigatório');
    }

    try {
      const record = await this.carregarDados('dynamicTables', tableId);

      if (record && record.data) {
        console.log(`✓ DynamicTable[${tableId}] carregado do IndexedDB (${record.data.rows?.length || 0} linhas)`);
        return record.data;
      }

      console.log(`ℹ️ DynamicTable[${tableId}]: sem dados salvos`);
      return null;

    } catch (error) {
      console.log(`ℹ️ DynamicTable[${tableId}]: sem dados salvos (${error.message})`);
      return null;
    }
  }

  /**
   * Atualiza status de salvamento na UI
   */
  atualizarStatusSave(mensagem) {
    const statusElement = document.getElementById('saveStatus');
    if (statusElement) {
      statusElement.textContent = mensagem;

      // Remover classe de destaque após 2 segundos
      statusElement.classList.add('highlight');
      setTimeout(() => {
        statusElement.classList.remove('highlight');
      }, 2000);
    }
  }

  // ==========================================
  // COLETA E RESTAURAÇÃO DE DADOS
  // ==========================================

  /**
   * Coleta todos os dados do formulário
   */
  coletarDadosFormulario() {
    const dados = {};

    // Coletar seção 1: Identificação
    dados.secao1 = {
      razaoSocial: this.getFieldValue('razaoSocial'),
      nomeFantasia: this.getFieldValue('nomeFantasia'),
      cnpj: this.getFieldValue('cnpj'),
      inscricaoEstadual: this.getFieldValue('inscricaoEstadual'),
      dataConstituicao: this.getFieldValue('dataConstituicao'),
      uf: this.getFieldValue('uf'),
      municipio: this.getFieldValue('municipio'),
      endereco: this.getFieldValue('endereco'),
      atividadePrincipal: this.getFieldValue('atividadePrincipal'),
      descricaoAtividade: this.getFieldValue('descricaoAtividade'),
      // Caracterização Jurídica (Task 2.1.1)
      tipoSocietario: this.getFieldValue('tipoSocietario'),
      capitalSocial: this.getFieldValue('capitalSocial'),
      numeroSocios: this.getFieldValue('numeroSocios'),
      dataUltimaAlteracao: this.getFieldValue('dataUltimaAlteracao'),
      enquadramentoFiscal: this.getFieldValue('enquadramentoFiscal'),
      // Histórico Operacional (Task 2.1.2)
      dataInicioOperacoes: this.getFieldValue('dataInicioOperacoes'),
      tempoMercado: this.getFieldValue('tempoMercado', 'number'),
      qtdeFuncionariosAtual: this.getFieldValue('qtdeFuncionariosAtual', 'number'),
      capacidadeProdutivaAtual: this.getFieldValue('capacidadeProdutivaAtual'),
      certificacoesAtuais: this.getFieldValue('certificacoesAtuais'),
      principaisProdutosServicos: this.getFieldValue('principaisProdutosServicos'),
      responsavelNome: this.getFieldValue('responsavelNome'),
      responsavelCargo: this.getFieldValue('responsavelCargo'),
      responsavelEmail: this.getFieldValue('responsavelEmail'),
      responsavelTelefone: this.getFieldValue('responsavelTelefone')
    };

    // Coletar seção 2: Regime Tributário
    dados.secao2 = {
      regimeTributario: this.getFieldValue('regimeTributario'),
      simplesAnexo: this.getFieldValue('simplesAnexo'),
      setorEconomico: this.getFieldValue('setorEconomico'),
      anoBase: this.getFieldValue('anoBase', 'number'),
      periodoProjecao: this.getFieldValue('periodoProjecao', 'number'),
      anoFinal: this.getFieldValue('anoFinal', 'number'),
      tma: this.getFieldValue('tma', 'number'),
      inflacaoAnual: this.getFieldValue('inflacaoAnual', 'number'),
      pmr: this.getFieldValue('pmr', 'number'),
      pmp: this.getFieldValue('pmp', 'number'),
      percVendasPrazo: this.getFieldValue('percVendasPrazo', 'number')
    };

    // Coletar seção 3: Histórico Financeiro
    dados.secao3 = {
      receitaBrutaAno3: this.getFieldValue('receitaBrutaAno3'),
      custosVariaveisAno3: this.getFieldValue('custosVariaveisAno3'),
      custosFixosAno3: this.getFieldValue('custosFixosAno3'),
      lucroLiquidoAno3: this.getFieldValue('lucroLiquidoAno3'),
      receitaBrutaAno2: this.getFieldValue('receitaBrutaAno2'),
      custosVariaveisAno2: this.getFieldValue('custosVariaveisAno2'),
      custosFixosAno2: this.getFieldValue('custosFixosAno2'),
      lucroLiquidoAno2: this.getFieldValue('lucroLiquidoAno2'),
      receitaBrutaAno1: this.getFieldValue('receitaBrutaAno1'),
      custosVariaveisAno1: this.getFieldValue('custosVariaveisAno1'),
      custosFixosAno1: this.getFieldValue('custosFixosAno1'),
      lucroLiquidoAno1: this.getFieldValue('lucroLiquidoAno1')
    };

    // Coletar seção 4: Projeções de Faturamento
    dados.secao4 = {
      receitaProjetadaAno1: this.getFieldValue('receitaProjetadaAno1'),
      receitaProjetadaAno2: this.getFieldValue('receitaProjetadaAno2'),
      receitaProjetadaAno3: this.getFieldValue('receitaProjetadaAno3'),
      receitaProjetadaAno4: this.getFieldValue('receitaProjetadaAno4'),
      receitaProjetadaAno5: this.getFieldValue('receitaProjetadaAno5'),
      justificativaFaturamento: this.getFieldValue('justificativaFaturamento')
    };

    // Coletar seção 5: Estrutura de Custos
    dados.secao5 = {
      custoMateriaPrima: this.getFieldValue('custoMateriaPrima', 'number'),
      custoMaoObraVariavel: this.getFieldValue('custoMaoObraVariavel', 'number'),
      custoComissoes: this.getFieldValue('custoComissoes', 'number'),
      custoFretes: this.getFieldValue('custoFretes', 'number'),
      custosVariaveisOutros: this.getFieldValue('custosVariaveisOutros', 'number'),
      custoFolhaPagamento: this.getFieldValue('custoFolhaPagamento'),
      custoAluguel: this.getFieldValue('custoAluguel'),
      custoEnergiaAgua: this.getFieldValue('custoEnergiaAgua'),
      custoMarketing: this.getFieldValue('custoMarketing'),
      custoAdministrativo: this.getFieldValue('custoAdministrativo'),
      custoManutencao: this.getFieldValue('custoManutencao'),
      custoDepreciacao: this.getFieldValue('custoDepreciacao'),
      custosFixosOutros: this.getFieldValue('custosFixosOutros'),
      crescimentoCustosFixos: this.getFieldValue('crescimentoCustosFixos', 'number')
    };

    // Coletar seção 6: Investimentos Planejados
    dados.secao6 = {
      investimentoTerrenos: this.getFieldValue('investimentoTerrenos'),
      investimentoObrasCivis: this.getFieldValue('investimentoObrasCivis'),
      investimentoMaquinas: this.getFieldValue('investimentoMaquinas'),
      investimentoVeiculos: this.getFieldValue('investimentoVeiculos'),
      investimentoInformatica: this.getFieldValue('investimentoInformatica'),
      investimentoMoveis: this.getFieldValue('investimentoMoveis'),
      investimentoIntangiveis: this.getFieldValue('investimentoIntangiveis'),
      investimentoOutros: this.getFieldValue('investimentoOutros'),
      capitalGiroInicial: this.getFieldValue('capitalGiroInicial'),
      recursosPropriosPerc: this.getFieldValue('recursosPropriosPerc', 'number'),
      recursosFinanciamentoPerc: this.getFieldValue('recursosFinanciamentoPerc', 'number'),
      taxaJurosFinanciamento: this.getFieldValue('taxaJurosFinanciamento', 'number'),
      prazoFinanciamento: this.getFieldValue('prazoFinanciamento', 'number'),
      carenciaFinanciamento: this.getFieldValue('carenciaFinanciamento', 'number')
    };

    // Coletar seção 7: Cronograma Financeiro
    dados.secao7 = {
      dataInicioInvestimentos: this.getFieldValue('dataInicioInvestimentos'),
      dataInicioOperacoesProjeto: this.getFieldValue('dataInicioOperacoesProjeto')
    };

    // Seção 8: Matriz Produto-Insumo
    // Será coletada pelo módulo ProGoiás quando implementado
    dados.secao8 = {
      produtos: this.coletarProdutos(),
      insumos: this.coletarInsumos()
    };

    // Seções 9-13 são calculadas/geradas automaticamente
    // Não precisam de coleta de dados, mas podem ter preferências de visualização

    return dados;
  }

  /**
   * Coleta dados de produtos (Seção 8)
   */
  coletarProdutos() {
    const produtos = [];
    const container = document.getElementById('produtos-container');

    if (!container) return produtos;

    const entries = container.querySelectorAll('.produto-entry');
    entries.forEach((entry, index) => {
      const nome = entry.querySelector(`[name="produto${index + 1}Nome"]`)?.value;
      const unidade = entry.querySelector(`[name="produto${index + 1}Unidade"]`)?.value;
      const preco = entry.querySelector(`[name="produto${index + 1}Preco"]`)?.value;

      if (nome) {
        produtos.push({ nome, unidade, preco });
      }
    });

    return produtos;
  }

  /**
   * Coleta dados de insumos (Seção 8)
   */
  coletarInsumos() {
    const insumos = [];
    const container = document.getElementById('insumos-container');

    if (!container) return insumos;

    const entries = container.querySelectorAll('.insumo-entry');
    entries.forEach((entry, index) => {
      const nome = entry.querySelector(`[name="insumo${index + 1}Nome"]`)?.value;
      const tipo = entry.querySelector(`[name="insumo${index + 1}Tipo"]`)?.value;
      const unidade = entry.querySelector(`[name="insumo${index + 1}Unidade"]`)?.value;
      const custoUnitario = entry.querySelector(`[name="insumo${index + 1}CustoUnitario"]`)?.value;

      if (nome) {
        insumos.push({ nome, tipo, unidade, custoUnitario });
      }
    });

    return insumos;
  }

  /**
   * Obtém valor de um campo
   */
  getFieldValue(fieldId, type = 'string') {
    const field = document.getElementById(fieldId);
    if (!field) return null;

    const value = field.value;

    if (!value || value === '') return null;

    switch (type) {
      case 'number':
        return parseFloat(value);
      case 'boolean':
        return field.checked;
      default:
        return value;
    }
  }

  /**
   * Restaura dados no formulário
   */
  restaurarDadosFormulario(dados) {
    if (!dados) {
      console.warn('FinanciamentoModule.restaurarDadosFormulario: dados vazios');
      return;
    }

    // Restaurar seção 1: Identificação
    if (dados.secao1) {
      this.setFieldValue('razaoSocial', dados.secao1.razaoSocial);
      this.setFieldValue('nomeFantasia', dados.secao1.nomeFantasia);
      this.setFieldValue('cnpj', dados.secao1.cnpj);
      this.setFieldValue('inscricaoEstadual', dados.secao1.inscricaoEstadual);
      this.setFieldValue('dataConstituicao', dados.secao1.dataConstituicao);
      this.setFieldValue('uf', dados.secao1.uf);
      this.setFieldValue('municipio', dados.secao1.municipio);
      this.setFieldValue('endereco', dados.secao1.endereco);
      this.setFieldValue('atividadePrincipal', dados.secao1.atividadePrincipal);
      this.setFieldValue('descricaoAtividade', dados.secao1.descricaoAtividade);
      // Caracterização Jurídica (Task 2.1.1)
      this.setFieldValue('tipoSocietario', dados.secao1.tipoSocietario);
      this.setFieldValue('capitalSocial', dados.secao1.capitalSocial);
      this.setFieldValue('numeroSocios', dados.secao1.numeroSocios);
      this.setFieldValue('dataUltimaAlteracao', dados.secao1.dataUltimaAlteracao);
      this.setFieldValue('enquadramentoFiscal', dados.secao1.enquadramentoFiscal);
      // Histórico Operacional (Task 2.1.2)
      this.setFieldValue('dataInicioOperacoes', dados.secao1.dataInicioOperacoes);
      this.setFieldValue('tempoMercado', dados.secao1.tempoMercado);
      this.setFieldValue('qtdeFuncionariosAtual', dados.secao1.qtdeFuncionariosAtual);
      this.setFieldValue('capacidadeProdutivaAtual', dados.secao1.capacidadeProdutivaAtual);
      this.setFieldValue('certificacoesAtuais', dados.secao1.certificacoesAtuais);
      this.setFieldValue('principaisProdutosServicos', dados.secao1.principaisProdutosServicos);
      this.setFieldValue('responsavelNome', dados.secao1.responsavelNome);
      this.setFieldValue('responsavelCargo', dados.secao1.responsavelCargo);
      this.setFieldValue('responsavelEmail', dados.secao1.responsavelEmail);
      this.setFieldValue('responsavelTelefone', dados.secao1.responsavelTelefone);

      // Recalcular tempo no mercado após restaurar dataInicioOperacoes
      if (dados.secao1.dataInicioOperacoes) {
        this.calcularTempoMercado();
      }
    }

    // Restaurar seção 2: Regime Tributário
    if (dados.secao2) {
      this.setFieldValue('regimeTributario', dados.secao2.regimeTributario);
      this.setFieldValue('simplesAnexo', dados.secao2.simplesAnexo);
      this.setFieldValue('setorEconomico', dados.secao2.setorEconomico);
      this.setFieldValue('anoBase', dados.secao2.anoBase);
      this.setFieldValue('periodoProjecao', dados.secao2.periodoProjecao);
      this.setFieldValue('anoFinal', dados.secao2.anoFinal);
      this.setFieldValue('tma', dados.secao2.tma);
      this.setFieldValue('inflacaoAnual', dados.secao2.inflacaoAnual);
      this.setFieldValue('pmr', dados.secao2.pmr);
      this.setFieldValue('pmp', dados.secao2.pmp);
      this.setFieldValue('percVendasPrazo', dados.secao2.percVendasPrazo);
    }

    // Restaurar seção 3: Histórico Financeiro
    if (dados.secao3) {
      this.setFieldValue('receitaBrutaAno3', dados.secao3.receitaBrutaAno3);
      this.setFieldValue('custosVariaveisAno3', dados.secao3.custosVariaveisAno3);
      this.setFieldValue('custosFixosAno3', dados.secao3.custosFixosAno3);
      this.setFieldValue('lucroLiquidoAno3', dados.secao3.lucroLiquidoAno3);
      this.setFieldValue('receitaBrutaAno2', dados.secao3.receitaBrutaAno2);
      this.setFieldValue('custosVariaveisAno2', dados.secao3.custosVariaveisAno2);
      this.setFieldValue('custosFixosAno2', dados.secao3.custosFixosAno2);
      this.setFieldValue('lucroLiquidoAno2', dados.secao3.lucroLiquidoAno2);
      this.setFieldValue('receitaBrutaAno1', dados.secao3.receitaBrutaAno1);
      this.setFieldValue('custosVariaveisAno1', dados.secao3.custosVariaveisAno1);
      this.setFieldValue('custosFixosAno1', dados.secao3.custosFixosAno1);
      this.setFieldValue('lucroLiquidoAno1', dados.secao3.lucroLiquidoAno1);
    }

    // Restaurar seção 4: Projeções de Faturamento
    if (dados.secao4) {
      this.setFieldValue('receitaProjetadaAno1', dados.secao4.receitaProjetadaAno1);
      this.setFieldValue('receitaProjetadaAno2', dados.secao4.receitaProjetadaAno2);
      this.setFieldValue('receitaProjetadaAno3', dados.secao4.receitaProjetadaAno3);
      this.setFieldValue('receitaProjetadaAno4', dados.secao4.receitaProjetadaAno4);
      this.setFieldValue('receitaProjetadaAno5', dados.secao4.receitaProjetadaAno5);
      this.setFieldValue('justificativaFaturamento', dados.secao4.justificativaFaturamento);
    }

    // Restaurar seção 5: Estrutura de Custos
    if (dados.secao5) {
      this.setFieldValue('custoMateriaPrima', dados.secao5.custoMateriaPrima);
      this.setFieldValue('custoMaoObraVariavel', dados.secao5.custoMaoObraVariavel);
      this.setFieldValue('custoComissoes', dados.secao5.custoComissoes);
      this.setFieldValue('custoFretes', dados.secao5.custoFretes);
      this.setFieldValue('custosVariaveisOutros', dados.secao5.custosVariaveisOutros);
      this.setFieldValue('custoFolhaPagamento', dados.secao5.custoFolhaPagamento);
      this.setFieldValue('custoAluguel', dados.secao5.custoAluguel);
      this.setFieldValue('custoEnergiaAgua', dados.secao5.custoEnergiaAgua);
      this.setFieldValue('custoMarketing', dados.secao5.custoMarketing);
      this.setFieldValue('custoAdministrativo', dados.secao5.custoAdministrativo);
      this.setFieldValue('custoManutencao', dados.secao5.custoManutencao);
      this.setFieldValue('custoDepreciacao', dados.secao5.custoDepreciacao);
      this.setFieldValue('custosFixosOutros', dados.secao5.custosFixosOutros);
      this.setFieldValue('crescimentoCustosFixos', dados.secao5.crescimentoCustosFixos);
    }

    // Restaurar seção 6: Investimentos Planejados
    if (dados.secao6) {
      this.setFieldValue('investimentoTerrenos', dados.secao6.investimentoTerrenos);
      this.setFieldValue('investimentoObrasCivis', dados.secao6.investimentoObrasCivis);
      this.setFieldValue('investimentoMaquinas', dados.secao6.investimentoMaquinas);
      this.setFieldValue('investimentoVeiculos', dados.secao6.investimentoVeiculos);
      this.setFieldValue('investimentoInformatica', dados.secao6.investimentoInformatica);
      this.setFieldValue('investimentoMoveis', dados.secao6.investimentoMoveis);
      this.setFieldValue('investimentoIntangiveis', dados.secao6.investimentoIntangiveis);
      this.setFieldValue('investimentoOutros', dados.secao6.investimentoOutros);
      this.setFieldValue('capitalGiroInicial', dados.secao6.capitalGiroInicial);
      this.setFieldValue('recursosPropriosPerc', dados.secao6.recursosPropriosPerc);
      this.setFieldValue('recursosFinanciamentoPerc', dados.secao6.recursosFinanciamentoPerc);
      this.setFieldValue('taxaJurosFinanciamento', dados.secao6.taxaJurosFinanciamento);
      this.setFieldValue('prazoFinanciamento', dados.secao6.prazoFinanciamento);
      this.setFieldValue('carenciaFinanciamento', dados.secao6.carenciaFinanciamento);
    }

    // Restaurar seção 7: Cronograma Financeiro
    if (dados.secao7) {
      this.setFieldValue('dataInicioInvestimentos', dados.secao7.dataInicioInvestimentos);
      this.setFieldValue('dataInicioOperacoesProjeto', dados.secao7.dataInicioOperacoesProjeto);
    }

    // Restaurar seção 8: Matriz Produto-Insumo
    if (dados.secao8) {
      this.restaurarProdutos(dados.secao8.produtos);
      this.restaurarInsumos(dados.secao8.insumos);
    }

    // Seções 9-13 são calculadas automaticamente e não precisam de restauração

    console.log('✓ Dados restaurados em todas as seções');
  }

  /**
   * Restaura dados de produtos (Seção 8)
   */
  restaurarProdutos(produtos) {
    if (!produtos || produtos.length === 0) return;

    const container = document.getElementById('produtos-container');
    if (!container) return;

    // Limpar produtos existentes
    container.innerHTML = '';

    // Restaurar cada produto
    produtos.forEach((produto, index) => {
      // Criar novo produto entry (similar ao código de addProduto)
      const entry = document.createElement('div');
      entry.className = 'produto-entry';
      entry.innerHTML = `
        <div class="form-grid">
          <div class="form-group">
            <label>Nome do Produto *</label>
            <input type="text" name="produto${index + 1}Nome" value="${produto.nome || ''}" required>
          </div>
          <div class="form-group">
            <label>Unidade *</label>
            <input type="text" name="produto${index + 1}Unidade" value="${produto.unidade || ''}" placeholder="Ex: kg, un, L" required>
          </div>
          <div class="form-group">
            <label>Preço Unitário (R$) *</label>
            <input type="text" name="produto${index + 1}Preco" value="${produto.preco || ''}" data-mask="currency" required>
          </div>
        </div>
      `;
      container.appendChild(entry);
    });

    console.log(`✓ ${produtos.length} produtos restaurados`);
  }

  /**
   * Restaura dados de insumos (Seção 8)
   */
  restaurarInsumos(insumos) {
    if (!insumos || insumos.length === 0) return;

    const container = document.getElementById('insumos-container');
    if (!container) return;

    // Limpar insumos existentes
    container.innerHTML = '';

    // Restaurar cada insumo
    insumos.forEach((insumo, index) => {
      const entry = document.createElement('div');
      entry.className = 'insumo-entry';
      entry.innerHTML = `
        <div class="form-grid">
          <div class="form-group">
            <label>Nome do Insumo *</label>
            <input type="text" name="insumo${index + 1}Nome" value="${insumo.nome || ''}" required>
          </div>
          <div class="form-group">
            <label>Tipo *</label>
            <select name="insumo${index + 1}Tipo" required>
              <option value="">Selecione</option>
              <option value="MP" ${insumo.tipo === 'MP' ? 'selected' : ''}>Matéria-Prima (MP)</option>
              <option value="IS" ${insumo.tipo === 'IS' ? 'selected' : ''}>Insumo Secundário (IS)</option>
              <option value="ME" ${insumo.tipo === 'ME' ? 'selected' : ''}>Material de Embalagem (ME)</option>
              <option value="EE" ${insumo.tipo === 'EE' ? 'selected' : ''}>Energia Elétrica (EE)</option>
            </select>
          </div>
          <div class="form-group">
            <label>Unidade *</label>
            <input type="text" name="insumo${index + 1}Unidade" value="${insumo.unidade || ''}" required>
          </div>
          <div class="form-group">
            <label>Custo Unitário (R$) *</label>
            <input type="text" name="insumo${index + 1}CustoUnitario" value="${insumo.custoUnitario || ''}" data-mask="currency" required>
          </div>
        </div>
      `;
      container.appendChild(entry);
    });

    console.log(`✓ ${insumos.length} insumos restaurados`);
  }

  /**
   * Define valor de um campo
   */
  setFieldValue(fieldId, value) {
    const field = document.getElementById(fieldId);
    if (!field || value === null || value === undefined) return;

    if (field.type === 'checkbox') {
      field.checked = value;
    } else {
      field.value = value;
    }
  }

  /**
   * Calcula tempo no mercado em anos a partir da data de início das operações
   * @private
   */
  calcularTempoMercado() {
    const dataInicioInput = document.getElementById('dataInicioOperacoes');
    const tempoMercadoInput = document.getElementById('tempoMercado');

    if (!dataInicioInput || !tempoMercadoInput) {
      return;
    }

    const dataInicio = dataInicioInput.value;
    if (!dataInicio) {
      tempoMercadoInput.value = '';
      return;
    }

    const inicio = new Date(dataInicio);
    const hoje = new Date();

    if (isNaN(inicio.getTime())) {
      tempoMercadoInput.value = '';
      return;
    }

    // Calcular diferença em anos (com casas decimais)
    const diffMs = hoje - inicio;
    const diffAnos = diffMs / (1000 * 60 * 60 * 24 * 365.25); // 365.25 para considerar anos bissextos

    // Arredondar para 1 casa decimal
    const tempoAnos = Math.max(0, diffAnos).toFixed(1);

    tempoMercadoInput.value = tempoAnos;
  }

  // ==========================================
  // EXPORTAÇÃO
  // ==========================================

  /**
   * Exporta para JSON
   */
  async exportarJSON() {
    try {
      const dados = this.coletarDadosFormulario();

      const json = JSON.stringify(dados, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `analise_viabilidade_${Date.now()}.json`;
      link.click();
      URL.revokeObjectURL(url);

      console.log('✓ JSON exportado');

    } catch (error) {
      console.error('✗ Erro ao exportar JSON:', error);
      alert('Erro ao exportar JSON: ' + error.message);
    }
  }

  /**
   * Exporta para Excel
   */
  async exportarExcel() {
    try {
      const dados = this.coletarDadosCompletos();
      await this.exportadorExcel.exportar(dados);

      console.log('✓ Excel exportado');

    } catch (error) {
      console.error('✗ Erro ao exportar Excel:', error);
      alert('Erro ao exportar Excel: ' + error.message);
    }
  }

  /**
   * Exporta para PDF
   */
  async exportarPDF() {
    try {
      const dados = this.coletarDadosCompletos();
      await this.exportadorPDF.exportar(dados);

      console.log('✓ PDF exportado');

    } catch (error) {
      console.error('✗ Erro ao exportar PDF:', error);
      alert('Erro ao exportar PDF: ' + error.message);
    }
  }

  /**
   * Coleta dados completos incluindo cálculos
   */
  coletarDadosCompletos() {
    const dadosFormulario = this.coletarDadosFormulario();

    // Aqui seria necessário executar todos os cálculos
    // e consolidar os resultados
    // Por enquanto, retornar dados do formulário

    return dadosFormulario;
  }

  // ==========================================
  // IMPORTAÇÃO
  // ==========================================

  /**
   * Importa dados de JSON
   */
  async importarJSON(event) {
    try {
      const file = event.target.files[0];
      if (!file) return;

      const text = await file.text();
      const dados = JSON.parse(text);

      this.restaurarDadosFormulario(dados);

      this.atualizarStatusSave('✓ Dados importados');
      console.log('✓ JSON importado');

    } catch (error) {
      console.error('✗ Erro ao importar JSON:', error);
      alert('Erro ao importar JSON: ' + error.message);
    }
  }

  // ==========================================
  // CLEANUP
  // ==========================================

  /**
   * Limpa recursos
   */
  destroy() {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
    }

    if (this.autoSaveDebounce) {
      clearTimeout(this.autoSaveDebounce);
    }

    if (this.db) {
      this.db.close();
    }

    console.log('✓ FinanciamentoModule destruído');
  }
}

// ==========================================
// INICIALIZAÇÃO AUTOMÁTICA
// ==========================================

// Inicializar quando DOM estiver pronto
if (typeof window !== 'undefined') {
  window.FinanciamentoModule = FinanciamentoModule;

  // Auto-inicializar quando página carregar
  window.addEventListener('DOMContentLoaded', async () => {
    try {
      const module = new FinanciamentoModule();
      await module.init();
      window.financiamento = module; // Expor globalmente para debug
    } catch (error) {
      console.error('✗ Erro fatal na inicialização:', error);
      alert('Erro ao carregar o sistema. Por favor, recarregue a página.');
    }
  });
}

// Exportar para Node.js (se necessário)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FinanciamentoModule;
}
