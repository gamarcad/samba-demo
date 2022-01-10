export interface SambaConfigs {
  colors: {
    node: string,
    controller: string,
    customer: string,
    comp: string,
  }
}

export class SambaConfigsFabric {
  static configs() : SambaConfigs {
    return {
      colors: {
        node: "#4a4ae5",
        controller: "#ff8080",
        customer: "#98d963",
        comp: "#e84ee8",
      }
    }
  }
}
