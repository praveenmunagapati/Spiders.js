///<reference path="../../../Library/Preferences/WebStorm2016.3/javascript/extLibs/http_github.com_DefinitelyTyped_DefinitelyTyped_raw_master_node_node.d.ts"/>
import {MessageHandler} from "./messageHandler";
import {ServerSocketManager} from "./sockets";
import {ObjectPool} from "./objectPool";
import {FarReference, ServerFarReference} from "./farRef";
import {PromisePool} from "./PromisePool";
import {reconstructBehaviour, reconstructStatic} from "./serialisation";
import {ChannelManager} from "./ChannelManager";
import {GSP} from "./Replication/GSP";
/**
 * Created by flo on 05/12/2016.
 */
var utils           = require('./utils')

var messageHandler  : MessageHandler
var objectPool      : ObjectPool
var promisePool     : PromisePool
var gspInstance     : GSP
var parentRef       : FarReference
var thisId          : string


if(utils.isBrowser()){
    module.exports = function (self) {
        //At spawning time the actor's behaviour, id and main id are not known. This information will be extracted from an install message handled by the messageHandler (which will make sure this information is set (e.g. in the objectPool)
        var channelManager  = new ChannelManager()
        promisePool         = new PromisePool()
        objectPool          = new ObjectPool()
        messageHandler      = new MessageHandler(null,channelManager,promisePool,objectPool,null)
        channelManager.init(messageHandler)
        self.addEventListener('message',function (ev : MessageEvent){
            //For performance reasons, all messages sent between web workers are stringified (see https://nolanlawson.com/2016/02/29/high-performance-web-worker-messages/)
            messageHandler.dispatch(JSON.parse(ev.data),ev.ports)
        });
    };
}
else{
    var address : string    = process.argv[2]
    var port : number       = parseInt(process.argv[3])
    thisId                  = process.argv[4]
    var parentId : string   = process.argv[5]
    var parentPort : number = parseInt(process.argv[6])
    var socketManager       = new ServerSocketManager(address,port)
    promisePool             = new PromisePool()
    objectPool              = new ObjectPool()
    var thisRef             = new ServerFarReference(ObjectPool._BEH_OBJ_ID,thisId,address,port,null,null,null,null)
    var variables           = JSON.parse(process.argv[7])
    var methods             = JSON.parse(process.argv[8])
    gspInstance             = new GSP(socketManager,thisId,thisRef)
    var behaviourObject     = reconstructBehaviour({},variables,methods,thisRef,promisePool,socketManager,objectPool,gspInstance)
    //reconstructStatic(behaviourObject,JSON.parse(process.argv[9]),thisRef,promisePool,socketManager,objectPool,gspInstance)
    objectPool.installBehaviourObject(behaviourObject)
    messageHandler          = new MessageHandler(thisRef,socketManager,promisePool,objectPool,gspInstance)
    socketManager.init(messageHandler)
    parentRef               = new ServerFarReference(ObjectPool._BEH_OBJ_ID,parentId,address,parentPort,thisRef,socketManager,promisePool,objectPool)
    var parentServer        = parentRef as ServerFarReference
    socketManager.openConnection(parentServer.ownerId,parentServer.ownerAddress,parentServer.ownerPort)
    utils.installSTDLib(false,thisRef,parentRef,behaviourObject,socketManager,promisePool,gspInstance)
}


