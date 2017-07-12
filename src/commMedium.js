Object.defineProperty(exports, "__esModule", { value: true });
const messages_1 = require("./messages");
const farRef_1 = require("./farRef");
const sockets_1 = require("./sockets");
/**
 * Created by flo on 17/01/2017.
 */
class CommMedium {
    constructor() {
        this.pendingActors = new Map();
        this.connectedActors = new Map();
        this.pendingConnectionId = 0;
        this.socketHandler = new sockets_1.SocketHandler(this);
    }
    init(messageHandler) {
        this.messageHandler = messageHandler;
    }
    //Called whenever a server far reference is passed around between actors.
    //Given that at this point the id of the server is known (in contrast to when "remote" is called, we can simply open up a port to the server and mark the socket as "disconnected" using the actor id
    connectTransientRemote(sender, toServerRef, promisePool) {
        this.connectRemote(sender, toServerRef.ownerAddress, toServerRef.ownerPort, promisePool);
        this.socketHandler.addDisconnected(toServerRef.ownerId);
    }
    connectRemote(sender, address, port, promisePool) {
        var promiseAllocation = promisePool.newPromise();
        var connection = require('socket.io-client')('http://' + address + ":" + port);
        var connectionId = this.pendingConnectionId;
        this.pendingActors.set(connectionId, connection);
        this.pendingConnectionId += 1;
        connection.on('connect', () => {
            connection.emit('message', new messages_1.ConnectRemoteMessage(sender, promiseAllocation.promiseId, connectionId));
        });
        connection.on('message', (data) => {
            if (sender instanceof farRef_1.ServerFarReference) {
                this.messageHandler.dispatch(data);
            }
            else {
                this.messageHandler.dispatch(JSON.parse(data));
            }
        });
        return promiseAllocation.promise;
    }
    resolvePendingConnection(actorId, connectionId) {
        var connection = this.pendingActors.get(connectionId);
        this.socketHandler.removeFromDisconnected(actorId, connection);
        this.connectedActors.set(actorId, connection);
    }
}
exports.CommMedium = CommMedium;
//# sourceMappingURL=commMedium.js.map