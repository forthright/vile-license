mimus = require "mimus"
license = mimus.require "./../lib", __dirname, []
chai = require "./helpers/sinon_chai"
vile = mimus.get license, "vile"
expect = chai.expect

# TODO:
