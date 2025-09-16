// Banco de dados simulado para busca de produtos por código
const productDatabase = {
    "364": "LIP OIL RAIOS DE SOL",
    "412": "LIP OIL GUMMY",
    "414": "BASE MULTI-D",
    "416": "BALM URSINHO QUERIDO",
    "420": "BALM RELOGIO TEEN",
    "439": "SOMBRA BRILHO BRASILEIRO SAMBA",
    "464": "LENÇO DEMAQUILANTE VAI NA BOLSA",
    "491": "PAPEL ANTIOLEOSIDADE PARA O ROSTO",
    "520": "ILUMINADOR LUZ GALACTICA ASTRO",
    "534": "MASCARA CILIOS MARROM",
    "541": "GELEIA CORPORAL ILUMINADORA JELLY GLOW",
    "545": "SOMBRA E ILUMINADOR HOLOGRAFICO",
    "546": "BATOM LIQUIDO RESPEITAVEL PUBLICO",
    "547": "MASCARA DE CILIOS ILUSIONISTA",
    "552": "PALETA MULTIFUNCIONAL ACROBATA",
    "565": "LIP OIL TEEN CADEADO ENCANTADO",
    "573": "KIT GLOSS BFF"
};

// Função para buscar produto por código
function getProductName(code) {
    return productDatabase[code] || "";
}

// Função para adicionar novo produto ao banco (para expansão futura)
function addProduct(code, name) {
    productDatabase[code] = name;
}

// Função para listar todos os produtos (para debug)
function getAllProducts() {
    return productDatabase;
}

// Função para buscar produtos por nome parcial
function searchProductsByName(searchTerm) {
    const results = [];
    const term = searchTerm.toLowerCase();
    
    for (const [code, name] of Object.entries(productDatabase)) {
        if (name.toLowerCase().includes(term)) {
            results.push({ code, name });
        }
    }
    
    return results;
}

// Exportar funções para uso global
window.productDB = {
    getProductName,
    addProduct,
    getAllProducts,
    searchProductsByName
};
