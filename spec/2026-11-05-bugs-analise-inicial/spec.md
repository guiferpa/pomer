---
title: Correção dos bugs da análise inicial
status: proposta
solicitada-em: 2026-11-05
substitui:
---

# Correção dos bugs da análise inicial

Bugs encontrados na revisão de `src/` e reproduzidos com testes no HeroUI v2 (React 18 e 19). A correção vem depois dos upgrades de React e HeroUI. Esta lista ainda precisa passar por `/grilling` e `/to-tickets`.

Os testes estão em `src/bugs.test.tsx` e descrevem o comportamento correto: `it.fails` marca um bug ainda aberto. Os números de linha referem-se ao commit `e9b04d2`.

## Alta gravidade

| # | Bug | Onde | Teste |
|---|---|---|---|
| 1 | Pular nível com o timer pausado mantém o tempo do nível anterior ao retomar. | `useTournament.ts:262` | T1 |
| 2 | Pular para um intervalo com o timer pausado faz o tempo passar da duração do intervalo. | `useTournament.ts:262` | T2 |
| 3 | O último nível, quando não cai em intervalo, reinicia para sempre e duplica o histórico. | `useTournament.ts:174`, `:328`, `history-list.tsx:33` | T3, T11 |
| 4 | O último nível, quando cai em intervalo, leva ao formulário sem aviso ao fim do intervalo. | `useTournament.ts:134`, `:280`, `App.tsx:26` | T4, T10 |
| 5 | ~~Clicar de novo na estrutura já selecionada derruba o formulário.~~ Resolvido na migração para o HeroUI v3 e conferido no navegador. | `form-config.tsx:270`, `:105` | T18 |
| 6 | O Turbo promete níveis de 10 min, mas usa a duração do formulário. | `form-config.tsx:78` | T16 |

Com o intervalo padrão de 3 níveis, nenhuma estrutura termina corretamente: Pequeno e Turbo caem no bug 4, Médio e Grande no bug 3.

## Média gravidade

| # | Bug | Onde | Teste |
|---|---|---|---|
| 7 | O wake lock é liberado e pedido de novo a cada segundo. | `useWakeLock.ts:133`, `countdown.tsx:58` | T13 |
| 8 | O início natural de um intervalo não toca som. | `App.tsx:30` | T9 |
| 9 | Pular nível toca o som duas vezes. | `App.tsx:30`, `countdown.tsx:229` | T7 |
| 10 | Recarregar a página no meio do torneio toca o som. | `App.tsx:30` | T8 |
| 11 | A cor e a estrutura salvas se perdem ao voltar ao formulário. | `form-config.tsx:68-69` | T15 |
| 12 | O relógio não compensa o tempo ausente: avança só um nível e reinicia o tempo. | `useTournament.ts:135` | T5 |

O teste T5 assume que o torneio segue a hora real durante a ausência. Essa decisão foi confirmada em `spec/2026-11-05-fim-de-torneio-e-transicoes/spec.md`, que trata dos bugs 1 a 4, 8 a 10 e 12.

## Baixa gravidade

| # | Bug | Onde | Teste |
|---|---|---|---|
| 13 | O campo numérico não pode ser esvaziado enquanto se digita. | `form-config.tsx:161`, `:176`, `:191` | T17 |
| 14 | Os blinds saltam 3,25x do nível 20 para o 21 na estrutura Grande. | `helpers.ts:111` | T6 |
| 15 | `gtag('config')` é enviado a mais, o que deve inflar os page views. | `useAnalytics.ts:8` | T12 |
| 16 | Pausar com o pedido de wake lock em andamento deixa o lock ativo. | `useWakeLock.ts:115` | T14 |

## Não reproduzidos

Vieram da leitura do código e ainda precisam de confirmação.

- **Som no iOS Safari:** `play()` roda fora de um gesto do usuário e o erro é ignorado (`useAudio.ts:20`). Precisa de teste em um iPhone real.
- **Estado salvo corrompido:** `useTournament.ts:62` lê `savedState.config` fora do `try`.
- **Fallback do wake lock:** o `mousemove` sintético não mantém a tela ligada, e o vídeo do canvas provavelmente também não.
- **Selects de tema e idioma:** sem a proteção contra valor vazio (`form-config.tsx:246`, `settings-menu.tsx:66`, `:85`).
