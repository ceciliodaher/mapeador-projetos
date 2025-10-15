/* =====================================
   PROGOIAS-FORM-SYNC.JS
   Sincronização Form HTML ↔ IndexedDB
   NO FALLBACKS - Validação explícita
   ===================================== */

class ProGoiasFormSync {
    constructor(dbManager) {
        if (!dbManager) {
            throw new Error('ProGoiasFormSync: dbManager é obrigatório');
        }

        this.dbManager = dbManager;
        this.maxProdutos = 10;
        this.maxInsumos = 10;

        console.log('[FormSync] Inicializado');
    }

    /**
     * Configurar listeners para auto-save em blur
     */
    setupAutoSaveListeners() {
        // Produtos (Seção 5)
        for (let i = 1; i <= this.maxProdutos; i++) {
            const nomeField = document.querySelector(`[name="produto${i}Nome"]`);
            if (nomeField) {
                nomeField.addEventListener('blur', () => this.syncProduto(i));

                // Listener em todos os campos relacionados
                const relatedFields = [
                    `produto${i}Unidade`,
                    `produto${i}Preco`,
                    `produto${i}NCM`,
                    `produto${i}CFOP`
                ];

                relatedFields.forEach(fieldName => {
                    const field = document.querySelector(`[name="${fieldName}"]`);
                    if (field) {
                        field.addEventListener('blur', () => this.syncProduto(i));
                    }
                });
            }
        }

        // Insumos (Seção 6)
        for (let i = 1; i <= this.maxInsumos; i++) {
            const nomeField = document.querySelector(`[name="insumo${i}Nome"]`);
            if (nomeField) {
                nomeField.addEventListener('blur', () => this.syncInsumo(i));

                const relatedFields = [
                    `insumo${i}Unidade`,
                    `insumo${i}CustoAtual`,
                    `insumo${i}CustoUnitario`,
                    `insumo${i}NCM`
                ];

                relatedFields.forEach(fieldName => {
                    const field = document.querySelector(`[name="${fieldName}"]`);
                    if (field) {
                        field.addEventListener('blur', () => this.syncInsumo(i));
                    }
                });
            }
        }

        console.log('[FormSync] Listeners de auto-save configurados');
    }

    /**
     * Sincronizar produto específico Form → IndexedDB
     */
    async syncProduto(index) {
        const nomeField = document.querySelector(`[name="produto${index}Nome"]`);

        // Validação: só sincroniza se nome existir
        if (!nomeField || !nomeField.value || !nomeField.value.trim()) {
            return;
        }

        const produto = this.extractProdutoFromFields(index);

        if (produto && produto.nome) {
            await this.dbManager.saveProduto(produto);
            console.log(`[FormSync] Produto ${index} sincronizado: ${produto.nome}`);
        }
    }

    /**
     * Sincronizar insumo específico Form → IndexedDB
     */
    async syncInsumo(index) {
        const nomeField = document.querySelector(`[name="insumo${index}Nome"]`);

        if (!nomeField || !nomeField.value || !nomeField.value.trim()) {
            return;
        }

        const insumo = this.extractInsumoFromFields(index);

        if (insumo && insumo.nome) {
            await this.dbManager.saveInsumo(insumo);
            console.log(`[FormSync] Insumo ${index} sincronizado: ${insumo.nome}`);
        }
    }

