# Roadmap de Implementação - Sistema FCO

**Data:** 2025-10-16
**Versão:** 1.0
**Status:** Documentação Pré-Implementação
**Esforço Total:** 90 horas (2-3 semanas full-time)

---

## 📋 Sumário Executivo

Este documento detalha o roadmap de implementação do Sistema FCO completo em **4 sprints sequenciais**, totalizando **90 horas** de desenvolvimento.

**Estratégia:**
- **Sprint 1:** Core Components (20h) - Componentes reutilizáveis base
- **Sprint 2:** RESPONDENTE Sections (30h) - Seções de input manual
- **Sprint 3:** Import/Export & Integration (25h) - Sistema completo de I/O
- **Sprint 4:** Testing & Polish (15h) - Testes e finalização

**Entregas por Sprint:**
- Sprint 1: DynamicTable + 4 componentes auxiliares
- Sprint 2: 7 seções com tabelas dinâmicas funcionais
- Sprint 3: Import/Export JSON/Excel/PDF + integrações
- Sprint 4: Sistema 100% testado e documentado

---

## 🎯 Sprint 1: Core Components (20 horas)

### Objetivos
Criar biblioteca de componentes reutilizáveis que serão utilizados em todas as seções.

**Deliverables:**
- ✅ DynamicTable component (componente mais crítico)
- ✅ CurrencyInput component
- ✅ PercentageInput component
- ✅ DatePicker component
- ✅ IndexedDB schema completo
- ✅ Unit tests para todos os componentes

---

### Task 1.1: Criar DynamicTable Component ⚠️ CRÍTICO
**Esforço:** 8 horas
**Prioridade:** CRÍTICA
**Arquivo:** `/src/assets/js/components/dynamic-table.js`

**Descrição:**
Implementar componente DynamicTable completo conforme especificação em MODULOS_JS.md.

**Subtarefas:**
1. **Estrutura base da classe (1h)**
   - Constructor com validações
   - Properties (tableId, columns, rows, listeners, etc)
   - Métodos públicos (init, addRow, removeRow, validate, etc)

2. **Rendering system (2h)**
   - `renderStructure()`: Header + Body + Footer
   - `renderRow()`: Renderizar linha individual
   - Support para diferentes tipos de input (text, number, currency, select, date, textarea)
   - Aplicar máscaras (currency, percentage)

3. **Event handling (1.5h)**
   - Delegated events (input, blur, click)
   - `handleInputChange()`: Atualizar dados + recalcular
   - `handleInputBlur()`: Validação de campo
   - Botões add/remove/clone row

4. **Cálculos e validações (1.5h)**
   - `recalculateRow()`: Campos calculados (fórmulas)
   - `updateTotalizers()`: Totais por coluna
   - `validate()`: Validação completa da tabela
   - `evaluateFormula()`: Parser de expressões simples

5. **Persistência IndexedDB (1h)**
   - `persistToIndexedDB()`: Salvar dados
   - `loadFromIndexedDB()`: Carregar dados salvos
   - `toJSON()`: Export para objeto
   - `fromJSON()`: Import de objeto

6. **Event system (0.5h)**
   - `on()`: Registrar listeners
   - `dispatchEvent()`: Disparar eventos
   - Support para: onChange, onValidate, onError, onRowAdded, onRowRemoved

7. **Utilities (0.5h)**
   - `formatCurrency()`, `generateUUID()`
   - `applyMasks()`: Máscaras de input
   - `destroy()`: Cleanup

**Acceptance Criteria:**
- ✅ Pode adicionar/remover linhas dinamicamente
- ✅ Validação de campos funciona (required, min, max, custom)
- ✅ Totalizadores atualizam automaticamente
- ✅ Campos calculados recalculam corretamente
- ✅ Persiste e carrega de IndexedDB
- ✅ Export/Import JSON funciona
- ✅ Event system notifica listeners
- ✅ Suporta 7+ tipos de input (text, number, currency, percentage, select, date, textarea)

**Testing:**
```javascript
// Test: Add row
const table = new DynamicTable(config);
const rowId = table.addRow({ campo1: 'valor1', campo2: 100 });
assert(table.rows.length === 1);

// Test: Remove row
table.removeRow(rowId);
assert(table.rows.length === 0);

// Test: Validate
table.addRow({ campo1: '', campo2: -10 }); // Invalid
const validation = table.validate();
assert(validation.valid === false);
assert(validation.errors.length > 0);

// Test: Totalizers
table.addRow({ valor: 100 });
table.addRow({ valor: 200 });
const totals = table.getTotalizers();
assert(totals.valor === 300);

// Test: toJSON/fromJSON
const json = table.toJSON();
const newTable = new DynamicTable(config);
newTable.fromJSON(json);
assert(newTable.rows.length === 2);
```

**Dependencies:** Nenhuma (componente base)

---

### Task 1.2: Criar CurrencyInput Component
**Esforço:** 3 horas
**Prioridade:** ALTA
**Arquivo:** `/src/assets/js/components/currency-input.js`

**Descrição:**
Componente para input de valores monetários com máscara R$ X.XXX.XXX,XX.

**Funcionalidades:**
- Máscara automática ao digitar
- Parsing: string → number
- Formatting: number → string (R$ X.XXX,XX)
- Validação: apenas números e vírgula/ponto
- Suporte a valores negativos (opcional)

