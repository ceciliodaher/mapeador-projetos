# 🗄️ IndexedDB Schema - Financiamento

Schema consolidado do IndexedDB para o Sistema de Análise de Viabilidade Financeira.

## 📊 Visão Geral

**Database:** `expertzy_financiamento`
**Versão:** 1
**Arquivo:** `/src/assets/js/database/financiamento-indexeddb-schema.js`
**Alinhamento:** 100% com `budget.py` (17 objetos Python → 4 stores JavaScript)

### Arquitetura

O schema consolidado organiza todos os dados em 4 object stores otimizados:

```
expertzy_financiamento (v1)
├── formulario (dados simples)
├── dynamicTables (126 tabelas)
├── autosave (backup temporário)
└── calculatedResults (cache de cálculos)
```

---

## 📁 Object Stores

### 1. `formulario`

**Propósito:** Armazenar dados de campos simples das seções 1-7

**Estrutura:**
```javascript
{
  keyPath: 'id',
  indexes: {
    timestamp: { unique: false },
    sectionId: { unique: false }
  }
}
```

**Exemplo de registro:**
```javascript
{
  id: 'secao1-dados',
  sectionId: 1,
  timestamp: '2025-10-17T10:30:00.000Z',
  razaoSocial: 'Empresa Exemplo LTDA',
  cnpj: '12.345.678/0001-90',
  inscricaoEstadual: '123456789',
  dataConstituicao: '2020-01-15',
  // ... outros campos da seção
}
```

**Alinhamento com budget.py:**
- `controle` → campos de controle do projeto
- `projeto` → informações do projeto
- `orcamento` → dados de investimento
- `tributos` → regime tributário e configurações fiscais

---

### 2. `dynamicTables`

**Propósito:** Armazenar dados das 126 tabelas dinâmicas do sistema

**Estrutura:**
```javascript
{
  keyPath: 'id',
  indexes: {
    timestamp: { unique: false },
    sectionId: { unique: false },
    tableId: { unique: true }  // ⚠️ UNIQUE
  }
}
```

**Exemplo de registro:**
```javascript
{
  id: 'table-produtos-ano1',
  tableId: 'table-produtos-ano1',  // Index UNIQUE
  sectionId: 8,
  timestamp: '2025-10-17T10:30:00.000Z',
  data: {
    columns: [
      { key: 'produto', label: 'Produto', type: 'text' },
      { key: 'quantidade', label: 'Quantidade', type: 'number' },
      { key: 'preco', label: 'Preço (R$)', type: 'currency' }
    ],
    rows: [
      { id: '1', produto: 'Produto A', quantidade: 1000, preco: 50.00 },
      { id: '2', produto: 'Produto B', quantidade: 2000, preco: 75.00 }
    ],
    totals: {
      quantidade: 3000,
      preco: 125.00
    }
  }
}
```

**126 Tabelas mapeadas:**

| Seção | Tabelas | budget.py |
|-------|---------|-----------|
| 8 | Produtos (5 anos x 12 meses) | `receitas.produtos_servicos` |
| 8 | Insumos (5 anos x 12 meses) | `insumos` |
| 8 | Mão-de-Obra (produção, admin, ensino) | `mao_obra.producao/administrativo/ensino` |
| 9 | Custos Fixos e Variáveis | `custos.fixos/variaveis` |
| 10 | Tributos (federais, estaduais, municipais) | `tributos` |
| 11 | Depreciação | `depreciacao` |
| 12 | Capital de Giro | `giro` |
| 13 | Financiamentos e Dívidas | `financiamentos`, `dividas` |

---

### 3. `autosave`

**Propósito:** Backup temporário para recuperação de sessão

**Estrutura:**
```javascript
{
  keyPath: 'id',
  indexes: {
    timestamp: { unique: false },
    type: { unique: false }  // 'full' | 'partial'
  }
}
```

