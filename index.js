const express = require('express');
const mysql = require('mysql2')

// // Kredensial Login PhpMyAdmin

const connection = mysql.createConnection({
    host: '127.0.0.1',
    user: 'panini', 
    password: ' ',
    database: 'db_rpl' 
  });

// Test koneksi Ke Phpmyadmin
connection.connect((error) => {
    if(error){
        console.info('gagal terhubung ke dataase : ', error.stack)
    }
    console.log('koneksi berhasil :3')
})


const app = express();

app.get('/dataMobil', (req,res) => {
    connection.query('select * from tb_mobil', (error,result) => {
        if(error){
            console.info('gagal Mengambil data')
        }
        res.json(result)
    })
})

app.get('/dataMotor', (req,res) => {
    connection.query('select * from tb_motor', (error,result) => {
        if(error){
            console.info('gagal Mengambil data')
        }
        res.json(result)
    })
})

app.get('/dataSepeda', (req,res) => {
    connection.query('select * from tb_sepeda   ', (error,result) => {
        if(error){
            console.info('gagal Mengambil data')
        }
        res.json(result)
    })
})
app.listen(3000)