**Implementação:**
```javascript
class CurrencyInput {
  constructor(inputElement, options = {}) {
    this.input = inputElement;
    this.options = {
      allowNegative: options.allowNegative || false,
      min: options.min || null,
      max: options.max || null
    };
    this.init();
  }

  init() {
    this.input.addEventListener('input', (e) => this.handleInput(e));
    this.input.addEventListener('blur', (e) => this.handleBlur(e));

    // Formatar valor inicial
    if (this.input.value) {
      this.format();
    }
  }

  handleInput(e) {
    // Remover não-dígitos (exceto vírgula/ponto)
    let value = e.target.value.replace(/[^\d,.-]/g, '');

    // Aplicar máscara
    this.input.value = this.applyMask(value);
  }

  handleBlur(e) {
    this.format();
    this.validate();
  }

  applyMask(value) {
    // Remover separadores existentes
    let numbers = value.replace(/[^\d]/g, '');

    if (!numbers) return '';

    // Converter para número (centavos)
    const cents = parseInt(numbers, 10);

    // Formatar: dividir por 100 para obter valor real
    const amount = cents / 100;

    return amount.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  format() {
    const value = this.getValue();
    this.input.value = this.formatValue(value);
  }

  formatValue(value) {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  }

  getValue() {
    const text = this.input.value.replace(/[^\d,.-]/g, '');
    const normalized = text.replace('.', '').replace(',', '.');
    return parseFloat(normalized) || 0;
  }

  setValue(value) {
    this.input.value = this.formatValue(value);
  }

  validate() {
    const value = this.getValue();

    if (this.options.min !== null && value < this.options.min) {
      this.input.classList.add('error');
      return false;
    }

    if (this.options.max !== null && value > this.options.max) {
      this.input.classList.add('error');
      return false;
    }

    this.input.classList.remove('error');
    return true;
  }

  destroy() {
    // Remove event listeners
  }
}

// Usage
document.querySelectorAll('.currency-input').forEach(input => {
  new CurrencyInput(input, { min: 0, max: 999999999 });
});
```

**Acceptance Criteria:**
- ✅ Máscara R$ aplica automaticamente
- ✅ Aceita apenas números
- ✅ Parse retorna número correto
- ✅ Format exibe valor com R$ X.XXX,XX
- ✅ Validação min/max funciona

**Dependencies:** Nenhuma

---

### Task 1.3: Criar PercentageInput Component
**Esforço:** 2 horas
**Prioridade:** ALTA
**Arquivo:** `/src/assets/js/components/percentage-input.js`

**Descrição:**
Componente para input de percentuais com máscara XX,XX%.

**Funcionalidades:**
- Máscara automática (0-100%)
- Validação de faixa (0-100 ou customizável)
- Parsing/formatting

**Implementação:**
Similar ao CurrencyInput, mas com lógica de percentual.

**Acceptance Criteria:**
- ✅ Máscara XX,XX% aplica automaticamente
- ✅ Validação 0-100% funciona
- ✅ Parse/format corretos

**Dependencies:** Nenhuma

---

### Task 1.4: Criar DatePicker Component
**Esforço:** 2 horas
**Prioridade:** MÉDIA
**Arquivo:** `/src/assets/js/components/date-picker.js`

**Descrição:**
Componente para seleção de datas com validações.

**Funcionalidades:**
- Usar input type="date" nativo (HTML5)
- Validações: min, max, required
- Formatação DD/MM/YYYY para exibição

**Acceptance Criteria:**
- ✅ Input date nativo funciona
- ✅ Validações min/max funcionam
- ✅ Formatação BR correta

**Dependencies:** Nenhuma

---

### Task 1.5: Criar IndexedDB Schema Completo
**Esforço:** 3 horas
**Prioridade:** CRÍTICA
**Arquivo:** `/src/assets/js/database/financiamento-indexeddb-schema.js`

**Descrição:**
Definir schema completo do IndexedDB para o sistema FCO.

**Object Stores:**
1. **formulario** - Dados de campos simples (Seções 1, 2, 3, etc)
2. **dynamicTables** - Dados das 126 tabelas dinâmicas
3. **autosave** - Backup temporário (auto-save 30s)
4. **calculatedResults** - Cache de resultados calculados (DRE, Fluxo de Caixa, etc)

**Schema:**
```javascript
const DB_NAME = 'expertzy_financiamento';
const DB_VERSION = 1;

function createIndexedDBSchema(db) {
  // Store 1: formulario
  if (!db.objectStoreNames.contains('formulario')) {
    const store = db.createObjectStore('formulario', { keyPath: 'id' });
    store.createIndex('timestamp', 'timestamp', { unique: false });
    store.createIndex('sectionId', 'sectionId', { unique: false });
  }

  // Store 2: dynamicTables (126 tabelas)
  if (!db.objectStoreNames.contains('dynamicTables')) {
    const store = db.createObjectStore('dynamicTables', { keyPath: 'id' });
    store.createIndex('timestamp', 'timestamp', { unique: false });
    store.createIndex('sectionId', 'sectionId', { unique: false });
    store.createIndex('tableId', 'tableId', { unique: false });
  }

  // Store 3: autosave
  if (!db.objectStoreNames.contains('autosave')) {
    const store = db.createObjectStore('autosave', { keyPath: 'id' });
    store.createIndex('timestamp', 'timestamp', { unique: false });
  }

  // Store 4: calculatedResults
  if (!db.objectStoreNames.contains('calculatedResults')) {
    const store = db.createObjectStore('calculatedResults', { keyPath: 'id' });
    store.createIndex('timestamp', 'timestamp', { unique: false });
    store.createIndex('calculatorType', 'calculatorType', { unique: false });
  }
}

// Funções de acesso
async function saveToIndexedDB(storeName, data) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onsuccess = (e) => {
      const db = e.target.result;
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const putRequest = store.put(data);

      putRequest.onsuccess = () => resolve();
      putRequest.onerror = () => reject(new Error('Erro ao salvar'));
    };

    request.onerror = () => reject(new Error('Erro ao abrir IndexedDB'));
  });
}

async function loadFromIndexedDB(storeName, id) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onsuccess = (e) => {
      const db = e.target.result;
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const getRequest = store.get(id);

      getRequest.onsuccess = () => {
        if (getRequest.result) {
          resolve(getRequest.result);
        } else {
          reject(new Error('Dados não encontrados'));
        }
      };

      getRequest.onerror = () => reject(new Error('Erro ao carregar'));
    };

    request.onerror = () => reject(new Error('Erro ao abrir IndexedDB'));
  });
}
```

