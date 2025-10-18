# Arquivos de Teste - SPRINT 7: Seção 1B - Caracterização do Projeto

**Data de Criação:** 2025-10-18
**Sprint:** 7
**Módulo:** `/src/assets/js/financiamento/secao-projeto.js`

---

## 📁 Arquivos Disponíveis

Este diretório contém **5 arquivos JSON** prontos para importação e teste manual da Seção 1B do formulário de financiamento.

| Arquivo | Cenário | Objetivo |
|---------|---------|----------|
| `teste-sprint7-cenario1-validacao-datas.json` | Validação de Datas | Testar validação cruzada de datas (fim > início, operação ≥ fim) |
| `teste-sprint7-cenario2-endereco-empresa.json` | Usar Endereço da Empresa | Testar cópia automática de endereço da Seção 1 |
| `teste-sprint7-cenario3-persistencia.json` | Persistência IndexedDB | Testar auto-save e restauração após reload |
| `teste-sprint7-cenario4-campos-obrigatorios.json` | Campos Obrigatórios | Testar validações required e minlength |
| `teste-sprint7-cenario5-calculo-prazo.json` | Cálculo de Prazo | Testar cálculo automático de prazo em meses |

---

## 🚀 Como Usar os Arquivos de Teste

### Passo 1: Abrir o Formulário

```bash
# Opção 1: Navegador padrão
open /Users/ceciliodaher/Documents/git/mapeador-projetos/src/pages/formulario-financiamento.html

# Opção 2: Chrome específico
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  /Users/ceciliodaher/Documents/git/mapeador-projetos/src/pages/formulario-financiamento.html
```

### Passo 2: Importar Arquivo de Teste

1. No formulário, localizar o botão **"Importar Dados"** (geralmente no canto superior direito)
2. Clicar em **"Importar Dados"**
3. Selecionar o arquivo JSON do cenário desejado
4. Aguardar mensagem de confirmação: "Dados importados com sucesso!"

### Passo 3: Verificar os Dados

- Navegar para **Seção 1: A Empresa** (dados básicos preenchidos)
- Navegar para **Seção 1B: Caracterização do Projeto** (dados do cenário específico)
- Verificar todos os campos preenchidos conforme esperado

### Passo 4: Executar os Testes

Seguir as instruções específicas de cada cenário (veja seções abaixo).

---

## 📋 Detalhamento dos Cenários

### Cenário 1: Validação de Datas

**Arquivo:** `teste-sprint7-cenario1-validacao-datas.json`

**Empresa:** TESTE SPRINT 7 - VALIDAÇÃO LTDA
**Tipo Projeto:** Ampliação
**Prazo:** 6 meses (01/01/2025 a 30/06/2025)

#### Testes a Executar:

1. **Teste de Data Fim Inválida:**
   - Alterar "Data Fim Implantação" para: **2024-12-01** (antes do início)
   - Verificar mensagem de erro: "Data fim deve ser posterior à data de início"

2. **Teste de Data Operação Inválida:**
   - Manter Data Fim válida: **2025-06-30**
   - Alterar "Data Início Operação" para: **2025-05-01** (antes do fim)
   - Verificar mensagem: "Data de início de operação deve ser igual ou posterior à data de fim da implantação"

3. **Teste de Datas Válidas:**
   - Restaurar: Início **2025-01-01**, Fim **2025-06-30**, Operação **2025-07-01**
   - Verificar que **Prazo Total = 6 meses**

---

### Cenário 2: Usar Endereço da Empresa

**Arquivo:** `teste-sprint7-cenario2-endereco-empresa.json`

**Empresa:** EMPRESA TESTE ENDEREÇO LTDA
**Tipo Projeto:** Implantação
**Particularidade:** `usarEnderecoEmpresa: true`

#### Testes a Executar:

1. **Verificar Checkbox Marcada:**
   - Confirmar que checkbox "Usar endereço da empresa" está **marcada**
   - Verificar mensagem: "📍 Usando endereço da empresa"

2. **Verificar Campos Readonly:**
   - Todos campos de endereço devem estar **readonly** (não editáveis)
   - Valores devem corresponder à Seção 1:
     - CEP: 74215-120
     - Endereço: Avenida T-4
     - Número: 850
     - Complemento: Sala 302, Edifício Business
     - Bairro: Setor Bueno
     - Cidade: Goiânia
     - UF: GO

3. **Teste de Desmarcar:**
   - Desmarcar checkbox "Usar endereço da empresa"
   - Verificar que campos ficam **editáveis**
   - Valores permanecem preenchidos (não são apagados)

---

### Cenário 3: Persistência (IndexedDB)

**Arquivo:** `teste-sprint7-cenario3-persistencia.json`

