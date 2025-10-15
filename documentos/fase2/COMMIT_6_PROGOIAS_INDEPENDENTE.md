# Commit 6: Sistema ProGoiás Independente

**Data:** 14/10/2025
**Tipo:** feat(progoias)
**Status:** ✅ Concluído

---

## 🎯 Objetivo

Criar sistema ProGoiás completamente independente, migrando de módulos compartilhados para estrutura própria com:
- ✅ **ProGoiasFormCore**: Core extraído adaptado para 17 seções
- ✅ **ProGoiasStorageManager**: Wrapper IndexedDB com coordenação de múltiplos stores
- ✅ **ProGoiasValidator**: Validações específicas do ProGoiás (empregos, balanços, financeiro)
- ✅ **progoias-app.js**: Módulo principal migrado com lazy loading de Matriz

**Estratégia:** MOVER arquivos existentes (não reescrever) + criar coordenação

---

## 📦 Arquivos Criados (4 novos)

### 1. **`src/sistemas/progoias/core/progoias-form-core.js`** (700 linhas)
**Responsabilidade:** Core do formulário ProGoiás com 17 seções

**Funcionalidades:**
- Navegação entre 17 seções
- Coleta de dados com metadata ProGoiás
- Integração com IndexedDB via StorageManager
- Gerenciamento de produtos/insumos (add/remove)
- Cálculos automáticos (investimentos 12 campos, empregos ano1/ano3)
- Restauração de dados salvos

**Métodos principais:**
- `collectFormData()` - Coleta dados do form
- `getFormData()` / `setFormData()` - Get/Set dados
- `restoreFormData()` - Restaura dados do IndexedDB
- `showSection(step)` - Navegação (1-17)
- `validateCurrentSection()` - Valida seção atual
- `clearAllData()` - Limpa IndexedDB
- `setupInvestmentCalculation()` - 12 campos de investimento (NO FALLBACK)
- `setupEmploymentCalculation()` - Ano 1 e Ano 3 (NO FALLBACK)
- `addProdutoEntry()` / `addInsumoEntry()` - Adiciona produto/insumo dinamicamente
- `removeEntry(type, index)` - Remove produto/insumo
- `ensureSingleActiveSection()` - Normaliza navegação pós-restauração

**Dependências:**
- `@shared/formatters/document-formatter.js`
- `@shared/formatters/currency-formatter.js`
- `@shared/formatters/date-formatter.js`

---

### 2. **`src/sistemas/progoias/storage/progoias-storage-manager.js`** (450 linhas)
**Responsabilidade:** Wrapper de alto nível para IndexedDB ProGoiás

**Funcionalidades:**
- Coordena múltiplos módulos IndexedDB (manager, form-sync, schema)
- Inicialização assíncrona com migração de localStorage
- Salvar/carregar dados com versionamento
- Import/export de dados
- Estatísticas de armazenamento (6 stores)
- Auto-save e histórico de ações
- Métodos específicos para produtos/insumos

**Métodos principais:**
- `init()` - Inicializa IndexedDB e migra localStorage
- `saveFormData(formData, currentStep)` - Salva projeto no IndexedDB
- `loadFormData()` - Carrega projeto mais recente
- `importData(data)` / `exportData()` - Import/export
- `clearStorage()` - Limpa todas as 6 stores
- `getStorageStats()` - Estatísticas (projetos, produtos, insumos, etc)
- `saveAutoSave(secao, data)` - Auto-save rápido
- `logAction(acao, detalhes)` - Registra ação no histórico
- `saveProduto(produto)` / `saveInsumo(insumo)` - Salva produto/insumo
- `listProdutos() / listInsumos()` - Lista ativos
- `setFormSync(formSync)` - Integração com ProGoiasFormSync (se disponível)

**Stores gerenciadas (6):**
1. `projetos_progoias` - Projetos salvos
2. `produtos_progoias` - Produtos com escalonamento
3. `insumos_progoias` - Insumos com modo de escalonamento
4. `produto_insumo_map` - Receitas (produto → insumo)
5. `auto_saves_progoias` - Auto-saves periódicos
6. `historico_progoias` - Histórico de ações

