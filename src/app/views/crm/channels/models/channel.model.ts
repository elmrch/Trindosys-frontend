export interface Channel {
  id: number;
  code: string;
  name: string;
  description: string;
  active: boolean;
}

export interface ChannelConnection {
  id: number;
  channelCode: string;
  name: string;
  externalId: string;
  maskedToken: string;
  webhookUrl: string | null;
  active: boolean;
  createdAt: string;
}

export interface ChannelConnectionRequest {
  channelId: number;
  name: string;
  externalId: string;
  token: string;
  webhookUrl: string | null;
  active: boolean;
}

export interface ChannelConnectionWithChannel extends ChannelConnection {
  channelId: number;
  channelName: string;
}
