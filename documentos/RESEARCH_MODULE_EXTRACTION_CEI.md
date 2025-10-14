# Research: Module Extraction Patterns for Independent CEI System

## Executive Summary

Research on migrating CEI-specific logic from shared `FormCore` (331 LOC) to independent `src/sistemas/cei/` system following SOLID principles, zero business logic in shared utilities, and localStorage backwards compatibility.

**Current State:**
- CEI module depends on shared `FormCore` class (navigation, validation, data collection, localStorage)
- Shared `FormUtils` has formatting logic (CNPJ, phone, currency)
- Already created shared formatters: `DocumentFormatter`, `CurrencyFormatter`

**Goal:**
- Extract CEI-specific FormCore with only CEI logic
- Replace FormUtils with shared formatters via dependency injection
- Maintain localStorage compatibility (`formData_CEI` key format)
- Follow SOLID principles (SRP, DIP)
- Independent, testable CEI system

---

## 1. Module Extraction Patterns

### 1.1 ES6 Module System Best Practices

**Key Findings:**

- **ES6 modules are singletons** that run once no matter how many times imported, with subsequent imports receiving references to the same instance
- **Fine-grained module design** with independently reusable module features and named imports boosts refactorings and code optimizations
- **Modules should be stored in files** with exactly one module per file and one file per module
- **Compact and declarative syntax** with asynchronous loading, plus better support for cyclic dependencies

**Source:** MDN Web Docs, Exploring JS (ES6 Modules)

### 1.2 Module Pattern for Independence

**Best Practice:**
```javascript
// ❌ BAD: Shared monolithic class with all programs
class FormCore {
    constructor(config) {
        this.config = config; // CEI, ProGoiás, etc.
        // Mixed logic for multiple programs
    }
}

// ✅ GOOD: Program-specific class with only relevant logic
class CEIFormCore {
    constructor(config) {
        if (config.programType !== 'CEI') {
            throw new Error('CEIFormCore: apenas para programa CEI');
        }
        this.config = config;
        // Only CEI-specific logic
    }
}
```

**Benefits:**
- Code independence: CEI system can be maintained in isolation
- Cache modules can be reused in other modules
- Clear separation of concerns (SRP)
- Easier testing and debugging

**Source:** Medium - Module Pattern in JavaScript, Xenonstack

---

## 2. Dependency Injection: Constructor vs Static Imports

### 2.1 Constructor Injection (RECOMMENDED)

**Advantages:**
- Explicit dependencies make the dependency graph clear
- Easy to replace implementations for testing
- Enables loose coupling
- Reduces boilerplate since initialization is done by the injector
- Makes extending applications easier

**Disadvantages:**
- More verbose constructor signatures
- Requires passing dependencies manually or using DI framework

**Example:**
```javascript
// ✅ RECOMMENDED: Constructor injection
import { DocumentFormatter } from '../../shared/formatters/document-formatter.js';
import { CurrencyFormatter } from '../../shared/formatters/currency-formatter.js';

class CEIFormCore {
    constructor(config, formatters = { DocumentFormatter, CurrencyFormatter }) {
        this.config = config;
        this.formatters = formatters;
    }

    formatCNPJ(value) {
        return this.formatters.DocumentFormatter.formatCNPJ(value);
    }
}
```

**When to Use:**
- Classes with shared state
- Classes that need different implementations for testing
- Classes that depend on other classes (non-static)

**Source:** Medium - Dependency Injection in JavaScript, FreeCodeCamp, Snyk

### 2.2 Static Imports (ACCEPTABLE FOR STATELESS UTILITIES)

**Advantages:**
- Simple and straightforward
- No boilerplate for initialization
- Works well for stateless utilities

**Disadvantages:**
- Hardwired dependencies create tight coupling
- Difficult to mock for testing (requires module stubbing)
- Obscure dependency graph

**Example:**
```javascript
// ✅ ACCEPTABLE: Static import for stateless formatters
import { DocumentFormatter } from '../../shared/formatters/document-formatter.js';
import { CurrencyFormatter } from '../../shared/formatters/currency-formatter.js';

class CEIFormCore {
    constructor(config) {
        this.config = config;
    }

    formatCNPJ(value) {
        return DocumentFormatter.formatCNPJ(value); // Stateless static method
    }
}
```

**When to Use:**
- **Stateless static utility methods** (like your formatters)
- Pure functions with no side effects
- Utilities that never change implementation

**Important Caveat:**
> "Static methods are only problematic when working with shared state, but stateless static methods don't exhibit tight coupling or obscure dependency graph issues."

**Source:** Enterprise Craftsmanship, DEV Community

### 2.3 Recommendation for Your Project

**Use STATIC IMPORTS** for shared formatters because:

1. ✅ `DocumentFormatter` and `CurrencyFormatter` are **stateless** (pure functions)
2. ✅ No shared state, no side effects
3. ✅ Already designed with static methods
4. ✅ Simpler code, less boilerplate
5. ✅ Formatters never change implementation