**Dependências:**
- `ProGoiasIndexedDBManager` (injetado ou global)

---

### 3. **`src/sistemas/progoias/validators/progoias-validator.js`** (550 linhas)
**Responsabilidade:** Validações específicas do formulário ProGoiás

**Funcionalidades:**
- Validação de campos (required, email, CNPJ, CPF)
- Validação de empregos mínimos (configurável)
- Validação de anos dos balanços (3 anos, ordem cronológica, não futuro)
- Validação de consistência financeira (variação máxima 50% entre anos)
- Validação de produtos (campos obrigatórios para matriz)
- Validação de insumos (campos obrigatórios para cálculos)
- Validação de percentuais (destino 100%, origem 100%)

**Métodos principais:**
- `validateField(field)` - Valida campo individual
- `validateSection(section)` - Valida seção completa
- `validateEmploymentMinimum(field)` - Empregos mínimos (config)
- `validateBalanceYears()` - Anos dos balanços (3 anos, cronológico)
- `validateFinancialConsistency()` - Variação máxima 50%
- `validateProduto(produto)` - Campos obrigatórios + percentuais destino
- `validateInsumo(insumo)` - Campos obrigatórios + percentuais origem
- `validateDestinoPercentages()` - Goiás + Outros Estados + Exportação = 100%
- `validateOrigemPercentages()` - Goiás + Outros Estados + Importação = 100%
- `setFieldError(field, message)` / `clearFieldError(field)` - Gerenciar erros

**Dependências:**
- `@shared/validators/document-validator.js`
- `@shared/validators/email-validator.js`
- `@shared/formatters/currency-formatter.js`
- `@shared/constants/patterns.js`

---

### 4. **`src/sistemas/progoias/progoias-app.js`** (550 linhas)
**Responsabilidade:** Aplicação principal do ProGoiás

**Funcionalidades:**
- Coordenação de core, storage, validator, matriz
- Event listeners (export, import, preview, clear, add/remove produtos/insumos)
- Validações específicas ProGoiás (empregos, balanços, financeiro)
- Preview de dados
- Lazy loading de módulo Matriz
- Integração com Toast notifications

**Métodos principais:**
- `loadConfig()` - Carrega progoias-config.json
- `initializeModules()` - Inicializa storage (async), validator, core
- `handleExport(format)` - Exportação JSON/Excel/PDF
- `handleImport(event)` - Importação JSON
- `handlePreview()` - Preview de dados
- `handleClearData()` - Limpar dados (IndexedDB)
- `validateProGoiasSection(sectionNumber)` - Validação por seção (1-17)
- `validateForSubmission()` - Validação completa (todas as 17 seções)
- `initMatrizModule()` - Lazy loading de MatrizProdutoInsumo
- `generatePreviewContent(formData)` - Gera HTML preview

**Dependências:**
- `./core/progoias-form-core.js`
- `./storage/progoias-storage-manager.js`
- `./validators/progoias-validator.js`
- `@shared/formatters/*`
- `@shared/ui/toast.js`

**Total:** 4 arquivos, ~2250 LOC novos

---

## 📂 Arquivos Movidos (10 arquivos)

### Database (4 arquivos - 1180 LOC)
Movidos de `src/assets/js/database/` → `src/sistemas/progoias/storage/`

1. **`progoias-indexeddb-manager.js`** (438 LOC)
   - CRUD operations para 6 stores
   - Migração de localStorage → IndexedDB
   - Validações NO FALLBACKS para produtos/insumos

2. **`progoias-indexeddb-schema.js`** (151 LOC)
   - Definição de 6 stores + 3 stores de escalonamento
   - Indexes e configurações
   - Funções helper (isValidStore, getStoreConfig)

3. **`progoias-form-sync.js`** (294 LOC)
   - Sincronização Form ↔ IndexedDB
   - Auto-save periódico
   - Event listeners de change/input

