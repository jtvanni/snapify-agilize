# Snapify — Agilize IA

Plataforma interna da Agilize IA para gravação de tela e compartilhamento
controlado de vídeos com clientes.

- Somente e-mails presentes em `ALLOWED_EMAILS` podem entrar pelo GitHub.
- Clientes acessam apenas links públicos que um colaborador ativou.
- Dados ficam isolados no schema PostgreSQL `snapify`.
- Arquivos ficam no bucket privado `snapify-videos` do Supabase Storage.
- Uploads seguem diretamente do navegador para o Storage por URL assinada.

Consulte [docs/SUPABASE_VERCEL_SETUP.md](docs/SUPABASE_VERCEL_SETUP.md) para
configuração segura do Supabase, variáveis de ambiente, migrations e Vercel.

## Desenvolvimento

Copie `.env.example` para `.env.local`, preencha credenciais locais e execute:

```powershell
npm.cmd install
npm.cmd run dev
```

Validação antes de enviar mudanças:

```powershell
npm.cmd run prisma:validate
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build
```
