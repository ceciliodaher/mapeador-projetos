// Variáveis globais
let currentStep = 1;
const totalSteps = 14; // Expandido de 7 para 14 seções
let formData = {};
let uploadedFiles = {};
let investmentDetails = {
    obrasCivis: [],
    maquinasEquipamentos: [],
    instalacoes: [],
    outrosInvestimentos: []
};

// Elementos DOM
const form = document.getElementById('projectForm');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const previewBtn = document.getElementById('previewBtn');
const progressFill = document.getElementById('progressFill');
const previewModal = document.getElementById('previewModal');
const previewContent = document.getElementById('previewContent');
const modalClose = document.querySelector('#previewModal .modal-close');
const editBtn = document.getElementById('editBtn');
const exportExcelBtn = document.getElementById('exportExcelBtn');
const exportPDFBtn = document.getElementById('exportPDFBtn');

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    initializeForm();
    setupEventListeners();
    setupFileUploads();
    setupCalculations();
    formatInputs();
    checkForSavedData();
});

// Configuração inicial do formulário
function initializeForm() {
    updateProgressBar();
    updateNavigationButtons();
    showSection(currentStep);
}

// Configuração dos event listeners
function setupEventListeners() {
    prevBtn.addEventListener('click', goToPreviousStep);
    nextBtn.addEventListener('click', goToNextStep);
    previewBtn.addEventListener('click', showPreview);
    modalClose.addEventListener('click', closePreview);
    editBtn.addEventListener('click', closePreview);
    exportExcelBtn.addEventListener('click', exportToExcel);
    exportPDFBtn.addEventListener('click', exportToPDF);
    
    // Novos botões de exportação
    const exportJSONBtn = document.getElementById('exportJSONBtn');
    const exportCSVBtn = document.getElementById('exportCSVBtn');
    const saveBtn = document.getElementById('saveBtn');
    const saveStepBtn = document.getElementById('saveStepBtn');
    
    exportJSONBtn.addEventListener('click', exportToJSON);
    exportCSVBtn.addEventListener('click', exportToCSV);
    saveBtn.addEventListener('click', saveToLocalStorage);
    
    // Botão de salvar etapa atual
    if (saveStepBtn) {
        saveStepBtn.addEventListener('click', saveCurrentStepToJSON);
    }
    
    // Botão e funcionalidade de importação (modal)
    const importBtn = document.getElementById('importBtn');
    const importJsonFile = document.getElementById('importJsonFile');
    
    if (importBtn && importJsonFile) {
        importBtn.addEventListener('click', () => {
            importJsonFile.click();
        });
        
        importJsonFile.addEventListener('change', handleJsonImport);
    }
    
    // Botão de importação no cabeçalho (sempre visível)
    const importBtnHeader = document.getElementById('importBtnHeader');
    const importJsonFileHeader = document.getElementById('importJsonFileHeader');
    
    if (importBtnHeader && importJsonFileHeader) {
        importBtnHeader.addEventListener('click', () => {
            importJsonFileHeader.click();
        });
        
        importJsonFileHeader.addEventListener('change', handleJsonImport);
    }
    
    // Fechar modal ao clicar fora
    previewModal.addEventListener('click', function(e) {
        if (e.target === previewModal) {
            closePreview();
        }
    });

    // Validação em tempo real
    const inputs = form.querySelectorAll('input, textarea, select');
    inputs.forEach(input => {
        input.addEventListener('blur', validateField);
        input.addEventListener('input', clearFieldError);
    });

    // Navegação por steps (clique nos números)
    const stepNumbers = document.querySelectorAll('.step');
    stepNumbers.forEach((step, index) => {
        step.addEventListener('click', () => {
            const targetStep = index + 1;
            
            // Navegação livre - permite ir para qualquer seção
            // Isso é necessário para testes e facilita a experiência do usuário
            goToStep(targetStep);
            
            // Nota: Validação pode ser feita opcionalmente antes de exportar
            // mas não deve bloquear navegação entre seções para revisão
        });
    });
}

// Configuração de upload de arquivos
function setupFileUploads() {
    const fileInputs = form.querySelectorAll('input[type="file"]');
    fileInputs.forEach(input => {
        input.addEventListener('change', handleFileUpload);
    });
}

// Configuração de cálculos automáticos
function setupCalculations() {
    // Configurações de cálculo para investimentos serão chamadas quando necessário
    const percentualRecursosPropriosInput = document.getElementById('percentualRecursosProprios');
    const percentualFinanciamentoInput = document.getElementById('percentualFinanciamento');

    if (percentualRecursosPropriosInput) {
        percentualRecursosPropriosInput.addEventListener('input', calculateFinancialValues);
    }

    if (percentualFinanciamentoInput) {
        percentualFinanciamentoInput.addEventListener('input', calculateFinancialValues);
    }

    const metaFaturamentoInput = document.getElementById('metaFaturamento');
    const crescimentoEsperadoInput = document.getElementById('crescimentoEsperado');
    const projectionTypeInput = document.getElementById('projectionType');

    if (metaFaturamentoInput) {
        metaFaturamentoInput.addEventListener('input', calculateProjections);
    }

    if (crescimentoEsperadoInput) {
        crescimentoEsperadoInput.addEventListener('input', calculateProjections);
    }

    if (projectionTypeInput) {
        projectionTypeInput.addEventListener('change', calculateProjections);
    }


    calculateProjections();
}

function calculateProjections() {
    const projectionType = document.getElementById('projectionType').value;
    const projectionsContainer = document.getElementById('projectionsContainer');
    const metaFaturamento = parseMonetaryValue(document.getElementById('metaFaturamento').value);
    const crescimentoEsperado = parseFloat(document.getElementById('crescimentoEsperado').value) || 0;

    let projectionsHTML = '';

    if (projectionType === 'uniforme') {
        let lastYearFaturamento = metaFaturamento;
        for (let i = 2; i <= 5; i++) {
            const currentFaturamento = lastYearFaturamento * (1 + (crescimentoEsperado / 100));
            projectionsHTML += `
                <div class="form-group">
                    <label for="metaFaturamentoAno${i}">Meta Faturamento Ano ${i} (R$)</label>
                    <input type="text" id="metaFaturamentoAno${i}" name="metaFaturamentoAno${i}" value="${formatCurrency(currentFaturamento)}" readonly>
                </div>
            `;
            lastYearFaturamento = currentFaturamento;
        }
    } else {
        for (let i = 2; i <= 5; i++) {
            projectionsHTML += `
                <div class="form-group">
                    <label for="crescimentoAno${i}">Crescimento Ano ${i} (%)</label>
                    <input type="number" id="crescimentoAno${i}" name="crescimentoAno${i}" step="0.1" value="${crescimentoEsperado}">
                </div>
                <div class="form-group">
                    <label for="metaFaturamentoAno${i}">Meta Faturamento Ano ${i} (R$)</label>
                    <input type="text" id="metaFaturamentoAno${i}" name="metaFaturamentoAno${i}" readonly>
                </div>
            `;
        }
    }

    projectionsContainer.innerHTML = projectionsHTML;

    if (projectionType === 'variavel') {
        for (let i = 2; i <= 5; i++) {
            const crescimentoInput = document.getElementById(`crescimentoAno${i}`);
            crescimentoInput.addEventListener('input', () => {
                let lastYearFaturamento = metaFaturamento;
                for (let j = 2; j <= i; j++) {
                    const crescimento = parseFloat(document.getElementById(`crescimentoAno${j}`).value) || 0;
                    lastYearFaturamento = lastYearFaturamento * (1 + (crescimento / 100));
                }
                document.getElementById(`metaFaturamentoAno${i}`).value = formatCurrency(lastYearFaturamento);
            });
            // Trigger the calculation for the first time
            crescimentoInput.dispatchEvent(new Event('input'));
        }
    }
}

// Adicionar item de investimento
function addInvestmentItem(type) {
    const listId = type + 'List';
    const list = document.getElementById(listId);
    const itemId = Date.now();
    
    const itemHtml = `
        <div class="investment-item" data-id="${itemId}" data-type="${type}">
            <div class="item-row">
                <input type="text" placeholder="Descrição do item" class="item-description" />
                <input type="text" placeholder="Fornecedor/Executor" class="item-supplier" />
                <input type="number" placeholder="Quantidade" class="item-quantity" step="1" />
                <input type="text" placeholder="Valor Unitário" class="item-unit-value" />
                <input type="text" placeholder="Valor Total" class="item-total-value" readonly />
                <button type="button" class="btn-remove" onclick="removeInvestmentItem('${type}', ${itemId})">×</button>
            </div>
        </div>
    `;
    
    list.insertAdjacentHTML('beforeend', itemHtml);
    
    // Setup event listeners for the new item
    const newItem = list.querySelector(`[data-id="${itemId}"]`);
    const quantity = newItem.querySelector('.item-quantity');
    const unitValue = newItem.querySelector('.item-unit-value');
    const totalValue = newItem.querySelector('.item-total-value');
    
    // Apply universal formatting to the new fields
    applyUniversalFormatting(newItem);
    
    // Calculate total when quantity or unit value changes
    [quantity, unitValue].forEach(input => {
        input.addEventListener('input', () => {
            const qty = parseInt(quantity.value) || 0; // Quantidade deve ser inteiro
            const unit = parseMonetaryValue(unitValue.value);
            const total = qty * unit;
            
            // Formatar o valor total
            totalValue.value = formatCurrency(total);
            calculateSubtotals();
        });
    });
    
    // Aplicar formatação monetária ao valor unitário e valor total
    applyMonetaryFormatting(unitValue);
    applyMonetaryFormatting(totalValue);
    
    // Aplicar formatação de inteiro à quantidade
    applyIntegerFormatting(quantity);
}

// Remover item de investimento
function removeInvestmentItem(type, itemId) {
    const item = document.querySelector(`[data-id="${itemId}"]`);
    if (item) {
        item.remove();
        calculateSubtotals();
    }
}

// Calcular subtotais
function calculateSubtotals() {
    const types = ['obrasCivis', 'maquinasEquipamentos', 'instalacoes', 'outrosInvestimentos'];
    let total = 0;
    
    types.forEach(type => {
        const list = document.getElementById(type + 'List');
        let subtotal = 0;
        
        if (list) {
            const items = list.querySelectorAll('.investment-item');
            items.forEach(item => {
                const totalValue = item.querySelector('.item-total-value');
                // Parse valor monetário formatado
                subtotal += parseMonetaryValue(totalValue.value);
            });
        }
        
        // Update subtotal display
        const subtotalElement = document.getElementById('subtotal' + type.charAt(0).toUpperCase() + type.slice(1).replace(/([A-Z])/g, '$1'));
        if (subtotalElement) {
            subtotalElement.textContent = formatCurrency(subtotal);
        } else {
            // Try alternative ID formats
            if (type === 'obrasCivis') {
                const el = document.getElementById('subtotalObrasCivis');
                if (el) el.textContent = formatCurrency(subtotal);
            } else if (type === 'maquinasEquipamentos') {
                const el = document.getElementById('subtotalMaquinas');
                if (el) el.textContent = formatCurrency(subtotal);
            } else if (type === 'instalacoes') {
                const el = document.getElementById('subtotalInstalacoes');
                if (el) el.textContent = formatCurrency(subtotal);
            } else if (type === 'outrosInvestimentos') {
                const el = document.getElementById('subtotalOutros');
                if (el) el.textContent = formatCurrency(subtotal);
            }
        }
        
        total += subtotal;
    });
    
    // Update total display
    const totalElement = document.getElementById('valorTotal');
    if (totalElement) {
        totalElement.textContent = formatCurrency(total);
    }

    // Update the total investment input field
    const valorTotalInvestimentoInput = document.getElementById('valorTotalInvestimento');
    if (valorTotalInvestimentoInput) {
        valorTotalInvestimentoInput.value = formatCurrency(total);
    }

    // Trigger financial calculation
    calculateFinancialValues();
}

function calculateFinancialValues() {
    const totalInvestimento = parseMonetaryValue(document.getElementById('valorTotalInvestimento').value);
    const percentualRecursosProprios = parseFloat(document.getElementById('percentualRecursosProprios').value) || 0;
    const percentualFinanciamento = parseFloat(document.getElementById('percentualFinanciamento').value) || 0;

    const valorRecursosProprios = totalInvestimento * (percentualRecursosProprios / 100);
    const valorFinanciamento = totalInvestimento * (percentualFinanciamento / 100);

    document.getElementById('valorRecursosProprios').value = formatCurrency(valorRecursosProprios);
    document.getElementById('valorFinanciamento').value = formatCurrency(valorFinanciamento);
}

// Adicionar produto
function addProdutoItem() {
    const list = document.getElementById('produtosList');
    const itemId = Date.now();
    
    const itemHtml = `
        <div class="investment-item" data-id="${itemId}">
            <div class="item-row">
                <input type="text" placeholder="Nome do Produto/Serviço" class="produto-nome" />
                <input type="text" placeholder="Descrição" class="produto-descricao" />
                <input type="text" placeholder="Unidade" class="produto-unidade" />
                <input type="text" placeholder="Preço (R$)" class="produto-preco" />
                <input type="number" placeholder="Produção Atual" class="produto-atual" step="1" />
                <input type="number" placeholder="Produção Futura" class="produto-futura" step="1" />
                <button type="button" class="btn-remove" onclick="removeProdutoItem(${itemId})">×</button>
            </div>
        </div>
    `;
    
    list.insertAdjacentHTML('beforeend', itemHtml);
    
    // Aplicar formatação universal
    const newItem = list.querySelector(`[data-id="${itemId}"]`);
    applyUniversalFormatting(newItem);
    
    // Aplicar formatação específica aos campos
    const precoInput = newItem.querySelector('.produto-preco');
    const atualInput = newItem.querySelector('.produto-atual');
    const futuraInput = newItem.querySelector('.produto-futura');
    
    if (precoInput) applyMonetaryFormatting(precoInput);
    if (atualInput) applyIntegerFormatting(atualInput);
    if (futuraInput) applyIntegerFormatting(futuraInput);
}

// Remover produto
function removeProdutoItem(itemId) {
    const item = document.querySelector(`[data-id="${itemId}"]`);
    if (item) {
        item.remove();
    }
}

// Adicionar insumo
function addInsumoItem() {
    const list = document.getElementById('insumosList');
    const itemId = Date.now();
    
    const itemHtml = `
        <div class="investment-item" data-id="${itemId}">
            <div class="item-row">
                <input type="text" placeholder="Nome do Insumo/MP" class="insumo-nome" />
                <select class="insumo-tipo">
                    <option value="">Tipo</option>
                    <option value="mp">Matéria-Prima</option>
                    <option value="is">Insumo Secundário</option>
                    <option value="me">Material de Embalagem</option>
                    <option value="ee">Energia Elétrica</option>
                </select>
                <input type="text" placeholder="Unidade" class="insumo-unidade" />
                <input type="text" placeholder="Custo (R$)" class="insumo-custo" />
                <input type="number" placeholder="Qtd. Atual" class="insumo-atual" step="1" />
                <input type="number" placeholder="Qtd. Futura" class="insumo-futura" step="1" />
                <button type="button" class="btn-remove" onclick="removeInsumoItem(${itemId})">×</button>
            </div>
        </div>
    `;
    
    list.insertAdjacentHTML('beforeend', itemHtml);
    
    // Aplicar formatação universal
    const newItem = list.querySelector(`[data-id="${itemId}"]`);
    applyUniversalFormatting(newItem);
    
    // Aplicar formatação específica aos campos
    const custoInput = newItem.querySelector('.insumo-custo');
    const atualInput = newItem.querySelector('.insumo-atual');
    const futuraInput = newItem.querySelector('.insumo-futura');
    
    if (custoInput) applyMonetaryFormatting(custoInput);
    if (atualInput) applyIntegerFormatting(atualInput);
    if (futuraInput) applyIntegerFormatting(futuraInput);
}

// Remover insumo
function removeInsumoItem(itemId) {
    const item = document.querySelector(`[data-id="${itemId}"]`);
    if (item) {
        item.remove();
    }
}

// Adicionar cliente
function addClienteItem() {
    const list = document.getElementById('clientesList');
    const itemId = Date.now();
    
    const itemHtml = `
        <div class="investment-item" data-id="${itemId}">
            <div class="item-row">
                <input type="text" placeholder="Nome/Razão Social" class="cliente-nome" />
                <input type="text" placeholder="CNPJ/CPF" class="cliente-documento" />
                <input type="text" placeholder="Cidade/Estado" class="cliente-localizacao" />
                <input type="number" placeholder="% do Faturamento" class="cliente-percentual" min="0" max="100" step="1" />
                <select class="cliente-tipo">
                    <option value="">Tipo</option>
                    <option value="pf">Pessoa Física</option>
                    <option value="pj">Pessoa Jurídica</option>
                    <option value="governo">Governo</option>
                </select>
                <button type="button" class="btn-remove" onclick="removeClienteItem(${itemId})">×</button>
            </div>
        </div>
    `;
    
    list.insertAdjacentHTML('beforeend', itemHtml);
    
    // Aplicar formatação ao campo de percentual
    const newItem = list.querySelector(`[data-id="${itemId}"]`);
    const percentualInput = newItem.querySelector('.cliente-percentual');
    if (percentualInput) applyPercentageFormatting(percentualInput);
}

// Remover cliente
function removeClienteItem(itemId) {
    const item = document.querySelector(`[data-id="${itemId}"]`);
    if (item) {
        item.remove();
    }
}

// Adicionar concorrente
function addConcorrenteItem() {
    const list = document.getElementById('concorrentesList');
    const itemId = Date.now();
    
    const itemHtml = `
        <div class="investment-item" data-id="${itemId}">
            <div class="item-row">
                <input type="text" placeholder="Nome do Concorrente" class="concorrente-nome" />
                <input type="text" placeholder="Localização" class="concorrente-localizacao" />
                <select class="concorrente-porte">
                    <option value="">Porte</option>
                    <option value="micro">Micro</option>
                    <option value="pequeno">Pequeno</option>
                    <option value="medio">Médio</option>
                    <option value="grande">Grande</option>
                </select>
                <input type="text" placeholder="Principal Diferencial" class="concorrente-diferencial" />
                <select class="concorrente-nivel">
                    <option value="">Nível de Ameaça</option>
                    <option value="baixo">Baixo</option>
                    <option value="medio">Médio</option>
                    <option value="alto">Alto</option>
                </select>
                <button type="button" class="btn-remove" onclick="removeConcorrenteItem(${itemId})">×</button>
            </div>
        </div>
    `;
    
    list.insertAdjacentHTML('beforeend', itemHtml);
}

// Remover concorrente
function removeConcorrenteItem(itemId) {
    const item = document.querySelector(`[data-id="${itemId}"]`);
    if (item) {
        item.remove();
    }
}

// Adicionar funcionário
function addFuncionarioItem() {
    const list = document.getElementById('funcionariosList');
    const itemId = Date.now();
    
    const itemHtml = `
        <div class="investment-item" data-id="${itemId}">
            <div class="item-row">
                <input type="text" placeholder="Cargo/Função" class="funcionario-cargo" />
                <input type="number" placeholder="Qtd. Atual" class="funcionario-quantidade" min="0" step="1" />
                <input type="text" placeholder="Salário Médio (R$)" class="funcionario-salario" />
                <select class="funcionario-escolaridade">
                    <option value="">Escolaridade</option>
                    <option value="fundamental">Fundamental</option>
                    <option value="medio">Médio</option>
                    <option value="tecnico">Técnico</option>
                    <option value="superior">Superior</option>
                    <option value="pos">Pós-graduação</option>
                </select>
                <select class="funcionario-tipo">
                    <option value="">Tipo</option>
                    <option value="clt">CLT</option>
                    <option value="terceirizado">Terceirizado</option>
                    <option value="estagiario">Estagiário</option>
                    <option value="pj">PJ</option>
                </select>
                <button type="button" class="btn-remove" onclick="removeFuncionarioItem(${itemId})">×</button>
            </div>
        </div>
    `;
    
    list.insertAdjacentHTML('beforeend', itemHtml);
    
    // Aplicar formatação monetária ao salário
    const newItem = list.querySelector(`[data-id="${itemId}"]`);
    const salarioInput = newItem.querySelector('.funcionario-salario');
    if (salarioInput) {
        applyMoneyFormatting(salarioInput);
    }
}

// Remover funcionário
function removeFuncionarioItem(itemId) {
    const item = document.querySelector(`[data-id="${itemId}"]`);
    if (item) {
        item.remove();
    }
}