**Example:**
```javascript
// src/sistemas/cei/core/cei-form-core.js
import { DocumentFormatter } from '../../../shared/formatters/document-formatter.js';
import { CurrencyFormatter } from '../../../shared/formatters/currency-formatter.js';

class CEIFormCore {
    constructor(config) {
        this.config = config;
        this.currentStep = 1;
        this.formData = {};
        this.validationErrors = new Map();
    }

    // Use formatters directly
    formatCNPJ(value) {
        return DocumentFormatter.formatCNPJ(value);
    }

    formatCurrency(value) {
        return CurrencyFormatter.formatBRL(value);
    }
}
```

**Source:** SOLID Principles research, static methods analysis

---

## 3. Migration Strategy: Gradual vs Immediate

### 3.1 Gradual Migration (RECOMMENDED)

**Process:**

**Phase 1: Create Independent System (Week 1)**
1. Create `src/sistemas/cei/` directory structure
2. Extract CEI-specific logic to `CEIFormCore`
3. Keep old `FormCore` intact for other programs
4. Test CEI system in parallel

**Phase 2: Switch CEI Module (Week 2)**
1. Update `cei-module.js` to use new `CEIFormCore`
2. Run comprehensive tests
3. Monitor localStorage compatibility
4. Keep old code as fallback

**Phase 3: Clean Up (Week 3)**
1. Verify all CEI functionality works
2. Remove CEI-specific code from shared `FormCore`
3. Update documentation
4. Delete unused code

**Benefits:**
- Low risk: old code remains functional
- Easy rollback if issues found
- Time to verify localStorage compatibility
- Allows parallel testing

**Risks:**
- Temporary code duplication
- Requires discipline to complete cleanup
- May confuse developers about which code to use

### 3.2 Immediate Migration (HIGH RISK)

**Process:**
1. Create new CEI system
2. Delete CEI logic from shared FormCore immediately
3. Update all references at once
4. Test everything

**Benefits:**
- No code duplication
- Forces completion
- Clear cut-off point

**Risks:**
- ⚠️ HIGH RISK: Breaks existing functionality if bugs exist
- No easy rollback
- Requires extensive testing upfront
- May block other development

### 3.3 Recommendation

**Use GRADUAL MIGRATION**:

```javascript
// Phase 1: Create new system (keep old)
// src/sistemas/cei/core/cei-form-core.js
export class CEIFormCore { /* new implementation */ }

// Phase 2: Switch module to new system
// src/assets/js/cei-module.js
import { CEIFormCore } from '../../sistemas/cei/core/cei-form-core.js';
// OLD: this.core = new FormCore(this.config);
this.core = new CEIFormCore(this.config); // NEW

// Phase 3: Clean up after verification
// src/assets/js/core.js
// Remove CEI-specific logic from FormCore
```

**Source:** Software engineering best practices, refactoring patterns

---

## 4. Testing Approach

### 4.1 Verification Checklist

**Unit Testing:**
- [ ] Test CEIFormCore initialization
- [ ] Test form data collection
- [ ] Test localStorage save/load
- [ ] Test validation methods
- [ ] Test formatters integration
- [ ] Test error handling

**Integration Testing:**
- [ ] Test CEI module with new CEIFormCore
- [ ] Test tab navigation (handled by tabs.js)
- [ ] Test export functionality (JSON, PDF, Excel)
- [ ] Test import functionality
- [ ] Test auto-save behavior

**localStorage Compatibility Testing:**
```javascript
// Test: Old localStorage format still works
const oldFormat = {
    formData: { razaoSocial: "Empresa Teste" },
    currentStep: 3,
    savedAt: "2025-01-15T10:00:00Z"
};
localStorage.setItem('formData_CEI', JSON.stringify(oldFormat));

// Reload page - should restore data correctly
const cei = new CEIForm();
assert(cei.core.formData.razaoSocial === "Empresa Teste");
assert(cei.core.currentStep === 3);
```

**Manual Testing:**
1. Fill out all 14 sections
2. Save and reload page
3. Verify auto-save works
4. Export to JSON/PDF/Excel
5. Import saved JSON
6. Clear data and verify

### 4.2 Testing Tools

**Browser Console Tests:**
```javascript
// Test formatters
DocumentFormatter.formatCNPJ('12345678000195');
// Expected: "12.345.678/0001-95"

CurrencyFormatter.formatBRL(150000);
// Expected: "R$ 150.000,00"

// Test localStorage
localStorage.getItem('formData_CEI');
// Verify structure matches expected format
```

**Playwright E2E Tests (Future):**
```javascript
// playwright.config.js already exists in your project
test('CEI form saves and restores data', async ({ page }) => {
    await page.goto('http://localhost:8000/src/pages/formulario-cei.html');
    await page.fill('[name="razaoSocial"]', 'Empresa Teste');
    await page.reload();
    const value = await page.inputValue('[name="razaoSocial"]');
    expect(value).toBe('Empresa Teste');
});
```

**Source:** Testing best practices, localStorage migration strategies

---

## 5. Directory Structure

### 5.1 Recommended Structure

