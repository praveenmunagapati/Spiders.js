/**
 * Created by flo on 24/01/2017.
 */
export class Config {
    //Ping pong 
    static pingAmount           = 50000
    //Count 
    static count                = 1000000
    //Fork join throughput 
    static fjThroughputActors   = 20
    static fjThroughputMessages = 1000
    //Fork join creation 
    static fjCreationActors     = 10
    //Thread ring 
    static threadRingActors     = 20
    static threadRingPings      = 1000
    //Chameneo 
    static chameneoMeetings     = 500
    static chameneoActors       = 10
    //Big config
    static bigActors            = 10
    static bigPings             = 3000
    //Concurrent Dictionary 
    static cDictActors          = 20
    static cDictMsgs            = 500
    static cDictWrite           = 300
    //Concurrent sorted linked list
    static cLinkedListActors    = 10
    static cLinkedListMsgs      = 100
    static cLinkedListWrites    = 10
    static cLinkedListSize      = 10
    //Producer Consumer
    static prodConBuffer        = 50
    static prodConProd          = 5
    static prodConCon           = 5
    static prodConItems         = 100
    static prodConProdCost      = 25
    static prodConConCost       = 25
    //Philosopher
    static philosopherActors    = 10
    static philosopherEating    = 100
    //Barber
    static barberNrHaircuts     = 20
    static barberWaitingRoom    = 100
    static barberProduction     = 500
    static barberHaircut        = 500
    //Cigarette Smokers
    static cigSmokeRounds       = 500
    static cigSmokeSmokers      = 20
    //Logistic map
    static logMapTerms          = 200
    static logMapSeries         = 9
    static logMapStartRate      = 3.46
    static logMapIncrement      = 0.0025
    //Banking
    static bankingAccounts      = 20
    static bankingTransactions  = 500
    static bankingInitialBalance= Config.bankingAccounts * Config.bankingTransactions
    //Radix sort
    static radixSortDataSize    = 500
    static radixSortMaxVal      = 1000
    //Filter bank
    static filterBankColumns    = 8192 * 2
    static filterBankSimulations= 500
    static filterBankChannels   = 2
    //Sieve
    static sieveLimit           = 100000
    static sieveLocal           = 50000
    //UCT
    static uctMaxNodes          = 20
    static uctAvgCompSize       = 1000
    static uctStdevCompSize     = 500
    static uctBinomial          = 5
    static uctPercent           = 70
    //Fac loc
    static facLocNumPoints      = 10000
    static facLocGridSize       = 500
    static facLocF              = Math.sqrt(2) * 500
    static facLocAlpha          = 2.0
    static facLocCuttOff        = 3
    //Trapezoid
    static trapezoidPieces      = 1000000
    static trapezoidWorkers     = 20
    static trapezoidLeft        = 1
    static trapezoidRight       = 5
    //Pi Precision
    static piPrecisionWorkers   = 20
    static piPrecisionPrecision = 5000
    //Matrix Multiplication
    static matMulWorkers        = 20
    static matMulDataLength     = 1024
    static matMulThreshold      = 16384
    //Quicksort
    static quickDataSize        = 5000
    static quickMaxVal          = 1 << 60
    static quickThreshold       = 1000
    //All pair shortes path
    static apspN                = 20
    static apspB                = 5
    static apspW                = 10
    //Successive over relaxation
    static sorRefVal            = [0.000003189420084871275,0.001846644602759566,0.0032099996270638005,0.0050869220175413146,0.008496328291240363,0.016479973604143234,0.026575660248076397,1.026575660248076397,2.026575660248076397,3.026575660248076397]
    static sorDataSizes         = [2,5,20,80,100,120,150,200,250,300,350,400]
    static sorJacobi            = 100
    static sorOmega             = 1.25
    static sorN                 = 1
    //A star search 
    static aStarWorkers         = 30
    static aStarThreshold       = 200
    static aStarGridSize        = 5
    //N queens
    static nQueensWorkers       = 20
    static nQueensSize          = 5
    static nQueensThreshold     = 2
    static nQueensSolutions     = 400
    static nQueensPriorities    = 10
}