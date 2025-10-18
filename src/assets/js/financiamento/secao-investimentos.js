/* =========================================
   SECAO-INVESTIMENTOS.JS
   Seção 8: Orçamento dos Investimentos Projetados

   21 COLUNAS: Categoria, Item, Especificação, Qtd, Unid, Valor Unit., Valor Total,
              Ano Desemb., Depr., Realizado, Cob.Terceiros, Valor Terceiros, %Terceiros,
              Cob.Próprios, Valor Próprios, %Próprios, A Realizar, Fornecedor, CNPJ, Tem Orç., Ações

   NO FALLBACKS - NO HARDCODED DATA - KISS - DRY - SOLID
   ========================================= */

class SecaoInvestimentos {
    constructor() {
        console.log('📊 SecaoInvestimentos: Inicializando...');
        this.isInitialized = false;
    }

    init() {
        console.log('🚀 SecaoInvestimentos.init()');
        this.collectDOMReferences();
        this.setupEventListeners();
        this.applyMasks();
        this.updateAllTotals();
        this.isInitialized = true;
        console.log('✓ SecaoInvestimentos inicializado');
    }

    collectDOMReferences() {
        this.tbody = document.getElementById('investimentos-tbody');
        if (!this.tbody) {
            throw new Error('Elemento #investimentos-tbody não encontrado - obrigatório para o fluxo');
        }

        this.btnAdd = document.querySelector('.btn-add-investimento');
        if (!this.btnAdd) {
            throw new Error('Botão .btn-add-investimento não encontrado - obrigatório para o fluxo');
        }

        this.capitalGiroInput = document.getElementById('capitalGiroInv');
        if (!this.capitalGiroInput) {
            throw new Error('Input #capitalGiroInv não encontrado - obrigatório para o fluxo');
        }

        this.jurosPreOpInput = document.getElementById('jurosPreOpInv');
        if (!this.jurosPreOpInput) {
            throw new Error('Input #jurosPreOpInv não encontrado - obrigatório para o fluxo');
        }

        this.notasTextarea = document.getElementById('notasInvestimentos');
        if (!this.notasTextarea) {
            throw new Error('Textarea #notasInvestimentos não encontrado - obrigatório para o fluxo');
        }

        this.investimentosContrapartidaCheckbox = document.getElementById('investimentosComoContrapartida');
        if (!this.investimentosContrapartidaCheckbox) {
            throw new Error('Checkbox #investimentosComoContrapartida não encontrado - obrigatório para o fluxo');
        }

        this.totalOrcamento = document.querySelector('.total-orcamento');
        if (!this.totalOrcamento) throw new Error('.total-orcamento não encontrado - obrigatório');

        this.totalDepreciacaoMedia = document.querySelector('.total-depreciacao-media');
        if (!this.totalDepreciacaoMedia) throw new Error('.total-depreciacao-media não encontrado - obrigatório');

        this.totalRealizado = document.querySelector('.total-realizado');
        if (!this.totalRealizado) throw new Error('.total-realizado não encontrado - obrigatório');

        this.totalTerceiros = document.querySelector('.total-terceiros');
        if (!this.totalTerceiros) throw new Error('.total-terceiros não encontrado - obrigatório');

        this.totalPercTerceiros = document.querySelector('.total-perc-terceiros');
        if (!this.totalPercTerceiros) throw new Error('.total-perc-terceiros não encontrado - obrigatório');

        this.totalProprios = document.querySelector('.total-proprios');
        if (!this.totalProprios) throw new Error('.total-proprios não encontrado - obrigatório');

        this.totalPercProprios = document.querySelector('.total-perc-proprios');
        if (!this.totalPercProprios) throw new Error('.total-perc-proprios não encontrado - obrigatório');

        this.totalARealizar = document.querySelector('.total-a-realizar');
        if (!this.totalARealizar) throw new Error('.total-a-realizar não encontrado - obrigatório');

        this.grandTotalValor = document.querySelector('.grand-total-valor');
        if (!this.grandTotalValor) throw new Error('.grand-total-valor não encontrado - obrigatório');

        console.log('✓ Referências DOM validadas');
    }

