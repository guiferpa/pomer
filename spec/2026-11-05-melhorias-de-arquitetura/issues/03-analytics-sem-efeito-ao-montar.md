Status: ready-for-agent
Blocked by: None

# 03: Analytics sem efeito ao montar

Spec: `spec/2026-11-05-melhorias-de-arquitetura/spec.md` (regras 25 a 27; bug 15)

**O que construir:** as visualizações de página deixam de ser infladas. O `index.html` é o único que registra a visualização, e uma função simples envia os eventos do app, sem depender de montar um componente.

- [ ] Montar o app não envia `gtag('config')`.
- [ ] Os eventos `tournament_started`, `tournament_paused`, `tournament_resumed`, `level_skipped` e `tournament_reset` continuam sendo enviados, com os mesmos dados.
- [ ] Só esses 5 eventos continuam definidos, e quem envia usa essa lista única.
- [ ] Sem `gtag` disponível, enviar um evento não gera erro.
- [ ] O envio de cada evento tem teste.
- [ ] T12 passa sem `it.fails`.
- [ ] O README explica que a queda nas visualizações de página a partir da data do deploy é correção de contagem, e a nota antiga sobre a contagem inflada saiu.
