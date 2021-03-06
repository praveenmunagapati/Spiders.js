const benchUtils_1 = require("../../../benchUtils");
/**
 * Created by flo on 26/01/2017.
 */
class NatFacilityLocationBench extends benchUtils_1.SpiderBenchmark {
    constructor() {
        super("Native Facility Location", "Native Facility Location cycle completed", "Native Facility Location completed", "Native Facility Location scheduled");
        this.spawned = [];
    }
    runBenchmark() {
        var actorsInitialised = 0;
        var totalSpawned = 2;
        var actorsExited = 0;
        var that = this;
        function sysHandle(event) {
            function checkConfig() {
                if (actorsInitialised == 2) {
                    that.prodRef.postMessage(["produceConsumer"]);
                }
            }
            function actorInit() {
                actorsInitialised += 1;
                checkConfig();
            }
            function actorExit() {
                actorsExited += 1;
                if (actorsExited == totalSpawned) {
                    that.stopPromise.resolve();
                }
            }
            function spawnQuad(parent, index, positionToParent, bx1, by1, bx2, by2, threshold, depth, initKnownFacilities, initMaxDepthOpenFac) {
                var c = new MessageChannel();
                parent.postMessage(["childQuadSpawned", index], [c.port2]);
                var ref = that.spawnWorker(require('./FacilityLocationQuadrant.js'));
                that.spawned.push(ref);
                ref.onmessage = sysHandle;
                ref.postMessage(["config", false, positionToParent, bx1, by1, bx2, by2, threshold, depth, initKnownFacilities, initMaxDepthOpenFac], [c.port1]);
                totalSpawned += 1;
            }
            switch (event.data[0]) {
                case "actorInit":
                    actorInit();
                    break;
                case "actorExit":
                    actorExit();
                    break;
                case "spawnQuad":
                    spawnQuad(event.ports[0], event.data[1], event.data[2], event.data[3], event.data[4], event.data[5], event.data[6], event.data[7], event.data[8], event.data[9], event.data[10]);
                    break;
                default:
                    console.log("Unknown message (System): " + event.data[0]);
            }
        }
        var threshold = benchUtils_1.BenchConfig.facLocAlpha * benchUtils_1.BenchConfig.facLocF;
        that.quadRef = that.spawnWorker(require('./FacilityLocationQuadrant.js'));
        that.quadRef.onmessage = sysHandle;
        that.quadRef.postMessage(["config", true, "ROOT", 0, 0, benchUtils_1.BenchConfig.facLocGridSize, benchUtils_1.BenchConfig.facLocGridSize, threshold, 0, 1, -1]);
        that.quadRef.postMessage(["configDone", false]);
        that.prodRef = that.spawnWorker(require('./FacilityLocationProducer.js'));
        that.prodRef.onmessage = sysHandle;
        var chan = new MessageChannel();
        that.quadRef.postMessage(["link"], [chan.port2]);
        that.prodRef.postMessage(["config", benchUtils_1.BenchConfig.facLocGridSize, benchUtils_1.BenchConfig.facLocNumPoints], [chan.port1]);
    }
    cleanUp() {
        this.spawned.push(this.quadRef, this.prodRef);
        this.cleanWorkers(this.spawned);
        this.spawned = [];
    }
}
exports.NatFacilityLocationBench = NatFacilityLocationBench;
//# sourceMappingURL=FacilityLocationMain.js.map