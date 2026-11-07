# Pomer

Relógio de torneios de poker: conta os níveis de blinds de um torneio e guarda tudo no próprio aparelho.

## Linguagem

**Estrutura de blinds**:
Uma lista nomeada de níveis, criada pelo organizador, que define como os blinds sobem ao longo do torneio.
_Evite_: estrutura pronta, preset, tabela de blinds

**Nível**:
Uma etapa da estrutura de blinds, com small blind, big blind, ante opcional e duração própria.
_Evite_: rodada, blind level

**Configuração do torneio**:
O que vale para um torneio: nome, estrutura de blinds escolhida, intervalo a cada N níveis, duração do intervalo e cor.
_Evite_: configuração, setup

**Preferências do aplicativo**:
O que vale para o aparelho, em qualquer torneio: tema, idioma e som.
_Evite_: configurações do torneio, settings

**Ante**:
Aposta obrigatória que vale em um nível, além dos blinds, seja qual for a forma de pagar (por jogador ou pelo big blind). Um nível pode não ter ante.
_Evite_: BB ante, big blind ante
