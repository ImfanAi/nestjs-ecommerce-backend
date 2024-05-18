import { forwardRef, Module } from '@nestjs/common';
import { DatabaseModule } from 'src/database/database.module';
import { ListenerModule } from 'src/listener/listener.module';
import { TokenController } from './token.controller';
import { TokenProviders } from './token.providers';
import { TokenService } from './token.service';

@Module({
    imports: [
        DatabaseModule, forwardRef(() => ListenerModule)],
    providers: [
        ...TokenProviders,
        TokenService
    ],
    controllers: [TokenController],
    exports: [TokenService]
})

export class TokensModule {}
