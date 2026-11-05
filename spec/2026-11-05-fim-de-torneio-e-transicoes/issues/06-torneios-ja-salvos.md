Status: resolved
Blocked by: 03

# 06: Correção de torneios já salvos

Spec: `spec/2026-11-05-fim-de-torneio-e-transicoes/spec.md` (regras 20 a 23)

**O que construir:** o organizador com um torneio em andamento não perde nada ao receber a versão nova, mesmo que o estado salvo tenha sido afetado pelos bugs antigos. A correção roda uma vez ao carregar o estado salvo, antes de o torneio aparecer na tela.

Torneios salvos que já caíram no formulário ficam fora deste ticket: o estado deles não é recuperado.

- [x] Um estado salvo em um intervalo depois do último nível abre no último nível em `00:00`, em vez de cair no formulário.
- [x] Um histórico salvo com duplicatas fica com uma entrada por nível.
- [x] Um estado salvo pausado retoma do tempo mostrado na tela.
- [x] Um estado salvo sem esses problemas abre sem nenhuma alteração.
- [x] O formato salvo no dispositivo não mudou.
- [x] Os casos acima têm testes pelo App, com o estado semeado no `localStorage`.
