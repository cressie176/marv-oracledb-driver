BEGIN
  EXECUTE IMMEDIATE
    'INSERT INTO foo (id, value) VALUES (1, ''foo'')';
COMMIT;
END;
