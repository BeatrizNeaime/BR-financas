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

    let entradas = 0, saidas = 0, total = 0
    for (let i = 0; i < listaLancamentos.length; i++) {
        if (parseFloat(listaLancamentos[i].valor) >= 0) {
            entradas += parseFloat(listaLancamentos[i].valor)
        } else {
            saidas += parseFloat(listaLancamentos[i].valor)
        }
    }

    let helper
    total = entradas + saidas
    if (total < 0) {
        helper = 0
    } else {
        helper = 1
    }

    res.render('home', {
        listaLancamentos: listaLancamentos,
        entradas: entradas,
        saidas: saidas,
        total: total,
        helper: helper
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

app.get('/editar', function(req,res){
    res.render('editar')
})

app.get('/editar/:id', async function (req, res) {
    const id = parseInt(req.query.id)
    const dadosItem = await query("SELECT * FROM lancamentos WHERE id=?", [id])

    if (dadosItem.length === 0) {
        res.redirect('/')
    }

    const objItem = dadosItem[0]
    res.render('editar', {
        objItem
    })
})

app.post('/editar', async function(req,res){
    let {id, valor, tipo, categoria, titulo, dia, hora} = req.body
    const dados ={
        objItem: {id:id, descricao:titulo, valor:valor, tipo:tipo, categoria:categoria, dia:dia, hora:hora}
    }

    let sql = 'UPDATE lancmentos set valor=?, titulo=?, tipo=?, categoria=?, dia=?, hora=? WHERE id=?';
    let valores = [valor, titulo, tipo, categoria, dia, hora, id]

    await query(sql, valores)

    res.render('editar', dados)
    res.redirect('/')
})

app.get('/adicionar', function (req, res) {
    res.render('adicionar')
});

app.post('/adicionar', async function (req, res) {
    let descricao = req.body.titulo
    let dia = req.body.dia
    let hora = req.body.hora
    let valor = req.body.valor
    let tipo = req.body.tipo ? 0 : 1
    let categoria = req.body.categoria

    if (tipo == 0) {
        valor *= -1
    }

    const dadosPagina = {
        descricao,
        valor,
        tipo,
        categoria,
        dia,
        hora,
    }

    const sql = "INSERT INTO lancamentos (descricao, valor, tipo, categoria, dia, hora) VALUES (?,?,?,?,?,?);"
    const valores = [descricao, valor, tipo, categoria, dia, hora]

    await query(sql, valores)

    dadosPagina.mensagem = "Produto cadastrado com sucesso"

    res.render('adicionar', dadosPagina)
    res.redirect('/')
})

app.listen(PORT, function () {
    console.log(`Server is running at port ${PORT}`)
})  