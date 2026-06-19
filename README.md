# Girabolao — Plataforma de Bolão da Copa

## 🚀 Como rodar localmente

1. Clone o repositório
2. Instale as dependências:
   ```bash
   pnpm install
   ```
3. Configure o Supabase:
   - Crie um projeto em [supabase.com](https://supabase.com)
   - Copie as credenciais para `.env.local` (veja `.env.example`)
4. Execute:
   ```bash
   pnpm dev
   ```
5. Acesse: http://localhost:5173

## 🛠️ Deploy

Use o script de deploy:
```bash
./deploy.ps1
```

## 🧪 Testes

```bash
pnpm test
```

## 📁 Estrutura

- `src/` — código frontend (React + TanStack Router)
- `supabase/` — banco de dados, funções e migrações
- `src/tests/` — testes unitários e de integração

## 📜 CHANGELOG

Veja [CHANGELOG.md](CHANGELOG.md)

## 🤝 Contribuição

Abra uma issue ou PR! Siga o padrão de commits semânticos.