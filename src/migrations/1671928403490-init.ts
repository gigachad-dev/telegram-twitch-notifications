import { MigrationInterface, QueryRunner } from 'typeorm'

export class init1671928403490 implements MigrationInterface {
  name = 'init1671928403490'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "stream" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "title" text NOT NULL, "game" text NOT NULL, "messageId" integer NOT NULL, "channelId" text, "tokenId" integer, CONSTRAINT "REL_d1a3b3b997463e2aadb603d16a" UNIQUE ("tokenId"))`
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_3f6374a1c1282a0d3624361dec" ON "stream" ("channelId") `
    )
    await queryRunner.query(
      `CREATE TABLE "channel" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "channelId" varchar NOT NULL, "displayName" varchar NOT NULL, "topicId" integer NOT NULL, CONSTRAINT "UQ_ce6adfd740251275f50001afe68" UNIQUE ("channelId"), CONSTRAINT "UQ_9ed5e2b87197f239776a5d86d78" UNIQUE ("displayName"))`
    )
    await queryRunner.query(
      `CREATE TABLE "token" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "accessToken" varchar NOT NULL, "refreshToken" varchar NOT NULL, "expiresIn" integer NOT NULL, "obtainmentTimestamp" integer NOT NULL)`
    )
    await queryRunner.query(`DROP INDEX "IDX_3f6374a1c1282a0d3624361dec"`)
    await queryRunner.query(
      `CREATE TABLE "temporary_stream" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "title" text NOT NULL, "game" text NOT NULL, "messageId" integer NOT NULL, "channelId" text, "tokenId" integer, CONSTRAINT "REL_d1a3b3b997463e2aadb603d16a" UNIQUE ("tokenId"), CONSTRAINT "FK_d1a3b3b997463e2aadb603d16a2" FOREIGN KEY ("tokenId") REFERENCES "channel" ("id") ON DELETE SET NULL ON UPDATE CASCADE)`
    )
    await queryRunner.query(
      `INSERT INTO "temporary_stream"("id", "title", "game", "messageId", "channelId", "tokenId") SELECT "id", "title", "game", "messageId", "channelId", "tokenId" FROM "stream"`
    )
    await queryRunner.query(`DROP TABLE "stream"`)
    await queryRunner.query(`ALTER TABLE "temporary_stream" RENAME TO "stream"`)
    await queryRunner.query(
      `CREATE INDEX "IDX_3f6374a1c1282a0d3624361dec" ON "stream" ("channelId") `
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_3f6374a1c1282a0d3624361dec"`)
    await queryRunner.query(`ALTER TABLE "stream" RENAME TO "temporary_stream"`)
    await queryRunner.query(
      `CREATE TABLE "stream" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "title" text NOT NULL, "game" text NOT NULL, "messageId" integer NOT NULL, "channelId" text, "tokenId" integer, CONSTRAINT "REL_d1a3b3b997463e2aadb603d16a" UNIQUE ("tokenId"))`
    )
    await queryRunner.query(
      `INSERT INTO "stream"("id", "title", "game", "messageId", "channelId", "tokenId") SELECT "id", "title", "game", "messageId", "channelId", "tokenId" FROM "temporary_stream"`
    )
    await queryRunner.query(`DROP TABLE "temporary_stream"`)
    await queryRunner.query(
      `CREATE INDEX "IDX_3f6374a1c1282a0d3624361dec" ON "stream" ("channelId") `
    )
    await queryRunner.query(`DROP TABLE "token"`)
    await queryRunner.query(`DROP TABLE "channel"`)
    await queryRunner.query(`DROP INDEX "IDX_3f6374a1c1282a0d3624361dec"`)
    await queryRunner.query(`DROP TABLE "stream"`)
  }
}
