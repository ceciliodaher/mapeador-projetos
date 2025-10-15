/* =====================================
   PROGOIAS-NAVIGATION.JS
   Sistema de navegação para Formulário ProGoiás (11 seções)
   Usa IndexedDB para isolamento de dados
   Seção 9 (ICMS) protegida por senha
   NO FALLBACKS - NO HARDCODED DATA
   ===================================== */

// Variáveis globais de navegação
let currentStep = 1;
const totalSteps = 11; // ProGoiás: 1-6, 6A (matriz), 7-10
let formData = {};
let analystAuthenticated = false; // Flag para controle de acesso

// IndexedDB Manager
let progoiasDBManager = null;

// Elementos DOM
let form, prevBtn, nextBtn, previewBtn, progressFill;

// Inicialização
document.addEventListener('DOMContentLoaded', async function() {
    // Capturar elementos DOM
    form = document.getElementById('projectForm');
    prevBtn = document.getElementById('prevBtn');
    nextBtn = document.getElementById('nextBtn');
    previewBtn = document.getElementById('previewBtn');
    progressFill = document.getElementById('progressFill');

    if (!form) {
        console.error('Formulário não encontrado! Verifique se o ID "projectForm" existe.');
        return;
    }

    // Verificar autenticação de sessão
    if (sessionStorage.getItem('analyst_authenticated') === 'true') {
        analystAuthenticated = true;
    }

    // Inicializar IndexedDB
    await initializeDatabase();

    // Inicializar formulário
    initializeForm();
    setupEventListeners();
    await checkForSavedData();
});

// Inicializar banco de dados IndexedDB
async function initializeDatabase() {
    try {
        progoiasDBManager = new ProGoiasIndexedDBManager();
        await progoiasDBManager.init();

        // Expor globalmente para scripts inline e testes E2E
        window.dbManager = progoiasDBManager;
        window.progoiasDBManager = progoiasDBManager;

        console.log('✓ IndexedDB ProGoiás pronto para uso');

        // Migrar dados do localStorage se existirem
        await progoiasDBManager.migrateFromLocalStorage();
    } catch (error) {
        console.error('✗ Erro ao inicializar IndexedDB ProGoiás:', error);
        alert('Erro ao inicializar sistema de salvamento. Por favor, recarregue a página.');
    }
}

// Configuração inicial do formulário
function initializeForm() {
    updateProgressBar();
    updateNavigationButtons();
    showSection(currentStep);
}

// Configuração dos event listeners
function setupEventListeners() {
    // Botões de navegação
    if (prevBtn) prevBtn.addEventListener('click', goToPreviousStep);
    if (nextBtn) nextBtn.addEventListener('click', goToNextStep);
    if (previewBtn) previewBtn.addEventListener('click', showPreview);

    // Navegação por steps (clique nos números)
    const stepNumbers = document.querySelectorAll('.step');
    stepNumbers.forEach((step, index) => {
        step.addEventListener('click', () => {
            const targetStep = index + 1;
            goToStep(targetStep);
        });
    });

    // Auto-save ao mudar campos
    const inputs = form.querySelectorAll('input, textarea, select');
    inputs.forEach(input => {
        input.addEventListener('change', () => {
            autoSaveData();
        });
    });
}

// Verificar senha para seção 10 (ICMS)
function checkAnalystAccess() {
    if (analystAuthenticated) {
        return true;
    }

    const password = prompt('🔒 Seção Restrita a Analistas\n\nEsta seção contém informações sensíveis de ICMS.\nDigite a senha de acesso:');

    if (password === 'icms2024') {
        analystAuthenticated = true;
        sessionStorage.setItem('analyst_authenticated', 'true');
        return true;
    }

    alert('❌ Senha incorreta. Acesso negado.\n\nEsta seção é restrita a analistas autorizados.');
    return false;
}

// Navegação para etapa anterior
function goToPreviousStep() {
    if (currentStep > 1) {
        currentStep--;

        // Verificar se precisa de senha para seção 10 (ICMS)
        if (currentStep === 10 && !checkAnalystAccess()) {
            currentStep++; // Voltar para seção atual
            return;
        }

        showSection(currentStep);
        updateProgressBar();
        updateNavigationButtons();
        autoSaveData();
    }
}

// Navegação para próxima etapa
function goToNextStep() {
    if (currentStep < totalSteps) {
        currentStep++;

        // Verificar se precisa de senha para seção 10 (ICMS)
        if (currentStep === 10 && !checkAnalystAccess()) {
            currentStep--; // Voltar para seção anterior
            return;
        }

        showSection(currentStep);
        updateProgressBar();
        updateNavigationButtons();
        autoSaveData();
    }
}

// Navegar para step específico
function goToStep(step) {
    if (step >= 1 && step <= totalSteps) {
        // Verificar se é seção 10 (ICMS) e se tem acesso
        if (step === 10 && !checkAnalystAccess()) {
            return;
        }

        currentStep = step;
        showSection(currentStep);
        updateProgressBar();
        updateNavigationButtons();
        autoSaveData();
    }
}

