import { MigrationInterface, QueryRunner } from 'typeorm'

export class init1672049508584 implements MigrationInterface {
  name = 'init1672049508584'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "stream" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" text, "game" text, "messageId" integer NOT NULL, "channelId" text NOT NULL, CONSTRAINT "REL_3f6374a1c1282a0d3624361dec" UNIQUE ("channelId"), CONSTRAINT "PK_0dc9d7e04ff213c08a096f835f2" PRIMARY KEY ("id"))`
    )
    await queryRunner.query(
      `CREATE TABLE "channel" ("id" text NOT NULL, "topicId" integer NOT NULL, CONSTRAINT "PK_590f33ee6ee7d76437acf362e39" PRIMARY KEY ("id"))`
    )
    await queryRunner.query(
      `CREATE TABLE "token" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "accessToken" text NOT NULL, "refreshToken" text NOT NULL, "expiresIn" integer NOT NULL, "obtainmentTimestamp" TIMESTAMP NOT NULL, CONSTRAINT "PK_82fae97f905930df5d62a702fc9" PRIMARY KEY ("id"))`
    )
    await queryRunner.query(
      `ALTER TABLE "stream" ADD CONSTRAINT "FK_3f6374a1c1282a0d3624361dece" FOREIGN KEY ("channelId") REFERENCES "channel"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "stream" DROP CONSTRAINT "FK_3f6374a1c1282a0d3624361dece"`
    )
    await queryRunner.query(`DROP TABLE "token"`)
    await queryRunner.query(`DROP TABLE "channel"`)
    await queryRunner.query(`DROP TABLE "stream"`)
  }
}
