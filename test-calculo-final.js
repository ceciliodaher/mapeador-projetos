// Teste final dos cálculos de RH - Valores Anuais
console.log("=== TESTE CALCULO RH ANUAL ===\n");

// Dados do PDF
const contratacoes = [
    { cargo: "Operador de CNC", quantidade: 30, salario: 3500 },
    { cargo: "Técnico de Automação", quantidade: 8, salario: 5200 },
    { cargo: "Engenheiro de Processos", quantidade: 3, salario: 9000 },
    { cargo: "Analista de Qualidade", quantidade: 5, salario: 4000 }
];

let totalContratacoes = 0;
let custoMensalBase = 0;

console.log("DETALHAMENTO POR CARGO:");
contratacoes.forEach((c, index) => {
    const subtotalMensal = c.quantidade * c.salario;
    console.log(`${index + 1}. ${c.cargo}: ${c.quantidade} × R$ ${c.salario.toLocaleString('pt-BR')} = R$ ${subtotalMensal.toLocaleString('pt-BR')}/mês`);
    
    totalContratacoes += c.quantidade;
    custoMensalBase += subtotalMensal;
});

console.log("\n=== RESUMO DOS CÁLCULOS ===");
console.log(`Total de Contratações: ${totalContratacoes} pessoas`);
console.log(`Custo Mensal Base: R$ ${custoMensalBase.toLocaleString('pt-BR')}`);

// Encargos de 85% (típico do mercado brasileiro)
const percentualEncargos = 85;
const custoMensalComEncargos = custoMensalBase * (1 + (percentualEncargos / 100));
const custoAnualTotal = custoMensalComEncargos * 12;

console.log(`Encargos e Benefícios: ${percentualEncargos}%`);
console.log(`Custo Mensal com Encargos: R$ ${custoMensalComEncargos.toLocaleString('pt-BR')}`);
console.log(`CUSTO ANUAL TOTAL: R$ ${custoAnualTotal.toLocaleString('pt-BR')}`);

console.log("\n=== VERIFICAÇÃO ===");
console.log("✅ Total Contratações esperado: 46 →", totalContratacoes === 46 ? "CORRETO" : "ERRO");
console.log("✅ Custo mensal base esperado: R$ 193.600 →", custoMensalBase === 193600 ? "CORRETO" : "ERRO");
console.log("✅ Valor final é anual (>4 milhões) →", custoAnualTotal > 4000000 ? "CORRETO" : "ERRO");

console.log("\n=== CAMPOS DO FORMULÁRIO ===");
console.log(`novasContratacoes: ${totalContratacoes}`);
console.log(`investimentoRH: R$ ${custoAnualTotal.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}`);