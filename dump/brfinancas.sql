create database brfinancas;
use brfinancas;

create table lancamentos(
	id int not null auto_increment,
    usuario int not null,
    descricao varchar(100),
    valor decimal not null,
    tipo int,
    categoria varchar(100),
    dia varchar(100),
    hora varchar(100),
    PRIMARY KEY(id),
    foreign key(usuario) references users(id)
);

show tables;
select * from users;

create table contatos(
	id int not null auto_increment,
    email varchar(200),
    nome varchar(100),
    mensagem varchar(1000),
    PRIMARY KEY(id)
);

insert into lancamentos(id,descricao, valor, tipo, categoria, dia, hora) value (1, "Arte de Caderno", 400.00, 1, "Dev", "05/06/2022", '22:16');
insert into lancamentos(descricao, valor, tipo, categoria, dia, hora) value ("Bolo", 20.00, 1, "Dev", "05/06/2022", '22:00');
insert into lancamentos(descricao, valor, tipo, categoria, dia, hora) value ("Figurinha", -500.00, 0, "Lazer", "05/06/2022", '22:00');

insert into contatos(email, nome, mensagem) value ("teste@teste.com", "Bea", "testando 123...");

CREATE TABLE users(
	id INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR (100) NOT NULL,
    email VARCHAR (100) NOT NULL,
    senha INTEGER NOT NULL
);
alter table lancamentos add email varchar(100) after id;
alter table lancamentos add constraint email foreign key(email) references users(email);