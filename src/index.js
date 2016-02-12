let vile = require("@forthright/vile")
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
let check_npm = (allowed, ignored, disallowed) => {
  let is_allowed = (list) =>
    _.any(list, (l) => _.any(allowed, (match) =>
      new RegExp("(^|\\s+)" + l + "(\\s+|$)", "i").test(match))) &&
      !_.any(list, (l) => _.any(disallowed, (match) =>
        new RegExp("(^|\\s+)" + l + "(\\s+|$)", "i").test(match)))

  let pkg_is_ignored = (pkg) => _.any(ignored, (i) => pkg == i)

  return new Promise((resolve, reject) => {
    if (fs.existsSync(NPM_FILE)) {
      // TODO: this module logs "scanning" to console
      npm_license.init({ start: process.cwd() }, (json) => {
        resolve(_.reject(_.map(json || [], (info, dep) => {
          let licenses = typeof info.licenses == "string" ?
            info.licenses.split("/") :
            info.licenses || [UNKNOWN_LICENSE]
          let data = dep.split("@")
          let name = data.length == 2 ? data[0] : data[1]
          let version = data.length == 2 ? data[1] : data[2]

          if (is_allowed(licenses) || pkg_is_ignored(name)) return

          let licenses_str = _.trim(licenses.join(", "))

          return vile.issue({
            type: vile.DEP,
            path: NPM_FILE,
            title: "Possible license violation",
            message: `${name} (v${version}) is licensed under ${licenses_str}`,
            signature: `license::${name}::${version}::${licenses_str}`,
            dependency: {
              name: name,
              current: version
            }
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
let check_bower = (allowed, ignored, disallowed) => {
  let is_allowed = (list) =>
    _.any(list, (l) => _.any(allowed, (match) =>
      new RegExp("(^|\\s+)" + l + "(\\s+|$)", "i").test(match))) &&
      !_.any(list, (l) => _.any(disallowed, (match) =>
        new RegExp("(^|\\s+)" + l + "(\\s+|$)", "i").test(match)))

  let pkg_is_ignored = (pkg) => _.any(ignored, (i) => pkg == i)

  return new Promise((resolve, reject) => {
    if (fs.existsSync(BOWER_FILE)) {
      bower_license.init(process.cwd(), (licenseMap) => {
        let issues = _.reject(_.map(licenseMap || [], (info, dep) => {
          if (typeof info.licenses == "string") info.licenses = [ info.licenses ]

          let name = dep.split("@")[0]
          let version = dep.split("@")[1]
          let licenses = _.get(info, "licenses", [])

          if (is_allowed(licenses) || pkg_is_ignored(name)) return

          let licenses_str = _.trim(licenses.join(", "))

          return vile.issue({
            type: vile.DEP,
            path: BOWER_FILE,
            title: "Possible license violation",
            message: `${name} (v${version}) is licensed under ${licenses_str}`,
            signature: `license::${name}::${version}::${licenses_str}`,
            dependency: {
              name: name,
              current: version
            }
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

  let disallowed = _.get(plugin_config, "config.disallowed",  [])
  if (typeof disallowed == "string") disallowed = [disallowed]

  let ignored = _.get(plugin_config, "config.ignored",  [])
  if (typeof ignored == "string") ignored = [ignored]

  return Promise.all([
    check_npm(allowed, ignored, disallowed),
    check_bower(allowed, ignored, disallowed)
  ]).then(_.flatten)
}

module.exports = {
  punish: punish
}