```
src/
├── sistemas/
│   └── cei/
│       ├── core/
│       │   ├── cei-form-core.js          # Main form logic (extracted from FormCore)
│       │   ├── cei-storage-manager.js     # localStorage specific to CEI
│       │   └── cei-state-manager.js       # Form state management
│       ├── validators/
│       │   ├── cei-validator.js           # CEI-specific validation rules
│       │   ├── investment-validator.js    # Investimento mínimo 15%
│       │   ├── schedule-validator.js      # Prazo máximo 36 meses
│       │   └── document-validator.js      # CNPJ, IE validation
│       ├── storage/
│       │   ├── cei-storage-adapter.js     # Adapter for localStorage
│       │   └── cei-migration.js           # localStorage migration logic
│       ├── export/
│       │   ├── cei-json-exporter.js       # JSON export
│       │   ├── cei-pdf-exporter.js        # PDF export
│       │   └── cei-excel-exporter.js      # Excel export
│       ├── import/
│       │   └── cei-json-importer.js       # JSON import
│       ├── config/
│       │   └── cei-config.json            # CEI configuration (already exists)
│       └── index.js                        # Main entry point
├── shared/
│   ├── formatters/                         # Already created
│   │   ├── document-formatter.js          # ✅ Stateless utilities
│   │   ├── currency-formatter.js          # ✅ Stateless utilities
│   │   ├── date-formatter.js
│   │   └── phone-formatter.js
│   └── utils/
│       └── validation-helpers.js          # Pure validation functions
└── assets/
    └── js/
        ├── core.js                         # Shared FormCore (ProGoiás, Questionário)
        ├── cei-module.js                   # CEI orchestrator (update to use new system)
        └── progoias-module.js
```

### 5.2 File Responsibilities

**Core Layer:**
- `cei-form-core.js`: Form navigation, data collection, initialization
- `cei-storage-manager.js`: localStorage operations with migration support
- `cei-state-manager.js`: Form state (currentStep, formData, validationErrors)

**Validators Layer:**
- `cei-validator.js`: Orchestrates all validations
- `investment-validator.js`: Investimento mínimo, percentual 15%
- `schedule-validator.js`: Prazo máximo 36 meses, data início/término
- `document-validator.js`: CNPJ, Inscrição Estadual

**Storage Layer:**
- `cei-storage-adapter.js`: Abstract localStorage operations
- `cei-migration.js`: Handle old localStorage formats

**Export/Import Layer:**
- Separate classes for each export format
- CEI-specific export logic

### 5.3 Module Relationships

```
cei-module.js (orchestrator)
    ↓
CEIFormCore (main logic)
    ↓
├── CEIStorageManager (localStorage)
├── CEIValidator (validation)
├── CEIJSONExporter (export)
└── Shared Formatters (stateless)
    ├── DocumentFormatter
    └── CurrencyFormatter
```

**Source:** ES6 module patterns, clean architecture principles

---

## 6. localStorage Compatibility

### 6.1 Current Format

```javascript
// Key: 'formData_CEI'
{
    "formData": {
        "razaoSocial": "Empresa Teste",
        "cnpj": "12.345.678/0001-95",
        "_metadata": {
            "programType": "CEI",
            "currentStep": 3,
            "lastModified": "2025-01-15T10:00:00Z"
        }
    },
    "currentStep": 3,
    "savedAt": "2025-01-15T10:00:00Z"
}
```

### 6.2 Migration Strategy (Backwards Compatible)

**Version-Based Approach:**

```javascript
// src/sistemas/cei/storage/cei-storage-manager.js
export class CEIStorageManager {
    static STORAGE_KEY = 'formData_CEI';
    static STORAGE_VERSION = '1.0.0';
    static LEGACY_KEYS = ['formData_CEI_old']; // Clean up old versions

    static save(formData, currentStep) {
        const dataToSave = {
            version: this.STORAGE_VERSION,
            formData: {
                ...formData,
                _metadata: {
                    programType: 'CEI',
                    currentStep,
                    lastModified: new Date().toISOString()
                }
            },
            currentStep,
            savedAt: new Date().toISOString()
        };

        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(dataToSave));
        this.cleanupLegacyData();
    }

    static load() {
        const savedData = localStorage.getItem(this.STORAGE_KEY);
        if (!savedData) return null;

        const parsed = JSON.parse(savedData);

        // Migration logic for old formats
        if (!parsed.version) {
            return this.migrateFromLegacy(parsed);
        }

        return parsed;
    }

    static migrateFromLegacy(oldData) {
        console.log('[CEI Storage] Migrating from legacy format');

        // Old format: { formData: {...}, currentStep: 3, savedAt: "..." }
        // New format: Same structure but with version field

        const migrated = {
            version: this.STORAGE_VERSION,
            formData: oldData.formData || {},
            currentStep: oldData.currentStep || 1,
            savedAt: oldData.savedAt || new Date().toISOString()
        };

        // Save migrated data
        this.save(migrated.formData, migrated.currentStep);

        return migrated;
    }

    static cleanupLegacyData() {
        this.LEGACY_KEYS.forEach(key => {
            if (localStorage.getItem(key)) {
                console.log(`[CEI Storage] Removing legacy key: ${key}`);
                localStorage.removeItem(key);
            }
        });
    }
}
```

