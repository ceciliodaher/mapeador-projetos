# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
**Portal Unificado Expertzy** - Sistema dual para incentivos fiscais e mapeamento de projetos em Goiás.

Este projeto oferece **dois caminhos distintos**:

1. **Formulários de Incentivos Fiscais** - Para empresas que já têm projeto definido e querem solicitar incentivos (CEI, ProGoiás) junto à SECON-GO
2. **Questionário de Mapeamento** - Para empresas que precisam de diagnóstico, identificação de projetos e orientação estratégica (NOVO - Sprint 1 e 2)

Sistema client-side completo com portal unificado, navegação inteligente, multi-step forms, validação, IndexedDB, auto-save, import/export e integração com IA (Serena MCP).

## Project Structure

```
incentivos-formulario/
├── index.html                          # Portal principal (NOVO - Sprint Integração)
├── src/
│   ├── pages/
│   │   ├── incentivos.html            # Landing incentivos (ex-index.html)
│   │   ├── selector.html              # Seleção de programa
│   │   ├── formulario-cei.html        # Formulário CEI (14 seções)
│   │   ├── formulario-progoias.html   # Formulário ProGoiás (17 seções)
│   │   ├── questionario-mapeamento.html # Questionário (10 seções) - NOVO
│   │   └── test-indexeddb.html        # Teste IndexedDB - NOVO
│   ├── assets/
│   │   ├── images/
│   │   │   └── expertzy_logo.png
│   │   ├── css/
│   │   │   ├── styles-base.css        # Estilos compartilhados
│   │   │   ├── selector.css           # Estilos do selector
│   │   │   ├── tabs.css               # Navegação por abas
│   │   │   ├── questionario-styles.css # Estilos do questionário - NOVO
│   │   │   └── portal.css             # Estilos do portal - NOVO
│   │   └── js/
│   │       ├── database/              # Sistema IndexedDB - NOVO
│   │       │   ├── indexeddb-schema.js
│   │       │   └── indexeddb-manager.js
│   │       ├── questionario/          # Módulos do questionário - NOVO
│   │       │   ├── questionario-module.js
│   │       │   └── auto-save.js
│   │       ├── core.js
│   │       ├── validation.js
│   │       ├── export.js
│   │       ├── import.js
│   │       ├── tabs.js
│   │       ├── cei-module.js
│   │       └── progoias-module.js
│   ├── data/                          # Arquivos de dados de exemplo
│   │   ├── dados-teste-completo.json
│   │   ├── exemplo_completo_cei.json
│   │   └── Projeto_CEI_Indústria_Exemplo_S_A_2025-08-24.json
│   └── legacy/                        # Arquivos legados (mantidos para referência)
│       ├── script.js
│       ├── import-functions.js
│       └── styles.css
├── .serena/                            # Serena MCP - NOVO
│   ├── config.yaml
│   ├── agents/
│   │   ├── classificador-projetos.yaml
│   │   └── analisador-viabilidade.yaml
│   └── workflows/
│       ├── preenchimento-respondente.yaml
│       └── analise-especialista.yaml
├── config/
│   └── questionario-config.json       # NOVO
├── documentos/                         # Documentação oficial
├── tests/
├── SPRINT1_COMPLETO.md                # NOVO - Documentação Sprint 1
├── SPRINT2_COMPLETO.md                # NOVO - Documentação Sprint 2
├── INTEGRACAO_SISTEMAS.md             # NOVO - Plano de integração
├── CLAUDE.md
├── README.md
└── package.json
```

## Development Commands

### Running the Application
```bash
# Option 1: Direct file opening (simplest)
start index.html  # Windows
open index.html   # macOS
xdg-open index.html  # Linux

# Option 2: Using Python's HTTP server (recommended for development)
python -m http.server 8000
# Then navigate to http://localhost:8000

# Option 3: Using Node.js http-server
npx http-server -p 8000
# Then navigate to http://localhost:8000
```

### Validation and Testing
```bash
# No automated tests currently exist
# Manual testing:
# 1. Open index.html to test landing page
# 2. Navigate to src/pages/formulario-cei.html to test all 14 form sections
# 3. Test import/export functionality with sample JSON files from src/data/
# 4. Browser console: Check for JavaScript errors during form interaction
```

## Architecture

### Core Structure
- **Multi-page Application**: Landing page (`index.html`) + Form application (`formulario.html`)
- **Enhanced Multi-step Form**: 14 sequential sections (expanded from original 7)
- **Client-side Processing**: All data validation, storage, and processing in browser
- **Import/Export System**: JSON, Excel, CSV, and PDF export with JSON import
- **Auto-save Functionality**: Local storage persistence
- **External Dependencies**: 
  - XLSX library (CDN) for Excel export
  - jsPDF (CDN) for PDF generation
  - Google Fonts (Inter) for typography

### Key Files
- `index.html`: Landing page with project information and navigation (página principal)
- `src/pages/formulario-cei.html`: Main CEI form application with all 14 sections
- `src/pages/formulario-progoias.html`: ProGoiás form application with 17 sections
- `src/pages/selector.html`: Program selection page
- `src/assets/js/core.js`: Core form logic and utilities
- `src/assets/js/validation.js`: Form validation system
- `src/assets/js/export.js`: Export functionality (PDF, Excel, JSON, CSV)
- `src/assets/js/import.js`: JSON import functionality and data processing
- `src/assets/js/tabs.js`: Tab navigation system with free navigation
- `src/assets/css/styles-base.css`: Complete Expertzy brand styling system
- `src/data/dados-teste-completo.json`: Sample data file for testing
- `src/data/exemplo_completo_cei.json`: Complete example data structure
- `src/legacy/script.js`: Legacy monolithic script (line 3: totalSteps = 14)

