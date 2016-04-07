let vile = require("@forthright/vile")
let _ = require("lodash")
let fs = require("fs")
let bower_license = require("bower-license")
let npm_license = require("license-checker")
let Promise = require("bluebird")

const BOWER_FILE = "bower.json"
const NPM_FILE = "package.json"
const UNKNOWN_LICENSE = "UNKNOWN"

let npm_licenses = (is_allowed, pkg_is_ignored) =>
  new Promise((resolve, reject) => {
    if (!fs.existsSync(NPM_FILE)) {
      resolve([])
      return
    }

    // TODO: this module logs "scanning" to console
    npm_license.init({ start: process.cwd() }, (json) => {
      let npm_issues = _.reject(_.map(json || [], (info, dep) => {
        let licenses = typeof info.licenses == "string" ?
          info.licenses.split("/") :
          info.licenses || UNKNOWN_LICENSE

        if (_.isString(licenses)) licenses = [licenses]

        let data = dep.split("@")
        let name = data.length == 2 ? data[0] : data[1]
        let version = data.length == 2 ? data[1] : data[2]

        if (is_allowed(licenses) || pkg_is_ignored(name)) return

        let licenses_str = _.trim(licenses.join(", "))

        return vile.issue({
          type: vile.SEC,
          path: NPM_FILE,
          title: "Possible license violation",
          message: `${name} (v${version}) is licensed under ${licenses_str}`,
          signature: `license::${name}::${version}::${licenses_str}`
        })
      }), (issue) => !issue)

      resolve(npm_issues)
    })
  })

let bower_licenses = (is_allowed, pkg_is_ignored) =>
  new Promise((resolve, reject) => {
    if (!fs.existsSync(BOWER_FILE)) {
      resolve([])
      return
    }

    bower_license.init(process.cwd(), (licenseMap) => {
      let bower_issues = _.reject(_.map(licenseMap || [], (info, dep) => {
        if (_.isString(info.licenses)) info.licenses = [ info.licenses ]

        let name = dep.split("@")[0]
        let version = dep.split("@")[1]
        let licenses = _.get(info, "licenses", [])

        if (is_allowed(licenses) || pkg_is_ignored(name)) return

        let licenses_str = _.trim(licenses.join(", "))

        return vile.issue({
          type: vile.SEC,
          path: BOWER_FILE,
          title: "Possible license violation",
          message: `${name} (v${version}) is licensed under ${licenses_str}`,
          signature: `license::${name}::${version}::${licenses_str}`
        })
      }), (issue) => !issue)

      resolve(bower_issues)
    })
  })

let check = (allowed, ignored_pkgs, disallowed) => {
  let is_allowed = (list) =>
    _.some(list, (l) => _.some(allowed, (match) =>
      new RegExp("(^|\\s+)" + l + "(\\s+|$)", "i").test(match))) &&
      !_.some(list, (l) => _.some(disallowed, (match) =>
        new RegExp("(^|\\s+)" + l + "(\\s+|$)", "i").test(match)))

  let pkg_is_ignored = (pkg) => _.some(ignored_pkgs, (i) => pkg == i)

  return Promise.all([
    npm_licenses(is_allowed, pkg_is_ignored),
    bower_licenses(is_allowed, pkg_is_ignored)
  ]).then(_.flatten)
}

let parse_config_item = (key, plugin_config) => {
  let item = _.get(plugin_config, `config.${key}`,  [])
  if (typeof item == "string") item = [item]
  return item
}

// TODO: support ignoring licence types (and for project names)
let punish = (plugin_config) => check(
  parse_config_item("allowed", plugin_config),
  parse_config_item("ignored", plugin_config),
  parse_config_item("disallowed", plugin_config))

module.exports = {
  punish: punish
}