    setupEventListeners() {
        this.tbody.addEventListener('input', (e) => this.handleInputChange(e));
        this.tbody.addEventListener('click', (e) => this.handleRowRemove(e));
        this.btnAdd.addEventListener('click', () => this.addInvestimentoRow());
        this.capitalGiroInput.addEventListener('input', () => this.updateGrandTotal());
        this.jurosPreOpInput.addEventListener('input', () => this.updateGrandTotal());

        // Recalcular quando checkbox de contrapartida mudar
        this.investimentosContrapartidaCheckbox.addEventListener('change', () => {
            const rows = this.tbody.querySelectorAll('.investimento-row');
            rows.forEach(row => this.calculateRowValues(row));
            this.updateAllTotals();
            console.log('✓ Contrapartida atualizada, valores recalculados');
        });

        console.log('✓ Event listeners configurados');
    }

    applyMasks() {
        if (!window.currencyMask) {
            throw new Error('window.currencyMask não disponível - obrigatório para o fluxo');
        }

        const currencyInputs = this.tbody.querySelectorAll('input[data-mask="currency"]');
        currencyInputs.forEach(input => window.currencyMask.applyMask(input));

        window.currencyMask.applyMask(this.capitalGiroInput);
        window.currencyMask.applyMask(this.jurosPreOpInput);

        console.log(`✓ Máscaras aplicadas a ${currencyInputs.length + 2} inputs`);
    }

    handleInputChange(event) {
        const input = event.target;
        if (!input.matches('input, select, textarea')) return;

        const row = input.closest('tr');
        if (!row) return;

        this.calculateRowValues(row);
        this.updateAllTotals();
    }

    handleRowRemove(event) {
        if (!event.target.matches('.btn-remove-row')) return;

        const row = event.target.closest('tr');
        if (!row) return;

        const itemInput = row.querySelector('.input-item');
        if (!itemInput) {
            throw new Error('Input .input-item não encontrado na linha - estrutura HTML inválida');
        }

        const item = itemInput.value.trim();
        const itemName = item.length > 0 ? item : 'este item';

        if (confirm(`Deseja remover o investimento "${itemName}"?`)) {
            row.remove();
            this.updateAllTotals();
            console.log(`✓ Linha removida: ${itemName}`);
        }
    }

