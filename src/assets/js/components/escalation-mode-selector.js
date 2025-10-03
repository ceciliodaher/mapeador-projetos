/* =====================================
   ESCALATION-MODE-SELECTOR.JS
   Componente UI para escolher modo de escalonamento
   Global (mesmo % todos) vs Individual (% por produto)
   NO FALLBACKS - Event-driven
   ===================================== */

class EscalationModeSelector {
  constructor(containerId, dbManager) {
    this.container = document.getElementById(containerId);

    if (!this.container) {
      throw new Error(`Container #${containerId} não encontrado. Componente EscalationModeSelector requer elemento válido.`);
    }

    if (!dbManager) {
      throw new Error('DBManager não fornecido. EscalationModeSelector requer ProGoiasIndexedDBManager.');
    }

    this.dbManager = dbManager;
    this.currentMode = null;
    this.globalEscalation = null;
    this.isInitialized = false;
  }

  /**
   * Inicializa o componente
   */
  async init() {
    try {
      // Carregar configuração existente ou criar default
      const config = await this.loadConfig();

      if (config) {
        this.currentMode = config.escalationMode;
        this.globalEscalation = config.globalEscalation;
      } else {
        // Sem fallback - iniciar com modo explícito
        this.currentMode = 'global';
        this.globalEscalation = { ano1: 0, ano2: 0, ano3: 0, ano4: 0 };

        // Salvar configuração inicial
        await this.saveConfig();
      }

      this.render();
      this.attachEventListeners();
      this.isInitialized = true;

      console.log('✓ EscalationModeSelector inicializado:', this.currentMode);
    } catch (error) {
      console.error('✗ Erro ao inicializar EscalationModeSelector:', error);
      throw error;
    }
  }

  /**
   * Carrega configuração do IndexedDB
   */
  async loadConfig() {
    try {
      const projectId = this.dbManager.currentProjectId;

      if (!projectId) {
        console.warn('Projeto ainda não criado. Configuração será criada no primeiro save.');
        return null;
      }

      const config = await this.dbManager.get('config_escalonamento_progoias', projectId);
      return config;
    } catch (error) {
      console.error('Erro ao carregar config de escalonamento:', error);
      return null;
    }
  }

  /**
   * Salva configuração no IndexedDB
   */
  async saveConfig() {
    try {
      // Garantir que projeto existe
      if (!this.dbManager.currentProjectId) {
        this.dbManager.currentProjectId = 'progoias_' + Date.now();
      }

      const config = {
        projectId: this.dbManager.currentProjectId,
        escalationMode: this.currentMode,
        globalEscalation: this.globalEscalation,
        updatedAt: Date.now()
      };

      await this.dbManager.save('config_escalonamento_progoias', config);

      console.log('✓ Configuração de escalonamento salva:', this.currentMode);

      // Disparar evento para recalcular produtos
      this.dispatchChangeEvent();

      return true;
    } catch (error) {
      console.error('✗ Erro ao salvar config de escalonamento:', error);
      throw error;
    }
  }

