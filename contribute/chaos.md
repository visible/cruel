# adding chaos modes

this guide covers adding new failure modes to cruel's ai sdk integration

## architecture

cruel wraps ai sdk models at the `doGenerate` / `doStream` level:

```
your app
  └── generateText({ model: cruelModel(openai("gpt-4o"), opts) })
        └── cruelModel.doGenerate()
              ├── applyChaos()      # pre-call failures (rate limit, timeout, etc)
              ├── model.doGenerate() # actual api call
              └── applyPostChaos()  # post-call mutations (partial response, etc)
```

for streaming, the chain is:

```
cruelModel.doStream()
  ├── applyChaos()           # pre-call failures
  ├── model.doStream()       # actual api call
  └── applyStreamChaos()     # stream transforms (slow tokens, corrupt, cut)
```

## key files

| file            | purpose                                      |
| --------------- | -------------------------------------------- |
| `src/types.ts`  | all type definitions including chaos options  |
| `src/ai-sdk.ts` | model wrappers and chaos application logic    |
| `src/errors.ts` | error constructors for simulated failures     |

## adding a new pre-call failure

pre-call failures happen before the api request. examples: `rateLimit`, `overloaded`, `timeout`

### 1. add the option to `CruelChaosOptions` in `types.ts`

```ts
type CruelChaosOptions = {
  // ...existing options
  yourNewMode?: number  // probability 0-1
}
```

### 2. add the event type to `ChaosEvent` in `types.ts`

```ts
type ChaosEvent =
  | // ...existing events
  | { type: "yourNewMode"; modelId: string }
```

### 3. add an error constructor in `errors.ts` (if needed)

```ts
function yourNewModeError(): CruelAPIError {
  return new CruelAPIError({
    message: "Your error message",
    statusCode: 500,
  })
}
```

### 4. add the check in `applyChaos` in `ai-sdk.ts`

```ts
async function applyChaos(opts, modelId) {
  // ...existing checks
  if (chance(opts.yourNewMode)) {
    emit?.({ type: "yourNewMode", modelId: id })
    throw yourNewModeError()
  }
}
```

### 5. add a test in `ai-sdk.test.ts`

### 6. add an example in `packages/examples/`

## adding a new stream transform

stream transforms modify the token stream. examples: `slowTokens`, `corruptChunks`, `streamCut`

### 1. add the option to `CruelChaosOptions`

### 2. add the transform in `applyStreamChaos` in `ai-sdk.ts`

```ts
function applyStreamChaos(stream, opts, modelId) {
  // ...existing transforms
  if (opts.yourTransform) {
    result = result.pipeThrough(
      new TransformStream({
        transform(chunk, controller) {
          // modify or drop chunks here
          controller.enqueue(chunk)
        },
      }),
    )
  }
  return result
}
```

## adding a new post-call mutation

post-call mutations modify the completed response. examples: `partialResponse`, `finishReason`

### 1. add the option to `CruelChaosOptions`

### 2. add the mutation in `applyPostChaos` in `ai-sdk.ts`

```ts
function applyPostChaos(result, opts, modelId) {
  // ...existing mutations
  if (chance(opts.yourMutation)) {
    modified = { ...modified, /* your changes */ }
  }
  return modified
}
```

## adding support for a new model type

cruel supports language, embedding, image, speech, transcription, and video models. if the ai sdk adds a new model type:

1. add the model types in `types.ts`
2. add options type (extend `CruelEmbeddingOptions` pattern)
3. add a wrapper function in `ai-sdk.ts` following the `cruelEmbeddingModel` pattern
4. export from `ai-sdk.ts`
5. re-export from `index.ts`

## testing

```bash
cd packages/cruel
bun test                   # run all tests
bun test src/ai-sdk.test.ts # run ai-sdk tests only
```

all chaos modes should have tests that verify:
- the failure fires at rate 1.0
- the failure doesn't fire at rate 0
- the `onChaos` callback receives the correct event
- the error type matches what the ai sdk expects
