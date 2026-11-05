Status: ready-for-agent
Blocked by: 05

# 06: Campos numéricos com edição livre

Spec: `spec/2026-11-05-melhorias-de-arquitetura/spec.md` (regras 18 a 20; bug 13)

**O que construir:** o organizador apaga e digita um valor com calma. O formulário guarda o texto digitado separado da configuração e valida ao iniciar o torneio.

- [ ] Um campo numérico pode ficar vazio enquanto se digita, sem voltar ao valor padrão.
- [ ] Ao iniciar, um valor vazio mostra o erro no próprio campo, e o torneio não começa.
- [ ] Ao iniciar, um valor fora dos limites mostra o erro no próprio campo, e o torneio não começa: duração do nível de 1 a 60, intervalo de 1 a 10 e duração do intervalo de 1 a 30.
- [ ] Corrigir o valor permite iniciar o torneio com o valor digitado.
- [ ] As mensagens de erro existem em português, espanhol e inglês.
- [ ] Os comportamentos acima têm testes pelo App.
- [ ] T17 passa sem `it.fails`.
- [ ] O formulário e os erros de campo foram conferidos em um navegador real, nos temas claro e escuro e em largura de celular.
