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
7. O canonical, `robots.txt` e `sitemap.xml` usam temporariamente `https://naweb.pages.dev/`; troca para `https://naweb.com/` quando o domínio for comprado.
8. Revê `privacidade.html`: é um modelo e precisa da identificação do responsável, prazos e detalhes legais reais.
9. As sete demos são fictícias: barbearia, restaurante, salão, dentista, Pet Amigo, Café Aroma e Pulse Fit. Substitui imagens, endereço e mapas por conteúdos reais quando existirem.

## Publicar no GitHub Pages

Faz push deste conteúdo para um repositório GitHub e ativa Pages em **Settings > Pages**, escolhendo a branch e a pasta publicadas. Mantém os caminhos relativos para funcionar em subpastas.

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
