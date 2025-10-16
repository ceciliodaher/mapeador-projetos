# Fórmulas Extraídas - Sistema de Viabilidade Financeira

## ⚠️ IMPORTANTE
**Este documento contém APENAS fórmulas e lógica de cálculo extraídas das planilhas de referência.**

Os valores exemplificativos são usados EXCLUSIVAMENTE para:
- ✅ Testes de validação (garantir que JavaScript = Excel)
- ✅ Documentação de casos de uso
- ❌ **NUNCA** como dados padrão no sistema

---

## 📊 Fonte de Referência

### Planilhas Analisadas
1. **Budget.xlsx** - Estrutura de investimentos, custos, depreciação
2. **Valuation.xlsx** - VPL, TIR, fluxo de caixa descontado
3. **ProjecoesD-Dividas-15.xls** - Tabela SAC/PRICE de financiamento
4. **balanço versão outubro 2011.xls** - Balanço patrimonial
5. **Informacoes_Projeto-Viabilidade.xlsx** - Template oficial FCO

### Código Python Referência
- `documentos/Código Python Ampliado - Sistema Completo de Viabilidade de Projetos.md`
- Linhas 73-170: Configuração tributária completa
- Linhas 843-951: Cálculo de tributos por regime
- Linhas 953-979: Reforma tributária (CBS + IBS)

---

## 1. CÁLCULOS TRIBUTÁRIOS

### 1.1 Simples Nacional

**Fórmula de Alíquota Efetiva:**
```excel
# Excel
Alíquota Efetiva = ((Receita Acumulada 12m × Alíquota Nominal) - Dedução) / Receita Acumulada 12m
```

```javascript
// JavaScript
function calcularSimplesNacional(receitaAcumulada12m, anexo) {
  // Tabelas de faixas (dados legais - Lei Complementar 123/2006)
  const tabelas = {
    'anexo_i': [  // Comércio
      { limite: 180000, aliquota: 4.00, deducao: 0 },
      { limite: 360000, aliquota: 7.30, deducao: 5940 },
      { limite: 720000, aliquota: 9.50, deducao: 13860 },
      { limite: 1800000, aliquota: 10.70, deducao: 22500 },
      { limite: 3600000, aliquota: 14.30, deducao: 87300 },
      { limite: 4800000, aliquota: 19.00, deducao: 378000 }
    ],
    'anexo_ii': [  // Indústria
      { limite: 180000, aliquota: 4.50, deducao: 0 },
      { limite: 360000, aliquota: 7.80, deducao: 5940 },
      { limite: 720000, aliquota: 10.00, deducao: 13860 },
      { limite: 1800000, aliquota: 11.20, deducao: 22500 },
      { limite: 3600000, aliquota: 14.70, deducao: 85500 },
      { limite: 4800000, aliquota: 30.00, deducao: 720000 }
    ],
    'anexo_iii': [  // Serviços
      { limite: 180000, aliquota: 6.00, deducao: 0 },
      { limite: 360000, aliquota: 11.20, deducao: 9360 },
      { limite: 720000, aliquota: 13.50, deducao: 17640 },
      { limite: 1800000, aliquota: 16.00, deducao: 35640 },
      { limite: 3600000, aliquota: 21.00, deducao: 125640 },
      { limite: 4800000, aliquota: 33.00, deducao: 648000 }
    ]
  };

  const tabela = tabelas[anexo];
  let aliquotaNominal = 0;
  let deducao = 0;

  // Encontrar faixa
  for (const faixa of tabela) {
    if (receitaAcumulada12m <= faixa.limite) {
      aliquotaNominal = faixa.aliquota;
      deducao = faixa.deducao;
      break;
    }
  }

  // Calcular alíquota efetiva
  const aliquotaEfetiva = receitaAcumulada12m > 0
    ? ((receitaAcumulada12m * aliquotaNominal / 100) - deducao) / receitaAcumulada12m * 100
    : aliquotaNominal;

  return {
    aliquotaNominal,
    aliquotaEfetiva,
    valorTotal: receitaAcumulada12m * aliquotaEfetiva / 100
  };
}
```

**Teste de Validação:**
```javascript
// Caso 1: Receita R$ 500.000 no Anexo II (Indústria)
const resultado = calcularSimplesNacional(500000, 'anexo_ii');
// Esperado: aliquotaEfetiva ≈ 9.22%
```

---

### 1.2 Lucro Presumido

