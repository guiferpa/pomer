Status: resolved
Blocked by: 01

# 05: Estruturas fora do formulário

Spec: `spec/2026-11-05-melhorias-de-arquitetura/spec.md` (regras 12 a 17; bugs 6, 11 e 14)

**O que construir:** cada estrutura traz a própria duração, e o formulário volta como foi deixado. Um novo módulo de estruturas transforma uma estrutura nomeada em níveis, cuida da progressão de blinds e deduz o nome em configurações antigas.

- [ ] Escolher Turbo preenche 10 min na duração do nível, e as demais estruturas preenchem 20 min.
- [ ] Trocar de estrutura sobrescreve o que estava digitado na duração.
- [ ] O valor digitado depois de escolher a estrutura é o que vale no torneio.
- [ ] A última configuração guarda o nome da estrutura.
- [ ] Ao voltar ao formulário, a estrutura, a duração e a cor aparecem como foram deixadas.
- [ ] Em uma configuração antiga, o nome é deduzido da quantidade de níveis e do primeiro blind, e sem correspondência vale Médio.
- [ ] Na estrutura Grande, os níveis 21 a 25 usam 1536x, 2048x, 3072x, 4096x e 6144x do blind inicial.
- [ ] Nenhum salto entre níveis passa de 2x nas quatro estruturas.
- [ ] Um torneio já iniciado mantém os níveis que guardou.
- [ ] O módulo de estruturas tem testes diretos, sem renderizar a tela.
- [ ] T6, T15 e T16 passam sem `it.fails`.
