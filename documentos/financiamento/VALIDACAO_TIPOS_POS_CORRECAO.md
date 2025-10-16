# Re-Validação de Tipos (Pós-Correção)
Data: 2025-10-15 14:57:43

## Comparativo ANTES vs DEPOIS

| Métrica | ANTES | DEPOIS | Melhoria |
|---------|-------|--------|----------|
| Campos validados | 424 | 500 | +76 |
| Tipos corretos | 21 | 334 | +313 |
| Tipos discrepantes | 403 | 162 | -241 |
| **Score de Precisão** | **4.95%** | **66.80%** | **+61.85 p.p.** |

## Resultados Detalhados

### Campos Corretos: 334/500 (66.80%)

**Distribuição por tipo:**

| Tipo | Total | Corretos | Precisão |
|------|-------|----------|----------|
| currency | 100 | 50 | 50.0% |
| date | 99 | 97 | 98.0% |
| number | 100 | 79 | 79.0% |
| percentage | 100 | 100 | 100.0% |
| text | 97 | 8 | 8.2% |

### Discrepâncias: 162

#### Críticas (ALTA): 25

| Célula | Esperado | Atual | Formato |
|--------|----------|-------|----------|
| RECEITAS!R25 | percentage | number | `0%` |
| PROJETO!B21 | currency | text | `General` |
| A.5.2 Pessoal Ensino!BM65 | currency | number | `_-* #,##0\ _€_-;\-* #,##0\ _€_` |
| A.3.1 Premissas de Custos!DR336 | currency | number | `_-* #,##0\ _€_-;\-* #,##0\ _€_` |
| A.5.1 Pessoal Administrativo!CL109 | currency | number | `_-* #,##0\ _€_-;\-* #,##0\ _€_` |
| A.5.2 Pessoal Ensino!BI63 | currency | number | `_-* #,##0\ _€_-;\-* #,##0\ _€_` |
| A.1 Receita Bruta!L97 | currency | number | `_-* #,##0\ _€_-;\-* #,##0\ _€_` |
| A.5.2 Pessoal Ensino!BM122 | currency | number | `_-* #,##0\ _€_-;\-* #,##0\ _€_` |
| A.5.1 Pessoal Administrativo!DQ78 | currency | number | `_-* #,##0\ _€_-;\-* #,##0\ _€_` |
| A.1.1 Premissas de Receita!AO189 | currency | number | `_-* #,##0\ _€_-;\-* #,##0\ _€_` |
| A.1.1 Premissas de Receita!DE196 | currency | number | `_-* #,##0\ _€_-;\-* #,##0\ _€_` |
| A.1.1 Premissas de Receita!CV468 | currency | number | `_-* #,##0\ _€_-;\-* #,##0\ _€_` |
| A.3.1 Premissas de Custos!DG310 | currency | number | `_-* #,##0\ _€_-;\-* #,##0\ _€_` |
| A.1.1 Premissas de Receita!EP319 | currency | number | `_-* #,##0\ _€_-;\-* #,##0\ _€_` |
| A.5.1 Pessoal Administrativo!CZ64 | currency | number | `_-* #,##0\ _€_-;\-* #,##0\ _€_` |
| A.1.1 Premissas de Receita!AG207 | currency | number | `_-* #,##0\ _€_-;\-* #,##0\ _€_` |
| A.5.2 Pessoal Ensino!DE142 | currency | number | `_-* #,##0\ _€_-;\-* #,##0\ _€_` |
| A.5.2 Pessoal Ensino!CL96 | currency | number | `_-* #,##0\ _€_-;\-* #,##0\ _€_` |
| A.5.2 Pessoal Ensino!T171 | currency | number | `_-* #,##0\ _€_-;\-* #,##0\ _€_` |
| A.3.1 Premissas de Custos!DJ129 | currency | number | `_-* #,##0\ _€_-;\-* #,##0\ _€_` |

#### Médias: 135
#### Baixas: 2

## Score de Fidelidade

**SCORE FINAL**: 79.93%

**Status**: ❌ REPROVADO

## Conclusão

❌ **REPROVADO** - Necessário atingir ≥85%
