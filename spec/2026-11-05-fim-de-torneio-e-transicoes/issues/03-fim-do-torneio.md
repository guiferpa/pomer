Status: resolved
Blocked by: 02

# 03: Fim do torneio no último nível

Spec: `spec/2026-11-05-fim-de-torneio-e-transicoes/spec.md` (regras 1 a 7; bugs 3 e 4)

**O que construir:** o torneio passa a ter um fim definido. O último nível continua valendo até o organizador encerrar pelo reset. Em `00:00`, o relógio para, os blinds se mantêm e a tela mostra "Tempo esgotado". O torneio nunca volta ao formulário sem o reset.

**Estado de tempo esgotado:** é derivado, sem campo novo: estar no último nível, fora de intervalo, com tempo restante zero. O torneio continua marcado como rodando, o que mantém a tela ligada e faz o refresh restaurar `00:00`.

**Alerta:** o alerta ao chegar a `00:00` fica para o ticket 04.

- [x] Nunca há intervalo depois do último nível, mesmo quando o número dele é múltiplo do intervalo de break.
- [x] Em `00:00`, o relógio fica parado, os blinds continuam na tela e aparece "Tempo esgotado".
- [x] Durante todo o último nível, o card de próximo nível mostra "Último nível" e o botão de pular fica desabilitado.
- [x] Em `00:00`, o botão de pausa fica desabilitado, o reset continua disponível e a tela segue sem apagar.
- [x] O último nível não entra no histórico, e o histórico não se repete.
- [x] O card de intervalo informa que não há mais intervalos assim que nenhum outro vai acontecer.
- [x] Os novos textos existem em português, espanhol e inglês.
- [x] Em nenhuma das estruturas, com qualquer intervalo de break, o torneio volta ao formulário sem o reset.
- [x] Refresh em `00:00` restaura o mesmo estado.
- [x] As regras de tempo têm testes no módulo de transições, e a tela tem testes pelo App.
- [x] T3, T4, T10 e T11 passam sem `it.fails`.
- [x] A tela foi conferida em um navegador real, nos temas claro e escuro e em largura de celular.
