# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
Web application for collecting investment credit information (CEI - Crédito Especial para Investimento) for submission to SEEC-GO (Secretaria de Estado da Economia de Goiás). This is a client-side single-page application with multi-step form, validation, and export capabilities.

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
# Manual testing: Open index.html and verify all 7 form sections
# Browser console: Check for JavaScript errors during form interaction
```

## Architecture

### Core Structure
- **Static SPA**: Pure HTML/CSS/JavaScript without build process
- **Multi-step Form**: 7 sequential sections with progress tracking
- **Client-side Processing**: All data validation and storage happens in browser
- **External Dependencies**: 
  - XLSX library (CDN) for Excel export
  - jsPDF (CDN) for PDF generation
  - Google Fonts (Inter) for typography

### Key Files
- `index.html`: Complete form structure with all 7 sections
- `script.js`: Form logic, validation, navigation, and export functions
- `styles.css`: Expertzy brand styling (colors: #FF002D, #091A30, #FFFFFF)

### Form Sections & Navigation
The form uses a step-based navigation system controlled by `currentStep` variable:
1. **Identificação do Beneficiário**: Company identification (CNPJ, registration)
2. **Descrição do Empreendimento**: Business description and location
3. **Valor Total do Investimento**: Investment values with automatic calculation
4. **Cronograma Físico-Financeiro**: Timeline (max 36 months)
5. **Detalhamento dos Investimentos**: Detailed breakdown of investments
6. **Documentação Complementar**: File uploads (10MB limit per file)
7. **Plano de Acompanhamento**: Monitoring and reporting plan

### Data Flow
1. Form data collected in `formData` object via `collectFormData()`
2. Validation happens on field blur and before section navigation
3. File uploads stored in `uploadedFiles` object as base64
4. Export functions (`exportToExcel()`, `exportToPDF()`) format data for download

## Business Rules & Constraints

### SEEC-GO Requirements
- **Minimum Investment**: 15% of operation value (validated in section 3)
- **Maximum Duration**: 36 months from start date
- **Required Documents**: All 7 sections must be completed
- **CNPJ Validation**: Brazilian tax ID with check digit validation
- **File Size Limit**: 10MB per uploaded document

### Validation Patterns
- CNPJ: `00.000.000/0000-00` format with validation algorithm
- Phone: `(00) 00000-0000` format
- Currency: Two decimal places for all monetary values
- Dates: Cannot exceed 36-month duration limit

### Export Naming Convention
Files are automatically named: `Projeto_CEI_{CompanyName}_{Date}.{ext}`

## Common Development Tasks

### Adding New Form Fields
1. Add HTML structure in appropriate section (index.html)
2. Add validation in `validateField()` function (script.js)
3. Include in `collectFormData()` for export functionality
4. Style using existing CSS classes for consistency

### Modifying Validation Rules
- Field validators: Update `validateField()` in script.js
- Section validators: Update `validateCurrentSection()`
- Custom validations: Add to specific event listeners (e.g., CNPJ, dates)

### Updating Export Format
- Excel: Modify worksheet structure in `exportToExcel()` 
- PDF: Update layout in `exportToPDF()` using jsPDF API

## Expertzy Brand Guidelines
- **Primary Red**: #FF002D (action buttons, progress bar)
- **Navy Blue**: #091A30 (headers, text)
- **White**: #FFFFFF (backgrounds, contrast)
- **Typography**: Inter font family (300-700 weights)
- **Logo**: Must be present in header (expertzy_logo.png)