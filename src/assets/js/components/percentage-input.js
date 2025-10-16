/**
 * PercentageInput.js
 * Componente para input de valores percentuais com máscara XX,XX%
 *
 * @version 1.0.0
 * @date 2025-10-16
 */

class PercentageInput {
  /**
   * @param {HTMLInputElement} inputElement - Elemento input do DOM
   * @param {Object} options - Configurações opcionais
   * @param {number} options.min - Valor mínimo permitido (default: 0)
   * @param {number} options.max - Valor máximo permitido (default: 100)
   * @param {number} options.decimals - Casas decimais (default: 2)
   * @param {Function} options.onChange - Callback quando valor mudar (default: null)
   * @param {Function} options.onValidate - Callback quando validar (default: null)
   */
  constructor(inputElement, options = {}) {
    // Validar input element
    if (!inputElement) {
      throw new Error('PercentageInput: inputElement é obrigatório');
    }

    if (!(inputElement instanceof HTMLInputElement)) {
      throw new Error('PercentageInput: inputElement deve ser um HTMLInputElement');
    }

    this.input = inputElement;

    // Configurações
    this.options = {
      min: options.min !== undefined ? options.min : 0,
      max: options.max !== undefined ? options.max : 100,
      decimals: options.decimals !== undefined ? options.decimals : 2,
      onChange: options.onChange !== undefined ? options.onChange : null,
      onValidate: options.onValidate !== undefined ? options.onValidate : null
    };

    // Validar configurações
    if (typeof this.options.min !== 'number' || isNaN(this.options.min)) {
      throw new Error('PercentageInput: options.min deve ser um número');
    }

    if (typeof this.options.max !== 'number' || isNaN(this.options.max)) {
      throw new Error('PercentageInput: options.max deve ser um número');
    }

    if (this.options.min > this.options.max) {
      throw new Error('PercentageInput: options.min não pode ser maior que options.max');
    }

    if (typeof this.options.decimals !== 'number' || this.options.decimals < 0) {
      throw new Error('PercentageInput: options.decimals deve ser um número >= 0');
    }

    // Validar callbacks se fornecidos
    if (this.options.onChange !== null && typeof this.options.onChange !== 'function') {
      throw new Error('PercentageInput: options.onChange deve ser uma função');
    }

    if (this.options.onValidate !== null && typeof this.options.onValidate !== 'function') {
      throw new Error('PercentageInput: options.onValidate deve ser uma função');
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
    this.input.classList.add('percentage-input');

    // Formatar valor inicial se existir
    const initialValue = this.input.value;
    if (initialValue && initialValue.trim() !== '') {
      const numericValue = this.parseValue(initialValue);
      this.input.value = this.formatValue(numericValue);
    }

    // Anexar event listeners
    this.attachEventListeners();

    console.log('✓ PercentageInput inicializado:', this.input.id || this.input.name || 'unnamed');
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
      // Exibir apenas o número com vírgula decimal (sem %)
      this.input.value = value.toFixed(this.options.decimals).replace('.', ',');
      this.isFormatted = false;
    }
  }

  /**
   * Handle blur: aplica formatação XX,XX%
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

    // Remover caracteres não permitidos (apenas dígitos, vírgula e ponto)
    value = value.replace(/[^\d,.]/g, '');

    // Permitir apenas uma vírgula ou ponto
    const parts = value.split(/[,.]/);
    if (parts.length > 2) {
      // Manter apenas primeira parte + segunda parte
      value = parts[0] + ',' + parts.slice(1).join('');
    }

    // Limitar casas decimais conforme configuração
    if (parts.length === 2 && parts[1].length > this.options.decimals) {
      value = parts[0] + ',' + parts[1].substring(0, this.options.decimals);
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

    // Remover formatação: %, espaços
    let normalized = text.replace(/[%\s]/g, '');

    // Substituir vírgula por ponto (padrão JS)
    normalized = normalized.replace(',', '.');

    // Converter para número
    const value = parseFloat(normalized);

    if (isNaN(value)) {
      throw new Error(`PercentageInput: valor "${text}" não pode ser convertido para número`);
    }

    return value;
  }

  /**
   * Define o valor do input
   * @param {number} value
   */
  setValue(value) {
    if (typeof value !== 'number') {
      throw new Error('PercentageInput.setValue(): value deve ser um número');
    }

    if (isNaN(value)) {
      throw new Error('PercentageInput.setValue(): value não pode ser NaN');
    }

    this.input.value = this.formatValue(value);
    this.isFormatted = true;
  }

