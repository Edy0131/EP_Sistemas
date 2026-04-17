EP Sistemas - Frontend (React + Vite)

Resumo
- SPA React usando Vite + Tailwind.
- Persistência local via localStorage e sincronização opcional com Supabase.

Principais arquivos
- src/App.jsx: componente raiz e lógica de sync/persistence.
- src/components: componentes da UI.
- src/services/supabase.js: singleton Supabase client.
- supabase_schema.sql: SQL para criar tabelas no Supabase.
- policy_dev.sql: políticas RLS de desenvolvimento (cuidado: uso apenas para testes).

Como rodar
1. Instale dependências:
   npm install
2. Rode o servidor de desenvolvimento:
   npm run dev
3. Abra http://localhost:5173

Conectar ao Supabase
1. Crie projeto em https://app.supabase.com e execute supabase_schema.sql no SQL editor.
2. (Opcional) Para desenvolvimento, execute policy_dev.sql para permitir operações com a anon key.
3. No site Supabase -> Settings -> API copie Project URL e anon public key.
4. No app -> Configurações -> Nuvem cole URL e key -> Salvar e Conectar.

Melhorias aplicadas
- Singleton do cliente Supabase para evitar múltiplas instâncias GoTrue.
- Normalização de campos enviados ao Supabase (camelCase -> snake_case), e campos extras movidos para meta JSONB.
- Fila local para entradas de history que referenciam produtos ausentes (persistida em localStorage) com retry automático.
- Exibição de status de sincronização e contagem de pendentes na UI.

Próximos passos recomendados
- Implementar políticas RLS produtivas com autenticação (Supabase Auth) e regras de acesso finas.
- Extrair mais lógica para hooks e serviços e adicionar testes unitários.
- Considerar conversão para TypeScript para segurança de tipos.

Contato
- Repo local: edson-prestes-sistemas

