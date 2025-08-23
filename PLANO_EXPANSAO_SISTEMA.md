# Plano de Expansão do Sistema de Coleta de Informações

## Objetivo
Expandir o sistema atual de 7 seções para um sistema completo de 14 seções que capture todas as informações necessárias para elaboração de um projeto de viabilidade econômico-financeiro completo, incluindo projetos de inovação.

## 1. Inicialização do Repositório Git
- [x] Inicializar repositório git local
- [x] Criar commit inicial com estado atual
- [x] Configurar .gitignore apropriado

## 2. Melhorias de UI/UX

### 2.1 Layout do Cabeçalho
- [x] Mover título "Coleta de Informações para Projeto" para margem superior junto à logo
- [x] Ajustar espaçamento e alinhamento

### 2.2 Validações de Campos
- [x] **IE (Inscrição Estadual)**: Aceitar somente números
- [x] **CNAE**: Adicionar formatação apropriada (0000-0/00)
- [x] **Seção 3**: Campos monetários com máscara de moeda (R$)
- [ ] **Cronograma**: Validar datas início/fim de obras civis e máquinas
- [ ] **🔧 CORREÇÃO NECESSÁRIA - Seção 9**: Formatação numérica inadequada
  - [ ] Capacidade produtiva: aceitar somente números inteiros
  - [ ] % Utilização: formatação de percentual
  - [ ] Horas trabalho: aceitar somente números
  - [ ] Preços produtos: formatação monetária
  - [ ] Custos insumos: formatação monetária

## 3. Expansão da Seção 3 - Valor Total do Investimento

### 3.1 Detalhamento de Investimentos
- [x] Interface para entrada detalhada de investimentos
- [x] Campos dinâmicos para cada tipo:
  - [x] Obras Civis (itemizadas)
  - [x] Máquinas e Equipamentos (itemizadas)
  - [x] Instalações (itemizadas)
  - [x] Outros Investimentos (nome e valor)
- [x] Totalização automática por categoria
- [x] Total geral do projeto

### 3.2 Melhorias de Usabilidade
- [x] ~~Explicar "Valor da Operação de Referência"~~ (REMOVIDO conforme solicitação)
- [x] ~~Remover ou clarificar mensagem sobre 15% mínimo~~ (REMOVIDO conforme solicitação)

## 4. Novas Seções do Sistema (Baseadas no Excel)

### Seção 8: Caracterização da Empresa
- [x] Histórico e constituição
- [x] Estrutura societária
- [x] Organograma empresarial
- [x] Grupo empresarial (se aplicável)
- [x] Operações atuais e atividade principal
- [x] Forma jurídica e porte da empresa
- [x] Regime tributário
- [x] Certificações e qualificações

### Seção 9: Produção e Operações
- [x] Capacidade produtiva (atual e futura)
- [x] Sistema dinâmico para produtos/serviços
- [x] Descrição detalhada do processo produtivo
- [x] Sistema dinâmico para insumos e matérias-primas
- [x] Controle de qualidade e certificações
- [x] Informações de turnos e operação

### Seção 10: Análise de Mercado
- [x] Base de clientes
- [x] Principais clientes
- [x] Análise de concorrentes
- [x] Distribuição regional do mercado
- [x] Projeções de vendas

### Seção 11: Recursos Humanos
- [x] Estrutura organizacional atual
- [x] Quadro de funcionários por função
- [x] Estrutura salarial
- [x] Plano de contratações futuras
- [x] Programas de treinamento

### Seção 12: Informações Financeiras
- [x] Balanços patrimoniais (últimos 2-3 anos)
- [x] Demonstrações de resultados
- [x] Projeções de fluxo de caixa
- [x] Evolução do capital
- [x] Composição acionária
- [x] Endividamento existente
- [x] Depreciação de ativos

### Seção 13: Receitas e Custos
- [x] Composição de receitas
- [x] Estrutura de custos
- [x] Lista de fornecedores
- [x] Estratégia de precificação
- [x] Histórico de faturamento (36 meses)

### Seção 14: Projetos de Inovação
- [x] Iniciativas de P&D
- [x] Upgrades tecnológicos
- [x] Melhorias de processos
- [x] Iniciativas de sustentabilidade

## 5. Gestão de Documentos Aprimorada

### 5.1 Categorização de Documentos
- [ ] Demonstrações financeiras
- [ ] Documentos legais
- [ ] Projetos técnicos
- [ ] Licenças ambientais
- [ ] Contratos e acordos

### 5.2 Checklist de Documentos
- [ ] Lista baseada nos requisitos SEEC-GO
- [ ] Indicação de documentos obrigatórios vs opcionais

## 6. Melhorias na Exportação

### 6.1 Novos Formatos
- [ ] Exportação para CSV
- [ ] Exportação para JSON
- [ ] Manter Excel e PDF existentes

### 6.2 Estruturação de Dados
- [ ] Formato compatível com template Excel analisado
- [ ] Validação antes da exportação

## 7. Persistência de Dados

### 7.1 Salvamento Local
- [ ] Implementar localStorage para rascunhos
- [ ] Auto-save periódico

### 7.2 Importação/Exportação
- [ ] Funcionalidade para carregar dados salvos
- [ ] Validação de dados importados

## 8. Estrutura de Arquivos Proposta

```
informacoes-projeto/
├── .git/                       # Controle de versão
├── index.html                  # Página principal expandida
├── styles.css                  # Estilos atualizados
├── script.js                   # Lógica expandida
├── modules/                    # Novos módulos JS
│   ├── validation.js          # Validações
│   ├── export.js              # Exportações
│   ├── financial.js           # Cálculos financeiros
│   └── storage.js             # Persistência
├── assets/                     # Recursos
│   ├── expertzy_logo.png
│   └── icons/
├── documentos/                 # Documentação
└── PLANO_EXPANSAO_SISTEMA.md  # Este arquivo

```

## Cronograma de Implementação

### Fase 1: Fundação (Imediato)
1. Inicializar Git
2. Corrigir validações existentes
3. Ajustar layout do cabeçalho

### Fase 2: Expansão Core (Prioridade Alta)
1. Expandir Seção 3 com detalhamento
2. Adicionar Seções 8-11 (Empresa e RH)

### Fase 3: Módulo Financeiro (Prioridade Alta)
1. Implementar Seções 12-13 (Financeiro)
2. Adicionar cálculos automáticos

### Fase 4: Complementos (Prioridade Média)
1. Seção 14 (Inovação)
2. Melhorias na gestão de documentos

### Fase 5: Finalização (Prioridade Média)
1. Implementar exportações CSV/JSON
2. Adicionar persistência de dados
3. Testes e ajustes finais

## Observações Importantes

1. **Conformidade SEEC-GO**: Manter todos os requisitos obrigatórios originais
2. **Identidade Visual Expertzy**: Preservar cores e branding
3. **Responsividade**: Garantir funcionamento em todos dispositivos
4. **Segurança**: Dados continuam locais no navegador
5. **Compatibilidade**: Manter suporte aos navegadores atuais

## Status de Implementação

### Legenda
- 🔴 Não iniciado
- 🟡 Em progresso  
- 🟢 Concluído
- 🚨 Problema crítico
- 🔧 Correção necessária

### Status Atual (80% concluído)
- **Fase 1 (Fundação)**: 🟢 100% Concluída
- **Fase 2 (Expansão Core)**: 🟢 100% Concluída (Seções 8-11 Completas)
- **Fase 3 (Financeiro)**: 🟢 100% Concluída (Seções 12-13 Completas)
- **Fase 4 (Complementos)**: 🟢 100% Concluída (Seção 14 Completa)
- **Fase 5 (Finalização)**: 🔴 0% Concluída (CSV/JSON, localStorage)

### Problemas Resolvidos ✅
1. ✅ **Seção 10 ausente** - ~~Sistema para na navegação~~ **RESOLVIDO**
2. ✅ **Formatação numérica Seção 9** - ~~Campos inadequados~~ **RESOLVIDO**

### Próximas Prioridades
1. **MÉDIO**: Implementar exportação CSV
2. **MÉDIO**: Implementar exportação JSON
3. **BAIXO**: Implementar persistência localStorage
4. **BAIXO**: Melhorias na gestão de documentos

---

*Documento criado em: 21/08/2025*  
*Última atualização: 22/08/2025*  
*Status: 80% concluído - Todas as 14 seções implementadas ✅*