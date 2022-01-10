
export interface Turn {
  cumulative_reward: number,
  nb_pulls: number[],
  nb_rewards: number[],
  reward: number,
  scores: number[],
  selected_arm: number,
  turn: number
}

export interface ExecutionHistory {
  algorithm: string,
  params: {
    name: string,
    value: number
  }[],
  budget: number,
  execution_time: {
    time: number,
    budget: number,
  },
  initial_exploration: {
    pulls: number[],
    rewards: number[]
  },
  nb_arms: number,
  probs: number[],
  time: {
    components: {
      arms: number[],
      comp: number,
      controller: number,
      customer: number
    },
    security: {
      aes: {
        decryption: number,
        encryption: number
      },
      mask: number,
      paillier: {
        addition: number,
        decryption: number,
        encryption: number
      },
      permutation: number
    }
  },
  turns: Turn[]

}
