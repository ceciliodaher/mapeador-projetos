// Função para importar dados de arquivo JSON
function handleJsonImport(event) {
    console.log('🔧 Iniciando importação de JSON...');
    
    const file = event.target.files[0];
    if (!file) {
        console.log('⚠️ Nenhum arquivo selecionado');
        return;
    }
    
    console.log('📄 Arquivo selecionado:', file.name, 'Tamanho:', file.size, 'bytes');
    
    // Verificar se é um arquivo JSON
    if (!file.type.includes('json') && !file.name.endsWith('.json')) {
        alert('⚠️ Por favor, selecione um arquivo JSON válido.');
        console.error('❌ Tipo de arquivo inválido:', file.type);
        return;
    }
    
    const reader = new FileReader();
    
    reader.onload = function(e) {
        console.log('📖 Arquivo lido com sucesso, processando...');
        
        try {
            const jsonContent = e.target.result;
            console.log('📄 Conteúdo do arquivo (primeiros 200 chars):', jsonContent.substring(0, 200));
            
            const jsonData = JSON.parse(jsonContent);
            console.log('✅ JSON parseado com sucesso');
            
            // Verificar se tem a estrutura esperada
            if (!jsonData || !jsonData.dados) {
                alert('⚠️ Arquivo JSON não tem a estrutura correta. Deve conter um objeto "dados".');
                console.error('❌ Estrutura JSON inválida:', Object.keys(jsonData || {}));
                return;
            }
            
            console.log('🔍 Estrutura JSON válida encontrada');
            console.log('📊 Campos encontrados:', Object.keys(jsonData.dados).length);
            
            // Confirmar importação
            const confirmacao = confirm(`📥 Importar dados do arquivo "${file.name}"?\n\n⚠️ Isso substituirá todos os dados atuais do formulário.`);
            
            if (confirmacao) {
                console.log('✅ Usuário confirmou importação');
                
                // Envolver tudo em try-catch para capturar erros de extensões
                try {
                    // Limpar formulário atual
                    console.log('🧹 Limpando formulário...');
                    clearAllFieldsSafe();
                    
                    // Carregar dados estáticos
                    console.log('📝 Carregando dados estáticos...');
                    loadStaticDataSafe(jsonData.dados);
                    
                    // Carregar dados dinâmicos se existirem
                    if (jsonData.dinamicos) {
                        console.log('🔧 Carregando dados dinâmicos...');
                        loadDynamicDataSafe(jsonData.dinamicos);
                    }
                    
                    // Ir para primeira seção
                    console.log('🧭 Navegando para seção 1...');
                    currentStep = 1;
                    showSection(currentStep);
                    updateProgressBar();
                    updateNavigationButtons();
                    
                    // Aplicar formatação com delay maior
                    setTimeout(() => {
                        console.log('🎨 Aplicando formatações...');
                        try {
                            // Aplicar formatação universal
                            if (typeof applyUniversalFormatting === 'function') {
                                applyUniversalFormatting(document);
                            }
                            
                            // Recalcular investimento RH após importação
                            console.log('💼 Recalculando investimento RH...');
                            if (typeof calculateRHInvestmentAnual === 'function') {
                                calculateRHInvestmentAnual();
                            }
                            
                            // Recalcular ICMS após importação
                            console.log('🧮 Recalculando ICMS...');
                            if (typeof recalculateICMS === 'function') {
                                recalculateICMS();
                            }
                            
                            // Reagendar event listeners ICMS
                            console.log('🎛️ Reagendando listeners ICMS...');
                            if (typeof addICMSEventListeners === 'function') {
                                addICMSEventListeners();
                            }
                            
                            // Aplicar formatação de telefone especificamente
                            const phoneFields = document.querySelectorAll('input[type="tel"], input[id*="telefone"], input[id*="Telefone"]');
                            phoneFields.forEach(field => {
                                if (field.value) {
                                    // Limpar e reformatar telefone
                                    let phone = field.value.replace(/\D/g, '');
                                    if (phone.length === 11) {
                                        field.value = `(${phone.substr(0,2)}) ${phone.substr(2,5)}-${phone.substr(7,4)}`;
                                    } else if (phone.length === 10) {
                                        field.value = `(${phone.substr(0,2)}) ${phone.substr(2,4)}-${phone.substr(6,4)}`;
                                    }
                                }
                            });
                            
                            // Forçar formatação monetária em campos específicos
                            const monetaryFields = document.querySelectorAll(`
                                input[id*="valor"], input[id*="Valor"],
                                input[id*="preco"], input[id*="Preco"],
                                input[id*="custo"], input[id*="Custo"],
                                input[id*="receita"], input[id*="Receita"],
                                input[id*="despesa"], input[id*="Despesa"],
                                input[id*="investimento"], input[id*="Investimento"],
                                input[id*="faturamento"], input[id*="Faturamento"],
                                input[id*="capital"], input[id*="Capital"],
                                input[id*="patrimonio"], input[id*="Patrimonio"],
                                input[id*="endividamento"], input[id*="Endividamento"],
                                input[id*="saldo"], input[id*="Saldo"],
                                input[id*="ticket"], input[id*="Ticket"],
                                .item-unit-value, .item-total-value,
                                .produto-preco, .insumo-custo,
                                .funcionario-salario, .contratacao-salario,
                                .balanco-ativo, .balanco-passivo, .balanco-patrimonio, .balanco-receita, .balanco-lucro,
                                .socio-valor, .divida-original, .divida-saldo
                            `);
                            
                            monetaryFields.forEach(field => {
                                if (field.value && !isNaN(parseFloat(field.value.replace(/\D/g, '').replace(',', '.')))) {
                                    const value = parseFloat(field.value.replace(/[^\d.,]/g, '').replace(',', '.'));
                                    if (value > 0) {
                                        field.value = new Intl.NumberFormat('pt-BR', {
                                            style: 'currency',
                                            currency: 'BRL'
                                        }).format(value);
                                    }
                                }
                            });
                            
                            // Recalcular subtotais dos investimentos
                            if (typeof calculateSubtotals === 'function') {
                                calculateSubtotals();
                            }
                            
                        } catch (formatError) {
                            console.warn('⚠️ Erro na formatação (não crítico):', formatError.message);
                        }
                    }, 800);
                    
                    // Fechar modal se estiver aberto
                    try {
                        const modal = document.getElementById('previewModal');
                        if (modal && modal.style.display === 'block') {
                            closePreview();
                        }
                    } catch (modalError) {
                        console.warn('⚠️ Erro ao fechar modal (não crítico):', modalError.message);
                    }
                    
                    // Mostrar mensagem de sucesso
                    showSuccessMessage(`✅ Dados importados com sucesso do arquivo "${file.name}"!`);
                    
                    console.log('🎉 Importação concluída com sucesso!');
                    console.log('📊 Dados importados:', jsonData);
                    
                } catch (importError) {
                    console.error('❌ Erro durante importação:', importError);
                    alert(`❌ Erro durante a importação: ${importError.message}\n\nTente recarregar a página e importar novamente.`);
                }
            } else {
                console.log('❌ Usuário cancelou importação');
            }
            
        } catch (parseError) {
            console.error('❌ Erro ao fazer parse do JSON:', parseError);
            alert(`❌ Erro ao ler arquivo JSON: ${parseError.message}\n\nVerifique se o arquivo está correto.`);
        }
    };
    
    reader.onerror = function(error) {
        console.error('❌ Erro ao ler arquivo:', error);
        alert('❌ Erro ao ler o arquivo. Tente novamente.');
    };
    
    console.log('📖 Iniciando leitura do arquivo...');
    reader.readAsText(file);
    
    // Limpar o input para permitir reimportar o mesmo arquivo
    event.target.value = '';
}

