/* =====================================
   PROGOIAS-STORAGE-MANAGER.JS
   Wrapper de alto nível para IndexedDB ProGoiás
   Coordena indexeddb-manager, form-sync e migração
   NO FALLBACKS - NO HARDCODED DATA
   ===================================== */

/**
 * Gerenciador de armazenamento para ProGoiás
 * Wrapper que coordena múltiplos módulos IndexedDB
 *
 * @class ProGoiasStorageManager
 */
export class ProGoiasStorageManager {
    /**
     * @param {Object} config - Configuração ProGoiás
     * @param {Object} dbManager - ProGoiasIndexedDBManager (optional, será criado se não fornecido)
     */
    constructor(config, dbManager = null) {
        if (!config) {
            throw new Error('ProGoiasStorageManager: configuração obrigatória não fornecida');
        }

        if (!config.programType || config.programType !== 'ProGoiás') {
            throw new Error('ProGoiasStorageManager: configuração deve ser do tipo ProGoiás');
        }

        this.config = config;
        this.dbManager = dbManager;
        this.formSync = null;
        this.initialized = false;
    }

    /**
     * Inicializa storage manager
     * @public
     * @returns {Promise<boolean>} True se inicializado com sucesso
     */
    async init() {
        if (this.initialized) {
            console.log('[ProGoiás Storage] Já inicializado');
            return true;
        }

        try {
            // Se dbManager não foi fornecido, usar o global (se disponível)
            if (!this.dbManager) {
                if (typeof window !== 'undefined' && window.ProGoiasIndexedDBManager) {
                    this.dbManager = new window.ProGoiasIndexedDBManager();
                } else {
                    throw new Error('ProGoiasIndexedDBManager não disponível. Certifique-se que progoias-indexeddb-manager.js foi carregado.');
                }
            }

            // Inicializar IndexedDB
            await this.dbManager.init();

            // Tentar migração de localStorage (se existir dados antigos)
            await this.dbManager.migrateFromLocalStorage();

            this.initialized = true;
            console.log('[ProGoiás Storage] Inicializado com sucesso');
            return true;
        } catch (error) {
            console.error('[ProGoiás Storage] Erro na inicialização:', error);
            throw error;
        }
    }

    /**
     * Salva dados do formulário
     * @public
     * @param {Object} formData - Dados do formulário
     * @param {number} currentStep - Seção atual (1-17)
     * @returns {Promise<string>} ID do projeto salvo
     */
    async saveFormData(formData, currentStep = 1) {
        this.#ensureInitialized();

        if (!formData || typeof formData !== 'object') {
            throw new Error('ProGoiasStorageManager: formData deve ser um objeto');
        }

        if (currentStep < 1 || currentStep > 17) {
            throw new Error('ProGoiasStorageManager: currentStep deve estar entre 1 e 17');
        }

        try {
            // Preparar dados com metadata
            const projectData = {
                ...formData,
                currentStep,
                programType: 'ProGoiás',
                version: '2.0',
                savedAt: new Date().toISOString()
            };

            // Salvar no IndexedDB
            const projectId = await this.dbManager.saveProject(projectData);

            // Log da ação
            await this.dbManager.logAction('save_form_data', {
                step: currentStep,
                fieldsCount: Object.keys(formData).length
            });

            return projectId;
        } catch (error) {
            console.error('[ProGoiás Storage] Erro ao salvar:', error);
            throw error;
        }
    }

    /**
     * Carrega dados do formulário
     * @public
     * @returns {Promise<Object|null>} Dados salvos ou null
     */
    async loadFormData() {
        this.#ensureInitialized();

        try {
            const project = await this.dbManager.loadProject();

            if (!project) {
                return null;
            }

            return {
                formData: project,
                currentStep: project.currentStep || 1,
                version: project.version || '1.0',
                savedAt: project.savedAt || new Date(project.updatedAt).toISOString()
            };
        } catch (error) {
            console.error('[ProGoiás Storage] Erro ao carregar:', error);
            throw error;
        }
    }

