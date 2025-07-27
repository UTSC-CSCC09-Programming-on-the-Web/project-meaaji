import { Worker } from "bullmq";
import { CohereClient } from "cohere-ai";
const cohere = new CohereClient({ token: process.env.CO_API_KEY });
import "dotenv/config";


async function isContentKidFriendly(text) {
  console.log("[Moderation] Checking content safety...");

  try {
    const response = await cohere.chat({
      message: `
You are a content moderator for children's stories.
Analyze the following text and respond with only one word:
"YES" if the text is safe and appropriate for kids,
"NO" if it contains inappropriate or harmful content.
Do not provide any explanations.

Text: ${text}
      `,
      model: "command", // or "command-r+" if supported
      temperature: 0,
      max_tokens: 5,
    });

    const answer = response.text.trim().toUpperCase();
    console.log(`[Moderation] Cohere response: "${answer}"`);

    return answer === "YES";
  } catch (error) {
    console.error("[Moderation] Cohere API error:", error);
    throw new Error("Moderation service failed");
  }
}


async function handleModerationJob(jobData) {
  console.log(`[Job ${jobData.id || "unknown"}] Handling moderation for title: "${jobData.title}"`);
  const { title, prompt } = jobData;
  const textToCheck = `${title}\n${prompt}`;

  const allowed = await isContentKidFriendly(textToCheck);

  if (!allowed) {
    console.warn(`[Job ${jobData.id || "unknown"}] Content flagged as inappropriate.`);
    throw new Error("Content flagged as inappropriate for kids");
  }

  console.log(`[Job ${jobData.id || "unknown"}] Content passed moderation.`);
  return { allowed: true };
}

const storybookModerationWorker = new Worker(
  "storybookModeration",
  async (job) => {
    console.log(`🔄 Processing job ${job.id} with title: "${job.data.title}"`);
    return handleModerationJob(job.data);
  },
  {
    connection: {
      host: process.env.REDIS_HOST || "localhost",
      port: parseInt(process.env.REDIS_PORT) || 6381,
    },
  }
);

console.log("🚀 Storybook Moderation Worker is running and waiting for jobs...");

storybookModerationWorker.on("completed", (job) => {
  console.log(`✅ Moderation job ${job.id} completed successfully.`);
});

storybookModerationWorker.on("failed", (job, err) => {
  console.error(`❌ Moderation job ${job.id} failed:`, err.message);
});

export { storybookModerationWorker };
