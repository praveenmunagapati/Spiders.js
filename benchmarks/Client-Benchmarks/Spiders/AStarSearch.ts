import {SpiderLib} from "../../../src/spiders";
import {SpiderBenchmark, BenchConfig} from "../../benchUtils";
/**
 * Created by flo on 01/02/2017.
 */
var spiders : SpiderLib = require("../../../src/spiders")

class Worker extends spiders.Actor{
    masterRef   = null
    threshold   = null
    grid        = null
    gridSize    = null

    //Graph stuff
    makeNode(id,i,j,k,neighbors) {
        return [id, i, j, k, neighbors, id == 0 ? 0 : -1, null]
    }
    getId(node) {
        return node[0]
    }
    getI(node) {
        return node[1]
    }
    getJ(node) {
        return node[2]
    }
    getK(node) {
        return node[3]
    }
    getNeighbors(node) {
        return node[4]
    }
    getDistanceFromRoot(node) {
        return node[5]
    }
    setDistanceFromRoot(node,dist) {
        node[5] = dist
    }
    getParentInPath(node) {
        return node[6]
    }
    setParentInPath(node,newParent) {
        node[6] = newParent
    }
    setParent(node,newParent) {
        var success = this.getParentInPath(node) == null
        if (success) {
            //Avoid circular reference
            if(node.includes(newParent)){
                this.setParentInPath(node, newParent)
            }
            this.setDistanceFromRoot(node, this.getDistanceFromRoot(node) + this.distanceFrom(node, newParent))
        }
        return success
    }
    distanceFrom(node1,node2) {
        var iDiff = this.getI(node1) - this.getI(node2)
        var jDiff = this.getJ(node1) - this.getJ(node2)
        var kDiff = this.getK(node1) - this.getK(node2)
        return Math.sqrt((iDiff * iDiff) + (jDiff * jDiff) + (kDiff * kDiff))
    }
    addNeighbor(node,newNeighbor) {
        var currentNeighbours = node[4]
        if (this.getId(newNeighbor) == this.getId(node)) {
            return false
        }
        else {
            var alreadyIn = false
            currentNeighbours.forEach((neigh,i)=>{
                if (this.getId(neigh) == this.getId(newNeighbor)) {
                    alreadyIn = true
                }
            })
            if (!alreadyIn) {
                currentNeighbours.push(newNeighbor)
            }
            return (!alreadyIn)
        }
    }
    randBool() {
        var val = Math.floor(Math.random() * (2 - 0) + 0)
        if (val == 0) {
            return false
        }
        else {
            return true
        }
    }

    generateData() {
        var allNodes = new Map()
        var gridSize = this.gridSize
        var id = 0
        for (var i1 = 0; i1 < gridSize; i1++) {
            for (var j1 = 0; j1 < gridSize; j1++) {
                for (var k1 = 0; k1 < gridSize; k1++) {
                    var node = this.makeNode(id, i1, j1, k1, [])
                    allNodes.set(id,node)
                    id++
                }
            }
        }
        allNodes.forEach((gridNode)=>{
            var iterCount = 0
            var neighborCount = 0
            for (var i = 0; i < 2; i++) {
                for (var j = 0; j < 2; j++) {
                    for (var k = 0; k < 2; k++) {
                        iterCount++
                        if (iterCount != 1 && iterCount != 8) {
                            var b = (iterCount == 7 && neighborCount == 0) || this.randBool()
                            if (b) {
                                var newI = Math.min(gridSize - 1, this.getI(gridNode) + i)
                                var newJ = Math.min(gridSize - 1, this.getJ(gridNode) + j)
                                var newK = Math.min(gridSize - 1, this.getK(gridNode) + k)
                                var newId = (gridSize * gridSize * newI) + (gridSize * newJ) + newK
                                var newNode = allNodes.get(newId)
                                if (this.addNeighbor(gridNode, newNode)) {
                                    neighborCount++
                                }
                            }
                        }
                    }
                }
            }
        })
        return allNodes
    }

    config(masterRef,threshold,gridSize) {
        this.masterRef = masterRef
        this.threshold = threshold
        this.gridSize = gridSize
        this.grid = this.generateData()
        this.parent.actorInit()
    }

    work(origin,target) {
        var workQueue = []
        workQueue.push(origin)
        var nodesProcessed = 0
        while (!(workQueue.length == 0) && nodesProcessed < this.threshold) {
            nodesProcessed += 1
            //Busy wait
            for (var j = 0; j < 100; j++) {
                Math.random()
            }
            var loopNode = workQueue.pop()
            var numNeighbors = (this.getNeighbors(loopNode)).length
            var i = 0
            while (i < numNeighbors) {
                var loopNeighbor = this.getNeighbors(loopNode)[i]
                var success = this.setParent(loopNeighbor, loopNode)
                this.masterRef.updateNodeParent(this.getId(loopNeighbor), new this.ArrayIsolate(loopNode))
                if (success) {
                    if (this.getId(loopNeighbor) == this.getId(target)) {
                        this.masterRef.done()
                    }
                    else {
                        workQueue = [loopNeighbor].concat(workQueue)
                    }
                }
                i += 1
            }
        }
        while (!(workQueue.length == 0)) {
            var loopNode = workQueue.pop()
            this.masterRef.sendWork(loopNode, target)
        }
    }