    addInvestimentoRow() {
        const newRow = document.createElement('tr');
        newRow.className = 'investimento-row';

        newRow.innerHTML = `
            <td>
                <select class="input-categoria">
                    <option value="">Selecione...</option>
                    <option value="Terreno">Terreno</option>
                    <option value="Obras Civis">Obras Civis</option>
                    <option value="Edificações">Edificações</option>
                    <option value="Máquinas e Equipamentos">Máquinas e Equipamentos</option>
                    <option value="Instalações">Instalações</option>
                    <option value="Móveis e Utensílios">Móveis e Utensílios</option>
                    <option value="Veículos">Veículos</option>
                    <option value="Equipamentos de Informática">Equipamentos de Informática</option>
                    <option value="Software">Software</option>
                    <option value="Projetos e Estudos">Projetos e Estudos</option>
                    <option value="Treinamento">Treinamento</option>
                    <option value="Outros">Outros</option>
                </select>
            </td>
            <td><input type="text" class="input-item" placeholder="Descrição do item" /></td>
            <td><textarea class="input-especificacao" rows="1" placeholder="Especificação técnica"></textarea></td>
            <td><input type="number" min="0" step="0.01" class="input-quantidade" placeholder="0" /></td>
            <td>
                <select class="input-unidade">
                    <option value="">-</option>
                    <option value="UN">UN</option>
                    <option value="M">M</option>
                    <option value="M²">M²</option>
                    <option value="M³">M³</option>
                    <option value="KG">KG</option>
                    <option value="T">T</option>
                    <option value="L">L</option>
                    <option value="SERV">SERV</option>
                    <option value="VERBA">VERBA</option>
                    <option value="CJ">CJ</option>
                </select>
            </td>
            <td><input type="text" data-mask="currency" class="input-valor-unitario" placeholder="R$ 0,00" /></td>
            <td><input type="text" data-mask="currency" class="input-valor-total calc-readonly" readonly placeholder="R$ 0,00" /></td>
            <td>
                <select class="input-ano-desembolso">
                    <option value="">-</option>
                    <option value="0">Ano 0</option>
                    <option value="1">Ano 1</option>
                    <option value="2">Ano 2</option>
                    <option value="3">Ano 3</option>
                    <option value="4">Ano 4</option>
                    <option value="5">Ano 5</option>
                </select>
            </td>
            <td><input type="number" min="0" max="100" step="0.01" class="input-depreciacao" placeholder="%" /></td>
            <td><input type="text" data-mask="currency" class="input-realizado" placeholder="R$ 0,00" /></td>
            <td>
                <select class="input-cobertura-terceiros">
                    <option value="">Nenhuma</option>
                    <option value="FCO">FCO - Fundo Centro-Oeste</option>
                    <option value="FNE">FNE - Fundo Nordeste</option>
                    <option value="FNO">FNO - Fundo Norte</option>
                    <option value="FINEP">FINEP</option>
                    <option value="BNDES">BNDES</option>
                    <option value="Banco Privado">Banco Privado</option>
                    <option value="Outro">Outro</option>
                </select>
            </td>
            <td><input type="number" min="0" max="100" step="0.01" class="input-perc-terceiros" placeholder="%" /></td>
            <td><input type="text" data-mask="currency" class="input-valor-terceiros calc-readonly" readonly placeholder="R$ 0,00" /></td>
            <td>
                <select class="input-cobertura-proprios">
                    <option value="">Nenhuma</option>
                    <option value="Capital Social">Capital Social</option>
                    <option value="Lucros Acumulados">Lucros Acumulados</option>
                    <option value="Reinvestimento">Reinvestimento</option>
                    <option value="Investimentos Realizados">Investimentos Realizados</option>
                    <option value="Outro">Outro</option>
                </select>
            </td>
            <td><input type="text" class="input-perc-proprios calc-readonly" readonly placeholder="%" /></td>
            <td><input type="text" data-mask="currency" class="input-valor-proprios calc-readonly" readonly placeholder="R$ 0,00" /></td>
            <td><input type="text" data-mask="currency" class="input-a-realizar calc-readonly" readonly placeholder="R$ 0,00" /></td>
            <td><input type="text" class="input-fornecedor" placeholder="Nome do fornecedor" /></td>
            <td><input type="text" class="input-cnpj" placeholder="00.000.000/0000-00" /></td>
            <td>
                <select class="input-tem-orcamento">
                    <option value="">-</option>
                    <option value="Sim">Sim</option>
                    <option value="Não">Não</option>
                    <option value="Cotação">Cotação</option>
                </select>
            </td>
            <td><button type="button" class="btn-remove-row">🗑️</button></td>
        `;

        this.tbody.appendChild(newRow);

        if (!window.currencyMask) {
            throw new Error('window.currencyMask não disponível - obrigatório para aplicar máscaras');
        }

        newRow.querySelectorAll('input[data-mask="currency"]').forEach(input => {
            window.currencyMask.applyMask(input);
        });

        const firstInput = newRow.querySelector('.input-categoria');
        if (firstInput) firstInput.focus();

        console.log('✓ Nova linha adicionada');
    }

    calculateRowValues(row) {
        // 1. Validar inputs obrigatórios
        const quantidadeInput = row.querySelector('.input-quantidade');
        const valorUnitarioInput = row.querySelector('.input-valor-unitario');
        const valorTotalInput = row.querySelector('.input-valor-total');
        const realizadoInput = row.querySelector('.input-realizado');
        const percTerceirosInput = row.querySelector('.input-perc-terceiros');
        const valorTerceirosInput = row.querySelector('.input-valor-terceiros');
        const percPropriosInput = row.querySelector('.input-perc-proprios');
        const valorPropriosInput = row.querySelector('.input-valor-proprios');
        const aRealizarInput = row.querySelector('.input-a-realizar');

        if (!quantidadeInput || !valorUnitarioInput || !valorTotalInput || !realizadoInput ||
            !percTerceirosInput || !valorTerceirosInput || !percPropriosInput ||
            !valorPropriosInput || !aRealizarInput) {
            throw new Error('Inputs obrigatórios não encontrados na linha - estrutura HTML inválida');
        }

        // 2. Calcular Valor Total
        const quantidade = parseFloat(quantidadeInput.value) || 0;
        const valorUnitario = this.parseCurrency(valorUnitarioInput.value);
        const valorTotal = quantidade > 0 && valorUnitario > 0 ? quantidade * valorUnitario : 0;
        valorTotalInput.value = this.formatCurrency(valorTotal);

        // 3. Obter % Terceiros (input do usuário)
        const percTerceiros = parseFloat(percTerceirosInput.value) || 0;

        // 4. Calcular % Próprios = 100% - % Terceiros
        const percProprios = 100 - percTerceiros;
        percPropriosInput.value = percProprios > 0 ? `${percProprios.toFixed(2)}%` : '0%';

        // 5. Calcular Valor Terceiros
        const valorTerceiros = valorTotal > 0 ? (percTerceiros / 100) * valorTotal : 0;
        valorTerceirosInput.value = this.formatCurrency(valorTerceiros);

        // 6. Calcular Valor Próprios (base)
        let valorPropriosBase = valorTotal > 0 ? (percProprios / 100) * valorTotal : 0;

        // 7. Ajustar se contrapartida marcada
        const realizado = this.parseCurrency(realizadoInput.value);
        const contrapartida = this.investimentosContrapartidaCheckbox?.checked || false;

        let valorProprios = valorPropriosBase;
        let propriosNecessarios = valorPropriosBase;

        if (contrapartida && realizado > 0) {
            // Valor realizado conta como recursos próprios
            propriosNecessarios = Math.max(0, valorPropriosBase - realizado);
        }

        valorPropriosInput.value = this.formatCurrency(valorProprios);

        // 8. Calcular A Realizar
        const aRealizar = Math.max(0, valorTotal - realizado);
        aRealizarInput.value = this.formatCurrency(aRealizar);

        // 9. Armazenar dados calculados no row para totalização
        row.dataset.propriosNecessarios = propriosNecessarios.toFixed(2);
        row.dataset.valorPropriosBase = valorPropriosBase.toFixed(2);
        row.dataset.contrapartida = contrapartida ? '1' : '0';
    }

