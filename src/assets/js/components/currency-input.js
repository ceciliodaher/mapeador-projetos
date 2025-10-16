/**
 * CurrencyInput.js
 * Componente para input de valores monetários com máscara R$ X.XXX.XXX,XX
 *
 * @version 1.0.0
 * @date 2025-10-16
 */

class CurrencyInput {
  /**
   * @param {HTMLInputElement} inputElement - Elemento input do DOM
   * @param {Object} options - Configurações opcionais
   * @param {boolean} options.allowNegative - Permitir valores negativos (default: false)
   * @param {number} options.min - Valor mínimo permitido (default: null)
   * @param {number} options.max - Valor máximo permitido (default: null)
   * @param {Function} options.onChange - Callback quando valor mudar (default: null)
   * @param {Function} options.onValidate - Callback quando validar (default: null)
   */
  constructor(inputElement, options = {}) {
    // Validar input element
    if (!inputElement) {
      throw new Error('CurrencyInput: inputElement é obrigatório');
    }

    if (!(inputElement instanceof HTMLInputElement)) {
      throw new Error('CurrencyInput: inputElement deve ser um HTMLInputElement');
    }

    this.input = inputElement;

    // Configurações
    this.options = {
      allowNegative: options.allowNegative === true,
      min: options.min !== undefined ? options.min : null,
      max: options.max !== undefined ? options.max : null,
      onChange: options.onChange !== undefined ? options.onChange : null,
      onValidate: options.onValidate !== undefined ? options.onValidate : null
    };

    // Validar callbacks se fornecidos
    if (this.options.onChange !== null && typeof this.options.onChange !== 'function') {
      throw new Error('CurrencyInput: options.onChange deve ser uma função');
    }

    if (this.options.onValidate !== null && typeof this.options.onValidate !== 'function') {
      throw new Error('CurrencyInput: options.onValidate deve ser uma função');
    }

    // Estado interno
    this.isFormatted = true; // Input começa formatado

    // Inicializar
    this.init();
  }

  /**
   * Inicializa o componente
   */
  init() {
    // Adicionar classe CSS
    this.input.classList.add('currency-input');

    // Formatar valor inicial se existir
    const initialValue = this.input.value;
    if (initialValue && initialValue.trim() !== '') {
      const numericValue = this.parseValue(initialValue);
      this.input.value = this.formatValue(numericValue);
    }

    // Anexar event listeners
    this.attachEventListeners();

    console.log('✓ CurrencyInput inicializado:', this.input.id || this.input.name || 'unnamed');
  }

  /**
   * Anexa event listeners ao input
   */
  attachEventListeners() {
    // Ao focar: remover formatação (facilitar edição)
    this.input.addEventListener('focus', (e) => this.handleFocus(e));

    // Ao desfocar: aplicar formatação
    this.input.addEventListener('blur', (e) => this.handleBlur(e));

    // Durante digitação: restringir caracteres
    this.input.addEventListener('input', (e) => this.handleInput(e));

    // Prevenir entrada de caracteres inválidos via teclado
    this.input.addEventListener('keypress', (e) => this.handleKeypress(e));
  }

  /**
   * Handle focus: remove formatação para facilitar edição
   * @param {Event} e
   */
  handleFocus(e) {
    if (this.isFormatted) {
      const value = this.getValue();
      // Exibir apenas o número com vírgula decimal
      this.input.value = value.toFixed(2).replace('.', ',');
      this.isFormatted = false;
    }
  }

  /**
   * Handle blur: aplica formatação R$ X.XXX,XX
   * @param {Event} e
   */
  handleBlur(e) {
    const value = this.getValue();

    // Validar
    const validation = this.validate(value);

    // Aplicar formatação
    this.input.value = this.formatValue(value);
    this.isFormatted = true;

    // Callback onValidate
    if (this.options.onValidate !== null) {
      this.options.onValidate({
        value,
        isValid: validation.isValid,
        errors: validation.errors
      });
    }

    // Aplicar/remover classe de erro
    if (validation.isValid) {
      this.input.classList.remove('error');
      this.input.title = '';
    } else {
      this.input.classList.add('error');
      this.input.title = validation.errors.join('; ');
    }
  }

  /**
   * Handle input: restringir caracteres durante digitação
   * @param {Event} e
   */
  handleInput(e) {
    let value = this.input.value;

    // Remover caracteres não permitidos
    // Permitidos: dígitos, vírgula, ponto, e opcionalmente sinal de menos
    if (this.options.allowNegative) {
      value = value.replace(/[^\d,.-]/g, '');
    } else {
      value = value.replace(/[^\d,.]/g, '');
    }

    // Permitir apenas uma vírgula ou ponto
    const parts = value.split(/[,.]/);
    if (parts.length > 2) {
      // Manter apenas primeira parte + segunda parte
      value = parts[0] + ',' + parts.slice(1).join('');
    }

    // Limitar casas decimais a 2
    if (parts.length === 2 && parts[1].length > 2) {
      value = parts[0] + ',' + parts[1].substring(0, 2);
    }

    this.input.value = value;

    // Callback onChange
    if (this.options.onChange !== null) {
      const numericValue = this.getValue();
      this.options.onChange(numericValue);
    }
  }

