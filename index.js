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
    if (!req.session.usuario) {
        res.redirect("/login")
    } else {
        const listaLancamentos = await query('SELECT * FROM lancamentos WHERE usuario = ?', [req.session.usuario.id])
        let entradas = 0, saidas = 0, total = 0
        for (let i = 0; i < listaLancamentos.length; i++) {
            if (parseFloat(listaLancamentos[i].tipo) == 1) {
                entradas += parseFloat(listaLancamentos[i].valor)
            } else if (parseFloat(listaLancamentos[i].tipo) == 0) {
                saidas += parseFloat(listaLancamentos[i].valor)
            }
        }

        let helper
        total = entradas - saidas
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
            helper: helper,
            userid: req.session.usuario.id
        })
    }
})

app.get('/login', function (req, res) {
    res.render('login', {
        titulo: "Faça login em sua conta"
    })
})

app.get('/sobre', function (req, res) {
    if (!req.session.usuario) {
        res.redirect("/login")
    } else {
        res.render('sobre')
    }
})

app.get('/contato', async function (req, res) {
    if (!req.session.usuario) {
        res.redirect("/login")
    } else {
        const contatos = await query('SELECT * FROM contatos')

        res.render('contato', {
            contatos
        })
    }
})

app.get("/delete/produto/:id", async function (req, res) {
    if (!req.session.usuario) {
        res.redirect("/login")
    } else {
        const id = parseInt(req.params.id)
        if (!isNaN(id) && id > 0) {
            await query("DELETE FROM lancamentos WHERE id=?", [id])
        }

        res.redirect("/")
    }
})

app.get('/editar/:id', async function (req, res) {
    if (!req.session.usuario) {
        res.redirect("/login")
    } else {
        const id = parseInt(req.params.id)
        const dadosItem = await query("SELECT * FROM lancamentos WHERE id=? AND usuario = ? ", [id, req.session.usuario.id])
        if (dadosItem.length === 0) {
            res.redirect('/')
        }

        res.render('editar', {
            descricao: dadosItem[0].descricao,
            dia: dadosItem[0].dia,
            hora: dadosItem[0].hora,
            tipo: dadosItem[0].tipo,
            valor: dadosItem[0].valor,
            categoria: dadosItem[0].categoria,
            id: dadosItem[0].id
        })
    }
})

app.get('/adicionar', function (req, res) {
    if (!req.session.usuario) {
        res.redirect("/login")
    } else {
        res.render('adicionar')
    }

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

app.get('/editar-perfil', async function (req, res) {
    if (!req.session.usuario) {
        res.redirect("/login")
    } else {
        const id = req.session.usuario.id
        const r = await query('SELECT * FROM users WHERE id = ?', id)
        res.render('editar-perfil', {
            nome: r[0].nome,
            email: r[0].email,
            senha: r[0].senha
        })
    }
})

/* --- MÉTODOS POST ---*/
app.post('/editar', async function (req, res) {
    const id = parseInt(req.query.id)
    const { descricao, dia, hora, valor, categoria } = req.body
    console.log(id)
    let tipo = req.body.tipo ? 0 : 1
    const dados = {
        alerta: '',
        descricao,
        valor,
        tipo,
        categoria,
        dia,
        hora
    }
    try {
        if (!descricao) throw new Error("Título inválido!")
        if (!categoria) throw new Error('Categoria inválida!')
        if (!valor) throw new Error('Valor inválido!')
        let valores = [valor, descricao, tipo, categoria, dia, hora, id]
        //await query("UPDATE brfinancas.lancamentos SET valor = ?, descricao = ?, tipo = ?, categoria = ?, dia = ?, hora = ? WHERE (id = ?)", valores)
        //res.redirect('/')
    } catch (e) {
        dados.alerta = e.message
        console.log(e.message)
        res.render('editar', dados)
    }
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
    let nome = req.session.usuario.id
    let descricao = req.body.titulo
    let dia = req.body.dia
    let hora = req.body.hora
    let valor = req.body.valor
    let tipo = req.body.tipo ? 0 : 1
    let categoria = req.body.categoria

    const dadosPagina = {
        descricao,
        valor,
        tipo,
        categoria,
        dia,
        hora,
    }

    const sql = "INSERT INTO lancamentos (usuario, descricao, valor, tipo, categoria, dia, hora) VALUES (?,?,?,?,?,?,?);"
    const valores = [nome, descricao, valor, tipo, categoria, dia, hora]

    await query(sql, valores)

    dadosPagina.mensagem = "Produto cadastrado com sucesso"

    res.render('adicionar', dadosPagina)
    res.redirect('/')
})

var usuario_id

app.post('/login', async function (req, res) {
    const { email, senha, keep_logged } = req.body;
    const sql = "SELECT * FROM users WHERE email= ? AND senha=?"
    const itens = [email, senha]
    const resultado = await query(sql, itens)

    if (resultado.length > 0) {
        usuario_id = resultado[0].id
        if (keep_logged) {
            const token = uuidv4()
            await query("UPDATE users SET token = ? WHERE id = ?", [token, resultado[0].id]);

            res.cookie("token", token)
        }
        req.session.usuario = resultado[0]
        res.redirect("/")
        return
    } else {
        res.render("login", {
            tituloPagina: "Login",
            titulo: "Login",
            frase: "Utilize o formulário abaixo para realizar o login na aplicação.",
            mensagemErro: "Usuário/Senha incorretos!"
        })
    }
})

app.post('/cadastro', async function (req, res) {
    const { nome, email, senha } = req.body
    dados = {
        nome,
        email,
        senha,
        alerta: ''
    }
    try {

        if (!nome) throw new Error('Nome é obrigatório!')
        if (!email) throw new Error('E-mail é obrigatório!')
        if (!senha) throw new Error('Senha é obrigatória!')
        await query('INSERT INTO users(nome, email, senha) VALUES (?,?,?)', [nome, email, senha])
        res.render('login', {
            titulo: "Faça login em sua conta",
            msg: "Conta criada com sucesso!"
        })
    } catch (e) {
        dados.alerta = e.message
    }
})

app.post('/editar-perfil', async function (req, res) {
    const { nome, email, senha } = req.body
    let tipo
    dados = {
        nome,
        email,
        senha,
        alerta: '',
        tipo
    }
    try {

        if (!nome) throw new Error('Nome é obrigatório!')
        if (!email) throw new Error('E-mail é obrigatório!')
        if (!senha) throw new Error('Senha é obrigatória!')
        await query('UPDATE users set nome=?, email=?, senha=? WHERE id = ?', [nome, email, senha, req.session.usuario.id])

        const t = await query('SELECT * FROM users WHERE id = ?', [req.session.usuario.id])
        res.render('editar-perfil', {
            nome: t[0].nome,
            email: t[0].email,
            senha: t[0].senha,
            alerta: "Perfil atualizado com sucesso!",
            tipo: 1
        })
    } catch (e) {
        dados.alerta = e.message
        dados.tipo = 0
        res.render('editar-perfil', {
            dados
        })
    }
})

/* --- LISTEN --- */

app.listen(PORT, function () {
    console.log(`Server is running at port ${PORT}`)
})  