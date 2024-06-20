const { error, table } = require('console');
const express = require('express');
const mysql = require('mysql2')
const path = require('path');
const bcrypt = require('bcrypt')
const session = require('express-session');
const multer = require('multer')
const methodOverride = require('method-override');
const { type } = require('os');
const PDFDocument = require('pdfkit')
const fs = require('fs')
const app = express();
const nodemailer = require('nodemailer');
const { hash } = require('crypto');
const { title } = require('process');
// const { layout } = require('pdfkit/js/page');
var flash = require('express-flash');

// Kredensial Login PhpMyAdmin
const connection = mysql.createConnection({
    host: '127.0.0.1',
    user: 'panini', 
    password: ' ',
    database: 'db_komRplRev' 
  });

// Test koneksi Ke Phpmyadmin
connection.connect((error) => {
    if(error){
        console.info('gagal terhubung ke dataase : ', error.stack)
    }
    console.log('koneksi berhasil :3')
})

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*'); // Mengizinkan semua domain
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
  });
  
const storage = multer.diskStorage({
    destination: function(req,file,cb){
        cb(null, './public/images/')
    },
    filename: function(req,file,cb){
        cb(null, file.originalname)
    }
})
const upload = multer({storage: storage});

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'view'));

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));

app.use(
    session({
        secret: 'panini',
        resave: false,
        saveUninitialized: true,
        cookie: {
            // secure: true,
            // httpOnly: true,
            maxAge: 60000 * 5
        }
    }
    )
)

app.use(flash())

app.get('/', (req,res) => {
    connection.query('select * from tb_mobil', (err,result) => {
        if(err){
            console.log('error')
        }
        res.render('index',{data : result,req:req.session.username})
    })
})
app.get('/login', (req,res)=> {
    var dataLogin = {
        title: 'Error',
        layout: 'layout/main-layout',
        message: req.flash('message')
    }
    res.render('contact', dataLogin)
    console.info('koneksikyu')
})

// autentikasi 
app.post('/auth', (req,res) => {
    const name = req.body.panini
    const password = req.body.paniniPassword

    let query = `SELECT * FROM tb_user WHERE username = ?`

    let param = [name]

    connection.query(query, param, async (error,result) => {
        if(error){
            console.log('error pada backend')
        }else if(result.length === 0){
            console.log('username tidak di temukan')
            req.flash('message',['error', 'Error','salah passwordnya'])
            console.log(result)
            res.redirect('/login')
        }else{

            // console.log('username di temukan')
            const user = result[0]

            const passText = String(password)
            const passTextCheck = String(user.password)
            // console.log(typeof user.password)
            // console.log(typeof password)
            let checkPassowrd = await bcrypt.compare(passText, passTextCheck)

            if(!checkPassowrd){
                console.info('Passowrd salah')
                console.log(` passowrd : ${password}`)
                console.log(` password user : ${user.password}`)
                req.flash('message',['error', 'Error','salah passwordnya'])
                res.redirect('/login')
            }else{
                console.log(req.sessionID)
                req.session.userID = user.user_id;
                req.session.username = user.username; 
                console.log(req.session.userID)
                console.log(req.session.username)
                if(user.role == 'admin'){
                    res.redirect('/dashDataMobil')
                }else{
                    res.redirect('/')
                }
                
            }
}})})

function checkSession(req, res, next) {
    if (req.session.userID) {
      next();
    } else {
      res.redirect('/login');
    }
  }

function checkAdmin(req,res,next){
    connection.query(`select * from tb_user where user_id = ${req.session.userID}`, (error,result) => {
        console.log(result)
        if(result[0].role == 'admin'){
            next()
        }else{
            res.redirect('/dash')
        }
    })
}
app.get('/hash',checkSession,checkAdmin, (req,res) => {
    res.render('test')
})

