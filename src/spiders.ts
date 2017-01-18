import {SocketManager} from "./sockets";
import {MessageHandler} from "./messageHandler";
import {ServerFarReference, FarReference, ClientFarReference} from "./farRef";
import {PromisePool} from "./PromisePool";
import {ObjectPool} from "./objectPool";
import {deconstructBehaviour} from "./serialisation";
import {CommMedium} from "./commMedium";
import {ChildProcess} from "child_process";
import {ChannelManager} from "./ChannelManager";
import {InstallBehaviourMessage} from "./messages";
/**
 * Created by flo on 05/12/2016.
 */
var utils                           = require('./utils')

type Class = { new(...args: any[]): any; };

export abstract class Isolate{

}

abstract class ClientActor{
    spawn(app : ClientApplication){
        var actorId         = utils.generateId()
        var work            = require('webworkify')
        var webWorker       = work(require('./actorProto'))
        webWorker.addEventListener('message',(event) => {
            app.mainMessageHandler.dispatch(event)
        })
        var decon           = deconstructBehaviour(this,[],[],app.mainRef,actorId,app.channelManager,app.mainPromisePool,app.mainObjectPool)
        var actorVariables  = decon[0]
        var actorMethods    = decon[1]
        //For performance reasons, all messages sent between web workers are stringified (see https://nolanlawson.com/2016/02/29/high-performance-web-worker-messages/)
        webWorker.postMessage(JSON.stringify(new InstallBehaviourMessage(app.mainRef,app.mainId,actorId,actorVariables,actorMethods)))
        var ref             = new ClientFarReference(ObjectPool._BEH_OBJ_ID,actorId,app.mainId,app.mainRef,app.channelManager,app.mainPromisePool,app.mainObjectPool)
        return ref.proxyify()
    }
}

abstract class ServerActor{
    spawn(app : ServerApplication,port : number){
        var socketManager               = app.mainCommMedium as SocketManager
        var fork		                = require('child_process').fork
        var actorId: string             = utils.generateId()
        var decon                       = deconstructBehaviour(this,[],[],app.mainRef,actorId,socketManager,app.mainPromisePool,app.mainObjectPool)
        var actorVariables              = decon[0]
        var actorMethods                = decon[1]
        //Uncomment to debug (huray for webstorms)
        //var actor           = fork(__dirname + '/actorProto.js',[app.mainIp,port,actorId,app.mainId,app.mainPort,JSON.stringify(actorVariables),JSON.stringify(actorMethods)],{execArgv: ['--debug-brk=8787']})
        var actor                       = fork(__dirname + '/actorProto.js',[app.mainIp,port,actorId,app.mainId,app.mainPort,JSON.stringify(actorVariables),JSON.stringify(actorMethods)])
        app.spawnedActors.push(actor)
        var ref                         = new ServerFarReference(ObjectPool._BEH_OBJ_ID,actorId,app.mainIp,port,app.mainRef,app.mainCommMedium,app.mainPromisePool,app.mainObjectPool)
        socketManager.openConnection(ref.ownerId,ref.ownerAddress,ref.ownerPort)
        return ref.proxyify()
    }
}

abstract class Application {
    mainId              : string
    mainMessageHandler  : MessageHandler
    mainPromisePool     : PromisePool
    mainObjectPool      : ObjectPool
    mainCommMedium      : CommMedium
    mainRef             : FarReference
    Actor               : Class

    constructor(){
        this.mainId             = utils.generateId()
        this.mainPromisePool    = new PromisePool()
        this.mainObjectPool     = new ObjectPool(this)
    }
}

abstract class ServerApplication extends Application{
    mainIp                          : string
    mainPort                        : number
    spawnedActors                   : Array<ChildProcess>
    socketManager                   : SocketManager

    constructor(mainIp : string = "127.0.0.1",mainPort : number = 8000){
        super()
        this.mainIp             = mainIp
        this.mainPort           = mainPort
        this.spawnedActors      = []
        this.mainCommMedium     = new SocketManager(mainIp,mainPort)
        this.socketManager      = this.mainCommMedium as SocketManager
        this.mainRef            = new ServerFarReference(ObjectPool._BEH_OBJ_ID,this.mainId,this.mainIp,this.mainPort,null,this.mainCommMedium as SocketManager,this.mainPromisePool,this.mainObjectPool)
        this.mainMessageHandler = new MessageHandler(this.mainRef,this.socketManager,this.mainPromisePool,this.mainObjectPool)
        this.socketManager.init(this.mainMessageHandler)
        this.Actor              = ServerActor as Class
    }

    spawnActor(actorClass : Class,constructorArgs : Array<any> = [],port : number = 8080){
        var actorObject = new actorClass(constructorArgs)
        return actorObject.spawn(this,port)
    }

    kill(){
        this.socketManager.closeAll()
        this.spawnedActors.forEach((actor : ChildProcess) => {
            actor.kill()
        })
    }
}

abstract class ClientApplication extends Application{
    channelManager  : ChannelManager
    spawnedActors   : Array<any>

    constructor(){
        super()
        this.mainCommMedium     = new ChannelManager()
        this.spawnedActors      = []
        this.channelManager     = this.mainCommMedium as ChannelManager
        this.mainRef            = new ClientFarReference(ObjectPool._BEH_OBJ_ID,this.mainId,this.mainId,null,this.mainCommMedium as ChannelManager,this.mainPromisePool,this.mainObjectPool)
        this.mainMessageHandler = new MessageHandler(this.mainRef,this.channelManager,this.mainPromisePool,this.mainObjectPool)
        this.channelManager.init(this.mainMessageHandler)
        this.Actor              = ClientActor as Class
    }

    spawnActor(actorClass : Class,constructorArgs : Array<any>){
        //TODO create new channel and broadcast to all others (see original implementation)
        var actorObject = new actorClass(constructorArgs)
        return actorObject.spawn(this)
    }

    kill(){
        //TODO
    }

}

if(utils.isBrowser()){
    exports.Application = ClientApplication
}
else{
    exports.Application = ServerApplication
}







