# 📥 GUIA DE IMPORTAÇÃO JSON

## 🎯 COMO USAR A FUNCIONALIDADE DE IMPORTAÇÃO

### **PASSO 1: PREPARAR O ARQUIVO JSON**

✅ **Arquivo Já Pronto**: Use o arquivo `dados-teste-completo.json` que está na pasta do projeto

### **PASSO 2: ABRIR O SISTEMA**

1. ✅ Abra o arquivo `index.html` no seu browser
2. ✅ O sistema carregará na Seção 1

### **PASSO 3: IMPORTAR OS DADOS**

#### **OPÇÃO A: Via Preview (Recomendado)**
1. 📄 Vá para qualquer seção e clique no botão **"Preview"** (se disponível)
2. 📥 No modal que abrir, clique no botão **"📥 Importar JSON"**
3. 📂 Selecione o arquivo `dados-teste-completo.json`
4. ✅ Confirme a importação quando perguntado

#### **OPÇÃO B: Via Navegador (Se Preview não estiver disponível)**
1. 🔧 Abra o Console do Navegador (F12)
2. 💻 Execute o comando:
```javascript
document.getElementById('importJsonFile').click();
```
3. 📂 Selecione o arquivo `dados-teste-completo.json`
4. ✅ Confirme a importação

### **PASSO 4: VERIFICAR A IMPORTAÇÃO**

Após a importação, você verá:

1. ✅ **Mensagem de sucesso** no canto superior direito
2. 🧭 **Sistema vai para Seção 1** automaticamente
3. 📝 **Todos os campos preenchidos** com os dados do JSON

### **PASSO 5: NAVEGAR E VERIFICAR**

Navegue pelas seções para verificar:

- **Seção 1**: ✅ Dados da empresa completos
- **Seção 2**: ✅ Dados do empreendimento
- **Seção 3**: ✅ Valores de investimento  
- **Seção 4**: ✅ Cronograma
- **Seção 5**: ✅ Itens dinâmicos adicionados (obras civis, máquinas)
- **Seções 6-14**: ✅ Dados específicos de cada seção

### **PASSO 6: TESTAR AS EXPORTAÇÕES**

1. 📄 Vá para a **Seção 14**
2. 👁️ Clique em **"Preview"**  
3. 📊 Teste os 4 botões de exportação:
   - **Excel** → `Projeto_CEI_EMPRESA TESTE MANUAL COMPLETO LTDA_[DATA].xlsx`
   - **PDF** → `Projeto_CEI_EMPRESA TESTE MANUAL COMPLETO LTDA_[DATA].pdf`
   - **JSON** → `Projeto_CEI_EMPRESA TESTE MANUAL COMPLETO LTDA_[DATA].json`
   - **CSV** → `Projeto_CEI_EMPRESA TESTE MANUAL COMPLETO LTDA_[DATA].csv`

---

## 📋 ESTRUTURA DO ARQUIVO JSON

O arquivo `dados-teste-completo.json` contém:

### **📄 Metadados**
```json
{
  "metadata": {
    "sistemaVersao": "14 Seções",
    "dataImportacao": "2025-08-22",
    "empresa": "EMPRESA TESTE MANUAL COMPLETO LTDA"
  }
}
```

### **📝 Dados Estáticos** 
```json
{
  "dados": {
    "razaoSocial": "EMPRESA TESTE MANUAL COMPLETO LTDA",
    "cnpj": "12.345.678/0001-99",
    "valorTotal": "8000000",
    // ... todos os campos das 14 seções
  }
}
```

### **🔧 Dados Dinâmicos**
```json
{
  "dinamicos": {
    "obrasCivis": [
      { "descricao": "Galpão Industrial Principal", "valor": "3000000" },
      { "descricao": "Escritórios Administrativos", "valor": "1200000" }
    ],
    "maquinasEquipamentos": [
      { "descricao": "Linha de Produção Automatizada", "valor": "2800000" },
      { "descricao": "Sistema de Controle de Qualidade", "valor": "800000" }
    ]
  }
}
```

---

## ✅ RESULTADO ESPERADO

### **DADOS IMPORTADOS:**
- ✅ **171+ campos** preenchidos automaticamente
- ✅ **4 itens dinâmicos** adicionados (2 obras civis + 2 máquinas)
- ✅ **Todas as 14 seções** com dados completos
- ✅ **Formatações aplicadas** (CNPJ, valores monetários, telefones)

### **EXPORTAÇÕES FUNCIONAIS:**
- ✅ **Excel**: Planilha completa com todas as seções
- ✅ **PDF**: Documento formatado com 8+ páginas
- ✅ **JSON**: Estrutura completa dos dados  
- ✅ **CSV**: Formato planilha simples

### **ARQUIVOS GERADOS NA PASTA DOWNLOADS:**
```
📁 C:\Users\[SEU_USUARIO]\Downloads\
   📄 Projeto_CEI_EMPRESA TESTE MANUAL COMPLETO LTDA_22-08-2025.xlsx
   📄 Projeto_CEI_EMPRESA TESTE MANUAL COMPLETO LTDA_22-08-2025.pdf
   📄 Projeto_CEI_EMPRESA TESTE MANUAL COMPLETO LTDA_22-08-2025.json
   📄 Projeto_CEI_EMPRESA TESTE MANUAL COMPLETO LTDA_22-08-2025.csv
```

---

## 🔧 SOLUÇÃO DE PROBLEMAS

### **❌ Botão "Importar JSON" não aparece:**
- Vá para Seção 14 e tente forçar Preview visível
- Ou use o Console: `document.getElementById('importJsonFile').click()`

### **❌ Erro "estrutura incorreta":**
- Verifique se está usando o arquivo `dados-teste-completo.json`
- O arquivo deve ter o objeto `dados` na raiz

### **❌ Campos não preenchem:**
- Aguarde alguns segundos após importar
- As formatações são aplicadas com delay

### **❌ Itens dinâmicos não aparecem:**
- Vá para Seção 5 e verifique se os containers foram criados
- Os itens devem aparecer automaticamente

---

## 🚀 TESTE RÁPIDO (5 MINUTOS)

1. **Abrir**: `index.html`
2. **Importar**: Usar arquivo `dados-teste-completo.json`
3. **Navegar**: Verificar seções 1, 5, 8, 14
4. **Exportar**: Testar os 4 formatos
5. **Verificar**: Pasta Downloads com 4 arquivos

**✅ Se todos os passos funcionarem = SISTEMA 100% VALIDADO!**

---

**🎉 Use este guia para testar rapidamente TODAS as funcionalidades do sistema sem digitar nenhum dado manualmente!**