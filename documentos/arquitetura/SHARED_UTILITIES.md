# Shared Utilities - Arquitetura

**Data:** 14/10/2025
**Versão:** 1.0
**Status:** Implementado

---

## 🎯 Princípios

### 1. Mínimo Necessário
- Apenas utilitários genuinamente reutilizáveis
- **ZERO lógica de negócio**
- Sem código específico de sistemas (CEI, ProGoiás, etc.)

### 2. Stateless
- Todos os métodos são estáticos
- Sem estado interno
- Sem side effects

### 3. NO HARDCODED DATA
- Apenas lógica pura
- Sem valores default hardcoded
- Exceções claras quando dados obrigatórios ausentes

---

## 📂 Estrutura

```
src/shared/
├── formatters/              # Formatação de dados
│   ├── document-formatter.js    # CNPJ, CPF, RG
│   ├── currency-formatter.js    # BRL, USD, percentuais
│   ├── date-formatter.js        # PT-BR, ISO, conversões
│   └── phone-formatter.js       # Telefones brasileiros
│
├── validators/              # Validações básicas (sem lógica de negócio)
│   ├── document-validator.js    # CNPJ, CPF check digits
│   ├── email-validator.js       # RFC 5322
│   └── phone-validator.js       # DDD + número
│
├── ui/                      # Componentes UI reutilizáveis
│   ├── modal.js                 # Modals genéricos
│   └── toast.js                 # Notificações
│
├── constants/               # Constantes compartilhadas
│   └── patterns.js              # Regex patterns, mensagens de erro
│
└── utils/                   # Utilitários gerais
    └── (futuro: math-utils.js, string-utils.js)
```

---

## 📦 Formatters

### DocumentFormatter
Formatação de documentos brasileiros.

**Métodos:**
- `formatCNPJ(value)` → `00.000.000/0000-00`
- `formatCPF(value)` → `000.000.000-00`
- `formatRG(value)` → `00.000.000-0`
- `removeFormatting(value)` → apenas dígitos

**Uso:**
```javascript
import { DocumentFormatter } from '@shared/formatters/document-formatter.js';

const cnpjFormatted = DocumentFormatter.formatCNPJ('12345678901234');
// Resultado: "12.345.678/9012-34"
```

### CurrencyFormatter
Formatação de valores monetários.

**Métodos:**
- `formatBRL(value)` → `R$ 1.234,56`
- `formatUSD(value)` → `$ 1,234.56`
- `formatPercentage(value, decimals)` → `12.34%`
- `formatNumber(value, decimals)` → `1.234,56`
- `parse(formatted)` → `number`

**Uso:**
```javascript
import { CurrencyFormatter } from '@shared/formatters/currency-formatter.js';

const brl = CurrencyFormatter.formatBRL(1234.56);
// Resultado: "R$ 1.234,56"

const percentage = CurrencyFormatter.formatPercentage(12.3456, 2);
// Resultado: "12.35%"
```

### DateFormatter
Formatação e conversão de datas.

**Métodos:**
- `formatBR(date)` → `DD/MM/AAAA`
- `formatISO(date)` → `AAAA-MM-DD`
- `formatBRWithTime(date)` → `DD/MM/AAAA HH:MM`
- `formatExtended(date)` → `14 de outubro de 2025`
- `brToISO(dateBR)` → conversão
- `isoToBR(dateISO)` → conversão
- `addDays(date, days)` → nova data
- `addMonths(date, months)` → nova data
- `diffInDays(date1, date2)` → diferença em dias
- `diffInMonths(date1, date2)` → diferença em meses

**Uso:**
```javascript
import { DateFormatter } from '@shared/formatters/date-formatter.js';

const today = new Date();
const brDate = DateFormatter.formatBR(today);
// Resultado: "14/10/2025"

const isoDate = DateFormatter.brToISO('14/10/2025');
// Resultado: "2025-10-14"
```

