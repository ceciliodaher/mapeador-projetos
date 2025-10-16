/**
 * BalancoEstruturado Component
 *
 * Wrapper/Alias para DREEstruturado component.
 *
 * O Balanço Patrimonial usa a mesma estrutura que DRE:
 * - SEMPRE 4 períodos fixos
 * - Hierarquia de contas
 * - Contas grupo calculadas automaticamente
 * - Mesmas funcionalidades
 *
 * A única diferença é o tipo da demonstração ('BALANCO' vs 'DRE')
 *
 * @author Expertzy
 * @version 1.0.0
 */

class BalancoEstruturado extends DREEstruturado {
    constructor(config) {
        // Força tipo como BALANCO
        super({
            ...config,
            tipo: 'BALANCO'
        });
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = BalancoEstruturado;
}
