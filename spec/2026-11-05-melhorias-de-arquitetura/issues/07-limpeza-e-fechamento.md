Status: resolved
Blocked by: 01, 02, 03, 04, 05, 06

# 07: Limpeza e fechamento

Spec: `spec/2026-11-05-melhorias-de-arquitetura/spec.md` (regras 28 a 30)

**O que construir:** o mantenedor lê só o que o app usa, as chaves de tradução são verificadas pelo TypeScript e os itens ainda sem verificação ficam registrados. O comportamento não muda.

- [ ] Saem os casts `as any` das chaves de tradução, e uma chave inexistente faz o build falhar.
- [ ] Saem `getBreakInfo`, `BreakInfo`, `defaultConfig`, o tipo `WakeLock` sem uso, e os ícones e textos sem uso.
- [ ] Saem as props `isRunning` e `history` do `Countdown`.
- [ ] Sai o argumento ignorado de `playSound`, e `darkenColor` fica em um só lugar.
- [ ] Nenhum teste fica marcado com `it.fails`, e o comentário no início da suíte reflete isso.
- [ ] A lista de bugs passa a `concluida`.
- [ ] O som no iPhone e o fallback do wake lock estão em "Lacunas conhecidas" no `AGENTS.md`.
- [ ] `npm test` e `npm run build` passam.