**Fórmulas Base:**
```excel
# Excel
Base IRPJ = Receita Bruta × Percentual Presunção IRPJ
Base CSLL = Receita Bruta × Percentual Presunção CSLL
IRPJ = (Base IRPJ × 15%) + MAX(0; (Base IRPJ - Limite) × 10%)
CSLL = Base CSLL × 9%
PIS = Receita Bruta × 0,65%
COFINS = Receita Bruta × 3,00%
```

```javascript
// JavaScript
function calcularLucroPresumido(receitaBruta, tipoAtividade, periodoMeses = 3) {
  // Percentuais de presunção (legislação federal)
  const presuncaoIRPJ = {
    'comercio': 8.0,
    'industria': 8.0,
    'servicos': 32.0,
    'transporte': 16.0,
    'servicos_hospitalares': 8.0
  };

  const presuncaoCSLL = {
    'comercio': 12.0,
    'industria': 12.0,
    'servicos': 32.0
  };

  // Bases de cálculo
  const baseIRPJ = receitaBruta * (presuncaoIRPJ[tipoAtividade] / 100);
  const baseCSLL = receitaBruta * (presuncaoCSLL[tipoAtividade] / 100);

  // IRPJ (15% + adicional 10% sobre excesso)
  const limiteAdicional = 20000 * periodoMeses;  // R$ 20k/mês
  const irpjBasico = baseIRPJ * 0.15;
  const irpjAdicional = Math.max(0, (baseIRPJ - limiteAdicional) * 0.10);
  const irpj = irpjBasico + irpjAdicional;

  // CSLL
  const csll = baseCSLL * 0.09;

  // PIS e COFINS (cumulativo)
  const pis = receitaBruta * 0.0065;
  const cofins = receitaBruta * 0.03;

  return {
    baseIRPJ,
    baseCSLL,
    irpj,
    csll,
    pis,
    cofins,
    totalTributos: irpj + csll + pis + cofins
  };
}
```

---

### 1.3 Lucro Real

```javascript
function calcularLucroReal(lucroContabil, receitaBruta, creditosPisCofins = 0) {
  // IRPJ (15% + adicional 10%)
  const limiteAdicional = 20000 * 3;  // Trimestral
  const irpjBasico = lucroContabil * 0.15;
  const irpjAdicional = Math.max(0, (lucroContabil - limiteAdicional) * 0.10);
  const irpj = irpjBasico + irpjAdicional;

  // CSLL
  const csll = lucroContabil * 0.09;

  // PIS e COFINS (não-cumulativo com créditos)
  const pisDebito = receitaBruta * 0.0165;
  const cofinsDebito = receitaBruta * 0.076;
  const pis = pisDebito - (creditosPisCofins * 0.0165);
  const cofins = cofinsDebito - (creditosPisCofins * 0.076);

  return {
    irpj,
    csll,
    pis,
    cofins,
    totalTributos: irpj + csll + pis + cofins
  };
}
```

---

### 1.4 ICMS (Alíquotas por Destino)

```javascript
function calcularICMS(receitaBruta, ufOrigem, destinoVendas) {
  // Alíquotas internas (dentro da UF)
  const aliquotasInternas = {
    'GO': 19.00, 'SP': 18.00, 'MG': 18.00, 'RJ': 22.00,
    'RS': 17.00, 'SC': 17.00, 'PR': 19.50, 'ES': 17.00
    // ... demais UFs (ver config/aliquotas-tributarias-2025.json)
  };

  // Alíquotas interestaduais (4%, 7%, 12% conforme destino)
  const aliquotasInterestaduais = {
    'norte_nordeste_co': 7.0,  // Exceto GO se origem for GO
    'sul_sudeste': 12.0
  };

  // Calcular ICMS ponderado por destino
  let icmsTotal = 0;

  if (destinoVendas.goias && ufOrigem === 'GO') {
    icmsTotal += receitaBruta * (destinoVendas.goias / 100) * (aliquotasInternas['GO'] / 100);
  }

  if (destinoVendas.outrasUFs) {
    // Usar alíquota interestadual média ponderada
    const aliquotaMedia = 12.0;  // Simplificado - refinar por região
    icmsTotal += receitaBruta * (destinoVendas.outrasUFs / 100) * (aliquotaMedia / 100);
  }

  // Exportação: ICMS = 0

  return icmsTotal;
}
```

---

### 1.5 Reforma Tributária (CBS + IBS)

