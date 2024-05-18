import { BadRequestException, CacheModule, forwardRef } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { BalanceModule } from "src/balance/balance.module";
import { DatabaseModule } from "src/database/database.module";
import { Token } from "src/tokens/token.entity";
import { TokensModule } from "src/tokens/token.module";
import { TokenService } from "src/tokens/token.service";
import { UsersModule } from "src/users/users.module";
import { UsersService } from "src/users/users.service";
import { SupportedTokenController } from "./supportedToken.controller";
import { SupportedTokenProviders } from "./supportedToken.provider";
import { SupportedTokenService } from "./supportedToken.service";
import * as redisStore from 'cache-manager-redis-store';

describe('Supported Token Controller & Service', () => {
    let token: Token;
    let userService: UsersService;
    let tokenService: TokenService;
    let supportedTokenService: SupportedTokenService;
    let supportedTokenController: SupportedTokenController;

    beforeEach(async () => {
        const app = await Test.createTestingModule({
            imports: [
                DatabaseModule,
                UsersModule,
                forwardRef(() => TokensModule),
                BalanceModule,
                CacheModule.register({
                    isGlobal: true,
                    store: redisStore,
                    host: process.env.REDIS,
                    port: 6379
                }),
            ],
            controllers: [SupportedTokenController],
            providers: [
                ...SupportedTokenProviders,
                SupportedTokenService
            ],
            exports: [SupportedTokenService]
        }).compile()

        supportedTokenController = app.get<SupportedTokenController>(SupportedTokenController);
        supportedTokenService = app.get<SupportedTokenService>(SupportedTokenService);
        userService = app.get<UsersService>(UsersService);
        tokenService = app.get<TokenService>(TokenService);
    });

    // assume user_id: 31 exists
    describe('Enable token', () => {

        it('No token case should throw error', async () => {
            const user = await userService.findOne({id: 31}, ['security', 'setting']);

            // no exist token should be throw
            const noToken = {network: 'noNetwork', name: 'noName', flag: true};
            try {
                await supportedTokenController.enableToken({user}, noToken)
            } catch (err) {
                expect(err).toStrictEqual(new BadRequestException({
                    status: 'error',
                    msg: 'There is no such token'
                }));
            }
        });

        it('Enable token with existing one', async () => {
            const user = await userService.findOne({id: 31}, ['security', 'setting']);

            const tokenList: Token[] = await tokenService.all();
            expect(tokenList.length).toBeGreaterThan(0);

            token = tokenList[0];
            const suppToken = {
                flag: true,
                network: token.network,
                name: token.name,
                user: user
            }
            expect(await supportedTokenController.enableToken({user}, suppToken)).toBeDefined();
        });
    })

    describe('Selecting & Checking token', () => {

        it('select all supported token belongs to user', async () => {
            const user = await userService.findOne({id: 31}, ['security', 'setting']);
            const supTokens = await supportedTokenService.selectAll(user);
            expect(supTokens.length).toBeGreaterThan(0);
        })

        it('It should be shown at check', async () => {
            const user = await userService.findOne({id: 31}, ['security', 'setting']);
            const supToken = await supportedTokenService.checkToken(user, token.network, token.name);
            expect(supToken).toBeDefined();
        })

        it('Check for the disabled token', async () => {
            const user = await userService.findOne({id: 31}, ['security', 'setting']);
            const supToken = {
                flag: false,
                network: token.network,
                name: token.name,
                user
            }
            await supportedTokenController.enableToken({user}, supToken);
            expect(await supportedTokenService.checkToken(user, token.network, token.name)).toBeNull();
        })
    })
})
