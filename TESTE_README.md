# 🧪 Teste Automatizado Completo - Sistema CEI

## 📋 Descrição
Este teste automatizado preenche todos os 14 formulários do sistema CEI, captura screenshots de cada seção e testa todas as funcionalidades de exportação.

## 🚀 Como Executar o Teste

### 1. Instalar Dependências
```bash
# Instalar Playwright
npm install

# Instalar navegador Chromium
npx playwright install chromium
```

### 2. Executar o Teste
```bash
# Executar teste com navegador visível
npm test

# Ou executar diretamente
node test-completo.js
```

## 📸 Screenshots
Os screenshots são salvos automaticamente na pasta `./screenshots/` com os seguintes nomes:
- `secao-01-identificacao.png`
- `secao-02-empreendimento.png`
- `secao-03-investimento.png`
- `secao-04-cronograma.png`
- `secao-05-detalhamento.png`
- `secao-06-documentacao.png`
- `secao-07-acompanhamento.png`
- `secao-08-empresa.png`
- `secao-09-producao.png`
- `secao-10-mercado.png`
- `secao-11-rh.png`
- `secao-12-financeiro.png`
- `secao-13-receitas.png`
- `secao-14-inovacao.png`
- `preview-completo.png`

## 📊 Exportações Testadas
O teste valida as seguintes exportações:
- ✅ Excel (.xlsx)
- ✅ PDF (.pdf)
- ✅ JSON (.json)
- ✅ CSV (.csv)
- ✅ Salvamento no localStorage

## 🔍 O Que é Testado

### Campos Testados por Seção:

#### Seção 1 - Identificação do Beneficiário
- Dados da empresa (CNPJ, Razão Social, etc.)
- Endereço completo
- Dados do responsável legal

#### Seção 2 - Descrição do Empreendimento
- Tipo e setor de atividade
- Objetivos e metas
- Localização do empreendimento

#### Seção 3 - Valor Total do Investimento
- Valores monetários com formatação R$
- Percentuais de recursos
- Condições de financiamento

#### Seção 4 - Cronograma
- Datas de início e término
- Prazo de execução

#### Seção 5 - Detalhamento dos Investimentos
- Itens dinâmicos de obras civis
- Máquinas e equipamentos
- Cálculos automáticos de totais

#### Seção 6 - Documentação
- Interface de upload (não testa upload real)

#### Seção 7 - Plano de Acompanhamento
- Metodologia e indicadores
- Frequência de relatórios

#### Seção 8 - Caracterização da Empresa
- Histórico, missão, visão, valores
- Certificações

#### Seção 9 - Capacidade de Produção
- Capacidades atual e futura
- Produtos (lista dinâmica)
- Insumos (lista dinâmica)

#### Seção 10 - Análise de Mercado
- Tamanho e participação no mercado
- Distribuição regional (soma = 100%)
- Clientes e concorrentes (listas dinâmicas)

#### Seção 11 - Recursos Humanos
- Número de funcionários
- Políticas de RH
- Funcionários e contratações (listas dinâmicas)

#### Seção 12 - Análise Econômico-Financeira
- Indicadores financeiros
- Balanços (lista dinâmica)
- Cálculo automático de capacidade de pagamento

#### Seção 13 - Projeção de Receitas
- Receitas projetadas (5 anos)
- Custos e margens

#### Seção 14 - Inovação e Sustentabilidade
- Projetos de inovação
- Práticas sustentáveis
- Responsabilidade social

## ✅ Validações Realizadas

### Formatações Numéricas:
- **Monetários**: R$ com separador de milhares e decimais
- **Inteiros**: Apenas números inteiros em campos de quantidade
- **Percentuais**: Limitados a 0-100%

### Cálculos Automáticos:
- Totais de investimentos
- Capacidade de pagamento
- Subtotais por categoria

### Navegação:
- Progressão entre seções
- Barra de progresso
- Validação antes de avançar

## 🐛 Problemas Conhecidos Corrigidos
- ✅ Campos monetários sem formatação R$
- ✅ Campos inteiros aceitando decimais
- ✅ Loops de formatação em focus/blur
- ✅ Cálculos não atualizando
- ✅ Campos dinâmicos sem formatação

## 📝 Observações
- O teste usa dados fictícios mas válidos
- CNPJ e CPF são números válidos de teste
- Valores monetários são realistas para um projeto industrial
- O teste demora aproximadamente 2-3 minutos para completar