**Key Format Compatibility:**
- ✅ Keep same key name: `formData_CEI`
- ✅ Maintain same data structure
- ✅ Add optional `version` field for future migrations
- ✅ Support reading old format without `version`
- ✅ Auto-upgrade to new format on save

**Benefits:**
- Zero breaking changes for existing users
- Automatic migration on first load
- Cleanup of old versions
- Future-proof with versioning

**Source:** GitHub - localstorage-migrator, Medium - Pro tips using localStorage

### 6.3 Testing localStorage Migration

```javascript
// Test 1: Load old format (no version field)
const oldFormat = {
    formData: { razaoSocial: "Empresa Antiga" },
    currentStep: 5,
    savedAt: "2024-12-01T10:00:00Z"
};
localStorage.setItem('formData_CEI', JSON.stringify(oldFormat));

const loaded = CEIStorageManager.load();
console.assert(loaded.version === '1.0.0', 'Migration adds version');
console.assert(loaded.formData.razaoSocial === 'Empresa Antiga', 'Data preserved');

// Test 2: Load new format (with version)
const newFormat = {
    version: '1.0.0',
    formData: { razaoSocial: "Empresa Nova" },
    currentStep: 7,
    savedAt: "2025-01-15T10:00:00Z"
};
localStorage.setItem('formData_CEI', JSON.stringify(newFormat));

const loaded2 = CEIStorageManager.load();
console.assert(loaded2.version === '1.0.0', 'Version preserved');
console.assert(loaded2.formData.razaoSocial === 'Empresa Nova', 'Data preserved');
```

---

## 7. Code Examples: Extracted FormCore

### 7.1 CEI Form Core (Extracted)