// Adicionar contratação planejada
function addContratacaoItem() {
    const list = document.getElementById('contratacoesList');
    const itemId = Date.now();
    
    const itemHtml = `
        <div class="investment-item" data-id="${itemId}">
            <div class="item-row">
                <input type="text" placeholder="Cargo/Função" class="contratacao-cargo" />
                <input type="number" placeholder="Quantidade" class="contratacao-quantidade" min="1" step="1" />
                <input type="text" placeholder="Salário Base (R$)" class="contratacao-salario" />
                <select class="contratacao-tipo" onchange="updateEncargos(${itemId})">
                    <option value="">Tipo Contratação</option>
                    <option value="clt">CLT</option>
                    <option value="direcao">Honorários Direção</option>
                    <option value="terceirizado">Terceirizado</option>
                </select>
                <input type="number" placeholder="Encargos %" class="contratacao-encargos" min="0" max="100" step="0.1" />
                <input type="month" placeholder="Previsão" class="contratacao-previsao" />
                <select class="contratacao-prioridade">
                    <option value="">Prioridade</option>
                    <option value="alta">Alta</option>
                    <option value="media">Média</option>
                    <option value="baixa">Baixa</option>
                </select>
                <button type="button" class="btn-remove" onclick="removeContratacaoItem(${itemId})">×</button>
            </div>
        </div>
    `;
    
    list.insertAdjacentHTML('beforeend', itemHtml);
    
    // Aplicar formatação e event listeners
    const newItem = list.querySelector(`[data-id="${itemId}"]`);
    const salarioInput = newItem.querySelector('.contratacao-salario');
    const quantidadeInput = newItem.querySelector('.contratacao-quantidade');
    const encargosInput = newItem.querySelector('.contratacao-encargos');

    if (salarioInput) {
        applyMoneyFormatting(salarioInput);
        salarioInput.addEventListener('input', calculateRHInvestmentAnual);
    }
    if (quantidadeInput) {
        quantidadeInput.addEventListener('input', calculateRHInvestmentAnual);
    }
    if (encargosInput) {
        encargosInput.addEventListener('input', calculateRHInvestmentAnual);
    }

    calculateRHInvestmentAnual();

}

// Atualizar encargos baseado no tipo de contratação
function updateEncargos(itemId) {
    const item = document.querySelector(`[data-id="${itemId}"]`);
    if (!item) {
        console.warn(`Item com ID ${itemId} não encontrado`);
        return;
    }
    
    const tipoSelect = item.querySelector('.contratacao-tipo');
    const encargosInput = item.querySelector('.contratacao-encargos');
    
    if (!tipoSelect || !encargosInput) {
        console.warn(`Campos tipo ou encargos não encontrados no item ${itemId}`);
        return;
    }
    
    // Percentuais técnicos baseados na legislação brasileira
    const encargosPorTipo = {
        'clt': 85,           // CLT: INSS 20% + FGTS 8% + 13º 8.33% + Férias 11.11% + demais encargos
        'direcao': 70,       // Direção: INSS limitado + benefícios executivos
        'terceirizado': 30   // Terceirizado: ISS + PIS/COFINS + IR
    };
    
    const tipo = tipoSelect.value;
    
    if (tipo && encargosPorTipo[tipo]) {
        // Só atualizar se o campo de encargos estiver vazio ou for zero
        const encargosAtual = parseFloat(encargosInput.value) || 0;
        
        if (encargosAtual === 0) {
            encargosInput.value = encargosPorTipo[tipo];
            console.log(`✅ Encargos auto-preenchidos para ${tipo}: ${encargosPorTipo[tipo]}%`);
            
            // Recalcular totais
            calculateRHInvestmentAnual();
        } else {
            console.log(`ℹ️ Encargos já preenchidos (${encargosAtual}%), mantendo valor`);
        }
    } else if (tipo) {
        console.warn(`Tipo "${tipo}" não reconhecido. Tipos válidos: clt, direcao, terceirizado`);
    }
}

// Remover contratação planejada
function removeContratacaoItem(itemId) {
    const item = document.querySelector(`[data-id="${itemId}"]`);
    if (item) {
        item.remove();
        calculateRHInvestmentAnual();
    }
}

// Calcular investimento anual em RH baseado nas contratações planejadas
function calculateRHInvestmentAnual() {
    console.log('=== INICIO CALCULO RH ANUAL ===');
    
    const contratacoesList = document.getElementById('contratacoesList');
    if (!contratacoesList) {
        console.log('Lista de contratações não encontrada');
        return;
    }
    
    const items = contratacoesList.querySelectorAll('.investment-item');
    console.log(`Encontrados ${items.length} itens de contratação`);
    
    let totalContratacoes = 0;
    let custoMensalBase = 0;
    
    // Processar cada contratação com encargos individuais
    let custoMensalComEncargos = 0;
    
    items.forEach((item, index) => {
        const quantidadeInput = item.querySelector('.contratacao-quantidade');
        const salarioInput = item.querySelector('.contratacao-salario');
        const encargosInput = item.querySelector('.contratacao-encargos');
        
        const quantidade = parseInt(quantidadeInput?.value) || 0;
        const salario = parseMonetaryValue(salarioInput?.value);
        // Se não há encargos definidos, usar 80% como padrão para cálculos farmacêuticos
        const percentualEncargos = parseFloat(encargosInput?.value) || 80;
        
        const subtotalMensalBase = quantidade * salario;
        const subtotalMensalComEncargos = subtotalMensalBase * (1 + (percentualEncargos / 100));
        
        console.log(`Item ${index + 1}:`, {
            quantidade,
            salario,
            percentualEncargos: percentualEncargos + '%',
            subtotalMensalBase,
            subtotalMensalComEncargos
        });
        
        totalContratacoes += quantidade;
        custoMensalBase += subtotalMensalBase;
        custoMensalComEncargos += subtotalMensalComEncargos;
    });
    
    const custoAnualTotal = custoMensalComEncargos * 12;
    
    console.log('RESUMO CALCULO:', {
        totalContratacoes,
        custoMensalBase,
        custoMensalComEncargos,
        custoAnualTotal,
        observacao: 'Encargos individuais por contratação'
    });
    
    // Atualizar campos na interface
    const novasContratacoesInput = document.getElementById('novasContratacoes');
    if (novasContratacoesInput) {
        novasContratacoesInput.value = totalContratacoes;
        console.log(`Campo novasContratacoes atualizado: ${totalContratacoes}`);
    }
    
    const investimentoRHInput = document.getElementById('investimentoRH');
    if (investimentoRHInput) {
        investimentoRHInput.value = formatCurrency(custoAnualTotal);
        console.log(`Campo investimentoRH atualizado: ${formatCurrency(custoAnualTotal)}`);
    }
    
    console.log('=== FIM CALCULO RH ANUAL ===');
}

// Adicionar balanço
function addBalancoItem() {
    const list = document.getElementById('balancoList');
    const itemId = Date.now();
    
    const itemHtml = `
        <div class="investment-item" data-id="${itemId}">
            <div class="item-row">
                <input type="number" placeholder="Ano" class="balanco-ano" min="2020" max="2025" step="1" />
                <input type="text" placeholder="Ativo Total (R$)" class="balanco-ativo money-input" />
                <input type="text" placeholder="Passivo Total (R$)" class="balanco-passivo money-input" />
                <input type="text" placeholder="Patrimônio Líquido (R$)" class="balanco-patrimonio money-input" />
                <input type="text" placeholder="Receita Bruta (R$)" class="balanco-receita money-input" />
                <input type="text" placeholder="Lucro Líquido (R$)" class="balanco-lucro money-input" />
                <button type="button" class="btn-remove" onclick="removeBalancoItem(${itemId})">×</button>
            </div>
        </div>
    `;
    
    list.insertAdjacentHTML('beforeend', itemHtml);
    
    // Aplicar formatação monetária aos campos monetários
    const newItem = list.querySelector(`[data-id="${itemId}"]`);
    const moneyFields = newItem.querySelectorAll('.balanco-ativo, .balanco-passivo, .balanco-patrimonio, .balanco-receita, .balanco-lucro');
    moneyFields.forEach(field => applyMoneyFormatting(field));
}

// Remover balanço
function removeBalancoItem(itemId) {
    const item = document.querySelector(`[data-id="${itemId}"]`);
    if (item) {
        item.remove();
    }
}

// Adicionar sócio
function addSocioItem() {
    const list = document.getElementById('sociosList');
    const itemId = Date.now();
    
    const itemHtml = `
        <div class="investment-item" data-id="${itemId}">
            <div class="item-row">
                <input type="text" placeholder="Nome do Sócio" class="socio-nome" />
                <input type="text" placeholder="CPF/CNPJ" class="socio-documento" />
                <input type="number" placeholder="% Participação" class="socio-participacao" min="0" max="100" step="0.01" />
                <input type="text" placeholder="Valor da Participação (R$)" class="socio-valor money-input" />
                <select class="socio-tipo">
                    <option value="">Tipo</option>
                    <option value="administrador">Administrador</option>
                    <option value="quotista">Quotista</option>
                    <option value="acionista">Acionista</option>
                </select>
                <button type="button" class="btn-remove" onclick="removeSocioItem(${itemId})">×</button>
            </div>
        </div>
    `;
    
    list.insertAdjacentHTML('beforeend', itemHtml);
    
    // Aplicar formatação aos campos
    const newItem = list.querySelector(`[data-id="${itemId}"]`);
    const valorInput = newItem.querySelector('.socio-valor');
    const participacaoInput = newItem.querySelector('.socio-participacao');
    
    if (valorInput) applyMonetaryFormatting(valorInput);
    if (participacaoInput) applyPercentageFormatting(participacaoInput);
}

// Remover sócio
function removeSocioItem(itemId) {
    const item = document.querySelector(`[data-id="${itemId}"]`);
    if (item) {
        item.remove();
    }
}

// Adicionar dívida
function addDividaItem() {
    const list = document.getElementById('dividasList');
    const itemId = Date.now();
    
    const itemHtml = `
        <div class="investment-item" data-id="${itemId}">
            <div class="item-row">
                <input type="text" placeholder="Credor" class="divida-credor" />
                <select class="divida-tipo">
                    <option value="">Tipo</option>
                    <option value="financiamento">Financiamento</option>
                    <option value="emprestimo">Empréstimo</option>
                    <option value="fornecedor">Fornecedor</option>
                    <option value="impostos">Impostos</option>
                    <option value="outros">Outros</option>
                </select>
                <input type="text" placeholder="Valor Original (R$)" class="divida-original money-input" />
                <input type="text" placeholder="Saldo Devedor (R$)" class="divida-saldo money-input" />
                <input type="date" placeholder="Vencimento" class="divida-vencimento" />
                <input type="number" placeholder="Taxa (%)" class="divida-taxa" min="0" step="0.01" />
                <button type="button" class="btn-remove" onclick="removeDividaItem(${itemId})">×</button>
            </div>
        </div>
    `;
    
    list.insertAdjacentHTML('beforeend', itemHtml);
    
    // Aplicar formatação monetária aos valores
    const newItem = list.querySelector(`[data-id="${itemId}"]`);
    const moneyFields = newItem.querySelectorAll('.divida-original, .divida-saldo');
    moneyFields.forEach(field => applyMoneyFormatting(field));
}

// Remover dívida
function removeDividaItem(itemId) {
    const item = document.querySelector(`[data-id="${itemId}"]`);
    if (item) {
        item.remove();
    }
}

// Função auxiliar para formatar moeda
function formatCurrency(value) {
    // Se o valor já está formatado, retornar como está
    if (typeof value === 'string' && value.includes('R$')) {
        return value;
    }
    
    // Se o valor está vazio ou inválido, retornar valor padrão
    if (value === null || value === undefined || value === '' || isNaN(value)) {
        return 'Não informado';
    }
    
    // Converter string para número se necessário
    const numericValue = typeof value === 'string' ? parseFloat(cleanMonetaryValue(value)) : value;
    
    // Verificar se é um número válido
    if (isNaN(numericValue)) {
        return 'Valor inválido';
    }
    
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(numericValue);
}

// Função auxiliar para limpar valores monetários de forma consistente
function cleanMonetaryValue(value) {
    if (!value) return '';
    // Remover R$, espaços e converter vírgula para ponto
    return value.toString()
        .replace(/R\$/g, '')
        .replace(/\s/g, '')
        .replace(/\./g, '') // Remove pontos de milhar
        .replace(',', '.'); // Converte vírgula decimal para ponto
}

// Função robusta para limpar e processar valores
function cleanAndParseValue(value, type = 'currency') {
    // Tratar valores vazios, nulos ou undefined
    if (value === null || value === undefined || value === '') {
        return type === 'currency' ? 'Não informado' : '';
    }
    
    // Se já é um número válido, retornar
    if (typeof value === 'number' && !isNaN(value)) {
        return type === 'currency' ? formatCurrency(value) : value;
    }
    
    // Processar strings
    if (typeof value === 'string') {
        // Se é valor monetário
        if (type === 'currency') {
            // Se já está formatado, retornar como está
            if (value.includes('R$') && !value.includes('NaN')) {
                return value;
            }
            
            // Tentar limpar e converter
            const cleaned = cleanMonetaryValue(value);
            const parsed = parseFloat(cleaned);
            
            if (isNaN(parsed) || parsed === 0) {
                return 'Não informado';
            }
            
            return formatCurrency(parsed);
        }
        
        // Se é percentual
        if (type === 'percentage') {
            const numValue = parseFloat(value.replace('%', ''));
            return isNaN(numValue) ? '' : `${numValue}%`;
        }
        
        // Outros tipos de string
        return value.trim();
    }
    
    return type === 'currency' ? 'Não informado' : '';
}

// Função melhorada para parse de valores monetários
function parseMonetaryValue(value) {
    if (!value) return 0;
    
    // Se já é um número, retornar diretamente
    if (typeof value === 'number') return value;
    
    // Limpar o valor
    let cleanValue = value.toString()
        .replace(/R\$/g, '')
        .replace(/\s/g, '')
        .trim();
    
    // Se contém vírgula e ponto, assumir que ponto é separador de milhar
    if (cleanValue.includes(',') && cleanValue.includes('.')) {
        // Último ponto ou vírgula é o decimal
        const lastComma = cleanValue.lastIndexOf(',');
        const lastDot = cleanValue.lastIndexOf('.');
        
        if (lastComma > lastDot) {
            // Vírgula é decimal
            cleanValue = cleanValue.replace(/\./g, '').replace(',', '.');
        } else {
            // Ponto é decimal
            cleanValue = cleanValue.replace(/,/g, '');
        }
    } else if (cleanValue.includes(',')) {
        // Só vírgula - assumir que é decimal
        cleanValue = cleanValue.replace(',', '.');
    }
    
    const parsed = parseFloat(cleanValue);
    return isNaN(parsed) ? 0 : parsed;
}


// Aplicar formatação monetária a um input específico
// Formatação universal para todos os tipos de campos
function applyUniversalFormatting(container = document) {
    const form = container.querySelector ? container : document;
    
    // 1. PRIMEIRO: Processar campos percentuais (prioridade máxima)
    const percentageInputFields = form.querySelectorAll('input.percentage-input');
    percentageInputFields.forEach(input => {
        applyPercentageFormatting(input);
    });

    // 2. SEGUNDO: Campos monetários com classe money-input (type="text")
    const moneyInputFields = form.querySelectorAll('input.money-input, input[type="text"].money-input');
    moneyInputFields.forEach(input => {
        applyMonetaryFormatting(input);
    });

    // 3. TERCEIRO: Campos numéricos restantes (type="number")
    const numericFields = form.querySelectorAll('input[type="number"]');
    numericFields.forEach(input => {
        // Pular se já foi processado como percentage-input
        if (input.classList.contains('percentage-input')) {
            return;
        }
        
        if (isMonetaryField(input)) {
            applyMonetaryFormatting(input);
        } else if (isPercentageField(input)) {
            applyPercentageFormatting(input);
        } else if (isIntegerField(input)) {
            applyIntegerFormatting(input);
        }
    });

    // 4. Validação especial para distribuição regional
    validateRegionalDistribution(form);
}

// Identificar campos monetários
function isMonetaryField(input) {
    // Excluir campos que são especificamente percentuais
    if (input.classList.contains('percentage-input')) {
        return false;
    }
    
    const monetaryPatterns = [
        'preco', 'custo', 'valor', 'Valor', 'investimento', 'receita', 'despesa', 
        'faturamento', 'ticket', 'salario', 'remuneracao', 'economia', 'meta',
        'unit-value', 'total-value', // Campos de investimento
        'saldo', 'endividamento', 'capital', 'patrimonio', // Campos financeiros
        'ativo', 'passivo', 'lucro', 'renda', 'rh', // Campos de balanço
        'socio-valor', 'balanco' // Outros campos monetários
    ];
    
    const monetaryClasses = [
        'produto-preco', 'insumo-custo', 'funcionario-salario', 'contratacao-salario',
        'balanco-ativo', 'balanco-passivo', 'balanco-patrimonio', 'balanco-receita', 'balanco-lucro',
        'socio-valor', 'divida-original', 'divida-saldo', 'item-unit-value', 'item-total-value'
    ];
    
    // Verificar por ID, name ou classe (case insensitive)
    const hasMonetaryPattern = monetaryPatterns.some(pattern => 
        (input.name && input.name.toLowerCase().includes(pattern.toLowerCase())) || 
        (input.id && input.id.toLowerCase().includes(pattern.toLowerCase()))
    );
    
    const hasMonetaryClass = monetaryClasses.some(className => 
        input.classList.contains(className)
    );
    
    // Verificar se o campo tem step="0.01" (indicativo de campo monetário)
    const hasMonetaryStep = input.getAttribute('step') === '0.01';
    
    // Verificar se o placeholder contém "R$"
    const hasMonetaryPlaceholder = input.placeholder && input.placeholder.includes('R$');
    
    return hasMonetaryPattern || hasMonetaryClass || hasMonetaryStep || hasMonetaryPlaceholder;
}

// Identificar campos de percentual
function isPercentageField(input) {
    const percentagePatterns = [
        'percentual', 'percent', '%', 'abrangencia', 'participacao', 
        'margem', 'reducao', 'rotatividade', 'absenteismo',
        'cliente-percentual', 'socio-participacao' // Campos específicos de percentual
    ];
    return percentagePatterns.some(pattern => 
        input.name.includes(pattern) || 
        input.id.includes(pattern) ||
        input.getAttribute('max') === '100'
    );
}

// Identificar campos que devem aceitar apenas números inteiros
function isIntegerField(input) {
    const integerPatterns = [
        'capacidade', 'producao', 'atual', 'futura', 'quantidade', 'numero', 
        'horas', 'dias', 'funcionarios', 'clientes', 'anos', 'meses', 'prazo',
        'item-quantity', 'produto-atual', 'produto-futura', // Campos de produção
        'insumo-atual', 'insumo-futura', // Campos de insumos
        'funcionario-quantidade', 'contratacao-quantidade' // Campos de RH
    ];
    return integerPatterns.some(pattern => 
        input.name.includes(pattern) || 
        input.id.includes(pattern) ||
        input.getAttribute('step') === '1'
    );
}

// Aplicar formatação monetária
function applyMonetaryFormatting(input) {
    // Verificar se já foi formatado para evitar duplicação
    if (input.dataset.monetaryFormatted === 'true') {
        return;
    }
    
    // Marcar como formatado
    input.dataset.monetaryFormatted = 'true';
    
    // Flag para prevenir loops
    let isFormatting = false;
    
    // Aplicar formatação ao sair do campo
    input.addEventListener('blur', function(e) {
        if (isFormatting) return;
        isFormatting = true;
        
        if (e.target.value) {
            const value = parseMonetaryValue(e.target.value);
            if (value >= 0) {
                e.target.value = formatCurrency(value);
            }
        }
        
        setTimeout(() => { isFormatting = false; }, 100);
    });
    
    // Remover formatação ao focar para permitir edição
    input.addEventListener('focus', function(e) {
        if (isFormatting) return;
        isFormatting = true;
        
        if (e.target.value) {
            const cleanValue = parseMonetaryValue(e.target.value);
            e.target.value = cleanValue > 0 ? cleanValue.toFixed(2) : '';
        }
        
        setTimeout(() => { isFormatting = false; }, 100);
    });
    
    // Permitir apenas números, pontos e vírgulas durante a digitação
    input.addEventListener('input', function(e) {
        // Permitir dígitos, ponto e vírgula durante a digitação
        let value = e.target.value.replace(/[^\d.,]/g, '');
        
        // Limitar a apenas um ponto ou vírgula decimal
        const decimalCount = (value.match(/[.,]/g) || []).length;
        if (decimalCount > 1) {
            // Se há mais de um separador decimal, manter apenas o primeiro
            const firstDecimalIndex = value.search(/[.,]/);
            value = value.substring(0, firstDecimalIndex + 1) + value.substring(firstDecimalIndex + 1).replace(/[.,]/g, '');
        }
        
        e.target.value = value;
    });
}

// Aplicar formatação de percentual
function applyPercentageFormatting(input) {
    // Verificar se já foi formatado para evitar duplicação
    if (input.dataset.percentageFormatted === 'true') {
        return;
    }
    
    // Marcar como formatado
    input.dataset.percentageFormatted = 'true';
    
    input.addEventListener('blur', function(e) {
        if (e.target.value) {
            const value = parseFloat(e.target.value);
            if (!isNaN(value)) {
                if (value > 100) e.target.value = 100;
                if (value < 0) e.target.value = 0;
                e.target.value = parseFloat(e.target.value).toFixed(1);
            }
        }
    });
    
    input.addEventListener('input', function(e) {
        let value = e.target.value;
        
        // Permitir apenas números, vírgula e ponto
        value = value.replace(/[^\d.,]/g, '');
        
        // Converter vírgula para ponto
        value = value.replace(',', '.');
        
        // Limitar a um ponto decimal
        const parts = value.split('.');
        if (parts.length > 2) {
            value = parts[0] + '.' + parts.slice(1).join('');
        }
        
        // Limitar a 1 casa decimal
        if (parts[1] && parts[1].length > 1) {
            value = parts[0] + '.' + parts[1].substring(0, 1);
        }
        
        e.target.value = value;
        
        // Validação em tempo real para não passar de 100
        const numValue = parseFloat(value);
        if (!isNaN(numValue) && numValue > 100) {
            e.target.value = '100';
        }
    });
}

