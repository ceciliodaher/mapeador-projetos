# 📋 PLANO DE CORREÇÕES - SISTEMA CEI

## 🔍 PROBLEMAS IDENTIFICADOS NA DEPURAÇÃO

### 1. **CAMPOS SEM FORMATAÇÃO MONETÁRIA (Crítico)**
- `saldoCaixa` - Sem formatação R$
- `endividamentoTotal` - Sem formatação R$
- `capitalSocial` - Sem formatação R$
- `capacidadePagamento` - Campo calculado sem formatação
- **Campos dinâmicos nos investimentos:**
  - `item-unit-value` - Valor unitário sem formatação
  - `item-total-value` - Valor total sem formatação
- **Campos de produtos:**
  - `produto-preco` - Preço sem formatação R$
- **Campos de insumos:**
  - `insumo-custo` - Custo sem formatação R$
- **Campos de funcionários:**
  - `funcionario-salario` - Salário sem formatação
  - `contratacao-salario` - Salário previsto sem formatação
- **Campos de balanço:**
  - `balanco-ativo`, `balanco-passivo`, `balanco-patrimonio`, `balanco-receita`, `balanco-lucro` - Aplicação parcial

### 2. **CAMPOS QUE TRAVAM O PREENCHIMENTO**
- **Problema na função `isMonetaryField`**: Não detecta corretamente todos os campos monetários porque verifica apenas padrões específicos
- **Validação restritiva**: Campos com `readonly` como `capacidadePagamento` não permitem edição mas também não são calculados corretamente
- **Event listeners conflitantes**: Múltiplos listeners no mesmo campo causam comportamento imprevisível

### 3. **CAMPOS DINÂMICOS MAL CONFIGURADOS**
- `applyUniversalFormatting` é chamado mas não aplica formatação correta em campos dinâmicos
- Campos de quantidade (`item-quantity`, `produto-atual`, `produto-futura`) aceitam decimais quando deveriam ser inteiros
- Campos calculados não atualizam quando valores base mudam

### 4. **PROBLEMAS DE VALIDAÇÃO**
- Distribuição regional pode ultrapassar 100% sem bloqueio
- Campos obrigatórios não são validados antes de permitir navegação
- Cálculos automáticos não disparam eventos de formatação

### 5. **BUGS CRÍTICOS QUE CAUSAM TRAVAMENTO**
1. **Loop infinito em formatação**: Quando `blur` e `focus` são disparados em sequência rápida
2. **parseMonetaryValue falha**: Com valores já formatados, retorna NaN
3. **Campos readonly calculados**: Não são atualizados porque não têm listeners apropriados

## 📋 PLANO DE CORREÇÃO COMPLETO

### **FASE 1: Correção de Formatações Monetárias** ✅
1. **Expandir detecção de campos monetários** na função `isMonetaryField`:
   - Adicionar: 'saldo', 'endividamento', 'capital', 'patrimonio', 'ativo', 'passivo', 'lucro'
   - Incluir classes CSS específicas dos campos dinâmicos
   
2. **Corrigir formatação em campos dinâmicos**:
   - Aplicar formatação após criação de novos itens
   - Garantir que `applyUniversalFormatting` cubra todos os seletores

3. **Implementar formatação para campos calculados**:
   - Adicionar formatação ao atualizar `capacidadePagamento`
   - Formatar valores em `calculateSubtotals()`

### **FASE 2: Correção de Validações e Bloqueios** ⏳
1. **Remover validações que impedem input**:
   - Permitir entrada parcial durante digitação
   - Validar apenas no `blur`
   
2. **Corrigir campos readonly calculados**:
   - Remover `readonly` temporariamente durante cálculo
   - Aplicar formatação após cálculo

3. **Implementar debounce em event listeners**:
   - Evitar múltiplas chamadas em sequência
   - Prevenir loops de formatação

### **FASE 3: Correção de Campos Dinâmicos** ⏳
1. **Aplicar formatação correta por tipo**:
   - Inteiros: quantidade, produção, funcionários
   - Monetários: preços, custos, salários, valores
   - Percentuais: participação, margem, abrangência

2. **Garantir propagação de eventos**:
   - Adicionar listeners após criação de elementos
   - Usar delegação de eventos quando possível

### **FASE 4: Teste Playwright Completo** ⏳
1. **Configurar ambiente de teste**:
   - Instalar Playwright
   - Criar estrutura de testes

2. **Implementar teste abrangente**:
   - Preencher todos os 14 formulários
   - Testar campos dinâmicos (adicionar/remover)
   - Validar formatações
   - Capturar screenshots de cada seção
   - Testar exportação em todos os formatos (Excel, PDF, JSON, CSV)

3. **Validações do teste**:
   - Verificar se formatações são aplicadas
   - Confirmar cálculos automáticos
   - Testar navegação entre seções
   - Validar persistência de dados

## 📊 CORREÇÕES ESPECÍFICAS POR CAMPO

### Campos Monetários a Corrigir:
- [x] `saldoCaixa`
- [x] `endividamentoTotal`
- [x] `capitalSocial`
- [x] `capacidadePagamento`
- [x] `item-unit-value`
- [x] `item-total-value`
- [x] `produto-preco`
- [x] `insumo-custo`
- [x] `funcionario-salario`
- [x] `contratacao-salario`
- [x] `balanco-ativo`
- [x] `balanco-passivo`
- [x] `balanco-patrimonio`
- [x] `balanco-receita`
- [x] `balanco-lucro`
- [x] `socio-valor`

### Campos Inteiros a Corrigir:
- [x] `produto-atual`
- [x] `produto-futura`
- [x] `insumo-atual`
- [x] `insumo-futura`
- [x] `funcionario-quantidade`
- [x] `item-quantity`
- [x] `contratacao-quantidade`

### Campos Percentuais a Corrigir:
- [x] `cliente-percentual`
- [x] `socio-participacao`
- [x] Campos de abrangência regional

## ✅ RESULTADO ESPERADO
- ✅ Todos os campos monetários com formatação R$ correta
- ✅ Campos inteiros aceitando apenas números inteiros
- ✅ Percentuais limitados a 0-100%
- ✅ Navegação fluida sem travamentos
- ✅ Cálculos automáticos funcionando
- ✅ Teste automatizado cobrindo 100% dos campos
- ✅ Exportação funcionando em todos os formatos

## 📝 STATUS DE IMPLEMENTAÇÃO
- **Data de início**: 22/08/2025
- **Última atualização**: 22/08/2025
- **Status**: Em andamento

### Progresso por Fase:
- FASE 1: 🟢 Concluída
- FASE 2: 🟡 Em andamento
- FASE 3: 🔴 Pendente
- FASE 4: 🔴 Pendente