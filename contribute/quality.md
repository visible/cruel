# quality gates

run this before every pr:

```bash
bun run qa
```

`qa` runs:

1. biome lint (`bun run lint`)
2. type checks for package and website (`bun run typecheck`)
3. package build (`bun run build`)
4. package tests (`bun run test`)
5. website docs build (`bun run check:docs`)
6. user smoke examples without api keys (`bun run check:users`)

## release checklist

1. core examples run: `cd packages/examples && bun run run.ts core`
2. docs snippets match real api names and options
3. ai-sdk and gateway examples still run with `-m` override
4. no widening of public types without tests in `packages/cruel/typecheck/types.ts`
5. `packages/cruel` exports stay stable (`.`, `./ai-sdk`, `./matchers`)
6. set `NPM_TOKEN` in repository secrets for `.github/workflows/publish.yml`
