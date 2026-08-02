import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-github2';
import { AuthService } from './auth.service';

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(private authService: AuthService) {
    super({
      clientID: process.env.GITHUB_CLIENT_ID || 'github_client_id',
      clientSecret: process.env.GITHUB_CLIENT_SECRET || 'github_client_secret',
      callbackURL:
        process.env.GITHUB_CALLBACK_URL ||
        `${process.env.BACKEND_URL || 'http://localhost:3000'}/auth/github/callback`,
      scope: ['user:email'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: (error: any, user?: any) => void,
  ): Promise<any> {
    try {
      const user = await this.authService.validateOAuthLogin(profile, 'github');
      done(null, user);
    } catch (err) {
      done(err, false);
    }
  }
}
