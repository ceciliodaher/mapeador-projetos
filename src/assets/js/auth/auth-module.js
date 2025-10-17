/* =====================================
   AUTH-MODULE.JS
   Sistema de Autenticação para Modo Analista
   SHA-256 + IndexedDB Sessions + Brute-Force Protection
   NO HARDCODED DATA - NO FALLBACKS - KISS - DRY - SOLID
   ===================================== */

// ⚠️ DESENVOLVIMENTO: Desabilita autenticação temporariamente
// ATENÇÃO: MUDAR PARA false EM PRODUÇÃO!
const DEV_MODE_BYPASS_AUTH = true;

class AuthModule {
  /**
   * @param {IndexedDBManager} dbManager - Gerenciador do IndexedDB
   * @param {Object} config - Configuração carregada de auth-config.json
   */
  constructor(dbManager, config) {
    // ⚠️ MODO DESENVOLVIMENTO: Permite inicialização sem config
    if (DEV_MODE_BYPASS_AUTH) {
      console.warn('⚠️ DEV MODE: AuthModule inicializado em modo bypass - config opcional');
      this.dbManager = dbManager;
      this.config = config?.analyst || { session: {}, security: {} };
      this.currentSessionId = null;
      this.isAuthenticatedFlag = true; // Sempre autenticado em DEV
      this.ATTEMPTS_KEY = 'auth_attempts';
      this.LOCKOUT_KEY = 'auth_lockout_until';
      console.log('🔐 AuthModule inicializado [DEV MODE - BYPASS ATIVO]');
      return;
    }

    if (!dbManager) {
      throw new Error('AuthModule: dbManager é obrigatório');
    }

    if (!config || !config.analyst) {
      throw new Error('AuthModule: config.analyst é obrigatório');
    }

    this.dbManager = dbManager;
    this.config = config.analyst;

    // State
    this.currentSessionId = null;
    this.isAuthenticatedFlag = false;

    // Brute-force protection (localStorage para persistir entre reloads)
    this.ATTEMPTS_KEY = 'auth_attempts';
    this.LOCKOUT_KEY = 'auth_lockout_until';

    console.log('🔐 AuthModule inicializado');
  }

  /**
   * Realiza login do analista
   * Single Responsibility: apenas lógica de autenticação
   *
   * @param {string} password - Senha em texto plano
   * @returns {Promise<{success: boolean, message: string, sessionId?: string}>}
   */
  async login(password) {
    try {
      console.log('🔑 Tentativa de login...');

      // 1. Verificar brute-force protection
      const bruteForceCheck = await this.checkBruteForce();
      if (!bruteForceCheck.allowed) {
        return {
          success: false,
          message: bruteForceCheck.message
        };
      }

      // 2. Validar senha
      const passwordHash = await this.hashPassword(password);
      const isValid = await this.validatePassword(passwordHash);

      if (!isValid) {
        // Incrementar contador de tentativas
        await this.incrementAttempts();

        const attempts = this.getAttempts();
        const remaining = this.config.security.maxAttempts - attempts;

        console.warn(`✗ Login falhou. Tentativas restantes: ${remaining}`);

        return {
          success: false,
          message: remaining > 0
            ? `Senha incorreta. ${remaining} tentativa(s) restante(s).`
            : `Número máximo de tentativas excedido. Bloqueado por ${this.config.security.lockoutDurationMs / 60000} minutos.`
        };
      }

      // 3. Senha válida - resetar tentativas
      await this.resetAttempts();

      // 4. Criar sessão
      const session = await this.createSession();

      console.log(`✓ Login bem-sucedido: sessão ${session.id}`);

      return {
        success: true,
        message: 'Login realizado com sucesso',
        sessionId: session.id
      };

    } catch (error) {
      console.error('✗ Erro no login:', error);
      throw new Error(`AuthModule.login: ${error.message}`);
    }
  }

  /**
   * Realiza logout do analista
   *
   * @returns {Promise<{success: boolean}>}
   */
  async logout() {
    try {
      console.log('🚪 Realizando logout...');

      if (this.currentSessionId) {
        await this.destroySession(this.currentSessionId);
      }

      console.log('✓ Logout realizado');

      return { success: true };

    } catch (error) {
      console.error('✗ Erro no logout:', error);
      throw new Error(`AuthModule.logout: ${error.message}`);
    }
  }

  /**
   * Verifica se há sessão ativa e válida
   *
   * @returns {Promise<boolean>}
   */
  async isAuthenticated() {
    // ⚠️ MODO DESENVOLVIMENTO: Bypass de autenticação
    if (DEV_MODE_BYPASS_AUTH) {
      console.warn('⚠️ DEV MODE: Autenticação desabilitada - acesso total liberado');
      this.isAuthenticatedFlag = true;
      return true;
    }

    try {
      if (!this.currentSessionId) {
        // Tentar recuperar sessão ativa do IndexedDB
        const activeSession = await this.findActiveSession();

        if (activeSession) {
          this.currentSessionId = activeSession.id;
          this.isAuthenticatedFlag = true;
          return true;
        }

        this.isAuthenticatedFlag = false;
        return false;
      }

      // Validar sessão existente
      const isValid = await this.validateSession(this.currentSessionId);

      this.isAuthenticatedFlag = isValid;
      return isValid;

    } catch (error) {
      console.error('✗ Erro ao verificar autenticação:', error);
      this.isAuthenticatedFlag = false;
      return false;
    }
  }

