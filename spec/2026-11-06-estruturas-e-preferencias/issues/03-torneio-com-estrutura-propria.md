Status: ready-for-agent
Blocked by: 02

# 03: Torneio com estrutura própria

Spec: `spec/2026-11-06-estruturas-e-preferencias/spec.md` (regras 5 e 21 a 29)

**O que construir:** o organizador inicia o torneio escolhendo uma das estruturas dele, e o relógio conta cada nível com a própria duração.

- [ ] As estruturas prontas (Pequeno, Médio, Grande e Turbo) e o campo de duração do nível saem do formulário de torneio.
- [ ] A escolha de estrutura lista as estruturas salvas, na ordem da tela de estruturas, com o link "Gerenciar estruturas" ao lado.
- [ ] Ao escolher uma estrutura, o formulário mostra a prévia dos níveis.
- [ ] Sem nenhuma estrutura salva, o formulário mostra um convite para criar a primeira, e o torneio não começa.
- [ ] O torneio guarda uma cópia dos níveis e conta cada nível com a própria duração, inclusive ao pular, pausar e no refresh.
- [ ] A última configuração lembra a estrutura escolhida; se ela foi excluída, o formulário abre sem estrutura escolhida.
- [ ] A validação do intervalo e da duração do intervalo continua como antes.
- [ ] Um torneio em andamento salvo pela versão anterior abre e segue com os níveis que guardou.
- [ ] Uma última configuração salva pela versão anterior volta preenchida, sem estrutura escolhida.
- [ ] Os testes que dependiam das estruturas prontas ou da duração do nível foram atualizados, sem perder o comportamento que verificam.
- [ ] A tela de estruturas, o formulário de torneio e o menu de configurações foram conferidos em largura de celular, nos temas claro e escuro (vindo do ticket 05, adiado).
- [ ] `npm test` e `npm run build` passam.
