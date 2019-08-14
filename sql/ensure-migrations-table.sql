CREATE TABLE migrations (
  "level" INTEGER,
  "comment" VARCHAR2(255),
  "timestamp" TIMESTAMP WITH TIME ZONE,
  checksum VARCHAR2(32),
  namespace VARCHAR(255) DEFAULT 'default',
  CONSTRAINT migrations_pk PRIMARY KEY ("level", namespace)
)