**Acceptance Criteria:**
- ✅ IndexedDB abre corretamente
- ✅ 4 object stores criadas
- ✅ Indexes funcionam
- ✅ CRUD operations funcionam
- ✅ Não perde dados após refresh

**Dependencies:** Nenhuma

---

### Task 1.6: Unit Tests para Componentes
**Esforço:** 2 horas
**Prioridade:** ALTA
**Arquivo:** `/tests/components/`

**Descrição:**
Criar suite de testes unitários para todos os componentes criados.

**Framework:** Jest ou Mocha + Chai

**Tests a criar:**
- `dynamic-table.test.js` (15 tests)
- `currency-input.test.js` (5 tests)
- `percentage-input.test.js` (5 tests)
- `date-picker.test.js` (3 tests)
- `indexeddb-schema.test.js` (8 tests)

**Exemplo:**
```javascript
// dynamic-table.test.js
describe('DynamicTable', () => {
  let table;

  beforeEach(() => {
    table = new DynamicTable({
      tableId: 'test_table',
      sectionId: 'test_section',
      columns: [
        { id: 'nome', label: 'Nome', type: 'text', required: true },
        { id: 'valor', label: 'Valor', type: 'currency', required: true }
      ],
      totalizers: ['valor']
    });
  });

  test('should add row correctly', () => {
    const rowId = table.addRow({ nome: 'Test', valor: 100 });
    expect(table.rows.length).toBe(1);
    expect(table.rows[0].id).toBe(rowId);
  });

  test('should remove row correctly', () => {
    const rowId = table.addRow({ nome: 'Test', valor: 100 });
    table.removeRow(rowId);
    expect(table.rows.length).toBe(0);
  });

  test('should validate required fields', () => {
    table.addRow({ nome: '', valor: 100 });
    const validation = table.validate();
    expect(validation.valid).toBe(false);
    expect(validation.errors.length).toBeGreaterThan(0);
  });

  test('should calculate totalizers correctly', () => {
    table.addRow({ nome: 'Item 1', valor: 100 });
    table.addRow({ nome: 'Item 2', valor: 200 });
    const totals = table.getTotalizers();
    expect(totals.valor).toBe(300);
  });

  // ... mais 11 tests
});
```

**Acceptance Criteria:**
- ✅ 36+ testes passam
- ✅ Coverage > 80%
- ✅ Testes rodam em < 5s

**Dependencies:** Tasks 1.1-1.5

---

### Sprint 1 Summary

**Total Effort:** 20 horas

**Deliverables:**
- ✅ DynamicTable component (8h)
- ✅ CurrencyInput component (3h)
- ✅ PercentageInput component (2h)
- ✅ DatePicker component (2h)
- ✅ IndexedDB schema (3h)
- ✅ Unit tests (2h)

**Acceptance Criteria - Sprint 1:**
- ✅ Todos os componentes funcionam standalone
- ✅ 36+ testes unitários passam
- ✅ IndexedDB persiste/carrega dados corretamente
- ✅ DynamicTable pode ser instanciado com diferentes configs
- ✅ Componentes podem ser reutilizados em qualquer seção

---

## 🎯 Sprint 2: RESPONDENTE Sections (30 horas)

### Objetivos
Implementar 7 seções RESPONDENTE prioritárias com tabelas dinâmicas funcionais.

**Deliverables:**
- ✅ Seção 1: Identificação (expandida - 345 campos)
- ✅ Seção 4A: ORÇAMENTO (296 campos + DynamicTable)
- ✅ Seção 4B: USOS E FONTES (690 campos + 2× DynamicTable) **CRÍTICO**
- ✅ Seção 4C: RECEITAS (555 campos + DynamicTable)
- ✅ Seção 5A: INSUMOS (67 campos + DynamicTable)
- ✅ Seção 5B: CUSTOS (276 campos + DynamicTable)
- ✅ Seção 5C: MÃO-DE-OBRA (778 campos + DynamicTable)

---

### Task 2.1: Expandir Seção 1 (Identificação)
**Esforço:** 2 horas
**Prioridade:** ALTA
**Arquivos:** `/src/pages/formulario-financiamento.html`, `/src/assets/js/financiamento/financiamento-module.js`
**Status:** 🔄 **EM ANDAMENTO** (60% completo)

**Descrição:**
Expandir Seção 1 de 14 campos base para 62+ campos em 5 etapas incrementais.

**Progresso por Etapa:**

#### Etapa 2.1.1: Caracterização Jurídica ✅ COMPLETO
**Campos adicionados:** 5 campos (linhas 213-254 HTML)
- `tipoSocietario` - Tipo Societário (LTDA, S/A, MEI, EIRELI, EI)
- `capitalSocial` - Capital Social (R$) com máscara currency
- `numeroSocios` - Número de Sócios
- `dataUltimaAlteracao` - Data da Última Alteração Contratual
- `enquadramentoFiscal` - Enquadramento Fiscal (Simples, Presumido, Real)

**Implementação:**
- ✅ HTML: linhas 213-254 (`formulario-financiamento.html`)
- ✅ Data Collection: linhas 596-601 (`financiamento-module.js`)
- ✅ Data Restoration: linhas 800-805 (`financiamento-module.js`)
- ✅ Commit: 22d9581

