export const defaults = {
  configuracoes: {
    mensagensHero: ["O teu negócio merece estar online.", "Queres atrair mais clientes?", "Marcações 24h, sem atender chamadas.", "Site, alojamento e manutenção — tudo incluído.", "Rápido, simples e sem dores de cabeça."],
    mensagensBarra: ["Planos desde 19,99€/mês — alojamento incluído", "Queres marcações online no teu negócio?", "Fala connosco no WhatsApp", "Pede já o teu orçamento"],
    intervaloMs: 3000,
    whatsapp: "351931893274", email: "nawebadmin@gmail.com", telefone: "+351 931 893 274", instagram: "", facebook: ""
  },
  planos: [
    { id: "start", nome: "Start", preco: 19.99, precoCriacao: 149.99, periodo: "mês", descricao: "Para começar com uma presença clara e profissional.", funcionalidades: ["Site simples (uma página)", "Alojamento incluído", "1 alteração por mês"], destaque: false, alteracoesPorMes: 1, ordem: 1, ativo: true },
    { id: "business", nome: "Business", preco: 29.99, precoCriacao: 299.99, periodo: "mês", descricao: "Tudo o que um negócio local precisa para crescer online.", funcionalidades: ["Site completo", "Alojamento incluído", "Botão de WhatsApp", "Galeria de fotos", "Google Maps", "2 alterações por mês"], destaque: true, alteracoesPorMes: 2, ordem: 2, ativo: true },
    { id: "pro", nome: "Pro", preco: 49.99, precoCriacao: 499.99, periodo: "mês", descricao: "Uma experiência mais completa, com marcações online.", funcionalidades: ["Tudo do Business", "Sistema de marcações", "Área administrativa", "3 alterações por mês", "Estatísticas básicas"], destaque: false, alteracoesPorMes: 3, ordem: 3, ativo: true }
  ],
  exemplos: [
    { id: "barbearia", titulo: "Barbearia urbana", categoria: "barbearia", descricao: "Uma presença forte para serviços com marcação.", demoUrl: "demo-barbearia.html", imagem: "https://images.unsplash.com/photo-1672642150228-3fcd5826ec26?auto=format&fit=crop&w=800&q=80", imagemUrl: "", tags: ["Marcações", "WhatsApp"], ordem: 1, ativo: true },
    { id: "restaurante", titulo: "Restaurante de bairro", categoria: "restaurante", descricao: "Menu, horário e reservas num só lugar.", demoUrl: "demo-restaurante.html", imagem: "https://images.unsplash.com/photo-1741265805852-32186a6d0dd3?auto=format&fit=crop&w=800&q=80", imagemUrl: "", tags: ["Menu", "Reservas"], ordem: 2, ativo: true },
    { id: "salao", titulo: "Salão de beleza", categoria: "salao", descricao: "Tratamentos e agenda apresentados com leveza.", demoUrl: "demo-salao.html", imagem: "https://images.unsplash.com/photo-1633681117690-262b94a01378?auto=format&fit=crop&w=800&q=80", imagemUrl: "", tags: ["Serviços", "Agenda"], ordem: 3, ativo: true },
    { id: "dentista", titulo: "Clínica dentária", categoria: "dentista", descricao: "Cuidados de saúde oral e marcações simples.", demoUrl: "demo-dentista.html", imagem: "https://images.unsplash.com/photo-1606811971618-4486d14f3f99?auto=format&fit=crop&w=800&q=80", imagemUrl: "", tags: ["Saúde", "Marcações"], ordem: 4, ativo: true },
    { id: "pet", titulo: "Pet shop", categoria: "pet", descricao: "Produtos e serviços para animais de companhia.", demoUrl: "demo-pet.html", imagem: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=800&q=80", imagemUrl: "", tags: ["Loja", "Animais"], ordem: 5, ativo: true },
    { id: "cafe", titulo: "Café de bairro", categoria: "cafe", descricao: "Menu, encomendas e sabores do dia.", demoUrl: "demo-cafe.html", imagem: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=800&q=80", imagemUrl: "", tags: ["Menu", "Encomendas"], ordem: 6, ativo: true },
    { id: "ginasio", titulo: "Ginásio", categoria: "ginasio", descricao: "Planos, aulas e treinadores num só lugar.", demoUrl: "demo-ginasio.html", imagem: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80", imagemUrl: "", tags: ["Aulas", "Treino"], ordem: 7, ativo: true }
  ],
  faq: [
    { pergunta: "Preciso de ter um domínio?", resposta: "Podes usar um domínio que já tenhas ou escolher um novo. TODO: confirmar o processo e custos do domínio.", ordem: 1, ativo: true },
    { pergunta: "O alojamento está incluído?", resposta: "Sim, os planos apresentados incluem alojamento. TODO: indicar limites e fornecedor.", ordem: 2, ativo: true },
    { pergunta: "Quanto tempo demora?", resposta: "O prazo depende do tipo de site e do conteúdo disponível. Depois da conversa inicial, é apresentada uma previsão clara.", ordem: 3, ativo: true },
    { pergunta: "Posso pedir alterações depois da entrega?", resposta: "Sim. Cada plano inclui um número mensal de alterações, indicado na página de preços.", ordem: 4, ativo: true },
    { pergunta: "Como funciona a mensagem mensal?", resposta: "Envia as alterações num pedido simples e tratamos delas dentro do plano. TODO: definir prazo de resposta.", ordem: 5, ativo: true },
    { pergunta: "Como posso cancelar?", resposta: "TODO: indicar condições e aviso prévio de cancelamento.", ordem: 6, ativo: true }
  ]
};
