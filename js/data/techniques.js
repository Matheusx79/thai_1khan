/**
 * Banco de dados oficial de técnicas de Muay Thai - 1º Khan (Branco)
 * Baseado no documento da Confederação Brasileira de Artes Marciais e Cultura Tailandesa (CBAMCT)
 */
(() => {
const techniquesData = {
  categories: {
    mahd: {
      id: "mahd",
      title: "Técnicas de Punho (MAHD)",
      icon: "🥊",
      description: "Ataques e técnicas utilizando os punhos.",
      image: "assets/images/punch.jpg"
    },
    tee: {
      id: "tee",
      title: "Técnicas de Chutes (TEE)",
      icon: "🦵",
      description: "Chutes circulares e traumáticos de média e longa distância.",
      image: "assets/images/kick.jpg"
    },
    tip: {
      id: "tip",
      title: "Técnicas de Tip",
      icon: "👣",
      description: "Chutes frontais usados principalmente para empurrar, afastar ou parar o oponente.",
      image: "assets/images/teep.jpg"
    },
    khao: {
      id: "khao",
      title: "Técnicas de Joelho (KHAO)",
      icon: "📐",
      description: "Ataques potentes utilizando os joelhos, comuns no combate corpo a corpo.",
      image: "assets/images/knee.jpg"
    },
    sok: {
      id: "sok",
      title: "Técnicas de Cotovelo (SOK)",
      icon: "💪",
      description: "Golpes curtos e altamente cortantes usando as articulações dos cotovelos.",
      image: "assets/images/elbow.jpg"
    },
    contagem: {
      id: "contagem",
      title: "Contagem em Thai (1 a 10)",
      icon: "🔢",
      description: "Os números básicos em tailandês de 1 a 10.",
      image: "assets/images/numbers.jpg"
    },
    boran: {
      id: "boran",
      title: "Muay Boran - CHERNG SOK",
      icon: "🛡️",
      description: "Técnicas tradicionais e antigas utilizando cotovelos.",
      image: "assets/images/boran.jpg"
    }
  },
  items: [
    // Punho - MAHD
    { id: "m1", category: "mahd", thName: "Mahd Trong Sai", thScript: "หมัดตรงซ้าย", ptName: "Jab", notes: "Mão da frente" },
    { id: "m2", category: "mahd", thName: "Mahd Trong Gua", thScript: "หมัดตรงขวา", ptName: "Direto", notes: "Mão de trás" },
    { id: "m3", category: "mahd", thName: "Mahd Trong Ni Son", thScript: "หมัดตรงสอง", ptName: "Jab direto", notes: "Combinação rápida" },
    { id: "m4", category: "mahd", thName: "Mahd Wieng Gua", thScript: "หมัดเหวี่ยงขวา", ptName: "Cruzado", notes: "" },
    { id: "m5", category: "mahd", thName: "Mahd Nghat Gua", thScript: "หมัดงัดขวา", ptName: "Apper (Uppercut)", notes: "" },
    { id: "m6", category: "mahd", thName: "Mahd Wieng Chay Kong Gua", thScript: "หมัดเหวี่ยงชายโครงขวา", ptName: "Hook (Gancho na linha de cintura)", notes: "" },

    // Chutes - TEE
    { id: "t1", category: "tee", thName: "Tee Wieng Lang Gua", thScript: "เตะเหวี่ยงหลังขวา", ptName: "Chute na coxa", notes: "Low kick" },
    { id: "t2", category: "tee", thName: "Tee Chiang Gua", thScript: "เตะเฉียงขวา", ptName: "Chute na costela", notes: "Middle kick" },
    { id: "t3", category: "tee", thName: "Tee Suu Gua", thScript: "เตะสูงขวา", ptName: "Chute na cabeça", notes: "High kick" },

    // Tip
    { id: "tp1", category: "tip", thName: "Tip Trong Sai", thScript: "ถีบตรงซ้าย", ptName: "Chute frontal", notes: "Com a perna da frente" },
    { id: "tp2", category: "tip", thName: "Tip Bom Gua", thScript: "ถีบก้มขวา", ptName: "Chute frontal no queixo", notes: "Chute reto ascendente" },
    { id: "tp3", category: "tip", thName: "Tip Khab Lang Gua", thScript: "ถีบกลับหลังขวา", ptName: "Chute giratório", notes: "Chute frontal giratório de calcanhar" },

    // Joelho - KHAO
    { id: "k1", category: "khao", thName: "Khao Trong Gua", thScript: "เข่าตรงขวา", ptName: "Joelho reto", notes: "" },
    { id: "k2", category: "khao", thName: "Khao Chiang Gua", thScript: "เข่าเฉียงขวา", ptName: "Joelho semirreto", notes: "Diagonal" },
    { id: "k3", category: "khao", thName: "Khao Tad Gua", thScript: "เข่าตัดขวา", ptName: "Joelho 90 graus", notes: "Joelhada horizontal/lateral" },
    { id: "k4", category: "khao", thName: "Khao Tii Gua", thScript: "เข่าตีขวา", ptName: "Joelho de fora para dentro", notes: "Joelhada circular" },
    { id: "k5", category: "khao", thName: "Khao La Gua", thScript: "เข่าลาขวา", ptName: "Joelho com canela", notes: "" },
    { id: "k6", category: "khao", thName: "Khao Bom Lang Gua", thScript: "เข่าก้มหลังขวา", ptName: "Joelho no queixo", notes: "Joelhada voadora ou ascendente alta" },

    // Cotovelo - SOK
    { id: "s1", category: "sok", thName: "Sok Tii Sai", thScript: "ศอกตีซ้าย", ptName: "Cotovelo cima para baixo lateral", notes: "" },
    { id: "s2", category: "sok", thName: "Sok Tad Gua", thScript: "ศอกตัดขวา", ptName: "Cotovelo 90 graus", notes: "Cotovelada horizontal" },
    { id: "s3", category: "sok", thName: "Sok Nghat Gua", thScript: "ศอกงัดขวา", ptName: "Cotovelo baixo para cima", notes: "Cotovelada ascendente" },
    { id: "s4", category: "sok", thName: "Sok Sap Gua - Avançar", thScript: "ศอกสับขวา", ptName: "Cotovelo reto cima para baixo", notes: "Cotovelada descendente avançando" },
    { id: "s5", category: "sok", thName: "Sok Dan Lang Gua", thScript: "ศอกด้านหลังขวา", ptName: "Cotovelos para trás", notes: "Golpe de cotovelo para trás" },
    { id: "s6", category: "sok", thName: "Sok Kuu - Avançar", thScript: "ศอกคู่", ptName: "Dois cotovelos juntos frente", notes: "Cotovelada dupla descendente" },

    // Contagem em Thai
    { id: "c1", category: "contagem", thName: "Nueng", thScript: "หนึ่ง", ptName: "1", notes: "" },
    { id: "c2", category: "contagem", thName: "Song", thScript: "สอง", ptName: "2", notes: "" },
    { id: "c3", category: "contagem", thName: "Sam", thScript: "สาม", ptName: "3", notes: "" },
    { id: "c4", category: "contagem", thName: "Sii", thScript: "สี่", ptName: "4", notes: "" },
    { id: "c5", category: "contagem", thName: "Haa", thScript: "ห้า", ptName: "5", notes: "" },
    { id: "c6", category: "contagem", thName: "Hok", thScript: "หก", ptName: "6", notes: "" },
    { id: "c7", category: "contagem", thName: "Jed", thScript: "เจ็ด", ptName: "7", notes: "" },
    { id: "c8", category: "contagem", thName: "Paet", thScript: "แปด", ptName: "8", notes: "" },
    { id: "c9", category: "contagem", thName: "Kao", thScript: "เก้า", ptName: "9", notes: "" },
    { id: "c10", category: "contagem", thName: "Sip", thScript: "สิบ", ptName: "10", notes: "" },

    // Muay Boran - CHERNG SOK
    { id: "b1", category: "boran", thName: "Poong Hok", thScript: "พุ่งหอก", ptName: "Técnica de Cherng Sok 1", notes: "" },
    { id: "b2", category: "boran", thName: "Sok Fan Hah", thScript: "ศอกฝันหน้า", ptName: "Técnica de Cherng Sok 2", notes: "" },
    { id: "b3", category: "boran", thName: "Pra Yai Kae", thScript: "พระยายกแก้ว", ptName: "Técnica de Cherng Sok 3", notes: "" },
    { id: "b4", category: "boran", thName: "Ngae Look Kang", thScript: "แงะลูกค่าง", ptName: "Técnica de Cherng Sok 4", notes: "" },
    { id: "b5", category: "boran", thName: "Thang Pa", thScript: "ถางป่า", ptName: "Técnica de Cherng Sok 5", notes: "" }
  ]
};

// Expose to window object for global access without ES6 modules
window.techniquesData = techniquesData;
})();

