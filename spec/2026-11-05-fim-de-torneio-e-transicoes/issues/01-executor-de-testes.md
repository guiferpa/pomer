Status: resolved
Blocked by: None

# 01: Executor de testes nos PRs e no deploy

Spec: `spec/2026-11-05-fim-de-torneio-e-transicoes/spec.md`

**O que construir:** o mantenedor passa a ter testes rodando em cada PR e bloqueando a publicação. `npm test` roda toda a suíte com Vitest, Testing Library e jsdom. A suíte `bugs.test.tsx` passa a fazer parte do projeto.

**Antes de começar:** o PR #1 (React 19 e HeroUI v3) precisa estar mesclado, para o trabalho partir do `main` atualizado.

**Falhas esperadas:** todo teste ainda vermelho entra com `it.fails`, inclusive os desta spec. Os tickets seguintes removem a marcação dos testes que corrigirem.

- [x] `npm test` existe e roda toda a suíte, terminando sem falhas.
- [ ] O workflow de deploy roda os testes antes do build, e um teste falhando impede a publicação.
- [ ] Um novo workflow roda testes e build em cada PR, sem publicar nada.
- [x] T16 e T18 foram reescritos para o Select da v3.
- [x] T18 é um teste normal e passa, porque o bug 5 foi resolvido.
- [x] T16 falha pelo motivo do bug 6, não por causa do seletor.
- [x] Os controles C1 a C5 continuam passando.
- [x] T1 a T5, T7 a T11 e os testes dos bugs fora do escopo estão marcados com `it.fails`.
- [x] O README lista `npm test`, e a lacuna do executor de testes saiu do `AGENTS.md`.

**A conferir no GitHub:** os dois workflows foram escritos, mas ainda não rodaram no GitHub Actions. Localmente, `npm test` termina com código 1 quando um teste falha. Os dois itens ficam abertos até o primeiro PR e o primeiro deploy.
