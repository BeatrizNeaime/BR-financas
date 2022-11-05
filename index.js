const express = require('express');
const expressHandlebars = require('express-handlebars');

const path = require('path');
const bodyParse = require('body-parser');
const mysql = require('mysql2/promise');
const PORT = process.env.PORT || 3000;
const sessions = require("express-session");

const app = express();

app.engine('handlebars', expressHandlebars.engine());
app.set('view engine', 'handlebars');
app.set('views', './views');
app.use(express.static(path.join(__dirname, 'public')));
console.log(path.join(__dirname, 'public'));
app.use(express.urlencoded({extended: true}));
app.use(express.json());

async function getConnection()
{
    const connection = await mysql.createConnection({
        host: '127.0.0.1',
        port: 3306,
        user: 'root',
        password: 'AleBiaGi@1990',
        database: 'brfinancas' 
    });
    return connection;
} 

async function query(sql = '', values = [])
{
    const conn = await getConnection();
    const result = await conn.query(sql, values);
    conn.end();

    return result[0];
} 

app.get("/", async function(req, res) {
    const listaLancamentos = await query('SELECT * FROM lancamentos') 
    res.render('home',{
        listaLancamentos: listaLancamentos
    })
})

app.get('/contato', function(req, res) {
    res.render('contato',{
        nome: "Bia"
    })
})

app.listen(PORT, function(){
    console.log(`Server is running at port ${PORT}`)
})  