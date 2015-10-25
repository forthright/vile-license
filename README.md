# vile-license

A [vile](http://vile.io) plugin for locking down
project dependency [licenses](https://tldrlegal.com).

## Supported Checks

- [npm](http://npmjs.org)
- [bower](http://bower.io)

## Requirements

- [nodejs](http://nodejs.org)
- [npm](http://npmjs.org)

## Installation

    npm i vile-license

## Config

```yml
license:
  config: MPL-2.0
```

or:

```yml
license:
  config: [
      "MIT",
      "MPL-2.0"
    ]
```

## Ingnoring Packages

```yml
license:
  ignore: [
      "foo-pkg"
    ]
```

## Restrictions

Assumes files are in the `cwd`.

## Architecture

- `src` is es6+ syntax compiled with [babel](https://babeljs.io)
- `lib` generated js library

## Hacking

    cd vile-license
    npm install
    npm run dev
    npm test
