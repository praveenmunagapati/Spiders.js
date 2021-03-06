import {SpiderLib} from "../../../src/spiders";
import {SpiderBenchmark, BenchConfig} from "../../benchUtils";
/**
 * Created by flo on 02/02/2017.
 */
var spiders : SpiderLib = require("../../../src/spiders")

class Worker extends spiders.Actor{
    masterRef   = null
    id          = null
    threshold   = null
    size        = null

    config(masterRef,id,threshold,size) {
        this.masterRef = masterRef
        this.id = id
        this.threshold = threshold
        this.size = size
        this.parent.actorInit()
    }

    arraycopy(a1,start1,a2,start2,until) {
        var index = start2
        for (var i = start1; i < until; i++) {
            a2[index] = a1[i]
            index += 1
        }
    }

    boardValid(depth,data) {
        var p = 0
        var q = 0
        for (var i = 0; i < depth; i++) {
            p = data[i]
            for (var j = (i + 1); j < data; j++) {
                q = data[j]
                if (q == p || q == p - (j - i) || q == p + (j - 1)) {
                    return false
                }
            }
        }
        return true
    }

    workSequential(data,depth) {
        if (this.size == depth) {
            this.masterRef.result()
        }
        else {
            var b = []
            for (var i = 0; i < depth + 1; i++) {
                b[i] = 0
            }
            var j = 0
            while (j < this.size) {
                this.arraycopy(data, 0, b,0, depth)
                b[depth] = j
                if (this.boardValid((depth + 1), b)) {
                    this.workSequential(b, (depth + 1))
                }
                else{

                }
                j += 1
            }
        }
    }

    work(priority,data,depth) {
        if (this.size == depth) {
            this.masterRef.result()
        }
        else if (depth >= this.threshold) {
            this.workSequential(data, depth)
        }
        else {
            var newPriority = priority - 1
            var newDepth    = depth + 1
            var i           = 0
            while (i < this.size) {
                var b = []
                for (var j = 0; j < newDepth; j++) {
                    b[j] = 0
                }
                this.arraycopy(data, 0, b, 0, depth)
                b[depth] = i
                if (this.boardValid(newDepth, b)) {
                    this.masterRef.sendWork(newPriority, new this.ArrayIsolate(b), newDepth)
                }
                i += 1
            }
        }
    }
}

class Master extends spiders.Actor{
    solutions               = null
    priorities              = null
    numWorkers              = null
    workers                 = []
    messageCounter          = 0
    numWorkersTerminated    = 0
    numWorkSent             = 0
    numWorkCompleted        = 0
    resultCounter           = 0
    stopped                 = false

    config(solutions,priorities,numWorkers) {
        this.solutions = solutions
        this.priorities = priorities
        this.numWorkers = numWorkers
    }

    addWorker(workerRef,id) {
        this.workers[id] = workerRef
    }

    configDone() {
        this.parent.actorInit()
    }

    start() {
        this.sendWork(this.priorities, [], 0)
    }

    sendWork(priority,data,depth) {
        if(!this.stopped){
            this.workers[this.messageCounter].work(priority, new this.ArrayIsolate(data), depth)
            this.messageCounter = (this.messageCounter + 1) % this.numWorkers
            this.numWorkSent += 1
        }

    }

    result() {
        this.resultCounter += 1
        if (this.resultCounter == this.solutions && !this.stopped) {
            this.parent.end()
            this.stopped = true
        }
    }

}

class NQueensFirstNSolutionsApp extends spiders.Application{
    actorsInitialised   = 0
    actorsExited        = 0
    masterRef
    bench

    constructor(bench : SpiderBenchmark){
        super()
        this.bench = bench
    }

    setup(){
        this.masterRef = this.spawnActor(Master)
        this.masterRef.config(BenchConfig.nQueensSolutions,BenchConfig.nQueensPriorities,BenchConfig.nQueensWorkers)
        var id = 0
        for(var i = 0;i < BenchConfig.nQueensWorkers;i++){
            var workerRef = this.spawnActor(Worker)
            workerRef.config(this.masterRef,id,BenchConfig.nQueensThreshold,BenchConfig.nQueensSize)
            this.masterRef.addWorker(workerRef,id)
            id += 1
        }
        this.masterRef.configDone()
    }


    checkConfig() {
        if (this.actorsInitialised == 1 + BenchConfig.nQueensWorkers) {
            this.masterRef.start()
        }
    }

    actorInit() {
        this.actorsInitialised += 1
        this.checkConfig()
    }

    end() {
        this.bench.stopPromise.resolve()
    }
}

export class SpiderNQueensFirstNSolutionsBench extends SpiderBenchmark{
    nQueensFirstNSolutionsApp
    constructor(){
        super("Spiders.js N Queens First N Solutions","Spiders.js N Queens First N Solutions cycle completed","Spiders.js N Queens First N Solutions completed","Spiders.js N Queens First N Solutions scheduled")
    }

    runBenchmark(){
        this.nQueensFirstNSolutionsApp = new NQueensFirstNSolutionsApp(this)
        this.nQueensFirstNSolutionsApp.setup()
    }

    cleanUp(){
        this.nQueensFirstNSolutionsApp.kill()
    }
}