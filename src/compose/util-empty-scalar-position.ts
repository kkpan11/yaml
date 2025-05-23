import type { Token } from '../parse/cst.ts'

export function emptyScalarPosition(
  offset: number,
  before: Token[] | undefined,
  pos: number | null
) {
  if (before) {
    pos ??= before.length
    for (let i = pos - 1; i >= 0; --i) {
      let st = before[i]
      switch (st.type) {
        case 'space':
        case 'comment':
        case 'newline':
          offset -= st.source.length
          continue
      }

      // Technically, an empty scalar is immediately after the last non-empty
      // node, but it's more useful to place it after any whitespace.
      st = before[++i]
      while (st?.type === 'space') {
        offset += st.source.length
        st = before[++i]
      }
      break
    }
  }
  return offset
}
