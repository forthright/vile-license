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
// See .vile.yml
var no_issue = function no_issue(file) {
  return [vile.issue(vile.OK, file)];
};

// TODO: DRY two methods

//'yargs@3.5.4':
//   { licenses: 'MIT/X11',
//        repository: 'https://github.com/bcoe/yargs',
//             licenseFile: '/home/brent/src/vile/node_modules/
//             jade/node_modules/uglify-js/node_modules/yargs/LICENSE' } }
var check_npm = function check_npm(allowed, ignored_packages) {
  var is_allowed = function is_allowed(list) {
    return _.any(list, function (l) {
      return _.includes(allowed, l.toLowerCase());
    });
  };

  var is_ignored = function is_ignored(name) {
    return _.any(ignored_packages, function (n) {
      return n == name;
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

          // TODO: not here
          if (is_allowed(licenses) || is_ignored(name)) return;

          return vile.issue(vile.WARNING, NPM_FILE, name + " (v" + version + ") is licensed " + ("under " + _.trim(licenses.join(", "))));
        }), function (issue) {
          return !issue;
        }));
      });
    } else {
      resolve(no_issue(NPM_FILE));
    }
  });
};

//{ 'jquery@2.1.4': { licenses: [ 'MIT' ] },
//  'pure@0.6.0': { licenses: [ 'BSD*' ] } }
var check_bower = function check_bower(allowed, ignored_packages) {
  var is_allowed = function is_allowed(list) {
    return _.any(list, function (l) {
      return _.includes(allowed, l.toLowerCase());
    });
  };

  var is_ignored = function is_ignored(name) {
    return _.any(ignored_packages, function (n) {
      return n == name;
    });
  };

  return new Promise(function (resolve, reject) {
    if (fs.existsSync(BOWER_FILE)) {
      bower_license.init(process.cwd(), function (licenseMap) {
        var issues = _.reject(_.map(licenseMap || [], function (info, dep) {
          if (typeof info.licenses == "string") info.licenses = [info.licenses];

          var name = dep.split("@")[0];
          var version = dep.split("@")[1];
          var licenses = _.trim(_.get(info, "licenses", []).join(", "));

          // TODO not here
          if (is_allowed(info.licenses) || is_ignored(name)) return;

          return vile.issue(vile.WARNING, BOWER_FILE, name + " (v" + version + ") is licensed under " + licenses);
        }), function (issue) {
          return !issue;
        });

        resolve(issues);
      });
    } else {
      resolve(no_issue(BOWER_FILE));
    }
  });
};

// TODO: support ignoring licence types (and for project names)
var punish = function punish(plugin_config) {
  // TODO: don't do this (rename var)
  var allowed = plugin_config.config || [];
  if (typeof allowed == "string") allowed = [allowed];
  allowed = _.map(allowed, function (a) {
    return a.toLowerCase();
  });

  var ignored = plugin_config.ignore || [];
  if (typeof ignored == "string") ignored = [ignored];
  ignored = _.map(ignored, function (a) {
    return a.toLowerCase();
  });

  return Promise.all([check_npm(allowed, ignored), check_bower(allowed, ignored)]).then(_.flatten);
};

module.exports = {
  punish: punish
};