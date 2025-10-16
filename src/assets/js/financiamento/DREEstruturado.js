/**
 * DREEstruturado Component
 *
 * Componente para Demonstração do Resultado do Exercício (DRE) e Balanço Patrimonial.
 *
 * Princípios:
 * - SEMPRE 4 períodos fixos (N-3, N-2, N-1, Atual)
 * - Hierarquia de contas (níveis 1, 2, 3...)
 * - Contas grupo calculadas automaticamente (soma de subcontas)
 * - Schema externo para defaults (ZERO fallbacks inline)
 * - Validação flexível (avisos, não bloqueios)
 *
 * @author Expertzy
 * @version 1.0.0
 */

class DREEstruturado {
    static defaults = null;

    constructor(config) {
        // Validação estrutural MÍNIMA
        if (!config.demonstracaoId) {
            throw new Error('DREEstruturado: demonstracaoId obrigatório');
        }
        if (!config.containerId) {
            throw new Error('DREEstruturado: containerId obrigatório');
        }
        if (!config.contas || config.contas.length === 0) {
            throw new Error('DREEstruturado: contas obrigatório e não pode estar vazio');
        }

        this.demonstracaoId = config.demonstracaoId;
        this.containerId = config.containerId;
        this.tipo = config.tipo ?? 'DRE'; // DRE ou BALANCO

        // Carrega defaults e normaliza
        this.initializeDefaults();
        this.contas = this.normalizeContas(config.contas);
        this.periodos = this.normalizePeriodos(config.periodos);
        this.options = this.normalizeOptions(config.options);

        this.data = {}; // { contaCodigo: [valor_p1, valor_p2, valor_p3, valor_p4] }
        this.container = null;
        this.table = null;
        this.saveTimeout = null;

        this.init();
    }

    async initializeDefaults() {
        if (DREEstruturado.defaults) return;

        try {
            const response = await fetch('/config/dre-estruturado-defaults.json');
            DREEstruturado.defaults = await response.json();
        } catch (error) {
            throw new Error(`DREEstruturado: Falha ao carregar defaults: ${error.message}`);
        }
    }

    normalizeContas(contas) {
        return contas.map(conta => {
            const tipoDefaults = DREEstruturado.defaults.contaTipos[conta.tipo];

            if (!tipoDefaults) {
                throw new Error(`DREEstruturado: Tipo de conta inválido: ${conta.tipo}`);
            }

            return {
                ...tipoDefaults,
                ...conta,
                // Propriedades obrigatórias
                codigo: conta.codigo,
                nome: conta.nome,
                tipo: conta.tipo,
                nivel: conta.nivel ?? 1,
                natureza: conta.natureza ?? 'debito'
            };
        });
    }

    normalizePeriodos(userPeriodos) {
        const defaultPeriodos = DREEstruturado.defaults.periodos;

        // Se usuário passou períodos, usa; senão usa defaults
        if (userPeriodos && userPeriodos.length === 4) {
            return userPeriodos.map((p, idx) => ({
                label: p.label ?? defaultPeriodos.labels[idx],
                status: p.status ?? defaultPeriodos.status[idx],
                ano: p.ano ?? null
            }));
        }

        // Usa defaults
        return defaultPeriodos.labels.map((label, idx) => ({
            label: label,
            status: defaultPeriodos.status[idx],
            ano: null
        }));
    }

    normalizeOptions(userOptions) {
        return {
            autoSave: userOptions?.autoSave ?? true,
            saveDelay: userOptions?.saveDelay ?? 3000,
            showValidationAlerts: userOptions?.showValidationAlerts ?? true,
            ...userOptions
        };
    }

    init() {
        this.container = document.getElementById(this.containerId);
        if (!this.container) {
            throw new Error(`DREEstruturado: Container #${this.containerId} não encontrado`);
        }

        this.initializeData();
        this.render();
        this.attachEventListeners();
    }

    initializeData() {
        this.contas.forEach(conta => {
            this.data[conta.codigo] = [0, 0, 0, 0]; // 4 períodos sempre
        });
    }

