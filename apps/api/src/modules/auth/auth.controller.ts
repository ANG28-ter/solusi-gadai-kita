import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginSchema } from './dto/login.dto';
import { Public } from './guards/public.decorator';

@Controller('/api/v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  @Public()
  @Post('login')
  async login(@Body() body: any) {
    const dto = LoginSchema.parse(body);
    console.log('AuthController loaded');
    return this.authService.login(dto.username, dto.password);
  }
}