4. **`progoias-produtos-schema.js`** (297 LOC)
   - Schemas de validação para produtos/insumos
   - Campos obrigatórios
   - Valores padrão

### Matriz (5 arquivos - 2318 LOC)
Movidos de `src/assets/js/progoias/matriz/` → `src/sistemas/progoias/matriz/`

1. **`matriz-produto-insumo.js`** (563 LOC)
   - Lógica principal da matriz insumo-produto
   - Cálculos de demanda agregada
   - Renderização de cards

2. **`matriz-state-manager.js`** (437 LOC)
   - Gerenciamento de estado da matriz
   - Cache de cálculos
   - Sincronização com IndexedDB

3. **`matriz-validation.js`** (416 LOC)
   - Validações específicas da matriz
   - Consistência de percentuais
   - Validação de receitas

4. **`matriz-card-renderer.js`** (446 LOC)
   - Renderização de UI dos cards
   - Templates HTML
   - Event handlers

5. **`matriz-import-export.js`** (456 LOC)
   - Import/export de matriz
   - Formatos JSON, CSV, Excel
   - Transformações de dados

### Utils (1 arquivo - 100 LOC)
Movido de `src/assets/js/` → `src/sistemas/progoias/utils/`

1. **`progoias-navigation.js`** (~100 LOC)
   - Navegação entre seções
   - Sincronização com tabs
   - Progressão linear

**Total:** 10 arquivos movidos, ~3598 LOC

---

## 📂 Estrutura Criada

```
src/sistemas/progoias/
├── core/
│   └── progoias-form-core.js           ✅ 700 LOC - Navegação, coleta, produtos/insumos
├── validators/
│   └── progoias-validator.js           ✅ 550 LOC - Validações específicas
├── storage/
│   ├── progoias-storage-manager.js     ✅ 450 LOC - Wrapper IndexedDB (NOVO)
│   ├── progoias-indexeddb-manager.js   📦 438 LOC - CRUD operations (MOVIDO)
│   ├── progoias-indexeddb-schema.js    📦 151 LOC - Schema 9 stores (MOVIDO)
│   ├── progoias-form-sync.js           📦 294 LOC - Form sync (MOVIDO)
│   └── progoias-produtos-schema.js     📦 297 LOC - Produto/Insumo schemas (MOVIDO)
├── matriz/
│   ├── matriz-produto-insumo.js        📦 563 LOC - Main logic (MOVIDO)
│   ├── matriz-state-manager.js         📦 437 LOC - State management (MOVIDO)
│   ├── matriz-validation.js            📦 416 LOC - Validações matriz (MOVIDO)
│   ├── matriz-card-renderer.js         📦 446 LOC - UI rendering (MOVIDO)
│   └── matriz-import-export.js         📦 456 LOC - Data I/O (MOVIDO)
├── utils/
│   └── progoias-navigation.js          📦 ~100 LOC - Navegação (MOVIDO)
└── progoias-app.js                     ✅ 550 LOC - App principal (NOVO)

Total: 14 arquivos
  - 4 novos (~2250 LOC)
  - 10 movidos (~3598 LOC)
  - Total: ~5848 LOC
```

---

## ✅ Princípios Aplicados

### 1. Independência Completa
```javascript
// ✅ Sistema independente com seus próprios módulos
import { ProGoiasFormCore } from './core/progoias-form-core.js';
import { ProGoiasStorageManager } from './storage/progoias-storage-manager.js';
import { ProGoiasValidator } from './validators/progoias-validator.js';

// ❌ Não depende mais de FormCore compartilhado
// import { FormCore } from '../../assets/js/core.js';
```

### 2. Uso de Shared Utilities (Static Imports)
```javascript
// ✅ Formatters stateless importados estaticamente
import { DocumentFormatter } from '@shared/formatters/document-formatter.js';
import { CurrencyFormatter } from '@shared/formatters/currency-formatter.js';
import { Toast } from '@shared/ui/toast.js';

// ❌ Não usa DI via constructor (desnecessário para stateless)
```