  /**
   * Renderiza o componente
   */
  render() {
    const globalChecked = this.currentMode === 'global' ? 'checked' : '';
    const individualChecked = this.currentMode === 'individual' ? 'checked' : '';
    const globalSelected = this.currentMode === 'global' ? 'selected' : '';
    const individualSelected = this.currentMode === 'individual' ? 'selected' : '';
    const globalVisible = this.currentMode === 'global' ? '' : 'hidden';
    const individualVisible = this.currentMode === 'individual' ? '' : 'hidden';

    this.container.innerHTML = `
      <div class="escalation-mode-card">
        <h3 class="section-subtitle">⚙️ Modo de Escalonamento da Produção</h3>

        <!-- Radio Buttons -->
        <div class="radio-group">
          <label class="radio-option ${globalSelected}">
            <input type="radio" name="escalation-mode" value="global" ${globalChecked}>
            <div class="radio-label">
              <strong>Escalonamento Global</strong>
              <p>Aplicar o mesmo percentual de crescimento para TODOS os produtos</p>
            </div>
          </label>

          <label class="radio-option ${individualSelected}">
            <input type="radio" name="escalation-mode" value="individual" ${individualChecked}>
            <div class="radio-label">
              <strong>Escalonamento Individual</strong>
              <p>Definir percentual de crescimento específico para cada produto</p>
            </div>
          </label>
        </div>

        <!-- Tabela de Escalonamento Global (visível apenas se mode = global) -->
        <div id="global-escalation-table" class="conditional-section" ${globalVisible}>
          <h4 class="subsection-title">Percentuais de Crescimento Anual (Aplicados a Todos os Produtos)</h4>
          <table class="table-escalonamento">
            <thead>
              <tr>
                <th>Ano 1</th>
                <th>Ano 2</th>
                <th>Ano 3</th>
                <th>Ano 4</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <div class="input-with-suffix">
                    <input type="number" id="global-ano1" class="input-escalonamento"
                           value="${this.globalEscalation.ano1}" min="0" max="100" step="1">
                    <span class="suffix">%</span>
                  </div>
                </td>
                <td>
                  <div class="input-with-suffix">
                    <input type="number" id="global-ano2" class="input-escalonamento"
                           value="${this.globalEscalation.ano2}" min="0" max="100" step="1">
                    <span class="suffix">%</span>
                  </div>
                </td>
                <td>
                  <div class="input-with-suffix">
                    <input type="number" id="global-ano3" class="input-escalonamento"
                           value="${this.globalEscalation.ano3}" min="0" max="100" step="1">
                    <span class="suffix">%</span>
                  </div>
                </td>
                <td>
                  <div class="input-with-suffix">
                    <input type="number" id="global-ano4" class="input-escalonamento"
                           value="${this.globalEscalation.ano4}" min="0" max="100" step="1">
                    <span class="suffix">%</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
          <p class="help-text">
            ℹ️ Estes percentuais serão aplicados automaticamente a todos os produtos cadastrados
          </p>
        </div>

        <!-- Aviso para Modo Individual -->
        <div id="individual-escalation-notice" class="conditional-section" ${individualVisible}>
          <div class="notice-box">
            <p>✏️ Você definirá o escalonamento individualmente para cada produto na tabela de cadastro</p>
            <p class="help-text">Cada produto poderá ter percentuais únicos de crescimento anual</p>
          </div>
        </div>

        <div class="button-group">
          <button id="save-escalation-mode" class="btn-primary">
            💾 Salvar Configuração de Escalonamento
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Anexa event listeners aos elementos
   */
  attachEventListeners() {
    // Radio buttons (mudança de modo)
    const radios = this.container.querySelectorAll('input[name="escalation-mode"]');
    radios.forEach(radio => {
      radio.addEventListener('change', (e) => {
        this.currentMode = e.target.value;
        this.render();
        this.attachEventListeners(); // Re-attach após render
      });
    });

    // Inputs de escalonamento global
    ['ano1', 'ano2', 'ano3', 'ano4'].forEach(ano => {
      const input = this.container.querySelector(`#global-${ano}`);
      if (input) {
        input.addEventListener('input', (e) => {
          const value = parseFloat(e.target.value);

          // Validação básica
          if (isNaN(value) || value < 0 || value > 100) {
            e.target.classList.add('input-error');
            return;
          }

          e.target.classList.remove('input-error');
          this.globalEscalation[ano] = value;
        });

        // Validação ao sair do campo
        input.addEventListener('blur', (e) => {
          const value = parseFloat(e.target.value);

          if (isNaN(value) || value < 0) {
            e.target.value = 0;
            this.globalEscalation[ano] = 0;
          } else if (value > 100) {
            e.target.value = 100;
            this.globalEscalation[ano] = 100;
          }
        });
      }
    });

    // Botão salvar
    const saveBtn = this.container.querySelector('#save-escalation-mode');
    if (saveBtn) {
      saveBtn.addEventListener('click', async () => {
        try {
          // Validar antes de salvar
          if (this.currentMode === 'global') {
            const hasValues = Object.values(this.globalEscalation).some(v => v > 0);
            if (!hasValues) {
              this.showFeedback('⚠️ Defina pelo menos um percentual de escalonamento', 'warning');
              return;
            }
          }

          saveBtn.disabled = true;
          saveBtn.textContent = '💾 Salvando...';

          await this.saveConfig();

          this.showFeedback('✅ Configuração de escalonamento salva com sucesso', 'success');

          setTimeout(() => {
            saveBtn.disabled = false;
            saveBtn.textContent = '💾 Salvar Configuração de Escalonamento';
          }, 1000);

        } catch (error) {
          console.error('Erro ao salvar configuração:', error);
          this.showFeedback('❌ Erro ao salvar configuração: ' + error.message, 'error');
          saveBtn.disabled = false;
          saveBtn.textContent = '💾 Salvar Configuração de Escalonamento';
        }
      });
    }
  }

  /**
   * Dispara evento customizado quando modo muda
   */
  dispatchChangeEvent() {
    const event = new CustomEvent('escalation-mode-changed', {
      detail: {
        mode: this.currentMode,
        globalEscalation: this.globalEscalation
      },
      bubbles: true
    });

    window.dispatchEvent(event);
    console.log('📢 Evento escalation-mode-changed disparado:', this.currentMode);
  }

  /**
   * Exibe feedback visual ao usuário
   */
  showFeedback(message, type = 'info') {
    // Criar elemento de feedback se não existir
    let feedbackEl = this.container.querySelector('.escalation-feedback');

    if (!feedbackEl) {
      feedbackEl = document.createElement('div');
      feedbackEl.className = 'escalation-feedback';
      this.container.appendChild(feedbackEl);
    }

    feedbackEl.textContent = message;
    feedbackEl.className = `escalation-feedback ${type}`;
    feedbackEl.style.display = 'block';

    // Auto-hide após 5 segundos
    setTimeout(() => {
      feedbackEl.style.display = 'none';
    }, 5000);
  }

  /**
   * Retorna configuração atual
   */
  getConfig() {
    return {
      mode: this.currentMode,
      globalEscalation: this.globalEscalation
    };
  }

  /**
   * Verifica se está em modo global
   */
  isGlobalMode() {
    return this.currentMode === 'global';
  }

  /**
   * Verifica se está em modo individual
   */
  isIndividualMode() {
    return this.currentMode === 'individual';
  }

  /**
   * Retorna percentual de escalonamento para um ano (modo global)
   * @param {string} ano - "ano1", "ano2", "ano3", "ano4"
   */
  getGlobalPercentage(ano) {
    if (!this.isGlobalMode()) {
      throw new Error('Método getGlobalPercentage() só funciona em modo global');
    }

    return this.globalEscalation[ano] || 0;
  }
}

// Exportar para uso global
if (typeof window !== 'undefined') {
  window.EscalationModeSelector = EscalationModeSelector;
  console.log('[EscalationModeSelector] Classe disponível para uso');
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = EscalationModeSelector;
}
