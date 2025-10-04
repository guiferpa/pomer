# 📊 Configuração do Google Analytics

## 🚀 Passo a Passo para Ativar o Analytics

### 1. Criar Conta no Google Analytics

1. Acesse [Google Analytics](https://analytics.google.com/)
2. Clique em "Começar a medir"
3. Crie uma conta (ex: "Pomer App")
4. Configure uma propriedade (ex: "Pomer Web App")
5. Escolha "Web" como plataforma
6. Configure o stream de dados:
   - URL do site: `https://guiferpa.github.io/pomer/`
   - Nome do stream: "Pomer Production"

### 2. Obter o ID de Medição

Após criar a propriedade, você receberá um ID no formato `G-XXXXXXXXXX`

### 3. Configurar no Projeto

Substitua `G-XXXXXXXXXX` pelos seguintes arquivos:

#### `src/hooks/useAnalytics.ts` (linha 5):
```typescript
const GA_MEASUREMENT_ID = 'G-SEU_ID_AQUI';
```

#### `index.html` (linhas 25 e 30):
```html
<script async src="https://www.googletagmanager.com/gtag/js?id=G-SEU_ID_AQUI"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-SEU_ID_AQUI');
</script>
```

### 4. Deploy

Após configurar o ID, faça o deploy:
```bash
npm run build
# Faça o commit e push para o GitHub
```

## 📈 Eventos Rastreados

O Pomer já está configurado para rastrear:

### Eventos de Torneio:
- ✅ **tournament_started** - Quando um torneio é iniciado
- ✅ **tournament_paused** - Quando o torneio é pausado
- ✅ **tournament_resumed** - Quando o torneio é retomado
- ✅ **tournament_reset** - Quando o torneio é resetado
- ✅ **level_skipped** - Quando um nível é pulado

### Eventos Futuros (podem ser adicionados):
- 🔄 **level_completed** - Quando um nível é completado automaticamente
- 🔄 **color_changed** - Quando a cor do tema é alterada
- 🔄 **theme_changed** - Quando o tema claro/escuro é alterado
- 🔄 **language_changed** - Quando o idioma é alterado
- 🔄 **structure_changed** - Quando a estrutura de blinds é alterada

## 🎯 Métricas Importantes

Com o Google Analytics, você poderá acompanhar:

- **Usuários únicos** por dia/semana/mês
- **Sessões** e duração média
- **Páginas mais visitadas**
- **Eventos mais acionados**
- **Dispositivos** (mobile vs desktop)
- **Países** de origem dos usuários
- **Taxa de rejeição** e tempo na página

## 🔧 Personalização

Para adicionar novos eventos, use o hook `useAnalytics`:

```typescript
import { useAnalytics } from "@/hooks";

const { trackEvent } = useAnalytics();

// Exemplo: rastrear mudança de cor
trackEvent("color_changed", "UI", "blue");
```

## 📱 Testando

1. Configure o ID do Google Analytics
2. Faça o deploy
3. Acesse o site e realize algumas ações
4. Aguarde 24-48h para ver os dados no Google Analytics

## 🚨 Importante

- O Google Analytics pode levar até 24-48h para mostrar os primeiros dados
- Use o modo de desenvolvimento para testar eventos em tempo real
- Respeite a LGPD/GDPR - considere adicionar um banner de cookies se necessário
