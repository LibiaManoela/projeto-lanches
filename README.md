# Aplicativo — projeto-lanches

Projeto acadêmico da Avaliação 2 de Desenvolvimento Web da disciplina de Programação para Interface de Usuário. O Aplicativo é uma demonstração de uma loja de lanches: permite explorar produtos, personalizar itens, montar um carrinho, simular um checkout e acompanhar pedidos.

> **Importante:** esta aplicação foi feita para fins acadêmicos. Login, cadastro e pedidos usam dados simulados, não há banco de dados ou autenticação de produção, e o estado mantido pelo servidor pode desaparecer quando o processo reinicia. Não use dados pessoais ou credenciais reais.

## Índice

- [Funcionalidades](#funcionalidades)
- [Páginas](#páginas)
- [Tecnologias e bibliotecas](#tecnologias-e-bibliotecas)
- [Organização do projeto](#organização-do-projeto)
- [Dados, sessão e limitações](#dados-sessão-e-limitações)
- [API](#api)
- [Acessibilidade e interface](#acessibilidade-e-interface)
- [Requisitos e execução local](#requisitos-e-execução-local)
- [Scripts disponíveis](#scripts-disponíveis)
- [Contas de demonstração](#contas-de-demonstração)
- [Testes e qualidade](#testes-e-qualidade)
- [Publicação](#publicação)
- [Equipe e histórico](#equipe-e-histórico)
- [Diagnóstico rápido](#diagnóstico-rápido)

## Funcionalidades

- Login e criação de conta demonstrativos.
- Catálogo com 12 produtos de exemplo, busca por nome e descrição e filtro por categoria.
- Busca com debounce de 300 ms, sem distinção entre letras maiúsculas/minúsculas ou acentos.
- Página de produto com imagem, ingredientes personalizáveis, adicionais com preço extra e seletor de quantidade.
- Carrinho persistido no navegador, com atualização de quantidades, remoção de itens, limpeza e cálculo de subtotal.
- Checkout com sete campos — endereço, número, complemento, CEP, telefone, forma de pagamento e observações —, máscaras de CEP e telefone, validação no navegador e no servidor e resumo do pedido.
- Formas de pagamento simuladas: Pix, cartão de crédito, cartão de débito e dinheiro.
- Criação idempotente de pedido: reenvios com a mesma chave de idempotência não criam um pedido duplicado.
- Recalculo de nome, preço e total dos itens no servidor a partir do catálogo; valores enviados pelo navegador não são considerados confiáveis.
- Página **Meus pedidos**, que lista os pedidos disponíveis para o usuário atual e permite abrir o acompanhamento de cada um.
- Acompanhamento com consulta periódica, atualização manual e cancelamento permitido enquanto o pedido estiver recebido ou em preparação.
- Progressão automática dos status para fins de demonstração: recebido, em preparação, saiu para entrega e entregue. O status avança em intervalos de 15 segundos após a criação.
- Estados de carregamento, erro, lista vazia e recurso não encontrado em telas que consultam a API.

## Páginas

| Rota | Descrição |
| --- | --- |
| `/` | Redireciona para o cardápio se houver sessão no navegador; caso contrário, para o login. |
| `/login` | Alterna entre entrar e criar uma conta demonstrativa. |
| `/cardapio` | Catálogo, busca e filtro por categoria; o cabeçalho oferece acesso a Meus pedidos e ao carrinho. |
| `/produto/[id]` | Detalhes e personalização de um produto. |
| `/carrinho` | Itens selecionados, personalizações, quantidades e subtotal. |
| `/checkout` | Endereço, contato, forma de pagamento, observações e revisão do pedido. |
| `/pedidos` | Lista de pedidos do usuário e links para acompanhamento individual. |
| `/pedido/[id]` | Status, etapas, itens, total, endereço, pagamento e cancelamento, quando permitido. |

## Tecnologias e bibliotecas

Versões abaixo correspondem às dependências instaladas e verificadas no ambiente durante a atualização deste README. O `package.json` declara intervalos de versão; `package-lock.json` registra a resolução usada pelo npm.

| Tecnologia/biblioteca | Versão instalada | Uso |
| --- | --- | --- |
| [Next.js](https://nextjs.org/) | 16.3.8 | Framework React, roteamento App Router, renderização e Route Handlers da API. |
| [React](https://react.dev/) | 19.3.0 | Componentes e interface. |
| [React DOM](https://react.dev/) | 19.3.0 | Renderização da aplicação React para a web. |
| [TypeScript](https://www.typescriptlang.org/) | 5.9.3 | Tipos e verificação estática do código. |
| [Tailwind CSS](https://tailwindcss.com/) | 4.3.3 | Estilização utilitária e responsiva. |
| `@tailwindcss/postcss` | 4.3.3 | Integração do Tailwind CSS 4 com PostCSS. |
| `@types/node` | 22.20.4 | Definições de tipos de Node.js usadas durante desenvolvimento e compilação. |
| `@types/react` | 19.3.0 | Definições TypeScript do React. |
| `@types/react-dom` | 19.3.0 | Definições TypeScript do React DOM. |

### Outras APIs e recursos utilizados

- **Next.js App Router:** páginas em `src/app/**/page.tsx` e endpoints em arquivos `route.ts`.
- **Route Handlers e Fetch API:** chamadas HTTP internas feitas pelo navegador aos endpoints `/api/...`, com `Request`, `Response`, `NextRequest` e `NextResponse`.
- **React Hooks:** `useState`, `useEffect`, `useCallback`, `useMemo`, `useRef`, `use` e `useSyncExternalStore` gerenciam formulários, estado e sincronização do carrinho.
- **Web Storage:** `sessionStorage` guarda a sessão demonstrativa; `localStorage` persiste o carrinho na cópia local do navegador.
- **`next/image`:** componente de imagem do Next.js para imagens do catálogo.
- **`next/font/google`:** carrega League Spartan, Inter e Poppins pelo mecanismo de fontes do Next.js.
- **TypeScript strict mode** e alias de importação `@/*` apontando para `src/*`.
- **PostCSS:** configurado com o plugin `@tailwindcss/postcss`.
- **JSON local:** os catálogos de produtos e usuários iniciais estão em `src/mocks/`.
- **APIs nativas do navegador:** `AbortController` para cancelar buscas obsoletas, `URLSearchParams` para filtros e consulta, `Intl.NumberFormat` para moeda, `Intl.DateTimeFormat` para data e hora, e `<dialog>` nativo para o diálogo de confirmação do produto.

Não há dependências instaladas para uma biblioteca de componentes, gerenciamento externo de estado, formulários, validação, ícones, testes automatizados, lint ou formatação. Em particular, o projeto não usa Zustand, React Hook Form, Zod, ESLint, Prettier, Jest, Vitest ou Playwright. As validações e componentes são implementados no próprio projeto com TypeScript, React e APIs nativas.

As dependências diretas declaradas em `package.json` são `next`, `react`, `react-dom`, `tailwindcss` e `@tailwindcss/postcss`. Os pacotes `@types/*` e `typescript` são dependências de desenvolvimento. Não há biblioteca externa de ícones: os ícones visuais usados na interface são emojis e caracteres de texto.

## Organização do projeto

| Caminho | Responsabilidade |
| --- | --- |
| `src/app/` | Rotas e páginas da interface. |
| `src/app/api/` | Route Handlers para autenticação, produtos, pedidos e frete. |
| `src/components/` | Componentes reutilizados, como cabeçalho e cartão de produto. |
| `src/lib/` | Tipos compartilhados, validação, categorias, pagamentos, formatação e regras de pedidos. |
| `src/mocks/` | Dados JSON de exemplo para produtos, usuários e frete. |
| `src/services/` | Funções cliente para chamadas à API e autenticação. |
| `src/store/` | Store simples do carrinho baseada em `localStorage` e `useSyncExternalStore`. |
| `src/styles/tokens.css` | Tokens de cor do design system definidos como tema Tailwind. |
| `src/app/globals.css` | Importação do Tailwind, configuração de fontes e estilos globais de foco. |
| `public/images/products/` | Imagens locais dos produtos usadas no cardápio. |
| `package.json` | Dependências e scripts npm do projeto. |
| `package-lock.json` | Resolução travada das dependências para instalação reproduzível via `npm ci`. |
| `next.config.ts` | Configuração do Next.js; atualmente sem opções adicionais. |
| `postcss.config.mjs` | Configuração PostCSS para o Tailwind CSS. |
| `tsconfig.json` | Configuração TypeScript, incluindo modo estrito e alias `@/*`. |

> **Nota de implementação:** o carrinho realmente utilizado pela interface está em `src/store/carrinho.ts`. `src/services/cart.ts` existe no repositório, mas não é importado pelas páginas atuais; não é a implementação ativa do carrinho.

## Dados, sessão e limitações

O comportamento de armazenamento é diferente por tipo de dado:

| Dado | Onde fica | Persistência/limitação |
| --- | --- | --- |
| Produtos | `src/mocks/products.json` | Dados locais de demonstração, não são lidos de banco de dados. |
| Usuários iniciais | `src/mocks/users.json` | Contas fixas para demonstração. |
| Novas contas | Memória do processo servidor (`globalThis`) | Podem desaparecer ao reiniciar o processo; instâncias serverless não compartilham necessariamente a mesma memória. |
| Pedidos | Memória do processo servidor (`globalThis`) | Podem desaparecer ao reiniciar o processo ou não estar disponíveis em outra instância, incluindo em hospedagem serverless. |
| Sessão do usuário | `sessionStorage` do navegador | Limitada à sessão da aba; é um identificador demonstrativo, não um token seguro de autenticação. |
| Carrinho | `localStorage` do navegador | Persiste no navegador até ser limpo; não é armazenado no servidor nem associado de forma segura à conta. |
| Frete | Não disponível | A rota atual responde `501`; `src/mocks/shipping.json` está vazio. |

O cabeçalho `X-User-Id` identifica o usuário nas chamadas da API, mas seu valor vem do cliente e pode ser falsificado. Não é uma medida de autenticação ou autorização adequada para produção. A aplicação também não usa banco de dados, serviço de sessão, hash de senha, pagamento real, integração com ViaCEP ou provedor de frete. Para uso real, é necessário implementar autenticação segura e persistência compartilhada, além das integrações que faltam.

## API

Os endpoints são implementados dentro de `src/app/api/`. As respostas são JSON, exceto quando indicado. Os cabeçalhos `X-User-Id` e `Idempotency-Key` são parte da implementação demonstrativa atual.

| Método | Endpoint | Descrição |
| --- | --- | --- |
| `POST` | `/api/auth/login` | Valida e-mail e senha contra as contas mock. Retorna os dados públicos do usuário. |
| `POST` | `/api/auth/register` | Valida nome, e-mail e senha; rejeita e-mail já cadastrado. |
| `GET` | `/api/products` | Lista produtos; aceita `category`, `q` e `simular=erro`. |
| `GET` | `/api/products/[id]` | Consulta produto por ID; aceita `simular=erro` ou `simular=404`. |
| `POST` | `/api/orders` | Valida checkout, usuário e itens; recalcula preços; aceita `Idempotency-Key`. |
| `GET` | `/api/orders` | Lista resumos dos pedidos pertencentes ao `X-User-Id` informado. |
| `GET` | `/api/orders/[id]` | Retorna pedido do usuário informado por `X-User-Id`; aceita `simular=erro`. |
| `PATCH` | `/api/orders/[id]` | Atualiza o status permitido; a interface usa a operação para cancelar. |
| `GET` | `/api/shipping` | Não implementado; retorna `501 Not Implemented`. |
| `DELETE` | `/api/orders/[id]` | Não implementado; retorna `501 Not Implemented`. |

### Regras e respostas relevantes

- Autenticação e identificador de usuário inválidos podem retornar `401`.
- Recursos inexistentes ou que pertencem a outro usuário retornam `404`.
- Erros de formato ou JSON inválido retornam `400`; dados de checkout inválidos retornam `422`.
- Cadastro com e-mail repetido retorna `409`.
- Transições de status incompatíveis com a etapa atual retornam `409`.
- As regras de transição estão definidas em `src/lib/orders.ts`; cancelamento só é aceito em `recebido` e `em_preparo`.
- A listagem ordena os pedidos do mais recente para o mais antigo e calcula o status demonstrativo ao consultar.
- Os estados de pedido são `recebido`, `em_preparo`, `saiu_para_entrega`, `entregue` e `cancelado`.
- O endpoint de criação retorna `201` para um novo pedido e `200` quando devolve um pedido já criado com a mesma chave de idempotência.
- A interface acompanha o pedido com polling de 15 segundos e tenta atualizar ao retornar para uma aba visível; os estados finais entregue ou cancelado não continuam sendo consultados.
- As falhas de API são encapsuladas em `ApiError` pelo helper `src/services/api.ts`, que preserva códigos HTTP e apresenta uma mensagem para falhas de conexão.

## Acessibilidade e interface

- Interface construída com classes responsivas do Tailwind CSS.
- Documento em português do Brasil (`lang="pt-BR"`).
- Link para pular diretamente ao conteúdo principal.
- Indicadores de foco visível em elementos interativos.
- Rótulos de formulário associados aos campos, indicação de erros, foco no primeiro campo inválido e uso de atributos ARIA quando necessário.
- Mensagens de estado e atualizações de pedido expostas para tecnologias assistivas.
- O modal de confirmação de produto utiliza o elemento nativo `<dialog>`.
- Paleta da interface centralizada em `src/styles/tokens.css`.
- Fontes: League Spartan como fonte geral, Inter para conteúdo e Poppins em títulos/componentes selecionados.

### Tokens de cor

| Token Tailwind | Cor |
| --- | --- |
| `laranja` | `#E95322` |
| `laranja-escuro` | `#C8400F` |
| `laranja-claro` | `#FFDECF` |
| `amarelo` | `#F5CB58` |
| `amarelo-claro` | `#F3E9B5` |
| `amarelo-intenso` | `#F4BA1B` |
| `marrom` | `#391713` |
| `coral` | `#FA5A66` |
| `cinza` | `#676767` |
| `branco-suave` | `#F8F8F8` |

Esses recursos são implementações do projeto; a presença deles não representa, por si só, uma auditoria de conformidade WCAG AA nem uma pontuação Lighthouse. Uma avaliação automatizada e testes com tecnologias assistivas ainda devem ser realizados.

## Requisitos e execução local

Requisitos: Node.js 20.9.0 ou superior e npm. A versão mínima do Node.js é a declarada pela dependência Next.js 16 instalada. O projeto não fixa a versão de Node.js em `package.json`.

Na pasta raiz do repositório:

```bash
npm ci
npm run dev
```

Abra o endereço indicado no terminal, normalmente `http://localhost:3000`. Mantenha o terminal aberto durante o uso. Para parar o servidor, pressione `Ctrl+C`.

Se a porta `3000` estiver ocupada, o Next.js pode usar outra porta. Utilize o endereço informado pelo processo em execução. Evite iniciar mais de um servidor para a mesma cópia do projeto.

Para executar a versão otimizada localmente:

```bash
npm run build
npm start
```

## Scripts disponíveis

| Comando | Ação |
| --- | --- |
| `npm ci` | Instala as versões registradas no lockfile. |
| `npm run dev` | Inicia o servidor de desenvolvimento Next.js. |
| `npm run build` | Gera o build otimizado de produção. |
| `npm start` | Inicia o servidor Next.js com o build de produção existente. |

Não há scripts `test`, `lint` ou `format` configurados no `package.json`.

## Contas de demonstração

Na tela de login, podem ser utilizadas as contas pré-cadastradas:

| E-mail | Senha |
| --- | --- |
| `ana@email.com` | `Senha@123` |
| `carlos@email.com` | `Senha@123` |

O cadastro também pode ser testado pela opção **Criar conta**. Contas criadas durante a execução ficam apenas na memória do processo servidor e são apagadas quando ele reinicia.

## Testes e qualidade

- `npm run build` executa a compilação otimizada e a verificação TypeScript realizada pelo Next.js.
- Não há suíte automatizada de testes unitários, integração ou ponta a ponta configurada.
- Não há lint ou formatador configurados como scripts npm.
- O build não substitui testes dos fluxos de interface, acessibilidade, API ou validação em dispositivos/tamanhos de tela reais.

## Publicação

O projeto pode ser hospedado em plataformas compatíveis com Next.js, mas a URL de produção da Vercel não foi informada no repositório. Antes de usar a demonstração em uma hospedagem serverless, considere que usuários novos e pedidos ficam em memória e não são compartilhados entre instâncias. Não há variáveis de ambiente de produção documentadas ou banco de dados configurado.

## Equipe e histórico

Os três integrantes abaixo aparecem no histórico de commits do repositório. O histórico também registra dois merges de pull requests:

| Integrante (nome exibido no Git) | Contribuições registradas |
| --- | --- |
| Libia Manoela (`libiamanoela`) | Estrutura inicial, autenticação, cardápio e imagens dos produtos. |
| Bernardo (`Bernildo42`) | Detalhes de produto e carrinho. |
| Pedro Emilio Martinelli (`PedroEmilioMartinelli`) | API e acompanhamento de pedidos, checkout. |

## Diagnóstico rápido

- **O aplicativo não inicia:** confira a versão de Node.js, execute `npm ci` na raiz e veja as mensagens do terminal.
- **A porta `3000` está ocupada:** use a porta informada pelo Next.js ao iniciar.
- **O login é recusado:** confira o e-mail e a senha da seção [Contas de demonstração](#contas-de-demonstração). Contas criadas pela interface podem ter sido perdidas após reinício do servidor.
- **O pedido não aparece em Meus pedidos:** confirme se está usando a mesma sessão/usuário e o mesmo processo servidor que criou o pedido. O armazenamento atual é em memória e não é compartilhado entre instâncias.
- **O catálogo não carrega:** verifique o terminal e acesse `http://localhost:3000/api/products` se o servidor estiver usando a porta `3000`.
- **Um produto não aparece:** confira o ID solicitado e os dados em `src/mocks/products.json`.
- **Trocar uma imagem:** substitua o arquivo correspondente em `public/images/products/`, mantendo o nome usado pelo catálogo. Reinicie ou atualize a página em desenvolvimento; para produção, gere e publique um novo build.
- **Simular falha ao carregar o catálogo:** acesse `/cardapio?simular=erro`.
- **Simular falha ao carregar um produto:** acesse `/produto/1?simular=erro`; para testar o estado não encontrado, use `/produto/1?simular=404`.
- **Simular falha ao carregar um pedido:** acesse `/pedido/1?simular=erro` com uma sessão e um pedido válidos.