#### Etapa 2.1.2: Histórico Operacional ✅ COMPLETO
**Campos adicionados:** 6 campos (linhas 256-291 HTML)
- `dataInicioOperacoes` - Data de Início das Operações
- `tempoMercado` - Tempo no Mercado (anos) - **CALCULADO AUTOMATICAMENTE**
- `qtdeFuncionariosAtual` - Quantidade de Funcionários Atual
- `capacidadeProdutivaAtual` - Capacidade Produtiva Atual
- `certificacoesAtuais` - Certificações Atuais
- `principaisProdutosServicos` - Principais Produtos/Serviços

**Implementação:**
- ✅ HTML: linhas 256-291 (`formulario-financiamento.html`)
- ✅ Data Collection: linhas 602-608 (`financiamento-module.js`)
- ✅ Data Restoration: linhas 806-816 (`financiamento-module.js`)
- ✅ Novo método: `calcularTempoMercado()` (linhas 1023-1053)
- ✅ Event listener: linhas 278-288 (auto-calcula tempo no mercado)
- ✅ **CRITICAL FIX:** Conflito de ID `dataInicioOperacoes` (Seção 1 vs Seção 7)
  - Renomeado campo Seção 7 para `dataInicioOperacoesProjeto`
  - Atualizado em HTML (linha 859-860) e JS (linhas 695, 904)
- ✅ Commits: 8c8bd75 (implementação), f611adf (fix ID conflict)

#### Etapa 2.1.3: Localização Detalhada ✅ COMPLETO
**Campos adicionados:** 8 campos (linhas 293-339 HTML)
- `cep` - CEP (padrão `\d{5}-\d{3}`)
- `logradouro` - Logradouro
- `numero` - Número
- `complemento` - Complemento
- `bairro` - Bairro
- `coordenadasGeograficas` - Coordenadas Geográficas (latitude, longitude)
- `pontoReferencia` - Ponto de Referência
- `areaTerreno` - Área do Terreno (m²)

**Implementação:**
- ✅ HTML: linhas 293-339 (`formulario-financiamento.html`)
- ✅ Data Collection: linhas 609-616 (`financiamento-module.js`)
- ✅ Data Restoration: linhas 817-824 (`financiamento-module.js`)
- ✅ Validação CEP com pattern regex
- ✅ Commit: (incluído no commit da etapa anterior)

#### Etapa 2.1.4: Contatos e Infraestrutura ⏳ PENDENTE
**Campos a adicionar:** ~15 campos estimados
- Telefones (comercial, celular, whatsapp)
- E-mails (comercial, financeiro, contabilidade)
- Website, redes sociais
- Infraestrutura (energia, água, internet)

**Esforço:** 25 minutos

#### Etapa 2.1.5: Certificações e Finalizações ⏳ PENDENTE
**Campos a adicionar:** ~15 campos estimados
- Certificações ISO, ANVISA, INMETRO
- Selos de qualidade
- Registros profissionais
- Finalizações restantes para completar 62 campos

**Esforço:** 25 minutos

**Progresso Atual:**
- ✅ Campos implementados: 33 de 62 alvo (53%)
- ✅ Etapas completas: 3 de 5 (60%)
- ✅ Commits realizados: 3 commits
- ✅ Critical issues resolvidos: 1 (ID conflict)

**Acceptance Criteria:**
- ⏳ 62+ campos renderizados (33/62 completo)
- ✅ Validações funcionam (CNPJ, email, required, pattern)
- ✅ Cálculos automáticos funcionam (`tempoMercado`)
- ✅ Auto-save persiste todos os campos
- ✅ Data pode ser importada/exportada
- ✅ Sem conflitos de IDs (fix aplicado)

**Dependencies:** Sprint 1 (IndexedDB)

---

### Task 2.2: Implementar Seção 4A (ORÇAMENTO)
**Esforço:** 4 horas
**Prioridade:** ALTA
**Arquivos:** `/src/assets/js/financiamento/secao-orcamento.js`, HTML section

**Descrição:**
Implementar SeçãoOrcamento com DynamicTable conforme especificação em MODULOS_JS.md.

**Componentes:**
- HTML: Estrutura conforme ESTRUTURA_HTML.md
- JS: `SecaoOrcamento` class
- DynamicTable config: 12 colunas (categoria, item, especificacao, quantidade, unidade, valor_unitario, valor_total, ano_desembolso, fornecedor, cnpj_fornecedor, tem_orcamento, observacoes)

**Funcionalidades:**
- Add/remove itens
- Totalizadores automáticos
- Validação vs CAPEX (warning visual)
- Integração com Event Bus: `orcamento:updated`

**Acceptance Criteria:**
- ✅ Pode adicionar/remover itens
- ✅ Valor total calcula automaticamente
- ✅ Totalizadores atualizam em tempo real
- ✅ Validação CAPEX exibe warning
- ✅ Dados persistem em IndexedDB
- ✅ Import/export funciona

**Dependencies:** Sprint 1 (DynamicTable)

---

### Task 2.3: Implementar Seção 4B (USOS E FONTES) ⚠️ CRÍTICO
**Esforço:** 6 horas
**Prioridade:** CRÍTICA
**Arquivos:** `/src/assets/js/financiamento/secao-usos-fontes.js`, HTML section

**Descrição:**
Implementar SecaoUsosFontes com 2× DynamicTable e validação de balanço.

**Componentes:**
- 2 tabelas: USOS + FONTES
- Validação CRÍTICA: `SUM(USOS) === SUM(FONTES)` (tolerância R$ 0,01)
- Indicador visual em tempo real (balanced/unbalanced)

**Validação:**
```javascript
validateBalance() {
  const totalUsos = this.tableUsos.getTotalizers().valor || 0;
  const totalFontes = this.tableFontes.getTotalizers().valor || 0;
  const balanced = Math.abs(totalUsos - totalFontes) < 0.01;

  // Atualizar UI: indicador verde/vermelho
  // Emitir evento: usosFontes:validated

  return balanced;
}
```

