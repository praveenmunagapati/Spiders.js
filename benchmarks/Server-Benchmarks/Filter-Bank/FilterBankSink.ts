import {ServerBufferSocket, ClientBufferSocket, SpiderBenchmark} from "../../benchUtils";
/**
 * Created by flo on 09/02/2017.
 */
var count = 0
var myPort = parseInt(process.argv[2])
new ServerBufferSocket(myPort,mHandle)
var socketToMain = new ClientBufferSocket(SpiderBenchmark._MAIN_PORT_,mHandle)

function mHandle(data){
    function valueMessage(val){
        count += 1
    }

    function link(refPort){
        new ClientBufferSocket(refPort,mHandle)
    }

    switch(data[0]){
        case "valueMessage":
            valueMessage(data[1])
            break;
        case "link":
            link(data[1])
            break;
        default :
            console.log("Unknown message (Sink): " + data[0])
    }
}
socketToMain.emit(["actorInit"])