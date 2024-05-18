import { Controller, Get, Post, Body, Param, UseGuards, Request, Query, Req, Put } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { UpdateSettingDto } from './dto/update-setting.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { Setting } from './entities/setting.entity';

@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async findOne(@Param('id') id: number) {
    return await this.settingsService.findOne({id});
  }

  @UseGuards(JwtAuthGuard)
  @Put()
  async update(@Request() req: any, @Body() updateSettingDto: UpdateSettingDto) {
    const settingId = req.user.setting;
    await this.settingsService.update(settingId, updateSettingDto);
    return await this.settingsService.findOne({id: settingId})
  }

  @UseGuards(JwtAuthGuard)
  @Post('keypair')
  async requestNewKeyPair(@Req() req: any) {
    const settingId = req.user.setting;
    const keypair = this.settingsService.generateKeyPair(64);
    await this.settingsService.update(settingId, keypair);
    return keypair;
  }

  @UseGuards(JwtAuthGuard)
  @Put('withdraw')
  async updateWithdrawAddress(
    @Req() req: any,
    @Query('network') network: string,
    @Query('address') address: string
  ) {
    const settingId = req.user.setting;
    const setting: Setting = await this.settingsService.findOne({id: settingId});
    const withdrawAddresses = setting.withdrawAddresses;

    const withdrawAddress = withdrawAddresses.find(w => w.network === network);
    if(withdrawAddress === null) {
      setting.withdrawAddresses.push({
        network,
        address
      })
    } else {
      withdrawAddress.address = address;
    }
    await this.settingsService.update(settingId, setting);
    return await this.settingsService.findOne({id: settingId})

  }
}
