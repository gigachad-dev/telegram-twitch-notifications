import { MigrationInterface, QueryRunner } from 'typeorm'

export class init1671935766490 implements MigrationInterface {
  name = 'init1671935766490'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "stream" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "title" varchar NOT NULL, "game" varchar NOT NULL, "messageId" integer NOT NULL, "channelId" varchar NOT NULL, CONSTRAINT "REL_3f6374a1c1282a0d3624361dec" UNIQUE ("channelId"))`
    )
    await queryRunner.query(
      `CREATE TABLE "channel" ("id" varchar PRIMARY KEY NOT NULL, "topicId" integer NOT NULL)`
    )
    await queryRunner.query(
      `CREATE TABLE "token" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "accessToken" varchar NOT NULL, "refreshToken" varchar NOT NULL, "expiresIn" integer NOT NULL, "obtainmentTimestamp" integer NOT NULL)`
    )
    await queryRunner.query(
      `CREATE TABLE "temporary_stream" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "title" varchar NOT NULL, "game" varchar NOT NULL, "messageId" integer NOT NULL, "channelId" varchar NOT NULL, CONSTRAINT "REL_3f6374a1c1282a0d3624361dec" UNIQUE ("channelId"), CONSTRAINT "FK_3f6374a1c1282a0d3624361dece" FOREIGN KEY ("channelId") REFERENCES "channel" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`
    )
    await queryRunner.query(
      `INSERT INTO "temporary_stream"("id", "title", "game", "messageId", "channelId") SELECT "id", "title", "game", "messageId", "channelId" FROM "stream"`
    )
    await queryRunner.query(`DROP TABLE "stream"`)
    await queryRunner.query(`ALTER TABLE "temporary_stream" RENAME TO "stream"`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "stream" RENAME TO "temporary_stream"`)
    await queryRunner.query(
      `CREATE TABLE "stream" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "title" varchar NOT NULL, "game" varchar NOT NULL, "messageId" integer NOT NULL, "channelId" varchar NOT NULL, CONSTRAINT "REL_3f6374a1c1282a0d3624361dec" UNIQUE ("channelId"))`
    )
    await queryRunner.query(
      `INSERT INTO "stream"("id", "title", "game", "messageId", "channelId") SELECT "id", "title", "game", "messageId", "channelId" FROM "temporary_stream"`
    )
    await queryRunner.query(`DROP TABLE "temporary_stream"`)
    await queryRunner.query(`DROP TABLE "token"`)
    await queryRunner.query(`DROP TABLE "channel"`)
    await queryRunner.query(`DROP TABLE "stream"`)
  }
}
