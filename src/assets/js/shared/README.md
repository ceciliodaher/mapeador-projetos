# DynamicTable v2.0 - Documentação Completa

**Componente reutilizável para tabelas dinâmicas com todas as funcionalidades consolidadas**

---

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Instalação](#instalação)
- [Início Rápido](#início-rápido)
- [Configuração Detalhada](#configuração-detalhada)
- [API Completa](#api-completa)
- [Exemplos de Uso](#exemplos-de-uso)
- [Migração v1 → v2](#migração-v1--v2)
- [Troubleshooting](#troubleshooting)

---

## 🎯 Visão Geral

O **DynamicTable v2.0** consolida as melhores funcionalidades de duas implementações anteriores:

- **`financiamento/DynamicTable.js`** (846 linhas): Schema externo, 11 tipos de campo, máscaras BR
- **`components/dynamic-table.js`** (1033 linhas): IndexedDB nativo, UUID, Select All, Clone, Sticky columns

### Características Principais

✅ **11 tipos de campo:** text, number, currency, percentage, date, cpf, cnpj, phone, email, boolean, list, calculated
✅ **Máscaras BR:** Currency (R$), Percentage (%), CPF, CNPJ, Phone
✅ **Persistência flexível:** IndexedDB, LocalStorage ou customizada
✅ **UUID v4** para IDs únicos
✅ **Select All, Clone Row, Delete Row**
✅ **Sticky columns** (colunas fixas)
✅ **Horizontal scroll** configurável
✅ **Campos calculados** com fórmulas
✅ **Totalizadores:** sum, average, count
✅ **Validação:** required + custom + warnings/errors
✅ **Event system:** onChange, onValidate, onError, onRowAdded, onRowRemoved
✅ **Auto-save** com debounce (300ms)
✅ **Export/Import JSON**
✅ **Schema externo** (`config/dynamic-table-defaults.json`)

---

## 📦 Instalação

### 1. Adicionar os arquivos

```bash
# Estrutura do projeto
project/
├── config/
│   └── dynamic-table-defaults.json   # Schema de defaults (obrigatório)
├── src/
│   └── assets/
│       └── js/
│           └── shared/
│               └── DynamicTable.js   # Componente v2.0
└── index.html
```

### 2. Incluir no HTML

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Minha Aplicação</title>
  <!-- Estilos básicos (opcional, pode customizar) -->
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <!-- Container da tabela -->
  <div id="minha-tabela-container"></div>

  <!-- Script do DynamicTable -->
  <script src="./src/assets/js/shared/DynamicTable.js"></script>

  <!-- Seu script -->
  <script src="app.js"></script>
</body>
</html>
```

### 3. Verificar schema defaults

O arquivo `config/dynamic-table-defaults.json` **deve existir** e estar acessível via HTTP. Se não existir, o componente lançará erro.

---

## 🚀 Início Rápido

### Exemplo Básico

```javascript
// 1. Criar instância
const tabela = new DynamicTable({
  tableId: 'produtos',
  containerId: 'minha-tabela-container',
  columns: [
    { name: 'nome', label: 'Produto', type: 'text', required: true },
    { name: 'preco', label: 'Preço', type: 'currency', includeInTotal: true },
    { name: 'qtd', label: 'Quantidade', type: 'number', includeInTotal: true }
  ],
  options: {
    minRows: 1,
    showTotal: true,
    allowDelete: true
  }
});

// 2. Inicializar
await tabela.init();

// 3. Pronto! A tabela está funcional
```

**Resultado:**

| Produto | Preço (R$) | Quantidade | Ações |
|---------|------------|------------|-------|
| _[input]_ | _[input]_ | _[input]_ | 🗑️ 📋 |
| **Total:** | **R$ 0,00** | **0** | |

---

## ⚙️ Configuração Detalhada

### Constructor Config

```javascript
const tabela = new DynamicTable({
  // ========== OBRIGATÓRIO ==========
  tableId: 'minha-tabela',           // ID único (string)
  containerId: 'container-id',       // ID do container DOM (string)
  columns: [...],                    // Array de colunas (array, não vazio)

  // ========== OPCIONAL ==========
  options: {
    minRows: 1,                      // Mínimo de linhas (default: 1)
    maxRows: 999,                    // Máximo de linhas (default: null = ilimitado)
    showTotal: false,                // Mostrar totalizadores (default: false)
    totalType: 'sum',                // Tipo de total: 'sum' | 'average' | 'count'
    allowDelete: true,               // Permitir deletar linhas (default: true)
    allowAdd: true,                  // Mostrar botão adicionar (default: true)
    striped: true,                   // Listras zebradas (default: true)
    responsive: true,                // Scroll responsivo (default: true)
    autoSave: true,                  // Auto-save automático (default: true)
    saveDelay: 3000,                 // Delay do auto-save (ms) (default: 3000)
    fixedColumns: 0                  // Número de colunas fixas (sticky) (default: 0)
  },

  persistence: {
    type: 'indexeddb',               // 'indexeddb' | 'localstorage' | 'custom'
    manager: customManager           // Manager customizado (opcional)
  },

  validations: {
    // Validações customizadas por coluna
    email: (value) => {
      const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      return { valid: isValid, error: 'E-mail inválido' };
    }
  }
});
```

---

### Definição de Colunas

```javascript
columns: [
  {
    // ========== OBRIGATÓRIO ==========
    name: 'coluna_id',              // ID da coluna (string, único)
    label: 'Nome Exibido',          // Label do header (string)
    type: 'text',                   // Tipo (ver tipos abaixo)

    // ========== OPCIONAL ==========
    required: false,                // Campo obrigatório (default: false)
    width: '200px',                 // Largura da coluna (default: auto)
    fixed: false,                   // Coluna fixa (sticky) (default: false)
    readonly: false,                // Campo somente leitura (default: false)
    disabled: false,                // Campo desabilitado (default: false)
    includeInTotal: false,          // Incluir no totalizador (default: false)
    totalType: 'sum',               // Tipo de total específico (sobrescreve options.totalType)
    placeholder: '',                // Placeholder do input (default: '')
    helpText: '',                   // Tooltip de ajuda (default: '')
    defaultValue: '',               // Valor inicial (default: '')

    // ========== ESPECÍFICOS POR TIPO ==========
    // TYPE: number
    step: 'any',                    // Step do input number (default: 'any')
    min: null,                      // Valor mínimo (default: null)
    max: null,                      // Valor máximo (default: null)

    // TYPE: currency, percentage, number
    decimalPlaces: 2,               // Casas decimais (default: 2)
    locale: 'pt-BR',                // Locale para formatação (default: 'pt-BR')
    currency: 'BRL',                // Moeda (apenas currency) (default: 'BRL')

    // TYPE: text, cpf, cnpj, phone
    maxLength: null,                // Tamanho máximo (default: null)

    // TYPE: boolean, list
    options: [],                    // Array de opções (default: [])
                                    // Formato: ['op1', 'op2'] ou [{ value: 'v1', label: 'L1' }]

    // TYPE: calculated
    calculated: true,               // Marca como calculado (readonly automático)
    formula: 'col1 * col2'          // Fórmula (ex: "quantidade * valor_unitario")
  }
]
```

---

### Tipos de Campo Disponíveis

| Tipo | HTML Input | Descrição | Máscara |
|------|------------|-----------|---------|
| `text` | `<input type="text">` | Texto livre | - |
| `textarea` | `<textarea>` | Texto multilinha | - |
| `number` | `<input type="number">` | Número | - |
| `currency` | `<input type="text">` | Moeda (R$) | ✅ R$ 1.234,56 |
| `percentage` | `<input type="text">` | Percentual | ✅ 12,34% |
| `cpf` | `<input type="text">` | CPF | ✅ 000.000.000-00 |
| `cnpj` | `<input type="text">` | CNPJ | ✅ 00.000.000/0000-00 |
| `phone` | `<input type="tel">` | Telefone | ✅ (00) 00000-0000 |
| `email` | `<input type="email">` | E-mail | - |
| `date` | `<input type="date">` | Data | - |
| `boolean` | `<select>` | Sim/Não | - |
| `list` | `<select>` | Seleção | - |
| `calculated` | `<input readonly>` | Campo calculado | - |

---

## 📚 API Completa

### Métodos Públicos

#### Inicialização

```javascript
await tabela.init()
```

Inicializa a tabela. **Deve ser chamado** após o constructor.

---

#### Manipulação de Dados

```javascript
// Adicionar linha
const rowId = tabela.addRow(data, skipPersist)
// data: objeto com valores { col1: val1, col2: val2 } (opcional)
// skipPersist: pular persistência (default: false)
// Retorna: string (UUID da linha)

// Remover linha
tabela.removeRow(rowId)
// rowId: ID da linha (string)
// Confirma antes de deletar, respeita minRows

// Clonar linha
const newRowId = tabela.cloneRow(rowId)
// rowId: ID da linha a clonar (string)
// Retorna: string (UUID da nova linha)

// Limpar tabela
tabela.clearTable()
// Remove todas as linhas, reseta rowCount

// Obter dados
const rows = tabela.getData()
// Retorna: array de objetos [{ id, col1, col2, ... }]
```

---

#### Seleção

```javascript
// Selecionar/desselecionar todas
tabela.selectAll(checked)
// checked: true para selecionar, false para desselecionar

// Obter linhas selecionadas
const selectedIds = tabela.getSelectedRows()
// Retorna: array de IDs ['uuid1', 'uuid2', ...]
```

---

#### Totalizadores

```javascript
// Atualizar totalizadores
tabela.updateTotals()
// Recalcula e atualiza totais no footer

// Obter totalizadores
const totals = tabela.getTotals()
// Retorna: { coluna1: total1, coluna2: total2, ... }
```

---

#### Validação

```javascript
// Validar tabela
const resultado = tabela.validate()
// Retorna: { valid: boolean, errors: [], warnings: [] }

// Mostrar feedback visual
tabela.showValidationFeedback(resultado)
// Aplica classes CSS .field-error e .field-warning
```

---

#### Export/Import

```javascript
// Exportar para JSON
const json = tabela.toJSON()
// Retorna: { tableId, rows, totals, metadata }

// Importar de JSON
tabela.fromJSON(jsonData)
// jsonData: objeto no formato toJSON()
```

---

#### Event Listeners

```javascript
// Registrar evento
tabela.on(eventName, callback)

// Eventos disponíveis:
tabela.on('onChange', (data) => {
  console.log('Mudança:', data);
  // data: { action: 'add'|'update'|'remove'|'import', rowId, columnName, value, ... }
});

tabela.on('onValidate', (data) => {
  console.log('Validação:', data);
  // data: { valid: boolean, errors: [], warnings: [] }
});

tabela.on('onError', (data) => {
  console.log('Erro:', data);
  // data: { errors: [], warnings: [] }
});

tabela.on('onRowAdded', (data) => {
  console.log('Linha adicionada:', data);
  // data: { rowId, data: row }
});

tabela.on('onRowRemoved', (data) => {
  console.log('Linha removida:', data);
  // data: { rowId }
});
```

---

#### Destruição

```javascript
// Destruir componente
tabela.destroy()
// Cancela debounce, limpa listeners, remove DOM
```

---

## 🎨 Exemplos de Uso

### Exemplo 1: Tabela de Produtos com Total

```javascript
const tabelaProdutos = new DynamicTable({
  tableId: 'produtos',
  containerId: 'produtos-container',
  columns: [
    { name: 'nome', label: 'Produto', type: 'text', required: true, width: '300px' },
    { name: 'categoria', label: 'Categoria', type: 'list', required: true,
      options: ['Eletrônicos', 'Roupas', 'Alimentos', 'Livros'] },
    { name: 'preco', label: 'Preço', type: 'currency', required: true, includeInTotal: true },
    { name: 'qtd', label: 'Quantidade', type: 'number', required: true, includeInTotal: true },
    { name: 'total', label: 'Total', type: 'currency', calculated: true,
      formula: 'preco * qtd', includeInTotal: true }
  ],
  options: {
    minRows: 1,
    showTotal: true,
    allowDelete: true
  }
});

await tabelaProdutos.init();
```

---

### Exemplo 2: Tabela de Contatos com Validação

```javascript
const tabelaContatos = new DynamicTable({
  tableId: 'contatos',
  containerId: 'contatos-container',
  columns: [
    { name: 'nome', label: 'Nome Completo', type: 'text', required: true },
    { name: 'email', label: 'E-mail', type: 'email', required: true },
    { name: 'telefone', label: 'Telefone', type: 'phone', required: true },
    { name: 'cpf', label: 'CPF', type: 'cpf' },
    { name: 'ativo', label: 'Ativo', type: 'boolean' }
  ],
  options: {
    minRows: 0,
    showTotal: false
  },
  validations: {
    email: (value) => {
      const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      return { valid: isValid, error: 'E-mail inválido' };
    },
    cpf: (value) => {
      const digits = value.replace(/\D/g, '');
      return {
        valid: digits.length === 11,
        error: 'CPF deve ter 11 dígitos'
      };
    }
  }
});

await tabelaContatos.init();

// Validar antes de salvar
document.getElementById('btn-salvar').addEventListener('click', () => {
  const resultado = tabelaContatos.validate();
  if (resultado.valid) {
    alert('Dados válidos!');
    const dados = tabelaContatos.getData();
    console.log('Salvando:', dados);
  } else {
    alert(`${resultado.errors.length} erro(s) encontrado(s)`);
    tabelaContatos.showValidationFeedback(resultado);
  }
});
```

---

### Exemplo 3: Tabela com IndexedDB Customizado

```javascript
// 1. Criar manager customizado
const meuIndexedDB = {
  async save(tableId, data) {
    // Sua lógica de salvar no IndexedDB
    console.log('Salvando:', tableId, data);
  },
  async load(tableId) {
    // Sua lógica de carregar do IndexedDB
    console.log('Carregando:', tableId);
    return null; // ou dados carregados
  }
};

// 2. Criar tabela
const tabela = new DynamicTable({
  tableId: 'investimentos',
  containerId: 'inv-container',
  columns: [...],
  persistence: {
    type: 'custom',
    manager: meuIndexedDB
  }
});

await tabela.init();
```

---

### Exemplo 4: Sticky Columns (Colunas Fixas)

```javascript
const tabelaFinanceira = new DynamicTable({
  tableId: 'financeira',
  containerId: 'financeira-container',
  columns: [
    { name: 'mes', label: 'Mês', type: 'text', fixed: true, width: '100px' },
    { name: 'receita', label: 'Receita', type: 'currency', includeInTotal: true },
    { name: 'despesa', label: 'Despesa', type: 'currency', includeInTotal: true },
    { name: 'lucro', label: 'Lucro', type: 'currency', calculated: true,
      formula: 'receita - despesa', includeInTotal: true }
  ],
  options: {
    fixedColumns: 1, // Primeira coluna (Mês) ficará fixa ao scrollar
    showTotal: true
  }
});

await tabelaFinanceira.init();
```

---

## 🔄 Migração v1 → v2

### Mudanças Importantes

1. **Schema Externo Obrigatório**

```javascript
// ❌ ANTES (v1): Configuração inline
const tabela = new DynamicTable({
  columns: [
    { name: 'preco', type: 'currency', locale: 'pt-BR', currency: 'BRL' }
  ]
});

// ✅ AGORA (v2): Schema externo + user config
// config/dynamic-table-defaults.json define os defaults
const tabela = new DynamicTable({
  columns: [
    { name: 'preco', type: 'currency' } // Herda locale, currency do schema
  ]
});
```

2. **Persistência Flexível**

```javascript
// ❌ ANTES (v1): Dependia de window.financiamento
if (!window.financiamento) throw new Error(...);

// ✅ AGORA (v2): Factory pattern
const tabela = new DynamicTable({
  persistence: {
    type: 'localstorage', // ou 'indexeddb', 'custom'
    manager: customManager // opcional
  }
});
```

3. **UUID v4 Automático**

```javascript
// ❌ ANTES (v1): IDs incrementais (0, 1, 2, ...)
const rowId = tabela.addRow(); // rowId = 0

// ✅ AGORA (v2): UUID v4
const rowId = tabela.addRow(); // rowId = "a1b2c3d4-..."
```

4. **Event System**

```javascript
// ❌ ANTES (v1): Custom events no DOM
tabela.container.addEventListener('dynamictable:save', (e) => {...});

// ✅ AGORA (v2): Callback pattern
tabela.on('onChange', (data) => {...});
```

---

### Guia Passo a Passo

1. **Backup do código v1**
2. **Adicionar `config/dynamic-table-defaults.json`** ao projeto
3. **Atualizar imports:**

```javascript
// ANTES
import DynamicTable from './financiamento/DynamicTable.js';

// DEPOIS
import DynamicTable from './shared/DynamicTable.js';
```

4. **Atualizar configuração:**

```javascript
// ANTES
const tabela = new DynamicTable({
  tableId: 'produtos',
  sectionId: 'secao-produtos', // ❌ Removido em v2
  columns: [...],
  validations: {...},
  totalizers: ['preco', 'qtd'] // ❌ Mudou para includeInTotal nas colunas
});

// DEPOIS
const tabela = new DynamicTable({
  tableId: 'produtos',
  containerId: 'produtos-container', // Novo
  columns: [
    { name: 'preco', type: 'currency', includeInTotal: true }, // ✅
    { name: 'qtd', type: 'number', includeInTotal: true } // ✅
  ],
  options: { showTotal: true },
  validations: {...}
});
```

5. **Migrar eventos:**

```javascript
// ANTES
tabela.container.addEventListener('dynamictable:save', (e) => {
  console.log(e.detail);
});

// DEPOIS
tabela.on('onChange', (data) => {
  console.log(data);
});
```

6. **Testar** todas as funcionalidades

---

## 🐛 Troubleshooting

### Erro: "DynamicTable: Falha ao carregar defaults"

**Causa:** Arquivo `config/dynamic-table-defaults.json` não encontrado

**Solução:**

1. Verificar se o arquivo existe em `/config/dynamic-table-defaults.json`
2. Verificar se o caminho está correto (relativo ao servidor HTTP)
3. Usar servidor HTTP local (não `file://`):

```bash
python3 -m http.server 8000
# Abrir http://localhost:8000
```

---

### Erro: "Container #xxx não encontrado"

**Causa:** Container DOM não existe quando `init()` é chamado

**Solução:**

```javascript
// ❌ ERRADO: Chamar antes do DOM carregar
const tabela = new DynamicTable({...});
await tabela.init(); // Container ainda não existe!

// ✅ CERTO: Aguardar DOM
document.addEventListener('DOMContentLoaded', async () => {
  const tabela = new DynamicTable({...});
  await tabela.init();
});
```

---

### Máscaras não aplicadas

**Causa:** Máscaras são aplicadas apenas no `blur` (quando o campo perde o foco)

**Comportamento esperado:**

1. **Focus:** Remove formatação (permite digitar)
2. **Blur:** Aplica formatação (máscara)

**Exemplo:**

```
Focus:  "1000"        (sem formatação)
Blur:   "R$ 1.000,00" (com máscara)
```

---

### Persistência não funciona

**Causa:** Manager não configurado ou tipo incorreto

**Solução:**

```javascript
// Verificar tipo de persistência
const tabela = new DynamicTable({
  persistence: {
    type: 'localstorage' // ou 'indexeddb', 'custom'
  }
});

// Para IndexedDB, fornecer manager:
const tabela = new DynamicTable({
  persistence: {
    type: 'indexeddb',
    manager: {
      async save(tableId, data) { /* seu código */ },
      async load(tableId) { /* seu código */ }
    }
  }
});
```

---

### Campos calculados não atualizam

**Causa:** Fórmula incorreta ou nomes de colunas errados

**Solução:**

```javascript
// ❌ ERRADO: Nome de coluna errado
{ name: 'total', formula: 'preco * quantidade' } // coluna "quantidade" não existe

// ✅ CERTO: Usar nomes exatos das colunas
{ name: 'total', formula: 'preco * qtd' } // colunas "preco" e "qtd" existem
```

---

## 📞 Suporte

- **Repositório:** [GitHub]
- **Documentação:** `/src/assets/js/shared/README.md`
- **Exemplos:** `/test-dynamic-table.html`
- **Issues:** [GitHub Issues]

---

## 📝 Licença

Propriedade da **Expertzy**. Todos os direitos reservados.

---

**Última atualização:** 17/10/2025
**Versão:** 2.0.0