app.get('/book/:tb/:id', checkSession, (req,res)=>{
    let queryKu = `select * from ${req.params.tb} where id=${req.params.id}`
    connection.query(queryKu, (error,result)=>{
        if(error){
            return res.send(error)
        }
        res.render('book', {result: result,tb: req.params.tb})
        // idku = result[0]
    })
})
app.post('/bookP', checkSession,(req,res)=>{
    // const {nik, nama, kontak, waktu} = req.body
    
    const {nik,nama,kontak,gridRadios,Waktu,gridRadiosWaktu,iniID,table} = req.body
    
    connection.query(`select * from ${table} where id=${iniID}`, (error,result) => {
        console.log(result)
        function ambilTanggal(tgl, waktu) {
            const date = new Date(tgl);
            var pengembalian = new Date(date);
            if (waktu == 'minggu') {
                pengembalian.setDate(date.getDate() + 7);
            } else if (waktu == 'bulan') {
                pengembalian.setMonth(date.getMonth() + 1);
            } else if (waktu == 'hari') {
                pengembalian.setDate(date.getDate() + 1);
            }
            return pengembalian.toISOString().slice(0, 19).replace('T', ' ');
        }
        
        let abc = ambilTanggal(Waktu, gridRadiosWaktu);
        console.log(`Kembali: ${abc}}`);
        
        let waktuP = gridRadiosWaktu
        console.log(waktuP)
        
        
        let hargaTotalStr;
        if (waktuP == 'minggu') {
            hargaTotalStr = result[0].price * 7;
        } else if (waktuP == 'bulan') {
            hargaTotalStr = result[0].price * 30;
        } else if (waktuP == 'hari') {
            hargaTotalStr = result[0].price;
        }
        
        const insert = "INSERT INTO tb_pemesanan (user_id, \`contact/wa\`, nik, tanggal_pengambilan, tanggal_pengembalian,merek_kendaraan, nama_kendaraan, tipe_kendaraan, periode_sewa, total_harga) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);"

        const insertParams = [
            req.session.userID, kontak, nik, Waktu, abc,
            result[0].merek_kendaraan, result[0].nama_kendaraan, result[0].type,
            waktuP, hargaTotalStr
        ];

        connection.query(insert, insertParams, (error, result) => {
            if (error) {
                console.error(error);
                return res.status(500).send('Error adding booking');
            }
            res.redirect('/dash');
        });
        // if(waktuP == 'minggu'){
        //     var hargaTotalStr = result[0].price * 7
        //     let insertParams = [req.session.userID,kontak,nik,Waktu,abc,result[0].merek_kendaraan,result[0].nama_kendaraan,result[0].type,'minggu',hargaTotalStr]
        //     connection.query(insert,insertParams, (error,result) =>{
        //         if(error){
        //             console.log(error)
        //         }
        //         res.redirect('/')
        //     })
        //     console.log(insertParams)
        // }else if(waktuP == 'bulan'){
        //     var hargaTotalStr = result[0].price * 30.00
        //     let insertParams = [req.session.userID,kontak,nik,Waktu,abc,result[0].merek_kendaraan,result[0].nama_kendaraan,result[0].type,'bulan',hargaTotalStr]
        //     connection.query(insert,insertParams, (error,result) =>{
        //         if(error){
        //             console.log(error)
        //         }
        //         res.redirect('/')
        //     })
        // }else if(waktuP == 'hari'){
        //     var hargaTotalStr = result[0].price
        //     let insertParams = [req.session.userID,kontak,nik,Waktu,abc,result[0].merek_kendaraan,result[0].nama_kendaraan,result[0].type,'hari',hargaTotalStr]
        //     connection.query(insert,insertParams, (error,result) =>{
        //         if(error){
        //             console.log(error)
        //         }
        //         res.redirect('/')
        //     })
        // }
    })
    console.log(Waktu)

    // console.log(abc)
    // console.log(pengembalian)
    

    console.log(req.body)
})
app.get('/dash',checkSession, (req, res) => {
    let queryUser = `select * from tb_pemesanan where user_id = ${req.session.userID} `

    connection.query(queryUser, (error,result) => {
        res.render('dash', { username: req.session.username, result:result});
    })

  });

app.get('/testSes', checkSession, (req,res) => {
    console.log(req.session)
})

app.get('/regis', (req,res) => {
    res.render('regis')
})

