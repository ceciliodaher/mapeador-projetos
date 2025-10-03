/* =====================================
   ICMS-CALCULATOR.JS
   Módulo de cálculo automático de ICMS para ProGoiás
   Calcula créditos e débitos com ALÍQUOTAS DINÂMICAS
   NO FALLBACKS - NO HARDCODED DATA
   ===================================== */

class ICMSCalculator {
    constructor() {
        this.config = null;
        this.init();
    }

    async init() {
        // Aguardar DOM carregar
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', async () => {
                await this.loadConfig();
                this.setupEventListeners();
            });
        } else {
            await this.loadConfig();
            this.setupEventListeners();
        }
    }

    async loadConfig() {
        if (!window.configLoader) {
            throw new Error('ConfigLoader não disponível. Inclua config-loader.js antes de icms-calculator.js');
        }

        try {
            this.config = await window.configLoader.loadConfig();
            console.log('[ICMSCalculator] Configuração carregada - alíquotas dinâmicas ativas');
        } catch (error) {
            console.error('[ICMSCalculator] Erro ao carregar configuração:', error);
            throw error;
        }
    }

    setupEventListeners() {
        // Escutar mudanças em campos de produtos (seção 5)
        document.addEventListener('input', (e) => {
            if (e.target.closest('[data-section="5"]') || e.target.closest('[data-section="6"]')) {
                this.debounce(() => this.calculateICMS(), 500)();
            }
        });

        // Escutar mudanças em campos de investimento (seção 3)
        document.addEventListener('input', (e) => {
            if (e.target.closest('[data-section="3"]')) {
                this.debounce(() => this.validateInvestment(), 500)();
            }
        });
    }

    // Função principal de cálculo
    calculateICMS() {
        try {
            const produtos = this.collectProductData();
            const insumos = this.collectInsumoData();

            // Calcular débitos (vendas)
            const debitos = this.calculateDebitos(produtos);

            // Calcular créditos (compras de insumos)
            const creditos = this.calculateCreditos(insumos);

            // ICMS líquido gerado
            const icmsLiquido = debitos.total - creditos.total;

            // Benefício ProGoiás (percentual da configuração)
            const percentualBeneficio = window.configLoader.getPercentualBeneficio();
            const beneficio = icmsLiquido * percentualBeneficio;

            // Atualizar interface
            this.updateInterface({
                debitos,
                creditos,
                icmsLiquido,
                beneficio
            });

            // Validar investimento
            this.validateInvestment(beneficio);

        } catch (error) {
            console.error('Erro no cálculo de ICMS:', error);
        }
    }

    collectProductData() {
        const produtos = [];
        const container = document.getElementById('produtos-container');

        if (!container) return produtos;

        const entries = container.querySelectorAll('.produto-entry');

        entries.forEach((entry, index) => {
            const idx = index + 1;
            const nome = this.getValue(`produto${idx}Nome`);

            if (!nome) return; // Produto vazio, pular

            const produto = {
                nome: nome,
                preco: this.parseFloat(this.getValue(`produto${idx}Preco`)),
                quantidadeFutura: this.parseFloat(this.getValue(`produto${idx}QuantidadeFutura`)),
                ncm: this.getValue(`produto${idx}NCM`),

                // ALÍQUOTAS DINÂMICAS por região
                destinoGoiasPerc: this.parseFloat(this.getValue(`produto${idx}DestinoGoiasPerc`)),
                destinoGoiasAliq: this.parseFloat(this.getValue(`produto${idx}DestinoGoiasAliq`)),

                destinoNoNeCoPerc: this.parseFloat(this.getValue(`produto${idx}DestinoNoNeCoPerc`)),
                destinoNoNeCoAliq: this.parseFloat(this.getValue(`produto${idx}DestinoNoNeCoAliq`)),

                destinoSuSePerc: this.parseFloat(this.getValue(`produto${idx}DestinoSuSePerc`)),
                destinoSuSeAliq: this.parseFloat(this.getValue(`produto${idx}DestinoSuSeAliq`)),

                destinoExportacaoPerc: this.parseFloat(this.getValue(`produto${idx}DestinoExportacaoPerc`)),
                destinoExportacaoAliq: this.parseFloat(this.getValue(`produto${idx}DestinoExportacaoAliq`))
            };

            if (produto.preco && produto.quantidadeFutura) {
                produto.faturamentoAnual = produto.preco * produto.quantidadeFutura;
                produtos.push(produto);
            }
        });

        return produtos;
    }

    collectInsumoData() {
        const insumos = [];
        const container = document.getElementById('insumos-container');

        if (!container) return insumos;

        const entries = container.querySelectorAll('.insumo-entry');

        entries.forEach((entry, index) => {
            const idx = index + 1;
            const nome = this.getValue(`insumo${idx}Nome`);

            if (!nome) return; // Insumo vazio, pular

            const insumo = {
                nome: nome,
                tipo: this.getValue(`insumo${idx}Tipo`),
                custoUnitario: this.parseFloat(this.getValue(`insumo${idx}CustoUnitario`)),
                quantidadeFutura: this.parseFloat(this.getValue(`insumo${idx}QuantidadeFutura`)),
                ncm: this.getValue(`insumo${idx}NCM`),

                // ALÍQUOTAS DINÂMICAS por região
                origemGoiasPerc: this.parseFloat(this.getValue(`insumo${idx}OrigemGoiasPerc`)),
                origemGoiasAliq: this.parseFloat(this.getValue(`insumo${idx}OrigemGoiasAliq`)),

                origemNoNeCoPerc: this.parseFloat(this.getValue(`insumo${idx}OrigemNoNeCoPerc`)),
                origemNoNeCoAliq: this.parseFloat(this.getValue(`insumo${idx}OrigemNoNeCoAliq`)),

                origemSuSePerc: this.parseFloat(this.getValue(`insumo${idx}OrigemSuSePerc`)),
                origemSuSeAliq: this.parseFloat(this.getValue(`insumo${idx}OrigemSuSeAliq`)),

                origemImportacaoPerc: this.parseFloat(this.getValue(`insumo${idx}OrigemImportacaoPerc`)),
                origemImportacaoAliq: this.parseFloat(this.getValue(`insumo${idx}OrigemImportacaoAliq`))
            };

            if (insumo.custoUnitario && insumo.quantidadeFutura) {
                insumos.push(insumo);
            }
        });

        return insumos;
    }

    calculateDebitos(produtos) {
        if (!produtos || produtos.length === 0) {
            console.warn('[ICMSCalculator] Nenhum produto cadastrado');
            return {
                goias: { receita: 0, icms: 0 },
                noNeCo: { receita: 0, icms: 0 },
                suSe: { receita: 0, icms: 0 },
                exportacao: { receita: 0, icms: 0 },
                total: 0
            };
        }

        const debitos = {
            goias: { receita: 0, icms: 0 },
            noNeCo: { receita: 0, icms: 0 },
            suSe: { receita: 0, icms: 0 },
            exportacao: { receita: 0, icms: 0 },
            total: 0
        };

        produtos.forEach(produto => {
            try {
                this.validateProduto(produto);

                // Validar soma de percentuais = 100%
                const somaPerc = produto.destinoGoiasPerc + produto.destinoNoNeCoPerc +
                                 produto.destinoSuSePerc + produto.destinoExportacaoPerc;

                const tolerancia = window.configLoader.getToleranciaPercentual();
                if (Math.abs(somaPerc - 100) > tolerancia) {
                    console.warn(`Produto "${produto.nome}": percentuais somam ${somaPerc}%, deveria ser 100%`);
                }

                // Calcular débitos com ALÍQUOTAS DINÂMICAS
                const receitaGO = produto.faturamentoAnual * (produto.destinoGoiasPerc / 100);
                const receitaNONECO = produto.faturamentoAnual * (produto.destinoNoNeCoPerc / 100);
                const receitaSUSE = produto.faturamentoAnual * (produto.destinoSuSePerc / 100);
                const receitaEXPORT = produto.faturamentoAnual * (produto.destinoExportacaoPerc / 100);

                debitos.goias.receita += receitaGO;
                debitos.goias.icms += receitaGO * (produto.destinoGoiasAliq / 100);

                debitos.noNeCo.receita += receitaNONECO;
                debitos.noNeCo.icms += receitaNONECO * (produto.destinoNoNeCoAliq / 100);

                debitos.suSe.receita += receitaSUSE;
                debitos.suSe.icms += receitaSUSE * (produto.destinoSuSeAliq / 100);

                debitos.exportacao.receita += receitaEXPORT;
                debitos.exportacao.icms += receitaEXPORT * (produto.destinoExportacaoAliq / 100);

            } catch (error) {
                console.error(`[ICMSCalculator] Erro no produto "${produto.nome}":`, error.message);
            }
        });

        debitos.total = debitos.goias.icms + debitos.noNeCo.icms +
                        debitos.suSe.icms + debitos.exportacao.icms;

        return debitos;
    }

    validateProduto(produto) {
        if (!produto.nome) {
            throw new Error('Produto sem nome');
        }

        // Validar alíquotas obrigatórias
        const aliquotas = ['destinoGoiasAliq', 'destinoNoNeCoAliq', 'destinoSuSeAliq', 'destinoExportacaoAliq'];
        aliquotas.forEach(campo => {
            if (produto[campo] === undefined || produto[campo] === null || produto[campo] === '') {
                throw new Error(`Produto "${produto.nome}": alíquota ${campo} obrigatória`);
            }
        });
    }

    calculateCreditos(insumos) {
        if (!insumos || insumos.length === 0) {
            console.warn('[ICMSCalculator] Nenhum insumo cadastrado');
            return {
                goias: { custo: 0, icms: 0 },
                noNeCo: { custo: 0, icms: 0 },
                suSe: { custo: 0, icms: 0 },
                importacao: { custo: 0, icms: 0 },
                total: 0
            };
        }

        const creditos = {
            goias: { custo: 0, icms: 0 },
            noNeCo: { custo: 0, icms: 0 },
            suSe: { custo: 0, icms: 0 },
            importacao: { custo: 0, icms: 0 },
            total: 0
        };

        insumos.forEach(insumo => {
            try {
                this.validateInsumo(insumo);

                const custoTotal = insumo.custoUnitario * insumo.quantidadeFutura;

                // Validar soma de percentuais = 100%
                const somaPerc = insumo.origemGoiasPerc + insumo.origemNoNeCoPerc +
                                 insumo.origemSuSePerc + insumo.origemImportacaoPerc;

                const tolerancia = window.configLoader.getToleranciaPercentual();
                if (Math.abs(somaPerc - 100) > tolerancia) {
                    console.warn(`Insumo "${insumo.nome}": percentuais somam ${somaPerc}%, deveria ser 100%`);
                }

                // Calcular créditos com ALÍQUOTAS DINÂMICAS
                const custoGO = custoTotal * (insumo.origemGoiasPerc / 100);
                const custoNONECO = custoTotal * (insumo.origemNoNeCoPerc / 100);
                const custoSUSE = custoTotal * (insumo.origemSuSePerc / 100);
                const custoIMPORT = custoTotal * (insumo.origemImportacaoPerc / 100);

                creditos.goias.custo += custoGO;
                creditos.goias.icms += custoGO * (insumo.origemGoiasAliq / 100);

                creditos.noNeCo.custo += custoNONECO;
                creditos.noNeCo.icms += custoNONECO * (insumo.origemNoNeCoAliq / 100);

                creditos.suSe.custo += custoSUSE;
                creditos.suSe.icms += custoSUSE * (insumo.origemSuSeAliq / 100);

                creditos.importacao.custo += custoIMPORT;
                creditos.importacao.icms += custoIMPORT * (insumo.origemImportacaoAliq / 100);

            } catch (error) {
                console.error(`[ICMSCalculator] Erro no insumo "${insumo.nome}":`, error.message);
            }
        });

        creditos.total = creditos.goias.icms + creditos.noNeCo.icms +
                         creditos.suSe.icms + creditos.importacao.icms;

        return creditos;
    }

    validateInsumo(insumo) {
        if (!insumo.nome) {
            throw new Error('Insumo sem nome');
        }

        if (!insumo.tipo) {
            throw new Error(`Insumo "${insumo.nome}": tipo obrigatório`);
        }

        // Validar alíquotas obrigatórias
        const aliquotas = ['origemGoiasAliq', 'origemNoNeCoAliq', 'origemSuSeAliq', 'origemImportacaoAliq'];
        aliquotas.forEach(campo => {
            if (insumo[campo] === undefined || insumo[campo] === null || insumo[campo] === '') {
                throw new Error(`Insumo "${insumo.nome}": alíquota ${campo} obrigatória`);
            }
        });
    }

    updateInterface(data) {
        // Atualizar tabela de débitos (vendas)
        this.updateElement('vendasGO', this.formatCurrency(data.debitos.goias.receita));
        const totalVendas = data.debitos.goias.receita + data.debitos.noNeCo.receita +
                            data.debitos.suSe.receita + data.debitos.exportacao.receita;
        this.updateElement('percVendasGO', this.formatPercent(data.debitos.goias.receita, totalVendas));
        this.updateElement('icmsVendasGO', this.formatCurrency(data.debitos.goias.icms));

        this.updateElement('vendasNONECO', this.formatCurrency(data.debitos.noNeCo.receita));
        this.updateElement('percVendasNONECO', this.formatPercent(data.debitos.noNeCo.receita, totalVendas));
        this.updateElement('icmsVendasNONECO', this.formatCurrency(data.debitos.noNeCo.icms));

        this.updateElement('vendasSUSE', this.formatCurrency(data.debitos.suSe.receita));
        this.updateElement('percVendasSUSE', this.formatPercent(data.debitos.suSe.receita, totalVendas));
        this.updateElement('icmsVendasSUSE', this.formatCurrency(data.debitos.suSe.icms));

        this.updateElement('vendasExport', this.formatCurrency(data.debitos.exportacao.receita));
        this.updateElement('percVendasExport', this.formatPercent(data.debitos.exportacao.receita, totalVendas));
        this.updateElement('icmsVendasExport', this.formatCurrency(data.debitos.exportacao.icms));

        this.updateElement('totalVendas', this.formatCurrency(totalVendas));
        this.updateElement('totalICMSDevido', this.formatCurrency(data.debitos.total));

        // Atualizar tabela de créditos (insumos)
        const totalCompras = data.creditos.goias.custo + data.creditos.noNeCo.custo +
                             data.creditos.suSe.custo + data.creditos.importacao.custo;
        this.updateElement('insumosPrimariosGO', this.formatCurrency(data.creditos.goias.custo));
        this.updateElement('percInsumosPrimariosGO', this.formatPercent(data.creditos.goias.custo, totalCompras));
        this.updateElement('icmsInsumosPrimariosGO', this.formatCurrency(data.creditos.goias.icms));

        this.updateElement('insumosPrimariosNONECO', this.formatCurrency(data.creditos.noNeCo.custo));
        this.updateElement('percInsumosPrimariosNONECO', this.formatPercent(data.creditos.noNeCo.custo, totalCompras));
        this.updateElement('icmsInsumosPrimariosNONECO', this.formatCurrency(data.creditos.noNeCo.icms));

        this.updateElement('insumosPrimariosSUSE', this.formatCurrency(data.creditos.suSe.custo));
        this.updateElement('percInsumosPrimariosSUSE', this.formatPercent(data.creditos.suSe.custo, totalCompras));
        this.updateElement('icmsInsumosPrimariosSUSE', this.formatCurrency(data.creditos.suSe.icms));

        this.updateElement('insumosPrimariosImport', this.formatCurrency(data.creditos.importacao.custo));
        this.updateElement('percInsumosPrimariosImport', this.formatPercent(data.creditos.importacao.custo, totalCompras));
        this.updateElement('icmsInsumosPrimariosImport', this.formatCurrency(data.creditos.importacao.icms));

        this.updateElement('totalInsumosPrimarios', this.formatCurrency(totalCompras));
        this.updateElement('icmsInsumosPrimarios', this.formatCurrency(data.creditos.total));

        // Atualizar resumo
        this.updateElement('resumoDebitos', this.formatCurrency(data.debitos.total));
        this.updateElement('resumoCreditos', this.formatCurrency(data.creditos.total));
        this.updateElement('icmsLiquido', this.formatCurrency(data.icmsLiquido));

        // Atualizar benefício ProGoiás
        this.updateElement('beneficioAnual', this.formatCurrency(data.beneficio));
        this.updateElement('beneficioTotal', this.formatCurrency(data.beneficio * 3)); // 36 meses = 3 anos
    }

    validateInvestment(beneficio = null) {
        if (!beneficio) {
            // Recalcular se necessário
            const beneficioElement = document.getElementById('beneficioTotal');
            if (beneficioElement) {
                beneficio = this.parseCurrency(beneficioElement.textContent);
            } else {
                return;
            }
        }

        const percentualMinimo = window.configLoader.getInvestimentoMinimo();
        const investimentoMinimo = beneficio * percentualMinimo;
        const investimentoDeclarado = this.calculateTotalInvestment();

        this.updateElement('investimentoMinimo', this.formatCurrency(investimentoMinimo));
        this.updateElement('investimentoDeclarado', this.formatCurrency(investimentoDeclarado));

        // Status da validação
        const statusElement = document.getElementById('statusValidacao');
        if (statusElement) {
            if (investimentoDeclarado >= investimentoMinimo) {
                statusElement.innerHTML = `
                    <span class="status-icon">✅</span>
                    <span class="status-text">Investimento adequado!</span>
                `;
                statusElement.className = 'validation-status success';
            } else {
                const deficit = investimentoMinimo - investimentoDeclarado;
                statusElement.innerHTML = `
                    <span class="status-icon">❌</span>
                    <span class="status-text">Investimento insuficiente! Faltam ${this.formatCurrency(deficit)}</span>
                `;
                statusElement.className = 'validation-status error';
            }
        }
    }

    calculateTotalInvestment() {
        let total = 0;

        // Somar todos os campos de investimento da seção 3
        const investmentFields = [
            'terrenos', 'obrasPreliminares', 'obrasCivis',
            'equipamentosInformatica', 'veiculos', 'moveisUtensilios',
            'intangiveis', 'marcasPatentes', 'demaisInvestimentos'
        ];

        investmentFields.forEach(field => {
            total += this.parseFloat(this.getValue(field));
        });

        // Somar máquinas
        const maquinasContainer = document.getElementById('maquinas-container');
        if (maquinasContainer) {
            const entries = maquinasContainer.querySelectorAll('.maquina-entry');
            entries.forEach((entry, index) => {
                const quantidade = this.parseFloat(this.getValue(`maquinaQuantidade${index + 1}`));
                const valor = this.parseFloat(this.getValue(`maquinaValor${index + 1}`));
                total += quantidade * valor;
            });
        }

        return total;
    }

    // Utilities
    getValue(elementId) {
        const element = document.getElementById(elementId) || document.querySelector(`[name="${elementId}"]`);
        return element ? element.value.trim() : '';
    }

    updateElement(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = value;
        }
    }

    parseFloat(value) {
        if (!value) return 0;
        // Remove formatting and convert to float
        return parseFloat(value.toString().replace(/[^\d,-]/g, '').replace(',', '.')) || 0;
    }

    parseCurrency(value) {
        if (!value) return 0;
        return parseFloat(value.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
    }

    formatCurrency(value) {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value || 0);
    }

    formatPercent(part, total) {
        if (!total) return '0%';
        return `${((part / total) * 100).toFixed(1)}%`;
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}

// Inicializar calculadora quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    window.icmsCalculator = new ICMSCalculator();
});

// Export para uso em outros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ICMSCalculator;
}