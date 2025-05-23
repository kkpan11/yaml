import { Buffer } from 'node:buffer'
import { Scalar } from '../../nodes/Scalar.ts'
import { stringifyString } from '../../stringify/stringifyString.ts'
import type { ScalarTag } from '../types.ts'

export const binary: ScalarTag = {
  identify: value => value instanceof Uint8Array, // Buffer inherits from Uint8Array
  default: false,
  tag: 'tag:yaml.org,2002:binary',

  /**
   * Returns a Buffer in node and an Uint8Array in browsers
   *
   * To use the resulting buffer as an image, you'll want to do something like:
   *
   *   const blob = new Blob([buffer], { type: 'image/jpeg' })
   *   document.querySelector('#photo').src = URL.createObjectURL(blob)
   */
  resolve(src, onError) {
    if (typeof Buffer === 'function') {
      return Buffer.from(src, 'base64')
    } else if (typeof atob === 'function') {
      // On IE 11, atob() can't handle newlines
      const str = atob(src.replace(/[\n\r]/g, ''))
      const buffer = new Uint8Array(str.length)
      for (let i = 0; i < str.length; ++i) buffer[i] = str.charCodeAt(i)
      return buffer
    } else {
      onError(
        'This environment does not support reading binary tags; either Buffer or atob is required'
      )
      return src
    }
  },

  stringify({ comment, type, value }, ctx, onComment, onChompKeep) {
    if (!value) return ''
    const buf = value as Uint8Array // checked earlier by binary.identify()
    let str: string
    if (typeof Buffer === 'function') {
      str =
        buf instanceof Buffer
          ? buf.toString('base64')
          : Buffer.from(buf.buffer).toString('base64')
    } else if (typeof btoa === 'function') {
      let s = ''
      for (let i = 0; i < buf.length; ++i) s += String.fromCharCode(buf[i])
      str = btoa(s)
    } else {
      throw new Error(
        'This environment does not support writing binary tags; either Buffer or btoa is required'
      )
    }

    type ??= Scalar.BLOCK_LITERAL
    if (type !== Scalar.QUOTE_DOUBLE) {
      const lineWidth = Math.max(
        ctx.options.lineWidth - ctx.indent.length,
        ctx.options.minContentWidth
      )
      const n = Math.ceil(str.length / lineWidth)
      const lines = new Array(n)
      for (let i = 0, o = 0; i < n; ++i, o += lineWidth) {
        lines[i] = str.substr(o, lineWidth)
      }
      str = lines.join(type === Scalar.BLOCK_LITERAL ? '\n' : ' ')
    }

    return stringifyString(
      { comment, type, value: str } as Scalar,
      ctx,
      onComment,
      onChompKeep
    )
  }
}
