BEGIN
  EXECUTE IMMEDIATE
    'INSERT INTO bar (id, value) VALUES (1, ''bar'')';
COMMIT;
END;
