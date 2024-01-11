import { DOWNLOAD_COMMAND } from './constants'

export function isDownloadText(data: string) {
  data = removeAsciiEscape(data).trim()
  if (data.includes(DOWNLOAD_COMMAND) && data.includes('$')) {
    let splits = data.split('$')
    if (splits.length === 2) {
      splits = splits[1].trim().split(' \r')
      splits = splits[0].trim().split(' ')
      if (splits.length === 2) {
        return `${splits[1]}`
      }
    }
  }
}

export function removeAsciiEscape(data: string) {
  // eslint-disable-next-line no-control-regex
  return data.replace(/\x1B\[[^@-~]*[@-~]/g, '').replace(/[^\x20-\x7E]/g, '')
}

export function importReplace(
  text: string,
  callback: (path: string) => string | undefined
) {
  return text.replace(/import\("(.+?)"\)/g, ($1, $2) => {
    const p = callback($2)
    if (p) {
      return `import("${p}")`
    }
    return $1
  })
}
