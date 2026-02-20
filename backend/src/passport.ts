import passport from 'passport';
import {
    Strategy as GoogleStrategy,
    Profile,
    VerifyCallback,
} from 'passport-google-oauth20';
import { config } from '../config';
import { query } from '../db';

interface UserRow {
    id: string;
    google_id: string;
    email: string;
    name: string;
    avatar_url: string;
    role: string;
}

// Upsert user on login
passport.use(
    new GoogleStrategy(
        {
            clientID: config.google.clientId,
            clientSecret: config.google.clientSecret,
            callbackURL: config.google.callbackUrl,
        },
        async (_accessToken: string, _refreshToken: string, profile: Profile, done: VerifyCallback) => {
            try {
                const googleId = profile.id;
                const email = profile.emails?.[0]?.value ?? '';
                const name = profile.displayName ?? '';
                const avatarUrl = profile.photos?.[0]?.value ?? '';

                const result = await query<UserRow>(
                    `INSERT INTO users (google_id, email, name, avatar_url)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (google_id)
           DO UPDATE SET
             email      = EXCLUDED.email,
             name       = EXCLUDED.name,
             avatar_url = EXCLUDED.avatar_url,
             updated_at = NOW()
           RETURNING *`,
                    [googleId, email, name, avatarUrl]
                );

                return done(null, result.rows[0]);
            } catch (err) {
                return done(err as Error);
            }
        }
    )
);

// Minimal session serialisation (not used — we use JWT cookies instead)
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user as Express.User));

export default passport;
