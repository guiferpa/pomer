Status: resolved
Blocked by: 03

# 05: Editar e excluir estruturas

Spec: `spec/2026-11-06-estruturas-e-preferencias/spec.md` (regras 16 e 17)

**O que construir:** o organizador corrige ou remove uma estrutura salva, sem mexer no torneio em andamento.

- [ ] Uma estrutura salva pode ser editada, com a mesma validação e o mesmo rascunho da criação, e passa ao topo da lista ao ser salva.
- [ ] Uma estrutura salva pode ser excluída, com confirmação antes.
- [ ] Editar ou excluir uma estrutura não altera um torneio em andamento.
- [ ] Os comportamentos acima têm testes pelo App.
- [ ] A tela de estruturas, o formulário de torneio e o menu de configurações foram conferidos em largura de celular, nos temas claro e escuro.
- [ ] `npm test` e `npm run build` passam.

## Comments

- 2026-11-06: adiado pelo usuário para depois do torneio de 2026-11-07. A entrega de hoje cobre só os tickets 01, 02 e 03.
- 2026-11-07: o usuário pediu o ticket 05 antes do 04. O bloqueio pelo 04 foi retirado: a edição usa o mesmo rascunho em memória da criação, e passa a sobreviver ao refresh quando o 04 for feito. O ante (spec `2026-11-06-ante`) também vale na edição.
- 2026-11-07: largura de celular (390px) conferida pelo agente com Chromium headless, nos temas claro e escuro: lista com Editar e Excluir, editor da edição, edição salva após refresh, confirmação de exclusão e lista vazia após excluir e dar refresh, sem erros de página.