**Exemplo de registro:**
```javascript
{
  id: 'autosave-current',
  type: 'full',  // 'full' ou 'partial'
  timestamp: '2025-10-17T10:30:00.000Z',
  dados: {
    secao1: { razaoSocial: 'Empresa Teste', cnpj: '...' },
    secao2: { regimeTributario: 'Simples Nacional', anoBase: 2025 },
    secao3: { receitaBrutaAno1: 500000 },
    // ... todas as seções
  }
}
```

**Tipos de autosave:**
- `'full'`: Backup completo de todas as seções
- `'partial'`: Backup parcial (apenas seções modificadas)

**Estratégia de auto-save:**
- Intervalo: 30 segundos
- Debounce: 3 segundos após última modificação
- Trigger: `beforeunload` (ao sair da página)

---

### 4. `calculatedResults`

**Propósito:** Cache de resultados de cálculos pesados (DRE, Fluxo de Caixa, Indicadores)

**Estrutura:**
```javascript
{
  keyPath: 'id',
  indexes: {
    timestamp: { unique: false },
    calculatorType: { unique: false }  // 'DRE' | 'FluxoCaixa' | 'Indicadores' | 'Balanço'
  }
}
```

**Exemplo de registro:**
```javascript
{
  id: 'calc-dre-2025',
  calculatorType: 'DRE',
  timestamp: '2025-10-17T10:30:00.000Z',
  resultado: {
    receitaBruta: 1000000,
    deducoes: 100000,
    receitaLiquida: 900000,
    custos: 500000,
    lucro Bruto: 400000,
    despesasOperacionais: 150000,
    lucroOperacional: 250000,
    impostos: 50000,
    lucroLiquido: 200000
  },
  ttl: 3600000  // 1 hora (opcional)
}
```

**Calculator Types:**
- `'DRE'`: Demonstração de Resultados do Exercício (`dre_historico`)
- `'FluxoCaixa'`: Fluxo de Caixa projetado (`fluxo_caixa`)
- `'Indicadores'`: VPL, TIR, Payback, ROI (`indicadores`)
- `'Balanço'`: Balanço Patrimonial (`bp_historico`)

**Invalidação de cache:**
- Automática quando dados de entrada são modificados
- TTL configurável por tipo de cálculo
- Manual via `clearStore('calculatedResults')`

---

## 🔧 API do Schema

### Inicialização

```javascript
// 1. Importar o schema
<script src="/src/assets/js/database/financiamento-indexeddb-schema.js"></script>

// 2. Abrir database
const db = await FinanciamentoIndexedDB.openDatabase();

// 3. Database está pronto para uso
```

### CRUD Operations

```javascript
// CREATE / UPDATE
await FinanciamentoIndexedDB.saveToStore('formulario', {
  id: 'secao1-dados',
  sectionId: 1,
  razaoSocial: 'Empresa Teste',
  timestamp: new Date().toISOString()
});

// READ (single)
const data = await FinanciamentoIndexedDB.loadFromStore('formulario', 'secao1-dados');

// READ (all)
const allData = await FinanciamentoIndexedDB.loadAllFromStore('formulario');

// DELETE (single)
await FinanciamentoIndexedDB.deleteFromStore('formulario', 'secao1-dados');

// DELETE (all)
await FinanciamentoIndexedDB.clearStore('formulario');
```

### Buscas por Index

```javascript
// Buscar por timestamp
const results = await FinanciamentoIndexedDB.findByIndex(
  'formulario',
  'timestamp',
  '2025-10-17T10:30:00.000Z'
);

// Buscar por sectionId
const section1Data = await FinanciamentoIndexedDB.findByIndex(
  'formulario',
  'sectionId',
  1
);

// Buscar por tableId (unique)
const table = await FinanciamentoIndexedDB.findByIndex(
  'dynamicTables',
  'tableId',
  'table-produtos-ano1'
);

// Buscar por type
const fullSaves = await FinanciamentoIndexedDB.findByIndex(
  'autosave',
  'type',
  'full'
);

// Buscar por calculatorType
const dreResults = await FinanciamentoIndexedDB.findByIndex(
  'calculatedResults',
  'calculatorType',
  'DRE'
);
```