```javascript
// src/sistemas/cei/core/cei-form-core.js
import { DocumentFormatter } from '../../../shared/formatters/document-formatter.js';
import { CurrencyFormatter } from '../../../shared/formatters/currency-formatter.js';
import { CEIStorageManager } from '../storage/cei-storage-manager.js';
import { CEIValidator } from '../validators/cei-validator.js';

/**
 * CEI Form Core - Extracted from shared FormCore
 * Contains ONLY CEI-specific logic
 * Uses shared stateless formatters via static imports
 */
export class CEIFormCore {
    constructor(config) {
        if (!config) {
            throw new Error('CEIFormCore: configuração obrigatória não fornecida');
        }

        if (!config.programType || config.programType !== 'CEI') {
            throw new Error('CEIFormCore: apenas para programa CEI');
        }

        if (!config.totalSteps || config.totalSteps !== 14) {
            throw new Error('CEIFormCore: CEI possui 14 seções');
        }

        this.config = config;
        this.currentStep = 1;
        this.formData = {};
        this.uploadedFiles = {};
        this.validationErrors = new Map();

        this.validator = new CEIValidator(config);
        this.elements = this.getDOMElements();

        this.init();
    }

    getDOMElements() {
        const form = document.getElementById('projectForm');

        if (!form) {
            throw new Error('CEIFormCore: elemento #projectForm não encontrado');
        }

        return {
            form,
            progressText: document.getElementById('progressText'),
            saveStatus: document.getElementById('saveStatus'),
            previewModal: document.getElementById('previewModal'),
            previewContent: document.getElementById('previewContent'),
            modalClose: document.querySelector('#previewModal .modal-close'),
            editBtn: document.getElementById('editBtn')
        };
    }

    init() {
        // Setup form data collection with auto-save
        this.elements.form.addEventListener('input', () => this.collectAndSaveData());
        this.elements.form.addEventListener('change', () => this.collectAndSaveData());

        // Field validation on blur
        document.addEventListener('blur', (e) => {
            if (e.target && typeof e.target.matches === 'function' &&
                e.target.matches('.form-control')) {
                this.validateField(e.target);
            }
        }, true);

        // CEI-specific initializations
        this.setupCEISpecificValidations();

        // Check for saved data and restore if found
        this.checkForSavedData();

        console.log('[CEI FormCore] Initialized');
    }

    setupCEISpecificValidations() {
        // Investment minimum validation (15% of operation value)
        const investmentField = document.querySelector('[name="valorTotalInvestimento"]');
        const operationField = document.querySelector('[name="valorOperacao"]');

        if (investmentField && operationField) {
            const validateInvestmentPercentage = () => {
                const investment = this.parseFinancialValue(investmentField.value);
                const operation = this.parseFinancialValue(operationField.value);

                if (investment && operation) {
                    const percentage = (investment / operation) * 100;
                    if (percentage < this.config.validationRules.percentualMinimo) {
                        this.setFieldError(investmentField,
                            `Investimento deve ser no mínimo ${this.config.validationRules.percentualMinimo}% do valor da operação`);
                    }
                }
            };

            investmentField.addEventListener('blur', validateInvestmentPercentage);
            operationField.addEventListener('blur', validateInvestmentPercentage);
        }

        // Schedule maximum validation (36 months)
        const startDateField = document.querySelector('[name="dataInicio"]');
        const endDateField = document.querySelector('[name="dataTermino"]');

        if (startDateField && endDateField) {
            const validateDateRange = () => {
                const startDate = new Date(startDateField.value);
                const endDate = new Date(endDateField.value);

                if (startDate && endDate) {
                    if (startDate >= endDate) {
                        this.setFieldError(endDateField,
                            'Data de término deve ser posterior à data de início');
                        return;
                    }

                    const diffMonths = (endDate.getFullYear() - startDate.getFullYear()) * 12 +
                                     (endDate.getMonth() - startDate.getMonth());

                    if (diffMonths > this.config.validationRules.prazoMaximo) {
                        this.setFieldError(endDateField,
                            `Período não pode exceder ${this.config.validationRules.prazoMaximo} meses`);
                    }
                }
            };

            startDateField.addEventListener('blur', validateDateRange);
            endDateField.addEventListener('blur', validateDateRange);
        }
    }

    validateField(field) {
        const fieldName = field.name;
        if (!fieldName) {
            throw new Error('Campo sem atributo name encontrado');
        }

        this.clearFieldError(field);

        // Required field validation
        if (field.hasAttribute('required') && !field.value.trim()) {
            this.setFieldError(field, 'Este campo é obrigatório');
            return false;
        }

        // Email validation
        if (field.type === 'email' && field.value && !this.isValidEmail(field.value)) {
            this.setFieldError(field, 'E-mail inválido');
            return false;
        }

        // CNPJ validation (using shared formatter)
        if (field.dataset.validation === 'cnpj' && field.value) {
            try {
                const digits = DocumentFormatter.removeFormatting(field.value);
                if (digits.length !== 14 || /^(\d)\1{13}$/.test(digits)) {
                    this.setFieldError(field, 'CNPJ inválido');
                    return false;
                }
            } catch (error) {
                this.setFieldError(field, 'CNPJ inválido');
                return false;
            }
        }

        return true;
    }

    isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    setFieldError(field, message) {
        field.classList.add('error');

        let errorElement = field.parentNode.querySelector('.error-message');
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.className = 'error-message show';
            field.parentNode.appendChild(errorElement);
        }

        errorElement.textContent = message;
        this.validationErrors.set(field.name, message);
    }

    clearFieldError(field) {
        field.classList.remove('error');
        const errorElement = field.parentNode.querySelector('.error-message');
        if (errorElement) {
            errorElement.remove();
        }
        this.validationErrors.delete(field.name);
    }

    collectAndSaveData() {
        this.collectFormData();
        CEIStorageManager.save(this.formData, this.currentStep);

        if (this.elements.saveStatus) {
            this.elements.saveStatus.textContent = '💾 Salvo automaticamente';
        }
    }

    collectFormData() {
        const formData = new FormData(this.elements.form);
        this.formData = {};

        for (const [key, value] of formData.entries()) {
            // Skip File objects
            if (value instanceof File) {
                continue;
            }
            // Only add non-empty string values
            if (typeof value === 'string' && value.trim()) {
                this.formData[key] = value;
            }
        }

        // CEI-specific metadata
        this.formData._metadata = {
            programType: 'CEI',
            currentStep: this.currentStep,
            lastModified: new Date().toISOString(),
            version: '1.0.0'
        };
    }

    getFormData() {
        return this.formData;
    }

    checkForSavedData() {
        const savedData = CEIStorageManager.load();

        if (!savedData || !savedData.formData ||
            Object.keys(savedData.formData).length === 0) {
            return;
        }

        const shouldRestore = confirm('Dados CEI salvos encontrados. Restaurar?');
        if (shouldRestore) {
            this.restoreFormData(savedData);
        }
    }

    restoreFormData(savedData) {
        if (!savedData || !savedData.formData) {
            throw new Error('Dados salvos inválidos para restauração');
        }

        this.formData = savedData.formData;
        this.currentStep = savedData.currentStep || 1;

        // Populate fields
        Object.entries(this.formData).forEach(([key, value]) => {
            if (key.startsWith('_')) return;

            const field = document.querySelector(`[name="${key}"]`);
            if (field) {
                field.value = value;
                // Trigger events for automatic calculations
                field.dispatchEvent(new Event('change', { bubbles: true }));
                field.dispatchEvent(new Event('input', { bubbles: true }));
            }
        });

        // Hide all sections before showing correct one
        const allSections = document.querySelectorAll('.form-section');
        allSections.forEach(section => {
            section.style.display = 'none';
            section.classList.remove('active');
        });

        // Navigate to saved step (handled by tabs.js)
        if (window.tabNavigation) {
            window.tabNavigation.switchToTab(this.currentStep);
        }

        // Trigger custom event after restoration
        document.dispatchEvent(new CustomEvent('ceiFormDataRestored', {
            detail: { formData: this.formData, currentStep: this.currentStep }
        }));

        // Recalculate percentages (if PercentageCalculator exists)
        if (window.PercentageCalculator) {
            window.PercentageCalculator.recalculateAll();
        }

        console.log(`[CEI FormCore] Dados restaurados - seção ${this.currentStep}`);
    }

    clearAllData() {
        if (!confirm('Tem certeza que deseja limpar todos os dados CEI?')) {
            return;
        }

        CEIStorageManager.clear();
        this.formData = {};
        this.currentStep = 1;
        this.elements.form.reset();

        // Navigate to first section
        if (window.tabNavigation) {
            window.tabNavigation.switchToTab(1);
        }

        console.log('[CEI FormCore] Dados limpos');
    }

    // Formatting methods using shared formatters
    formatCNPJ(value) {
        return DocumentFormatter.formatCNPJ(value);
    }

    formatCurrency(value) {
        return CurrencyFormatter.formatBRL(value);
    }

    parseFinancialValue(value) {
        if (!value) return 0;
        try {
            return CurrencyFormatter.parse(value);
        } catch (error) {
            return 0;
        }
    }
}
```

