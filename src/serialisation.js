const messages_1 = require("./messages");
const farRef_1 = require("./farRef");
/**
 * Created by flo on 19/12/2016.
 */
//Enables to detect true type of instances (e.g. array)
function toType(obj) {
    return ({}).toString.call(obj).match(/\s([a-zA-Z]+)/)[1].toLowerCase();
}
function getObjectVars(object, thisRef, receiverId, commMedium, promisePool, objectPool) {
    var vars = [];
    var properties = Reflect.ownKeys(object);
    for (var i in properties) {
        var key = properties[i];
        var val = Reflect.get(object, key);
        var serialisedval = serialise(val, thisRef, receiverId, commMedium, promisePool, objectPool);
        vars.push([key, serialisedval]);
    }
    return vars;
}
exports.getObjectVars = getObjectVars;
function getObjectMethods(object) {
    var methods = [];
    var proto = Object.getPrototypeOf(object);
    var properties = Reflect.ownKeys(proto);
    //Property at index 0 is the constructor, which doesn't need to be serialised given that we are transmitting an instance of the class extending Actor
    properties.shift();
    for (var i in properties) {
        var key = properties[i];
        var method = Reflect.get(proto, key);
        if (typeof method == 'function') {
            methods.push([key, method.toString()]);
        }
    }
    return methods;
}
exports.getObjectMethods = getObjectMethods;
function deconstructBehaviour(object, accumVars, accumMethods, thisRef, receiverId, commMedium, promisePool, objectPool) {
    var properties = Reflect.ownKeys(object);
    for (var i in properties) {
        var key = properties[i];
        var val = Reflect.get(object, key);
        if (typeof val != 'function' || isIsolateClass(val)) {
            var serialisedval = serialise(val, thisRef, receiverId, commMedium, promisePool, objectPool);
            accumVars.push([key, serialisedval]);
        }
    }
    var proto = object.__proto__;
    properties = Reflect.ownKeys(proto);
    properties.shift();
    var lastProto = properties.indexOf("spawn") != -1;
    if (!lastProto) {
        for (var i in properties) {
            var key = properties[i];
            var method = Reflect.get(proto, key);
            if (typeof method == 'function') {
                accumMethods.push([key, method.toString()]);
            }
        }
        return deconstructBehaviour(proto, accumVars, accumMethods, thisRef, receiverId, commMedium, promisePool, objectPool);
    }
    else {
        return [accumVars, accumMethods];
    }
}
exports.deconstructBehaviour = deconstructBehaviour;
function reconstructObject(variables, methods, thisRef, promisePool, commMedium, objectPool) {
    var ob = {};
    for (var i in variables) {
        var key = variables[i][0];
        var rawVal = variables[i][1];
        var val = deserialise(thisRef, rawVal, promisePool, commMedium, objectPool);
        ob[key] = val;
    }
    for (var i in methods) {
        var key = methods[i][0];
        var functionSource = methods[i][1];
        var method = eval("with(ob){(function " + functionSource + ")}");
        ob[key] = method;
    }
    return ob;
}
exports.reconstructObject = reconstructObject;
class ValueContainer {
    constructor(type) {
        this.type = type;
    }
}
ValueContainer.nativeType = 0;
ValueContainer.promiseType = 1;
ValueContainer.serverFarRefType = 2;
ValueContainer.errorType = 3;
ValueContainer.arrayType = 4;
ValueContainer.isolateType = 5;
ValueContainer.isolateDefType = 6;
ValueContainer.clientFarRefType = 7;
exports.ValueContainer = ValueContainer;
class NativeContainer extends ValueContainer {
    constructor(value) {
        super(ValueContainer.nativeType);
        this.value = value;
    }
}
exports.NativeContainer = NativeContainer;
class PromiseContainer extends ValueContainer {
    constructor(promiseId, promiseCreatorId) {
        super(ValueContainer.promiseType);
        this.promiseId = promiseId;
        this.promiseCreatorId = promiseCreatorId;
    }
}
exports.PromiseContainer = PromiseContainer;
class ServerFarRefContainer extends ValueContainer {
    constructor(objectId, ownerId, ownerAddress, ownerPort) {
        super(ValueContainer.serverFarRefType);
        this.objectId = objectId;
        this.ownerId = ownerId;
        this.ownerAddress = ownerAddress;
        this.ownerPort = ownerPort;
    }
}
exports.ServerFarRefContainer = ServerFarRefContainer;
class ClientFarRefContainer extends ValueContainer {
    constructor(objectId, ownerId, mainId) {
        super(ValueContainer.clientFarRefType);
        this.objectId = objectId;
        this.ownerId = ownerId;
        this.mainId = mainId;
    }
}
exports.ClientFarRefContainer = ClientFarRefContainer;
class ErrorContainer extends ValueContainer {
    constructor(error) {
        super(ValueContainer.errorType);
        this.message = error.message;
        this.stack = error.stack;
        this.name = error.name;
    }
}
exports.ErrorContainer = ErrorContainer;
class ArrayContainer extends ValueContainer {
    constructor(values) {
        super(ValueContainer.arrayType);
        this.values = values;
    }
}
exports.ArrayContainer = ArrayContainer;
class IsolateContainer extends ValueContainer {
    constructor(vars, methods) {
        super(ValueContainer.isolateType);
        this.vars = vars;
        this.methods = methods;
    }
}
IsolateContainer.checkIsolateFuncKey = "_INSTANCEOF_ISOLATE_";
exports.IsolateContainer = IsolateContainer;
class IsolateDefinitionContainer extends ValueContainer {
    constructor(definition) {
        super(ValueContainer.isolateDefType);
        this.definition = definition;
    }
}
exports.IsolateDefinitionContainer = IsolateDefinitionContainer;
function isClass(func) {
    return typeof func === 'function' && /^\s*class\s+/.test(func.toString());
}
function isIsolateClass(func) {
    return (func.toString().search(/extends.*?Isolate/) != -1);
}
function serialisePromise(promise, thisRef, receiverId, commMedium, promisePool, objectPool) {
    var wrapper = promisePool.newPromise();
    promise.then((val) => {
        commMedium.sendMessage(receiverId, new messages_1.ResolvePromiseMessage(thisRef, wrapper.promiseId, serialise(val, thisRef, receiverId, commMedium, promisePool, objectPool), true));
    });
    promise.catch((reason) => {
        commMedium.sendMessage(receiverId, new messages_1.RejectPromiseMessage(thisRef, wrapper.promiseId, serialise(reason, thisRef, receiverId, commMedium, promisePool, objectPool), true));
    });
    return new PromiseContainer(wrapper.promiseId, thisRef.ownerId);
}
function serialiseObject(object, thisRef, objectPool) {
    var oId = objectPool.allocateObject(object);
    if (thisRef instanceof farRef_1.ServerFarReference) {
        return new ServerFarRefContainer(oId, thisRef.ownerId, thisRef.ownerAddress, thisRef.ownerPort);
    }
    else {
        return new ClientFarRefContainer(oId, thisRef.ownerId, thisRef.mainId);
    }
}
function serialise(value, thisRef, receiverId, commMedium, promisePool, objectPool) {
    if (typeof value == 'object') {
        if (value instanceof Promise) {
            return serialisePromise(value, thisRef, receiverId, commMedium, promisePool, objectPool);
        }
        else if (value instanceof Error) {
            return new ErrorContainer(value);
        }
        else if (value instanceof Array) {
            var values = value.map((val) => {
                return serialise(val, thisRef, receiverId, commMedium, promisePool, objectPool);
            });
            return new ArrayContainer(values);
        }
        else if (value[farRef_1.FarReference.ServerProxyTypeKey]) {
            var farRef = value[farRef_1.FarReference.farRefAccessorKey];
            return new ServerFarRefContainer(farRef.objectId, farRef.ownerId, farRef.ownerAddress, farRef.ownerPort);
        }
        else if (value[farRef_1.FarReference.ClientProxyTypeKey]) {
            let farRef = value[farRef_1.FarReference.farRefAccessorKey];
            return new ClientFarRefContainer(farRef.objectId, farRef.ownerId, farRef.mainId);
        }
        else if (value[IsolateContainer.checkIsolateFuncKey]) {
            var vars = getObjectVars(value, thisRef, receiverId, commMedium, promisePool, objectPool);
            var methods = getObjectMethods(value);
            return new IsolateContainer(JSON.stringify(vars), JSON.stringify(methods));
        }
        else {
            return serialiseObject(value, thisRef, objectPool);
        }
    }
    else if (typeof value == 'function') {
        //Value is actualy not a function but the result of a field access on a proxy (which is technically a function, see farRef)
        if (value[farRef_1.FarReference.proxyWrapperAccessorKey]) {
            return serialisePromise(value, thisRef, receiverId, commMedium, promisePool, objectPool);
        }
        else if (isClass(value) && isIsolateClass(value)) {
            var definition = value.toString().replace(/(\extends)(.*?)(?=\{)/, '');
            return new IsolateDefinitionContainer(definition.replace("super()", ''));
        }
        else if (isClass(value)) {
            throw new Error("Serialisation of classes disallowed");
        }
        else {
            throw new Error("Serialisation of functions disallowed: " + value.toString());
        }
    }
    else {
        return new NativeContainer(value);
    }
}
exports.serialise = serialise;
function deserialise(thisRef, value, promisePool, commMedium, objectPool) {
    function deSerialisePromise(promiseContainer) {
        return promisePool.newForeignPromise(promiseContainer.promiseId, promiseContainer.promiseCreatorId);
    }
    function deSerialiseServerFarRef(farRefContainer) {
        var farRef = new farRef_1.ServerFarReference(farRefContainer.objectId, farRefContainer.ownerId, farRefContainer.ownerAddress, farRefContainer.ownerPort, thisRef, commMedium, promisePool, objectPool);
        if (thisRef instanceof farRef_1.ServerFarReference) {
            if (!(commMedium.hasConnection(farRef.ownerId))) {
                commMedium.openConnection(farRef.ownerId, farRef.ownerAddress, farRef.ownerPort);
            }
        }
        else {
        }
        return farRef.proxyify();
    }
    function deSerialiseClientFarRef(farRefContainer) {
        var farRef = new farRef_1.ClientFarReference(farRefContainer.objectId, farRefContainer.ownerId, farRefContainer.mainId, thisRef, commMedium, promisePool, objectPool);
        if (thisRef instanceof farRef_1.ServerFarReference) {
        }
        return farRef.proxyify();
    }
    function deSerialiseError(errorContainer) {
        var error = new Error(errorContainer.message);
        error.stack = errorContainer.stack;
        error.name = errorContainer.name;
        return error;
    }
    function deSerialiseArray(arrayContainer) {
        var deserialised = arrayContainer.values.map((valCont) => {
            return deserialise(thisRef, valCont, promisePool, commMedium, objectPool);
        });
        return deserialised;
    }
    function deSerialiseIsolate(isolateContainer) {
        var isolate = reconstructObject(JSON.parse(isolateContainer.vars), JSON.parse(isolateContainer.methods), thisRef, promisePool, commMedium, objectPool);
        isolate[IsolateContainer.checkIsolateFuncKey] = true;
        return isolate;
    }
    function deSerialiseIsolateDefinition(isolateDefContainer) {
        var classObj = eval(isolateDefContainer.definition);
        classObj.prototype[IsolateContainer.checkIsolateFuncKey] = true;
        return classObj;
    }
    switch (value.type) {
        case ValueContainer.nativeType:
            return value.value;
        case ValueContainer.promiseType:
            return deSerialisePromise(value);
        case ValueContainer.clientFarRefType:
            return deSerialiseClientFarRef(value);
        case ValueContainer.serverFarRefType:
            return deSerialiseServerFarRef(value);
        case ValueContainer.errorType:
            return deSerialiseError(value);
        case ValueContainer.arrayType:
            return deSerialiseArray(value);
        case ValueContainer.isolateType:
            return deSerialiseIsolate(value);
        case ValueContainer.isolateDefType:
            return deSerialiseIsolateDefinition(value);
        default:
            throw "Unknown value container type :  " + value;
    }
}
exports.deserialise = deserialise;
//# sourceMappingURL=serialisation.js.map