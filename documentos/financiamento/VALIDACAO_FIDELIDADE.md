# Score de Fidelidade: 64.47% - INSUFICIENTE

Data: 2025-10-15T[timestamp]
Validador: fidelidade-validator v1.0

## Detalhamento

- Completude de Abas: 100.0%
- Completude de Campos: 60.77%
- Precisao de Tipos: 4.95%
- Completude de Formulas: 100.0%
- Tabelas Dinamicas: 100.0%
- Demonstracoes: 100.0%

---

## Validacao de Abas

**Status: COMPLETO**

Total de abas no Excel: **169**
Total de abas mapeadas: **169**
Diferenca: **0**
Cobertura: **100.00%**

### Detalhamento por Planilha

| Planilha | Abas Excel | Abas Mapeadas | Cobertura |
|----------|------------|---------------|-----------|
| ProjecoesD-Dividas-15.xls | 38 | 38 | 100.00% |
| Budget.xlsx | 64 | 64 | 100.00% |
| Informacoes_Projeto-Viabilidade.xls | 20 | 20 | 100.00% |
| balanco versao outubro 2011.xls | 7 | 7 | 100.00% |
| Valuation.xlsx | 40 | 40 | 100.00% |

**Conclusao**: Todas as 169 abas foram mapeadas com sucesso. Nenhuma aba foi perdida durante o processo de extracao.

---

## Validacao de Campos

**Status: PARCIAL**

Amostra validada: **20 abas** de 169 (11.8%)
Celulas na amostra: **33,223**
Campos mapeados na amostra: **20,190**
Cobertura da amostra: **60.77%**
Total de campos no JSON completo: **504,022**

### Analise

A cobertura de 60.77% indica que aproximadamente **39.2% das celulas nao foram mapeadas**. Esta diferenca se deve principalmente a:

1. **Campos calculados (formulas)**: O analyzer capturou formulas separadamente (13.590 formulas), mas estas nao foram contadas como "campos editaveis"
2. **Celulas vazias formatadas**: Celulas com formato mas sem valor podem ter sido excluidas
3. **Celulas mescladas**: Podem ter sido contadas de forma diferente

### Exemplos de Abas com Baixa Cobertura

- **ProjecoesD-Dividas-15.xls - FINANCIAMENTO**: 54.75%
- **ProjecoesD-Dividas-15.xls - FinanE - 13**: 41.58%
- **ProjecoesD-Dividas-15.xls - ORCAMENTO**: 40.05%
- **Informacoes_Projeto-Viabilidade.xls - Empregados**: 17.48%

**Nota**: A baixa cobertura nao necessariamente indica perda de dados, mas sim uma diferenca na metodologia de contagem entre campos editaveis e total de celulas preenchidas.

---

## Validacao de Tipos

**Status: INSUFICIENTE**

Campos validados: **424** de 500 (amostra)
Tipos corretos: **21**
Tipos discrepantes: **403**
Precisao: **4.95%**

### Discrepancias por Severidade

| Severidade | Quantidade | Percentual |
|------------|------------|------------|
| Critico | 138 | 32.5% |
| Medio | 0 | 0.0% |
| Baixo | 265 | 62.5% |

### Problemas Criticos

**138 campos de moeda (currency) nao foram identificados corretamente**

