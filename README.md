# vile-license

A [vile](http://vile.io) plugin for locking down project dependency [licenses](https://tldrlegal.com).

## Supported Checks

- [npm](http://npmjs.org)
- [bower](http://bower.io)

## Requirements

- [nodejs](http://nodejs.org)
- [npm](http://npmjs.org)

## Installation

    npm i -D vile vile-license

## Config

You specify the license types you can have and can't have in your `.vile.yml`.

### Whitelisting

```yml
license:
  config:
    allowed: MPL-2.0
```

or:

```yml
license:
  config:
    allowed: [
      "MIT",
      "MPL"
    ]
```

Note: Strings are **partially** matched, so be explicit (ex `MPL-2.0`)
and use both whitelisting and blacklisting if you want to be sure you
don't have a false positive.

### Blacklisting

```yml
license:
  config:
    disallowed: [ "AGPL" ]
```

### Ignoring

You can ignore specific packages as well.

```yml
license:
  config:
    ignored: [ "some-pkg" ]
```

### Restrictions

Assumes files are in the `cwd`.

## Vile Types Generated

Generates `vile.SEC` for each license violation.

## Architecture

- `src` is es6+ syntax compiled with [babel](https://babeljs.io)
- `lib` generated js library

## Hacking

    cd vile-license
    npm install
    npm run dev
    npm test
