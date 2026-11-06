Status: ready-for-agent
Blocked by: None

# 02: Tela de estruturas: criar e listar

Spec: `spec/2026-11-06-estruturas-e-preferencias/spec.md` (regras 4, 6 a 15 e 20 para estruturas salvas)

**O que construir:** o organizador abre uma tela própria, cria do zero uma estrutura de blinds com nome e níveis e a vê salva na lista, mesmo depois de um refresh.

- [ ] A tela de estruturas tem endereço próprio, e um refresh nela continua nela.
- [ ] O menu de configurações abre da tela de estruturas.
- [ ] Criar começa com o nome e o 1º nível (small blind, big blind e duração).
- [ ] "Adicionar nível" sugere o dobro do small blind e do big blind e a mesma duração do nível anterior, tudo editável.
- [ ] Qualquer nível pode ser removido, desde que reste pelo menos 1.
- [ ] Ao salvar, nome vazio ou repetido, valor não inteiro ou não positivo, big blind menor que o small blind e duração fora de 1 a 60 mostram o erro no próprio campo, e nada é salvo. A ordem crescente dos blinds não é exigida.
- [ ] A estrutura salva fica guardada no aparelho e aparece na lista, da editada mais recentemente para a mais antiga.
- [ ] Uma estrutura guardada inválida é ignorada sem aviso, e as demais aparecem.
- [ ] Os textos existem em português, espanhol e inglês, e a tela parte de componentes HeroUI.
- [ ] O módulo de persistência tem testes diretos para as estruturas, e a jornada tem testes pelo App.
- [ ] `npm test` e `npm run build` passam.
