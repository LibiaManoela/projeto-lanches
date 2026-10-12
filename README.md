# projeto-lanches
Repositório da Avaliação 2 - Projeto de Desenvolvimento Web de Programação para Interface de Usuário

## Sobre o projeto

Aplicação web acadêmica para explorar o cardápio de uma lanchonete. Os produtos e as contas iniciais são dados locais de demonstração, não um banco de dados de produção.

### Funcionalidades

- Login e cadastro demonstrativos.
- Listagem de produtos com busca por texto e filtro por categoria.
- Exibição de mensagens de carregamento e erro ao buscar os produtos.

As páginas de detalhes do produto, carrinho, checkout e acompanhamento do pedido existem, mas ainda estão em construção.

### Páginas

| Endereço | Conteúdo |
| --- | --- |
| `/` | Redireciona para o cardápio se houver sessão; caso contrário, abre o login. |
| `/login` | Login e cadastro demonstrativos. |
| `/cardapio` | Lista, busca e filtros de produtos. |
| `/produto/[id]` | Detalhes do produto (em construção). |
| `/carrinho` | Carrinho (em construção). |
| `/checkout` | Checkout (em construção). |
| `/pedido/[id]` | Acompanhamento do pedido (em construção). |

### Estrutura do código

| Caminho | Responsabilidade |
| --- | --- |
| `src/app/` | Páginas e rotas da aplicação. |
| `src/app/api/` | Endpoints da API, incluindo autenticação e produtos. |
| `src/components/` | Componentes reutilizáveis da interface. |
| `src/lib/` | Tipos, categorias, formatação e dados auxiliares. |
| `src/mocks/` | Dados locais de demonstração. |
| `src/services/` | Chamadas à API e serviços usados pelas páginas. |
| `src/styles/` | Tokens e estilos compartilhados. |
| `public/images/products/` | Imagens dos produtos servidas como arquivos estáticos. |

### Tecnologias

Next.js, React, TypeScript e Tailwind CSS.

## Comandos úteis

Para validar a compilação de produção:

```bash
npm run build
```

Depois de uma compilação bem-sucedida, é possível executar a versão de produção localmente:

```bash
npm start
```

O projeto ainda não possui um comando de testes automatizados configurado no `package.json`.

## Diagnóstico rápido

- **O aplicativo não abre:** confirme no terminal se o servidor está pronto e acesse o endereço e a porta informados por ele.
- **O login é recusado:** use uma das contas listadas em [Acesso de demonstração](#acesso-de-demonstração). O cadastro local também é apagado quando o servidor reinicia.
- **O cardápio não carrega:** verifique erros no terminal onde `npm run dev` está executando. A rota `http://localhost:3000/api/products` deve retornar os produtos em JSON quando o servidor estiver usando a porta `3000`.
- **Trocar uma foto:** substitua o arquivo correspondente em `public/images/products/`, mantendo o mesmo nome. No modo de desenvolvimento as imagens não passam pelo otimizador do Next.js, então uma atualização da página deve mostrar o arquivo novo. Para produção, execute um novo build e publique os arquivos atualizados.
- **Testar o estado de erro:** abra `/cardapio?simular=erro` para simular uma falha da API de produtos.

## Como executar

Requisitos: Node.js e npm instalados.

1. Abra um terminal na pasta raiz do projeto (a pasta que contém `package.json`).
2. Instale as dependências:

	```bash
	npm ci
	```

3. Inicie o servidor de desenvolvimento:

	```bash
	npm run dev
	```

4. Aguarde o terminal indicar que o servidor está pronto e abra no navegador o endereço exibido, normalmente `http://localhost:3000`.

Mantenha esse terminal aberto enquanto usa o aplicativo. Para encerrar o servidor, volte ao terminal e pressione `Ctrl+C`. Não é necessário iniciar mais de um servidor de desenvolvimento para a mesma cópia do projeto.

### Porta ocupada

Se a porta `3000` já estiver sendo usada, o Next.js pode iniciar o servidor em outra porta, como `3001`. Nesse caso, use o endereço que apareceu no terminal, não presuma que o aplicativo está em `http://localhost:3000`. Se houver outro servidor desta cópia do projeto em execução, encerre-o com `Ctrl+C` no terminal correspondente antes de iniciar um novo.

### Acesso de demonstração

Na tela de login, use uma das contas de demonstração:

| E-mail | Senha |
| --- | --- |
| `ana@email.com` | `Senha@123` |
| `carlos@email.com` | `Senha@123` |

O login é simulado com dados locais para demonstração. Contas criadas pela opção **Criar conta** ficam apenas na memória do servidor e são removidas quando ele é reiniciado.
