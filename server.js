const pg = require('pg');
const client = new pg.Client(process.env.DATABASE_URL || 'postgres://localhost/flavors_db');
const express = require('express');
const app = express();
app.use(express.json());

app.get('/api/flavors', async(req, res, next)=> {
    try {
        const SQL = `
            SELECT *
            FROM flavors
        `;
        const response = await client.query(SQL);
        res.send(response.rows);
        
    }
    catch(ex){
        next(ex);
    }
});

app.delete('/api/flavors/:id', async(req, res, next)=> {
    try {
        const SQL = `
            DELETE FROM flavors
            WHERE id = $1
        `;
        await client.query(SQL, [req.params.id]);
        res.sendStatus(204);
        
    }
    catch(ex){
        next(ex);
    }
});

app.post('/api/flavors', async(req, res, next)=> {
    try {
        const SQL = `
            INSERT INTO flavors(txt, category_id)
            VALUES($1, $2)
            RETURNING *
        `;
        const response = await client.query(SQL, [req.body.txt, req.body.category_id]);
        res.status(201).send(response.rows[0]);
        
    }
    catch(ex){
        next(ex);
    }
});

app.put('/api/flavors/:id', async(req, res, next)=> {
    try {
        const SQL = `
            UPDATE flavors
            SET txt=$1, category_id=$2
            WHERE id = $3
            RETURNING *
        `;
        const response = await client.query(SQL, [req.body.txt, req.body.category_id, req.params.id]);
        res.send(response.rows[0]);
    }
    catch(ex){
        next(ex);
    }
});

app.get('/api/categories', async(req, res, next)=> {
    try {
        const SQL = `
            SELECT *
            FROM categories
        `;
        const response = await client.query(SQL);
        res.send(response.rows);
        
    }
    catch(ex){
        next(ex);
    }
});

app.use((err, req, res, next)=> {
    console.log(err);
    res.status(err.status || 500).send({error: err.message || err});
    
});

const init = async()=> {
    await client.connect();
    console.log('connected to database');
    let SQL = `
        DROP TABLE IF EXISTS flavors;
        DROP TABLE IF EXISTS categories;
        CREATE TABLE categories(
            id SERIAL PRIMARY KEY,
            name VARCHAR(20)
        );
        CREATE TABLE flavors(
            id SERIAL PRIMARY KEY,
            txt VARCHAR(200),
            ranking INTEGER DEFAULT 5,
            category_id INTEGER REFERENCES categories(id) NOT NULL
        );
    `;
    await client.query(SQL);
    console.log('tables created');
    SQL = `
        INSERT INTO categories(name) VALUES('Sweet');
        INSERT INTO categories(name) VALUES('Sour');
        INSERT INTO categories(name) VALUES('Bitter');
        INSERT INTO categories(name) VALUES('Spicy');
        INSERT INTO flavors(txt, category_id) VALUES('What is Sweet', (
            SELECT id FROM categories WHERE name = 'Sweet'
        ));
        INSERT INTO flavors(txt, category_id) VALUES('Sour taste example', (
            SELECT id FROM categories WHERE name = 'Sour'
        ));
        INSERT INTO flavors(txt, category_id) VALUES('hot pepper', (
            SELECT id FROM categories WHERE name = 'Spicy'
        ));
    `;
    await client.query(SQL);
    console.log('data seeded');
    const port = process.env.PORT || 3000;
    app.listen(port, ()=> {
    console.log(`listening on port ${port}`)
    console.log('some curl commands to test');
    console.log('curl localhost:8080/api/flavors');
    console.log('curl localhost:8080/api/categories');
    console.log('curl localhost:8080/api/flavors/1 -X DELETE');
    console.log(`curl localhost:8080/api/flavors -X POST -d '{"txt": "nu flavor", "category_id": 1}' -H 'Content-Type:application/json'`);
    console.log(`curl localhost:8080/api/flavors/1 -X PUT -d '{"txt": "updated flavor", "category_id": 1}' -H 'Content-Type:application/json'`);
    });
    
    
};

init();