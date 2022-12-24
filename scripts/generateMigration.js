import { execSync } from 'node:child_process'
import { cwd } from 'node:process'
import { parseArgs } from 'node:util'

const dir = cwd()
const {
  values: { name }
} = parseArgs({
  options: {
    name: {
      type: 'string',
      short: 'n'
    }
  }
})

if (!name) {
  process.exit(1)
}

execSync(`
  pnpm typeorm-ts-node-esm -d ${dir}/src/database.ts migration:generate ${dir}/src/migrations/${name}
`)