    /**
     * Importa dados de JSON
     * @public
     * @param {Object} data - Dados a importar
     * @returns {Promise<string>} ID do projeto importado
     */
    async importData(data) {
        this.#ensureInitialized();

        if (!data || typeof data !== 'object') {
            throw new Error('ProGoiasStorageManager: dados de importação inválidos');
        }

        try {
            // Normalizar dados importados
            const formData = data.formData || data;
            const currentStep = data.currentStep || 1;

            // Salvar dados importados
            const projectId = await this.saveFormData(formData, currentStep);

            // Log da ação
            await this.dbManager.logAction('import_data', {
                source: data._metadata?.source || 'unknown',
                fieldsCount: Object.keys(formData).length
            });

            console.log('[ProGoiás Storage] Dados importados com sucesso:', projectId);
            return projectId;
        } catch (error) {
            console.error('[ProGoiás Storage] Erro ao importar:', error);
            throw error;
        }
    }

    /**
     * Exporta dados atuais
     * @public
     * @returns {Promise<Object>} Dados para exportação
     */
    async exportData() {
        this.#ensureInitialized();

        try {
            const savedData = await this.loadFormData();

            if (!savedData) {
                throw new Error('Nenhum dado para exportar');
            }

            // Preparar estrutura de exportação
            const exportData = {
                programType: 'ProGoiás',
                version: '2.0',
                exportedAt: new Date().toISOString(),
                formData: savedData.formData,
                currentStep: savedData.currentStep
            };

            // Log da ação
            await this.dbManager.logAction('export_data', {
                step: savedData.currentStep
            });

            return exportData;
        } catch (error) {
            console.error('[ProGoiás Storage] Erro ao exportar:', error);
            throw error;
        }
    }

    /**
     * Limpa todos os dados armazenados
     * @public
     * @returns {Promise<boolean>} True se limpeza bem-sucedida
     */
    async clearStorage() {
        this.#ensureInitialized();

        try {
            // Limpar todas as stores
            await Promise.all([
                this.dbManager.clear('projetos_progoias'),
                this.dbManager.clear('produtos_progoias'),
                this.dbManager.clear('insumos_progoias'),
                this.dbManager.clear('produto_insumo_map'),
                this.dbManager.clear('auto_saves_progoias'),
                this.dbManager.clear('historico_progoias')
            ]);

            // Resetar currentProjectId
            this.dbManager.currentProjectId = null;

            console.log('[ProGoiás Storage] Todos os dados limpos');
            return true;
        } catch (error) {
            console.error('[ProGoiás Storage] Erro ao limpar dados:', error);
            throw error;
        }
    }

    /**
     * Retorna estatísticas de armazenamento
     * @public
     * @returns {Promise<Object>} Estatísticas
     */
    async getStorageStats() {
        this.#ensureInitialized();

        try {
            const [projetos, produtos, insumos, maps, autoSaves, historico] = await Promise.all([
                this.dbManager.getAll('projetos_progoias'),
                this.dbManager.getAll('produtos_progoias'),
                this.dbManager.getAll('insumos_progoias'),
                this.dbManager.getAll('produto_insumo_map'),
                this.dbManager.getAll('auto_saves_progoias'),
                this.dbManager.getAll('historico_progoias')
            ]);

            return {
                programType: 'ProGoiás',
                version: '2.0',
                stores: {
                    projetos: projetos?.length || 0,
                    produtos: produtos?.length || 0,
                    insumos: insumos?.length || 0,
                    produtoInsumoMap: maps?.length || 0,
                    autoSaves: autoSaves?.length || 0,
                    historico: historico?.length || 0
                },
                currentProjectId: this.dbManager.currentProjectId,
                lastProject: projetos?.[0] || null
            };
        } catch (error) {
            console.error('[ProGoiás Storage] Erro ao obter estatísticas:', error);
            throw error;
        }
    }

    /**
     * Salva auto-save (snapshot rápido)
     * @public
     * @param {number} secao - Seção atual
     * @param {Object} data - Dados para auto-save
     * @returns {Promise<any>} Resultado do save
     */
    async saveAutoSave(secao, data) {
        this.#ensureInitialized();

        try {
            return await this.dbManager.saveAutoSave(secao, data);
        } catch (error) {
            console.error('[ProGoiás Storage] Erro ao salvar auto-save:', error);
            throw error;
        }
    }

    /**
     * Registra ação no histórico
     * @public
     * @param {string} acao - Nome da ação
     * @param {Object} detalhes - Detalhes adicionais
     * @returns {Promise<any>} Resultado do log
     */
    async logAction(acao, detalhes = {}) {
        this.#ensureInitialized();

        try {
            return await this.dbManager.logAction(acao, detalhes);
        } catch (error) {
            console.error('[ProGoiás Storage] Erro ao registrar ação:', error);
            throw error;
        }
    }