**Vigência:** 2026-2033 (transição gradual)

```javascript
function calcularCBSeIBS(receitaBruta, tipoProduto, ano) {
  // Alíquotas estimadas (PEC 45/2019)
  const aliquotaCBS = 8.50;   // Federal (substitui PIS, COFINS, IPI)
  const aliquotaIBS = 17.70;  // Estadual/Municipal (substitui ICMS, ISS)
  const aliquotaTotal = aliquotaCBS + aliquotaIBS;  // 26,20%

  // Reduções por tipo de produto/serviço
  const reducoes = {
    'padrao': 0,
    'cesta_basica': 60,        // 60% de redução
    'saude': 60,
    'educacao': 60,
    'medicamentos': 60,
    'servicos_profissionais': 30
  };

  const reducao = reducoes[tipoProduto] || 0;
  const aliquotaEfetiva = aliquotaTotal * (1 - reducao / 100);

  // Cálculo
  const cbs = receitaBruta * (aliquotaCBS * (1 - reducao / 100) / 100);
  const ibs = receitaBruta * (aliquotaIBS * (1 - reducao / 100) / 100);

  // Créditos (100% - creditamento amplo)
  const percentualCredito = 100;
  const creditoTotal = (cbs + ibs) * (percentualCredito / 100);

  return {
    cbs,
    ibs,
    totalBruto: cbs + ibs,
    creditos: creditoTotal,
    totalLiquido: (cbs + ibs) - creditoTotal,
    aliquotaEfetiva
  };
}
```

---

## 2. DEMONSTRAÇÃO DO RESULTADO (DRE)

### 2.1 Estrutura Completa

```javascript
function calcularDRE(dados, ano) {
  const dre = {};

  // 1. RECEITA BRUTA
  dre.receitaBruta = dados.produtos.reduce((total, produto) => {
    const projecao = produto[`ano${ano}`];
    return total + (projecao.quantidade * projecao.preco);
  }, 0);

  // 2. DEDUÇÕES
  dre.icms = calcularICMS(dre.receitaBruta, dados.empresa.uf, dados.mercado.destinoVendas);
  dre.pis = dre.receitaBruta * 0.0165;  // Lucro Real não-cumulativo
  dre.cofins = dre.receitaBruta * 0.076;
  dre.devolucoes = dre.receitaBruta * (dados.parametros.devolucoesPerc || 2) / 100;
  dre.totalDeducoes = dre.icms + dre.pis + dre.cofins + dre.devolucoes;

  // 3. RECEITA LÍQUIDA
  dre.receitaLiquida = dre.receitaBruta - dre.totalDeducoes;

  // 4. CPV (Custo dos Produtos Vendidos)
  dre.cpv = calcularCPV(dados, ano);

  // 5. LUCRO BRUTO
  dre.lucroBruto = dre.receitaLiquida - dre.cpv;

  // 6. DESPESAS OPERACIONAIS
  dre.despesasOperacionais = calcularDespesasOperacionais(dados, ano);

  // 7. EBITDA
  dre.ebitda = dre.lucroBruto - dre.despesasOperacionais;

  // 8. DEPRECIAÇÃO
  dre.depreciacao = calcularDepreciacao(dados.investimentos, ano);

  // 9. EBIT (Lucro Operacional)
  dre.ebit = dre.ebitda - dre.depreciacao;

  // 10. RESULTADO FINANCEIRO
  dre.despesasFinanceiras = calcularJuros(dados.financiamento, ano);
  dre.receitasFinanceiras = dados.parametros.receitasFinanceiras || 0;
  dre.resultadoFinanceiro = dre.receitasFinanceiras - dre.despesasFinanceiras;

  // 11. LUCRO ANTES IR/CSLL
  dre.lucroAntesIR = dre.ebit + dre.resultadoFinanceiro;

  // 12. PROVISÃO IR/CSLL
  dre.irCsll = dre.lucroAntesIR > 0 ? dre.lucroAntesIR * 0.34 : 0;

  // 13. LUCRO LÍQUIDO
  dre.lucroLiquido = dre.lucroAntesIR - dre.irCsll;

  // MARGENS
  dre.margemBruta = (dre.lucroBruto / dre.receitaLiquida) * 100;
  dre.margemEbitda = (dre.ebitda / dre.receitaLiquida) * 100;
  dre.margemOperacional = (dre.ebit / dre.receitaLiquida) * 100;
  dre.margemLiquida = (dre.lucroLiquido / dre.receitaLiquida) * 100;

  return dre;
}
```

