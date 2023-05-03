import express, { Express, json, Request, Response } from "express";
import dotenv from "dotenv";
import http, { request } from "http";
import cors from "cors";
import { randomUUID } from "crypto";
import jsonwebtoken from "jsonwebtoken";

dotenv.config();

const CORS_ORIGIN = ["http://localhost:3000"];
// vi komunicerar med frontend Sse tack vare CORS_ORIGIN

const app: Express = express();
// här har vi vår vanliga express server
app.use(json());
app.use(
  cors({
    origin: CORS_ORIGIN,
    credentials: true,
  })
);

const server = http.createServer(app);
// och här har vi vår http server som innehåller vår express server
// detta för att så vi kan både fånga request från klient som vanligt, och plus vi kan komunicera med fråntend socket.io eller Sse

const port = process.env.PORT || 4000;

type Message = {
  id: string;
  text: string;
};
//{id:'123',text:'ciao'},{id:'680',text:'casa'}
const messages: Message[] = [];
app.post("/chat", (req: Request, res: Response) => {
  const message: Message = req.body;
  console.log(message);
  messages.push(message);
  // vi kan spara meddelandet i databasen
  sseClients.forEach((c) => {
    console.log(`send nwe message to `, c.id);

    c.client.write(`event: message\n`);
    c.client.write(`data: ${JSON.stringify(message)}`);
    c.client.write(`\n\n`);
  });
});

type SseClient = {
  id: string;
  client: Response;
};
let sseClients: SseClient[] = [];

app.use("/sse", async (request: Request, response: Response<Message[]>) => {
  const headers = {
    "Content-Type": "text/event-stream",
    Connection: "keep-alive",
    "Cache-Control": "no-cache",
  };
  // headers som skickas till klienten
  response.writeHead(200, headers);

  // // är nedan antar vi att vi har en token
  // const token = request.header("authorization")?.split(" ")[1] || "";
  // const jwt = jsonwebtoken.decode(token);
  // const clientId = (jwt?.sub as string) || "";

  console.log("server connected");
  const clientRandomId = randomUUID();
  const newClient = {
    id: clientRandomId,
    //id: jwt?.sub || "anonymus",
    client: response,
  };

  console.log("got new SSE client", clientRandomId);
  sseClients.push(newClient);

  response.write(`event:messages\n`);
  console.log(messages, "see msgs");
  response.write(`data:${JSON.stringify(messages)}`);
  response.write("\n\n");

  request.on("close", () => {
    console.log(`${clientRandomId} Connection closed`);
    sseClients = sseClients.filter((c) => c.id !== clientRandomId);
  });
});

server.listen(port, () => {
  console.log(`[server]: Server is running at https://localhost:${port}`);
});
