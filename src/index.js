let vile = require("@brentlintner/vile")
let _ = require("lodash")
let fs = require("fs")
let bower_license = require("bower-license")
let npm_license = require("license-checker")
let Promise = require("bluebird")

const BOWER_FILE = "bower.json"
const NPM_FILE = "package.json"
const UNKNOWN_LICENSE = "UNKNOWN"

// TODO: Support parsing various grammars
// TODO: DRY two methods

//'yargs@3.5.4':
//   { licenses: 'MIT/X11',
//        repository: 'https://github.com/bcoe/yargs',
//             licenseFile: '/home/brent/src/vile/node_modules/
//             jade/node_modules/uglify-js/node_modules/yargs/LICENSE' } }
let check_npm = (allowed, ignored) => {
  let is_allowed = (list) => _.
    any(list, (l) => _.any(allowed, (match) => {
      (new RegExp(match, "i")).test(l)
    }))

  let is_ignored = (list) => _.
    any(list, (l) => _.any(ignored, (match) => {
      (new RegExp(match, "i")).test(l)
    }))

  return new Promise((resolve, reject) => {
    if (fs.existsSync(NPM_FILE)) {
      // TODO: this module logs "scanning" to console
      npm_license.init({ start: process.cwd() }, (json) => {
        resolve(_.reject(_.map(json || [], (info, dep) => {
          let licenses = typeof info.licenses == "string" ?
            info.licenses.split("/") :
            info.licenses || [UNKNOWN_LICENSE]
          let name = dep.split("@")[0]
          let version = dep.split("@")[1]

          if (is_allowed(licenses) && !is_ignored(licenses)) return

          let licenses_str = _.trim(licenses.join(", "))

          return vile.issue({
            type: vile.DEP,
            path: NPM_FILE,
            title: "Possible license violation",
            name: name,
            current: version,
            message: `${name} (v${version}) is licensed under ${licenses_str}`,
            signature: `license::${name}::${version}::${licenses_str}`
          })
        }), (issue) => !issue))
      })
    } else {
      resolve([])
    }
  })
}

//{ 'jquery@2.1.4': { licenses: [ 'MIT' ] },
//  'pure@0.6.0': { licenses: [ 'BSD*' ] } }
let check_bower = (allowed, ignored) => {
  let is_allowed = (list) => _.
    any(list, (l) => _.any(allowed, (match) => {
      (new RegExp(match, "i")).test(l)
    }))

  let is_ignored = (list) => _.
    any(list, (l) => _.any(ignored, (match) => {
      (new RegExp(match, "i")).test(l)
    }))

  return new Promise((resolve, reject) => {
    if (fs.existsSync(BOWER_FILE)) {
      bower_license.init(process.cwd(), (licenseMap) => {
        let issues = _.reject(_.map(licenseMap || [], (info, dep) => {
          if (typeof info.licenses == "string") info.licenses = [ info.licenses ]

          let name = dep.split("@")[0]
          let version = dep.split("@")[1]
          let licenses = _.get(info, "licenses", [])

          if (is_allowed(licenses) && !is_ignored(licenses)) return

          let licenses_str = _.trim(licenses.join(", "))

          return vile.issue({
            type: vile.DEP,
            path: BOWER_FILE,
            title: "Possible license violation",
            name: name,
            current: version,
            message: `${name} (v${version}) is licensed under ${licenses_str}`,
            signature: `license::${name}::${version}::${licenses_str}`
          })
        }), (issue) => !issue)

        resolve(issues)
      })
    } else {
      resolve([])
    }
  })
}

// TODO: support ignoring licence types (and for project names)
let punish = (plugin_config) => {
  // TODO: don't do this (rename var)
  let allowed = _.get(plugin_config, "config.allowed",  [])
  if (typeof allowed == "string") allowed = [allowed]
  allowed = _.map(allowed, (a) => a.toLowerCase())

  let ignored = _.get(plugin_config, "config.disallowed",  [])
  if (typeof ignored == "string") ignored = [ignored]
  ignored = _.map(ignored, (a) => a.toLowerCase())

  return Promise.all([
    check_npm(allowed, ignored),
    check_bower(allowed, ignored)
  ]).then(_.flatten)
}

module.exports = {
  punish: punish
}