### 7.2 CEI Storage Manager

```javascript
// src/sistemas/cei/storage/cei-storage-manager.js

/**
 * CEI Storage Manager
 * Handles localStorage operations with backwards compatibility
 */
export class CEIStorageManager {
    static STORAGE_KEY = 'formData_CEI';
    static STORAGE_VERSION = '1.0.0';
    static LEGACY_KEYS = Object.freeze(['formData_CEI_old']);

    /**
     * Save form data to localStorage
     * @param {Object} formData - Form data to save
     * @param {number} currentStep - Current form step
     */
    static save(formData, currentStep) {
        const dataToSave = {
            version: this.STORAGE_VERSION,
            formData: {
                ...formData,
                _metadata: {
                    programType: 'CEI',
                    currentStep,
                    lastModified: new Date().toISOString()
                }
            },
            currentStep,
            savedAt: new Date().toISOString()
        };

        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(dataToSave));
            this.cleanupLegacyData();
        } catch (error) {
            throw new Error(`Erro ao salvar dados CEI: ${error.message}`);
        }
    }

    /**
     * Load form data from localStorage with migration support
     * @returns {Object|null} Saved data or null if not found
     */
    static load() {
        try {
            const savedData = localStorage.getItem(this.STORAGE_KEY);
            if (!savedData) return null;

            const parsed = JSON.parse(savedData);

            // Migration logic for old formats (no version field)
            if (!parsed.version) {
                return this.migrateFromLegacy(parsed);
            }

            return parsed;
        } catch (error) {
            console.error('[CEI Storage] Erro ao carregar dados:', error);
            return null;
        }
    }

    /**
     * Migrate data from legacy format (pre-versioning)
     * @private
     * @param {Object} oldData - Old format data
     * @returns {Object} Migrated data
     */
    static migrateFromLegacy(oldData) {
        console.log('[CEI Storage] Migrating from legacy format');

        const migrated = {
            version: this.STORAGE_VERSION,
            formData: oldData.formData || {},
            currentStep: oldData.currentStep || 1,
            savedAt: oldData.savedAt || new Date().toISOString()
        };

        // Save migrated data with new format
        this.save(migrated.formData, migrated.currentStep);

        return migrated;
    }

    /**
     * Clean up old localStorage keys
     * @private
     */
    static cleanupLegacyData() {
        this.LEGACY_KEYS.forEach(key => {
            if (localStorage.getItem(key)) {
                console.log(`[CEI Storage] Removing legacy key: ${key}`);
                localStorage.removeItem(key);
            }
        });
    }

    /**
     * Clear all CEI data from localStorage
     */
    static clear() {
        try {
            localStorage.removeItem(this.STORAGE_KEY);
            this.cleanupLegacyData();
            console.log('[CEI Storage] Data cleared');
        } catch (error) {
            throw new Error(`Erro ao limpar dados CEI: ${error.message}`);
        }
    }

    /**
     * Check if saved data exists
     * @returns {boolean} True if data exists
     */
    static hasData() {
        return localStorage.getItem(this.STORAGE_KEY) !== null;
    }
}
```

### 7.3 Updated CEI Module (Orchestrator)

```javascript
// src/assets/js/cei-module.js (UPDATED)
import { CEIFormCore } from '../../sistemas/cei/core/cei-form-core.js';
// Remove: import { FormCore } from './core.js';

class CEIForm {
    constructor() {
        this.config = null;
        this.core = null;
        this.validator = null;
        this.exporter = null;
        this.importer = null;

        this.init();
    }

    async init() {
        await this.loadConfig();
        this.initializeModules();
        this.setupEventListeners();
        this.setupFileHandlers();
    }

    async loadConfig() {
        const response = await fetch('config/cei-config.json');
        if (!response.ok) {
            throw new Error('Erro ao carregar configuração CEI');
        }

        this.config = await response.json();

        if (!this.config.programType || this.config.programType !== 'CEI') {
            throw new Error('Configuração CEI inválida');
        }
    }

    initializeModules() {
        // NEW: Use CEIFormCore instead of shared FormCore
        this.core = new CEIFormCore(this.config);

        this.validator = new FormValidator(this.config);
        this.exporter = new FormExporter(this.config, this.core.getFormData());
        this.importer = new ImportManager(this.config);

        new FieldAutoFormatter();
    }

    // ... rest of CEI module code unchanged ...
}

document.addEventListener('DOMContentLoaded', () => {
    new CEIForm();
});
```

---

## 8. Migration Checklist

### Phase 1: Create Independent System (Week 1)

**Day 1-2: Setup Directory Structure**
- [ ] Create `src/sistemas/cei/` directory
- [ ] Create subdirectories: `core/`, `validators/`, `storage/`, `export/`, `import/`, `config/`
- [ ] Create `index.js` entry point
- [ ] Copy `config/cei-config.json` to `src/sistemas/cei/config/`

**Day 3-4: Extract Core Logic**
- [ ] Create `cei-form-core.js` with CEI-specific logic from `FormCore`
- [ ] Import shared formatters (DocumentFormatter, CurrencyFormatter)
- [ ] Remove ProGoiás/Questionário logic
- [ ] Add CEI-specific validations (15% investment, 36 months)
- [ ] Test CEI core independently (browser console)

**Day 5: Extract Storage Logic**
- [ ] Create `cei-storage-manager.js`
- [ ] Extract localStorage logic from `FormCore`
- [ ] Implement version-based migration support
- [ ] Add backwards compatibility for old format
- [ ] Test localStorage save/load

**Day 6-7: Testing**
- [ ] Unit test CEIFormCore initialization
- [ ] Test form data collection
- [ ] Test localStorage migration (old → new format)
- [ ] Test formatters integration
- [ ] Test validation methods
- [ ] Document any issues found

### Phase 2: Switch CEI Module (Week 2)

**Day 1-2: Update CEI Module**
- [ ] Update `cei-module.js` imports (new CEIFormCore)
- [ ] Replace `new FormCore(config)` with `new CEIFormCore(config)`
- [ ] Test all 14 sections work correctly
- [ ] Verify tab navigation (tabs.js integration)
- [ ] Test auto-save behavior

**Day 3-4: Integration Testing**
- [ ] Test export functionality (JSON, PDF, Excel)
- [ ] Test import functionality
- [ ] Test full form workflow (fill → save → reload → restore)
- [ ] Test localStorage compatibility with old data
- [ ] Test all CEI-specific validations

**Day 5: User Acceptance Testing**
- [ ] Fill out complete CEI form manually
- [ ] Save and reload page multiple times
- [ ] Export to all formats
- [ ] Import saved JSON
- [ ] Clear data and verify cleanup
- [ ] Test on multiple browsers (Chrome, Firefox, Safari)

**Day 6-7: Documentation & Rollback Plan**
- [ ] Document new CEI system architecture
- [ ] Update CLAUDE.md with new structure
- [ ] Create rollback script (revert to old FormCore)
- [ ] Tag git commit for easy rollback
- [ ] Communicate changes to team

### Phase 3: Clean Up (Week 3)

**Day 1-2: Verify Stability**
- [ ] Monitor for 48 hours for any issues
- [ ] Collect user feedback
- [ ] Fix any bugs found
- [ ] Ensure localStorage migration working smoothly

**Day 3-4: Remove Old Code**
- [ ] Remove CEI-specific logic from shared `core.js`
- [ ] Remove CEI-related methods from `FormCore`
- [ ] Remove `FormUtils` (replaced by shared formatters)
- [ ] Update shared `FormCore` comments to reflect changes

**Day 5: Final Testing**
- [ ] Test CEI system still works after cleanup
- [ ] Test ProGoiás system not affected by changes
- [ ] Test Questionário system not affected
- [ ] Run full regression test suite

**Day 6-7: Documentation & Release**
- [ ] Update all documentation (README.md, CLAUDE.md)
- [ ] Create migration guide for other programs
- [ ] Tag release version
- [ ] Announce completion

---

## 9. Risks and Mitigation Strategies

### 9.1 High Risks

| Risk | Impact | Probability | Mitigation Strategy |
|------|--------|-------------|---------------------|
| **Breaking existing localStorage data** | HIGH | MEDIUM | Use version-based migration with backwards compatibility. Test thoroughly with old data formats. |
| **Breaking CEI form functionality** | HIGH | MEDIUM | Gradual migration with parallel testing. Keep old code as fallback. Comprehensive manual testing. |
| **Incorrect validation logic extraction** | HIGH | LOW | Compare CEI-specific validations side-by-side. Write unit tests for each validation. |
| **Breaking export/import functionality** | MEDIUM | MEDIUM | Test all export formats (JSON, PDF, Excel) after migration. Verify import still works with old files. |

### 9.2 Medium Risks

| Risk | Impact | Probability | Mitigation Strategy |
|------|--------|-------------|---------------------|
| **Incomplete code extraction** | MEDIUM | MEDIUM | Create extraction checklist. Code review. Test all 14 sections manually. |
| **Breaking tab navigation (tabs.js)** | MEDIUM | LOW | tabs.js is independent - minimal risk. Test navigation after migration. |
| **FormUtils still referenced somewhere** | MEDIUM | LOW | Global search for "FormUtils" before removal. Update all references to shared formatters. |
| **ProGoiás/Questionário affected** | MEDIUM | LOW | They use different config.programType. Test after CEI migration to verify isolation. |

### 9.3 Low Risks

| Risk | Impact | Probability | Mitigation Strategy |
|------|--------|-------------|---------------------|
| **Performance degradation** | LOW | LOW | CEI system is client-side - no performance concerns. Monitor initial load time. |
| **Browser compatibility issues** | LOW | LOW | Use ES6 modules (already in use). Test on Chrome, Firefox, Safari. |
| **Shared formatter bugs** | LOW | LOW | Formatters already created and tested. Stateless - minimal risk. |

