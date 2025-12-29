import {
  AuthenticationState,
  SignalDataTypeMap,
  initAuthCreds,
  BufferJSON,
} from 'baileys';
import { WhatsappService } from '../whatsapp.service';

export async function useDbAuthState(
  whatsappService: WhatsappService,
  accountId: string,
): Promise<{
  state: AuthenticationState;
  saveCreds: () => Promise<void>;
}> {
  const account = await whatsappService.findOne(accountId);

  let creds = account.baileysSession?.creds
    ? JSON.parse(
        JSON.stringify(account.baileysSession.creds),
        BufferJSON.reviver,
      )
    : initAuthCreds();

  let keys = account.baileysSession?.keys || {};

  const saveCreds = async () => {
    try {
      const session = {
        creds: JSON.parse(JSON.stringify(creds), BufferJSON.replacer),
        keys,
      };
      await whatsappService.updateSession(accountId, session);
      console.log(`✅ Credenciales guardadas para cuenta: ${accountId}`);
    } catch (error) {
      console.error(
        `❌ Error guardando credenciales para ${accountId}:`,
        error,
      );
    }
  };

  return {
    state: {
      creds,
      keys: {
        get: (type: keyof SignalDataTypeMap, ids: string[]) => {
          const data: { [id: string]: any } = {};
          ids.forEach((id) => {
            let value = keys[`${type}-${id}`];
            if (value) {
              if (typeof value === 'string') {
                value = JSON.parse(value, BufferJSON.reviver);
              }
              data[id] = value;
            }
          });
          return data;
        },
        set: (data: any) => {
          for (const category in data) {
            for (const id in data[category]) {
              const value = data[category][id];
              const key = `${category}-${id}`;
              keys[key] = JSON.stringify(value, BufferJSON.replacer);
            }
          }
        },
      },
    },
    saveCreds,
  };
}
