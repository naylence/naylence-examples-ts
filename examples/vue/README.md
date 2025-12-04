# @naylence/vue examples

Vue ports of the @naylence/react demo apps. Each folder is an isolated Vite + Vue 3 project:

- `hello` – two-node hello world (client + sentinel with hello agent)
- `hello-3node` – three-node chain (client → sentinel → agent)
- `rpc` – math RPC sample with streaming Fibonacci

## Running an example

Use the Makefile targets from a project folder:

```bash
cd examples/vue/<example-name>
make run     # install deps and start dev server
# make build   # production build
# make preview # preview production build
# make lint    # lint the project
# make clean   # remove dist and node_modules
```

> These projects reference the local `@naylence/vue` source via relative imports (`../../../src/index`). When publishing the package, swap to the npm package name if you prefer.