    /**
     * Retorna histórico de ações
     * @public
     * @param {number} limit - Limite de resultados (default: 50)
     * @returns {Promise<Array>} Histórico ordenado por timestamp (mais recente primeiro)
     */
    async getHistorico(limit = 50) {
        this.#ensureInitialized();

        try {
            const historico = await this.dbManager.getAll('historico_progoias');

            if (!historico || historico.length === 0) {
                return [];
            }

            // Ordenar por timestamp decrescente
            historico.sort((a, b) => b.timestamp - a.timestamp);

            // Aplicar limite
            return historico.slice(0, limit);
        } catch (error) {
            console.error('[ProGoiás Storage] Erro ao obter histórico:', error);
            throw error;
        }
    }

    /* =====================================
       MÉTODOS ESPECÍFICOS PRODUTOS/INSUMOS
       ===================================== */

    /**
     * Salva produto
     * @public
     * @param {Object} produto - Dados do produto
     * @returns {Promise<string>} ID do produto salvo
     */
    async saveProduto(produto) {
        this.#ensureInitialized();
        return await this.dbManager.saveProduto(produto);
    }

    /**
     * Salva insumo
     * @public
     * @param {Object} insumo - Dados do insumo
     * @returns {Promise<string>} ID do insumo salvo
     */
    async saveInsumo(insumo) {
        this.#ensureInitialized();
        return await this.dbManager.saveInsumo(insumo);
    }

    /**
     * Lista produtos
     * @public
     * @param {boolean} apenasAtivos - Filtrar apenas ativos (default: true)
     * @returns {Promise<Array>} Lista de produtos
     */
    async listProdutos(apenasAtivos = true) {
        this.#ensureInitialized();
        return await this.dbManager.listProdutos(apenasAtivos);
    }

    /**
     * Lista insumos
     * @public
     * @param {boolean} apenasAtivos - Filtrar apenas ativos (default: true)
     * @returns {Promise<Array>} Lista de insumos
     */
    async listInsumos(apenasAtivos = true) {
        this.#ensureInitialized();
        return await this.dbManager.listInsumos(apenasAtivos);
    }

    /**
     * Obtém produto por ID
     * @public
     * @param {string} produtoId - ID do produto
     * @returns {Promise<Object|null>} Produto ou null
     */
    async getProduto(produtoId) {
        this.#ensureInitialized();
        return await this.dbManager.getProduto(produtoId);
    }

    /**
     * Obtém insumo por ID
     * @public
     * @param {string} insumoId - ID do insumo
     * @returns {Promise<Object|null>} Insumo ou null
     */
    async getInsumo(insumoId) {
        this.#ensureInitialized();
        return await this.dbManager.getInsumo(insumoId);
    }

    /**
     * Limpa produtos
     * @public
     * @returns {Promise<void>}
     */
    async clearProdutos() {
        this.#ensureInitialized();
        return await this.dbManager.clearProdutos();
    }

    /**
     * Limpa insumos
     * @public
     * @returns {Promise<void>}
     */
    async clearInsumos() {
        this.#ensureInitialized();
        return await this.dbManager.clearInsumos();
    }

    /* =====================================
       MÉTODOS PRIVADOS
       ===================================== */

    /**
     * Garante que storage foi inicializado
     * @private
     * @throws {Error} Se não inicializado
     */
    #ensureInitialized() {
        if (!this.initialized) {
            throw new Error('ProGoiasStorageManager: execute init() antes de usar');
        }
    }

    /**
     * Define FormSync (se disponível)
     * @public
     * @param {Object} formSync - Instância de ProGoiasFormSync
     */
    setFormSync(formSync) {
        this.formSync = formSync;
        console.log('[ProGoiás Storage] FormSync configurado');
    }

    /**
     * Retorna dbManager (para acesso direto quando necessário)
     * @public
     * @returns {Object} ProGoiasIndexedDBManager
     */
    getDBManager() {
        this.#ensureInitialized();
        return this.dbManager;
    }

    /**
     * Retorna configuração
     * @public
     * @returns {Object} Configuração ProGoiás
     */
    getConfig() {
        return this.config;
    }
}