// Aplicar formatação de números inteiros
function applyIntegerFormatting(input) {
    // Verificar se já foi formatado para evitar duplicação
    if (input.dataset.integerFormatted === 'true') {
        return;
    }
    
    // Marcar como formatado
    input.dataset.integerFormatted = 'true';
    
    input.addEventListener('input', function(e) {
        e.target.value = e.target.value.replace(/[^\d]/g, '');
    });
    
    input.addEventListener('blur', function(e) {
        if (e.target.value) {
            const value = parseInt(e.target.value);
            if (!isNaN(value)) {
                e.target.value = value;
            }
        }
    });
}

// Validação de distribuição regional (soma deve ser 100%)
function validateRegionalDistribution(form) {
    const regionalFields = [
        form.querySelector('#abrangenciaLocal'),
        form.querySelector('#abrangenciaEstadual'), 
        form.querySelector('#abrangenciaNacional'),
        form.querySelector('#abrangenciaInternacional')
    ].filter(field => field !== null);

    if (regionalFields.length > 0) {
        regionalFields.forEach(field => {
            field.addEventListener('blur', function() {
                validateRegionalSum(regionalFields);
            });
        });
    }
}

// Validar se a soma dos percentuais regionais é 100%
function validateRegionalSum(fields) {
    const total = fields.reduce((sum, field) => {
        const value = parseFloat(field.value) || 0;
        return sum + value;
    }, 0);

    const messageContainer = document.getElementById('regional-validation-message') || createRegionalValidationMessage(fields[0]);
    
    if (total > 100) {
        messageContainer.textContent = `⚠️ Total: ${total}% (máximo 100%)`;
        messageContainer.className = 'validation-error';
    } else if (total < 100) {
        messageContainer.textContent = `ℹ️ Total: ${total}% (faltam ${100 - total}%)`;
        messageContainer.className = 'validation-warning';
    } else {
        messageContainer.textContent = `✅ Total: ${total}% (correto)`;
        messageContainer.className = 'validation-success';
    }
}

// Criar elemento de validação regional
function createRegionalValidationMessage(referenceField) {
    const message = document.createElement('div');
    message.id = 'regional-validation-message';
    message.style.marginTop = '10px';
    message.style.padding = '8px';
    message.style.borderRadius = '4px';
    message.style.fontSize = '14px';
    message.style.fontWeight = 'bold';
    
    const container = referenceField.closest('.subsection');
    if (container) {
        container.appendChild(message);
    }
    
    return message;
}

// Função de compatibilidade (manter para não quebrar código existente)
function applyMoneyFormatting(input) {
    applyMonetaryFormatting(input);
}

// Formatação de inputs
function formatInputs() {
    // Aplicar formatação universal a todos os campos
    applyUniversalFormatting(document);
    
    // Cálculo automático da capacidade de pagamento
    setupCapacidadePagamentoCalculation();
}

