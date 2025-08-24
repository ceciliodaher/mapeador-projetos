# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
Web application for collecting investment credit information (CEI - Crédito Especial para Investimento) for submission to SECON-GO (Secretaria de Estado da Economia de Goiás). This is a comprehensive client-side application with landing page, multi-step form system, validation, import/export capabilities, and complete data management.

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
```

### Validation and Testing
```bash
# No automated tests currently exist
# Manual testing: 
# 1. Open index.html to test landing page
# 2. Navigate to formulario.html to test all 14 form sections
# 3. Test import/export functionality with sample JSON files
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
- `index.html`: Landing page with project information and navigation
- `formulario.html`: Main form application with all 14 sections
- `script.js`: Core form logic, validation, navigation, and export functions (line 3: totalSteps = 14)
- `import-functions.js`: JSON import functionality and data processing
- `styles.css`: Complete Expertzy brand styling system
- `dados-teste-completo.json`: Sample data file for testing
- `exemplo_completo_cei.json`: Complete example data structure

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
  - Todos os documentos listados na Seção 6

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