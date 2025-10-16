# Relatório de Correção Automática de Tipos
Data: 2025-10-15 14:41:05

## Resumo

- **Total de campos verificados**: 504,022
- **Total de correções aplicadas**: 10,238
- **Taxa de correção**: 2.03%

## Distribuição de Tipos (Antes → Depois)

| Tipo       | Antes    | Depois   | Delta     |
|------------|----------|----------|-----------|
| currency   | 2,679    | 12,917   | **+10,238** |
| number     | 457,906  | 447,668  | **-10,238** |
| percentage | 6,567    | 6,567    | 0         |
| date       | 3,093    | 3,093    | 0         |
| text       | 33,777   | 33,777   | 0         |

## Correções por Tipo

| Tipo Corrigido | Quantidade |
|----------------|------------|
| currency       | 10,238     |
| percentage     | 0          |
| date           | 0          |

## Exemplos de Campos Corrigidos

### Currency (10,238 correções)

1. **Budget.xlsx - PROJETO - D208**
   - Tipo original: `number`
   - Tipo corrigido: `currency`
   - Formato Excel: `_(* #,##0.00_);_(* \(#,##0.00\);_(* "-"??_);_(@_)`

2. **Budget.xlsx - PROJETO - D209**
   - Tipo original: `number`
   - Tipo corrigido: `currency`
   - Formato Excel: `_(* #,##0.00_);_(* \(#,##0.00\);_(* "-"??_);_(@_)`

3. **Budget.xlsx - PROJETO - D210**
   - Tipo original: `number`
   - Tipo corrigido: `currency`
   - Formato Excel: `_(* #,##0.00_);_(* \(#,##0.00\);_(* "-"??_);_(@_)`

4. **Budget.xlsx - PROJETO - H210**
   - Tipo original: `number`
   - Tipo corrigido: `currency`
   - Formato Excel: `_(* #,##0.00_);_(* \(#,##0.00\);_(* "-"??_);_(@_)`

5. **Budget.xlsx - RECEITAS - D10**
   - Tipo original: `number`
   - Tipo corrigido: `currency`
   - Formato Excel: `_(* #,##0.00_);_(* \(#,##0.00\);_(* "-"??_);_(@_)`

6. **Budget.xlsx - RECEITAS - D11**
   - Tipo original: `number`
   - Tipo corrigido: `currency`
   - Formato Excel: `_(* #,##0.00_);_(* \(#,##0.00\);_(* "-"??_);_(@_)`

7. **Budget.xlsx - RECEITAS - D12**
   - Tipo original: `number`
   - Tipo corrigido: `currency`
   - Formato Excel: `_(* #,##0.00_);_(* \(#,##0.00\);_(* "-"??_);_(@_)`

8. **Budget.xlsx - RECEITAS - D13**
   - Tipo original: `number`
   - Tipo corrigido: `currency`
   - Formato Excel: `_(* #,##0.00_);_(* \(#,##0.00\);_(* "-"??_);_(@_)`

9. **Budget.xlsx - RECEITAS - D14**
   - Tipo original: `number`
   - Tipo corrigido: `currency`
   - Formato Excel: `_(* #,##0.00_);_(* \(#,##0.00\);_(* "-"??_);_(@_)`

10. **Budget.xlsx - RECEITAS - D15**
   - Tipo original: `number`
   - Tipo corrigido: `currency`
   - Formato Excel: `_(* #,##0.00_);_(* \(#,##0.00\);_(* "-"??_);_(@_)`

## Formatos Currency Detectados

| Formato Excel | Ocorrências |
|--------------|-------------|
| `#,##0.00` | 5,349 |
| `_-* #,##0.00\ _€_-;\-* #,##0.00\ _€_-;_-* "-"??\ _€_-;_-@_-` | 4,731 |
| `_(* #,##0.00_);_(* \(#,##0.00\);_(* "-"??_);_(@_)` | 102 |
| `#,##0.00000` | 40 |
| `#,##0.00_);(#,##0.00)` | 15 |
| **Outros** | 1 |

## Distribuição por Planilha

| Planilha | Correções |
|----------|-----------|
| Budget.xlsx | 10,049 |
| Valuation.xlsx | 189 |

## Status

✅ Correção concluída com sucesso
✅ Backup criado: campos_estruturados_completo.backup.json
✅ Arquivo atualizado: campos_estruturados_completo.json
✅ 10,238 campos corrigidos de `number` → `currency`

## Próximo Passo

Re-executar validação de fidelidade (TAREFA 3: Validar Tipos Corretos) para verificar se score melhorou.

## Detalhes Técnicos

**Indicadores de detecção:**

- **Currency**: r$, $, #,##0.00, currency, moeda, accounting, _-r$, [$r$
- **Percentage**: %, percent, 0.00%
- **Date**: dd/mm, yyyy, date, dd-mm, mm/dd, m/d/yy

**Arquivo processado:** campos_estruturados_completo.json
**Tamanho:** ~192 MB
**Encoding:** UTF-8
