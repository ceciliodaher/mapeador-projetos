/**
 * DatePicker.js
 * Componente para seleção de datas com validações e formatação brasileira
 * Utiliza input type="date" nativo do HTML5
 *
 * @version 1.0.0
 * @date 2025-10-16
 */

class DatePicker {
  /**
   * @param {HTMLInputElement} inputElement - Elemento input do DOM
   * @param {Object} options - Configurações opcionais
   * @param {string} options.min - Data mínima (formato: YYYY-MM-DD)
   * @param {string} options.max - Data máxima (formato: YYYY-MM-DD)
   * @param {boolean} options.required - Campo obrigatório (default: false)
   * @param {string} options.displayFormat - Formato de exibição (default: 'DD/MM/YYYY')
   * @param {Function} options.onChange - Callback quando valor mudar (default: null)
   * @param {Function} options.onValidate - Callback quando validar (default: null)
   */
  constructor(inputElement, options = {}) {
    // Validar input element
    if (!inputElement) {
      throw new Error('DatePicker: inputElement é obrigatório');
    }

    if (!(inputElement instanceof HTMLInputElement)) {
      throw new Error('DatePicker: inputElement deve ser um HTMLInputElement');
    }

    this.input = inputElement;

    // Forçar type="date"
    this.input.type = 'date';

    // Configurações
    this.options = {
      min: options.min !== undefined ? options.min : null,
      max: options.max !== undefined ? options.max : null,
      required: options.required === true,
      displayFormat: options.displayFormat !== undefined ? options.displayFormat : 'DD/MM/YYYY',
      onChange: options.onChange !== undefined ? options.onChange : null,
      onValidate: options.onValidate !== undefined ? options.onValidate : null
    };

    // Validar configurações
    if (this.options.min !== null && !this.isValidDateString(this.options.min)) {
      throw new Error('DatePicker: options.min deve estar no formato YYYY-MM-DD');
    }

    if (this.options.max !== null && !this.isValidDateString(this.options.max)) {
      throw new Error('DatePicker: options.max deve estar no formato YYYY-MM-DD');
    }

    if (this.options.min !== null && this.options.max !== null) {
      if (new Date(this.options.min) > new Date(this.options.max)) {
        throw new Error('DatePicker: options.min não pode ser posterior a options.max');
      }
    }

    // Validar callbacks se fornecidos
    if (this.options.onChange !== null && typeof this.options.onChange !== 'function') {
      throw new Error('DatePicker: options.onChange deve ser uma função');
    }

    if (this.options.onValidate !== null && typeof this.options.onValidate !== 'function') {
      throw new Error('DatePicker: options.onValidate deve ser uma função');
    }

    // Inicializar
    this.init();
  }

  /**
   * Inicializa o componente
   */
  init() {
    // Adicionar classe CSS
    this.input.classList.add('date-picker');

    // Aplicar atributos min/max ao input nativo
    if (this.options.min !== null) {
      this.input.min = this.options.min;
    }

    if (this.options.max !== null) {
      this.input.max = this.options.max;
    }

    if (this.options.required) {
      this.input.required = true;
    }

    // Validar valor inicial se existir
    if (this.input.value && this.input.value.trim() !== '') {
      const validation = this.validate(this.input.value);
      if (!validation.isValid) {
        console.warn(`DatePicker: valor inicial "${this.input.value}" é inválido:`, validation.errors);
      }
    }

    // Anexar event listeners
    this.attachEventListeners();

    console.log('✓ DatePicker inicializado:', this.input.id || this.input.name || 'unnamed');
  }

  /**
   * Anexa event listeners ao input
   */
  attachEventListeners() {
    // Ao mudar valor
    this.input.addEventListener('change', (e) => this.handleChange(e));

    // Ao desfocar (validação)
    this.input.addEventListener('blur', (e) => this.handleBlur(e));
  }

  /**
   * Handle change: disparar callback
   * @param {Event} e
   */
  handleChange(e) {
    const value = this.input.value;

    // Callback onChange
    if (this.options.onChange !== null) {
      const dateObject = value ? new Date(value + 'T00:00:00') : null;
      this.options.onChange(dateObject, value);
    }
  }