    updateAllTotals() {
        const rows = this.tbody.querySelectorAll('.investimento-row');

        let sumOrcamento = 0;
        let sumRealizado = 0;
        let sumTerceiros = 0;
        let sumProprios = 0;
        let sumARealizar = 0;
        let sumDepreciacaoPonderada = 0;

        rows.forEach(row => {
            const valorTotalInput = row.querySelector('.input-valor-total');
            const depreciacaoInput = row.querySelector('.input-depreciacao');
            const realizadoInput = row.querySelector('.input-realizado');
            const valorTerceirosInput = row.querySelector('.input-valor-terceiros');
            const valorPropriosInput = row.querySelector('.input-valor-proprios');
            const aRealizarInput = row.querySelector('.input-a-realizar');

            if (!valorTotalInput || !depreciacaoInput || !realizadoInput ||
                !valorTerceirosInput || !valorPropriosInput || !aRealizarInput) {
                throw new Error('Inputs obrigatórios não encontrados durante totalização');
            }

            const valorTotal = this.parseCurrency(valorTotalInput.value);
            const depreciacao = parseFloat(depreciacaoInput.value);
            const realizado = this.parseCurrency(realizadoInput.value);
            const valorTerceiros = this.parseCurrency(valorTerceirosInput.value);
            const valorProprios = this.parseCurrency(valorPropriosInput.value);
            const aRealizar = this.parseCurrency(aRealizarInput.value);

            sumOrcamento += valorTotal;
            sumRealizado += realizado;
            sumTerceiros += valorTerceiros;
            sumProprios += valorProprios;
            sumARealizar += aRealizar;
            sumDepreciacaoPonderada += (valorTotal * depreciacao);
        });

        const depreciacaoMedia = sumOrcamento > 0 ? (sumDepreciacaoPonderada / sumOrcamento) : 0;
        const percTerceirosTotal = sumOrcamento > 0 ? (sumTerceiros / sumOrcamento) * 100 : 0;
        const percPropriosTotal = sumOrcamento > 0 ? (sumProprios / sumOrcamento) * 100 : 0;

        this.totalOrcamento.textContent = this.formatCurrency(sumOrcamento);
        this.totalDepreciacaoMedia.textContent = `${depreciacaoMedia.toFixed(2)}%`;
        this.totalRealizado.textContent = this.formatCurrency(sumRealizado);
        this.totalTerceiros.textContent = this.formatCurrency(sumTerceiros);
        this.totalPercTerceiros.textContent = `${percTerceirosTotal.toFixed(2)}%`;
        this.totalProprios.textContent = this.formatCurrency(sumProprios);
        this.totalPercProprios.textContent = `${percPropriosTotal.toFixed(2)}%`;
        this.totalARealizar.textContent = this.formatCurrency(sumARealizar);

        this.updateGrandTotal();

        // SPRINT 8: Atualizar totalizadores por categoria e gráfico
        const totaisPorCategoria = this.calcularTotaisPorCategoria();
        this.atualizarCardsCategorias(totaisPorCategoria);
        this.renderizarGraficoPizza(totaisPorCategoria);
    }