### Form Sections & Navigation (14 Sections)
The form uses a step-based navigation system controlled by `currentStep` variable:
1. **Identificação do Beneficiário**: Company identification (CNPJ, registration)
2. **Descrição do Empreendimento**: Business description and location  
3. **Valor Total do Investimento**: Investment values with automatic calculation
4. **Cronograma Físico-Financeiro**: Timeline (max 36 months)
5. **Detalhamento dos Investimentos**: Detailed breakdown of investments
6. **Documentação Complementar**: File uploads (10MB limit per file)
7. **Plano de Acompanhamento**: Monitoring and reporting plan
8. **Recursos Humanos (RH) - Definições**: HR definitions and structures
9. **Recursos Humanos (RH) - Encargos**: HR costs and benefits calculation
10. **Recursos Humanos (RH) - Composição Anual**: Annual HR composition
11. **Recursos Humanos (RH) - Encargos Individuais**: Individual employee costs
12. **Setor Industrial**: Industrial sector classification and details
13. **Informações sobre Mercado**: Market information and analysis
14. **Projetos de Inovação**: Innovation projects and R&D details

### Data Flow & State Management
1. Form data collected in `formData` object via `collectFormData()`
2. Auto-save to localStorage on every field change
3. Validation happens on field blur and before section navigation
4. File uploads stored in `uploadedFiles` object as base64
5. Import system processes JSON and populates all form fields
6. Export functions generate multiple formats (Excel, PDF, JSON, CSV)

### Import/Export System
- **JSON Import**: Complete form state restoration from JSON files
- **JSON Export**: Full form data with metadata
- **Excel Export**: Structured workbook with multiple sheets (script.js:2030)
- **PDF Export**: Professional formatted document (script.js:2217)  
- **CSV Export**: Tabular data format (script.js:2935)
- **Auto-save**: Continuous localStorage backup

## Processo de Envio de Arquivos

### Status Atual
Por motivos de segurança dos dados, o upload direto de arquivos está temporariamente desabilitado. O processo atual funciona da seguinte forma:

1. **Preenchimento**: Usuário preenche todas as 14 seções do formulário
2. **Exportação**: Sistema gera arquivos PDF e JSON com os dados do projeto
3. **Envio Manual**: Usuário envia os arquivos exportados + documentos da Seção 6 para: **contato@expertzy.com.br**

### Mensagens Informativas
- **Página Inicial (index.html)**: Aviso amarelo sobre o processo simplificado de envio
- **Seção 6 (formulario.html)**: Alerta sobre segurança e instruções de envio por e-mail
- **Seção 14 (formulario.html)**: Box verde com próximos passos detalhados ao final do formulário
- **Modal de Preview**: Mantém apenas conteúdo e botões de exportação (instruções removidas para não interferir)

### Contato para Envio
- **E-mail**: contato@expertzy.com.br
- **Arquivos necessários**:
  - Projeto exportado em PDF (gerado pelo sistema)
  - Projeto exportado em JSON (para possíveis edições futuras)
  - Todos os documentos listados na Seção 6, incluindo:
    - Projeto Arquitetônico ou Layout Industrial
    - Licença Ambiental (quando exigida)
    - Certidões Negativas de Débitos (Federal, Estadual e Municipal)
    - Balanços Patrimoniais (últimos 3 exercícios e último balancete)
    - Orçamentos ou Propostas Comerciais
    - **Cronograma Físico-Financeiro Detalhado de Obras Civis** (com fases da obra, valores por etapa, prazos e curva S de desembolso)

## Business Rules & Constraints

### SECON-GO Requirements (Updated)
- **Minimum Investment**: 15% of operation value (validated in section 3)
- **Maximum Duration**: 36 months from start date
- **Required Documents**: All 14 sections must be completed for submission
- **CNPJ Validation**: Brazilian tax ID with check digit validation
- **File Size Limit**: 10MB per uploaded document
- **HR Requirements**: Detailed workforce planning with cost calculations
- **Innovation Requirements**: R&D project details and innovation metrics

### Validation Patterns
- CNPJ: `00.000.000/0000-00` format with validation algorithm
- Phone: `(00) 00000-0000` format
- Currency: Two decimal places for all monetary values (R$)
- Dates: Cannot exceed 36-month duration limit
- Percentages: Proper formatting for HR benefit calculations
- NCM: 8-digit product classification code
- CFOP: 4-digit operation code (1000-7999)
- Inscrição Estadual: State-specific validation rules

### Validações Adicionais Recomendadas
- **Faturamento**: Validar consistência entre projeções e histórico (variação máxima 50% a.a.)
- **ICMS**: Verificar alíquotas conforme NCM/CFOP e tabela CONFAZ
- **Indicadores Financeiros**: Alertar se TIR < TMA ou VPL negativo
- **Cronograma**: Validar marcos críticos e dependências entre atividades
- **Investimento Mínimo**: Garantir que atende 15% do valor da operação
- **Benefícios Fiscais**: Verificar compatibilidade entre programas (alguns são excludentes)

### Export Naming Convention
Files are automatically named: `Projeto_CEI_{CompanyName}_{Date}.{ext}`

## Common Development Tasks

### Adding New Form Fields
1. Add HTML structure in appropriate section (formulario.html)
2. Add validation in `validateField()` function (script.js)
3. Include in `collectFormData()` for export functionality
4. Update import mapping in `import-functions.js`
5. Style using existing CSS classes for consistency

### Modifying Validation Rules
- Field validators: Update `validateField()` in script.js
- Section validators: Update `validateCurrentSection()`
- Custom validations: Add to specific event listeners (e.g., CNPJ, dates, HR calculations)

