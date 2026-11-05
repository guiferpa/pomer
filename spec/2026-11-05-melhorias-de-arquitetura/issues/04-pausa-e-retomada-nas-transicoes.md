Status: ready-for-agent
Blocked by: 01

# 04: Pausa e retomada no módulo de transições

Spec: `spec/2026-11-05-melhorias-de-arquitetura/spec.md` (regras 8 a 11)

**O que construir:** o organizador retoma sempre do tempo que vê na tela. Pausar e retomar passam a ser regras do módulo de transições, recebendo o estado e a hora atual, e `pausedTimeRemaining` deixa de existir.

- [ ] Pausar e retomar são regras do módulo de transições, com testes diretos de estado e hora.
- [ ] Retomar conta a partir do tempo mostrado na tela, em níveis e intervalos.
- [ ] Pular com o relógio pausado continua dando o tempo cheio e mantendo a pausa.
- [ ] Um torneio salvo com `pausedTimeRemaining` abre normalmente e retoma do tempo mostrado na tela.
- [ ] O campo some na gravação seguinte.
- [ ] Em `00:00` no último nível, pausar continua sem efeito, e essa regra não é mais verificada no hook.
- [ ] Refresh continua restaurando as seis situações: nível rodando, nível pausado, intervalo rodando, intervalo pausado, último nível e último nível em `00:00`.
- [ ] Os testes que dependiam do campo foram atualizados, sem perder o comportamento que verificam.
