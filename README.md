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
    allowed:
      - MIT
      - MPL-2.0
```

Note: Strings are **partially** matched, so be explicit (ex `MPL-2.0`)
and use both whitelisting and blacklisting if you want to be sure you
don't have a false positive.

### Blacklisting

```yml
license:
  config:
    disallowed:
      - Something
```

### Ignoring

You can ignore specific packages as well.

```yml
license:
  config:
    ignored:
      - some-pkg
```

### Restrictions

Assumes files are in the `cwd`.

## Vile Types Generated

Generates `vile.SEC` for each license violation.

## Versioning

This project ascribes to [semantic versioning](http://semver.org).

## Licensing

This project is licensed under the [MPL-2.0](LICENSE) license.

Any contributions made to this project are made under the current license.

## Contributions

Current list of [Contributors](https://github.com/forthright/vile-license/graphs/contributors).

Any contributions are welcome and appreciated!

All you need to do is submit a [Pull Request](https://github.com/forthright/vile-license/pulls).

1. Please consider tests and code quality before submitting.
2. Please try to keep commits clean, atomic and well explained (for others).

### Issues

Current issue tracker is on [GitHub](https://github.com/forthright/vile-license/issues).

Even if you are uncomfortable with code, an issue or question is welcome.

### Code Of Conduct

This project ascribes to [contributor-covenant.org](http://contributor-covenant.org).

By participating in this project you agree to our [Code of Conduct](CODE_OF_CONDUCT.md).

### Maintainers

- Brent Lintner - [@brentlintner](http://github.com/brentlintner)

## Architecture

- `src` is es6+ syntax compiled with [babel](https://babeljs.io)
- `lib` generated js library

## Hacking

    cd vile-license
    npm install
    npm run dev
    npm test
