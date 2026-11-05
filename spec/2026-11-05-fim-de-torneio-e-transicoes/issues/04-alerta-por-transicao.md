Status: resolved
Blocked by: 02, 03

# 04: Um alerta por transição

Spec: `spec/2026-11-05-fim-de-torneio-e-transicoes/spec.md` (regras 2, 16, 17 e 19; bugs 8, 9 e 10)

**O que construir:** jogadores e organizador ouvem exatamente um alerta em cada início de nível ou intervalo, por tempo ou ao pular, e ao chegar a `00:00` no último nível. Nos demais momentos, o app fica em silêncio.

**Origem do alerta:** sai de um único lugar, a partir da transição informada pelo módulo de transições. O botão de pular e o efeito que observa o número do nível deixam de tocar som. O alerta fica fora da atualização de estado, porque o React pode executá-la duas vezes em desenvolvimento.

- [x] O início natural de um nível toca um alerta.
- [x] O início natural de um intervalo toca um alerta.
- [x] Pular nível toca um alerta, e não dois, com o relógio rodando ou pausado.
- [x] Chegar a `00:00` no último nível toca um alerta.
- [x] Um refresh sem mudança de nível ou intervalo não toca alerta, inclusive em `00:00`.
- [x] Iniciar o torneio, pausar e retomar não tocam alerta.
- [x] Os comportamentos acima têm testes pelo App, com `Audio` substituído.
- [x] T7, T8 e T9 passam sem `it.fails`.
- [x] O controle C3 continua passando.
