Status: resolved
Blocked by: 02

# 04: Rascunho que sobrevive ao refresh

Spec: `spec/2026-11-06-estruturas-e-preferencias/spec.md` (regras 18 a 20 para o rascunho)

**O que construir:** o organizador não perde uma estrutura em edição por um refresh, e não descarta mudanças sem querer.

- [ ] Existe um único rascunho por vez, e ele sobrevive a um refresh com o que foi digitado.
- [ ] Voltar com mudanças não salvas pede confirmação para descartá-las, usando o modal de confirmação existente.
- [ ] Salvar ou descartar apaga o rascunho.
- [ ] Um rascunho guardado inválido é descartado sem aviso.
- [ ] O módulo de persistência tem testes diretos para o rascunho, e o refresh e a confirmação têm testes pelo App.
- [ ] `npm test` e `npm run build` passam.

## Comments

- 2026-11-06: adiado pelo usuário para depois do torneio de 2026-11-07. A entrega de hoje cobre só os tickets 01, 02 e 03.
- 2026-11-07: feito depois do 05, a pedido do usuário. O rascunho vale para criar e editar. Um rascunho de edição cuja estrutura foi excluída reabre como estrutura nova, mantendo o que foi digitado. Largura de celular (390px) conferida pelo agente com Chromium headless, nos temas claro e escuro: refresh na criação e na edição, confirmação ao voltar, lista após descartar e refresh, sem erros de página.
