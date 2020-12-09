const express = require('express')
const app = express();
const rank = require('./api/rank')

app.get('/', (req, res) => {
    rank(req, res)
})

app.listen(3000, () => console.log(`Server started on port 3000`))