// Configurar cálculo automático da capacidade de pagamento
function setupCapacidadePagamentoCalculation() {
    const receitaInput = document.getElementById('receitaMediaMensal');
    const despesaInput = document.getElementById('despesaMediaMensal');
    const capacidadeInput = document.getElementById('capacidadePagamento');
    
    function calculateCapacidadePagamento() {
        if (receitaInput && despesaInput && capacidadeInput) {
            const receita = parseMonetaryValue(receitaInput.value);
            const despesa = parseMonetaryValue(despesaInput.value);
            const capacidade = receita - despesa;
            
            // Remover readonly temporariamente para atualizar o valor
            const wasReadonly = capacidadeInput.hasAttribute('readonly');
            capacidadeInput.removeAttribute('readonly');
            
            // Aplicar formatação monetária ao valor calculado
            capacidadeInput.value = formatCurrency(capacidade);
            
            // Restaurar readonly se estava presente
            if (wasReadonly) {
                capacidadeInput.setAttribute('readonly', true);
            }
        }
    }
    
    if (receitaInput) receitaInput.addEventListener('input', calculateCapacidadePagamento);
    if (despesaInput) despesaInput.addEventListener('input', calculateCapacidadePagamento);
    // Formatação de CNPJ
    const cnpjInput = document.getElementById('cnpj');
    if (cnpjInput) {
        cnpjInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            value = value.replace(/^(\d{2})(\d)/, '$1.$2');
            value = value.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
            value = value.replace(/\.(\d{3})(\d)/, '.$1/$2');
            value = value.replace(/(\d{4})(\d)/, '$1-$2');
            e.target.value = value;
        });
    }

    // Formatação de IE - aceitar apenas números
    const ieInput = document.getElementById('inscricaoEstadual');
    if (ieInput) {
        ieInput.addEventListener('input', function(e) {
            // Remove qualquer caractere não numérico
            e.target.value = e.target.value.replace(/\D/g, '');
        });
    }

    // Formatação de CNAE
    const cnaeInput = document.getElementById('cnae');
    if (cnaeInput) {
        cnaeInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            // Formato: 0000-0/00
            if (value.length > 4) {
                value = value.substring(0, 4) + '-' + value.substring(4);
            }
            if (value.length > 6) {
                value = value.substring(0, 6) + '/' + value.substring(6, 8);
            }
            e.target.value = value;
        });
    }

    // Formatação de telefone para todos os campos de telefone
    const phoneFields = document.querySelectorAll('input[type="tel"], input[id*="telefone"], input[id*="Telefone"], input[id*="telefoneContatoResponsavel"]');
    phoneFields.forEach(telefoneInput => {
        telefoneInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            
            if (value.length <= 11) {
                if (value.length <= 2) {
                    value = value.replace(/^(\d{0,2})/, '($1');
                } else if (value.length <= 7) {
                    value = value.replace(/^(\d{2})(\d{0,5})/, '($1) $2');
                } else {
                    value = value.replace(/^(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
                }
            } else {
                // Limitar a 11 dígitos
                value = value.substring(0, 11);
                value = value.replace(/^(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
            }
            
            e.target.value = value;
        });
        
        // Validação ao sair do campo
        telefoneInput.addEventListener('blur', function(e) {
            const value = e.target.value.replace(/\D/g, '');
            if (value && (value.length < 10 || value.length > 11)) {
                e.target.setCustomValidity('Telefone deve ter 10 ou 11 dígitos');
            } else {
                e.target.setCustomValidity('');
            }
        });
    });

    // Formatação de percentual
    const percentualInput = document.getElementById('percentualUtilizacao');
    if (percentualInput) {
        percentualInput.addEventListener('blur', function(e) {
            if (e.target.value) {
                const value = parseInt(e.target.value);
                if (!isNaN(value) && value >= 0 && value <= 100) {
                    e.target.value = value; // Manter apenas o número
                }
            }
        });
    }

    // Formatação de valores monetários
    const moneyInputs = form.querySelectorAll('input[type="number"]');
    moneyInputs.forEach(input => {
        if (input.name.includes('valor') || input.name.includes('Valor')) {
            // Aplicar máscara de moeda em tempo real
            input.addEventListener('input', function(e) {
                let value = e.target.value.replace(/\D/g, '');
                value = (parseInt(value) / 100).toFixed(2);
                if (!isNaN(value) && value !== '0.00') {
                    e.target.value = value;
                }
            });
            
            // Formatar ao sair do campo
            input.addEventListener('blur', function(e) {
                if (e.target.value) {
                    const value = parseFloat(e.target.value);
                    if (!isNaN(value)) {
                        e.target.value = formatCurrency(value);
                    }
                }
            });
            
            // Remover formatação ao focar
            input.addEventListener('focus', function(e) {
                if (e.target.value) {
                    e.target.value = e.target.value.replace(/[^\d.,]/g, '').replace(',', '.');
                }
            });
        }
    });
}

// Navegação entre seções
function goToPreviousStep() {
    if (currentStep > 1) {
        // Auto-save antes de mudar de seção
        autoSaveData();
        
        currentStep--;
        showSection(currentStep);
        updateProgressBar();
        updateNavigationButtons();
    }
}

function goToNextStep() {
    if (validateCurrentSection()) {
        if (currentStep < totalSteps) {
            // Auto-save antes de mudar de seção
            autoSaveData();
            
            currentStep++;
            showSection(currentStep);
            updateProgressBar();
            updateNavigationButtons();
        }
    }
}

function goToStep(step) {
    if (step >= 1 && step <= totalSteps) {
        currentStep = step;
        showSection(currentStep);
        updateProgressBar();
        updateNavigationButtons();
    }
}

function canNavigateToStep(step) {
    // Permite navegação para steps anteriores ou o próximo se a atual estiver válida
    return step <= currentStep || (step === currentStep + 1 && validateCurrentSection());
}

function showSection(step) {
    // Verificar se o formulário existe
    if (!form) {
        console.error('Formulário não encontrado!');
        return;
    }

    // Ocultar todas as seções
    const sections = form.querySelectorAll('.form-section');
    sections.forEach(section => {
        section.classList.remove('active');
    });

    // Mostrar seção atual
    const currentSection = form.querySelector(`[data-section="${step}"]`);
    if (currentSection) {
        currentSection.classList.add('active');
        
        // Verificação adicional - garantir que a seção seja exibida
        setTimeout(() => {
            const computedStyle = window.getComputedStyle(currentSection);
            if (computedStyle.display === 'none') {
                currentSection.style.display = 'block';
            }
        }, 100);
        
    } else {
        console.error(`Seção ${step} não encontrada`);
    }

    // Atualizar steps visuais
    const stepElements = document.querySelectorAll('.step');
    stepElements.forEach((stepEl, index) => {
        stepEl.classList.remove('active', 'completed');
        if (index + 1 === step) {
            stepEl.classList.add('active');
        } else if (index + 1 < step) {
            stepEl.classList.add('completed');
        }
    });

    // Scroll para o topo
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateProgressBar() {
    const progress = (currentStep / totalSteps) * 100;
    progressFill.style.width = `${progress}%`;
    
    // Atualizar texto de progresso
    updateProgressInfo();
}

function updateProgressInfo() {
    const progressText = document.getElementById('progressText');
    const progressPercentage = document.getElementById('progressPercentage');
    const saveStatus = document.getElementById('saveStatus');
    
    if (progressText) {
        progressText.textContent = `Etapa ${currentStep} de ${totalSteps}`;
    }
    
    if (progressPercentage) {
        const percentage = Math.round((currentStep / totalSteps) * 100);
        progressPercentage.textContent = `${percentage}%`;
    }
    
    if (saveStatus) {
        // Verificar quantas seções têm dados
        const completedSections = [];
        for (let i = 1; i <= totalSteps; i++) {
            if (hasSectionData(i)) {
                completedSections.push(i);
            }
        }
        
        if (completedSections.length === 0) {
            saveStatus.textContent = '💾 Auto-save ativo';
            saveStatus.className = 'save-status';
        } else if (completedSections.length === totalSteps) {
            saveStatus.textContent = '✅ Formulário completo';
            saveStatus.className = 'save-status saved';
        } else {
            saveStatus.textContent = `💾 ${completedSections.length}/${totalSteps} seções salvas`;
            saveStatus.className = 'save-status';
        }
    }
}

function updateNavigationButtons() {
    prevBtn.style.display = currentStep === 1 ? 'none' : 'inline-flex';
    
    if (currentStep === totalSteps) {
        nextBtn.style.display = 'none';
        previewBtn.style.display = 'inline-flex';
    } else {
        nextBtn.style.display = 'inline-flex';
        previewBtn.style.display = 'none';
    }
}

// Validação
function validateCurrentSection() {
    const currentSection = form.querySelector(`[data-section="${currentStep}"]`);
    const requiredInputs = currentSection.querySelectorAll('input[required], textarea[required], select[required]');
    let isValid = true;

    requiredInputs.forEach(input => {
        if (!validateField({ target: input })) {
            isValid = false;
        }
    });

    // Validações específicas por seção
    switch (currentStep) {
        case 1:
            isValid &= validateCNPJ();
            break;
        case 4:
            isValid &= validateDateRange();
            break;
        case 7:
            isValid &= validateEmail();
            break;
    }

    return isValid;
}

function validateField(e) {
    const field = e.target;
    const value = field.value.trim();
    const fieldGroup = field.closest('.form-group');
    
    // Remover mensagens de erro anteriores
    clearFieldError({ target: field });

    if (field.hasAttribute('required') && !value) {
        showFieldError(field, 'Este campo é obrigatório');
        return false;
    }

    // Validações específicas por tipo
    if (field.type === 'email' && value && !isValidEmail(value)) {
        showFieldError(field, 'E-mail inválido');
        return false;
    }

    if (field.type === 'tel' && value && !isValidPhone(value)) {
        showFieldError(field, 'Telefone inválido');
        return false;
    }

    if (field.name === 'cnpj' && value && !isValidCNPJ(value)) {
        showFieldError(field, 'CNPJ inválido');
        return false;
    }

    // Se chegou até aqui, o campo é válido
    fieldGroup.classList.add('success');
    fieldGroup.classList.remove('error');
    return true;
}

function validateCNPJ() {
    const cnpjField = document.getElementById('cnpj');
    const cnpj = cnpjField.value.replace(/\D/g, '');
    
    if (cnpj && !isValidCNPJ(cnpj)) {
        showFieldError(cnpjField, 'CNPJ inválido');
        return false;
    }
    return true;
}

function validateDateRange() {
    const dataInicio = document.getElementById('dataInicio');
    const dataTermino = document.getElementById('dataTermino');
    
    if (dataInicio.value && dataTermino.value) {
        const inicio = new Date(dataInicio.value);
        const termino = new Date(dataTermino.value);
        const diffMonths = (termino.getFullYear() - inicio.getFullYear()) * 12 + (termino.getMonth() - inicio.getMonth());
        
        if (termino <= inicio) {
            showFieldError(dataTermino, 'Data de término deve ser posterior à data de início');
            return false;
        }
        
        if (diffMonths > 36) {
            showFieldError(dataTermino, 'Prazo máximo de 36 meses excedido');
            return false;
        }
    }
    return true;
}

function validateEmail() {
    const emailField = document.getElementById('emailResponsavel');
    const email = emailField.value.trim();
    
    if (email && !isValidEmail(email)) {
        showFieldError(emailField, 'E-mail inválido');
        return false;
    }
    return true;
}

function showFieldError(field, message) {
    const fieldGroup = field.closest('.form-group');
    fieldGroup.classList.add('error');
    fieldGroup.classList.remove('success');
    
    // Remover mensagem anterior se existir
    const existingError = fieldGroup.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }
    
    // Adicionar nova mensagem de erro
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    fieldGroup.appendChild(errorDiv);
}

function clearFieldError(e) {
    const field = e.target;
    const fieldGroup = field.closest('.form-group');
    fieldGroup.classList.remove('error');
    
    const errorMessage = fieldGroup.querySelector('.error-message');
    if (errorMessage) {
        errorMessage.remove();
    }
}

// Utilitários de validação
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function isValidPhone(phone) {
    const phoneRegex = /^\(\d{2}\)\s\d{4,5}-\d{4}$/;
    return phoneRegex.test(phone);
}

function isValidCNPJ(cnpj) {
    cnpj = cnpj.replace(/\D/g, '');
    
    if (cnpj.length !== 14) return false;
    
    // Verificar se todos os dígitos são iguais
    if (/^(\d)\1+$/.test(cnpj)) return false;
    
    // Validar dígitos verificadores
    let length = cnpj.length - 2;
    let numbers = cnpj.substring(0, length);
    let digits = cnpj.substring(length);
    let sum = 0;
    let pos = length - 7;
    
    for (let i = length; i >= 1; i--) {
        sum += numbers.charAt(length - i) * pos--;
        if (pos < 2) pos = 9;
    }
    
    let result = sum % 11 < 2 ? 0 : 11 - sum % 11;
    if (result != digits.charAt(0)) return false;
    
    length = length + 1;
    numbers = cnpj.substring(0, length);
    sum = 0;
    pos = length - 7;
    
    for (let i = length; i >= 1; i--) {
        sum += numbers.charAt(length - i) * pos--;
        if (pos < 2) pos = 9;
    }
    
    result = sum % 11 < 2 ? 0 : 11 - sum % 11;
    return result == digits.charAt(1);
}

// Upload de arquivos
function handleFileUpload(e) {
    const input = e.target;
    const files = input.files;
    const label = input.nextElementSibling.querySelector('.file-upload-text');
    
    if (files.length > 0) {
        if (files.length === 1) {
            label.textContent = files[0].name;
        } else {
            label.textContent = `${files.length} arquivos selecionados`;
        }
        
        // Armazenar arquivos
        uploadedFiles[input.name] = files;
        
        // Validar tamanho dos arquivos
        let totalSize = 0;
        for (let file of files) {
            totalSize += file.size;
        }
        
        // Limite de 10MB por upload
        if (totalSize > 10 * 1024 * 1024) {
            showFieldError(input, 'Arquivo(s) muito grande(s). Máximo 10MB por upload.');
            input.value = '';
            label.textContent = 'Clique para selecionar arquivo';
            delete uploadedFiles[input.name];
        }
    } else {
        label.textContent = 'Clique para selecionar arquivo';
        delete uploadedFiles[input.name];
    }
}

// Cálculos automáticos
function calculateTotalInvestment() {
    const obrasCivis = parseFloat(document.getElementById('valorObrasCivis').value) || 0;
    const maquinas = parseFloat(document.getElementById('valorMaquinas').value) || 0;
    const instalacoes = parseFloat(document.getElementById('valorInstalacoes').value) || 0;
    const outros = parseFloat(document.getElementById('outrosInvestimentos').value) || 0;
    
    const total = obrasCivis + maquinas + instalacoes + outros;
    
    document.getElementById('valorTotal').textContent = formatCurrency(total);
}

// Coleta de dados do formulário
function collectFormData() {
    const formDataObj = new FormData(form);
    const data = {};
    
    for (let [key, value] of formDataObj.entries()) {
        if (data[key]) {
            if (Array.isArray(data[key])) {
                data[key].push(value);
            } else {
                data[key] = [data[key], value];
            }
        } else {
            data[key] = value;
        }
    }
    
    // Adicionar dados de arquivos
    data.uploadedFiles = uploadedFiles;
    
    return data;
}

// Prévia dos dados
function showPreview() {
    console.log('🔍 showPreview() iniciado');
    
    // Coletar problemas de validação sem bloquear
    const validationIssues = collectValidationIssues();
    
    if (validationIssues.length > 0) {
        console.log('⚠️ Problemas encontrados:', validationIssues.length);
        showValidationConfirmationModal(validationIssues);
    } else {
        console.log('✅ Nenhum problema encontrado, gerando preview');
        generateAndShowPreview();
    }
}

function generateAndShowPreview(validationIssues = []) {
    const data = collectFormData();
    generatePreviewContent(data, validationIssues);
    previewModal.classList.add('active');
    console.log('🎉 Modal de preview ativado');
}

// Função para coletar todos os problemas de validação
function collectValidationIssues() {
    const issues = [];
    
    // Percorrer todas as seções (1 a 14)
    for (let section = 1; section <= totalSteps; section++) {
        const sectionElement = form.querySelector(`[data-section="${section}"]`);
        if (!sectionElement) continue;
        
        const sectionIssues = {
            section: section,
            sectionTitle: getSectionTitle(section),
            problems: []
        };
        
        // Verificar campos obrigatórios
        const requiredInputs = sectionElement.querySelectorAll('input[required], textarea[required], select[required]');
        requiredInputs.forEach(input => {
            if (!input.value || input.value.trim() === '') {
                sectionIssues.problems.push({
                    field: input.id || input.name,
                    label: getFieldLabel(input),
                    type: 'missing',
                    message: 'Campo obrigatório não preenchido'
                });
            }
        });
        
        // Validações específicas por seção
        switch (section) {
            case 1:
                // Validação CNPJ
                const cnpjField = sectionElement.querySelector('#cnpj');
                if (cnpjField && cnpjField.value && !isValidCNPJ(cnpjField.value)) {
                    sectionIssues.problems.push({
                        field: 'cnpj',
                        label: 'CNPJ',
                        type: 'invalid',
                        message: 'CNPJ inválido'
                    });
                }
                break;
                
            case 4:
                // Validação de datas do cronograma
                const dataInicio = sectionElement.querySelector('#dataInicio');
                const dataFim = sectionElement.querySelector('#dataFim');
                if (dataInicio && dataFim && dataInicio.value && dataFim.value) {
                    const inicio = new Date(dataInicio.value);
                    const fim = new Date(dataFim.value);
                    const diffMonths = (fim.getFullYear() - inicio.getFullYear()) * 12 + fim.getMonth() - inicio.getMonth();
                    
                    if (diffMonths > 36) {
                        sectionIssues.problems.push({
                            field: 'dataFim',
                            label: 'Data de Fim',
                            type: 'invalid',
                            message: 'Prazo excede 36 meses permitidos'
                        });
                    }
                }
                break;
        }
        
        // Se há problemas nesta seção, adicionar à lista
        if (sectionIssues.problems.length > 0) {
            issues.push(sectionIssues);
        }
    }
    
    return issues;
}

// Função auxiliar para obter título da seção
function getSectionTitle(sectionNumber) {
    const titles = {
        1: 'Identificação do Beneficiário',
        2: 'Descrição do Empreendimento', 
        3: 'Valor Total do Investimento',
        4: 'Cronograma Físico-Financeiro',
        5: 'Detalhamento dos Investimentos',
        6: 'Documentação Complementar',
        7: 'Plano de Acompanhamento',
        8: 'Recursos Humanos',
        9: 'Encargos e Benefícios',
        10: 'Distribuição Geográfica',
        11: 'Indicadores Econômicos',
        12: 'Sustentabilidade Ambiental',
        13: 'Cronograma de Desembolso',
        14: 'Projetos de Inovação'
    };
    return titles[sectionNumber] || `Seção ${sectionNumber}`;
}

// Função auxiliar para obter label do campo
function getFieldLabel(input) {
    // Procurar por label associado
    const label = document.querySelector(`label[for="${input.id}"]`);
    if (label) return label.textContent.replace('*', '').trim();
    
    // Procurar por placeholder
    if (input.placeholder) return input.placeholder;
    
    // Usar ID como fallback
    return input.id || input.name || 'Campo';
}

// Função para exibir modal de confirmação de validação
function showValidationConfirmationModal(validationIssues) {
    const validationModal = document.getElementById('validationConfirmationModal');
    const validationContent = document.getElementById('validationIssuesContent');
    const fixIssuesBtn = document.getElementById('fixIssuesBtn');
    const continueWithIssuesBtn = document.getElementById('continueWithIssuesBtn');
    const validationModalClose = document.getElementById('validationModalClose');
    
    // Gerar conteúdo HTML com os problemas
    let html = `
        <div class="validation-summary">
            <p><strong>Foram encontrados ${getTotalProblemsCount(validationIssues)} problemas em ${validationIssues.length} seções:</strong></p>
        </div>
        <div class="validation-issues">
    `;
    
    validationIssues.forEach(sectionIssue => {
        html += `
            <div class="validation-section">
                <h4 class="validation-section-title">
                    Seção ${sectionIssue.section}: ${sectionIssue.sectionTitle}
                </h4>
                <ul class="validation-problems-list">
        `;
        
        sectionIssue.problems.forEach(problem => {
            const icon = problem.type === 'missing' ? '❌' : '⚠️';
            html += `
                <li class="validation-problem ${problem.type}">
                    ${icon} <strong>${problem.label}:</strong> ${problem.message}
                </li>
            `;
        });
        
        html += `
                </ul>
            </div>
        `;
    });
    
    html += `
        </div>
        <div class="validation-options">
            <p><strong>O que você gostaria de fazer?</strong></p>
            <ul>
                <li>🔧 <strong>Corrigir Dados:</strong> Navegar para a primeira seção com problemas para correção</li>
                <li>📋 <strong>Continuar com Preview:</strong> Gerar prévia destacando os campos problemáticos</li>
            </ul>
        </div>
    `;
    
    validationContent.innerHTML = html;
    
    // Configurar event listeners para os botões
    fixIssuesBtn.onclick = () => {
        validationModal.classList.remove('active');
        // Navegar para a primeira seção com problemas
        const firstProblemSection = validationIssues[0].section;
        goToStep(firstProblemSection);
        console.log(`🔧 Navegando para seção ${firstProblemSection} para correção`);
    };
    
    continueWithIssuesBtn.onclick = () => {
        validationModal.classList.remove('active');
        // Gerar preview com os problemas destacados
        generateAndShowPreview(validationIssues);
        console.log('📋 Gerando preview com problemas destacados');
    };
    
    validationModalClose.onclick = () => {
        validationModal.classList.remove('active');
    };
    
    // Mostrar o modal
    validationModal.classList.add('active');
}

// Função auxiliar para contar total de problemas
function getTotalProblemsCount(validationIssues) {
    return validationIssues.reduce((total, section) => total + section.problems.length, 0);
}

function generatePreviewContent(data, validationIssues = []) {
    // Criar mapa de problemas para facilitar busca
    const problemsMap = new Map();
    validationIssues.forEach(sectionIssue => {
        sectionIssue.problems.forEach(problem => {
            problemsMap.set(problem.field, {
                type: problem.type,
                message: problem.message,
                section: sectionIssue.section
            });
        });
    });
    const sections = [
        {
            title: '1. Identificação do Beneficiário',
            fields: [
                { label: 'Razão Social', key: 'razaoSocial' },
                { label: 'CNPJ', key: 'cnpj' },
                { label: 'Inscrição Estadual', key: 'inscricaoEstadual' },
                { label: 'Endereço Completo', key: 'enderecoCompleto' },
                { label: 'Programas Fiscais', key: 'programasFiscais' }
            ]
        },
        {
            title: '2. Descrição do Empreendimento',
            fields: [
                { label: 'Município', key: 'municipio' },
                { label: 'Loteamento', key: 'loteamento' },
                { label: 'Endereço do Empreendimento', key: 'enderecoEmpreendimento' },
                { label: 'CNAE Principal', key: 'cnae' },
                { label: 'Atividade Econômica', key: 'atividadeEconomica' },
                { label: 'Justificativa Estratégica', key: 'justificativaEstrategica' }
            ]
        },
        {
            title: '3. Valor Total do Investimento',
            fields: [
                { label: 'Obras Civis', key: 'valorObrasCivis', format: 'currency' },
                { label: 'Máquinas e Equipamentos', key: 'valorMaquinas', format: 'currency' },
                { label: 'Instalações', key: 'valorInstalacoes', format: 'currency' },
                { label: 'Outros Investimentos', key: 'outrosInvestimentos', format: 'currency' },
                { label: 'Valor da Operação', key: 'valorOperacao', format: 'currency' }
            ]
        },
        {
            title: '4. Cronograma Físico-Financeiro',
            fields: [
                { label: 'Data de Início', key: 'dataInicio', format: 'date' },
                { label: 'Data de Término', key: 'dataTermino', format: 'date' },
                { label: 'Início Obras Civis', key: 'inicioObrasCivis', format: 'date' },
                { label: 'Término Obras Civis', key: 'terminoObrasCivis', format: 'date' },
                { label: 'Início Instalação Máquinas', key: 'inicioInstalacaoMaquinas', format: 'date' },
                { label: 'Término Instalação Máquinas', key: 'terminoInstalacaoMaquinas', format: 'date' },
                { label: 'Outros Investimentos', key: 'outrosInvestimentosCronograma' }
            ]
        },
        {
            title: '5. Detalhamento dos Investimentos',
            fields: [
                { label: 'Especificação Obras', key: 'especificacaoObras' },
                { label: 'Especificação Máquinas', key: 'especificacaoMaquinas' },
                { label: 'Especificação Instalações', key: 'especificacaoInstalacoes' },
                { label: 'Fornecedores', key: 'fornecedores' }
            ]
        },
        {
            title: '6. Documentação Complementar',
            fields: [
                { label: 'Projeto Arquitetônico', key: 'projetoArquitetonico', format: 'file' },
                { label: 'Licença Ambiental', key: 'licencaAmbiental', format: 'file' },
                { label: 'Certidões Negativas', key: 'certidoesNegativas', format: 'file' },
                { label: 'Balanços Patrimoniais', key: 'balancosPatrimoniais', format: 'file' },
                { label: 'Orçamentos/Propostas', key: 'orcamentosPropostas', format: 'file' }
            ]
        },
        {
            title: '7. Plano de Acompanhamento',
            fields: [
                { label: 'Metodologia de Controle', key: 'metodologiaControle' },
                { label: 'Procedimentos Relatórios', key: 'procedimentosRelatorios' },
                { label: 'Responsável Acompanhamento', key: 'responsavelAcompanhamento' },
                { label: 'Cargo/Função', key: 'cargoResponsavel' },
                { label: 'E-mail Responsável', key: 'emailResponsavel' },
                { label: 'Telefone Responsável', key: 'telefoneResponsavel' }
            ]
        },
        {
            title: '8. Caracterização da Empresa',
            fields: [
                { label: 'Histórico da Empresa', key: 'historicoEmpresa' },
                { label: 'Atividade Principal', key: 'atividadePrincipal' },
                { label: 'Ano de Fundação', key: 'anoFundacao' },
                { label: 'Forma Jurídica', key: 'formaJuridica' },
                { label: 'Porte da Empresa', key: 'porteEmpresa' },
                { label: 'Regime Tributário', key: 'regimeTributario' },
                { label: 'Grupo Empresarial', key: 'grupoEmpresarial' },
                { label: 'Estrutura Societária', key: 'estruturaSocietaria' },
                { label: 'Estrutura Organizacional', key: 'estruturaOrganizacional' },
                { label: 'Principais Clientes', key: 'principaisClientes' },
                { label: 'Certificações', key: 'certificacoes' }
            ]
        },
        {
            title: '9. Produção e Operações',
            fields: [
                { label: 'Capacidade Produtiva Atual', key: 'capacidadeAtual' },
                { label: 'Unidade de Medida', key: 'unidadeMedida' },
                { label: 'Capacidade Pós-Investimento', key: 'capacidadeFutura' },
                { label: 'Utilização da Capacidade (%)', key: 'percentualUtilizacao' },
                { label: 'Descrição do Processo', key: 'descricaoProcesso' },
                { label: 'Tipo de Processo', key: 'tipoProcesso' },
                { label: 'Número de Turnos', key: 'turnos' },
                { label: 'Horas de Trabalho/Dia', key: 'horasTrabalho' },
                { label: 'Dias de Operação/Ano', key: 'diasOperacao' },
                { label: 'Principais Produtos', key: 'principaisProdutos' },
                { label: 'Mix de Produtos', key: 'mixProdutos' },
                { label: 'Controle de Qualidade', key: 'controleQualidade' },
                { label: 'Tempo Médio de Ciclo', key: 'tempoMedioCiclo' }
            ]
        },
        {
            title: '10. Análise de Mercado',
            fields: [
                { label: 'Perfil dos Clientes', key: 'perfilClientes' },
                { label: 'Número de Clientes', key: 'numeroClientes' },
                { label: 'Ticket Médio', key: 'ticketMedio', format: 'currency' },
                { label: 'Ambiente Competitivo', key: 'ambienteCompetitivo' },
                { label: 'Principais Concorrentes', key: 'principaisConcorrentes' },
                { label: 'Diferenciais Competitivos', key: 'diferenciaisCompetitivos' },
                { label: 'Mercado Local (%)', key: 'abrangenciaLocal' },
                { label: 'Mercado Estadual (%)', key: 'abrangenciaEstadual' },
                { label: 'Mercado Nacional (%)', key: 'abrangenciaNacional' },
                { label: 'Mercado Internacional (%)', key: 'abrangenciaInternacional' },
                { label: 'Canais de Distribuição', key: 'canaisDistribuicao' },
                { label: 'Sazonalidade', key: 'sazonalidade' },
                { label: 'Crescimento Esperado (%)', key: 'crescimentoEsperado' },
                { label: 'Estratégia de Marketing', key: 'estrategiaMarketing' }
            ]
        },
        {
            title: '11. Recursos Humanos',
            fields: [
                { label: 'Total de Funcionários Atuais', key: 'funcionariosAtuais' },
                { label: 'Funcionários Diretos', key: 'funcionariosDiretos' },
                { label: 'Funcionários Indiretos', key: 'funcionariosIndiretos' },
                { label: 'Funcionários Administrativos', key: 'funcionariosAdministrativos' },
                { label: 'Estrutura Organizacional', key: 'estruturaOrganizacionalRH' },
                { label: 'Benefícios Oferecidos', key: 'beneficiosOferecidos' },
                { label: 'Programas de Treinamento', key: 'programasTreinamento' },
                { label: 'Política de Remuneração', key: 'politicaRemuneracao' },
                { label: 'Novas Contratações Previstas', key: 'novasContratacoes' },
                { label: 'Perfil das Contratações', key: 'perfilContratacoes' },
                { label: 'Investimento em RH', key: 'investimentoRH', format: 'currency' },
                { label: 'Política de Segurança', key: 'politicaSeguranca' }
            ]
        },
        {
            title: '12. Informações Financeiras',
            fields: [
                { label: 'Ano Base', key: 'anoBase' },
                { label: 'Regime Contábil', key: 'regimeContabil' },
                { label: 'Capital Social', key: 'capitalSocial', format: 'currency' },
                { label: 'Capital Integralizado', key: 'capitalIntegralizado', format: 'currency' },
                { label: 'Patrimônio Líquido', key: 'patrimonioLiquido', format: 'currency' },
                { label: 'Ativo Total', key: 'ativoTotal', format: 'currency' },
                { label: 'Passivo Total', key: 'passivoTotal', format: 'currency' },
                { label: 'Endividamento Total', key: 'endividamentoTotal', format: 'currency' },
                { label: 'Endividamento Bancário', key: 'endividamentoBancario', format: 'currency' },
                { label: 'Saldo de Caixa', key: 'saldoCaixa', format: 'currency' },
                { label: 'Contas a Receber', key: 'contasReceber', format: 'currency' },
                { label: 'Contas a Pagar', key: 'contasPagar', format: 'currency' },
                { label: 'Capital de Giro', key: 'capitalGiro', format: 'currency' },
                { label: 'Receita Média Mensal', key: 'receitaMediaMensal', format: 'currency' },
                { label: 'Despesa Média Mensal', key: 'despesaMediaMensal', format: 'currency' },
                { label: 'EBITDA', key: 'ebitda', format: 'currency' },
                { label: 'Fluxo de Caixa Livre', key: 'fluxoCaixaLivre', format: 'currency' }
            ]
        },
        {
            title: '13. Receitas e Custos',
            fields: [
                { label: 'Receita Bruta Anual', key: 'receitaBrutaAnual', format: 'currency' },
                { label: 'Deduções', key: 'deducoes', format: 'currency' },
                { label: 'Receita Líquida Anual', key: 'receitaLiquidaAnual', format: 'currency' },
                { label: 'Custos Fixos Mensais', key: 'custosFixosMensais', format: 'currency' },
                { label: 'Custos Variáveis Mensais', key: 'custosVariaveisMensais', format: 'currency' },
                { label: 'Custo Total', key: 'custoTotal', format: 'currency' },
                { label: 'Margem de Contribuição', key: 'margemContribuicao' },
                { label: 'Margem de Lucro (%)', key: 'margemLucro' },
                { label: 'Ponto de Equilíbrio', key: 'pontoEquilibrio', format: 'currency' },
                { label: 'Prazo Médio Recebimento', key: 'prazoMedioRecebimento' },
                { label: 'Prazo Médio Pagamento', key: 'prazoMedioPagamento' },
                { label: 'Método de Precificação', key: 'metodoPrecificacao' },
                { label: 'Estratégia de Preços', key: 'estrategiaPrecos' }
            ]
        },
        {
            title: '14. Projetos de Inovação',
            fields: [
                { label: 'Possui P&D', key: 'temPD' },
                { label: 'Área de P&D', key: 'areaPD' },
                { label: 'Equipe de P&D', key: 'equipePD' },
                { label: 'Investimento em P&D', key: 'investimentoPD', format: 'currency' },
                { label: 'Projetos em Andamento', key: 'projetosAndamento' },
                { label: 'Parcerias Tecnológicas', key: 'parceriasTecnologicas' },
                { label: 'Patentes', key: 'patentes' },
                { label: 'Tecnologia Atual', key: 'tecnologiaAtual' },
                { label: 'Tecnologias Planejadas', key: 'tecnologiasPlanejadas' },
                { label: 'Nível de Automação (%)', key: 'automacao' },
                { label: 'Sistemas Integrados', key: 'sistemasIntegrados' },
                { label: 'Indústria 4.0', key: 'industria40' },
                { label: 'Sustentabilidade', key: 'sustentabilidade' },
                { label: 'Impactos Esperados', key: 'impactosEsperados' }
            ]
        }
    ];

    let html = '';
    
    // Adicionar legenda se há problemas
    if (validationIssues.length > 0) {
        html += `
            <div class="preview-legend">
                <h4>📋 Legenda dos Destaques:</h4>
                <div class="legend-items">
                    <div class="legend-item">
                        <span class="legend-color missing"></span>
                        <span>❌ Campos obrigatórios não preenchidos</span>
                    </div>
                    <div class="legend-item">
                        <span class="legend-color invalid"></span>
                        <span>⚠️ Dados com formato incorreto</span>
                    </div>
                </div>
                <p class="legend-note"><strong>Total:</strong> ${getTotalProblemsCount(validationIssues)} problemas em ${validationIssues.length} seções</p>
            </div>
        `;
    }
    
    sections.forEach(section => {
        html += `<div class="preview-section">
            <h4 class="preview-title">${section.title}</h4>
            <div class="preview-grid">`;
        
        section.fields.forEach(field => {
            let value = data[field.key] || '';
            let problemClass = '';
            let problemIcon = '';
            let problemMessage = '';
            
            // Verificar se há problema com este campo
            const fieldProblem = problemsMap.get(field.key);
            if (fieldProblem) {
                problemClass = fieldProblem.type;
                problemIcon = fieldProblem.type === 'missing' ? '❌' : '⚠️';
                problemMessage = fieldProblem.message;
            }
            
            // Formatação do valor
            if (field.format === 'currency' && value) {
                value = formatCurrency(parseFloat(value));
            } else if (field.format === 'date' && value) {
                value = new Date(value).toLocaleDateString('pt-BR');
            } else if (field.format === 'file') {
                const files = uploadedFiles[field.key];
                if (files && files.length > 0) {
                    value = Array.from(files).map(f => f.name).join(', ');
                } else {
                    value = 'Nenhum arquivo selecionado';
                }
            }
            
            // Se campo está vazio e tem problema, mostrar placeholder
            if (!value && fieldProblem && fieldProblem.type === 'missing') {
                value = '[Campo não preenchido]';
            } else if (!value && !fieldProblem) {
                // Campos opcionais vazios não são mostrados
                return;
            } else if (value && fieldProblem && fieldProblem.type === 'invalid') {
                value += ' [Dados incorretos]';
            }
            
            html += `<div class="preview-item ${problemClass}">
                <div class="preview-label">
                    ${problemIcon} ${field.label}
                    ${problemMessage ? `<div class="problem-message">${problemMessage}</div>` : ''}
                </div>
                <div class="preview-value">${value}</div>
            </div>`;
        });
        
        html += `</div></div>`;
    });

    previewContent.innerHTML = html;
}

function closePreview() {
    previewModal.classList.remove('active');
}

// Exportação para Excel
function exportToExcel() {
    const data = collectFormData();
    const wb = XLSX.utils.book_new();
    
    // Criar planilha principal com dados
    const wsData = [];
    wsData.push(['COLETA DE INFORMAÇÕES - PROJETO CEI']);
    wsData.push(['Expertzy - Inteligência Tributária']);
    wsData.push(['Sistema Completo - 14 Seções']);
    wsData.push([]);
    
    // Seção 1
    wsData.push(['1. IDENTIFICAÇÃO DO BENEFICIÁRIO']);
    wsData.push(['Razão Social:', data.razaoSocial || '']);
    wsData.push(['CNPJ:', data.cnpj || '']);
    wsData.push(['Inscrição Estadual:', data.inscricaoEstadual || '']);
    wsData.push(['Endereço Completo:', data.enderecoCompleto || '']);
    wsData.push(['Programas Fiscais:', data.programasFiscais || '']);
    wsData.push([]);
    
    // Seção 2
    wsData.push(['2. DESCRIÇÃO DO EMPREENDIMENTO']);
    wsData.push(['Município:', data.municipio || '']);
    wsData.push(['Loteamento:', data.loteamento || '']);
    wsData.push(['Endereço do Empreendimento:', data.enderecoEmpreendimento || '']);
    wsData.push(['CNAE Principal:', data.cnae || '']);
    wsData.push(['Atividade Econômica:', data.atividadeEconomica || '']);
    wsData.push(['Justificativa Estratégica:', data.justificativaEstrategica || '']);
    wsData.push([]);
    
    // Seção 3
    wsData.push(['3. VALOR TOTAL DO INVESTIMENTO']);
    wsData.push(['Obras Civis:', parseFloat(data.valorObrasCivis || 0)]);
    wsData.push(['Máquinas e Equipamentos:', parseFloat(data.valorMaquinas || 0)]);
    wsData.push(['Instalações:', parseFloat(data.valorInstalacoes || 0)]);
    wsData.push(['Outros Investimentos:', parseFloat(data.outrosInvestimentos || 0)]);
    const total = (parseFloat(data.valorObrasCivis || 0) + parseFloat(data.valorMaquinas || 0) + 
                  parseFloat(data.valorInstalacoes || 0) + parseFloat(data.outrosInvestimentos || 0));
    wsData.push(['TOTAL GERAL:', total]);
    wsData.push([]);
    
    // Seção 4
    wsData.push(['4. CRONOGRAMA FÍSICO-FINANCEIRO']);
    wsData.push(['Data de Início:', data.dataInicio || '']);
    wsData.push(['Data de Término:', data.dataTermino || '']);
    wsData.push(['Início Obras Civis:', data.inicioObrasCivis || '']);
    wsData.push(['Término Obras Civis:', data.terminoObrasCivis || '']);
    wsData.push(['Início Instalação Máquinas:', data.inicioInstalacaoMaquinas || '']);
    wsData.push(['Término Instalação Máquinas:', data.terminoInstalacaoMaquinas || '']);
    wsData.push(['Outros Investimentos:', data.outrosInvestimentosCronograma || '']);
    wsData.push([]);
    
    // Seção 5
    wsData.push(['5. DETALHAMENTO DOS INVESTIMENTOS']);
    wsData.push(['Especificação Obras:', data.especificacaoObras || '']);
    wsData.push(['Especificação Máquinas:', data.especificacaoMaquinas || '']);
    wsData.push(['Especificação Instalações:', data.especificacaoInstalacoes || '']);
    wsData.push(['Fornecedores:', data.fornecedores || '']);
    wsData.push([]);
    
    // Seção 6
    wsData.push(['6. DOCUMENTAÇÃO COMPLEMENTAR']);
    Object.keys(uploadedFiles).forEach(key => {
        const files = uploadedFiles[key];
        if (files && files.length > 0) {
            wsData.push([key + ':', Array.from(files).map(f => f.name).join(', ')]);
        }
    });
    wsData.push([]);
    
    // Seção 7
    wsData.push(['7. PLANO DE ACOMPANHAMENTO']);
    wsData.push(['Metodologia de Controle:', data.metodologiaControle || '']);
    wsData.push(['Procedimentos Relatórios:', data.procedimentosRelatorios || '']);
    wsData.push(['Responsável:', data.responsavelAcompanhamento || '']);
    wsData.push(['Cargo/Função:', data.cargoResponsavel || '']);
    wsData.push(['E-mail:', data.emailResponsavel || '']);
    wsData.push(['Telefone:', data.telefoneResponsavel || '']);
    wsData.push([]);
    
    // Seção 8
    wsData.push(['8. CARACTERIZAÇÃO DA EMPRESA']);
    wsData.push(['Histórico da Empresa:', data.historicoEmpresa || '']);
    wsData.push(['Forma Jurídica:', data.formaJuridica || '']);
    wsData.push(['Porte da Empresa:', data.porteEmpresa || '']);
    wsData.push(['Regime Tributário:', data.regimeTributario || '']);
    wsData.push(['Operações Atuais:', data.operacoesAtuais || '']);
    wsData.push([]);
    
    // Seção 9
    wsData.push(['9. PRODUÇÃO E OPERAÇÕES']);
    wsData.push(['Capacidade Atual:', data.capacidadeAtual || '']);
    wsData.push(['Capacidade Futura:', data.capacidadeFutura || '']);
    wsData.push(['% Utilização:', data.percentualUtilizacao || '']);
    wsData.push(['Descrição Processo:', data.descricaoProcesso || '']);
    wsData.push(['Tipo de Processo:', data.tipoProcesso || '']);
    wsData.push(['Turnos:', data.turnos || '']);
    wsData.push(['Horas/Dia:', data.horasTrabalho || '']);
    wsData.push([]);
    
    // Seção 10
    wsData.push(['10. ANÁLISE DE MERCADO']);
    wsData.push(['Perfil Clientes:', data.perfilClientes || '']);
    wsData.push(['Número de Clientes:', data.numeroClientes || '']);
    wsData.push(['Ticket Médio:', data.ticketMedio || '']);
    wsData.push(['Ambiente Competitivo:', data.ambienteCompetitivo || '']);
    wsData.push(['Mercado Local (%):', data.abrangenciaLocal || '']);
    wsData.push(['Mercado Estadual (%):', data.abrangenciaEstadual || '']);
    wsData.push(['Mercado Nacional (%):', data.abrangenciaNacional || '']);
    wsData.push(['Mercado Internacional (%):', data.abrangenciaInternacional || '']);
    wsData.push(['Crescimento Esperado (%):', data.crescimentoEsperado || '']);
    wsData.push([]);
    
    // Seção 11
    wsData.push(['11. RECURSOS HUMANOS']);
    wsData.push(['Funcionários Atuais:', data.funcionariosAtuais || '']);
    wsData.push(['Estrutura Organizacional:', data.estruturaOrganizacional || '']);
    wsData.push(['Benefícios Oferecidos:', data.beneficiosOferecidos || '']);
    wsData.push(['Programas Treinamento:', data.programasTreinamento || '']);
    wsData.push(['Novas Contratações:', data.novasContratacoes || '']);
    wsData.push(['Investimento RH:', data.investimentoRH || '']);
    wsData.push([]);
    
    // Seção 12
    wsData.push(['12. INFORMAÇÕES FINANCEIRAS']);
    wsData.push(['Ano Base:', data.anoBase || '']);
    wsData.push(['Regime Contábil:', data.regimeContabil || '']);
    wsData.push(['Capital Social:', data.capitalSocial || '']);
    wsData.push(['Capital Integralizado:', data.capitalIntegralizado || '']);
    wsData.push(['Endividamento Total:', data.endividamentoTotal || '']);
    wsData.push(['Saldo Caixa:', data.saldoCaixa || '']);
    wsData.push(['Receita Média Mensal:', data.receitaMediaMensal || '']);
    wsData.push(['Despesa Média Mensal:', data.despesaMediaMensal || '']);
    wsData.push([]);
    
    // Seção 13
    wsData.push(['13. RECEITAS E CUSTOS']);
    wsData.push(['Receita Bruta Anual:', data.receitaBrutaAnual || '']);
    wsData.push(['Receita Líquida Anual:', data.receitaLiquidaAnual || '']);
    wsData.push(['Custos Fixos Mensais:', data.custosFixosMensais || '']);
    wsData.push(['Custos Variáveis Mensais:', data.custosVariaveisMensais || '']);
    wsData.push(['Margem de Lucro (%):', data.margemLucro || '']);
    wsData.push(['Método Precificação:', data.metodoPrecificacao || '']);
    wsData.push([]);
    
    // Seção 13.5 - Informações Tributárias e ICMS
    wsData.push(['13.5 INFORMAÇÕES TRIBUTÁRIAS E ICMS']);
    wsData.push(['Distribuição Regional de Vendas:']);
    wsData.push(['  Goiás (%):', data.vendasGoias || '']);
    wsData.push(['  Norte (%):', data.vendasNorte || '']);
    wsData.push(['  Nordeste (%):', data.vendasNordeste || '']);
    wsData.push(['  Centro-Oeste (%):', data.vendasCentroOeste || '']);
    wsData.push(['  Sudeste (%):', data.vendasSudeste || '']);
    wsData.push(['  Sul (%):', data.vendasSul || '']);
    wsData.push(['  Zona Franca Manaus (%):', data.vendasZonaFranca || '']);
    wsData.push(['  Exportação (%):', data.vendasExportacao || '']);
    wsData.push(['Origem dos Insumos:']);
    wsData.push(['  Goiás (%):', data.insumosGoias || '']);
    wsData.push(['  Norte (%):', data.insumosNorte || '']);
    wsData.push(['  Nordeste (%):', data.insumosNordeste || '']);
    wsData.push(['  Centro-Oeste (%):', data.insumosCentroOeste || '']);
    wsData.push(['  Sudeste (%):', data.insumosSudeste || '']);
    wsData.push(['  Sul (%):', data.insumosSul || '']);
    wsData.push(['  Importação (%):', data.insumosImportacao || '']);
    wsData.push(['Vendas Internas Goiás:']);
    wsData.push(['  Redução 10% - Produção Própria (%):', data.vendasGoiasReducao10 || '']);
    wsData.push(['  Redução 11% - Revenda (%):', data.vendasGoiasReducao11 || '']);
    wsData.push(['  Alíquota Cheia 19% (%):', data.vendasGoiasAliquotaCheia || '']);
    wsData.push(['Compras Internas Goiás:']);
    wsData.push(['  Redução 10% - Fabricante (%):', data.comprasGoiasFabricante || '']);
    wsData.push(['  Redução 11% - Distribuidor (%):', data.comprasGoiasDistribuidor || '']);
    wsData.push(['  Alíquota Cheia 19% (%):', data.comprasGoiasAliquotaCheia || '']);
    wsData.push(['Regime Tributário:', data.regimeTributario || '']);
    wsData.push(['Alíquota ICMS Média Efetiva (%):', data.aliquotaICMSMedia || '']);
    wsData.push(['Incentivos Fiscais Aplicados:', data.incentivosFiscaisAplicados || '']);
    wsData.push(['Situações dos Incentivos:', data.situacoesIncentivos || '']);
    wsData.push(['ICMS Débito Mensal:', data.icmsDebitoMensal || '']);
    wsData.push(['ICMS Crédito Mensal:', data.icmsCreditoMensal || '']);
    wsData.push(['ICMS Líquido Mensal:', data.icmsLiquidoMensal || '']);
    wsData.push(['ICMS Projetado Mensal:', data.icmsProjetadoMensal || '']);
    wsData.push(['Impacto Tributário do Projeto:', data.impactoTributarioProjeto || '']);
    wsData.push(['Benefícios CEI Esperados:', data.beneficiosCEIEsperados || '']);
    wsData.push([]);
    
    // Seção 14
    wsData.push(['14. PROJETOS DE INOVAÇÃO']);
    wsData.push(['Possui P&D:', data.temPD || '']);
    wsData.push(['Investimento P&D:', data.investimentoPD || '']);
    wsData.push(['Tecnologia Atual:', data.tecnologiaAtual || '']);
    wsData.push(['Nível Automação (%):', data.automacao || '']);
    wsData.push(['Sistema Gestão:', data.sistemaGestao || '']);
    wsData.push(['Possui Sustentabilidade:', data.temSustentabilidade || '']);
    wsData.push(['Energia Renovável (%):', data.energiaRenovavel || '']);
    wsData.push([]);
    
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    
    // Formatação da planilha
    const range = XLSX.utils.decode_range(ws['!ref']);
    for (let R = range.s.r; R <= range.e.r; ++R) {
        for (let C = range.s.c; C <= range.e.c; ++C) {
            const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
            if (!ws[cellAddress]) continue;
            
            // Estilo para títulos
            if (ws[cellAddress].v && typeof ws[cellAddress].v === 'string' && 
                ws[cellAddress].v.match(/^\d+\./)) {
                ws[cellAddress].s = {
                    font: { bold: true, color: { rgb: "FF002D" } },
                    fill: { fgColor: { rgb: "F0F0F0" } }
                };
            }
        }
    }
    
    XLSX.utils.book_append_sheet(wb, ws, 'Projeto CEI');
    
    // Gerar nome do arquivo
    const empresa = data.razaoSocial || 'Empresa';
    const hoje = new Date().toISOString().split('T')[0];
    const nomeArquivo = `Projeto_CEI_${empresa.replace(/\s+/g, '_')}_${hoje}.xlsx`;
    
    XLSX.writeFile(wb, nomeArquivo);
}

// Exportação para PDF
function exportToPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const data = collectFormData();
    
    let yPosition = 20;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 20;
    const lineHeight = 7;
    
    // Função para adicionar nova página se necessário
    function checkPageBreak(neededSpace = lineHeight) {
        if (yPosition + neededSpace > pageHeight - margin) {
            doc.addPage();
            yPosition = margin;
            addHeader();
        }
    }
    
    // Função para adicionar header
    function addHeader() {
        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.text('COLETA DE INFORMAÇÕES - PROJETO CEI', margin, yPosition);
        yPosition += lineHeight;
        doc.setFontSize(12);
        doc.setFont(undefined, 'normal');
        doc.text('Expertzy - Inteligência Tributária', margin, yPosition);
        yPosition += lineHeight * 2;
    }
    
    // Configuração das colunas
    const pageWidth = doc.internal.pageSize.width;
    const columnPositions = {
        labelX: margin,
        valueX: margin + (pageWidth * 0.4),
        labelWidth: (pageWidth * 0.4) - margin - 5,
        valueWidth: (pageWidth * 0.6) - margin - 5
    };

    // Função para adicionar seção
    function addSection(title, fields) {
        checkPageBreak(lineHeight * 3);
        
        // Título da seção
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text(title, margin, yPosition);
        yPosition += lineHeight;
        
        // Linha separadora abaixo do título
        doc.setDrawColor(200, 200, 200);
        doc.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += lineHeight;
        
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        
        fields.forEach(field => {
            let value = data[field.key] || '';
            
            if (field.format === 'currency') {
                value = cleanAndParseValue(value, 'currency');
            } else if (field.format === 'date' && value) {
                value = new Date(value).toLocaleDateString('pt-BR');
            } else if (field.format === 'file') {
                const files = uploadedFiles[field.key];
                if (files && files.length > 0) {
                    value = Array.from(files).map(f => f.name).join(', ');
                } else {
                    value = 'Nenhum arquivo selecionado';
                }
            } else if (field.key.includes('Percentual') || field.key.includes('percentual') || field.label.includes('%')) {
                value = cleanAndParseValue(value, 'percentage');
            } else if (!value) {
                value = 'Não informado';
            }
            
            // Sempre mostrar campos, mesmo se vazios (com "Não informado")
            if (value !== '') {
                checkPageBreak();
                
                // Coluna 1: Label (negrito)
                doc.setFont(undefined, 'bold');
                const labelLines = doc.splitTextToSize(field.label + ':', columnPositions.labelWidth);
                doc.text(labelLines, columnPositions.labelX, yPosition);
                
                // Coluna 2: Valor (normal)
                doc.setFont(undefined, 'normal');
                const valueLines = doc.splitTextToSize(value.toString(), columnPositions.valueWidth);
                doc.text(valueLines, columnPositions.valueX, yPosition);
                
                // Calcular quantas linhas usar (máximo entre label e value)
                const maxLines = Math.max(labelLines.length, valueLines.length);
                yPosition += lineHeight * maxLines;
                
                // Linha pontilhada sutil entre os campos
                if (field !== fields[fields.length - 1]) {
                    doc.setDrawColor(240, 240, 240);
                    doc.setLineDashPattern([1, 2], 0);
                    doc.line(margin, yPosition + 1, pageWidth - margin, yPosition + 1);
                    doc.setLineDashPattern([], 0); // Reset dash pattern
                    yPosition += 3;
                }
            }
        });
        
        yPosition += lineHeight;
    }
    
    // Adicionar header inicial
    addHeader();
    
    // Adicionar seções
    const sections = [
        {
            title: '1. IDENTIFICAÇÃO DO BENEFICIÁRIO',
            fields: [
                { label: 'Razão Social', key: 'razaoSocial' },
                { label: 'CNPJ', key: 'cnpj' },
                { label: 'Inscrição Estadual', key: 'inscricaoEstadual' },
                { label: 'Endereço Completo', key: 'enderecoCompleto' },
                { label: 'Programas Fiscais', key: 'programasFiscais' }
            ]
        },
        {
            title: '2. DESCRIÇÃO DO EMPREENDIMENTO',
            fields: [
                { label: 'Município', key: 'municipio' },
                { label: 'Loteamento', key: 'loteamento' },
                { label: 'Endereço do Empreendimento', key: 'enderecoEmpreendimento' },
                { label: 'CNAE Principal', key: 'cnae' },
                { label: 'Atividade Econômica', key: 'atividadeEconomica' },
                { label: 'Justificativa Estratégica', key: 'justificativaEstrategica' }
            ]
        },
        {
            title: '3. VALOR TOTAL DO INVESTIMENTO',
            fields: [
                { label: 'Valor Total do Investimento', key: 'valorTotalInvestimento', format: 'currency' },
                { label: 'Recursos Próprios (%)', key: 'percentualRecursosProprios' },
                { label: 'Valor Recursos Próprios', key: 'valorRecursosProprios', format: 'currency' },
                { label: 'Financiamento (%)', key: 'percentualFinanciamento' },
                { label: 'Valor Financiamento', key: 'valorFinanciamento', format: 'currency' },
                { label: 'Taxa de Juros Anual (%)', key: 'taxaJurosAnual' },
                { label: 'Prazo de Carência (meses)', key: 'prazoCarencia' },
                { label: 'Prazo de Amortização (meses)', key: 'prazoAmortizacao' }
            ]
        },
        {
            title: '4. CRONOGRAMA FÍSICO-FINANCEIRO',
            fields: [
                { label: 'Data de Início', key: 'dataInicio', format: 'date' },
                { label: 'Data de Término', key: 'dataTermino', format: 'date' },
                { label: 'Início Obras Civis', key: 'inicioObrasCivis', format: 'date' },
                { label: 'Término Obras Civis', key: 'terminoObrasCivis', format: 'date' },
                { label: 'Início Instalação Máquinas', key: 'inicioInstalacaoMaquinas', format: 'date' },
                { label: 'Término Instalação Máquinas', key: 'terminoInstalacaoMaquinas', format: 'date' },
                { label: 'Outros Investimentos', key: 'outrosInvestimentosCronograma' }
            ]
        },
        {
            title: '5. DETALHAMENTO DOS INVESTIMENTOS',
            fields: [
                { label: 'Especificação Obras', key: 'especificacaoObras' },
                { label: 'Especificação Máquinas', key: 'especificacaoMaquinas' },
                { label: 'Especificação Instalações', key: 'especificacaoInstalacoes' },
                { label: 'Fornecedores', key: 'fornecedores' }
            ]
        },
        {
            title: '6. DOCUMENTAÇÃO COMPLEMENTAR',
            fields: [
                { label: 'Projeto Arquitetônico', key: 'projetoArquitetonico', format: 'file' },
                { label: 'Licença Ambiental', key: 'licencaAmbiental', format: 'file' },
                { label: 'Certidões Negativas', key: 'certidoesNegativas', format: 'file' },
                { label: 'Balanços Patrimoniais', key: 'balancosPatrimoniais', format: 'file' },
                { label: 'Orçamentos/Propostas', key: 'orcamentosPropostas', format: 'file' }
            ]
        },
        {
            title: '7. PLANO DE ACOMPANHAMENTO',
            fields: [
                { label: 'Metodologia de Controle', key: 'metodologiaControle' },
                { label: 'Procedimentos Relatórios', key: 'procedimentosRelatorios' },
                { label: 'Responsável Acompanhamento', key: 'responsavelAcompanhamento' },
                { label: 'Cargo/Função', key: 'cargoResponsavel' },
                { label: 'E-mail Responsável', key: 'emailResponsavel' },
                { label: 'Telefone Responsável', key: 'telefoneResponsavel' }
            ]
        },
        {
            title: '8. CARACTERIZAÇÃO DA EMPRESA',
            fields: [
                { label: 'Histórico da Empresa', key: 'historicoEmpresa' },
                { label: 'Forma Jurídica', key: 'formaJuridica' },
                { label: 'Porte da Empresa', key: 'porteEmpresa' },
                { label: 'Regime Tributário', key: 'regimeTributario' },
                { label: 'Operações Atuais', key: 'operacoesAtuais' }
            ]
        },
        {
            title: '9. PRODUÇÃO E OPERAÇÕES',
            fields: [
                { label: 'Capacidade Atual', key: 'capacidadeAtual' },
                { label: 'Capacidade Futura', key: 'capacidadeFutura' },
                { label: '% Utilização', key: 'percentualUtilizacao' },
                { label: 'Descrição Processo', key: 'descricaoProcesso' },
                { label: 'Tipo de Processo', key: 'tipoProcesso' },
                { label: 'Turnos', key: 'turnos' },
                { label: 'Horas/Dia', key: 'horasTrabalho' }
            ]
        },
        {
            title: '10. ANÁLISE DE MERCADO',
            fields: [
                { label: 'Perfil Clientes', key: 'perfilClientes' },
                { label: 'Número de Clientes', key: 'numeroClientes' },
                { label: 'Ticket Médio', key: 'ticketMedio', format: 'currency' },
                { label: 'Ambiente Competitivo', key: 'ambienteCompetitivo' },
                { label: 'Mercado Local (%)', key: 'abrangenciaLocal' },
                { label: 'Mercado Estadual (%)', key: 'abrangenciaEstadual' },
                { label: 'Mercado Nacional (%)', key: 'abrangenciaNacional' },
                { label: 'Mercado Internacional (%)', key: 'abrangenciaInternacional' },
                { label: 'Crescimento Esperado (%)', key: 'crescimentoEsperado' }
            ]
        },
        {
            title: '11. RECURSOS HUMANOS',
            fields: [
                { label: 'Funcionários Atuais', key: 'funcionariosAtuais' },
                { label: 'Estrutura Organizacional', key: 'estruturaOrganizacional' },
                { label: 'Benefícios Oferecidos', key: 'beneficiosOferecidos' },
                { label: 'Programas Treinamento', key: 'programasTreinamento' },
                { label: 'Novas Contratações', key: 'novasContratacoes' },
                { label: 'Investimento RH', key: 'investimentoRH', format: 'currency' }
            ]
        },
        {
            title: '12. INFORMAÇÕES FINANCEIRAS',
            fields: [
                { label: 'Ano Base', key: 'anoBase' },
                { label: 'Regime Contábil', key: 'regimeContabil' },
                { label: 'Capital Social', key: 'capitalSocial', format: 'currency' },
                { label: 'Capital Integralizado', key: 'capitalIntegralizado', format: 'currency' },
                { label: 'Endividamento Total', key: 'endividamentoTotal', format: 'currency' },
                { label: 'Saldo Caixa', key: 'saldoCaixa', format: 'currency' },
                { label: 'Receita Média Mensal', key: 'receitaMediaMensal', format: 'currency' },
                { label: 'Despesa Média Mensal', key: 'despesaMediaMensal', format: 'currency' }
            ]
        },
        {
            title: '13. RECEITAS E CUSTOS',
            fields: [
                { label: 'Receita Bruta Anual', key: 'receitaBrutaAnual', format: 'currency' },
                { label: 'Receita Líquida Anual', key: 'receitaLiquidaAnual', format: 'currency' },
                { label: 'Custos Fixos Mensais', key: 'custosFixosMensais', format: 'currency' },
                { label: 'Custos Variáveis Mensais', key: 'custosVariaveisMensais', format: 'currency' },
                { label: 'Margem de Lucro (%)', key: 'margemLucro' },
                { label: 'Método Precificação', key: 'metodoPrecificacao' }
            ]
        },
        {
            title: '13.5 INFORMAÇÕES TRIBUTÁRIAS E ICMS',
            fields: [
                { label: 'Vendas Goiás (%)', key: 'vendasGoias' },
                { label: 'Vendas Norte (%)', key: 'vendasNorte' },
                { label: 'Vendas Nordeste (%)', key: 'vendasNordeste' },
                { label: 'Vendas Centro-Oeste (%)', key: 'vendasCentroOeste' },
                { label: 'Vendas Sudeste (%)', key: 'vendasSudeste' },
                { label: 'Vendas Sul (%)', key: 'vendasSul' },
                { label: 'Vendas ZFM (%)', key: 'vendasZonaFranca' },
                { label: 'Exportação (%)', key: 'vendasExportacao' },
                { label: 'Insumos Goiás (%)', key: 'insumosGoias' },
                { label: 'Vendas GO Red. 10% (%)', key: 'vendasGoiasReducao10' },
                { label: 'Vendas GO Red. 11% (%)', key: 'vendasGoiasReducao11' },
                { label: 'Vendas GO Alíquota Cheia (%)', key: 'vendasGoiasAliquotaCheia' },
                { label: 'Compras GO Fabricante (%)', key: 'comprasGoiasFabricante' },
                { label: 'Compras GO Distribuidor (%)', key: 'comprasGoiasDistribuidor' },
                { label: 'Compras GO Alíquota Cheia (%)', key: 'comprasGoiasAliquotaCheia' },
                { label: 'Regime Tributário', key: 'regimeTributario' },
                { label: 'Alíquota ICMS Média (%)', key: 'aliquotaICMSMedia' },
                { label: 'Incentivos Fiscais', key: 'incentivosFiscaisAplicados' },
                { label: 'ICMS Débito Mensal', key: 'icmsDebitoMensal' },
                { label: 'ICMS Crédito Mensal', key: 'icmsCreditoMensal' },
                { label: 'ICMS Líquido Mensal', key: 'icmsLiquidoMensal' },
                { label: 'ICMS Projetado Mensal', key: 'icmsProjetadoMensal' },
                { label: 'Benefícios CEI Esperados', key: 'beneficiosCEIEsperados' }
            ]
        },
        {
            title: '14. PROJETOS DE INOVAÇÃO',
            fields: [
                { label: 'Possui P&D', key: 'temPD' },
                { label: 'Investimento P&D', key: 'investimentoPD', format: 'currency' },
                { label: 'Tecnologia Atual', key: 'tecnologiaAtual' },
                { label: 'Nível Automação (%)', key: 'automacao' },
                { label: 'Sistema Gestão', key: 'sistemaGestao' },
                { label: 'Possui Sustentabilidade', key: 'temSustentabilidade' },
                { label: 'Energia Renovável (%)', key: 'energiaRenovavel' }
            ]
        }
    ];

    sections.forEach(section => {
        addSection(section.title, section.fields);
    });
    
    // Adicionar rodapé na última página
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setFont(undefined, 'normal');
        doc.text(`Página ${i} de ${totalPages}`, doc.internal.pageSize.width - 30, doc.internal.pageSize.height - 10);
        doc.text('© 2024 Expertzy - Inteligência Tributária', margin, doc.internal.pageSize.height - 10);
    }
    
    // Gerar nome do arquivo
    const empresa = data.razaoSocial || 'Empresa';
    const hoje = new Date().toISOString().split('T')[0];
    const nomeArquivo = `Projeto_CEI_${empresa.replace(/\s+/g, '_')}_${hoje}.pdf`;
    
    doc.save(nomeArquivo);
}

