import axios from 'axios'

type EnvVariables = Array<{
  name: string
  value: string
}>

type EndpointId = number

type StackData = {
  Id: number
  Name: string
  EndpointId: EndpointId
  Env: EnvVariables
}

type CreateStackParams = { type: number; method: string; endpointId: EndpointId }
type CreateStackBody = { name: string; stackFileContent: string; swarmID?: string }
type UpdateStackParams = { endpointId: EndpointId }
type UpdateStackBody = {
  env: EnvVariables
  stackFileContent: string
  prune: boolean
  pullImage: boolean
  repullImageAndRedeploy: boolean
}

export class PortainerApi {
  private axiosInstance

  constructor(host: string) {
    this.axiosInstance = axios.create({
      baseURL: `${host}/api`
    })
  }

  async useToken(token: string): Promise<void> {
    this.axiosInstance.defaults.headers.common['X-API-Key'] = token
  }

  async getStacks(endpointId?: number): Promise<StackData[]> {
    // Portainer 2.45 的 filter 键名是 EndpointID（旧版为 EndpointId，写错会静默返回全部环境的 stack）
    const params = endpointId ? { filters: JSON.stringify({ EndpointID: endpointId }) } : undefined
    const { data } = await this.axiosInstance.get<StackData[]>('/stacks', { params })
    return data
  }

  async createStack(params: CreateStackParams, body: CreateStackBody): Promise<void> {
    // Portainer 2.45 移除了 POST /stacks，改为 /stacks/create/{type}/{method}
    const type = params.type === 1 ? 'swarm' : 'standalone'
    await this.axiosInstance.post(`/stacks/create/${type}/${params.method}`, body, {
      params: { endpointId: params.endpointId }
    })
  }

  async updateStack(id: number, params: UpdateStackParams, body: UpdateStackBody): Promise<void> {
    await this.axiosInstance.put(`/stacks/${id}`, body, { params: params })
  }
}
