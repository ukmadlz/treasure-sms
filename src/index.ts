import "dotenv/config";
import Fastify from "fastify";
import FastifySensible from "@fastify/sensible";
import { AuthType, Infobip } from "@infobip-api/sdk";
import { v4 as uuid } from "uuid";

// Fastify & it's configuration
const fastify = Fastify({
  logger: true,
});
fastify.register(FastifySensible);

// Routes
fastify.post("/", async (request: any, reply) => {
  const infobip = new Infobip({
    baseUrl: String(process.env.INFOBIP_BASE_URL),
    apiKey: String(process.env.INFOBIP_API_KEY),
    authType: AuthType.ApiKey,
  });
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
            "a": uuid(),
            "code": process.env.TREASURE_CODE,
            "z": uuid(),
        }),
      },
    ],
  });
  return {};
});

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