// Funções para Seção 13 - Receitas e Custos

// Adicionar período de faturamento
function addFaturamentoItem() {
    const container = document.getElementById('faturamentoList');
    const itemDiv = document.createElement('div');
    itemDiv.className = 'detail-item';
    
    itemDiv.innerHTML = `
        <div class="detail-item-content">
            <div class="form-grid">
                <div class="form-group">
                    <label>Período (Mês/Ano)</label>
                    <input type="month" name="faturamento_periodo[]" required>
                </div>
                <div class="form-group">
                    <label>Faturamento (R$)</label>
                    <input type="text" name="faturamento_valor[]" class="money-input" required>
                </div>
                <div class="form-group">
                    <label>Observações</label>
                    <input type="text" name="faturamento_observacoes[]" placeholder="Ex: Mês atípico, evento especial">
                </div>
            </div>
        </div>
        <button type="button" class="btn-remove-item" onclick="removeDetailItem(this)">×</button>
    `;
    
    container.appendChild(itemDiv);
    applyUniversalFormatting(itemDiv);
}

// Adicionar categoria de custo
function addCustoItem() {
    const container = document.getElementById('custosList');
    const itemDiv = document.createElement('div');
    itemDiv.className = 'detail-item';
    
    itemDiv.innerHTML = `
        <div class="detail-item-content">
            <div class="form-grid">
                <div class="form-group">
                    <label>Categoria de Custo *</label>
                    <select name="custo_categoria[]" required>
                        <option value="">Selecione</option>
                        <option value="materia-prima">Matéria-Prima</option>
                        <option value="mao-obra">Mão de Obra</option>
                        <option value="energia">Energia Elétrica</option>
                        <option value="combustivel">Combustível</option>
                        <option value="manutencao">Manutenção</option>
                        <option value="impostos">Impostos e Taxas</option>
                        <option value="marketing">Marketing</option>
                        <option value="administrativo">Administrativo</option>
                        <option value="financeiro">Financeiro</option>
                        <option value="outros">Outros</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Valor Mensal (R$) *</label>
                    <input type="text" name="custo_valor[]" class="money-input" required>
                </div>
                <div class="form-group">
                    <label>Participação no Custo Total (%)</label>
                    <input type="number" name="custo_participacao[]" min="0" max="100" step="0.1">
                </div>
                <div class="form-group">
                    <label>Tipo de Custo</label>
                    <select name="custo_tipo[]">
                        <option value="">Selecione</option>
                        <option value="fixo">Fixo</option>
                        <option value="variavel">Variável</option>
                        <option value="semi-variavel">Semi-Variável</option>
                    </select>
                </div>
                <div class="form-group full-width">
                    <label>Observações</label>
                    <textarea name="custo_observacoes[]" rows="2" placeholder="Detalhes sobre este custo, fornecedores, sazonalidade, etc."></textarea>
                </div>
            </div>
        </div>
        <button type="button" class="btn-remove-item" onclick="removeDetailItem(this)">×</button>
    `;
    
    container.appendChild(itemDiv);
    applyUniversalFormatting(itemDiv);
}

