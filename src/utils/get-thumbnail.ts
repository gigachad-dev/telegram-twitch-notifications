export function getThumbnailUrl(username: string): string {
  return `https://static-cdn.jtvnw.net/previews-ttv/live_user_${username}-1920x1080.jpg?timestamp=${Date.now()}`
}