**Acceptance Criteria:**
- ✅ Duas tabelas funcionam independentemente
- ✅ Totais atualizam em tempo real
- ✅ Indicador de balanço verde quando USOS == FONTES
- ✅ Indicador vermelho com diferença exibida quando desbalanceado
- ✅ Evento `usosFontes:validated` emitido
- ✅ Não permite prosseguir se desbalanceado (validação no submit)
- ✅ Dados persistem em IndexedDB

**Dependencies:** Sprint 1 (DynamicTable)

---

### Task 2.4: Implementar Seção 4C (RECEITAS)
**Esforço:** 5 horas
**Prioridade:** ALTA
**Arquivos:** `/src/assets/js/financiamento/secao-receitas.js`, HTML section

**Descrição:**
Implementar SecaoReceitas com DynamicTable para produtos/serviços individuais.

**Estrutura:**
- 29 colunas: produto, NCM, unidade, preço_unitário + 12 meses (qtd + valor) + total_ano
- Scroll horizontal para ver todos os meses
- Colunas fixas: produto, NCM, unidade, preço_unitário, total_ano

**Campos Calculados:**
- `jan_valor = jan_qtd * preco_unitario`
- `fev_valor = fev_qtd * preco_unitario`
- ... (repetir para 12 meses)
- `total_ano_qtd = SUM(jan_qtd:dez_qtd)`
- `total_ano_valor = total_ano_qtd * preco_unitario`

**Integração:**
- Event `receitas:updated` → `CalculadorDREProjetado`

**Acceptance Criteria:**
- ✅ 29 colunas renderizadas
- ✅ Scroll horizontal funciona
- ✅ Colunas fixas não rolam
- ✅ Campos calculados atualizam automaticamente
- ✅ Totalizadores mensais corretos
- ✅ Integra com CalculadorDRE (evento emitido)
- ✅ Dados persistem

**Dependencies:** Sprint 1 (DynamicTable)

---

### Task 2.5: Implementar Seção 5A (INSUMOS)
**Esforço:** 3 horas
**Prioridade:** MÉDIA
**Arquivos:** `/src/assets/js/financiamento/secao-insumos.js`, HTML section

**Descrição:**
Implementar SecaoInsumos com DynamicTable para insumos/matérias-primas.

**Estrutura Similar a RECEITAS:**
- Insumo, unidade, preço_unitário, consumos mensais

**Integração:**
- Event `insumos:updated` → `CalculadorDREProjetado` (custos)

**Acceptance Criteria:**
- ✅ Add/remove insumos
- ✅ Cálculos mensais corretos
- ✅ Integra com CalculadorDRE
- ✅ Dados persistem

**Dependencies:** Sprint 1 (DynamicTable), Task 2.4 (padrão similar a RECEITAS)

---

### Task 2.6: Implementar Seção 5B (CUSTOS)
**Esforço:** 4 horas
**Prioridade:** ALTA
**Arquivos:** `/src/assets/js/financiamento/secao-custos.js`, HTML section

**Descrição:**
Implementar SecaoCustos com DynamicTable para custos operacionais.

**Categorias:**
- Energia, água, telecomunicações, manutenção, seguros, marketing, etc.

**Integração:**
- Event `custos:updated` → `CalculadorDREProjetado`

**Acceptance Criteria:**
- ✅ Add/remove custos
- ✅ Totalizadores mensais corretos
- ✅ Integra com CalculadorDRE
- ✅ Dados persistem

**Dependencies:** Sprint 1 (DynamicTable)

---

### Task 2.7: Implementar Seção 5C (MÃO-DE-OBRA)
**Esforço:** 6 horas
**Prioridade:** ALTA
**Arquivos:** `/src/assets/js/financiamento/secao-mao-obra.js`, HTML section

**Descrição:**
Implementar SecaoMaoObra com DynamicTable para empregados individuais.

**Estrutura Complexa:**
- Empregado, cargo, salário_base, 13º, férias, FGTS, INSS, encargos
- Cálculos automáticos de encargos (percentuais)

**Cálculos:**
```javascript
// Encargos patronais
const fgts = salario_base * 0.08;        // 8%
const inss_patronal = salario_base * 0.20;  // 20%
const ferias_13 = salario_base * (1/12);  // 1/12 por mês
const total_encargos = fgts + inss_patronal + ferias_13;
const custo_total_mensal = salario_base + total_encargos;
```

**Integração:**
- Event `maoObra:updated` → `CalculadorDREProjetado` (Despesas com Pessoal)

**Acceptance Criteria:**
- ✅ Add/remove empregados
- ✅ Cálculos de encargos corretos
- ✅ Total folha mensal correto
- ✅ Integra com CalculadorDRE
- ✅ Dados persistem

**Dependencies:** Sprint 1 (DynamicTable)

---

### Sprint 2 Summary

**Total Effort:** 30 horas

**Deliverables:**
- ✅ Seção 1 expandida (2h)
- ✅ Seção 4A - ORÇAMENTO (4h)
- ✅ Seção 4B - USOS E FONTES **CRÍTICO** (6h)
- ✅ Seção 4C - RECEITAS (5h)
- ✅ Seção 5A - INSUMOS (3h)
- ✅ Seção 5B - CUSTOS (4h)
- ✅ Seção 5C - MÃO-DE-OBRA (6h)

**Acceptance Criteria - Sprint 2:**
- ✅ 7 seções RESPONDENTE funcionais
- ✅ DynamicTable funciona em 8 instâncias (7 seções + 1 extra em USOS E FONTES)
- ✅ Validação USOS == FONTES funciona
- ✅ Todas as seções persistem em IndexedDB
- ✅ Auto-save funciona em todas as seções
- ✅ Eventos integram com EventBus
- ✅ Usuário pode preencher formulário completo