// Adicionar fornecedor
function addFornecedorItem() {
    const container = document.getElementById('fornecedoresList');
    const itemDiv = document.createElement('div');
    itemDiv.className = 'detail-item';
    
    itemDiv.innerHTML = `
        <div class="detail-item-content">
            <div class="form-grid">
                <div class="form-group">
                    <label>Nome do Fornecedor *</label>
                    <input type="text" name="fornecedor_nome[]" required>
                </div>
                <div class="form-group">
                    <label>CNPJ</label>
                    <input type="text" name="fornecedor_cnpj[]" placeholder="00.000.000/0000-00">
                </div>
                <div class="form-group">
                    <label>Produto/Serviço Fornecido *</label>
                    <input type="text" name="fornecedor_produto[]" required>
                </div>
                <div class="form-group">
                    <label>Participação nas Compras (%)</label>
                    <input type="number" name="fornecedor_participacao[]" min="0" max="100" step="0.1">
                </div>
                <div class="form-group">
                    <label>Valor Médio Mensal (R$)</label>
                    <input type="text" name="fornecedor_valor[]" class="money-input">
                </div>
                <div class="form-group">
                    <label>Prazo de Pagamento (dias)</label>
                    <input type="number" name="fornecedor_prazo[]" min="0" step="1">
                </div>
                <div class="form-group">
                    <label>Tempo de Relacionamento</label>
                    <select name="fornecedor_tempo[]">
                        <option value="">Selecione</option>
                        <option value="menos-1-ano">Menos de 1 ano</option>
                        <option value="1-3-anos">1 a 3 anos</option>
                        <option value="3-5-anos">3 a 5 anos</option>
                        <option value="mais-5-anos">Mais de 5 anos</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Localização</label>
                    <input type="text" name="fornecedor_localizacao[]" placeholder="Cidade/Estado">
                </div>
                <div class="form-group full-width">
                    <label>Observações</label>
                    <textarea name="fornecedor_observacoes[]" rows="2" placeholder="Informações sobre qualidade, pontualidade, condições especiais, etc."></textarea>
                </div>
            </div>
        </div>
        <button type="button" class="btn-remove-item" onclick="removeDetailItem(this)">×</button>
    `;
    
    container.appendChild(itemDiv);
    applyUniversalFormatting(itemDiv);
}

// Funções para Seção 14 - Projetos de Inovação

// Adicionar projeto P&D
function addProjetoPDItem() {
    const container = document.getElementById('projetosPDList');
    const itemDiv = document.createElement('div');
    itemDiv.className = 'detail-item';
    
    itemDiv.innerHTML = `
        <div class="detail-item-content">
            <div class="form-grid">
                <div class="form-group">
                    <label>Nome do Projeto *</label>
                    <input type="text" name="projeto_nome[]" required>
                </div>
                <div class="form-group">
                    <label>Status</label>
                    <select name="projeto_status[]">
                        <option value="">Selecione</option>
                        <option value="planejado">Planejado</option>
                        <option value="em-andamento">Em Andamento</option>
                        <option value="concluido">Concluído</option>
                        <option value="pausado">Pausado</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Investimento Previsto (R$)</label>
                    <input type="text" name="projeto_investimento[]" class="money-input">
                </div>
                <div class="form-group">
                    <label>Duração Prevista (meses)</label>
                    <input type="number" name="projeto_duracao[]" min="1" step="1">
                </div>
                <div class="form-group">
                    <label>Área de Aplicação</label>
                    <select name="projeto_area[]">
                        <option value="">Selecione</option>
                        <option value="produto">Desenvolvimento de Produto</option>
                        <option value="processo">Melhoria de Processo</option>
                        <option value="tecnologia">Tecnologia</option>
                        <option value="sustentabilidade">Sustentabilidade</option>
                        <option value="qualidade">Qualidade</option>
                        <option value="eficiencia">Eficiência Energética</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Nível de Inovação</label>
                    <select name="projeto_nivel[]">
                        <option value="">Selecione</option>
                        <option value="incremental">Incremental</option>
                        <option value="substancial">Substancial</option>
                        <option value="radical">Radical</option>
                    </select>
                </div>
                <div class="form-group full-width">
                    <label>Descrição e Objetivos</label>
                    <textarea name="projeto_descricao[]" rows="3" placeholder="Descreva o projeto e seus principais objetivos"></textarea>
                </div>
                <div class="form-group full-width">
                    <label>Resultados Esperados</label>
                    <textarea name="projeto_resultados[]" rows="2" placeholder="Quais resultados são esperados com este projeto?"></textarea>
                </div>
            </div>
        </div>
        <button type="button" class="btn-remove-item" onclick="removeDetailItem(this)">×</button>
    `;
    
    container.appendChild(itemDiv);
    applyUniversalFormatting(itemDiv);
}

// Adicionar upgrade tecnológico
function addUpgradeItem() {
    const container = document.getElementById('upgradesList');
    const itemDiv = document.createElement('div');
    itemDiv.className = 'detail-item';
    
    itemDiv.innerHTML = `
        <div class="detail-item-content">
            <div class="form-grid">
                <div class="form-group">
                    <label>Tipo de Upgrade *</label>
                    <select name="upgrade_tipo[]" required>
                        <option value="">Selecione</option>
                        <option value="software">Software</option>
                        <option value="hardware">Hardware</option>
                        <option value="equipamento">Equipamento</option>
                        <option value="sistema">Sistema de Gestão</option>
                        <option value="automacao">Automação</option>
                        <option value="iot">Internet das Coisas (IoT)</option>
                        <option value="ia">Inteligência Artificial</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Prioridade</label>
                    <select name="upgrade_prioridade[]">
                        <option value="">Selecione</option>
                        <option value="alta">Alta</option>
                        <option value="media">Média</option>
                        <option value="baixa">Baixa</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Investimento Estimado (R$)</label>
                    <input type="text" name="upgrade_investimento[]" class="money-input">
                </div>
                <div class="form-group">
                    <label>Prazo de Implementação</label>
                    <select name="upgrade_prazo[]">
                        <option value="">Selecione</option>
                        <option value="imediato">Imediato</option>
                        <option value="6-meses">6 meses</option>
                        <option value="1-ano">1 ano</option>
                        <option value="2-anos">2 anos</option>
                        <option value="mais-2-anos">Mais de 2 anos</option>
                    </select>
                </div>
                <div class="form-group full-width">
                    <label>Descrição do Upgrade</label>
                    <input type="text" name="upgrade_descricao[]" placeholder="Descreva brevemente o upgrade tecnológico">
                </div>
                <div class="form-group full-width">
                    <label>Benefícios Esperados</label>
                    <textarea name="upgrade_beneficios[]" rows="2" placeholder="Quais benefícios este upgrade trará?"></textarea>
                </div>
            </div>
        </div>
        <button type="button" class="btn-remove-item" onclick="removeDetailItem(this)">×</button>
    `;
    
    container.appendChild(itemDiv);
    applyUniversalFormatting(itemDiv);
}

// Adicionar melhoria de processo
function addMelhoriaItem() {
    const container = document.getElementById('melhoriasList');
    const itemDiv = document.createElement('div');
    itemDiv.className = 'detail-item';
    
    itemDiv.innerHTML = `
        <div class="detail-item-content">
            <div class="form-grid">
                <div class="form-group">
                    <label>Área/Processo *</label>
                    <input type="text" name="melhoria_area[]" required placeholder="Ex: Produção, Logística, Administrativo">
                </div>
                <div class="form-group">
                    <label>Tipo de Melhoria</label>
                    <select name="melhoria_tipo[]">
                        <option value="">Selecione</option>
                        <option value="reducao-tempo">Redução de Tempo</option>
                        <option value="reducao-custo">Redução de Custo</option>
                        <option value="melhoria-qualidade">Melhoria de Qualidade</option>
                        <option value="aumento-produtividade">Aumento de Produtividade</option>
                        <option value="eliminacao-desperdicio">Eliminação de Desperdício</option>
                        <option value="padronizacao">Padronização</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Investimento Necessário (R$)</label>
                    <input type="text" name="melhoria_investimento[]" class="money-input">
                </div>
                <div class="form-group">
                    <label>Economia Anual Estimada (R$)</label>
                    <input type="text" name="melhoria_economia[]" class="money-input">
                </div>
                <div class="form-group">
                    <label>Prazo de Implementação</label>
                    <select name="melhoria_prazo[]">
                        <option value="">Selecione</option>
                        <option value="imediato">Imediato</option>
                        <option value="1-mes">1 mês</option>
                        <option value="3-meses">3 meses</option>
                        <option value="6-meses">6 meses</option>
                        <option value="1-ano">1 ano</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Facilidade de Implementação</label>
                    <select name="melhoria_facilidade[]">
                        <option value="">Selecione</option>
                        <option value="facil">Fácil</option>
                        <option value="media">Média</option>
                        <option value="dificil">Difícil</option>
                    </select>
                </div>
                <div class="form-group full-width">
                    <label>Descrição da Melhoria</label>
                    <textarea name="melhoria_descricao[]" rows="2" placeholder="Descreva a melhoria proposta"></textarea>
                </div>
                <div class="form-group full-width">
                    <label>Indicadores de Sucesso</label>
                    <textarea name="melhoria_indicadores[]" rows="2" placeholder="Como será medido o sucesso desta melhoria?"></textarea>
                </div>
            </div>
        </div>
        <button type="button" class="btn-remove-item" onclick="removeDetailItem(this)">×</button>
    `;
    
    container.appendChild(itemDiv);
    applyUniversalFormatting(itemDiv);
}

// Adicionar iniciativa de sustentabilidade
function addSustentabilidadeItem() {
    const container = document.getElementById('sustentabilidadeList');
    const itemDiv = document.createElement('div');
    itemDiv.className = 'detail-item';
    
    itemDiv.innerHTML = `
        <div class="detail-item-content">
            <div class="form-grid">
                <div class="form-group">
                    <label>Tipo de Iniciativa *</label>
                    <select name="sustentabilidade_tipo[]" required>
                        <option value="">Selecione</option>
                        <option value="energia">Eficiência Energética</option>
                        <option value="agua">Uso Racional da Água</option>
                        <option value="residuos">Gestão de Resíduos</option>
                        <option value="emissoes">Redução de Emissões</option>
                        <option value="renovavel">Energia Renovável</option>
                        <option value="reciclagem">Reciclagem</option>
                        <option value="social">Responsabilidade Social</option>
                        <option value="certificacao">Certificação Ambiental</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Status</label>
                    <select name="sustentabilidade_status[]">
                        <option value="">Selecione</option>
                        <option value="planejado">Planejado</option>
                        <option value="em-andamento">Em Andamento</option>
                        <option value="implementado">Implementado</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Investimento (R$)</label>
                    <input type="text" name="sustentabilidade_investimento[]" class="money-input">
                </div>
                <div class="form-group">
                    <label>Economia Anual (R$)</label>
                    <input type="text" name="sustentabilidade_economia[]" class="money-input">
                </div>
                <div class="form-group">
                    <label>Redução de Impacto (%)</label>
                    <input type="number" name="sustentabilidade_reducao[]" min="0" max="100" step="0.1">
                </div>
                <div class="form-group">
                    <label>Prazo de Retorno (anos)</label>
                    <input type="number" name="sustentabilidade_retorno[]" min="0" step="0.1">
                </div>
                <div class="form-group full-width">
                    <label>Descrição da Iniciativa</label>
                    <textarea name="sustentabilidade_descricao[]" rows="2" placeholder="Descreva a iniciativa de sustentabilidade"></textarea>
                </div>
                <div class="form-group full-width">
                    <label>Impacto Ambiental Esperado</label>
                    <textarea name="sustentabilidade_impacto[]" rows="2" placeholder="Qual o impacto ambiental positivo esperado?"></textarea>
                </div>
            </div>
        </div>
        <button type="button" class="btn-remove-item" onclick="removeDetailItem(this)">×</button>
    `;
    
    container.appendChild(itemDiv);
    applyUniversalFormatting(itemDiv);
}

