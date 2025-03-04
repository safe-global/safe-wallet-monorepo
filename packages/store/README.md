# @safe-global/store

This is a utility package that deals with the state management of the application. It uses the [Redux Toolkit](https://redux-toolkit.js.org/) to manage the state of the application.

## Usage

The use the generated API you first need to initialiize the baseURL of the API.

```typescript
import { setBaseUrl } from '@safe-global/store'

setBaseUrl('YOUR_API_BASE_URL')
```

## Automatic code generation from the Client Gateway's OpenAPI

This package includes a script to generate the necessary boilerplate API code from the Client Gateway (CGW)'s OpenAPI specification using **@rtk-query/codegen-openapi**.

## Prerequisites

1. You've initialized the monorepo and installed all dependencies.
2. The `openapi-config.ts` file is correctly configured in this package with your OpenAPI specification details.
3. If you're running your own CGW service, set the `PRODUCTION_CGW_API_URL` env variable.

## Running the Code Generation Script

From the mono-repo root directory, run the following command:

```bash
yarn workspace @safe-global/store build
```

or, for staging API:

```bash
yarn workspace @safe-global/store build:dev
```

This will:

- Fetch the OpenAPI schema.
- Use the configuration provided in the `openapi-config.ts` file.
- Gerate the API code using **@rtk-query/codegen-openapi**.
