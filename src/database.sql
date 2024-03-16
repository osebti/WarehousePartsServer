CREATE EXTENSION IF NOT EXISTS "uuid-ossp";



CREATE TABLE IF NOT EXISTS PARTS(
    id  SERIAL,
    name TEXT,
    type TEXT
    release_date INTEGER,
    core_clock REAL,
    boost_clock REAL,
    clock_unit TEXT,
    price REAL,
    TDP INTEGER,
    part_no TEXT,
    PRIMARY KEY (id)
    
);