// Exportação para JSON
function exportToJSON() {
    const data = collectFormData();
    const jsonData = {
        metadata: {
            sistemaVersao: "14 Seções",
            dataExportacao: new Date().toISOString(),
            empresa: data.razaoSocial || "Empresa",
            geradoPor: "Expertzy - Sistema CEI"
        },
        dados: data,
        dinamicos: collectDynamicData()
    };
    
    const jsonString = JSON.stringify(jsonData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const empresa = data.razaoSocial || 'Empresa';
    const hoje = new Date().toISOString().split('T')[0];
    const nomeArquivo = `Projeto_CEI_${empresa.replace(/\s+/g, '_')}_${hoje}.json`;
    
    const link = document.createElement('a');
    link.href = url;
    link.download = nomeArquivo;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// Exportação para CSV
function exportToCSV() {
    const data = collectFormData();
    const csvData = [];
    
    // Cabeçalho
    csvData.push(['COLETA DE INFORMAÇÕES - PROJETO CEI']);
    csvData.push(['Expertzy - Inteligência Tributária']);
    csvData.push(['Sistema Completo - 14 Seções']);
    csvData.push(['Data Exportação:', new Date().toLocaleDateString('pt-BR')]);
    csvData.push([]);
    
    // Adicionar todas as seções
    const sections = [
        { title: 'IDENTIFICAÇÃO DO BENEFICIÁRIO', fields: ['razaoSocial', 'cnpj', 'inscricaoEstadual', 'enderecoCompleto', 'programasFiscais'] },
        { title: 'DESCRIÇÃO DO EMPREENDIMENTO', fields: ['municipio', 'loteamento', 'enderecoEmpreendimento', 'cnae', 'atividadeEconomica', 'justificativaEstrategica'] },
        { title: 'VALOR TOTAL DO INVESTIMENTO', fields: ['valorObrasCivis', 'valorMaquinas', 'valorInstalacoes', 'outrosInvestimentos'] },
        { title: 'CRONOGRAMA FÍSICO-FINANCEIRO', fields: ['dataInicio', 'dataTermino', 'inicioObrasCivis', 'terminoObrasCivis'] },
        { title: 'DETALHAMENTO DOS INVESTIMENTOS', fields: ['especificacaoObras', 'especificacaoMaquinas', 'especificacaoInstalacoes', 'fornecedores'] },
        { title: 'PLANO DE ACOMPANHAMENTO', fields: ['metodologiaControle', 'procedimentosRelatorios', 'responsavelAcompanhamento', 'cargoResponsavel', 'emailResponsavel', 'telefoneResponsavel'] },
        { title: 'CARACTERIZAÇÃO DA EMPRESA', fields: ['historicoEmpresa', 'formaJuridica', 'porteEmpresa', 'regimeTributario', 'operacoesAtuais'] },
        { title: 'PRODUÇÃO E OPERAÇÕES', fields: ['capacidadeAtual', 'capacidadeFutura', 'percentualUtilizacao', 'descricaoProcesso', 'tipoProcesso'] },
        { title: 'ANÁLISE DE MERCADO', fields: ['perfilClientes', 'numeroClientes', 'ticketMedio', 'ambienteCompetitivo', 'abrangenciaLocal', 'abrangenciaEstadual'] },
        { title: 'RECURSOS HUMANOS', fields: ['funcionariosAtuais', 'estruturaOrganizacional', 'beneficiosOferecidos', 'novasContratacoes'] },
        { title: 'INFORMAÇÕES FINANCEIRAS', fields: ['anoBase', 'regimeContabil', 'capitalSocial', 'saldoCaixa', 'receitaMediaMensal', 'despesaMediaMensal'] },
        { title: 'RECEITAS E CUSTOS', fields: ['receitaBrutaAnual', 'receitaLiquidaAnual', 'custosFixosMensais', 'custosVariaveisMensais', 'margemLucro'] },
        { title: 'INFORMAÇÕES TRIBUTÁRIAS ICMS', fields: ['vendasGoias', 'vendasGoiasReducao10', 'vendasGoiasReducao11', 'comprasGoiasFabricante', 'comprasGoiasDistribuidor', 'regimeTributario', 'aliquotaICMSMedia', 'icmsLiquidoMensal', 'icmsProjetadoMensal', 'incentivosFiscaisAplicados'] },
        { title: 'PROJETOS DE INOVAÇÃO', fields: ['temPD', 'investimentoPD', 'tecnologiaAtual', 'automacao', 'temSustentabilidade'] }
    ];
    
    sections.forEach(section => {
        csvData.push([section.title]);
        section.fields.forEach(field => {
            const label = field.charAt(0).toUpperCase() + field.slice(1);
            csvData.push([label, data[field] || '']);
        });
        csvData.push([]);
    });
    
    // Converter para CSV
    const csvContent = csvData.map(row => 
        row.map(cell => `"${String(cell || '').replace(/"/g, '""')}"`).join(',')
    ).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const empresa = data.razaoSocial || 'Empresa';
    const hoje = new Date().toISOString().split('T')[0];
    const nomeArquivo = `Projeto_CEI_${empresa.replace(/\s+/g, '_')}_${hoje}.csv`;
    
    const link = document.createElement('a');
    link.href = url;
    link.download = nomeArquivo;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// Auto-save silencioso (sem notificação)
function autoSaveData() {
    const data = collectFormData();
    const dynamicData = collectDynamicData();
    
    const saveData = {
        timestamp: new Date().toISOString(),
        dados: data,
        dinamicos: dynamicData,
        versao: "14_secoes",
        currentStep: currentStep
    };
    
    try {
        localStorage.setItem('cei_projeto_draft', JSON.stringify(saveData));
        
        // Mostrar indicador discreto de salvamento
        showAutoSaveIndicator();
        
    } catch (error) {
        console.error('Erro no auto-save:', error);
    }
}

// Mostrar indicador de auto-save
function showAutoSaveIndicator() {
    const indicator = document.getElementById('auto-save-indicator') || createAutoSaveIndicator();
    indicator.textContent = '💾 Salvando...';
    indicator.style.opacity = '1';
    
    setTimeout(() => {
        indicator.textContent = '✅ Salvo';
        setTimeout(() => {
            indicator.style.opacity = '0.5';
        }, 1000);
    }, 500);
}

// Criar indicador de auto-save
function createAutoSaveIndicator() {
    const indicator = document.createElement('div');
    indicator.id = 'auto-save-indicator';
    indicator.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 8px 12px;
        border-radius: 4px;
        font-size: 12px;
        z-index: 9999;
        opacity: 0.5;
        transition: opacity 0.3s;
    `;
    document.body.appendChild(indicator);
    return indicator;
}

// Salvar no localStorage (com notificação)
function saveToLocalStorage() {
    const data = collectFormData();
    const dynamicData = collectDynamicData();
    
    const saveData = {
        timestamp: new Date().toISOString(),
        dados: data,
        dinamicos: dynamicData,
        versao: "14_secoes",
        currentStep: currentStep
    };
    
    try {
        localStorage.setItem('cei_projeto_draft', JSON.stringify(saveData));
        
        // Mostrar mensagem de sucesso
        const message = document.createElement('div');
        message.textContent = '✅ Dados salvos com sucesso!';
        message.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #d4edda;
            color: #155724;
            padding: 12px 20px;
            border-radius: 4px;
            border: 1px solid #c3e6cb;
            z-index: 10000;
            font-weight: bold;
        `;
        
        document.body.appendChild(message);
        setTimeout(() => {
            document.body.removeChild(message);
        }, 3000);
        
    } catch (error) {
        console.error('Erro ao salvar:', error);
        alert('Erro ao salvar os dados. Verifique se há espaço suficiente no navegador.');
    }
}

// ========================================
// SISTEMA DE SALVAMENTO POR ETAPAS
// ========================================

// Salvar etapa atual como JSON para download
function saveCurrentStepToJSON() {
    try {
        const data = collectFormData();
        const dynamicData = collectDynamicData();
        const progressMetadata = collectProgressMetadata();
        
        const stepData = {
            metadata: {
                sistemaVersao: "14 Seções - Salvamento por Etapas",
                tipoSalvamento: "etapa_parcial",
                etapaAtual: currentStep,
                nomeEtapa: getSectionName(currentStep),
                dataExportacao: new Date().toISOString(),
                empresa: data.razaoSocial || data.cnpj || "Empresa",
                geradoPor: "Expertzy - Sistema CEI",
                progresso: progressMetadata
            },
            dados: data,
            dinamicos: dynamicData
        };
        
        const filename = generateStepFileName(data);
        downloadJSON(stepData, filename);
        
        // Mostrar confirmação
        showStepSaveConfirmation(currentStep, filename);
        
    } catch (error) {
        console.error('Erro ao salvar etapa:', error);
        alert('Erro ao salvar a etapa atual. Tente novamente.');
    }
}

// Gerar nome do arquivo baseado na etapa
function generateStepFileName(data) {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-'); // HH-MM-SS
    
    // Usar razão social ou CNPJ como identificador
    let empresaId = 'Empresa';
    if (data.razaoSocial && data.razaoSocial.trim()) {
        empresaId = data.razaoSocial.trim()
            .replace(/[^\w\s-]/g, '') // Remove caracteres especiais
            .replace(/\s+/g, '_') // Substitui espaços por underscore
            .substring(0, 20); // Limita tamanho
    } else if (data.cnpj && data.cnpj.trim()) {
        empresaId = data.cnpj.replace(/[^\d]/g, ''); // Apenas números do CNPJ
    }
    
    const stepName = getSectionName(currentStep).replace(/\s+/g, '_');
    
    return `CEI_${empresaId}_Etapa${currentStep.toString().padStart(2, '0')}_${stepName}_${dateStr}_${timeStr}.json`;
}

// Obter nome da seção atual
function getSectionName(step) {
    const sectionNames = {
        1: 'Identificacao_Beneficiario',
        2: 'Descricao_Empreendimento', 
        3: 'Valor_Total_Investimento',
        4: 'Cronograma_Fisico_Financeiro',
        5: 'Detalhamento_Investimentos',
        6: 'Documentacao_Complementar',
        7: 'Plano_Acompanhamento',
        8: 'Especificacoes_Tecnicas',
        9: 'Analise_Mercado',
        10: 'Recursos_Humanos',
        11: 'Informacoes_Financeiras',
        12: 'Receitas_Custos',
        13: 'Projetos_Inovacao',
        14: 'Formulario_Completo'
    };
    
    return sectionNames[step] || `Secao_${step}`;
}

// Coletar metadata de progresso
function collectProgressMetadata() {
    const completedSections = [];
    const sectionTimestamps = {};
    
    // Verificar quais seções têm dados preenchidos
    for (let i = 1; i <= totalSteps; i++) {
        if (hasSectionData(i)) {
            completedSections.push(i);
            sectionTimestamps[`secao_${i}`] = new Date().toISOString();
        }
    }
    
    return {
        etapaAtual: currentStep,
        etapasTotais: totalSteps,
        secoesPreenchidas: completedSections,
        percentualProgresso: Math.round((completedSections.length / totalSteps) * 100),
        timestampSecoes: sectionTimestamps,
        ultimoSalvamento: new Date().toISOString()
    };
}

// Verificar se uma seção tem dados preenchidos
function hasSectionData(sectionNumber) {
    const sectionElement = document.querySelector(`[data-section="${sectionNumber}"]`);
    if (!sectionElement) return false;
    
    // Verificar inputs preenchidos
    const inputs = sectionElement.querySelectorAll('input, textarea, select');
    for (let input of inputs) {
        if (input.type === 'file') continue; // Ignorar file inputs
        if (input.value && input.value.trim() !== '') {
            return true;
        }
    }
    
    // Verificar listas dinâmicas
    const lists = sectionElement.querySelectorAll('.detail-list');
    for (let list of lists) {
        if (list.children.length > 0) {
            return true;
        }
    }
    
    return false;
}

// Função para download de JSON
function downloadJSON(data, filename) {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// Mostrar confirmação de salvamento de etapa
function showStepSaveConfirmation(step, filename) {
    const message = document.createElement('div');
    message.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: linear-gradient(135deg, var(--success) 0%, #34ce57 100%);
        color: white;
        padding: 20px 30px;
        border-radius: 12px;
        font-size: 16px;
        font-weight: 600;
        z-index: 10000;
        box-shadow: 0 8px 32px rgba(40, 167, 69, 0.3);
        text-align: center;
        min-width: 300px;
    `;
    
    message.innerHTML = `
        <div style="margin-bottom: 10px;">✅ Etapa ${step} salva com sucesso!</div>
        <div style="font-size: 14px; opacity: 0.9; font-weight: 400;">
            Arquivo: ${filename}
        </div>
    `;
    
    document.body.appendChild(message);
    
    setTimeout(() => {
        message.style.opacity = '0';
        message.style.transform = 'translate(-50%, -50%) scale(0.9)';
        message.style.transition = 'all 0.3s ease';
        
        setTimeout(() => {
            document.body.removeChild(message);
        }, 300);
    }, 3000);
}

// Coletar dados dinâmicos das listas
function collectDynamicData() {
    const dynamicData = {};
    
    // Coletar produtos
    const produtos = [];
    document.querySelectorAll('#produtosList .investment-item').forEach(item => {
        produtos.push({
            nome: item.querySelector('.produto-nome')?.value || '',
            descricao: item.querySelector('.produto-descricao')?.value || '',
            unidade: item.querySelector('.produto-unidade')?.value || '',
            preco: item.querySelector('.produto-preco')?.value || '',
            atual: item.querySelector('.produto-atual')?.value || '',
            futura: item.querySelector('.produto-futura')?.value || ''
        });
    });
    if (produtos.length > 0) dynamicData.produtos = produtos;
    
    // Coletar insumos
    const insumos = [];
    document.querySelectorAll('#insumosList .investment-item').forEach(item => {
        insumos.push({
            nome: item.querySelector('.insumo-nome')?.value || '',
            tipo: item.querySelector('.insumo-tipo')?.value || '',
            unidade: item.querySelector('.insumo-unidade')?.value || '',
            custo: item.querySelector('.insumo-custo')?.value || '',
            atual: item.querySelector('.insumo-atual')?.value || '',
            futura: item.querySelector('.insumo-futura')?.value || ''
        });
    });
    if (insumos.length > 0) dynamicData.insumos = insumos;
    
    // Coletar funcionários (seção 11)
    const funcionarios = [];
    document.querySelectorAll('#funcionariosList .investment-item').forEach(item => {
        funcionarios.push({
            cargo: item.querySelector('input[name="funcionario_cargo[]"]')?.value || '',
            quantidade: item.querySelector('input[name="funcionario_quantidade[]"]')?.value || '',
            salario: item.querySelector('input[name="funcionario_salario[]"]')?.value || '',
            escolaridade: item.querySelector('select[name="funcionario_escolaridade[]"]')?.value || '',
            tipo: item.querySelector('select[name="funcionario_tipo[]"]')?.value || ''
        });
    });
    if (funcionarios.length > 0) dynamicData.funcionarios = funcionarios;
    
    // Coletar contratações planejadas (seção 11)
    const contratacoes = [];
    document.querySelectorAll('#contratacoesList .investment-item').forEach(item => {
        contratacoes.push({
            cargo: item.querySelector('.contratacao-cargo')?.value || '',
            quantidade: item.querySelector('.contratacao-quantidade')?.value || '',
            salario: item.querySelector('.contratacao-salario')?.value || '',
            tipo: item.querySelector('.contratacao-tipo')?.value || '',
            encargos: item.querySelector('.contratacao-encargos')?.value || '',
            previsao: item.querySelector('.contratacao-previsao')?.value || '',
            prioridade: item.querySelector('.contratacao-prioridade')?.value || ''
        });
    });
    if (contratacoes.length > 0) dynamicData.contratacoes = contratacoes;
    
    return dynamicData;
}

// Carregar dados do localStorage
function loadFromLocalStorage() {
    try {
        const savedData = localStorage.getItem('cei_projeto_draft');
        if (savedData) {
            const data = JSON.parse(savedData);
            
            // Carregar dados estáticos
            loadStaticData(data.dados);
            
            // Recriar listas dinâmicas
            loadDynamicData(data.dinamicos);
            
            // Restaurar seção atual
            if (data.currentStep) {
                currentStep = data.currentStep;
                showSection(currentStep);
                updateProgressBar();
                updateNavigationButtons();
            }
            
            // Aplicar formatação após carregar
            setTimeout(() => {
                applyUniversalFormatting(document);
            }, 100);
            
            return data;
        }
    } catch (error) {
        console.error('Erro ao carregar dados salvos:', error);
    }
    return null;
}

// Carregar dados estáticos nos campos
function loadStaticData(data) {
    if (!data) return;
    
    Object.keys(data).forEach(key => {
        const field = document.getElementById(key) || document.querySelector(`[name="${key}"]`);
        if (field && data[key] !== null && data[key] !== undefined) {
            field.value = data[key];
        }
    });
}

// Carregar listas dinâmicas
function loadDynamicData(dynamicData) {
    if (!dynamicData) return;
    
    // Carregar investimentos
    if (dynamicData.investimentos) {
        // Obras Civis
        if (dynamicData.investimentos.obrasCivis) {
            const list = document.getElementById('obrasCivisList');
            if (list) {
                list.innerHTML = '';
                dynamicData.investimentos.obrasCivis.forEach(item => {
                    addInvestmentItem('obrasCivis');
                    const lastItem = list.lastElementChild;
                    if (lastItem) {
                        lastItem.querySelector('.item-description').value = item.descricao || '';
                        lastItem.querySelector('.item-supplier').value = item.fornecedor || '';
                        lastItem.querySelector('.item-quantity').value = item.quantidade || '';
                        lastItem.querySelector('.item-unit-value').value = item.valorUnitario || '';
                        lastItem.querySelector('.item-total-value').value = item.valorTotal || '';
                    }
                });
            }
        }
        
        // Máquinas e Equipamentos
        if (dynamicData.investimentos.maquinasEquipamentos) {
            const list = document.getElementById('maquinasEquipamentosList');
            if (list) {
                list.innerHTML = '';
                dynamicData.investimentos.maquinasEquipamentos.forEach(item => {
                    addInvestmentItem('maquinasEquipamentos');
                    const lastItem = list.lastElementChild;
                    if (lastItem) {
                        lastItem.querySelector('.item-description').value = item.descricao || '';
                        lastItem.querySelector('.item-supplier').value = item.fornecedor || '';
                        lastItem.querySelector('.item-quantity').value = item.quantidade || '';
                        lastItem.querySelector('.item-unit-value').value = item.valorUnitario || '';
                        lastItem.querySelector('.item-total-value').value = item.valorTotal || '';
                    }
                });
            }
        }
        
        // Instalações
        if (dynamicData.investimentos.instalacoes) {
            const list = document.getElementById('instalacoesList');
            if (list) {
                list.innerHTML = '';
                dynamicData.investimentos.instalacoes.forEach(item => {
                    addInvestmentItem('instalacoes');
                    const lastItem = list.lastElementChild;
                    if (lastItem) {
                        lastItem.querySelector('.item-description').value = item.descricao || '';
                        lastItem.querySelector('.item-supplier').value = item.fornecedor || '';
                        lastItem.querySelector('.item-quantity').value = item.quantidade || '';
                        lastItem.querySelector('.item-unit-value').value = item.valorUnitario || '';
                        lastItem.querySelector('.item-total-value').value = item.valorTotal || '';
                    }
                });
            }
        }
        
        // Outros Investimentos
        if (dynamicData.investimentos.outrosInvestimentos) {
            const list = document.getElementById('outrosInvestimentosList');
            if (list) {
                list.innerHTML = '';
                dynamicData.investimentos.outrosInvestimentos.forEach(item => {
                    addInvestmentItem('outrosInvestimentos');
                    const lastItem = list.lastElementChild;
                    if (lastItem) {
                        lastItem.querySelector('.item-description').value = item.descricao || '';
                        lastItem.querySelector('.item-supplier').value = item.fornecedor || '';
                        lastItem.querySelector('.item-quantity').value = item.quantidade || '';
                        lastItem.querySelector('.item-unit-value').value = item.valorUnitario || '';
                        lastItem.querySelector('.item-total-value').value = item.valorTotal || '';
                    }
                });
            }
        }
    }
    
    // Carregar produtos
    if (dynamicData.produtos) {
        const produtosList = document.getElementById('produtosList');
        if (produtosList) {
            produtosList.innerHTML = '';
            dynamicData.produtos.forEach(produto => {
                addProdutoItem();
                const lastItem = produtosList.lastElementChild;
                if (lastItem) {
                    lastItem.querySelector('.produto-nome').value = produto.nome || '';
                    lastItem.querySelector('.produto-descricao').value = produto.descricao || '';
                    lastItem.querySelector('.produto-unidade').value = produto.unidade || '';
                    lastItem.querySelector('.produto-preco').value = produto.preco || '';
                    lastItem.querySelector('.produto-atual').value = produto.atual || '';
                    lastItem.querySelector('.produto-futura').value = produto.futura || '';
                }
            });
        }
    }
    
    // Carregar insumos
    if (dynamicData.insumos) {
        const insumosList = document.getElementById('insumosList');
        if (insumosList) {
            insumosList.innerHTML = '';
            dynamicData.insumos.forEach(insumo => {
                addInsumoItem();
                const lastItem = insumosList.lastElementChild;
                if (lastItem) {
                    lastItem.querySelector('.insumo-nome').value = insumo.nome || '';
                    lastItem.querySelector('.insumo-tipo').value = insumo.tipo || '';
                    lastItem.querySelector('.insumo-unidade').value = insumo.unidade || '';
                    lastItem.querySelector('.insumo-custo').value = insumo.custo || '';
                    lastItem.querySelector('.insumo-atual').value = insumo.atual || '';
                    lastItem.querySelector('.insumo-futura').value = insumo.futura || '';
                }
            });
        }
    }
    
    // Carregar clientes
    if (dynamicData.clientes) {
        const clientesList = document.getElementById('clientesList');
        if (clientesList) {
            clientesList.innerHTML = '';
            dynamicData.clientes.forEach(cliente => {
                addClienteItem();
                const lastItem = clientesList.lastElementChild;
                if (lastItem) {
                    lastItem.querySelector('.cliente-nome').value = cliente.nome || '';
                    lastItem.querySelector('.cliente-documento').value = cliente.documento || '';
                    lastItem.querySelector('.cliente-localizacao').value = cliente.localizacao || '';
                    lastItem.querySelector('.cliente-percentual').value = cliente.percentual || '';
                    lastItem.querySelector('.cliente-tipo').value = cliente.tipo || '';
                }
            });
        }
    }
    
    // Carregar concorrentes
    if (dynamicData.concorrentes) {
        const concorrentesList = document.getElementById('concorrentesList');
        if (concorrentesList) {
            concorrentesList.innerHTML = '';
            dynamicData.concorrentes.forEach(concorrente => {
                addConcorrenteItem();
                const lastItem = concorrentesList.lastElementChild;
                if (lastItem) {
                    lastItem.querySelector('.concorrente-nome').value = concorrente.nome || '';
                    lastItem.querySelector('.concorrente-localizacao').value = concorrente.localizacao || '';
                    lastItem.querySelector('.concorrente-porte').value = concorrente.porte || '';
                    lastItem.querySelector('.concorrente-diferencial').value = concorrente.diferencial || '';
                    lastItem.querySelector('.concorrente-nivel').value = concorrente.nivel || '';
                }
            });
        }
    }
    
    // Carregar funcionários
    if (dynamicData.funcionarios) {
        const funcionariosList = document.getElementById('funcionariosList');
        if (funcionariosList) {
            funcionariosList.innerHTML = '';
            dynamicData.funcionarios.forEach(funcionario => {
                addFuncionarioItem();
                const lastItem = funcionariosList.lastElementChild;
                if (lastItem) {
                    lastItem.querySelector('.funcionario-cargo').value = funcionario.cargo || '';
                    lastItem.querySelector('.funcionario-quantidade').value = funcionario.quantidade || '';
                    lastItem.querySelector('.funcionario-salario').value = funcionario.salario || '';
                    lastItem.querySelector('.funcionario-escolaridade').value = funcionario.escolaridade || '';
                    lastItem.querySelector('.funcionario-tipo').value = funcionario.tipo || '';
                }
            });
        }
    }
    
    // Carregar contratações
    if (dynamicData.contratacoes) {
        const contratacoesList = document.getElementById('contratacoesList');
        if (contratacoesList) {
            contratacoesList.innerHTML = '';
            dynamicData.contratacoes.forEach(contratacao => {
                addContratacaoItem();
                const lastItem = contratacoesList.lastElementChild;
                if (lastItem) {
                    const itemId = lastItem.getAttribute('data-id');
                    
                    lastItem.querySelector('.contratacao-cargo').value = contratacao.cargo || '';
                    lastItem.querySelector('.contratacao-quantidade').value = contratacao.quantidade || '';
                    lastItem.querySelector('.contratacao-salario').value = contratacao.salario || '';
                    lastItem.querySelector('.contratacao-tipo').value = contratacao.tipo || '';
                    lastItem.querySelector('.contratacao-previsao').value = contratacao.previsao || '';
                    lastItem.querySelector('.contratacao-prioridade').value = contratacao.prioridade || '';
                    
                    // Auto-preencher encargos baseado no tipo OU usar valor salvo
                    const tipoValue = contratacao.tipo;
                    const encargosValue = contratacao.encargos;
                    
                    if (encargosValue) {
                        // Se já tem encargos salvos, usar eles
                        lastItem.querySelector('.contratacao-encargos').value = encargosValue;
                    } else if (tipoValue) {
                        // Se não tem encargos mas tem tipo, auto-preencher
                        updateEncargos(itemId);
                    }
                }
            });
        }
    }
    
    // Carregar balanços
    if (dynamicData.balancos) {
        const balancoList = document.getElementById('balancoList');
        if (balancoList) {
            balancoList.innerHTML = '';
            dynamicData.balancos.forEach(balanco => {
                addBalancoItem();
                const lastItem = balancoList.lastElementChild;
                if (lastItem) {
                    lastItem.querySelector('.balanco-ano').value = balanco.ano || '';
                    lastItem.querySelector('.balanco-ativo').value = balanco.ativo || '';
                    lastItem.querySelector('.balanco-passivo').value = balanco.passivo || '';
                    lastItem.querySelector('.balanco-patrimonio').value = balanco.patrimonio || '';
                    lastItem.querySelector('.balanco-receita').value = balanco.receita || '';
                    lastItem.querySelector('.balanco-lucro').value = balanco.lucro || '';
                }
            });
        }
    }
    
    // Carregar sócios
    if (dynamicData.socios) {
        const sociosList = document.getElementById('sociosList');
        if (sociosList) {
            sociosList.innerHTML = '';
            dynamicData.socios.forEach(socio => {
                addSocioItem();
                const lastItem = sociosList.lastElementChild;
                if (lastItem) {
                    lastItem.querySelector('.socio-nome').value = socio.nome || '';
                    lastItem.querySelector('.socio-documento').value = socio.documento || '';
                    lastItem.querySelector('.socio-participacao').value = socio.participacao || '';
                    lastItem.querySelector('.socio-valor').value = socio.valor || '';
                    lastItem.querySelector('.socio-tipo').value = socio.tipo || '';
                }
            });
        }
    }
    
    // Carregar dívidas
    if (dynamicData.dividas) {
        const dividasList = document.getElementById('dividasList');
        if (dividasList) {
            dividasList.innerHTML = '';
            dynamicData.dividas.forEach(divida => {
                addDividaItem();
                const lastItem = dividasList.lastElementChild;
                if (lastItem) {
                    lastItem.querySelector('.divida-credor').value = divida.credor || '';
                    lastItem.querySelector('.divida-tipo').value = divida.tipo || '';
                    lastItem.querySelector('.divida-original').value = divida.original || '';
                    lastItem.querySelector('.divida-saldo').value = divida.saldo || '';
                    lastItem.querySelector('.divida-vencimento').value = divida.vencimento || '';
                    lastItem.querySelector('.divida-taxa').value = divida.taxa || '';
                }
            });
        }
    }
    
    // Após carregar todos os dados, recalcular subtotais e RH
    setTimeout(() => {
        calculateSubtotals();
        calculateRHInvestmentAnual();
    }, 100);
}

// Verificar se existem dados salvos ao carregar a página
function checkForSavedData() {
    const savedData = localStorage.getItem('cei_projeto_draft');
    if (savedData) {
        try {
            const data = JSON.parse(savedData);
            const timestamp = new Date(data.timestamp);
            const now = new Date();
            const hoursDiff = (now - timestamp) / (1000 * 60 * 60);
            
            // Se os dados foram salvos nas últimas 24 horas, oferecer recuperação
            if (hoursDiff < 24) {
                showRecoveryDialog(timestamp);
            }
        } catch (error) {
            console.error('Erro ao verificar dados salvos:', error);
        }
    }
}

// Mostrar diálogo de recuperação
function showRecoveryDialog(timestamp) {
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
    `;
    
    const dialog = document.createElement('div');
    dialog.style.cssText = `
        background: white;
        padding: 30px;
        border-radius: 8px;
        max-width: 500px;
        text-align: center;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    `;
    
    dialog.innerHTML = `
        <h3 style="color: #FF002D; margin-bottom: 20px;">📋 Dados Encontrados</h3>
        <p style="margin-bottom: 20px;">
            Encontramos um rascunho salvo em <strong>${timestamp.toLocaleString('pt-BR')}</strong>.
            Deseja recuperar esses dados?
        </p>
        <div style="display: flex; gap: 15px; justify-content: center;">
            <button id="loadDataBtn" style="
                background: #FF002D;
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 4px;
                cursor: pointer;
                font-weight: bold;
            ">Recuperar Dados</button>
            <button id="startFreshBtn" style="
                background: #6c757d;
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 4px;
                cursor: pointer;
            ">Começar do Zero</button>
        </div>
    `;
    
    modal.appendChild(dialog);
    document.body.appendChild(modal);
    
    // Event listeners
    document.getElementById('loadDataBtn').addEventListener('click', () => {
        loadFromLocalStorage();
        document.body.removeChild(modal);
        
        // Mostrar confirmação
        const message = document.createElement('div');
        message.textContent = '✅ Dados recuperados com sucesso!';
        message.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #d4edda;
            color: #155724;
            padding: 12px 20px;
            border-radius: 4px;
            border: 1px solid #c3e6cb;
            z-index: 10000;
            font-weight: bold;
        `;
        document.body.appendChild(message);
        setTimeout(() => {
            document.body.removeChild(message);
        }, 3000);
    });
    
    document.getElementById('startFreshBtn').addEventListener('click', () => {
        // Limpar dados salvos
        localStorage.removeItem('cei_projeto_draft');
        document.body.removeChild(modal);
    });
}

// ===========================================
// FUNÇÕES DE CÁLCULO DE ICMS TRIBUTÁRIO GOIÁS
// ===========================================

// Alíquotas ICMS Goiás e interestaduais
const ALIQUOTAS_ICMS_GOIAS = {
    goias: {
        normal: 19,        // 19% - interna normal
        reducao10: 10,     // 10% - alíquota efetiva (produção própria/fabricante)
        reducao11: 11      // 11% - alíquota efetiva (revenda/distribuidor)
    },
    vendas_interestaduais: {
        todos_estados: 12  // 12% - vendas de GO para todos os outros estados
    },
    compras_interestaduais: {
        // Compras de outros estados para Goiás
        sul_sudeste_exceto_es: 7,  // 7% - SP, RJ, MG, SC, RS, PR
        norte_nordeste_co_es: 12   // 12% - Norte, Nordeste, Centro-Oeste + Espírito Santo
    },
    especiais: {
        zonaFranca: 0,     // 0% - Zona Franca de Manaus
        exportacao: 0      // 0% - Exportação
    }
};

// Função para validar e somar percentuais de Goiás
function validateGoiasPercentages() {
    // Validar vendas Goiás
    const vendasReducao10 = parseFloat(document.getElementById('vendasGoiasReducao10')?.value || 0);
    const vendasReducao11 = parseFloat(document.getElementById('vendasGoiasReducao11')?.value || 0);
    const vendasAliquotaCheia = parseFloat(document.getElementById('vendasGoiasAliquotaCheia')?.value || 0);
    const totalVendas = vendasReducao10 + vendasReducao11 + vendasAliquotaCheia;
    
    document.getElementById('totalVendasGoias').value = totalVendas.toFixed(1);
    
    // Validar compras Goiás
    const comprasFabricante = parseFloat(document.getElementById('comprasGoiasFabricante')?.value || 0);
    const comprasDistribuidor = parseFloat(document.getElementById('comprasGoiasDistribuidor')?.value || 0);
    const comprasAliquotaCheia = parseFloat(document.getElementById('comprasGoiasAliquotaCheia')?.value || 0);
    const totalCompras = comprasFabricante + comprasDistribuidor + comprasAliquotaCheia;
    
    document.getElementById('totalComprasGoias').value = totalCompras.toFixed(1);
    
    // Alertar se percentuais não somam 100%
    if (totalVendas > 0 && Math.abs(totalVendas - 100) > 0.1) {
        document.getElementById('totalVendasGoias').style.color = 'red';
    } else {
        document.getElementById('totalVendasGoias').style.color = 'inherit';
    }
    
    if (totalCompras > 0 && Math.abs(totalCompras - 100) > 0.1) {
        document.getElementById('totalComprasGoias').style.color = 'red';
    } else {
        document.getElementById('totalComprasGoias').style.color = 'inherit';
    }
}

// Função para calcular ICMS médio efetivo ponderado
function calculateICMSMedioGoias() {
    try {
        // Distribuição regional de vendas (percentuais)
        const vendasGoias = parseFloat(document.getElementById('vendasGoias')?.value || 0);
        const vendasNorte = parseFloat(document.getElementById('vendasNorte')?.value || 0);
        const vendasNordeste = parseFloat(document.getElementById('vendasNordeste')?.value || 0);
        const vendasCentroOeste = parseFloat(document.getElementById('vendasCentroOeste')?.value || 0);
        const vendasSudeste = parseFloat(document.getElementById('vendasSudeste')?.value || 0);
        const vendasSul = parseFloat(document.getElementById('vendasSul')?.value || 0);
        const vendasZonaFranca = parseFloat(document.getElementById('vendasZonaFranca')?.value || 0);
        const vendasExportacao = parseFloat(document.getElementById('vendasExportacao')?.value || 0);
        
        // Distribuição das vendas em Goiás por tipo de redução (percentuais)
        const vendasReducao10 = parseFloat(document.getElementById('vendasGoiasReducao10')?.value || 0);
        const vendasReducao11 = parseFloat(document.getElementById('vendasGoiasReducao11')?.value || 0);
        const vendasAliquotaCheia = parseFloat(document.getElementById('vendasGoiasAliquotaCheia')?.value || 0);
        
        let aliquotaEfetiva = 0;
        const totalVendas = vendasGoias + vendasNorte + vendasNordeste + vendasCentroOeste + vendasSudeste + vendasSul + vendasZonaFranca + vendasExportacao;
        
        if (totalVendas > 0) {
            // ICMS de vendas em Goiás (usando alíquotas efetivas corretas)
            const icmsGoias = (vendasGoias / 100) * (
                (vendasReducao10 / 100) * ALIQUOTAS_ICMS_GOIAS.goias.reducao10 +      // 10%
                (vendasReducao11 / 100) * ALIQUOTAS_ICMS_GOIAS.goias.reducao11 +      // 11%
                (vendasAliquotaCheia / 100) * ALIQUOTAS_ICMS_GOIAS.goias.normal       // 19%
            );
            
            // ICMS de vendas interestaduais (12% para todos os estados)
            const icmsInterestaduais = 
                (vendasNorte / 100) * ALIQUOTAS_ICMS_GOIAS.vendas_interestaduais.todos_estados +
                (vendasNordeste / 100) * ALIQUOTAS_ICMS_GOIAS.vendas_interestaduais.todos_estados +
                (vendasCentroOeste / 100) * ALIQUOTAS_ICMS_GOIAS.vendas_interestaduais.todos_estados +
                (vendasSudeste / 100) * ALIQUOTAS_ICMS_GOIAS.vendas_interestaduais.todos_estados +
                (vendasSul / 100) * ALIQUOTAS_ICMS_GOIAS.vendas_interestaduais.todos_estados;
            
            // ICMS de vendas especiais (ZFM e exportação = 0%)
            const icmsEspeciais = 
                (vendasZonaFranca / 100) * ALIQUOTAS_ICMS_GOIAS.especiais.zonaFranca +
                (vendasExportacao / 100) * ALIQUOTAS_ICMS_GOIAS.especiais.exportacao;
            
            aliquotaEfetiva = icmsGoias + icmsInterestaduais + icmsEspeciais;
        }
        
        // Atualizar campo de alíquota ICMS média
        const aliquotaField = document.getElementById('aliquotaICMSMedia');
        if (aliquotaField) {
            aliquotaField.value = aliquotaEfetiva.toFixed(3);
        }
        
        return aliquotaEfetiva;
        
    } catch (error) {
        console.warn('Erro no cálculo de ICMS médio Goiás:', error);
        return 0;
    }
}

// Função para calcular ICMS débito (vendas)
function calculateICMSDebito() {
    try {
        const receitaAnual = parseFloat(document.getElementById('receitaBrutaAnual')?.value?.replace(/[^\d,]/g, '').replace(',', '.') || 0);
        const aliquotaEfetiva = parseFloat(document.getElementById('aliquotaICMSMedia')?.value || 0);
        
        if (receitaAnual > 0 && aliquotaEfetiva > 0) {
            const icmsDebitoAnual = receitaAnual * (aliquotaEfetiva / 100);
            const icmsDebitoMensal = icmsDebitoAnual / 12;
            
            // Atualizar campo
            const debitoField = document.getElementById('icmsDebitoMensal');
            if (debitoField) {
                debitoField.value = new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                }).format(icmsDebitoMensal);
            }
            
            return icmsDebitoMensal;
        }
        
        return 0;
    } catch (error) {
        console.warn('Erro no cálculo de ICMS débito:', error);
        return 0;
    }
}

// Função para calcular ICMS crédito (compras)
function calculateICMSCredito() {
    try {
        const custosVariaveis = parseFloat(document.getElementById('custosVariaveisMensais')?.value?.replace(/[^\d,]/g, '').replace(',', '.') || 0);
        const custosFixos = parseFloat(document.getElementById('custosFixosMensais')?.value?.replace(/[^\d,]/g, '').replace(',', '.') || 0);
        const totalCompras = custosVariaveis + custosFixos; // Aproximação
        
        // Distribuição regional de compras (percentuais)
        const insumosGoias = parseFloat(document.getElementById('insumosGoias')?.value || 0);
        const insumosNorte = parseFloat(document.getElementById('insumosNorte')?.value || 0);
        const insumosNordeste = parseFloat(document.getElementById('insumosNordeste')?.value || 0);
        const insumosCentroOeste = parseFloat(document.getElementById('insumosCentroOeste')?.value || 0);
        const insumosSudeste = parseFloat(document.getElementById('insumosSudeste')?.value || 0);
        const insumosSul = parseFloat(document.getElementById('insumosSul')?.value || 0);
        
        // Distribuição das compras em Goiás por tipo de redução (percentuais)
        const comprasFabricante = parseFloat(document.getElementById('comprasGoiasFabricante')?.value || 0);
        const comprasDistribuidor = parseFloat(document.getElementById('comprasGoiasDistribuidor')?.value || 0);
        const comprasAliquotaCheia = parseFloat(document.getElementById('comprasGoiasAliquotaCheia')?.value || 0);
        
        let creditoTotal = 0;
        
        if (totalCompras > 0) {
            // ICMS crédito de compras em Goiás (usando alíquotas efetivas corretas)
            if (insumosGoias > 0) {
                const comprasGoiasValor = totalCompras * (insumosGoias / 100);
                const icmsCreditoGoias = comprasGoiasValor * (
                    (comprasFabricante / 100) * (ALIQUOTAS_ICMS_GOIAS.goias.reducao10 / 100) +      // 10%
                    (comprasDistribuidor / 100) * (ALIQUOTAS_ICMS_GOIAS.goias.reducao11 / 100) +   // 11%
                    (comprasAliquotaCheia / 100) * (ALIQUOTAS_ICMS_GOIAS.goias.normal / 100)       // 19%
                );
                creditoTotal += icmsCreditoGoias;
            }
            
            // ICMS crédito de compras interestaduais
            // Norte, Nordeste, Centro-Oeste: 12%
            const comprasNorte = totalCompras * (insumosNorte / 100) * (ALIQUOTAS_ICMS_GOIAS.compras_interestaduais.norte_nordeste_co_es / 100);
            const comprasNordeste = totalCompras * (insumosNordeste / 100) * (ALIQUOTAS_ICMS_GOIAS.compras_interestaduais.norte_nordeste_co_es / 100);
            const comprasCentroOeste = totalCompras * (insumosCentroOeste / 100) * (ALIQUOTAS_ICMS_GOIAS.compras_interestaduais.norte_nordeste_co_es / 100);
            
            // Sul e Sudeste (exceto ES): 7%
            // Nota: Para simplificar, assumimos que todo Sul/Sudeste é 7% (exceto ES que seria 12%)
            const comprasSudeste = totalCompras * (insumosSudeste / 100) * (ALIQUOTAS_ICMS_GOIAS.compras_interestaduais.sul_sudeste_exceto_es / 100);
            const comprasSul = totalCompras * (insumosSul / 100) * (ALIQUOTAS_ICMS_GOIAS.compras_interestaduais.sul_sudeste_exceto_es / 100);
            
            creditoTotal += comprasNorte + comprasNordeste + comprasCentroOeste + comprasSudeste + comprasSul;
            
            // Atualizar campo
            const creditoField = document.getElementById('icmsCreditoMensal');
            if (creditoField) {
                creditoField.value = new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                }).format(creditoTotal);
            }
            
            return creditoTotal;
        }
        
        return 0;
    } catch (error) {
        console.warn('Erro no cálculo de ICMS crédito:', error);
        return 0;
    }
}

// Função para calcular ICMS líquido (débito - crédito)
function calculateICMSLiquido() {
    try {
        const debito = calculateICMSDebito();
        const credito = calculateICMSCredito();
        const liquido = debito - credito;
        
        const liquidoField = document.getElementById('icmsLiquidoMensal');
        if (liquidoField) {
            liquidoField.value = new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
            }).format(Math.max(0, liquido)); // Não pode ser negativo
        }
        
        return Math.max(0, liquido);
    } catch (error) {
        console.warn('Erro no cálculo de ICMS líquido:', error);
        return 0;
    }
}

// Função para calcular ICMS projetado
function calculateICMSProjetado() {
    try {
        const metaFaturamento = parseFloat(document.getElementById('metaFaturamento')?.value?.replace(/[^\d,]/g, '').replace(',', '.') || 0);
        const aliquotaEfetiva = parseFloat(document.getElementById('aliquotaICMSMedia')?.value || 0);
        
        if (metaFaturamento > 0 && aliquotaEfetiva > 0) {
            const icmsProjetadoAnual = metaFaturamento * (aliquotaEfetiva / 100);
            const icmsProjetadoMensal = icmsProjetadoAnual / 12;
            
            const projetadoField = document.getElementById('icmsProjetadoMensal');
            if (projetadoField) {
                projetadoField.value = new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                }).format(icmsProjetadoMensal);
            }
            
            return icmsProjetadoMensal;
        }
        
        return 0;
    } catch (error) {
        console.warn('Erro no cálculo de ICMS projetado:', error);
        return 0;
    }
}

// Function para recalcular tudo
function recalculateICMS() {
    validateGoiasPercentages();
    calculateICMSMedioGoias();
    calculateICMSDebito();
    calculateICMSCredito();
    calculateICMSLiquido();
    calculateICMSProjetado();
}

// Função para adicionar event listeners ICMS (reutilizável após import)
function addICMSEventListeners() {
    // Campos de distribuição regional
    const vendasFields = [
        'vendasGoias', 'vendasNorte', 'vendasNordeste', 'vendasCentroOeste', 
        'vendasSudeste', 'vendasSul', 'vendasZonaFranca', 'vendasExportacao'
    ];
    
    // Campos de vendas internas Goiás
    const vendasGoiasFields = [
        'vendasGoiasReducao10', 'vendasGoiasReducao11', 'vendasGoiasAliquotaCheia'
    ];
    
    // Campos de compras internas Goiás
    const comprasGoiasFields = [
        'comprasGoiasFabricante', 'comprasGoiasDistribuidor', 'comprasGoiasAliquotaCheia'
    ];
    
    // Campos financeiros
    const financeFields = [
        'receitaBrutaAnual', 'metaFaturamento', 'custosVariaveisMensais', 'custosFixosMensais', 'insumosGoias'
    ];
    
    // Campos de insumos regionais (para cálculo de crédito)
    const insumosFields = [
        'insumosNorte', 'insumosNordeste', 'insumosCentroOeste', 'insumosSudeste', 'insumosSul'
    ];
    
    // Adicionar listeners para todos os campos relevantes
    [...vendasFields, ...vendasGoiasFields, ...comprasGoiasFields, ...financeFields, ...insumosFields].forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            // Remover listeners existentes para evitar duplicação
            const newField = field.cloneNode(true);
            field.parentNode.replaceChild(newField, field);
            
            // Adicionar novos listeners
            newField.addEventListener('blur', recalculateICMS);
            newField.addEventListener('input', function() {
                // Validação em tempo real para campos de percentual
                if (vendasGoiasFields.includes(fieldId) || comprasGoiasFields.includes(fieldId)) {
                    validateGoiasPercentages();
                }
            });
        }
    });
}

// Event listeners para campos de ICMS Goiás
document.addEventListener('DOMContentLoaded', function() {
    addICMSEventListeners();
});