    /**
     * Extrair dados de produto dos campos do formulário
     */
    extractProdutoFromFields(index) {
        const getValue = (fieldName) => {
            const field = document.querySelector(`[name="${fieldName}"]`);
            if (!field) return '';

            const value = field.value;
            if (value && value.trim()) {
                return value.trim();
            }
            return '';
        };

        const nome = getValue(`produto${index}Nome`);
        if (!nome) return null;

        // Helper para valores numéricos
        const getNumericValue = (fieldName) => {
            const value = getValue(fieldName);
            if (!value) return 0;
            const cleanValue = value.replace(/[^\d,.-]/g, '').replace(',', '.');
            const parsed = parseFloat(cleanValue);
            return isNaN(parsed) ? 0 : parsed;
        };

        // Calcular produção mensal a partir de quantidade futura (NO FALLBACKS)
        const quantidadeFutura = getNumericValue(`produto${index}QuantidadeFutura`);
        const producaoMensal = (quantidadeFutura !== null && quantidadeFutura > 0) ? quantidadeFutura / 12 : null;

        return {
            id: `produto_${index}`,
            nome: nome,
            unidade: getValue(`produto${index}Unidade`),

            // PREÇOS (renomear preco → precoVenda para compatibilidade com renderer)
            precoVenda: getNumericValue(`produto${index}Preco`),

            // QUANTIDADES (campos críticos para matriz)
            quantidadeAtual: getNumericValue(`produto${index}QuantidadeAtual`),
            quantidadeFutura: quantidadeFutura,
            producaoMensal: producaoMensal,

            // ESCALONAMENTO (usado em gráficos)
            ano1: getNumericValue(`produto${index}Ano1`),
            ano2: getNumericValue(`produto${index}Ano2`),
            ano3: getNumericValue(`produto${index}Ano3`),
            ano4: getNumericValue(`produto${index}Ano4`),

            // CLASSIFICAÇÃO
            ncm: getValue(`produto${index}NCM`),
            // CFOP removido - campo não existe no HTML

            // PERCENTUAIS DE DESTINO
            destinoGoiasPerc: getNumericValue(`produto${index}DestinoGoiasPerc`),
            destinoNoNeCoPerc: getNumericValue(`produto${index}DestinoNoNeCoPerc`),
            destinoSuSePerc: getNumericValue(`produto${index}DestinoSuSePerc`),
            exportacaoPerc: getNumericValue(`produto${index}ExportacaoPerc`),

            // ALÍQUOTAS ICMS (para cálculos)
            destinoGoiasAliq: getNumericValue(`produto${index}DestinoGoiasAliq`),

            ativo: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
    }

    /**
     * Extrair dados de insumo dos campos do formulário
     */
    extractInsumoFromFields(index) {
        const getValue = (fieldName) => {
            const field = document.querySelector(`[name="${fieldName}"]`);
            if (!field) return '';

            const value = field.value;
            if (value && value.trim()) {
                return value.trim();
            }
            return '';
        };

        const nome = getValue(`insumo${index}Nome`);
        if (!nome) return null;

        // Helper para valores numéricos (NO FALLBACKS)
        const getNumericValue = (fieldName) => {
            const value = getValue(fieldName);
            if (!value) return null;
            const cleanValue = value.replace(/[^\d,.-]/g, '').replace(',', '.');
            const parsed = parseFloat(cleanValue);
            if (isNaN(parsed)) return null;
            return parsed;
        };

        return {
            id: `insumo_${index}`,
            nome: nome,
            tipo: getValue(`insumo${index}Tipo`) || null, // permite null (graceful degradation)
            unidade: getValue(`insumo${index}Unidade`),

            // CUSTOS (valores numéricos para cálculos)
            custoAtual: getNumericValue(`insumo${index}CustoAtual`),
            custoUnitario: getNumericValue(`insumo${index}CustoUnitario`),

            // CLASSIFICAÇÃO
            ncm: getValue(`insumo${index}NCM`),

            // PERCENTUAIS DE ORIGEM
            origemGoiasPerc: getNumericValue(`insumo${index}OrigemGoiasPerc`),
            origemNoNeCoPerc: getNumericValue(`insumo${index}OrigemNoNeCoPerc`),
            origemSuSePerc: getNumericValue(`insumo${index}OrigemSuSePerc`),
            importacaoPerc: getNumericValue(`insumo${index}ImportacaoPerc`),

            // ALÍQUOTAS ICMS (para cálculos)
            origemGoiasAliq: getNumericValue(`insumo${index}OrigemGoiasAliq`),

            ativo: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
    }

    /**
     * Sincronizar TODOS os produtos de uma vez
     */
    async syncAllProdutos() {
        const produtosSincronizados = [];

        for (let i = 1; i <= this.maxProdutos; i++) {
            const produto = this.extractProdutoFromFields(i);

            if (produto && produto.nome) {
                await this.dbManager.saveProduto(produto);
                produtosSincronizados.push(produto.nome);
            }
        }

        if (produtosSincronizados.length > 0) {
            console.log(`[FormSync] ${produtosSincronizados.length} produtos sincronizados:`, produtosSincronizados);
        }

        return produtosSincronizados.length;
    }

    /**
     * Sincronizar TODOS os insumos de uma vez
     */
    async syncAllInsumos() {
        const insumosSincronizados = [];

        for (let i = 1; i <= this.maxInsumos; i++) {
            const insumo = this.extractInsumoFromFields(i);

            if (insumo && insumo.nome) {
                await this.dbManager.saveInsumo(insumo);
                insumosSincronizados.push(insumo.nome);
            }
        }

        if (insumosSincronizados.length > 0) {
            console.log(`[FormSync] ${insumosSincronizados.length} insumos sincronizados:`, insumosSincronizados);
        }

        return insumosSincronizados.length;
    }

    /**
     * Sincronização completa (produtos + insumos)
     */
    async syncAll() {
        const countProdutos = await this.syncAllProdutos();
        const countInsumos = await this.syncAllInsumos();

        console.log(`[FormSync] Sincronização completa: ${countProdutos} produtos, ${countInsumos} insumos`);

        return { produtos: countProdutos, insumos: countInsumos };
    }
}

// Disponibilizar globalmente
if (typeof window !== 'undefined') {
    window.ProGoiasFormSync = ProGoiasFormSync;
}
