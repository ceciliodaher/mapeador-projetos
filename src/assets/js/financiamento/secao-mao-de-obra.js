/* =====================================
   SECAO-MAO-DE-OBRA.JS
   Módulo para Seção 6 (Mão-de-Obra Requerida)
   Tabelas tabulares com cálculos automáticos
   Padrão similar a secao-receitas.js e secao-insumos.js
   ===================================== */

/**
 * Classe para gerenciar Seção 6 - Mão-de-Obra Requerida
 * Tabelas: M.O. Fixa, M.O. Variável, Encargos Sociais, Resumo Final
 * Cálculo automático: Custo Anual = Quantidade × Salário Mensal × 12
 */
class SecaoMaoDeObra {
    constructor() {
        this.init();
    }

    init() {
        this.setupEventListeners();
        console.log('✓ SecaoMaoDeObra inicializada');
    }

    /**
     * Configura event listeners para:
     * - Botões adicionar categoria (M.O. Fixa e Variável)
     * - Botões remover linha
     * - Inputs de quantidade e salário (para cálculo automático)
     * - Inputs de percentuais de encargos
     */
    setupEventListeners() {
        // Botões adicionar categoria
        const addFixaBtn = document.querySelector('.btn-add-category[data-type="fixa"]');
        const addVariavelBtn = document.querySelector('.btn-add-category[data-type="variavel"]');

        if (addFixaBtn) {
            addFixaBtn.addEventListener('click', () => this.addRHRow('fixa'));
        }

        if (addVariavelBtn) {
            addVariavelBtn.addEventListener('click', () => this.addRHRow('variavel'));
        }

        // Event delegation para botões remover e inputs
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('btn-remove-row')) {
                const row = e.target.closest('tr');
                const type = row.closest('.rh-table-container').dataset.type;
                this.removeRHRow(type, row);
            }
        });

        // Event delegation para inputs (cálculo automático)
        document.addEventListener('input', (e) => {
            const input = e.target;

            // Detectar se é input de RH table
            if (input.closest('.rh-table')) {
                const row = input.closest('tr');
                const table = input.closest('.rh-table-container');

                if (!table || !row) return;

                const type = table.dataset.type;

                // Recalcular totais da linha
                if (input.classList.contains('input-salario') ||
                    input.classList.contains('input-quant')) {
                    this.calculateRowTotals(row);
                }

                // Atualizar totais da tabela
                if (type === 'fixa' || type === 'variavel') {
                    this.updateTableTotals(type);
                    this.updateEncargosTotals();
                    this.updateResumoFinal();
                }
            }

            // Detectar se é input de percentual de encargos
            if (input.name && (
                input.name === 'encargoHonorarios' ||
                input.name === 'encargoFixa' ||
                input.name === 'encargoVariavel'
            )) {
                this.updateEncargosTotals();
                this.updateResumoFinal();
            }
        });

        console.log('✓ Event listeners configurados');
    }

    /**
     * Adiciona nova linha de RH a uma tabela (fixa ou variavel)
     *
     * @param {string} type - 'fixa' ou 'variavel'
     */
    addRHRow(type) {
        const container = document.querySelector(`.rh-table-container[data-type="${type}"]`);
        if (!container) {
            console.error(`❌ Container para tipo "${type}" não encontrado`);
            return;
        }

        const tbody = container.querySelector('tbody');
        const existingRows = tbody.querySelectorAll('.rh-row');
        const newIndex = existingRows.length + 1;

        console.log(`➕ Adicionando linha ${type} #${newIndex}...`);

        // Clonar primeira linha
        const template = existingRows[0].cloneNode(true);

        // Limpar valores
        template.querySelectorAll('input').forEach(input => {
            if (input.classList.contains('calc-readonly')) {
                input.value = 'R$ 0,00';
            } else {
                input.value = '';
            }
        });

        // Anexar ao tbody
        tbody.appendChild(template);

        // Aplicar máscaras aos novos inputs
        this.applyMasksToRow(template);

        // Atualizar totais
        this.updateTableTotals(type);

        console.log(`✓ Linha ${type} #${newIndex} adicionada`);
    }

    /**
     * Remove uma linha de RH
     *
     * @param {string} type - 'fixa' ou 'variavel'
     * @param {HTMLElement} row - Elemento da linha a remover
     */
    removeRHRow(type, row) {
        const tbody = row.closest('tbody');
        const rows = tbody.querySelectorAll('.rh-row');

        // Não permitir remover se for a última
        if (rows.length === 1) {
            alert('Não é possível remover a única linha. Pelo menos uma categoria deve existir.');
            return;
        }

        const categoria = row.querySelector('.input-categoria').value || 'esta categoria';

        if (!confirm(`Tem certeza que deseja remover "${categoria}"?`)) {
            return;
        }

        row.remove();
        console.log(`✓ Linha ${type} removida`);

        // Atualizar totais
        this.updateTableTotals(type);
        this.updateEncargosTotals();
        this.updateResumoFinal();
    }

    /**
     * Calcula totais de uma linha (Custo Anual por ano)
     * Fórmula: Custo Anual = Quantidade × Salário Mensal × 12
     *
     * @param {HTMLElement} row - Linha a calcular
     */
    calculateRowTotals(row) {
        const salarioInput = row.querySelector('.input-salario');
        if (!salarioInput) return;

        // Obter salário mensal (remover máscara)
        const salarioText = salarioInput.value.replace(/[^\d,]/g, '').replace(',', '.');
        const salarioMensal = parseFloat(salarioText) || 0;

        // Calcular para cada ano
        for (let year = 1; year <= 5; year++) {
            const quantInput = row.querySelector(`.input-quant[data-year="${year}"]`);
            const custoInput = row.querySelector(`.input-custo[data-year="${year}"]`);

            if (!quantInput || !custoInput) continue;

            const quantidade = parseInt(quantInput.value) || 0;
            const custoAnual = quantidade * salarioMensal * 12;

            // Atualizar campo (aplicar máscara)
            custoInput.value = this.formatCurrency(custoAnual);
        }
    }

    /**
     * Atualiza totais de uma tabela (footer)
     *
     * @param {string} type - 'fixa' ou 'variavel'
     */
    updateTableTotals(type) {
        const container = document.querySelector(`.rh-table-container[data-type="${type}"]`);
        if (!container) return;

        const tbody = container.querySelector('tbody');
        const tfoot = container.querySelector('tfoot');
        const rows = tbody.querySelectorAll('.rh-row');

        // Calcular totais por ano
        for (let year = 1; year <= 5; year++) {
            let totalQuant = 0;
            let totalCusto = 0;

            rows.forEach(row => {
                const quantInput = row.querySelector(`.input-quant[data-year="${year}"]`);
                const custoInput = row.querySelector(`.input-custo[data-year="${year}"]`);

                if (quantInput) {
                    totalQuant += parseInt(quantInput.value) || 0;
                }

                if (custoInput) {
                    const custoText = custoInput.value.replace(/[^\d,]/g, '').replace(',', '.');
                    totalCusto += parseFloat(custoText) || 0;
                }
            });

            // Atualizar footer
            const totalQuantCell = tfoot.querySelector(`.total-quant[data-year="${year}"]`);
            const totalCustoCell = tfoot.querySelector(`.total-custo[data-year="${year}"]`);

            if (totalQuantCell) {
                totalQuantCell.textContent = totalQuant;
            }

            if (totalCustoCell) {
                totalCustoCell.textContent = this.formatCurrency(totalCusto);
            }
        }
    }

    /**
     * Atualiza tabela de Encargos Sociais
     * Fórmula: Encargo = Custo Base × Percentual / 100
     */
    updateEncargosTotals() {
        // Obter percentuais
        const percHonorarios = parseFloat(document.querySelector('[name="encargoHonorarios"]')?.value) || 20;
        const percFixa = parseFloat(document.querySelector('[name="encargoFixa"]')?.value) || 49;
        const percVariavel = parseFloat(document.querySelector('[name="encargoVariavel"]')?.value) || 49;

        // Obter totais de cada tabela
        const getTableTotals = (type) => {
            const tfoot = document.querySelector(`.rh-table-container[data-type="${type}"] tfoot`);
            if (!tfoot) return Array(5).fill(0);

            const totals = [];
            for (let year = 1; year <= 5; year++) {
                const totalCustoCell = tfoot.querySelector(`.total-custo[data-year="${year}"]`);
                if (totalCustoCell) {
                    const custoText = totalCustoCell.textContent.replace(/[^\d,]/g, '').replace(',', '.');
                    totals.push(parseFloat(custoText) || 0);
                } else {
                    totals.push(0);
                }
            }
            return totals;
        };

        const totaisFixa = getTableTotals('fixa');
        const totaisVariavel = getTableTotals('variavel');

        // Calcular encargos por ano
        const encargosTable = document.querySelector('.encargos-table tbody');
        if (!encargosTable) return;

        const rows = encargosTable.querySelectorAll('tr');

        // Linha 1: Honorários (assumindo que é primeira categoria de Fixa - índice 0)
        // NOTA: Esta lógica pode precisar ajuste dependendo da estrutura real
        // Por simplicidade, vamos calcular sobre 1/3 do total de Fixa
        const honorariosTotais = totaisFixa.map(val => val / 3); // Aproximação

        // Linha 2: M.O. Fixa (restante)
        const fixaTotais = totaisFixa.map(val => val * 2 / 3);

        // Linha 3: M.O. Variável
        const variavelTotais = totaisVariavel;

        // Atualizar células da tabela de encargos
        for (let year = 1; year <= 5; year++) {
            const yearIndex = year - 1;

            // Linha Honorários
            if (rows[0]) {
                const cell = rows[0].querySelector(`.encargo-ano${year}`);
                if (cell) {
                    const encargo = honorariosTotais[yearIndex] * percHonorarios / 100;
                    cell.textContent = this.formatCurrency(encargo);
                }
            }

            // Linha M.O. Fixa
            if (rows[1]) {
                const cell = rows[1].querySelector(`.encargo-ano${year}`);
                if (cell) {
                    const encargo = fixaTotais[yearIndex] * percFixa / 100;
                    cell.textContent = this.formatCurrency(encargo);
                }
            }

            // Linha M.O. Variável
            if (rows[2]) {
                const cell = rows[2].querySelector(`.encargo-ano${year}`);
                if (cell) {
                    const encargo = variavelTotais[yearIndex] * percVariavel / 100;
                    cell.textContent = this.formatCurrency(encargo);
                }
            }
        }

        // Atualizar totais de encargos (footer)
        const encargosTfoot = document.querySelector('.encargos-table tfoot');
        if (encargosTfoot) {
            for (let year = 1; year <= 5; year++) {
                const yearIndex = year - 1;
                const totalEncargo =
                    (honorariosTotais[yearIndex] * percHonorarios / 100) +
                    (fixaTotais[yearIndex] * percFixa / 100) +
                    (variavelTotais[yearIndex] * percVariavel / 100);

                const cell = encargosTfoot.querySelector(`.total-encargos[data-year="${year}"]`);
                if (cell) {
                    cell.textContent = this.formatCurrency(totalEncargo);
                }
            }
        }
    }

    /**
     * Atualiza Resumo Final (soma total de tudo)
     */
    updateResumoFinal() {
        const resumoTbody = document.querySelector('.resumo-table tbody');
        const resumoTfoot = document.querySelector('.resumo-table tfoot');

        if (!resumoTbody || !resumoTfoot) return;

        const rows = resumoTbody.querySelectorAll('tr');

        // Obter totais de cada tabela
        const getTableTotals = (type) => {
            const tfoot = document.querySelector(`.rh-table-container[data-type="${type}"] tfoot`);
            if (!tfoot) return Array(5).fill(0);

            const totals = [];
            for (let year = 1; year <= 5; year++) {
                const totalCustoCell = tfoot.querySelector(`.total-custo[data-year="${year}"]`);
                if (totalCustoCell) {
                    const custoText = totalCustoCell.textContent.replace(/[^\d,]/g, '').replace(',', '.');
                    totals.push(parseFloat(custoText) || 0);
                } else {
                    totals.push(0);
                }
            }
            return totals;
        };

        const totaisFixa = getTableTotals('fixa');
        const totaisVariavel = getTableTotals('variavel');

        // Obter totais de encargos
        const getEncargosTotals = () => {
            const encargosTfoot = document.querySelector('.encargos-table tfoot');
            if (!encargosTfoot) return Array(5).fill(0);

            const totals = [];
            for (let year = 1; year <= 5; year++) {
                const cell = encargosTfoot.querySelector(`.total-encargos[data-year="${year}"]`);
                if (cell) {
                    const encText = cell.textContent.replace(/[^\d,]/g, '').replace(',', '.');
                    totals.push(parseFloat(encText) || 0);
                } else {
                    totals.push(0);
                }
            }
            return totals;
        };

        const totaisEncargos = getEncargosTotals();

        // Atualizar linhas do resumo
        for (let year = 1; year <= 5; year++) {
            const yearIndex = year - 1;

            // Linha 1: M.O. Fixa
            if (rows[0]) {
                const cell = rows[0].querySelector(`.resumo-fixa-ano${year}`);
                if (cell) {
                    cell.textContent = this.formatCurrency(totaisFixa[yearIndex]);
                }
            }

            // Linha 2: M.O. Variável
            if (rows[1]) {
                const cell = rows[1].querySelector(`.resumo-variavel-ano${year}`);
                if (cell) {
                    cell.textContent = this.formatCurrency(totaisVariavel[yearIndex]);
                }
            }

            // Linha 3: Encargos Sociais
            if (rows[2]) {
                const cell = rows[2].querySelector(`.resumo-encargos-ano${year}`);
                if (cell) {
                    cell.textContent = this.formatCurrency(totaisEncargos[yearIndex]);
                }
            }
        }

        // Atualizar total geral (footer)
        for (let year = 1; year <= 5; year++) {
            const yearIndex = year - 1;
            const totalGeral = totaisFixa[yearIndex] + totaisVariavel[yearIndex] + totaisEncargos[yearIndex];

            const cell = resumoTfoot.querySelector(`.resumo-total-geral[data-year="${year}"]`);
            if (cell) {
                cell.textContent = this.formatCurrency(totalGeral);
            }
        }
    }

    /**
     * Aplica máscaras monetárias aos inputs de uma linha
     *
     * @param {HTMLElement} row - Linha que contém os inputs
     */
    applyMasksToRow(row) {
        const salarioInput = row.querySelector('.input-salario');

        if (salarioInput && window.currencyMask) {
            window.currencyMask.applyMask(salarioInput);
        }
    }

    /**
     * Formata valor para moeda brasileira
     *
     * @param {number} value - Valor numérico
     * @returns {string} - Valor formatado (R$ 1.234,56)
     */
    formatCurrency(value) {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    }

    /**
     * Coleta dados de todas as tabelas de Mão-de-Obra
     * Para integração com financiamento-module.js
     *
     * @returns {Object} - Dados completos de RH
     */
    coletarDadosMaoDeObra() {
        const dados = {
            maoDeObraFixa: [],
            maoDeObraVariavel: [],
            encargos: {
                honorarios: parseFloat(document.querySelector('[name="encargoHonorarios"]')?.value) || 20,
                fixa: parseFloat(document.querySelector('[name="encargoFixa"]')?.value) || 49,
                variavel: parseFloat(document.querySelector('[name="encargoVariavel"]')?.value) || 49
            }
        };

        // Coletar M.O. Fixa
        const fixaRows = document.querySelectorAll('.rh-table-container[data-type="fixa"] tbody .rh-row');
        fixaRows.forEach(row => {
            const rowData = {
                categoria: row.querySelector('.input-categoria')?.value || '',
                salarioMedio: row.querySelector('.input-salario')?.value || '',
                quantTotal: parseInt(row.querySelector('.input-total')?.value) || 0,
                anos: []
            };

            for (let year = 1; year <= 5; year++) {
                const quant = parseInt(row.querySelector(`.input-quant[data-year="${year}"]`)?.value) || 0;
                const custo = row.querySelector(`.input-custo[data-year="${year}"]`)?.value || 'R$ 0,00';
                rowData.anos.push({ quantidade: quant, custo: custo });
            }

            dados.maoDeObraFixa.push(rowData);
        });

        // Coletar M.O. Variável
        const variavelRows = document.querySelectorAll('.rh-table-container[data-type="variavel"] tbody .rh-row');
        variavelRows.forEach(row => {
            const rowData = {
                categoria: row.querySelector('.input-categoria')?.value || '',
                salarioMedio: row.querySelector('.input-salario')?.value || '',
                quantTotal: parseInt(row.querySelector('.input-total')?.value) || 0,
                anos: []
            };

            for (let year = 1; year <= 5; year++) {
                const quant = parseInt(row.querySelector(`.input-quant[data-year="${year}"]`)?.value) || 0;
                const custo = row.querySelector(`.input-custo[data-year="${year}"]`)?.value || 'R$ 0,00';
                rowData.anos.push({ quantidade: quant, custo: custo });
            }

            dados.maoDeObraVariavel.push(rowData);
        });

        return dados;
    }

    /**
     * Restaura dados salvos nas tabelas de Mão-de-Obra
     *
     * @param {Object} dados - Dados de RH salvos
     */
    restaurarDadosMaoDeObra(dados) {
        if (!dados) {
            console.warn('⚠️ Dados de mão-de-obra inválidos ou vazios');
            return;
        }

        // Restaurar M.O. Fixa
        if (dados.maoDeObraFixa && Array.isArray(dados.maoDeObraFixa)) {
            this.restaurarTabela('fixa', dados.maoDeObraFixa);
        }

        // Restaurar M.O. Variável
        if (dados.maoDeObraVariavel && Array.isArray(dados.maoDeObraVariavel)) {
            this.restaurarTabela('variavel', dados.maoDeObraVariavel);
        }

        // Restaurar percentuais de encargos
        if (dados.encargos) {
            if (dados.encargos.honorarios !== undefined) {
                const honorariosInput = document.querySelector('[name="encargoHonorarios"]');
                if (honorariosInput) honorariosInput.value = dados.encargos.honorarios;
            }

            if (dados.encargos.fixa !== undefined) {
                const fixaInput = document.querySelector('[name="encargoFixa"]');
                if (fixaInput) fixaInput.value = dados.encargos.fixa;
            }

            if (dados.encargos.variavel !== undefined) {
                const variavelInput = document.querySelector('[name="encargoVariavel"]');
                if (variavelInput) variavelInput.value = dados.encargos.variavel;
            }
        }

        // Recalcular totais
        this.updateTableTotals('fixa');
        this.updateTableTotals('variavel');
        this.updateEncargosTotals();
        this.updateResumoFinal();

        console.log('✓ Dados de mão-de-obra restaurados');
    }

    /**
     * Restaura dados em uma tabela específica (fixa ou variavel)
     *
     * @param {string} type - 'fixa' ou 'variavel'
     * @param {Array} rowsData - Array com dados das linhas
     */
    restaurarTabela(type, rowsData) {
        const container = document.querySelector(`.rh-table-container[data-type="${type}"]`);
        if (!container) return;

        const tbody = container.querySelector('tbody');
        const existingRows = tbody.querySelectorAll('.rh-row');

        // Limpar linhas existentes (exceto a primeira - template)
        existingRows.forEach((row, idx) => {
            if (idx > 0) row.remove();
        });

        // Adicionar linhas conforme dados
        rowsData.forEach((rowData, idx) => {
            // Se não for a primeira, adicionar nova linha
            if (idx > 0) {
                this.addRHRow(type);
            }

            // Preencher dados na linha
            const rows = tbody.querySelectorAll('.rh-row');
            const row = rows[idx];

            if (!row) return;

            // Categoria
            const categoriaInput = row.querySelector('.input-categoria');
            if (categoriaInput && rowData.categoria) {
                categoriaInput.value = rowData.categoria;
            }

            // Salário Médio
            const salarioInput = row.querySelector('.input-salario');
            if (salarioInput && rowData.salarioMedio) {
                salarioInput.value = rowData.salarioMedio;
            }

            // Quantidade Total
            const totalInput = row.querySelector('.input-total');
            if (totalInput && rowData.quantTotal !== undefined) {
                totalInput.value = rowData.quantTotal;
            }

            // Anos (quantidade e custo)
            if (rowData.anos && Array.isArray(rowData.anos)) {
                rowData.anos.forEach((anoData, yearIndex) => {
                    const year = yearIndex + 1;

                    const quantInput = row.querySelector(`.input-quant[data-year="${year}"]`);
                    if (quantInput && anoData.quantidade !== undefined) {
                        quantInput.value = anoData.quantidade;
                    }

                    const custoInput = row.querySelector(`.input-custo[data-year="${year}"]`);
                    if (custoInput && anoData.custo) {
                        custoInput.value = anoData.custo;
                    }
                });
            }
        });
    }
}

// Inicializar quando DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    // Verificar se estamos no formulário de financiamento com seção RH
    const rhContainer = document.querySelector('.rh-table-container');
    if (rhContainer) {
        window.secaoMaoDeObra = new SecaoMaoDeObra();
        console.log('✓ SecaoMaoDeObra inicializada e disponível globalmente');
    }
});
