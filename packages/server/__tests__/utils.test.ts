import { test, describe, expect } from 'vitest'
import { isDownloadText, importReplace } from '../utils'

describe('utils', () => {
  test('isDownloadText', () => {
    const result = isDownloadText(` openssh-server:~$ download test.txt
    `)
    expect(result).toMatchInlineSnapshot(`undefined`)
  })

  test('importReplace', () => {
    const result = importReplace(
      ` import("./_app/immutable/entry/start.wIM6_Zsc.js"),`,
      (path) => {
        return path
      }
    )
    expect(result).toMatchInlineSnapshot(`" import("./_app/immutable/entry/start.wIM6_Zsc.js"),"`)
  })
})
