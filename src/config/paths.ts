import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

function getPath(path: string) {
  return resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', path)
}

export const envPath = getPath('.env')
export const thumbnailsPath = getPath('thumbnails')
export const databasePath = getPath('db')