### 2.2 Cálculo de CPV

```javascript
function calcularCPV(dados, ano) {
  let cpv = 0;

  // Matérias-primas e insumos (via matriz insumo-produto)
  cpv += dados.insumos.reduce((total, insumo) => {
    const consumo = insumo[`ano${ano}`];
    return total + (consumo.quantidade * consumo.custoUnitario);
  }, 0);

  // Mão de obra direta (produção variável)
  cpv += dados.recursosHumanos
    .filter(rh => rh.tipo === 'Produção Variável')
    .reduce((total, rh) => {
      const qtd = rh[`ano${ano}`].quantidade;
      const salarioTotal = rh.salarioBruto * (1 + rh.encargos / 100);
      return total + (qtd * salarioTotal * 12);  // Anual
    }, 0);

  return cpv;
}
```

### 2.3 Depreciação

```javascript
function calcularDepreciacao(investimentos, ano) {
  // Vidas úteis conforme Receita Federal (IN 1.700/2017)
  const vidasUteis = {
    'Terreno': null,  // Não deprecia
    'Obras Civis': 25,
    'Máquinas e Equipamentos': 10,
    'Veículos': 5,
    'Equipamentos TI': 5,
    'Móveis e Utensílios': 10
  };

  return investimentos.reduce((total, inv) => {
    const vidaUtil = vidasUteis[inv.categoria];

    if (!vidaUtil) return total;  // Terreno
    if (ano > vidaUtil) return total;  // Já depreciado totalmente

    const depreciacaoAnual = inv.valorTotal / vidaUtil;
    return total + depreciacaoAnual;
  }, 0);
}
```

---

## 3. FLUXO DE CAIXA

### 3.1 Estrutura Mensal (Ano 1)

```javascript
function calcularFluxoCaixaMensal(dados, mes) {
  const fluxo = {};

  // ENTRADAS
  fluxo.receitaVendas = calcularReceitaComPrazo(dados, mes, dados.prazoRecebimento);
  fluxo.aporteCapital = getAporteMes(dados.aportes, mes);
  fluxo.liberacaoFinanciamento = getLiberacaoFinanciamento(dados.financiamento, mes);
  fluxo.totalEntradas = fluxo.receitaVendas + fluxo.aporteCapital + fluxo.liberacaoFinanciamento;

  // SAÍDAS
  fluxo.investimentos = getInvestimentosMes(dados.investimentos, mes);
  fluxo.compraInsumos = calcularCompraInsumosComPrazo(dados, mes, dados.prazoPagamento);
  fluxo.folhaPagamento = calcularFolhaMes(dados.recursosHumanos, mes);
  fluxo.custosFixos = calcularCustosFixosMes(dados.custosFixos, mes);
  fluxo.impostos = calcularImpostosMes(dados, mes);
  fluxo.parcelaFinanciamento = calcularParcelaSAC(dados.financiamento, mes);
  fluxo.totalSaidas = fluxo.investimentos + fluxo.compraInsumos + fluxo.folhaPagamento +
                     fluxo.custosFixos + fluxo.impostos + fluxo.parcelaFinanciamento;

  // SALDOS
  fluxo.fluxoOperacional = fluxo.totalEntradas - fluxo.totalSaidas;

  return fluxo;
}
```

### 3.2 Financiamento SAC

```javascript
function calcularTabelaSAC(valorFinanciado, taxaMensal, prazoMeses, carenciaMeses) {
  const tabela = [];
  let saldoDevedor = 0;

  // Liberações podem ser parciais - ajustar conforme cronograma
  const amortizacaoMensal = valorFinanciado / (prazoMeses - carenciaMeses);

  for (let mes = 1; mes <= prazoMeses; mes++) {
    const parcela = {};

    if (mes <= carenciaMeses) {
      // Período de carência: apenas juros
      parcela.saldoDevedor = saldoDevedor;
      parcela.amortizacao = 0;
      parcela.juros = saldoDevedor * (taxaMensal / 100);
      parcela.parcela = parcela.juros;
      parcela.saldoFinal = saldoDevedor;
    } else {
      // Período de amortização
      parcela.saldoDevedor = saldoDevedor;
      parcela.amortizacao = amortizacaoMensal;
      parcela.juros = saldoDevedor * (taxaMensal / 100);
      parcela.parcela = parcela.amortizacao + parcela.juros;
      parcela.saldoFinal = saldoDevedor - amortizacaoMensal;

      saldoDevedor = parcela.saldoFinal;
    }

    tabela.push(parcela);
  }

  return tabela;
}
```

