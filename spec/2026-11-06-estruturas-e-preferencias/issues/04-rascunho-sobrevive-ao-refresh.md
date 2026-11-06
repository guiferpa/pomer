Status: ready-for-agent
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
