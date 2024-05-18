import { Test } from "@nestjs/testing";
import { DatabaseModule } from "src/database/database.module";
import { SettingsController } from "./settings.controller"
import { SettingsProviders } from "./settings.providers";
import { SettingsService } from "./settings.service";

describe('Setting Service', () => {
    let settingService: SettingsService;

    beforeEach(async () => {
        const moduleRef = await Test.createTestingModule({
            imports: [DatabaseModule],
            controllers: [SettingsController],
            providers: [
                ...SettingsProviders,
                SettingsService
            ],
            exports: [SettingsService]
        }).compile();

        settingService = moduleRef.get<SettingsService>(SettingsService);
    });

    describe('Utilities', () => {
        it('should return random string', () => {
            expect(settingService.generateRandomString(64)).not.toBeNull();
        });

        it('should return key pair', () => {
            jest.spyOn(settingService, 'generateRandomString').mockImplementation(() => 'test_string');

            expect(settingService.generateKeyPair(64)).toStrictEqual({
                privKey: 'sk_test_string',
                pubKey: 'pk_test_string'
            });
        })

        it('should return security base obj', () => {
            jest.spyOn(settingService, 'generateRandomString').mockImplementation(() => 'test_string');
            expect(settingService.generateSecurity()).toStrictEqual({
                emailVerified: false,
                tfaEnabled: false,
                tfaType: null,
                googleSecret: null,
                backup: 'test_string'
            })
        })
    });
})
