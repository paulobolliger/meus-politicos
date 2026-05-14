import { createHash } from 'node:crypto'

type JsonPrimitive = string | number | boolean | null
type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue }

function sortJson(value: JsonValue): JsonValue {
  if (Array.isArray(value)) {
    return value.map((item) => sortJson(item))
  }

  if (value !== null && typeof value === 'object') {
    const entries = Object.entries(value).sort(([a], [b]) => a.localeCompare(b))
    const result: Record<string, JsonValue> = {}

    for (const [key, child] of entries) {
      result[key] = sortJson(child)
    }

    return result
  }

  return value
}

export function stableHash(input: JsonValue) {
  const normalized = sortJson(input)
  const serialized = JSON.stringify(normalized)

  return createHash('sha256').update(serialized).digest('hex')
}
