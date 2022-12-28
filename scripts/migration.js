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
  console.log('Option (-n, --name <migration_name>) argument missing')
  process.exit(1)
}

execSync(`
  pnpm typeorm-ts-node-esm -d ${dir}/src/database/datasource.ts migration:generate ${dir}/src/migrations/${name}
`)
