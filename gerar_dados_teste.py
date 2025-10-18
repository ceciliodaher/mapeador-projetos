#!/usr/bin/env python3
"""
Script para gerar dados de teste REAIS do budget.py
Sem GUI - apenas cálculos
"""

import json

# Simular dados de um projeto real
investimento_inicial = 500000

# Fluxos mensais reais (60 meses - 5 anos)
# Ano 1: Ramp-up
fluxos = [
    20000, 25000, 30000, 35000, 40000,  # Meses 1-5
    45000, 45000, 45000, 45000, 45000,  # Meses 6-10
    50000, 50000,                        # Meses 11-12
    # Ano 2: Estabilização
    50000, 50000, 50000, 50000, 50000, 50000,  # Meses 13-18
    50000, 50000, 50000, 50000, 50000, 50000,  # Meses 19-24
    # Ano 3: Pico
    52000, 52000, 52000, 52000, 52000, 52000,  # Meses 25-30
    52000, 52000, 52000, 52000, 52000, 52000,  # Meses 31-36
    # Ano 4: Declínio leve
    48000, 48000, 48000, 48000, 48000, 48000,  # Meses 37-42
    46000, 46000, 46000, 46000, 46000, 46000,  # Meses 43-48
    # Ano 5: Estabilização final
    44000, 44000, 44000, 44000, 44000, 44000,  # Meses 49-54
    42000, 42000, 42000, 42000, 42000, 42000   # Meses 55-60
]

# TMA: 12% ao ano
tma_anual = 12.0

# ==========================================
# CÁLCULO VPL (replicando budget.py)
# ==========================================
def calcular_vpl(investimento, fluxos, tma_anual):
    """Calcula VPL com periodicidade mensal"""
    # Converter TMA anual para mensal
    tma_mensal = (1 + tma_anual / 100) ** (1 / 12) - 1

    vpl = -investimento
    for i, fluxo in enumerate(fluxos, start=1):
        vpl += fluxo / ((1 + tma_mensal) ** i)

    return vpl

# ==========================================
# CÁLCULO TIR (Método da Secante - budget.py linhas 1607-1642)
# ==========================================
def calcular_tir_secante(investimento, fluxos):
    """Calcula TIR usando método da Secante"""
    cash_flows = [-investimento] + fluxos

    def vpl_calc(rate):
        if rate <= -1.0:
            rate = -0.9999
        try:
            return sum(cf / ((1 + rate) ** i) for i, cf in enumerate(cash_flows))
        except (ValueError, OverflowError):
            return float('inf') if rate > 0 else float('-inf')

    # Estimativas iniciais
    taxa0, taxa1 = 0.1, 0.11
    vpl0, vpl1 = vpl_calc(taxa0), vpl_calc(taxa1)

    for _ in range(100):
        if abs(vpl1) < 1e-6:
            break

        if abs(vpl1 - vpl0) < 1e-9:
            return 0.0

        taxa_next = taxa1 - vpl1 * (taxa1 - taxa0) / (vpl1 - vpl0)
        taxa0, taxa1 = taxa1, taxa_next
        vpl0, vpl1 = vpl1, vpl_calc(taxa1)

    # Converter mensal para anual
    return ((1 + taxa1) ** 12 - 1) * 100 if taxa1 > -1 else -100.0

# ==========================================
# CÁLCULO PAYBACK (budget.py linhas 1644-1651)
# ==========================================
def calcular_payback(investimento, fluxos):
    """Calcula payback em meses"""
    acumulado = 0
    for i, fluxo in enumerate(fluxos, start=1):
        acumulado += fluxo
        if acumulado >= investimento:
            return i
    return len(fluxos)

# ==========================================
# EXECUTAR CÁLCULOS
# ==========================================
vpl = calcular_vpl(investimento_inicial, fluxos, tma_anual)
tir = calcular_tir_secante(investimento_inicial, fluxos)
payback = calcular_payback(investimento_inicial, fluxos)

# ==========================================
# RESULTADO
# ==========================================
resultado = {
    "investimentoInicial": investimento_inicial,
    "fluxosCaixa": fluxos,
    "tma": tma_anual,
    "indicadores": {
        "vpl": round(vpl, 2),
        "tir": round(tir, 2),
        "payback": payback
    }
}

# Imprimir JSON
print(json.dumps(resultado, indent=2))

# Imprimir resumo
print("\n" + "="*60)
print("RESUMO DOS CÁLCULOS (Python budget.py)")
print("="*60)
print(f"Investimento Inicial: R$ {investimento_inicial:,.2f}")
print(f"TMA: {tma_anual}% a.a.")
print(f"Períodos: {len(fluxos)} meses")
print(f"\nVPL: R$ {vpl:,.2f}")
print(f"TIR: {tir:.2f}% a.a.")
print(f"Payback: {payback} meses")
print("="*60)
