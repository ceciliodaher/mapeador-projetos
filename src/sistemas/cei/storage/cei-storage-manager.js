/* =====================================
   CEI-STORAGE-MANAGER.JS
   Gerenciador de localStorage para CEI
   Com migração automática de versões antigas
   NO FALLBACKS - NO HARDCODED DATA
   ===================================== */

/**
 * Gerenciador de armazenamento para formulário CEI
 * Responsável por salvar, carregar e migrar dados do localStorage
 *
 * @class CEIStorageManager
 */
export class CEIStorageManager {
    /**
     * @param {Object} config - Configuração CEI
     */
    constructor(config) {
        if (!config) {
            throw new Error('CEIStorageManager: configuração obrigatória não fornecida');
        }

        if (!config.programType || config.programType !== 'CEI') {
            throw new Error('CEIStorageManager: configuração deve ser do tipo CEI');
        }

        this.config = config;
        this.storageKey = 'formData_CEI';
        this.storageVersion = '2.0';

        // Migrar dados antigos automaticamente
        this.#migrateIfNeeded();
    }

    /**
     * Salva dados do formulário
     * @public
     * @param {Object} formData - Dados do formulário
     * @param {number} currentStep - Step atual
     */
    saveFormData(formData, currentStep) {
        if (!formData || typeof formData !== 'object') {
            throw new Error('CEIStorageManager: formData deve ser um objeto');
        }

        const dataToSave = {
            version: this.storageVersion,
            formData: formData,
            currentStep: currentStep || 1,
            savedAt: new Date().toISOString(),
            programType: 'CEI'
        };

        try {
            localStorage.setItem(this.storageKey, JSON.stringify(dataToSave));
        } catch (error) {
            console.error('[CEI Storage] Erro ao salvar:', error);
            throw new Error('Erro ao salvar dados no localStorage');
        }
    }

    /**
     * Carrega dados do formulário
     * @public
     * @returns {Object|null} Dados salvos ou null
     */
    loadFormData() {
        try {
            const savedData = localStorage.getItem(this.storageKey);

            if (!savedData) {
                return null;
            }

            const parsedData = JSON.parse(savedData);

            // Verificar se é formato antigo (sem version)
            if (!parsedData.version) {
                console.log('[CEI Storage] Formato antigo detectado - migrando...');
                return this.#migrateLegacyData(parsedData);
            }

            // Verificar compatibilidade de versão
            if (parsedData.version !== this.storageVersion) {
                console.warn(`[CEI Storage] Versão diferente: ${parsedData.version} -> ${this.storageVersion}`);
            }

            return parsedData;
        } catch (error) {
            console.error('[CEI Storage] Erro ao carregar dados:', error);
            return null;
        }
    }

    /**
     * Limpa dados do localStorage
     * @public
     */
    clearStorage() {
        try {
            localStorage.removeItem(this.storageKey);
            console.log('[CEI Storage] Dados limpos');
        } catch (error) {
            console.error('[CEI Storage] Erro ao limpar:', error);
            throw new Error('Erro ao limpar dados do localStorage');
        }
    }

    /**
     * Verifica se existem dados salvos
     * @public
     * @returns {boolean} True se existem dados
     */
    hasSavedData() {
        const savedData = localStorage.getItem(this.storageKey);
        return savedData !== null;
    }

    /**
     * Exporta dados do localStorage
     * @public
     * @returns {Object|null} Dados exportados
     */
    exportData() {
        const data = this.loadFormData();

        if (!data) {
            return null;
        }

        return {
            ...data,
            exportedAt: new Date().toISOString()
        };
    }

    /**
     * Importa dados para o localStorage
     * @public
     * @param {Object} data - Dados para importar
     */
    importData(data) {
        if (!data || typeof data !== 'object') {
            throw new Error('CEIStorageManager: dados para importar devem ser um objeto');
        }

        // Validar dados mínimos
        if (!data.formData || typeof data.formData !== 'object') {
            throw new Error('CEIStorageManager: dados de importação inválidos (formData ausente)');
        }

        // Normalizar para formato atual
        const normalizedData = {
            version: this.storageVersion,
            formData: data.formData,
            currentStep: data.currentStep || 1,
            savedAt: new Date().toISOString(),
            programType: 'CEI',
            importedFrom: data.version || 'unknown'
        };

        try {
            localStorage.setItem(this.storageKey, JSON.stringify(normalizedData));
            console.log('[CEI Storage] Dados importados com sucesso');
        } catch (error) {
            console.error('[CEI Storage] Erro ao importar:', error);
            throw new Error('Erro ao importar dados para localStorage');
        }
    }

    /**
     * Migra dados antigos automaticamente se necessário
     * @private
     */
    #migrateIfNeeded() {
        const savedData = localStorage.getItem(this.storageKey);

        if (!savedData) {
            return; // Nenhum dado para migrar
        }

        try {
            const parsedData = JSON.parse(savedData);

            // Se já está no formato novo, não faz nada
            if (parsedData.version === this.storageVersion) {
                return;
            }

            // Se não tem version, é formato antigo
            if (!parsedData.version) {
                console.log('[CEI Storage] Migrando dados antigos automaticamente...');
                const migratedData = this.#migrateLegacyData(parsedData);
                this.saveFormData(migratedData.formData, migratedData.currentStep);
                console.log('[CEI Storage] Migração automática concluída');
            }
        } catch (error) {
            console.error('[CEI Storage] Erro na migração automática:', error);
            // Não lança exceção - migração é best-effort
        }
    }

    /**
     * Migra dados do formato legado (v1.0) para formato atual (v2.0)
     * @private
     * @param {Object} legacyData - Dados no formato antigo
     * @returns {Object} Dados no formato novo
     */
    #migrateLegacyData(legacyData) {
        console.log('[CEI Storage] Iniciando migração de formato legado...');

        // Formato legado: { formData: {...}, currentStep: N, savedAt: ISO }
        // Formato novo: { version: "2.0", formData: {...}, currentStep: N, savedAt: ISO, programType: "CEI" }

        const migratedData = {
            version: this.storageVersion,
            formData: legacyData.formData || {},
            currentStep: legacyData.currentStep || 1,
            savedAt: legacyData.savedAt || new Date().toISOString(),
            programType: 'CEI',
            migratedFrom: '1.0'
        };

        // Se formData tinha _metadata, preservar mas atualizar version
        if (migratedData.formData._metadata) {
            migratedData.formData._metadata.version = this.storageVersion;
            migratedData.formData._metadata.migratedAt = new Date().toISOString();
        }

        console.log('[CEI Storage] Migração concluída');
        return migratedData;
    }

    /**
     * Retorna estatísticas de armazenamento
     * @public
     * @returns {Object} Estatísticas
     */
    getStorageStats() {
        const savedData = localStorage.getItem(this.storageKey);

        if (!savedData) {
            return {
                hasData: false,
                size: 0,
                version: null,
                lastSaved: null
            };
        }

        const parsedData = JSON.parse(savedData);
        const sizeInBytes = new Blob([savedData]).size;
        const sizeInKB = (sizeInBytes / 1024).toFixed(2);

        return {
            hasData: true,
            size: `${sizeInKB} KB`,
            sizeInBytes: sizeInBytes,
            version: parsedData.version || '1.0 (legacy)',
            lastSaved: parsedData.savedAt,
            currentStep: parsedData.currentStep,
            fieldCount: Object.keys(parsedData.formData || {}).length
        };
    }
}
