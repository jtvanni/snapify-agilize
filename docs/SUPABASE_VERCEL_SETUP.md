# Snapify interno — Supabase e Vercel

O destino autorizado é somente o projeto Supabase `agilize`, ref
`mmsskyvdparwnrwlwsrj`. Todos os comandos do Supabase devem usar `npx
supabase` (`npx.cmd supabase` no PowerShell desta máquina).

## 1. Bootstrap isolado do banco

Confirme o projeto antes de qualquer alteração:

```powershell
npx.cmd supabase projects list
npx.cmd supabase link --project-ref mmsskyvdparwnrwlwsrj
```

No SQL Editor do projeto `agilize`, um administrador deve executar uma única
vez, substituindo a senha por um valor aleatório que não será salvo no Git:

```sql
create role snapify_prisma login password 'SENHA_FORTE_GERADA';
grant connect on database postgres to snapify_prisma;
grant snapify_prisma to postgres;
grant create on database postgres to snapify_prisma;
create schema snapify authorization snapify_prisma;
revoke create on database postgres from snapify_prisma;
revoke create on schema public from snapify_prisma;
```

O `GRANT CREATE` no banco é temporário: o PostgreSQL o exige para que a role
possa se tornar proprietária do schema, e ele é revogado imediatamente após a
criação. `GRANT snapify_prisma TO postgres` permite que a role administrativa
do SQL Editor gerencie os objetos pertencentes ao Snapify; ele não concede os
privilégios de `postgres` à role `snapify_prisma`.

Não conceda `BYPASSRLS`, `CREATEDB`, privilégios em outros schemas ou
participação em outras roles. Configure as duas URLs com essa role:

- `DATABASE_URL`: Supavisor transaction mode (porta 6543), com
  `pgbouncer=true&connection_limit=1&schema=snapify`.
- `DIRECT_URL`: Supavisor session mode (porta 5432), com `schema=snapify`.

Para os comandos locais do Prisma, copie `.env.example` para `.env` e preencha
as URLs abaixo. O arquivo `.env` está ignorado pelo Git e não deve ser enviado
ao repositório. Substitua `SENHA_URL_ENCODED` pelo valor da senha codificado
para URL, sem manter esse texto no resultado:

```dotenv
DATABASE_URL="postgresql://snapify_prisma.mmsskyvdparwnrwlwsrj:SENHA_URL_ENCODED@aws-0-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1&schema=snapify"
DIRECT_URL="postgresql://snapify_prisma.mmsskyvdparwnrwlwsrj:SENHA_URL_ENCODED@aws-0-sa-east-1.pooler.supabase.com:5432/postgres?schema=snapify"
```

Caracteres especiais da senha precisam de percent-encoding nas URLs (por
exemplo, `@` vira `%40`, `:` vira `%3A` e `%` vira `%25`). A senha SQL continua
inalterada; apenas sua representação dentro da URL é codificada.

Revise `prisma/migrations/20261016000000_init_snapify/migration.sql` e aplique:

```powershell
npx.cmd prisma migrate deploy
```

O SQL versionado referencia exclusivamente `"snapify".*`.

## 2. Storage

No painel Storage do mesmo projeto, verifique se `snapify-videos` existe. Se
não existir, crie-o como **privado**, permitindo `video/webm`, `video/mp4` e
`image/png`. Configure somente o limite desse bucket; nunca altere o limite
global, pois o projeto é compartilhado.

Gere as credenciais em Storage > S3 Connection. Elas são exclusivas do
servidor, não devem receber o prefixo `NEXT_PUBLIC_` e não podem ser incluídas
em logs ou commits. As credenciais S3 do Supabase alcançam tecnicamente todos
os buckets; o aplicativo reduz esse risco fixando e validando
`snapify-videos` no servidor.

## 3. GitHub OAuth e acesso interno

Cadastre o callback local e o callback HTTPS de produção no GitHub OAuth App:

```text
http://localhost:3000/api/auth/callback/github
https://SEU_DOMINIO/api/auth/callback/github
```

`ALLOWED_EMAILS` é uma lista de endereços exatos separados por vírgula. Uma
lista vazia em produção impede todos os logins. Clientes não entram no painel;
eles recebem apenas URLs `/share/ID` que tenham sido explicitamente ativadas.

## 4. Vercel

Cadastre todas as variáveis documentadas em `.env.example`. Gere
`NEXTAUTH_SECRET` e `CRON_SECRET` com valores aleatórios independentes. O cron
diário chama `/api/cron/expired-videos`; a Vercel envia `CRON_SECRET` no header
`Authorization`.

O deploy não faz parte desta configuração. Antes dele, execute localmente:

```powershell
npx.cmd prisma validate
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build
```
