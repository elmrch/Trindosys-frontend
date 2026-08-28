export interface Channel {
  id: number;
  code: string;
  name: string;
  description: string;
  active: boolean;
}

export type ChannelProvider = 'meta-cloud-api' | 'evolution-api';

export interface ChannelConnection {
  id: number;
  channelCode: string;
  name: string;
  externalId: string;
  maskedToken: string;
  webhookUrl: string | null;
  provider: ChannelProvider;
  active: boolean;
  createdAt: string;
  createdBy: number | null;
  updatedAt: string | null;
  updatedBy: number | null;
}

export interface ChannelConnectionRequest {
  channelId: number;
  name: string;
  externalId: string;
  token: string;
  webhookUrl?: string;
  provider: ChannelProvider;
  active: boolean;
}

export interface ChannelConnectionWithChannel extends ChannelConnection {
  channelId: number;
  channelName: string;
}

export type EvolutionConnectionStatus = 'open' | 'connecting' | 'close';

export interface EvolutionConnectResponse {
  connectionId: number;
  instanceName: string;
  status: EvolutionConnectionStatus;
  qrcode: {
    base64: string;
    count: number;
  } | null;
}

export interface EvolutionStatusResponse {
  connectionId: number;
  instanceName: string;
  status: EvolutionConnectionStatus;
  profileName: string | null;
  number: string | null;
  profilePictureUrl: string | null;
}

export interface ChannelIconConfig {
  icon: string;
  bgColor: string;
  textColor: string;
}

export interface IntegrationCard {
  id: string;
  title: string;
  description: string;
  channelCode: string;
  provider: ChannelProvider;
  emptyText: string;
  iconBg: string;
  iconText: string;
  iconPath: string;
}

export const INTEGRATION_CARDS: IntegrationCard[] = [
  {
    id: 'whatsapp-cloud',
    title: 'WhatsApp Cloud API (oficial)',
    description: 'Envía y recibe mensajes reales de WhatsApp Business. Puedes conectar varios números con sus propias credenciales de Meta.',
    channelCode: 'WHATSAPP',
    provider: 'meta-cloud-api',
    emptyText: 'Todavía no conectaste ningún número.',
    iconBg: 'bg-green-50 dark:bg-green-500/10',
    iconText: 'text-green-600 dark:text-green-400',
    iconPath: 'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z',
  },
  {
    id: 'whatsapp-qr',
    title: 'WhatsApp por QR',
    description: 'Vinculá uno o varios números de WhatsApp escaneando un código QR, sin depender de la aprobación de Meta.',
    channelCode: 'WHATSAPP',
    provider: 'evolution-api',
    emptyText: 'Todavía no agregaste ningún número.',
    iconBg: 'bg-green-50 dark:bg-green-500/10',
    iconText: 'text-green-600 dark:text-green-400',
    iconPath: 'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z',
  },
  {
    id: 'instagram',
    title: 'Instagram',
    description: 'Mensajes directos de Instagram via NotificaMe Hub, sin necesitar tu propia app de Meta aprobada.',
    channelCode: 'INSTAGRAM',
    provider: 'meta-cloud-api',
    emptyText: 'Todavía no agregaste ningún número.',
    iconBg: 'bg-pink-50 dark:bg-pink-500/10',
    iconText: 'text-pink-600 dark:text-pink-400',
    iconPath: 'M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2m-.2 2A3.6 3.6 0 0 0 4 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6C20 5.61 18.39 4 16.4 4H7.6m9.65 1.5a1.25 1.25 0 0 1 1.25 1.25A1.25 1.25 0 0 1 17.25 8 1.25 1.25 0 0 1 16 6.75a1.25 1.25 0 0 1 1.25-1.25M12 7a5 5 0 0 1 5 5 5 5 0 0 1-5 5 5 5 0 0 1-5-5 5 5 0 0 1 5-5m0 2a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3z',
  },
  {
    id: 'messenger',
    title: 'Messenger',
    description: 'Mensajes de Messenger via NotificaMe Hub, sin necesitar tu propia app de Meta aprobada.',
    channelCode: 'MESSENGER',
    provider: 'meta-cloud-api',
    emptyText: 'Todavía no conectaste Messenger.',
    iconBg: 'bg-blue-50 dark:bg-blue-500/10',
    iconText: 'text-blue-600 dark:text-blue-400',
    iconPath: 'M12 2C6.48 2 2 6.04 2 11c0 2.83 1.36 5.35 3.5 7.02V22l3.58-1.96c.96.27 1.97.41 3.02.41 5.52 0 10-4.04 10-9S17.52 2 12 2zm1 11.5l-2.5-2.7L6 12.5l4.5-4.8 2.5 2.7L17 7.7l-4 5.8z',
  },
  {
    id: 'email',
    title: 'Correo (IMAP/SMTP)',
    description: 'Conecta una casilla de correo para recibir y responder emails desde la Bandeja de entrada, junto al resto de tus canales.',
    channelCode: 'EMAIL',
    provider: 'meta-cloud-api',
    emptyText: 'Todavía no conectaste ningún correo.',
    iconBg: 'bg-red-50 dark:bg-red-500/10',
    iconText: 'text-red-600 dark:text-red-400',
    iconPath: 'M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z',
  },
];