// Versão segura da limpeza de campos (ignora erros de extensões)
function clearAllFieldsSafe() {
    try {
        // Limpar todos os inputs, textareas e selects
        const fields = document.querySelectorAll('#projectForm input:not([type="file"]):not([type="hidden"]), #projectForm textarea, #projectForm select');
        console.log(`🧹 Limpando ${fields.length} campos...`);
        
        fields.forEach((field, index) => {
            try {
                if (field.type === 'checkbox' || field.type === 'radio') {
                    field.checked = false;
                } else {
                    field.value = '';
                }
            } catch (fieldError) {
                console.warn(`⚠️ Erro ao limpar campo ${index} (não crítico):`, fieldError.message);
            }
        });
        
        // Limpar listas dinâmicas
        if (typeof investmentDetails !== 'undefined') {
            investmentDetails = {
                obrasCivis: [],
                maquinasEquipamentos: [],
                instalacoes: [],
                outrosInvestimentos: []
            };
        }
        
        // Recriar as seções dinâmicas vazias
        recreateDynamicSectionsSafe();
        
    } catch (error) {
        console.warn('⚠️ Erro na limpeza de campos (não crítico):', error.message);
    }
}

// Versão segura do carregamento de dados estáticos
function loadStaticDataSafe(data) {
    try {
        if (typeof loadStaticData === 'function') {
            loadStaticData(data);
        } else {
            // Implementação alternativa se a função não existir
            Object.keys(data).forEach(key => {
                try {
                    const field = document.querySelector(`[name="${key}"]`);
                    if (field) {
                        if (field.type === 'checkbox' || field.type === 'radio') {
                            field.checked = data[key] === true || data[key] === 'true';
                        } else {
                            field.value = data[key] || '';
                        }
                    }
                } catch (fieldError) {
                    console.warn(`⚠️ Erro ao carregar campo ${key}:`, fieldError.message);
                }
            });
        }
    } catch (error) {
        console.warn('⚠️ Erro no carregamento de dados estáticos:', error.message);
    }
}

