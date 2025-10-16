# Próximos Passos - Sistema FCO

**Data:** 2025-10-16
**Status Atual:** Sprint 2 Iniciado 🚀
**Progresso Geral:** 21h / 90h (23%)

---

## 📊 Visão Geral

### Sprints Planejados

| Sprint | Objetivo | Esforço | Status |
|--------|----------|---------|--------|
| **Sprint 1** | Core Components | 20h | ✅ **COMPLETO** |
| **PRE-Tasks** | FinanciamentoModule Setup | 1h | ✅ **COMPLETO** |
| **Sprint 2** | RESPONDENTE Sections | 30h | 🔄 **EM ANDAMENTO** |
| **Sprint 3** | Import/Export & Integration | 25h | ⏳ Pendente |
| **Sprint 4** | Testing & Polish | 15h | ⏳ Pendente |
| **TOTAL** | Sistema Completo | **91h** | **23% completo** |

---

## ✅ PRE-Tasks Completados (1 hora)

### PRE-1: Métodos IndexedDB ✅ COMPLETO
**Esforço:** 0.5h
**Arquivo:** `/src/assets/js/financiamento/financiamento-module.js`

**Implementado:**
- ✅ Object store `dynamicTables` adicionado ao schema IndexedDB (linhas 144-151)
- ✅ Método `salvarDynamicTable(tableId, data)` com validação completa (linhas 478-511)
- ✅ Método `carregarDynamicTable(tableId)` com tratamento de erros (linhas 513-543)
- ✅ Seguindo princípio NO FALLBACKS (erros explícitos)

### PRE-2: Data Collection/Restore ✅ COMPLETO
**Esforço:** 0.5h
**Arquivo:** `/src/assets/js/financiamento/financiamento-module.js`

**Implementado:**
- ✅ `coletarDadosFormulario()` expandido para seções 1-8 (linhas 565-730)
- ✅ `restaurarDadosFormulario()` completo para todas seções (linhas 753-959)
- ✅ Métodos auxiliares: `coletarProdutos()`, `coletarInsumos()`, `restaurarProdutos()`, `restaurarInsumos()`
- ✅ Suporte para arrays dinâmicos (produtos/insumos na Seção 8)

---

## ⏭️ Sprint 2: RESPONDENTE Sections (30 horas)

### Objetivo
Implementar 7 seções RESPONDENTE prioritárias com tabelas dinâmicas funcionais.

### Tasks Detalhadas

#### Task 2.1: Expandir Seção 1 (Identificação)
**Esforço:** 2 horas
**Arquivos:** `formulario-financiamento.html`, `financiamento-module.js`

**Escopo:**
- Expandir de 13 campos para 345 campos
- Adicionar: caracterização jurídica, histórico, indicadores, certificações
- Validações: CNPJ, email, required

**Campos a adicionar:**
```html
<!-- Caracterização Jurídica -->
<input type="text" id="tipoSocietario" name="tipoSocietario">
<input type="text" id="capitalSocial" name="capitalSocial">
<input type="number" id="numeroSocios" name="numeroSocios">

<!-- Histórico -->
<input type="number" id="tempoOperacao" name="tempoOperacao">
<input type="text" id="faturamentoAno1" name="faturamentoAno1">
<input type="text" id="faturamentoAno2" name="faturamentoAno2">
<input type="text" id="faturamentoAno3" name="faturamentoAno3">

<!-- Indicadores Atuais -->
<input type="number" id="numeroEmpregados" name="numeroEmpregados">
<input type="text" id="areaConstruida" name="areaConstruida">
<input type="text" id="areaTerreno" name="areaTerreno">

<!-- Certificações -->
<input type="text" id="certificacoesISO" name="certificacoesISO">
<input type="text" id="registrosANVISA" name="registrosANVISA">
```

---

#### Task 2.2: Seção 4A - ORÇAMENTO
**Esforço:** 4 horas
**Arquivo:** `/src/assets/js/financiamento/secao-orcamento.js`

**Escopo:**
- 296 campos distribuídos em DynamicTable
- 12 colunas: categoria, item, especificacao, quantidade, unidade, valor_unitario, valor_total, ano_desembolso, fornecedor, cnpj_fornecedor, tem_orcamento, observacoes
- Campo calculado: `valor_total = quantidade * valor_unitario`
- Totalizadores automáticos
- Validação vs CAPEX (warning visual)

**Estrutura:**
```javascript
class SecaoOrcamento {
  constructor(config) {
    this.dynamicTable = new DynamicTable({
      tableId: 'secao4A_orcamento',
      sectionId: 'secao4A',
      columns: [
        { id: 'categoria', label: 'Categoria', type: 'select', options: [...], required: true },
        { id: 'item', label: 'Item', type: 'text', required: true },
        { id: 'quantidade', label: 'Quantidade', type: 'number', required: true },
        { id: 'valor_unitario', label: 'Valor Unitário', type: 'currency', required: true },
        { id: 'valor_total', label: 'Valor Total', type: 'currency', calculated: true, formula: 'quantidade * valor_unitario' }
      ],
      totalizers: ['valor_total']
    });
  }

  validateVsCapex() {
    const totalOrcamento = this.dynamicTable.getTotalizers().valor_total;
    const totalCapex = this.getCapexFromSecao3();
    const isValid = Math.abs(totalOrcamento - totalCapex) < 0.01;
    // Exibir warning visual se não balanceado
  }
}
```