    render() {
        const css = DREEstruturado.defaults.css;

        const html = `
            <div class="${css.wrapper}" data-demonstracao-id="${this.demonstracaoId}">
                <h3>${this.tipo === 'DRE' ? 'Demonstração do Resultado do Exercício (DRE)' : 'Balanço Patrimonial'}</h3>
                <div class="table-responsive">
                    <table class="${css.table}" id="${this.demonstracaoId}">
                        <thead>
                            ${this.renderHeader()}
                        </thead>
                        <tbody>
                            ${this.renderContas()}
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        this.container.innerHTML = html;
        this.table = document.getElementById(this.demonstracaoId);
    }

    renderHeader() {
        const css = DREEstruturado.defaults.css;

        let html = `<tr class="${css.headerRow}">`;
        html += '<th style="width: 15%;">Código</th>';
        html += '<th style="width: 35%;">Conta</th>';

        this.periodos.forEach((periodo, idx) => {
            const statusClass = periodo.status === 'parcial' ? css.periodoParcial : css.periodoCompleto;
            html += `<th class="${statusClass}" style="width: 12.5%;">${periodo.label}</th>`;
        });

        html += '</tr>';
        return html;
    }

    renderContas() {
        let html = '';

        this.contas.forEach(conta => {
            html += this.renderContaRow(conta);
        });

        return html;
    }

    renderContaRow(conta) {
        const css = DREEstruturado.defaults.css;
        const indentacao = DREEstruturado.defaults.formatacao.indentacaoPorNivel[conta.nivel];

        let rowClass = '';
        if (conta.tipo === 'grupo') rowClass = css.contaGrupo;
        else if (conta.tipo === 'subconta') rowClass = css.contaSubconta;
        else rowClass = css.contaNormal;

        let html = `<tr class="${rowClass}" data-conta-codigo="${conta.codigo}">`;

        // Coluna código
        html += `<td><strong>${conta.codigo}</strong></td>`;

        // Coluna nome (com indentação)
        const fontWeight = conta.tipo === 'grupo' ? 'bold' : 'normal';
        html += `<td style="padding-left: ${indentacao}; font-weight: ${fontWeight};">${conta.nome}</td>`;

        // Colunas de períodos (4 sempre)
        for (let periodoIdx = 0; periodoIdx < 4; periodoIdx++) {
            const cellId = `${this.demonstracaoId}-${conta.codigo}-p${periodoIdx}`;
            const valor = this.data[conta.codigo]?.[periodoIdx] ?? 0;

            if (conta.calculado) {
                // Conta grupo - readonly, calculado
                html += `<td>${this.renderReadonlyCell(cellId, valor, conta)}</td>`;
            } else {
                // Conta editável
                html += `<td>${this.renderEditableCell(cellId, valor, conta, periodoIdx)}</td>`;
            }
        }

        html += '</tr>';
        return html;
    }

    renderReadonlyCell(cellId, valor, conta) {
        const css = DREEstruturado.defaults.css;
        const formatted = this.formatCurrency(valor);

        return `
            <input type="text"
                   id="${cellId}"
                   class="${css.formControl} ${css.readonlyField}"
                   value="${formatted}"
                   readonly
                   data-conta-codigo="${conta.codigo}"
                   data-tipo="${conta.tipo}" />
        `;
    }

    renderEditableCell(cellId, valor, conta, periodoIdx) {
        const css = DREEstruturado.defaults.css;
        const formatted = this.formatCurrency(valor);

        return `
            <input type="text"
                   id="${cellId}"
                   class="${css.formControl}"
                   value="${formatted}"
                   data-conta-codigo="${conta.codigo}"
                   data-periodo-idx="${periodoIdx}"
                   data-tipo="${conta.tipo}"
                   placeholder="R$ 0,00" />
        `;
    }

    formatCurrency(value) {
        const fmt = DREEstruturado.defaults.formatacao.currency;

        return new Intl.NumberFormat(fmt.locale, {
            style: 'currency',
            currency: fmt.currency,
            minimumFractionDigits: fmt.decimalPlaces,
            maximumFractionDigits: fmt.decimalPlaces
        }).format(value);
    }

    parseCurrency(value) {
        if (!value) return 0;
        // Remove símbolos e converte
        return parseFloat(value.replace(/[^\d,.-]/g, '').replace(',', '.')) || 0;
    }

    attachEventListeners() {
        this.table.addEventListener('input', (e) => {
            if (e.target.matches('input:not([readonly])')) {
                this.handleInputChange(e.target);
            }
        });

        this.table.addEventListener('blur', (e) => {
            if (e.target.matches('input:not([readonly])')) {
                this.applyCurrencyMask(e.target);
            }
        }, true);
    }

    handleInputChange(input) {
        const contaCodigo = input.dataset.contaCodigo;
        const periodoIdx = parseInt(input.dataset.periodoIdx);
        const valor = this.parseCurrency(input.value);

        // Atualiza data
        if (!this.data[contaCodigo]) {
            this.data[contaCodigo] = [0, 0, 0, 0];
        }
        this.data[contaCodigo][periodoIdx] = valor;

        // Recalcula contas grupo
        this.recalcularGrupos();

        // Remove avisos visuais
        const css = DREEstruturado.defaults.css;
        input.classList.remove(css.warning, css.error);

        // Auto-save
        if (this.options.autoSave) {
            this.scheduleAutoSave();
        }
    }

    applyCurrencyMask(input) {
        try {
            const valor = this.parseCurrency(input.value);
            input.value = this.formatCurrency(valor);
        } catch (error) {
            // Se falhar, mantém valor original
            console.debug('Máscara currency não aplicada:', error);
        }
    }

    /**
     * Recalcula contas grupo (soma de subcontas)
     */
    recalcularGrupos() {
        const gruposCalculados = new Set();

        // Ordena contas por nível (do mais profundo para o mais alto)
        const contasOrdenadas = [...this.contas].sort((a, b) => b.nivel - a.nivel);

        contasOrdenadas.forEach(conta => {
            if (conta.tipo === 'grupo' && !gruposCalculados.has(conta.codigo)) {
                this.calcularGrupo(conta);
                gruposCalculados.add(conta.codigo);
            }
        });

        // Atualiza UI dos grupos
        gruposCalculados.forEach(codigoGrupo => {
            this.atualizarCamposGrupo(codigoGrupo);
        });
    }

    /**
     * Calcula valor de uma conta grupo (soma das subcontas)
     */
    calcularGrupo(contaGrupo) {
        const subcontas = this.contas.filter(c =>
            this.isSubcontaDe(c.codigo, contaGrupo.codigo) && c.codigo !== contaGrupo.codigo
        );

        // Para cada período
        for (let periodoIdx = 0; periodoIdx < 4; periodoIdx++) {
            let soma = 0;

            subcontas.forEach(subconta => {
                const valor = this.data[subconta.codigo]?.[periodoIdx] ?? 0;
                const sinal = DREEstruturado.defaults.naturezas[subconta.natureza]?.sinal ?? 1;
                soma += valor * sinal;
            });

            this.data[contaGrupo.codigo][periodoIdx] = soma;
        }
    }

    /**
     * Verifica se uma conta é subconta de outra
     * Ex: 1.1.1 é subconta de 1.1 e de 1
     */
    isSubcontaDe(codigoSubconta, codigoGrupo) {
        return codigoSubconta.startsWith(codigoGrupo + '.');
    }

    /**
     * Atualiza campos readonly de um grupo na UI
     */
    atualizarCamposGrupo(codigoGrupo) {
        for (let periodoIdx = 0; periodoIdx < 4; periodoIdx++) {
            const cellId = `${this.demonstracaoId}-${codigoGrupo}-p${periodoIdx}`;
            const input = document.getElementById(cellId);

            if (input) {
                const valor = this.data[codigoGrupo]?.[periodoIdx] ?? 0;
                input.value = this.formatCurrency(valor);

                // Adiciona classe de valor positivo/negativo
                const css = DREEstruturado.defaults.css;
                input.classList.remove(css.valorPositivo, css.valorNegativo);
                if (valor > 0) {
                    input.classList.add(css.valorPositivo);
                } else if (valor < 0) {
                    input.classList.add(css.valorNegativo);
                }
            }
        }
    }

    scheduleAutoSave() {
        if (this.saveTimeout) {
            clearTimeout(this.saveTimeout);
        }

        this.saveTimeout = setTimeout(() => {
            this.save();
        }, this.options.saveDelay);
    }

    async save() {
        try {
            console.log(`[DREEstruturado] Salvando ${this.demonstracaoId}:`, this.data);

            const event = new CustomEvent('dre:save', {
                detail: {
                    demonstracaoId: this.demonstracaoId,
                    tipo: this.tipo,
                    data: this.data
                }
            });
            this.container.dispatchEvent(event);

            return true;
        } catch (error) {
            console.error('[DREEstruturado] Erro ao salvar:', error);
            return false;
        }
    }

    /**
     * Validação FLEXÍVEL
     * Apenas avisos se grupos não batem (não bloqueia)
     */
    validate() {
        const warnings = [];

        if (DREEstruturado.defaults.validacao.alertarSeGrupoNaoBate) {
            // Valida se grupos batem com soma das subcontas
            const grupos = this.contas.filter(c => c.tipo === 'grupo');

            grupos.forEach(grupo => {
                for (let periodoIdx = 0; periodoIdx < 4; periodoIdx++) {
                    const valorGrupo = this.data[grupo.codigo]?.[periodoIdx] ?? 0;

                    // Recalcula manualmente para comparar
                    const subcontas = this.contas.filter(c =>
                        this.isSubcontaDe(c.codigo, grupo.codigo) && c.codigo !== grupo.codigo
                    );

                    let somaEsperada = 0;
                    subcontas.forEach(subconta => {
                        const valor = this.data[subconta.codigo]?.[periodoIdx] ?? 0;
                        const sinal = DREEstruturado.defaults.naturezas[subconta.natureza]?.sinal ?? 1;
                        somaEsperada += valor * sinal;
                    });

                    const diferenca = Math.abs(valorGrupo - somaEsperada);
                    if (diferenca > 0.01) { // Tolerância de 1 centavo
                        warnings.push({
                            conta: grupo.codigo,
                            periodo: this.periodos[periodoIdx].label,
                            message: `Valor do grupo (${this.formatCurrency(valorGrupo)}) difere da soma das subcontas (${this.formatCurrency(somaEsperada)})`,
                            tipo: 'calculo'
                        });
                    }
                }
            });
        }

        return {
            valid: true, // Sempre válido (warnings não bloqueiam)
            errors: [],
            warnings: warnings
        };
    }

    /**
     * Mostra avisos visuais
     */
    showValidationFeedback(validationResult) {
        if (!this.options.showValidationAlerts) return;

        const css = DREEstruturado.defaults.css;

        // Remove avisos anteriores
        this.table.querySelectorAll(`.${css.warning}`).forEach(el => {
            el.classList.remove(css.warning);
        });

        // Aplica warnings
        validationResult.warnings.forEach(warn => {
            // Marca linha da conta com warning
            const row = this.table.querySelector(`[data-conta-codigo="${warn.conta}"]`);
            if (row) {
                row.querySelectorAll('input').forEach(input => {
                    input.classList.add(css.warning);
                    input.title = warn.message;
                });
            }
        });

        // Alerta se houver warnings
        if (validationResult.warnings.length > 0 && this.options.showValidationAlerts) {
            const message = `Encontrados ${validationResult.warnings.length} avisos:\n\n` +
                validationResult.warnings.map(w => `- ${w.conta} (${w.periodo}): ${w.message}`).join('\n');

            console.warn('[DREEstruturado] Avisos de validação:', message);
        }
    }

    /**
     * Carrega dados
     */
    loadData(data) {
        // data formato: { contaCodigo: [p1, p2, p3, p4] }
        this.data = data;

        // Atualiza UI
        this.contas.forEach(conta => {
            const valores = data[conta.codigo] ?? [0, 0, 0, 0];

            for (let periodoIdx = 0; periodoIdx < 4; periodoIdx++) {
                const cellId = `${this.demonstracaoId}-${conta.codigo}-p${periodoIdx}`;
                const input = document.getElementById(cellId);

                if (input) {
                    input.value = this.formatCurrency(valores[periodoIdx]);
                }
            }
        });

        // Recalcula grupos
        this.recalcularGrupos();
    }

    /**
     * Obtém dados
     */
    getData() {
        return {
            demonstracaoId: this.demonstracaoId,
            tipo: this.tipo,
            periodos: this.periodos,
            contas: this.contas,
            data: this.data
        };
    }

    /**
     * Export para JSON
     */
    exportToJSON() {
        return {
            demonstracaoId: this.demonstracaoId,
            tipo: this.tipo,
            periodos: this.periodos,
            contas: this.contas.map(c => ({
                codigo: c.codigo,
                nome: c.nome,
                tipo: c.tipo,
                nivel: c.nivel,
                natureza: c.natureza
            })),
            data: this.data,
            metadata: {
                exportedAt: new Date().toISOString(),
                totalContas: this.contas.length
            }
        };
    }

    /**
     * Import de JSON
     */
    importFromJSON(json) {
        if (json.demonstracaoId !== this.demonstracaoId) {
            throw new Error('ID da demonstração não corresponde');
        }

        this.loadData(json.data);
    }

    /**
     * Limpa dados
     */
    clearData() {
        this.initializeData();
        this.loadData(this.data);
    }

    /**
     * Destrói componente
     */
    destroy() {
        if (this.saveTimeout) {
            clearTimeout(this.saveTimeout);
        }
        this.container.innerHTML = '';
        this.data = {};
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = DREEstruturado;
}
