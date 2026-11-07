Status: ready-for-agent
Blocked by: None

# 01: Ante no editor de estruturas

Spec: `spec/2026-11-06-ante/spec.md` (regras 1 a 6 e 8)

**O que construir:** o organizador registra o ante de cada nível ao criar uma estrutura, e a estrutura fica guardada com ele.

- [ ] Cada nível do editor tem o campo "Ante", opcional.
- [ ] Um ante vazio salva o nível sem ante; um ante preenchido precisa ser inteiro positivo, com o erro no próprio campo.
- [ ] "Adicionar nível" sugere o dobro do ante anterior, ou nenhum ante se o anterior não tinha.
- [ ] No celular, os quatro campos ficam numa grade 2×2; em telas largas, numa linha.
- [ ] Estruturas salvas sem ante continuam carregando; um ante salvo inválido torna o nível inválido.
- [ ] Os textos existem em português, espanhol e inglês.
- [ ] O módulo de persistência tem testes diretos para o ante, e o editor tem testes pelo App.
- [ ] `npm test` e `npm run build` passam.