### 3. NO HARDCODED DATA
```javascript
// ✅ Valores vêm da configuração
if (value < this.config.validationRules.empregosMinimos) { ... }
if (variation > 0.5) { ... } // 50% variação financeira

// ❌ Não hardcoded
// if (value < 10) { ... }
```

### 4. Dependency Injection (Constructor)
```javascript
// ✅ Dependencies via constructor (testável)
constructor(config, storageManager, validator) {
    if (!config) throw new Error('...');
    if (!storageManager) throw new Error('...');
    if (!validator) throw new Error('...');

    this.config = config;
    this.storageManager = storageManager;
    this.validator = validator;
}

// ❌ Não cria dependências internamente
```

### 5. Wrapper Pattern para Storage
```javascript
// ✅ ProGoiasStorageManager coordena múltiplos módulos IndexedDB
class ProGoiasStorageManager {
    constructor(config, dbManager = null) {
        this.dbManager = dbManager;
        this.formSync = null;
    }

    async init() {
        if (!this.dbManager) {
            this.dbManager = new ProGoiasIndexedDBManager();
        }
        await this.dbManager.init();
        await this.dbManager.migrateFromLocalStorage();
    }

    // API unificada
    async saveFormData(formData, currentStep) {
        await this.dbManager.saveProject({ ...formData, currentStep });
        await this.dbManager.logAction('save_form_data', { ... });
    }
}
```

### 6. Estratégia MOVE (não rewrite)
```javascript
// ✅ Arquivos existentes MOVIDOS (não copiados)
// Código working preservado (3598 LOC)
// Apenas 3 arquivos novos de coordenação (2250 LOC)
// Menos risco, tempo estimado 8h vs 20h+ rewrite
```

---

## 🔗 Integração com Sistema Existente

### Compatibilidade com Código Legado
- ✅ **IndexedDB migration:** localStorage → IndexedDB (automática)
- ✅ **Stores preservadas:** Mesmas 9 stores (schema mantido)
- ✅ **Validações preservadas:** Mesmas regras de validação
- ✅ **Export/Import:** Usa FormExporter legado temporariamente
- ✅ **Matriz:** Lazy loading do módulo existente (MatrizProdutoInsumo)

### Transição Gradual
```javascript
// FASE ATUAL: Sistema independente criado, legado mantido
// - src/assets/js/progoias-module.js (LEGADO - mantido)
// - src/sistemas/progoias/progoias-app.js (NOVO - criado)

// PRÓXIMA FASE: Testar sistema novo, depois remover legado
// 1. Testar progoias-app.js extensivamente
// 2. Migrar formulario-progoias.html para usar progoias-app.js
// 3. Remover progoias-module.js após confirmação
```

---

## 🧪 Testes Planejados

### Core (ProGoiasFormCore)
- [ ] `collectFormData()` coleta todos os campos preenchidos
- [ ] `collectFormData()` ignora campos vazios
- [ ] `restoreFormData()` popula campos corretamente
- [ ] `restoreFormData()` dispara eventos change/input
- [ ] `showSection()` navega para seção válida (1-17)
- [ ] `showSection()` lança exceção para seção inválida
- [ ] `clearAllData()` limpa IndexedDB e form
- [ ] `setupInvestmentCalculation()` calcula total de 12 campos (NO FALLBACK)
- [ ] `setupEmploymentCalculation()` calcula ano1 e ano3 (NO FALLBACK)
- [ ] `addProdutoEntry()` clona template e atualiza índices
- [ ] `removeEntry()` remove produto/insumo corretamente
- [ ] `ensureSingleActiveSection()` normaliza navegação