### Operações Auxiliares

```javascript
// Contar registros
const count = await FinanciamentoIndexedDB.countRecords('formulario');
console.log(`Total de registros: ${count}`);

// Deletar database completo (⚠️ use com cuidado)
await FinanciamentoIndexedDB.deleteDatabase();
```

---

## 📦 Backup/Restore JSON

### Exportar Banco Completo

```javascript
async function exportarBanco() {
  const backup = {
    database: 'expertzy_financiamento',
    version: 1,
    exportDate: new Date().toISOString(),
    stores: {}
  };

  const stores = ['formulario', 'dynamicTables', 'autosave', 'calculatedResults'];

  for (const store of stores) {
    backup.stores[store] = await FinanciamentoIndexedDB.loadAllFromStore(store);
  }

  // Download JSON
  const json = JSON.stringify(backup, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `financiamento-backup-${Date.now()}.json`;
  link.click();
  URL.revokeObjectURL(url);
}
```

### Importar Banco

```javascript
async function importarBanco(jsonFile) {
  const text = await jsonFile.text();
  const backup = JSON.parse(text);

  // Validar versão
  if (backup.version !== 1) {
    throw new Error('Versão incompatível');
  }

  // Restaurar cada store
  for (const storeName in backup.stores) {
    const records = backup.stores[storeName];

    for (const record of records) {
      await FinanciamentoIndexedDB.saveToStore(storeName, record);
    }
  }
}
```

---

## 🧪 Testes

### Arquivo de Testes

**Localização:** `/test-financiamento-indexeddb.html`

**15 Testes Automatizados:**
1. ✅ CRUD formulario
2. ✅ CRUD dynamicTables
3. ✅ CRUD autosave
4. ✅ CRUD calculatedResults
5. ✅ Index timestamp
6. ✅ Index sectionId
7. ✅ Index tableId (unique)
8. ✅ Index type
9. ✅ Index calculatorType
10. ✅ Validação: save sem id
11. ✅ Validação: load não existente
12. ✅ Operação: deleteFromStore
13. ✅ Operação: clearStore
14. ✅ Operação: countRecords
15. ✅ Backup/Restore JSON

### Executar Testes

```bash
# Abrir no navegador
open test-financiamento-indexeddb.html

# Clicar em "▶️ Executar Todos os Testes (15)"
```

---

## ⚙️ Integração com FinanciamentoModule

### Uso no Módulo Principal

```javascript
// /src/assets/js/financiamento/financiamento-module.js

class FinanciamentoModule {
  async init() {
    // 1. Verificar dependência
    if (typeof window.FinanciamentoIndexedDB === 'undefined') {
      throw new Error('FinanciamentoIndexedDB não disponível');
    }

    // 2. Conectar ao banco
    this.db = await window.FinanciamentoIndexedDB.openDatabase();

    // 3. Usar em qualquer lugar
    await this.salvarDados('formulario', { ... });
    const dados = await this.carregarDados('formulario', 'id');
  }

  async salvarDados(storeName, registro) {
    await window.FinanciamentoIndexedDB.saveToStore(storeName, registro);
  }

  async carregarDados(storeName, id) {
    return await window.FinanciamentoIndexedDB.loadFromStore(storeName, id);
  }
}
```

### Carregamento no HTML

```html
<!-- IMPORTANTE: Carregar ANTES do financiamento-module.js -->
<script src="../assets/js/database/financiamento-indexeddb-schema.js"></script>
<script src="../assets/js/financiamento/financiamento-module.js"></script>
```

---

## 🔍 Troubleshooting

### Erro: "FinanciamentoIndexedDB não disponível"

