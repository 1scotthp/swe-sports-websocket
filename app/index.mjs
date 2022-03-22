import kafka from "kafkajs";
// import kafka from "kafka-node";
import http from "http";
import ws from "websocket";
import redis from "redis";

const APPID = process.env.APPID;
let connections = {}; // connection dictionary indexed by gc id
const WebSocketServer = ws.server;

const port = process.env.PORT || 8080;

let connectionUidDict = {};
let uidGroupChatDict = {};

const onRecieveMessage = (message) => {
  console.log("REC", message, typeof message);

  connections[JSON.parse(message)["group_chat"]].forEach((c) => {
    c["con"].send(APPID + ":" + message);
  });
};

//create a raw http server (this will help us create the TCP which will then pass to the websocket to do the job)
const httpserver = http.createServer();

//pass the httpserver object to the WebSocketServer library to do all the job, this class will override the req/res
const websocket = new WebSocketServer({
  httpServer: httpserver,
});

httpserver.listen(port, () =>
  console.log("My server is listening on port " + port)
);

//when a legit websocket request comes listen to it and get the connection .. once you get a connection thats it!
websocket.on("request", (request) => {
  const con = request.accept(null, request.origin);

  con.on("open", () => console.log("opened"));
  con.on("close", () => {
    console.log("CLOSED!!!");
    const uid = connectionUidDict[con];
    const group_chat_list = uidGroupChatDict[uid];

    for (let gc of group_chat_list) {
      connections[gc] = connections[gc].filter(
        (conObject) => conObject["uid"] != uid
      );
    }
  });
  con.on("message", (message) => {
    console.log(`${APPID} Received message hi ${message.utf8Data}`);

    // if its an initialization message
    let messageObject = JSON.parse(message.utf8Data);

    if (Object.keys(messageObject).includes("group_chats")) {
      // remove connections

      // add connections
      console.log("adding");
      uidGroupChatDict[messageObject["uid"]] = messageObject["group_chats"];
      for (let gc of messageObject["group_chats"]) {
        connectionUidDict[con] = messageObject["uid"];

        if (connections[gc] == undefined) {
          connections[gc] = [{ uid: messageObject["uid"], con: con }];
        } else {
          connections[gc].push({ uid: messageObject["uid"], con: con });
          //group_chat_dict[gc] = group_chat_dict[gc].push(messageObject["uid"]);
        }
      }
    } else {
      // its a normal message

      onRecieveMessage(message.utf8Data);
    }
  });

  // setTimeout(() => con.send(`Connected successfully to server ${APPID}`), 5000);
});

//client code
//let ws = new WebSocket("ws://localhost:8080");
//ws.onmessage = message => console.log(`Received: ${message.data}`);
//ws.send("Hello! I'm client")

/*
    //code clean up after closing connection
    subscriber.unsubscribe();
    subscriber.quit();
    publisher.quit();
    */