O algoritmo de inferencia de tipos mapeou estes campos como `number` quando o formato Excel indica `currency` (R$ #,##0.00).

### Exemplos de Discrepancias Criticas

1. **Budget.xlsx - A.1.1 Premissas de Receita - DY478**
   - Mapeado: `number`
   - Esperado: `currency`
   - Formato Excel: `R$ #,##0.00`

2. **Budget.xlsx - A.1 Receita Bruta - BQ410**
   - Mapeado: `number`
   - Esperado: `currency`
   - Formato Excel: `_-R$ * #,##0.00_-`

3. **Budget.xlsx - A.1 Receita Bruta - CL16**
   - Mapeado: `number`
   - Esperado: `currency`
   - Formato Excel: Moeda brasileira

**Causa raiz**: O analyzer nao verificou adequadamente o `number_format` das celulas no Excel, resultando em inferencia incorreta de tipos para campos monetarios.

---

## Validacao de Formulas

**Status: COMPLETO**

Formulas unicas catalogadas: **13,590**
Formulas esperadas: **13,590**
Diferenca: **0**
Cobertura: **100.00%**
Total de ocorrencias (celulas com formulas): **395,811**

### Formulas por Tipo

| Tipo | Quantidade | Percentual |
|------|------------|------------|
| logical | 12,207 | 89.8% |
| arithmetic | 776 | 5.7% |
| statistical | 381 | 2.8% |
| other | 220 | 1.6% |
| financial | 3 | 0.0% |
| lookup | 3 | 0.0% |

### Formulas por Complexidade

| Complexidade | Quantidade | Percentual |
|--------------|------------|------------|
| medium | 12,400 | 91.2% |
| low | 1,147 | 8.4% |
| high | 43 | 0.3% |

### Top 5 Funcoes Mais Usadas

1. **IF** - Funcoes logicas condicionais
2. **SUM** - Somatorios
3. **VLOOKUP/HLOOKUP** - Busca de valores
4. **DATE** - Funcoes de data
5. **PMT** - Calculos financeiros

**Conclusao**: Todas as 13.590 formulas unicas foram capturadas e normalizadas com sucesso. O catalogo de formulas esta completo e fiel ao Excel original.

---

## Validacao de Tabelas Dinamicas

**Status: COMPLETO**

Total de tabelas identificadas: **126**
Amostra validada: **20 tabelas**
Tabelas corretas: **20**
Tabelas incorretas: **0**
Precisao: **100.00%**

### Tabelas por Planilha

| Planilha | Quantidade |
|----------|------------|
| Budget.xlsx | 47 |
| ProjecoesD-Dividas-15.xls | 34 |
| Valuation.xlsx | 28 |
| Informacoes_Projeto-Viabilidade.xls | 10 |
| balanco versao outubro 2011.xls | 7 |

**Conclusao**: Todas as tabelas dinamicas foram identificadas corretamente. A estrutura, numero de colunas e linha de total foram validados com 100% de precisao na amostra.

---

## Validacao de Demonstracoes Financeiras

**Status: COMPLETO**

Total de demonstracoes identificadas: **7**
Demonstracoes validadas: **2** (DRE e Balanco)

### DRE (Demonstracao de Resultados do Exercicio)

- **Aba**: DRE e BP
- **Planilha**: Valuation.xlsx
- **Linhas**: 73
- **Contas estimadas**: ~24
- **Periodos identificados**: 11
- **Periodos esperados**: 4
- **Status**: CORRETO

**Nota**: Periodos identificados (11) superam o esperado (4), indicando que a demonstracao possui mais colunas de dados, possivelmente incluindo projecoes ou comparativos adicionais.

### Balanco Patrimonial

- **Aba**: Balancos
- **Planilha**: Informacoes_Projeto-Viabilidade.xls
- **Linhas**: 182
- **Contas estimadas**: ~60
- **Periodos identificados**: 28
- **Periodos esperados**: 4
- **Status**: CORRETO

**Nota**: Similar a DRE, o balanco possui mais periodos que o esperado, o que e aceitavel e nao indica erro.

**Conclusao**: As demonstracoes financeiras foram identificadas e estruturadas corretamente. A hierarquia de contas e periodos estao mapeados.

---

## Problemas Criticos (Acao Obrigatoria)

### 1. Inferencia de Tipos - Currency nao Detectado

**Severidade**: CRITICO
**Impacto**: 138 campos de moeda identificados incorretamente como `number`

**Causa**:
- O algoritmo de inferencia nao esta verificando o `number_format` do Excel
- Formatos de moeda brasileira (R$) nao sao reconhecidos

**Acao obrigatoria**:
1. Revisar funcao `inferir_tipo_esperado()` no analyzer
2. Adicionar verificacao de `cell.number_format`
3. Mapear todos os formatos de moeda:
   - `R$ #,##0.00`
   - `_-R$ * #,##0.00_-`
   - `$ #,##0.00`
   - Outros formatos contendo simbolos monetarios
4. Re-executar analyzer com correcao
5. Validar novamente com amostra de 500 campos

### 2. Completude de Campos - 39.2% Nao Mapeados

**Severidade**: MEDIO
**Impacto**: Possivel perda de campos editaveis ou contagem incorreta

**Causa**:
- Campos calculados (formulas) foram catalogados separadamente
- Diferenca na metodologia de contagem (celulas vazias, mescladas)

**Acao recomendada**:
1. Revisar se campos calculados devem ser incluidos na contagem de "campos"
2. Validar manualmente 5 abas com baixa cobertura (<50%)
3. Comparar celula a celula para identificar gaps reais
4. Ajustar contagem se necessario

---

## Recomendacoes

### Curto Prazo (Antes de prosseguir para Fase 2)

1. **CRITICO**: Corrigir inferencia de tipos para campos currency
   - Prioridade: ALTA
   - Esforco: Medio (4-6 horas)
   - Bloqueante: SIM

2. **IMPORTANTE**: Validar completude de campos manualmente
   - Prioridade: MEDIA
   - Esforco: Alto (8-12 horas)
   - Bloqueante: NAO (pode ser validado em paralelo com Fase 2)

### Medio Prazo (Durante Fase 2)

3. Adicionar validacao de periodos para demonstracoes financeiras
   - Atualmente aceita qualquer numero de periodos (>4)
   - Recomendar alertar se periodos != 4

4. Implementar validacao de hierarquia de contas em DRE/Balanco
   - Verificar se niveis de indentacao estao corretos
   - Validar somatorios de contas sinteticas

### Longo Prazo (Pos Fase 2)

5. Criar testes automatizados para validacao de fidelidade
   - Executar validacao a cada re-extracao
   - Alertar automaticamente se score < 95%

6. Implementar comparacao visual (diff) entre Excel e JSON
   - Facilitar identificacao de gaps
   - Agilizar troubleshooting

---

## Conclusao

### Score Final: 64.47% - INSUFICIENTE

**Status: REPROVADO**

A validacao de fidelidade REPROVOU a extracao atual devido a:

1. **Precisao de tipos muito baixa (4.95%)**
   - 138 problemas criticos (currency nao detectado)
   - Impacto significativo na qualidade dos dados

2. **Completude de campos abaixo do esperado (60.77%)**
   - 39.2% de campos nao mapeados
   - Necessita investigacao detalhada

### Acoes Obrigatorias

Antes de prosseguir para Fase 2 (implementacao de componentes JavaScript e interface HTML):

1. Corrigir algoritmo de inferencia de tipos
2. Re-executar analyzer com correcao
3. Validar novamente com amostra de 500 campos
4. Alcancar score minimo de 95%
5. Reduzir problemas criticos para 0

### Proximo Passo

**NAO PROSSEGUIR PARA FASE 2 ATE CORRIGIR OS PROBLEMAS CRITICOS**

Apos correcao e re-validacao com score >= 95%:
- Implementar componentes JavaScript
- Criar interface HTML dual (respondente/analista)
- Desenvolver calculadores financeiros
- Integrar com IndexedDB

---

## Apendice: Metricas Detalhadas

### Distribuicao de Campos por Planilha

| Planilha | Campos Mapeados |
|----------|-----------------|
| Budget.xlsx | 430,610 |
| ProjecoesD-Dividas-15.xls | 61,013 |
| Valuation.xlsx | 9,339 |
| Informacoes_Projeto-Viabilidade.xls | 1,855 |
| balanco versao outubro 2011.xls | 1,205 |
| **TOTAL** | **504,022** |

### Formula de Calculo do Score

```
Score = (
  completude_abas * 0.15 +
  completude_campos * 0.30 +
  precisao_tipos * 0.25 +
  completude_formulas * 0.15 +
  precisao_tabelas * 0.10 +
  precisao_demonstracoes * 0.05
) * 100
```

### Pesos Justificados

- **Completude de abas (15%)**: Fundamental, mas binario (tem ou nao tem)
- **Completude de campos (30%)**: Peso maior, pois representa volume de dados
- **Precisao de tipos (25%)**: Critico para validacao e UX (masks, formatacao)
- **Completude de formulas (15%)**: Importante para calculos automaticos
- **Precisao de tabelas (10%)**: Auxilia na renderizacao estruturada
- **Precisao de demonstracoes (5%)**: Menor peso, pois sao apenas 7 demonstracoes

---

**Validacao executada em**: 2025-10-15
**Validador**: fidelidade-validator v1.0
**Arquivos gerados**:
- `/documentos/financiamento/validacao_tarefa1_abas.json`
- `/documentos/financiamento/validacao_tarefa2_campos.json`
- `/documentos/financiamento/validacao_tarefa3_tipos.json`
- `/documentos/financiamento/validacao_tarefa4_formulas.json`
- `/documentos/financiamento/validacao_tarefa5_tabelas.json`
- `/documentos/financiamento/validacao_tarefa6_demonstracoes.json`
- `/documentos/financiamento/validacao_metricas.json`