**Empresa:** INDÚSTRIA PERSISTÊNCIA S/A
**Tipo Projeto:** Modernização
**Prazo:** 12 meses (01/03/2025 a 28/02/2026)

#### Testes a Executar:

1. **Importar e Aguardar Auto-save:**
   - Importar o arquivo JSON
   - Aguardar **3 segundos** (debounce)
   - Abrir Console (F12) e verificar mensagem:
     `FinanciamentoModule: Auto-save executado com sucesso`

2. **Reload da Página:**
   - Pressionar **F5** para recarregar
   - Verificar que **TODOS** os dados foram restaurados:
     - Seção 1: Identificação da empresa
     - Seção 1B: Caracterização do Projeto (11 campos)
     - Checkbox "Usar endereço da empresa" no estado correto (marcada)

3. **Verificar Cálculos:**
   - Campo "Prazo Total" deve exibir: **12 meses**
   - Valor calculado automaticamente (readonly)

4. **Console sem Erros:**
   - Verificar que não há erros JavaScript no console

---

### Cenário 4: Validação de Campos Obrigatórios

**Arquivo:** `teste-sprint7-cenario4-campos-obrigatorios.json`

**Empresa:** EMPRESA VALIDAÇÃO DE CAMPOS LTDA
**Tipo Projeto:** Ampliação
**Particularidades:** Textos longos (>100 caracteres) para testar validação minlength

#### Testes a Executar:

1. **Teste Required (Campos Vazios):**
   - Apagar valores dos campos:
     - Tipo de Projeto
     - Objetivo
     - Descrição Detalhada
   - Tentar exportar dados OU clicar em "Próxima Seção"
   - Verificar que navegador **impede submit**
   - Mensagem esperada: "Por favor, preencha este campo"

2. **Teste Minlength (Textos Curtos):**
   - Preencher campos com textos curtos:
     - Objetivo: "teste" (5 caracteres - mínimo 50)
     - Descrição: "breve" (5 caracteres - mínimo 100)
   - Tentar submit
   - Verificar mensagens:
     - "Use pelo menos 50 caracteres (você usou 5 caracteres)"
     - "Use pelo menos 100 caracteres (você usou 5 caracteres)"

3. **Teste Validação Aprovada:**
   - Restaurar textos originais (compridos)
   - Objetivo: 90+ caracteres ✓
   - Descrição: 170+ caracteres ✓
   - Verificar que submit é **permitido**

---

### Cenário 5: Cálculo Automático de Prazo

**Arquivo:** `teste-sprint7-cenario5-calculo-prazo.json`

**Empresa:** CÁLCULO PRAZO INDUSTRIAL LTDA
**Tipo Projeto:** Relocalização
**Prazo Original:** 24 meses (01/01/2025 a 31/12/2026)

#### Testes a Executar:

**Fórmula Utilizada:** `Math.ceil(diffDays / 30)`

##### Caso 5.1: Prazo Original (24 meses)
- **Início:** 2025-01-01
- **Fim:** 2026-12-31
- **Esperado:** 24 meses
- **Cálculo:** 730 dias / 30 = 24.33 → arredonda para **24**

##### Caso 5.2: Modificar para 6 meses
- **Início:** 2025-01-01
- **Fim:** 2025-06-30
- **Esperado:** 6 meses
- **Cálculo:** 180 dias / 30 = 6.0 → **6 meses**

##### Caso 5.3: Modificar para 1 ano
- **Início:** 2025-01-01
- **Fim:** 2025-12-31
- **Esperado:** 12 meses
- **Cálculo:** 364 dias / 30 = 12.13 → arredonda para **12**

##### Caso 5.4: Prazo curto (45 dias)
- **Início:** 2025-01-01
- **Fim:** 2025-02-15
- **Esperado:** 2 meses
- **Cálculo:** 45 dias / 30 = 1.5 → arredonda para **2**

##### Caso 5.5: Prazo muito curto (15 dias)
- **Início:** 2025-01-01
- **Fim:** 2025-01-16
- **Esperado:** 1 mês
- **Cálculo:** 15 dias / 30 = 0.5 → arredonda para **1**

**Verificações:**
- Campo "Prazo Total (Meses)" deve ser **readonly**
- Cálculo atualiza **automaticamente** ao alterar qualquer data
- Valores sempre arredondados para cima (`Math.ceil`)

---

## 🔍 Verificações no Console do Navegador

Abrir **DevTools** (F12) e executar no console:

