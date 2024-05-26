const express = require('express');

const app = express();

app.get('/', (req,res) => {
    req.send('Test')
})

app.listen(3000)