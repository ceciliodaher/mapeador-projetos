# Portal Unificado Expertzy
## Sistema Integrado de Mapeamento de Projetos e Incentivos Fiscais

[![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)](https://github.com/expertzy)
[![Build Tool](https://img.shields.io/badge/build-Vite%205-646CFF.svg)](https://vitejs.dev/)
[![License](https://img.shields.io/badge/license-Proprietary-red.svg)](LICENSE)

Sistema dual para incentivos fiscais estaduais (CEI, ProGoiás) e questionários de mapeamento de projetos (Diagnóstico, Financiamento Tradicional, Inovação & Lei do Bem).

---

## 🎯 Visão Geral

O Portal Expertzy oferece **dois caminhos distintos e complementares**:

### 1️⃣ Formulários de Incentivos Fiscais
Para empresas que **já têm projeto definido** e documentação pronta:
- **CEI** - Crédito Especial para Investimento (14 seções)
- **ProGoiás** - Programa de Desenvolvimento Industrial de Goiás (17 seções)

### 2️⃣ Questionários de Mapeamento
Para empresas que **precisam de diagnóstico** e identificação de projetos:
- **Diagnóstico Geral** - Mapeamento de necessidades (10 seções)
- **Financiamento Tradicional** - Viabilidade econômico-financeira (12 seções) ⭐ **NOVO**
- **Inovação & Lei do Bem** - Projetos inovadores e incentivos fiscais (13 seções) ⭐ **NOVO**

---

## 🚀 Quick Start

### Pré-requisitos
- Node.js 16+ instalado
- Git instalado

### Instalação

```bash
# Clone o repositório
git clone https://github.com/expertzy/mapeador-projetos.git
cd mapeador-projetos

# Instale as dependências
npm install

# Inicie o servidor de desenvolvimento
npm run dev
```

O servidor abrirá automaticamente em `http://localhost:3000`

### Scripts Disponíveis

```bash
npm run dev        # Inicia servidor de desenvolvimento com HMR
npm run build      # Gera build otimizado para produção
npm run preview    # Preview do build de produção
npm start          # Alias para 'npm run dev'
npm test           # Executa testes E2E com Playwright
```

---

## 📦 Estrutura do Projeto

```
mapeador-projetos/
├── config/                                # Arquivos de configuração JSON
│   ├── cei-config.json                   # Config CEI (14 seções)
│   ├── progoias-config.json              # Config ProGoiás (17 seções)
│   ├── questionario-config.json          # Config Diagnóstico (10 seções)
│   ├── financiamento-config.json         # Config Financiamento (12 seções) ⭐ NOVO
│   └── inovacao-config.json              # Config Inovação (13 seções) ⭐ NOVO
│
├── src/
│   ├── pages/                            # HTML pages (entry points Vite)
│   │   ├── formulario-cei.html
│   │   ├── formulario-progoias.html
│   │   ├── formulario-financiamento.html # ⭐ NOVO
│   │   ├── formulario-inovacao.html      # ⭐ NOVO
│   │   ├── questionario-mapeamento.html
│   │   └── selector.html
│   │
│   ├── assets/
│   │   ├── css/
│   │   │   ├── styles-base.css           # Estilos compartilhados
│   │   │   ├── cei-styles.css
│   │   │   ├── progoias-styles.css
│   │   │   ├── questionario-styles.css
│   │   │   ├── financiamento-styles.css  # ⭐ NOVO
│   │   │   └── inovacao-styles.css       # ⭐ NOVO
│   │   │
│   │   └── js/
│   │       ├── core/                     # Módulos compartilhados
│   │       ├── database/                 # IndexedDB schemas e managers
│   │       ├── shared/                   # Componentes reutilizáveis
│   │       ├── utils/                    # Utilidades (masks, validators)
│   │       ├── cei-module.js
│   │       ├── progoias-module.js
│   │       ├── questionario/
│   │       ├── financiamento/            # ⭐ NOVO (Fase 3)
│   │       └── inovacao/                 # ⭐ NOVO (Fase 4)
│   │
│   └── data/                             # Exemplos de dados
│
├── .serena/                              # Serena MCP Configuration
│   ├── config.yaml
│   ├── agents/
│   └── workflows/
│
├── documentos/                           # Documentação oficial
│   ├── arquitetura/
│   ├── modulos/
│   └── integracao/
│
├── tests/                                # Playwright E2E tests
├── public/                               # Assets estáticos
├── vite.config.js                        # Configuração Vite ⭐ NOVO
├── package.json
├── FOLLOW_UP.md                          # Tracking de progresso ⭐ NOVO
└── README.md
```

---

## 🎨 Identidade Visual Expertzy

### Paleta de Cores
- **Vermelho Principal**: `#FF002D` (Energia, Velocidade, Força)
- **Azul Marinho**: `#091A30` (Segurança, Intelecto, Precisão)
- **Branco**: `#FFFFFF` (Respeito, Proteção, Transparência)

### Tipografia
- **Fonte**: Inter (Google Fonts)
- **Pesos**: 300, 400, 500, 600, 700

### Conceitos da Marca
- Moderna e atual
- Estratégica e inteligente
- Clean e minimalista
- Foco em monitoramento e precisão

---

## ⚙️ Tecnologias

### Core
- **Vite 5.x** - Build tool moderno com HMR
- **JavaScript ES6+** - Módulos nativos, async/await
- **HTML5** - Semântico e acessível
- **CSS3** - Grid, Flexbox, variáveis CSS

### Persistência
- **IndexedDB** - Storage local estruturado
- **Auto-save** - Salvamento automático (30s + debounce 3s)

### Bibliotecas
- **Chart.js** - Visualizações financeiras
- **jsPDF** - Geração de PDFs client-side
- **SheetJS (xlsx)** - Exportação para Excel
- **DOMPurify** - Sanitização de inputs

### IA & Análise
- **Serena MCP** - Análise inteligente de projetos
- 4 Agentes especializados
- 3 Workflows de análise

---

## 📋 Módulos Disponíveis

### CEI - Crédito Especial para Investimento (14 seções)
Formulário oficial SECON-GO para solicitação de incentivos fiscais.

**Seções:**
1. Identificação do Beneficiário
2. Descrição do Empreendimento
3. Valor Total do Investimento
4. Cronograma Físico-Financeiro
5. Detalhamento dos Investimentos
6. Documentação Complementar
7. Plano de Acompanhamento
8. Recursos Humanos - Definições
9. Recursos Humanos - Encargos
10. Recursos Humanos - Composição Anual
11. Recursos Humanos - Encargos Individuais
12. Setor Industrial
13. Informações sobre Mercado
14. Projetos de Inovação

### ProGoiás - Programa de Desenvolvimento Industrial (17 seções)
Formulário para solicitação de benefícios do ProGoiás.

**Destaques:**
- Matriz insumo-produto interativa
- Cálculos automáticos de ICMS
- Benefícios fiscais projetados
- Validação de percentuais

### Questionário de Mapeamento (10 seções)
Diagnóstico geral para identificação de necessidades.

**Recursos:**
- Classificação automática de projetos (inovação vs comum)
- Análise de sinergias
- Sugestão de programas compatíveis
- Export com checksum SHA-256

### ⭐ Financiamento Tradicional (12 seções) - NOVO v2.0
Estudo de viabilidade econômico-financeira para bancos e instituições.

**Funcionalidades:**
- DRE (Demonstração do Resultado do Exercício)
- Fluxo de Caixa projetado
- **Indicadores financeiros:**
  - VPL (Valor Presente Líquido)
  - TIR (Taxa Interna de Retorno)
  - Payback Simples e Descontado
- Balanço patrimonial
- Matriz insumo-produto

**Nota:** TMA e todos os parâmetros devem ser fornecidos pelo usuário/analista. **SEM DADOS HARDCODED**.

### ⭐ Inovação & Lei do Bem (13 seções) - NOVO v2.0
Projetos inovadores, Lei do Bem (11.196/2005) e captação de investimentos.

**Funcionalidades:**
- **TRL Calculator** (Technology Readiness Level 1-9)
- **Lei do Bem Calculator:**
  - Dedução IRPJ/CSLL (60-70%)
  - Bônus inovação (20%)
  - Depreciação acelerada
- Gestão de Propriedade Intelectual
- Classificação de inovação (Incremental, Modular, Arquitetural, Radical)
- Export formato FINEP/MCTI

---

## 🔧 Desenvolvimento

### Arquitetura

O sistema segue princípios rigorosos:
- ✅ **KISS** (Keep It Simple, Stupid)
- ✅ **DRY** (Don't Repeat Yourself)
- ✅ **SOLID** (Principles)
- ✅ **NO HARDCODED DATA** - Tudo em arquivos de config
- ✅ **NO FALLBACKS** - Exceções explícitas quando componentes ausentes

### Module Aliases

Vite está configurado com aliases para imports limpos:

```javascript
import { validate } from '@core/validation';
import { IndexedDBManager } from '@database/indexeddb-manager';
import { calculateVPL } from '@shared/financial/indicadores-calculator';
```

**Aliases disponíveis:**
- `@core` → `src/assets/js/core`
- `@database` → `src/assets/js/database`
- `@shared` → `src/assets/js/shared`
- `@utils` → `src/assets/js/utils`
- `@config` → `config`

### Code Splitting

Vite automaticamente separa:
- `vendor-charts` - Chart.js
- `vendor-pdf` - jsPDF
- `vendor-excel` - SheetJS

### Hot Module Replacement (HMR)

Durante desenvolvimento, mudanças são refletidas instantaneamente sem reload completo da página.

---

## 🧪 Testes

### E2E Tests (Playwright)

```bash
# Executar todos os testes
npm test

# Testes específicos
npm run test:screenshots    # Screenshots de todas as seções
npm run test:navigation     # Navegação entre seções
npm run test:e2e            # Suite completa

# Debug mode
npm run test:debug

# Ver relatório
npm run test:report
```

---

## 🔒 Segurança e Privacidade

- **Client-side only**: Todos os dados ficam no navegador
- **IndexedDB local**: Nenhuma transmissão para servidores externos
- **Modo Analista**: Acesso restrito via query params autenticados
  ```
  ?_analyst_mode=true&_analyst_key=<hash_sha256>
  ```
- **Sanitização**: DOMPurify em todos os inputs
- **Validação**: Schemas rigorosos para todos os formulários

---

## 📊 Roadmap

### ✅ Fase 1: Setup Vite (Concluída)
- [x] vite.config.js com multi-page
- [x] Configs financiamento e inovação
- [x] FOLLOW_UP.md para tracking

### 🔄 Fase 2: Refatoração Core (Em Andamento)
- [ ] Aplicar SOLID aos módulos core
- [ ] Shared components (financial, charts, forms)
- [ ] Schema manager genérico

### ⏳ Fase 3-7: Próximas Fases
Consulte `FOLLOW_UP.md` para detalhes completos do cronograma.

---

## 📚 Documentação

### Técnica
- **Arquitetura**: `documentos/arquitetura/ARCHITECTURE.md`
- **Vite Setup**: `documentos/arquitetura/VITE_SETUP.md` (em breve)
- **Core Modules**: `documentos/arquitetura/CORE_MODULES.md` (em breve)

### Módulos
- **CEI**: `documentos/modulos/CEI.md`
- **ProGoiás**: `documentos/modulos/PROGOIAS.md`
- **Financiamento**: `documentos/modulos/FINANCIAMENTO.md` (em breve)
- **Inovação**: `documentos/modulos/INOVACAO.md` (em breve)

### Integração
- **Serena MCP**: `documentos/integracao/SERENA_MCP.md`
- **Fluxo Completo**: `documentos/integracao/FLUXO_COMPLETO.md`

---

## 🆘 Suporte

### Contatos
- **Email**: contato@expertzy.com.br
- **Telefone/WhatsApp**: (62) 99654-3141
- **Website**: www.expertzy.com.br

### Consultoria
A Expertzy oferece:
- Preenchimento assistido de formulários
- Análise de viabilidade de projetos
- Estratégia tributária personalizada
- Acompanhamento de processos junto à SECON-GO

---

## 📝 Changelog

### v2.0.0 (14/10/2025) - ⭐ Major Release
- ✨ Migração para Vite 5
- ✨ Novo módulo: Financiamento Tradicional (12 seções)
- ✨ Novo módulo: Inovação & Lei do Bem (13 seções)
- ✨ FOLLOW_UP.md para tracking de progresso
- ✨ Configs sem dados hardcoded (NO HARDCODED DATA)
- ✨ Module aliases para imports limpos
- 🔧 Build otimizado com code splitting
- 🔧 HMR (Hot Module Replacement)

### v1.x
- Módulos CEI e ProGoiás
- Questionário de Mapeamento
- IndexedDB e auto-save
- Serena MCP

Ver `CHANGELOG.md` para histórico completo (em breve).

---

## 💻 Compatibilidade

### Navegadores
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Sistemas Operacionais
- Windows 10/11
- macOS 10.15+
- Linux (distribuições modernas)

### Requisitos
- JavaScript habilitado
- IndexedDB suportado
- Cookies/LocalStorage habilitados

---

## 📄 Licença

Copyright © 2025 Expertzy - Inteligência Tributária
Todos os direitos reservados.

Este software é proprietário e confidencial.

---

## 🤝 Contribuindo

Este é um projeto privado da Expertzy. Para contribuições internas, consulte `CONTRIBUTING.md`.

---

**Desenvolvido com ❤️ por Expertzy + Claude Code**
