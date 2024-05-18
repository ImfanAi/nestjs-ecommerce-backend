import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { AddressService } from 'src/address/address.service';
import { BalanceService } from 'src/balance/balance.service';
import { RequestService } from 'src/request/request.service';
import { Setting, WITHDRAW_ADDRESS } from 'src/settings/entities/setting.entity';
import { SettingsService } from 'src/settings/settings.service';
import { SupportedTokenService } from 'src/supportedToken/supportedToken.service';

@Injectable()
export class TasksService {
    constructor(
        private readonly settingService: SettingsService,
        private readonly supTokenService: SupportedTokenService,
        private readonly balanceService: BalanceService,
        private readonly addressService: AddressService,
        private readonly requestService: RequestService
    ) {}

    private readonly logger = new Logger(TasksService.name);

    // handling expired requests
    @Cron('0 0 * * * *')
    async hourlyChecking() {
        // request expired
        const expiredRequests = await this.requestService.getExpired(8);

        expiredRequests.forEach(async request => {
            // Release address
            await this.addressService.updateAddressStatus(
                request.address.address, true
            );
        })
        await this.requestService.expireFlag(8);
    }

    @Cron('0 0 0 * * *')
    async dailyChecking() {
        // get daily settings
        const settings = await this.settingService.findByWithdrawSetting(1);

        // per user
        await this.sendFunds(settings);
    }

    @Cron('* * * * * 1')
    async weeklyChecking() {
        // get daily settings
        const settings = await this.settingService.findByWithdrawSetting(7);

        // per user
        await this.sendFunds(settings);
    }

    @Cron('0 0 0 1 * *')
    async monthlyChecking() {
        // get daily settings
        const settings = await this.settingService.findByWithdrawSetting(30);

        // per user
        await this.sendFunds(settings);
    }

    @Cron('0 0 0 1 1 *')
    async yearlyChecking() {
        // get daily settings
        const settings = await this.settingService.findByWithdrawSetting(365);

        // per user
        await this.sendFunds(settings);
    }

    private async sendFunds(settings: Setting[]) {
        settings.forEach(async setting => {
            const netWithdrawAddressMap = new Map();
            setting.withdrawAddresses.forEach((m: WITHDRAW_ADDRESS) => {
                netWithdrawAddressMap.set(m.network, m.address);
            })
            // per balance
            const balances = await this.balanceService.getBalances(setting.user);
            balances.forEach(async balance => {
                // send funds and deduct balance
                const { network, address } = balance.token;
                const to = netWithdrawAddressMap.get(network);
                const hash = this.addressService.withdrawFunds(network, to, balance.balance, address);

                // check hash
                if(hash === null) {

                    return;
                }

                // update balance
                await this.balanceService.setBalance(setting.user, balance.token, 0);
            })
        })
    }

}
