import {MessageHandler} from "./messageHandler";
import {Message} from "./messages";
import {Socket} from "net";
import {CommMedium} from "./commMedium";
/**
 * Created by flo on 19/12/2016.
 */
var io = require('socket.io')

export class SocketHandler{
    disconnectedActors  : Array<string>
    pendingMessages     : Map<string,Array<Message>>
    //TODO obviously a temp fix , problem arises in SOR  with many actors
    fuckUpMessage       : Map<string,Array<Message>>
    owner               : CommMedium
    messageHandler      : MessageHandler

    constructor(owner : CommMedium){
        this.owner                  = owner
        this.disconnectedActors     = []
        this.pendingMessages        = new Map<string,Array<Message>>()
        this.fuckUpMessage          = new Map<string,Array<Message>>()
    }

    addDisconnected(actorId : string){
        this.disconnectedActors.push(actorId)
        this.pendingMessages.set(actorId,[])
    }

    removeFromDisconnected(actorId : string,connection : Socket){
        this.owner.connectedActors.set(actorId,connection)
        this.disconnectedActors = this.disconnectedActors.filter((id : string)=>{
            id != actorId
        })
        if(this.pendingMessages.has(actorId)){
            var messages = this.pendingMessages.get(actorId)
            messages.forEach((msg : Message) => {
                this.sendMessage(actorId,msg)
            })
        }
    }


    //Open connection to Node.js instance owning the object to which the far reference refers to
    openConnection(actorId : string,actorAddress : string,actorPort : number){
        var that = this
        var connection = require('socket.io-client')('http://'+actorAddress+":"+actorPort)
        this.addDisconnected(actorId)
        connection.on('connect',() => {
            that.removeFromDisconnected(actorId,connection)
            //TODO To remove once solution found
            if(that.fuckUpMessage.has(actorId)){
                that.fuckUpMessage.get(actorId).forEach((msg : Message)=>{
                    that.sendMessage(actorId,msg)
                })
            }
        })
        connection.on('message',function(data){
            that.messageHandler.dispatch(data)
        })
        connection.on('disconnect',function(){
            that.disconnectedActors.push(actorId)
        })
    }

    sendMessage(actorId : string,msg : Message) : void{
        if(this.disconnectedActors.indexOf(actorId) != -1){
            var msgs = this.pendingMessages.get(actorId)
            msgs.push(msg)
            this.pendingMessages.set(actorId,msgs)
        }
        else if(this.owner.connectedActors.has(actorId)){
            var sock = this.owner.connectedActors.get(actorId)
            sock.emit('message',msg)
        }
        else{
            //TODO TEMP
            if(this.fuckUpMessage.has(actorId)){
                this.fuckUpMessage.get(actorId).push(msg)
            }
            else{
                var q = [msg]
                this.fuckUpMessage.set(actorId,q)
            }
            //throw new Error("Unable to send message to unknown actor (socket handler) in " + msg.fieldName + " to : " + actorId + " in : " + this.messageHandler.thisRef.ownerId)
        }
    }
}

export class ServerSocketManager extends CommMedium{
    private socketIp            : string
    private socketPort          : number
    private socket              : any
    private connectedClients    : Map<string,Socket>

    constructor(ip : string,socketPort : number){
        super()
        this.socketIp               = ip
        this.socketPort             = socketPort
        this.socket                 = io(socketPort)
        this.connectedClients       = new Map<string,Socket>()
    }

    init(messageHandler : MessageHandler){
        super.init(messageHandler)
        this.socketHandler.messageHandler = messageHandler
        this.socket.on('connection',(client) => {
            client.on('message',(data) => {
                messageHandler.dispatch(data,[],client)
            })
            client.on('close',() => {
                //TODO
            })
        })
    }

    //Open connection to Node.js instance owning the object to which the far reference refers to
    openConnection(actorId : string,actorAddress : string,actorPort : number){
        this.socketHandler.openConnection(actorId,actorAddress,actorPort)
    }

    addNewClient(actorId : string,socket : Socket){
        this.connectedClients.set(actorId,socket)
    }

    sendMessage(actorId : string,msg : Message) : void{
        if(this.connectedClients.has(actorId)){
            this.connectedClients.get(actorId).emit('message',JSON.stringify(msg))
        }
        else{
            this.socketHandler.sendMessage(actorId,msg)
        }
    }

    hasConnection(actorId : string) : boolean{
        return (this.socketHandler.disconnectedActors.indexOf(actorId) != -1) || this.connectedActors.has(actorId)
    }

    closeAll(){
        this.socket.close()
        this.connectedActors.forEach((sock : any) => {
            sock.close()
        })
    }
}