### Updating Export Formats
- Excel: Modify worksheet structure in `exportToExcel()` (script.js:2030)
- PDF: Update layout in `exportToPDF()` (script.js:2217)
- JSON: Modify data structure in `exportToJSON()` (script.js:2904)
- CSV: Update column structure in `exportToCSV()` (script.js:2935)

### Working with Import System
- JSON structure mapping: Modify `handleJsonImport()` in import-functions.js
- Field population: Update form field mapping for new sections
- Validation after import: Ensure imported data passes all current validations

## Expertzy Brand Guidelines & Design System
- **Primary Red**: #FF002D (action buttons, progress bar, accents)
- **Navy Blue**: #091A30 (headers, text, navigation)
- **White**: #FFFFFF (backgrounds, contrast)
- **Gray Scale**: Complete palette from --gray-100 to --gray-900
- **Typography**: Inter font family (300-700 weights)
- **Logo**: Present in both landing page and form header (expertzy_logo.png)
- **Responsive Design**: Mobile-first approach with breakpoints
- **Professional Layout**: Clean, modern interface following corporate standards

## Cálculo de ICMS e Benefícios Fiscais

### Campos Necessários para Apuração
- **Faturamento**: Mensal por tipo de operação (vendas internas, interestaduais, exportação)
- **Alíquotas de ICMS**: Por estado de destino e tipo de operação
- **ICMS Próprio vs ICMS ST**: Identificação de produtos sujeitos a substituição tributária
- **Créditos de ICMS**: Acumulados de períodos anteriores
- **Benefícios Fiscais**: Produzir, Fomentar, Progoiás, CEI
- **Base de Cálculo**: Normal, reduzida, ou com MVA (Margem de Valor Agregado)
- **Diferimento**: Operações com ICMS diferido

### Fórmulas de Cálculo Implementáveis
```javascript
// ICMS Próprio
ICMS_Proprio = Base_Calculo × Aliquota_ICMS

// ICMS Substituição Tributária
ICMS_ST = (Base_Calculo_ST × Aliquota_Interna) - ICMS_Proprio

// Benefício CEI (Crédito Especial para Investimento)
Beneficio_CEI = ICMS_Devido × Percentual_Credito_Especial

// Economia Fiscal Mensal
Economia_Fiscal = ICMS_Sem_Beneficio - ICMS_Com_Beneficio

// Cálculo de Base com MVA
Base_Calculo_ST = Valor_Operacao × (1 + MVA)
```

### Informações Tributárias Requeridas
- **NCM/CFOP**: Classificação fiscal de produtos e operações
- **Regime Tributário**: Simples Nacional, Lucro Presumido, Lucro Real
- **Inscrição Estadual**: Ativa e regular
- **Histórico de Arrecadação**: Últimos 12 meses
- **Débitos Fiscais**: Certidões negativas atualizadas

## Indicadores de Viabilidade Econômica

### Cálculos Automáticos de Indicadores
- **TIR (Taxa Interna de Retorno)**: 
  - Calculada com base nos fluxos de caixa projetados
  - Deve ser superior à TMA (Taxa Mínima de Atratividade)
  
- **VPL (Valor Presente Líquido)**:
  - Usando TMA definida pelo usuário (geralmente 12-15% a.a.)
  - VPL > 0 indica viabilidade do projeto
  
- **Payback Simples**:
  - Tempo de recuperação do investimento sem considerar juros
  - Prazo máximo aceitável: geralmente 3-5 anos
  
- **Payback Descontado**:
  - Considera o valor do dinheiro no tempo
  - Mais conservador que o payback simples
  
- **Ponto de Equilíbrio**:
  - Faturamento necessário para cobrir custos fixos e variáveis
  - Análise de margem de segurança operacional

### Parâmetros de Análise
- **TMA (Taxa Mínima de Atratividade)**: 12-15% a.a. (customizável)
- **Taxa de Inflação**: IPCA projetado
- **Taxa de Crescimento do Setor**: Baseada em dados IBGE/associações
- **Cenários**: Otimista (+20%), Realista (base), Pessimista (-20%)

## Seções Adicionais Sugeridas para Expansão

### Seção 15: Apuração de ICMS e Benefícios Fiscais
- Cálculo automático de ICMS devido
- Simulação de economia com benefícios fiscais
- Projeção de créditos acumulados
- Análise de impacto no fluxo de caixa

### Seção 16: Indicadores de Viabilidade Econômica  
- Dashboard com TIR, VPL, Payback
- Análise de sensibilidade
- Gráficos de fluxo de caixa
- Comparativo com benchmarks do setor

### Seção 17: Propriedade Intelectual e Inovação
- Registro de patentes e marcas
- Investimentos em P&D
- Parcerias tecnológicas
- Transferência de tecnologia

### Seção 18: Sustentabilidade e Impactos Socioambientais
- Indicadores ESG (Environmental, Social, Governance)
- Certificações ambientais
- Geração de empregos diretos e indiretos
- Impacto no desenvolvimento regional

## Requisitos Adicionais para Análise Completa

### Informações Históricas Necessárias
- **Faturamento**: Últimos 3 exercícios completos
- **Balanços Patrimoniais**: 2 últimos anos auditados
- **DRE (Demonstração de Resultados)**: Detalhamento mensal último ano
- **Fluxo de Caixa**: Histórico de 12 meses
- **Impostos Pagos**: Discriminação por tipo de tributo

### Projeções Requeridas (5 anos)
- **Receita Bruta**: Por produto/serviço e canal de vendas
- **Custos e Despesas**: Fixos e variáveis detalhados
- **Investimentos**: CAPEX e capital de giro
- **Fluxo de Caixa**: Mensal para ano 1, trimestral anos 2-5
- **DRE Projetado**: Anual com cenários

