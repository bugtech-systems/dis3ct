export const types = ["Ollama"] as const

export type ModelType = (typeof types)[number]

export interface Model<Type = string> {
  id: string
  name: string
  description: string
  type: Type
}

export const models: Model<ModelType>[] = [
  {
    id: "llama3.1",
    name: "llama3.1",
    description:
      "Llama 3.1 is a new state-of-the-art model from Meta available in 8B, 70B and 405B parameter sizes.",
    type: "Ollama",
    
  },
  {
    id: "llama3.2",
    name: "llama3.2",
    description: "Meta's Llama 3.2 goes small with 1B and 3B models.",
    type: "Ollama"
  }
 
]
