Status: ready-for-agent
Blocked by: 02, 03

# 04: Um alerta por transição

Spec: `spec/2026-11-05-fim-de-torneio-e-transicoes/spec.md` (regras 2, 16, 17 e 19; bugs 8, 9 e 10)

**O que construir:** jogadores e organizador ouvem exatamente um alerta em cada início de nível ou intervalo, por tempo ou ao pular, e ao chegar a `00:00` no último nível. Nos demais momentos, o app fica em silêncio.

**Origem do alerta:** sai de um único lugar, a partir da transição informada pelo módulo de transições. O botão de pular e o efeito que observa o número do nível deixam de tocar som. O alerta fica fora da atualização de estado, porque o React pode executá-la duas vezes em desenvolvimento.

- [ ] O início natural de um nível toca um alerta.
- [ ] O início natural de um intervalo toca um alerta.
- [ ] Pular nível toca um alerta, e não dois, com o relógio rodando ou pausado.
- [ ] Chegar a `00:00` no último nível toca um alerta.
- [ ] Um refresh sem mudança de nível ou intervalo não toca alerta, inclusive em `00:00`.
- [ ] Iniciar o torneio, pausar e retomar não tocam alerta.
- [ ] Os comportamentos acima têm testes pelo App, com `Audio` substituído.
- [ ] T7, T8 e T9 passam sem `it.fails`.
- [ ] O controle C3 continua passando.
