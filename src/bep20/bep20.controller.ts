import { Body, Controller, Headers, Post } from "@nestjs/common";
import { CreateBep20Dto } from "./bep20.dto";
import { Bep20Service } from "./bep20.service";
import { UtilsService } from "src/utils/utils.service";

@Controller('wallet') 
export class Bep20Controller {
    constructor(
        private readonly bep20Service: Bep20Service,
        private readonly utilService: UtilsService
    ) {}

    @Post() 
    async insert(@Headers() headers: any, @Body() createBep20: CreateBep20Dto) {
        // auth 
        const setting = await this.utilService.checkServerRequest(headers, JSON.stringify(createBep20));
        createBep20.user = setting.user;
        createBep20.setting = setting;
        return await this.bep20Service.create(createBep20);
    }

}