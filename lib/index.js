"use strict";

var vile = require("@brentlintner/vile");
var _ = require("lodash");
var fs = require("fs");
var bower_license = require("bower-license");
var npm_license = require("license-checker");
var Promise = require("bluebird");

var BOWER_FILE = "bower.json";
var NPM_FILE = "package.json";
var UNKNOWN_LICENSE = "UNKNOWN";

// TODO: Support parsing various grammars
// TODO: DRY two methods

//'yargs@3.5.4':
//   { licenses: 'MIT/X11',
//        repository: 'https://github.com/bcoe/yargs',
//             licenseFile: '/home/brent/src/vile/node_modules/
//             jade/node_modules/uglify-js/node_modules/yargs/LICENSE' } }
var check_npm = function check_npm(allowed, ignored) {
  var is_allowed = function is_allowed(list) {
    return _.any(list, function (l) {
      return _.includes(allowed, l.toLowerCase());
    });
  };

  var is_ignored = function is_ignored(list) {
    return _.any(list, function (l) {
      return _.includes(ignored, l.toLowerCase());
    });
  };

  return new Promise(function (resolve, reject) {
    if (fs.existsSync(NPM_FILE)) {
      // TODO: this module logs "scanning" to console
      npm_license.init({ start: process.cwd() }, function (json) {
        resolve(_.reject(_.map(json || [], function (info, dep) {
          var licenses = typeof info.licenses == "string" ? info.licenses.split("/") : info.licenses || [UNKNOWN_LICENSE];
          var name = dep.split("@")[0];
          var version = dep.split("@")[1];

          if (is_allowed(licenses) && !is_ignored(licenses)) return;

          var licenses_str = _.trim(licenses.join(", "));

          return vile.issue({
            type: vile.DEP,
            path: NPM_FILE,
            title: "Possible license violation",
            name: name,
            current: version,
            message: name + " (v" + version + ") is licensed under " + licenses_str,
            signature: "license::" + name + "::" + version + "::" + licenses_str
          });
        }), function (issue) {
          return !issue;
        }));
      });
    } else {
      resolve([]);
    }
  });
};

//{ 'jquery@2.1.4': { licenses: [ 'MIT' ] },
//  'pure@0.6.0': { licenses: [ 'BSD*' ] } }
var check_bower = function check_bower(allowed, ignored) {
  var is_allowed = function is_allowed(list) {
    return _.any(list, function (l) {
      return _.includes(allowed, l.toLowerCase());
    });
  };

  var is_ignored = function is_ignored(list) {
    return _.any(list, function (l) {
      return _.includes(ignored, l.toLowerCase());
    });
  };

  return new Promise(function (resolve, reject) {
    if (fs.existsSync(BOWER_FILE)) {
      bower_license.init(process.cwd(), function (licenseMap) {
        var issues = _.reject(_.map(licenseMap || [], function (info, dep) {
          if (typeof info.licenses == "string") info.licenses = [info.licenses];

          var name = dep.split("@")[0];
          var version = dep.split("@")[1];
          var licenses = _.get(info, "licenses", []);

          if (is_allowed(licenses) && !is_ignored(licenses)) return;

          var licenses_str = _.trim(licenses.join(", "));

          return vile.issue({
            type: vile.DEP,
            path: BOWER_FILE,
            title: "Possible license violation",
            name: name,
            current: version,
            message: name + " (v" + version + ") is licensed under " + licenses_str,
            signature: "license::" + name + "::" + version + "::" + licenses_str
          });
        }), function (issue) {
          return !issue;
        });

        resolve(issues);
      });
    } else {
      resolve([]);
    }
  });
};

// TODO: support ignoring licence types (and for project names)
var punish = function punish(plugin_config) {
  // TODO: don't do this (rename var)
  var allowed = _.get(plugin_config, "config.allowed", []);
  if (typeof allowed == "string") allowed = [allowed];
  allowed = _.map(allowed, function (a) {
    return a.toLowerCase();
  });

  var ignored = _.get(plugin_config, "config.disallowed", []);
  if (typeof ignored == "string") ignored = [ignored];
  ignored = _.map(ignored, function (a) {
    return a.toLowerCase();
  });

  return Promise.all([check_npm(allowed, ignored), check_bower(allowed, ignored)]).then(_.flatten);
};

module.exports = {
  punish: punish
};