**Causa:** Schema não foi carregado antes do módulo principal

**Solução:**
```html
<!-- Ordem CORRETA -->
<script src="../assets/js/database/financiamento-indexeddb-schema.js"></script>
<script src="../assets/js/financiamento/financiamento-module.js"></script>
```

### Erro: "data deve conter propriedade 'id'"

**Causa:** Tentativa de salvar registro sem `id`

**Solução:**
```javascript
// ❌ ERRADO
await FinanciamentoIndexedDB.saveToStore('formulario', {
  razaoSocial: 'Teste'
});

// ✅ CORRETO
await FinanciamentoIndexedDB.saveToStore('formulario', {
  id: 'secao1-dados',  // ⬅️ ID obrigatório
  razaoSocial: 'Teste'
});
```

### Erro: "Index não existe"

**Causa:** Tentativa de buscar por index inexistente

**Solução:** Consultar lista de indexes de cada store (ver seção "Object Stores" acima)

### Cache desatualizado

**Causa:** Resultados calculados estão desatualizados após mudança nos dados

**Solução:**
```javascript
// Invalidar cache manualmente
await FinanciamentoIndexedDB.deleteFromStore('calculatedResults', 'calc-dre-2025');

// Ou limpar todo o cache
await FinanciamentoIndexedDB.clearStore('calculatedResults');
```

### Performance lenta com 126 tabelas

**Causa:** Muitas operações simultâneas de I/O

**Solução:**
```javascript
// ❌ EVITAR: Loop síncrono
for (const table of tables) {
  await saveTable(table);  // Muito lento
}

// ✅ PREFERIR: Promise.all para operações independentes
await Promise.all(tables.map(table => saveTable(table)));
```

---

## 📊 Migração de Versões

### Processo de Upgrade

O schema usa `onupgradeneeded` para criar stores automaticamente:

```javascript
request.onupgradeneeded = (event) => {
  const db = event.target.result;
  const oldVersion = event.oldVersion;

  // Versão 0 → 1: Criar todas as stores
  if (oldVersion < 1) {
    createAllStores(db);
  }

  // Versão 1 → 2: Adicionar novos indexes (futuro)
  if (oldVersion < 2) {
    // Migration code here
  }
};
```

### Adicionar Novo Index (Exemplo)

```javascript
// Incrementar DB_VERSION
const DB_VERSION = 2;

// Adicionar migration
if (oldVersion < 2) {
  const transaction = event.target.transaction;
  const store = transaction.objectStore('formulario');

  if (!store.indexNames.contains('newIndex')) {
    store.createIndex('newIndex', 'newField', { unique: false });
  }
}
```

---

## 📚 Referências

- **Schema Completo:** `/src/assets/js/database/financiamento-indexeddb-schema.js`
- **Módulo Principal:** `/src/assets/js/financiamento/financiamento-module.js`
- **Testes:** `/test-financiamento-indexeddb.html`
- **Referência Python:** `/documentos/financiamento-mvp/budget.py`
- **Documentação:** `/CLAUDE.md` (seção IndexedDB)

---

## ✅ Checklist de Implementação

Ao criar um novo módulo que usa o IndexedDB:

- [ ] Importar `financiamento-indexeddb-schema.js` no HTML
- [ ] Verificar dependência: `if (typeof window.FinanciamentoIndexedDB === 'undefined')`
- [ ] Conectar ao banco: `await FinanciamentoIndexedDB.openDatabase()`
- [ ] Usar API correta: `saveToStore()`, `loadFromStore()`, etc
- [ ] Sempre incluir `id` nos registros
- [ ] Adicionar `timestamp` para auditoria
- [ ] Testar CRUD completo
- [ ] Implementar backup/restore se necessário
- [ ] Validar alinhamento com budget.py

---

**Última atualização:** 17/10/2025
**Versão do Schema:** 1.0.0
**Status:** ✅ Produção
