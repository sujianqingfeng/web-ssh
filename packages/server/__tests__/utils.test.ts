import { test, describe, expect } from 'vitest'
import { isDownloadText } from '../utils'

describe('utils', () => {
  test('isDownloadText', () => {
    const result = isDownloadText(` openssh-server:~$ download test.txt
    `)
    expect(result).toMatchInlineSnapshot(`"~/test.txt"`)
  })
})