app.post('/regisPost', async (req,res) => {
    const {username, password, email} = req.body

    let queryRegis = "INSERT INTO `tb_user` (`user_id`, `username`, `password`, `email`, `role`) VALUES (NULL,  ?, ?, ?, 'user'); "

    const hashPass = await bcrypt.hash(password,10)

    const paramS = [username,hashPass,email]

    console.log(username)
    console.log(password)
    console.log(email)
    console.log(hashPass)
    connection.query(queryRegis, paramS, (error,result) => {
        if(error){
            console.log('error njir')
            res.redirect('/regis')
        }
        res.redirect('/login')
    })
})

app.get('/okelah',checkSession,checkAdmin, (req,res) => {
    // console.log('test')
    // console.log(req.query.namaKendaraan)
    // console.log(req.query.merkKendaraan)
    // console.log(req.query.hargaKendaraan)
    // console.log(req.query.kursi)
    // console.log(req.query.engine)
    // const {namaKendaraan, merkKendaraan, hargaKendaraan, kursi, engine} = req.query

    // const harga = parseInt(hargaKendaraan)
    // const hargaFix = harga * 7
    // console.log(hargaFix)
    res.render('dion',{username : req.session.username})

    // const paramSS = [namaKendaraan, merkKendaraan, hargaFix, kursi, engine]
    // const paniniGans = [namaKendaraan,merkKendaraan,]
    // connection.query("INSERT INTO `tb_mobil` (`id`, `nama_kendaraan`, `merek_kendaraan`, `image`, `seats`, `price`, `price_estimate`, `engine`, `type`) VALUES (NULL, ?, ?, ?, ?, ?, ?, ?, ?);")
})

app.get('/okeh', (req,res) => {
    res.render('dionNih',{username : req.session.username})
})

app.get('/oke', (req,res) => {
    res.render('dionNihBos',{username : req.session.username})
})

function hashPassword(pw) {
    return new Promise((resolve, reject) => {
        bcrypt.hash(pw, 10, (err, hash) => {
            if (err) {
                reject('ada yang salah:', err);
            } else {
                resolve(hash);
            }
        });
    });
}

function generatePassword(length){
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result
}

function lupaPassword(email,pw){

    var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'muh.rezkyananda2004@gmail.com',
            pass: 'eest eyyc tlqt elpw'
        }
    });
    
    var mailOptions = {
        from: 'muh.rezkyananda2004@gmail.com',
        to: email,
        subject: `password kamu : ${pw}`,
        text: 'passowrd anda telah di reset silahkan masukan passowrd yang telah di berikan!'
    };
    
    transporter.sendMail(mailOptions, (err, info) => {
        if (err) throw err;
        console.log('Email sent: ' + info.response);
    });
}

app.get('/forgot', (req,res) => {
    res.render('lupa')
})

