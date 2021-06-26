var should = require("should");
var helper = require("node-red-node-test-helper");
var blynkClient = require("../nodes/blynk-iot-client.js");
var blynkWriteIn = require("../nodes/blynk-iot-in-write.js");
/*
console.log("### should #########################################");
console.log(should);
console.log("### helper #########################################");
console.log(helper);
console.log("### blynkClient ####################################");
console.log(blynkClient);
console.log("### end ############################################");

*/
helper.init(require.resolve('node-red'));

describe('blynk-iot-client Node', function () {

  beforeEach(function (done) {
      helper.startServer(done);
  });

  afterEach(function (done) {
      helper.unload();
      helper.stopServer(done);
  });

  it('should be loaded', function (done) {
    this.timeout(10000);
    var flow = [{ id: "n1", type: "blynk-write-in", name: "Write in", client: "n2" },{ id: "n2", type: "blynk-iot-client", name: "Cloud Blynk" }];
    helper.load([blynkWriteIn, blynkClient], flow, function () {
      var n1 = helper.getNode("n1");
      console.log(n1);
      n1.should.have.property('name', 'Write in');
      done();
    });
  });

  /*
  it('should make payload lower case', function (done) {
    var flow = [
      { id: "n1", type: "lower-case", name: "lower-case",wires:[["n2"]] },
      { id: "n2", type: "helper" }
    ];
    helper.load(lowerNode, flow, function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      n2.on("input", function (msg) {
        msg.should.have.property('payload', 'uppercase');
        done();
      });
      n1.receive({ payload: "UpperCase" });
    });
  });*/
});