### 9.4 Mitigation Best Practices

**Before Migration:**
1. ✅ Backup current localStorage data (export JSON)
2. ✅ Tag current git commit for easy rollback
3. ✅ Document current behavior (screenshots, videos)
4. ✅ Create comprehensive test checklist

**During Migration:**
1. ✅ Work in feature branch (`feature/cei-independent-system`)
2. ✅ Test incrementally after each extraction
3. ✅ Keep old code intact until verification complete
4. ✅ Monitor browser console for errors

**After Migration:**
1. ✅ Monitor for 48 hours before cleanup
2. ✅ Collect user feedback
3. ✅ Keep rollback plan ready
4. ✅ Document lessons learned

---

## 10. Implementation Timeline

**Total Time: 3 weeks (15 working days)**

### Week 1: Create Independent System
- **Days 1-2**: Directory structure + setup
- **Days 3-4**: Extract core logic + formatters
- **Day 5**: Storage manager + migration
- **Days 6-7**: Unit testing

**Deliverable:** Independent CEI system (not yet integrated)

### Week 2: Switch to New System
- **Days 1-2**: Update cei-module.js
- **Days 3-4**: Integration testing
- **Days 5**: User acceptance testing
- **Days 6-7**: Documentation + rollback plan

**Deliverable:** CEI system using new independent core (old code still present)

### Week 3: Clean Up
- **Days 1-2**: Monitor stability
- **Days 3-4**: Remove old code from shared FormCore
- **Days 5**: Final regression testing
- **Days 6-7**: Documentation + release

**Deliverable:** Clean codebase with independent CEI system

---

## 11. Success Criteria

### Functional Requirements
- ✅ All 14 CEI sections work correctly
- ✅ Form validation works (required fields, CNPJ, investment %, dates)
- ✅ Auto-save works (30s periodic + on input)
- ✅ localStorage save/load/restore works
- ✅ Export works (JSON, PDF, Excel)
- ✅ Import works (JSON)
- ✅ Tab navigation works (tabs.js integration)
- ✅ Clear data works

### Non-Functional Requirements
- ✅ **Backwards Compatibility**: Old localStorage data loads correctly
- ✅ **Independence**: CEI system works without shared FormCore
- ✅ **SOLID Principles**: SRP (single responsibility), DIP (dependency inversion)
- ✅ **Zero Business Logic in Shared Utils**: Formatters are stateless utilities
- ✅ **Maintainability**: Clear module structure, documented code
- ✅ **Testability**: Unit tests for core logic, validators, storage

### Technical Requirements
- ✅ **ES6 Modules**: Proper import/export syntax
- ✅ **Static Imports for Formatters**: DocumentFormatter, CurrencyFormatter
- ✅ **localStorage Key Format**: Keep `formData_CEI` (backwards compatible)
- ✅ **Error Handling**: Proper error messages, no silent failures
- ✅ **Browser Compatibility**: Chrome, Firefox, Safari (ES6 modules)

---

## 12. Conclusion

### Recommended Approach Summary

1. **Dependency Injection**: Use **static imports** for shared formatters (stateless utilities)
2. **Migration Strategy**: Use **gradual migration** (3-week timeline with testing at each phase)
3. **localStorage**: Implement **version-based migration** with backwards compatibility
4. **Directory Structure**: Create `src/sistemas/cei/` with clear separation (core, validators, storage, export)
5. **Testing**: Comprehensive testing at each phase (unit → integration → UAT → regression)

### Key Principles

- ✅ **KISS**: Keep implementation simple and straightforward
- ✅ **DRY**: Reuse shared formatters, no code duplication
- ✅ **SOLID**: Single responsibility (CEIFormCore), dependency inversion (stateless formatters)
- ✅ **No Fallbacks**: Fail fast with clear error messages
- ✅ **No Hardcoded Data**: Use configuration files (cei-config.json)

### Next Steps

1. Review this research document
2. Create feature branch: `feature/cei-independent-system`
3. Start Phase 1: Create directory structure
4. Follow migration checklist step-by-step
5. Document progress and issues

### References

**Web Sources:**
- MDN Web Docs: JavaScript Modules
- Medium: Dependency Injection in JavaScript
- GitHub: localstorage-migrator
- FreeCodeCamp: Dependency Injection Guide
- Enterprise Craftsmanship: Static Methods Analysis
- DEV Community: SOLID Principles

**Project Files:**
- `/Users/ceciliodaher/Documents/git/mapeador-projetos/src/assets/js/core.js` (331 LOC)
- `/Users/ceciliodaher/Documents/git/mapeador-projetos/src/assets/js/cei-module.js` (382 LOC)
- `/Users/ceciliodaher/Documents/git/mapeador-projetos/src/shared/formatters/` (already created)
- `/Users/ceciliodaher/Documents/git/mapeador-projetos/CLAUDE.md` (project context)

---

**Document Version:** 1.0.0
**Created:** 2025-01-15
**Author:** Claude Code (Research Agent)
**Status:** Ready for Implementation