app.post('/lupakan', async (req,res) => {
    console.log(req.body)
    const genPw = generatePassword(8)
    console.log(genPw)
    const hashPw = await bcrypt.hash(genPw,10)

    console.log(hashPw)

    const queryLupa = `UPDATE \`tb_user\` SET \`password\` = ? WHERE \`tb_user\`.\`user_id\` = ?;` 
    console.log(queryLupa)

    connection.query('select * from tb_user', (error,result) => {
        if(error){
            console.log('ada yang salah :', error)
        }
        console.log(result)
        result.forEach((e) => {
            const paramLupa = [hashPw, e.user_id]
            if(e.email == req.body.mail){
                console.log(' ada benar nya juga')
                connection.query(queryLupa,paramLupa, (error,result) => {
                    // console.log()
                    if(error){
                        console.log(error)
                    }
                    lupaPassword(req.body.mail,genPw)  
                    res.redirect('/login')
                })
            }
        })
    })
})
app.get('/cetak/:id/:nm', (req, res) => {
    const { nm, id } = req.params;



    let cetakParam = [id,nm]
    connection.query("SELECT * FROM `tb_pemesanan` WHERE `user_id` = ? AND `nama_kendaraan` LIKE ?", cetakParam, (error, result) => {
        console.log(result)
        if(error){
            console.log('ada error dari data nya ',error)
        }
        const doc = new PDFDocument();

        res.setHeader('Content-Disposition', 'attachment; filename="example.pdf"');
        res.setHeader('Content-Type', 'application/pdf')
    
        doc.pipe(res);

        console.log(result[0])

        let y = 100
        doc.fontSize(16).text(`Kendari rental`, 100, y)
        y+= 20
        doc.fontSize(16).text(`==================`, 100, y)
        y+= 40
        doc.fontSize(16).text(`Nama         : ${req.session.username}`, 100, y)
        y+= 40
        doc.fontSize(16).text(`Kendaraan    : ${result[0].nama_kendaraan}`, 100, y)
        y+= 40
        doc.fontSize(16).text(`Periode      : ${result[0].periode_sewa}`, 100, y)
        y+= 40
        doc.fontSize(16).text(`Tanggal sewa  : ${result[0].tanggal_pengambilan}`, 100, y)
        y+= 40
        doc.fontSize(16).text(`Tanggal kebali  : ${result[0].tanggal_pengembalian}`, 100, y)
        y+= 40
        doc.fontSize(16).text(`Total harga  : ${result[0].total_harga}000`, 100, y)
        y+= 40
        doc.fontSize(16).text(`Silahkan bayar di kasir saat pengambilan mobil `, 100, y)
        y+= 40
        doc.fontSize(16).text(`=================== `, 100, y)
    
        doc.end();
    })
    res
});


app.post('/paniniGantengA',upload.single('paniniKeceAbiez'), (req,res) => {
    const {namaKendaraan, merkKendaraan, hargaKendaraan, kursi, engine, Transmisi,} = req.body

    console.log(req.body)
    console.log(req.file)

    const ext = req.file['mimetype'].split('/')[1]
    const gambar = req.file['filename']
    const harga = parseInt(hargaKendaraan)

    let hargaFix = harga * 7
    hargaFix = String(hargaFix)

    const paniniGans = [namaKendaraan,merkKendaraan,gambar,hargaKendaraan,hargaFix,engine,Transmisi]

    console.log(paniniGans)

    let queryKu = "INSERT INTO `tb_motor` (`id`, `nama_kendaraan`, `merek_kendaraan`, `image`, `price`, `price_estimate`, `engine`, `type`) VALUES (NULL, ?, ?, ?, ?, ?, ?, ?);"

    connection.query(queryKu,paniniGans,(error,result) => {
        if(error){
            res.write('not ok')
        }
        res.redirect('/dashDataMobil')
    })
})