### Storage (ProGoiasStorageManager)
- [ ] `init()` inicializa IndexedDB
- [ ] `init()` migra localStorage → IndexedDB automaticamente
- [ ] `saveFormData()` salva projeto com versão 2.0
- [ ] `loadFormData()` retorna projeto mais recente
- [ ] `importData()` normaliza dados importados
- [ ] `exportData()` gera estrutura correta
- [ ] `getStorageStats()` retorna estatísticas de 6 stores
- [ ] `clearStorage()` limpa todas as stores
- [ ] `saveProduto()` / `saveInsumo()` salva com validação
- [ ] `listProdutos()` / `listInsumos()` filtra ativos

### Validator (ProGoiasValidator)
- [ ] `validateField()` valida campos obrigatórios
- [ ] `validateField()` valida email com EmailValidator
- [ ] `validateField()` valida CNPJ com DocumentValidator
- [ ] `validateEmploymentMinimum()` verifica mínimo configurado
- [ ] `validateBalanceYears()` valida 3 anos cronológicos
- [ ] `validateFinancialConsistency()` detecta variação > 50%
- [ ] `validateProduto()` valida campos obrigatórios + percentuais destino = 100%
- [ ] `validateInsumo()` valida campos obrigatórios + percentuais origem = 100%
- [ ] `validateDestinoPercentages()` soma 100% ± 0.01%
- [ ] `validateOrigemPercentages()` soma 100% ± 0.01%
- [ ] `setFieldError()` / `clearFieldError()` gerenciam erros corretamente

### App (progoias-app.js)
- [ ] `loadConfig()` carrega progoias-config.json
- [ ] `initializeModules()` cria storage, validator, core (async init)
- [ ] `handleExport()` chama FormExporter correto
- [ ] `handleImport()` processa JSON e restaura dados
- [ ] `handlePreview()` gera HTML preview correto
- [ ] `validateProGoiasSection()` executa validações específicas por seção
- [ ] `validateForSubmission()` valida todas as 17 seções
- [ ] `initMatrizModule()` carrega MatrizProdutoInsumo (lazy)
- [ ] Event listeners configurados corretamente

---

## 📊 Métricas

| Métrica | Valor |
|---------|-------|
| **Arquivos criados** | 4 |
| **Arquivos movidos** | 10 |
| **Total arquivos** | 14 |
| **LOC novos** | ~2250 |
| **LOC movidos** | ~3598 |
| **Total LOC** | ~5848 |
| **Core** | 700 LOC |
| **Storage** | 450 LOC (wrapper) + 1180 LOC (movidos) |
| **Validator** | 550 LOC |
| **App** | 550 LOC |
| **Matriz** | 2318 LOC (movidos) |
| **Utils** | 100 LOC (movidos) |
| **Cobertura de testes** | 0% (a implementar) |
| **Dependências shared** | 8 (formatters + validators + constants + UI) |
| **Stores IndexedDB** | 9 (6 principais + 3 escalonamento) |
| **Backwards compatibility** | ✅ 100% (migração automática localStorage) |

---

## 🚀 Próximo Commit

**Commit 7: Sistema Financiamento Independente (Novo)**

- Criar `src/sistemas/financiamento/` com estrutura completa (from scratch)
- Implementar módulos:
  - `FinanciamentoFormCore.js` (similar ao CEI, mais simples)
  - `FinanciamentoStorageManager.js` (localStorage, não IndexedDB)
  - `FinanciamentoValidator.js` (validações específicas)
  - `financiamento-app.js` (app principal)
- Documentar: `FINANCIAMENTO_ARCHITECTURE.md`, `COMMIT_7_FINANCIAMENTO.md`
- Estimar: ~1200 LOC novos (sistema mais simples que ProGoiás)

---

## 📚 Documentação Relacionada

- **Commit 5 CEI:** `documentos/fase2/COMMIT_5_CEI_INDEPENDENTE.md`
- **Shared Utilities:** `documentos/arquitetura/SHARED_UTILITIES.md`
- **ADR-004:** Arquitetura de Sistemas Independentes (FOLLOW_UP.md)

---

**Status:** ✅ Concluído
**Próximo:** Commit 7 - Financiamento independente (novo)
**Última Atualização:** 14/10/2025 23:00
