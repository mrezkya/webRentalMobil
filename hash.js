const bcrypt = require('bcrypt')

const passwordToHash = 'nQiBQ0Ex';
bcrypt.hash(passwordToHash, 10, (err, hash) => {
  if (err) {
    console.error('Error hashing password:', err);
  } else {
    console.log('Hash:', hash);
  }
});


// function ambilTanggal(tgl,waktu){
//   const date = new Date(tgl)
//   const pengembalian = new Date(date)
//   if(waktu == 'minggu'){
//     pengembalian.setDate(date.getDate() + 7)
//     console.log(pengembalian)
//   }else if(waktu == 'bulan'){
//     pengembalian.setMonth(date.getMonth() + 1)
//     console.log(pengembalian)
//   }else if(waktu == 'hari'){
//     pengembalian.setDate(date.getDate() + 1)
//     console.log(pengembalian)
//   }
// }

// ambilTanggal('2024-06-26','hari')

// var nodemailer = require('nodemailer');

// var transporter = nodemailer.createTransport({
//     service: 'gmail',
//     auth: {
//         user: 'muh.rezkyananda2004@gmail.com',
//         pass: 'eest eyyc tlqt elpw'
//     }
// });

// var mailOptions = {
//     from: 'muh.rezkyananda2004@gmail.com',
//     to: 'mrezkya@hotmail.com',
//     subject: 'Sending Email using Nodejs',
//     text: 'That was easy!'
// };

// transporter.sendMail(mailOptions, (err, info) => {
//     if (err) throw err;
//     console.log('Email sent: ' + info.response);
// });