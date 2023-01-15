export class Tokens {
  constructor(
    public accessToken: string,
    public refreshToken: string,
    public expiresIn: number,
    public obtainmentTimestamp: Date,
    public scopes: string[] = []
  ) {}
}
