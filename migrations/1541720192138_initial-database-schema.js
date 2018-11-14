exports.up = (pgm) => {
  pgm.sql(`
  CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

  CREATE TABLE IF NOT EXISTS credential
  (
    id       uuid DEFAULT uuid_generate_v4() PRIMARY KEY NOT NULL,
    username varchar(255)                                NOT NULL UNIQUE,
    password varchar(128)                                NOT NULL
  );

  CREATE TABLE IF NOT EXISTS account
  (
    id            uuid DEFAULT uuid_generate_v4() PRIMARY KEY NOT NULL,
    first_name    text                                        NOT NULL,
    last_name     text                                        NOT NULL,
    credential_id uuid                                        NOT NULL,
    CONSTRAINT account_credential_fk FOREIGN KEY (credential_id) REFERENCES credential (id) ON DELETE CASCADE ON UPDATE CASCADE
  );
  `)
}

exports.down = (pgm) => {
  pgm.sql(`
  DROP TABLE IF EXISTS account;
  DROP TABLE IF EXISTS credential;
  DROP EXTENSION IF EXISTS "uuid-ossp";
  `)
}