---

## 🎯 Sprint 3: Import/Export & Integration (25 horas)

### Objetivos
Implementar sistema completo de import/export e integrações com calculadores.

**Deliverables:**
- ✅ Import JSON com validações
- ✅ Export JSON com checksum
- ✅ Export Excel (126 tabelas)
- ✅ Export PDF profissional
- ✅ Integração com calculadores (DRE, Fluxo de Caixa, Indicadores)
- ✅ Validações cross-section
- ✅ Migration system (versões)

---

### Task 3.1: Implementar Import JSON
**Esforço:** 6 horas
**Prioridade:** CRÍTICA
**Arquivos:** `/src/assets/js/import-export/json-importer.js`

**Funcionalidades:**
1. **Validação JSON Schema** (Ajv)
2. **Checksum verification** (SHA-256)
3. **Version compatibility check**
4. **Required fields validation**
5. **Cross-section consistency validation**
6. **Apply data to form** (todas as 13+ seções)
7. **Rollback on error**

**Fluxo:**
```javascript
async function importJSON(file) {
  const snapshot = createSnapshot(); // Backup estado atual

  try {
    // 1. Parse JSON
    // 2. Validate schema
    // 3. Verify checksum
    // 4. Check version (migrate if needed)
    // 5. Validate required fields
    // 6. Validate cross-section consistency
    // 7. Apply data to form
    // 8. Persist to IndexedDB

    return { success: true, data, warnings };

  } catch (error) {
    // Rollback to snapshot
    restoreSnapshot(snapshot);

    return { success: false, errors: [error] };
  }
}
```

**Acceptance Criteria:**
- ✅ Importa JSON válido corretamente
- ✅ Valida schema e rejeita JSON inválido
- ✅ Verifica checksum e avisa se corrompido
- ✅ Detecta versão incompatível
- ✅ Valida campos obrigatórios
- ✅ Valida USOS == FONTES
- ✅ Rollback funciona em caso de erro
- ✅ Exibe relatório de erros/warnings

**Dependencies:** Sprint 2 (todas as seções)

---

### Task 3.2: Implementar Export JSON
**Esforço:** 5 horas
**Prioridade:** ALTA
**Arquivos:** `/src/assets/js/import-export/json-exporter.js`

**Funcionalidades:**
1. Coletar dados de todas as 13+ seções
2. Coletar dados de todas as 126 tabelas dinâmicas
3. Gerar metadata (version, timestamp, author)
4. Calcular checksum SHA-256
5. Gerar JSON formatado
6. Download automático

**Estrutura JSON:**
Conforme especificação em IMPORT_EXPORT_SPEC.md

**Acceptance Criteria:**
- ✅ JSON exportado é válido (schema-compliant)
- ✅ Checksum SHA-256 correto
- ✅ Todas as seções incluídas
- ✅ Todas as 126 tabelas incluídas
- ✅ Metadata completo
- ✅ Pode ser reimportado sem erros

**Dependencies:** Sprint 2

---

### Task 3.3: Implementar Export Excel
**Esforço:** 5 horas
**Prioridade:** ALTA
**Arquivos:** `/src/assets/js/import-export/excel-exporter.js`

**Biblioteca:** ExcelJS

**Funcionalidades:**
1. Criar workbook com múltiplas abas
2. Aba PROJETO (Seção 1) - 2 colunas (Campo, Valor)
3. Aba ORÇAMENTO (Seção 4A) - Tabela com totais
4. Aba USOS E FONTES (Seção 4B) - 2 tabelas lado a lado
5. Aba RECEITAS (Seção 4C) - Tabela larga (29 colunas)
6. ... (repetir para todas as seções)
7. Formatação: Headers bold, totais com background, currency formatting

**Acceptance Criteria:**
- ✅ Excel exportado abre no Excel/LibreOffice
- ✅ Todas as abas criadas (13+)
- ✅ Dados corretos em cada aba
- ✅ Formatação aplicada (bold, colors, currency)
- ✅ Totalizadores corretos

**Dependencies:** Sprint 2

---

### Task 3.4: Implementar Export PDF
**Esforço:** 4 horas
**Prioridade:** MÉDIA
**Arquivos:** `/src/assets/js/import-export/pdf-exporter.js`

**Biblioteca:** jsPDF + autoTable

**Funcionalidades:**
1. Cabeçalho profissional (logo, título, data)
2. Seção 1: Tabela com identificação
3. Seção 4A: Tabela com orçamento + totais
4. Seção 4B: Resumo USOS vs FONTES
5. ... (seções principais)
6. Paginação automática
7. Footer com numeração

**Acceptance Criteria:**
- ✅ PDF gerado corretamente
- ✅ Formatação profissional
- ✅ Dados principais incluídos
- ✅ Paginação funciona
- ✅ Tamanho < 5MB

**Dependencies:** Sprint 2

---

### Task 3.5: Integração com Calculadores
**Esforço:** 3 horas
**Prioridade:** ALTA
**Arquivos:** `/src/assets/js/financiamento/financiamento-module.js`

**Integrações a implementar:**

1. **RECEITAS → CalculadorDRE**
   ```javascript
   eventBus.on('receitas:updated', (data) => {
     calculadorDRE.setReceitas(data.totaisMensais);
     calculadorDRE.calcular();
     eventBus.emit('dre:updated', calculadorDRE.getDRE());
   });
   ```

2. **CUSTOS → CalculadorDRE**
3. **MÃO-DE-OBRA → CalculadorDRE**
4. **DRE → CalculadorFluxoCaixa**
5. **FluxoCaixa → CalculadorIndicadores**

