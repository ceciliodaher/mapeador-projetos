// Verificando o cálculo correto
console.log("=== CÁLCULO DETALHADO ===");

// Operador de CNC: 30 x 3.500 = 105.000
console.log("Operador de CNC: 30 x 3.500 = ", 30 * 3500);

// Técnico de Automação: 8 x 5.200 = 41.600
console.log("Técnico de Automação: 8 x 5.200 = ", 8 * 5200);

// Engenheiro de Processos: 3 x 9.000 = 27.000
console.log("Engenheiro de Processos: 3 x 9.000 = ", 3 * 9000);

// Analista de Qualidade: 5 x 4.000 = 20.000
console.log("Analista de Qualidade: 5 x 4.000 = ", 5 * 4000);

const total = 105000 + 41600 + 27000 + 20000;
console.log("\nTOTAL: ", total);

// Checando se 173.600 pode vir de alguma combinação diferente
console.log("\n=== TENTANDO CHEGAR EM 173.600 ===");

// Talvez sejam apenas as 3 primeiras?
const total3 = 105000 + 41600 + 27000;
console.log("Primeiras 3 contratações: ", total3);

// Ou talvez haja um erro de digitação no PDF?
console.log("\nO valor correto deveria ser R$ 193.600,00");
console.log("Mas está aparecendo como R$ 173,60 (faltando 3 zeros)");