# Como fazer deploy no Vercel

## Passo 1 — Importar no Vercel

1. Acesse https://vercel.com e entre com sua conta GitHub
2. Clique em **Add New... → Project**
3. Selecione o repositório `claude-chat` e clique em **Import**

## Passo 2 — Configurar variáveis de ambiente

Antes de clicar em Deploy, adicione em **Environment Variables**:

| Nome | Valor |
|------|-------|
| ANTHROPIC_API_KEY | Sua chave da API do Claude |
| JWT_SECRET | Qualquer string aleatória longa |
| AUTH_USERS | tanik:suasenha,amigo:senhadoamigo |

Formato de AUTH_USERS: usuario1:senha1,usuario2:senha2

## Passo 3 — Deploy

Clique em **Deploy** e aguarde ~2 minutos.
Você receberá uma URL pública — compartilhe com seu amigo junto com o usuário/senha dele.
