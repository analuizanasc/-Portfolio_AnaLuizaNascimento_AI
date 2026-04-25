const express = require('express');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const path = require('path');

const userRoutes = require('./routes/userRoutes');
const recipeRoutes = require('./routes/recipeRoutes');

const app = express();
app.use(express.json());

const swaggerDoc = YAML.load(path.join(__dirname, '../docs/swagger.yaml'));
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDoc));

app.use('/', userRoutes);
app.use('/', recipeRoutes);

module.exports = app;