---

#### Task 2.3: Seção 4B - USOS E FONTES ⚠️ CRÍTICO
**Esforço:** 6 horas
**Arquivo:** `/src/assets/js/financiamento/secao-usos-fontes.js`

**Escopo:**
- 690 campos distribuídos em 2× DynamicTable (USOS + FONTES)
- **VALIDAÇÃO CRÍTICA:** `SUM(USOS) === SUM(FONTES)` (tolerância R$ 0,01)
- Indicador visual em tempo real (verde/vermelho)
- Bloqueio de submit se desbalanceado

**Estrutura:**
```javascript
class SecaoUsosFontes {
  constructor(config) {
    this.tableUsos = new DynamicTable({
      tableId: 'secao4B_usos',
      sectionId: 'secao4B',
      columns: [
        { id: 'descricao', label: 'Descrição', type: 'text', required: true },
        { id: 'valor', label: 'Valor', type: 'currency', required: true }
      ],
      totalizers: ['valor']
    });

    this.tableFontes = new DynamicTable({
      tableId: 'secao4B_fontes',
      sectionId: 'secao4B',
      columns: [
        { id: 'descricao', label: 'Descrição', type: 'text', required: true },
        { id: 'valor', label: 'Valor', type: 'currency', required: true }
      ],
      totalizers: ['valor']
    });
  }

  validateBalance() {
    const totalUsos = this.tableUsos.getTotalizers().valor;
    const totalFontes = this.tableFontes.getTotalizers().valor;
    const balanced = Math.abs(totalUsos - totalFontes) < 0.01;

    // Atualizar indicador visual
    const indicador = document.getElementById('balanceIndicator');
    if (balanced) {
      indicador.className = 'balance-indicator balanced';
      indicador.innerHTML = `<i class="fas fa-check-circle"></i> BALANCEADO: ${this.formatCurrency(totalUsos)}`;
    } else {
      indicador.className = 'balance-indicator unbalanced';
      const diferenca = totalUsos - totalFontes;
      indicador.innerHTML = `<i class="fas fa-exclamation-triangle"></i> DESBALANCEADO: Diferença de ${this.formatCurrency(Math.abs(diferenca))} ${diferenca > 0 ? '(Falta FONTES)' : '(Falta USOS)'}`;
    }

    return balanced;
  }
}
```

---

#### Task 2.4: Seção 4C - RECEITAS
**Esforço:** 5 horas
**Arquivo:** `/src/assets/js/financiamento/secao-receitas.js`

**Escopo:**
- 555 campos (29 colunas × ~20 produtos)
- 29 colunas: produto, NCM, unidade, preço_unitário + 12 meses (qtd + valor) + total_ano
- Scroll horizontal
- Colunas fixas: produto, NCM, preço_unitário, total_ano

**Campos Calculados:**
```javascript
columns: [
  { id: 'produto', label: 'Produto', type: 'text', required: true, fixed: true },
  { id: 'preco_unitario', label: 'Preço Unit.', type: 'currency', required: true, fixed: true },
  { id: 'jan_qtd', label: 'Jan Qtd', type: 'number' },
  { id: 'jan_valor', label: 'Jan Valor', type: 'currency', calculated: true, formula: 'jan_qtd * preco_unitario' },
  // ... repetir para fev, mar, abr, mai, jun, jul, ago, set, out, nov, dez
  { id: 'total_ano', label: 'Total Ano', type: 'currency', calculated: true, formula: 'SUM(jan_valor:dez_valor)', fixed: true }
]
```

---

#### Task 2.5: Seção 5A - INSUMOS
**Esforço:** 3 horas
**Arquivo:** `/src/assets/js/financiamento/secao-insumos.js`

**Escopo:**
- 67 campos
- Similar a RECEITAS mas para insumos/matérias-primas
- Integração com `CalculadorDREProjetado` (custos)

---

#### Task 2.6: Seção 5B - CUSTOS
**Esforço:** 4 horas
**Arquivo:** `/src/assets/js/financiamento/secao-custos.js`

**Escopo:**
- 276 campos
- Categorias: energia, água, telecomunicações, manutenção, seguros, marketing
- Integração com `CalculadorDREProjetado`

---

#### Task 2.7: Seção 5C - MÃO-DE-OBRA
**Esforço:** 6 horas
**Arquivo:** `/src/assets/js/financiamento/secao-mao-obra.js`

**Escopo:**
- 778 campos
- Empregados individuais com cálculo automático de encargos
- Cálculos: FGTS (8%), INSS patronal (20%), férias/13º

