import {CommMedium} from "./commMedium";
import {MessageHandler} from "./messageHandler";
import {Message} from "./messages";
import {SocketHandler} from "./sockets";
/**
 * Created by flo on 18/01/2017.
 */
export class ChannelManager extends CommMedium{
    private messageHandler  : MessageHandler
    private connections     : Map<string,MessagePort>
    private socketHandler   : SocketHandler

    init(messageHandler : MessageHandler){
        this.messageHandler = messageHandler
        this.connections    = new Map()
        this.socketHandler  = new SocketHandler(this)
    }

    newConnection(actorId : string,channelPort : MessagePort){
        channelPort.onmessage = (ev : MessageEvent) => {
            this.messageHandler.dispatch(JSON.parse(ev.data),ev.ports)
        }
        this.connections.set(actorId,channelPort)
    }

    //Open connection to Node.js instance owning the object to which the far reference refers to
    openConnection(actorId : string,actorAddress : string,actorPort : number){
        this.socketHandler.openConnection(actorId,actorAddress,actorPort)
    }

    hasConnection(actorId : string) : boolean{
        return this.connections.has(actorId) || this.connectedActors.has(actorId)
    }

    sendMessage(actorId : string,message : Message){
        if(this.connections.has(actorId)){
            this.connections.get(actorId).postMessage(JSON.stringify(message))
        }
        else if(this.connectedActors.has(actorId)){
            this.socketHandler.sendMessage(actorId,message)
        }
        else{
            throw new Error("Unable to send message to unknown actor")
        }
    }
}