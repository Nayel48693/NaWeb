# NaWeb

Website da NaWeb, um serviço online de criação de websites para pequenos negócios. A implementação usa HTML5, CSS3 e JavaScript ES modules, sem npm ou build. O Firebase é carregado pela CDN oficial, mantendo o projeto compatível com GitHub Pages.

## Correr localmente

Como são usados ES modules e imports CDN, abre o projeto através de um servidor local, por exemplo a extensão **Live Server** do VS Code. Não abras diretamente em `file://`.

## Configuração manual

1. O projeto Firebase `nayweb-dd8f1` já está ligado em `js/firebase.js` através do `firebaseConfig` existente.
2. No Firebase Console, ativa Firestore e Authentication com email/password e configura as regras de segurança antes de publicar.
3. Copia o conteúdo de `firestore.rules` para o separador **Firestore Database > Rules** e publica as regras.
4. Edita os contactos em `js/config.js` quando tiveres os dados definitivos e substitui `COLOCAR_ID_AQUI` em `FORMSPREE_ENDPOINT` pelo ID real do formulário Formspree. Os pedidos são enviados por email através do Formspree e também guardados no Firestore quando este está configurado.
5. Cria o primeiro utilizador no Firebase Authentication e depois cria manualmente `admins/{UID}` no Firestore, com o campo `email`.
6. Entra em `admin.html` e usa **Carregar dados iniciais** para preencher planos, exemplos, FAQ e `configuracoes/site`.
7. O domínio público é `https://nawebs.com/`; confirma que canonical, `robots.txt` e `sitemap.xml` correspondem ao domínio publicado.
8. Revê `privacidade.html`: é um modelo e precisa da identificação do responsável, prazos e detalhes legais reais.
9. As sete demos são fictícias: barbearia, restaurante, salão, dentista, Pet Amigo, Café Aroma e Pulse Fit. Substitui imagens, endereço e mapas por conteúdos reais quando existirem.

## Publicar no GitHub Pages

Faz push deste conteúdo para um repositório GitHub e ativa Pages em **Settings > Pages**, escolhendo a branch e a pasta publicadas. Mantém os caminhos relativos para funcionar em subpastas.

## Chatbot

O chatbot usa uma arquitetura híbrida: as respostas por palavras-chave no browser são a primeira camada; quando nenhuma regra corresponde, a interface chama a Pages Function `functions/api/chat.js`, que envia o contexto atual do site e as últimas mensagens para o Workers AI. O histórico existe apenas em memória durante a visita e a NaWeb não guarda as conversas. Não há chave de API no código: a ligação é feita através do binding `AI` da Cloudflare.

O Workers AI tem um limite gratuito de **10 000 neurons por dia**, sujeito aos limites e condições atuais da Cloudflare. Para ligar o binding, abre **Cloudflare Dashboard > Workers & Pages > naweb > Settings > Bindings > Add > Workers AI**, define o nome da variável como `AI`, guarda e faz um novo deploy.

Para testar localmente as Pages Functions, usa `npx wrangler pages dev . --ai AI` (com o binding Workers AI disponível na conta). O Live Server não executa Pages Functions; nesse caso, as respostas por regras continuam disponíveis, mas não a camada de IA.

## Checklist de testes

- [ ] Rotador do hero e da barra, incluindo pausa e `prefers-reduced-motion`.
- [ ] Filtros de exemplos sem recarregar a página, incluindo as sete categorias.
- [ ] Escolha de plano a pré-selecionar o formulário.
- [ ] Submissão do pedido: confirmação de receção no Formspree e gravação no Firestore; testar também cada serviço indisponível isoladamente.
- [ ] Login no admin e verificação de permissões.
- [ ] Alteração de estado e nota interna de um pedido.
- [ ] Edição de planos e carregamento dos dados iniciais.
- [ ] As sete demos em mobile, com imagens ou fallback ilustrado.
- [ ] Em cada demo, abrir notificações e promoções, fechar com clique fora, Escape e novo clique; marcar notificações como lidas e testar o toast de promoção.
- [ ] Demos Pet Amigo: filtros, detalhes, adicionar ao carrinho, quantidades, remoção e simulação de levantamento.
- [ ] Demos Café Aroma e Pulse Fit: filtros de menu/horários e submissão dos formulários simulados.
- [ ] Demo Clínica Sorriso Claro: FAQ, serviços e pedido de marcação simulado.
- [ ] Links de contacto, cookies essenciais e barra inferior.
- [ ] Chatbot: testar respostas por regras, respostas de IA, fallback sem binding/com erro e limites de mensagens; confirmar que o histórico não persiste e que as mensagens são enviadas apenas à Pages Function.
- [ ] Chatbot: abrir/fechar com botão e Escape, foco acessível, respostas rápidas, ações WhatsApp/orçamento/exemplos/preços e indicador de escrita.
- [ ] Chatbot: arrastar com rato e toque, mover com setas e guardar/restaurar a posição; testar resize, orientação, limites do ecrã, desktop/mobile e `prefers-reduced-motion`.
