import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';

@Injectable()
export class BasicAuthGuard implements CanActivate {
  constructor(
    private readonly configService: ConfigService,
    private readonly reflector: Reflector,
  ) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];

    const isPublic = this.reflector.getAllAndOverride('IS_PUBLIC', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) return true;

    if (!authHeader?.startsWith('Basic ')) {
      throw new UnauthorizedException('Basic authentication required');
    }

    const encodedCredentials = authHeader.split(' ')[1];
    const decodedCredentials = this.decodeCredentials(encodedCredentials);
    return this.validateCredentials(decodedCredentials);
  }

  private decodeCredentials(encodedCredentials: string): {
    username: string;
    password: string;
  } {
    const [username, password] = Buffer.from(encodedCredentials, 'base64')
      .toString('utf-8')
      .split(':');

    return {
      username,
      password,
    };
  }

  private validateCredentials({ username, password }): boolean {
    const apiUsername = this.configService.get('API_USERNAME');
    const apiPassword = this.configService.get('API_PASSWORD');

    const isValid = [apiUsername === username, apiPassword === password].every(
      Boolean,
    );

    if (!isValid) throw new UnauthorizedException('Invalid credentials');

    return true;
  }
}
