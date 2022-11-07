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

create table devs(
	nome varchar(100),
    telefone varchar(10)
);

insert into lancamentos(id,descricao, valor, tipo, categoria, dia, hora) value (1, "Arte de Caderno", '400,00', 1, "Dev", "05/06/2022", '22:16');
insert into lancamentos(descricao, valor, tipo, categoria, dia, hora) value ("Bolo", '-20,00', 1, "Dev", "05/06/2022", '22:00');

select * from lancamentos;

alter table lancamentos CHANGE dia dia varchar(50);
alter table lancamentos CHANGE hora hora varchar(6);
alter table lancamentos CHANGE valor valor varchar(100);
