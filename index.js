const express = require('express');
const expressHandlebars = require('express-handlebars');

const path = require('path');
const mysql = require('mysql2/promise');
const PORT = process.env.PORT || 3000;
const sessions = require("express-session");
const cookieParser = require("cookie-parser");
const uuidv4 = require('uuid').v4;

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.engine('handlebars', expressHandlebars.engine());
app.set('view engine', 'handlebars');
app.set('views', './views');
app.use(express.static(path.join(__dirname, 'public')));
console.log(path.join(__dirname, 'public'));
app.use(express.json());
app.use(cookieParser());
app.use(sessions({
    secret: "thisIsMySecretKey",
    saveUninitialized: true,
    resave: false,
    name: 'Cookie de Sessao',
    cookie: { maxAge: 1000 * 60 * 3 } // 3 minutos
}));

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

/* --- LOGIN --- */

app.use("*", async function (req, res, next) {
    if (!req.session.usuario && req.cookies.token) {
        const resultado = await query("SELECT * FROM users WHERE token = ?", [req.cookies.token]);
        if (resultado.length) {
            req.session.usuario = resultado[0];
        }
    }
    next();
});

/* --- MÉTODOS GET --- */

app.get("/", async function (req, res) {
    if (!req.body.usuario) {
        res.redirect("/login")
    } else {
        const listaLancamentos = await query('SELECT * FROM lancamentos WHERE usuario = ?', [usuario_id])
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
    }
})

app.get('/login', function (req, res) {
    res.render('login', {
        titulo: "Faça login em sua conta"
    })
})

app.get('/sobre', function (req, res) {
    res.render('sobre')
})

app.get('/contato', async function (req, res) {
    const contatos = await query('SELECT * FROM contatos')

    let nome = contatos[0].nome
    let email = contatos[0].email
    let mensagem = contatos[0].mensagem

    res.render('contato', {
        contatos: contatos,
        nome: nome,
        email: email,
        mensagem: mensagem
    })
})

app.get("/delete/produto/:id", async function (req, res) {
    const id = parseInt(req.params.id)
    if (!isNaN(id) && id > 0) {
        await query("DELETE FROM lancamentos WHERE id=?", [id])
    }

    res.redirect("/")
})

app.get('/editar', async function (req, res) {
    const id = parseInt(req.query.id)
    const dadosItem = await query("SELECT * FROM lancamentos WHERE id=?", [id])

    if (dadosItem.length === 0) {
        res.redirect('/')
    }

    res.render('editar', {
        id: dadosItem[0].id,
        descricao: dadosItem[0].descricao,
        dia: dadosItem[0].dia,
        hora: dadosItem[0].hora,
        tipo: dadosItem[0].tipo,
        valor: dadosItem[0].valor,
        categoria: dadosItem[0].categoria
    })
})

app.get('/adicionar', function (req, res) {
    res.render('adicionar')
})

app.get('/cadastro', function (req, res) {
    res.render('cadastro', {
        titulo: "Cadastro"
    })
})

app.get('/logout', function (req, res) {
    res.cookie('token', "")
    req.session.destroy()
    res.redirect('/login')
})

/* --- MÉTODOS POST ---*/

app.post('/editar', async function (req, res) {
    let { id, descricao, dia, hora, tipo, valor, categoria } = req.body
    const dados = {
        alerta: '',
        descricao,
        valor,
        tipo,
        categoria,
        dia,
        hora
    }

    console.log(`---> ${req.body.descricao}`)

    let sql = 'UPDATE lancamentos set valor=?, descricao=?, tipo=?, categoria=?, dia=?, hora=? WHERE id=?';
    let valores = [valor, descricao, tipo, categoria, dia, hora, id]

    try {
        if (!descricao) throw new Error('Título inválido!')
        if (!categoria) throw new Error('Categoria inválida!')
        if (!valor) throw new Error('Valor inválido!')
        await query(sql, valores)
        dados.alerta = 'Transação atualizada com sucesso!'
        dados.cor = "#33cc95"
    } catch (e) {
        dados.alerta = e.message
        dados.cor = 'red'
    }
    res.render('editar', dados)
})

app.post('/contato', async function (req, res) {
    let mensagem = req.body.mensagem
    let email = req.body.email
    let nome = req.body.nome

    const dadosPagina = {
        mensagem,
        email,
        nome
    }

    const sql = "INSERT INTO contatos (email, nome, mensagem) VALUES (?,?,?);"
    const valores = [email, nome, mensagem]

    await query(sql, valores)
    res.render('contato', dadosPagina)
    res.redirect('/contato')
})

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

var usuario_id

app.post('/login', async function (req, res) {
    let pss
    const {email, senha, keep_logged } = req.body;
    const sql = "SELECT * FROM users WHERE email= ? AND senha=?"
    const itens = [email, senha]
    const resultado = await query(sql, itens)
    console.log(resultado);
    usuario_id = resultado[0].email 
 
    if (resultado.length > 0) {
        if (keep_logged) {
            const token = uuidv4()
            const isOk = await query("UPDATE users SET token = ? WHERE usuario_id = ?", [token, resultado[0].usuario_id]);
            console.log(resultado[0].usuario_id)
            console.log(usuario_id);
            res.cookie("token", token)
        }

        req.session.usuario = resultado[0]
        res.redirect("/")
        return
    }

    res.render("login", {
        tituloPagina: "Login",
        titulo: "Login",
        frase: "Utilize o formulário abaixo para realizar o login na aplicação.",
        mensagemErro: "Usuário/Senha inválidos!"
    })
})

/* --- LISTEN --- */

app.listen(PORT, function () {
    console.log(`Server is running at port ${PORT}`)
})  