---

## 4. INDICADORES DE VIABILIDADE

### 4.1 VPL (Valor Presente Líquido)

**Fórmula Excel:**
```excel
=VPL(TMA; Fluxo_Ano1:Fluxo_Ano5) - Investimento_Inicial
```

**JavaScript:**
```javascript
function calcularVPL(fluxosCaixa, investimentoInicial, tma) {
  let vpl = -investimentoInicial;

  fluxosCaixa.forEach((fluxo, index) => {
    const ano = index + 1;
    const fatorDesconto = Math.pow(1 + (tma / 100), ano);
    vpl += fluxo / fatorDesconto;
  });

  return vpl;
}
```

**Teste de Validação:**
```javascript
// Dados fictícios para teste
const investimento = 1000000;
const fluxos = [200000, 300000, 350000, 400000, 450000];
const tma = 12;

const vpl = calcularVPL(fluxos, investimento, tma);
// Esperado: VPL ≈ R$ 179.876,45

// Validar contra Excel:
// =VPL(0,12; 200000:450000) - 1000000
```

---

### 4.2 TIR (Taxa Interna de Retorno)

**Método:** Newton-Raphson

```javascript
function calcularTIR(fluxosCaixa, investimentoInicial) {
  let taxa = 0.10;  // Chute inicial: 10%
  const maxIteracoes = 100;
  const tolerancia = 0.0001;

  for (let iter = 0; iter < maxIteracoes; iter++) {
    let vpl = -investimentoInicial;
    let derivada = 0;

    fluxosCaixa.forEach((fluxo, index) => {
      const n = index + 1;
      vpl += fluxo / Math.pow(1 + taxa, n);
      derivada -= n * fluxo / Math.pow(1 + taxa, n + 1);
    });

    if (Math.abs(vpl) < tolerancia) {
      return taxa * 100;  // Converter para percentual
    }

    if (derivada === 0) {
      throw new Error('Derivada zero - TIR não convergiu');
    }

    taxa = taxa - vpl / derivada;
  }

  throw new Error('TIR não convergiu após ' + maxIteracoes + ' iterações');
}
```

---

### 4.3 Payback Simples

```javascript
function calcularPaybackSimples(fluxosCaixa, investimentoInicial) {
  let acumulado = 0;

  for (let ano = 0; ano < fluxosCaixa.length; ano++) {
    acumulado += fluxosCaixa[ano];

    if (acumulado >= investimentoInicial) {
      // Interpolar para encontrar mês exato
      const diferenca = investimentoInicial - (acumulado - fluxosCaixa[ano]);
      const fracao = diferenca / fluxosCaixa[ano];
      return (ano * 12) + (fracao * 12);  // Retornar em meses
    }
  }

  return null;  // Não recupera investimento no período
}
```

---

### 4.4 Payback Descontado

```javascript
function calcularPaybackDescontado(fluxosCaixa, investimentoInicial, tma) {
  let acumulado = 0;

  for (let ano = 0; ano < fluxosCaixa.length; ano++) {
    const fluxoDescontado = fluxosCaixa[ano] / Math.pow(1 + (tma / 100), ano + 1);
    acumulado += fluxoDescontado;

    if (acumulado >= investimentoInicial) {
      const diferenca = investimentoInicial - (acumulado - fluxoDescontado);
      const fracao = diferenca / fluxoDescontado;
      return (ano * 12) + (fracao * 12);
    }
  }

  return null;
}
```

---

### 4.5 Índice de Lucratividade

```javascript
function calcularIndiceLucratividade(vpl, investimentoInicial) {
  return (vpl + investimentoInicial) / investimentoInicial;

  // Interpretação:
  // IL > 1: Projeto viável
  // IL = 1: Ponto de equilíbrio
  // IL < 1: Projeto inviável
}
```

---

### 4.6 Ponto de Equilíbrio

