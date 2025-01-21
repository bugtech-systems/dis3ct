export const types = ["GPT-3", "Codex", "OLLAMA"] as const

export type ModelType = (typeof types)[number]

export interface Model<Type = string> {
  id: string
  name: string
  description: string
  strengths?: string
  type: Type
}

export const models: Model<ModelType>[] = [
  {
    id: "llama3.2",
    name: "Llama 3.2 Vision 11B",
    "description": "A multimodal large language model capable of processing and generating text and images, optimized for visual recognition, image reasoning, captioning, and answering general questions about images.",
    "type": "OLLAMA",
    "strengths": "Visual question answering, image captioning, document analysis, visual grounding"
  },
  {
    id: "llama3.1",
    name: "Llama 3.1 8B",
    "description": "A multilingual large language model with 8 billion parameters, supporting a context length of 128K, state-of-the-art tool use, and strong reasoning capabilities.",
    "type": "OLLAMA",
    "strengths": "Long-form text summarization, multilingual conversational agents, coding assistants"
  },
  // {
  //   id: "c305f976-8e38-42b1-9fb7-d21b2e34f0da",
  //   name: "text-davinci-003",
  //   description:
  //     "Most capable GPT-3 model. Can do any task the other models can do, often with higher quality, longer output and better instruction-following. Also supports inserting completions within text.",
  //   type: "GPT-3",
  //   strengths:
  //     "Complex intent, cause and effect, creative generation, search, summarization for audience",
  // },
  // {
  //   id: "464a47c3-7ab5-44d7-b669-f9cb5a9e8465",
  //   name: "text-curie-001",
  //   description: "Very capable, but faster and lower cost than Davinci.",
  //   type: "GPT-3",
  //   strengths:
  //     "Language translation, complex classification, sentiment, summarization",
  // },
  // {
  //   id: "ac0797b0-7e31-43b6-a494-da7e2ab43445",
  //   name: "text-babbage-001",
  //   description: "Capable of straightforward tasks, very fast, and lower cost.",
  //   type: "GPT-3",
  //   strengths: "Moderate classification, semantic search",
  // },
  // {
  //   id: "be638fb1-973b-4471-a49c-290325085802",
  //   name: "text-ada-001",
  //   description:
  //     "Capable of very simple tasks, usually the fastest model in the GPT-3 series, and lowest cost.",
  //   type: "GPT-3",
  //   strengths:
  //     "Parsing text, simple classification, address correction, keywords",
  // },
  // {
  //   id: "b43c0ea9-5ad4-456a-ae29-26cd77b6d0fb",
  //   name: "code-davinci-002",
  //   description:
  //     "Most capable Codex model. Particularly good at translating natural language to code. In addition to completing code, also supports inserting completions within code.",
  //   type: "Codex",
  // },
  // {
  //   id: "bbd57291-4622-4a21-9eed-dd6bd786fdd1",
  //   name: "code-cushman-001",
  //   description:
  //     "Almost as capable as Davinci Codex, but slightly faster. This speed advantage may make it preferable for real-time applications.",
  //   type: "Codex",
  //   strengths: "Real-time application where low-latency is preferable",
  // },
]
