# @predicatesystems/sdk compatibility shim

This package preserves install/import compatibility for users still on:

```bash
npm install @predicatesystems/sdk
```

It re-exports from `@predicatesystems/runtime`. New code should import from
`@predicatesystems/runtime` directly.