```javascript
// 1. Verificar módulo carregado
console.log('SecaoProjeto disponível:', typeof window.secaoProjeto);
// Esperado: "object"

// 2. Verificar FieldValidator
console.log('FieldValidator disponível:', typeof window.FieldValidator);
// Esperado: "object"

// 3. Testar coleta de dados (após preencher form)
const dados = window.secaoProjeto.coletarDadosProjeto();
console.log('Dados coletados:', dados);
// Esperado: objeto com 11+ propriedades

// 4. Verificar IndexedDB
indexedDB.databases().then(dbs => console.log('Databases:', dbs));
// Esperado: Array contendo "expertzy_financiamento"

// 5. Inspecionar auto-save
window.FinanciamentoModule.coletarDadosFormulario().then(dados => {
  console.log('secao1B:', dados.secao1B);
});
// Esperado: Objeto com dados da Seção 1B
```

---

## ✅ Checklist de Validação Final

Antes de considerar o Sprint 7 completo:

- [ ] Cenário 1 executado: Validação de datas funciona
- [ ] Cenário 2 executado: Usar endereço da empresa funciona
- [ ] Cenário 3 executado: Persistência e auto-save funcionam
- [ ] Cenário 4 executado: Validações required/minlength funcionam
- [ ] Cenário 5 executado: Cálculo de prazo funciona
- [ ] Console sem erros ao importar cada arquivo
- [ ] Auto-save ativo (mensagem no console após 3s)
- [ ] Reload preserva dados (teste em todos cenários)
- [ ] Exportar JSON inclui `secao1B` corretamente
- [ ] Seção 1B visível no formulário HTML

---

## 📊 Estrutura de Dados Esperada

Ao exportar dados após importar qualquer cenário, o JSON deve conter:

```json
{
  "metadata": { ... },
  "secao1": { ... },
  "secao1B": {
    "tipoProjeto": "Ampliacao|Implantacao|Modernizacao|Relocalizacao",
    "objetivo": "string (min 50 chars)",
    "descricaoDetalhada": "string (min 100 chars)",
    "localizacao": {
      "usarEnderecoEmpresa": boolean,
      "cep": "string",
      "endereco": "string",
      "numero": "string",
      "complemento": "string",
      "bairro": "string",
      "cidade": "string",
      "uf": "string (2 chars)"
    },
    "areaTotalM2": number,
    "cronograma": {
      "dataInicioImplantacao": "YYYY-MM-DD",
      "dataFimImplantacao": "YYYY-MM-DD",
      "dataInicioOperacao": "YYYY-MM-DD",
      "prazoTotalMeses": number
    },
    "analiseMercado": "string (min 50 chars)",
    "justificativaEconomica": "string (min 50 chars)"
  },
  "secao2": { ... }
}
```

---

## 🐛 Troubleshooting

### Problema: "SecaoProjeto não disponível"

**Causa:** Script não carregado

**Solução:**
1. Verificar tag `<script>` no HTML (linha ~2453)
2. Verificar ordem de carregamento (deve estar após validation.js)
3. Verificar console para erros de sintaxe

### Problema: "Dados não restaurados após reload"

**Causa:** IndexedDB não salvou ou falhou ao restaurar

**Solução:**
1. Verificar console: mensagem "Auto-save executado com sucesso"
2. Verificar IndexedDB no DevTools (Application > IndexedDB)
3. Verificar store `formulario` contém registro com `sectionId: "1B"`

### Problema: "Cálculo de prazo incorreto"

**Causa:** Fórmula `Math.ceil(diffDays / 30)` não aplicada

**Solução:**
1. Verificar método `calcularPrazoTotal()` em secao-projeto.js
2. Testar manualmente no console:
```javascript
const inicio = new Date('2025-01-01');
const fim = new Date('2025-06-30');
const diffDays = Math.ceil((fim - inicio) / (1000 * 60 * 60 * 24));
const prazo = Math.ceil(diffDays / 30);
console.log('Prazo calculado:', prazo); // Esperado: 6
```

### Problema: "Validação de datas não funciona"

**Causa:** `FieldValidator.validateDates` não disponível

**Solução:**
1. Verificar que `validation.js` carregou antes de `secao-projeto.js`
2. Verificar export no final de validation.js:
```javascript
window.FieldValidator = FieldValidator;
```

---

## 📝 Observações Importantes

1. **Todos os arquivos** incluem dados completos de Seção 1 e Seção 2 para garantir que o formulário funcione sem erros de dependência

2. **Cenário 2** é o único com `usarEnderecoEmpresa: true` - todos os outros usam endereço diferente do da empresa

3. **Textos longos** nos cenários 3, 4 e 5 garantem que validações de `minlength` passem sem erros

4. **Datas futuras** (2025-2027) evitam validações de "data no passado" que possam existir

5. **CNPJs e documentos** são fictícios mas seguem formato válido para passar validações de formato

---

**Última atualização:** 2025-10-18
