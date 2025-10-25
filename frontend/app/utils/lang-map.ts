import * as langData from './lang.json';
/*!
 * lang-map <https://github.com/jonschlinkert/lang-map>
 *
 * Copyright (c) 2014-2015, Jon Schlinkert.
 * Licensed under the MIT license.
 */

type LangMap = {
  languages: { [key: string]: string[] };
};

// Lazy-load and cache extensions and languages
export default function map(): LangMap {
  const cache: LangMap = {
    languages: langData
  };
  return cache;
}

map.languages = function languages(ext: string) {
  ext = normalize(ext);
  var langs = map().languages;
  return langs[ext] || [ext];
};

function normalize(str: string) {
  if (str.charAt(0) === '.') {
    str = str.slice(1);
  }
  return str.toLowerCase();
}
