/* =====================================
   TOGGLE-MODE-UI.JS
   Interface de Toggle entre Modo Respondente e Analista
   Badge Flutuante + Modal de Login + Animações
   NO HARDCODED DATA - NO FALLBACKS - KISS - DRY - SOLID
   ===================================== */

// ⚠️ DESENVOLVIMENTO: Desabilita prompt de senha temporariamente
// ATENÇÃO: MUDAR PARA false EM PRODUÇÃO!
const DEV_MODE_BYPASS_AUTH = true;

class ToggleModeUI {
  /**
   * @param {AuthModule} authModule - Módulo de autenticação
   * @param {Object} config - Configuração carregada de auth-config.json
   */
  constructor(authModule, config) {
    if (!authModule) {
      throw new Error('ToggleModeUI: authModule é obrigatório');
    }

    if (!config) {
      throw new Error('ToggleModeUI: config é obrigatório');
    }

    this.authModule = authModule;
    this.config = config;

    // State
    this.currentMode = 'respondente'; // 'respondente' | 'analista'
    this.isModalOpen = false;

    // DOM Elements (inicializados no init)
    this.badge = null;
    this.modal = null;
    this.passwordInput = null;
    this.loginButton = null;
    this.errorMessage = null;

    console.log('🎨 ToggleModeUI inicializado');
  }

  /**
   * Inicializa a interface de toggle
   * Single Responsibility: apenas inicialização de UI
   */
  async init() {
    try {
      console.log('🚀 Inicializando Toggle Mode UI...');

      // ⚠️ MODO DESENVOLVIMENTO: Ativar modo analista automaticamente
      if (DEV_MODE_BYPASS_AUTH) {
        console.warn('⚠️ DEV MODE: Modo analista ativado automaticamente (sem autenticação)');
        this.currentMode = 'analista';
      } else {
        // 1. Verificar autenticação atual
        const isAuth = await this.authModule.isAuthenticated();

        if (isAuth) {
          this.currentMode = 'analista';
          console.log('✓ Sessão analista ativa encontrada');
        }
      }

      // 2. Criar elementos UI
      this.createBadge();
      this.createModal();

      // 3. Anexar event listeners
      this.attachEventListeners();

      // 4. Atualizar estado inicial
      this.updateBadgeState(this.currentMode);

      // 5. Configurar monitoramento de atividade
      if (this.currentMode === 'analista') {
        this.setupActivityMonitoring();
      }

      console.log(`✓ Toggle Mode UI ativo: modo ${this.currentMode}`);

    } catch (error) {
      console.error('✗ Erro ao inicializar Toggle Mode UI:', error);
      throw new Error(`ToggleModeUI.init: ${error.message}`);
    }
  }

  /**
   * Cria o badge flutuante
   * Open/Closed Principle: extensível via config
   */
  createBadge() {
    this.badge = document.createElement('div');
    this.badge.id = 'modeToggleBadge';
    this.badge.className = 'mode-badge';
    this.badge.innerHTML = `
      <span class="badge-icon">👤</span>
      <span class="badge-text">Respondente</span>
    `;

    // Posição configurável
    const position = this.config.ui?.badgePosition || 'bottom-right';
    this.badge.classList.add(`position-${position}`);

    document.body.appendChild(this.badge);
    console.log('✓ Badge criado');
  }

  /**
   * Cria o modal de login
   */
  createModal() {
    this.modal = document.createElement('div');
    this.modal.id = 'loginModal';
    this.modal.className = 'modal-overlay';
    this.modal.innerHTML = `
      <div class="modal-content">
        <button class="modal-close" aria-label="Fechar">&times;</button>

        <div class="modal-header">
          <div class="modal-icon">🔐</div>
          <h2 class="modal-title">Acesso Analista</h2>
          <p class="modal-subtitle">Insira a senha para ativar o modo analista</p>
        </div>

        <div class="modal-body">
          <div class="form-group">
            <label for="analystPassword">Senha</label>
            <input
              type="password"
              id="analystPassword"
              class="form-input"
              placeholder="Digite a senha"
              autocomplete="current-password"
            >
          </div>

          <div class="error-message" id="loginError" style="display: none;"></div>

          <button id="loginButton" class="btn-primary">
            <span class="btn-text">Entrar</span>
            <span class="btn-loader" style="display: none;">
              <span class="spinner"></span>
              Autenticando...
            </span>
          </button>
        </div>

        <div class="modal-footer">
          <p class="help-text">
            <strong>Modo Analista:</strong> Acesso a análises, scores, recomendações e integração Serena MCP.
          </p>
        </div>
      </div>
    `;

    document.body.appendChild(this.modal);

    // Referências aos elementos internos
    this.passwordInput = document.getElementById('analystPassword');
    this.loginButton = document.getElementById('loginButton');
    this.errorMessage = document.getElementById('loginError');

    console.log('✓ Modal criado');
  }

