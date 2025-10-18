# ROADMAP DE SPRINTS - MÓDULO FINANCIAMENTO
## Versão 2.0 - Navegação Hierárquica + 240 Meses

**Documento:** Sequência completa de execução dos sprints do módulo de financiamento
**Data:** 2025-10-18
**Versão:** 2.0 (Navegação Hierárquica)
**Autor:** Claude Code

---

## 📋 ÍNDICE

1. [Status Atual](#status-atual)
2. [Estrutura de Navegação Hierárquica](#estrutura-de-navegação-hierárquica)
3. [Mapeamento Completo de Seções](#mapeamento-completo-de-seções)
4. [Ajustes: Suporte a 240 Meses](#ajustes-suporte-a-240-meses)
5. [Sequência de Execução dos Sprints](#sequência-de-execução-dos-sprints)
6. [Detalhamento dos Sprints](#detalhamento-dos-sprints)
7. [Cronograma e Estimativas](#cronograma-e-estimativas)
8. [Matriz de Dependências](#matriz-de-dependências)

---

## 📊 STATUS ATUAL

### Sprints Completos (6 de 24)

| Sprint | Tab | Seção/Subseção | Status | Arquivo Principal |
|--------|-----|----------------|--------|-------------------|
| ✅ 1 | - | DynamicTable Component | Completo | `dynamic-table.js` |
| ✅ 2 | - | Componentes Auxiliares | Completo | `currency-input.js`, `percentage-input.js` |
| ✅ 3 | - | Schema IndexedDB | Completo | `financiamento-indexeddb-schema.js` |
| ✅ 4 | 1 | 1.1 - Empresa | Completo | `secao-empresa.js` |
| ✅ 7 | 2 | 1.2 - Projeto | Completo | `secao-projeto.js` |
| ✅ 8 | 9 | 5.1 - Investimentos | Completo | `secao-investimentos.js` |

**Progresso:** 6/24 sprints (25%)
**Linhas de código:** ~3.302 linhas

---

## 🗂️ ESTRUTURA DE NAVEGAÇÃO HIERÁRQUICA

### Arquitetura de 2 Níveis

**NÍVEL 1:** Navbar superior com **9 SEÇÕES PRINCIPAIS** (botões compactos)
**NÍVEL 2:** Tabs internas com **SUBSEÇÕES** de cada seção

**Objetivo:** Reduzir navegação de 18 botões → 9 botões no navbar principal

### Visualização do Navbar

```
┌─────────────────────────────────────────────────────────────────────┐
│ [1. Identificação ▼] [2. Premissas] [3. Histórico]                 │
│ [4. Operações ▼] [5. Investimentos ▼] [6. Cronograma]              │
│ [7. Matriz] [8. Demonstrações ▼] [9. Análises ▼]                   │
└─────────────────────────────────────────────────────────────────────┘
```

**Quando clicar em "4. Operações ▼":**

```
┌─────────────────────────────────────────────────────────────────────┐
│ 4. OPERAÇÕES                                                         │
├─────────────────────────────────────────────────────────────────────┤
│ [4.1 Receitas] [4.2 Insumos] [4.3 Mão-de-Obra] [4.4 Custos]        │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🔢 MAPEAMENTO COMPLETO DE SEÇÕES

### SEÇÃO 1: IDENTIFICAÇÃO (Tabs 1-2)

| Tab | Subseção | Nome | Sprint | Status | Visibilidade |
|-----|----------|------|--------|--------|--------------|
| 1 | **1.1** | Identificação da Empresa | 4 | ✅ Completo | Todos |
| 2 | **1.2** | Caracterização do Projeto | 7 | ✅ Completo | Todos |

**Descrição:** Dados cadastrais da empresa e informações gerais do projeto.

---

### SEÇÃO 2: PREMISSAS (Tab 3)

| Tab | Subseção | Nome | Sprint | Status | Visibilidade |
|-----|----------|------|--------|--------|--------------|
| 3 | **2.1** | Regime Tributário e Premissas | Novo | 🔴 Pendente | Todos |

**Descrição:** Regime tributário (Real/Presumido/Simples), TMA, inflação, período de projeção.

---

### SEÇÃO 3: HISTÓRICO (Tab 4)

| Tab | Subseção | Nome | Sprint | Status | Visibilidade |
|-----|----------|------|--------|--------|--------------|
| 4 | **3.1** | Balanço Patrimonial Histórico | 15 | 🔴 Pendente | Todos |

**Descrição:** Balanço patrimonial atual da empresa (Ativo, Passivo, Patrimônio Líquido).

---

### SEÇÃO 4: OPERAÇÕES (Tabs 5-8)

| Tab | Subseção | Nome | Sprint | Status | Visibilidade |
|-----|----------|------|--------|--------|--------------|
| 5 | **4.1** | Produtos e Receitas Projetadas | 10 | 🔴 Pendente | Todos |
| 6 | **4.2** | Insumos e Matérias-Primas | 11 | 🔴 Pendente | Todos |
| 7 | **4.3** | Recursos Humanos | 13 | 🔴 Pendente | Todos |
| 8 | **4.4** | Custos Operacionais | 11A | 🔴 Pendente | Todos |

**Descrição:** Operações diárias - receitas, custos, insumos, mão-de-obra.

---

### SEÇÃO 5: INVESTIMENTOS (Tabs 9-11)

| Tab | Subseção | Nome | Sprint | Status | Visibilidade |
|-----|----------|------|--------|--------|--------------|
| 9 | **5.1** | Orçamento de Investimentos Fixos | 8 + 9A | ✅ + 🔴 | Todos |
| 10 | **5.2** | Capital de Giro e Ciclos Financeiros | 11B | 🔴 Pendente | 🔒 Analista |
| 11 | **5.3** | Endividamento e Financiamentos | 14 | 🔴 Pendente | 🔒 Analista |

**Descrição:** Investimentos fixos, capital de giro, financiamentos (tabs protegidas para analista).

**Modificação Sprint 9A:** Alterar tab 9 para suportar 0-240 meses (ao invés de 0-5 anos).

---

### SEÇÃO 6: CRONOGRAMA (Tab 12)

| Tab | Subseção | Nome | Sprint | Status | Visibilidade |
|-----|----------|------|--------|--------|--------------|
| 12 | **6.1** | Cronograma Financeiro (Usos e Fontes) | 10 | 🔴 Pendente | Todos |

**Descrição:** Consolidação temporal de usos e fontes de recursos (0-240 meses).

---

### SEÇÃO 7: MATRIZ (Tab 13)

| Tab | Subseção | Nome | Sprint | Status | Visibilidade |
|-----|----------|------|--------|--------|--------------|
| 13 | **7.1** | Matriz Produto-Insumo | 12 | 🔴 Pendente | Todos |

**Descrição:** Relação entre produtos fabricados e insumos consumidos.

---

### SEÇÃO 8: DEMONSTRAÇÕES (Tabs 14-15)

| Tab | Subseção | Nome | Sprint | Status | Visibilidade |
|-----|----------|------|--------|--------|--------------|
| 14 | **8.1** | DRE Projetada (5 anos) | 17 | 🔴 Pendente | Todos |
| 15 | **8.2** | Fluxo de Caixa Projetado (60 meses) | 18 | 🔴 Pendente | Todos |

**Descrição:** Demonstrações financeiras projetadas (DRE e Fluxo de Caixa).

---

### SEÇÃO 9: ANÁLISES (Tabs 16-18)

| Tab | Subseção | Nome | Sprint | Status | Visibilidade |
|-----|----------|------|--------|--------|--------------|
| 16 | **9.1** | Dashboard de Indicadores | 19 | 🔴 Pendente | Todos |
| 17 | **9.2** | Cálculo de Impostos | Novo | 🔴 Pendente | 🔒 Analista |
| 18 | **9.3** | Análise de Cenários | 23 | 🔴 Pendente | 🔒 Analista |

**Descrição:** Indicadores financeiros (VPL, TIR, Payback), impostos detalhados, análise de cenários.

---

### Resumo: Visibilidade por Modo

**Modo Usuário:** 15 tabs visíveis
- Seção 1: 1.1, 1.2
- Seção 2: 2.1
- Seção 3: 3.1
- Seção 4: 4.1, 4.2, 4.3, 4.4
- Seção 5: 5.1 (oculta 5.2, 5.3)
- Seção 6: 6.1
- Seção 7: 7.1
- Seção 8: 8.1, 8.2
- Seção 9: 9.1 (oculta 9.2, 9.3)

**Modo Analista:** 18 tabs visíveis (todas)
- Adiciona: 5.2, 5.3, 9.2, 9.3

---

## ⚠️ AJUSTES: SUPORTE A 240 MESES

### Problema Original

O documento planejava **60 meses (5 anos)** como horizonte máximo. Porém:

**Financiamentos podem ter prazo de até 240 meses (20 anos):**
- FCO: até 144 meses (12 anos)
- BNDES FINEM: até 240 meses (20 anos)
- Financiamento imobiliário: até 360 meses (30 anos)

### Solução: Modelo Híbrido

**INVESTIMENTOS E FINANCIAMENTOS:** 0-240 meses (20 anos)
**OPERAÇÕES (Receitas, Custos, RH):** 60 meses (5 anos) - suficiente para análise
**CRONOGRAMA FINANCEIRO:** 240 meses com 2 níveis de detalhe:
- **Meses 0-59:** Detalhamento mensal (60 linhas)
- **Meses 60-239:** Consolidação anual (15 linhas - Anos 6-20)

### Impacto nos Sprints

| Sprint | Seção | Ajuste |
|--------|-------|--------|
| **9A** | 5.1 - Investimentos | Campo `mesDesembolso` 0-240 (era 0-5 anos) |
| 11B | 5.2 - Capital de Giro | 60 meses operacionais (sem mudança) |
| 14 | 5.3 - Endividamento | Amortização até 240 parcelas |
| 10 | 6.1 - Cronograma | Cronograma híbrido 0-240 meses |

---

## 🎯 SEQUÊNCIA DE EXECUÇÃO DOS SPRINTS

### FASE 0: NAVEGAÇÃO HIERÁRQUICA (NOVA)
**Duração:** 3-4 horas
**Objetivo:** Implementar navegação de 2 níveis antes de continuar sprints

#### Sprint 0: Navegação Hierárquica
**Tarefas:**
1. Modificar `formulario-financiamento.html`:
   - Adicionar `section-navbar` (9 seções principais)
   - Adicionar `subsection-navbar` para cada seção
   - Manter `data-tab` numérico (1-18)

2. Criar estilos em `financiamento-styles.css`:
   - Navbar compacto responsivo
   - Tabs internas por seção
   - Estados: ativo, hover, protegido

3. Refatorar `tabs.js` → `HierarchicalNavigation`:
   - Mapear seções → tabs
   - Método `switchToSection(sectionNumber)`
   - Método `showSubnavbar(sectionNumber)`
   - Manter compatibilidade com código existente

4. Adicionar labels de subseções:
   - "1.1 - Empresa", "4.2 - Insumos", etc.

**Arquivos:**
- `formulario-financiamento.html` (+150 linhas)
- `financiamento-styles.css` (+100 linhas)
- `tabs.js` (refatoração ~200 linhas)

**Commit:**
```
feat(navegacao): implementa navegacao hierarquica 2 niveis

- Navbar principal: 9 secoes (compacto)
- Subnavbar: tabs internas por secao
- Responsivo: mobile-first
- Mantém data-tab numerico (compatível)
- Controle de visibilidade por modo (Usuario/Analista)
```

---

### FASE 1: PRÉ-REQUISITOS PARA CRONOGRAMA FINANCEIRO
**Duração:** 12-15 horas
**Objetivo:** Preparar dados necessários para o Cronograma Financeiro

#### Sprint 9A: Modificar Tab 9 (5.1 - Investimentos) para 240 Meses
**Duração:** 1-2 horas
**Prioridade:** CRÍTICA

**Descrição:** Alterar campo `anoDesembolso` (0-5) para `mesDesembolso` (0-240).

**Tarefas:**
1. Modificar `secao-investimentos.js`:
   - Campo: `anoDesembolso` → `mesDesembolso`
   - Validação: 0 ≤ mês ≤ 240
   - Dropdown: 241 opções agrupadas por ano

2. HTML: `<select>` com `<optgroup>`:
   ```html
   <select id="mesDesembolso">
     <optgroup label="Ano 0 (Implantação)">
       <option value="0">Mês 0</option>
       <option value="1">Mês 1</option>
       <!-- ... -->
       <option value="11">Mês 11</option>
     </optgroup>
     <optgroup label="Ano 1">
       <option value="12">Mês 12</option>
       <!-- ... -->
       <option value="23">Mês 23</option>
     </optgroup>
     <!-- ... até Ano 19 -->
     <optgroup label="Ano 19">
       <option value="228">Mês 228</option>
       <!-- ... -->
       <option value="239">Mês 239</option>
     </optgroup>
     <optgroup label="Ano 20">
       <option value="240">Mês 240</option>
     </optgroup>
   </select>
   ```

3. Atualizar 5 JSONs de teste:
   - `teste-sprint8-cenario1-industria-completa.json`
   - `teste-sprint8-cenario2-comercio.json`
   - `teste-sprint8-cenario3-servicos.json`
   - `teste-sprint8-cenario4-validacao-calculos.json`
   - `teste-sprint8-cenario5-contrapartida.json`

4. Atualizar `financiamento-module.js`:
   - Coleta: campo `mesDesembolso`
   - Restauração: validar 0-240

**Arquivos Modificados:**
- `secao-investimentos.js` (~50 linhas)
- `formulario-financiamento.html` (~30 linhas)
- 5 JSONs (~10 linhas cada)
- `financiamento-module.js` (~10 linhas)

**Commit:**
```
refactor(investimentos): altera para mesDesembolso 0-240 meses

- Suporte a financiamentos de longo prazo (até 20 anos)
- Dropdown agrupado por ano (melhor UX)
- Atualiza JSONs de teste com nova estrutura
- Retrocompatível com importação de dados antigos
```

---

#### Sprint 11B: Criar Tab 10 (5.2 - Capital de Giro) - Backend
**Duração:** 5-6 horas
**Prioridade:** ALTA
**Visibilidade:** 🔒 Analista

**Descrição:** Calcular Necessidade de Capital de Giro (NCG) mês a mês (60 meses).

**Funcionalidades:**

1. **Modo Dual de Entrada:**
   - **Calculado:** Extrair PMR, PMP, PME do Balanço Patrimonial (Tab 4)
   - **Manual:** Usuário informa prazos médios em dias

2. **Cálculo dos Ciclos:**
   ```javascript
   cicloOperacional = PMR + PME  // dias
   cicloFinanceiro = cicloOperacional - PMP  // dias
   ```

3. **Projeção Mensal NCG (60 meses):**
   ```javascript
   // Para cada mês (1-60)
   contasReceber = (receitaMes * PMR) / 30
   estoqueMedio = (cmvMes * PME) / 30
   contasPagar = (custosMes * PMP) / 30

   NCGmes = contasReceber + estoqueMedio - contasPagar
   variacaoNCG = NCGmes - NCGmesAnterior
   ```

4. **Consolidação Anual (5 anos):**
   - NCG inicial, NCG final, variação
   - Investimento adicional necessário = max(0, variação)

5. **Visualizações:**
   - Gráfico linha: Evolução NCG 60 meses
   - Gráfico pizza: Composição NCG
   - Gráfico barras: Investimento adicional anual

6. **Alertas Automáticos:**
   - 🔴 CRÍTICO: Ciclo financeiro > 90 dias
   - 🟠 ATENÇÃO: Ciclo financeiro > 60 dias
   - 🟢 POSITIVO: Ciclo < 0 (autofinanciamento)

**Integração:**
- **Input:** Tab 5 (Receitas), Tab 6 (Insumos), Tab 8 (Custos)
- **Output:** Variações NCG → Tab 12 (Cronograma Financeiro)

**Estrutura de Dados:**
```javascript
{
  capitalGiro: {
    modo: "manual",  // ou "calculado"
    prazos: { PMR: 45, PMP: 30, PME: 38 },
    ciclos: { operacional: 83, financeiro: 53 },
    projecaoMensal: [  // 60 elementos
      {
        mes: 1,
        ano: 1,
        receitaMes: 500000,
        custosMes: 350000,
        contasReceber: 750000,
        estoqueMedio: 441667,
        contasPagar: 350000,
        NCG: 841667,
        variacaoNCG: 841667
      },
      // ...
    ],
    consolidacaoAnual: [  // 5 elementos
      {
        ano: 1,
        NCGinicial: 0,
        NCGfinal: 1018167,
        variacaoNCG: 1018167,
        investimentoAdicional: 1018167
      },
      // ...
    ]
  }
}
```

**Arquivos Criados:**
- `/src/assets/js/financiamento/secao-capital-giro.js` (~800 linhas)
- `/src/assets/js/financiamento/calculators/capital-giro-calculator.js` (~400 linhas)

**Arquivos Modificados:**
- `/src/pages/formulario-financiamento.html` (+120 linhas - Tab 10)
- `/src/assets/css/financiamento-styles.css` (+150 linhas)

**Commit:**
```
feat(financiamento): implementa Tab 10 - Capital de Giro (backend)

- Modo dual: calculado (PMR/PMP/PME) vs manual
- Projeção NCG mensal (60 meses)
- Consolidação anual (5 anos)
- Gráficos: evolução, composição, investimento
- Alertas automáticos de ciclo financeiro
- Integração com Receitas, CMV, Custos
- Visibilidade: ANALISTA apenas
```

---

#### Sprint 14: Criar Tab 11 (5.3 - Endividamento) - Backend
**Duração:** 5-6 horas
**Prioridade:** ALTA
**Visibilidade:** 🔒 Analista

**Descrição:** Registrar financiamentos e gerar cronograma de amortização (SAC/PRICE/Americano).

**Funcionalidades:**

1. **Tabela Dinâmica de Financiamentos:**
   - Fonte (FCO, BNDES, FINEP, Banco Privado, Investidor)
   - Valor contratado (R$)
   - Taxa de juros (% a.a.)
   - Prazo (meses): **0-240 meses** ⬅️
   - Carência (meses): 0-60 meses
   - Sistema: SAC, PRICE, Americano
   - Primeiro desembolso (mês): 0-240

2. **Geração Automática de Tabela de Amortização:**
   - SAC: Amortização constante
   - PRICE: Parcelas fixas
   - Americano: Pagamento no final

3. **Cronograma de Desembolsos:**
   - Importar de Tab 9 (Investimentos) - `recursosTerceiros`
   - Permitir edição/detalhamento
   - Distribuir desembolsos (único ou parcelado)

4. **Resumo do Serviço da Dívida:**
   - Juros totais pagos
   - Custo Efetivo Total (CET)
   - Saldo devedor ao longo do tempo
   - % da Receita comprometida

5. **Visualizações:**
   - Tabela de amortização (até 240 parcelas)
   - Gráfico: Evolução saldo devedor
   - Gráfico: Amortização vs Juros (anual)
   - Gráfico pizza: Composição fontes

**Integração:**
- **Input:** Tab 9 (Investimentos) - `recursosTerceiros`
- **Output:** Cronograma desembolsos → Tab 12 (Cronograma Financeiro)
- **Output:** Cronograma pagamentos → Tab 15 (Fluxo de Caixa)

**Estrutura de Dados:**
```javascript
{
  endividamento: {
    financiamentos: [
      {
        id: uuid(),
        fonte: "FCO",
        valor: 2205000,
        taxa: 8.5,         // % a.a.
        prazo: 144,        // meses
        carencia: 24,
        sistema: "SAC",
        primeiroDesembolso: 0,
        desembolsos: [
          { mes: 0, valor: 2205000 }
        ],
        tabelaAmortizacao: [  // 144 elementos
          {
            mes: 1,
            saldoDevedor: 2205000,
            amortizacao: 0,
            juros: 15606.25,
            parcela: 15606.25
          },
          // ... 24 meses carência
          {
            mes: 25,
            saldoDevedor: 2205000,
            amortizacao: 18375,
            juros: 15606.25,
            parcela: 33981.25
          },
          // ...
          {
            mes: 144,
            saldoDevedor: 0,
            amortizacao: 18375,
            juros: 129.69,
            parcela: 18504.69
          }
        ],
        resumo: {
          jurosTotais: 1245678.90,
          valorTotal: 3450678.90,
          CET: 9.2  // % a.a.
        }
      }
    ],
    resumoGeral: {
      totalFinanciamentos: 2925000,
      jurosTotaisProjetados: 1856789.45,
      custoTotal: 4781789.45
    }
  }
}
```

**Arquivos Criados:**
- `/src/assets/js/financiamento/secao-endividamento.js` (~600 linhas)
- `/src/assets/js/financiamento/calculators/amortizacao-calculator.js` (~400 linhas)

**Arquivos Modificados:**
- `/src/pages/formulario-financiamento.html` (+150 linhas - Tab 11)
- `/src/assets/css/financiamento-styles.css` (+180 linhas)

**Commit:**
```
feat(financiamento): implementa Tab 11 - Endividamento (backend)

- Tabela dinâmica de financiamentos (até 240 meses)
- Geração automática SAC/PRICE/Americano
- Cronograma de desembolsos e pagamentos
- Resumo CET e serviço da dívida
- Integração com Investimentos (recursosTerceiros)
- Gráficos: saldo devedor, amortização vs juros
- Visibilidade: ANALISTA apenas
```

---

### FASE 2: CRONOGRAMA FINANCEIRO (SPRINT PRINCIPAL)
**Duração:** 6-8 horas
**Prioridade:** CRÍTICA

#### Sprint 10: Criar Tab 12 (6.1 - Cronograma Financeiro)

**Descrição:** Consolidar cronologicamente TODOS os usos e fontes de recursos (0-240 meses).

**Funcionalidades:**

1. **USOS - Integração Automática:**
   - **Investimentos Fixos** (da Tab 9)
   - **Capital de Giro Inicial** (da Tab 10)
   - **Variações de NCG** (da Tab 10)
   - **Outros Usos** (input manual opcional)

2. **FONTES - Integração Automática:**
   - **Financiamentos** (da Tab 11)
   - **Capital Próprio** (calculado: Usos - Financiamentos)
   - **Outras Fontes** (input manual)

3. **CRONOGRAMA HÍBRIDO (0-240 meses):**
   - **Meses 0-59:** Detalhamento mensal (60 linhas)
   - **Meses 60-239:** Consolidação anual (15 linhas - Anos 6-20)

4. **VALIDAÇÕES CRÍTICAS:**
   - ❌ Saldo acumulado < 0 → ERRO CRÍTICO (empresa quebra!)
   - ⚠️ Saldo acumulado < R$ 50.000 → ALERTA
   - ✅ Saldo acumulado >= 0 → OK

5. **VISUALIZAÇÕES:**
   - Gráfico linha: Saldo acumulado (0-60 meses)
   - Gráfico barras: Usos vs Fontes (anual)
   - Gráfico pizza: Composição Usos

6. **EXPORTAÇÃO:**
   - Excel: 3 abas (Mensal, Anual, Resumo)
   - PDF: Relatório completo com gráficos

**Estrutura de Dados:**
```javascript
{
  cronogramaFinanceiro: {
    usos: {
      investimentosFixos: [...],      // Tab 9
      capitalGiroInicial: {...},      // Tab 10
      variacoesNCG: [...],             // Tab 10
      outrosUsos: [...]                // manual
    },
    fontes: {
      financiamentos: [...],           // Tab 11
      capitalProprio: {...},           // calculado
      outrasFontes: [...]              // manual
    },
    cronogramaMensal: [                // 60 elementos
      {
        mes: 0,
        ano: 1,
        periodo: 'mensal',
        totalUsos: 6000000,
        totalFontes: 7000000,
        saldo: 1000000,
        saldoAcumulado: 1000000,
        alerta: { tipo: 'OK', ... }
      },
      // ...
    ],
    cronogramaAnual: [                 // 20 elementos
      { ano: 1, totalUsos: 8500000, totalFontes: 9000000, ... },
      // ...
      { ano: 20, totalUsos: 0, totalFontes: 0, ... }
    ],
    resumo: {
      totalUsos: 10000000,
      totalFontes: 10000000,
      saldoFinal: 250000,
      viabilidadeFinanceira: true,
      mesComMenorSaldo: 24,
      menorSaldo: 15000
    }
  }
}
```

**Arquivos Criados:**
- `/src/assets/js/financiamento/secao-cronograma.js` (~900 linhas)
- `/src/assets/js/financiamento/calculators/usos-fontes-calculator.js` (~500 linhas)

**Arquivos Modificados:**
- `/src/pages/formulario-financiamento.html` (+250 linhas - Tab 12)
- `/src/assets/css/financiamento-styles.css` (+200 linhas)
- `/src/assets/js/financiamento/financiamento-module.js` (+50 linhas)

**Commit:**
```
feat(financiamento): implementa Tab 12 - Cronograma Financeiro

- Integração automática: Investimentos + CDG + Financiamentos
- Cronograma híbrido: mensal (0-59) + anual (6-20)
- Validação crítica: saldo acumulado nunca negativo
- Alertas automáticos de viabilidade financeira
- Gráficos: saldo acumulado, usos vs fontes, composição
- Exportação Excel/PDF
- Suporte a financiamentos até 240 meses
```

---

### FASE 3: SEÇÕES OPERACIONAIS
**Duração:** 19-24 horas

#### Sprint Novo: Criar Tab 3 (2.1 - Regime Tributário)
**Duração:** 2-3 horas
**Prioridade:** MÉDIA

**Funcionalidades:**
- Regime tributário: Lucro Real, Lucro Presumido, Simples Nacional
- TMA (Taxa Mínima de Atratividade): % a.a.
- Taxa de inflação anual: %
- Período de projeção: 5 anos (fixo)
- Ano base: AAAA

**Arquivos Criados:**
- `/src/assets/js/financiamento/secao-regime.js` (~300 linhas)

**Commit:**
```
feat(financiamento): implementa Tab 3 - Regime Tributário e Premissas

- Seleção de regime tributário (Real/Presumido/Simples)
- Configuração TMA e inflação
- Parâmetros globais do projeto
```

---

#### Sprint 15: Criar Tab 4 (3.1 - Balanço Patrimonial)
**Duração:** 4-5 horas
**Prioridade:** ALTA

**Funcionalidades:**
- Ativo (Circulante, Não Circulante)
- Passivo (Circulante, Não Circulante)
- Patrimônio Líquido
- Validação: Ativo = Passivo + PL
- Indicadores: Liquidez corrente, liquidez seca, endividamento

**Arquivos Criados:**
- `/src/assets/js/financiamento/secao-balanco.js` (~500 linhas)

**Commit:**
```
feat(financiamento): implementa Tab 4 - Balanço Patrimonial

- Estrutura completa BP (ativo, passivo, PL)
- Validação contábil A = P + PL
- Indicadores de liquidez
- Alimenta Tab 10 (Capital Giro modo calculado)
```

---

#### Sprint 10: Criar Tab 5 (4.1 - Receitas)
**Duração:** 5-6 horas
**Prioridade:** ALTA

**Funcionalidades:**
- Tabela dinâmica de produtos/serviços
- Projeções 5 anos (quantidade, preço, receita)
- Totalizadores por ano
- Gráfico evolução de receitas

**Arquivos Criados:**
- `/src/assets/js/financiamento/secao-receitas.js` (~600 linhas)

**Commit:**
```
feat(financiamento): implementa Tab 5 - Receitas Projetadas

- Tabela dinâmica produtos com projeções 5 anos
- Cálculo automático receitas com inflação
- Totalizadores e taxa crescimento
- Gráfico evolução receitas
```

---

#### Sprint 11: Criar Tab 6 (4.2 - Insumos)
**Duração:** 4-5 horas
**Prioridade:** ALTA

**Funcionalidades:**
- Tabela dinâmica de insumos (MP, IS, ME, utilidades)
- Custo unitário e consumo por produto
- Projeções 5 anos com inflação
- CMV projetado
- Totalizadores por tipo

**Arquivos Criados:**
- `/src/assets/js/financiamento/secao-insumos.js` (~550 linhas)

**Commit:**
```
feat(financiamento): implementa Tab 6 - Insumos

- Tabela dinâmica insumos por tipo
- Cálculo consumo baseado em produção
- Projeções 5 anos com inflação
- CMV projetado automático
- Integração com Tab 5 (Receitas)
```

---

#### Sprint 13: Criar Tab 7 (4.3 - Recursos Humanos)
**Duração:** 5-6 horas
**Prioridade:** ALTA

**Funcionalidades:**
- Tabela dinâmica de cargos
- Salários e encargos (INSS, FGTS, férias, 13º)
- Projeções 5 anos
- Totalizadores RH produtivo vs administrativo

**Arquivos Criados:**
- `/src/assets/js/financiamento/secao-rh.js` (~600 linhas)

**Commit:**
```
feat(financiamento): implementa Tab 7 - Recursos Humanos

- Tabela dinâmica de cargos e salários
- Cálculo automático de encargos
- Projeções 5 anos
- Totalizadores por tipo (produção/admin)
```

---

#### Sprint 11A: Criar Tab 8 (4.4 - Custos Operacionais)
**Duração:** 3-4 horas
**Prioridade:** MÉDIA

**Funcionalidades:**
- Custos fixos (aluguel, seguros, etc)
- Custos variáveis (frete, comissões, etc)
- Projeções 5 anos
- Totalizadores fixos vs variáveis

**Arquivos Criados:**
- `/src/assets/js/financiamento/secao-custos.js` (~400 linhas)

**Commit:**
```
feat(financiamento): implementa Tab 8 - Custos Operacionais

- Custos Fixos com projeções
- Custos Variáveis ajustados por vendas
- Separação clara de insumos e RH
- Totalizadores fixos vs variáveis
```

---

### FASE 4: DEMONSTRAÇÕES E ANÁLISES
**Duração:** 32-40 horas

#### Sprint 12: Criar Tab 13 (7.1 - Matriz Produto-Insumo)
**Duração:** 4-5 horas

**Funcionalidades:**
- Matriz: Produtos (linhas) × Insumos (colunas)
- Quantidade de insumo por unidade de produto
- Validação com Tabs 5 e 6

**Arquivos Criados:**
- `/src/assets/js/financiamento/secao-matriz.js` (~400 linhas)

**Commit:**
```
feat(financiamento): implementa Tab 13 - Matriz Produto-Insumo

- Matriz relacional produto × insumo
- Integração com Receitas e Insumos
- Validação de consistência
```

---

#### Sprint 16: Backend - Depreciação e Amortização
**Duração:** 4 horas

**Funcionalidades:**
- Tabela de bens e ativos
- Cálculo depreciação (linear, acelerada)
- Alimenta Tab 14 (DRE)

**Arquivos Criados:**
- `/src/assets/js/financiamento/secao-depreciacao.js` (~350 linhas)

**Commit:**
```
feat(financiamento): implementa backend Depreciação

- Cálculo automático depreciação/amortização
- Integração com DRE e Balanço
```

---

#### Sprint 17: Criar Tab 14 (8.1 - DRE Projetada)
**Duração:** 5-6 horas

**Funcionalidades:**
- DRE 5 anos (anual)
- Receita Bruta → Líquida → CMV → Lucro Bruto → EBITDA → EBIT → Lucro Líquido
- Integração com todas as seções operacionais

**Arquivos Criados:**
- `/src/assets/js/financiamento/secao-dre.js` (~700 linhas)
- `/src/assets/js/financiamento/calculators/dre-calculator.js` (~400 linhas)

**Commit:**
```
feat(financiamento): implementa Tab 14 - DRE Projetada

- DRE completa 5 anos
- Integração: Receitas, CMV, Custos, RH, Depreciação
- Cálculo EBITDA, EBIT, Lucro Líquido
- Gráficos de evolução
```

---

#### Sprint 18: Criar Tab 15 (8.2 - Fluxo de Caixa)
**Duração:** 4-5 horas

**Funcionalidades:**
- Fluxo de caixa 60 meses (mensal)
- Fluxo operacional, investimento, financiamento
- Saldo acumulado
- Gráficos

**Arquivos Criados:**
- `/src/assets/js/financiamento/secao-fluxo-caixa.js` (~600 linhas)

**Commit:**
```
feat(financiamento): implementa Tab 15 - Fluxo de Caixa

- Fluxo de caixa mensal 60 meses
- Operacional + Investimento + Financiamento
- Saldo acumulado
- Integração com DRE e Cronograma
```

---

#### Sprint 5 + 6: Calculadoras VPL, TIR, Payback
**Duração:** 10-12 horas

**Funcionalidades:**
- VPL mensal e anual
- TIR (Método da Secante - Python)
- Payback simples e descontado
- Validação contra Python

**Arquivos Criados:**
- `/src/assets/js/financiamento/calculators/vpl-calculator.js` (~350 linhas)
- `/src/assets/js/financiamento/calculators/tir-calculator.js` (~400 linhas)
- `/src/assets/js/financiamento/calculators/payback-calculator.js` (~300 linhas)

**Commit:**
```
feat(financiamento): implementa calculadoras VPL, TIR, Payback

- VPL validado (diff < R$ 0,01)
- TIR com Método Secante (diff < 0.01%)
- Payback simples e descontado
- Proteções numéricas
```

---

#### Sprint 19: Criar Tab 16 (9.1 - Indicadores)
**Duração:** 5-6 horas

**Funcionalidades:**
- Dashboard com VPL, TIR, Payback, ROI
- Indicadores de liquidez, rentabilidade, endividamento
- Gráficos interativos
- Análise de viabilidade

**Arquivos Criados:**
- `/src/assets/js/financiamento/secao-indicadores.js` (~650 linhas)

**Commit:**
```
feat(financiamento): implementa Tab 16 - Dashboard Indicadores

- VPL, TIR, Payback, ROI
- Indicadores financeiros completos
- Análise de viabilidade automática
- Gráficos interativos
```

---

#### Sprint 19A: Análise de Sensibilidade
**Duração:** 4-5 horas

**Funcionalidades:**
- Análise tornado (variáveis mais sensíveis)
- Simulação Monte Carlo
- Gráficos de sensibilidade

**Arquivos Criados:**
- `/src/assets/js/financiamento/calculators/sensibilidade-calculator.js` (~450 linhas)

**Commit:**
```
feat(financiamento): implementa Análise de Sensibilidade

- Análise tornado
- Simulação Monte Carlo
- Identificação de variáveis críticas
```

---

#### Sprint Novo: Criar Tab 17 (9.2 - Impostos) - Analista
**Duração:** 4-5 horas

**Funcionalidades:**
- Cálculo detalhado de impostos
- ICMS, PIS, COFINS, IRPJ, CSLL
- Projeções 5 anos
- Economia fiscal

**Arquivos Criados:**
- `/src/assets/js/financiamento/aba-impostos.js` (~500 linhas)

**Commit:**
```
feat(financiamento): implementa Tab 17 - Impostos (analista)

- Cálculo detalhado de impostos
- Projeções 5 anos
- Análise de economia fiscal
- Visibilidade: ANALISTA
```

---

#### Sprint 23: Criar Tab 18 (9.3 - Cenários) - Analista
**Duração:** 4-5 horas

**Funcionalidades:**
- Cenário otimista (+20%)
- Cenário realista (base)
- Cenário pessimista (-20%)
- Comparação de indicadores

**Arquivos Criados:**
- `/src/assets/js/financiamento/aba-cenarios.js` (~550 linhas)

**Commit:**
```
feat(financiamento): implementa Tab 18 - Cenários (analista)

- 3 cenários: otimista, realista, pessimista
- Comparação de indicadores
- Gráficos comparativos
- Visibilidade: ANALISTA
```

---

### FASE 5: FINALIZAÇÃO
**Duração:** 20-25 horas

#### Sprint 20: Exportadores Excel e PDF
**Duração:** 6-8 horas

**Funcionalidades:**
- Excel: 18 abas (todas as seções)
- PDF: Relatório completo com gráficos

**Arquivos Modificados:**
- `/src/assets/js/financiamento/exportador-excel.js` (+500 linhas)
- `/src/assets/js/financiamento/exportador-pdf.js` (+600 linhas)

**Commit:**
```
feat(financiamento): exportadores Excel e PDF completos

- Excel: 18 abas completas
- PDF: Relatório executivo + detalhado
- Gráficos embedded
```

---

#### Sprint 21: Cross-check Entre Seções
**Duração:** 4-5 horas

**Funcionalidades:**
- Validação cruzada entre seções
- Alertas de inconsistências
- Relatório de validação

**Arquivos Criados:**
- `/src/assets/js/financiamento/cross-checker.js` (~400 linhas)

**Commit:**
```
feat(financiamento): implementa cross-check entre seções

- Validação cruzada completa
- Alertas de inconsistências
- Relatório de validação
```

---

#### Sprint 22: Integração Final e Testes
**Duração:** 6-8 horas

**Funcionalidades:**
- Testes E2E completos
- Correção de bugs
- Documentação final

**Commit:**
```
feat(financiamento): integração final e testes E2E

- Testes completos 18 tabs
- Correções finais
- Documentação atualizada
```

---

## 📅 CRONOGRAMA E ESTIMATIVAS

### Resumo por Fase

| Fase | Sprints | Duração | Dias Úteis (6h/dia) |
|------|---------|---------|---------------------|
| **0** | Navegação Hierárquica | 3-4h | 0.5 |
| **1** | 9A, 11B, 14 | 12-15h | 2-3 |
| **2** | 10 (Cronograma) | 6-8h | 1-2 |
| **3** | Novo, 15, 10, 11, 13, 11A | 19-24h | 3-4 |
| **4** | 12, 16, 17, 18, 5+6, 19, 19A, Novo, 23 | 32-40h | 5-7 |
| **5** | 20, 21, 22 | 16-21h | 3-4 |

**TOTAL:** 88-112 horas (~15-19 dias úteis de 6h)

### Próximos 5 Sprints (Prioridade MÁXIMA)

| Sprint | Tab | Seção | Duração | Status |
|--------|-----|-------|---------|--------|
| 0 | - | Navegação Hierárquica | 3-4h | 🔴 PRÓXIMO |
| 9A | 9 | 5.1 - Investimentos (240 meses) | 1-2h | 🔴 |
| 11B | 10 | 5.2 - Capital de Giro | 5-6h | 🔴 |
| 14 | 11 | 5.3 - Endividamento | 5-6h | 🔴 |
| 10 | 12 | 6.1 - Cronograma Financeiro | 6-8h | 🔴 |

**Total próximos 5:** 20-26 horas (3-4 dias úteis)

---

## 🔗 MATRIZ DE DEPENDÊNCIAS

### Legenda
- ✅ Completo
- 🟢 Sem dependências (pode executar)
- 🟡 Depende de outro sprint
- 🔴 Dependência crítica (bloqueante)

| Sprint | Tab | Seção | Depende de | Status | Prioridade |
|--------|-----|-------|------------|--------|------------|
| 0 | - | Navegação Hierárquica | - | 🔴 **CRÍTICO** | MÁXIMA |
| 9A | 9 | 5.1 - Investimentos (240m) | 8 (✅) | 🔴 | CRÍTICA |
| 11B | 10 | 5.2 - Capital de Giro | 10, 11, 11A (🟡 modo manual OK) | 🟡 | ALTA |
| 14 | 11 | 5.3 - Endividamento | 9A | 🔴 | CRÍTICA |
| 10 | 12 | 6.1 - Cronograma | 9A, 11B, 14 | 🔴 | CRÍTICA |
| Novo | 3 | 2.1 - Regime | 4 (✅) | 🟢 | MÉDIA |
| 15 | 4 | 3.1 - Balanço | 4 (✅) | 🟢 | ALTA |
| 10 | 5 | 4.1 - Receitas | Novo (Tab 3) | 🟡 | ALTA |
| 11 | 6 | 4.2 - Insumos | 10 (Tab 5) | 🟡 | ALTA |
| 13 | 7 | 4.3 - RH | - | 🟢 | MÉDIA |
| 11A | 8 | 4.4 - Custos | - | 🟢 | MÉDIA |
| 12 | 13 | 7.1 - Matriz | 10, 11 | 🟡 | BAIXA |
| 16 | - | Depreciação | 9A | 🟡 | MÉDIA |
| 17 | 14 | 8.1 - DRE | 10, 11, 11A, 13, 16 | 🟡 | ALTA |
| 18 | 15 | 8.2 - Fluxo Caixa | 10, 14, 17 | 🟡 | ALTA |
| 5+6 | - | Calculadoras | - | 🟢 | MÉDIA |
| 19 | 16 | 9.1 - Indicadores | 5+6, 17, 18 | 🟡 | ALTA |
| 19A | - | Sensibilidade | 19 | 🟡 | MÉDIA |
| Novo | 17 | 9.2 - Impostos | 17 | 🟡 | BAIXA |
| 23 | 18 | 9.3 - Cenários | Todos | 🟡 | BAIXA |
| 20 | - | Exportadores | Todos | 🟡 | BAIXA |
| 21 | - | Cross-check | Todos | 🟡 | BAIXA |
| 22 | - | Integração Final | Todos | 🟡 | BAIXA |

---

## 📝 NOTAS FINAIS

### Mudanças Principais Desta Versão

1. ✅ **Navegação Hierárquica:** 9 seções principais, 18 tabs internas
2. ✅ **Numeração Sequencial:** 1-18 (SEM letras - compatível com código)
3. ✅ **Suporte a 240 Meses:** Financiamentos de longo prazo
4. ✅ **Modelo Híbrido:** Mensal (0-59) + Anual (60-239)
5. ✅ **Tabs Protegidas:** 5.2, 5.3, 9.2, 9.3 (modo Analista)
6. ✅ **Sequência Otimizada:** Ordem lógica de dependências

### Próximos Passos Recomendados

**EXECUTAR AGORA:**
1. Sprint 0: Navegação Hierárquica (3-4h) → FUNDAMENTAL
2. Sprint 9A: Investimentos 240 meses (1-2h)
3. Sprint 11B: Capital de Giro (5-6h)
4. Sprint 14: Endividamento (5-6h)
5. Sprint 10: Cronograma Financeiro (6-8h)

**Total:** 20-26 horas (3-4 dias úteis)

---

**Versão:** 2.0 (Navegação Hierárquica + 240 Meses)
**Data:** 2025-10-18
**Status:** ✅ Pronto para execução

---

**FIM DO DOCUMENTO**