  /**
   * Handle blur: validação
   * @param {Event} e
   */
  handleBlur(e) {
    const value = this.input.value;

    // Validar
    const validation = this.validate(value);

    // Callback onValidate
    if (this.options.onValidate !== null) {
      const dateObject = value ? new Date(value + 'T00:00:00') : null;
      this.options.onValidate({
        value: dateObject,
        valueString: value,
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
   * Obtém o valor como Date object
   * @returns {Date|null}
   */
  getValue() {
    const value = this.input.value;

    if (!value || value.trim() === '') {
      return null;
    }

    if (!this.isValidDateString(value)) {
      throw new Error(`DatePicker: valor "${value}" não é uma data válida`);
    }

    // Criar Date no timezone local (sem conversão UTC)
    return new Date(value + 'T00:00:00');
  }

  /**
   * Obtém o valor como string (formato YYYY-MM-DD)
   * @returns {string}
   */
  getValueString() {
    return this.input.value;
  }

  /**
   * Obtém o valor formatado (DD/MM/YYYY ou formato customizado)
   * @returns {string}
   */
  getValueFormatted() {
    const date = this.getValue();

    if (!date) {
      return '';
    }

    return this.formatDate(date, this.options.displayFormat);
  }

  /**
   * Define o valor do input
   * @param {Date|string} value - Date object ou string no formato YYYY-MM-DD
   */
  setValue(value) {
    if (value === null || value === undefined) {
      this.input.value = '';
      return;
    }

    let dateString;

    if (value instanceof Date) {
      if (isNaN(value.getTime())) {
        throw new Error('DatePicker.setValue(): Date object inválido');
      }
      dateString = this.dateToString(value);
    } else if (typeof value === 'string') {
      if (!this.isValidDateString(value)) {
        throw new Error(`DatePicker.setValue(): string "${value}" não está no formato YYYY-MM-DD`);
      }
      dateString = value;
    } else {
      throw new Error('DatePicker.setValue(): value deve ser Date ou string (YYYY-MM-DD)');
    }

    this.input.value = dateString;
  }

  /**
   * Valida o valor
   * @param {string} value - Valor em formato YYYY-MM-DD
   * @returns {Object} { isValid: boolean, errors: Array<string> }
   */
  validate(value) {
    const errors = [];

    // Required
    if (this.options.required && (!value || value.trim() === '')) {
      errors.push('Data obrigatória');
      return { isValid: false, errors };
    }

    // Se vazio e não obrigatório, é válido
    if (!value || value.trim() === '') {
      return { isValid: true, errors: [] };
    }

    // Validar formato
    if (!this.isValidDateString(value)) {
      errors.push('Data inválida');
      return { isValid: false, errors };
    }

    const date = new Date(value + 'T00:00:00');

    // Validar min
    if (this.options.min !== null) {
      const minDate = new Date(this.options.min + 'T00:00:00');
      if (date < minDate) {
        errors.push(`Data mínima: ${this.formatDate(minDate, 'DD/MM/YYYY')}`);
      }
    }

    // Validar max
    if (this.options.max !== null) {
      const maxDate = new Date(this.options.max + 'T00:00:00');
      if (date > maxDate) {
        errors.push(`Data máxima: ${this.formatDate(maxDate, 'DD/MM/YYYY')}`);
      }
    }

    const isValid = errors.length === 0;

    return { isValid, errors };
  }

  /**
   * Verifica se string está no formato YYYY-MM-DD válido
   * @param {string} dateString
   * @returns {boolean}
   */
  isValidDateString(dateString) {
    if (typeof dateString !== 'string') {
      return false;
    }

    // Regex: YYYY-MM-DD
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString)) {
      return false;
    }

    // Verificar se é uma data válida
    const date = new Date(dateString + 'T00:00:00');
    return !isNaN(date.getTime());
  }

  /**
   * Converte Date para string YYYY-MM-DD
   * @param {Date} date
   * @returns {string}
   */
  dateToString(date) {
    if (!(date instanceof Date)) {
      throw new Error('DatePicker.dateToString(): date deve ser um Date object');
    }

    if (isNaN(date.getTime())) {
      throw new Error('DatePicker.dateToString(): Date object inválido');
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  /**
   * Formata Date para exibição
   * @param {Date} date
   * @param {string} format - 'DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD', etc
   * @returns {string}
   */
  formatDate(date, format) {
    if (!(date instanceof Date)) {
      throw new Error('DatePicker.formatDate(): date deve ser um Date object');
    }

    if (isNaN(date.getTime())) {
      throw new Error('DatePicker.formatDate(): Date object inválido');
    }

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    switch (format) {
      case 'DD/MM/YYYY':
        return `${day}/${month}/${year}`;
      case 'MM/DD/YYYY':
        return `${month}/${day}/${year}`;
      case 'YYYY-MM-DD':
        return `${year}-${month}-${day}`;
      default:
        // Formato customizado usando replace
        return format
          .replace('DD', day)
          .replace('MM', month)
          .replace('YYYY', year);
    }
  }

  /**
   * Limpa recursos
   */
  destroy() {
    // Remover event listeners
    this.input.removeEventListener('change', this.handleChange);
    this.input.removeEventListener('blur', this.handleBlur);

    // Remover classe CSS
    this.input.classList.remove('date-picker');

    console.log('✓ DatePicker destruído:', this.input.id || this.input.name || 'unnamed');
  }

  /**
   * Método estático para inicializar múltiplos inputs
   * @param {string} selector - Seletor CSS (ex: '.date-picker')
   * @param {Object} options - Configurações padrão
   * @returns {Array<DatePicker>}
   */
  static initializeAll(selector, options = {}) {
    if (typeof selector !== 'string') {
      throw new Error('DatePicker.initializeAll(): selector deve ser uma string');
    }

    const inputs = document.querySelectorAll(selector);

    if (inputs.length === 0) {
      console.warn(`DatePicker.initializeAll(): nenhum elemento encontrado para selector "${selector}"`);
      return [];
    }

    const instances = [];

    inputs.forEach(input => {
      if (!(input instanceof HTMLInputElement)) {
        throw new Error(`DatePicker.initializeAll(): elemento não é um HTMLInputElement (selector: "${selector}")`);
      }

      // Ler configurações específicas do elemento via data-attributes
      const elementOptions = {
        ...options,
        min: input.dataset.min !== undefined ? input.dataset.min : options.min,
        max: input.dataset.max !== undefined ? input.dataset.max : options.max,
        required: input.hasAttribute('required') || options.required,
        displayFormat: input.dataset.displayFormat !== undefined ? input.dataset.displayFormat : options.displayFormat
      };

      const instance = new DatePicker(input, elementOptions);
      instances.push(instance);
    });

    console.log(`✓ DatePicker.initializeAll(): ${instances.length} instâncias criadas`);

    return instances;
  }
}

// Exportar globalmente
if (typeof window !== 'undefined') {
  window.DatePicker = DatePicker;
}

// Exportar para Node.js (se necessário para testes)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DatePicker;
}