  /**
   * Formata valor como XX,XX%
   * @param {number} value
   * @returns {string}
   */
  formatValue(value) {
    if (typeof value !== 'number') {
      throw new Error('PercentageInput.formatValue(): value deve ser um número');
    }

    if (isNaN(value)) {
      throw new Error('PercentageInput.formatValue(): value não pode ser NaN');
    }

    return value.toFixed(this.options.decimals).replace('.', ',') + '%';
  }

  /**
   * Parse string para número
   * @param {string} text
   * @returns {number}
   */
  parseValue(text) {
    if (typeof text !== 'string') {
      throw new Error('PercentageInput.parseValue(): text deve ser uma string');
    }

    if (!text || text.trim() === '') {
      return 0;
    }

    // Remover formatação
    let normalized = text.replace(/[%\s]/g, '');

    // Substituir vírgula por ponto
    normalized = normalized.replace(',', '.');

    // Converter para número
    const value = parseFloat(normalized);

    if (isNaN(value)) {
      throw new Error(`PercentageInput.parseValue(): não foi possível converter "${text}" para número`);
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
      throw new Error('PercentageInput.validate(): value deve ser um número');
    }

    if (isNaN(value)) {
      errors.push('Valor inválido');
      return { isValid: false, errors };
    }

    // Validar mínimo
    if (value < this.options.min) {
      errors.push(`Valor mínimo: ${this.formatValue(this.options.min)}`);
    }

    // Validar máximo
    if (value > this.options.max) {
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
    this.input.classList.remove('percentage-input');

    console.log('✓ PercentageInput destruído:', this.input.id || this.input.name || 'unnamed');
  }

  /**
   * Método estático para inicializar múltiplos inputs
   * @param {string} selector - Seletor CSS (ex: '.percentage-input')
   * @param {Object} options - Configurações padrão
   * @returns {Array<PercentageInput>}
   */
  static initializeAll(selector, options = {}) {
    if (typeof selector !== 'string') {
      throw new Error('PercentageInput.initializeAll(): selector deve ser uma string');
    }

    const inputs = document.querySelectorAll(selector);

    if (inputs.length === 0) {
      console.warn(`PercentageInput.initializeAll(): nenhum elemento encontrado para selector "${selector}"`);
      return [];
    }

    const instances = [];

    inputs.forEach(input => {
      if (!(input instanceof HTMLInputElement)) {
        throw new Error(`PercentageInput.initializeAll(): elemento não é um HTMLInputElement (selector: "${selector}")`);
      }

      // Ler configurações específicas do elemento via data-attributes
      const elementOptions = {
        ...options,
        min: input.dataset.min !== undefined ? parseFloat(input.dataset.min) : options.min,
        max: input.dataset.max !== undefined ? parseFloat(input.dataset.max) : options.max,
        decimals: input.dataset.decimals !== undefined ? parseInt(input.dataset.decimals) : options.decimals
      };

      const instance = new PercentageInput(input, elementOptions);
      instances.push(instance);
    });

    console.log(`✓ PercentageInput.initializeAll(): ${instances.length} instâncias criadas`);

    return instances;
  }
}

// Exportar globalmente
if (typeof window !== 'undefined') {
  window.PercentageInput = PercentageInput;
}

// Exportar para Node.js (se necessário para testes)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PercentageInput;
}