app.post('/paniniGantengB',upload.single('paniniKeceAbiez'), (req,res) => {
    const {namaKendaraan, merkKendaraan, hargaKendaraan, kursi, engine, Transmisi,} = req.body

    console.log(req.body)
    console.log(req.file)

    const ext = req.file['mimetype'].split('/')[1]
    const gambar = req.file['filename']
    const harga = parseInt(hargaKendaraan)

    let hargaFix = harga * 7
    hargaFix = String(hargaFix)

    const paniniGans = [namaKendaraan,merkKendaraan,gambar,hargaKendaraan,hargaFix,engine,Transmisi]

    console.log(paniniGans)

    let queryKu = "INSERT INTO `tb_sepeda` (`id`, `nama_kendaraan`, `merek_kendaraan`, `image`, `price`, `price_estimate`, `battery_life`, `type`) VALUES (NULL, ?, ?, ?, ?, ?, ?, ?);"

    connection.query(queryKu,paniniGans,(error,result) => {
        if(error){
            res.write('not ok')
        }
        res.redirect('/dashDataMobil')
    })
})
app.get('/edit/:table/:id', (req,res) => {
    res.render('edit', {id:req.params.id,table:req.params.table})
})
app.put('/editA',upload.single('paniniKeceAbiez'), (req,res) => {
    const {namaKendaraan, merkKendaraan, hargaKendaraan, kursi, engine, Transmisi,id,table} = req.body

    console.log(id)
    console.log(req.body)
    console.log(req.file)

    const ext = req.file['mimetype'].split('/')[1]
    const gambar = req.file['filename']
    const harga = parseInt(hargaKendaraan)

    let hargaFix = harga * 7
    hargaFix = String(hargaFix)

    if(table == 'tb_mobil'){        
        const paniniGans = [namaKendaraan,merkKendaraan,gambar,kursi,hargaKendaraan,hargaFix,engine,Transmisi,id]

        let queryKu = `
        UPDATE \`tb_mobil\`
        SET \`nama_kendaraan\` = ?, \`merek_kendaraan\` = ?, \`image\` = ?, \`seats\` = ?, \`price\` = ?, \`price_estimate\` = ?, \`engine\` = ?, \`type\` = ?
        WHERE \`id\` = ?;
        `

        connection.query(queryKu,paniniGans,(error,result) => {
            if(error){
                res.write('not ok')
            }
            res.redirect('/dashDataMobil')
        })
    }else if(table == 'tb_motor'){
        const paramMotor = [namaKendaraan,merkKendaraan,gambar,hargaKendaraan,hargaFix,engine,Transmisi,id]

        let queryMotor = `
        UPDATE \`tb_motor\` SET \`nama_kendaraan\` = ?, \`merek_kendaraan\` = ?, \`image\` = ?, \`price\` = ?, \`price_estimate\` = ?, \`engine\` = ?, \`type\` = ? WHERE \`tb_motor\`.\`id\` = ?;
        `

        connection.query(queryMotor,paramMotor, (error,result) => {
            if(error){
                console.log('error njir bruh')
            }
            res.redirect('/')
        })
    }else if(table == 'tb_sepeda'){
        let paramSepeda = [namaKendaraan,merkKendaraan,gambar,hargaKendaraan,hargaFix,engine,Transmisi,id]

        let querySepeda =`
        UPDATE \`tb_sepeda\` SET \`nama_kendaraan\` = ?, \`merek_kendaraan\` = ?, \`image\` = ?, \`price\` = ?, \`price_estimate\` = ?, \`battery_life\` = ?, \`type\` = ? WHERE \`tb_sepeda\`.\`id\` = ?; 
        `
        connection.query(querySepeda,paramSepeda, (error,result) => {
            if(error){
                console.log('error njir bruh',error)
            }
            res.redirect('/')
        })
    }

})
app.post('/paniniGanteng',upload.single('paniniKeceAbiez'), (req,res) => {
        const {namaKendaraan, merkKendaraan, hargaKendaraan, kursi, engine, Transmisi,} = req.body

        console.log(req.body)
        console.log(req.file)

        const ext = req.file['mimetype'].split('/')[1]
        const gambar = req.file['filename']
        const harga = parseInt(hargaKendaraan)

        let hargaFix = harga * 7
        let kursiFix = parseInt(kursi)
        hargaFix = String(hargaFix)

        const paniniGans = [namaKendaraan,merkKendaraan,gambar,kursiFix,hargaKendaraan,hargaFix,engine,Transmisi]

        console.log(paniniGans)

        let queryKu = "INSERT INTO `tb_mobil` (`id`, `nama_kendaraan`, `merek_kendaraan`, `image`, `seats`, `price`, `price_estimate`, `engine`, `type`) VALUES (NULL, ?, ?, ?, ?, ?, ?, ?, ?);"

        connection.query(queryKu,paniniGans,(error,result) => {
            if(error){
                res.write('not ok')
            }
            res.redirect('/dashDataMobil')
        })
    })
app.get('/dashAdmin',(req,res)=>{
    res.render('dashAdmin')
})

app.get('/hapusData/:data/:id', (req,res)=> {
    let queryDel = `delete from ${req.params.data} where id = ${req.params.id}`
    connection.query(queryDel, (error,result) => {
        if(error){
            console.log('error')
        }
        console.log('berhasil')
        console.log(req.params.data)
        console.log(req.params.id)
        res.redirect('/dashDataMobil')
    })
})

app.get('/hapusDataUser/:data/:id', (req,res)=> {
    let queryDel = `delete from ${req.params.data} where user_id = ${req.params.id}`
    let queryDelTo = `delete from tb_pemesanan where user_id = ${req.params.id}`
    connection.query(queryDelTo, (error,result) => {
        if(error){
            console.log('error')
        }
        connection.query(queryDel, (error,result) => {
            if(error){
                console.log('error')
            }
            console.log('berhasil')
            console.log(req.params.data)
            console.log(req.params.id)
            res.redirect('/dashDataMobil')
        })
    })
})