// Versão segura do carregamento de dados dinâmicos
function loadDynamicDataSafe(dynamicData) {
    try {
        if (typeof loadDynamicData === 'function') {
            loadDynamicData(dynamicData);
        }
        
        // Recalcular valores após carregamento dos dados dinâmicos
        setTimeout(() => {
            console.log('🔄 Recalculando campos após carregamento dinâmico...');
            
            // Recalcular investimento RH
            if (typeof calculateRHInvestmentAnual === 'function') {
                calculateRHInvestmentAnual();
            }
            
            // Recalcular ICMS após carregamento dinâmico
            if (typeof recalculateICMS === 'function') {
                recalculateICMS();
            }
            
            // Recalcular totais de investimento se necessário
            if (typeof updateTotals === 'function') {
                updateTotals();
            }
        }, 1000);
        
    } catch (error) {
        console.warn('⚠️ Erro no carregamento de dados dinâmicos:', error.message);
    }
}

// Versão segura da recriação de seções dinâmicas
function recreateDynamicSectionsSafe() {
    try {
        const containers = [
            'obras-civis-container',
            'maquinas-equipamentos-container', 
            'instalacoes-container',
            'outros-investimentos-container'
        ];
        
        containers.forEach(containerId => {
            try {
                const container = document.getElementById(containerId);
                if (container) {
                    container.innerHTML = '';
                }
            } catch (containerError) {
                console.warn(`⚠️ Erro ao limpar container ${containerId}:`, containerError.message);
            }
        });
    } catch (error) {
        console.warn('⚠️ Erro na recriação de seções dinâmicas:', error.message);
    }
}

// Função para limpar todos os campos do formulário
function clearAllFields() {
    // Limpar todos os inputs, textareas e selects
    const fields = form.querySelectorAll('input:not([type="file"]):not([type="hidden"]), textarea, select');
    fields.forEach(field => {
        if (field.type === 'checkbox' || field.type === 'radio') {
            field.checked = false;
        } else {
            field.value = '';
        }
    });
    
    // Limpar listas dinâmicas
    investmentDetails = {
        obrasCivis: [],
        maquinasEquipamentos: [],
        instalacoes: [],
        outrosInvestimentos: []
    };
    
    // Recriar as seções dinâmicas vazias
    recreateDynamicSections();
}

// Função para recriar seções dinâmicas vazias
function recreateDynamicSections() {
    const containers = [
        'obras-civis-container',
        'maquinas-equipamentos-container', 
        'instalacoes-container',
        'outros-investimentos-container'
    ];
    
    containers.forEach(containerId => {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = '';
        }
    });
}

// Função para mostrar mensagem de sucesso
function showSuccessMessage(message) {
    const messageDiv = document.createElement('div');
    messageDiv.textContent = message;
    messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #28a745;
        color: white;
        padding: 15px 20px;
        border-radius: 5px;
        font-weight: bold;
        z-index: 10000;
        box-shadow: 0 4px 8px rgba(0,0,0,0.2);
    `;
    
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
        if (document.body.contains(messageDiv)) {
            document.body.removeChild(messageDiv);
        }
    }, 4000);
}