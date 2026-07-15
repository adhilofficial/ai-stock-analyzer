# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Production authentication

Litses uses Supabase Auth. For the production domain, configure **Authentication → URL Configuration** in Supabase with:

- Site URL: `https://litses-markets.vercel.app`
- Redirect URL: `https://litses-markets.vercel.app/**`
- Optional local development redirect: `http://localhost:5173/**`

For Google OAuth, keep the authorized redirect URI pointed at the Supabase callback URL:

`https://vlzfzygsprdgjxssgjff.supabase.co/auth/v1/callback`

The Vercel domain belongs in Google Cloud's authorized JavaScript origins, not in the Google redirect URI list.

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