**Acceptance Criteria:**
- ✅ Mudanças em RECEITAS atualizam DRE automaticamente
- ✅ Mudanças em CUSTOS atualizam DRE
- ✅ DRE atualizado dispara cálculo de Fluxo de Caixa
- ✅ Fluxo de Caixa atualizado calcula TIR, VPL, Payback
- ✅ Dashboards exibem valores calculados

**Dependencies:** Sprint 2, calculadores existentes

---

### Task 3.6: Validações Cross-Section
**Esforço:** 2 horas
**Prioridade:** ALTA
**Arquivos:** `/src/assets/js/validacao/cross-section-validator.js`

**Validações a implementar:**
1. **USOS == FONTES** (CRÍTICO) - já implementado na Task 2.3
2. **Orçamento vs CAPEX** - avisar se diferença > R$ 0,01
3. **Receitas Totais vs DRE** - validar consistência
4. **Mão-de-obra Total vs Despesas Pessoal DRE** - validar consistência

**Acceptance Criteria:**
- ✅ Validações executam automaticamente
- ✅ Warnings exibidos em UI
- ✅ Não bloqueia submit (apenas avisa)
- ✅ Relatório de validação disponível

**Dependencies:** Sprint 2

---

### Sprint 3 Summary

**Total Effort:** 25 horas

**Deliverables:**
- ✅ Import JSON (6h)
- ✅ Export JSON (5h)
- ✅ Export Excel (5h)
- ✅ Export PDF (4h)
- ✅ Integração calculadores (3h)
- ✅ Validações cross-section (2h)

**Acceptance Criteria - Sprint 3:**
- ✅ Usuário pode importar projeto salvo
- ✅ Usuário pode exportar para JSON/Excel/PDF
- ✅ Cálculos automáticos funcionam (DRE, Fluxo de Caixa, TIR/VPL/Payback)
- ✅ Validações alertam inconsistências
- ✅ Sistema 100% funcional

---

## 🎯 Sprint 4: Testing & Polish (15 horas)

### Objetivos
Testar exaustivamente, corrigir bugs, otimizar performance e documentar.

**Deliverables:**
- ✅ End-to-end tests (E2E)
- ✅ Bug fixes prioritários
- ✅ Performance optimization
- ✅ User documentation
- ✅ Sistema production-ready

---

### Task 4.1: End-to-End Testing
**Esforço:** 5 horas
**Prioridade:** CRÍTICA
**Framework:** Playwright ou Cypress

**Testes E2E a criar:**

1. **Test: Preenchimento completo do formulário**
   - Preencher Seção 1 (Identificação)
   - Preencher Seção 2 (Regime Tributário)
   - Preencher Seção 4A (ORÇAMENTO) - adicionar 5 itens
   - Preencher Seção 4B (USOS E FONTES) - balancear
   - Preencher Seção 4C (RECEITAS) - adicionar 3 produtos
   - Verificar auto-save funcionou
   - Verificar totalizadores corretos

2. **Test: Import/Export JSON**
   - Exportar JSON de formulário preenchido
   - Limpar formulário
   - Importar JSON exportado
   - Verificar todos os campos restaurados
   - Verificar tabelas dinâmicas restauradas

3. **Test: Validação USOS E FONTES**
   - Preencher USOS com R$ 100.000
   - Preencher FONTES com R$ 90.000
   - Verificar indicador vermelho
   - Ajustar FONTES para R$ 100.000
   - Verificar indicador verde

4. **Test: Cálculos automáticos**
   - Preencher RECEITAS
   - Verificar DRE atualiza
   - Verificar Fluxo de Caixa atualiza
   - Verificar Indicadores (TIR, VPL) calculados

5. **Test: Persistência IndexedDB**
   - Preencher formulário
   - Recarregar página
   - Verificar dados restaurados
   - Verificar popup "Deseja restaurar sessão anterior?"

**Acceptance Criteria:**
- ✅ 5 testes E2E passam
- ✅ Tempo total < 3 minutos
- ✅ Screenshots de cada etapa

**Dependencies:** Sprint 3

---

### Task 4.2: Bug Fixes Prioritários
**Esforço:** 5 horas
**Prioridade:** CRÍTICA

**Processo:**
1. Executar todos os testes E2E
2. Registrar bugs encontrados
3. Priorizar por criticidade (blocker > critical > major > minor)
4. Corrigir bugs prioritários

**Tipos de bugs esperados:**
- Campos não salvam corretamente
- Totalizadores não atualizam
- Import falha com dados específicos
- Performance lenta em tabelas grandes
- Validações não disparam

**Acceptance Criteria:**
- ✅ Todos os bugs blocker/critical corrigidos
- ✅ Bugs major corrigidos (ou ticket criado)
- ✅ Testes E2E passam após correções

**Dependencies:** Task 4.1

---

### Task 4.3: Performance Optimization
**Esforço:** 3 horas
**Prioridade:** ALTA

**Otimizações a implementar:**

1. **Debounce no auto-save** (já implementado - validar)
   - Auto-save periódico: 30s
   - Auto-save após mudança: 3s debounce

2. **Virtual Scrolling** (se necessário)
   - Implementar para tabela DÍVIDAS (2.760 campos)
   - Renderizar apenas linhas visíveis

3. **Lazy Loading de Calculadores**
   - Carregar calculadores apenas quando necessário
   - Reduzir tempo inicial de carregamento

4. **Minimização de Reflows**
   - Atualizar DOM em batch
   - Usar DocumentFragment para múltiplas inserções

**Métricas Alvo:**
- Load time inicial: < 2s
- Time to interactive: < 3s
- Auto-save lag: < 100ms
- Add row lag: < 50ms

**Acceptance Criteria:**
- ✅ Load time < 2s
- ✅ Interações sem lag perceptível
- ✅ Auto-save não trava UI

**Dependencies:** Task 4.2

---

### Task 4.4: User Documentation
**Esforço:** 2 horas
**Prioridade:** MÉDIA

