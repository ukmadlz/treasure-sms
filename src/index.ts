import "dotenv/config";
import Fastify from "fastify";
import FastifySensible from "@fastify/sensible";
import { AuthType, Infobip } from "@infobip-api/sdk";
import { v4 as uuid } from "uuid";
import axios from "axios";

// Fastify & it's configuration
const fastify = Fastify({
  logger: true,
});
fastify.register(FastifySensible);

const infobip = new Infobip({
  baseUrl: String(process.env.INFOBIP_BASE_URL),
  apiKey: String(process.env.INFOBIP_API_KEY),
  authType: AuthType.ApiKey,
});

const infobipClient = axios.create({
    baseURL: !infobip.credentials.baseUrl.indexOf('http') ? infobip.credentials.baseUrl : `https://${infobip.credentials.baseUrl}`,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `${infobip.credentials.authorization}`,
    },
});

// Routes
fastify.post("/", async (request: any, reply) => {
  console.log(request.body.treasureNumber);
  const response = await infobip.channels.sms.send({
    messages: [
      {
        destinations: [
          {
            to: request.body.treasureNumber,
          },
        ],
        from: process.env.FROM_NUMBER,
        text: JSON.stringify({
          a: uuid(),
          code: process.env.TREASURE_CODE,
          z: uuid(),
        }),
      },
      {
        destinations: [
          {
            to: request.body.treasureNumber,
          },
        ],
        from: process.env.FROM_NUMBER,
        text: "Once you have your treasure feel free to join our discord community https://infobip.com/developers/discord",
      },
    ],
  });
  console.log(response)
  return {};
});

fastify.get("/pick-winner", {}, async(request: any, reply: any) => {
    try {
        const filterQuery = {"#and":[{"#contains": { "tags": "CityJSLondon2024" }}]};
        const peopleResp = await infobipClient.get(`/people/2/persons?limit=1000&filter=${encodeURIComponent(JSON.stringify(filterQuery))}`, {})
        peopleResp.data.persons.filter((person: any) => {
            return person.customAttributes.Raffle == "Yes";
        })
        const { persons } = peopleResp.data;
        const winner = persons[Math.floor(Math.random()*persons.length)]
        const winnerNumber = winner.contactInformation.phone[0].number;
        // const winnerNumber = '447816961602';
        const whatsappObject = {
            type: 'text',
            to: winnerNumber,
            from: process.env.INFOBIP_WHATSAPP_SENDER,
            content: {
              text: `Hey ${winner.firstName.split(' ')[0]}, you've won the Infobip Prize. Stand up so you can get it! If you don't say now, it'll pass to the next person.`,
            },
        }
        await infobip.channels.whatsapp.send(whatsappObject);
        return {
            data: [winner],
        }
    } catch (error) {
        console.error(error);
        reply.status(500);
        reply.send(error);
    }
})

// Run the server
const start = async () => {
  try {
    const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
    const HOST = process.env.PORT ? "0.0.0.0" : "127.0.0.1";
    await fastify.listen({ port: PORT, host: HOST });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};
start();