export const CHANNEL_ICONS: Record<string, ChannelIconConfig> = {
  WHATSAPP: {
    icon: 'M9.5 4C6.5 4 4 6.5 4 9.5S6.5 15 9.5 15l.7-.7C7.8 12.8 7 11.3 7 9.5 7 8.1 8.1 7 9.5 7s2.5 1.1 2.5 2.5c0 1.8-.8 3.3-2.2 4.3L9.5 14c1.9 0 3.5-1.6 3.5-3.5S11.4 4 9.5 4zm5 0C11.5 4 9 6.5 9 9.5S11.5 15 14.5 15l.7-.7C13.3 12.8 12 11.3 12 9.5 12 8.1 13.1 7 14.5 7S17 8.1 17 9.5c0 1.8-1.3 3.3-2.7 4.3L14.5 14c1.9 0 3.5-1.6 3.5-3.5S16.4 4 14.5 4z',
    bgColor: 'bg-green-50 dark:bg-green-500/10',
    textColor: 'text-green-600 dark:text-green-400',
  },
  INSTAGRAM: {
    icon: 'M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2m-.2 2A3.6 3.6 0 0 0 4 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6C20 5.61 18.39 4 16.4 4H7.6m9.65 1.5a1.25 1.25 0 0 1 1.25 1.25A1.25 1.25 0 0 1 17.25 8 1.25 1.25 0 0 1 16 6.75a1.25 1.25 0 0 1 1.25-1.25M12 7a5 5 0 0 1 5 5 5 5 0 0 1-5 5 5 5 0 0 1-5-5 5 5 0 0 1 5-5m0 2a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3z',
    bgColor: 'bg-pink-50 dark:bg-pink-500/10',
    textColor: 'text-pink-600 dark:text-pink-400',
  },
  MESSENGER: {
    icon: 'M12 2C6.48 2 2 6.04 2 11c0 2.83 1.36 5.35 3.5 7.02V22l3.58-1.96c.96.27 1.97.41 3.02.41 5.52 0 10-4.04 10-9S17.52 2 12 2zm1 11.5l-2.5-2.7L6 12.5l4.5-4.8 2.5 2.7L17 7.7l-4 5.8z',
    bgColor: 'bg-blue-50 dark:bg-blue-500/10',
    textColor: 'text-blue-600 dark:text-blue-400',
  },
  EMAIL: {
    icon: 'M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z',
    bgColor: 'bg-red-50 dark:bg-red-500/10',
    textColor: 'text-red-600 dark:text-red-400',
  },
};
