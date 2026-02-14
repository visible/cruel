# setup

## requirements

- node 18+
- bun

## getting started

```bash
git clone https://github.com/visible/cruel
cd cruel
bun install
```

## monorepo structure

```
cruel/
├── packages/
│   ├── cruel/          # npm package
│   ├── examples/       # runnable examples
│   │   ├── ai-sdk/     # direct provider examples
│   │   ├── ai-gateway/ # vercel ai gateway examples
│   │   └── lib/        # shared utilities
│   └── web/            # cruel.dev website
└── contribute/         # you are here
```

## commands

| action              | command                                                     |
| ------------------- | ----------------------------------------------------------- |
| build package       | `cd packages/cruel && bun run build`                        |
| run tests           | `cd packages/cruel && bun test`                             |
| run single test     | `cd packages/cruel && bun test src/file.test.ts`            |
| run example         | `cd packages/examples && bun run ai-sdk/generate-text/openai/basic.ts` |
| run all for provider| `cd packages/examples && bun run examples:openai`           |
| run all heavy       | `cd packages/examples && bun run examples:heavy`            |
| dev website         | `cd packages/web && bun run dev`                            |

## package entry points

the cruel package has three entry points:

| entry         | import                            | purpose                  |
| ------------- | --------------------------------- | ------------------------ |
| `.`           | `import { cruel }`                | core chaos functions     |
| `./ai-sdk`    | `import {} from "cruel/ai-sdk"`   | ai sdk model wrappers    |
| `./matchers`  | `import {} from "cruel/matchers"` | test matchers            |

## workflow

1. create a branch from `main`
2. make your changes
3. run `bun test` in `packages/cruel`
4. run `bun run build` in `packages/cruel`
5. open a pr
