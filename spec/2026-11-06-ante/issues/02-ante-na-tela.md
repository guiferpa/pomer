Status: resolved
Blocked by: 01

# 02: Ante na tela

Spec: `spec/2026-11-06-ante/spec.md` (regras 7 a 9)

**O que construir:** jogadores e organizador veem o ante do nível atual, do próximo nível, dos níveis jogados e da prévia, só quando o nível tem ante.

- [ ] A prévia do formulário de torneio mostra o ante dos níveis que têm ante.
- [ ] O relógio mostra o ante do nível atual, e não mostra nada sem ante.
- [ ] O card de próximo nível mostra o ante dele.
- [ ] O histórico guarda e mostra o ante de cada nível jogado.
- [ ] Um refresh mantém o ante na tela; torneios e históricos salvos sem ante abrem normalmente.
- [ ] Os comportamentos acima têm testes pelo App.
- [ ] O editor, a prévia e o relógio com ante foram conferidos em largura de celular, nos temas claro e escuro.
- [ ] `npm test` e `npm run build` passam.

## Comments

- 2026-11-06: largura de celular (390px) conferida pelo agente com Chromium headless, nos temas claro e escuro: grade 2×2 no editor, prévia, relógio, próximo nível e histórico com ante, sem erros de página.
