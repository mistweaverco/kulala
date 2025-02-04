// The document contains blocks of text that are separated by a delimiter
// The delimiter is a string that starts with three hash signs
// e.g. ###
// The delimiter is followed can be followed by any characters
const BLOCK_DELIMITER = '###'
const BLOCK_DELIMITER_REGEX = new RegExp(`^${BLOCK_DELIMITER}(.*)$`, 'm')

// A request line is a string that starts with a method,
// then followed by a URL and optionally followed by a HTTP version
// If no HTTP version is supplied, HTTP/1.1 is assumed.
// e.g. GET http://example.com HTTP/1.1
// Here the method is GET, the URL is http://example.com and the HTTP version is HTTP/1.1
// e.g. POST http://example.com
// Here the method is POST, the URL is http://example.com and the HTTP version is HTTP/1.1
const REQUEST_LINE_REGEX =
  /^(GET|POST|PUT|PATCH|DELETE|OPTIONS|HEAD|CONNECT|TRACE) (\S+)(?: (HTTP\/1\.0|HTTP\/1\.1|HTTP\/2\.0))?$/

type RequestLine = {
  method: string
  url: string
  httpVersion: string
}

const getRequestLineFromBlock = (block: string): RequestLine | null => {
  let result: RequestLine | null = null
  block.split('\n').forEach((line) => {
    const match = line.match(REQUEST_LINE_REGEX)
    if (match) {
      result = {
        method: match[1],
        url: match[2],
        httpVersion: match[3] ? match[3] : 'HTTP/1.1'
      }
    }
  })
  return result
}

// a variable is a string that starts with a @ sign and is followed by a word
// e.g. @variableName=foobar
// Here the variable is variableName and the value is foobar
const VARIABLE_REGEX = /^@(\w+)=(.*)$/

const getVariablesFromDocument = (document: string): DocumentVariables => {
  const lines = document.split('\n')
  const variables: DocumentVariables = {}
  for (const line of lines) {
    const match = line.match(VARIABLE_REGEX)
    if (match) {
      variables[match[1]] = match[2]
    }
  }
  return variables
}

// a magic type is a string that starts with a #,
// then a space and then a word that starts with a @ sign
// the word that starts with a @ sign is the name of the magic type
// the value(s) of the magic type are the values that follow the name
// e.g. # @name LOGIN_REQUEST
// Here the magic type is @name and the value is LOGIN_REQUEST
// A magic type can only be found in a block and
// belongs only to that block.
const MAGIC_TYPE_REGEX = /^# @(\w+) (.*)$/

const getMagicType = (line: string): [string, string] | null => {
  const match = line.match(MAGIC_TYPE_REGEX)
  if (match) {
    return [match[1], match[2]]
  }
  return null
}

const getMagicTypes = (block: string): { [key: string]: string } => {
  const lines = block.split('\n')
  const magicTypes: { [key: string]: string } = {}
  for (const line of lines) {
    const magicType = getMagicType(line)
    if (magicType) {
      magicTypes[magicType[0]] = magicType[1]
    }
  }
  return magicTypes
}

export type Headers = {
  [key: string]: string
}

export type HeadersAndBody = {
  headers: Headers
  body: string | undefined
}

const getHeadersAndBody = (block: string): HeadersAndBody => {
  // headers begin after the request line
  // and end before the body
  // headers are separated by a colon
  // the key is before the colon and the value is after the colon
  // e.g. Content-Type: application/json
  // Here the key is Content-Type and the value is application/json
  //
  // A block could look like this:
  // POST http://example.com
  // Content-Type: application/json
  // Authorization: Bearer foobar
  //
  // { "foo": "bar" }
  // Here the headers are
  // Content-Type: application/json and
  // Authorization: Bearer foobar
  // The body is { "foo": "bar" }
  //
  // The body is optional and starts after an empty line after the headers
  const lines = block.split('\n')
  const result: HeadersAndBody = {
    headers: {},
    body: undefined
  }
  let requestLineFound = false
  let bodyStarted = false
  for (const line of lines) {
    const match = line.match(REQUEST_LINE_REGEX)
    if (match) {
      requestLineFound = true
      continue
    }
    if (!requestLineFound) {
      continue
    }
    if (bodyStarted) {
      if (result.body === undefined) {
        result.body = ''
      }
      result.body += line + '\n'
      continue
    }
    if (line.trim() === '') {
      bodyStarted = true
      continue
    }
    const [key, value] = line.split(':')
    result.headers[key.trim()] = value.trim()
  }
  result.body = result.body ? result.body.trim() : undefined
  return result
}

export type DocumentVariables = {
  [variable: string]: string
}

export type MagicTypes = {
  [key: string]: string
}

export type ParsedBlock = {
  name: string
  start: number
  end: number
  method: string
  url: string
  body: string | undefined
  httpVersion: string
  magicTypes: MagicTypes
  headers: Headers
  blockIndex: number
}

export type ParsedDocument = {
  variables: DocumentVariables
  blocks: ParsedBlock[]
}

export const getParsedDocument = (source: string): ParsedDocument => {
  const parsedDocument: ParsedDocument = {
    variables: {},
    blocks: []
  }
  const blocks = source.split(BLOCK_DELIMITER_REGEX)
  parsedDocument.variables = getVariablesFromDocument(source)
  blocks.forEach((block, index) => {
    const requestLine = getRequestLineFromBlock(block)
    if (requestLine === null) {
      return
    }
    const blockIndex = index
    const magicTypes = getMagicTypes(block)
    const name = magicTypes['name'] ? magicTypes['name'] : `Block #${index + 1}`
    const start = index === 0 ? 0 : blocks[index - 1].length
    const end = start + block.length
    const method = requestLine.method
    const url = requestLine.url
    const httpVersion = requestLine.httpVersion
    const headersAndBody = getHeadersAndBody(block)
    const body = headersAndBody.body
    const headers = headersAndBody.headers
    parsedDocument.blocks.push({
      blockIndex,
      name,
      start,
      end,
      method,
      url,
      body,
      httpVersion,
      magicTypes,
      headers
    })
  })
  return parsedDocument
}

export const getBlock = (
  parsedDocument: ParsedDocument,
  blockIndex: number
): ParsedBlock | null => {
  return parsedDocument.blocks.find((block) => block.blockIndex === blockIndex) || null
}

export const constuctRequest = (parsedBlock: ParsedBlock): RequestInit => {
  const headers = new Headers()
  for (const key in parsedBlock.headers) {
    headers.append(key, parsedBlock.headers[key])
  }
  const body = parsedBlock.body ? parsedBlock.body : undefined
  const request: RequestInit = {
    method: parsedBlock.method,
    headers,
    body
  }
  return request
}

export const constructRequestAtBlockIndex = (
  parsedDocument: ParsedDocument,
  blockIndex: number
): RequestInit | null => {
  const block = getBlock(parsedDocument, blockIndex)
  if (!block) {
    return null
  }
  return constuctRequest(block)
}
