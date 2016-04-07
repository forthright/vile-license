"use strict";

var vile = require("@forthright/vile");
var _ = require("lodash");
var fs = require("fs");
var bower_license = require("bower-license");
var npm_license = require("license-checker");
var Promise = require("bluebird");

var BOWER_FILE = "bower.json";
var NPM_FILE = "package.json";
var UNKNOWN_LICENSE = "UNKNOWN";

var npm_licenses = function npm_licenses(is_allowed, pkg_is_ignored) {
  return new Promise(function (resolve, reject) {
    if (!fs.existsSync(NPM_FILE)) {
      resolve([]);
      return;
    }

    // TODO: this module logs "scanning" to console
    npm_license.init({ start: process.cwd() }, function (json) {
      var npm_issues = _.reject(_.map(json || [], function (info, dep) {
        var licenses = typeof info.licenses == "string" ? info.licenses.split("/") : info.licenses || UNKNOWN_LICENSE;

        if (_.isString(licenses)) licenses = [licenses];

        var data = dep.split("@");
        var name = data.length == 2 ? data[0] : data[1];
        var version = data.length == 2 ? data[1] : data[2];

        if (is_allowed(licenses) || pkg_is_ignored(name)) return;

        var licenses_str = _.trim(licenses.join(", "));

        return vile.issue({
          type: vile.SEC,
          path: NPM_FILE,
          title: "Possible license violation",
          message: name + " (v" + version + ") is licensed under " + licenses_str,
          signature: "license::" + name + "::" + version + "::" + licenses_str
        });
      }), function (issue) {
        return !issue;
      });

      resolve(npm_issues);
    });
  });
};

var bower_licenses = function bower_licenses(is_allowed, pkg_is_ignored) {
  return new Promise(function (resolve, reject) {
    if (!fs.existsSync(BOWER_FILE)) {
      resolve([]);
      return;
    }

    bower_license.init(process.cwd(), function (licenseMap) {
      var bower_issues = _.reject(_.map(licenseMap || [], function (info, dep) {
        if (_.isString(info.licenses)) info.licenses = [info.licenses];

        var name = dep.split("@")[0];
        var version = dep.split("@")[1];
        var licenses = _.get(info, "licenses", []);

        if (is_allowed(licenses) || pkg_is_ignored(name)) return;

        var licenses_str = _.trim(licenses.join(", "));

        return vile.issue({
          type: vile.SEC,
          path: BOWER_FILE,
          title: "Possible license violation",
          message: name + " (v" + version + ") is licensed under " + licenses_str,
          signature: "license::" + name + "::" + version + "::" + licenses_str
        });
      }), function (issue) {
        return !issue;
      });

      resolve(bower_issues);
    });
  });
};

var check = function check(allowed, ignored_pkgs, disallowed) {
  var is_allowed = function is_allowed(list) {
    return _.some(list, function (l) {
      return _.some(allowed, function (match) {
        return new RegExp("(^|\\s+)" + l + "(\\s+|$)", "i").test(match);
      });
    }) && !_.some(list, function (l) {
      return _.some(disallowed, function (match) {
        return new RegExp("(^|\\s+)" + l + "(\\s+|$)", "i").test(match);
      });
    });
  };

  var pkg_is_ignored = function pkg_is_ignored(pkg) {
    return _.some(ignored_pkgs, function (i) {
      return pkg == i;
    });
  };

  return Promise.all([npm_licenses(is_allowed, pkg_is_ignored), bower_licenses(is_allowed, pkg_is_ignored)]).then(_.flatten);
};

var parse_config_item = function parse_config_item(key, plugin_config) {
  var item = _.get(plugin_config, "config." + key, []);
  if (typeof item == "string") item = [item];
  return item;
};

// TODO: support ignoring licence types (and for project names)
var punish = function punish(plugin_config) {
  return check(parse_config_item("allowed", plugin_config), parse_config_item("ignored", plugin_config), parse_config_item("disallowed", plugin_config));
};

module.exports = {
  punish: punish
};