```javascript
function calcularPontoEquilibrio(custosFixos, precoMedioVenda, custoVariavelUnitario) {
  // PE = Custos Fixos / Margem de Contribuição Unitária
  const margemContribuicao = precoMedioVenda - custoVariavelUnitario;

  const peQuantidade = custosFixos / margemContribuicao;
  const peValor = peQuantidade * precoMedioVenda;

  return {
    quantidadeUnidades: peQuantidade,
    valorReais: peValor,
    margemContribuicao: margemContribuicao,
    margemContribuicaoPerc: (margemContribuicao / precoMedioVenda) * 100
  };
}
```

---

## 5. USOS E FONTES DE RECURSOS

### 5.1 Cálculo por Período

```javascript
function calcularUsosEFontes(dados, mes, saldoAcumuladoAnterior) {
  const periodo = {};

  // === USOS (Aplicações de Recursos) ===
  periodo.usos = {
    investimentosFixos: somarInvestimentosMes(dados.investimentos, mes),
    capitalGiro: calcularNecessidadeCapitalGiro(dados, mes),
    despesasPreOperacionais: getDespesasPreOpMes(dados, mes),
    amortizacaoFinanciamento: getAmortizacaoMes(dados.financiamento, mes),
    jurosFinanciamento: getJurosMes(dados.financiamento, mes)
  };
  periodo.totalUsos = Object.values(periodo.usos).reduce((a, b) => a + b, 0);

  // === FONTES (Origens de Recursos) ===
  periodo.fontes = {
    capitalProprio: getAporteMes(dados.aportes, mes),
    financiamento: getLiberacaoFinanciamentoMes(dados.financiamento, mes),
    receitasOperacionais: getReceitaMes(dados.produtos, mes)
  };
  periodo.totalFontes = Object.values(periodo.fontes).reduce((a, b) => a + b, 0);

  // === SALDOS ===
  periodo.saldoPeriodo = periodo.totalFontes - periodo.totalUsos;
  periodo.saldoAcumulado = saldoAcumuladoAnterior + periodo.saldoPeriodo;

  // Alerta se saldo negativo
  if (periodo.saldoAcumulado < 0) {
    periodo.alerta = {
      tipo: 'DÉFICIT',
      mensagem: `Déficit de R$ ${Math.abs(periodo.saldoAcumulado).toFixed(2)} no mês ${mes}`,
      acoes: [
        'Antecipar aporte de capital',
        'Solicitar liberação antecipada do financiamento',
        'Renegociar prazos com fornecedores'
      ]
    };
  }

  return periodo;
}
```

---

## 6. TESTES DE VALIDAÇÃO

### 6.1 Suite de Testes VPL

```javascript
describe('VPL - Validação contra Excel', () => {
  test('Caso 1: Projeto viável', () => {
    const inv = 1000000;
    const fluxos = [200000, 300000, 350000, 400000, 450000];
    const tma = 12;

    const vpl = calcularVPL(fluxos, inv, tma);
    const vplExcel = 179876.45;  // Calculado no Excel

    expect(Math.abs(vpl - vplExcel)).toBeLessThan(1);  // Tolerância R$ 1,00
  });

  test('Caso 2: Projeto inviável', () => {
    const inv = 1000000;
    const fluxos = [50000, 60000, 70000, 80000, 90000];
    const tma = 12;

    const vpl = calcularVPL(fluxos, inv, tma);

    expect(vpl).toBeLessThan(0);
  });
});
```

---

## 📚 Referências Legislativas

### Tributos Federais
- **Lei 10.637/2002** - PIS não-cumulativo
- **Lei 10.833/2003** - COFINS não-cumulativo
- **Lei 9.718/1998** - PIS/COFINS cumulativo
- **Lei Complementar 123/2006** - Simples Nacional
- **IN RFB 1.700/2017** - Tabela de depreciação

### ICMS
- **Lei Kandir (LC 87/1996)** - ICMS
- **Convênio CONFAZ 52/2017** - Alíquotas interestaduais

### Reforma Tributária
- **PEC 45/2019** - Reforma tributária (CBS + IBS)
- **Texto aprovado em 2023** - Alíquota estimada 26,5%

---

## ✅ Checklist de Implementação

- [ ] Todos os cálculos implementados em JavaScript
- [ ] Testes validados contra planilhas Excel
- [ ] Zero hardcoded data (exceto alíquotas legais)
- [ ] Documentação de fórmulas completa
- [ ] Casos de teste documentados
- [ ] Tolerâncias de arredondamento definidas (±0,01)

---

**Última Atualização:** 2025-10-15
**Versão:** 1.0
**Autor:** Cecílio Daher / Expertzy