  /**
   * Handle keypress: prevenir caracteres inválidos
   * @param {Event} e
   */
  handleKeypress(e) {
    const char = e.key;
    const currentValue = this.input.value;

    // Permitir teclas de controle (backspace, delete, arrow keys, etc)
    if (e.ctrlKey || e.metaKey || char.length > 1) {
      return; // Permitir
    }

    // Permitir dígitos
    if (/\d/.test(char)) {
      return; // Permitir
    }

    // Permitir vírgula ou ponto (se ainda não existir)
    if ((char === ',' || char === '.') && !/[,.]/.test(currentValue)) {
      return; // Permitir
    }

    // Permitir sinal de menos (se allowNegative e no início)
    if (char === '-' && this.options.allowNegative && currentValue.length === 0) {
      return; // Permitir
    }

    // Todos os outros caracteres: bloquear
    e.preventDefault();
  }

  /**
   * Obtém o valor numérico do input
   * @returns {number}
   */
  getValue() {
    const text = this.input.value;

    if (!text || text.trim() === '') {
      return 0;
    }

    // Remover formatação: R$, pontos de milhar, espaços
    let normalized = text.replace(/[R$\s]/g, '');

    // Substituir vírgula por ponto (padrão JS)
    normalized = normalized.replace(',', '.');

    // Converter para número
    const value = parseFloat(normalized);

    if (isNaN(value)) {
      throw new Error(`CurrencyInput: valor "${text}" não pode ser convertido para número`);
    }

    return value;
  }

  /**
   * Define o valor do input
   * @param {number} value
   */
  setValue(value) {
    if (typeof value !== 'number') {
      throw new Error('CurrencyInput.setValue(): value deve ser um número');
    }

    if (isNaN(value)) {
      throw new Error('CurrencyInput.setValue(): value não pode ser NaN');
    }

    this.input.value = this.formatValue(value);
    this.isFormatted = true;
  }

  /**
   * Formata valor como R$ X.XXX.XXX,XX
   * @param {number} value
   * @returns {string}
   */
  formatValue(value) {
    if (typeof value !== 'number') {
      throw new Error('CurrencyInput.formatValue(): value deve ser um número');
    }

    if (isNaN(value)) {
      throw new Error('CurrencyInput.formatValue(): value não pode ser NaN');
    }

    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  }

  /**
   * Parse string para número
   * @param {string} text
   * @returns {number}
   */
  parseValue(text) {
    if (typeof text !== 'string') {
      throw new Error('CurrencyInput.parseValue(): text deve ser uma string');
    }

    if (!text || text.trim() === '') {
      return 0;
    }

    // Remover formatação
    let normalized = text.replace(/[R$\s]/g, '');

    // Substituir vírgula por ponto
    normalized = normalized.replace(',', '.');

    // Converter para número
    const value = parseFloat(normalized);

    if (isNaN(value)) {
      throw new Error(`CurrencyInput.parseValue(): não foi possível converter "${text}" para número`);
    }

    return value;
  }

  /**
   * Valida o valor
   * @param {number} value
   * @returns {Object} { isValid: boolean, errors: Array<string> }
   */
  validate(value) {
    const errors = [];

    // Validar tipo
    if (typeof value !== 'number') {
      throw new Error('CurrencyInput.validate(): value deve ser um número');
    }

    if (isNaN(value)) {
      errors.push('Valor inválido');
      return { isValid: false, errors };
    }

    // Validar negativos
    if (!this.options.allowNegative && value < 0) {
      errors.push('Valores negativos não são permitidos');
    }

    // Validar mínimo
    if (this.options.min !== null && value < this.options.min) {
      errors.push(`Valor mínimo: ${this.formatValue(this.options.min)}`);
    }

    // Validar máximo
    if (this.options.max !== null && value > this.options.max) {
      errors.push(`Valor máximo: ${this.formatValue(this.options.max)}`);
    }

    const isValid = errors.length === 0;

    return { isValid, errors };
  }

  /**
   * Limpa recursos
   */
  destroy() {
    // Remover event listeners
    this.input.removeEventListener('focus', this.handleFocus);
    this.input.removeEventListener('blur', this.handleBlur);
    this.input.removeEventListener('input', this.handleInput);
    this.input.removeEventListener('keypress', this.handleKeypress);

    // Remover classe CSS
    this.input.classList.remove('currency-input');

    console.log('✓ CurrencyInput destruído:', this.input.id || this.input.name || 'unnamed');
  }

  /**
   * Método estático para inicializar múltiplos inputs
   * @param {string} selector - Seletor CSS (ex: '.currency-input')
   * @param {Object} options - Configurações padrão
   * @returns {Array<CurrencyInput>}
   */
  static initializeAll(selector, options = {}) {
    if (typeof selector !== 'string') {
      throw new Error('CurrencyInput.initializeAll(): selector deve ser uma string');
    }

    const inputs = document.querySelectorAll(selector);

    if (inputs.length === 0) {
      console.warn(`CurrencyInput.initializeAll(): nenhum elemento encontrado para selector "${selector}"`);
      return [];
    }

    const instances = [];

    inputs.forEach(input => {
      if (!(input instanceof HTMLInputElement)) {
        throw new Error(`CurrencyInput.initializeAll(): elemento não é um HTMLInputElement (selector: "${selector}")`);
      }

      // Ler configurações específicas do elemento via data-attributes
      const elementOptions = {
        ...options,
        allowNegative: input.dataset.allowNegative === 'true',
        min: input.dataset.min !== undefined ? parseFloat(input.dataset.min) : options.min,
        max: input.dataset.max !== undefined ? parseFloat(input.dataset.max) : options.max
      };

      const instance = new CurrencyInput(input, elementOptions);
      instances.push(instance);
    });

    console.log(`✓ CurrencyInput.initializeAll(): ${instances.length} instâncias criadas`);

    return instances;
  }
}

// Exportar globalmente
if (typeof window !== 'undefined') {
  window.CurrencyInput = CurrencyInput;
}

// Exportar para Node.js (se necessário para testes)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CurrencyInput;
}
