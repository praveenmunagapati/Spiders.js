const benchUtils_1 = require("../../../benchUtils");
/**
 * Created by flo on 25/01/2017.
 */
class NatBigBench extends benchUtils_1.SpiderBenchmark {
    constructor() {
        super("Native Big", "Native Big cycle completed", "Native Big completed", "Native Big scheduled");
        this.actors = [];
    }
    runBenchmark() {
        var actorsInitialised = 0;
        var that = this;
        function sysHandler(event) {
            function checkConfig() {
                if (actorsInitialised == benchUtils_1.BenchConfig.bigActors + 1) {
                    for (var i in that.actors) {
                        that.actors[i].postMessage(["pong"]);
                    }
                }
            }
            function actorInit() {
                actorsInitialised += 1;
                checkConfig();
            }
            function end() {
                that.stopPromise.resolve();
            }
            switch (event.data[0]) {
                case "actorInit":
                    actorInit();
                    break;
                case "end":
                    end();
                    break;
                default:
                    console.log("Unknown message: " + event.data[0]);
            }
        }
        that.sinkRef = this.spawnWorker(require('./BigSink.js'));
        that.sinkRef.onmessage = sysHandler;
        var count = benchUtils_1.BenchConfig.bigActors;
        while (count > 0) {
            var newActor = this.spawnWorker(require('./BigActor.js'));
            newActor.onmessage = sysHandler;
            that.actors.push(newActor);
            count -= 1;
        }
        for (var i in that.actors) {
            var sinkChan = new MessageChannel();
            var current = that.actors[i];
            current.postMessage(["setSink"], [sinkChan.port1]);
            that.sinkRef.postMessage(["neighbour", benchUtils_1.BenchConfig.bigActors], [sinkChan.port2]);
            for (var j in that.actors) {
                var next = that.actors[j];
                var nextChan = new MessageChannel();
                if (i != j) {
                    current.postMessage(["neighbour", benchUtils_1.BenchConfig.bigActors, benchUtils_1.BenchConfig.bigPings], [nextChan.port1]);
                    next.postMessage(["link"], [nextChan.port2]);
                }
            }
        }
    }
    cleanUp() {
        this.actors.push(this.sinkRef);
        this.cleanWorkers(this.actors);
        this.actors = [];
    }
}
exports.NatBigBench = NatBigBench;
//# sourceMappingURL=BigMain.js.map