### Documentação Complementar Essencial
- **Projeto Técnico**: Memorial descritivo completo
- **Licenças**: Ambiental, funcionamento, vigilância sanitária
- **Certidões**: Federal (RFB/PGFN), Estadual, Municipal, FGTS, Trabalhista
- **Contratos**: Fornecedores, clientes, parceiros estratégicos
- **Estudos**: Mercado, viabilidade técnica, impacto ambiental

## Referências e Documentos Base

### Documentos Normativos
- **Lei Estadual GO**: Regulamento do ICMS (RCTE) - Anexo IX Benefícios Fiscais
- **Instrução Normativa SECON-GO**: IN 1566/2023 - Procedimentos CEI
- **Decreto Estadual**: 9.896/2021 - Programa Produzir/Fomentar
- **Resolução CONFAZ**: Tabelas de alíquotas interestaduais

### Documentos de Apoio (pasta /documentos)
- `Informações Necessárias para Elaboração do Projeto.md`: Checklist completo SECON-GO
- `Questionário para Elaboração de Projeto Econômico-.md`: Roteiro detalhado para coleta de informações
- `Documentação e Informações-CEI.docx`: Modelo oficial de projeto
- `Informacoes_Projeto-Viabilidade.xlsx`: Planilha de cálculos financeiros
- `EBR - Payback.pdf`: Exemplo de análise de retorno de investimento
- `Projeto de Rommelag.pdf`: Case de projeto aprovado

### Fontes de Consulta
- **SECON-GO**: www.economia.go.gov.br - Modelos e formulários oficiais
- **CONFAZ**: www.confaz.fazenda.gov.br - Convênios ICMS
- **RFB**: www.gov.br/receitafederal - Tabelas NCM/CFOP
- **IBGE**: www.ibge.gov.br - Dados econômicos e setoriais
- **BNDES**: www.bndes.gov.br - Linhas de financiamento

## Notas de Implementação

### Prioridades para Desenvolvimento
1. **Fase 1**: Implementar cálculo básico de ICMS próprio
2. **Fase 2**: Adicionar ICMS ST e benefícios fiscais
3. **Fase 3**: Integrar indicadores financeiros (TIR, VPL, Payback)
4. **Fase 4**: Dashboard de análise com gráficos
5. **Fase 5**: Relatórios comparativos e cenários

### Integrações Futuras Sugeridas
- **API SEFAZ**: Consulta automática de alíquotas
- **API RFB**: Validação de NCM e CNPJ
- **API SECON-GO**: Submissão eletrônica de projetos
- **BI Tools**: Exportação para Power BI/Tableau
- **ERP**: Integração com SAP/TOTVS para dados históricos
## Sistema Dual: Incentivos vs Questionário

Este projeto oferece **dois sistemas distintos e complementares**:

### 1. Formulários de Incentivos Fiscais (Sistema Original)

**Público-alvo:** Empresas que já têm projeto definido e documentação pronta

**Fluxo de navegação:**
```
Portal (index.html)
  → Incentivos (incentivos.html)
    → Selector (selector.html)
      → CEI (formulario-cei.html) OU ProGoiás (formulario-progoias.html)
```

**Características:**
- Formulários oficiais SECON-GO
- 14 seções (CEI) ou 17 seções (ProGoiás)
- Validação completa
- Exportação PDF/JSON/Excel/CSV
- Import de dados salvos

**Páginas:** `incentivos.html`, `selector.html`, `formulario-cei.html`, `formulario-progoias.html`

---

### 2. Questionário de Mapeamento (Sistema Novo - Sprint 1 e 2)

**Público-alvo:** Empresas que precisam de diagnóstico e identificação de projetos

**Fluxo de navegação:**
```
Portal (index.html)
  → Questionário (questionario-mapeamento.html)
    → 10 seções wizard
      → Exportação JSON/PDF
        → [Futuro] Sugestão de programas
```

**Características:**
- **10 seções wizard** com navegação progressiva
- **IndexedDB nativo** para persistência local
- **Auto-save** (30s periódico + 3s debounce)
- **Classificação automática** de projetos (inovação vs comum)
- **Análise de sinergias** entre projetos
- **Exportação com checksum SHA-256**
- **Integração Serena MCP** (4 agentes especializados)

**Tecnologias:**
- IndexedDB: `indexeddb-schema.js`, `indexeddb-manager.js`
- Módulos: `questionario-module.js`, `auto-save.js`
- CSS: `questionario-styles.css`
- Config: `questionario-config.json`
- IA: `.serena/` (agents + workflows)

**Documentação completa:**
- **SPRINT1_COMPLETO.md** - Setup Serena MCP + IndexedDB
- **SPRINT2_COMPLETO.md** - Módulo respondente completo

---

### Integração Futura (Sprint 3+)

**Objetivo:** Criar fluxo integrado do questionário para os formulários

**Funcionalidades planejadas:**

1. **Sistema de Sugestão** (fim do questionário - seção 10)
   - Analisar dados coletados (projetos, faturamento, investimentos)
   - Calcular score de compatibilidade com cada programa
   - Sugerir programas adequados (CEI, ProGoiás, FOMENTAR)
   - Botões para iniciar formulário específico

2. **Mapeamento de Dados**
   - Dados da empresa (seção 1 questionário) → Seção 1 formulários
   - Projetos (seção 2 questionário) → Descrição do empreendimento
   - Timeline (seção 6 questionário) → Cronograma físico-financeiro
   - Necessidades (seção 5 questionário) → Detalhamento dos investimentos

3. **Pré-preenchimento Automático**
   - Importar JSON do questionário no formulário
   - Mapear campos compatíveis automaticamente
   - Permitir edição e complementação

**Documentação:**
- **INTEGRACAO_SISTEMAS.md** - Plano detalhado de integração

---

### Navegação entre Sistemas

**Portal Principal** (`index.html`):
- Card 1: "Formulários de Incentivos Fiscais" → Sistema de incentivos
- Card 2: "Questionário de Mapeamento" → Sistema de diagnóstico

**Breadcrumbs:**
- Todas as páginas possuem link "← Voltar ao Portal"
- Questionário possui breadcrumb: "Portal Expertzy → Questionário de Mapeamento"
- Selector possui breadcrumb implícito via botões de navegação

**Consistência:**
- Mesmo header Expertzy em todas as páginas
- Brand colors (#FF002D vermelho, #091A30 navy)
- `styles-base.css` compartilhado
- CSS específico por sistema (portal.css, questionario-styles.css, selector.css)

---

## IndexedDB Financiamento (SPRINT 3)

### Visão Geral

**Database:** `expertzy_financiamento` v1
**Schema:** `/src/assets/js/database/financiamento-indexeddb-schema.js` (463 linhas)
**Alinhamento:** 100% com `budget.py` (17 objetos Python → 4 stores JavaScript)

O schema IndexedDB para o módulo de financiamento foi **consolidado** na Sprint 3, eliminando duplicação de código e garantindo consistência com a estrutura de dados Python.

**Consolidação realizada:**
- ✅ Schema duplicado inline em `financiamento-module.js` **removido** (40 linhas)
- ✅ Schema dedicado com todos os indexes completos
- ✅ `FinanciamentoModule` refatorado para usar `window.FinanciamentoIndexedDB`
- ✅ Dependência obrigatória validada no init
- ✅ 15 testes automatizados criados

### Arquitetura: 4 Object Stores

```
expertzy_financiamento (v1)
├── formulario (dados simples)
│   ├── keyPath: 'id'
│   └── indexes: timestamp, sectionId
├── dynamicTables (126 tabelas)
│   ├── keyPath: 'id'
│   └── indexes: timestamp, sectionId, tableId (unique)
├── autosave (backup temporário)
│   ├── keyPath: 'id'
│   └── indexes: timestamp, type
└── calculatedResults (cache de cálculos)
    ├── keyPath: 'id'
    └── indexes: timestamp, calculatorType
```

### Alinhamento com budget.py

O schema JavaScript mapeia **17 objetos Python** para **4 stores otimizados**:

| Store JavaScript | Objetos Python (budget.py) |
|------------------|----------------------------|
| **formulario** | `controle`, `projeto`, `orcamento`, `tributos` (config), `estrutura_societaria` |
| **dynamicTables** | `receitas.produtos_servicos`, `quantidade`, `insumos`, `mao_obra` (producao/administrativo/ensino), `custos` (fixos/variaveis), `tributos` (tabelas), `depreciacao`, `giro`, `financiamentos`, `dividas` (curto/longo prazo), `capex` |
| **autosave** | Backup completo de `self.data` |
| **calculatedResults** | `fluxo_caixa` (mensal/anual), `dre_historico`, `bp_historico`, `indicadores` |

### API Completa

**Exportado globalmente em `window.FinanciamentoIndexedDB`:**

```javascript
// CRUD Básico
await FinanciamentoIndexedDB.saveToStore(storeName, registro);
const data = await FinanciamentoIndexedDB.loadFromStore(storeName, id);
const allData = await FinanciamentoIndexedDB.loadAllFromStore(storeName);
await FinanciamentoIndexedDB.deleteFromStore(storeName, id);
await FinanciamentoIndexedDB.clearStore(storeName);

// Buscas por Index
const results = await FinanciamentoIndexedDB.findByIndex(storeName, indexName, value);

// Utilitários
const count = await FinanciamentoIndexedDB.countRecords(storeName);
await FinanciamentoIndexedDB.deleteDatabase();
```

### Integração com FinanciamentoModule

**1. Carregamento de Scripts (ordem obrigatória):**

```html
<!-- CORRETO: Schema ANTES do módulo -->
<script src="../assets/js/database/financiamento-indexeddb-schema.js"></script>
<script src="../assets/js/financiamento/financiamento-module.js"></script>

<!-- ❌ ERRADO: Módulo sem schema -->
<script src="../assets/js/financiamento/financiamento-module.js"></script>
<!-- Erro: "Dependência obrigatória ausente - FinanciamentoIndexedDB" -->
```

**2. Inicialização no Módulo:**

```javascript
// /src/assets/js/financiamento/financiamento-module.js

class FinanciamentoModule {
  async init() {
    // Verificar dependência obrigatória
    const dependenciasObrigatorias = [
      'FinanciamentoIndexedDB',  // ⬅️ Adicionado na Sprint 3
      'TaxCalculator',
      // ... outras
    ];

    this.verificarDependencias(dependenciasObrigatorias);

    // Conectar ao IndexedDB via schema dedicado
    await this.initIndexedDB();
  }

  async initIndexedDB() {
    if (typeof window.FinanciamentoIndexedDB === 'undefined') {
      throw new Error('FinanciamentoIndexedDB não disponível');
    }

    this.db = await window.FinanciamentoIndexedDB.openDatabase();
  }

  // Métodos refatorados para usar schema dedicado
  async salvarDados(storeName, registro) {
    await window.FinanciamentoIndexedDB.saveToStore(storeName, registro);
  }

  async carregarDados(storeName, id) {
    return await window.FinanciamentoIndexedDB.loadFromStore(storeName, id);
  }
}
```

### Exemplos de Uso

**Salvar dados de seção:**
```javascript
await FinanciamentoIndexedDB.saveToStore('formulario', {
  id: 'secao1-dados',
  sectionId: 1,
  timestamp: new Date().toISOString(),
  razaoSocial: 'Empresa Exemplo LTDA',
  cnpj: '12.345.678/0001-90',
  inscricaoEstadual: '123456789'
});
```

**Salvar tabela dinâmica:**
```javascript
await FinanciamentoIndexedDB.saveToStore('dynamicTables', {
  id: 'table-produtos-ano1',
  tableId: 'table-produtos-ano1',  // Index UNIQUE
  sectionId: 8,
  timestamp: new Date().toISOString(),
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
    totals: { quantidade: 3000, preco: 125.00 }
  }
});
```

**Buscar por index:**
```javascript
// Buscar dados da seção 1
const secao1 = await FinanciamentoIndexedDB.findByIndex(
  'formulario',
  'sectionId',
  1
);

// Buscar tabela específica
const table = await FinanciamentoIndexedDB.findByIndex(
  'dynamicTables',
  'tableId',
  'table-produtos-ano1'
);
```

**Cache de cálculos:**
```javascript
// Salvar resultado de DRE calculada
await FinanciamentoIndexedDB.saveToStore('calculatedResults', {
  id: 'calc-dre-2025',
  calculatorType: 'DRE',
  timestamp: new Date().toISOString(),
  resultado: {
    receitaBruta: 1000000,
    deducoes: 100000,
    receitaLiquida: 900000,
    lucroLiquido: 200000
  },
  ttl: 3600000  // 1 hora
});

// Recuperar cálculos de DRE
const dreResults = await FinanciamentoIndexedDB.findByIndex(
  'calculatedResults',
  'calculatorType',
  'DRE'
);
```

### Testes

**Arquivo:** `/test-financiamento-indexeddb.html`

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

**Executar testes:**
```bash
# Abrir no navegador
open test-financiamento-indexeddb.html

# Clicar em "▶️ Executar Todos os Testes (15)"
```

### Troubleshooting

**Erro: "Dependência obrigatória ausente - FinanciamentoIndexedDB"**

**Causa:** Schema não foi carregado antes do módulo principal

**Solução:**
```html
<!-- ORDEM CORRETA -->
<script src="../assets/js/database/financiamento-indexeddb-schema.js"></script>
<script src="../assets/js/financiamento/financiamento-module.js"></script>
```

**Erro: "data deve conter propriedade 'id'"**

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

**Cache desatualizado após mudanças nos dados**

**Solução:**
```javascript
// Invalidar cache manualmente
await FinanciamentoIndexedDB.deleteFromStore('calculatedResults', 'calc-dre-2025');

// Ou limpar todo o cache
await FinanciamentoIndexedDB.clearStore('calculatedResults');
```

### Performance: 126 Tabelas Dinâmicas

**❌ EVITAR: Loop síncrono**
```javascript
for (const table of tables) {
  await saveTable(table);  // Muito lento
}
```

**✅ PREFERIR: Promise.all para operações independentes**
```javascript
await Promise.all(tables.map(table => saveTable(table)));
```

### Referências

- **Schema Completo:** `/src/assets/js/database/financiamento-indexeddb-schema.js`
- **Documentação:** `/src/assets/js/database/README.md` (520 linhas)
- **Testes:** `/test-financiamento-indexeddb.html` (800+ linhas)
- **Referência Python:** `/documentos/financiamento-mvp/budget.py`
- **Módulo Principal:** `/src/assets/js/financiamento/financiamento-module.js`

---

## Formulário de Financiamento - Navegação Hierárquica (SPRINT 0)

### Visão Geral

**Status:** ✅ COMPLETO (2025-10-18)
**Duração:** 4-5 horas
**Commit:** 4bad23a

Sistema de navegação hierárquica de 2 níveis implementado e funcional, organizando **7 seções principais** com **23 tabs** distribuídos.

**Arquivos Principais:**
- `tabs.js` (621 linhas) - HierarchicalNavigation class
- `formulario-financiamento.html` (+405 linhas) - Navbar hierárquico + 23 form-sections
- `financiamento-styles.css` (+246 linhas) - Estilos navegação 2 níveis
- `ROADMAP_SPRINTS_CORRIGIDO.md` (v3.0) - Documentação completa

### Estrutura Hierárquica Implementada

**NÍVEL 1:** Navbar superior com 7 seções principais
**NÍVEL 2:** Subsection-navbars com 23 tabs

```
📁 SEÇÃO 1: IDENTIFICAÇÃO (2 tabs)
   └─ 1.1 Empresa | 1.2 Projeto

📁 SEÇÃO 2: SITUAÇÃO ATUAL (5 tabs)
   └─ 2.1 Regime | 2.2 Balanço | 2.3 DRE Histórico
   └─ 2.4 Endividamento 🔒 | 2.5 Ciclos Financeiros 🔒

📁 SEÇÃO 3: OPERAÇÕES PROJETADAS (4 tabs)
   └─ 3.1 Receitas | 3.2 Insumos | 3.3 Mão-de-Obra | 3.4 Custos

📁 SEÇÃO 4: INVESTIMENTOS E FUNDING (4 tabs)
   └─ 4.1 Investimentos | 4.2 Financiamentos 🔒
   └─ 4.3 Capital de Giro 🔒 | 4.4 Usos e Fontes 🔒

📁 SEÇÃO 5: INTEGRAÇÕES (2 tabs)
   └─ 5.1 Matriz Produto-Insumo | 5.2 Depreciação 🔒

📁 SEÇÃO 6: DEMONSTRATIVOS PROJETADOS (3 tabs) - 🔒 TODAS
   └─ 6.1 DRE Projetado | 6.2 Balanço Projetado | 6.3 Fluxo de Caixa

📁 SEÇÃO 7: ANÁLISES E DECISÃO (3 tabs) - 🔒 TODAS
   └─ 7.1 Indicadores | 7.2 Impostos | 7.3 Cenários
```

**Visibilidade:**
- **Modo Usuário:** 10 tabs visíveis
- **Modo Analista:** 23 tabs visíveis (13 protegidas 🔒)

### Bugs Críticos Corrigidos

#### BUG #1: Seletor Ambíguo (CRÍTICO)

**Problema:** `querySelector('[data-section="${tabNumber}"]')` retornava **section-button** ao invés de **form-section**.

**Correção (tabs.js:207):**
```javascript
// ❌ ANTES (ambíguo)
const targetSection = document.querySelector(`[data-section="${tabNumber}"]`);

// ✅ DEPOIS (específico)
const targetSection = document.querySelector(`.form-section[data-section="${tabNumber}"]`);
```

#### BUG #2: CSS Inline Bloqueando Subtabs (CRÍTICO)

**Problema:** `style="display: none;"` inline nas subsection-navbars vencia classe `.active`.

**Correção:** Removido CSS inline de 6 subsection-navbars (seções 2-7).

```html
<!-- ❌ ANTES -->
<div class="subsection-navbar" data-parent-section="2" style="display: none;">

<!-- ✅ DEPOIS -->
<div class="subsection-navbar" data-parent-section="2">
```

#### BUG #3: Validação de Seção Incorreta

**Problema:** Validação aceitava seções 8-9 (inexistentes).

**Correção (tabs.js:115):**
```javascript
// ❌ ANTES
if (sectionNumber < 1 || sectionNumber > 9) return;

// ✅ DEPOIS
if (sectionNumber < 1 || sectionNumber > 7) return;
```

### Código-Chave: sectionMap

```javascript
// tabs.js linha 18-29
this.sectionMap = {
    1: [1, 2],           // Identificação (2 tabs)
    2: [3, 4, 5, 6, 7],  // Situação Atual (5 tabs)
    3: [8, 9, 10, 11],   // Operações Projetadas (4 tabs)
    4: [12, 13, 14, 15], // Investimentos e Funding (4 tabs)
    5: [16, 17],         // Integrações (2 tabs)
    6: [18, 19, 20],     // Demonstrativos Projetados (3 tabs)
    7: [21, 22, 23]      // Análises e Decisão (3 tabs)
};

this.protectedTabs = [6, 7, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23];
```

### Conceitos-Chave

**Endividamento vs Financiamentos:**
- **Endividamento (Tab 6):** Dívidas EXISTENTES da empresa (curto/longo prazo, fornecedores, impostos)
- **Financiamentos (Tab 13):** Funding NOVO sendo solicitado para o projeto (BNDES, FCO, FINEP)

**Depreciação Segregada (Tab 17):**
- **Existente:** Depreciação de ativos atuais da empresa
- **Pós-Investimento:** Depreciação de novos ativos do projeto

### Arquivos Modificados

| Arquivo | Mudanças | Linhas |
|---------|----------|--------|
| `formulario-financiamento.html` | Navbar + 23 form-sections + 7 placeholders | +405 |
| `tabs.js` | HierarchicalNavigation class + sectionMap | +621 |
| `financiamento-styles.css` | Estilos navegação 2 níveis | +246 |
| `ROADMAP_SPRINTS_CORRIGIDO.md` | Documentação v3.0 | Reescrito |

**Total:** +1.272 linhas (excluindo ROADMAP), 4 arquivos modificados

### Referências

- **Documentação Completa:** `/documentos/financiamento/ROADMAP_SPRINTS_CORRIGIDO.md` (v3.0)
- **Commit:** `4bad23a - feat(financiamento): implementa navegação hierárquica completa (Sprint 0)`

---

## Formulário de Financiamento - Seção 1: A Empresa (SPRINT 4)

### Visão Geral

**Status:** ✅ COMPLETO (2025-10-17)
**Duração:** 4-5 horas
**Commit:** 437f4ea

A primeira seção completamente funcional do formulário de financiamento, servindo como **template de referência** para as 16 seções restantes.

**Arquivo Principal:** `/src/assets/js/financiamento/secao-empresa.js` (525 linhas)

### Características Implementadas

- ✅ **Quadro Societário Dinâmico** com add/remove sócios
- ✅ **Validação Capital Total = 100%** em tempo real
- ✅ **Manual Clone Pattern** (consistente com `secao-receitas.js`)
- ✅ **Campo `numeroSocios` readonly** auto-calculado
- ✅ **ZERO FALLBACKS** - erros explícitos ao invés de valores default
- ✅ **Empty State Handling** - mensagens neutras vs erros
- ✅ **Integração completa IndexedDB** (coleta/restauração)
- ✅ **3 Estados de validação:** válido/inválido/neutro

### Pattern: Manual Clone (NÃO DynamicTable)

**Por que não usar DynamicTable?**
- Seções existentes usam clone manual (consistência)
- Mais simples para debugging
- Menos overhead

**Estrutura:**
```javascript
class SecaoEmpresa {
    // Add sócio via clone
    addSocioEntry() {
        const template = entries[0].cloneNode(true);
        this.updateEntryIndexes(template, 'socio', newIndex);
        this.clearEntryValues(template);
        this.addRemoveButton(template, 'socio', newIndex);
        container.appendChild(template);
    }

    // Validação em tempo real
    updateCapitalValidation() {
        // Empty state check - NO FALLBACK
        const allEmpty = participacoes.every(p => p === '' || p === null || p === undefined);
        if (allEmpty) {
            // Estado neutro
            statusDisplay.textContent = 'ℹ️ Aguardando preenchimento';
            validationBox.className = 'validation-message neutral';
            return;
        }

        // Validar via FieldValidator
        const result = window.FieldValidator.validateCapitalTotal(participacoes);
        // ... update UI ...
    }

    // Coleta de dados - NO FALLBACKS
    coletarDadosSocios() {
        const participacao = parseFloat(participacaoStr);
        if (isNaN(participacao)) {
            throw new Error(`Participação do sócio ${index} inválida`);
        }
        return { nome, tipoPessoa, documento, participacao, ... };
    }

    // Restauração - NO FALLBACKS
    restaurarDadosSocios(dados) {
        if (!Array.isArray(dados) || dados.length === 0) {
            throw new Error('dados deve ser um array não-vazio');
        }
        // ... restore logic with explicit validation ...
    }
}

window.secaoEmpresa = new SecaoEmpresa();
```

### FieldValidator - Validações Empresariais

**Arquivo:** `/src/assets/js/validation.js` (linhas 586-712)

```javascript
class FieldValidator {
    // Validar soma = 100%
    static validateCapitalTotal(participacoes) {
        // Validar cada valor - NO FALLBACKS
        for (let i = 0; i < participacoes.length; i++) {
            const p = participacoes[i];
            if (p === null || p === undefined || p === '') {
                throw new Error(`Participação do sócio ${i + 1} não informada`);
            }
            const parsed = parseFloat(p);
            if (isNaN(parsed)) {
                throw new Error(`Participação do sócio ${i + 1} inválida: "${p}"`);
            }
        }

        const total = participacoes.reduce((sum, p) => sum + parseFloat(p), 0);
        const rounded = Math.round(total * 100) / 100;

        if (rounded === 100.0) {
            return { isValid: true, total: rounded, message: '✓ Total correto' };
        } else if (rounded < 100.0) {
            const falta = (100 - rounded).toFixed(2);
            return { isValid: false, total: rounded, message: `⚠️ Faltam ${falta}%` };
        } else {
            const excede = (rounded - 100).toFixed(2);
            return { isValid: false, total: rounded, message: `❌ Excede em ${excede}%` };
        }
    }

    // Validar documentos únicos
    static validateUniqueDocuments(documentos) {
        // ... validação de duplicatas ...
    }
}

// CRITICAL: Export to window
if (typeof window !== 'undefined') {
    window.FormValidator = FormValidator;
    window.FieldFormatter = FieldFormatter;
    window.FieldAutoFormatter = FieldAutoFormatter;
    window.FieldValidator = FieldValidator; // ⬅️ ADICIONADO no SPRINT 4
}
```

### Estados de Validação

1. **Neutro (Empty State):**
   - Todos campos vazios (página carregando)
   - Mensagem: "ℹ️ Aguardando preenchimento"
   - Cor: cinza
   - **NÃO é erro**

2. **Válido:**
   - Total = 100.00%
   - Mensagem: "✓ Total correto"
   - Cor: verde

3. **Inválido:**
   - Total ≠ 100%
   - Mensagem: "⚠️ Faltam X%" ou "❌ Excede em X%"
   - Cor: vermelho/laranja

### Estrutura de Dados

```json
{
  "secao1": {
    "numeroSocios": 3,
    "socios": [
      {
        "nome": "João Silva",
        "tipoPessoa": "PF",
        "documento": "123.456.789-00",
        "participacao": 50.0,
        "qualificacao": "Sócio Administrador",
        "email": "joao@empresa.com",
        "telefone": "(62) 98765-4321"
      }
    ]
  }
}
```

### Integração com Sistema

**Coleta (financiamento-module.js linha 570):**
```javascript
socios: window.secaoEmpresa?.coletarDadosSocios() || [],
```

**Restauração (financiamento-module.js linhas 827-829):**
```javascript
if (window.secaoEmpresa?.restaurarDadosSocios && dados.secao1.socios) {
    window.secaoEmpresa.restaurarDadosSocios(dados.secao1.socios);
}
```

### NO FALLBACKS - Princípio Seguido Rigorosamente

**❌ ERRADO:**
```javascript
const value = parseFloat(participacaoField.value) || 0; // Fallback silencioso
```

**✅ CORRETO:**
```javascript
const participacaoStr = getFieldValue('participacao');
const participacao = parseFloat(participacaoStr);
if (isNaN(participacao)) {
    throw new Error(`Participação do sócio ${index} inválida: "${participacaoStr}"`);
}
```

**Exceção: Valor Inicial HTML**
```html
<input type="number" id="socio1_participacao" name="socio1_participacao"
       min="0" max="100" step="0.01" value="0.00" required>
```

**NÃO é fallback de código porque:**
- ✅ Valor **visível** no HTML (não escondido no código)
- ✅ Usuário pode ver e editar
- ✅ Similar ao padrão de telefone com zeros exemplificativos
- ✅ Resolve problema de `parseFloat("")` sem usar `|| 0` no código

### Problemas Resolvidos

1. **FieldValidator undefined** → Exportado para `window`
2. **Validação em estado inicial vazio** → Empty state check
3. **Auto-save coletando dados vazios** → Valor inicial `0.00` no HTML

### Arquivos Modificados

| Arquivo | Mudanças |
|---------|----------|
| `secao-empresa.js` | +525 linhas (NOVO) |
| `validation.js` | +127 linhas (FieldValidator) |
| `formulario-financiamento.html` | +79 linhas (Quadro Societário) |
| `financiamento-styles.css` | +214 linhas (CSS) |
| `financiamento-module.js` | +6 linhas (integração) |

**Total:** +951 linhas

### Documentação Completa

**Arquivo:** `/documentos/financiamento/SPRINT4_COMPLETO.md`

Contém:
- 8 cenários de teste manual (todos passando)
- Estrutura completa de dados
- Fluxo de integração detalhado
- Princípios NO FALLBACKS aplicados
- Troubleshooting completo

### Próximos Passos

**Sprint 5:** Seção 2 - Caracterização do Projeto (3-4 horas)
- Usar `secao-empresa.js` como template
- Aplicar mesmo padrão: NO FALLBACKS + Manual Clone + IndexedDB

---