  /**
   * Renova a sessão atual (estende expiração)
   * Dependency Inversion: depende da abstração do dbManager
   *
   * @returns {Promise<boolean>}
   */
  async renewSession() {
    try {
      if (!this.currentSessionId) {
        console.warn('⚠ Nenhuma sessão ativa para renovar');
        return false;
      }

      const session = await this.dbManager.get('sessoes_analista', this.currentSessionId);

      if (!session) {
        console.warn('⚠ Sessão não encontrada no banco');
        this.currentSessionId = null;
        this.isAuthenticatedFlag = false;
        return false;
      }

      // Verificar se ainda está no período de renovação
      const now = Date.now();
      if (now > session.expiresAt) {
        console.warn('⚠ Sessão expirada, não é possível renovar');
        await this.destroySession(this.currentSessionId);
        return false;
      }

      // Renovar expiração
      const newExpiresAt = now + this.config.session.timeoutMs;

      await this.dbManager.update('sessoes_analista', this.currentSessionId, {
        expiresAt: newExpiresAt,
        lastActivity: now
      });

      console.log(`✓ Sessão renovada até ${new Date(newExpiresAt).toLocaleString('pt-BR')}`);

      return true;

    } catch (error) {
      console.error('✗ Erro ao renovar sessão:', error);
      return false;
    }
  }

  /**
   * Verifica proteção contra brute-force
   * Open/Closed Principle: extensível via configuração
   *
   * @returns {Promise<{allowed: boolean, message?: string}>}
   */
  async checkBruteForce() {
    const lockoutUntil = localStorage.getItem(this.LOCKOUT_KEY);

    if (lockoutUntil) {
      const lockoutTimestamp = parseInt(lockoutUntil, 10);
      const now = Date.now();

      if (now < lockoutTimestamp) {
        const remainingMs = lockoutTimestamp - now;
        const remainingMinutes = Math.ceil(remainingMs / 60000);

        return {
          allowed: false,
          message: `Login bloqueado. Tente novamente em ${remainingMinutes} minuto(s).`
        };
      } else {
        // Lockout expirado, limpar
        localStorage.removeItem(this.LOCKOUT_KEY);
        localStorage.removeItem(this.ATTEMPTS_KEY);
      }
    }

    return { allowed: true };
  }

  // ==========================================
  // MÉTODOS PRIVADOS - Session Management
  // ==========================================

  /**
   * Cria nova sessão no IndexedDB
   */
  async createSession() {
    const now = Date.now();
    const sessionId = this.generateSessionId();

    const session = {
      id: sessionId,
      timestamp: now,
      expiresAt: now + this.config.session.timeoutMs,
      isActive: true,
      lastActivity: now,
      userAgent: navigator.userAgent
    };

    await this.dbManager.save('sessoes_analista', session);

    // Atualizar estado interno
    this.currentSessionId = sessionId;
    this.isAuthenticatedFlag = true;

    return session;
  }

  /**
   * Valida se sessão está ativa e não expirou
   */
  async validateSession(sessionId) {
    try {
      const session = await this.dbManager.get('sessoes_analista', sessionId);

      if (!session) {
        console.warn('⚠ Sessão não encontrada');
        return false;
      }

      if (!session.isActive) {
        console.warn('⚠ Sessão inativa');
        return false;
      }

      const now = Date.now();
      if (now > session.expiresAt) {
        console.warn('⚠ Sessão expirada');
        await this.destroySession(sessionId);
        return false;
      }

      // Renovar automaticamente se configurado
      if (this.config.session.renewOnActivity) {
        await this.renewSession();
      }

      return true;

    } catch (error) {
      console.error('✗ Erro ao validar sessão:', error);
      return false;
    }
  }

  /**
   * Busca sessão ativa no banco
   */
  async findActiveSession() {
    try {
      const allSessions = await this.dbManager.getAll('sessoes_analista', 'isActive', true);

      if (allSessions.length === 0) {
        return null;
      }

      // Ordenar por timestamp (mais recente primeiro)
      allSessions.sort((a, b) => b.timestamp - a.timestamp);

      const now = Date.now();

      // Encontrar primeira sessão válida
      for (const session of allSessions) {
        if (session.isActive && now < session.expiresAt) {
          return session;
        } else {
          // Sessão expirada, marcar como inativa
          await this.destroySession(session.id);
        }
      }

      return null;

    } catch (error) {
      console.error('✗ Erro ao buscar sessão ativa:', error);
      return null;
    }
  }

