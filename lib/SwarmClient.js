/**
 * Created with JetBrains WebStorm.
 * User: sinica
 * Date: 7/10/12
 * Time: 5:03 PM
 * To change this template use File | Settings | File Templates.
 */

var util = require("swarmutil");
var net = require("net");

var sys = require('util'),
events = require('events');


function SwarmClient (host, port, sessionId, user, pass) {
        this.sessionId = sessionId;
        this.cmdParser  = util.createFastParser(this.resolveMessage.bind(this));
        this.sock       =  net.createConnection(port, host);
        this.loginOk   = false;
        this.pendingCmds   = new Array();

        this.sock.setEncoding("UTF8");
        this.sock.addListener("connect", function() {
            this.login(sessionId, user, pass);
        }.bind(this));

    this.sock.addListener ("data", function(data) {
        this.cmdParser.parseNewData(data);
    }.bind(this));

    this.sock.addListener ("close", function(data) {
        this.emit("close",this);
    }.bind(this));
}

sys.inherits(SwarmClient, events.EventEmitter);

SwarmClient.prototype.startSwarm = function (swarmName, constructor) {
    var args = Array.prototype.slice.call(arguments,2);

    var cmd = {
        sessionId        : this.sessionId,
        swarmingName     : swarmName,
        command          : "start",
        ctor             : constructor,
        commandArguments : args
    };
    if(this.loginOk == true) {
        util.writeObject(this.sock,cmd);
    }
    else {
        this.pendingCmds.push(cmd);
    }
}

SwarmClient.prototype.resolveMessage = function (object) {
    if(this.loginOk == true) {
        this.emit(object.swarmingName, object);
    }
    else {
        this.loginOk = true;
        this.emit(object.swarmingName, object); //if was not closed,it should be a successful login
        for (var i = 0; i < this.pendingCmds.length; i++) {
            util.writeObject(this.sock,this.pendingCmds[i]);
        }
        this.pendingCmds = null;
    }
}



exports.createClient = function(host, port,sessionId, user, pass) {
    return new SwarmClient(host, port, sessionId, user, pass);
}


SwarmClient.prototype.login = function (sessionId,user,pass) {
    var cmd = {
        sessionId        : sessionId,
        swarmingName     : "login.js",
        command          : "start",
        commandArguments : [sessionId, user, pass]
    };
    util.writeObject(this.sock,cmd);
}