/**
 * Created by flo on 20/12/2016.
 */
import {ValueContainer} from "./serialisation";
import {FarReference, ServerFarReference, ClientFarReference} from "./farRef";
type MessageTypeTag = number


export class Message{
    static serverSenderType = "_SERVER_"
    static clientSenderType = "_CLIENT_"
    typeTag         : MessageTypeTag
    senderId        : string
    senderType      : string
    //For Messages sent by server
    senderAddress   : string
    senderPort      : number
    //For messages sent by client
    senderMainId    : string
    contactId       : string
    contactAddress  : string
    contactPort     : number

    constructor(typeTag : MessageTypeTag,senderRef : FarReference){
        this.typeTag        = typeTag
        this.senderId       = senderRef.ownerId
        if(senderRef instanceof ServerFarReference){
            this.senderType     = Message.serverSenderType
            this.senderAddress  = (senderRef as ServerFarReference).ownerAddress
            this.senderPort     = (senderRef as ServerFarReference).ownerPort
        }
        else{
            var clientRef       = senderRef as ClientFarReference
            this.senderType     = Message.clientSenderType
            this.senderMainId   = clientRef.mainId
            this.contactId      = clientRef.contactId
            this.contactAddress = clientRef.contactAddress
            this.contactPort    = clientRef.contactPort
        }
    }
}

export const _INSTALL_BEHAVIOUR_ : MessageTypeTag = 0
export class InstallBehaviourMessage extends Message{
    mainId  : string
    actorId : string
    vars    : Array<any>
    methods : Array<any>
    constructor(senderRef : FarReference,mainId : string,actorId : string,vars : Array<any>,methods : Array<any>){
        super(_INSTALL_BEHAVIOUR_,senderRef)
        this.mainId     = mainId
        this.actorId    = actorId
        this.vars       = vars
        this.methods    = methods
    }
}

export const _FIELD_ACCESS_ : MessageTypeTag = 1
export class FieldAccessMessage extends Message{
    objectId    : number
    fieldName   : string
    promiseId   : number
    constructor(senderRef : FarReference,objectId : number,fieldName : string,promiseId : number){
        super(_FIELD_ACCESS_,senderRef)
        this.objectId   = objectId
        this.fieldName = fieldName
        this.promiseId = promiseId
    }
}

export const _METHOD_INVOC_ : MessageTypeTag = 2
export class MethodInvocationMessage extends Message{
    objectId    : number
    methodName  : string
    args        : Array<any>
    promiseId   : number
    constructor(senderRef : FarReference,objectId : number,methodName : string,args : Array<any>,promiseId : number){
        super(_METHOD_INVOC_,senderRef)
        this.objectId   = objectId
        this.methodName = methodName
        this.args       = args
        this.promiseId  = promiseId
    }
}

export const _RESOLVE_PROMISE_ : MessageTypeTag = 3
export class ResolvePromiseMessage extends Message{
    promiseId           : number
    value               : ValueContainer
    foreign             : boolean
    constructor(senderRef : FarReference,promiseId : number,value : ValueContainer,foreign : boolean = false){
        super(_RESOLVE_PROMISE_,senderRef)
        this.promiseId  = promiseId
        this.value      = value
        this.foreign    = foreign
    }
}

export const _REJECT_PROMISE_ : MessageTypeTag = 4
export class RejectPromiseMessage extends Message {
    promiseId   : number
    reason      : ValueContainer
    foreign     : boolean
    constructor(senderRef : FarReference,promiseId : number,reason : ValueContainer,foreign : boolean = false){
        super(_REJECT_PROMISE_,senderRef)
        this.promiseId  = promiseId
        this.reason     = reason
        this.foreign    = foreign
    }
}

export const _OPEN_PORT_ : MessageTypeTag = 5
export class OpenPortMessage extends Message {
    actorId : string
    constructor(senderRef : FarReference,actorId : string){
        super(_OPEN_PORT_,senderRef)
        this.actorId = actorId
    }
}

export const _PORTS_OPENED_ : MessageTypeTag = 6
export class PortsOpenedMessage extends Message{
    constructor(senderRef : FarReference){
        super(_PORTS_OPENED_,senderRef)
    }
}

export const _CONNECT_REMOTE_ : MessageTypeTag = 7
export class ConnectRemoteMessage extends Message{
    promiseId       : number
    connectionId    : number
    constructor(senderRef : FarReference,promiseId : number,connectionId : number){
        super(_CONNECT_REMOTE_,senderRef)
        this.promiseId      = promiseId
        this.connectionId   = connectionId
    }
}

export const _RESOLVE_CONNECTION_ : MessageTypeTag = 8
export class ResolveConnectionMessage extends Message{
    promiseId       : number
    connectionId    : number
    constructor(senderRef : FarReference,promiseId : number,connectionId : number){
        super(_RESOLVE_CONNECTION_,senderRef)
        this.promiseId      = promiseId
        this.connectionId   = connectionId
    }
}

export const _ROUTE_ : MessageTypeTag = 9
export class RouteMessage extends Message {
    targetId    : string
    message     : Message
    constructor(senderRef : FarReference,targetId : string,message : Message){
        super(_ROUTE_,senderRef)
        this.message    = message
        this.targetId   = targetId
    }
}


