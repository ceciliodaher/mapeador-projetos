// Debug do cálculo de investimento RH
console.log("=== DEBUG INVESTIMENTO RH ===");

// Simulando os dados do PDF
const contratacoes = [
    { cargo: "Operador de CNC", quantidade: 30, salario: 3500 },
    { cargo: "Técnico de Automação", quantidade: 8, salario: 5200 },
    { cargo: "Engenheiro de Processos", quantidade: 3, salario: 9000 },
    { cargo: "Analista de Qualidade", quantidade: 5, salario: 4000 }
];

// Cálculo esperado
let totalBase = 0;
let totalContratacoes = 0;

contratacoes.forEach(c => {
    const subtotal = c.quantidade * c.salario;
    console.log(`${c.cargo}: ${c.quantidade} x R$ ${c.salario} = R$ ${subtotal}`);
    totalBase += subtotal;
    totalContratacoes += c.quantidade;
});

console.log("\n=== RESUMO ===");
console.log(`Total de contratações: ${totalContratacoes} (esperado: 46)`);
console.log(`Investimento base: R$ ${totalBase} (esperado: R$ 173.600)`);

// Com 85% de encargos
const encargos = 85;
const totalComEncargos = totalBase * (1 + (encargos / 100));
console.log(`Com ${encargos}% de encargos: R$ ${totalComEncargos.toFixed(2)}`);

// Teste de formatação
console.log("\n=== TESTE DE FORMATAÇÃO ===");
const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
};

console.log(`Formatado: ${formatCurrency(totalBase)}`);
console.log(`Formatado com encargos: ${formatCurrency(totalComEncargos)}`);

// Problema potencial: valor muito pequeno
console.log("\n=== POSSÍVEL PROBLEMA ===");
const valorErrado = 173.60; // Se o sistema está mostrando isto
console.log(`Valor mostrado no PDF: R$ 173,60`);
console.log(`Isso sugere que o valor ${totalBase} está sendo dividido por 1000`);
console.log(`Verificar: ${totalBase} / 1000 = ${totalBase / 1000}`);