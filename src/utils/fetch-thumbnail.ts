import { writeFile } from 'node:fs/promises'
import { wait } from '@zero-dependency/utils'
import { thumbnailsPath } from '../config/paths.js'

const timestamp = () => `?timestamp=${Date.now()}`

export async function fetchThumbnailUrl(
  hostname: string,
  username: string
): Promise<string> {
  const baseUrl = `https://static-cdn.jtvnw.net/previews-ttv/live_user_${username}`
  const attempts = 10 // (10 attempts * (15 seconds * 4 urls)) = 10 minutes
  const timeout = 20 * 1000 // 20 seconds
  const urls = [
    `${baseUrl}-1920x1079.jpg`, // hack
    `${baseUrl}-1920x1080.jpg`, // full hd
    `${baseUrl}-1280x720.jpg`, // hd
    `${baseUrl}.jpg` // auto

  ]

  for (let i = 0; i < attempts; i++) {
    for (const url of urls) {
      const thumbnailsUrl = url + timestamp()
      const response = await fetch(thumbnailsUrl)
      if (response.redirected) {
        await wait(timeout)
        continue
      }

      if (hostname === 'localhost') {
        return thumbnailsUrl
      }

      const buffer = await response.arrayBuffer()
      await writeFile(`${thumbnailsPath}/${username}.jpg`, Buffer.from(buffer))
      return `${hostname}/thumbnails/${username}.jpg${timestamp()}`
    }
  }

  return hostname !== 'localhost'
    ? `${hostname}/thumbnails/fallback.png`
    : urls[0] + timestamp()
}
