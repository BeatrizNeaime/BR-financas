create database brfinancas;
use brfinancas;

create table lancamentos(
	id int not null auto_increment,
    descricao varchar(100),
    valor decimal not null,
    tipo int,
    categoria varchar(100),
    dia date,
    hora time,
    PRIMARY KEY(id)
);

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

select * from contatos;

alter table lancamentos CHANGE dia dia varchar(50);
alter table lancamentos CHANGE hora hora varchar(6);
alter table lancamentos CHANGE valor valor decimal;