### PhoneFormatter
Formatação de telefones brasileiros.

**Métodos:**
- `formatCelular(value)` → `(00) 00000-0000`
- `formatFixo(value)` → `(00) 0000-0000`
- `format(value)` → detecta e formata automaticamente
- `removeFormatting(value)` → apenas dígitos
- `isCelular(value)` → `boolean`
- `isFixo(value)` → `boolean`

**Uso:**
```javascript
import { PhoneFormatter } from '@shared/formatters/phone-formatter.js';

const celular = PhoneFormatter.format('62996543141');
// Resultado: "(62) 99654-3141"
```

---

## ✅ Validators

### DocumentValidator
Validação de documentos com check digits.

**Métodos:**
- `validateCNPJ(cnpj)` → `boolean`
- `validateCPF(cpf)` → `boolean`

**Uso:**
```javascript
import { DocumentValidator } from '@shared/validators/document-validator.js';

const isValid = DocumentValidator.validateCNPJ('12.345.678/9012-34');
// Resultado: false (check digits inválidos)
```

**Algoritmo:**
- Valida check digits conforme algoritmo oficial
- Rejeita sequências de dígitos iguais (000.000.000-00)
- Aceita CNPJ/CPF com ou sem formatação

### EmailValidator
Validação de e-mails RFC 5322.

**Métodos:**
- `validate(email)` → `boolean` (pattern simples)
- `validateStrict(email)` → `boolean` (RFC 5322)
- `extractDomain(email)` → `string`
- `extractUsername(email)` → `string`
- `normalize(email)` → `string` (lowercase, trim)

**Uso:**
```javascript
import { EmailValidator } from '@shared/validators/email-validator.js';

const isValid = EmailValidator.validate('contato@expertzy.com.br');
// Resultado: true

const domain = EmailValidator.extractDomain('contato@expertzy.com.br');
// Resultado: "expertzy.com.br"
```

### PhoneValidator
Validação de telefones brasileiros.

**Métodos:**
- `validate(phone)` → `boolean`
- `validateCelular(phone)` → `boolean`
- `validateFixo(phone)` → `boolean`
- `extractDDD(phone)` → `string`
- `isFromRegion(phone, ddd)` → `boolean`

**Uso:**
```javascript
import { PhoneValidator } from '@shared/validators/phone-validator.js';

const isValid = PhoneValidator.validate('(62) 99654-3141');
// Resultado: true

const ddd = PhoneValidator.extractDDD('(62) 99654-3141');
// Resultado: "62"
```

---

## 🎨 UI Components

### Modal
Componente de modal reutilizável.

**Métodos:**
- `show(content)` → exibe modal
- `hide()` → oculta modal
- `toggle()` → alterna visibilidade
- `isVisible()` → `boolean`
- `setContent(content)` → define conteúdo
- `addClass(className)` → adiciona classe CSS
- `removeClass(className)` → remove classe CSS

**Uso:**
```javascript
import { Modal, ConfirmModal } from '@shared/ui/modal.js';

// Modal simples
const modal = new Modal('myModal');
modal.show('<h2>Conteúdo do Modal</h2>');

// Modal de confirmação
const confirmed = await ConfirmModal.show({
    title: 'Confirmar ação',
    message: 'Deseja realmente excluir?',
    confirmText: 'Sim, excluir',
    cancelText: 'Cancelar'
});

if (confirmed) {
    // Usuário confirmou
}
```

### Toast
Sistema de notificações toast.

**Métodos:**
- `show(options)` → exibe toast
- `success(message, duration)` → toast de sucesso
- `error(message, duration)` → toast de erro
- `warning(message, duration)` → toast de aviso
- `info(message, duration)` → toast informativo
- `clearAll()` → limpa todos os toasts

