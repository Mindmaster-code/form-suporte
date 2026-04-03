# form-suporte

Formulário de contato (nome, e-mail, dúvida) → e-mail para **suporte@mindmaster.com.br** via [Resend](https://resend.com).

## Por que existe `/api/submit`

O navegador **não pode** enviar e-mail sozinho sem expor senhas/chaves. Uma rota na Vercel recebe o JSON e chama a API da Resend (padrão simples e estável).

## Variáveis na Vercel

| Variável           | Obrigatória | Exemplo                                      |
| ------------------ | ----------- | -------------------------------------------- |
| `RESEND_API_KEY`   | Sim         | chave em Resend → API Keys                   |
| `RESEND_FROM`      | Sim         | `Mindmaster <noreply@mindmaster.com.br>`     |
| `MAIL_TO`          | Não         | padrão: `suporte@mindmaster.com.br`          |

O domínio do remetente precisa estar **verificado na Resend** (DNS).

## Se aparecer 401 na API

É **Deployment Protection** do time na Vercel bloqueando funções. Ajuste em **Team Settings** ou **Project → Settings → Deployment Protection** para produção pública, ou use domínio de produção sem bloqueio em `/api/*`.
