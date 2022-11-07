const express = require('express');
const expressHandlebars = require('express-handlebars');

const path = require('path');
const mysql = require('mysql2/promise');
const PORT = process.env.PORT || 3000;
const sessions = require("express-session");

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.engine('handlebars', expressHandlebars.engine());
app.set('view engine', 'handlebars');
app.set('views', './views');
app.use(express.static(path.join(__dirname, 'public')));
console.log(path.join(__dirname, 'public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

async function getConnection() {
    const connection = await mysql.createConnection({
        host: '127.0.0.1',
        port: 3306,
        user: 'root',
        password: 'AleBiaGi@1990',
        database: 'brfinancas'
    });
    return connection;
}

async function query(sql = '', values = []) {
    const conn = await getConnection();
    const result = await conn.query(sql, values);
    conn.end();

    return result[0];
}

app.get("/", async function (req, res) {
    const listaLancamentos = await query('SELECT * FROM lancamentos')
    res.render('home', {
        listaLancamentos: listaLancamentos
    })
})

app.get('/contato', function (req, res) {
    res.render('contato')
})

app.get("/delete/produto/:id", async function (req, res) {
    const id = parseInt(req.params.id)
    if (!isNaN(id) && id > 0) {
        await query("DELETE FROM lancamentos WHERE id=?", [id])
    }

    res.redirect("/")
})

app.get('/adicionar', function (req, res) {
    res.render('adicionar')
});

app.post('/adicionar', async function (res, req) {

    let valor = req.body.valor;
    let tipo = req.body.tipo;
    let descricao = req.body.titulo;
    let categoria = req.body.categoria;
    let data = req.body.data;
    let hora = req.body.hora;

    const dadosPage = {
        descricao,
        valor,
        tipo,
        categoria,
        data,
        hora
    }

    try {
        if (!valor || valor <= 0) throw new Error('Valor inválido')
        if (!titulo) throw new Error('Insira um título')
        const sql = 'insert into lancamentos(descricao, valor, tipo, categoria, dia, hora) values (?,?,?,?,?,?);'
        const valores = [descricao, valor, tipo, categoria, dia, hora]
        await query(sql, valores)


    } catch (e) {
        dadosPage.mensagem = e.message;
        dadosPage.cor = 'red'
    }
    res.render('adicionar', dadosPage)
})

app.listen(PORT, function () {
    console.log(`Server is running at port ${PORT}`)
})  