// Mostrar seção específica
function showSection(step) {
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

        // Garantir que a seção seja exibida
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

// Atualizar barra de progresso
function updateProgressBar() {
    if (!progressFill) return;

    const progress = (currentStep / totalSteps) * 100;
    progressFill.style.width = `${progress}%`;

    // Atualizar texto de progresso
    updateProgressInfo();
}

// Atualizar informações de progresso
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

// Atualizar botões de navegação
function updateNavigationButtons() {
    if (prevBtn) {
        prevBtn.style.display = currentStep === 1 ? 'none' : 'inline-flex';
    }

    if (nextBtn) {
        if (currentStep === totalSteps) {
            nextBtn.style.display = 'none';
            if (previewBtn) previewBtn.style.display = 'inline-flex';
        } else {
            nextBtn.style.display = 'inline-flex';
            if (previewBtn) previewBtn.style.display = 'none';
        }
    }
}

// Verificar se seção tem dados
function hasSectionData(sectionNumber) {
    const section = form.querySelector(`[data-section="${sectionNumber}"]`);
    if (!section) return false;

    const inputs = section.querySelectorAll('input, textarea, select');
    for (let input of inputs) {
        if (input.type !== 'file' && input.value.trim() !== '') {
            return true;
        }
    }
    return false;
}

// Auto-save dos dados (agora usa IndexedDB)
async function autoSaveData() {
    if (!progoiasDBManager) {
        console.warn('IndexedDB não inicializado ainda');
        return;
    }

    try {
        const data = {
            currentStep: currentStep,
            timestamp: new Date().toISOString(),
            ...collectFormData()
        };

        await progoiasDBManager.saveProject(data);

        const saveStatus = document.getElementById('saveStatus');
        if (saveStatus) {
            saveStatus.textContent = '✅ Salvo';
            saveStatus.className = 'save-status saved';

            setTimeout(() => {
                updateProgressInfo();
            }, 2000);
        }
    } catch (e) {
        console.error('Erro ao salvar dados:', e);
        const saveStatus = document.getElementById('saveStatus');
        if (saveStatus) {
            saveStatus.textContent = '❌ Erro ao salvar';
            saveStatus.className = 'save-status error';
        }
    }
}

// Coletar dados do formulário
function collectFormData() {
    const data = {};
    const inputs = form.querySelectorAll('input, textarea, select');

    inputs.forEach(input => {
        if (input.name && input.type !== 'file') {
            if (input.type === 'checkbox') {
                data[input.name] = input.checked;
            } else if (input.type === 'radio') {
                if (input.checked) {
                    data[input.name] = input.value;
                }
            } else {
                data[input.name] = input.value;
            }
        }
    });

    return data;
}

// Verificar dados salvos (agora usa IndexedDB)
async function checkForSavedData() {
    if (!progoiasDBManager) {
        console.warn('IndexedDB não inicializado ainda');
        return;
    }

    try {
        const savedProject = await progoiasDBManager.loadProject();

        if (savedProject) {
            // Perguntar se quer restaurar
            const lastSaved = new Date(savedProject.updatedAt).toLocaleString('pt-BR');
            if (confirm(`Encontramos dados salvos em ${lastSaved}. Deseja restaurá-los?`)) {
                restoreFormData(savedProject);
            }
        }
    } catch (e) {
        console.error('Erro ao verificar dados salvos:', e);
    }
}

// Restaurar dados do formulário
function restoreFormData(data) {
    if (!data) return;

    // Restaurar step atual
    if (data.currentStep) {
        // Se for seção 10 (ICMS), verificar senha
        if (data.currentStep === 10 && !checkAnalystAccess()) {
            currentStep = 1;
        } else {
            currentStep = data.currentStep;
        }

        showSection(currentStep);
        updateProgressBar();
        updateNavigationButtons();
    }

    // Restaurar campos (data agora vem diretamente do IndexedDB, sem nested formData)
    Object.keys(data).forEach(name => {
        // Ignorar campos de metadados
        if (['id', 'createdAt', 'updatedAt', 'currentStep', 'timestamp', 'migratedFrom', 'migratedAt'].includes(name)) {
            return;
        }

        const input = form.querySelector(`[name="${name}"]`);
        if (input) {
            if (input.type === 'checkbox') {
                input.checked = data[name];
            } else if (input.type === 'radio') {
                const radio = form.querySelector(`[name="${name}"][value="${data[name]}"]`);
                if (radio) radio.checked = true;
            } else {
                input.value = data[name];
            }
        }
    });

    updateProgressInfo();
}

// Mostrar preview (será implementado no módulo de export)
function showPreview() {
    if (typeof window.showPreviewModal === 'function') {
        window.showPreviewModal();
    } else {
        alert('Função de preview não disponível. Verifique se o módulo de export está carregado.');
    }
}

// Exportar funções para uso global
window.progoiasNavigation = {
    goToStep,
    goToNextStep,
    goToPreviousStep,
    currentStep: () => currentStep,
    totalSteps: () => totalSteps,
    autoSaveData,
    collectFormData,
    checkAnalystAccess
};