**Estrutura:**
```javascript
columns: [
  { id: 'nome', label: 'Nome', type: 'text', required: true },
  { id: 'cargo', label: 'Cargo', type: 'text', required: true },
  { id: 'salario_base', label: 'Salário Base', type: 'currency', required: true },
  { id: 'fgts', label: 'FGTS (8%)', type: 'currency', calculated: true, formula: 'salario_base * 0.08' },
  { id: 'inss', label: 'INSS (20%)', type: 'currency', calculated: true, formula: 'salario_base * 0.20' },
  { id: 'ferias_13', label: 'Férias+13º', type: 'currency', calculated: true, formula: 'salario_base / 12' },
  { id: 'custo_total', label: 'Custo Total', type: 'currency', calculated: true, formula: 'salario_base + fgts + inss + ferias_13' }
]
```

---

### Acceptance Criteria - Sprint 2

- ✅ 7 seções RESPONDENTE funcionais
- ✅ DynamicTable funciona em 8 instâncias (7 seções + 1 extra em USOS E FONTES)
- ✅ Validação USOS == FONTES funciona
- ✅ Todas as seções persistem em IndexedDB
- ✅ Auto-save funciona em todas as seções
- ✅ Eventos integram com EventBus
- ✅ Usuário pode preencher formulário completo

---

## ⏭️ Sprint 3: Import/Export & Integration (25 horas)

### Tasks

#### Task 3.1: Implementar Import JSON (6h)
- Validação JSON Schema (Ajv)
- Checksum verification (SHA-256)
- Version compatibility check
- Required fields validation
- Cross-section consistency validation
- Apply data to form
- Rollback on error

#### Task 3.2: Implementar Export JSON (5h)
- Coletar dados de todas as 13+ seções
- Coletar dados de todas as 126 tabelas dinâmicas
- Gerar metadata (version, timestamp, author)
- Calcular checksum SHA-256
- Download automático

#### Task 3.3: Implementar Export Excel (5h)
- ExcelJS library
- Criar workbook com múltiplas abas
- Formatação: headers bold, totais com background, currency formatting

#### Task 3.4: Implementar Export PDF (4h)
- jsPDF + autoTable
- Cabeçalho profissional (logo, título, data)
- Paginação automática

#### Task 3.5: Integração com Calculadores (3h)
- RECEITAS → CalculadorDRE
- CUSTOS → CalculadorDRE
- MÃO-DE-OBRA → CalculadorDRE
- DRE → CalculadorFluxoCaixa
- FluxoCaixa → CalculadorIndicadores

#### Task 3.6: Validações Cross-Section (2h)
- USOS == FONTES (já implementado)
- Orçamento vs CAPEX
- Receitas Totais vs DRE
- Mão-de-obra Total vs Despesas Pessoal DRE

---

## ⏭️ Sprint 4: Testing & Polish (15 horas)

### Tasks

#### Task 4.1: End-to-End Testing (5h)
- Playwright ou Cypress
- 5 testes E2E principais
- Screenshots de cada etapa

#### Task 4.2: Bug Fixes Prioritários (5h)
- Executar todos os testes E2E
- Registrar bugs
- Corrigir bugs blocker/critical

#### Task 4.3: Performance Optimization (3h)
- Debounce no auto-save (já implementado)
- Virtual Scrolling (se necessário para DÍVIDAS)
- Lazy Loading de Calculadores
- Minimização de Reflows

#### Task 4.4: User Documentation (2h)
- GUIA_USUARIO.md
- FAQ.md
- Screenshots ilustrativos

---

## 🎯 Critérios de Sucesso - Projeto Completo

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

---

## 📈 Métricas de Progresso

| Métrica | Sprint 1 | PRE-Tasks | Sprint 2 | Sprint 3 | Sprint 4 | Total |
|---------|----------|-----------|----------|----------|----------|-------|
| **Esforço (h)** | 20 | 1 | 30 | 25 | 15 | 91 |
| **% Progresso** | 22% | 1% | 33% | 27% | 17% | 100% |
| **Componentes** | 4 | 0 | 10 | 3 | 0 | 17 |
| **Seções** | 0 | 0 | 7 | 0 | 0 | 7 |
| **Testes** | 0 | 0 | 0 | 0 | 36+ | 36+ |

**Status Atual:** 23% completo (21h / 91h)
**PRE-Tasks:** ✅ Completo (IndexedDB methods + Data collection/restore)
**Próximo:** Task 2.1 - Expandir Seção 1 (Identificação)

---

## 🚀 Quick Start - Sprint 2

Quando pronto para iniciar Sprint 2:

```bash
# Criar branch para Sprint 2
git checkout -b sprint2-respondente-sections

# Começar pela Task 2.1 - Expandir Seção 1
# Arquivo: /src/pages/formulario-financiamento.html
# Esforço: 2 horas
# Referência: ESTRUTURA_HTML.md

# Após completar cada task, commit incremental
git add .
git commit -m "feat(sprint2): Task 2.X - <descrição>"

# Ao finalizar Sprint 2
git checkout master
git merge sprint2-respondente-sections
git push origin master
```

---

## 📞 Contato e Suporte

Para dúvidas sobre a implementação:
- Consultar documentação em `/documentos/financiamento/`
- Revisar especificações completas nos arquivos MD

---

**Última atualização:** 2025-10-16
**Próxima revisão:** Início Sprint 2
