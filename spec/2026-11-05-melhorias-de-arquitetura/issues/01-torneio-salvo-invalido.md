Status: ready-for-agent
Blocked by: None

# 01: Torneio salvo inválido não impede o app de abrir

Spec: `spec/2026-11-05-melhorias-de-arquitetura/spec.md` (regras 1 a 7)

**O que construir:** o app sempre abre. Um torneio salvo inválido é descartado, e o organizador vê o formulário com um aviso curto. Um novo módulo de persistência passa a cuidar das chaves, da conversão de datas, da validação e da correção de estados antigos, tanto para o torneio quanto para a última configuração.

- [ ] Os estados `{}`, array, JSON quebrado e objeto incompleto abrem o formulário com o aviso.
- [ ] Um torneio com nível atual ou tempo que não são números abre o formulário com o aviso.
- [ ] O refresh seguinte abre o formulário sem aviso.
- [ ] A chave vazia e o estado em branco deixado por resets antigos abrem o formulário sem aviso.
- [ ] Uma última configuração inválida é ignorada sem aviso, e o formulário usa os valores padrão.
- [ ] Depois de um reset, a chave do torneio fica vazia, e o formulário volta preenchido com a última configuração.
- [ ] Um torneio válido, rodando ou pausado, sobrevive a um refresh como antes.
- [ ] A correção de estados antigos continua funcionando, agora dentro do módulo de persistência.
- [ ] O aviso existe em português, espanhol e inglês e usa um componente HeroUI.
- [ ] O tema e o idioma continuam onde estão.
- [ ] `useLocalStorage` foi removido.
- [ ] O módulo de persistência tem testes diretos, e o aviso e o refresh têm testes pelo App.
- [ ] O aviso foi conferido em um navegador real, nos temas claro e escuro e em largura de celular.
