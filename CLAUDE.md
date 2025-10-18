# CLAUDE.md

## Project Overview
**Portal Unificado Expertzy** - Sistema dual para incentivos fiscais e mapeamento de projetos em Goiás.

**Dois caminhos distintos:**
1. **Formulários de Incentivos Fiscais** - CEI, ProGoiás (14-17 seções)
2. **Questionário de Mapeamento** - Diagnóstico e identificação de projetos (10 seções)

Sistema client-side com multi-step forms, validação, IndexedDB, auto-save, import/export, integração Serena MCP.

## Project Structure

```
mapeador-projetos/
├── index.html                          # Portal principal
├── src/
│   ├── pages/                          # Páginas do sistema
│   │   ├── formulario-financiamento.html  # 7 seções, 23 tabs (hierárquico)
│   │   ├── formulario-cei.html         # 14 seções
│   │   ├── formulario-progoias.html    # 17 seções
│   │   └── questionario-mapeamento.html # 10 seções
│   ├── assets/
│   │   ├── css/                        # Estilos (styles-base.css, tabs.css, etc)
│   │   └── js/
│   │       ├── database/               # IndexedDB schemas
│   │       ├── financiamento/          # Módulos financiamento
│   │       ├── questionario/           # Módulos questionário
│   │       └── shared/                 # Componentes compartilhados
│   └── data/                           # JSONs de teste
├── documentos/                         # Docs detalhadas (PRDs, SPRINTs)
└── .serena/                            # Serena MCP (agents, workflows)
```

## Development Commands

```bash
# Executar aplicação
open index.html                    # macOS
python -m http.server 8000         # ou HTTP server
npx http-server -p 8000

# Serena MCP
uvx --from git+https://github.com/oraios/serena serena start-mcp-server
```

## Architecture Principles

**NO FALLBACKS, NO HARDCODED DATA**
- SEMPRE lance exceções explícitas quando componentes obrigatórios não estão disponíveis
- `throw new Error('Component X não disponível - obrigatório para o fluxo')`
- EVITE duplicação de lógica entre módulos
- ZERO MOCK DATA (exceto se solicitado explicitamente)

**Single Source of Truth**
- Uma função, um propósito, um lugar
- Módulo que cria, nomeia - demais seguem
- Nomenclatura única

**Client-side Processing**
- Multi-step forms com navegação hierárquica
- IndexedDB para persistência local
- Auto-save (30s periódico + 3s debounce)
- Import/Export: JSON, Excel, PDF, CSV
- Validação em tempo real

**Design System**
- Primary Red: #FF002D
- Navy Blue: #091A30
- Typography: Inter (300-700)
- Mobile-first responsive

## Key Files & Modules

**Formulário Financiamento** (7 seções, 23 tabs hierárquicos)
- `formulario-financiamento.html` - Estrutura HTML
- `tabs.js` (621 linhas) - HierarchicalNavigation class
- `financiamento-module.js` - Módulo principal
- `financiamento-indexeddb-schema.js` (463 linhas) - Schema IndexedDB

**Seções Implementadas:**
- Tab 1: Empresa (secao-empresa.js) - Quadro societário dinâmico ✅
- Tab 2: Caracterização do Projeto (secao-projeto.js) ✅
- Tab 2.5: Ciclos Financeiros (secao-ciclos-financeiros.js) - PME desagregado, NCG calculada ✅
- Tab 8: Receitas (secao-receitas.js) - DynamicTable com 126 tabelas
- Tab 9-11: Insumos, Mão-de-Obra, Custos (PENDENTE)
- Tab 12-23: Investimentos, Demonstrativos, Análises (🔒 Protegidas - analista)

**Validação:**
- `validation.js` - FormValidator, FieldValidator, FieldFormatter
- Validação em tempo real, empty state handling
- Capital Total = 100% (seção empresa)

**IndexedDB:**
- 4 stores: formulario, dynamicTables, autosave, calculatedResults
- Alinhamento 100% com budget.py (17 objetos Python → 4 stores JS)
- Tab 2.5: ciclosFinanceiros (PME desagregado, ciclos calculados, NCG)

**Calculadores:**
- `calculador-ciclos-financeiros.js` - PME ponderado, Ciclo Operacional/Financeiro, NCG (NO FALLBACKS)
- `calculador-indicadores.js` - VPL, TIR (Secante), Payback
## Sistema Dual

**1. Formulários de Incentivos Fiscais**
- Fluxo: Portal → Selector → CEI/ProGoiás
- 14 seções (CEI) ou 17 seções (ProGoiás)
- Exportação: PDF/JSON/Excel/CSV

**2. Questionário de Mapeamento**
- Fluxo: Portal → Questionário (10 seções wizard)
- Auto-save, classificação automática projetos
- Integração Serena MCP (4 agentes especializados)
- Docs: SPRINT1_COMPLETO.md, SPRINT2_COMPLETO.md

**3. Formulário de Financiamento** (Sistema Novo)
- Navegação hierárquica: 7 seções principais → 23 tabs
- 10 tabs visíveis (usuário) + 13 protegidas (analista 🔒)
- Docs: ROADMAP_SPRINTS_CORRIGIDO.md (v3.0)

## Validation Patterns

**CNPJ:** `00.000.000/0000-00` com algoritmo de validação
**Phone:** `(00) 00000-0000`
**Currency:** 2 decimais para valores monetários (R$)
**NCM:** 8 dígitos
**CFOP:** 4 dígitos (1000-7999)

## Referências

**Documentação Detalhada:**
- `ROADMAP_SPRINTS_CORRIGIDO.md` (v3.0) - Navegação hierárquica
- `SPRINT4_COMPLETO.md` - Seção 1 Empresa (template)
- `SPRINT2_COMPLETO.md` - Questionário completo
- `INTEGRACAO_SISTEMAS.md` - Plano integração

**Arquivos de Configuração:**
- `questionario-config.json` - Config questionário
- `.serena/config.yaml` - Serena MCP
- `config/auth-config.json` - Autenticação