    updateGrandTotal() {
        const totalFixos = this.parseCurrency(this.totalOrcamento.textContent);
        const capitalGiro = this.parseCurrency(this.capitalGiroInput.value);
        const jurosPreOp = this.parseCurrency(this.jurosPreOpInput.value);
        const grandTotal = totalFixos + capitalGiro + jurosPreOp;

        this.grandTotalValor.textContent = this.formatCurrency(grandTotal);
    }

    /**
     * SPRINT 8: Calcular totais por categoria
     * Retorna objeto com soma de cada categoria
     */
    calcularTotaisPorCategoria() {
        const categorias = {
            'Terreno': 0,
            'Obras Civis': 0,
            'Edificações': 0,
            'Máquinas e Equipamentos': 0,
            'Instalações': 0,
            'Móveis e Utensílios': 0,
            'Veículos': 0,
            'Equipamentos de Informática': 0,
            'Software': 0,
            'Projetos e Estudos': 0,
            'Treinamento': 0,
            'Outros': 0
        };

        const rows = this.tbody.querySelectorAll('.investimento-row');

        rows.forEach(row => {
            const categoriaInput = row.querySelector('.input-categoria');
            const valorTotalInput = row.querySelector('.input-valor-total');

            if (!categoriaInput || !valorTotalInput) return;

            const categoria = categoriaInput.value;
            const valorTotal = this.parseCurrency(valorTotalInput.value);

            if (categoria && valorTotal > 0) {
                categorias[categoria] += valorTotal;
            }
        });

        return categorias;
    }

    /**
     * SPRINT 8: Atualizar cards visuais de categorias
     */
    atualizarCardsCategorias(totaisPorCategoria) {
        const container = document.getElementById('categoriaTotalsGrid');
        if (!container) {
            console.warn('Container #categoriaTotalsGrid não encontrado - cards não serão renderizados');
            return;
        }

        // Calcular total geral para percentuais
        const totalGeral = Object.values(totaisPorCategoria).reduce((sum, val) => sum + val, 0);

        // Limpar container
        container.innerHTML = '';

        // Cores para cada categoria (paleta Expertzy)
        const cores = {
            'Terreno': '#FF002D',
            'Obras Civis': '#FF4D6D',
            'Edificações': '#FF7F9F',
            'Máquinas e Equipamentos': '#091A30',
            'Instalações': '#1A2F50',
            'Móveis e Utensílios': '#2A4570',
            'Veículos': '#3B5A90',
            'Equipamentos de Informática': '#4C6FB0',
            'Software': '#5D85D0',
            'Projetos e Estudos': '#6E9AF0',
            'Treinamento': '#7FB0FF',
            'Outros': '#8FC6FF'
        };

        // Renderizar apenas categorias com valor > 0
        Object.entries(totaisPorCategoria).forEach(([categoria, valor]) => {
            if (valor <= 0) return;

            const percentual = totalGeral > 0 ? (valor / totalGeral) * 100 : 0;

            const card = document.createElement('div');
            card.className = 'categoria-card';
            card.style.borderLeftColor = cores[categoria] || '#091A30';

            card.innerHTML = `
                <div class="categoria-card-header">
                    <span class="categoria-nome">${categoria}</span>
                </div>
                <div class="categoria-card-body">
                    <div class="categoria-valor">${this.formatCurrency(valor)}</div>
                    <div class="categoria-percentual">${percentual.toFixed(1)}% do total</div>
                </div>
            `;

            container.appendChild(card);
        });

        // Se nenhuma categoria tem valor, mostrar mensagem
        if (totalGeral === 0) {
            container.innerHTML = '<p class="empty-state">Nenhum investimento cadastrado ainda.</p>';
        }
    }