**Documentação a criar:**

1. **Guia do Usuário** (`GUIA_USUARIO.md`)
   - Como preencher cada seção
   - Como usar tabelas dinâmicas (add/remove rows)
   - Como importar/exportar
   - Como validar USOS E FONTES
   - Troubleshooting comum

2. **FAQ** (`FAQ.md`)
   - Como salvar meu progresso?
   - Como restaurar sessão anterior?
   - O que fazer se USOS ≠ FONTES?
   - Como exportar para Excel?

3. **Video Tutoriais** (opcional - futuro)

**Acceptance Criteria:**
- ✅ GUIA_USUARIO.md completo
- ✅ FAQ.md com 10+ perguntas
- ✅ Screenshots ilustrativos

**Dependencies:** Task 4.3

---

### Sprint 4 Summary

**Total Effort:** 15 horas

**Deliverables:**
- ✅ E2E tests (5h)
- ✅ Bug fixes (5h)
- ✅ Performance optimization (3h)
- ✅ User documentation (2h)

**Acceptance Criteria - Sprint 4:**
- ✅ Todos os testes E2E passam
- ✅ Bugs críticos corrigidos
- ✅ Load time < 2s
- ✅ Documentação completa
- ✅ Sistema production-ready

---

## 📊 Resumo Geral

### Esforço Total por Sprint

| Sprint | Objetivo | Esforço (h) | % Total |
|--------|----------|-------------|---------|
| Sprint 1 | Core Components | 20h | 22.2% |
| Sprint 2 | RESPONDENTE Sections | 30h | 33.3% |
| Sprint 3 | Import/Export & Integration | 25h | 27.8% |
| Sprint 4 | Testing & Polish | 15h | 16.7% |
| **TOTAL** | **Sistema Completo** | **90h** | **100%** |

### Timeline Estimado

**Full-time (8h/dia):**
- Sprint 1: 2.5 dias
- Sprint 2: 3.75 dias
- Sprint 3: 3.1 dias
- Sprint 4: 1.9 dias
- **Total: 11.25 dias (~2.5 semanas)**

**Part-time (4h/dia):**
- Sprint 1: 5 dias
- Sprint 2: 7.5 dias
- Sprint 3: 6.25 dias
- Sprint 4: 3.75 dias
- **Total: 22.5 dias (~4.5 semanas)**

### Dependências entre Sprints

```
Sprint 1 (Core)
    │
    ├─→ Sprint 2 (Sections)
    │       │
    │       └─→ Sprint 3 (Import/Export)
    │               │
    │               └─→ Sprint 4 (Testing)
    │
    └─→ (Componentes reutilizados em todos os sprints)
```

### Entregas Incrementais

**Após Sprint 1:**
- ✅ Biblioteca de componentes pronta
- ✅ Pode ser usada em qualquer seção
- ✅ Testes unitários garantem qualidade

**Após Sprint 2:**
- ✅ Usuário pode preencher formulário completo
- ✅ Dados persistem localmente (IndexedDB)
- ✅ Auto-save funciona
- ✅ Validação USOS E FONTES funciona

**Após Sprint 3:**
- ✅ Usuário pode salvar projeto (export JSON)
- ✅ Usuário pode continuar projeto (import JSON)
- ✅ Usuário pode exportar relatórios (Excel, PDF)
- ✅ Cálculos automáticos funcionam

**Após Sprint 4:**
- ✅ Sistema 100% testado
- ✅ Performance otimizada
- ✅ Documentação completa
- ✅ Production-ready

---

## 📝 Próximos Passos

1. ✅ **ARQUITETURA_IMPLEMENTACAO.md criado**
2. ✅ **ESTRUTURA_HTML.md criado**
3. ✅ **MODULOS_JS.md criado**
4. ✅ **IMPORT_EXPORT_SPEC.md criado**
5. ✅ **ROADMAP_IMPLEMENTACAO.md criado**
6. ⏳ **Revisão completa da documentação** (2h)
7. ⏳ **Kickoff Sprint 1** - Criar branch `sprint1-core-components`
8. ⏳ **Implementar Task 1.1** - DynamicTable component

---

## 🎯 Acceptance Criteria - Projeto Completo

### Funcionalidades Mínimas (MVP)

- ✅ Usuário pode preencher 13+ seções do formulário
- ✅ Seções com tabelas dinâmicas funcionam (add/remove rows)
- ✅ Validação USOS == FONTES funciona (CRÍTICO)
- ✅ Auto-save persiste dados localmente (IndexedDB)
- ✅ Import JSON restaura projeto salvo
- ✅ Export JSON/Excel/PDF gera arquivos
- ✅ Cálculos automáticos funcionam (DRE, Fluxo de Caixa, Indicadores)
- ✅ Navegação entre seções funciona (TabNavigation)
- ✅ Sistema responsivo (mobile-friendly)
- ✅ Performance aceitável (load < 2s)

### Critérios de Qualidade

- ✅ 36+ testes unitários passam (Sprint 1)
- ✅ 5 testes E2E passam (Sprint 4)
- ✅ Code coverage > 80%
- ✅ Zero console errors em produção
- ✅ Funciona em Chrome, Firefox, Safari, Edge
- ✅ Documentação completa (user + developer)

### Critérios de Sucesso

- ✅ Usuário consegue completar formulário em < 2 horas
- ✅ Dados não são perdidos (auto-save + IndexedDB)
- ✅ Validações alertam erros críticos (USOS ≠ FONTES)
- ✅ Relatórios (Excel, PDF) podem ser submetidos à SECON-GO
- ✅ Sistema não trava ou fica lento

---

**Última atualização:** 2025-10-16
**Status:** Documentação completa - Pronto para iniciar implementação
**Próximo passo:** Revisão da documentação + Kickoff Sprint 1
