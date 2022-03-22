import kafka from "kafkajs";
// import kafka from "kafka-node";
import http from "http";
import ws from "websocket";
import redis from "redis";
import { appendFile } from "fs";
const APPID = process.env.APPID;
let connections = [];
const WebSocketServer = ws.server;

const port = process.env.PORT || 8080;

let group_chat_dict = {}

const onRecieveMessage = (message) => {
  console.log("REC");
  connections.forEach((c) => c.send(APPID + ":" + message));
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
  con.on("close", () => console.log("CLOSED!!!"));
  con.on("message", (message) => {
    console.log(`${APPID} Received message hi ${message.utf8Data}`);

    // if its an initialization message
    console.log(message.utf8Data, typeof(message.utf8Data))
    // if(Object.keys(message.utf8Data).includes("group_chats")){
    //   console.log("initial connect")
    // } else{ // its a normal message
    //   onRecieveMessage(message.utf8Data);
    // }


  });

  setTimeout(() => con.send(`Connected successfully to server ${APPID}`), 5000);
  connections.push(con);
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