**Uso:**
```javascript
import { Toast } from '@shared/ui/toast.js';

// Toast de sucesso
Toast.success('Dados salvos com sucesso!');

// Toast de erro (dura mais tempo)
Toast.error('Erro ao salvar dados');

// Toast personalizado
Toast.show({
    message: 'Processando...',
    type: Toast.Type.INFO,
    duration: 0,  // Permanente
    closeable: true
});
```

---

## 📊 Constants

### PATTERNS
Regex patterns para validação.

**Disponíveis:**
- `CNPJ`, `CNPJ_DIGITS`
- `CPF`, `CPF_DIGITS`
- `EMAIL`, `EMAIL_STRICT`
- `PHONE`, `PHONE_CELULAR`, `PHONE_FIXO`, `PHONE_DIGITS`
- `CEP`, `CEP_DIGITS`
- `DATE_BR`, `DATE_ISO`
- `TIME`, `TIME_SECONDS`
- `CURRENCY_BRL`, `CURRENCY_USD`
- `PERCENTAGE`
- `INTEGER`, `DECIMAL`
- `URL`
- `PLACA_MERCOSUL`, `PLACA_ANTIGA`
- `NCM`, `CFOP`

**Uso:**
```javascript
import { PATTERNS, ERROR_MESSAGES } from '@shared/constants/patterns.js';

if (!PATTERNS.EMAIL.test(email)) {
    throw new Error(ERROR_MESSAGES.INVALID_EMAIL);
}
```

### ERROR_MESSAGES
Mensagens de erro padrão.

**Disponíveis:**
- `REQUIRED`
- `INVALID_CNPJ`, `INVALID_CPF`, `INVALID_EMAIL`, etc.
- Funções: `MIN_LENGTH(min)`, `MAX_LENGTH(max)`, `BETWEEN(min, max)`

---

## ❌ O que NÃO vai para shared

### Lógica de Negócio
- ❌ Validações específicas (ex: investimento mínimo CEI)
- ❌ Regras de programas (ex: prazo 36 meses)
- ❌ Cálculos complexos (VPL, TIR, ICMS, TRL)

### Storage/Persistence
- ❌ IndexedDB schemas
- ❌ LocalStorage wrappers
- **Motivo:** Cada sistema tem necessidades diferentes

### Exports
- ❌ Geradores de PDF
- ❌ Exportadores Excel
- **Motivo:** Cada sistema tem formatos próprios

### Core Logic
- ❌ FormCore
- ❌ Validators com lógica de negócio
- **Motivo:** Cada sistema é independente

---

## ✅ Princípios de Uso

### 1. Import via Module Aliases
```javascript
// ✅ Correto (usando @shared)
import { DocumentFormatter } from '@shared/formatters/document-formatter.js';

// ❌ Incorreto (caminho relativo)
import { DocumentFormatter } from '../../shared/formatters/document-formatter.js';
```

### 2. Apenas Utilitários Genuínos
```javascript
// ✅ Correto (utilitário puro)
const cnpj = DocumentFormatter.formatCNPJ(value);

// ❌ Incorreto (lógica de negócio)
if (investimento < MinInvestimentoCEI) { ... }
```

### 3. Sem Estado
```javascript
// ✅ Correto (stateless)
DateFormatter.formatBR(date);

// ❌ Incorreto (stateful)
const formatter = new DateFormatter();
formatter.setLocale('pt-BR');
```

---

## 📈 Benefícios

### Reutilização
- Formatação de CNPJ usada por todos os 4 sistemas
- Validação de e-mail compartilhada
- Componentes UI consistentes

### Manutenibilidade
- Um lugar para corrigir bugs (ex: check digit CNPJ)
- Atualização refletida em todos os sistemas
- Código DRY

### Performance
- Vite agrupa shared em chunk separado
- Carregamento otimizado
- Cache melhor aproveitado

### Testabilidade
- Funções puras, fáceis de testar
- Sem dependências externas
- Cobertura de testes concentrada

---

**Última Atualização:** 14/10/2025
**Próxima Revisão:** Commit 5 (Sistema CEI independente)