    /**
     * SPRINT 8: Renderizar gráfico pizza com Chart.js
     */
    renderizarGraficoPizza(totaisPorCategoria) {
        const canvas = document.getElementById('investimentosPizzaChart');
        if (!canvas) {
            console.warn('Canvas #investimentosPizzaChart não encontrado - gráfico não será renderizado');
            return;
        }

        // Verificar se Chart.js está disponível
        if (typeof Chart === 'undefined') {
            console.error('Chart.js não disponível - obrigatório para gráfico pizza');
            return;
        }

        // Destruir gráfico anterior se existir
        if (this.pizzaChart) {
            this.pizzaChart.destroy();
        }

        // Filtrar categorias com valor > 0
        const labels = [];
        const data = [];
        const backgroundColors = [
            '#FF002D', '#FF4D6D', '#FF7F9F', '#091A30',
            '#1A2F50', '#2A4570', '#3B5A90', '#4C6FB0',
            '#5D85D0', '#6E9AF0', '#7FB0FF', '#8FC6FF'
        ];

        const cores = [];
        let colorIndex = 0;

        Object.entries(totaisPorCategoria).forEach(([categoria, valor]) => {
            if (valor > 0) {
                labels.push(categoria);
                data.push(valor);
                cores.push(backgroundColors[colorIndex % backgroundColors.length]);
                colorIndex++;
            }
        });

        // Se não há dados, limpar canvas
        if (data.length === 0) {
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.font = '16px Inter, sans-serif';
            ctx.fillStyle = '#666';
            ctx.textAlign = 'center';
            ctx.fillText('Nenhum dado para exibir', canvas.width / 2, canvas.height / 2);
            return;
        }

        // Criar novo gráfico
        const ctx = canvas.getContext('2d');
        this.pizzaChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Investimentos',
                    data: data,
                    backgroundColor: cores,
                    borderColor: '#fff',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            font: {
                                family: 'Inter, sans-serif',
                                size: 12
                            },
                            padding: 15
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed || 0;
                                const formatted = value.toLocaleString('pt-BR', {
                                    style: 'currency',
                                    currency: 'BRL'
                                });
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                                return `${label}: ${formatted} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });

        console.log('✓ Gráfico pizza renderizado com', data.length, 'categorias');
    }

    coletarDadosInvestimentos() {
        const dados = {
            investimentos: [],
            capitalGiro: this.capitalGiroInput.value,
            jurosPreOp: this.jurosPreOpInput.value,
            investimentosComoContrapartida: this.investimentosContrapartidaCheckbox.checked,
            notasInvestimentos: this.notasTextarea.value
        };

        const rows = this.tbody.querySelectorAll('.investimento-row');

        rows.forEach(row => {
            const item = {
                categoria: row.querySelector('.input-categoria').value,
                item: row.querySelector('.input-item').value,
                especificacao: row.querySelector('.input-especificacao').value,
                quantidade: row.querySelector('.input-quantidade').value,
                unidade: row.querySelector('.input-unidade').value,
                valorUnitario: row.querySelector('.input-valor-unitario').value,
                valorTotal: row.querySelector('.input-valor-total').value,
                anoDesembolso: row.querySelector('.input-ano-desembolso').value,
                depreciacao: row.querySelector('.input-depreciacao').value,
                realizado: row.querySelector('.input-realizado').value,
                recursosTerceiros: {
                    cobertura: row.querySelector('.input-cobertura-terceiros').value,
                    valor: row.querySelector('.input-valor-terceiros').value,
                    percentual: row.querySelector('.input-perc-terceiros').value
                },
                recursosProprios: {
                    cobertura: row.querySelector('.input-cobertura-proprios').value,
                    valor: row.querySelector('.input-valor-proprios').value,
                    percentual: row.querySelector('.input-perc-proprios').value
                },
                aRealizar: row.querySelector('.input-a-realizar').value,
                fornecedor: row.querySelector('.input-fornecedor').value,
                cnpj: row.querySelector('.input-cnpj').value,
                temOrcamento: row.querySelector('.input-tem-orcamento').value
            };

            dados.investimentos.push(item);
        });

        console.log('✓ Dados coletados:', dados.investimentos.length, 'itens');
        return dados;
    }

    restaurarDadosInvestimentos(dados) {
        if (!dados) {
            throw new Error('Dados de investimentos ausentes - obrigatório para restauração');
        }

        if (!dados.investimentos || !Array.isArray(dados.investimentos)) {
            throw new Error('dados.investimentos deve ser um array - estrutura inválida');
        }

        console.log('📥 Restaurando investimentos...');

        this.tbody.innerHTML = '';

        dados.investimentos.forEach(item => {
            this.addInvestimentoRowWithData(item);
        });

        this.capitalGiroInput.value = dados.capitalGiro;
        this.jurosPreOpInput.value = dados.jurosPreOp;
        this.investimentosContrapartidaCheckbox.checked = dados.investimentosComoContrapartida || false;
        this.notasTextarea.value = dados.notasInvestimentos;

        this.updateAllTotals();

        console.log(`✓ ${dados.investimentos.length} investimentos restaurados`);
    }

    addInvestimentoRowWithData(item) {
        const newRow = document.createElement('tr');
        newRow.className = 'investimento-row';

        const selected = (value, option) => value === option ? 'selected' : '';

        newRow.innerHTML = `
            <td>
                <select class="input-categoria">
                    <option value="">Selecione...</option>
                    <option value="Terreno" ${selected(item.categoria, 'Terreno')}>Terreno</option>
                    <option value="Obras Civis" ${selected(item.categoria, 'Obras Civis')}>Obras Civis</option>
                    <option value="Edificações" ${selected(item.categoria, 'Edificações')}>Edificações</option>
                    <option value="Máquinas e Equipamentos" ${selected(item.categoria, 'Máquinas e Equipamentos')}>Máquinas e Equipamentos</option>
                    <option value="Instalações" ${selected(item.categoria, 'Instalações')}>Instalações</option>
                    <option value="Móveis e Utensílios" ${selected(item.categoria, 'Móveis e Utensílios')}>Móveis e Utensílios</option>
                    <option value="Veículos" ${selected(item.categoria, 'Veículos')}>Veículos</option>
                    <option value="Equipamentos de Informática" ${selected(item.categoria, 'Equipamentos de Informática')}>Equipamentos de Informática</option>
                    <option value="Software" ${selected(item.categoria, 'Software')}>Software</option>
                    <option value="Projetos e Estudos" ${selected(item.categoria, 'Projetos e Estudos')}>Projetos e Estudos</option>
                    <option value="Treinamento" ${selected(item.categoria, 'Treinamento')}>Treinamento</option>
                    <option value="Outros" ${selected(item.categoria, 'Outros')}>Outros</option>
                </select>
            </td>
            <td><input type="text" class="input-item" value="${item.item}" /></td>
            <td><textarea class="input-especificacao" rows="1">${item.especificacao}</textarea></td>
            <td><input type="number" min="0" step="0.01" class="input-quantidade" value="${item.quantidade}" /></td>
            <td>
                <select class="input-unidade">
                    <option value="">-</option>
                    <option value="UN" ${selected(item.unidade, 'UN')}>UN</option>
                    <option value="M" ${selected(item.unidade, 'M')}>M</option>
                    <option value="M²" ${selected(item.unidade, 'M²')}>M²</option>
                    <option value="M³" ${selected(item.unidade, 'M³')}>M³</option>
                    <option value="KG" ${selected(item.unidade, 'KG')}>KG</option>
                    <option value="T" ${selected(item.unidade, 'T')}>T</option>
                    <option value="L" ${selected(item.unidade, 'L')}>L</option>
                    <option value="SERV" ${selected(item.unidade, 'SERV')}>SERV</option>
                    <option value="VERBA" ${selected(item.unidade, 'VERBA')}>VERBA</option>
                    <option value="CJ" ${selected(item.unidade, 'CJ')}>CJ</option>
                </select>
            </td>
            <td><input type="text" data-mask="currency" class="input-valor-unitario" value="${item.valorUnitario}" /></td>
            <td><input type="text" data-mask="currency" class="input-valor-total calc-readonly" readonly value="${item.valorTotal}" /></td>
            <td>
                <select class="input-ano-desembolso">
                    <option value="">-</option>
                    <option value="0" ${selected(item.anoDesembolso, '0')}>Ano 0</option>
                    <option value="1" ${selected(item.anoDesembolso, '1')}>Ano 1</option>
                    <option value="2" ${selected(item.anoDesembolso, '2')}>Ano 2</option>
                    <option value="3" ${selected(item.anoDesembolso, '3')}>Ano 3</option>
                    <option value="4" ${selected(item.anoDesembolso, '4')}>Ano 4</option>
                    <option value="5" ${selected(item.anoDesembolso, '5')}>Ano 5</option>
                </select>
            </td>
            <td><input type="number" min="0" max="100" step="0.01" class="input-depreciacao" value="${item.depreciacao}" /></td>
            <td><input type="text" data-mask="currency" class="input-realizado" value="${item.realizado}" /></td>
            <td>
                <select class="input-cobertura-terceiros">
                    <option value="">Nenhuma</option>
                    <option value="FCO" ${selected(item.recursosTerceiros.cobertura, 'FCO')}>FCO - Fundo Centro-Oeste</option>
                    <option value="FNE" ${selected(item.recursosTerceiros.cobertura, 'FNE')}>FNE - Fundo Nordeste</option>
                    <option value="FNO" ${selected(item.recursosTerceiros.cobertura, 'FNO')}>FNO - Fundo Norte</option>
                    <option value="FINEP" ${selected(item.recursosTerceiros.cobertura, 'FINEP')}>FINEP</option>
                    <option value="BNDES" ${selected(item.recursosTerceiros.cobertura, 'BNDES')}>BNDES</option>
                    <option value="Banco Privado" ${selected(item.recursosTerceiros.cobertura, 'Banco Privado')}>Banco Privado</option>
                    <option value="Outro" ${selected(item.recursosTerceiros.cobertura, 'Outro')}>Outro</option>
                </select>
            </td>
            <td><input type="number" min="0" max="100" step="0.01" class="input-perc-terceiros" value="${item.recursosTerceiros.percentual}" /></td>
            <td><input type="text" data-mask="currency" class="input-valor-terceiros calc-readonly" readonly value="${item.recursosTerceiros.valor}" /></td>
            <td>
                <select class="input-cobertura-proprios">
                    <option value="">Nenhuma</option>
                    <option value="Capital Social" ${selected(item.recursosProprios.cobertura, 'Capital Social')}>Capital Social</option>
                    <option value="Lucros Acumulados" ${selected(item.recursosProprios.cobertura, 'Lucros Acumulados')}>Lucros Acumulados</option>
                    <option value="Reinvestimento" ${selected(item.recursosProprios.cobertura, 'Reinvestimento')}>Reinvestimento</option>
                    <option value="Investimentos Realizados" ${selected(item.recursosProprios.cobertura, 'Investimentos Realizados')}>Investimentos Realizados</option>
                    <option value="Outro" ${selected(item.recursosProprios.cobertura, 'Outro')}>Outro</option>
                </select>
            </td>
            <td><input type="text" class="input-perc-proprios calc-readonly" readonly value="${item.recursosProprios.percentual}" /></td>
            <td><input type="text" data-mask="currency" class="input-valor-proprios calc-readonly" readonly value="${item.recursosProprios.valor}" /></td>
            <td><input type="text" data-mask="currency" class="input-a-realizar calc-readonly" readonly value="${item.aRealizar}" /></td>
            <td><input type="text" class="input-fornecedor" value="${item.fornecedor}" /></td>
            <td><input type="text" class="input-cnpj" value="${item.cnpj}" /></td>
            <td>
                <select class="input-tem-orcamento">
                    <option value="">-</option>
                    <option value="Sim" ${selected(item.temOrcamento, 'Sim')}>Sim</option>
                    <option value="Não" ${selected(item.temOrcamento, 'Não')}>Não</option>
                    <option value="Cotação" ${selected(item.temOrcamento, 'Cotação')}>Cotação</option>
                </select>
            </td>
            <td><button type="button" class="btn-remove-row">🗑️</button></td>
        `;

        this.tbody.appendChild(newRow);

        if (!window.currencyMask) {
            throw new Error('window.currencyMask não disponível - obrigatório para máscaras');
        }

        newRow.querySelectorAll('input[data-mask="currency"]').forEach(input => {
            window.currencyMask.applyMask(input);
        });
    }

    parseCurrency(value) {
        if (value === null || value === undefined) return 0;
        if (typeof value !== 'string') return 0;

        const cleaned = value.replace(/R\$\s?/g, '').replace(/\./g, '').replace(',', '.').trim();
        const parsed = parseFloat(cleaned);

        return isNaN(parsed) ? 0 : parsed;
    }

    formatCurrency(value) {
        if (typeof value !== 'number' || isNaN(value)) {
            throw new Error('formatCurrency: valor deve ser um número válido');
        }

        return value.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }

    isReady() {
        return this.isInitialized;
    }
}

if (typeof window !== 'undefined') {
    window.SecaoInvestimentos = SecaoInvestimentos;
}

// Inicializar quando DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    const investimentosContainer = document.getElementById('investimentos-tbody');
    if (investimentosContainer) {
        window.secaoInvestimentos = new SecaoInvestimentos();
        window.secaoInvestimentos.init();
        console.log('✓ SecaoInvestimentos inicializada e disponível globalmente');
    }
});
