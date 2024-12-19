const YAML = require('yaml');
const fs = require('fs')
const swaggerUi = require('swagger-ui-express');
const file =fs.readFileSync('./services/swagger/swagger.yaml','utf-8');
const swaggerDocument = YAML.parse(file);



module.exports =  {swaggerUi,swaggerDocument}