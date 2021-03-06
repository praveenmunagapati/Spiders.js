/**
 * Created by flo on 26/01/2017.
 */
module.exports = function(self){
    var balance = 0
    var tellerRef = null

    function mHandle(event){
        function config(initialBalance,teller){
            balance = initialBalance
            tellerRef = teller
            tellerRef.onmessage = mHandle
            self.postMessage(["actorInit"])
        }

        function credit(amount,destination){
            balance -= amount
            destination.postMessage(["debit",amount])
        }

        function link(ref){
            ref.onmessage = mHandle
        }

        function debit(amount){
            balance += amount
            tellerRef.postMessage(["transactionDone"])
        }

        switch(event.data[0]){
            case "config":
                config(event.data[1],event.ports[0])
                break;
            case "credit":
                credit(event.data[1],event.ports[0])
                break;
            case "link":
                link(event.ports[0])
                break;
            case "debit":
                debit(event.data[1])
                break;
            default :
                console.log("Unknown message: " + event.data[0])
        }
    }
    self.addEventListener('message',mHandle)
}