import { forwardRef, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import axios from 'axios';
import crypto from 'crypto';
import { CallbackBody } from 'src/baseListener/callback.body';
import { CallbackStatusService } from 'src/callback-status/callback-status.service';
import { Setting } from 'src/settings/entities/setting.entity';
import { SettingsService } from 'src/settings/settings.service';

@Injectable()
export class UtilsService {
    constructor(
        private readonly settingsService: SettingsService,
        @Inject(forwardRef(() => CallbackStatusService))
        private readonly callbackService: CallbackStatusService
    ) {}

    generateRandomId(length: number) : string {
        let result             = '';
        const characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        const charactersLength = characters.length;
        for ( var i = 0; i < length; i++ ) {
            result += characters.charAt(Math.floor(Math.random() *
                charactersLength));
        }
        return result;
    }

    async sendCallback(setting: Setting, body: CallbackBody, callback: string, resend?: boolean) {
        const { pubKey, privKey } = setting;
        const signature = crypto.createHmac('sha512', privKey);
        const ts = Math.floor(Date.now() / 1000);
        signature.update(ts + 'POST' + JSON.stringify(body));
        const _hmac = signature.digest('hex');

        try {
            const { status } = await axios.post(
                callback, body, {
                    headers: {
                        'X-Auth-Token': _hmac,
                        'X-Auth-Key': pubKey,
                        'X-Auth-Ts': ts
                    }
                }
            );
            // store ipn history
            await this.callbackService.insertNewCallbackStatus({
                user: setting.user,
                callback,
                content: JSON.stringify(body),
                status: status === 200 ? 'success' : 'failed',
                statusCode: status
            })
            return status;
        } catch (error) {
            console.log('--------- cannot send callback -----------');
            console.log(JSON.stringify(error));

            // store ipn history
            await this.callbackService.insertNewCallbackStatus({
                user: setting.user,
                callback,
                content: JSON.stringify(body),
                status: 'failed',
                statusCode: 502
            })
            return 502;
        }

    }

    async checkServerRequest(headers: any, body: string): Promise<Setting> {
        const hmac = headers['x-auth-token'];
        console.log('hmac: ', hmac);
        if(!hmac) throw new UnauthorizedException();
        const pubKey = headers['x-auth-key'];
        if(!pubKey) throw new UnauthorizedException();
        const ts = headers['x-auth-ts'];
        if(!ts) throw new UnauthorizedException();
        const _ts = Math.floor(Date.now() / 1000);
        if(_ts < ts || (_ts - ts) > 60) throw new UnauthorizedException();

        const setting = await this.settingsService.findOne({pubKey});
        const signature = crypto.createHmac('sha512', setting.privKey);
        signature.update(ts + 'POST' + JSON.stringify(body))

        const _hmac = signature.digest('hex');
        console.log('body: ', body);
        console.log('calculated: ', _hmac);
        if(hmac !== _hmac) throw new UnauthorizedException();
        return setting;
    }
}