  /**
   * Destroi sessão (marca como inativa)
   */
  async destroySession(sessionId) {
    try {
      await this.dbManager.update('sessoes_analista', sessionId, {
        isActive: false,
        destroyedAt: Date.now()
      });

      // Limpar estado interno
      if (this.currentSessionId === sessionId) {
        this.currentSessionId = null;
        this.isAuthenticatedFlag = false;
      }

      console.log(`🗑 Sessão ${sessionId} destruída`);

    } catch (error) {
      console.error('✗ Erro ao destruir sessão:', error);
    }
  }

  /**
   * Gera ID único para sessão
   */
  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // ==========================================
  // MÉTODOS PRIVADOS - Password & Security
  // ==========================================

  /**
   * Gera hash SHA-256 de uma senha
   * Interface Segregation: interface mínima para hashing
   *
   * @param {string} password - Senha em texto plano
   * @returns {Promise<string>} - Hash hexadecimal
   */
  async hashPassword(password) {
    if (!password) {
      throw new Error('Password não pode ser vazio');
    }

    try {
      // Usar Web Crypto API (nativa do browser)
      const encoder = new TextEncoder();
      const data = encoder.encode(password);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);

      // Converter para hex
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      return hashHex;

    } catch (error) {
      console.error('✗ Erro ao gerar hash:', error);
      throw new Error(`Erro ao processar senha: ${error.message}`);
    }
  }

  /**
   * Valida hash de senha contra configuração
   *
   * @param {string} passwordHash - Hash da senha fornecida
   * @returns {Promise<boolean>}
   */
  async validatePassword(passwordHash) {
    const expectedHash = this.config.passwordHash;

    if (!expectedHash) {
      throw new Error('passwordHash não configurado em auth-config.json');
    }

    return passwordHash === expectedHash;
  }

  // ==========================================
  // MÉTODOS PRIVADOS - Brute-Force Protection
  // ==========================================

  /**
   * Incrementa contador de tentativas falhas
   */
  async incrementAttempts() {
    const attempts = this.getAttempts() + 1;
    localStorage.setItem(this.ATTEMPTS_KEY, attempts.toString());

    console.warn(`⚠ Tentativas de login: ${attempts}/${this.config.security.maxAttempts}`);

    // Verificar se excedeu limite
    if (attempts >= this.config.security.maxAttempts) {
      const lockoutUntil = Date.now() + this.config.security.lockoutDurationMs;
      localStorage.setItem(this.LOCKOUT_KEY, lockoutUntil.toString());

      console.error(`🔒 Login bloqueado até ${new Date(lockoutUntil).toLocaleString('pt-BR')}`);
    }
  }

  /**
   * Retorna número de tentativas atuais
   */
  getAttempts() {
    const attempts = localStorage.getItem(this.ATTEMPTS_KEY);
    return attempts ? parseInt(attempts, 10) : 0;
  }

  /**
   * Reseta contador de tentativas (após login bem-sucedido)
   */
  async resetAttempts() {
    localStorage.removeItem(this.ATTEMPTS_KEY);
    localStorage.removeItem(this.LOCKOUT_KEY);
    console.log('✓ Contador de tentativas resetado');
  }

  // ==========================================
  // MÉTODOS PÚBLICOS - Utilities
  // ==========================================

  /**
   * Retorna informações da sessão atual
   */
  async getCurrentSession() {
    if (!this.currentSessionId) {
      return null;
    }

    return await this.dbManager.get('sessoes_analista', this.currentSessionId);
  }

  /**
   * Retorna estatísticas de autenticação
   */
  getAuthStats() {
    return {
      isAuthenticated: this.isAuthenticatedFlag,
      currentSessionId: this.currentSessionId,
      attempts: this.getAttempts(),
      maxAttempts: this.config.security.maxAttempts,
      sessionTimeout: this.config.session.timeoutMs,
      lockoutDuration: this.config.security.lockoutDurationMs
    };
  }

  /**
   * Força limpeza de todas as sessões (útil para desenvolvimento)
   */
  async clearAllSessions() {
    try {
      const allSessions = await this.dbManager.getAll('sessoes_analista');

      for (const session of allSessions) {
        await this.dbManager.delete('sessoes_analista', session.id);
      }

      this.currentSessionId = null;
      this.isAuthenticatedFlag = false;

      console.log(`🗑 ${allSessions.length} sessão(ões) removida(s)`);

      return { success: true, count: allSessions.length };

    } catch (error) {
      console.error('✗ Erro ao limpar sessões:', error);
      throw error;
    }
  }

  /**
   * Monitora atividade do usuário para auto-renovação
   * Deve ser chamado por componentes UI
   */
  notifyActivity() {
    if (this.isAuthenticatedFlag && this.config.session.renewOnActivity) {
      // Debounce: renovar no máximo a cada minuto
      const now = Date.now();
      if (!this._lastRenewal || (now - this._lastRenewal) > 60000) {
        this._lastRenewal = now;
        this.renewSession().catch(err => {
          console.error('✗ Erro ao renovar sessão em atividade:', err);
        });
      }
    }
  }
}

// Exportar para uso global
if (typeof window !== 'undefined') {
  window.AuthModule = AuthModule;
}