app.put('/role/:id', (req,res)=> {
     connection.query(`select * from tb_user where user_id = ${req.params.id}`, (error,result) => {
        if(error){
            console.log('ada yang error bang',error)
        }
        console.log(result)

        if(result[0].role == 'user'){
            console.log('anda itu user')

            let queryAdmin = `UPDATE \`tb_user\` SET \`role\` = 'admin' WHERE \`tb_user\`.\`user_id\` = ?; `

            connection.query(queryAdmin,req.params.id, (error,result) => {
                if(error){
                    console.log('ada error',error)
                }
                res.redirect('/dashUser')
            })
        }else if(result[0].role == 'admin'){
            let queryUser = `
            UPDATE \`tb_user\` SET \`role\` = 'user' WHERE \`tb_user\`.\`user_id\` = ?; 
            `
            connection.query(queryUser,req.params.id, (error,result) => {
                if(error){
                    console.log('ada error')
                }
                res.redirect('/dashUser')
            })
            console.log('anda adalah admin')
        }
     })
})

app.get('/dashDataMobil', checkSession ,(req,res)=>{
    connection.query("select * from tb_mobil", (error,result) => {
        if(error){
            res.send('error')   
        }
        const pnni = 'tb_mobil'
        res.render('tambahData', {data: result, username: req.session.username, pnni: pnni})
    })
})
app.get('/dashDataMotor',checkSession ,(req,res)=>{
    connection.query("select * from tb_motor", (error,result) => {
        if(error){
            res.send('error')   
        }
        const pnni = 'tb_motor'
        res.render('tambahData', {data: result,username: req.session.username, pnni: pnni})
    })
})
app.get('/dashDataSepeda',checkSession ,(req,res)=>{
    connection.query("select * from tb_sepeda", (error,result) => {
        if(error){
            res.send('error')   
        }
        const pnni = 'tb_sepeda'
        res.render('tambahData', {data: result,username: req.session.username, pnni: pnni}) 
    })
})
app.get('/dashUser',checkSession ,(req,res)=>{
    connection.query("select * from tb_user", (error,result) => {
        if(error){
            res.send('error')   
        }
        const pnni = 'tb_user'
        res.render('user', {data: result,username: req.session.username, pnni: pnni}) 
    })
})

app.get('/book/:tb/:id', (req,res)=>{
    res.render('book')
})

app.get('/logout', (req,res) => {
    req.session.destroy((err)=>{
        if(err){
            console.log(err)
        }
        res.redirect('/login')
    })
})

app.get('/:kendaraaan', (req,res)=>{
    var type = req.params.kendaraaan

    connection.query('select merek_kendaraan from tb_mobil', (error,result) => {
        let i = result.merek_kendaraan

        console.log(i)
    })
    // res.render('gallery')
    if(type == 'mobil'){
        connection.query('select * from tb_mobil', (error, result) => {
            let paniniHebat = 'tb_mobil'
            res.render('gallery', {data : result,table:paniniHebat})
        })
    }else if(type == 'motor'){
        connection.query('select * from tb_motor', (error, result) => {
            let paniniHebat = 'tb_motor'
            res.render('gallery', {data : result,table:paniniHebat})
        })
    }else if(type == 'sepeda'){
        connection.query('select * from tb_sepeda', (error, result) => {
            let paniniHebat = 'tb_sepeda'
            res.render('gallery', {data : result,table:paniniHebat})
        })
    }
})

app.post('/dataBerdasarkan', (req,res) => {
    console.log(req.body)
    const queryGallery = `SELECT * FROM \`${req.body.table}\` WHERE \`merek_kendaraan\` LIKE '${req.body.merek}' `
    console.log(queryGallery)
    connection.query(queryGallery, (error,result) => {
        console.log(result)
        res.render('gallery',{data:result, table:req.body.table})
    })
})


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