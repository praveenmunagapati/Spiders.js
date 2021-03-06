import {SpiderBenchmark, BenchConfig} from "../benchUtils";
/**
 * Created by flo on 20/02/2017.
 */
//Source from : https://gist.github.com/peterc/5019804
function calculate(){
    var MAX = 100000000;

    var r = 5;
    var points_total = 0;
    var points_inside = 0;
    while (1) {
        points_total++;
        var x = Math.random() * r * 2 - r;
        var y = Math.random() * r * 2 - r;
        if (Math.pow(x, 2) + Math.pow(y, 2) < Math.pow(r, 2))
            points_inside++;
        if (points_total % MAX == 0) {
            return  (4 * points_inside / points_total);
        }
    }
}
export class SequentialCarloBench extends SpiderBenchmark{
    constructor(){
        super("Sequential Monte Carlo","Sequential Monte Carlo cycle completed","Sequential Monte Carlo completed","Sequential Monte Carlo scheduled")
    }

    runBenchmark(){
        for(var i =0;i < BenchConfig.monteCarloRuns;i++){
            calculate()
        }
        this.stopPromise.resolve()
    }

    cleanUp(){

    }
}