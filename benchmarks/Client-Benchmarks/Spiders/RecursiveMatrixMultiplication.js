Object.defineProperty(exports, "__esModule", { value: true });
const benchUtils_1 = require("../../benchUtils");
/**
 * Created by flo on 31/01/2017.
 */
var spiders = require("../../../src/spiders");
class Worker extends spiders.Actor {
    constructor() {
        super(...arguments);
        this.threshold = null;
        this.dataLength = null;
        this.id = null;
        this.masterRef = null;
        this.A = {};
        this.B = {};
        this.C = {};
    }
    config(masterRef, id, threshold, dataLength) {
        this.threshold = threshold;
        this.masterRef = masterRef;
        this.id = id;
        this.dataLength = dataLength;
        var localA = {};
        var localB = {};
        var localC = {};
        for (var i = 0; i < dataLength; i++) {
            localA[i] = {};
            localB[i] = {};
            localC[i] = {};
            for (var j = 0; j < dataLength; j++) {
                localA[i][j] = i;
                localB[i][j] = j;
                localC[i][j] = 0;
            }
        }
        this.A = localA;
        this.B = localB;
        this.C = localC;
        this.parent.actorInit();
    }
    work(priority, srA, scA, srB, scB, srC, scC, numBlocks, dim) {
        var newPriority = priority + 1;
        if (numBlocks > this.threshold) {
            var zerDim = 0;
            var newDim = dim / 2;
            var newNumBlocks = numBlocks / 4;
            this.masterRef.sendWork(newPriority, srA + zerDim, scA + zerDim, srB + zerDim, scB + zerDim, srC + zerDim, scC + zerDim, newNumBlocks, newDim);
            this.masterRef.sendWork(newPriority, srA + zerDim, scA + newDim, srB + newDim, scB + zerDim, srC + zerDim, scC + zerDim, newNumBlocks, newDim);
            this.masterRef.sendWork(newPriority, srA + zerDim, scA + zerDim, srB + zerDim, scB + newDim, srC + zerDim, scC + newDim, newNumBlocks, newDim);
            this.masterRef.sendWork(newPriority, srA + zerDim, scA + newDim, srB + newDim, scB + newDim, srC + zerDim, scC + newDim, newNumBlocks, newDim);
            this.masterRef.sendWork(newPriority, srA + newDim, scA + zerDim, srB + zerDim, scB + zerDim, srC + newDim, scC + zerDim, newNumBlocks, newDim);
            this.masterRef.sendWork(newPriority, srA + newDim, scA + newDim, srB + newDim, scB + zerDim, srC + newDim, scC + zerDim, newNumBlocks, newDim);
            this.masterRef.sendWork(newPriority, srA + newDim, scA + zerDim, srB + zerDim, scB + newDim, srC + newDim, scC + newDim, newNumBlocks, newDim);
            this.masterRef.sendWork(newPriority, srA + newDim, scA + newDim, srB + newDim, scB + newDim, srC + newDim, scC + newDim, newNumBlocks, newDim);
        }
        else {
            var endR = srC + dim;
            var endC = scC + dim;
            var i = srC;
            while (i < endR) {
                var j = scC;
                while (j < endC) {
                    var k = 0;
                    while (k < dim) {
                        this.C[i][j] += this.A[i][scA + k] * this.B[srB + k][j];
                        k += 1;
                    }
                    j += 1;
                }
                i += 1;
            }
        }
        this.masterRef.done();
    }
    stop() {
        this.masterRef.stop();
    }
}
class Master extends spiders.Actor {
    constructor() {
        super(...arguments);
        this.numWorkers = null;
        this.dataLength = null;
        this.workers = [];
        this.numWorkersTerminated = 0;
        this.numWorkSent = 0;
        this.numWorkCompleted = 0;
    }
    config(numWorkers, dataLength) {
        this.numWorkers = numWorkers;
        this.dataLength = dataLength;
    }
    newWorker(workerRef, id) {
        this.workers[id] = workerRef;
    }
    configDone() {
        this.parent.actorInit();
    }
    start() {
        var numBlocks = this.dataLength * this.dataLength;
        this.sendWork(0, 0, 0, 0, 0, 0, 0, numBlocks, this.dataLength);
    }
    sendWork(priority, srA, scA, srB, scB, srC, scC, numBlocks, dim) {
        var workerIndex = (srC + scC) % this.numWorkers;
        this.workers[workerIndex].work(priority, srA, scA, srB, scB, srC, scC, numBlocks, dim);
        this.numWorkSent += 1;
    }
    done() {
        this.numWorkCompleted += 1;
        if (this.numWorkCompleted == this.numWorkSent) {
            this.workers.forEach((worker) => {
                worker.stop();
            });
        }
    }
    stop() {
        this.numWorkersTerminated += 1;
        if (this.numWorkersTerminated == this.numWorkers) {
            this.parent.end();
        }
    }
}
class RecursiveMatrixMultiplicationApp extends spiders.Application {
    constructor(bench) {
        super();
        this.actorsInitialised = 0;
        this.bench = bench;
    }
    setup() {
        this.masterRef = this.spawnActor(Master);
        this.masterRef.config(benchUtils_1.BenchConfig.matMulWorkers, benchUtils_1.BenchConfig.matMulDataLength);
        var id = 0;
        for (var i = 0; i < benchUtils_1.BenchConfig.matMulWorkers; i++) {
            var workerRef = this.spawnActor(Worker);
            this.masterRef.newWorker(workerRef, id);
            workerRef.config(this.masterRef, id, benchUtils_1.BenchConfig.matMulThreshold, benchUtils_1.BenchConfig.matMulDataLength);
            id += 1;
        }
        this.masterRef.configDone();
    }
    checkConfig() {
        if (this.actorsInitialised == benchUtils_1.BenchConfig.matMulWorkers + 1) {
            this.masterRef.start();
        }
    }
    actorInit() {
        this.actorsInitialised += 1;
        this.checkConfig();
    }
    end() {
        this.bench.stopPromise.resolve();
    }
}
class SpiderRecursiveMatrixMultiplicationBench extends benchUtils_1.SpiderBenchmark {
    constructor() {
        super("Spiders.js Recursive Matrix Multiplication", "Spiders.js Recursive Matrix Multiplication cycle completed", "Spiders.js Recursive Matrix Multiplication completed", "Spiders.js Recursive Matrix Multiplication scheduled");
    }
    runBenchmark() {
        this.recursiveMatrixMultiplicationApp = new RecursiveMatrixMultiplicationApp(this);
        this.recursiveMatrixMultiplicationApp.setup();
    }
    cleanUp() {
        this.recursiveMatrixMultiplicationApp.kill();
    }
}
exports.SpiderRecursiveMatrixMultiplicationBench = SpiderRecursiveMatrixMultiplicationBench;
//# sourceMappingURL=RecursiveMatrixMultiplication.js.map