  /**
   * Anexa event listeners
   * Interface Segregation: apenas eventos necessários
   */
  attachEventListeners() {
    // Badge click
    this.badge.addEventListener('click', () => this.handleBadgeClick());

    // Modal close button
    const closeBtn = this.modal.querySelector('.modal-close');
    closeBtn.addEventListener('click', () => this.hideModal());

    // Click fora do modal
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) {
        this.hideModal();
      }
    });

    // Login button
    this.loginButton.addEventListener('click', () => this.handleLoginSubmit());

    // Enter key no input
    this.passwordInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.handleLoginSubmit();
      }
    });

    // ESC key para fechar modal
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isModalOpen) {
        this.hideModal();
      }
    });

    console.log('✓ Event listeners anexados');
  }

  /**
   * Handler do click no badge
   */
  async handleBadgeClick() {
    if (this.currentMode === 'respondente') {
      // ⚠️ MODO DESENVOLVIMENTO: Ativar modo analista sem senha
      if (DEV_MODE_BYPASS_AUTH) {
        console.warn('⚠️ DEV MODE: Ativando modo analista sem autenticação');
        this.currentMode = 'analista';
        this.updateBadgeState('analista');
        this.showSuccess('Modo analista ativado (DEV MODE - sem autenticação)');
        this.setupActivityMonitoring();
        this.dispatchModeChangeEvent('analista');
        return;
      }

      // Modo público → tentar login
      this.showModal();
    } else {
      // Modo analista → confirmar logout
      const confirmLogout = confirm('Deseja sair do modo analista?');

      if (confirmLogout) {
        await this.handleLogout();
      }
    }
  }

  /**
   * Handler do submit de login
   * Dependency Inversion: depende da abstração do authModule
   */
  async handleLoginSubmit() {
    const password = this.passwordInput.value.trim();

    if (!password) {
      this.showError('Por favor, digite a senha');
      this.passwordInput.focus();
      return;
    }

    try {
      this.showLoading(true);
      this.hideError();

      // Chamar authModule
      const result = await this.authModule.login(password);

      if (result.success) {
        // Login bem-sucedido
        this.currentMode = 'analista';
        this.updateBadgeState('analista');
        this.hideModal();
        this.showSuccess('Login realizado com sucesso!');
        this.passwordInput.value = '';

        // Configurar monitoramento de atividade
        this.setupActivityMonitoring();

        // Disparar evento customizado
        this.dispatchModeChangeEvent('analista');

      } else {
        // Login falhou
        this.showError(result.message);
        this.passwordInput.select();
      }

    } catch (error) {
      console.error('✗ Erro no login:', error);
      this.showError('Erro ao processar login. Verifique o console.');
    } finally {
      this.showLoading(false);
    }
  }

  /**
   * Handler do logout
   */
  async handleLogout() {
    try {
      this.showLoading(true);

      await this.authModule.logout();

      this.currentMode = 'respondente';
      this.updateBadgeState('respondente');
      this.showSuccess('Logout realizado com sucesso!');

      // Parar monitoramento de atividade
      this.stopActivityMonitoring();

      // Disparar evento customizado
      this.dispatchModeChangeEvent('respondente');

    } catch (error) {
      console.error('✗ Erro no logout:', error);
      alert('Erro ao realizar logout. Verifique o console.');
    } finally {
      this.showLoading(false);
    }
  }

  /**
   * Atualiza estado visual do badge
   */
  updateBadgeState(mode) {
    const iconSpan = this.badge.querySelector('.badge-icon');
    const textSpan = this.badge.querySelector('.badge-text');

    if (mode === 'analista') {
      this.badge.classList.add('analyst-mode');
      this.badge.classList.remove('respondent-mode');
      iconSpan.textContent = '🔐';
      textSpan.textContent = 'Analista';
      this.badge.title = 'Modo Analista ativo. Clique para sair.';
    } else {
      this.badge.classList.add('respondent-mode');
      this.badge.classList.remove('analyst-mode');
      iconSpan.textContent = '👤';
      textSpan.textContent = 'Respondente';
      this.badge.title = 'Modo Respondente. Clique para login analista.';
    }
  }

  /**
   * Mostra modal de login
   */
  showModal() {
    this.modal.classList.add('active');
    this.isModalOpen = true;

    // Focar no input após animação
    setTimeout(() => {
      this.passwordInput.focus();
    }, 300);
  }

  /**
   * Esconde modal de login
   */
  hideModal() {
    this.modal.classList.remove('active');
    this.isModalOpen = false;
    this.passwordInput.value = '';
    this.hideError();
  }

  /**
   * Mostra mensagem de erro no modal
   */
  showError(message) {
    this.errorMessage.textContent = message;
    this.errorMessage.style.display = 'block';
  }

  /**
   * Esconde mensagem de erro
   */
  hideError() {
    this.errorMessage.style.display = 'none';
    this.errorMessage.textContent = '';
  }

  /**
   * Mostra/esconde loading no botão
   */
  showLoading(isLoading) {
    const btnText = this.loginButton.querySelector('.btn-text');
    const btnLoader = this.loginButton.querySelector('.btn-loader');

    if (isLoading) {
      btnText.style.display = 'none';
      btnLoader.style.display = 'flex';
      this.loginButton.disabled = true;
    } else {
      btnText.style.display = 'inline';
      btnLoader.style.display = 'none';
      this.loginButton.disabled = false;
    }
  }

  /**
   * Mostra notificação de sucesso (toast)
   */
  showSuccess(message) {
    // Criar toast temporário
    const toast = document.createElement('div');
    toast.className = 'toast-notification success';
    toast.innerHTML = `
      <span class="toast-icon">✓</span>
      <span class="toast-message">${message}</span>
    `;

    document.body.appendChild(toast);

    // Remover após 3s
    setTimeout(() => {
      toast.classList.add('fade-out');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  /**
   * Configura monitoramento de atividade para auto-renovação
   */
  setupActivityMonitoring() {
    if (this._activityMonitoringActive) {
      return; // Já ativo
    }

    this._activityMonitoringActive = true;

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];

    this._activityHandler = () => {
      this.authModule.notifyActivity();
    };

    events.forEach(eventName => {
      document.addEventListener(eventName, this._activityHandler, { passive: true });
    });

    console.log('✓ Monitoramento de atividade ativo');
  }

  /**
   * Para monitoramento de atividade
   */
  stopActivityMonitoring() {
    if (!this._activityMonitoringActive) {
      return;
    }

    this._activityMonitoringActive = false;

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];

    events.forEach(eventName => {
      document.removeEventListener(eventName, this._activityHandler);
    });

    console.log('✓ Monitoramento de atividade desativado');
  }

  /**
   * Dispara evento customizado de mudança de modo
   */
  dispatchModeChangeEvent(mode) {
    const event = new CustomEvent('modechange', {
      detail: {
        mode: mode,
        timestamp: Date.now()
      }
    });

    document.dispatchEvent(event);
    console.log(`📢 Evento 'modechange' disparado: ${mode}`);
  }

  /**
   * Retorna modo atual
   */
  getCurrentMode() {
    return this.currentMode;
  }

  /**
   * Verifica se está em modo analista
   */
  isAnalystMode() {
    return this.currentMode === 'analista';
  }

  /**
   * Força logout (útil para expiração de sessão)
   */
  async forceLogout(reason = 'Sessão expirada') {
    console.warn(`⚠ Logout forçado: ${reason}`);

    await this.authModule.logout();

    this.currentMode = 'respondente';
    this.updateBadgeState('respondente');
    this.stopActivityMonitoring();

    alert(reason);

    this.dispatchModeChangeEvent('respondente');
  }
}

// Exportar para uso global
if (typeof window !== 'undefined') {
  window.ToggleModeUI = ToggleModeUI;
}