    stop() {
        this.masterRef.stop()
    }
}

class Master extends spiders.Actor{
    numWorkers              = null
    workers
    numWorkersTerminated    = 0
    numWorkSent             = 0
    numWorkCompleted        = 0
    grid                    = null
    gridSize                = null

    //Graph stuff
    makeNode(id,i,j,k,neighbors) {
        return [id, i, j, k, neighbors, id == 0 ? 0 : -1, null]
    }
    getId(node) {
        return node[0]
    }
    getI(node) {
        return node[1]
    }
    getJ(node) {
        return node[2]
    }
    getK(node) {
        return node[3]
    }
    setParentInPath(node,newParent) {
        node[6] = newParent
    }
    addNeighbor(node,newNeighbor) {
        var currentNeighbours = node[4]
        if (this.getId(newNeighbor) == this.getId(node)) {
            return false
        }
        else {
            var alreadyIn = false
            for (var i in currentNeighbours) {
                if (this.getId(currentNeighbours[i]) == this.getId(newNeighbor)) {
                    alreadyIn = true
                }
            }
            if (!alreadyIn) {
                currentNeighbours.push(newNeighbor)
            }
            return (!alreadyIn)
        }
    }
    randBool() {
        var val = Math.floor(Math.random() * (2 - 0) + 0)
        if (val == 0) {
            return false
        }
        else {
            return true
        }
    }

    generateData() {
        var allNodes = new Map()
        var gridSize = this.gridSize
        var id = 0
        for (var i1 = 0; i1 < gridSize; i1++) {
            for (var j1 = 0; j1 < gridSize; j1++) {
                for (var k1 = 0; k1 < gridSize; k1++) {
                    var node = this.makeNode(id, i1, j1, k1, [])
                    allNodes.set(id,node)
                    id++
                }
            }
        }
        allNodes.forEach((gridNode)=>{
            var iterCount = 0
            var neighborCount = 0
            for (var i = 0; i < 2; i++) {
                for (var j = 0; j < 2; j++) {
                    for (var k = 0; k < 2; k++) {
                        iterCount++
                        if (iterCount != 1 && iterCount != 8) {
                            var b = (iterCount == 7 && neighborCount == 0) || this.randBool()
                            if (b) {
                                var newI = Math.min(gridSize - 1, this.getI(gridNode) + i)
                                var newJ = Math.min(gridSize - 1, this.getJ(gridNode) + j)
                                var newK = Math.min(gridSize - 1, this.getK(gridNode) + k)
                                var newId = (gridSize * gridSize * newI) + (gridSize * newJ) + newK
                                var newNode = allNodes.get(newId)
                                if (this.addNeighbor(gridNode, newNode)) {
                                    neighborCount++
                                }
                            }
                        }
                    }
                }
            }
        })
        return allNodes
    }

    init(){
        this.workers = new Map()
    }

    config(numWorkers,gridSize) {
        this.numWorkers = numWorkers
        this.gridSize = gridSize
        this.grid = this.generateData()
    }

    addWorker(workerRef,id) {
        this.workers.set(id,workerRef)
    }

    configDone() {
        this.parent.actorInit()
    }

    start() {
        var origin = this.grid.get(0)
        var axisVal = 0.80 * this.gridSize;
        var targetId = (axisVal * this.gridSize * this.gridSize) + (axisVal * this.gridSize) + axisVal;
        var targetNode = this.grid.get(targetId)
        this.sendWork(origin, targetNode)
    }

    sendWork(origin,target) {
        var workerIndex = this.numWorkSent % this.numWorkers
        var worker      = this.workers.get(workerIndex)
        this.numWorkSent += 1
        worker.work(new this.ArrayIsolate(origin),new this.ArrayIsolate(target))
    }

    updateNodeParent(nodeId,newParent) {
        var node = this.grid.get(nodeId)
        this.setParentInPath(node, newParent)
    }

    done() {
        this.workers.forEach((worker)=>{
            worker.stop()
        })
    }

    stop() {
        this.numWorkersTerminated += 1
        if (this.numWorkersTerminated == this.numWorkers) {
            this.parent.end()
        }
    }
}

class AStarSearchApp extends spiders.Application{
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
        this.masterRef.config(BenchConfig.aStarWorkers,BenchConfig.aStarGridSize)
        var id = 0
        for(var i = 0;i < BenchConfig.aStarWorkers;i++){
            var workerRef = this.spawnActor(Worker)
            workerRef.config(this.masterRef,BenchConfig.aStarThreshold,BenchConfig.aStarGridSize)
            this.masterRef.addWorker(workerRef,id)
            id += 1
        }
        this.masterRef.configDone()
    }

    checkConfig() {
        if (this.actorsInitialised == 1 + BenchConfig.aStarWorkers) {
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

export class SpiderAStarSearchBench extends SpiderBenchmark{
    aStarSearchApp
    constructor(){
        super("Spiders.js A Star Search","Spiders.js A Star Search cycle completed","Spiders.js A Star Search completed","Spiders.js A Star Search scheduled")
    }

    runBenchmark(){
        this.aStarSearchApp = new AStarSearchApp(this)
        this.aStarSearchApp.setup()
    }

    cleanUp(){
        this.aStarSearchApp.kill()
    }

}