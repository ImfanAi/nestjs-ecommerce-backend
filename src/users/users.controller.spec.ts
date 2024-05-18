import { CacheModule } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { DatabaseModule } from "src/database/database.module";
import { MailModule } from "src/mail/mail.module";
import { SettingsModule } from "src/settings/settings.module";
import { UtilsModule } from "src/utils/utils.module";
import { UsersController } from "./users.controller"
import { UserProviders } from "./users.providers";
import { UsersService } from "./users.service";
import * as redisStore from 'cache-manager-redis-store';
import { UtilsService } from "src/utils/utils.service";

describe('UserController', () => {
    let userController: UsersController;
    let userService: UsersService;
    let utilsService: UtilsService;

    beforeEach(async () => {
        const app: TestingModule = await Test.createTestingModule({
            imports: [
                DatabaseModule,
                SettingsModule,
                MailModule,
                UtilsModule,
                CacheModule.register({
                    isGlobal: true,
                    store: redisStore,
                    host: process.env.REDIS,
                    port: 6379
                }),
            ],
            controllers: [UsersController],
            providers: [
                ...UserProviders,
                UsersService
            ],
            exports: [UsersService]
        }).compile();

        userController = app.get<UsersController>(UsersController);
        userService = app.get<UsersService>(UsersService);
        utilsService = app.get<UtilsService>(UtilsService);
    });

    describe('Create & Verify user', () => {
        it('', async () => {
            // console.log(await userController.findAll())
        })
    })


})
