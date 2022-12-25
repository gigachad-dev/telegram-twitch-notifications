import { MigrationInterface, QueryRunner } from "typeorm";

export class init1671929303424 implements MigrationInterface {
    name = 'init1671929303424'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "stream" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "title" varchar NOT NULL, "game" varchar NOT NULL, "messageId" integer NOT NULL, "channelId" varchar NOT NULL, "tokenId" integer, CONSTRAINT "REL_d1a3b3b997463e2aadb603d16a" UNIQUE ("tokenId"))`);
        await queryRunner.query(`CREATE TABLE "channel" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "channelId" varchar NOT NULL, "displayName" varchar NOT NULL, "topicId" integer NOT NULL, CONSTRAINT "UQ_ce6adfd740251275f50001afe68" UNIQUE ("channelId"), CONSTRAINT "UQ_9ed5e2b87197f239776a5d86d78" UNIQUE ("displayName"))`);
        await queryRunner.query(`CREATE TABLE "token" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "accessToken" varchar NOT NULL, "refreshToken" varchar NOT NULL, "expiresIn" integer NOT NULL, "obtainmentTimestamp" integer NOT NULL)`);
        await queryRunner.query(`CREATE TABLE "temporary_stream" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "title" varchar NOT NULL, "game" varchar NOT NULL, "messageId" integer NOT NULL, "channelId" varchar NOT NULL, "tokenId" integer, CONSTRAINT "REL_d1a3b3b997463e2aadb603d16a" UNIQUE ("tokenId"), CONSTRAINT "FK_d1a3b3b997463e2aadb603d16a2" FOREIGN KEY ("tokenId") REFERENCES "channel" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_stream"("id", "title", "game", "messageId", "channelId", "tokenId") SELECT "id", "title", "game", "messageId", "channelId", "tokenId" FROM "stream"`);
        await queryRunner.query(`DROP TABLE "stream"`);
        await queryRunner.query(`ALTER TABLE "temporary_stream" RENAME TO "stream"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "stream" RENAME TO "temporary_stream"`);
        await queryRunner.query(`CREATE TABLE "stream" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "title" varchar NOT NULL, "game" varchar NOT NULL, "messageId" integer NOT NULL, "channelId" varchar NOT NULL, "tokenId" integer, CONSTRAINT "REL_d1a3b3b997463e2aadb603d16a" UNIQUE ("tokenId"))`);
        await queryRunner.query(`INSERT INTO "stream"("id", "title", "game", "messageId", "channelId", "tokenId") SELECT "id", "title", "game", "messageId", "channelId", "tokenId" FROM "temporary_stream"`);
        await queryRunner.query(`DROP TABLE "temporary_stream"`);
        await queryRunner.query(`DROP TABLE "token"`);
        await queryRunner.query(`DROP TABLE "channel"`);
        await queryRunner.query(`DROP TABLE "stream"`);
    }

}
