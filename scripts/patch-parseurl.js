import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const parseUrlPath = path.resolve(__dirname, '../node_modules/parseurl/index.js');

const modernParseUrlContent = `/*!
 * parseurl (patched with WHATWG URL API to resolve Node.js [DEP0169])
 * Copyright(c) 2014 Jonathan Ong
 * Copyright(c) 2014-2017 Douglas Christopher Wilson
 * MIT Licensed
 */

'use strict'

var url = require('url')
var Url = url.Url

module.exports = parseurl
module.exports.original = originalurl

function parseurl (req) {
  var url = req.url

  if (url === undefined) {
    return undefined
  }

  var parsed = req._parsedUrl

  if (fresh(url, parsed)) {
    return parsed
  }

  parsed = fastparse(url)
  parsed._raw = url

  return (req._parsedUrl = parsed)
}

function originalurl (req) {
  var url = req.originalUrl

  if (typeof url !== 'string') {
    return parseurl(req)
  }

  var parsed = req._parsedOriginalUrl

  if (fresh(url, parsed)) {
    return parsed
  }

  parsed = fastparse(url)
  parsed._raw = url

  return (req._parsedOriginalUrl = parsed)
}

function fastparse (str) {
  if (typeof str !== 'string') {
    return undefined
  }

  try {
    var dummyBase = 'http://localhost'
    var parsed = new URL(str, dummyBase)
    var isRelative = str.charCodeAt(0) === 0x2f || !str.includes('://')

    var res = Url !== undefined ? new Url() : {}
    res.protocol = isRelative ? null : parsed.protocol
    res.slashes = isRelative ? null : true
    res.auth = parsed.username || parsed.password ? (parsed.username + (parsed.password ? ':' + parsed.password : '')) : null
    res.host = isRelative ? null : parsed.host
    res.port = isRelative ? null : (parsed.port || null)
    res.hostname = isRelative ? null : parsed.hostname
    res.hash = parsed.hash || null
    res.search = parsed.search || null
    res.query = parsed.search ? parsed.search.slice(1) : null
    res.pathname = parsed.pathname
    res.path = parsed.pathname + (parsed.search || '')
    res.href = isRelative ? res.path : parsed.href

    return res
  } catch (_e) {
    return Url !== undefined ? new Url() : {}
  }
}

function fresh (url, parsedUrl) {
  return typeof parsedUrl === 'object' &&
    parsedUrl !== null &&
    (Url === undefined || parsedUrl instanceof Url) &&
    parsedUrl._raw === url
}
`;

export function patchParseUrl() {
  if (fs.existsSync(parseUrlPath)) {
    const current = fs.readFileSync(parseUrlPath, 'utf8');
    if (!current.includes('patched with WHATWG URL API')) {
      fs.writeFileSync(parseUrlPath, modernParseUrlContent, 'utf8');
      console.log('✅ Successfully patched node_modules/parseurl/index.js with modern WHATWG URL API (fixes DEP0169)');
    } else {
      console.log('ℹ️ node_modules/parseurl/index.js is already patched with WHATWG URL API');
    }
  }
}

// Run directly if executed as a script
if (process.argv[1] === __filename) {
  patchParseUrl();
}
