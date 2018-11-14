import { parse } from 'url'

export const validateAndFormatPublicUrl = (url?: string) => {
  if (!url) {
    return null
  }

  const regex1 = new RegExp('^https?://')
  if (regex1.test(url)) {
    return url
  }

  const regex2 = new RegExp('^//')
  if (regex2.test(url)) {
    return `http:${parse(url).path}`
  }

  return `http://${parse(url).path}`
}
