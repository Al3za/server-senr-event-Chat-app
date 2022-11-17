import express, { Express, json, Request, Response } from "express";
import dotenv from "dotenv";
import http, { request } from "http";
import cors from "cors";
import { randomUUID } from "crypto";
import jsonwebtoken from "jsonwebtoken";

dotenv.config();

const CORS_ORIGIN = ["http://localhost:3000"];

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
// detta för att så vi kan både fånga request från klient som vanligt, och plus vi kan komunicera med fråntend socket.io

const port = process.env.PORT || 4000;

type Message = {
  id: string;
  text: string;
};
//{id:'123',text:'ciao'},{id:'680',text:'casa'}
const messages: Message[] = [];
app.post("/chat", (req: Request, res: Response) => {
  const message: Message = req.body;
  messages.push(message);
  // vi kan spara meddelandet i databasen
  sseClients.forEach((c) => {
    console.log("send new message to ", c.id);
    // c.client.write() = c.res.write()
    c.client.write(`event: message\n`);
    // här ange du patthen som komunicerar med din frontend sse
    c.client.write(`data: ${JSON.stringify(message)}`);
    // ovan skickar vi data till frontend som blir fångad av useEventSourceListener
    // kom ihåg att skriva data : och serializering
    // serializering menas att man omvandla en object Json, till en sträng som  skickas över till natvärket
    c.client.write(`\n\n`);
    // varje meddelande är en text sträng som inte får innehålla radbrytningar
    // och avsluttar man meddelandet med 2 radbrytningar `\n\n`
    // så funkar sse
  });
});

type SseClient = {
  id: string;
  client: Response;
  // samma response som en http anrop
};
// vi sparar en lista med alla klienter här
let sseClients: SseClient[] = [];

app.use("/sse", (request: Request, response: Response<Message[]>) => {
  const headers = {
    //vad är det för typ av svar vi får
    "Content-Type": "text/event-stream",
    // uppkopling alive
    Connection: "keep-alive",
    // klienten ska inte spara svar i sin lokala cache
    "Cache-Control": "no-cache",
  };
  // headers som skickas till klienten
  response.writeHead(200, headers);

  // är nedan antar vi att vi har en token
  const token = request.header("authorization")?.split(" ")[1] || "";
  const jwt = jsonwebtoken.decode(token);
  const clientId = (jwt?.sub as string) || "";

  console.log("server connected");
  const clientRandomId = randomUUID();
  const newClient = {
    id: clientRandomId,
    //id: jwt?.sub || "anonymus",
    client: response,
  };

  console.log("got new SSE client", clientRandomId);
  sseClients.push(newClient);
  // vi pushar till ssClient en object (newClient) som har en 2 property: id:'string' och client:response som property
  // vi gör så för att unik identifiera varje klient och kunna skicka ett response after vi har fått en ny app.post meddelande

  response.write(`event:messages\n`);
  response.write(`data:${JSON.stringify(messages)}`);
  response.write("\n\n");
  // skickar alla message vid uppkopling mellan frontend och backend

  request.on("close", () => {
    // request.on menas när requesten till /sse försvinner
    // när vi för exemple stänger av frontend server
    console.log(`${clientId} Connection closed`);
    sseClients = sseClients.filter((c) => c.id !== clientId);
    // detta koden leder till en tom array
  });
});

server.listen(port, () => {
  console.log(`[server]: Server is running at https://localhost:${port}`);
});
